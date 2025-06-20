// const API_BASE_URL = 'https://bytego-backend.onrender.com';


(async function validateAuthTokens() {
  const accessToken = localStorage.getItem('authToken');
  const refreshToken = localStorage.getItem('refreshToken');

  // If either token is missing → redirect to login
  if (!accessToken || !refreshToken) {
    window.location.href = '../account/login/login.html';
    return;
  }

  // Try to verify the access token by calling a protected API
  const res = await fetch(`${window.API_BASE_URL}/api/some-protected-route`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // If access token is expired or invalid
  if (res.status === 401 || res.status === 403) {
    try {
      // Attempt refresh
      const refreshRes = await fetch(`${window.API_BASE_URL}/api/refreshToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!refreshRes.ok) throw new Error();

      const data = await refreshRes.json();
      localStorage.setItem('authToken', data.accessToken);
    } catch (err) {
      // Refresh failed → redirect to login
      window.location.href = '../account/login/login.html';
    }
  }
})();

loadOrders();

async function loadOrders() {
  const token = localStorage.getItem('authToken');

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/orders/staff`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();

    const pendingTable = document.getElementById("remaining_order_table");
    const completedTable = document.getElementById("Completed_order_table");

    // Reset table headers
    pendingTable.innerHTML = `
      <tr><th>User ID</th><th>Order ID</th><th>Confirm</th></tr>
    `;
    completedTable.innerHTML = `
      <tr><th>User ID</th><th>Order ID</th><th>Receive Time</th></tr>
    `;

    let pendingExists = false;
    let receivedExists = false;

    orders.forEach(order => {
      const customId = order.userId;

      if (order.status === 'pending') {
        pendingExists = true;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${customId}</td>
          <td>${order.orderId}</td>
          <td><button>Select</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => {
          document.querySelector('.order_id').value = order.orderId;
          document.querySelector('.confirmation_code').value = order.confirmationCode;
        });
        pendingTable.appendChild(tr);
      }

      if (order.status === 'received') {
        receivedExists = true;
        const tr = document.createElement('tr');
        const time = new Date(order.receivedAt).toLocaleTimeString('en-IN');
        tr.innerHTML = `
          <td>${customId}</td>
          <td>${order.orderId}</td>
          <td>${time}</td>
        `;
        completedTable.appendChild(tr);
      }
    });

    // Show or hide sections
    document.getElementById("pending_order_show").style.display = pendingExists ? 'block' : 'none';
    document.getElementById("received_order_show").style.display = receivedExists ? 'block' : 'none';

  } catch (err) {
    console.error('Error loading orders:', err);
    alert('Failed to load orders');
  }
}


document.querySelector('.input_button button').addEventListener('click', async () => {
  const orderId = document.querySelector('.order_id').value.trim();
  const confirmationCode = document.querySelector('.confirmation_code').value.trim();
  const token = localStorage.getItem('authToken');

  if (!orderId || !confirmationCode) {
    alert('Please fill both fields.');
    return;
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/orders/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, confirmationCode })
    });

    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message);
    }

    const order = await res.json();
    console.log(order);

    showTicket(order);
    loadOrders(); // Optional: reload order tables

  } catch (err) {
    alert(err.message || 'Something went wrong');
  }
});




function showTicket(order) {
  const popup = document.querySelector('.tickit_popup');
  const ticket = popup.querySelector('.ticket');

  // Fill content
  ticket.querySelector('.user_info').innerHTML = `
    <p>User ID : ${order.userId}</p>
    <p>Date : ${new Date(order.receivedAt).toLocaleString('en-IN')}</p>
  `;
  ticket.querySelector('.order_info').innerHTML = `
    <p>Order Id : ${order.orderId}</p>
    <p>Confirmation Code : ${order.confirmationCode}</p>
  `;
  ticket.querySelector('.qr_box img').src = order.qrCodeUrl;

  const itemRows = order.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.price}</td>
      <td>${item.quantity}</td>
      <td>${item.amount}</td>
    </tr>
  `).join('');
  ticket.querySelector('.order_details table').innerHTML = `
    <tr><th>Item</th><th>Price</th><th>Qty.</th><th>Amount</th></tr>
    ${itemRows}
  `;

  const totalQty = order.items.reduce((acc, i) => acc + i.quantity, 0);
  const subTotal = order.items.reduce((acc, i) => acc + i.amount, 0);
  const gst = (subTotal * 0.025).toFixed(2);
  const grandTotal = Math.round(subTotal + 2 * gst);

  ticket.querySelector('.sub_total table').innerHTML = `
    <tr><td>Total Qty : ${totalQty}</td><td>Sub Total : ${subTotal.toFixed(2)}</td></tr>
    <tr><td>CGST 2.5%</td><td>${gst}</td></tr>
    <tr><td>SGST 2.5%</td><td>${gst}</td></tr>
  `;

  ticket.querySelector('.grand_total table').innerHTML = `
    <tr><td>Round off</td><td>+${(grandTotal - (subTotal + 2 * gst)).toFixed(2)}</td></tr>
    <tr><td>Grand Total</td><td>₹${grandTotal}</td></tr>
  `;

  popup.style.display = 'flex'; // SHOW
}

// Done button hides popup
document.getElementById('tickit_close').addEventListener('click', () => {
  document.querySelector('.tickit_popup').style.display = 'none';
});


// camera starts here ___________________________________________

let qrReader;
let qrScannerStarted = false;

document.querySelector('.camera_on').addEventListener('click', async () => {
  if (qrScannerStarted) return;

  const qrRegion = document.getElementById('qr-reader');
  qrReader = new Html5Qrcode("qr-reader");
  qrScannerStarted = true;

  try {
    await qrReader.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async qrCodeMessage => {
        console.log("QR Code Scanned:", qrCodeMessage);
        try {

          const data = JSON.parse(qrCodeMessage);
          console.log("Parsed QR Data:", data); // ✅ Show parsed JSON if applicable

          const orderId = data.orderId;
          const confirmationCode = data.confirmationCode;

          // Autofill inputs if you want
          document.querySelector('.order_id').value = orderId;
          document.querySelector('.confirmation_code').value = confirmationCode;

          // Stop QR Scanner
          await qrReader.stop();
          qrReader.clear();
          qrReader = null;
          qrScannerStarted = false;
          qrRegion.innerHTML = "";

          // Confirm the order
          const token = localStorage.getItem('authToken');
          const res = await fetch(`${window.API_BASE_URL}/api/orders/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId, confirmationCode })
          });

          if (!res.ok) {
            const { message } = await res.json();
            throw new Error(message);
          }

          const order = await res.json();
          showTicket(order);   // ✅ Your ticket popup function
          loadOrders();        // 🔄 Refresh table if needed

        } catch (err) {
          console.error("QR processing error:", err);
          alert("Invalid QR code or failed to confirm order.");
        }
      },
      err => {
        // silently ignore scan errors
      }
    );
  } catch (err) {
    console.error("Failed to start QR scanner:", err);
    alert("Camera access failed.");
  }
});

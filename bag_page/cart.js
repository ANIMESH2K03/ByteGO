// const API_BASE_URL = 'https://bytego-backend.onrender.com';


/* ________________________________________menu button js animation starts here */


const menuLabel = document.getElementById('menu-label');

menuLabel.addEventListener('mouseenter', () => {
  menuLabel.classList.add('animate');
});

menuLabel.addEventListener('mouseleave', () => {
  menuLabel.classList.remove('animate');
  void menuLabel.offsetWidth; // force reflow for reset
});


/* ________________________________________menu button js animation ends here */


function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("dimOverlay").style.display = "block"; // Show overlay
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("dimOverlay").style.display = "none"; // Hide overlay
}



// main cart item fetch from here __________________________________________________________________________________





// cart.js (frontend)

async function getCartItems() {
  try {
    const token = localStorage.getItem('authToken'); // Assuming the token is stored in localStorage

    if (!token) {
      throw new Error("No token found, please log in.");
    }

    const response = await fetch(`${window.API_BASE_URL}/api/cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Attach the token in Authorization header
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 401) {  // If token is expired or invalid
      const refreshToken = localStorage.getItem('refreshToken'); // Get the refresh token

      if (refreshToken) {
        // Try refreshing the token
        const refreshResponse = await fetch('/api/refreshToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          localStorage.setItem('authToken', accessToken); // Store the new access token
          // Retry the original request with the new access token
          return getCartItems(); // Recursive call to retry the fetch with the new access token
        } else {
          throw new Error("Failed to refresh token, please log in again.");
        }
      } else {
        throw new Error("No refresh token found, please log in.");
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch cart items.");
    }

    const responseText = await response.text(); // Read the response as text first


    if (responseText.trim() === "") {
      return []; // If response is empty, return empty array
    }

    const cartItems = JSON.parse(responseText); // Parse the response as JSON
    return cartItems;

  } catch (error) {
    console.error("Error fetching cart items:", error);
    alert(error.message); // Display an alert or handle the error in the UI

    // Redirect to login page if there's an error related to token expiration
    if (error.message.includes("please log in")) {
      window.location.href = "../accounts/login/login.html"; // Redirect to login page
    }
  }
}



async function displayCartItems() {
  const cartItems = await getCartItems();

  const parentCartContainer = document.querySelector('.parent_cart_container');
  const cartDisplayItem = document.querySelector(".X_child_cart_container");
  const totalPriceDetails = document.querySelector("#total_item_price");

  if (!cartItems || cartItems.length === 0) {
    parentCartContainer.innerHTML = `
      <div class="video_cart">
        <video class="emptyCartVideo" src="../pictures/svg/empty_cart.mp4" autoplay loop muted></video>
      </div>`;

    totalPriceDetails.innerText = "₹0";    // ---------------

    return;
  }

  let x_innerHtml = '';
  let priceDetailsinnerHTML = '';

  cartDisplayItem.innerHTML = ''; // Clear previous content

  cartItems.forEach(item => {
    // Determine product type based on veg property
    const productType = item.itemId.itemDescription.veg ? 'Veg' : 'Non-Veg';
    const productColor = item.itemId.itemDescription.veg ? '#4caf50' : '#C92126'; // Green for Veg, Red for Non-Veg

    // Calculate price for the item (Price * Quantity)
    const itemPrice = item.itemId.itemDescription.item_price;
    const itemTotalPrice = itemPrice * item.quantity;   //------------------------

    // Add item to cart display
    x_innerHtml = `
      <div class="cart_food_item" data-item-id="${item.itemId._id}">
        <div class="cart_item_pic">
          <img src="${item.itemId.itemPic}" alt="${item.itemId.itemDescription.item_name}">
        </div>
        <div class="cart_item_description">
          <div class="cart_item_details">
            <span class="cart_product_name">${item.itemId.itemDescription.item_name}</span>
            <span class="cart_product_type" style="color: ${productColor}">${productType}</span>
            <span class="cart_product_store">${item.itemId.itemDescription.item_store}</span>
            <span class="cart_product_price">₹${itemPrice}</span>
          </div>
          <div class="cross_cart">
              <button class="remove_item"><lord-icon src="https://cdn.lordicon.com/skkahier.json" trigger="hover" colors="primary:#000000" style="width:25px;height:25px"></lord-icon></button>
            <div class="wrapper">
              <span class="minus"> - </span>
              <span class="num">${item.quantity}</span>
              <span class="plus"> + </span>
            </div>
          </div>
        </div>
      </div>
    `;

    // <button class="remove_item"><i class="ri-close-line"></i></button>
    

    // Append the cart item HTML to the cart container
    cartDisplayItem.innerHTML += x_innerHtml;

    // Update price details
    priceDetailsinnerHTML += `
      <span class="item_calculation">
        <p class="item_name">${item.itemId.itemDescription.item_name}</p>
        <p class="item_price">₹${itemPrice} x ${item.quantity}</p>
      </span>
    `;

    // Update the total price
    // totalPrice += itemTotalPrice;   //-------------------------
  });

  const priceDetails = document.querySelector(".price_details");
  priceDetails.innerHTML = priceDetailsinnerHTML;

  // totalPriceDetails.innerText += `${totalPrice}`; // += is use for add the rupees icon that written in cart.html line no 62


  const totalPriceOfItems = await calculateTotalPrice();      //-----------------------
  totalPriceDetails.innerText = `₹${totalPriceOfItems}`; 

  // Set up event listeners after cart items are displayed
  setupEventListeners();

}



async function updateCartItemQuantity(itemId, quantity) {
  const token = localStorage.getItem('authToken'); // Get the token from localStorage

  const response = await fetch(`${window.API_BASE_URL}/api/cart/update`, { // Ensure correct backend URL
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      itemId: itemId,
      quantity: quantity
    })
  });

  const result = await response.json();
  if (response.ok) {
    console.log("Cart updated successfully:", result);
    displayCartItems(); // Re-fetch and update the UI
  } else {
    console.error("Error updating cart:", result.message);
  }
}


displayCartItems();



// Get the video element by its ID  ----------------------------------------------------------------


// Function to remove item from cart

async function removeItemFromCart(itemId) {
  const token = localStorage.getItem('authToken'); // Get the token from localStorage

  const response = await fetch(`${window.API_BASE_URL}/api/cart/remove`, { // Ensure correct backend URL
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ itemId: itemId })
  });

  const result = await response.json();
  if (response.ok) {
    console.log("Item removed from cart successfully:", result);
    displayCartItems(); // Re-fetch and update the UI
  } else {
    console.error("Error removing item:", result.message);
  }
}






// Attach event listeners to the minus/plus buttons and remove button
function setupEventListeners() {
  document.querySelectorAll('.minus').forEach(button => {
    button.addEventListener('click', (e) => {
      const itemId = e.target.closest('.cart_food_item').dataset.itemId; // Get itemId from data attribute
      const quantityElement = e.target.closest('.cart_food_item').querySelector('.num');
      let quantity = parseInt(quantityElement.textContent);

      if (quantity > 1) {
        quantity -= 1;
        updateCartItemQuantity(itemId, quantity);
      } else if (quantity === 1) {
        // Quantity reaches 0, remove item
        updateCartItemQuantity(itemId, 0);
      }
    });
  });

  document.querySelectorAll('.plus').forEach(button => {
    button.addEventListener('click', (e) => {
      const itemId = e.target.closest('.cart_food_item').dataset.itemId; // Get itemId from data attribute
      const quantityElement = e.target.closest('.cart_food_item').querySelector('.num');
      let quantity = parseInt(quantityElement.textContent);
      quantity += 1;
      updateCartItemQuantity(itemId, quantity);
    });
  });

  document.querySelectorAll('.remove_item').forEach(button => {
    button.addEventListener('click', (e) => {
      const itemId = e.target.closest('.cart_food_item').dataset.itemId; // Get itemId from data attribute
      removeItemFromCart(itemId);
    });
  });
}


// ________________________________________________________________________ use for purchase button 



async function calculateTotalPrice(cartItems) {
  try {
    const cartItems = await getCartItems();
    
    if (!cartItems || cartItems.length === 0) {
      return 0; // If the cart is empty, return 0 as the total price
    }

    let totalPrice = 0;
    
    cartItems.forEach(item => {
      // Safely access the item price and quantity
      const itemPrice = item?.itemId?.itemDescription?.item_price;
      const itemQuantity = item?.quantity;

      if (itemPrice && itemQuantity) {

        totalPrice += itemPrice * itemQuantity;

      } else {
        console.warn('Missing item price or quantity for item:', item);
      }
    });
    
    return totalPrice;

  } catch (error) {
    console.error('Error calculating total price:', error);
    return 0; // In case of an error, return 0
  }
}



document.querySelector('.PLACE_ORDER').addEventListener('click', function() {
  placeOrder();
});

async function placeOrder() {
  try {
    // Wait for the total price to be calculated
    const priceItem = await calculateTotalPrice();
    
    // Log or use the calculated price
    console.log('Total Price:', priceItem);

    handlePayment(priceItem);

  } catch (error) {
    console.error('Error placing order:', error);
  }
}



const handlePayment = async (totalAmount) => {
  try {
    // 1. Create order from backend
    const token = localStorage.getItem('authToken')

    const res = await fetch(`${window.API_BASE_URL}/api/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: totalAmount }),
    });

    const data = await res.json();
    console.log("Data : ",data);

    if (!data.orderId) {
      alert('Failed to create order');
      return;
    }

    // 2. Open Razorpay checkout
    const options = {
      key: 'rzp_test_n6vYobVX6XZ63j', // Razorpay public key
      amount: data.amount,
      currency: data.currency,
      name: 'ByteGO',
      description: 'Food Order Payment',
      order_id: data.orderId,
      handler: async function (response) {
        // Razorpay returns payment details here
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

        // 3. Send payment success info to backend
        const verifyRes = await fetch(`${window.API_BASE_URL}/api/razorpay/verify-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            amount: totalAmount,
          }),
        });

        const verifyData = await verifyRes.json();
        console.log(verifyData.message);

        const parentCartContainer = document.querySelector('.parent_cart_container');

        // if (verifyRes.ok) {
        //   parentCartContainer.innerHTML = `
        //     <div class="video_cart">
        //       <iframe src="https://lottie.host/embed/b34e0327-51fb-45f3-b220-f9b97b6b972b/7tjVmzhvV9.lottie"></iframe>
        //     </div>`;
        // } else {
        //   alert('Payment verified but order saving failed.');
        // }
              
        if (verifyRes.ok) {
          const { orderId, confirmationCode, qrCodeUrl } = verifyData.order;
        
          parentCartContainer.innerHTML = `
            <div class="order-success">
              <h3>Order Confirmed</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Confirmation Code:</strong> ${confirmationCode}</p>
              <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 250px; margin-top: 20px;" />
            </div>
          `;
        } else {
          alert('Payment verified but order saving failed.');
        }



      },
      prefill: {
        name: data.name,
        email: data.email,
      },
      theme: {
        color: '#3399cc',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error('Payment error:', err);
    alert('Something went wrong');
  }
};



















async function profileData() {
  
  try{
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:5000/api/profile',{
      method: 'GET',
      headers:{
        'Authorization':`Bearer ${token}`
      }
    });
    const data = await response.json();

    if(!response.ok){
      console.log("somthing is wrong in fetch profile data for cart");
      return;
    }
    console.log(data.name);
  }
  catch(err){
    console.log('cart profile error',err);
  }
}

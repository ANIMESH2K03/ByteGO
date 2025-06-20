// const window.API_BASE_URL = 'https://bytego-backend.onrender.com';


document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    document.getElementById('profile').innerHTML = '<p>Please log in to view your profile.</p>';
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById('profile').innerHTML = `<p>${data.message || 'Failed to load profile'}</p>`;
      return;
    }

    console.log(data);

    document.getElementById('profile').innerHTML = `
      <h2>${data.name || data.userId}</h2>
      <img src="${data.profilePicture || 'https://via.placeholder.com/100'}" alt="Profile Picture" />
      <div class="info"><strong>Email:</strong> ${data.email}</div>
      <div class="info"><strong>Phone:</strong> ${data.phone || 'N/A'}</div>
      <div class="info"><strong>Role:</strong> ${data.role}</div>
      <div class="info"><strong>Registered:</strong> ${data.registered_date}</div>
    `;
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('profile').innerHTML = '<p>Error loading profile.</p>';
  }
});

// const API_BASE_URL = 'https://bytego-backend.onrender.com';


document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');

  // Handle form submission
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get form data (email and password)
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Basic client-side validation (optional, but good practice)
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    // Prepare the data to send to the server
    const data = {
      email: email,
      password: password
    };

    try {
      // Send the POST request to the backend
      const response = await fetch(`${window.API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // Send data as JSON
      });

      // Handle the response from the server
      const responseData = await response.json();

      if (response.ok) {
        // If login is successful, store the JWT tokens in localStorage
        localStorage.setItem('authToken', responseData.accessToken); // Store the access token
        localStorage.setItem('refreshToken', responseData.refreshToken); // Store the refresh token

        // Get role from server (you need to include it in your response)
        const role = responseData.user.role;

        if (role === 'admin') {
          window.location.replace('../../admin/admin.html');
        } else if (role === 'staff') {
          window.location.replace('../../staff/staff.html');
        } else {
          window.location.replace('../../index.html'); // For normal users
        }

      } else {
        // If login failed, show an error message
        alert(responseData.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      // Handle any errors (e.g., network issues)
      console.error('Error logging in:', error);
      alert('An error occurred. Please try again later.');
    }
  });
});

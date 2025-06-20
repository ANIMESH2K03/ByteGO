let currentlyDisplayedItems; // use for how many item are going to display

window.onload = function() {
  currentlyDisplayedItems = calculateItemsPerRow();
  fetchItemsAndDisplay();
};


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



window.addEventListener("scroll", () => {
  const arrowNav = document.querySelector(".arrow_nav");
  const main = document.querySelector("main");
  const header = document.querySelector("header");
  const arrowForwardIcon = document.querySelector("#arrow_forward i");
  const arrowBackwardIcon = document.querySelector("#arrow_backward i");
  const bgPic = document.querySelector(".bg_pic");

  const scrollY = window.scrollY;

  const mainRect = main.getBoundingClientRect();
  const mainHeight = main.offsetHeight;

  // ----- Arrow Fade Phase -----
  const arrowFadeLimit = 100;
  let arrowOpacity = 1 - Math.min(scrollY / arrowFadeLimit, 1);

  arrowForwardIcon.style.opacity = arrowOpacity;
  arrowBackwardIcon.style.opacity = arrowOpacity;

  // ----- Background Effects Phase -----
  if (scrollY >= arrowFadeLimit) {
    let scrollProgress = (window.innerHeight - mainRect.top) / (mainHeight * 4);
    scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);

    arrowNav.style.backgroundColor = `rgba(227, 230, 230, ${scrollProgress})`;

    if (mainRect.top <= header.offsetHeight) {
      header.style.backgroundColor = "rgba(227, 230, 230, 1)";
      header.style.borderBottom = "1px solid rgba(128, 128, 128, 0.5)";
    } else {
      header.style.backgroundColor = "rgba(227, 230, 230, 0)";
      header.style.borderBottom = "1px solid rgba(128, 128, 128, 0)";
    }
  } else {
    arrowNav.style.backgroundColor = `rgba(227, 230, 230, 0)`;
  }

  // ----- Background Zoom Effect -----
  const zoomStart = window.innerHeight * 1; // 20% of the screen height
  const maxZoom = 1.05;  // Minimal zoom factor
  
  if (scrollY <= zoomStart) {
    let zoomProgress = scrollY / zoomStart; // 0 → 1
    bgPic.style.transform = `scale(${1 + (maxZoom - 1) * zoomProgress})`;
  } else {
    bgPic.style.transform = `scale(${maxZoom})`;  // Set the final zoom after 20% scroll
  }
});






async function validateAccess() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = './accounts/login/login.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Unauthorized');
    }

    const user = await res.json();
    
    switch (user.role) {
      case 'admin':
        window.location.href = './admin/admin.html';
        break;
      case 'staff':
        window.location.href = './staff/staff.html';
        break;
      case 'user':
      default:
        // Continue loading index.html for regular users
        document.getElementById("loaderContainer").style.display = "none";
        break;
    }

  } catch (err) {
    console.error('Access check failed:', err);
    window.location.href = './accounts/login/login.html';
  }
}




window.addEventListener("load", () => {
  setTimeout(() => {
    validateAccess(); // Call the role check after 1s delay
  }, 1000);
});



// Account button - Log out function
function account_log_out() {
  // Remove both authToken and refreshToken from localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');

  // Redirect to the login page
  // window.location.replace('./accounts/login/login.html');

  window.location.href = './accounts/login/login.html';
}

// account button __________________________________

// check login ______________________________________


function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("dimOverlay").style.display = "block"; // Show overlay
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("dimOverlay").style.display = "none"; // Hide overlay
}

// profile hover effect css__________________________________________________________________________

// Get the elements
const navItem = document.querySelector('.nav_3rd_item');
const dropdownMenu = document.querySelector('.dropdown-menu');

// Show dropdown when clicking on .nav_3rd_item
navItem.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent event from propagating to the document
    dropdownMenu.style.display = 'block'; // Show the dropdown
});

// Hide the dropdown when clicking outside
document.addEventListener('click', (event) => {
    if (!navItem.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none'; // Hide the dropdown if clicked outside
    }
});

// Ensure dropdown remains visible when hovered
dropdownMenu.addEventListener('mouseover', () => {
    dropdownMenu.style.display = 'block'; // Keep it visible on hover
});
dropdownMenu.addEventListener('mouseout', () => {
    dropdownMenu.style.display = 'none'; // Hide it when mouse leaves
});


// profile hover effect css_____________________________________________________________________________
// _________________________________item Container starts







const container = document.querySelector('.parent_container');
const viewMoreButton = document.querySelector('.view_more');
let totalItemNum ;







ITEM_API_URL = "http://localhost:5000/api/menu";


async function fetchItemsAndDisplay() {
  try {
    let token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error("No token found, please log in.");
    }

    let response = await fetch(`${API_BASE_URL}/api/menu`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 401) {  // Token expired or invalid
      const newToken = await refreshAuthToken();
      if (newToken) {
        token = newToken;
        response = await fetch(`${API_BASE_URL}/api/menu`, { // Retry request with new token
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      } else {
        throw new Error("Failed to refresh token, please log in again.");
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching items:', errorData.error);
      return;
    }

    const items = await response.json();
    totalItemNum = items.length;
    displayItems(items);
  } catch (error) {
    console.error('Error fetching items:', error);
  }
}

async function refreshAuthToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/refreshToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const { accessToken } = await response.json();
      localStorage.setItem('authToken', accessToken);
      return accessToken;
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      window.location.href = './accounts/login/login.html';
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}



// Function to calculate the number of items that can fit in one row
function calculateItemsPerRow() {

  const containerWidth = container.clientWidth; // Get the width of the container
  const itemWidth = 180; // Maximum width of the item
  const gap = 15; // Gap between the items
  const containerPadding = 15; // Padding on each side of the container

  // Determine number of rows based on container width
  let numberOfRows = 2; // Default: 2 rows (for wider screens)
  if (containerWidth < 600) {
    numberOfRows = 6; // 6 rows for screens smaller than 600px
  } else if (containerWidth < 992) {
    numberOfRows = 4; // 4 rows for screens smaller than 992px
  }

  // Calculate number of items per row
  const itemsPerRow = Math.floor((containerWidth - 2 * containerPadding + gap) / (itemWidth + gap));

  // Limit the number of items to show (based on number of rows)
  const totalItemsToDisplay = itemsPerRow * numberOfRows; // Total items based on rows

  return totalItemsToDisplay; 
}

// Toggle display on "View More" button click
viewMoreButton.addEventListener('click', () => {

  let totalItemsToDisplay = calculateItemsPerRow();
  console.log(totalItemsToDisplay);

 if (currentlyDisplayedItems === totalItemsToDisplay) {
   // Show all items
   currentlyDisplayedItems = totalItemNum;
  //  viewMoreButton.textContent = 'View less';
   viewMoreButton.innerHTML = 'View less <i class="ri-arrow-up-s-line"></i>';
 } else {
   // Show limited items
   currentlyDisplayedItems = totalItemsToDisplay;
   viewMoreButton.innerHTML = 'View More <i class="ri-arrow-down-s-line"></i>';
 }
 // Update the display based on the current number of items
 fetchItemsAndDisplay();
});




function displayItems(items) {

  if (!container) return;

  let innerHtml = '';
  items.slice(0, currentlyDisplayedItems).forEach(element => {
    const foodType = element.itemDescription.veg ? './pictures/logo/veg_icon.jpg' : './pictures/logo/non_veg_icon.jpg';
    innerHtml += `
      <div class="item">
        <div class="item_pic">
          <img src="${element.itemPic}" alt="${element.itemDescription.item_name}">
          <div class="mini-box">
            <img src="${foodType}" alt="veg/non-veg.jpg">
          </div>
        </div>
        <div class="item_detils">
          <div class="item_description">
            <span class="product_name">${element.itemDescription.item_name}</span>
            <span class="product_store">${element.itemDescription.item_store}</span>
            <span class="product_rating"><i class="ri-star-fill"></i> ${element.rating.avg_rating} / 5.0 (${element.rating.total_rating})</span>
            <span class="product_price">&#8377;${element.itemDescription.item_price}/-</span>
          </div>
          <div class="item_addtocart">
            <button class="add-to-cart" data-item-id="${element._id}">Add to Cart</button>
          </div>
        </div>
      </div>`;
  });

  container.innerHTML = innerHtml;
  attachCartEventListeners();
}





function attachCartEventListeners() {
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', handleAddToCart);
  });
}




async function handleAddToCart(event) {
  const itemId = event.target.getAttribute('data-item-id');
  
  // Retrieve the auth token from localStorage
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('You must be logged in to add items to the cart.');
    return;
  }

  // Extract the user ID (MongoDB _id) from the token
  let userId;
  try {
    const decodedToken = jwt_decode(token); // Decode the JWT token to extract user info
    userId = decodedToken._id;
  } catch (error) {
    console.error('Error decoding token:', error);
    alert('Unable to get user information.');
    return;
  }

  // Prepare the cart item data to send to the server
  const cartItem = {
    itemId,      // Item ID
    quantity: 1, // Set default quantity to 1
  };

  // Check if the item already exists in the cart
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Send token in Authorization header
      },
      body: JSON.stringify(cartItem),
    });

    if (response.ok) {
      console.log('Item added to cart');
    } else {
      const errorData = await response.json();
      alert(`Failed to add item: ${errorData.message}`);
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    alert('An error occurred while adding the item to the cart.');
  }
}





// add to cart button js--------------------------------------------------
// _____________________________________________________arrow nav starts


let bgPIC = [];  // Store fetched images globally
let currentIndex = 0;

// Fetch images once on page load
async function fetchBackgroundImages() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/backPIC`);
    if (!response.ok) {
      throw new Error("Failed to fetch background images");
    }
    bgPIC = await response.json();

    if (bgPIC.length > 0) {
      updateBackgroundImage();  // Set the first image
      startAutoChange();        // Start automatic background change
    }
  } catch (error) {
    console.error('Error fetching background images:', error);
  }
}

// Function to update the background image
function updateBackgroundImage() {
  if (bgPIC.length > 0) {
    const bgDiv = document.querySelector('.bg_pic');
    bgDiv.style.backgroundImage = `url('${bgPIC[currentIndex].cover_pic}')`;
    bgDiv.style.backgroundSize = 'cover';
    bgDiv.style.backgroundPosition = 'center';
  }
}

// Function to go to the next image
function goToNextImage() {
  currentIndex = (currentIndex + 1) % bgPIC.length;
  updateBackgroundImage();
}

// Function to go to the previous image
function goToPreviousImage() {
  currentIndex = (currentIndex - 1 + bgPIC.length) % bgPIC.length;
  updateBackgroundImage();
}

// Automatic background change every 7 seconds
let autoChangeInterval;
function startAutoChange() {
  autoChangeInterval = setInterval(goToNextImage, 7000);
}

// Function to reset the auto-change interval
function resetAutoChange() {
  clearInterval(autoChangeInterval);
  startAutoChange();
}

// Event listeners for navigation
document.getElementById('arrow_forward').addEventListener('click', () => {
  goToNextImage();
  resetAutoChange();
});

document.getElementById('arrow_backward').addEventListener('click', () => {
  goToPreviousImage();
  resetAutoChange();
});

// Fetch images when the page loads
fetchBackgroundImages();



// _____________________________________________arrow nav ends





// ____________________________________________token check starts


async function makeApiRequest(url, options) {

  console.log("make api request from makeApiRequest()")


  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    window.location.href = './accounts/login/login.html'; // Redirect to login if no token
    return;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 401) {
      // If the token is expired, try refreshing it
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Try refreshing the token
        const refreshResponse = await fetch('/api/refreshToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          localStorage.setItem('authToken', accessToken); // Store the new access token
          // Retry the original request with the new token
          return makeApiRequest(url, options);
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = './accounts/login/login.html'; // Redirect to login if refresh fails
          return;
        }
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed', error);
  }
}




// ____________________________________________token check ends
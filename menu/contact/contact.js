


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


// _____________________________________________form script starts from here

document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault(); // Prevent the default form submission
  const overlay = document.getElementById("overlay");
  const messageElement = document.getElementById("message");
  const submitButton = document.getElementById("submit-button");

  messageElement.textContent = "Submitting...";
  overlay.style.display = "flex"; // Show the overlay
  submitButton.disabled = true;

  // Collect the form data
  const formData = new FormData(this);

  // Add a timestamp to the form data

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  const timestamp = new Intl.DateTimeFormat('en-US', options).format(new Date());
  formData.append("TimeStamp", timestamp);

  const keyValuePairs = [];
  for (const pair of formData.entries()) {
    keyValuePairs.push(pair[0] + "=" + pair[1]);
  }

  const formDataString = keyValuePairs.join("&");

  // Send a POST request to your Google Apps Script
  fetch(
    "https://script.google.com/macros/s/AKfycbx56zetWfQXV8OAfePkAewhKp-HFRZzjX4JsPtq6wKuT4L13LYLvSDYQKSYWFK7BFoJ/exec",
    {
      redirect: "follow",
      method: "POST",
      body: formDataString,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        // "Content-Type": "application/json",
      },
    }
  )
    .then((response) => {
      if (response) {
        return response;
      } else {
        throw new Error("Failed to submit the form.");
      }
    })
    .then(() => {
      messageElement.textContent = "Data submitted successfully!";
      submitButton.disabled = false;
      document.getElementById("form").reset();

      setTimeout(() => {
        overlay.style.display = "none"; // Hide the overlay
      }, 1500);
    })
    .catch((error) => {
      console.error(error);
      messageElement.textContent = "An error occurred while submitting the form.";
      submitButton.disabled = false;

      setTimeout(() => {
        overlay.style.display = "none"; // Hide the overlay
      }, 1000);
    });
});


// ____________________________________________form script ends here
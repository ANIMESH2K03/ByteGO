document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const container = document.getElementById('profileContainer');

  if (!token) {
    container.innerHTML = '<p>Please log in to view your profile.</p>';
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) return container.innerHTML = `<p>${data.message || 'Failed to load profile'}</p>`;

    renderProfile(data, false);
  } catch (err) {
    console.error('Error:', err);
    container.innerHTML = '<p>Error loading profile.</p>';
  }

  function renderProfile(data, isEditing = false) {
    const { userId, name = '', email, phone = '', role, registered_date, profilePicture } = data;

    container.innerHTML = `
      <div class="profile-wrapper">
        <div class="profile-card">
          <div class="profile-header">
            <img src="${profilePicture || 'https://bootdey.com/img/Content/avatar/avatar7.png'}" alt="Profile Picture">
            <h2>${userId}</h2>
            <p>${name || 'No Name Provided'}</p>
          </div>
          <div class="profile-info">
            ${generateRow('Full Name', 'name', name, isEditing)}
            ${generateRow('Email', 'email', email, isEditing, true)}
            ${generateRow('Phone', 'phone', phone, isEditing)}
            ${generateRow('Role', '', role, false)}
            ${generateRow('Registered', '', registered_date, false)}
          </div>
          <div class="profile-actions">
            <button id="${isEditing ? 'saveBtn' : 'editBtn'}">
              ${isEditing ? 'Save Changes' : 'Edit'}
            </button>
          </div>
        </div>
      </div>
    `;

    const btn = document.getElementById(isEditing ? 'saveBtn' : 'editBtn');
    btn.addEventListener('click', async () => {
      if (isEditing) {
        const updated = {
          name: document.getElementById('input-name').value,
          phone: document.getElementById('input-phone').value
        };
        try {
          const saveResponse = await fetch(`${window.API_BASE_URL}/api/profile/update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updated)
          });

          const updatedData = await saveResponse.json();
          if (!saveResponse.ok) throw new Error(updatedData.message);
          renderProfile(updatedData, false);
        } catch (err) {
          alert('Update failed: ' + err.message);
        }
      } else {
        renderProfile(data, true);
      }
    });
  }

  function generateRow(label, key, value, isEditing, disabled = false) {
    return `
      <div class="profile-row">
        <label>${label}</label>
        <div class="profile-data">
          ${isEditing && key
            ? `<input type="text" id="input-${key}" value="${value}" ${disabled ? 'disabled' : ''} />`
            : value}
        </div>
      </div>
    `;
  }
});

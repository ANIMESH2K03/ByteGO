const codeModal = document.getElementById('codeModal');
const verificationCodeInput = document.getElementById('verificationCode');
const submitCodeBtn = document.getElementById('submitCodeBtn');

const messageModal = document.getElementById('messageModal');
const messageText = document.getElementById('messageText');
const closeMessageBtn = document.getElementById('closeMessageBtn');

let countdownInterval; // ✅ Define globally
let countdown = 60;

function showModal(modal) {
  modal.style.display = 'flex';
}

function closeModal(modal) {
  modal.style.display = 'none';
}

function showMessage(message) {
  messageText.textContent = message;
  showModal(messageModal);
}

closeMessageBtn.addEventListener('click', () => {
  closeModal(messageModal);
  window.location.href = '../login/login.html'; // ✅ Redirect on close
});

// Send code
const sendVerificationCode = async (userId, email) => {
  const response = await fetch(`${API_BASE_URL}/api/send-verification-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send code');
};

// Verify and signup
const verifyCodeAndSignup = async (userId, email, password, code) => {
  const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email, password, code })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Verification failed');
};

signupForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const userId = document.getElementById('userId').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!userId || !email || !password || !confirmPassword)
    return showMessage('All fields are required.');
  if (password !== confirmPassword)
    return showMessage('Passwords do not match.');

  try {
    countdown = 60;
    const countdownTimer = document.getElementById('countdownTimer');
    countdownTimer.textContent = `Enter Verification Code in ${countdown}s`;
    showModal(codeModal);
    await sendVerificationCode(userId, email);

    countdownInterval = setInterval(() => {
      countdown--;
      countdownTimer.textContent = `Enter Verification Code in ${countdown}s`;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        closeModal(codeModal);
        showMessage('Verification time expired.');
      }
    }, 1000);
  } catch (err) {
    showMessage(err.message);
  }

  // Attach this outside the try-catch so it's always ready
  submitCodeBtn.onclick = async () => {
    const code = verificationCodeInput.value.trim();
    if (!code) return showMessage('Please enter the verification code.');

    try {
      await verifyCodeAndSignup(userId, email, password, code);
      clearInterval(countdownInterval);
      closeModal(codeModal);
      showMessage('Sign-up successful!');
    } catch (err) {
      showMessage(err.message);
    }
  };
});



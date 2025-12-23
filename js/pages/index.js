let fetchedUser = null;

sessionStorage.clear();

/** * onload-function: handles start animation, remove overlay when finished.
 * prevents false positioning when page is reloaded
 */
function removeOverlay() {
  const overlay = document.querySelector('.idx-overlay');
  const logo = document.querySelector('.floating-logo');
  overlay.classList.remove('d-none');
  logo.classList.add('animate');
  setTimeout(() => {
    overlay.classList.add('d-none');
  }, 1000);
}

/** * onlick-function of "Login"-button. check whether input fields are filled.
 */
function handleLogin(){
  const userEmail = document.getElementById('login-email').value.trim();
  const userPw = document.getElementById('login-password').value.trim();
  const emailValid = !userEmail ? blameEmptyInput('login-email', 'alert-login') : true;
  const pwValid = !userPw ? blameEmptyInput('login-password', 'alert') : true;
  
  if (emailValid && pwValid) {
    startValidation(userEmail, userPw);
  }
}

/** * Validates user credentials by checking email in Firebase and verifying password.
 * First checks if the user exists in Firebase, then validates the password.
 * @param {string} userEmail - The email address entered by the user.
 * @param {string} userPw - The password entered by the user.
 * @returns {Promise<void>}
 */
async function startValidation(userEmail, userPw) {
  await checkUserInFirebase('users', 'email', userEmail);
  validateLogin(userPw);
}

/** * helper function for "checkUserInFirebase"; check wether login is valid.
 * @param {string} userEmail
 * @param {string} userPw 
 */
function validateLogin(userPw) {
  const validEmail = checkEmail();
  const validPw = validEmail ? validatePassword(userPw) : false;
  
  if (validEmail && validPw) {
    setSessionStorage();
    window.location.href = 'html/summary.html';
  }
}

/** * helper function for "validateLogin"; if email is not found in database, 
 * "fetchedUser" is empty and email check false.
 * @returns boolean
 */
function checkEmail() {
  if (Object.keys(fetchedUser).length == 0) {
    showEmailError();
    return false;
  } else return true;
}

/** * helper function for "validateLogin"; if email is correct, 
 * compare password from input to password in "fetchedUser".
 * @param {string} userPw - user password from login input.
 * @returns boolean
 */
function validatePassword(userPw) {
  const userDetails = Object.values(fetchedUser)[0];
  let foundPassword = userDetails.password == userPw;
  if (!foundPassword) {
    showPasswordError();
    return false;
  } else return true;
}

/** * helper function for "validateLogin"; get user name from "fetchedUser", set name to sessionStorage.
 */
function setSessionStorage() {
  const userDetails = Object.values(fetchedUser)[0];
  const displayName = userDetails.displayName;
  sessionStorage.setItem('currentUser', displayName);
  initialsForHeader(displayName);
}

/** Eventlistener for DOMContentLoaded: setup input focus listeners and button event listeners
 */
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const container = emailInput.closest('.input-frame');
      if (container) container.classList.remove('active');
      document.getElementById('alert-login').classList.add('d-none');
    });
  }
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const container = passwordInput.closest('.input-frame');
      if (container) container.classList.remove('active');
      document.getElementById('alert').classList.add('d-none');
    });
  }

  const guestLoginBtn = document.getElementById('guest-login-btn');
  if (guestLoginBtn) {
    guestLoginBtn.addEventListener('click', directLogin);
  }

  const signupButtons = document.querySelectorAll('.signup-redirect-btn');
  signupButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      location.href = './html/sign-up.html';
    });
  });
});

/** * helper function for "setSessionStorage"; set initials for "header", to sessionstorStorage.
 * @param {string} displayName - user name corresponding to email-adress
 */
function initialsForHeader(displayName) {
  const initials = getInitials(displayName);
  sessionStorage.setItem('headerInitials', initials);
}

/** * helper function for "initialsForHeader"; get initals from first and last part of user name.
 * @param {string} fullName -user name
 * @returns initials (string).
 */
function getInitials(fullName) {
  const names = fullName.trim().split(" ");
  if (names.length == 0) return '';
  const first = names[0][0]?.toUpperCase();
  const last = names.length > 1 ? names[names.length - 1][0]?.toUpperCase() : '';
  return first + last;
}

/** * Shows error message for invalid email
 */
function showEmailError() {
  document.getElementById('login-email').closest('.input-frame').classList.add('active');
  document.getElementById('alert-login').textContent = 'Email not found. Please check your email or sign up.';
  document.getElementById('alert-login').classList.remove('d-none');
}

/** * Shows error message for invalid password
 */
function showPasswordError() {
  document.getElementById('login-password').closest('.input-frame').classList.add('active');
  document.getElementById('alert').textContent = 'Wrong password. Please try again.';
  document.getElementById('alert').classList.remove('d-none');
}

/** * helper function for "validateLogin"; show alert message and add red input borders
 */
function loginAlert() {
  document.getElementById('login-email').closest('.input-frame').classList.add('active');
  document.getElementById('login-password').closest('.input-frame').classList.add('active');
  document.getElementById('alert').classList.remove('d-none');
}
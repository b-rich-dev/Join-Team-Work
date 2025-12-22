import { selectedCategory, selectedContacts } from "../events/dropdown-menu.js";

/** * Checks if all required fields are filled out.
 * @returns {boolean} - Returns true if all fields are valid, false otherwise.
 */
export function checkRequiredFields() {
  let isValid = true;

  if (!checkTitle()) isValid = false;
  if (!checkDatepicker()) isValid = false;
  if (!checkCategory()) isValid = false;
  if (!checkAssignedTo()) isValid = false;
  if (!checkCategorySpan()) isValid = false;
  if (!checkAttachmentFormat()) isValid = false;

  return isValid;
}

/** * Validates the title input field.
 * @returns {boolean} - Returns true if the title is valid, false otherwise.
 */
function checkTitle() {
  const input = document.getElementById("title");
  const error = document.getElementById("title-error");
  if (!input || !input.value.trim()) {
    showError(input, error);
    return false;
  }
  hideError(input, error);
  return true;
}

/** * Validates the datepicker input field.
 * @returns {boolean} - Returns true if the datepicker is valid, false otherwise.
 */
function checkDatepicker() {
  const input = document.getElementById("datepicker");
  const error = document.getElementById("due-date-error");
  if (!input || !input.value.trim()) {
    showError(input, error);
    return false;
  }
  hideError(input, error);
  return true;
}

/** * Validates the selected category.
 * @returns {boolean} - Returns true if a category is selected, false otherwise.
 */
function checkCategory() {
  const dropdown = document.getElementById("dropdown-category");
  const error = document.getElementById("category-error");
  if (!selectedCategory) {
    showError(dropdown, error);
    return false;
  }
  hideError(dropdown, error);
  return true;
}

/** * Validates the assigned contacts.
 * @returns {boolean} - Returns true if at least one contact is selected, false otherwise.
 */
function checkAssignedTo() {
  const dropdown = document.getElementById("dropdown-assigned-to");
  const error = document.getElementById("assigned-to-error");
  if (selectedContacts.length === 0) {
    showError(dropdown, error);
    return false;
  }
  hideError(dropdown, error);
  return true;
}

/** * Checks if the category span is valid.
 * @returns {boolean} - Returns true if the category span is valid, false otherwise.
 */
function checkCategorySpan() {
  const span = document.getElementById("selected-category");
  const dropdown = document.getElementById("dropdown-category");
  if (span && span.textContent === "Select task category") {
    dropdown?.classList.add("invalid");
    return false;
  }
  return true;
}

/** * Checks if attachment format is valid.
 * @returns {boolean} - Returns true if format is valid, false otherwise.
 */
function checkAttachmentFormat() {
  const list = document.getElementById("attachment-list");
  if (list.length === 0) return true;
  if (list.length > 0) {
    if (!validTypes.includes(file.type)) {
      showWrongFormatErrorMsg();
      return false;
    }
  }
  return true;
}

/** * Displays an error message for the specified input and error elements.
 * @param {HTMLInputElement} input - The input element to show the error for.
 * @param {HTMLElement} error - The error element to display the error message.
 */
function showError(input, error) {
  input?.classList.add("invalid");
  error?.classList.add("d-flex");
}

/** * Hides the error message for the specified input and error elements.
 * @param {HTMLInputElement} input - The input element to hide the error for.
 * @param {HTMLElement} error - The error element to hide the error message.
 */
function hideError(input, error) {
  input?.classList.remove("invalid");
  error?.classList.remove("d-flex");
}

/** * Handles input validation for the title field.
 * @param {HTMLInputElement} inputElement - The input element to validate.
 */
export function handleInput(inputElement) {
  const titleError = document.getElementById("title-error");

  if (inputElement.value.trim()) {
    inputElement.classList.remove("invalid");
    titleError?.classList.remove("d-flex");
  }
}

/** * Shows a wrong format error message with slide-in animation.
 * @returns {Promise<void>}
 */
export async function showWrongFormatErrorMsg() {
  const msg = document.getElementById("wrongFormatErrorMsg");
  if (!msg) return;

  msg.classList.remove("hidden", "slide-out");
  msg.classList.add("slide-in");
}

/** * Hides the wrong format error message with slide-out animation.
 * @param {number} closeDuration - Ignored, uses CSS transition duration (400ms).
 * @returns {Promise<void>}
 */
export async function hideWrongFormatErrorMsg(closeDuration) {
  const msg = document.getElementById("wrongFormatErrorMsg");
  if (!msg) return;
  msg.classList.remove("slide-in");
  msg.classList.add("slide-out");

  await new Promise((resolve) => setTimeout(resolve, 400));
  msg.classList.add("hidden");
}

/** * Shows the size limit error message with slide-in animation.
 */
export function showSizeLimitErrorMsg() {
  const msg = document.getElementById('attachmentLimitErrorMsg');
  if (msg) {
    msg.classList.remove('hidden', 'slide-out');
    msg.classList.add('slide-in');
    return;
  }
  alert('Upload limit reached! You can upload up to 1 MB total.');
}

/** * Hides the size limit error message with slide-out animation.
 * @param {number} closeDuration - Ignored, uses CSS transition duration (400ms).
 * @returns {Promise<void>}
 */
if (!window.__wrongFormatCloseBound) {
  const isInsideCloseBtn = (node) => {
    let el = node;
    while (el && el !== document) {
      if (el.getAttribute && el.getAttribute('id') === 'error-msg-close') return true;
      el = el.parentNode;
    }
    return false;
  };
  document.addEventListener("click", (e) => {
    if (isInsideCloseBtn(e.target) && typeof hideWrongFormatErrorMsg === 'function') {
      hideWrongFormatErrorMsg(400);
    }
  });
  window.__wrongFormatCloseBound = true;
}

/** * Hides the size limit error message when the close button is clicked.
 */
if (!window.__limitMsgCloseBound) {
  document.addEventListener('click', async (e) => {
    const isLimitClose = (node) => {
      let el = node;
      while (el && el !== document) {
        if (el.getAttribute && el.getAttribute('id') === 'limit-error-msg-close') return true;
        el = el.parentNode;
      }
      return false;
    };
    if (isLimitClose(e.target)) {
      const msg = document.getElementById('attachmentLimitErrorMsg');
      if (!msg) return;
      msg.classList.remove('slide-in');
      msg.classList.add('slide-out');
      await new Promise((resolve) => setTimeout(resolve, 400));
      msg.classList.add('hidden');
    }
  });
  window.__limitMsgCloseBound = true;
}

window.showWrongFormatErrorMsg = showWrongFormatErrorMsg;
window.hideWrongFormatErrorMsg = hideWrongFormatErrorMsg;
window.showSizeLimitErrorMsg = showSizeLimitErrorMsg;
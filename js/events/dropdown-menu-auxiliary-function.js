import { firebaseData } from "../../main.js";
import { currentContacts, getAssignedToOptions, setCategory, toggleCategoryDropdown, toggleSelectContacts, toggleAssignedToDropdown, setSortedContacts, selectedCategory, selectedContacts, resetDropdownState, setBorderColorGrey, contactsMap } from "./dropdown-menu.js";

/** Clears the selected assigned contacts in the dropdown.
 */
const INVALID_FIELDS_IDS = [
  "title",
  "datepicker",
  "dropdown-category",
  "dropdown-assigned-to",
];

/** Clears the invalid fields by removing the "invalid" class and hiding error messages.
 */
const ERROR_FIELDS_IDS = [
  "title-error",
  "due-date-error",
  "assigned-to-error",
  "category-error",
];

/** Initializes the dropdown menus for category and assigned contacts.
 * Sets up event listeners and populates the dropdowns with contacts.
 */
export function initDropdowns(contactsData) {
  setSortedContacts(contactsData);

  const categoryDropdown = document.getElementById("dropdown-category");
  const categoryOptions = document.getElementById("category-options-container");
  const assignedUsersDropdown = document.getElementById("dropdown-assigned-to");
  const assignedUsersOptions = document.getElementById("assigned-to-options-container");

  setupCategoryDropdown();
  setupAssignedUsersDropdown();
  setupDocumentClickHandler(categoryDropdown, categoryOptions, assignedUsersDropdown, assignedUsersOptions);
  resetDropdownState();
}

/** Clears the selected assigned contacts in the dropdown.
 */
function setupCategoryDropdown() {
  const dropdown = document.getElementById("dropdown-category");
  dropdown?.addEventListener("click", toggleCategoryDropdown);
  dropdown?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCategoryDropdown();
    }
  });
  const optionsContainer = document.getElementById("category-options-container");
  optionsContainer?.addEventListener("click", (event) => {
    if (event.target.classList.contains("option")) {
      setCategory(event.target);
    }
  });
  optionsContainer?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      if (event.target.classList.contains("option")) {
        setCategory(event.target);
      }
    }
  });
}

/** Sets up assigned users dropdown event listeners.
 */
function setupAssignedUsersDropdown() {
  const dropdown = document.getElementById("dropdown-assigned-to");
  dropdown?.addEventListener("click", toggleAssignedToDropdown);
  dropdown?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleAssignedToDropdown();
    }
  });
  const optionsContainer = document.getElementById("assigned-to-options-container");
  optionsContainer?.addEventListener("click", handleContactOptionClick);
  optionsContainer?.addEventListener("keydown", handleContactOptionKeydown);
  setupEscapeKeyListener();
}

/** Handles keydown on contact option.
 * @param {KeyboardEvent} event - Keydown event.
 */
function handleContactOptionKeydown(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.stopPropagation();
    const contactOption = event.target.closest(".contact-option");
    if (!contactOption) return;

    processContactSelection(contactOption);
    clearAssignedToValidationError();
    ensureDropdownOpen();
  }
}

/** Handles click on contact option.
 * @param {Event} event - Click event.
 */
function handleContactOptionClick(event) {
  event.stopPropagation();
  const contactOption = event.target.closest(".contact-option");
  if (!contactOption) return;

  processContactSelection(contactOption);
  clearAssignedToValidationError();
  ensureDropdownOpen();
}

/** Processes contact selection from option.
 * @param {HTMLElement} contactOption - Contact option element.
 */
function processContactSelection(contactOption) {
  const id = contactOption.dataset.id;
  const contact = findContactForOption(id, contactOption.dataset.name, contactOption.dataset.initials);

  if (contact) {
    toggleSelectContacts(contactOption, contact.name, contact.initials, contact.avatarColor, contact.avatarImage, id);
  }
}

/** Finds contact by ID or by name and initials.
 * @param {string} id - Contact ID.
 * @param {string} name - Contact name (may contain " (You)").
 * @param {string} initials - Contact initials.
 * @returns {Object|undefined} Contact object.
 */
function findContactForOption(id, name, initials) {
  let contact = contactsMap.get(id);

  if (!contact) {
    const cleanName = name.replace(' (You)', '');
    contact = currentContacts.find(c => c.name === cleanName && c.initials === initials);
  }

  return contact;
}

/** Clears validation error for assigned-to field.
 */
function clearAssignedToValidationError() {
  const invalidArea = document.getElementById("dropdown-assigned-to");
  const assignedUsersError = document.getElementById("assigned-to-error");

  if (invalidArea?.classList.contains("invalid")) {
    invalidArea.classList.remove("invalid");
    assignedUsersError?.classList.remove("d-flex");
  }
}

/** Ensures assigned-to dropdown remains open.
 */
function ensureDropdownOpen() {
  const wrapper = document.getElementById("assigned-to-options-wrapper");
  if (wrapper && !wrapper.classList.contains("open-assigned-to")) {
    wrapper.classList.add("open-assigned-to");
  }
}

/** Sets up ESC key listener for closing dropdown.
 */
function setupEscapeKeyListener() {
  if (window._assignedToEscListener) return;

  window._assignedToEscListener = true;
  document.addEventListener("keydown", handleEscapeKey);
}

/** Handles ESC key press to close dropdown.
 * @param {KeyboardEvent} event - Keyboard event.
 */
function handleEscapeKey(event) {
  if (event.key !== "Escape") return;

  const wrapper = document.getElementById("assigned-to-options-wrapper");
  if (wrapper?.classList.contains("open-assigned-to")) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
    closeAssignedToDropdown();
    document.getElementById("dropdown-assigned-to")?.focus();
  }
}

/** Handles clicks outside the dropdown to close it.
 * @param {HTMLElement} dropdown - The dropdown element to check.
 * @param {HTMLElement} options - The options container element.
 * @param {Function} closeFunction - The function to call to close the dropdown.
 */
function handleOutsideClick(dropdown, options, closeFunction) {
  return (event) => {
    const clickedOutside = !dropdown.contains(event.target) && !options.contains(event.target);
    if (clickedOutside) {
      closeFunction();
    }
  };
}

/** Sets up a document click handler to close dropdowns when clicking outside.
 * @param {HTMLElement} categoryDropdown - The category dropdown element.
 * @param {HTMLElement} categoryOptions - The category options container element.
 * @param {HTMLElement} assignedUsersDropdown - The assigned users dropdown element.
 * @param {HTMLElement} assignedUsersOptions - The assigned users options container element.
 */
function setupDocumentClickHandler(categoryDropdown, categoryOptions, assignedUsersDropdown, assignedUsersOptions) {
  document.addEventListener("click", (event) => {
    if (categoryDropdown && categoryOptions) {
      handleOutsideClick(categoryDropdown, categoryOptions, closeCategoryDropdown)(event);
    }

    if (assignedUsersDropdown && assignedUsersOptions) {
      handleOutsideClick(assignedUsersDropdown, assignedUsersOptions, closeAssignedToDropdown)(event);
    }
  });
}

/** Closes the category dropdown and resets its state.
 */
export function closeCategoryDropdown() {
  const wrapper = document.getElementById("category-options-wrapper");
  const container = document.getElementById("category-options-container");
  const dropdownIconTwo = document.getElementById("dropdown-icon-two");
  const dropdownIconContainerTwo = document.getElementById("dropdown-icon-container-two");
  const input = document.getElementById("dropdown-category");

  if (!wrapper || !container) return;

  if (wrapper.classList.contains("open")) {
    input.classList.remove("border-light-blue");
    wrapper.classList.remove("open");
    dropdownIconTwo?.classList.remove("open");
    dropdownIconContainerTwo?.classList.remove("active");

    setTimeout(() => { container.innerHTML = ""; }, 300);
  }
}

/** Closes the assigned users dropdown and resets its state.
 */
export function closeAssignedToDropdown() {
  const wrapper = document.getElementById("assigned-to-options-wrapper");
  const container = document.getElementById("assigned-to-options-container");
  const dropdownIconOne = document.getElementById("dropdown-icon-one");
  const dropdownIconContainerOne = document.getElementById("dropdown-icon-container-one");

  if (!wrapper || !container) return;

  if (wrapper.classList.contains("open-assigned-to")) {
    setBorderColorGrey("dropdown-assigned-to");
    wrapper.classList.remove("open-assigned-to");
    dropdownIconOne?.classList.remove("open");
    dropdownIconContainerOne?.classList.remove("active");

    setTimeout(() => { container.innerHTML = ""; }, 300);
  }
}

/** Clears the invalid fields by removing the "invalid" class and hiding error messages.
 */
export function clearInvalidFields() {
  const invalidFields = INVALID_FIELDS_IDS.map((id) =>
    document.getElementById(id)
  );
  const errorFields = ERROR_FIELDS_IDS.map((id) => document.getElementById(id));

  invalidFields.forEach((field) => {
    if (field) field.classList.remove("invalid");
  });

  errorFields.forEach((error) => {
    if (error) error.classList.remove("d-flex");
  });
}

/** Sets the category based on the task object for the card/edit overlay.
 * @param {string} categoryName - The name of the category to set.
 */
export function setCategoryFromTaskForCard(categoryName) {
  if (!categoryName) {
    console.warn("[Dropdown-Card] No category passed!");
    return;
  }
  const fakeOptionElement = document.createElement("div");
  fakeOptionElement.textContent = categoryName;
  fakeOptionElement.dataset.category = categoryName;
  setCategory(fakeOptionElement);
  rotateCategoryDropdownIcon()
}

/** Rotates the category dropdown icon when the dropdown is opened or closed.
 */
function rotateCategoryDropdownIcon() {
  const dropdownIconTwo = document.getElementById("dropdown-icon-two");

  if (dropdownIconTwo) dropdownIconTwo.classList.toggle("open");
}

/** Sets the assigned contacts based on the task object for the card/edit overlay.
 * @param {Array} assignedUsers - The array of assigned contacts.
 */
export function setAssignedContactsFromTaskForCard(assignedUsers) {
  if (!Array.isArray(assignedUsers)) {
    console.warn("[Dropdown-Card] assignedUsers is no Array!", assignedUsers);
    return;
  }

  selectedContacts.length = 0;

  assignedUsers.forEach((sel) => {
    if (typeof sel === "string") processStringContact(sel);
    else processObjectContact(sel);
  });

  getAssignedToOptions();
}

/** Finds a contact by its ID from the current contacts or Firebase data.
 * @param {string} idVal - The ID of the contact to find.
 */
function findContactById(idVal) {
  const mapContact = contactsMap.get(idVal);
  if (mapContact) return mapContact;

  return currentContacts.find(
    (c) =>
      c.id === idVal ||
      c.contactId === idVal ||
      c.contactID === idVal ||
      c.uid === idVal ||
      c.firebaseId === idVal
  );
}

/** Gets a contact from Firebase data by its ID.
 * @param {string} idVal - The ID of the contact to retrieve.
 */
function getFirebaseContact(idVal) {
  if (typeof firebaseData === "object" && firebaseData.contacts && firebaseData.contacts[idVal]) {
    return { ...firebaseData.contacts[idVal], id: idVal };
  }
  return null;
}

/** Finds a contact by its name from the current contacts or Firebase data.
 * @param {string} name - The name of the contact to find.
 */
function findContactByName(name) {
  const found = currentContacts.find((c) => c.name === name);
  if (!found && typeof firebaseData === "object" && firebaseData.contacts) {
    const foundEntry = Object.entries(firebaseData.contacts).find(([key, c]) => c.name === name);
    if (foundEntry) return { ...foundEntry[1], id: foundEntry[0] };
  }
  return found || null;
}

/** Processes a string contact by finding it in the current contacts or Firebase data.
 * @param {string} sel - The ID of the contact to process.
 */
function processStringContact(sel) {
  const idVal = sel;
  let found = findContactById(idVal) || getFirebaseContact(idVal);

  if (found) {
    selectedContacts.push(found);
  } else {
    const byName = findContactByName(idVal);
    if (byName) selectedContacts.push(byName);
    else console.warn("[Dropdown-Card] Contact not found (ID/Name):", sel);
  }
}

/** Processes an object contact by checking its ID or name and finding it in the current contacts or Firebase data.
 * @param {Object} sel - The contact object to process.
 */
function processObjectContact(sel) {
  const idVal = sel.id || sel.contactId || sel.contactID || sel.uid || sel.firebaseId;

  if (idVal) {
    let found = findContactById(idVal) || getFirebaseContact(idVal);
    if (found) {
      selectedContacts.push(found);
    } else {
      selectedContacts.push(sel);
      console.warn("[Dropdown-Card] Contact not found (object with ID, take sel):", sel);
    }
  } else if (sel.name) {
    const found = findContactByName(sel.name);
    if (found) {
      selectedContacts.push(found);
    } else {
      selectedContacts.push(sel);
      console.warn("[Dropdown-Card] Contact not found (object with Name, take sel):", sel);
    }
  } else {
    console.warn("[Dropdown-Card] Unknown contact format:", sel);
  }
}
export let currentContacts = [];
export let selectedCategory = null;
export let selectedContacts = [];
export const contactsMap = new Map();

/** Updates the selected category value.
 * @param {string} category - The category value to set.
 */
export function updateSelectedCategory(category) {
  selectedCategory = category;
}

/** Sets the sorted contacts for the dropdown.
 * @param {Array} contactsData - The array of contacts to sort and set.
 */
export function setSortedContacts(contactsData) {
  currentContacts = contactsData.sort((a, b) => {
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    return nameA.localeCompare(nameB, "de", { sensitivity: "base" });
  });
}

/** Resets the dropdown state.
 * Clears the selected category and contacts.
 */
export function resetDropdownState() {
  selectedCategory = null;
  selectedContacts = [];
}

/** Removes a contact from selectedContacts by ID or name.
 * @param {string} contactId - The ID of the contact to remove.
 * @param {string} contactName - The name of the contact to remove.
 * @returns {boolean} True if contact was removed, false otherwise.
 */
export function removeSelectedContact(contactId, contactName) {
  const index = selectedContacts.findIndex(
    c => c.id === contactId || c.name === contactName
  );

  if (index !== -1) {
    selectedContacts.splice(index, 1);
    return true;
  }
  return false;
}

/** Sets the border color of the input to grey.
 * @param {string} id - The ID of the input element.
 */
export function setBorderColorGrey(id) {
  const input = document.getElementById(id);
  if (input) {
    input.classList.remove("border-light-blue");
  }
}

/** Toggles the dropdown icon for category or assigned contacts.
 * @param {string} id - The ID of the dropdown to toggle.
 */
export function toggleDropdownIcon(id) {
  const elements = getIconElements(id);
  if (!elements) return;

  const { icon, container } = elements;
  icon.classList.toggle("open");
  container.classList.toggle("active");
}

/** Gets the icon elements based on dropdown type.
 * @param {string} id - The dropdown type ("category" or "assignedTo").
 * @returns {Object|null} The icon and container elements.
 */
function getIconElements(id) {
  if (id === "category") {
    return {
      icon: document.getElementById("dropdown-icon-two"),
      container: document.getElementById("dropdown-icon-container-two")
    };
  } else if (id === "assignedTo") {
    return {
      icon: document.getElementById("dropdown-icon-one"),
      container: document.getElementById("dropdown-icon-container-one")
    };
  }
  return null;
}

/** Removes a contact from the selected contacts.
 * @param {number} index - The index of the contact to remove.
 */
export function removeContact(index) {
  selectedContacts.splice(index, 1);
}

/** Clears the assigned contacts area.
 * Resets the selected contacts and clears the assigned area.
 */
export function clearAssignedTo() {
  const assignedToArea = document.getElementById("assigned-to-area");
  selectedContacts.length = 0;
  if (assignedToArea) assignedToArea.innerHTML = "";
}

/** Checks if a contact is selected.
 * @param {string} name - The name of the contact.
 * @param {string} initials - The initials of the contact.
 * @param {string} avatarColor - The avatar color of the contact.
 * @return {boolean} True if the contact is selected, otherwise false.
 */
export function isContactSelected(name, initials, avatarColor) {
  return selectedContacts.some(
    selected => selected.name === name && 
                selected.initials === initials && 
                selected.avatarColor === avatarColor
  );
}

/** Filters contacts based on a search query.
 * @param {string} query - The search query.
 */
export async function filterContacts(query) {
  const container = document.getElementById("assigned-to-options-container");
  if (!container) return;

  container.innerHTML = "";
  const filtered = currentContacts.filter(contact => contact.name.toLowerCase().includes(query));

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results">No contacts found.</div>';
    return;
  }

  const { renderFilteredContacts } = await import("./dropdown-menu-contacts.js");
  renderFilteredContacts(container, filtered);
}
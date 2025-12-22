import { renderAssignedToContacts } from "../templates/add-task-template.js";
import { currentContacts, selectedContacts, contactsMap, toggleDropdownIcon, setBorderColorGrey } from "./dropdown-menu-core.js";
import { renderContactCircle, renderExtraCircle } from "./dropdown-menu-display.js";

/** Toggles the assigned contacts dropdown.
 */
export function toggleAssignedToDropdown() {
    const { wrapper, container, input } = getAssignedElements();
    if (!wrapper || !container) return;

    const isOpen = wrapper.classList.contains("open-assigned-to");
    toggleDropdownIcon("assignedTo");

    isOpen ? closeAssignedDropdown(wrapper, container) : openAssignedDropdown(wrapper, input);
}

/** Gets assigned dropdown DOM elements.
 * @returns {Object} Assigned dropdown elements.
 */
function getAssignedElements() {
    return {
        wrapper: document.getElementById("assigned-to-options-wrapper"),
        container: document.getElementById("assigned-to-options-container"),
        input: document.getElementById("dropdown-assigned-to")
    };
}

/** Opens the assigned contacts dropdown.
 * @param {HTMLElement} wrapper - Wrapper element.
 * @param {HTMLElement} input - Input element.
 */
function openAssignedDropdown(wrapper, input) {
    input.classList.add("border-light-blue");
    getAssignedToOptions();
    requestAnimationFrame(() => wrapper.classList.add("open-assigned-to"));
}

/** Closes the assigned contacts dropdown.
 * @param {HTMLElement} wrapper - Wrapper element.
 * @param {HTMLElement} container - Container element.
 */
function closeAssignedDropdown(wrapper, container) {
    setBorderColorGrey("dropdown-assigned-to");
    wrapper.classList.remove("open-assigned-to");
    setTimeout(() => container.innerHTML = "", 300);
}

/** Gets the assigned contacts options.
 * Populates the dropdown with contacts.
 */
export function getAssignedToOptions() {
    const currentUser = sessionStorage.getItem('currentUser');
    const contactContainer = document.getElementById('assigned-to-options-container');
    if (!contactContainer) return;

    const sortedContacts = sortContactsWithUserFirst(currentContacts, currentUser);
    renderContactsList(sortedContacts, contactContainer, currentUser);
    displaySelectedContacts();
}

/** Sorts contacts with the current user first.
 * @param {Array} contacts - The list of contacts.
 * @param {string} currentUser - The current user name.
 * @returns {Array} Sorted contacts.
 */
function sortContactsWithUserFirst(contacts, currentUser) {
    return [...contacts].sort((a, b) => {
        if (a.name === currentUser) return -1;
        if (b.name === currentUser) return 1;
        return 0;
    });
}

/** Renders the contacts list in the dropdown.
 * @param {Array} contacts - Contacts to render.
 * @param {HTMLElement} contactContainer - Container element.
 * @param {string} currentUser - Current user name.
 */
function renderContactsList(contacts, contactContainer, currentUser) {
    contactContainer.innerHTML = '';

    contacts.forEach((contact, i) => {
        const { name, initials, avatarColor, avatarImage } = contact;
        const displayName = name === currentUser ? `${name} (You)` : name;
        const contactId = contact?.id ?? i;

        contactsMap.set(contactId, contact);
        contactContainer.innerHTML += renderAssignedToContacts(
            contactId, displayName, initials, avatarColor, avatarImage
        );
    });
}

/** Selects a contact by name for demo purposes.
 * @param {string} nameToSelect - The name to select.
 */
export function demoSelectAssignedContact(nameToSelect = "Anna Schmidt") {
    const contactToSelect = currentContacts.find(c => c.name === nameToSelect);

    if (!contactToSelect) {
        console.warn(`Contact ${nameToSelect} not found.`);
        return;
    }

    selectedContacts.length = 0;
    selectedContacts.push(contactToSelect);
    getAssignedToOptions();
}

/** Toggles the selection of a contact.
 * @param {HTMLElement} contactElement - Contact element.
 * @param {string} name - Contact name.
 * @param {string} initials - Contact initials.
 * @param {string} avatarColor - Avatar color.
 * @param {string} avatarImage - Avatar image.
 * @param {string} id - Contact ID.
 */
export function toggleSelectContacts(contactElement, name, initials, avatarColor, avatarImage, id) {
    const contact = { name, initials, avatarColor, avatarImage, id };
    const index = getContactIndex(contact);

    index === -1 ? addContactToSelection(contactElement, contact) : removeContactFromSelection(contactElement, index);

    displaySelectedContacts();
}

/** Gets the index of a contact in selected contacts.
 * @param {Object} contact - Contact to find.
 * @returns {number} Index or -1.
 */
function getContactIndex(contact) {
    return selectedContacts.findIndex(
        s => s.name === contact.name &&
            s.initials === contact.initials &&
            s.avatarColor === contact.avatarColor
    );
}

/** Adds a contact to the selection.
 * @param {HTMLElement} contactElement - Contact element.
 * @param {Object} contact - Contact to add.
 */
function addContactToSelection(contactElement, contact) {
    selectedContacts.unshift(contact);
    updateContactUI(contactElement, true);
}

/** Removes a contact from the selection.
 * @param {HTMLElement} contactElement - Contact element.
 * @param {number} index - Index to remove.
 */
function removeContactFromSelection(contactElement, index) {
    selectedContacts.splice(index, 1);
    updateContactUI(contactElement, false);
}

/** Updates contact UI (checkbox and styling).
 * @param {HTMLElement} contactElement - Contact element.
 * @param {boolean} isSelected - Selection state.
 */
function updateContactUI(contactElement, isSelected) {
    const checkboxIcon = contactElement.querySelector(".checkbox-icon");

    if (isSelected) {
        contactElement.classList.add("assigned");
        checkboxIcon.src = "../assets/icons/btn/checkbox-filled-white.svg";
        checkboxIcon.classList.add("checked");
    } else {
        contactElement.classList.remove("assigned");
        checkboxIcon.src = "../assets/icons/btn/checkbox-empty-black.svg";
        checkboxIcon.classList.remove("checked");
    }
}

/** Renders the filtered contacts.
 * @param {HTMLElement} container - Container element.
 * @param {Array} filteredContacts - Filtered contacts.
 */
export function renderFilteredContacts(container, filteredContacts) {
    filteredContacts.forEach((contact, i) => {
        container.innerHTML += renderAssignedToContacts(
            i, contact.name, contact.initials, contact.avatarColor, contact.avatarImage
        );
    });
}

/** Displays the selected contacts in the assigned to area.
 */
export function displaySelectedContacts() {
    const assignedToArea = document.getElementById("assigned-to-area");
    const assignedToAreaFull = document.getElementById("assigned-to-area-full");
    const assignedToWrapper = document.getElementById("assigned-to-options-wrapper");
    if (!assignedToArea) return;

    storeContactsForGallery();
    clearAndRender(assignedToArea, selectedContacts.slice(0, 3), true);

    if (assignedToAreaFull) {
        clearAndRender(assignedToAreaFull, selectedContacts, false);
    }

    updateWrapperState(assignedToWrapper);
}

/** Stores contacts for gallery viewer.
 */
function storeContactsForGallery() {
    window.currentTaskContactsWithAvatars = selectedContacts.map(c => ({
        id: c.id || c.name,
        name: c.name,
        initials: c.initials,
        avatarColor: c.avatarColor,
        avatarImage: c.avatarImage || null
    }));
}

/** Updates wrapper state based on selection.
 * @param {HTMLElement} wrapper - Wrapper element.
 */
function updateWrapperState(wrapper) {
    if (!wrapper) return;

    selectedContacts.length > 0 ? wrapper.classList.add("has-selected-contacts") : wrapper.classList.remove("has-selected-contacts");
}

/** Clears and renders contact circles.
 * @param {HTMLElement} container - Container element.
 * @param {Array} contacts - Contacts to render.
 * @param {boolean} withExtra - Show extra count.
 */
function clearAndRender(container, contacts, withExtra) {
    container.innerHTML = '';
    const mainContainer = createMainContainer();

    contacts.forEach(contact => renderContactCircle(contact, mainContainer));

    if (withExtra) {
        addExtraCircle(contacts.length, mainContainer);
    }

    container.appendChild(mainContainer);
}

/** Creates main container for contacts.
 * @returns {HTMLElement} Main container.
 */
function createMainContainer() {
    const container = document.createElement('div');
    container.className = 'assigned-main-container';
    return container;
}

/** Adds extra count circle if needed.
 * @param {number} displayedCount - Displayed contacts count.
 * @param {HTMLElement} container - Container element.
 */
function addExtraCircle(displayedCount, container) {
    const extraCount = selectedContacts.length - displayedCount;
    if (extraCount > 0) {
        renderExtraCircle(extraCount, container);
    }
}
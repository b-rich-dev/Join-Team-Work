import { selectedContacts } from "./dropdown-menu-core.js";
import { displaySelectedContacts } from "./dropdown-menu-contacts.js";

/** Finds delete button in viewer.
 * @returns {HTMLElement|null} Delete button.
 */
export function findDeleteButton() {
    const selectors = ['li[data-viewer-action="delete"] button', 'button[data-viewer-action="delete"]', '.viewer-toolbar li[data-viewer-action="delete"]', '[data-viewer-action="delete"]'];

    for (const selector of selectors) {
        const button = document.querySelector(selector);
        if (button) return button;
    }
    return null;
}

/** Clones button to remove listeners.
 * @param {HTMLElement} button - Button to clone.
 * @returns {HTMLElement} New button.
 */
export function replaceButtonWithClone(button) {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    return newButton;
}

/** Updates dropdown checkbox for contact.
 * @param {Object} contact - Contact object.
 */
export function updateContactCheckbox(contact) {
    const contactOption = document.querySelector(`.contact-option[data-name="${contact.name}"][data-initials="${contact.initials}"]`);

    if (contactOption) {
        contactOption.classList.remove("assigned");
        const checkboxIcon = contactOption.querySelector(".checkbox-icon");
        if (checkboxIcon) {
            checkboxIcon.src = "../assets/icons/btn/checkbox-empty-black.svg";
            checkboxIcon.classList.remove("checked");
        }
    }
}

/** Closes viewer and updates display.
 */
export function closeViewerAndUpdate() {
    if (window.assignedContactsViewer) {
        try {
            window.assignedContactsViewer.hide();
        } catch (e) { }
    }
    setTimeout(() => displaySelectedContacts(), 100);
}

/** Removes contact from viewer.
 * @param {Object} contact - Contact to remove.
 */
export function removeContactFromViewer(contact) {
    const index = selectedContacts.findIndex(
        c => c.name === contact.name && c.initials === contact.initials
    );

    if (index !== -1) {
        selectedContacts.splice(index, 1);
        updateContactCheckbox(contact);
        closeViewerAndUpdate();
    }
}

/** Handles contact deletion.
 * @param {Event} event - Click event.
 * @param {Array} contacts - Contacts array.
 */
export function handleContactDeletion(event, contacts) {
    event.preventDefault();
    event.stopPropagation();

    const currentIndex = window.assignedContactsViewer?.index || 0;
    const currentContact = contacts[currentIndex];

    if (currentContact) removeContactFromViewer(currentContact);
}

/** Sets up delete button handler.
 * @param {HTMLElement} viewerContainer - Viewer container.
 * @param {Array} contacts - Contacts array.
 */
export function setupDeleteButtonHandler(viewerContainer, contacts) {
    const deleteButton = findDeleteButton();
    if (!deleteButton) return;

    const newDeleteButton = replaceButtonWithClone(deleteButton);
    newDeleteButton.addEventListener('click', (event) => {
        handleContactDeletion(event, contacts);
    });
}
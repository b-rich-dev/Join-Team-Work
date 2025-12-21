/** * Removes a contact from the task assignment (for edit mode).
 * @param {string} contactId - The ID of the contact to remove
 * @param {string} contactName - The name of the contact
 */
export async function removeContactFromTaskAssignment(contactId, contactName) {
    try {
        const dropdownModule = await import('../events/dropdown-menu.js');
        const removed = dropdownModule.removeSelectedContact(contactId, contactName);

        if (!removed) {
            console.warn(`Contact ${contactName} not found in selectedContacts`);
            return;
        }

        updateCurrentTaskContacts(contactId, contactName);
        await refreshAssignedContactsUI(dropdownModule.selectedContacts);
    } catch (error) {
        console.error('Error removing contact from assignment:', error);
    }
}

/** * Updates the global currentTaskContactsWithAvatars by removing the specified contact.
 * @param {string} contactId - The ID of the contact to remove
 * @param {string} contactName - The name of the contact to remove
 */
function updateCurrentTaskContacts(contactId, contactName) {
    if (!window.currentTaskContactsWithAvatars) return;

    const avatarIndex = window.currentTaskContactsWithAvatars.findIndex(c =>
        c.id === contactId || c.name === contactName
    );
    if (avatarIndex !== -1) {
        window.currentTaskContactsWithAvatars.splice(avatarIndex, 1);
    }
}

/** * Refreshes the assigned contacts UI areas.
 * @param {Array} selectedContacts - Array of currently selected contact objects
 */
async function refreshAssignedContactsUI(selectedContacts) {
    const assignedToArea = document.getElementById("assigned-to-area");
    const assignedToAreaFull = document.getElementById("assigned-to-area-full");

    if (assignedToArea) renderAssignedArea(assignedToArea, selectedContacts, 3);
    if (assignedToAreaFull) renderAssignedArea(assignedToAreaFull, selectedContacts, Infinity);
}

/** * Renders the assigned contacts area with circles for each contact.
 * @param {HTMLElement} container - The container element to render into.
 * @param {Array} contacts - Array of contact objects to display.
 * @param {number} limit - Maximum number of contacts to display (use Infinity for no limit).
 */
function renderAssignedArea(container, contacts, limit) {
    container.innerHTML = '';
    const mainContainer = document.createElement('div');
    mainContainer.className = 'assigned-main-container';

    contacts.slice(0, limit).forEach(contact => {
        mainContainer.appendChild(createAssignedCircle(contact));
    });

    if (limit < Infinity && contacts.length > limit) mainContainer.appendChild(createExtraCountCircle(contacts.length - limit));

    container.appendChild(mainContainer);
}

/** * Creates a circle element for an assigned contact.
 * @param {Object} contact - The contact object
 * @returns {HTMLElement} The circle element representing the contact
 */
function createAssignedCircle(contact) {
    const div = document.createElement('div');
    div.className = 'assigned-initials-circle';
    div.style.flex = '0 0 auto';

    if (contact.avatarImage) applyAvatarImageStyles(div, contact);
    else applyInitialsStyles(div, contact);

    return div;
}

/** * Applies styles for avatar image display in the assigned contact circle.
 * @param {HTMLElement} div - The circle element
 * @param {Object} contact - The contact object
 */
function applyAvatarImageStyles(div, contact) {
    div.style.backgroundImage = `url(${contact.avatarImage})`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    div.textContent = '';
    div.style.cursor = 'pointer';

    div.onclick = function (event) {
        event.stopPropagation();
        event.preventDefault();
        if (typeof window.showTaskContactAvatarGallery === 'function') window.showTaskContactAvatarGallery(contact.id || contact.name, true);
        return false;
    };
}

/** * Applies styles for initials display in the assigned contact circle.
 * @param {HTMLElement} div - The circle element
 * @param {Object} contact - The contact object
 */
function applyInitialsStyles(div, contact) {
    div.style.backgroundColor = `var(${contact.avatarColor})`;
    div.textContent = contact.initials;
}

/** * Creates a circle element indicating extra assigned contacts.
 * @param {number} extraCount - The number of extra contacts not shown.
 * @returns {HTMLElement} The circle element displaying the extra count.
 */
function createExtraCountCircle(extraCount) {
    const div = document.createElement('div');
    div.className = 'assigned-initials-circle';
    div.style.backgroundColor = 'var(--sidebarGrey)';
    div.textContent = `… +${extraCount}`;
    div.style.fontSize = '0.8rem';
    div.style.flex = '0 0 auto';
    return div;
}
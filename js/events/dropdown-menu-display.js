/** Renders a contact circle in the assigned to area.
 * @param {Object} contact - Contact object.
 * @param {HTMLElement} container - Container element.
 */
export function renderContactCircle(contact, container) {
    const initialsDiv = createCircleElement(contact);
    setupCircleClickHandler(initialsDiv, contact);
    container.appendChild(initialsDiv);
}

/** Creates a circle element for a contact.
 * @param {Object} contact - Contact object.
 * @returns {HTMLElement} Circle element.
 */
function createCircleElement(contact) {
    const initialsDiv = document.createElement('div');
    initialsDiv.className = 'assigned-initials-circle';
    initialsDiv.style.cursor = 'pointer';
    initialsDiv.style.flex = '0 0 auto';

    contact.avatarImage ? setAvatarImage(initialsDiv, contact.avatarImage) : setInitials(initialsDiv, contact);

    return initialsDiv;
}

/** Sets avatar image on circle element.
 * @param {HTMLElement} element - Circle element.
 * @param {string|Object} avatarImage - Avatar image data.
 */
function setAvatarImage(element, avatarImage) {
    const base64 = typeof avatarImage === 'string' ? avatarImage : (avatarImage?.base64 || avatarImage);

    element.style.backgroundImage = `url(${base64})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
    element.textContent = '';
}

/** Sets initials on circle element.
 * @param {HTMLElement} element - Circle element.
 * @param {Object} contact - Contact object.
 */
function setInitials(element, contact) {
    element.style.backgroundColor = `var(${contact.avatarColor})`;
    element.textContent = contact.initials;
}

/** Sets up click handler for circle.
 * @param {HTMLElement} element - Circle element.
 * @param {Object} contact - Contact object.
 */
function setupCircleClickHandler(element, contact) {
    element.onclick = function (event) {
        event.stopPropagation();
        event.preventDefault();

        import('./dropdown-menu-viewer.js').then(module => {
            module.openAssignedContactsGallery(contact.id || contact.name);
        });

        return false;
    };
}

/** Renders an extra count circle.
 * @param {number} extraCount - Extra contacts count.
 * @param {HTMLElement} container - Container element.
 */
export function renderExtraCircle(extraCount, container) {
    const extraDiv = document.createElement('div');
    extraDiv.className = 'assigned-initials-circle';
    extraDiv.style.backgroundColor = 'var(--sidebarGrey)';
    extraDiv.textContent = `… +${extraCount}`;
    extraDiv.style.fontSize = '0.8rem';
    extraDiv.style.flex = '0 0 auto';
    container.appendChild(extraDiv);
}
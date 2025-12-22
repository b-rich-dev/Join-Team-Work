/** Creates a canvas element.
 * @returns {HTMLCanvasElement} Canvas element.
 */
export function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    return canvas;
}

/** Draws background on canvas.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {string} avatarColor - Avatar color CSS variable.
 */
export function drawBackground(ctx, avatarColor) {
    const color = avatarColor ? getComputedStyle(document.documentElement).getPropertyValue(avatarColor).trim() : '#2A3647';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 200, 200);
}

/** Draws initials on canvas.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {string} initials - Contact initials.
 */
export function drawInitials(ctx, initials) {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials || '', 100, 100);
}

/** Creates a canvas with initials.
 * @param {Object} contact - Contact object.
 * @returns {string} Data URL of canvas.
 */
export function createInitialsCanvas(contact) {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d');

    drawBackground(ctx, contact.avatarColor);
    drawInitials(ctx, contact.initials);

    return canvas.toDataURL();
}

/** Creates or replaces gallery container.
 * @returns {HTMLElement} Container element.
 */
export function createOrReplaceContainer() {
    let container = document.getElementById('temp-assigned-contacts-gallery');
    if (container) container.remove();

    container = document.createElement('div');
    container.id = 'temp-assigned-contacts-gallery';
    container.style.display = 'none';
    return container;
}

/** Creates image for contact.
 * @param {Object} contact - Contact object.
 * @param {Function} getAvatarBase64 - Avatar base64 getter.
 * @returns {HTMLImageElement} Image element.
 */
export function createContactImage(contact, getAvatarBase64) {
    const img = document.createElement('img');
    img.src = contact.avatarImage ? getAvatarBase64(contact.avatarImage) : createInitialsCanvas(contact);
    img.alt = contact.name;
    img.dataset.contactId = contact.id;
    return img;
}

/** Creates and populates viewer container.
 * @param {Array} contacts - Contacts array.
 * @param {string} selectedContactId - Selected contact ID.
 * @param {Function} getAvatarBase64 - Avatar base64 getter.
 * @returns {{container: HTMLElement, startIndex: number}}
 */
export function createViewerContainer(contacts, selectedContactId, getAvatarBase64) {
    const container = createOrReplaceContainer();
    let startIndex = 0;

    contacts.forEach((contact, index) => {
        const img = createContactImage(contact, getAvatarBase64);
        container.appendChild(img);
        if (contact.id === selectedContactId) startIndex = index;
    });

    document.body.appendChild(container);
    return { container, startIndex };
}
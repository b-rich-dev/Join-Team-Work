import { getAvatarBase64 } from '../utils/avatar-utils.js';

let contactAvatarViewer = null;

/** * Shows a gallery of all task contact avatars with navigation.
 * @param {string} selectedContactId - The ID of the contact whose avatar was clicked.
 * @param {boolean} isEditMode - Whether the gallery is shown in edit mode (enables delete button).
 */
export async function showTaskContactAvatarGallery(selectedContactId, isEditMode = false) {
    const contacts = window.currentTaskContactsWithAvatars || [];
    if (contacts.length === 0 || typeof Viewer !== 'function') return;

    destroyExistingGalleryViewer();
    const viewerContainer = prepareGalleryContainer();
    const avatarMetadata = extractAvatarMetadata(contacts);
    createGalleryImages(viewerContainer, contacts);
    document.body.appendChild(viewerContainer);

    contactAvatarViewer = createGalleryViewer(viewerContainer, contacts, avatarMetadata, isEditMode);
    showGalleryAtIndex(contactAvatarViewer, contacts, selectedContactId);
}

/** * Destroys any existing gallery viewer and removes its container from the DOM. 
*/
function destroyExistingGalleryViewer() {
    if (contactAvatarViewer) {
        try { contactAvatarViewer.destroy(); } catch (e) { console.warn('Error destroying viewer:', e); }
        contactAvatarViewer = null;
    }
    const existing = document.getElementById('temp-avatar-gallery');
    if (existing) existing.remove();
}

/** * Prepares a hidden container for the gallery viewer.
 * @returns {HTMLElement} The gallery container element.
 */
function prepareGalleryContainer() {
    const container = document.createElement('div');
    container.id = 'temp-avatar-gallery';
    container.style.display = 'none';
    return container;
}

/** * Extracts avatar metadata for each contact.
 * @param {Array} contacts - Array of contact objects.
 * @returns {Array} Array of metadata objects with name, type, and size.
 */
function extractAvatarMetadata(contacts) {
    return contacts.map(contact => {
        if (!contact.avatarImage) return { name: contact.name, type: 'image/jpeg', size: 0 };

        if (typeof contact.avatarImage === 'object' && contact.avatarImage.name) {
            return {
                name: contact.avatarImage.name,
                type: contact.avatarImage.type || 'image/jpeg',
                size: contact.avatarImage.size || 0
            };
        }

        return extractMetadataFromBase64(contact.avatarImage, contact.name);
    });
}

/** * Extracts metadata from a base64 string.
 * @param {string} base64String - The base64 encoded image string.
 * @param {string} contactName - The name of the contact (for filename).
 * @returns {object} The metadata object with name, type, and size.
 */
function extractMetadataFromBase64(base64String, contactName) {
    const mimeMatch = base64String.match(/^data:([^;]+);/);
    const type = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = type.split('/')[1] || 'jpg';
    const base64Data = base64String.split(',')[1] || '';
    const size = Math.floor((base64Data.length * 3) / 4);

    return { name: `${contactName}.${ext}`, type, size };
}

/** * Creates image elements for each contact avatar and appends them to the container.
 * @param {HTMLElement} container - The gallery container element.
 * @param {Array} contacts - Array of contact objects.
 */
function createGalleryImages(container, contacts) {
    contacts.forEach((contact, index) => {
        const img = document.createElement('img');
        img.src = contact.avatarImage ? getAvatarBase64(contact.avatarImage) || '' : createInitialsCanvas(contact);
        img.alt = contact.name;
        img.dataset.contactId = contact.id;
        img.dataset.contactIndex = index;
        container.appendChild(img);
    });
}

/** * Creates a base64 image from contact initials for avatar display.
 * @param {Object} contact - The contact object containing initials and avatarColor.
 * @returns {string} The base64 data URL of the generated image.
 */
function createInitialsCanvas(contact) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    const color = contact.avatarColor ? getComputedStyle(document.documentElement).getPropertyValue(contact.avatarColor).trim() : '#2A3647';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 200, 200);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(contact.initials || '', 100, 100);

    return canvas.toDataURL();
}

/** * Creates and configures the gallery viewer instance.
 * @param {HTMLElement} container - The gallery container element.
 * @param {Array} contacts - Array of contact objects.
 * @param {Array} metadata - Array of avatar metadata objects.
 * @param {boolean} isEditMode - Whether the gallery is in edit mode.
 * @returns {object} The Viewer instance.
 */
function createGalleryViewer(container, contacts, metadata, isEditMode) {
    return new Viewer(container, {
        inline: false,
        button: true,
        navbar: true,
        title: [1, (image) => createGalleryTitle(image, contacts, metadata)],
        toolbar: createGalleryToolbar(contacts, isEditMode),
        tooltip: true,
        movable: true,
        zoomable: true,
        rotatable: true,
        transition: true,
        fullscreen: true,
        keyboard: true,
        download: (url) => handleGalleryDownload(url, container, contacts),
        delete: isEditMode ? () => handleGalleryDelete(contacts) : undefined,
        hide: () => handleGalleryHide(container),
        hidden: handleGalleryHidden
    });
}

/** * Finds the actual index by matching image src with container images.
 * @param {string} imageSrc - The src attribute of the image.
 * @returns {number} The index or -1 if not found.
 */
function findIndexByImageSrc(imageSrc) {
    const container = document.getElementById('temp-avatar-gallery');
    if (!container) return -1;
    
    const allImages = container.querySelectorAll('img');
    for (let i = 0; i < allImages.length; i++) {
        if (allImages[i].src === imageSrc) return i;
    }
    return -1;
}

/** * Formats the title for a contact with avatar metadata.
 * @param {object} contact - The contact object.
 * @param {object} meta - The metadata object.
 * @returns {string} The formatted title string.
 */
function formatContactTitle(contact, meta) {
    if (contact.avatarImage && meta) {
        const fileType = meta.type?.split('/')[1]?.toUpperCase() || 'IMAGE';
        const sizeKB = meta.size > 0 ? (meta.size / 1024).toFixed(2) : '0.00';
        return `${contact.name}   •   ${fileType}   •   ${sizeKB} KB`;
    }
    return contact.name;
}

/** * Creates the title for the gallery viewer based on the current image.
 * @param {object} image - The image object from the viewer.
 * @param {Array} contacts - Array of contact objects.
 * @param {Array} metadata - Array of avatar metadata objects.
 * @returns {string} The formatted title string.
 */
function createGalleryTitle(image, contacts, metadata) {
    let actualIndex = findContactIndexByImage(image, contacts);
    if (actualIndex === -1 && image?.src) actualIndex = findIndexByImageSrc(image.src);
    if (actualIndex === -1 || actualIndex >= contacts.length) return 'Contact';

    return formatContactTitle(contacts[actualIndex], metadata[actualIndex]);
}

/** * Finds the index of the contact corresponding to the displayed image.
 * @param {object} image - The image object from the viewer.
 * @param {Array} contacts - Array of contact objects.
 * @returns {number} The index of the contact in the contacts array, or -1 if not found.
 */
function findContactIndexByImage(image, contacts) {
    if (!image?.src) return -1;

    let actualIndex = contacts.findIndex(contact => {
        if (!contact.avatarImage) return false;
        const base64 = getAvatarBase64(contact.avatarImage);
        return base64 === image.src;
    });

    if (actualIndex === -1 && image.dataset?.contactIndex !== undefined) actualIndex = parseInt(image.dataset.contactIndex, 10);

    return actualIndex;
}

/** * Creates the toolbar configuration for the gallery viewer.
 * @param {Array} contacts - Array of contact objects.
 * @param {boolean} isEditMode - Whether the gallery is in edit mode.
 * @returns {Object} The toolbar configuration object.
 */
function createGalleryToolbar(contacts, isEditMode) {
    return {
        download: { show: 1, size: 'large' },
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: contacts.length > 1 ? 1 : 0,
        play: contacts.length > 1 ? { show: 1, size: 'large' } : 0,
        next: contacts.length > 1 ? 1 : 0,
        rotateLeft: 1,
        rotateRight: 1,
        delete: isEditMode ? { show: 1, size: 'large' } : 0
    };
}

/** * Handles avatar download from the gallery.
 * @param {string} url - The URL of the avatar image to download.
 * @param {HTMLElement} container - The gallery container element.
 * @param {Array} contacts - Array of contact objects.
 */
function handleGalleryDownload(url, container, contacts) {
    const activeImage = container.querySelector(`img[src="${url}"]`);
    const contactId = activeImage?.dataset.contactId || '';
    const contact = contacts.find(c => c.id === contactId);
    const fileName = contact ? `${contact.name}_avatar.png` : 'avatar.png';

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/** * Handles avatar deletion from the gallery in edit mode.
 * @param {Array} contacts - Array of contact objects.
 */
async function handleGalleryDelete(contacts) {
    const currentIndex = contactAvatarViewer.index;
    const contact = contacts[currentIndex];

    if (!contact) {
        console.error('Contact not found!');
        return;
    }

    if (contactAvatarViewer) contactAvatarViewer.hide();
    await removeContactFromTaskAssignment(contact.id, contact.name);
}

/** * Removes a contact from the current task assignment.
 * @param {string} contactId - The ID of the contact to remove.
 * @param {string} contactName - The name of the contact to remove.
 */
async function removeContactFromTaskAssignment(contactId, contactName) {
    const { removeContactFromTaskAssignment: removeContact } = await import('./task-assignment-removal.js');
    await removeContact(contactId, contactName);
}

/** * Handles actions when the gallery is being hidden.
 * @param {HTMLElement} container - The gallery container element.
 */
function handleGalleryHide(container) {
    // Move focus away from viewer elements before hiding to prevent aria-hidden warning
    if (document.activeElement && container?.contains(document.activeElement)) {
        document.body.focus();
        document.activeElement.blur();
    }
    setTimeout(() => container?.parentNode && container.remove(), 300);
}

/** * Handles actions after the gallery has been hidden. 
*/
function handleGalleryHidden() {
    if (document.activeElement?.classList?.contains('viewer-button')) {
        document.activeElement.blur();
    }
}

/** * Displays the gallery starting at the specified contact index.
 * @param {object} viewer - The Viewer instance.
 * @param {Array} contacts - Array of contact objects.
 * @param {string} selectedContactId - The ID of the contact to display first.
 */
function showGalleryAtIndex(viewer, contacts, selectedContactId) {
    const selectedIndex = contacts.findIndex(c => c.id === selectedContactId);
    viewer.show();
    if (selectedIndex > 0) viewer.view(selectedIndex);
}
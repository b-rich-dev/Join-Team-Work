import { currentContacts, contactsMap } from "./dropdown-menu-core.js";
import { createViewerContainer } from "./dropdown-menu-viewer-canvas.js";
import { setupDeleteButtonHandler } from "./dropdown-menu-viewer-delete.js";
import { createViewerConfiguration, destroyExistingViewer, initializeAndShowViewer } from "./dropdown-menu-viewer-config.js";

/** Opens a gallery viewer for selected contacts.
 * @param {string} selectedContactId - ID of clicked contact.
 */
export async function openAssignedContactsGallery(selectedContactId) {
    const assignedContacts = window.currentTaskContactsWithAvatars || [];
    if (assignedContacts.length === 0) return;
    if (!await checkViewerAvailability(assignedContacts, selectedContactId)) return;

    const { getAvatarBase64, contacts, avatarMetadata } = await prepareViewerData(assignedContacts);
    destroyExistingViewer();

    const { container, startIndex } = createViewerContainer(contacts, selectedContactId, getAvatarBase64);
    const titleCallback = createViewerTitleCallback(contacts, avatarMetadata, container, getAvatarBase64);
    const config = createViewerConfiguration(contacts, avatarMetadata, container, startIndex, getAvatarBase64, titleCallback, setupDeleteButtonHandler);
    initializeAndShowViewer(container, config);
}

/** Checks if Viewer is available.
 * @param {Array} assignedContacts - Assigned contacts.
 * @param {string} selectedContactId - Selected contact ID.
 * @returns {Promise<boolean>} True if available.
 */
async function checkViewerAvailability(assignedContacts, selectedContactId) {
    if (typeof Viewer !== "function") {
        console.warn("Viewer library not loaded - falling back");
        await handleViewerFallback(assignedContacts, selectedContactId);
        return false;
    }
    return true;
}

/** Handles viewer fallback when library not loaded.
 * @param {Array} assignedContacts - Assigned contacts.
 * @param {string} selectedContactId - Selected contact ID.
 */
async function handleViewerFallback(assignedContacts, selectedContactId) {
    const contact = assignedContacts.find(c => c.id === selectedContactId);
    if (contact?.avatarImage) {
        const { getAvatarBase64 } = await import("../utils/avatar-utils.js");
        const base64 = getAvatarBase64(contact.avatarImage);
        window.open(base64, "_blank");
    }
}

/** Gets full contact objects.
 * @param {Array} assignedContacts - Assigned contacts.
 * @returns {Array} Full contact objects.
 */
function getFullContactObjects(assignedContacts) {
    return assignedContacts.map(c => {
        const fullContact = contactsMap.get(c.id);
        if (fullContact) return fullContact;

        return currentContacts.find(contact =>
            contact.id === c.id ||
            (contact.name === c.name && contact.initials === c.initials)
        ) || c;
    });
}

/** Generates avatar metadata.
 * @param {Array} contacts - Contacts array.
 * @returns {Array} Metadata array.
 */
function generateAvatarMetadata(contacts) {
    return contacts.map(contact => {
        if (contact.avatarImage) {
            if (typeof contact.avatarImage === "object" && contact.avatarImage.name) {
                return { name: contact.avatarImage.name, type: contact.avatarImage.type || "image/jpeg", size: contact.avatarImage.size || 0 };
            }
            if (typeof contact.avatarImage === "string") return extractMetadataFromBase64(contact.avatarImage, contact.name);
        }
        return { name: `${contact.name}.png`, type: "image/png", size: 0 };
    });
}

/** Extracts metadata from base64 string.
 * @param {string} base64 - Base64 image string.
 * @param {string} name - Contact name.
 * @returns {Object} Metadata object.
 */
function extractMetadataFromBase64(base64, name) {
    const mimeMatch = base64.match(/^data:([^;]+);/);
    const type = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const ext = type.split("/")[1] || "jpg";
    const base64Data = base64.split(",")[1] || "";
    const size = Math.floor((base64Data.length * 3) / 4);

    return { name: `${name}.${ext}`, type, size };
}

/** Finds contact index by avatar.
 * @param {Array} contacts - Contacts array.
 * @param {Object} image - Image object.
 * @param {Function} getAvatarBase64 - Avatar base64 getter.
 * @returns {number} Index or -1.
 */
function findContactIndexByAvatar(contacts, image, getAvatarBase64) {
    if (!image?.src) return -1;

    return contacts.findIndex(contact => {
        if (!contact.avatarImage) return false;
        return getAvatarBase64(contact.avatarImage) === image.src;
    });
}

/** Finds contact index by image source.
 * @param {HTMLElement} viewerContainer - Viewer container.
 * @param {Object} image - Image object.
 * @returns {number} Index or -1.
 */
function findContactIndexByImageSrc(viewerContainer, image) {
    if (!image?.src) return -1;

    const allImages = viewerContainer.querySelectorAll("img");
    for (let i = 0; i < allImages.length; i++) {
        if (allImages[i].src === image.src) return i;
    }
    return -1;
}

/** Formats contact title with metadata.
 * @param {Object} contact - Contact object.
 * @param {Object} metadata - Metadata object.
 * @returns {string} Formatted title.
 */
function formatContactTitle(contact, metadata) {
    if (!contact) return "Contact";

    if (contact.avatarImage && metadata) {
        const fileType = metadata.type?.split("/")[1]?.toUpperCase() || "Unknown";
        const sizeKB = (metadata.size / 1024).toFixed(2);
        return `${contact.name}      ${fileType}      ${sizeKB} KB`;
    }

    return contact.name;
}

/** Creates viewer title callback.
 * @param {Array} contacts - Contacts array.
 * @param {Array} avatarMetadata - Metadata array.
 * @param {HTMLElement} viewerContainer - Viewer container.
 * @param {Function} getAvatarBase64 - Avatar base64 getter.
 * @returns {Function} Title callback.
 */
function createViewerTitleCallback(contacts, avatarMetadata, viewerContainer, getAvatarBase64) {
    return (image, imageData) => {
        let actualIndex = findContactIndexByAvatar(contacts, image, getAvatarBase64);

        if (actualIndex === -1) {
            actualIndex = findContactIndexByImageSrc(viewerContainer, image);
            if (actualIndex >= 0 && actualIndex < contacts.length) return contacts[actualIndex].name;

            return "Contact";
        }

        return formatContactTitle(contacts[actualIndex], avatarMetadata[actualIndex]);
    };
}

/** Prepares viewer data.
 * @param {Array} assignedContacts - Assigned contacts.
 * @returns {Promise<Object>} Viewer data.
 */
async function prepareViewerData(assignedContacts) {
    const { getAvatarBase64 } = await import("../utils/avatar-utils.js");
    const contacts = getFullContactObjects(assignedContacts);
    const avatarMetadata = generateAvatarMetadata(contacts);
    return { getAvatarBase64, contacts, avatarMetadata };
}

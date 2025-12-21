let contactAvatarViewer = null;

/** * Shows a contact avatar in the viewer.
 * @param {string|object} imageUrl - The URL of the avatar image or avatar object with metadata
 * @param {string} contactName - The name of the contact
 * @param {string} contactId - The ID of the contact (optional, needed for delete)
 */
export async function showContactAvatarViewer(imageUrl, contactName, contactId = null) {
    if (typeof Viewer !== 'function') {
        console.error('Viewer library not loaded!');
        alert('Image viewer is not available.');
        return;
    }

    const { base64Url, metadata } = extractAvatarData(imageUrl, contactName);
    destroyExistingViewer();
    const viewerContainer = createViewerContainer(base64Url, contactName);

    try {
        contactAvatarViewer = createContactViewer(viewerContainer, base64Url, metadata, contactName, contactId);
        contactAvatarViewer.show();
    } catch (error) {
        console.error('Error showing viewer:', error);
        alert('Error showing image: ' + error.message);
    }
}

/** * Extracts base64 URL and metadata from the avatar image input.
 * @param {string|object} imageUrl - The avatar image (string for old format, object for new format).
 * @param {string} contactName - The name of the contact
 * @returns {object} An object containing base64Url and metadata
 */
function extractAvatarData(imageUrl, contactName) {
    let base64Url = imageUrl;
    let metadata = null;

    if (typeof imageUrl === 'object' && imageUrl.base64) {
        base64Url = imageUrl.base64;
        metadata = {
            name: imageUrl.name || `${contactName}.jpg`,
            type: imageUrl.type || 'image/jpeg',
            size: imageUrl.size || 0
        };
    } else if (typeof imageUrl === 'string') {
        metadata = extractMetadataFromBase64(imageUrl, contactName);
    }

    return { base64Url, metadata };
}

/** * Extracts metadata from a base64 data URI string.
 * @param {string} base64String - The base64 data URI string
 * @param {string} contactName - The name of the contact
 * @returns {object} The extracted metadata object
 */
function extractMetadataFromBase64(base64String, contactName) {
    const mimeMatch = base64String.match(/^data:([^;]+);/);
    const type = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = type.split('/')[1] || 'jpg';
    const base64Data = base64String.split(',')[1] || '';
    const size = Math.floor((base64Data.length * 3) / 4);

    return {
        name: `${contactName}.${ext}`,
        type: type,
        size: size
    };
}

/** * Destroys any existing viewer instance and removes its container. 
*/
function destroyExistingViewer() {
    if (contactAvatarViewer) {
        try {
            contactAvatarViewer.destroy();
        } catch (error) {
            console.warn('Error destroying existing viewer:', error);
        }
        contactAvatarViewer = null;
    }
}

/** * Creates the viewer container element and appends it to the document body.
 * @param {string} base64Url - The base64 URL of the avatar image
 * @param {string} contactName - The name of the contact
 * @returns {HTMLElement} The viewer container element
 */
function createViewerContainer(base64Url, contactName) {
    let container = document.getElementById('temp-avatar-viewer');
    if (container) container.remove();

    container = document.createElement('div');
    container.id = 'temp-avatar-viewer';
    container.style.display = 'none';
    container.innerHTML = `<img src="${base64Url}" alt="${contactName}">`;
    document.body.appendChild(container);

    return container;
}

/** * Creates and configures the Viewer instance for the contact avatar.
 * @param {HTMLElement} container - The viewer container element
 * @param {string} base64Url - The base64 URL of the avatar image
 * @param {object|null} metadata - The metadata of the avatar image
 * @param {string} contactName - The name of the contact
 * @param {string} contactId - The ID of the contact
 * @returns {Viewer} The configured Viewer instance
 */
function createContactViewer(container, base64Url, metadata, contactName, contactId) {
    return new Viewer(container, {
        inline: false,
        button: true,
        navbar: false,
        title: [1, () => createViewerTitle(metadata, contactName)],
        toolbar: createViewerToolbar(contactId),
        tooltip: true,
        movable: true,
        zoomable: true,
        rotatable: true,
        transition: true,
        fullscreen: true,
        keyboard: true,
        download: () => handleDownload(base64Url, metadata, contactName),
        delete: contactId ? () => handleDelete(contactId, contactName) : undefined,
        hide: () => handleHide(container),
        hidden: handleHidden
    });
}

/** * Creates the title string for the viewer.
 * @param {object|null} metadata - The metadata of the avatar image
 * @param {string} contactName - The name of the contact
 * @returns {string} The title string
 */
function createViewerTitle(metadata, contactName) {
    if (metadata) {
        const fileType = metadata.type.split('/')[1]?.toUpperCase() || 'IMAGE';
        const sizeKB = (metadata.size / 1024).toFixed(2);
        return `${contactName}   •   ${fileType}   •   ${sizeKB} KB`;
    }
    return `${contactName} - Avatar`;
}

/** * Creates the toolbar configuration for the viewer.
 * @param {string} contactId - The ID of the contact
 * @returns {object} The toolbar configuration object
 */
function createViewerToolbar(contactId) {
    return {
        download: { show: 1, size: 'large' },
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        rotateLeft: 1,
        rotateRight: 1,
        delete: contactId ? { show: 1, size: 'large' } : 0
    };
}

/** * Handles the download of the contact avatar.
 * @param {string} base64Url - The base64 URL of the avatar image
 * @param {object|null} metadata - The metadata of the avatar image
 * @param {string} contactName - The name of the contact
 */
function handleDownload(base64Url, metadata, contactName) {
    const link = document.createElement('a');
    link.href = base64Url;
    link.download = metadata ? metadata.name : `${contactName}_avatar.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/** * Handles the deletion of the contact avatar.
 * @param {string} contactId - The ID of the contact
 * @param {string} contactName - The name of the contact
 */
function handleDelete(contactId, contactName) {
    if (contactAvatarViewer) contactAvatarViewer.hide();
    setTimeout(() => deleteContactAvatar(contactId, contactName), 300);
}

/** * Deletes the avatar of a contact by ID.
 * @param {string} contactId - The ID of the contact whose avatar is to be deleted
 * @param {string} contactName - The name of the contact
 */
async function deleteContactAvatar(contactId, contactName) {
    const { showDeleteAvatarWarning, showAvatarDeleteSuccess, showAvatarDeleteError } =
        await import('./delete-avatar-warning.js');
    const { getContactById, activeContactId } = await import('../data/contacts-state.js');
    const { updateContact } = await import('../events/contact-actions.js');
    const { renderContacts } = await import('./render-contacts.js');

    const contact = getContactById(contactId);

    if (!contact) {
        showAvatarDeleteError('Kontakt nicht gefunden.');
        return;
    }

    showDeleteAvatarWarning(async () => {
        await performAvatarDeletion(contact, contactId, showAvatarDeleteSuccess, showAvatarDeleteError, updateContact, renderContacts, getContactById, activeContactId);
    });
}

/** * Performs the avatar deletion and updates UI accordingly.
 * @param {object} contact - The contact object
 * @param {string} contactId - The ID of the contact
 * @param {Function} showSuccess - Function to show success message
 * @param {Function} showError - Function to show error message
 * @param {Function} updateContact - Function to update contact data
 * @param {Function} renderContacts - Function to re-render contacts
 * @param {Function} getContactById - Function to get contact by ID
 * @param {string} activeContactId - The currently active contact ID
 */
async function performAvatarDeletion(contact, contactId, showSuccess, showError, updateContact, renderContacts, getContactById, activeContactId) {
    try {
        const updatedContact = { ...contact };
        delete updatedContact.avatarImage;

        await updateContact(updatedContact);
        await renderContacts();
        await refreshContactDetailsIfActive(contactId, activeContactId, getContactById);

        showSuccess('Profilbild erfolgreich gelöscht.');
    } catch (error) {
        console.error('Error deleting avatar:', error);
        showError('Fehler beim Löschen des Profilbildes.');
    }
}

/** * Refreshes the contact details card if the deleted avatar belongs to the active contact.
 * @param {string} contactId - The ID of the contact whose avatar was deleted
 * @param {string} activeContactId - The currently active contact ID
 * @param {Function} getContactById - Function to get contact by ID
 */
async function refreshContactDetailsIfActive(contactId, activeContactId, getContactById) {
    if (activeContactId !== contactId) return;

    const contactDetailsCard = document.querySelector('.contact-details-card');
    const updatedContactData = getContactById(contactId);

    if (contactDetailsCard && updatedContactData) {
        const { createContactDetailsHTML } = await import('../templates/contacts-templates.js');
        contactDetailsCard.innerHTML = createContactDetailsHTML(updatedContactData);
    }
}

/** * Handles hiding the viewer and cleans up the container.
 * @param {HTMLElement} container - The viewer container element
 */
function handleHide(container) {
    if (document.activeElement?.blur) document.activeElement.blur();
    setTimeout(() => {
        if (container?.parentNode) container.remove();
    }, 300);
}

/** * Handles actions after the viewer has been hidden. 
 */
function handleHidden() {
    if (document.activeElement?.classList?.contains('viewer-button')) {
        document.activeElement.blur();
    }
}
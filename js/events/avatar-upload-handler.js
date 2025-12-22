import {
    showAvatarWrongFormatErrorMsg,
    showAvatarLimitErrorMsg,
    compressAvatarImage,
    base64PayloadBytes,
    validateAvatarFileType,
    updateAvatarDisplay,
    resetAvatarDisplay,
    setupDragAndDrop
} from './avatar-upload-helpers.js';

let currentAvatarImage = null;
let newContactClickHandler = null;
let newContactChangeHandler = null;
let editContactClickHandler = null;
let editContactChangeHandler = null;

/** * Stores avatar image with metadata.
 * @param {File} file - Original file.
 * @param {string} base64 - Compressed base64.
 * @param {number} size - Size in bytes.
 */
function storeAvatarImage(file, base64, size) {
    currentAvatarImage = {
        name: file.name,
        type: file.type,
        base64: base64,
        size: size
    };
}

/** * Validates file type and shows error if invalid.
 * @param {File} file - File to validate.
 * @returns {boolean} True if valid.
 */
function validateAndShowError(file) {
    if (!validateAvatarFileType(file)) {
        showAvatarWrongFormatErrorMsg();
        return false;
    }
    return true;
}

/** * Validates file size and shows error if too large.
 * @param {number} size - Size in bytes.
 * @param {number} maxBytes - Maximum allowed size.
 * @returns {boolean} True if valid.
 */
function validateFileSize(size, maxBytes) {
    if (size > maxBytes) {
        showAvatarLimitErrorMsg();
        return false;
    }
    return true;
}

/** * Handles image processing errors.
 * @param {Error} error - The error object.
 */
function handleImageProcessingError(error) {
    console.error('Error processing avatar image:', error);
    alert('Error processing the image.');
}

/** * Clears any visible avatar error messages.
 */
function clearAvatarErrorMessages() {
    const messages = [
        document.getElementById('avatarWrongFormatErrorMsg'),
        document.getElementById('avatarLimitErrorMsg')
    ];
    
    messages.forEach(msg => {
        if (msg?.classList.contains('slide-in')) {
            msg.classList.remove('slide-in');
            msg.classList.add('hidden');
        }
    });
}

/** * Processes and validates avatar image.
 * @param {File} file - The image file.
 * @returns {Promise<{base64: string, size: number}|null>} Processed image data or null.
 */
async function processAvatarImage(file) {
    const compressedBase64 = await compressAvatarImage(file, 200, 200, 0.9);
    const size = base64PayloadBytes(compressedBase64);
    
    if (!validateFileSize(size, 1 * 1024 * 1024)) return null;
    
    return { base64: compressedBase64, size };
}

/** * Handles avatar file selection and validation.
 * @param {File} file - The selected image file.
 * @param {HTMLElement} avatarElement - The avatar display element.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
async function handleAvatarFileSelection(file, avatarElement) {
    clearAvatarErrorMessages();
    
    if (!validateAndShowError(file)) return false;

    try {
        const result = await processAvatarImage(file);
        if (!result) return false;
        
        storeAvatarImage(file, result.base64, result.size);
        updateAvatarDisplay(avatarElement, result.base64);
        return true;
    } catch (error) {
        handleImageProcessingError(error);
        return false;
    }
}

/** * Initializes new contact avatar display.
 * @param {HTMLElement} avatarElement - Avatar element.
 */
function initializeNewContactAvatar(avatarElement) {
    currentAvatarImage = null;
    resetAvatarDisplay(avatarElement);
}

/** * Removes old event listeners.
 * @param {HTMLElement} uploadBtn - Upload button.
 * @param {Function} clickHandler - Click handler to remove.
 * @param {HTMLElement} fileInput - File input.
 * @param {Function} changeHandler - Change handler to remove.
 */
function removeOldListeners(uploadBtn, clickHandler, fileInput, changeHandler) {
    if (clickHandler) uploadBtn.removeEventListener('click', clickHandler);
    if (changeHandler) fileInput.removeEventListener('change', changeHandler);
}

/** * Creates click handler for upload button.
 * @param {HTMLElement} fileInput - File input to trigger.
 * @returns {Function} Click handler.
 */
function createUploadClickHandler(fileInput) {
    return (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    };
}

/** * Creates change handler for file input.
 * @param {HTMLElement} avatarElement - Avatar element.
 * @param {HTMLElement} fileInput - File input.
 * @returns {Function} Change handler.
 */
function createFileChangeHandler(avatarElement, fileInput) {
    return async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await handleAvatarFileSelection(file, avatarElement);
        fileInput.value = '';
    };
}

/** * Gets DOM elements for new contact avatar upload.
 * @returns {Object} Elements object.
 */
function getNewContactElements() {
    const uploadBtn = document.getElementById('avatarUploadBtn');
    const fileInput = document.getElementById('avatarImageInput');
    const avatarElement = document.getElementById('contactAvatar');
    const avatarWrapper = avatarElement?.closest('.avatar-wrapper');
    return { uploadBtn, fileInput, avatarElement, avatarWrapper };
}

/** * Attaches event handlers for new contact avatar upload.
 * @param {HTMLElement} uploadBtn - Upload button.
 * @param {HTMLElement} fileInput - File input.
 * @param {HTMLElement} avatarElement - Avatar element.
 * @param {HTMLElement} avatarWrapper - Avatar wrapper.
 */
function attachEventHandlersForNewContact(uploadBtn, fileInput, avatarElement, avatarWrapper) {
    removeOldListeners(uploadBtn, newContactClickHandler, fileInput, newContactChangeHandler);
    newContactClickHandler = createUploadClickHandler(fileInput);
    newContactChangeHandler = createFileChangeHandler(avatarElement, fileInput);
    uploadBtn.addEventListener('click', newContactClickHandler);
    fileInput.addEventListener('change', newContactChangeHandler);
    if (avatarWrapper) setupDragAndDrop(avatarWrapper, (file) => handleAvatarFileSelection(file, avatarElement));
}

/** * Sets up avatar upload functionality for "Add Contact" overlay.
*/
export function setupAvatarUploadForNewContact() {
    const { uploadBtn, fileInput, avatarElement, avatarWrapper } = getNewContactElements();
    
    if (!uploadBtn || !fileInput || !avatarElement) {
        console.warn('Avatar upload elements not found');
        return;
    }
    
    initializeNewContactAvatar(avatarElement);
    attachEventHandlersForNewContact(uploadBtn, fileInput, avatarElement, avatarWrapper);
}

/** * Initializes avatar from contact data.
 * @param {Object} contact - Contact object.
 * @param {HTMLElement} avatarElement - Avatar element.
 */
function initializeContactAvatar(contact, avatarElement) {
    if (!contact.avatarImage) {
        currentAvatarImage = null;
        resetAvatarDisplay(avatarElement, contact.initials, contact.avatarColor);
        return;
    }

    if (typeof contact.avatarImage === 'string') {
        currentAvatarImage = {name: 'avatar.jpg',type: 'image/jpeg',base64: contact.avatarImage,size: base64PayloadBytes(contact.avatarImage)};
        updateAvatarDisplay(avatarElement, contact.avatarImage);
    } else {
        currentAvatarImage = contact.avatarImage;
        updateAvatarDisplay(avatarElement, contact.avatarImage.base64);
    }
}

/** * Gets DOM elements for edit contact avatar upload.
 * @returns {Object} Elements object.
 */
function getEditContactElements() {
    const uploadBtn = document.getElementById('editAvatarUploadBtn');
    const fileInput = document.getElementById('editAvatarImageInput');
    const avatarElement = document.getElementById('editContactAvatar');
    const avatarWrapper = avatarElement?.closest('.avatar-wrapper');
    return { uploadBtn, fileInput, avatarElement, avatarWrapper };
}

/** * Attaches event handlers for edit contact avatar upload.
 * @param {HTMLElement} uploadBtn - Upload button.
 * @param {HTMLElement} fileInput - File input.
 * @param {HTMLElement} avatarElement - Avatar element.
 * @param {HTMLElement} avatarWrapper - Avatar wrapper.
 */
function attachEventHandlersForEditContact(uploadBtn, fileInput, avatarElement, avatarWrapper) {
    removeOldListeners(uploadBtn, editContactClickHandler, fileInput, editContactChangeHandler);
    editContactClickHandler = createUploadClickHandler(fileInput);
    editContactChangeHandler = createFileChangeHandler(avatarElement, fileInput);
    uploadBtn.addEventListener('click', editContactClickHandler);
    fileInput.addEventListener('change', editContactChangeHandler);
    if (avatarWrapper) setupDragAndDrop(avatarWrapper, (file) => handleAvatarFileSelection(file, avatarElement));
}

/** * Sets up avatar upload functionality for "Edit Contact" overlay.
 * @param {object} contact - The contact being edited.
 */
export function setupAvatarUploadForEditContact(contact) {
    const { uploadBtn, fileInput, avatarElement, avatarWrapper } = getEditContactElements();

    if (!uploadBtn || !fileInput || !avatarElement) {
        console.warn('Edit avatar upload elements not found');
        return;
    }

    initializeContactAvatar(contact, avatarElement);
    attachEventHandlersForEditContact(uploadBtn, fileInput, avatarElement, avatarWrapper);
}

/** * Gets the current avatar image (base64).
 * @returns {string|null} The base64 image data URL or null.
 */
export function getCurrentAvatarImage() {
    return currentAvatarImage;
}

/** * Clears the current avatar image.
 */
export function clearCurrentAvatarImage() {
    currentAvatarImage = null;
}
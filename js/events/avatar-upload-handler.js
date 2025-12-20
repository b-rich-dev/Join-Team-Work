let currentAvatarImage = null;

let newContactClickHandler = null;
let newContactChangeHandler = null;
let editContactClickHandler = null;
let editContactChangeHandler = null;

/** * Shows error message for wrong file format.
 */
function showAvatarWrongFormatErrorMsg() {
    const msg = document.getElementById('avatarWrongFormatErrorMsg');
    if (!msg) return;
    msg.classList.remove('hidden', 'slide-out');
    msg.classList.add('slide-in');
}

/** * Hides error message for wrong file format.
 */
async function hideAvatarWrongFormatErrorMsg() {
    const msg = document.getElementById('avatarWrongFormatErrorMsg');
    if (!msg) return;
    msg.classList.remove('slide-in');
    msg.classList.add('slide-out');
    await new Promise(resolve => setTimeout(resolve, 400));
    msg.classList.add('hidden');
}

/** * Shows error message for file size limit.
 */
function showAvatarLimitErrorMsg() {
    const msg = document.getElementById('avatarLimitErrorMsg');
    if (!msg) return;
    msg.classList.remove('hidden', 'slide-out');
    msg.classList.add('slide-in');
}

/**
 * Hides error message for file size limit.
 */
async function hideAvatarLimitErrorMsg() {
    const msg = document.getElementById('avatarLimitErrorMsg');
    if (!msg) return;
    msg.classList.remove('slide-in');
    msg.classList.add('slide-out');
    await new Promise(resolve => setTimeout(resolve, 400));
    msg.classList.add('hidden');
}

// Setup global click listeners for closing error messages
if (!window.__avatarErrorCloseBound) {
    document.addEventListener('click', async (e) => {
        // Check if click is inside format error close button
        let el = e.target;
        while (el && el !== document) {
            if (el.getAttribute && el.getAttribute('id') === 'avatar-error-msg-close') {
                await hideAvatarWrongFormatErrorMsg();
                return;
            }
            if (el.getAttribute && el.getAttribute('id') === 'avatar-limit-error-msg-close') {
                await hideAvatarLimitErrorMsg();
                return;
            }
            el = el.parentNode;
        }
    });
    window.__avatarErrorCloseBound = true;
}

/**
 * Compresses an image file to specified dimensions and quality.
 * @param {File} file - The image file to compress.
 * @param {number} maxWidth - Maximum width in pixels (default: 200).
 * @param {number} maxHeight - Maximum height in pixels (default: 200).
 * @param {number} quality - JPEG quality 0-1 (default: 0.9).
 * @returns {Promise<string>} The compressed image as base64 data URL.
 */
function compressAvatarImage(file, maxWidth = 200, maxHeight = 200, quality = 0.9) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    } else {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export as base64 JPEG
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target.result;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Calculates the byte size of a base64 string.
 * @param {string} dataUrl - The base64 data URL.
 * @returns {number} Size in bytes.
 */
function base64PayloadBytes(dataUrl) {
    if (!dataUrl) return 0;
    const comma = dataUrl.indexOf(',');
    const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    const len = b64.length;
    const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((len * 3) / 4) - padding);
}

/**
 * Handles avatar file selection and validation.
 * @param {File} file - The selected image file.
 * @param {HTMLElement} avatarElement - The avatar display element.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
async function handleAvatarFileSelection(file, avatarElement) {
    // Validate file type
    if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
        showAvatarWrongFormatErrorMsg();
        return false;
    }
    
    try {
        // Compress image (200x200, quality 0.9)
        const compressedBase64 = await compressAvatarImage(file, 200, 200, 0.9);
        
        // Check size limit (1 MB)
        const MAX_BYTES = 1 * 1024 * 1024; // 1 MB
        const size = base64PayloadBytes(compressedBase64);
        
        if (size > MAX_BYTES) {
            showAvatarLimitErrorMsg();
            return false;
        }
        
        // Store the image with metadata
        currentAvatarImage = {
            name: file.name,
            type: file.type,
            base64: compressedBase64,
            size: size
        };
        
        // Update avatar display
        updateAvatarDisplay(avatarElement, compressedBase64);
        
        return true;
    } catch (error) {
        console.error('Error processing avatar image:', error);
        alert('Fehler beim Verarbeiten des Bildes.');
        return false;
    }
}

/**
 * Updates the avatar display element with an image.
 * @param {HTMLElement} avatarElement - The avatar container element.
 * @param {string} base64Image - The base64 image data URL.
 */
function updateAvatarDisplay(avatarElement, base64Image) {
    if (!avatarElement) return;
    
    // Set background image
    avatarElement.style.backgroundImage = `url(${base64Image})`;
    
    // Hide the SVG icon
    const svg = avatarElement.querySelector('svg');
    if (svg) {
        svg.style.display = 'none';
    }
    
    // Hide initials text if present
    avatarElement.innerHTML = '';
    avatarElement.style.backgroundImage = `url(${base64Image})`;
}

/**
 * Resets the avatar display to default (no image).
 * @param {HTMLElement} avatarElement - The avatar container element.
 * @param {string} initials - The contact initials to display.
 * @param {string} avatarColor - The avatar background color.
 */
function resetAvatarDisplay(avatarElement, initials = '', avatarColor = '--borderGrey') {
    if (!avatarElement) return;
    
    currentAvatarImage = null;
    avatarElement.style.backgroundImage = 'none';
    
    if (initials) {
        avatarElement.innerHTML = initials;
        const colorValue = avatarColor?.startsWith('--') 
            ? `var(${avatarColor})` 
            : avatarColor;
        avatarElement.style.backgroundColor = colorValue;
    } else {
        // Show default user icon
        avatarElement.innerHTML = `
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.0001 22.0001C19.0667 22.0001 16.5556 20.9556 14.4667 18.8667C12.3779 16.7779 11.3334 14.2667 11.3334 11.3334C11.3334 8.40008 12.3779 5.88897 14.4667 3.80008C16.5556 1.71119 19.0667 0.666748 22.0001 0.666748C24.9334 0.666748 27.4445 1.71119 29.5334 3.80008C31.6223 5.88897 32.6667 8.40008 32.6667 11.3334C32.6667 14.2667 31.6223 16.7779 29.5334 18.8667C27.4445 20.9556 24.9334 22.0001 22.0001 22.0001ZM38.0001 43.3334H6.00008C4.53341 43.3334 3.27786 42.8112 2.23341 41.7668C1.18897 40.7223 0.666748 39.4668 0.666748 38.0001V35.8667C0.666748 34.3556 1.05564 32.9667 1.83341 31.7001C2.61119 30.4334 3.64453 29.4667 4.93341 28.8001C7.68897 27.4223 10.489 26.389 13.3334 25.7001C16.1779 25.0112 19.0667 24.6667 22.0001 24.6667C24.9334 24.6667 27.8223 25.0112 30.6667 25.7001C33.5112 26.389 36.3112 27.4223 39.0667 28.8001C40.3556 29.4667 41.389 30.4334 42.1667 31.7001C42.9445 32.9667 43.3334 34.3556 43.3334 35.8667V38.0001C43.3334 39.4668 42.8112 40.7223 41.7668 41.7668C40.7223 42.8112 39.4668 43.3334 38.0001 43.3334ZM6.00008 38.0001H38.0001V35.8667C38.0001 35.3779 37.8779 34.9334 37.6334 34.5334C37.389 34.1334 37.0667 33.8223 36.6667 33.6001C34.2668 32.4001 31.8445 31.5001 29.4001 30.9001C26.9556 30.3001 24.489 30.0001 22.0001 30.0001C19.5112 30.0001 17.0445 30.3001 14.6001 30.9001C12.1556 31.5001 9.73341 32.4001 7.33342 33.6001C6.93341 33.8223 6.61119 34.1334 6.36675 34.5334C6.1223 34.9334 6.00008 35.3779 6.00008 35.8667V38.0001ZM22.0001 16.6667C23.4667 16.6667 24.7223 16.1445 25.7668 15.1001C26.8112 14.0556 27.3334 12.8001 27.3334 11.3334C27.3334 9.86675 26.8112 8.61119 25.7668 7.56675C24.7223 6.5223 23.4667 6.00008 22.0001 6.00008C20.5334 6.00008 19.2779 6.5223 18.2334 7.56675C17.189 8.61119 16.6667 9.86675 16.6667 11.3334C16.6667 12.8001 17.189 14.0556 18.2334 15.1001C19.2779 16.1445 20.5334 16.6667 22.0001 16.6667Z" fill="var(--white)"/>
            </svg>
        `;
        avatarElement.style.backgroundColor = 'var(--borderGrey)';
    }
}

/**
 * Sets up drag and drop functionality for avatar element.
 * @param {HTMLElement} avatarElement - The avatar container element.
 * @param {Function} onFileDrop - Callback function when file is dropped.
 */
function setupDragAndDrop(avatarElement, onFileDrop) {
    if (!avatarElement) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        avatarElement.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    // Highlight on drag over
    ['dragenter', 'dragover'].forEach(eventName => {
        avatarElement.addEventListener(eventName, () => {
            avatarElement.style.opacity = '0.7';
            avatarElement.style.cursor = 'copy';
        }, false);
    });
    
    // Remove highlight on drag leave
    ['dragleave', 'drop'].forEach(eventName => {
        avatarElement.addEventListener(eventName, () => {
            avatarElement.style.opacity = '1';
            avatarElement.style.cursor = 'default';
        }, false);
    });
    
    // Handle drop
    avatarElement.addEventListener('drop', async (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            await onFileDrop(file);
        }
    }, false);
}

/**
 * Sets up avatar upload functionality for "Add Contact" overlay.
 */
export function setupAvatarUploadForNewContact() {
    const uploadBtn = document.getElementById('avatarUploadBtn');
    const fileInput = document.getElementById('avatarImageInput');
    const avatarElement = document.getElementById('contactAvatar');    const avatarWrapper = avatarElement?.closest('.avatar-wrapper');    
    if (!uploadBtn || !fileInput || !avatarElement) {
        console.warn('Avatar upload elements not found');
        return;
    }
    
    // Reset current image when opening new contact form
    currentAvatarImage = null;
    resetAvatarDisplay(avatarElement);
    
    // Remove old event listeners if they exist
    if (newContactClickHandler) {
        uploadBtn.removeEventListener('click', newContactClickHandler);
    }
    if (newContactChangeHandler) {
        fileInput.removeEventListener('change', newContactChangeHandler);
    }
    
    // Create new click handler
    newContactClickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    };
    
    // Create new change handler
    newContactChangeHandler = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        await handleAvatarFileSelection(file, avatarElement);
        
        // Reset file input
        fileInput.value = '';
    };
    
    // Add new listeners
    uploadBtn.addEventListener('click', newContactClickHandler);
    fileInput.addEventListener('change', newContactChangeHandler);
    
    // Setup drag and drop on wrapper for larger drop zone
    if (avatarWrapper) {
        setupDragAndDrop(avatarWrapper, async (file) => {
            await handleAvatarFileSelection(file, avatarElement);
        });
    }
}

/**
 * Sets up avatar upload functionality for "Edit Contact" overlay.
 * @param {object} contact - The contact being edited.
 */
export function setupAvatarUploadForEditContact(contact) {
    const uploadBtn = document.getElementById('editAvatarUploadBtn');
    const fileInput = document.getElementById('editAvatarImageInput');
    const avatarElement = document.getElementById('editContactAvatar');
    const avatarWrapper = avatarElement?.closest('.avatar-wrapper');
    
    if (!uploadBtn || !fileInput || !avatarElement) {
        console.warn('Edit avatar upload elements not found');
        return;
    }
    
    // Load existing avatar image if present
    if (contact.avatarImage) {
        // Handle both old format (string) and new format (object)
        if (typeof contact.avatarImage === 'string') {
            // Old format: just base64 string
            currentAvatarImage = {
                name: 'avatar.jpg',
                type: 'image/jpeg',
                base64: contact.avatarImage,
                size: base64PayloadBytes(contact.avatarImage)
            };
            updateAvatarDisplay(avatarElement, contact.avatarImage);
        } else {
            // New format: object with metadata
            currentAvatarImage = contact.avatarImage;
            updateAvatarDisplay(avatarElement, contact.avatarImage.base64);
        }
    } else {
        currentAvatarImage = null;
        resetAvatarDisplay(avatarElement, contact.initials, contact.avatarColor);
    }
    
    // Remove old event listeners if they exist
    if (editContactClickHandler) {
        uploadBtn.removeEventListener('click', editContactClickHandler);
    }
    if (editContactChangeHandler) {
        fileInput.removeEventListener('change', editContactChangeHandler);
    }
    
    // Create new click handler
    editContactClickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    };
    
    // Create new change handler
    editContactChangeHandler = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        await handleAvatarFileSelection(file, avatarElement);
        
        // Reset file input
        fileInput.value = '';
    };
    
    // Add new listeners
    uploadBtn.addEventListener('click', editContactClickHandler);
    fileInput.addEventListener('change', editContactChangeHandler);
    
    // Setup drag and drop on wrapper for larger drop zone
    if (avatarWrapper) {
        setupDragAndDrop(avatarWrapper, async (file) => {
            await handleAvatarFileSelection(file, avatarElement);
        });
    }
}

/**
 * Gets the current avatar image (base64).
 * @returns {string|null} The base64 image data URL or null.
 */
export function getCurrentAvatarImage() {
    return currentAvatarImage;
}

/**
 * Clears the current avatar image.
 */
export function clearCurrentAvatarImage() {
    currentAvatarImage = null;
}

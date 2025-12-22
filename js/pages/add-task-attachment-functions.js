window.taskAttachments = [];
let myGallery = null;
let attachmentInputHandlerBound = false;
let handleAttachmentInputChangeRef = null;

const MAX_TOTAL_BYTES = 1 * 1024 * 1024;

/** * Calculates the byte size of the base64 payload in a data URL.
 * @param {string} dataUrl - The data URL string.
 * @returns {number} - The byte size of the base64 payload.
 */
function base64PayloadBytes(dataUrl) {
    if (!dataUrl) return 0;
    const comma = dataUrl.indexOf(',');
    const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    const len = b64.length;
    const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((len * 3) / 4) - padding);
}

/** * Calculates the current total byte size of all attachments.
 * @returns {number} - The total byte size of all attachments.
 */
function currentAttachmentsBytes() {
    return window.taskAttachments.reduce((sum, a) => sum + base64PayloadBytes(a.base64), 0);
}

/** * Processes and adds a single file as attachment after validation and compression
 * @param {File} file - The file to process
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function processAndAddAttachment(file) {
    checkRightFormat(file);

    const blob = new Blob([file], { type: file.type });
    const compressedBase64 = await compressImage(file, 800, 800, 0.8);
    const compressedSize = base64PayloadBytes(compressedBase64);

    const newTotalBytes = currentAttachmentsBytes() + compressedSize;
    if (newTotalBytes > MAX_TOTAL_BYTES) {
        if (window.showSizeLimitErrorMsg) window.showSizeLimitErrorMsg();
        return false;
    }

    window.taskAttachments.push({ name: file.name, type: blob.type, base64: compressedBase64, size: compressedSize });
    return true;
}

/** * Checks if the file format is either JPEG or PNG.
 * @param {File} file - The file to check
 * @returns {boolean} - True if format is valid, false otherwise
 */
function checkRightFormat(file) {
    if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
        if (window.showWrongFormatErrorMsg) window.showWrongFormatErrorMsg();
        return false;
    }
}

/** * Adds keyboard support to the attachment input label
 * @param {HTMLInputElement} filepicker - The file input element
 */
function attachKeyboardSupport(filepicker) {
    const uploadLabel = document.querySelector('label[for="attachment-input"].attachment-input-field');
    if (uploadLabel && !uploadLabel.dataset.keyboardBound) {
        uploadLabel.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                filepicker.click();
            }
        });
        uploadLabel.dataset.keyboardBound = 'true';
    }
}

/** * Processes files from file input and renders attachments
 * @param {FileList} files - The files from the input
 */
async function processFileInputChange(files) {
    if (files.length > 0) {
        for (const file of files) {
            await processAndAddAttachment(file);
        }
        render();
    }
}

/** * Event listener for attachment input changes
 */
function attachAttachmentListener() {
    const filepicker = document.getElementById("attachment-input");
    if (!filepicker) return;

    if (!handleAttachmentInputChangeRef) {
        handleAttachmentInputChangeRef = async (event) => {
            await processFileInputChange(event.target.files || []);
        };
    }

    filepicker.removeEventListener("change", handleAttachmentInputChangeRef);
    filepicker.addEventListener("change", handleAttachmentInputChangeRef);
    attachmentInputHandlerBound = true;

    attachKeyboardSupport(filepicker);
}

/** * Initializes the attachment input listener on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', attachAttachmentListener);

/** * Ensures the attachment input listener is attached even if DOMContentLoaded has already fired
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachAttachmentListener);
} else {
    attachAttachmentListener();
}

/** * Creates and starts a MutationObserver to watch for a specific element
 * @param {string} selector - The CSS selector to watch for
 * @param {Function} resolve - The promise resolve function
 * @returns {MutationObserver} - The created observer
 */
function createElementObserver(selector, resolve) {
    const obs = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
            obs.disconnect();
            resolve(el);
        }
    });
    obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
    return obs;
}

/** * Handles the timeout for waiting for an element
 * @param {MutationObserver} obs - The observer to disconnect
 * @param {string} selector - The CSS selector
 * @param {Function} resolve - The promise resolve function
 * @param {Function} reject - The promise reject function
 */
function handleWaitTimeout(obs, selector, resolve, reject) {
    obs.disconnect();
    const el = document.querySelector(selector);
    if (el) resolve(el);
    else reject(new Error(`Element not found: ${selector}`));
}

/** * Waits for a dynamically inserted element to appear in the DOM
 * @param {string} selector - The CSS selector to wait for
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 * @returns {Promise<HTMLElement>} - Promise that resolves with the element
 */
function waitForElement(selector, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(selector);
        if (existing) return resolve(existing);

        const obs = createElementObserver(selector, resolve);

        if (timeout > 0) {
            setTimeout(() => handleWaitTimeout(obs, selector, resolve, reject), timeout);
        }
    });
}

/** * Prepares the gallery for rendering by cleaning up old elements
 * @param {HTMLElement} gallery - The gallery container element
 * @returns {{tooltip: HTMLElement, labelContainer: HTMLElement|null}}
 */
function setupGallery(gallery) {
    const labelContainer = gallery.closest('.label-container');
    gallery.innerHTML = "";

    const oldTooltip = labelContainer?.querySelector('.attachment-tooltip');
    if (oldTooltip) oldTooltip.remove();

    if (myGallery) destroyGallery();

    const tooltip = document.createElement('div');
    tooltip.classList.add('attachment-tooltip');
    if (labelContainer) labelContainer.appendChild(tooltip);

    return { tooltip, labelContainer };
}

/** * Destroys the existing Viewer instance if present
 */
function destroyGallery() {
    myGallery.destroy();
    myGallery = null;
}

/** * Creates a single attachment element with image, description and delete button
 * @param {Object} image - The attachment object
 * @param {number} index - The index of the attachment
 * @param {HTMLElement} tooltip - The tooltip element
 * @returns {HTMLElement} - The created attachment element
 */
function createAttachmentElement(image, index, tooltip) {
    const imageElement = document.createElement('div');
    configureAttachmentElement(imageElement, image.name, index);

    imageElement.appendChild(createImageElement(image, index));
    imageElement.appendChild(createDescriptionElement(image.name));
    const deletebtn = createDeleteButton(index);
    imageElement.appendChild(deletebtn);

    attachTooltipEvents(imageElement, tooltip, image.name);
    attachDeleteEvent(deletebtn, index);
    return imageElement;
}

/** * Returns the SVG string for the delete icon
 * @param {number} index - The attachment index
 * @returns {string} - The SVG string
 */
function deleteIconSVG(index) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask0_266038_5319_${index}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                    <rect width="24" height="24" fill="#D9D9D9"/>
                </mask>
                <g mask="url(#mask0_266038_5319_${index})">
                    <path d="M7 21C6.45 21 5.97917 20.8042 5.5875 20.4125C5.19583 20.0208 5 19.55 5 19V6C4.71667 6 4.47917 5.90417 4.2875 5.7125C4.09583 5.52083 4 5.28333 4 5C4 4.71667 4.09583 4.47917 4.2875 4.2875C4.47917 4.09583 4.71667 4 5 4H9C9 3.71667 9.09583 3.47917 9.2875 3.2875C9.47917 3.09583 9.71667 3 10 3H14C14.2833 3 14.5208 3.09583 14.7125 3.2875C14.9042 3.47917 15 3.71667 15 4H19C19.2833 4 19.5208 4.09583 19.7125 4.2875C19.9042 4.47917 20 4.71667 20 5C20 5.28333 19.9042 5.52083 19.7125 5.7125C19.5208 5.90417 19.2833 6 19 6V19C19 19.55 18.8042 20.0208 18.4125 20.4125C18.0208 20.8042 17.55 21 17 21H7ZM7 6V19H17V6H7ZM9 16C9 16.2833 9.09583 16.5208 9.2875 16.7125C9.47917 16.9042 9.71667 17 10 17C10.2833 17 10.5208 16.9042 10.7125 16.7125C10.9042 16.5208 11 16.2833 11 16V9C11 8.71667 10.9042 8.47917 10.7125 8.2875C10.5208 8.09583 10.2833 8 10 8C9.71667 8 9.47917 8.09583 9.2875 8.2875C9.09583 8.47917 9 8.71667 9 9V16ZM13 16C13 16.2833 13.0958 16.5208 13.2875 16.7125C13.4792 16.9042 13.7167 17 14 17C14.2833 17 14.5208 16.9042 14.7125 16.7125C14.9042 16.5208 15 16.2833 15 16V9C15 8.71667 14.9042 8.47917 14.7125 8.2875C14.5208 8.09583 14.2833 8 14 8C13.7167 8 13.4792 8.09583 13.2875 8.2875C13.0958 8.47917 13 8.71667 13 9V16Z" fill="white"/>
                </g>
            </svg>`
}

/** * Creates a description element for an attachment
 * @param {string} name - The attachment name
 * @returns {HTMLParagraphElement} - The configured description element
 */
function createDescriptionElement(name) {
    const description = document.createElement('p');
    description.textContent = name;
    description.classList.add('attachment-description');
    return description;
}

/** * Creates a delete button element
 * @param {number} index - The attachment index
 * @returns {HTMLDivElement} - The configured delete button element
 */
function createDeleteButton(index) {
    const deletebtn = document.createElement('div');
    deletebtn.innerHTML = deleteIconSVG(index);
    deletebtn.classList.add('delete-attachment-btn');
    return deletebtn;
}

/** * Configures the main attachment element with classes and attributes
 * @param {HTMLElement} element - The element to configure
 * @param {string} name - The attachment name
 * @param {number} index - The attachment index
 */
function configureAttachmentElement(element, name, index) {
    element.classList.add('attachment-item');
    element.setAttribute('data-tooltip', name);
    element.setAttribute('data-index', index);
}

/** * Creates and configures the image element for an attachment
 * @param {Object} image - The attachment object
 * @param {number} index - The index of the attachment
 * @returns {HTMLImageElement} - The configured image element
 */
function createImageElement(image, index) {
    const img = document.createElement('img');
    img.src = image.base64;
    img.alt = image.name;
    img.setAttribute('data-attachment-index', index);
    img.setAttribute('data-name', image.name);
    img.setAttribute('data-type', image.type || '');
    img.setAttribute('data-size', (image.size || 0).toString());
    return img;
}

/** * Attaches tooltip event listeners to an attachment element
 * @param {HTMLElement} element - The attachment element
 * @param {HTMLElement} tooltip - The tooltip element
 * @param {string} name - The attachment name
 */
function attachTooltipEvents(element, tooltip, name) {
    element.addEventListener('mouseenter', () => {
        tooltip.textContent = name;
        tooltip.style.bottom = '-14px';
        tooltip.style.right = '0px';
        tooltip.style.opacity = '1';
    });
    element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
    });
}

/** * Attaches delete event listener to the delete button
 * @param {HTMLElement} deleteBtn - The delete button element
 * @param {number} index - The attachment index
 */
function attachDeleteEvent(deleteBtn, index) {
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteAttachment(index);
    });
}

/** * Creates all attachment elements and appends them to the gallery
 * @param {HTMLElement} gallery - The gallery container
 * @param {HTMLElement} tooltip - The tooltip element
 */
function createAttachmentElements(gallery, tooltip) {
    window.taskAttachments.forEach((image, index) => {
        const element = createAttachmentElement(image, index, tooltip);
        gallery.appendChild(element);
    });
}

/** * Generates the title string for the viewer based on attachment metadata
 * @param {Object} metadata - The attachment metadata object
 * @returns {string} - The formatted title string
 */
function generateViewerTitle(metadata) {
    const name = metadata.name || 'Unknown';
    const type = metadata.type || '';
    const size = metadata.size || 0;

    let fileType = 'FILE';
    if (type && type.includes('/')) fileType = type.split('/')[1]?.toUpperCase() || 'FILE';
    else if (type) fileType = type.toUpperCase();

    const sizeKB = size > 0 ? (size / 1024).toFixed(2) : '0.00';
    return `${name}   •   ${fileType}   •   ${sizeKB} KB`;
}

/** * Creates the title callback function for the Viewer
 * @param {Array} attachmentMetadata - Array of attachment metadata
 * @returns {Function} - The title callback function
 */
function createViewerTitleCallback(attachmentMetadata) {
    return (image, imageData) => {
        let actualIndex = 0;
        if (image && image.src) {
            actualIndex = window.taskAttachments.findIndex(att => {
                const base64 = typeof att === 'string' ? att : att.base64;
                return base64 === image.src;
            });
            if (actualIndex === -1) actualIndex = 0;
        }
        return generateViewerTitle(attachmentMetadata[actualIndex] || {});
    };
}

/** * Returns the toolbar configuration for the Viewer
 * @returns {Object} - The toolbar configuration object
 */
function getViewerToolbarConfig() {
    return {
        download: { show: 1, size: 'large' },
        zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1,
        prev: 1, play: { show: 1, size: 'large' }, next: 1,
        rotateLeft: 1, rotateRight: 1,
        flipHorizontal: 1, flipVertical: 1,
        delete: { show: 1, size: 'large' }
    };
}

/** * Creates the Viewer configuration object
 * @param {Array} attachmentMetadata - Array of attachment metadata
 * @returns {Object} - The Viewer configuration object
 */
function createViewerConfig(attachmentMetadata) {
    return {
        inline: false,
        button: true,
        navbar: true,
        title: [1, createViewerTitleCallback(attachmentMetadata)],
        toolbar: getViewerToolbarConfig(),
        delete: (index) => {
            deleteAttachment(index);
            if (myGallery) myGallery.hide();
        },
        hide() {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        }
    };
}

/** * Initializes the Viewer instance for the gallery
 * @param {HTMLElement} gallery - The gallery container
 * @param {HTMLElement|null} deleteAllBtn - The delete all button
 */
function initializeViewer(gallery, deleteAllBtn) {
    if (window.taskAttachments.length === 0) {
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        return;
    }

    if (deleteAllBtn) deleteAllBtn.style.display = 'flex';

    const attachmentMetadata = window.taskAttachments.map(att => ({
        name: att.name || 'Unknown', type: att.type || '', size: att.size || 0
    }));

    myGallery = new Viewer(gallery, createViewerConfig(attachmentMetadata));
}

/** * Renders the attachment gallery and initializes the Viewer
 */
async function render() {
    let gallery = document.getElementById('attachment-list');
    if (!gallery) {
        try {
            gallery = await waitForElement('#attachment-list', 3000);
        } catch (_) {
            return;
        }
    }

    const deleteAllBtn = document.getElementById('delete-all-attachments');
    const { tooltip } = setupGallery(gallery);
    createAttachmentElements(gallery, tooltip);
    initializeViewer(gallery, deleteAllBtn);
}

/** * Converts a Blob to a Base64 data URL.
 * @param {Blob} blob - The Blob to convert.
 * @returns {Promise<string>} - A promise that resolves with the Base64 data URL.
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/** * Calculates resized dimensions while maintaining aspect ratio
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {{width: number, height: number}} - The calculated dimensions
 */
function calculateResizedDimensions(width, height, maxWidth, maxHeight) {
    if (width <= maxWidth && height <= maxHeight) return { width, height };

    if (width > height) {
        return { width: maxWidth, height: (height * maxWidth) / width };
    } else {
        return { width: (width * maxHeight) / height, height: maxHeight };
    }
}

/** * Draws an image to a canvas and returns the Base64 data URL
 * @param {HTMLImageElement} img - The image to draw
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {number} quality - JPEG quality (0-1)
 * @returns {string} - The Base64 data URL
 */
function drawImageToCanvas(img, width, height, quality) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
}

/** * Loads an image from a data URL
 * @param {string} dataUrl - The data URL to load
 * @returns {Promise<HTMLImageElement>} - Promise that resolves with the loaded image
 */
function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject('Fehler beim Laden des Bildes.');
        img.src = dataUrl;
    });
}

/** * Compresses an image file to a specified size and quality
 * @param {File} file - The file to compress
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} maxHeight - Maximum height (default: 800)
 * @param {number} quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<string>} - Promise that resolves with Base64 data URL
 */
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const img = await loadImage(event.target.result);
                const dimensions = calculateResizedDimensions(img.width, img.height, maxWidth, maxHeight);
                const compressedBase64 = drawImageToCanvas(img, dimensions.width, dimensions.height, quality);
                resolve(compressedBase64);
            } catch (error) { reject(error); }
        };
        reader.onerror = () => reject('Fehler beim Lesen der Datei.');
        reader.readAsDataURL(file);
    });
}

/** * Deletes all attachments and re-renders the gallery
 */
function deleteAllAttachments() {
    window.taskAttachments = [];
    render();
}

/** * Deletes a single attachment by index and re-renders the gallery
 * @param {number} index - The index of the attachment to delete
 */
function deleteAttachment(index) {
    window.taskAttachments.splice(index, 1);
    render();
}

/** * Attaches the delete all attachments event listener on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const deleteAllBtn = document.getElementById('delete-all-attachments');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllAttachments);
    }
});

/** * Initializes drag-and-drop functionality for attachments
 */
window.initAttachmentDragAndDrop = function () {
    const dropZone = document.querySelector('.select-wrapper.attachment-input-field');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, preventDefaults, false); });

    ['dragenter', 'dragover'].forEach(eventName => { dropZone.addEventListener(eventName, highlight, false); });

    ['dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, unhighlight, false); });

    dropZone.addEventListener('drop', handleDrop, false);
}

/** * Prevents default behavior for drag-and-drop events
 * @param {DragEvent} e - The drag event
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/** * Highlights the drop zone on drag enter/over
 * @param {DragEvent} e - The drag event
 */
function highlight(e) {
    const dropZone = document.querySelector('.select-wrapper.attachment-input-field');
    dropZone.classList.add('highlight');
}

/** * Unhighlights the drop zone on drag leave/drop
 * @param {DragEvent} e - The drag event
 */
function unhighlight(e) {
    const dropZone = document.querySelector('.select-wrapper.attachment-input-field');
    dropZone.classList.remove('highlight');
}

/** * Handles files dropped into the drop zone
 * @param {DragEvent} e - The drop event
 */
async function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        for (const file of files) {
            await processAndAddAttachment(file);
        }
        render();
    }
}

/** * Clears all attachments and re-renders the gallery
 */
function clearAttachments() {
    window.taskAttachments = [];
    render();
}
window.clearAttachments = clearAttachments;

/** * Initializes the attachment UI components and event listeners
 */
window.initAttachmentUI = async function () {
    try {
        await waitForElement('#attachment-input', 3000);
        await waitForElement('#attachment-list', 3000);
    } catch (_) { /* Noob */ }

    attachAttachmentListener();
    if (window.initAttachmentDragAndDrop) window.initAttachmentDragAndDrop();
    const deleteAllBtn = document.getElementById('delete-all-attachments');
    if (deleteAllBtn) {
        deleteAllBtn.removeEventListener('click', deleteAllAttachments);
        deleteAllBtn.addEventListener('click', deleteAllAttachments);
    }
    render();
};
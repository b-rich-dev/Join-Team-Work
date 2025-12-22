window.taskAttachments = [];
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

/** * Checks if the file format is either JPEG or PNG.
 * @param {File} file - The file to check
 * @returns {boolean} - True if format is valid, false otherwise
 */
function checkRightFormat(file) {
    if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
        if (window.showWrongFormatErrorMsg) window.showWrongFormatErrorMsg();
        return false;
    }
    return true;
}

/** * Processes and adds a single file as attachment after validation and compression
 * @param {File} file - The file to process
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function processAndAddAttachment(file) {
    if (!checkRightFormat(file)) return false;

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

/** * Deletes a single attachment by index
 * @param {number} index - The index of the attachment to delete
 */
function deleteAttachment(index) {
    window.taskAttachments.splice(index, 1);
    if (window.renderAttachments) window.renderAttachments();
}

/** * Deletes all attachments
 */
function deleteAllAttachments() {
    window.taskAttachments = [];
    if (window.renderAttachments) window.renderAttachments();
}

/** * Clears all attachments
 */
function clearAttachments() {
    window.taskAttachments = [];
    if (window.renderAttachments) window.renderAttachments();
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

/** * Expose functions to the global scope for use in other modules
 */
window.processAndAddAttachment = processAndAddAttachment;
window.deleteAttachment = deleteAttachment;
window.deleteAllAttachments = deleteAllAttachments;
window.clearAttachments = clearAttachments;
window.waitForElement = waitForElement;
/** * Shows error message for wrong file format. */
export function showAvatarWrongFormatErrorMsg() {
    const msg = document.getElementById('avatarWrongFormatErrorMsg');
    if (!msg) return;
    msg.classList.remove('hidden', 'slide-out');
    msg.classList.add('slide-in');
}

/** * Hides error message for wrong file format. */
export async function hideAvatarWrongFormatErrorMsg() {
    const msg = document.getElementById('avatarWrongFormatErrorMsg');
    if (!msg) return;
    msg.classList.remove('slide-in');
    msg.classList.add('slide-out');
    await new Promise(resolve => setTimeout(resolve, 400));
    msg.classList.add('hidden');
}

/** * Shows error message for file size limit. */
export function showAvatarLimitErrorMsg() {
    const msg = document.getElementById('avatarLimitErrorMsg');
    if (!msg) return;
    msg.classList.remove('hidden', 'slide-out');
    msg.classList.add('slide-in');
}

/** * Hides error message for file size limit.*/
export async function hideAvatarLimitErrorMsg() {
    const msg = document.getElementById('avatarLimitErrorMsg');
    if (!msg) return;
    msg.classList.remove('slide-in');
    msg.classList.add('slide-out');
    await new Promise(resolve => setTimeout(resolve, 400));
    msg.classList.add('hidden');
}

/** Global variable to store current avatar image data. */
if (!window.__avatarErrorCloseBound) {
    document.addEventListener('click', async (e) => {
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

/** * Calculates scaled dimensions maintaining aspect ratio.
 * @param {number} width - Original width.
 * @param {number} height - Original height.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 * @returns {{width: number, height: number}} Scaled dimensions.
 */
export function calculateScaledDimensions(width, height, maxWidth, maxHeight) {
    if (width <= maxWidth && height <= maxHeight) return { width, height };
    if (width > height) return { width: maxWidth, height: (height * maxWidth) / width };

    return { width: (width * maxHeight) / height, height: maxHeight };
}

/** * Draws image on canvas and exports as base64.
 * @param {Image} img - Image to draw.
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 * @param {number} quality - JPEG quality.
 * @returns {string} Base64 data URL.
 */
export function drawImageToBase64(img, width, height, quality) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
}

/** * Processes image load event and compresses image.
 * @param {Event} event - FileReader load event.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 * @param {number} quality - JPEG quality.
 * @param {Function} resolve - Promise resolve function.
 * @param {Function} reject - Promise reject function.
 */
export function processImageLoad(event, maxWidth, maxHeight, quality, resolve, reject) {
    const img = new Image();
    img.onload = () => {
        const { width, height } = calculateScaledDimensions(img.width, img.height, maxWidth, maxHeight);
        const base64 = drawImageToBase64(img, width, height, quality);
        resolve(base64);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = event.target.result;
}

/** * Compresses an image file to specified dimensions and quality.
 * @param {File} file - The image file to compress.
 * @param {number} maxWidth - Maximum width in pixels (default: 200).
 * @param {number} maxHeight - Maximum height in pixels (default: 200).
 * @param {number} quality - JPEG quality 0-1 (default: 0.9).
 * @returns {Promise<string>} The compressed image as base64 data URL.
 */
export function compressAvatarImage(file, maxWidth = 200, maxHeight = 200, quality = 0.9) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => processImageLoad(event, maxWidth, maxHeight, quality, resolve, reject);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/** * Calculates the byte size of a base64 string.
 * @param {string} dataUrl - The base64 data URL.
 * @returns {number} Size in bytes.
 */
export function base64PayloadBytes(dataUrl) {
    if (!dataUrl) return 0;
    const comma = dataUrl.indexOf(',');
    const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    const len = b64.length;
    const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((len * 3) / 4) - padding);
}

/** * Validates avatar file type.
 * @param {File} file - File to validate.
 * @returns {boolean} True if valid.
 */
export function validateAvatarFileType(file) {
    return file.type.startsWith('image/jpeg') || file.type.startsWith('image/png');
}

/** * Updates the avatar display element with an image.
 * @param {HTMLElement} avatarElement - The avatar container element.
 * @param {string} base64Image - The base64 image data URL.
 */
export function updateAvatarDisplay(avatarElement, base64Image) {
    if (!avatarElement) return;

    avatarElement.style.backgroundImage = `url(${base64Image})`;

    const svg = avatarElement.querySelector('svg');
    if (svg) svg.style.display = 'none';

    avatarElement.innerHTML = '';
    avatarElement.style.backgroundImage = `url(${base64Image})`;
}

/** * Gets default user icon SVG.
 * @returns {string} SVG markup.
 */
export function getDefaultUserIconSVG() {
    return `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.0001 22.0001C19.0667 22.0001 16.5556 20.9556 14.4667 18.8667C12.3779 16.7779 11.3334 14.2667 11.3334 11.3334C11.3334 8.40008 12.3779 5.88897 14.4667 3.80008C16.5556 1.71119 19.0667 0.666748 22.0001 0.666748C24.9334 0.666748 27.4445 1.71119 29.5334 3.80008C31.6223 5.88897 32.6667 8.40008 32.6667 11.3334C32.6667 14.2667 31.6223 16.7779 29.5334 18.8667C27.4445 20.9556 24.9334 22.0001 22.0001 22.0001ZM38.0001 43.3334H6.00008C4.53341 43.3334 3.27786 42.8112 2.23341 41.7668C1.18897 40.7223 0.666748 39.4668 0.666748 38.0001V35.8667C0.666748 34.3556 1.05564 32.9667 1.83341 31.7001C2.61119 30.4334 3.64453 29.4667 4.93341 28.8001C7.68897 27.4223 10.489 26.389 13.3334 25.7001C16.1779 25.0112 19.0667 24.6667 22.0001 24.6667C24.9334 24.6667 27.8223 25.0112 30.6667 25.7001C33.5112 26.389 36.3112 27.4223 39.0667 28.8001C40.3556 29.4667 41.389 30.4334 42.1667 31.7001C42.9445 32.9667 43.3334 34.3556 43.3334 35.8667V38.0001C43.3334 39.4668 42.8112 40.7223 41.7668 41.7668C40.7223 42.8112 39.4668 43.3334 38.0001 43.3334ZM6.00008 38.0001H38.0001V35.8667C38.0001 35.3779 37.8779 34.9334 37.6334 34.5334C37.389 34.1334 37.0667 33.8223 36.6667 33.6001C34.2668 32.4001 31.8445 31.5001 29.4001 30.9001C26.9556 30.3001 24.489 30.0001 22.0001 30.0001C19.5112 30.0001 17.0445 30.3001 14.6001 30.9001C12.1556 31.5001 9.73341 32.4001 7.33342 33.6001C6.93341 33.8223 6.61119 34.1334 6.36675 34.5334C6.1223 34.9334 6.00008 35.3779 6.00008 35.8667V38.0001ZM22.0001 16.6667C23.4667 16.6667 24.7223 16.1445 25.7668 15.1001C26.8112 14.0556 27.3334 12.8001 27.3334 11.3334C27.3334 9.86675 26.8112 8.61119 25.7668 7.56675C24.7223 6.5223 23.4667 6.00008 22.0001 6.00008C20.5334 6.00008 19.2779 6.5223 18.2334 7.56675C17.189 8.61119 16.6667 9.86675 16.6667 11.3334C16.6667 12.8001 17.189 14.0556 18.2334 15.1001C19.2779 16.1445 20.5334 16.6667 22.0001 16.6667Z" fill="var(--white)"/>
            </svg>`;
}

/** * Resets the avatar display to default (no image).
 * @param {HTMLElement} avatarElement - The avatar container element.
 * @param {string} initials - The contact initials to display.
 * @param {string} avatarColor - The avatar background color.
 */
export function resetAvatarDisplay(avatarElement, initials = '', avatarColor = '--borderGrey') {
    if (!avatarElement) return;

    avatarElement.style.backgroundImage = 'none';

    if (initials) {
        avatarElement.innerHTML = initials;
        const colorValue = avatarColor?.startsWith('--') ? `var(${avatarColor})` : avatarColor;
        avatarElement.style.backgroundColor = colorValue;
    } else {
        avatarElement.innerHTML = getDefaultUserIconSVG();
        avatarElement.style.backgroundColor = 'var(--borderGrey)';
    }
}

/** * Prevents default drag behaviors.
 * @param {HTMLElement} element - Element to attach handlers to.
 */
export function preventDefaultDrag(element) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        element.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
}

/** * Adds drag highlight effect.
 * @param {HTMLElement} element
 */
export function addDragHighlight(element) {
    ['dragenter', 'dragover'].forEach(eventName => {
        element.addEventListener(eventName, () => {
            element.style.opacity = '0.7';
            element.style.cursor = 'copy';
        }, false);
    });
}

/** * Removes drag highlight effect.
 * @param {HTMLElement} element - Element to unhighlight.
 */
export function removeDragHighlight(element) {
    ['dragleave', 'drop'].forEach(eventName => {
        element.addEventListener(eventName, () => {
            element.style.opacity = '1';
            element.style.cursor = 'default';
        }, false);
    });
}

/** * Sets up drag and drop functionality for avatar element.
 * @param {HTMLElement} avatarElement - The avatar container element.
 * @param {Function} onFileDrop - Callback function when file is dropped.
 */
export function setupDragAndDrop(avatarElement, onFileDrop) {
    if (!avatarElement) return;

    preventDefaultDrag(avatarElement);
    addDragHighlight(avatarElement);
    removeDragHighlight(avatarElement);

    avatarElement.addEventListener('drop', async (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) await onFileDrop(files[0]);
    }, false);
}
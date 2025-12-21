/** * Extracts the base64 string from an avatar image (handles both old and new format).
 * @param {string|object} avatarImage - The avatar image (string for old format, object for new format).
 * @returns {string|null} The base64 string or null if not available.
 */
export function getAvatarBase64(avatarImage) {
    if (!avatarImage) return null;
    if (typeof avatarImage === 'object' && avatarImage.base64) return avatarImage.base64;
    if (typeof avatarImage === 'string') return avatarImage;
    return null;
}

/** * Normalizes an avatar image to a standard object format.
 * @param {string|object} avatarImage - The avatar image (string for old format, object for new format).
 * @returns {object|null} The normalized avatar object or null if input is invalid.
 */
export function normalizeAvatar(avatarImage) {
    if (!avatarImage) return null;
    if (isNormalizedAvatar(avatarImage)) return createNormalizedObject(avatarImage);
    if (typeof avatarImage === 'string') return normalizeStringAvatar(avatarImage);
    return null;
}

/** * Checks if the avatar is already in normalized object format.
 * @param {any} avatar - The avatar to check.
 * @returns {boolean} True if normalized, false otherwise.
 */
function isNormalizedAvatar(avatar) {
    return typeof avatar === 'object' && avatar.base64;
}

/** * Creates a normalized avatar object from the given avatar data.
 * @param {object} avatar - The avatar data.
 * @returns {object} The normalized avatar object.
 */
function createNormalizedObject(avatar) {
    return {
        name: avatar.name || 'avatar.jpg',
        type: avatar.type || 'image/jpeg',
        base64: avatar.base64,
        size: avatar.size || 0
    };
}

/** * Normalizes a string avatar (base64 data URI) to a standard object format.
 * @param {string} avatarString - The avatar string (base64 data URI).
 * @returns {object} The normalized avatar object.
 */
function normalizeStringAvatar(avatarString) {
    const base64Data = extractBase64(avatarString);
    const mimeType = detectMimeType(avatarString);
    const fileSize = calculateBase64Size(base64Data);
    
    return {
        name: 'avatar.jpg',
        type: mimeType,
        base64: avatarString,
        size: fileSize
    };
}

/** Extracts the base64 portion from a data URI.
 * @param {string} dataUri - The data URI string.
 * @returns {string} The base64 portion of the data URI.
 */
function extractBase64(dataUri) {
    const commaIndex = dataUri.indexOf(',');
    return commaIndex >= 0 ? dataUri.slice(commaIndex + 1) : dataUri;
}

/** Detects the MIME type from a data URI.
 * @param {string} dataUri - The data URI string.
 * @returns {string} The detected MIME type.
 */
function detectMimeType(dataUri) {
    if (dataUri.startsWith('data:image/png')) return 'image/png';
    if (dataUri.startsWith('data:image/')) {
        const match = dataUri.match(/^data:([^;]+);/);
        return match ? match[1] : 'image/jpeg';
    }
    return 'image/jpeg';
}

/** Calculates the size in bytes of a base64 encoded string.
 * @param {string} base64String - The base64 encoded string.
 * @returns {number} The size in bytes.
 */
function calculateBase64Size(base64String) {
    const length = base64String.length;
    const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((length * 3) / 4) - padding);
}
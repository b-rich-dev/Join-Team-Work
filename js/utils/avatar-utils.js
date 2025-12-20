/**
 * Utility functions for handling avatar images.
 */

/**
 * Extracts the base64 string from an avatar image (handles both old and new format).
 * @param {string|object} avatarImage - The avatar image (string for old format, object for new format).
 * @returns {string|null} The base64 string or null if not available.
 */
export function getAvatarBase64(avatarImage) {
    if (!avatarImage) return null;
    
    // New format: object with base64 property
    if (typeof avatarImage === 'object' && avatarImage.base64) {
        return avatarImage.base64;
    }
    
    // Old format: direct base64 string
    if (typeof avatarImage === 'string') {
        return avatarImage;
    }
    
    return null;
}

/**
 * Normalizes an avatar image to the new format with metadata.
 * @param {string|object} avatarImage - The avatar image in old or new format.
 * @returns {object|null} Normalized avatar object with name, type, base64, size.
 */
export function normalizeAvatar(avatarImage) {
    if (!avatarImage) return null;
    
    // Already in new format
    if (typeof avatarImage === 'object' && avatarImage.base64) {
        return {
            name: avatarImage.name || 'avatar.jpg',
            type: avatarImage.type || 'image/jpeg',
            base64: avatarImage.base64,
            size: avatarImage.size || 0
        };
    }
    
    // Old format: convert string to object
    if (typeof avatarImage === 'string') {
        // Calculate size from base64
        const comma = avatarImage.indexOf(',');
        const b64 = comma >= 0 ? avatarImage.slice(comma + 1) : avatarImage;
        const len = b64.length;
        const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
        const size = Math.max(0, Math.floor((len * 3) / 4) - padding);
        
        // Determine type from data URL
        let type = 'image/jpeg';
        if (avatarImage.startsWith('data:image/png')) {
            type = 'image/png';
        } else if (avatarImage.startsWith('data:image/')) {
            const match = avatarImage.match(/^data:([^;]+);/);
            type = match ? match[1] : 'image/jpeg';
        }
        
        return {
            name: 'avatar.jpg',
            type: type,
            base64: avatarImage,
            size: size
        };
    }
    
    return null;
}

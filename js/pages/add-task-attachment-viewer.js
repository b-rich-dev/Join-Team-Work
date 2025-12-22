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
            window.deleteAttachment(index);
            if (window.myAttachmentGallery) window.myAttachmentGallery.hide();
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
 * @returns {Object|null} - The Viewer instance or null
 */
function initializeAttachmentViewer(gallery, deleteAllBtn) {
    if (window.taskAttachments.length === 0) {
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        return null;
    }

    if (deleteAllBtn) deleteAllBtn.style.display = 'flex';

    const attachmentMetadata = window.taskAttachments.map(att => ({ 
        name: att.name || 'Unknown', 
        type: att.type || '', 
        size: att.size || 0 
    }));

    return new Viewer(gallery, createViewerConfig(attachmentMetadata));
}

/** Export the initializeAttachmentViewer function for use in other modules */
window.initializeAttachmentViewer = initializeAttachmentViewer;
/** * Integration file for attachment functionality
 * This file coordinates between core, UI, and event handling modules
 */

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
    if (dropZone) dropZone.classList.add('highlight');
}

/** * Unhighlights the drop zone on drag leave/drop
 * @param {DragEvent} e - The drag event
 */
function unhighlight(e) {
    const dropZone = document.querySelector('.select-wrapper.attachment-input-field');
    if (dropZone) dropZone.classList.remove('highlight');
}

/** * Handles files dropped into the drop zone
 * @param {DragEvent} e - The drop event
 */
async function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0 && window.initAttachmentUI) {
        for (const file of files) {
            if (window.processAndAddAttachment) {
                await window.processAndAddAttachment(file);
            }
        }
        if (window.renderAttachments) window.renderAttachments();
    }
}

/** * Initializes drag-and-drop functionality for attachments
 */
window.initAttachmentDragAndDrop = function () {
    const dropZone = document.querySelector('.select-wrapper.attachment-input-field');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { dropZone.removeEventListener(eventName, preventDefaults, false); });
    ['dragenter', 'dragover'].forEach(eventName => { dropZone.removeEventListener(eventName, highlight, false); });
    ['dragleave', 'drop'].forEach(eventName => { dropZone.removeEventListener(eventName, unhighlight, false); });
    dropZone.removeEventListener('drop', handleDrop, false);


    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, preventDefaults, false); });
    ['dragenter', 'dragover'].forEach(eventName => { dropZone.addEventListener(eventName, highlight, false); });
    ['dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, unhighlight, false); });
    dropZone.addEventListener('drop', handleDrop, false);
}
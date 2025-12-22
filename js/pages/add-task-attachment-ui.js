let myGallery = null;
let attachmentInputHandlerBound = false;
let handleAttachmentInputChangeRef = null;

/** * Adds keyboard support to the attachment input label
 * @param {HTMLInputElement} filepicker - The file input element
 */
function attachKeyboardSupport(filepicker) {
    const uploadLabel = document.querySelector('label[for="attachment-input"].attachment-input-field');
    if (!uploadLabel) return;
    
    // Remove old listener if exists
    if (uploadLabel._keydownHandler) {
        uploadLabel.removeEventListener('keydown', uploadLabel._keydownHandler);
    }
    
    // Create and store the handler
    uploadLabel._keydownHandler = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            const currentFilepicker = document.getElementById("attachment-input");
            if (currentFilepicker) {
                currentFilepicker.click();
            }
        }
    };
    
    uploadLabel.addEventListener('keydown', uploadLabel._keydownHandler);
}

/** * Processes files from file input and renders attachments
 * @param {FileList} files - The files from the input
 */
async function processFileInputChange(files) {
    if (files.length > 0) {
        for (const file of files) {
            await window.processAndAddAttachment(file);
        }
        renderAttachments();
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
    window.myAttachmentGallery = null;
}

/** * Returns the SVG string for the delete icon
 * @param {number} index - The attachment index
 * @returns {string} - The SVG string
 */
function deleteIconSVG(index) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask0_266038_5319_${index}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask><g mask="url(#mask0_266038_5319_${index})"><path d="M7 21C6.45 21 5.97917 20.8042 5.5875 20.4125C5.19583 20.0208 5 19.55 5 19V6C4.71667 6 4.47917 5.90417 4.2875 5.7125C4.09583 5.52083 4 5.28333 4 5C4 4.71667 4.09583 4.47917 4.2875 4.2875C4.47917 4.09583 4.71667 4 5 4H9C9 3.71667 9.09583 3.47917 9.2875 3.2875C9.47917 3.09583 9.71667 3 10 3H14C14.2833 3 14.5208 3.09583 14.7125 3.2875C14.9042 3.47917 15 3.71667 15 4H19C19.2833 4 19.5208 4.09583 19.7125 4.2875C19.9042 4.47917 20 4.71667 20 5C20 5.28333 19.9042 5.52083 19.7125 5.7125C19.5208 5.90417 19.2833 6 19 6V19C19 19.55 18.8042 20.0208 18.4125 20.4125C18.0208 20.8042 17.55 21 17 21H7ZM7 6V19H17V6H7ZM9 16C9 16.2833 9.09583 16.5208 9.2875 16.7125C9.47917 16.9042 9.71667 17 10 17C10.2833 17 10.5208 16.9042 10.7125 16.7125C10.9042 16.5208 11 16.2833 11 16V9C11 8.71667 10.9042 8.47917 10.7125 8.2875C10.5208 8.09583 10.2833 8 10 8C9.71667 8 9.47917 8.09583 9.2875 8.2875C9.09583 8.47917 9 8.71667 9 9V16ZM13 16C13 16.2833 13.0958 16.5208 13.2875 16.7125C13.4792 16.9042 13.7167 17 14 17C14.2833 17 14.5208 16.9042 14.7125 16.7125C14.9042 16.5208 15 16.2833 15 16V9C15 8.71667 14.9042 8.47917 14.7125 8.2875C14.5208 8.09583 14.2833 8 14 8C13.7167 8 13.4792 8.09583 13.2875 8.2875C13.0958 8.47917 13 8.71667 13 9V16Z" fill="white"/></g>
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
    deletebtn.setAttribute('tabindex', '0');
    deletebtn.setAttribute('role', 'button');
    deletebtn.setAttribute('aria-label', 'Delete attachment');
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
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', `View attachment ${name}. Press Delete to remove`);
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
        window.deleteAttachment(index);
    });
    deleteBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            window.deleteAttachment(index);
        }
    });
}

/** * Attaches keyboard event listeners to the attachment element
 * @param {HTMLElement} element - The attachment element
 * @param {HTMLImageElement} imgElement - The image element
 * @param {number} index - The attachment index
 */
function attachKeyboardEvents(element, imgElement, index) {
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            imgElement.click();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            if (window.deleteAttachment) {
                window.deleteAttachment(index);
            }
        }
    });
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

    const imgElement = createImageElement(image, index);
    imageElement.appendChild(imgElement);
    imageElement.appendChild(createDescriptionElement(image.name));
    const deletebtn = createDeleteButton(index);
    imageElement.appendChild(deletebtn);

    attachTooltipEvents(imageElement, tooltip, image.name);
    attachDeleteEvent(deletebtn, index);
    attachKeyboardEvents(imageElement, imgElement, index);
    return imageElement;
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

/** * Renders the attachment gallery and initializes the Viewer
 */
async function renderAttachments() {
    let gallery = document.getElementById('attachment-list');
    if (!gallery) {
        try {
            gallery = await window.waitForElement('#attachment-list', 3000);
        } catch (_) {
            return;
        }
    }

    const deleteAllBtn = document.getElementById('delete-all-attachments');
    const { tooltip } = setupGallery(gallery);
    createAttachmentElements(gallery, tooltip);
    
    if (window.initializeAttachmentViewer) {
        myGallery = window.initializeAttachmentViewer(gallery, deleteAllBtn);
    }
    
    window.myAttachmentGallery = myGallery;
}

/** * Attaches the delete all attachments event listener on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const deleteAllBtn = document.getElementById('delete-all-attachments');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', window.deleteAllAttachments);
    }
});

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
            await window.processAndAddAttachment(file);
        }
        renderAttachments();
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

/** * Initializes the attachment UI components and event listeners
 */
window.initAttachmentUI = async function () {
    try {
        await window.waitForElement('#attachment-input', 3000);
        await window.waitForElement('#attachment-list', 3000);
    } catch (_) { /* Ignored */ }

    attachAttachmentListener();
    if (window.initAttachmentDragAndDrop) window.initAttachmentDragAndDrop();
    const deleteAllBtn = document.getElementById('delete-all-attachments');
    if (deleteAllBtn) {
        deleteAllBtn.removeEventListener('click', window.deleteAllAttachments);
        deleteAllBtn.addEventListener('click', window.deleteAllAttachments);
    }
    renderAttachments();
};

/** * Exposes the renderAttachments function globally
 */
window.renderAttachments = renderAttachments;
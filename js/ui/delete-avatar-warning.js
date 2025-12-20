/**
 * Delete Avatar Warning Module
 * Handles the confirmation dialog before deleting a contact's avatar.
 */

let deleteAvatarCallback = null;
let deleteAvatarSuccessCallback = null;
let listenersInitialized = false;

/**
 * Initialize listeners once when module loads
 */
function initializeListeners() {
    if (listenersInitialized) return;
    
    const warningElement = document.getElementById('deleteAvatarWarning');
    const closeBtn = document.getElementById('deleteAvatarClose');
    const noBtn = document.getElementById('deleteAvatarNo');
    const yesBtn = document.getElementById('deleteAvatarYes');
    
    if (warningElement) warningElement.addEventListener('click', handleBackdropClick);
    if (closeBtn) closeBtn.addEventListener('click', handleCancel);
    if (noBtn) noBtn.addEventListener('click', handleCancel);
    if (yesBtn) yesBtn.addEventListener('click', handleConfirm);
    
    listenersInitialized = true;
}

/**
 * Shows the delete avatar warning dialog.
 * @param {Function} onConfirm - Callback function to execute when user confirms deletion.
 * @param {Function} onSuccess - Optional callback for success message.
 */
export function showDeleteAvatarWarning(onConfirm, onSuccess = null) {
    // Set callbacks FIRST before showing dialog
    deleteAvatarCallback = onConfirm;
    deleteAvatarSuccessCallback = onSuccess;
    
    const warningElement = document.getElementById('deleteAvatarWarning');
    
    if (!warningElement) {
        console.error('Delete avatar warning element not found!');
        return;
    }
    
    // Initialize listeners once
    initializeListeners();
    
    warningElement.classList.remove('hidden');
}

/**
 * Hides the delete avatar warning dialog.
 */
export function hideDeleteAvatarWarning() {
    const warningElement = document.getElementById('deleteAvatarWarning');
    if (!warningElement) return;
    
    warningElement.classList.add('hidden');
    // Don't set callbacks to null here, they might still be in use
    setTimeout(() => {
        deleteAvatarCallback = null;
        deleteAvatarSuccessCallback = null;
    }, 100);
}

/**
 * Shows a success message after avatar deletion.
 * @param {string} message - The success message to display.
 */
export function showAvatarDeleteSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'avatar-delete-success';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #29ABE2;
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        font-size: 16px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/**
 * Shows an error message.
 * @param {string} message - The error message to display.
 */
export function showAvatarDeleteError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'avatar-delete-error';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #FF3D00;
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        font-size: 16px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Handles clicks on the backdrop (outside the dialog content).
 * @param {MouseEvent} event - The click event.
 */
function handleBackdropClick(event) {
    if (event.target.id === 'deleteAvatarWarning') {
        hideDeleteAvatarWarning();
    }
}

/**
 * Handles the cancel action (No button or X button).
 */
function handleCancel() {
    hideDeleteAvatarWarning();
}

/**
 * Handles the confirm action (Yes button).
 */
async function handleConfirm() {
    if (!deleteAvatarCallback || typeof deleteAvatarCallback !== 'function') {
        console.error('No valid callback set!');
        hideDeleteAvatarWarning();
        return;
    }
    
    // Call the callback
    await deleteAvatarCallback();
    hideDeleteAvatarWarning();
}

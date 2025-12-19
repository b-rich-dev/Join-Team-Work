/**
 * Delete Contact Warning Module
 * Handles the confirmation dialog before deleting a contact.
 */

let deleteConfirmCallback = null;

/**
 * Shows the delete contact warning dialog.
 * @param {Function} onConfirm - Callback function to execute when user confirms deletion.
 */
export function showDeleteContactWarning(onConfirm) {
    deleteConfirmCallback = onConfirm;
    
    const warningElement = document.getElementById('deleteContactWarning');
    if (!warningElement) {
        console.error('Delete warning element not found!');
        return;
    }
    
    warningElement.classList.remove('hidden');
    setupDeleteWarningListeners();
}

/**
 * Hides the delete contact warning dialog.
 */
export function hideDeleteContactWarning() {
    const warningElement = document.getElementById('deleteContactWarning');
    if (!warningElement) return;
    
    warningElement.classList.add('hidden');
    deleteConfirmCallback = null;
    removeDeleteWarningListeners();
}

/**
 * Sets up event listeners for the warning dialog buttons.
 */
function setupDeleteWarningListeners() {
    const warningElement = document.getElementById('deleteContactWarning');
    const closeBtn = document.getElementById('deleteWarningClose');
    const noBtn = document.getElementById('deleteWarningNo');
    const yesBtn = document.getElementById('deleteWarningYes');
    
    if (warningElement) warningElement.addEventListener('click', handleBackdropClick);
    if (closeBtn) closeBtn.addEventListener('click', handleCancel);
    if (noBtn) noBtn.addEventListener('click', handleCancel);
    if (yesBtn) yesBtn.addEventListener('click', handleConfirm);
}

/**
 * Removes event listeners from the warning dialog buttons.
 */
function removeDeleteWarningListeners() {
    const warningElement = document.getElementById('deleteContactWarning');
    const closeBtn = document.getElementById('deleteWarningClose');
    const noBtn = document.getElementById('deleteWarningNo');
    const yesBtn = document.getElementById('deleteWarningYes');
    
    if (warningElement) warningElement.removeEventListener('click', handleBackdropClick);
    if (closeBtn) closeBtn.removeEventListener('click', handleCancel);
    if (noBtn) noBtn.removeEventListener('click', handleCancel);
    if (yesBtn) yesBtn.removeEventListener('click', handleConfirm);
}

/**
 * Handles clicks on the backdrop (outside the dialog content).
 * @param {MouseEvent} event - The click event.
 */
function handleBackdropClick(event) {
    if (event.target.id === 'deleteContactWarning') {
        hideDeleteContactWarning();
    }
}

/**
 * Handles the cancel action (No button or X button).
 */
function handleCancel() {
    hideDeleteContactWarning();
}

/**
 * Handles the confirm action (Yes button).
 */
function handleConfirm() {
    if (deleteConfirmCallback && typeof deleteConfirmCallback === 'function') {
        deleteConfirmCallback();
    }
    hideDeleteContactWarning();
}

import { getTaskOverlay } from "../templates/task-details-template.js";
import { openSpecificOverlay, closeSpecificOverlay, initOverlayListeners, loadOverlayHtmlOnce } from "../events/overlay-handler.js";
import { getAddTaskFormHTML } from "../templates/add-task-template.js";
import { setCategoryFromTaskForCard, setAssignedContactsFromTaskForCard } from "../events/dropdown-menu-auxiliary-function.js";
import { CWDATA } from "../data/task-to-firbase.js";
import { editedTaskData, calculateSubtaskProgress } from "./render-card.js";
import { setupDropdownMenuListeners, handleDropdownClick, setupMoveTaskListeners, handleMoveTask } from "./dropdown-move-handler.js";
import { refreshBoardSite } from "./render-board.js";
import { setupSubtaskCheckboxListener, handleSubtaskCheckboxChange } from "./subtask-checkbox-handler.js";
import { setupEditButtonListener, handleEditButtonClick } from "./edit-button-handler.js";
import { setupDeleteButtonListener, handleDeleteButtonClick } from "./delete-button-handler.js";
import { setupEditFormModules } from "./edit-form-modules.js";
import { setupCancelEditBtn, setupTaskEditFormListener, handleTaskEditFormSubmit } from "./edit-form-handler.js";

export let detailOverlayElement = null;
export let editOverlayElement = null;

/** * Loads the detail overlay HTML once and assigns it to detailOverlayElement.
 * @returns {Promise<void>} Resolves when the overlay is loaded.
 */
async function loadDetailOverlayHtmlOnce() {
  if (detailOverlayElement) return;
  detailOverlayElement = await loadOverlayHtmlOnce(
    "../js/templates/task-details-overlay.html",
    "overlay-task-detail"
  );
}

/** * Loads the edit overlay HTML once and assigns it to editOverlayElement.
 * @returns {Promise<void>} Resolves when the overlay is loaded.
 */
async function loadEditOverlayHtmlOnce() {
  if (editOverlayElement) return;
  editOverlayElement = await loadOverlayHtmlOnce(
    "../js/templates/task-detail-edit-overlay.html",
    "overlay-task-detail-edit"
  );
}

/** * Registers event listeners for task card detail overlays.
 * @param {object} boardData - The board data object containing tasks, contacts, etc.
 * @param {function} updateBoardFunction - Callback function to update the board after changes.
 * @returns {Promise<void>} Resolves when listeners are registered.
 */
export async function registerTaskCardDetailOverlay(boardData, updateBoardFunction) {
  await loadDetailOverlayHtmlOnce();
  await loadEditOverlayHtmlOnce();
  const cards = document.querySelectorAll(".task-card");
  cards.forEach((card) => {
    setupDropdownMenuListeners(
      card,
      boardData,
      handleDropdownClick,
      (dropdownMenu, boardData) =>
        setupMoveTaskListeners(dropdownMenu, boardData, (ev, boardData, direction) => handleMoveTask(ev, boardData, direction, CWDATA))
    );
    setupCardClickListener(card, boardData, updateBoardFunction);
  });
}

/** * Sets up click listener for a task card.
 * @param {Element} card - The task card DOM element.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board.
 * @returns {void}
 */
function setupCardClickListener(card, boardData, updateBoardFunction) {
  const oldClickListener = card.getAttribute("data-has-click-listener");
  if (oldClickListener) {
    card.removeEventListener("click", card._currentClickListener);
  }
  const newClickListener = (e) =>
    handleCardClick(e, card, boardData, updateBoardFunction);
  card.addEventListener("click", newClickListener);
  card.setAttribute("data-has-click-listener", "true");
  card._currentClickListener = newClickListener;
}

/** * Handles click event for a task card.
 * @param {Event} e - The click event.
 * @param {Element} card - The task card DOM element.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board.
 * @returns {void}
 */
function handleCardClick(e, card, boardData, updateBoardFunction) {
  if (
    e.target.classList.contains("assigned-initials-circle") ||
    e.target.closest(".priority-icon") ||
    e.target.closest(".dropdown-menu-board-site-btn") ||
    e.target.closest(".dropdown-menu-board-site")
  )
    return;
  const taskId = card.id;
  const task = boardData.tasks[taskId];
  if (!task || !detailOverlayElement) return;
  renderDetailOverlay(taskId, boardData, updateBoardFunction);
}

/** * Renders the detail overlay for a task.
 * @param {string} taskId - The ID of the task.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board.
 * @returns {void}
 */
export function renderDetailOverlay(taskId, boardData, updateBoardFunction) {
  openSpecificOverlay("overlay-task-detail");
  const task = boardData.tasks[taskId];
  const container = detailOverlayElement.querySelector("#task-container");
  if (container) {
    renderTaskOverlayHtml(container, task, taskId, boardData);
    setupSubtaskCheckboxListener(container, task, taskId, boardData);
  }
  setupEditButtonListener(detailOverlayElement, taskId, boardData, updateBoardFunction);
  setupDeleteButtonListener(detailOverlayElement, taskId, boardData, updateBoardFunction);
}

/** * Renders the HTML for the task detail overlay.
 * @param {Element} container - The container DOM element.
 * @param {object} task - The task object.
 * @param {string} taskId - The ID of the task.
 * @param {object} boardData - The board data object.
 * @returns {void}
 */
function renderTaskOverlayHtml(container, task, taskId, boardData) {
  const html = getTaskOverlay(task, taskId, boardData.contacts);
  container.innerHTML = html;
  initializeTaskAttachmentViewer(container, taskId, boardData);
  setupDeleteButtonListeners(container, taskId, boardData);
}

/** * Initializes the task attachment viewer using Viewer.js.
 * @param {Element} container - The container DOM element.
 * @param {string} taskId - The ID of the task.
 * @param {object} boardData - The board data object.
 * @returns {void}
 */
function initializeTaskAttachmentViewer(container, taskId, boardData) {
  try {
    const gallery = container.querySelector('#task-attachment-list');
    if (!gallery) return;
    const hasImages = !!gallery.querySelector('img');
    if (!hasImages || typeof Viewer !== 'function') return;
    destroyExistingViewer();
    const attachmentMetadata = getAttachmentMetadata(gallery);
    window.taskDetailViewer = new Viewer(gallery, createViewerConfig(attachmentMetadata, taskId, boardData));
  } catch (err) {
    console.error('Failed to init task detail viewer:', err);
  }
}

/** * Destroys any existing Viewer instance for task details.
 */
function destroyExistingViewer() {
  if (window.taskDetailViewer) {
    try { window.taskDetailViewer.destroy(); } catch (_) { /* noop */ }
    window.taskDetailViewer = null;
  }
}

/** * Extracts attachment metadata from the gallery element.
 * @param {Element} gallery - The gallery DOM element containing attachment images.
 * @returns {Array} Array of attachment metadata objects.
 */
function getAttachmentMetadata(gallery) {
  return Array.from(gallery.querySelectorAll('img')).map(img => ({
    name: img.getAttribute('data-name') || img.alt || 'Unknown',
    type: img.getAttribute('data-type') || '',
    size: parseInt(img.getAttribute('data-size')) || 0,
    src: img.src
  }));
}

/** * Creates the configuration object for Viewer.js.
 * @param {Array} attachmentMetadata - Array of attachment metadata objects.
 * @param {string} taskId - The ID of the task.
 * @param {object} boardData - The board data object.
 * @returns {object} The Viewer.js configuration object.
 */
function createViewerConfig(attachmentMetadata, taskId, boardData) {
  return {
    inline: false,
    button: true,
    navbar: true,
    title: [1, (image) => createViewerTitle(image, attachmentMetadata)],
    toolbar: getViewerToolbarConfig(),
    delete: async (index) => handleViewerDelete(taskId, index, boardData),
    hide() { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); }
  };
}

/** * Creates the title string for the viewer based on the image and metadata.
 * @param {object} image - The image object from Viewer.js.
 * @param {Array} attachmentMetadata - Array of attachment metadata objects.
 * @returns {string} The formatted title string.
 */
function createViewerTitle(image, attachmentMetadata) {
  let actualIndex = 0;
  if (image?.src) {
    actualIndex = attachmentMetadata.findIndex(meta => meta.src === image.src);
    if (actualIndex === -1) actualIndex = 0;
  }
  const metadata = attachmentMetadata[actualIndex] || {};
  const name = metadata.name || 'Unknown';
  const fileType = extractFileType(metadata.type);
  const sizeKB = metadata.size > 0 ? (metadata.size / 1024).toFixed(2) : '0.00';
  return `${name}   •   ${fileType}   •   ${sizeKB} KB`;
}

/** * Extracts the file type from the MIME type string.
 * @param {string} type - The MIME type string.
 * @returns {string} The extracted file type.
 */
function extractFileType(type) {
  if (!type) return 'FILE';
  if (type.includes('/')) return type.split('/')[1]?.toUpperCase() || 'FILE';
  return type.toUpperCase();
}

/** * Gets the toolbar configuration for Viewer.js.
 * @returns {object} The toolbar configuration object.
 */
function getViewerToolbarConfig() {
  return {
    download: { show: 1, size: 'large' },
    zoomIn: 1,
    zoomOut: 1,
    oneToOne: 1,
    reset: 1,
    prev: 1,
    play: { show: 1, size: 'large' },
    next: 1,
    rotateLeft: 1,
    rotateRight: 1,
    flipHorizontal: 1,
    flipVertical: 1,
    delete: { show: 1, size: 'large' },
  };
}

/** * Handles deletion of an attachment via the viewer.
 * @param {string} taskId - The ID of the task.
 * @param {number} index - The index of the attachment to delete.
 * @param {object} boardData - The board data object.
 * @returns {Promise<void>} Resolves when deletion is complete.
 */
async function handleViewerDelete(taskId, index, boardData) {
  try {
    await deleteAttachmentFromTask(taskId, index, boardData);
    if (window.taskDetailViewer) window.taskDetailViewer.hide();
  } catch (e) {
    console.error('Failed to delete attachment via viewer:', e);
  }
}

/** * Sets up delete button listeners for attachments in the task detail overlay.
 * @param {Element} container - The container DOM element.
 * @param {string} taskId - The ID of the task.
 * @param {object} boardData - The board data object.
 * @returns {void}
 */
function setupDeleteButtonListeners(container, taskId, boardData) {
  const deleteBtns = container.querySelectorAll('.delete-attachment-btn[data-action="delete"]');
  deleteBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => handleAttachmentDeleteClick(e, taskId, boardData));
  });
}

/** * Handles click event for deleting an attachment.
 * @param {Event} e - The click event.
 * @param {string} taskId - The ID of the task.
 * @param {object} boardData - The board data object.
 * @returns {Promise<void>} Resolves when deletion is handled.
 */
async function handleAttachmentDeleteClick(e, taskId, boardData) {
  e.stopPropagation();
  const item = e.target.closest('.attachment-item');
  const indexStr = item?.getAttribute('data-index');
  const index = indexStr ? Number(indexStr) : NaN;
  if (Number.isNaN(index)) return;
  try {
    await deleteAttachmentFromTask(taskId, index, boardData);
  } catch (err) {
    console.error('Failed to delete attachment:', err);
  }
}

/** Deletes an attachment from a task and updates the overlay.
 * @param {string} taskId - The ID of the task.
 * @param {number} index - The index of the attachment to delete.
 * @param {object} boardData - The board data object.
 * @returns {Promise<void>} Resolves when deletion and update are complete.
 */
async function deleteAttachmentFromTask(taskId, index, boardData) {
  const task = boardData.tasks[taskId];
  if (!task || !Array.isArray(task.attachments)) return;
  const updatedAttachments = task.attachments.filter((_, i) => i !== index);
  const updatedTask = { ...task, attachments: updatedAttachments };

  try {
    await CWDATA({ [taskId]: updatedTask }, boardData);
    boardData.tasks[taskId] = updatedTask;
  } catch (e) {
    console.error('Persisting updated task failed:', e);
    throw e;
  }
  const container = detailOverlayElement?.querySelector('#task-container');
  if (container) renderTaskOverlayHtml(container, updatedTask, taskId, boardData);
}

/** Renders the edit overlay for a task.
 * @param {string} taskToEditId - The ID of the task to edit.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board.
 */
export function renderEditOverlay(taskToEditId, boardData, updateBoardFunction) {
  closeSpecificOverlay("overlay-task-detail");
  openSpecificOverlay("overlay-task-detail-edit");
  if (!editOverlayElement) return;
  const taskToEdit = boardData.tasks[taskToEditId];
  const taskEditContainer = editOverlayElement.querySelector("#task-edit-container");
  if (taskEditContainer) {
    renderEditFormHtml(taskEditContainer, taskToEdit);
    setupEditFormModules(taskEditContainer, taskToEdit, boardData);
    setupCancelEditBtn(taskEditContainer, taskToEditId, boardData, updateBoardFunction);
    setupTaskEditFormListener(taskEditContainer, taskToEdit, taskToEditId, boardData, updateBoardFunction);
  }
}

/** * Renders the HTML for the edit form.
 * @param {Element} container - The container DOM element.
 * @param {object} taskToEdit - The task object to edit.
 * @returns {void}
 */
function renderEditFormHtml(container, taskToEdit) {
  container.innerHTML = getAddTaskFormHTML(taskToEdit);
}
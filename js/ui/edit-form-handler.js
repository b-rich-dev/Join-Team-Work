import { extractTaskFormData } from "../utils/form-utils.js";
import { getFormattedDate } from "../utils/date-utils.js";
import { CWDATA } from "../data/task-to-firbase.js";
import { closeSpecificOverlay } from "../events/overlay-handler.js";
import { renderDetailOverlay } from "./render-card-events.js";
import { refreshSummaryIfExists } from "../../main.js";

/** * Sets up the cancel button for the edit form overlay.
 * @param {HTMLElement} container - The container element for the edit form.
 * @param {string} taskToEditId - The ID of the task being edited.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board.
 */
export function setupCancelEditBtn(container, taskToEditId, boardData, updateBoardFunction) {
  const cancelEditBtn = container.querySelector(".cancel-btn");
  if (cancelEditBtn) {
    cancelEditBtn.onclick = () => {
      closeSpecificOverlay("overlay-task-detail-edit");
      renderDetailOverlay(taskToEditId, boardData, updateBoardFunction);
    };
  }
}

/** * Sets up the submit listener for the edit form.
 * @param {HTMLElement} container - The container element for the edit form.
 * @param {object} taskToEdit - The task object being edited.
 * @param {string} taskToEditId - The ID of the task being edited.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board.
 */
export function setupTaskEditFormListener(container, taskToEdit, taskToEditId, boardData, updateBoardFunction) {
  const taskEditForm = container.querySelector("#add-task-form");
  if (taskEditForm) {
    taskEditForm.addEventListener("submit", (formEvent) =>
      handleTaskEditFormSubmit(
        formEvent,
        taskEditForm,
        taskToEdit,
        taskToEditId,
        boardData,
        updateBoardFunction
      )
    );
  }
}

/** * Handles the submit event for the edit form.
 * @param {Event} formEvent - The submit event.
 * @param {HTMLFormElement} taskEditForm - The edit form element.
 * @param {object} taskToEdit - The task object being edited.
 * @param {string} taskToEditId - The ID of the task being edited.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board.
 * @returns {Promise<void>} Resolves when the form is processed.
 */
export async function handleTaskEditFormSubmit(formEvent, taskEditForm, taskToEdit, taskToEditId, boardData, updateBoardFunction) {
  if (!isSubmitEvent(formEvent)) return;
  formEvent.preventDefault();
  const { fetchData, contactsObj } = prepareEditData(boardData);
  const editTaskObjekt = buildEditedTask(taskEditForm, taskToEdit, contactsObj);
  const currentTaskId = taskEditForm.getAttribute("data-task-id") || taskToEditId;
  await saveEditedTask(currentTaskId, editTaskObjekt, fetchData);
  await updateUIAfterEdit(taskToEditId, fetchData, updateBoardFunction);
}

/** * Prepares data needed for editing the task.
 * @param {object} boardData - The board data object.
 * @returns {object} An object containing fetched data and contacts.
 */
function prepareEditData(boardData) {
  const fetchData = window.firebaseData || boardData;
  const contactsObj = fetchData?.contacts || {};
  return { fetchData, contactsObj };
}

/** * Builds the edited task object from the form and existing task.
 * @param {HTMLFormElement} taskEditForm - The edit form element.
 * @param {object} taskToEdit - The task object being edited.
 * @param {object} contactsObj - The contacts object from the board data.
 * @returns {object} The updated task object.
 */
function buildEditedTask(taskEditForm, taskToEdit, contactsObj) {
  const formData = extractTaskFormData(taskEditForm, contactsObj, taskToEdit);
  return buildEditTaskObject(formData, taskToEdit);
}

/** * Saves the edited task to Firebase.
 * @param {string} taskId - The ID of the task being edited.
 * @param {object} editedTask - The updated task object.
 * @param {object} fetchData - The data object to use for saving.
 * @returns {Promise<void>} Resolves when the task is saved.
 */
async function saveEditedTask(taskId, editedTask, fetchData) {
  await CWDATA({ [taskId]: editedTask }, fetchData);
  closeSpecificOverlay("overlay-task-detail-edit");
}

/** * Updates the UI after editing the task.
 * @param {string} taskToEditId - The ID of the task that was edited.
 * @param {object} fetchData - The data object to use for fetching.
 * @param {function} updateBoardFunction - Callback to update the board.
 * @returns {Promise<void>} Resolves when the UI is updated.
 */
async function updateUIAfterEdit(taskToEditId, fetchData, updateBoardFunction) {
  await refreshSummaryIfExists();
  await refreshBoardView(updateBoardFunction);
  renderDetailOverlay(taskToEditId, fetchData, updateBoardFunction);
}

/** * Refreshes the board view using the provided update function or a global function.
 * @param {function} updateBoardFunction - Callback to update the board.
 * @returns {Promise<void>} Resolves when the board view is refreshed.
 */
async function refreshBoardView(updateBoardFunction) {
  if (typeof updateBoardFunction === "function") {
    try { await updateBoardFunction(); } catch (e) { /* noop */ }
  } else if (typeof window.refreshBoardSite === "function") {
    try { await window.refreshBoardSite(); } catch (e) { /* noop */ }
  }
}

/** * Checks if the form event is a submit event.
 * @param {Event} formEvent - The form event.
 * @returns {boolean} True if it's a submit event, false otherwise.
 */
function isSubmitEvent(formEvent) {
  const submitter = formEvent.submitter;
  if (!submitter || submitter.type !== "submit") {
    formEvent.preventDefault();
    return false;
  }
  return true;
}

/** * Builds the edited task object from form data and existing task data.
 * @param {object} formData - The extracted form data.
 * @param {object} taskToEdit - The existing task object being edited.
 * @returns {object} The updated task object.
 */
function buildEditTaskObject(formData, taskToEdit) {
  const subtasksCompleted = formData.checkedSubtasks.filter(Boolean).length;
  const updatedAt = getFormattedDate();
  const attachments = Array.isArray(window.taskAttachments) ? [...window.taskAttachments] : Array.isArray(taskToEdit?.attachments) ? [...taskToEdit.attachments] : [];
  return {
    assignedUsers: Array.isArray(formData.assignedUsers) ? formData.assignedUsers : [],
    boardID: "board-1",
    checkedSubtasks: formData.checkedSubtasks,
    columnID: taskToEdit.columnID || "inProgress",
    createdAt: taskToEdit.createdAt || updatedAt,
    deadline: formData.deadline,
    description: formData.description,
    priority: formData.priority,
    attachments,
    subtasksCompleted,
    title: formData.title,
    totalSubtasks: formData.totalSubtasks,
    type: formData.type,
    updatedAt,
  };
}
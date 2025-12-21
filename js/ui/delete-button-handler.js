import { CWDATA } from "../data/task-to-firbase.js";
import { closeSpecificOverlay } from "../events/overlay-handler.js";
import { refreshSummaryIfExists } from "../../main.js";

/** * Sets up the delete button listener in the detail overlay.
 * @param {HTMLElement} detailOverlayElement - The detail overlay DOM element.
 * @param {string} taskId - The ID of the task to delete.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board after deletion.
 */
export function setupDeleteButtonListener(detailOverlayElement, taskId, boardData, updateBoardFunction) {
  const deleteButton = detailOverlayElement.querySelector(".delete-task-btn");
  if (deleteButton) {
    deleteButton.dataset.taskId = taskId;
    deleteButton.onclick = null;
    deleteButton.addEventListener("click", (event) =>
      handleDeleteButtonClick(event, boardData, updateBoardFunction)
    );
  }
}

/** * Handles the click event for the delete button in the detail overlay.
 * @param {Event} event - The click event.
 * @param {object} boardData - The board data object.
 * @param {function} updateBoardFunction - Callback to update the board after deletion.
 */
export async function handleDeleteButtonClick(event, boardData, updateBoardFunction) {
  event.stopPropagation();
  const deleteId = event.currentTarget.dataset.taskId;
  if (boardData.tasks[deleteId]) {
    try {
      await CWDATA({ [deleteId]: null }, boardData);
      delete boardData.tasks[deleteId];
      if (window.firebaseData && window.firebaseData.tasks) delete window.firebaseData.tasks[deleteId];
      closeSpecificOverlay("overlay-task-detail");

      await refreshSummaryIfExists();

      if (typeof updateBoardFunction === 'function') await updateBoardFunction();
      else window.location.href = "/html/board-site.html";

    } catch (e) {
      console.error("Delete failed:", e);
      alert("Deletion failed. Please try again.");
    }
  }
}

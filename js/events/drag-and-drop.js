import { CWDATA } from "../data/task-to-firbase.js";
import { updateTaskColumnData } from "../ui/render-board.js";
import { refreshSummaryIfExists } from "../../main.js";
import { showTaskMovedMessage } from "../ui/board-feedback.js";

let currentDraggedElement = null;
let touchStartX = 0;
let touchStartY = 0;
let touchClone = null;
let lastTouchedColumn = null;
let isDragging = false;
let touchMoveThreshold = 10;

/** * Initializes the drag-and-drop functionality for task cards.
 * Adds event listeners for drag start, drag end, drag over, drag leave, and drop events.
 */
export function initDragAndDrop() {
  const taskCards = document.querySelectorAll(".task-card");
  taskCards.forEach((taskCard) => {
    taskCard.setAttribute("draggable", "true");
    taskCard.addEventListener("dragstart", dragStart);
    taskCard.addEventListener("dragend", dragEnd);
    taskCard.addEventListener("touchstart", touchStart, { passive: false });
    taskCard.addEventListener("touchmove", touchMove, { passive: false });
    taskCard.addEventListener("touchend", touchEnd, { passive: false });
  });

  const columnWrappers = document.querySelectorAll(".column-wrapper");
  columnWrappers.forEach((wrapper) => {
    wrapper.addEventListener("dragover", allowDrop);
    wrapper.addEventListener("dragleave", dragLeave);
    wrapper.addEventListener("drop", drop);
  });
}

/** * Handles the drag start event.
 * Sets the current dragged element and adds a class for styling.
 * @param {DragEvent} event
 */
function dragStart(event) {
  currentDraggedElement = event.target;
  event.dataTransfer.setData("text/plain", currentDraggedElement.id);
  setTimeout(() => {
    if (currentDraggedElement && currentDraggedElement.classList) {
      currentDraggedElement.classList.add("is-dragging");
    }
  }, 0);
}

/** * Handles the drag end event.
 * Removes the dragging class and updates the task data.
 * @param {DragEvent} event
 */
function dragEnd(event) {
  removeDraggingClass(event.target);
  currentDraggedElement = null;
  removeDragOverFromColumns();
  updateTaskAfterDragEnd(event);
}

/** * Removes the dragging class from the target element.
 * @param {HTMLElement} target - The dragged element.
 */
function removeDraggingClass(target) {
  if (target && target.classList) {
    target.classList.remove("is-dragging");
  }
}

/** * Maps a client column ID to a Firebase column ID.
 * @param {string} clientColumnId - The client column ID.
 * @returns {string} The corresponding Firebase column ID.
 */
function mapClientToFirebaseColumnId(clientColumnId) {
  const firebaseColumnMapping = {
    "to-do": "toDo",
    "in-progress": "inProgress",
    "await-feedback": "review",
    done: "done",
  };
  return firebaseColumnMapping[clientColumnId] || clientColumnId;
}

/** * Cleans a task object by removing undefined values and fixing nested arrays.
 * @param {object} taskObj - The task object to clean.
 * @returns {object} The cleaned task object.
 */
function cleanTaskObject(taskObj) {
  const cleaned = {};
  for (const key in taskObj) {
    if (taskObj[key] !== undefined) {
      let value = taskObj[key];

      if (Array.isArray(value)) {
        const keepAsArray = ['assignedUsers', 'checkedSubtasks', 'totalSubtasks', 'attachments'];
        if (!keepAsArray.includes(key)) {
          value = flattenDeepArray(value);
        }
      }

      cleaned[key] = value;
    }
  }
  return cleaned;
}

/** * Flattens deeply nested arrays to extract the actual value.
 * @param {*} arr - The potentially nested array.
 * @returns {*} The flattened value.
 */
function flattenDeepArray(arr) {
  if (!Array.isArray(arr)) return arr;

  let current = arr;
  while (Array.isArray(current) && current.length > 0) {
    if (current.length === 1) current = current[0];
    else if (current.length === 2 && current[0] === 0) current = current[1];
    else return current;
  }

  return current;
}

/** * Removes the drag-over class from all columns.
 */
function removeDragOverFromColumns() {
  document.querySelectorAll(".column-wrapper").forEach((column) => {
    if (column && column.classList) {
      column.classList.remove("drag-over");
    }
  });
}

/** * Updates the task data after drag end.
 * @param {DragEvent} event - The drag end event.
 */
function updateTaskAfterDragEnd(event) {
  const taskId = event.target.id;
  const allData = window.allData;
  if (allData && allData.tasks && allData.tasks[taskId]) {
    const task = allData.tasks[taskId];
    const newColumn = event.target.closest(".task-column");
    const clientColumnId = newColumn ? newColumn.id : task.columnID;
    const firebaseColumnId = mapClientToFirebaseColumnId(clientColumnId);

    const updatedTaskObj = cleanTaskObject({
      assignedUsers: task.assignedUsers,
      boardID: task.boardID || "board-1",
      checkedSubtasks: task.checkedSubtasks,
      columnID: firebaseColumnId,
      createdAt: task.createdAt,
      deadline: task.deadline,
      description: task.description,
      priority: task.priority,
      subtasksCompleted: task.subtasksCompleted,
      title: task.title,
      totalSubtasks: task.totalSubtasks,
      type: task.type,
      updatedAt: task.updatedAt,
    });
    CWDATA({ [taskId]: updatedTaskObj }, allData);
  }
}

/** * Allows dropping on the target element.
 * Prevents the default behavior and adds a class for styling.
 * @param {DragEvent} event
 */
function allowDrop(event) {
  event.preventDefault();
  const column = event.target.closest('.column-wrapper');
  if (column && !column.classList.contains("drag-over")) {
    column.classList.add("drag-over");
  }
}

/** * Handles the drag leave event.
 * Removes the drag-over class from the target element.
 * @param {DragEvent} event
 */
function dragLeave(event) {
  const column = event.target.closest('.column-wrapper');

  if (column && !column.contains(event.relatedTarget)) {
    column.classList.remove("drag-over");
  }
}

/** * Handles the drop event.
 * Moves the dragged element to the target column and updates the task data.
 * @param {DragEvent} event
 */
async function drop(event) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text/plain");
  const draggedElement = document.getElementById(taskId);
  const targetWrapper = event.target.closest(".column-wrapper");
  const targetColumn = targetWrapper?.querySelector(".task-column");
  await handleDropMove(draggedElement, targetColumn, taskId);
  removeDragOverClass(targetWrapper);
}

/** * Handles moving the dragged element and updating the task data on drop.
 * @param {HTMLElement} draggedElement - The dragged task card element.
 * @param {HTMLElement} targetColumn - The target column element.
 * @param {string} taskId - The ID of the dragged task.
 */
async function handleDropMove(draggedElement, targetColumn, taskId) {
  if (draggedElement && targetColumn) {
    const newColumnId = targetColumn.id;
    const oldColumnId = draggedElement.closest(".task-column").id;
    if (newColumnId !== oldColumnId) {
      targetColumn.appendChild(draggedElement);
      if (allData && allData.tasks && allData.tasks[taskId]) {
        const task = allData.tasks[taskId];
        const firebaseColumnId = mapClientToFirebaseColumnId(newColumnId);
        const updatedTask = { ...task, columnID: firebaseColumnId };
        const cleanedTask = cleanTaskObject(updatedTask);

        allData.tasks[taskId] = cleanedTask;

        await updateTaskColumnData(taskId, newColumnId);
        CWDATA({ [taskId]: cleanedTask }, allData);

        await refreshSummaryIfExists();   
        showTaskMovedMessage();
      }
    }
  }
}

/** * Removes the drag-over class from the target column.
 * @param {HTMLElement} targetColumn - The target column element.
 */
function removeDragOverClass(targetColumn) {
  if (targetColumn) {
    targetColumn.classList.remove("drag-over");
  }
}

/** * Resets visual styling after touch drag.
 * @param {HTMLElement} element - The dragged element.
 */
function resetTouchDragVisuals(element) {
  element.style.transform = '';
  element.style.opacity = '';
  element.style.zIndex = '';
  element.style.pointerEvents = '';
  element.style.position = '';
  element.style.willChange = '';
  element.style.transition = '';
  element.style.backfaceVisibility = '';
  element.style.webkitBackfaceVisibility = '';
  element.style.perspective = '';
  element.classList.remove("is-dragging");
  element.classList.remove("is-dragging-touch");
}

/** * Applies visual styling during touch drag.
 * @param {HTMLElement} element - The element being dragged.
 * @param {number} deltaX - Horizontal movement delta.
 * @param {number} deltaY - Vertical movement delta.
 */
function applyTouchDragVisuals(element, deltaX, deltaY) {
  element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.05)`;
  element.style.opacity = '0.95';
  element.style.zIndex = '9999';
  element.style.pointerEvents = 'none';
  element.style.position = 'relative';
  element.style.willChange = 'transform';
  element.style.transition = 'none';
  element.style.backfaceVisibility = 'hidden';
  element.style.webkitBackfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
}

/** * Updates drag-over styling for column under touch point.
 * @param {Touch} touch - The touch object.
 */
function updateDragOverColumn(touch) {
  const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
  const targetColumn = elementAtPoint?.closest('.column-wrapper');

  if (targetColumn && targetColumn !== lastTouchedColumn) {
    removeDragOverFromColumns();
    targetColumn.classList.add("drag-over");
    lastTouchedColumn = targetColumn;
  } else if (!targetColumn && lastTouchedColumn) {
    removeDragOverFromColumns();
    lastTouchedColumn = null;
  }
}

/** * Cleans up touch drag state variables.
 */
function cleanupTouchDrag() {
  removeDragOverFromColumns();
  currentDraggedElement = null;
  lastTouchedColumn = null;
  touchStartX = 0;
  touchStartY = 0;
  isDragging = false;
}

/** * Handles touch start event for mobile drag and drop.
 * @param {TouchEvent} event - The touch start event.
 */
function touchStart(event) {
  const touch = event.touches[0];
  currentDraggedElement = event.target.closest('.task-card');

  if (!currentDraggedElement) return;
  
  isDragging = false;

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

/** * Handles touch move event for mobile drag and drop.
 * @param {TouchEvent} event - The touch move event.
 */
function touchMove(event) {
  if (!currentDraggedElement) return;

  const touch = event.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (!isDragging && distance > touchMoveThreshold) {
    isDragging = true;
    if (event.cancelable) event.preventDefault();
    requestAnimationFrame(() => {
      if (currentDraggedElement) currentDraggedElement.classList.add("is-dragging-touch");
    });
  }

  if (isDragging) {
    if (event.cancelable) event.preventDefault();
    
    requestAnimationFrame(() => {
      if (!currentDraggedElement) return;
      applyTouchDragVisuals(currentDraggedElement, deltaX, deltaY);
      updateDragOverColumn(touch);
    });
  }
}

/** * Handles touch end event for mobile drag and drop.
 * @param {TouchEvent} event - The touch end event.
 */
async function touchEnd(event) {
  if (!currentDraggedElement) return;

  if (isDragging) {
    if (event.cancelable) event.preventDefault();

    const touch = event.changedTouches[0];
    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetWrapper = elementAtPoint?.closest('.column-wrapper');
    const targetColumn = targetWrapper?.querySelector('.task-column');

    resetTouchDragVisuals(currentDraggedElement);

    if (targetColumn) await handleDropMove(currentDraggedElement, targetColumn, currentDraggedElement.id);
  }

  cleanupTouchDrag();
}
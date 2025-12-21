import { enableMouseDragScroll } from "../events/drag-to-scroll.js";
import { refreshBoardSite } from "./render-board.js";
import { refreshSummaryIfExists } from "../../main.js";

/** * Sets up the dropdown menu listeners for a task card.
 * @param {HTMLElement} card The task card DOM element.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {Function} handleDropdownClick Function to handle dropdown click events.
 * @param {Function} setupMoveTaskListeners Function to setup move task listeners.
 */
export function setupDropdownMenuListeners(card, boardData, handleDropdownClick, setupMoveTaskListeners) {
  const dropdownBtn = card.querySelector(".dropdown-menu-board-site-btn");
  const dropdownMenu = card.querySelector(".dropdown-menu-board-site");
  if (!dropdownBtn || !dropdownMenu) return;

  if (!dropdownBtn.dataset.listenerBound) {
    dropdownBtn.addEventListener("click", (e) => handleDropdownClick(e, dropdownMenu, dropdownBtn));
    dropdownBtn.dataset.listenerBound = "true";
  }

  setupMoveTaskListeners(dropdownMenu, boardData);
}

/** * Handles click event for dropdown menu button.
 * @param {Event} e The click event.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 * @param {HTMLElement} dropdownBtn The dropdown button DOM element.
 */
export function handleDropdownClick(e, dropdownMenu, dropdownBtn) {
  if (window.innerWidth > 1025) return;
  e.stopPropagation();
  const isCurrentlyOpen = dropdownMenu.classList.contains("show");
  closeAllDropdowns();
  if (!isCurrentlyOpen) openDropdown(dropdownMenu, dropdownBtn);
}

/** * Closes all open dropdown menus on the board site. 
*/
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-menu-board-site.show").forEach((menu) => {
    menu.classList.remove("show");
    menu.setAttribute("aria-hidden", "true");
  });
}

/** * Opens the specified dropdown menu and positions it on the card.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 * @param {HTMLElement} dropdownBtn The dropdown button DOM element.
 */
function openDropdown(dropdownMenu, dropdownBtn) {
  dropdownMenu.classList.add("show");
  dropdownMenu.removeAttribute("aria-hidden");
  const card = dropdownBtn.closest(".task-card");
  if (card) positionDropdownOnCard(dropdownMenu, card);
}

/** * Positions the dropdown menu absolutely within the task card.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 * @param {HTMLElement} card The task card DOM element.
 */
function positionDropdownOnCard(dropdownMenu, card) {
  card.style.position = "relative";
  dropdownMenu.style.position = "absolute";
  dropdownMenu.style.top = "0";
  dropdownMenu.style.left = "0";
  dropdownMenu.style.zIndex = "2000";
  dropdownMenu.style.width = `${card.offsetWidth}px`;
}

/** * Binds drag-to-scroll functionality to the dropdown menu.
 * @param {HTMLElement} btn The dropdown button DOM element.
 * @param {HTMLElement} menu The dropdown menu DOM element.
 */
export function bindBtnDragToMenu(btn, menu) {
  const hasPointer = 'onpointerdown' in window;
  const dragHandler = createDragHandler(btn, menu);
  
  if (hasPointer) {
    bindPointerDragEvents(btn, dragHandler);
  } else {
    bindTouchMouseDragEvents(btn, dragHandler);
  }
}

/** * Creates a drag handler for the dropdown menu.
 * @param {HTMLElement} btn The dropdown button DOM element.
 * @param {HTMLElement} menu The dropdown menu DOM element.
 * @returns {Object} The drag handler with onDown, onMove, and onUp methods.
 */
function createDragHandler(btn, menu) {
  let dragging = false;
  let startY = 0;
  let startScrollTop = 0;
  const getY = (e) => e.touches?.[0]?.pageY ?? e.pageY;

  return {
    onDown: (e) => {
      if (!menu.classList.contains('show')) return;
      dragging = true;
      startY = getY(e);
      startScrollTop = menu.scrollTop;
      try { btn.setPointerCapture?.(e.pointerId); } catch (_) { }
    },
    onMove: (e) => {
      if (!dragging) return;
      menu.scrollTop = startScrollTop - (getY(e) - startY);
      e.preventDefault?.();
    },
    onUp: () => {
      dragging = false;
      try { btn.releasePointerCapture?.(); } catch (_) { }
    }
  };
}

/** * Binds pointer events for drag-to-scroll functionality.
 * @param {HTMLElement} btn The dropdown button DOM element.
 * @param {Object} handler The drag handler with onDown, onMove, and onUp methods.
 */
function bindPointerDragEvents(btn, handler) {
  btn.addEventListener('pointerdown', handler.onDown);
  btn.addEventListener('pointermove', handler.onMove, { passive: false });
  btn.addEventListener('pointerup', handler.onUp);
  btn.addEventListener('pointercancel', handler.onUp);
  btn.addEventListener('pointerleave', handler.onUp);
}

/** * Binds touch and mouse events for drag-to-scroll functionality.
 * @param {HTMLElement} btn The dropdown button DOM element.
 * @param {Object} handler The drag handler with onDown, onMove, and onUp methods.
 */
function bindTouchMouseDragEvents(btn, handler) {
  btn.addEventListener('touchstart', handler.onDown, { passive: true });
  btn.addEventListener('touchmove', handler.onMove, { passive: false });
  btn.addEventListener('touchend', handler.onUp);
  btn.addEventListener('touchcancel', handler.onUp);
  btn.addEventListener('mousedown', handler.onDown);
  btn.addEventListener('mousemove', handler.onMove);
  btn.addEventListener('mouseup', handler.onUp);
  btn.addEventListener('mouseleave', handler.onUp);
}

/** * Sets up move task listeners for the dropdown menu.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {Function} handleMoveTask Function to handle moving the task.
 */
export function setupMoveTaskListeners(dropdownMenu, boardData, handleMoveTask) {
  if (dropdownMenu.dataset.moveListenersBound) return;
  
  const handleMove = createMoveHandler(dropdownMenu, boardData, handleMoveTask);
  dropdownMenu.addEventListener("click", handleMove, true);
  setupTouchTapDetection(dropdownMenu, handleMove);
  
  dropdownMenu.dataset.moveListenersBound = "true";
}

/** * Creates a move handler for moving tasks up or down.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {Function} handleMoveTask Function to handle moving the task.
 * @returns {Function} The move handler function.
 */
function createMoveHandler(dropdownMenu, boardData, handleMoveTask) {
  return async (ev) => {
    const moveUpLink = ev.target.closest(".move-task-up");
    const moveDownLink = ev.target.closest(".move-task-down");
    
    if (moveUpLink) {
      await handleMoveUp(ev, moveUpLink, boardData, handleMoveTask, dropdownMenu);
    } else if (moveDownLink) {
      await handleMoveDown(ev, moveDownLink, boardData, handleMoveTask, dropdownMenu);
    }
  };
}

/** * Handles moving a task up in the column order.
 * @param {Event} ev The click event.
 * @param {HTMLElement} moveUpLink The move up link DOM element.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {Function} handleMoveTask Function to handle moving the task.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 */
async function handleMoveUp(ev, moveUpLink, boardData, handleMoveTask, dropdownMenu) {
  ev.preventDefault();
  ev.stopPropagation();
  const taskId = moveUpLink.dataset.taskId;
  const task = boardData.tasks?.[taskId];
  
  if (task && canMoveUp(task)) {
    await moveTaskToColumn(task, "up", ev, boardData, handleMoveTask, dropdownMenu);
  }
}

/** * Handles moving a task down in the column order.
 * @param {Event} ev The click event.
 * @param {HTMLElement} moveDownLink The move down link DOM element.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {Function} handleMoveTask Function to handle moving the task.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 */
async function handleMoveDown(ev, moveDownLink, boardData, handleMoveTask, dropdownMenu) {
  ev.preventDefault();
  ev.stopPropagation();
  const taskId = moveDownLink.dataset.taskId;
  const task = boardData.tasks?.[taskId];
  
  if (task && canMoveDown(task)) {
    await moveTaskToColumn(task, "down", ev, boardData, handleMoveTask, dropdownMenu);
  }
}

/** * Checks if a task can be moved up in the column order.
 * @param {object} task The task object.
 * @returns {boolean} True if the task can be moved up, false otherwise.
 */
function canMoveUp(task) {
  const columnOrder = ["toDo", "inProgress", "review", "done"];
  return columnOrder.indexOf(task.columnID) > 0;
}

/** * Checks if a task can be moved down in the column order.
 * @param {object} task The task object.
 * @returns {boolean} True if the task can be moved down, false otherwise.
 */
function canMoveDown(task) {
  const columnOrder = ["toDo", "inProgress", "review", "done"];
  return columnOrder.indexOf(task.columnID) < 3;
}

/** * Moves a task to a different column based on the direction.
 * @param {object} task The task object.
 * @param {string} direction The direction to move ('up' or 'down').
 * @param {Event} ev The click event.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {Function} handleMoveTask Function to handle moving the task.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 */
async function moveTaskToColumn(task, direction, ev, boardData, handleMoveTask, dropdownMenu) {
  const columnOrder = ["toDo", "inProgress", "review", "done"];
  const currentIdx = columnOrder.indexOf(task.columnID);
  const newIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
  
  task.columnID = columnOrder[newIdx];
  await handleMoveTask(ev, boardData, direction);
  dropdownMenu.classList.remove("show");
  await refreshBoardSite();
}

/** * Sets up touch tap detection for the dropdown menu.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 * @param {Function} handleMove Function to handle move actions.
 */
function setupTouchTapDetection(dropdownMenu, handleMove) {
  let touchStartTime = 0;
  let touchStartPos = { x: 0, y: 0 };
  
  dropdownMenu.addEventListener("touchstart", (ev) => {
    touchStartTime = Date.now();
    touchStartPos = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
  }, { passive: true });
  
  dropdownMenu.addEventListener("touchend", async (ev) => {
    if (isTapGesture(ev, touchStartTime, touchStartPos)) {
      await handleTap(ev, handleMove);
    }
  }, { passive: false });
}

/** * Determines if a touch event is a tap gesture.
 * @param {TouchEvent} ev The touch end event.
 * @param {number} touchStartTime The timestamp when the touch started.
 * @param {Object} touchStartPos The position where the touch started.
 * @returns {boolean} True if it's a tap gesture, false otherwise.
 */
function isTapGesture(ev, touchStartTime, touchStartPos) {
  const touchDuration = Date.now() - touchStartTime;
  const touch = ev.changedTouches[0];
  const distance = Math.sqrt(
    Math.pow(touch.clientX - touchStartPos.x, 2) +
    Math.pow(touch.clientY - touchStartPos.y, 2)
  );
  return touchDuration < 300 && distance < 10;
}

/** * Handles tap gestures on the dropdown menu.
 * @param {TouchEvent} ev The touch end event.
 * @param {Function} handleMove Function to handle move actions.
 */
async function handleTap(ev, handleMove) {
  const touch = ev.changedTouches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  const moveLink = target?.closest(".move-task-up, .move-task-down");
  
  if (moveLink) {
    ev.preventDefault();
    const syntheticEvent = {
      target: target,
      preventDefault: () => { },
      stopPropagation: () => { }
    };
    await handleMove(syntheticEvent);
  }
}

/** * Handles moving a task up or down between columns.
 * @param {Event} ev The click event.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {string} direction The direction to move ('up' or 'down').
 * @param {Function} CWDATA Function to update the board data.
 */
export async function handleMoveTask(ev, boardData, direction, CWDATA) {
  const moveLink = ev.target.closest(".move-task-up, .move-task-down");
  if (!moveLink) return;

  const taskId = moveLink.dataset.taskId;
  if (!taskId) return;

  const task = boardData.tasks[taskId];
  if (!task) return;

  await CWDATA({ [taskId]: task }, boardData);
  await refreshSummaryIfExists();
}

/** * Global listener to close dropdowns when clicking outside. 
*/
if (!window.dropdownCloseListenerAdded) {
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-menu-board-site-btn") &&
      !e.target.closest(".dropdown-menu-board-site")) {
      document.querySelectorAll(".dropdown-menu-board-site.show").forEach(menu => {
        menu.classList.remove("show");
        menu.setAttribute("aria-hidden", "true");
      });
    }
  });
  window.dropdownCloseListenerAdded = true;
}
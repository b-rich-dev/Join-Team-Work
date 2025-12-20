/**
 * Sets up dropdown menu listeners for a task card.
 * @param {HTMLElement} card The task card DOM element.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {Function} handleDropdownClick Function to handle dropdown click events.
 * @param {Function} setupMoveTaskListeners Function to set up move task listeners.
 */
import { enableMouseDragScroll } from "../events/drag-to-scroll.js";
import { refreshBoardSite } from "./render-board.js";
import { refreshSummaryIfExists } from "../../main.js";

export function setupDropdownMenuListeners(
  card,
  boardData,
  handleDropdownClick,
  setupMoveTaskListeners
) {
  const dropdownBtn = card.querySelector(".dropdown-menu-board-site-btn");
  const dropdownMenu = card.querySelector(".dropdown-menu-board-site");
  if (!dropdownBtn || !dropdownMenu) return;
  
  // Nur hinzufügen, wenn noch nicht gebunden
  if (!dropdownBtn.dataset.listenerBound) {
    dropdownBtn.addEventListener("click", (e) =>
      handleDropdownClick(e, dropdownMenu, dropdownBtn)
    );
    dropdownBtn.dataset.listenerBound = "true";
  }
  
  setupMoveTaskListeners(dropdownMenu, boardData);
  
  // DRAG-SCROLL TEMPORÄR DEAKTIVIERT - verhindert Clicks auf Links
  // if (!dropdownMenu.dataset.dragScrollBound) {
  //   try {
  //     enableMouseDragScroll(dropdownMenu, { enableHorizontalScroll: false, enableVerticalScroll: true });
  //     dropdownMenu.dataset.dragScrollBound = "1";
  //   } catch (_) {}
  // }
  // if (!dropdownBtn.dataset.btnDragBound) {
  //   bindBtnDragToMenu(dropdownBtn, dropdownMenu);
  //   dropdownBtn.dataset.btnDragBound = "1";
  // }
}

/**
 * Handles click event for dropdown menu button.
 * @param {Event} e The click event.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 * @param {HTMLElement} dropdownBtn The dropdown button DOM element.
 */
export function handleDropdownClick(e, dropdownMenu, dropdownBtn) {
  if (window.innerWidth > 1025) return;
  e.stopPropagation();
  
  const isCurrentlyOpen = dropdownMenu.classList.contains("show");
  
  // Alle anderen Dropdowns schließen
  document
    .querySelectorAll(".dropdown-menu-board-site.show")
    .forEach((menu) => {
      menu.classList.remove("show");
      menu.setAttribute("aria-hidden", "true");
    });
  
  // Aktuelles Dropdown togglen
  if (!isCurrentlyOpen) {
    dropdownMenu.classList.add("show");
    dropdownMenu.removeAttribute("aria-hidden");
    const card = dropdownBtn.closest(".task-card");
    if (card) {
      card.style.position = "relative";
      dropdownMenu.style.position = "absolute";
      dropdownMenu.style.top = "0";
      dropdownMenu.style.left = "0";
      dropdownMenu.style.zIndex = "2000";
      dropdownMenu.style.width = `${card.offsetWidth}px`;
    }
  }
}

function bindBtnDragToMenu(btn, menu) {
  const hasPointer = 'onpointerdown' in window;
  let dragging = false;
  let startY = 0;
  let startScrollTop = 0;

  const getY = (e) => {
    if (e.touches && e.touches[0]) return e.touches[0].pageY;
    return e.pageY;
  };

  const onDown = (e) => {
    // Nur wenn Menü sichtbar ist, Drag zulassen
    if (!menu.classList.contains('show')) return;
    dragging = true;
    startY = getY(e);
    startScrollTop = menu.scrollTop;
    try { btn.setPointerCapture && btn.setPointerCapture(e.pointerId); } catch(_) {}
    // Bei Touch nicht das Klickverhalten zerstören, erst beim Move verhindern
  };

  const onMove = (e) => {
    if (!dragging) return;
    const currentY = getY(e);
    const deltaY = currentY - startY;
    menu.scrollTop = startScrollTop - deltaY;
    // Verhindert native Seitenscroller beim Drag über dem Button
    e.preventDefault && e.preventDefault();
  };

  const onUp = () => {
    dragging = false;
    try { btn.releasePointerCapture && btn.releasePointerCapture(); } catch(_) {}
  };

  if (hasPointer) {
    btn.addEventListener('pointerdown', onDown);
    btn.addEventListener('pointermove', onMove, { passive: false });
    btn.addEventListener('pointerup', onUp);
    btn.addEventListener('pointercancel', onUp);
    btn.addEventListener('pointerleave', onUp);
  } else {
    // Fallback Touch/Maus
    btn.addEventListener('touchstart', onDown, { passive: true });
    btn.addEventListener('touchmove', onMove, { passive: false });
    btn.addEventListener('touchend', onUp);
    btn.addEventListener('touchcancel', onUp);
    btn.addEventListener('mousedown', onDown);
    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseup', onUp);
    btn.addEventListener('mouseleave', onUp);
  }
}

/**
 * Sets up listeners for moving tasks between columns.
 * @param {HTMLElement} dropdownMenu The dropdown menu DOM element.
 * @param {Object} boardData The board data object containing all tasks and columns.
 * @param {Function} handleMoveTask Function to handle moving tasks.
 */
export function setupMoveTaskListeners(
  dropdownMenu,
  boardData,
  handleMoveTask
) {
  if (dropdownMenu.dataset.moveListenersBound) {
    return;
  }
  
  const handleMove = async (ev) => {
    const moveUpLink = ev.target.closest(".move-task-up");
    const moveDownLink = ev.target.closest(".move-task-down");
    
    if (moveUpLink) {
      ev.preventDefault();
      ev.stopPropagation();
      const taskId = moveUpLink.dataset.taskId;
      
      if (taskId && boardData.tasks && boardData.tasks[taskId]) {
        const task = boardData.tasks[taskId];
        const columnOrder = ["toDo", "inProgress", "review", "done"];
        const currentIdx = columnOrder.indexOf(task.columnID);
        const newIdx = currentIdx - 1;
        
        if (newIdx >= 0) {
          task.columnID = columnOrder[newIdx];
          await handleMoveTask(ev, boardData, "up");
          dropdownMenu.classList.remove("show");
          await refreshBoardSite();
        }
      }
    } else if (moveDownLink) {
      ev.preventDefault();
      ev.stopPropagation();
      const taskId = moveDownLink.dataset.taskId;
      
      if (taskId && boardData.tasks && boardData.tasks[taskId]) {
        const task = boardData.tasks[taskId];
        const columnOrder = ["toDo", "inProgress", "review", "done"];
        const currentIdx = columnOrder.indexOf(task.columnID);
        const newIdx = currentIdx + 1;
        
        if (newIdx < columnOrder.length) {
          task.columnID = columnOrder[newIdx];
          await handleMoveTask(ev, boardData, "down");
          dropdownMenu.classList.remove("show");
          await refreshBoardSite();
        }
      }
    }
  };
  
  // Click-Events für Desktop
  dropdownMenu.addEventListener("click", handleMove, true);
  
  // Touch-Events für Mobile - mit Tap-Detection
  let touchStartTime = 0;
  let touchStartPos = { x: 0, y: 0 };
  
  dropdownMenu.addEventListener("touchstart", (ev) => {
    touchStartTime = Date.now();
    touchStartPos = {
      x: ev.touches[0].clientX,
      y: ev.touches[0].clientY
    };
  }, { passive: true });
  
  dropdownMenu.addEventListener("touchend", async (ev) => {
    const touchDuration = Date.now() - touchStartTime;
    const touch = ev.changedTouches[0];
    const touchEndPos = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    // Nur als Tap behandeln wenn kurze Dauer und wenig Bewegung
    const distance = Math.sqrt(
      Math.pow(touchEndPos.x - touchStartPos.x, 2) +
      Math.pow(touchEndPos.y - touchStartPos.y, 2)
    );
    
    if (touchDuration < 300 && distance < 10) {
      // Es war ein Tap, kein Drag
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const moveUpLink = target?.closest(".move-task-up");
      const moveDownLink = target?.closest(".move-task-down");
      
      if (moveUpLink || moveDownLink) {
        ev.preventDefault();
        // Erstelle ein synthetisches Event
        const syntheticEvent = {
          target: target,
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        await handleMove(syntheticEvent);
      }
    }
  }, { passive: false });
  
  dropdownMenu.dataset.moveListenersBound = "true";
}

/**
 * Handles moving a task up or down between columns.
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
  
  // Task wurde bereits in setupMoveTaskListeners geändert
  await CWDATA({ [taskId]: task }, boardData);
  
  // Refresh summary statistics when task column changes
  await refreshSummaryIfExists();
}

// Globaler Click-Listener zum Schließen der Dropdowns
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

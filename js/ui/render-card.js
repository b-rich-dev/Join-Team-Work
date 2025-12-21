import { getTaskOverlay } from "../templates/task-details-template.js";
import { registerTaskCardDetailOverlay, detailOverlayElement, editOverlayElement } from "./render-card-events.js";
import { setupSubtaskCheckboxListener, handleSubtaskCheckboxChange } from "./subtask-checkbox-handler.js";
import { setupEditButtonListener, handleEditButtonClick } from "./edit-button-handler.js";
import { setupDeleteButtonListener, handleDeleteButtonClick } from "./delete-button-handler.js";
import { setupEditFormModules } from "./edit-form-modules.js";
import { setupCancelEditBtn, setupTaskEditFormListener, handleTaskEditFormSubmit } from "./edit-form-handler.js";

/** Renders a task card given the task ID and board data.
 * @param {string} taskID - The ID of the task to render.
 * @param {object} boardData - The board data containing tasks and contacts.
 * @return {string} The HTML string of the rendered task card.
 */
function validateTaskCardInput(boardData, taskID) {
  if (!boardData || !taskID || !boardData.tasks || !boardData.contacts) {
    return false;
  }
  const task = boardData.tasks[taskID];
  if (!task) {
    return false;
  }
  return true;
}

/** * Renders a task card given the task ID and board data.
 * @param {string} taskID - The ID of the task to render.
 * @param {object} boardData - The board data containing tasks and contacts.
 * @return {string} The HTML string of the rendered task card.
 */
function getTaskDetails(task) {
  const title = task.title || "Kein Titel";
  const description = (task.description || "").trim();
  const type = task.type || "Unbekannt";
  const priority = task.priority || "Unbekannt";
  return { title, description, type, priority };
}

/** * @param {string} type - The task type.
 * @returns {string} The CSS class for the category badge.
 */
function getCategoryClass(type) {
  if (type === "User Story") return "category-user-story";
  if (type === "Technical Task") return "category-technical-task";
  if (type === "Meeting") return "category-meeting";
  return "category-default";
}

/** * @param {object} task - The task object.
 * @returns {Array} Array of subtasks with text and completion status.
 */
function getSubtasksArray(task) {
  if (Array.isArray(task.subtasks) && task.subtasks.length > 0)
    return task.subtasks;
  if (
    Array.isArray(task.totalSubtasks) &&
    Array.isArray(task.checkedSubtasks) &&
    task.totalSubtasks.length === task.checkedSubtasks.length
  ) {
    return task.totalSubtasks.map((text, i) => ({ text, completed: !!task.checkedSubtasks[i] }));
  }
  return [];
}

/** * Calculates subtask progress for a task.
 * @param {object} task - The task object.
 * @return {object} An object containing done, total, percent, and subText.
 */
export function calculateSubtaskProgress(task) {
  const subtasksArray = getSubtasksArray(task);
  const done = subtasksArray.filter((sub) => sub.completed).length;
  const total = subtasksArray.length;
  const percent = total > 0 ? (done / total) * 100 : 0;
  const subText = total > 0 ? `${done}/${total} Subtasks` : "No subtasks";
  return { done, total, percent, subText };
}

/** * Renders a task card given the task ID and board data.
 * @param {object} boardData - The complete board data object (tasks, contacts, etc.).
 * @param {string} taskID - The ID of the task to be rendered.
 * @return {string} The HTML string of the task card.
 */
function getDisplayedAvatars(users, contacts, displayCount) {
  let html = "";
  let renderedCount = 0;

  for (let i = 0; i < users.length && renderedCount < displayCount; i++) {
    const id = users[i];
    const contact = contacts[id];
    if (contact) {
      html += renderContactAvatar(contact);
      renderedCount++;
    }
  }
  return html;
}

/** * Generates the HTML for assigned user avatars on a task card.
 * @param {Array} assignedUserIDs - Array of assigned user IDs.
 * @param {object} contacts - The contacts object.
 * @returns {string} The HTML string for the assigned user avatars.
 */
function generateAssignedAvatarsHtml(assignedUserIDs, contacts) {
  const users = Array.isArray(assignedUserIDs) ? assignedUserIDs : [];
  const displayCount = 3;
  const existingUsers = users.filter(id => contacts[id]);

  let avatarsHtml = getDisplayedAvatars(existingUsers, contacts, displayCount);
  if (existingUsers.length > displayCount) {
    avatarsHtml += `<div class="assigned-initials-circle more-users-circle">+${existingUsers.length - displayCount}</div>`;
  }
  return avatarsHtml;
}

/**
 * @param {object} contact - The contact object.
 * @returns {string} The HTML string of the avatar.
 */
function renderContactAvatar(contact) {
  if (!contact) return `<div class="assigned-initials-circle" style="background-color: var(--grey);" title="Deleted Contact">--</div>`;

  const initials = (contact.initials || "").trim();
  const name = (contact.name || "").trim();

  if (contact.avatarImage) {
    const base64 = typeof contact.avatarImage === 'string' ? contact.avatarImage : (contact.avatarImage?.base64 || contact.avatarImage);
    return `<div class="assigned-initials-circle" style="background-image: url(${base64}); background-size: cover; background-position: center;" title="${name}"></div>`;
  }

  const colorRaw = contact.avatarColor || "default";
  const colorStyle = colorRaw.startsWith("--") ? `var(${colorRaw})` : colorRaw;
  return `<div class="assigned-initials-circle" style="background-color: ${colorStyle};" title="${name}">${initials}</div>`;
}

/** * Gets the priority icon path and text based on priority string. 
 * @param {string} prio - The priority string.
 * @returns {object} An object containing icon path and priority text.
 */
function getPriorityIconAndText(prio) {
  if (prio === "low") return { icon: `../assets/icons/property/low.svg`, prioText: "Low" };
  if (prio === "medium") return { icon: `../assets/icons/property/medium.svg`, prioText: "Medium" };
  if (prio === "urgent") return { icon: `../assets/icons/property/urgent.svg`, prioText: "Urgent" };

  return { icon: `../assets/icons/property/default.svg`, prioText: "Unknown" };
}

/** * Generates the HTML for the progress bar.
 * @param {number} total - Total number of subtasks.
 * @param {number} percent - Completion percentage.
 * @param {string} subText - Subtask progress text.
 * @return {string} The HTML string for the progress bar.
 */
function getProgressBarHtml(total, percent, subText) {
  if (total > 0) {
    return `<div class="progress-container">
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: ${percent}%;">
                </div>
              </div>
              <span class="subtasks-text">${subText}</span>
            </div>`;
  }
  return "";
}

/** * Generates the HTML for the task card header. 
 * @param {string} taskID - Task ID.
 * @param {string} type - Task type.
 * @returns {string} HTML string for the card header.
 */
function getTaskCardHeader(taskID, type) {
  const categoryClass = getCategoryClass(type);
  return `<div class="d-flex space-between">
            <div class="task-category ${categoryClass}">${type}
            </div>${getTaskCardDropdown(taskID)}
          </div>`;
}

/** * Generates the HTML for the task card dropdown menu.
 * @param {string} taskID - Task ID.
 * @return {string} HTML string for the card dropdown menu.
 */
function getTaskCardDropdown(taskID) {
  return `<div>
            <button class="dropdown-menu-board-site-btn" aria-label="Move task" aria-expanded="false" aria-haspopup="true">
              <div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <mask id="mask0_294678_9764" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                    <rect y="20" width="20" height="20" transform="rotate(-90 0 20)" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_294678_9764)">
                    <path d="M13.3333 15.1457L14.8958 13.5832C15.0486 13.4304 15.2396 13.354 15.4688 13.354C15.6979 13.354 15.8958 13.4304 16.0625 13.5832C16.2292 13.7498 16.3125 13.9478 16.3125 14.1769C16.3125 14.4061 16.2292 14.604 16.0625 14.7707L13.0833 17.7498C13 17.8332 12.9097 17.8922 12.8125 17.9269C12.7153 17.9616 12.6111 17.979 12.5 17.979C12.3889 17.979 12.2847 17.9616 12.1875 17.9269C12.0903 17.8922 12 17.8332 11.9167 17.7498L8.91667 14.7498C8.75 14.5832 8.67014 14.3887 8.67708 14.1665C8.68403 13.9443 8.77083 13.7498 8.9375 13.5832C9.10417 13.4304 9.29861 13.3505 9.52083 13.3436C9.74306 13.3366 9.9375 13.4165 10.1042 13.5832L11.6667 15.1457V9.99984C11.6667 9.76373 11.7465 9.56581 11.9062 9.40609C12.066 9.24636 12.2639 9.1665 12.5 9.1665C12.7361 9.1665 12.934 9.24636 13.0938 9.40609C13.2535 9.56581 13.3333 9.76373 13.3333 9.99984V15.1457ZM8.33333 4.854V9.99984C8.33333 10.2359 8.25347 10.4339 8.09375 10.5936C7.93403 10.7533 7.73611 10.8332 7.5 10.8332C7.26389 10.8332 7.06597 10.7533 6.90625 10.5936C6.74653 10.4339 6.66667 10.2359 6.66667 9.99984L6.66667 4.854L5.10417 6.4165C4.95139 6.56928 4.76042 6.64567 4.53125 6.64567C4.30208 6.64567 4.10417 6.56928 3.9375 6.4165C3.77083 6.24984 3.6875 6.05192 3.6875 5.82275C3.6875 5.59359 3.77083 5.39567 3.9375 5.229L6.91667 2.24984C7 2.1665 7.09028 2.10748 7.1875 2.07275C7.28472 2.03803 7.38889 2.02067 7.5 2.02067C7.61111 2.02067 7.71528 2.03803 7.8125 2.07275C7.90972 2.10748 8 2.1665 8.08333 2.24984L11.0833 5.24984C11.25 5.4165 11.3299 5.61095 11.3229 5.83317C11.316 6.05539 11.2292 6.24984 11.0625 6.4165C10.8958 6.56928 10.7014 6.64914 10.4792 6.65609C10.2569 6.66303 10.0625 6.58317 9.89583 6.4165L8.33333 4.854Z" fill="#2A3647"/>
                  </g>
                </svg>
              </div>
            </button>
            <div class="dropdown-menu-board-site" role="menu" aria-hidden="true">
              <h3 class="dropdown-headline">Move to</h3>
              <div class="d-flex justify-content flex-direction">
                <button type="button" class="move-task-up" data-task-id="${taskID}" role="menuitem">
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="margin-right:6px;">
                    <path d="M17.333 10.437V25.333C17.333 26.0694 16.736 26.6663 16 26.6663C15.2636 26.6663 14.6666 26.0694 14.6666 25.333V10.437L8.45729 16.6463C7.93667 17.167 7.09258 17.167 6.57196 16.6463C6.05134 16.1257 6.05134 15.2816 6.57196 14.761L14.5857 6.74722C15.3668 5.96617 16.6331 5.96617 17.4142 6.74722L25.4279 14.761C25.9486 15.2816 25.9486 16.1257 25.4279 16.6463C24.9073 17.167 24.0632 17.167 23.5426 16.6463L17.333 10.437Z" fill="white"/>
                  </svg>
                  Up
                </button>
                <button type="button" class="move-task-down" data-task-id="${taskID}" role="menuitem">
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="margin-right:6px;">
                    <path d="M14.667 21.563V6.66699C14.667 5.93062 15.264 5.33366 16.0004 5.33366C16.7368 5.33366 17.3337 5.93062 17.3337 6.66699V21.563L23.5431 15.3537C24.0637 14.833 24.9078 14.833 25.4284 15.3537C25.949 15.8743 25.949 16.7184 25.4284 17.239L17.4147 25.2528C16.6336 26.0338 15.3673 26.0338 14.5862 25.2528L6.57246 17.239C6.05184 16.7184 6.05184 15.8743 6.57246 15.3537C7.09308 14.833 7.93717 14.833 8.45779 15.3537L14.667 21.563Z" fill="white"/>
                  </svg>
                  Down
                </button>
                <a href="../index.html" role="menuitem">Home 
                  <img src="../assets/icons/logo/joinLogo.svg" alt="" aria-hidden="true" width="20" height="15">
                </a>
              </div>
            </div>
          </div>`;
}

/** * @param {string} title - Task title.
 * @param {string} description - Task description.
 * @param {number} total - Total number of subtasks.
 * @param {number} percent - Completion percentage.
 * @param {string} subText - Subtask progress text.
 * @returns {string} HTML string for the card content.
 */
function getTaskCardContent(title, description, total, percent, subText) {
  return `<div class="task-content">
            <h3 class="task-title">${title}</h3>
            <p class="task-description">${description}</p>
            ${getProgressBarHtml(total, percent, subText)}
          </div>`;
}

/** * @param {string} avatarsHtml - HTML string of avatars.
 * @param {string} icon - Priority icon path.
 * @param {string} prioText - Priority text.
 * @returns {string} HTML string for the card footer.
 */
function getTaskCardFooter(avatarsHtml, icon, prioText) {
  return `<div class="task-footer">
            <div class="assigned-users">${avatarsHtml}</div>
            <div class="priority-icon">
              <img src="${icon}" alt="" aria-hidden="true" title="${prioText}">
            </div>
          </div>`;
}

/** * Builds the complete HTML content for a task card.
 * @param {string} taskID - Task ID.
 * @param {object} taskDetails - Object containing task details (title, description, type).
 * @param {object} subtaskProgress - Object containing subtask progress (total, percent, subText).
 * @param {string} avatarsHtml - HTML string of assigned user avatars.
 * @param {object} priorityInfo - Object containing priority icon path and text.
 * @returns {string} The complete HTML string for the task card.
 */
function buildTaskCardHtmlContent(taskID, taskDetails, subtaskProgress, avatarsHtml, priorityInfo) {
  const { title, description, type } = taskDetails;
  const { total, percent, subText } = subtaskProgress;
  const { icon, prioText } = priorityInfo;
  return `<div class="task-card" id="${taskID}" draggable="true">${getTaskCardHeader(taskID, type)} ${getTaskCardContent(title, description, total, percent, subText)}${getTaskCardFooter(avatarsHtml, icon, prioText)}</div>`;
}

/** * Gathers all necessary data for rendering a task card.
 * @param {object} boardData - The complete board data object (tasks, contacts, etc.).
 * @param {string} taskID - The ID of the task to be rendered.
 * @returns {object} An object containing task details, subtask progress, avatars HTML, and priority info.
 */
function getTaskCardData(boardData, taskID) {
  const task = boardData.tasks[taskID];
  const contacts = boardData.contacts;
  return {
    taskDetails: getTaskDetails(task),
    subtaskProgress: calculateSubtaskProgress(task),
    avatarsHtml: generateAssignedAvatarsHtml(task.assignedUsers, contacts),
    priorityInfo: getPriorityIconAndText(task.priority),
  };
}

/** * Renders a simple task card given the board data and task ID.
 * @param {object} boardData - The complete board data object (tasks, contacts, etc.).
 * @param {string} taskID - The ID of the task to be rendered.
 * @return {string} The HTML string of the rendered task card.
 */
export function createSimpleTaskCard(boardData, taskID) {
  if (!validateTaskCardInput(boardData, taskID)) return "";
  const { taskDetails, subtaskProgress, avatarsHtml, priorityInfo } =
    getTaskCardData(boardData, taskID);
  return buildTaskCardHtmlContent(taskID, taskDetails, subtaskProgress, avatarsHtml, priorityInfo);
}

const columnOrder = ["toDo", "inProgress", "review", "done"];

/** * gets move task buttons from event. 
 * @param {Event} e - The event object.
 * @returns {object} Object containing upBtn and downBtn elements.
 */
function getMoveTaskButton(e) {
  return {
    upBtn: e.target.closest(".move-task-up"),
    downBtn: e.target.closest(".move-task-down"),
  };
}

/** * gets task ID from move buttons. 
 * @param {HTMLElement} upBtn - The up button element.
 * @param {HTMLElement} downBtn - The down button element.
 * @returns {string} The task ID.
 */
function getTaskIdFromButton(upBtn, downBtn) {
  return (upBtn || downBtn).getAttribute("data-task-id");
}

/** * Updates the task's column based on new index.
 * @param {object} boardData - The board data object.
 * @param {string} taskId - The ID of the task to update.
 * @param {number} newIndex - The new column index.
 */
function updateTaskColumn(boardData, taskId, newIndex) {
  boardData.tasks[taskId].columnID = columnOrder[newIndex];
  if (window.CWDATA && window.firebaseData)
    window.CWDATA({ [taskId]: boardData.tasks[taskId] }, window.firebaseData);
}

/** * Refreshes the board site view. 
*/
function refreshBoardSite() {
  if (window.board && typeof window.board.site === "function")
    window.board.site();
  else if (typeof window.boardSiteHtml === "function") window.boardSiteHtml();
}

export const editedTaskData = {};
export { registerTaskCardDetailOverlay } from "./render-card-events.js";
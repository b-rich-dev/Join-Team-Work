import { getAddTaskFormHTML, renderLeftFormFields, renderRightFormFields, renderFormButtons } from "./add-task-template.js";
import { initPriorityButtonLogic } from "../events/priorety-handler.js";
import { openSpecificOverlay, initOverlayListeners } from "../events/overlay-handler.js";
import { renderAssignedToContacts } from "../templates/add-task-template.js";
import { initDatePicker } from "../templates/add-task-template.js";
import { initSubtaskManagementLogic } from "../events/subtask-handler.js";
import { getContacts } from "../data/storage.js";
import { CWDATA } from "../data/task-to-firbase.js";
import { selectedContacts } from "../events/dropdown-menu.js";

/** * Opens the task detail edit overlay for a given task.
 * @param {object} task - The task data to populate the edit form.
 */
export async function openTaskDetailEditOverlay(task) {
  const editOverlayHtml = await fetchEditOverlayHtml();
  const overlayContainer = getOverlayContainer();
  if (!overlayContainer) return;
  overlayContainer.innerHTML = editOverlayHtml;
  const container = getEditFormContainer();
  if (!container) return;
  container.innerHTML = getAddTaskFormHTML(task);
  await initEditFormModules(container, task);
  setupEditFormSubmitPrevention(container);
  openSpecificOverlay("overlay-task-detail-edit");
  initOverlayListeners("overlay-task-detail-edit");
}

/** * Fetches the edit overlay HTML template.
 * @returns {Promise<string>} The HTML string of the edit overlay.
 */
async function fetchEditOverlayHtml() {
  const response = await fetch("js/templates/task-detail-edit-overlay.html");
  return await response.text();
}

/** * Gets the overlay container element.
 * @returns {HTMLElement|null} The overlay container element or null.
 */
function getOverlayContainer() {
  const overlayContainer = document.getElementById("overlay-container");
  if (!overlayContainer) {
    console.error("Overlay-Container not found!");
    return null;
  }
  return overlayContainer;
}

/** * Gets the edit form container element.
 * @returns {HTMLElement|null} The edit form container element or null.
 */
function getEditFormContainer() {
  const overlayElement = document.getElementById("overlay-task-detail-edit");
  if (!overlayElement) {
    console.error("Edit-Overlay-Element not found!");
    return null;
  }
  const container = overlayElement.querySelector("#task-edit-container");
  if (!container) {
    console.error("Edit-Formular-Container not found!");
    return null;
  }
  return container;
}

/** * Initializes modules for the edit form (priority, dropdown, date picker, subtasks, assigned contacts).
 * @param {HTMLElement} container - The edit form container element.
 * @param {object} task - The task data to populate the form.
 * @returns {Promise<void>} Resolves when modules are initialized.
 */
async function initEditFormModules(container, task) {
  await initPriorityModule(container);
  await initAssignedToDropdownModule(container, task);
  await initDatePickerModule(container);
  await initSubtaskModule(container);
  await initAssignedContactsModule(task);
}

/** * Initializes the priority button logic.
 * @param {HTMLElement} container - The edit form container element.
 * @returns {Promise<void>}
 */
async function initPriorityModule(container) {
  if (typeof initPriorityButtonLogic === "function") {
    try {
      initPriorityButtonLogic(container);
    } catch (e) {
      console.error("Error initializing priority button logic:", e);
    }
  } else {
    console.error("initPriorityButtonLogic is not defined!");
  }
}

/** * Initializes the assigned-to dropdown logic.
 * @param {HTMLElement} container - The edit form container element.
 * @returns {Promise<void>}
 */
async function initAssignedToDropdownModule(container, task) {
  try {
    const mod = await import("../events/dropdown-menu-auxiliary-function.js");
    const contactsData = window.firebaseData?.contacts ? Object.entries(window.firebaseData.contacts).map(([id, obj]) => ({ ...obj, id })) : [];
    await mod.initDropdowns(contactsData);
    const assignedSource = Array.isArray(task?.assignedUsers) ? task.assignedUsers : Array.isArray(task?.assignedTo) ? task.assignedTo : (typeof task?.assignedTo === "string" && task.assignedTo) ? task.assignedTo.split(",").map((s) => s.trim()).filter(Boolean) : [];
    await mod.setAssignedContactsFromTaskForCard(assignedSource);
  } catch (e) {
    console.error("Error initializing assignedTo dropdown via auxiliary module:", e);
  }
}

/** * Initializes the date picker logic.
 * @param {HTMLElement} container - The edit form container element.
 * @returns {Promise<void>}
 */
async function initDatePickerModule(container) {
  if (typeof initDatePicker === "function") {
    try {
      initDatePicker(container);
    } catch (e) {
      console.error("Error initializing date picker:", e);
    }
  } else {
    console.error("initDatePicker is not defined!");
  }
}

/** * Initializes the subtask management logic.
 * @param {HTMLElement} container - The edit form container element.
 * @returns {Promise<void>}
 */
async function initSubtaskModule(container) {
  if (typeof initSubtaskManagementLogic === "function") {
    try {
      initSubtaskManagementLogic(container);
    } catch (e) {
      console.error("Error initializing subtask management:", e);
    }
  } else {
    console.error("initSubtaskManagementLogic is not defined!");
  }
}

/** * Initializes assigned contacts for the edit form.
 * @param {object} task - The task data to populate the form.
 * @returns {Promise<void>}
 */
async function initAssignedContactsModule(task) {
  if (
    typeof addAssignedContactsToEditForm === "function" &&
    Array.isArray(task.assignedTo)
  ) {
    let contacts = [];
    try {
      contacts = await getContacts();
    } catch (e) {
      console.error("Error loading contacts:", e);
    }
    addAssignedContactsToEditForm(task.assignedTo, contacts);
  }
}

/** * Sets up prevention of form submission for the edit form.
 * @param {HTMLElement} container - The edit form container element.
 */
function setupEditFormSubmitPrevention(container) {
  const form = container.querySelector("#add-task-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }
}

/** * Saves the edited task data from the form to the database.
 * @param {string} taskId - The ID of the task being edited.
 * @returns {Promise<void>} Resolves when the task is saved.
 */
export async function saveEditedTask(taskId) {
  const form = getEditForm();
  if (!form) return;
  const editTaskObjekt = buildEditTaskObject(form, taskId);
  const objForCWDATA = { [taskId]: editTaskObjekt };
  await CWDATA(objForCWDATA, window.firebaseData);
  try {
    if (window.board && typeof window.board.site === "function") {
      window.board.site();
    } else if (typeof window.boardSiteHtml === "function") {
      window.boardSiteHtml();
    }
  } catch (e) {
    console.warn("Board refresh after save failed:", e);
  }
}

/** * Gets the edit form element.
 * @returns {HTMLFormElement|null} The edit form element or null.
 */
function getEditForm() {
  const form = document.querySelector("#add-task-form");
  if (!form) {
    console.error("Edit form not found!");
    return null;
  }
  return form;
}

/** * Builds the edited task object from the form data.
 * @param {HTMLFormElement} form - The edit form element.
 * @param {string} taskId - The ID of the task to be edited.
 * @returns {object} The edited task object.
 */
function buildEditTaskObject(form, taskId) {
  const title = form.querySelector("[name='title']")?.value || "";
  const description = form.querySelector("[name='description']")?.value || "";
  const deadline = form.querySelector("[name='deadline']")?.value || "";
  const type = getTaskType(form);
  const priority = getTaskPriority(form);
  const { totalSubtasks, checkedSubtasks } = getSubtasksFromForm(form, taskId);
  const subtasksCompleted = checkedSubtasks.filter(Boolean).length;
  const assignedUsers = getAssignedUsersFromForm(form);
  const formattedDate = getFormattedDate();
  return { assignedUsers, boardID: "board-1", checkedSubtasks, columnID: "inProgress", createdAt: formattedDate, deadline, description, priority, subtasksCompleted, title, totalSubtasks, type, updatedAt: formattedDate };
}

/** * Gets the task type from the form.
 * @param {HTMLFormElement} form - The edit form element.
 * @returns {string} The task type.
 */
function getTaskType(form) {
  const categoryDropdown = document.getElementById("dropdown-category");
  if (categoryDropdown) {
    const selected = categoryDropdown.querySelector(
      ".dropdown-selected, .selected-category"
    );
    return selected ? selected.textContent.trim() : "";
  }
  return "";
}

/** * Gets the task priority from the form.
 * @param {HTMLFormElement} form - The edit form element.
 * @returns {string} The task priority.
 */
function getTaskPriority(form) {
  const priorityInput = form.querySelector("[name='priority']:checked");
  if (priorityInput) {
    return priorityInput.value;
  } else {
    const prioBtn = form.querySelector(".priority-btn.selected");
    return prioBtn ? prioBtn.getAttribute("data-priority") : "";
  }
}

/** * Gets subtasks and their checked status from the form.
 * @param {HTMLFormElement} form - The edit form element.
 * @param {string} taskId - The ID of the task to be edited (not used, kept for compatibility).
 * @returns {{ totalSubtasks: string[], checkedSubtasks: boolean[] }} Subtasks and their checked status.
 */
function getSubtasksFromForm(form, taskId) {
  const subtaskInputs = form.querySelectorAll(".subtask-input");
  let totalSubtasks = Array.from(subtaskInputs).map((input) => input.value);
  let checkedSubtasks = Array.from(subtaskInputs).map((input) => input.checked);
  
  return { totalSubtasks, checkedSubtasks };
}

/** * Gets assigned user IDs from the form.
 * @param {HTMLFormElement} form - The edit form element.
 * @returns {string[]} Array of assigned user IDs.
 */
function getAssignedUsersFromForm(form) {
  if (!(window.firebaseData && window.firebaseData.contacts)) return [];
  const contactsObj = window.firebaseData.contacts;
  const sel = Array.isArray(selectedContacts) ? selectedContacts : [];
  const ids = sel
    .map((c) => {
      if (c && c.id) return c.id;
      const name = c?.name;
      if (!name) return null;
      const found = Object.entries(contactsObj).find(([, obj]) => obj.name === name);
      return found ? found[0] : null;
    })
    .filter(Boolean);
  return ids;
}

/** * Gets the current date formatted as DD.MM.YYYY.
 * @returns {string} The formatted date string.
 */
function getFormattedDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

/** Event listener for saving the edited task when the save button is clicked. 
*/
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("save-edit-task-btn")) {
    const taskId = e.target.getAttribute("data-task-id");
    saveEditedTask(taskId);
  }
});
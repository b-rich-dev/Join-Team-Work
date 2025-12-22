import { getFirebaseData } from "../data/API.js";
import { loadFirebaseData, refreshSummaryIfExists } from "../../main.js";
import { clearSubtask, clearSubtasksList, renderSubtasks, addedSubtasks, } from "../events/subtask-handler.js";
import { currentPriority, setMedium } from "../events/priorety-handler.js";
import { selectedCategory, selectedContacts, clearAssignedTo, clearCategory, } from "../events/dropdown-menu.js";
import { clearInvalidFields, initDropdowns, } from "../events/dropdown-menu-auxiliary-function.js";
import { CWDATA } from "../data/task-to-firbase.js";
import { initAddTaskForm, picker, showTaskSuccessMsg } from "../pages/add-task-auxiliary-functions.js";
import { checkRequiredFields, handleInput } from "./add-task-validation.js";

let isResizing = false;
let startY, startHeight, currentTextarea;
let overlayPickerInstance;
let refreshBoardSite = null;

export let fetchData = null;

/** * Sets the board refresh callback function
 * @param {Function} refreshCallback - The function to call when the board needs to be refreshed
 */
export function setRefreshBoardCallback(refreshCallback) {
  refreshBoardSite = refreshCallback;
}

/** * Initializes the task view and loads the required data.
 * @returns {Promise<void>} - A promise that resolves when the initialization is complete.
 * @throws {Error} - If an error occurs while loading the Firebase data.
 */
export async function initTask() {
  try {
    const data = (await loadFirebaseData()) || (await getFirebaseData());
    if (!data || !data.contacts) throw new Error("Firebase-Daten nicht verfügbar");
    initDropdowns(Object.values(data.contacts));
    fetchData = data;
  } catch (error) {
    console.error("Fehler beim Laden der Firebase-Daten:", error);
    try {
      initDropdowns([]);
    } catch (_) { }
  }
}

/** * Formats the date input value.
 * @param {HTMLInputElement} input - The input element to format.
 */
export function formatDate(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);

  let formatted = "";
  if (value.length > 4) formatted = value.slice(0, 2) + "." + value.slice(2, 4) + "." + value.slice(4);
  else if (value.length > 2) formatted = value.slice(0, 2) + "." + value.slice(2);
  else formatted = value;

  input.value = formatted;
}

/** * Opens the date picker.
 */
export function openPicker() {
  if (picker) picker.open();
  else console.error("The Flatpickr instance 'picker' is not initialized. Ensure that initAddTaskForm() has been called.");
}

/** * Starts resizing the textarea when the resize handle is clicked.
 * @param {MouseEvent} e - The mouse event triggered by clicking the resize handle.
 */
export function startResize(e) {
  isResizing = true;
  currentTextarea = e.target.closest(".textarea-wrapper").querySelector("textarea");
  startY = e.clientY;
  startHeight = currentTextarea.offsetHeight;

  document.addEventListener("mousemove", resizeTextarea);
  document.addEventListener("mouseup", stopResize);

  e.preventDefault();
}

/** * Resizes the textarea based on the mouse movement.
 * @param {MouseEvent} e - The mouse event with the clientY position.
 */
export function resizeTextarea(e) {
  if (!isResizing) return;
  const newHeight = startHeight + e.clientY - startY + "px";
  currentTextarea.style.height = newHeight;
}

/** * Stops the resizing of the textarea when the mouse button is released.
 * @param {MouseEvent} e - The mouse event triggered by releasing the mouse button.
 */
export function stopResize() {
  isResizing = false;
  document.removeEventListener("mousemove", resizeTextarea);
  document.removeEventListener("mouseup", stopResize);
}

/** * Clears the form fields and resets the state.
 */
export function clearForm() {
  const form = document.getElementById("add-task-form");
  if (form) form.reset();
  setMedium();
  clearCategory();
  clearSubtask();
  clearSubtasksList();
  clearAssignedTo();
  clearInvalidFields();
  clearAttachments();

  renderSubtasks();
}

/** * Retrieves the value of an input element by its ID.
 * @param {string} id - The ID of the input element.
 * @returns {string} - The value of the input element.
 */
function getInputValue(id) {
  return document.getElementById(id).value;
}

/** * Formats a date as a string in the format DD.MM.YYYY.
 * @param {Date} [date=new Date()] - The date to format.
 * @returns {string} - The formatted date string.
 */
function getFormattedDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/** * Extracts information from an array of subtasks.
 * @param {Array} subtasks - The array of subtasks to extract information from.
 * @returns {Object} - An object containing the extracted information.
 */
function extractSubtasks(subtasks) {
  const total = subtasks.map((s) => s.text);
  const checked = subtasks.map((s) => s.completed);
  const completed = checked.filter(Boolean).length;
  return { total, checked, completed };
}

/** * Reads the current subtasks from the DOM as a fallback when the in-memory
 * state is empty. This makes sure we persist subtasks created in the overlay
 * even if event wiring differs.
 * @returns {{text: string, completed: boolean}[]} Array of subtask objects
 */
function readSubtasksFromDom() {
  const list = document.getElementById("subtasks-list");
  if (!list) return [];
  const items = Array.from(list.querySelectorAll(".subtask-list"));
  if (items.length === 0) return [];
  return items
    .map((li) => {
      const span = li.querySelector(".subtask-text");
      if (!span) return null;
      return {
        text: span.textContent?.trim() || "",
        completed: span.classList.contains("completed"),
      };
    })
    .filter(Boolean);
}

/** * Maps selected contacts to their corresponding IDs.
 * @param {Array} selectedContacts - The array of selected contacts.
 * @param {Object} fetchData - The fetched data containing contacts.
 * @returns {Array} - An array of mapped contact IDs.
 */
function mapAssignedUsers(selectedContacts, fetchData) {
  if (!fetchData || !fetchData.contacts) {
    console.warn("WARNING: 'fetchData.contacts' missing or empty.");
    return [];
  }

  return selectedContacts
    .map((contact) => {
      for (const id in fetchData.contacts) {
        if (fetchData.contacts[id].name === contact.name) return id;
      }
      return undefined;
    })
    .filter(Boolean);
}

/** * Creates a task object from the form inputs.
 * @returns {Object} - The created task object.
 */
function createTaskObject() {
  const title = getInputValue("title");
  const description = getInputValue("task-description");
  const dueDate = getInputValue("datepicker");
  const formattedDate = getFormattedDate();
  const attachments = window.taskAttachments || [];
  const subtaskState = addedSubtasks && addedSubtasks.length > 0 ? addedSubtasks : readSubtasksFromDom();
  const { total, checked, completed } = extractSubtasks(subtaskState);
  const assignedUsers = mapAssignedUsers(selectedContacts, fetchData);

  return {
    assignedUsers,
    boardID: "board-1",
    checkedSubtasks: checked,
    columnID: "inProgress",
    createdAt: formattedDate,
    deadline: dueDate,
    description,
    priority: currentPriority,
    subtasksCompleted: completed,
    title,
    totalSubtasks: total,
    type: selectedCategory,
    updatedAt: formattedDate,
    attachments: attachments,
  };
}

/** * Handles the form submission for creating a new task.
 * @param {Event} event - The form submission event.
 */
export async function handleCreateTask(event) {
  event.preventDefault();

  if (checkRequiredFields()) {
    await processNewTask();
    const overlay = document.getElementById("overlay");
    if (overlay) hideOverlay(overlay);

    if (typeof refreshBoardSite === 'function') await refreshBoardSite();
    else if (window.location.pathname.includes('board-site')) await awaitrefreshBoardSiteAndFn();
    else window.location.href = "board-site.html";
  }
}

/** * Hides the overlay by adding/removing CSS classes.
 * @param {HTMLElement} overlay - The overlay element to hide.
 */
function hideOverlay(overlay) {
  overlay.classList.add("overlay-hidden");
  overlay.classList.remove("overlay-visible");
  initAddTaskForm();
}

/** * Clears attachment data from the global state and the DOM.
 */
async function awaitrefreshBoardSiteAndFn() {
  const { refreshBoardSite: refreshFn } = await import('../ui/render-board.js');
  await refreshFn();
}

/** * Processes the creation of a new task.
 * It creates a task object, sends it to the server, shows a success message, and clears the form.
 * @returns {Promise<void>} - A promise that resolves when the task is processed.
 */
export async function processNewTask() {
  const submitButton = document.getElementById("submit-button");
  submitButton.disabled = true;

  try {
    await createNewTask();
  } finally {
    submitButton.disabled = false;
  }
  return;
}

/** * Creates a new task and sends it to the server.
 */
async function createNewTask() {
  const newTask = createTaskObject();
  const rawNewObject = createTaskObject();

  await CWDATA(rawNewObject, fetchData);
  await showTaskSuccessMsg();
  await refreshSummaryIfExists();

  clearForm();
}
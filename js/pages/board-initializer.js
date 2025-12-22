import {openSpecificOverlay, initOverlayListeners, redirectOnSmallScreen } from "../../js/events/overlay-handler.js";
import { clearForm, setRefreshBoardCallback, initTask } from "./add-task.js";
import { initAddTaskForm } from "./add-task-auxiliary-functions.js";
import { getAddTaskFormHTML } from "../templates/add-task-template.js";
import { loadFirebaseData } from "../../main.js";
import { checkFirebaseHealth } from "../data/API.js";
import { filterTaskCardsByTitle } from "../events/find-task.js";
import { refreshBoardSite } from "../ui/render-board.js";

let isOverlayLoaded = false;

/** * Handles the case when overlay is already loaded - clears form and reopens it.
 */
async function handleAlreadyLoadedOverlay() {
  clearForm();
  await initTask();
  openSpecificOverlay("overlay");
  redirectOnSmallScreen();
}

/** * Fetches the add-task overlay HTML from the template file.
 * @returns {Promise<string>} The overlay HTML content.
 * @throws {Error} If fetch fails.
 */
async function fetchOverlayHTML() {
  const response = await fetch("../js/templates/add-task-overlay.html");
  if (!response.ok) {
    throw new Error(`HTTP Error! Status: ${response.status} when retrieving add-task-overlay.html`);
  }
  return await response.text();
}

/** * Removes existing overlay element from the DOM if present.
 */
function removeExistingOverlay() {
  const existingOverlay = document.getElementById("overlay");
  if (existingOverlay) existingOverlay.remove();
}

/** * Creates overlay element from HTML and appends to container.
 * @param {HTMLElement} overlayContainer - The container to append to.
 * @param {string} overlayHTML - The HTML content.
 * @returns {HTMLElement} The created overlay element.
 */
function createAndAppendOverlay(overlayContainer, overlayHTML) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = overlayHTML;
  const overlayElement = tempDiv.firstElementChild;
  overlayContainer.appendChild(overlayElement);
  return overlayElement;
}

/** * Initializes the add-task form inside the overlay element.
 * @param {HTMLElement} overlayElement - The overlay element containing the form.
 */
async function initializeOverlayForm(overlayElement) {
  const formContainerInOverlay = overlayElement.querySelector("#add-task-form-container");
  if (!formContainerInOverlay) return;

  formContainerInOverlay.innerHTML = getAddTaskFormHTML();
  await initAddTaskForm();
  setRefreshBoardCallback(refreshBoardSite);
  redirectOnSmallScreen();
}

/** * Sets up and initializes the overlay element in the DOM.
 * @param {HTMLElement} overlayContainer - The container to append the overlay to.
 * @param {string} overlayHTML - The HTML content of the overlay.
 */
async function setupOverlayElement(overlayContainer, overlayHTML) {
  removeExistingOverlay();
  const overlayElement = createAndAppendOverlay(overlayContainer, overlayHTML);
  isOverlayLoaded = true;
  initOverlayListeners("overlay");
  await initializeOverlayForm(overlayElement);
}

/** * Loads the add-task overlay and initializes it.
 * If the overlay is already loaded, it clears the form and opens the overlay.
 * @returns {Promise<void>} Resolves when the overlay is loaded and initialized.
 */
export async function loadAndInitAddTaskOverlay() {
  if (isOverlayLoaded) {
    await handleAlreadyLoadedOverlay();
    return;
  }

  try {
    const overlayHTML = await fetchOverlayHTML();
    const overlayContainer = document.getElementById("overlay-container");
    if (overlayContainer) await setupOverlayElement(overlayContainer, overlayHTML);
  } catch (error) {
    console.error("Error loading add-task overlay:", error);
  }
}

/** * Preloads Firebase data and exposes it globally for legacy code.
 */
async function preloadFirebaseData() {
  try {
    const data = await loadFirebaseData();
    if (data) window.firebaseData = data;
  } catch (e) {
    console.warn("Firebase data preload failed:", e);
  }
}

/** * Updates the Firebase health status indicator element.
 */
async function updateFirebaseHealthStatus() {
  const statusEl = document.getElementById("firebase-status");
  if (!statusEl) return;
  
  const res = await checkFirebaseHealth();
  statusEl.textContent = res.ok ? "Firebase verbunden" : res.timedOut ? "Firebase Timeout" : `Firebase Fehler: ${res.status} ${res.statusText}`;
  statusEl.classList.toggle("error", !res.ok);
}

/** * Sets up the main add-task button listener.
 */
function setupAddTaskButton() {
  const addTaskButton = document.getElementById("add-task");
  if (addTaskButton) {
    addTaskButton.addEventListener("click", async () => {
      await loadAndInitAddTaskOverlay();
      openSpecificOverlay("overlay");
    });
  }
}

/** * Sets up listeners for all fast-add-task buttons.
 */
function setupFastAddTaskButtons() {
  const fastAddTaskButtons = document.querySelectorAll('[id^="fast-add-task-"]');
  fastAddTaskButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await loadAndInitAddTaskOverlay();
      openSpecificOverlay("overlay");
    });
  });
}

/** * Handles search input changes - clears search or filters tasks.
 * @param {Event} event - The input event.
 */
async function handleSearchInput(event) {
  if (event.target.value.trim() === "") {
    try {
      const { loadAndRenderBoard } = await import("../ui/render-board.js");
      await loadAndRenderBoard();
      hideFindTaskInfoNoFoundMsg();
    } catch (error) {
      console.error("Error loading and rendering board:", error);
    }
  } else {
    filterTaskCardsByTitle();
  }
}

/** * Handles Enter key in search input.
 * @param {KeyboardEvent} event - The keydown event.
 */
async function handleSearchKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    if (event.target.value.trim() !== "") filterTaskCardsByTitle();
  }
}

/** * Handles search button click.
 * @param {HTMLInputElement} searchInput - The search input element.
 */
async function handleSearchButtonClick(searchInput) {
  if (searchInput && searchInput.value.trim() !== "") filterTaskCardsByTitle();
}

/** * Sets up search input and button functionality.
 */
function setupSearchFunctionality() {
  const searchInput = document.getElementById("find-task");
  const searchButton = document.getElementById("search-task-btn");
  
  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("keydown", handleSearchKeydown);
  }

  if (searchButton) {
    searchButton.addEventListener("click", () => handleSearchButtonClick(searchInput));
  }
}

/** * Initializes the add-task overlay and sets up event listeners when the DOM content is loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  preloadFirebaseData();
  updateFirebaseHealthStatus();
  setupAddTaskButton();
  setupFastAddTaskButtons();
  setupSearchFunctionality();
});

/** * Shows a find-task-info-no-found message and keeps it visible until tasks are found or search is cleared.
 * @returns {void}
 */
export function showFindTaskInfoNoFoundMsg() {
  const noFoundMsg = document.getElementById("find-task-info-no-found-Msg");
  if (!noFoundMsg) return;
  noFoundMsg.classList.remove("slide-out", "hidden");
  noFoundMsg.classList.add("slide-in");
}

/** * Hides the find-task-info-no-found message immediately.
 * @returns {void}
 */
export function hideFindTaskInfoNoFoundMsg() {
  const noFoundMsg = document.getElementById("find-task-info-no-found-Msg");
  if (!noFoundMsg) return;
  noFoundMsg.classList.remove("slide-in");
  noFoundMsg.classList.add("slide-out");
  setTimeout(() => {
    noFoundMsg.classList.add("hidden");
  }, 400);
}
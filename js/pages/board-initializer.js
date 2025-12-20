import {
  openSpecificOverlay,
  initOverlayListeners,
  redirectOnSmallScreen,
} from "../../js/events/overlay-handler.js";
import { clearForm, setRefreshBoardCallback, initTask } from "./add-task.js";
import { initAddTaskForm } from "./add-task-auxiliary-functions.js";
import { getAddTaskFormHTML } from "../templates/add-task-template.js";

import { loadFirebaseData } from "../../main.js";
import { checkFirebaseHealth } from "../data/API.js";
import { filterTaskCardsByTitle } from "../events/find-task.js";
import { refreshBoardSite } from "../ui/render-board.js";

let isOverlayLoaded = false;

/**
 * Loads the add-task overlay and initializes it.
 * If the overlay is already loaded, it clears the form and opens the overlay.
 * @returns {Promise<void>} Resolves when the overlay is loaded and initialized.
 */
export async function loadAndInitAddTaskOverlay() {
  if (isOverlayLoaded) {
    clearForm();
    await initTask();
    openSpecificOverlay("overlay");
    redirectOnSmallScreen();
    return;
  }

  try {
    const response = await fetch("../js/templates/add-task-overlay.html");
    if (!response.ok) {
      throw new Error(
        `HTTP Error! Status: ${response.status} when retrieving add-task-overlay.html`
      );
    }
    const addTaskOverlayHtml = await response.text();
    const overlayContainer = document.getElementById("overlay-container");

    if (overlayContainer) {
      const existingOverlay = document.getElementById("overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = addTaskOverlayHtml;
      const overlayElement = tempDiv.firstElementChild;
      overlayContainer.appendChild(overlayElement);

      isOverlayLoaded = true;

      initOverlayListeners("overlay");

      const formContainerInOverlay = overlayElement.querySelector(
        "#add-task-form-container"
      );
      if (formContainerInOverlay) {
        formContainerInOverlay.innerHTML = getAddTaskFormHTML();
      } else {
        return;
      }

      await initAddTaskForm();
      
      // Set the refresh callback so the board updates without reload
      setRefreshBoardCallback(refreshBoardSite);

      redirectOnSmallScreen();
    }
  } catch (error) {
    console.error("Error loading add-task overlay:", error);
  }
}

/**
 * Initializes the add-task overlay and sets up event listeners when the DOM content is loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Preload Firebase data once to provide a shared cache for modules
  (async () => {
    try {
      const data = await loadFirebaseData();
      if (data) {
        // expose for legacy code paths that read window.firebaseData
        window.firebaseData = data;
      }
    } catch (e) {
      console.warn("Firebase Daten-Vorladen fehlgeschlagen:", e);
    }
  })();
  // Simple Firebase health indicator
  (async () => {
    const statusEl = document.getElementById("firebase-status");
    if (statusEl) {
      const res = await checkFirebaseHealth();
      statusEl.textContent = res.ok
        ? "Firebase verbunden"
        : res.timedOut
        ? "Firebase Timeout"
        : `Firebase Fehler: ${res.status} ${res.statusText}`;
      statusEl.classList.toggle("error", !res.ok);
    }
  })();
  const addTaskButton = document.getElementById("add-task");
  if (addTaskButton) {
    addTaskButton.addEventListener("click", async () => {
      await loadAndInitAddTaskOverlay();
      openSpecificOverlay("overlay");
    });
  }

  const fastAddTaskButtons = document.querySelectorAll(
    '[id^="fast-add-task-"]'
  );
  fastAddTaskButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const columnId = event.currentTarget.id.replace("fast-add-task-", "");
      await loadAndInitAddTaskOverlay();
      openSpecificOverlay("overlay");
    });
  });

  const searchInput = document.getElementById("find-task");
  const searchButton = document.getElementById("search-task-btn");
  
  if (searchInput) {
    // Input event for live search
    searchInput.addEventListener("input", async (event) => {
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
    });

    // Enter key to trigger search
    searchInput.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (searchInput.value.trim() !== "") {
          filterTaskCardsByTitle();
        }
      }
    });
  }

  // Search button click handler
  if (searchButton) {
    searchButton.addEventListener("click", async () => {
      if (searchInput && searchInput.value.trim() !== "") {
        filterTaskCardsByTitle();
      }
    });
  }
});

/**
 * Shows a find-task-info-no-found message and keeps it visible until tasks are found or search is cleared.
 * @returns {void}
 */
export function showFindTaskInfoNoFoundMsg() {
  const noFoundMsg = document.getElementById("find-task-info-no-found-Msg");
  if (!noFoundMsg) return;
  noFoundMsg.classList.remove("slide-out", "hidden");
  noFoundMsg.classList.add("slide-in");
}

/**
 * Hides the find-task-info-no-found message immediately.
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

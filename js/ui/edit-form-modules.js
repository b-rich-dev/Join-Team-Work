/**
 * Sets up modules for the edit form (priority, dropdowns, date picker, subtasks).
 * @param {HTMLElement} container - The container element for the edit form.
 * @param {object} taskToEdit - The task object to edit.
 * @param {object} boardData - The board data object.
 */
export function setupEditFormModules(container, taskToEdit, boardData) {
  setupPriorityModule(container, taskToEdit);
  setupDropdownModule(container, taskToEdit, boardData);
  setupDatePickerModule(container);
  setupSubtaskModule(container, taskToEdit);
  setupAttachmentsModule(container, taskToEdit);
}

function setupPriorityModule(container, taskToEdit) {
  import("../events/priorety-handler.js").then((mod) => {
    mod.initPriorityButtons();
    const prio = taskToEdit.priority || "medium";
    const prioBtn = container.querySelector(
      `.priority-btn[data-priority="${prio}"]`
    );
    if (prioBtn) mod.setPriority(prioBtn, prio);
    mod.setButtonIconsMobile();
    if (!window._hasSetButtonIconsMobileListener) {
      window.addEventListener("resize", mod.setButtonIconsMobile);
      window._hasSetButtonIconsMobileListener = true;
    }
  });
}

function setupDropdownModule(container, taskToEdit, boardData) {
  import("../events/dropdown-menu-auxiliary-function.js").then(async (mod) => {
    const contactsWithIds = Object.entries(boardData.contacts || {}).map(
      ([id, obj]) => ({ ...obj, id })
    );
    await mod.initDropdowns(contactsWithIds, container);
    await mod.setCategoryFromTaskForCard(taskToEdit.type);
    const assignedSource = Array.isArray(taskToEdit.assignedUsers)
      ? taskToEdit.assignedUsers
      : Array.isArray(taskToEdit.assignedTo)
      ? taskToEdit.assignedTo
      : (typeof taskToEdit.assignedTo === "string" && taskToEdit.assignedTo)
      ? taskToEdit.assignedTo
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    await mod.setAssignedContactsFromTaskForCard(assignedSource);
  });
}

function setupDatePickerModule(container) {
  import("../templates/add-task-template.js").then((mod) => {
    if (mod.initDatePicker) mod.initDatePicker(container);
  });
}

function setupSubtaskModule(container, taskToEdit) {
  import("../events/subtask-handler.js").then((mod) => {
    import("../utils/subtask-utils.js").then(({ extractSubtasksFromTask }) => {
      mod.addedSubtasks.length = 0;
      extractSubtasksFromTask(taskToEdit).forEach((st) =>
        mod.addedSubtasks.push({ ...st })
      );
      mod.initSubtaskManagementLogic(container);
      mod.renderSubtasks();
    });
  });
}

function setupAttachmentsModule(container, taskToEdit) {
  import("../pages/add-task-attachment-functions.js").then((module) => {
    try {
      // Prefill attachments for edit form
      const existing = Array.isArray(taskToEdit?.attachments)
        ? JSON.parse(JSON.stringify(taskToEdit.attachments))
        : [];
      
      // Ergänze fehlende Felder für Rückwärtskompatibilität
      const normalized = existing.map(att => {
        const normalized = { ...att };
        
        // Ergänze size falls nicht vorhanden
        if (typeof normalized.size !== 'number' || normalized.size === 0) {
          if (normalized.base64 && typeof window.base64PayloadBytes === 'function') {
            normalized.size = window.base64PayloadBytes(normalized.base64);
          } else {
            normalized.size = 0;
          }
        }
        
        // Ergänze type falls nicht vorhanden (versuche aus base64 zu erkennen)
        if (!normalized.type) {
          if (normalized.base64?.startsWith('data:image/png')) {
            normalized.type = 'image/png';
          } else if (normalized.base64?.startsWith('data:image/jpeg') || normalized.base64?.startsWith('data:image/jpg')) {
            normalized.type = 'image/jpeg';
          } else if (normalized.base64?.startsWith('data:image/')) {
            // Extrahiere MIME-Type aus data URL
            const match = normalized.base64.match(/^data:([^;]+);/);
            normalized.type = match ? match[1] : 'image/jpeg';
          } else {
            normalized.type = 'image/jpeg'; // Default
          }
        }
        
        return normalized;
      });
      
      window.taskAttachments = normalized;
      if (typeof window.initAttachmentUI === "function") {
        window.initAttachmentUI();
      }
    } catch (e) {
      console.error("Failed to initialize attachments module:", e);
    }
  });
}

/** * Sets up modules for the edit form (priority, dropdowns, date picker, subtasks).
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

/** * Sets up the priority module for the edit form.
 * @param {HTMLElement} container - The container element for the edit form.
 * @param {object} taskToEdit - The task object to edit.
 */
function setupPriorityModule(container, taskToEdit) {
  import("../events/priorety-handler.js").then((mod) => {
    mod.initPriorityButtons();
    const prio = taskToEdit.priority || "medium";
    const prioBtn = container.querySelector(`.priority-btn[data-priority="${prio}"]`);
    if (prioBtn) mod.setPriority(prioBtn, prio);
    mod.setButtonIconsMobile();
    if (!window._hasSetButtonIconsMobileListener) {
      window.addEventListener("resize", mod.setButtonIconsMobile);
      window._hasSetButtonIconsMobileListener = true;
    }
  });
}

/** * Sets up the dropdown module for the edit form.
 * @param {HTMLElement} container - The container element for the edit form.
 * @param {object} taskToEdit - The task object to edit.
 * @param {object} boardData - The board data object.
 */
function setupDropdownModule(container, taskToEdit, boardData) {
  import("../events/dropdown-menu-auxiliary-function.js").then(async (mod) => {
    const contactsWithIds = Object.entries(boardData.contacts || {}).map(([id, obj]) => ({ ...obj, id }));
    await mod.initDropdowns(contactsWithIds, container);
    await mod.setCategoryFromTaskForCard(taskToEdit.type);
    const assignedSource = Array.isArray(taskToEdit.assignedUsers)
      ? taskToEdit.assignedUsers
      : Array.isArray(taskToEdit.assignedTo)
      ? taskToEdit.assignedTo
      : (typeof taskToEdit.assignedTo === "string" && taskToEdit.assignedTo)
      ? taskToEdit.assignedTo.split(",").map((s) => s.trim()).filter(Boolean) : [];
    await mod.setAssignedContactsFromTaskForCard(assignedSource);
  });
}

/** * Sets up the date picker module for the edit form.
 * @param {HTMLElement} container - The container element for the edit form.
 */
function setupDatePickerModule(container) {
  import("../templates/add-task-template.js").then((mod) => {
    if (mod.initDatePicker) mod.initDatePicker(container);
  });
}

/** * Sets up the subtask module for the edit form.
 * @param {HTMLElement} container - The container element for the edit form.
 * @param {object} taskToEdit - The task object to edit.
 */
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

/** * Sets up the attachments module for the edit form.
 * @param {HTMLElement} container - The container element for the edit form.
 * @param {object} taskToEdit - The task object to edit.
 */
function setupAttachmentsModule(container, taskToEdit) {
  Promise.all([
    import("../pages/add-task-attachment-core.js"),
    import("../pages/add-task-attachment-ui.js")
  ]).then(([coreModule, uiModule]) => {
    try {
      const existing = getExistingAttachments(taskToEdit);
      const normalized = existing.map(normalizeAttachment);
      initializeAttachmentUI(normalized);
    } catch (e) {
      console.error("Failed to initialize attachments module:", e);
    }
  });
}

/** * Retrieves existing attachments from the task object.
 * @param {object} taskToEdit - The task object to edit.
 * @returns {Array} Array of existing attachments.
 */
function getExistingAttachments(taskToEdit) {
  return Array.isArray(taskToEdit?.attachments)
    ? JSON.parse(JSON.stringify(taskToEdit.attachments))
    : [];
}

/** * Normalizes an attachment object to ensure it has size and type.
 * @param {object} att - The attachment object.
 * @returns {object} The normalized attachment object.
 */
function normalizeAttachment(att) {
  const normalized = { ...att };
  normalized.size = normalizeAttachmentSize(normalized);
  normalized.type = normalizeAttachmentType(normalized);
  return normalized;
}

/** * Normalizes the size of an attachment.
 * @param {object} attachment - The attachment object.
 * @returns {number} The normalized size in bytes.
 */
function normalizeAttachmentSize(attachment) {
  if (typeof attachment.size === 'number' && attachment.size > 0) return attachment.size;
  if (attachment.base64 && typeof window.base64PayloadBytes === 'function') {
    return window.base64PayloadBytes(attachment.base64);
  }
  return 0;
}

/** * Normalizes the type of an attachment.
 * @param {object} attachment - The attachment object.
 * @returns {string} The normalized MIME type.
 */
function normalizeAttachmentType(attachment) {
  if (attachment.type) return attachment.type;
  if (!attachment.base64) return 'image/jpeg';
  if (attachment.base64.startsWith('data:image/png')) return 'image/png';
  if (attachment.base64.startsWith('data:image/jpeg') || attachment.base64.startsWith('data:image/jpg')) {
    return 'image/jpeg';
  }
  if (attachment.base64.startsWith('data:image/')) {
    const match = attachment.base64.match(/^data:([^;]+);/);
    return match ? match[1] : 'image/jpeg';
  }
  return 'image/jpeg';
}

/** * Initializes the attachment UI with normalized attachments.
 * @param {Array} normalizedAttachments - Array of normalized attachment objects.
 */
function initializeAttachmentUI(normalizedAttachments) {
  window.taskAttachments = normalizedAttachments;
  if (typeof window.initAttachmentUI === "function") {
    window.initAttachmentUI();
  }
}
/** * Creates the HTML string for a single subtask.
 * @param {string} subtaskName - The name of the subtask.
 * @param {boolean} isChecked - Whether the subtask is checked.
 * @param {string} taskId - The ID of the parent task.
 * @param {number} subtaskIndex - The index of the subtask.
 * @returns {string} The HTML string for the subtask.
 */
function createSubtaskHtml(subtaskName, isChecked, taskId, subtaskIndex) {
  return `<div class="subtask-item">
            <label for="subtask-${taskId}-${subtaskIndex}" class="subtask-label" style="cursor:pointer;">
              <input type="checkbox" class="subtask-checkbox" id="subtask-${taskId}-${subtaskIndex}" data-task-id="${taskId}" data-subtask-index="${subtaskIndex}" ${isChecked ? "checked" : ""} onclick="toggleCheckbox(this)">
              <span class="checkbox-svg-wrapper" onclick="toggleCheckbox(this.parentElement.querySelector('input[type=checkbox]'))" style="display:inline-flex;align-items:center;cursor:pointer;">
                ${isChecked ? ` <svg class="checkbox-icon checked" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="16" height="16" rx="3" stroke="#2A3647" stroke-width="2" fill="white"/>
                                    <path d="M3 9L7 13L15 3.5" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>`
                            : ` <svg class="checkbox-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="1" width="16" height="16" rx="3" stroke="#2A3647" stroke-width="2" fill="white"/>
                                </svg>`}
              </span>
              <span>${subtaskName}</span>
            </label>
          </div>`;
}

/** * Gets the checked status of a subtask.
 * @param {object} task - The task object containing the subtasks.
 * @param {number} index - The index of the subtask.
 * @returns {boolean} True if the subtask is checked, otherwise false.
 */
function getSubtaskCheckedStatus(task, index) {
  return (
    Array.isArray(task.checkedSubtasks) && task.checkedSubtasks[index] === true
  );
}

/** * Renders a single subtask.
 * @param {object} task - The task object containing the subtask.
 * @param {number} i - The index of the subtask.
 * @returns {string} The HTML string of the rendered subtask.
 */
function renderSingleSubtask(task, i) {
  const subtaskName = task.totalSubtasks[i];
  const isChecked = getSubtaskCheckedStatus(task, i);
  return createSubtaskHtml(subtaskName, isChecked, task.id, i);
}

/** * Renders all subtasks for a given task.
 * @param {object} task - The task object.
 * @returns {string} The combined HTML string of all subtasks.
 */
function renderSubtasks(task) {
  if (!task?.totalSubtasks || Object.keys(task.totalSubtasks).length === 0) return "";

  let subtasksHtml = "";
  for (const i in task.totalSubtasks) {
    subtasksHtml += renderSingleSubtask(task, i);
  }
  return subtasksHtml;
}

/** * Creates the HTML section for the subtasks of a task card.
 * @param {object} task - The task object.
 * @returns {string} The HTML string for the subtasks section.
 */
export function getTaskSubtasksSection(task) {
  const subtasksHtml = renderSubtasks(task);
  if (subtasksHtml === "") return "";
  setTimeout(() => {
    document.querySelectorAll(".subtask-label").forEach((label) => {
      const checkbox = label.querySelector(".subtask-checkbox");
      const icon = label.querySelector(".checkbox-icon");
      if (!checkbox || !icon) return;
      label.addEventListener("click", function (e) {
        if (e.target.tagName === "SPAN") return;
        setTimeout(() => {
          if (checkbox.checked) {
            icon.src = "../assets/icons/btn/checkbox-filled-white.svg";
            icon.alt = "checkbox filled";
            icon.classList.add("checked");
          } else {
            icon.src = "../assets/icons/btn/checkbox-empty-black.svg";
            icon.alt = "checkbox empty";
            icon.classList.remove("checked");
          }
        }, 0);
      });
    });
  }, 0);
  return `<div class="taskCardField subtasks-section">
            <p class="subtasks-title">Subtasks:</p>
            <div class="subtaskList">${subtasksHtml}</div>
          </div>`;
}

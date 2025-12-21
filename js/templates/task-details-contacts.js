/** * Checks if a contact matches the given details.
 * @param {object} contact - The contact object.
 * @param {string} name - The contact's name.
 * @param {string} initials - The contact's initials.
 * @param {string} avatarColor - The contact's avatar color.
 * @returns {boolean} True if the contact matches, otherwise false.
 */
function contactMatches(contact, name, initials, avatarColor) {
  return (
    contact.name === name &&
    contact.initials === initials &&
    contact.avatarColor === avatarColor
  );
}

/** * Checks if a contact is in the list of assigned contacts.
 * @param {string} name - The name of the contact to check.
 * @param {string} initials - The initials of the contact to check.
 * @param {string} avatarColor - The avatar color of the contact to check.
 * @param {Array<object>} assignedContacts - The list of already assigned contact objects.
 * @returns {boolean} True if the contact is assigned, otherwise false.
 */
function isContactSelected(name, initials, avatarColor, assignedContacts) {
  return (assignedContacts?.some((c) => contactMatches(c, name, initials, avatarColor)) ?? false);
}

/** * Renders the HTML for a contact with selection status.
 * @param {object} contact - The contact object to render.
 * @param {Array<object>} assignedContactObjects - The list of already assigned contact objects for comparison.
 * @returns {string} The HTML string for the contact option.
 */
export function renderAssignedToContactsWithSelection(contact, assignedContactObjects) {
  const { name, initials, avatarColor, avatarImage } = contact;
  const isSelected = isContactSelected(name, initials, avatarColor, assignedContactObjects);
  const assignedClass = isSelected ? "assigned" : "";
  let avatarStyle = '';
  let avatarContent = initials;
  let avatarClickHandler = '';

  if (avatarImage) {
    const base64 = typeof avatarImage === 'string' ? avatarImage : (avatarImage?.base64 || avatarImage);
    avatarStyle = `style="background-image: url(${base64}); background-size: cover; background-position: center; cursor: pointer;"`;
    avatarContent = '';

    const contactId = contact.id || '';
    avatarClickHandler = `onclick="event.stopPropagation(); event.preventDefault(); window.showTaskContactAvatarGallery('${contactId}', false); return false;"`;
  } else {
    avatarStyle = `style="background-color: var(${avatarColor});"`;
  }

  return `<div class="contact-option ${assignedClass}" data-name="${name}" data-initials="${initials}" data-avatar-color="${avatarColor}">
            <div class="contact-checkbox">
              <div class="initials-container">
                <div class="assigned-initials-circle" ${avatarStyle} ${avatarClickHandler}>${avatarContent}</div>
              </div>
            </div>
          </div>
          <div class="contact-name">${name}</div>`;
}

/** * Filters contact objects based on assigned user IDs.
 * @param {Array<string>} assignedUserIDs - A list of user IDs.
 * @param {object} allContactsObject - An object containing all contact objects by ID.
 * @returns {Array<object>} A filtered list of contact objects.
 */
function getFilteredContacts(assignedUserIDs, allContactsObject) {
  if (!assignedUserIDs) return [];
  return assignedUserIDs.map((id) => {
    const contact = allContactsObject[id];
    if (contact) return { ...contact, id };
    return null;
  }).filter(Boolean);
}

/** * Generates the HTML string for assigned contacts with max 3 visible.
 * @param {Array<string>} assignedUserIDs - A list of user IDs assigned to a task.
 * @param {object} allContactsObject - An object containing all contact objects by ID.
 * @returns {string} The HTML string for the list of assigned contacts.
 */
function getAssignedContactsHtml(assignedUserIDs, allContactsObject) {
  const assignedContacts = getFilteredContacts(assignedUserIDs, allContactsObject);

  if (typeof window !== 'undefined') window.currentTaskContactsWithAvatars = assignedContacts.map(c => ({ id: c.id, name: c.name, initials: c.initials, avatarColor: c.avatarColor, avatarImage: c.avatarImage || null }));
  if (assignedContacts.length <= 3) return assignedContacts.map((c) => renderAssignedToContactsWithSelection(c, assignedContacts)).join("");

  const visibleContacts = assignedContacts.slice(0, 3);
  const hiddenContacts = assignedContacts.slice(3);
  const remainingCount = hiddenContacts.length;
  let html = visibleContacts.map((c) => renderAssignedToContactsWithSelection(c, assignedContacts)).join("");

  html += ` <div class="contact-option show-more-contacts" onclick="toggleMoreContacts(this)">
              <div class="contact-checkbox">
                <div class="initials-container">
                  <div class="assigned-initials-circle" style="background-color: var(--grey);">...+${remainingCount}</div>
                </div>
              </div>
            </div>`;
  html += `<div class="hidden-contacts" style="display: none;" onclick="toggleMoreContacts(this)">`;
  html += hiddenContacts.map((c) => renderAssignedToContactsWithSelection(c, assignedContacts)).join("");
  html += `</div>`;

  return html;
}

/** * Toggles the visibility of additional contacts.
 * @param {HTMLElement} element - The "show more" button element or any contact element.
 */
window.toggleMoreContacts = function (element) {
  const assignedList = element.closest('.assigned-list');
  const hiddenContacts = assignedList.querySelector('.hidden-contacts');
  const showMoreButton = assignedList.querySelector('.show-more-contacts');

  if (hiddenContacts.style.display === 'none' || hiddenContacts.style.display === '') {
    hiddenContacts.style.display = 'flex';
    hiddenContacts.style.gap = '8px';
    showMoreButton.style.display = 'none';
  } else {
    hiddenContacts.style.display = 'none';
    showMoreButton.style.display = 'block';
  }
};

/** * Creates the HTML section for task assignment.
 * @param {object} task - The task object.
 * @param {object} allContactsObject - An object containing all contact objects by ID.
 * @returns {string} The HTML string for the task assignment section.
 */
export function getTaskAssignmentSection(task, allContactsObject) {
  const contactsHtml = getAssignedContactsHtml(task.assignedUsers, allContactsObject);
  return `<div class="taskCardField assigned-section">
            <p class="assigned-title">Assigned To: </p>
            <div class="entryList assigned-list">${contactsHtml}</div>
          </div>`;
}
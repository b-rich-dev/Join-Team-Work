/** * Shows a feedback message for board actions
 * @param {string} messageType - Type of message ('moved', 'deleted', 'updated')
 */
export function showBoardFeedback(messageType) {
  const messageIds = {
    moved: 'taskMovedMsg',
    deleted: 'taskDeletedMsg',
    updated: 'taskUpdatedMsg'
  };

  const messageId = messageIds[messageType];
  if (!messageId) return;

  const message = document.getElementById(messageId);
  if (!message) return;

  // Reset classes
  message.classList.remove('hidden', 'slide-in', 'slide-out');
  
  // Force reflow
  void message.offsetWidth;
  
  // Slide in
  requestAnimationFrame(() => {
    message.classList.add('slide-in');
  });

  // Slide out after 2 seconds
  setTimeout(() => {
    message.classList.remove('slide-in');
    message.classList.add('slide-out');
    
    // Hide completely after transition
    setTimeout(() => {
      message.classList.add('hidden');
    }, 400);
  }, 2000);
}

/** * Shows "Task successfully moved" message
 */
export function showTaskMovedMessage() {
  showBoardFeedback('moved');
}

/** * Shows "Task successfully deleted" message
 */
export function showTaskDeletedMessage() {
  showBoardFeedback('deleted');
}

/** * Shows "Task successfully updated" message
 */
export function showTaskUpdatedMessage() {
  showBoardFeedback('updated');
}

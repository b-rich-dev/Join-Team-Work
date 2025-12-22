/** Creates toolbar configuration.
 * @param {Array} contacts - Contacts array.
 * @returns {Object} Toolbar config.
 */
export function createToolbarConfig(contacts) {
  const hasMultiple = contacts.length > 1;
  
  return {
    zoomIn: 1,
    zoomOut: 1,
    oneToOne: 1,
    reset: 1,
    prev: hasMultiple ? 1 : 0,
    play: hasMultiple ? { show: 1, size: 'large' } : 0,
    next: hasMultiple ? 1 : 0,
    rotateLeft: 1,
    rotateRight: 1,
    flipHorizontal: 1,
    flipVertical: 1,
    delete: { show: 1, size: 'large' }
  };
}

/** Creates viewer configuration.
 * @param {Array} contacts - Contacts array.
 * @param {Array} avatarMetadata - Metadata array.
 * @param {HTMLElement} viewerContainer - Viewer container.
 * @param {number} startIndex - Start index.
 * @param {Function} getAvatarBase64 - Avatar base64 getter.
 * @param {Function} titleCallback - Title callback function.
 * @param {Function} deleteHandler - Delete button handler.
 * @returns {Object} Viewer configuration.
 */
export function createViewerConfiguration(contacts, avatarMetadata, viewerContainer, startIndex, getAvatarBase64, titleCallback, deleteHandler) {
  return {
    inline: false,
    button: true,
    navbar: contacts.length > 1,
    title: [1, titleCallback],
    toolbar: createToolbarConfig(contacts),
    tooltip: true,
    movable: true,
    zoomable: true,
    rotatable: true,
    transition: true,
    fullscreen: true,
    keyboard: true,
    initialViewIndex: startIndex,
    shown: () => deleteHandler(viewerContainer, contacts),
    hide: () => handleViewerHide(viewerContainer)
  };
}

/** Handles viewer hide event.
 * @param {HTMLElement} viewerContainer - Viewer container.
 */
function handleViewerHide(viewerContainer) {
  const viewerElement = document.querySelector('.viewer-container');
  if (viewerElement) {
    const focusedElement = viewerElement.querySelector(':focus');
    if (focusedElement) focusedElement.blur();
  }
  
  if (document.activeElement && viewerContainer.contains(document.activeElement)) {
    document.activeElement.blur();
    document.body.focus();
  }
}

/** Destroys existing viewer.
 */
export function destroyExistingViewer() {
  if (window.assignedContactsViewer) {
    try {
      window.assignedContactsViewer.destroy();
    } catch (error) {
      console.warn('Error destroying viewer:', error);
    }
    window.assignedContactsViewer = null;
  }
}

/** Initializes and shows viewer.
 * @param {HTMLElement} container - Viewer container.
 * @param {Object} config - Viewer configuration.
 */
export function initializeAndShowViewer(container, config) {
  try {
    window.assignedContactsViewer = new Viewer(container, config);
    window.assignedContactsViewer.show();
    setupViewerCleanup(container);
  } catch (error) {
    console.error('Error initializing viewer:', error);
    container.remove();
  }
}

/** Sets up viewer cleanup.
 * @param {HTMLElement} viewerContainer - Viewer container.
 */
function setupViewerCleanup(viewerContainer) {
  viewerContainer.addEventListener('hidden', function () {
    setTimeout(() => cleanupViewer(viewerContainer), 100);
  });
}

/** Cleans up viewer resources.
 * @param {HTMLElement} viewerContainer - Viewer container.
 */
function cleanupViewer(viewerContainer) {
  if (window.assignedContactsViewer) {
    try { 
      window.assignedContactsViewer.destroy(); 
    } catch (e) { }
    window.assignedContactsViewer = null;
  }
  if (viewerContainer?.parentNode) {
    viewerContainer.remove();
  }
}
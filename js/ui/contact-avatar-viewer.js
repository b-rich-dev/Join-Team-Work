/**
 * Simple global function to show contact avatar in viewer.
 */

let contactAvatarViewer = null;

/**
 * Deletes the avatar of a contact
 * @param {string} contactId - The ID of the contact
 * @param {string} contactName - The name of the contact
 */
async function deleteContactAvatar(contactId, contactName) {
  // Import necessary functions
  const { showDeleteAvatarWarning, showAvatarDeleteSuccess, showAvatarDeleteError } = 
    await import('./delete-avatar-warning.js');
  const { getContactById, activeContactId } = await import('../data/contacts-state.js');
  const { updateContact } = await import('../events/contact-actions.js');
  const { renderContacts } = await import('./render-contacts.js');
  
  // Get contact data
  const contact = getContactById(contactId);
  
  if (!contact) {
    showAvatarDeleteError('Kontakt nicht gefunden.');
    return;
  }
  
  // Show confirmation dialog
  showDeleteAvatarWarning(async () => {
    try {
      // Remove avatarImage property completely
      const updatedContact = { ...contact };
      delete updatedContact.avatarImage;
      
      // Update in Firebase (this will save without avatarImage field)
      await updateContact(updatedContact);
      
      // Re-render contacts page to show changes
      await renderContacts();
      
      // If this contact is currently shown in details, refresh the detail view
      if (activeContactId === contactId) {
        const contactDetailsCard = document.querySelector('.contact-details-card');
        const updatedContactData = getContactById(contactId);
        if (contactDetailsCard && updatedContactData) {
          // Re-import the template function
          const { createContactDetailsHTML } = await import('../templates/contacts-templates.js');
          contactDetailsCard.innerHTML = createContactDetailsHTML(updatedContactData);
        }
      }
      
      // Show success message
      showAvatarDeleteSuccess('Profilbild erfolgreich gelöscht.');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      showAvatarDeleteError('Fehler beim Löschen des Profilbildes.');
    }
  });
}

/**
 * Shows a contact avatar in the viewer.
 * This function is globally accessible via window.showContactAvatarViewer
 * @param {string} imageUrl - The URL of the avatar image
 * @param {string} contactName - The name of the contact
 * @param {string} contactId - The ID of the contact (optional, needed for delete)
 */
window.showContactAvatarViewer = function(imageUrl, contactName, contactId = null) {
  // Check if Viewer library is loaded
  if (typeof Viewer !== 'function') {
    console.error('Viewer library not loaded!');
    alert('Image viewer is not available.');
    return;
  }

  // Destroy existing viewer if present
  if (contactAvatarViewer) {
    try {
      contactAvatarViewer.destroy();
    } catch (error) {
      console.warn('Error destroying existing viewer:', error);
    }
    contactAvatarViewer = null;
  }

  // Create temporary container
  let viewerContainer = document.getElementById('temp-avatar-viewer');
  if (viewerContainer) {
    viewerContainer.remove();
  }
  
  viewerContainer = document.createElement('div');
  viewerContainer.id = 'temp-avatar-viewer';
  viewerContainer.style.display = 'none';
  viewerContainer.innerHTML = `<img src="${imageUrl}" alt="${contactName}">`;
  document.body.appendChild(viewerContainer);

  try {
    // Initialize viewer
    contactAvatarViewer = new Viewer(viewerContainer, {
      inline: false,
      button: true,
      navbar: false,
      title: [1, (image, imageData) => `${contactName} - Avatar`],
      toolbar: {
        download: {
          show: 1,
          size: 'large'
        },
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        rotateLeft: 1,
        rotateRight: 1,
        delete: contactId ? {
          show: 1,
          size: 'large'
        } : 0
      },
      tooltip: true,
      movable: true,
      zoomable: true,
      rotatable: true,
      transition: true,
      fullscreen: true,
      keyboard: true,
      download: function(url, imageName) {
        // Custom download function
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${contactName}_avatar.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      delete: contactId ? function() {
        // Close viewer first, then show delete confirmation
        if (contactAvatarViewer) {
          contactAvatarViewer.hide();
        }
        // Small delay to let viewer close animation finish
        setTimeout(() => {
          deleteContactAvatar(contactId, contactName);
        }, 300);
      } : undefined,
      movable: true,
      zoomable: true,
      rotatable: true,
      transition: true,
      fullscreen: true,
      keyboard: true,
      hide: function(event) {
        // Remove focus from close button to fix aria-hidden accessibility warning
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
        setTimeout(() => {
          if (viewerContainer && viewerContainer.parentNode) {
            viewerContainer.remove();
          }
        }, 300);
      },
      hidden: function() {
        // Additional cleanup after viewer is fully hidden
        if (document.activeElement && document.activeElement.classList && 
            document.activeElement.classList.contains('viewer-button')) {
          document.activeElement.blur();
        }
      }
    });
    
    // Show immediately
    contactAvatarViewer.show();
  } catch (error) {
    console.error('Error showing viewer:', error);
    alert('Error showing image: ' + error.message);
  }
};

/**
 * Cleanup function to destroy the viewer instance.
 * Should be called when navigating away from the contacts page.
 */
export function destroyContactAvatarViewer() {
  if (contactAvatarViewer) {
    try {
      contactAvatarViewer.destroy();
    } catch (error) {
      console.warn('Error destroying avatar viewer:', error);
    }
    contactAvatarViewer = null;
  }
}

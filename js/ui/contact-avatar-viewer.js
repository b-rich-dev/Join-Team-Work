/**
 * Simple global function to show contact avatar in viewer.
 */

let contactAvatarViewer = null;

/**
 * Removes a contact from the task assignment (for edit mode).
 * @param {string} contactId - The ID of the contact to remove
 * @param {string} contactName - The name of the contact
 */
async function removeContactFromTaskAssignment(contactId, contactName) {
  try {
    // Import necessary modules
    const dropdownModule = await import('../events/dropdown-menu.js');
    
    // Remove contact from selectedContacts
    const removed = dropdownModule.removeSelectedContact(contactId, contactName);
    
    if (!removed) {
      console.warn(`Contact ${contactName} not found in selectedContacts`);
      return;
    }
    
    // Update currentTaskContactsWithAvatars
    if (window.currentTaskContactsWithAvatars) {
      const avatarIndex = window.currentTaskContactsWithAvatars.findIndex(c => 
        c.id === contactId || c.name === contactName
      );
      if (avatarIndex !== -1) {
        window.currentTaskContactsWithAvatars.splice(avatarIndex, 1);
      }
    }
    
    // Refresh UI - force re-render of assigned contacts
    const assignedToArea = document.getElementById("assigned-to-area");
    const assignedToAreaFull = document.getElementById("assigned-to-area-full");
    
    if (assignedToArea || assignedToAreaFull) {
      // Manually trigger displaySelectedContacts
      const { selectedContacts } = dropdownModule;
      
      if (assignedToArea) {
        assignedToArea.innerHTML = '';
        const mainContainer = document.createElement('div');
        mainContainer.className = 'assigned-main-container';
        
        selectedContacts.slice(0, 3).forEach(contact => {
          const initialsDiv = document.createElement('div');
          initialsDiv.className = 'assigned-initials-circle';
          
          if (contact.avatarImage) {
            initialsDiv.style.backgroundImage = `url(${contact.avatarImage})`;
            initialsDiv.style.backgroundSize = 'cover';
            initialsDiv.style.backgroundPosition = 'center';
            initialsDiv.textContent = '';
            
            initialsDiv.style.cursor = 'pointer';
            initialsDiv.onclick = function(event) {
              event.stopPropagation();
              event.preventDefault();
              if (typeof window.showTaskContactAvatarGallery === 'function') {
                window.showTaskContactAvatarGallery(contact.id || contact.name, true);
              }
              return false;
            };
          } else {
            initialsDiv.style.backgroundColor = `var(${contact.avatarColor})`;
            initialsDiv.textContent = contact.initials;
          }
          
          initialsDiv.style.flex = '0 0 auto';
          mainContainer.appendChild(initialsDiv);
        });
        
        // Add extra count if needed
        const extraCount = selectedContacts.length - 3;
        if (extraCount > 0) {
          const extraDiv = document.createElement('div');
          extraDiv.className = 'assigned-initials-circle';
          extraDiv.style.backgroundColor = 'var(--sidebarGrey)';
          extraDiv.textContent = `… +${extraCount}`;
          extraDiv.style.fontSize = '0.8rem';
          extraDiv.style.flex = '0 0 auto';
          mainContainer.appendChild(extraDiv);
        }
        
        assignedToArea.appendChild(mainContainer);
      }
      
      if (assignedToAreaFull) {
        assignedToAreaFull.innerHTML = '';
        const mainContainer = document.createElement('div');
        mainContainer.className = 'assigned-main-container';
        
        selectedContacts.forEach(contact => {
          const initialsDiv = document.createElement('div');
          initialsDiv.className = 'assigned-initials-circle';
          
          if (contact.avatarImage) {
            initialsDiv.style.backgroundImage = `url(${contact.avatarImage})`;
            initialsDiv.style.backgroundSize = 'cover';
            initialsDiv.style.backgroundPosition = 'center';
            initialsDiv.textContent = '';
            
            initialsDiv.style.cursor = 'pointer';
            initialsDiv.onclick = function(event) {
              event.stopPropagation();
              event.preventDefault();
              if (typeof window.showTaskContactAvatarGallery === 'function') {
                window.showTaskContactAvatarGallery(contact.id || contact.name, true);
              }
              return false;
            };
          } else {
            initialsDiv.style.backgroundColor = `var(${contact.avatarColor})`;
            initialsDiv.textContent = contact.initials;
          }
          
          initialsDiv.style.flex = '0 0 auto';
          mainContainer.appendChild(initialsDiv);
        });
        
        assignedToAreaFull.appendChild(mainContainer);
      }
    }
  } catch (error) {
    console.error('Error removing contact from assignment:', error);
  }
}

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
 * @param {string|object} imageUrl - The URL of the avatar image or avatar object with metadata
 * @param {string} contactName - The name of the contact
 * @param {string} contactId - The ID of the contact (optional, needed for delete)
 */
window.showContactAvatarViewer = async function(imageUrl, contactName, contactId = null) {
  // Check if Viewer library is loaded
  if (typeof Viewer !== 'function') {
    console.error('Viewer library not loaded!');
    alert('Image viewer is not available.');
    return;
  }

  // Extract base64 and metadata
  let base64Url = imageUrl;
  let metadata = null;
  
  if (typeof imageUrl === 'object' && imageUrl.base64) {
    // It's an avatar object with metadata
    base64Url = imageUrl.base64;
    metadata = {
      name: imageUrl.name || `${contactName}.jpg`,
      type: imageUrl.type || 'image/jpeg',
      size: imageUrl.size || 0
    };
  } else if (typeof imageUrl === 'string') {
    // It's a base64 string, extract metadata
    const mimeMatch = imageUrl.match(/^data:([^;]+);/);
    const type = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = type.split('/')[1] || 'jpg';
    const base64Data = imageUrl.split(',')[1] || '';
    const size = Math.floor((base64Data.length * 3) / 4);
    
    metadata = {
      name: `${contactName}.${ext}`,
      type: type,
      size: size
    };
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
  viewerContainer.innerHTML = `<img src="${base64Url}" alt="${contactName}">`;
  document.body.appendChild(viewerContainer);

  try {
    // Initialize viewer
    contactAvatarViewer = new Viewer(viewerContainer, {
      inline: false,
      button: true,
      navbar: false,
      title: [1, (image, imageData) => {
        if (metadata) {
          const fileType = metadata.type.split('/')[1]?.toUpperCase() || 'IMAGE';
          const sizeKB = (metadata.size / 1024).toFixed(2);
          return `${contactName}   •   ${fileType}   •   ${sizeKB} KB`;
        }
        return `${contactName} - Avatar`;
      }],
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
        link.href = base64Url;
        link.download = metadata ? metadata.name : `${contactName}_avatar.png`;
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
 * Shows a gallery of all task contact avatars with navigation.
 * @param {string} selectedContactId - The ID of the contact whose avatar was clicked.
 * @param {boolean} isEditMode - Whether the gallery is shown in edit mode (enables delete button).
 */
window.showTaskContactAvatarGallery = async function(selectedContactId, isEditMode = false) {
  const contacts = window.currentTaskContactsWithAvatars || [];
  
  if (contacts.length === 0) return;
  
  // Check if Viewer library is loaded
  if (typeof Viewer !== 'function') {
    console.error('Viewer library not loaded!');
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

  // Create temporary container with all contact avatars
  let viewerContainer = document.getElementById('temp-avatar-gallery');
  if (viewerContainer) {
    viewerContainer.remove();
  }
  
  viewerContainer = document.createElement('div');
  viewerContainer.id = 'temp-avatar-gallery';
  viewerContainer.style.display = 'none';
  
  // Import avatar utils
  const { getAvatarBase64, normalizeAvatar } = await import('../utils/avatar-utils.js');
  
  // Normalize avatar metadata
  const avatarMetadata = contacts.map(contact => {
    if (contact.avatarImage) {
      // Check if it's already an object with metadata
      if (typeof contact.avatarImage === 'object' && contact.avatarImage.name) {
        return {
          name: contact.avatarImage.name,
          type: contact.avatarImage.type || 'image/jpeg',
          size: contact.avatarImage.size || 0
        };
      }
      // If it's a string (base64), extract actual metadata from the string
      if (typeof contact.avatarImage === 'string') {
        // Extract mime type from base64 header
        const mimeMatch = contact.avatarImage.match(/^data:([^;]+);/);
        const type = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const ext = type.split('/')[1] || 'jpg';
        
        // Calculate actual size of base64 data
        const base64Data = contact.avatarImage.split(',')[1] || '';
        const size = Math.floor((base64Data.length * 3) / 4);
        
        return {
          name: `${contact.name}.${ext}`,
          type: type,
          size: size
        };
      }
    }
    return { name: contact.name, type: 'image/jpeg', size: 0 };
  });
  
  // Add all contact images (or placeholder for contacts without images)
  contacts.forEach((contact, index) => {
    const img = document.createElement('img');
    
    if (contact.avatarImage) {
      const base64 = getAvatarBase64(contact.avatarImage);
      img.src = base64 || '';
    } else {
      // Create a canvas with initials for contacts without image
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // Draw background color
      const color = contact.avatarColor ? getComputedStyle(document.documentElement).getPropertyValue(contact.avatarColor).trim() : '#2A3647';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 200, 200);
      
      // Draw initials
      ctx.fillStyle = 'white';
      ctx.font = 'bold 80px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(contact.initials || '', 100, 100);
      
      img.src = canvas.toDataURL();
    }
    
    img.alt = contact.name;
    img.dataset.contactId = contact.id;
    img.dataset.contactIndex = index;
    viewerContainer.appendChild(img);
  });
  
  document.body.appendChild(viewerContainer);

  try {
    // Initialize viewer with navigation enabled
    contactAvatarViewer = new Viewer(viewerContainer, {
      inline: false,
      button: true,
      navbar: true, // Enable navigation bar
      title: [1, (image, imageData) => {
        // Find actual index by comparing image.src with contact avatarImage
        let actualIndex = -1;
        if (image && image.src) {
          actualIndex = contacts.findIndex(contact => {
            if (!contact.avatarImage) return false;
            const base64 = getAvatarBase64(contact.avatarImage);
            return base64 === image.src;
          });
        }
        
        // If no match found (actualIndex === -1), it's a canvas-generated image (no real avatar)
        // In this case, we need to find which contact has no avatarImage
        if (actualIndex === -1) {
          // This is a canvas image for a contact without avatar - just show name
          const noAvatarContacts = contacts.filter(c => !c.avatarImage);
          if (noAvatarContacts.length > 0) {
            // Try to find which one by checking dataset or just use first
            return noAvatarContacts[0].name;
          }
          return 'Contact';
        }
        
        const contact = contacts[actualIndex];
        const metadata = avatarMetadata[actualIndex];
        
        if (!contact) return 'Contact';
        
        // If contact has avatarImage, show full metadata
        if (contact.avatarImage && metadata) {
          const fileType = metadata.type ? metadata.type.split('/')[1]?.toUpperCase() || 'IMAGE' : 'IMAGE';
          const sizeKB = metadata.size > 0 ? (metadata.size / 1024).toFixed(2) : '0.00';
          return `${contact.name}   •   ${fileType}   •   ${sizeKB} KB`;
        }
        
        // No avatar - just show name
        return contact.name;
      }],
      toolbar: {
        download: {
          show: 1,
          size: 'large'
        },
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: contacts.length > 1 ? 1 : 0,
        play: contacts.length > 1 ? { show: 1, size: 'large' } : 0,
        next: contacts.length > 1 ? 1 : 0,
        rotateLeft: 1,
        rotateRight: 1,
        delete: isEditMode ? {
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
        const activeImage = viewerContainer.querySelector('img[src="' + url + '"]');
        const contactId = activeImage ? activeImage.dataset.contactId : '';
        const contact = contacts.find(c => c.id === contactId);
        const fileName = contact ? `${contact.name}_avatar.png` : 'avatar.png';
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      delete: isEditMode ? async function() {
        // Get current image index from viewer
        const currentIndex = contactAvatarViewer.index;
        
        // Get contact from the contacts array using the index
        const contact = contacts[currentIndex];
        
        if (!contact) {
          console.error('Contact not found!');
          return;
        }
        
        const contactId = contact.id;
        const contactName = contact.name;
        
        // Close viewer first
        if (contactAvatarViewer) {
          contactAvatarViewer.hide();
        }
        
        // Remove contact from assignment
        await removeContactFromTaskAssignment(contactId, contactName);
      } : undefined,
      hide: function(event) {
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
        if (document.activeElement && document.activeElement.classList && 
            document.activeElement.classList.contains('viewer-button')) {
          document.activeElement.blur();
        }
      }
    });
    
    // Find the index of the selected contact and show that image
    const selectedIndex = contacts.findIndex(c => c.id === selectedContactId);
    contactAvatarViewer.show();
    if (selectedIndex > 0) {
      contactAvatarViewer.view(selectedIndex);
    }
  } catch (error) {
    console.error('Error showing gallery:', error);
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

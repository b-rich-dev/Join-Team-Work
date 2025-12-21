import { getCategoryOptions, renderAssignedToContacts } from "../templates/add-task-template.js";

export let currentContacts = [];
export let selectedCategory = null;
export let selectedContacts = [];
export const contactsMap = new Map();

/**
 * Removes a contact from selectedContacts by ID or name.
 * @param {string} contactId - The ID of the contact to remove.
 * @param {string} contactName - The name of the contact to remove.
 * @returns {boolean} True if contact was removed, false otherwise.
 */
export function removeSelectedContact(contactId, contactName) {
  const index = selectedContacts.findIndex(c => 
    c.id === contactId || c.name === contactName
  );
  
  if (index !== -1) {
    selectedContacts.splice(index, 1);
    return true;
  }
  return false;
}

/** * Toggles the dropdown icon for category or assigned contacts.
 * @param {string} id - The ID of the dropdown to toggle.
 */
export function toggleDropdownIcon(id) {
  const dropdownIconOne = document.getElementById("dropdown-icon-one");
  const dropdownIconContainerOne = document.getElementById("dropdown-icon-container-one");
  const dropdownIconTwo = document.getElementById("dropdown-icon-two");
  const dropdownIconContainerTwo = document.getElementById("dropdown-icon-container-two");

  if (id === "category" && dropdownIconTwo && dropdownIconContainerTwo) {
    dropdownIconTwo.classList.toggle("open");
    dropdownIconContainerTwo.classList.toggle("active");
  } else if (id === "assignedTo" && dropdownIconOne && dropdownIconContainerOne) {
    dropdownIconOne.classList.toggle("open");
    dropdownIconContainerOne.classList.toggle("active");
  }
}

/** * Toggles the category dropdown.
 * Opens or closes the dropdown and populates it with options.
 */
export function toggleCategoryDropdown() {
  const wrapper = document.getElementById("category-options-wrapper");
  const container = document.getElementById("category-options-container");
  const input = document.getElementById("dropdown-category"); 
  if (!wrapper || !container) return;

  const isOpen = wrapper.classList.contains("open");

  clearCategory();
  toggleDropdownIcon("category");

  if (!isOpen) {
    input.classList.add("border-light-blue");
    container.innerHTML = getCategoryOptions();
    requestAnimationFrame(() => { wrapper.classList.add("open"); });
  } else {
    setBorderColorGrey("dropdown-category");
    wrapper.classList.remove("open");
    setTimeout(() => { container.innerHTML = ""; }, 300);
  }
}

/** * Sets the selected category in the dropdown.
 * Updates the selected category text and hidden input value.
 */
export function setCategory(optionElement) {
  const wrapper = document.getElementById("category-options-wrapper");
  const selected = document.getElementById("selected-category");
  const optionsContainer = document.getElementById("category-options-container");
  const hiddenInput = document.getElementById("hidden-category-input");

  if (!selected || !hiddenInput || !wrapper || !optionsContainer) return;

  updateSelectedCategory(selected, hiddenInput, optionElement);
  resetCategoryError();
  closeCategoryDropdownAtSet(wrapper, optionsContainer);
  toggleDropdownIcon("category");
  setBorderColorGrey("dropdown-category");

  selectedCategory = optionElement.dataset.category;
}

/** * Sets the border color of the input to grey.
 * @param {string} id - The ID of the input element.
 */
export function setBorderColorGrey(id) {
  const input = document.getElementById(id);
  if (input) {
    input.classList.remove("border-light-blue");
  }
}

/** * Updates the selected category text and hidden input value.
 * @param {HTMLElement} selected - The element displaying the selected category.
 * @param {HTMLElement} hiddenInput - The hidden input element for the selected category.
 * @param {HTMLElement} optionElement - The option element that was selected.
 */
function updateSelectedCategory(selected, hiddenInput, optionElement) {
  selected.textContent = optionElement.textContent;
  hiddenInput.value = optionElement.textContent;
}

/** * Resets the category error state.
 * Removes invalid class from the dropdown and hides the error message.
 */
function resetCategoryError() {
  const dropdownCategory = document.getElementById("dropdown-category");
  const categoryError = document.getElementById("category-error");
  if (dropdownCategory) {
    dropdownCategory.classList.remove("invalid");
    categoryError?.classList.remove("d-flex");
  }
}

/** * Closes the category dropdown and clears options.
 * @param {HTMLElement} wrapper - The dropdown wrapper element.
 * @param {HTMLElement} optionsContainer - The container for the dropdown options.
 */
function closeCategoryDropdownAtSet(wrapper, optionsContainer) {
  wrapper.classList.remove("open");
  optionsContainer.innerHTML = "";
}

/** * Creates a Demo selected category.
 * @param {string} categoryName - The name of the category to select.
 */
export function demoSelectCategory(categoryName = "User Story") {
  const fakeOptionElement = document.createElement("div");
  fakeOptionElement.textContent = categoryName;
  fakeOptionElement.dataset.category = categoryName;

  setCategory(fakeOptionElement);
  toggleDropdownIcon("category")
}

/** * Clears the selected category.
 */
export function clearCategory() {
  selectedCategory = null;
  const selected = document.getElementById("selected-category");
  if (selected) {
    selected.textContent = "Select task category";
  }
}

/** * Toggles the assigned contacts dropdown.
 */
export function toggleAssignedToDropdown() {
  const wrapper = document.getElementById("assigned-to-options-wrapper");
  const container = document.getElementById("assigned-to-options-container");
  const input = document.getElementById("dropdown-assigned-to");
  if (!wrapper || !container) return;

  const isOpen = wrapper.classList.contains("open-assigned-to");

  toggleDropdownIcon("assignedTo");

  if (!isOpen) {
    input.classList.add("border-light-blue");
    getAssignedToOptions();
    requestAnimationFrame(() => { wrapper.classList.add("open-assigned-to"); });
  } else {
    setBorderColorGrey("dropdown-assigned-to");
    wrapper.classList.remove("open-assigned-to");
    setTimeout(() => { container.innerHTML = ""; }, 300);
  }
}

/** * Gets the assigned contacts options.
 * Populates the dropdown with contacts and sets up event listeners.
 */
export function getAssignedToOptions() {
  const currentUser = sessionStorage.getItem('currentUser');
  let contactContainer = document.getElementById('assigned-to-options-container');
  if (!contactContainer) return;

  const sortedContacts = sortContactsWithUserFirst(currentContacts, currentUser);

  renderContactsList(sortedContacts, contactContainer, currentUser);
  displaySelectedContacts();
}

/** * Sorts contacts with the current user first.
 * @param {Array} contacts - The list of contacts to sort.
 * @param {string} currentUser - The name of the current user.
 * @returns {Array} The sorted list of contacts.
 */
function sortContactsWithUserFirst(contacts, currentUser) {
  return [...contacts].sort((a, b) => {
    const isCurrentUserA = a.name === currentUser;
    const isCurrentUserB = b.name === currentUser;
    if (isCurrentUserA) return -1;
    if (isCurrentUserB) return 1;
    return 0;
  });
}

/** * Renders the contacts list in the dropdown.
 * @param {Array} contacts - The list of contacts to render.
 * @param {HTMLElement} contactContainer - The container to render contacts into.
 * @param {string} currentUser - The name of the current user.
 */
function renderContactsList(contacts, contactContainer, currentUser) {
  contactContainer.innerHTML = '';
  contacts.forEach((contact, i) => {
    const { name, initials, avatarColor, avatarImage } = contact;
    const displayName = name === currentUser ? `${name} (You)` : name;
    const contactId = contact && contact.id != null ? contact.id : i;
    
    // Store full contact object in map to preserve avatarImage object
    contactsMap.set(contactId, contact);
    
    contactContainer.innerHTML += renderAssignedToContacts(contactId, displayName, initials, avatarColor, avatarImage);
  });
}

/** * Selects a contact by name for demo purposes.
 * @param {string} nameToSelect - The name of the contact to select.
 */
export function demoSelectAssignedContact(nameToSelect = "Anna Schmidt") {
  const contactToSelect = currentContacts.find((contact) => contact.name === nameToSelect);

  if (!contactToSelect) {
    console.warn(`Kontakt ${nameToSelect} nicht gefunden.`);
    return;
  }

  selectedContacts.length = 0;
  selectedContacts.push(contactToSelect);

  getAssignedToOptions();
}

/** * Checks if a contact is selected.
 * @param {string} name - The name of the contact.
 * @param {string} initials - The initials of the contact.
 * @param {string} avatarColor - The avatar color of the contact.
 * @return {boolean} True if the contact is selected, otherwise false.
 */
export function isContactSelected(name, initials, avatarColor) {
  return selectedContacts.some(
    (selected) => selected.name === name && selected.initials === initials && selected.avatarColor === avatarColor
  );
}

/** * Toggles the selection of a contact in the dropdown.
 * @param {HTMLElement} contactElement - The contact element to toggle.
 * @param {string} name - The name of the contact.
 * @param {string} initials - The initials of the contact.
 * @param {string} avatarColor - The avatar color of the contact.
 * @param {string} avatarImage - The avatar image URL of the contact.
 * @param {string} id - The ID of the contact.
 */
export function toggleSelectContacts(contactElement, name, initials, avatarColor, avatarImage, id) {
  const contact = { name, initials, avatarColor, avatarImage, id };
  const index = getContactIndex(selectedContacts, contact);

  if (index === -1) {
    addContactToSelection(contactElement, contact, selectedContacts);
  } else {
    removeContactFromSelection(contactElement, index, selectedContacts);
  }

  displaySelectedContacts();
}

/** * Gets the index of a contact in the selected contacts array.
 * @param {Array} selectedContacts - The array of selected contacts.
 * @param {Object} contact - The contact to find.
 * @returns {number} The index of the contact, or -1 if not found.
 */
function getContactIndex(selectedContacts, contact) {
  return selectedContacts.findIndex(
    (selected) => selected.name === contact.name && selected.initials === contact.initials && selected.avatarColor === contact.avatarColor
  );
}

/** * Adds a contact to the selection.
 * @param {HTMLElement} contactElement - The contact element to update.
 * @param {Object} contact - The contact to add.
 * @param {Array} selectedContacts - The array of selected contacts.
 */
function addContactToSelection(contactElement, contact, selectedContacts) {
  selectedContacts.unshift(contact);
  contactElement.classList.add("assigned");
  const checkboxIcon = contactElement.querySelector(".checkbox-icon");
  checkboxIcon.src = "../assets/icons/btn/checkbox-filled-white.svg";
  checkboxIcon.classList.add("checked");
}

/** * Removes a contact from the selection.
 * @param {HTMLElement} contactElement - The contact element to update.
 * @param {number} index - The index of the contact to remove.
 * @param {Array} selectedContacts - The array of selected contacts.
 */
function removeContactFromSelection(contactElement, index, selectedContacts) {
  selectedContacts.splice(index, 1);
  contactElement.classList.remove("assigned");
  const checkboxIcon = contactElement.querySelector(".checkbox-icon");
  checkboxIcon.src = "../assets/icons/btn/checkbox-empty-black.svg";
  checkboxIcon.classList.remove("checked");
}

/** * Filters contacts based on a search query.
 * @param {string} query - The search query.
 */
export function filterContacts(query) {
  const container = document.getElementById("assigned-to-options-container");
  container.innerHTML = "";

  const filtered = currentContacts.filter((contact) => contact.name.toLowerCase().includes(query));

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results">No contacts found.</div>';
    return;
  }

  renderFilteredContacts(container, filtered);
}

/** * Renders the filtered contacts in the dropdown.
 * @param {HTMLElement} container - The container to render the contacts into.
 * @param {Array} filteredContacts - The array of filtered contacts.
 */
function renderFilteredContacts(container, filteredContacts) {
  filteredContacts.forEach((contact, i) => {
    container.innerHTML += renderAssignedToContacts(i, contact.name, contact.initials, contact.avatarColor, contact.avatarImage);
  });
}

/** * Displays the selected contacts in the assigned to area.
 * Creates circles for each selected contact and appends them to the assigned area.
 */
function displaySelectedContacts() {
  const assignedToArea = document.getElementById("assigned-to-area");
  const assignedToAreaFull = document.getElementById("assigned-to-area-full");
  const assignedToWrapper = document.getElementById("assigned-to-options-wrapper");
  if (!assignedToArea) return;

  // Store ALL selected contacts for gallery (with and without avatars)
  window.currentTaskContactsWithAvatars = selectedContacts.map(c => ({
    id: c.id || c.name,
    name: c.name,
    initials: c.initials,
    avatarColor: c.avatarColor,
    avatarImage: c.avatarImage || null
  }));

  clearAndRender(assignedToArea, selectedContacts.slice(0, 3), true);
  if (assignedToAreaFull) {
    clearAndRender(assignedToAreaFull, selectedContacts, false);
  }

  if (assignedToWrapper) {
    if (selectedContacts.length > 0) {
      assignedToWrapper.classList.add("has-selected-contacts");
    } else {
      assignedToWrapper.classList.remove("has-selected-contacts");
    }
  }
}

/** * Clears and renders the contact circles in the assigned to area.
 * @param {HTMLElement} container - The container to render the contacts into.
 * @param {Array} contacts - The array of contacts to render.
 * @param {boolean} withExtra - Whether to show the extra count circle.
 */
function clearAndRender(container, contacts, withExtra) {
  container.innerHTML = '';
  const mainContainer = document.createElement('div');
  mainContainer.className = 'assigned-main-container';

  contacts.forEach(contact => renderContactCircle(contact, mainContainer));

  if (withExtra) {
    const extraCount = selectedContacts.length - contacts.length;
    if (extraCount > 0) renderExtraCircle(extraCount, mainContainer);
  }

  container.appendChild(mainContainer);
}

/** * Renders a contact circle in the assigned to area.
 * @param {Object} contact - The contact object to render.
 * @param {HTMLElement} container - The container to render the contact into.
 */
function renderContactCircle(contact, container) {
  const initialsDiv = document.createElement('div');
  initialsDiv.className = 'assigned-initials-circle';
  initialsDiv.style.cursor = 'pointer';
  
  if (contact.avatarImage) {
    // Extract base64 from object or use string directly
    const base64 = typeof contact.avatarImage === 'string' 
      ? contact.avatarImage 
      : (contact.avatarImage?.base64 || contact.avatarImage);
    
    initialsDiv.style.backgroundImage = `url(${base64})`;
    initialsDiv.style.backgroundSize = 'cover';
    initialsDiv.style.backgroundPosition = 'center';
    initialsDiv.textContent = '';
  } else {
    initialsDiv.style.backgroundColor = `var(${contact.avatarColor})`;
    initialsDiv.textContent = contact.initials;
  }
  
  // Make all contact circles clickable
  initialsDiv.onclick = function(event) {
    event.stopPropagation();
    event.preventDefault();
    openAssignedContactsGallery(contact.id || contact.name);
    return false;
  };
  
  initialsDiv.style.flex = '0 0 auto';
  container.appendChild(initialsDiv);
}

/**
 * Opens a gallery viewer for all selected contacts in assigned-to-area.
 * Navigates to the clicked contact initially.
 * @param {string} selectedContactId - The ID of the contact that was clicked
 */
async function openAssignedContactsGallery(selectedContactId) {
  const assignedContacts = window.currentTaskContactsWithAvatars || [];
  
  if (assignedContacts.length === 0) return;
  
  // Check if Viewer library is loaded
  if (typeof Viewer !== 'function') {
    console.warn('Viewer library not loaded - falling back to simple view');
    const contact = assignedContacts.find(c => c.id === selectedContactId);
    if (contact && contact.avatarImage) {
      const { getAvatarBase64 } = await import('../utils/avatar-utils.js');
      const base64 = getAvatarBase64(contact.avatarImage);
      window.open(base64, '_blank');
    }
    return;
  }
  
  // Import avatar utils
  const { getAvatarBase64, normalizeAvatar } = await import('../utils/avatar-utils.js');
  
  // Get full contact objects with metadata from contactsMap or currentContacts
  const contacts = assignedContacts.map(c => {
    // Try to get full contact from contactsMap first
    const fullContact = contactsMap.get(c.id);
    if (fullContact) return fullContact;
    
    // Fallback to currentContacts
    const foundContact = currentContacts.find(contact => 
      contact.id === c.id || (contact.name === c.name && contact.initials === c.initials)
    );
    return foundContact || c;
  });
  
  // Normalize avatar metadata - ensure we get proper metadata for each contact
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
    // For canvas-generated images (contacts without avatarImage)
    return { name: `${contact.name}.png`, type: 'image/png', size: 0 };
  });

  // Destroy existing viewer if present
  if (window.assignedContactsViewer) {
    try {
      window.assignedContactsViewer.destroy();
    } catch (error) {
      console.warn('Error destroying existing viewer:', error);
    }
    window.assignedContactsViewer = null;
  }

  // Create temporary container with all contact avatars
  let viewerContainer = document.getElementById('temp-assigned-contacts-gallery');
  if (viewerContainer) {
    viewerContainer.remove();
  }
  
  viewerContainer = document.createElement('div');
  viewerContainer.id = 'temp-assigned-contacts-gallery';
  viewerContainer.style.display = 'none';
  
  // Add all contact images (or placeholder for contacts without images)
  let startIndex = 0;
  contacts.forEach((contact, index) => {
    const img = document.createElement('img');
    
    if (contact.avatarImage) {
      // Extract base64 from object or use string directly
      const base64 = getAvatarBase64(contact.avatarImage);
      img.src = base64;
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
    viewerContainer.appendChild(img);
    
    if (contact.id === selectedContactId) {
      startIndex = index;
    }
  });
  
  document.body.appendChild(viewerContainer);

  try {
    // Initialize viewer with navigation
    window.assignedContactsViewer = new Viewer(viewerContainer, {
      inline: false,
      button: true,
      navbar: contacts.length > 1,
      title: [1, (image, imageData) => {
        // imageData.index is always 0 when navigating, so we need to find the actual index
        // by matching the image src with our contacts
        let actualIndex = -1;
        
        if (image && image.src) {
          actualIndex = contacts.findIndex(contact => {
            if (!contact.avatarImage) return false;
            const base64 = getAvatarBase64(contact.avatarImage);
            return base64 === image.src;
          });
        }
        
        // If no match found (actualIndex === -1), it's a canvas-generated image (no real avatar)
        if (actualIndex === -1) {
          // Match canvas image with contact by comparing src to generated canvas
          const allImages = viewerContainer.querySelectorAll('img');
          if (image && image.src) {
            for (let i = 0; i < allImages.length; i++) {
              if (allImages[i].src === image.src) {
                actualIndex = i;
                break;
              }
            }
          }
          
          // If we found the image index, use that contact
          if (actualIndex >= 0 && actualIndex < contacts.length) {
            return contacts[actualIndex].name;
          }
          return 'Contact';
        }
        
        const contact = contacts[actualIndex];
        const metadata = avatarMetadata[actualIndex];
        
        if (!contact) return 'Contact';
        
        // If contact has avatarImage, show full metadata
        if (contact.avatarImage && metadata) {
          const fileType = metadata.type?.split('/')[1]?.toUpperCase() || 'Unknown';
          const sizeKB = (metadata.size / 1024).toFixed(2);
          return `${contact.name}   •   ${fileType}   •   ${sizeKB} KB`;
        }
        
        // No avatar - just show name
        return contact.name;
      }],
      toolbar: {
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: contacts.length > 1 ? 1 : 0,
        play: contacts.length > 1 ? { show: 1, size: 'large' } : 0,
        next: contacts.length > 1 ? 1 : 0,
        rotateLeft: 1,
        rotateRight: 1,
        flipHorizontal: 1,
        flipVertical: 1,
        delete: {
          show: 1,
          size: 'large'
        }
      },
      tooltip: true,
      movable: true,
      zoomable: true,
      rotatable: true,
      transition: true,
      fullscreen: true,
      keyboard: true,
      initialViewIndex: startIndex,
      shown: function() {
        // Attach delete handler after viewer is shown
        setupDeleteButtonHandler(viewerContainer, contacts);
      },
      hide: function() {
        // Move focus away from viewer elements before hiding to prevent aria-hidden warning
        if (document.activeElement && viewerContainer.contains(document.activeElement)) {
          document.body.focus();
          document.activeElement.blur();
        }
      }
    });

    // Show the viewer at the clicked contact
    window.assignedContactsViewer.show();
    
    // Clean up on hide
    viewerContainer.addEventListener('hidden', function() {
      setTimeout(() => {
        if (window.assignedContactsViewer) {
          try {
            window.assignedContactsViewer.destroy();
          } catch (e) {}
          window.assignedContactsViewer = null;
        }
        if (viewerContainer && viewerContainer.parentNode) {
          viewerContainer.remove();
        }
      }, 100);
    });

  } catch (error) {
    console.error('Error initializing viewer:', error);
    viewerContainer.remove();
  }
}

/**
 * Sets up the delete button handler in the viewer.
 * @param {HTMLElement} viewerContainer - The viewer container element
 * @param {Array} contacts - Array of all contacts in the viewer
 */
function setupDeleteButtonHandler(viewerContainer, contacts) {
  // Try multiple selectors and search patterns
  const selectors = [
    'li[data-viewer-action="delete"] button',
    'button[data-viewer-action="delete"]',
    '.viewer-toolbar li[data-viewer-action="delete"]',
    '[data-viewer-action="delete"]'
  ];
  
  let deleteButton = null;
  
  // Try each selector
  for (const selector of selectors) {
    deleteButton = document.querySelector(selector);
    if (deleteButton) break;
  }
  
  if (!deleteButton) return;
  
  // Clone button to remove old event listeners
  const newDeleteButton = deleteButton.cloneNode(true);
  deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
  
  // Add click handler
  newDeleteButton.addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Get currently viewed contact
    const currentIndex = window.assignedContactsViewer ? window.assignedContactsViewer.index : 0;
    const currentContact = contacts[currentIndex];
    
    if (!currentContact) return;
    
    // Find and remove from selectedContacts
    const index = selectedContacts.findIndex(c => 
      c.name === currentContact.name && c.initials === currentContact.initials
    );
    
    if (index !== -1) {
      selectedContacts.splice(index, 1);
      
      // Update the dropdown checkbox state
      const contactOption = document.querySelector(
        `.contact-option[data-name="${currentContact.name}"][data-initials="${currentContact.initials}"]`
      );
      if (contactOption) {
        contactOption.classList.remove("assigned");
        const checkboxIcon = contactOption.querySelector(".checkbox-icon");
        if (checkboxIcon) {
          checkboxIcon.src = "../assets/icons/btn/checkbox-empty-black.svg";
          checkboxIcon.classList.remove("checked");
        }
      }
      
      // Close viewer first
      if (window.assignedContactsViewer) {
        try {
          window.assignedContactsViewer.hide();
        } catch(e) {}
      }
      
      // Update display after a short delay
      setTimeout(() => {
        displaySelectedContacts();
      }, 100);
    }
  });
}

/** * Renders an extra count circle in the assigned to area.
 * @param {number} extraCount - The number of extra contacts.
 * @param {HTMLElement} container - The container to render the extra circle into.
 */
function renderExtraCircle(extraCount, container) {
  const extraDiv = document.createElement('div');
  extraDiv.className = 'assigned-initials-circle';
  extraDiv.style.backgroundColor = 'var(--sidebarGrey)';
  extraDiv.textContent = `… +${extraCount}`;
  extraDiv.style.fontSize = '0.8rem';
  extraDiv.style.flex = '0 0 auto';
  container.appendChild(extraDiv);
}

/** * Removes a contact from the selected contacts.
 * @param {number} index - The index of the contact to remove.
 */
export function removeContact(index) {
  selectedContacts.splice(index, 1);
  displaySelectedContacts();
}

/** * Clears the assigned contacts area.
 * Resets the selected contacts and clears the assigned area.
 */
export function clearAssignedTo() {
  const assignedToArea = document.getElementById("assigned-to-area");

  selectedContacts = [];

  if (assignedToArea) {
    assignedToArea.innerHTML = "";
  }
}

/** * Sets the sorted contacts for the dropdown.
 * @param {Array} contactsData - The array of contacts to sort and set.
 */
export function setSortedContacts(contactsData) {
  currentContacts = contactsData.sort((a, b) => {
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    return nameA.localeCompare(nameB, "de", { sensitivity: "base" });
  });
}

/** * Resets the dropdown state.
 * Clears the selected category and contacts.
 */
export function resetDropdownState() {
  selectedCategory = null;
  selectedContacts = [];
}
/** Main dropdown menu entry point - re-exports all dropdown functionality */

export { 
  currentContacts, 
  selectedCategory, 
  selectedContacts, 
  contactsMap,
  setSortedContacts,
  resetDropdownState,
  removeSelectedContact,
  setBorderColorGrey,
  toggleDropdownIcon,
  removeContact,
  clearAssignedTo,
  isContactSelected,
  filterContacts
} from "./dropdown-menu-core.js";

export { 
  toggleCategoryDropdown,
  setCategory,
  demoSelectCategory,
  clearCategory
} from "./dropdown-menu-category.js";

export { 
  toggleAssignedToDropdown,
  getAssignedToOptions,
  demoSelectAssignedContact,
  toggleSelectContacts,
  renderFilteredContacts,
  displaySelectedContacts
} from "./dropdown-menu-contacts.js";

export { 
  openAssignedContactsGallery 
} from "./dropdown-menu-viewer.js";
let contactAvatarViewer = null;

/** * Deletes the avatar of a contact
 * @param {string} contactId - The ID of the contact
 * @param {string} contactName - The name of the contact
 */
async function deleteContactAvatar(contactId, contactName) {
  const modules = await importDeleteModules();
  const contact = modules.getContactById(contactId);

  if (!contact) {
    modules.showAvatarDeleteError('Kontakt nicht gefunden.');
    return;
  }

  modules.showDeleteAvatarWarning(() => performAvatarDeletion(contactId, contact, modules));
}

/** * Imports necessary modules for avatar deletion.
 * @returns {object} - An object containing the imported modules
 */
async function importDeleteModules() {
  const [deleteWarning, contactsState, contactActions, renderModule] = await Promise.all([
    import('./delete-avatar-warning.js'),
    import('../data/contacts-state.js'),
    import('../events/contact-actions.js'),
    import('./render-contacts.js')
  ]);

  return {
    showDeleteAvatarWarning: deleteWarning.showDeleteAvatarWarning,
    showAvatarDeleteSuccess: deleteWarning.showAvatarDeleteSuccess,
    showAvatarDeleteError: deleteWarning.showAvatarDeleteError,
    getContactById: contactsState.getContactById,
    activeContactId: contactsState.activeContactId,
    updateContact: contactActions.updateContact,
    renderContacts: renderModule.renderContacts
  };
}

/** * Performs the avatar deletion and updates UI accordingly.
 * @param {string} contactId - The ID of the contact
 * @param {object} contact - The contact object
 * @param {object} modules - The imported modules containing state and utility functions
 */
async function performAvatarDeletion(contactId, contact, modules) {
  try {
    const updatedContact = { ...contact };
    delete updatedContact.avatarImage;

    await modules.updateContact(updatedContact);
    await modules.renderContacts();
    await refreshContactDetailsIfNeeded(contactId, modules);

    modules.showAvatarDeleteSuccess('Profilbild erfolgreich gelöscht.');
  } catch (error) {
    console.error('Error deleting avatar:', error);
    modules.showAvatarDeleteError('Fehler beim Löschen des Profilbildes.');
  }
}

/** * Refreshes contact details view if the deleted avatar belongs to the active contact.
 * @param {string} contactId - The ID of the contact whose avatar was deleted
 * @param {object} modules - The imported modules containing state and utility functions
 */
async function refreshContactDetailsIfNeeded(contactId, modules) {
  if (modules.activeContactId !== contactId) return;

  const contactDetailsCard = document.querySelector('.contact-details-card');
  const updatedContactData = modules.getContactById(contactId);

  if (contactDetailsCard && updatedContactData) {
    const { createContactDetailsHTML } = await import('../templates/contacts-templates.js');
    contactDetailsCard.innerHTML = createContactDetailsHTML(updatedContactData);
  }
}

/** * Shows a contact avatar in the viewer.
 * Delegates to contact-avatar-single-viewer.js to keep this file manageable.
 * @param {string|object} imageUrl - The URL of the avatar image or avatar object with metadata
 * @param {string} contactName - The name of the contact
 * @param {string} contactId - The ID of the contact (optional, needed for delete)
 */
window.showContactAvatarViewer = async function (imageUrl, contactName, contactId = null) {
  const { showContactAvatarViewer: showViewer } = await import('./contact-avatar-single-viewer.js');
  await showViewer(imageUrl, contactName, contactId);
};

/** * Shows a gallery of all task contact avatars with navigation.
 * Delegates to contact-avatar-gallery.js to keep this file manageable.
 * @param {string} selectedContactId - The ID of the contact whose avatar was clicked.
 * @param {boolean} isEditMode - Whether the gallery is shown in edit mode (enables delete button).
 */
window.showTaskContactAvatarGallery = async function (selectedContactId, isEditMode = false) {
  const { showTaskContactAvatarGallery: showGallery } = await import('./contact-avatar-gallery.js');
  await showGallery(selectedContactId, isEditMode);
};

/** * Cleanup function to destroy the viewer instance.
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
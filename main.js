import { getFirebaseData } from './js/data/API.js';

 export let firebaseData = null;

export async function loadFirebaseData() {
  if (!firebaseData) {
    firebaseData = await getFirebaseData();
    // Sync with window.firebaseData for legacy code
    if (typeof window !== 'undefined') {
      window.firebaseData = firebaseData;
    }
  }
  return firebaseData;
}

/**
 * Refreshes the summary page if it exists in the DOM.
 * This allows updating summary statistics from other pages.
 * @returns {Promise<void>}
 */
export async function refreshSummaryIfExists() {
  // Check if we're on the summary page or if summary elements exist
  const summaryElements = document.querySelector('#to-do, #done, #urgent');
  if (summaryElements) {
    try {
      // Call the globally available refreshSummary function
      if (typeof window.refreshSummary === 'function') {
        await window.refreshSummary();
      }
    } catch (error) {
      // Summary module not loaded or error occurred - silently ignore
      console.debug('Summary refresh skipped:', error.message);
    }
  }
}

import { getFirebaseData } from './js/data/API.js';

/**
 * Global variable to hold Firebase data.
 * Initialized on first load and reused thereafter.
 */
export let firebaseData = null;

/** Loads Firebase data if not already loaded.
 * @returns {Promise<Object>} The Firebase data object.
 */
export async function loadFirebaseData() {
  if (!firebaseData) {
    firebaseData = await getFirebaseData();

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
  const summaryElements = document.querySelector('#to-do, #done, #urgent');
  if (summaryElements) {
    try {
      if (typeof window.refreshSummary === 'function') {
        await window.refreshSummary();
      }
    } catch (error) {
      console.debug('Summary refresh skipped:', error.message);
    }
  }
}

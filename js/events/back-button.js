/**
 * Adds click behavior to the back button.
 */
export function initBackButton() {
    const btn = document.getElementById('backBtn');
    if (btn) {
        btn.addEventListener('click', () => window.history.back());
    }
}
/* Check for landscape orientation on mobile devices and show overlay */
async function checkLandscapeOverlay() {
  const isLandscape = window.matchMedia("(orientation: landscape) and (max-width: 1280px) and (hover: none)").matches;
  const overlay = document.getElementById("landscape-overlay");
  if (!overlay) return;
  if (isLandscape) {
    overlay.classList.add("show");
    document.body.classList.add("landscape-blocked");
  } else {
    overlay.classList.remove("show");
    document.body.classList.remove("landscape-blocked");
  }
}

/* Run when the window loads */
window.addEventListener("load", checkLandscapeOverlay);

/* Run when the window is resized */
window.addEventListener("resize", checkLandscapeOverlay);

/* Run when the orientation changes */
window.addEventListener("orientationchange", checkLandscapeOverlay);
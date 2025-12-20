/**
 * Enables mouse drag-to-scroll on a given scrollable container.
 * Allows users to scroll horizontally and/or vertically by clicking and dragging with the mouse.
 *
 * @param {HTMLElement} scrollContainer - The element with scrollable overflow
 * @param {Object} [options] - Configuration options
 * @param {boolean} [options.enableHorizontalScroll=true] - Whether to allow horizontal scrolling via drag
 * @param {boolean} [options.enableVerticalScroll=true] - Whether to allow vertical scrolling via drag
 */

export function enableMouseDragScroll(scrollContainer, options = {}) {
    const dragState = createScrollState(scrollContainer, options);
    // Set touch-action passend zur Achse, damit PointerEvents flüssig funktionieren
    setTouchAction(scrollContainer, dragState);
    if ('onpointerdown' in window) {
        bindPointerDragEvents(scrollContainer, dragState);
    } else {
        // Fallback: Maus + Touch getrennt
        bindMouseDragEvents(scrollContainer, dragState);
        bindTouchDragEvents(scrollContainer, dragState);
    }
}

/**
 * Creates an object that stores the current drag state.
 */
function createScrollState(container, { enableHorizontalScroll = true, enableVerticalScroll = true }) {
    return {
        container,
        enableHorizontalScroll,
        enableVerticalScroll,
        // Pointer/Maus/Touch Zustand
        isPressed: false,
        pointerId: null,
        initialPointerX: 0,
        initialPointerY: 0,
        initialScrollLeft: 0,
        initialScrollTop: 0
    };
}

function setTouchAction(el, state) {
    // Optimiertes Scrollverhalten für Touch/Pointer
    if (state.enableHorizontalScroll && state.enableVerticalScroll) {
        el.style.touchAction = 'none';
    } else if (state.enableHorizontalScroll) {
        el.style.touchAction = 'pan-y'; // vertikal nativ, horizontal via drag
    } else if (state.enableVerticalScroll) {
        el.style.touchAction = 'pan-x'; // horizontal nativ, vertikal via drag
    } else {
        el.style.touchAction = 'auto';
    }
}

// Pointer Events (empfohlen: decken Maus, Touch, Pen ab)
function bindPointerDragEvents(scrollContainer, dragState) {
    scrollContainer.style.cursor = 'default';
    scrollContainer.addEventListener('pointerdown', (e) => startPointerDrag(e, dragState));
    scrollContainer.addEventListener('pointermove', (e) => handlePointerMove(e, dragState), { passive: false });
    scrollContainer.addEventListener('pointerup', () => stopPointerDrag(dragState));
    scrollContainer.addEventListener('pointercancel', () => stopPointerDrag(dragState));
    scrollContainer.addEventListener('pointerleave', () => stopPointerDrag(dragState));
}

function startPointerDrag(e, dragState) {
    // Don't interfere with clicks on interactive elements
    if (e.target.closest('button, a, input, textarea, select, [role="button"], .contact, .contact-details-avatar-big')) {
        return;
    }
    
    dragState.isPressed = true;
    dragState.pointerId = e.pointerId;
    dragState.initialPointerX = e.pageX;
    dragState.initialPointerY = e.pageY;
    dragState.initialScrollLeft = dragState.container.scrollLeft;
    dragState.initialScrollTop = dragState.container.scrollTop;
    dragState.container.classList.add('drag-scroll-active');
    if (dragState.container.setPointerCapture) {
        try { dragState.container.setPointerCapture(e.pointerId); } catch (_) {}
    }
    // Maus-Cursor Hinweis
    if (e.pointerType === 'mouse') dragState.container.style.cursor = 'grabbing';
}

function stopPointerDrag(dragState) {
    dragState.isPressed = false;
    dragState.pointerId = null;
    dragState.container.classList.remove('drag-scroll-active');
    dragState.container.style.cursor = 'default';
}

function handlePointerMove(e, dragState) {
    if (!dragState.isPressed) return;
    // Nur aktiven Pointer bewegen
    if (dragState.pointerId != null && e.pointerId !== dragState.pointerId) return;
    const deltaX = e.pageX - dragState.initialPointerX;
    const deltaY = e.pageY - dragState.initialPointerY;
    if (dragState.enableHorizontalScroll) {
        dragState.container.scrollLeft = dragState.initialScrollLeft - deltaX;
    }
    if (dragState.enableVerticalScroll) {
        dragState.container.scrollTop = dragState.initialScrollTop - deltaY;
    }
    // Verhindert natives Browser-Scrollen/Swipe-Gesten bei Touch
    e.preventDefault();
}

/** Maus-Fallback (ältere Browser) */
function bindMouseDragEvents(scrollContainer, dragState) {
    scrollContainer.style.cursor = 'default';
    scrollContainer.addEventListener('mousedown', (mouseEvent) => startMouseDrag(mouseEvent, dragState));
    scrollContainer.addEventListener('mouseup', () => stopMouseDrag(dragState));
    scrollContainer.addEventListener('mouseleave', () => stopMouseDrag(dragState));
    scrollContainer.addEventListener('mousemove', (mouseEvent) => handleMouseMove(mouseEvent, dragState));
}

/**
 * Called when mouse is pressed. Saves initial positions.
 */
function startMouseDrag(mouseEvent, dragState) {
    // Don't interfere with clicks on interactive elements
    if (mouseEvent.target.closest('button, a, input, textarea, select, [role="button"], .contact, .contact-details-avatar-big')) {
        return;
    }
    
    dragState.isPressed = true;
    dragState.initialPointerX = mouseEvent.pageX;
    dragState.initialPointerY = mouseEvent.pageY;
    dragState.initialScrollLeft = dragState.container.scrollLeft;
    dragState.initialScrollTop = dragState.container.scrollTop;
    dragState.container.classList.add('drag-scroll-active');
    mouseEvent.preventDefault();
}

/**
 * Called when mouse is released or leaves the container.
 */
function stopMouseDrag(dragState) {
    dragState.isPressed = false;
    dragState.container.classList.remove('drag-scroll-active');
}

/**
 * Updates scroll position based on mouse movement.
 */
function handleMouseMove(mouseEvent, dragState) {
    if (!dragState.isPressed) return;
    const deltaX = mouseEvent.pageX - dragState.initialPointerX;
    const deltaY = mouseEvent.pageY - dragState.initialPointerY;
    if (dragState.enableHorizontalScroll) {
        dragState.container.scrollLeft = dragState.initialScrollLeft - deltaX;
    }
    if (dragState.enableVerticalScroll) {
        dragState.container.scrollTop = dragState.initialScrollTop - deltaY;
    }
    mouseEvent.preventDefault();
}

/** Touch-Fallback (ältere iOS/Android Browser ohne Pointer Events) */
function bindTouchDragEvents(scrollContainer, dragState) {
    scrollContainer.addEventListener('touchstart', (e) => startTouchDrag(e, dragState), { passive: true });
    scrollContainer.addEventListener('touchmove', (e) => handleTouchMove(e, dragState), { passive: false });
    scrollContainer.addEventListener('touchend', () => stopTouchDrag(dragState));
    scrollContainer.addEventListener('touchcancel', () => stopTouchDrag(dragState));
}

function startTouchDrag(e, dragState) {
    // Don't interfere with touches on interactive elements
    if (e.target.closest('button, a, input, textarea, select, [role="button"], .contact, .contact-details-avatar-big')) {
        return;
    }
    
    const t = e.touches && e.touches[0];
    if (!t) return;
    dragState.isPressed = true;
    dragState.initialPointerX = t.pageX;
    dragState.initialPointerY = t.pageY;
    dragState.initialScrollLeft = dragState.container.scrollLeft;
    dragState.initialScrollTop = dragState.container.scrollTop;
    dragState.container.classList.add('drag-scroll-active');
}

function stopTouchDrag(dragState) {
    dragState.isPressed = false;
    dragState.container.classList.remove('drag-scroll-active');
}

function handleTouchMove(e, dragState) {
    if (!dragState.isPressed) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const deltaX = t.pageX - dragState.initialPointerX;
    const deltaY = t.pageY - dragState.initialPointerY;
    if (dragState.enableHorizontalScroll) {
        dragState.container.scrollLeft = dragState.initialScrollLeft - deltaX;
    }
    if (dragState.enableVerticalScroll) {
        dragState.container.scrollTop = dragState.initialScrollTop - deltaY;
    }
    e.preventDefault();
}

/** * Enables drag-to-scroll functionality on a given container element.
 * Supports mouse, touch, and pointer events with fallbacks for older browsers.
 * @param {HTMLElement} scrollContainer - The container element to enable drag-to-scroll on.
 * @param {Object} [options] - Configuration options.
 * @param {boolean} [options.enableHorizontalScroll=true] - Enable horizontal scrolling.
 * @param {boolean} [options.enableVerticalScroll=true] - Enable vertical scrolling.
 */
export function enableMouseDragScroll(scrollContainer, options = {}) {
    const dragState = createScrollState(scrollContainer, options);

    setTouchAction(scrollContainer, dragState);
    if ('onpointerdown' in window) {
        bindPointerDragEvents(scrollContainer, dragState);
    } else {
        bindMouseDragEvents(scrollContainer, dragState);
        bindTouchDragEvents(scrollContainer, dragState);
    }
}

/** * Creates an object that stores the current drag state.
 */
function createScrollState(container, { enableHorizontalScroll = true, enableVerticalScroll = true }) {
    return {
        container,
        enableHorizontalScroll,
        enableVerticalScroll,

        isPressed: false,
        pointerId: null,
        initialPointerX: 0,
        initialPointerY: 0,
        initialScrollLeft: 0,
        initialScrollTop: 0
    };
}

/** Sets the appropriate touch-action CSS based on enabled scroll directions.
 * @param {HTMLElement} el - The container element.
 * @param {Object} state - The drag state object.
 */
function setTouchAction(el, state) {
    if (state.enableHorizontalScroll && state.enableVerticalScroll) {
        el.style.touchAction = 'none';
    } else if (state.enableHorizontalScroll) {
        el.style.touchAction = 'pan-y';
    } else if (state.enableVerticalScroll) {
        el.style.touchAction = 'pan-x';
    } else {
        el.style.touchAction = 'auto';
    }
}

/** Binds pointer events for drag-to-scroll functionality. 
 * @param {HTMLElement} scrollContainer - The container element.
 * @param {Object} dragState - The drag state object.
 */
function bindPointerDragEvents(scrollContainer, dragState) {
    scrollContainer.style.cursor = 'default';
    scrollContainer.addEventListener('pointerdown', (e) => startPointerDrag(e, dragState));
    scrollContainer.addEventListener('pointermove', (e) => handlePointerMove(e, dragState), { passive: false });
    scrollContainer.addEventListener('pointerup', () => stopPointerDrag(dragState));
    scrollContainer.addEventListener('pointercancel', () => stopPointerDrag(dragState));
    scrollContainer.addEventListener('pointerleave', () => stopPointerDrag(dragState));
}

/** Called when pointer is pressed. Saves initial positions. 
 * @param {Event} e - The pointer event.
 * @param {Object} dragState - The drag state object.
*/
function startPointerDrag(e, dragState) {
    if (e.target.closest('button, a, input, textarea, select, [role="button"], .contact, .contact-details-avatar-big')) return;
    
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

    if (e.pointerType === 'mouse') dragState.container.style.cursor = 'grabbing';
}

/** Called when pointer is released or leaves the container. 
 * @param {Object} dragState - The drag state object.
 */
function stopPointerDrag(dragState) {
    dragState.isPressed = false;
    dragState.pointerId = null;
    dragState.container.classList.remove('drag-scroll-active');
    dragState.container.style.cursor = 'default';
}

/** Updates scroll position based on pointer movement. 
 * @param {Event} e - The pointer event.
 * @param {Object} dragState - The drag state object.
 */
function handlePointerMove(e, dragState) {
    if (!dragState.isPressed) return;
    if (dragState.pointerId != null && e.pointerId !== dragState.pointerId) return;
    const deltaX = e.pageX - dragState.initialPointerX;
    const deltaY = e.pageY - dragState.initialPointerY;
    if (dragState.enableHorizontalScroll) dragState.container.scrollLeft = dragState.initialScrollLeft - deltaX;
    if (dragState.enableVerticalScroll) dragState.container.scrollTop = dragState.initialScrollTop - deltaY;

    e.preventDefault();
}

/** Binds mouse events for drag-to-scroll functionality.
 * @param {HTMLElement} scrollContainer - The container element.
 * @param {Object} dragState - The drag state object.
 */
function bindMouseDragEvents(scrollContainer, dragState) {
    scrollContainer.style.cursor = 'default';
    scrollContainer.addEventListener('mousedown', (mouseEvent) => startMouseDrag(mouseEvent, dragState));
    scrollContainer.addEventListener('mouseup', () => stopMouseDrag(dragState));
    scrollContainer.addEventListener('mouseleave', () => stopMouseDrag(dragState));
    scrollContainer.addEventListener('mousemove', (mouseEvent) => handleMouseMove(mouseEvent, dragState));
}

/** Called when mouse is pressed. Saves initial positions. 
 * @param {MouseEvent} mouseEvent - The mouse event.
 * @param {Object} dragState - The drag state object.
 */
function startMouseDrag(mouseEvent, dragState) {
    if (mouseEvent.target.closest('button, a, input, textarea, select, [role="button"], .contact, .contact-details-avatar-big')) return;
    
    dragState.isPressed = true;
    dragState.initialPointerX = mouseEvent.pageX;
    dragState.initialPointerY = mouseEvent.pageY;
    dragState.initialScrollLeft = dragState.container.scrollLeft;
    dragState.initialScrollTop = dragState.container.scrollTop;
    dragState.container.classList.add('drag-scroll-active');
    mouseEvent.preventDefault();
}

/** * Called when mouse is released or leaves the container.
 * @param {Object} dragState - The drag state object.
 */
function stopMouseDrag(dragState) {
    dragState.isPressed = false;
    dragState.container.classList.remove('drag-scroll-active');
}

/** Updates scroll position based on mouse movement. 
 * @param {MouseEvent} mouseEvent - The mouse event.
 * @param {Object} dragState - The drag state object.
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

/** Binds touch events for drag-to-scroll functionality.
 * @param {HTMLElement} scrollContainer - The container element.
 * @param {Object} dragState - The drag state object.
 */
function bindTouchDragEvents(scrollContainer, dragState) {
    scrollContainer.addEventListener('touchstart', (e) => startTouchDrag(e, dragState), { passive: true });
    scrollContainer.addEventListener('touchmove', (e) => handleTouchMove(e, dragState), { passive: false });
    scrollContainer.addEventListener('touchend', () => stopTouchDrag(dragState));
    scrollContainer.addEventListener('touchcancel', () => stopTouchDrag(dragState));
}

/** Called when touch is initiated. Saves initial positions. 
 * @param {TouchEvent} e - The touch event.
 * @param {Object} dragState - The drag state object.
 */
function startTouchDrag(e, dragState) {
    if (e.target.closest('button, a, input, textarea, select, [role="button"], .contact, .contact-details-avatar-big')) return;
    
    const t = e.touches && e.touches[0];
    if (!t) return;
    dragState.isPressed = true;
    dragState.initialPointerX = t.pageX;
    dragState.initialPointerY = t.pageY;
    dragState.initialScrollLeft = dragState.container.scrollLeft;
    dragState.initialScrollTop = dragState.container.scrollTop;
    dragState.container.classList.add('drag-scroll-active');
}

/** Called when touch ends. 
 * @param {Object} dragState - The drag state object.
 */
function stopTouchDrag(dragState) {
    dragState.isPressed = false;
    dragState.container.classList.remove('drag-scroll-active');
}

/** Updates scroll position based on touch movement. 
 * @param {TouchEvent} e - The touch event.
 * @param {Object} dragState - The drag state object.
 */
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
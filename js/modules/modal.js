/**
 * @module modal
 * @description Accessible overlay/modal manager with focus trap and keyboard navigation.
 * Supports multiple independent overlay instances via factory pattern.
 */

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
        return !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true';
    });
}

/**
 * Creates an isolated overlay manager with its own focus trap state.
 * @returns {{ openOverlay: Function, closeOverlay: Function }}
 */
export function createOverlayManager() {
    let activeOverlay = null;
    let lastFocusedElement = null;
    const focusTrapHandlers = new WeakMap();

    const trapFocus = (container, onEscape) => {
        if (!container) return;

        const keyHandler = (event) => {
            if (activeOverlay !== container) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                onEscape?.();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusables = getFocusableElements(container);
            if (!focusables.length) {
                event.preventDefault();
                container.focus();
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const current = document.activeElement;

            if (event.shiftKey && current === first) {
                event.preventDefault();
                last.focus();
                return;
            }

            if (!event.shiftKey && current === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', keyHandler);
        focusTrapHandlers.set(container, keyHandler);

        const initialFocus = getFocusableElements(container)[0] || container;
        initialFocus.focus();
    };

    const releaseFocusTrap = (container) => {
        const handler = focusTrapHandlers.get(container);
        if (handler) {
            document.removeEventListener('keydown', handler);
            focusTrapHandlers.delete(container);
        }
    };

    /**
     * Opens an overlay, traps focus inside it, and stores the previously focused element.
     * @param {HTMLElement} overlay - The overlay DOM element.
     * @param {HTMLElement|null} triggerElement - Element that triggered open (restored on close).
     * @param {Function} [onEscape] - Callback when Escape key is pressed.
     */
    const openOverlay = (overlay, triggerElement, onEscape) => {
        if (!overlay) return;
        if (activeOverlay && activeOverlay !== overlay) {
            releaseFocusTrap(activeOverlay);
            activeOverlay.setAttribute('aria-hidden', 'true');
        }
        lastFocusedElement = triggerElement || document.activeElement;
        activeOverlay = overlay;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        trapFocus(overlay, onEscape);
    };

    /**
     * Closes an overlay, releases the focus trap, and restores focus to the trigger element.
     * @param {HTMLElement} overlay - The overlay DOM element to close.
     */
    const closeOverlay = (overlay) => {
        if (!overlay) return;
        releaseFocusTrap(overlay);
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        if (activeOverlay === overlay) {
            activeOverlay = null;
        }
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    };

    return {
        openOverlay,
        closeOverlay
    };
}

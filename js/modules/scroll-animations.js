/**
 * Scroll Animation Module
 * Uses Intersection Observer to trigger animations when elements enter the viewport
 */

export function initScrollAnimations() {
    // Animation configuration
    const animationConfig = {
        threshold: [0, 0.25, 0.5, 0.75],
        rootMargin: '-50px 0px -50px 0px'
    };

    // Create observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Trigger animation
                entry.target.classList.add('animate-in');
                // Optional: unobserve after animation to save performance
                if (entry.target.dataset.animateOnce === 'true') {
                    observer.unobserve(entry.target);
                }
            } else if (entry.target.dataset.animateOnce !== 'true') {
                // Allow re-animation on exit (optional behavior)
                entry.target.classList.remove('animate-in');
            }
        });
    }, animationConfig);

    // Auto-observe elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach((el) => {
        observer.observe(el);
    });

    // Return observer for manual control if needed
    return { observer, observe: (el) => observer.observe(el) };
}

/**
 * Predefined animation classes for common patterns
 * To use: add data-animate="fade-in" to element
 */
export const animationPresets = {
    'fade-in': 'fade-in',
    'slide-up': 'slide-up',
    'slide-down': 'slide-down',
    'slide-left': 'slide-left',
    'slide-right': 'slide-right',
    'scale-up': 'scale-up',
    'scale-down': 'scale-down',
    'rotate-in': 'rotate-in',
    'bounce-in': 'bounce-in'
};

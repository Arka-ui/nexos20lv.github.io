/**
 * @module lazy-images
 * @description IntersectionObserver-based lazy loading for images with data-src attribute.
 */

/**
 * Initializes lazy loading for all img[data-src] elements.
 * Falls back to immediate src swap if IntersectionObserver is unavailable.
 * @returns {void}
 */
export function initLazyImages() {
    // Check if browser supports loading="lazy"
    const supportsNativeLazyLoad = 'loading' in HTMLImageElement.prototype;

    // Create IntersectionObserver for non-native lazy loading
    if (!supportsNativeLazyLoad) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });

        // Observe all lazy images
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
            imageObserver.observe(img);
        });
    }

    // Handle WebP fallback for picture elements
    initWebPFallback();
}

function loadImage(img) {
    // Load WebP if available
    if (img.dataset.srcWebp) {
        const webpImg = new Image();
        webpImg.onload = () => {
            img.src = img.dataset.srcWebp;
            img.classList.add('loaded');
        };
        webpImg.onerror = () => {
            // Fallback to regular image
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        };
        webpImg.src = img.dataset.srcWebp;
    } else if (img.dataset.src) {
        img.src = img.dataset.src;
        img.classList.add('loaded');
    }

    img.classList.add('loading');
}

function initWebPFallback() {
    // Create a canvas test for WebP support
    const webpCanvas = document.createElement('canvas');
    webpCanvas.width = 1;
    webpCanvas.height = 1;
    const supportsWebp = webpCanvas.toDataURL('image/webp').indexOf('webp') === 5;

    if (supportsWebp) {
        document.documentElement.classList.add('webp-support');
    }
}

/**
 * Preload critical images
 * Usage: preloadImages(['image1.webp', 'image2.webp'])
 */
export function preloadImages(urls) {
    if (!Array.isArray(urls)) return;

    urls.forEach((url) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
    });
}

/**
 * Generate responsive image set with srcset
 * Usage: buildSrcSet('image', {sizes: [480, 768, 1024], ext: 'webp'})
 */
export function buildSrcSet(basePath, options = {}) {
    const { sizes = [480, 768, 1024, 1280], ext = 'jpg' } = options;
    return sizes.map((size) => `${basePath}-${size}w.${ext} ${size}w`).join(', ');
}

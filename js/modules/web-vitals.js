/**
 * Web Vitals Module
 * Tracks Core Web Vitals: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)
 * Also tracks: TTFB (Time to First Byte), FCP (First Contentful Paint)
 */

export function initWebVitals() {
    const vitals = {
        lcp: null,
        fid: null,
        cls: 0,
        ttfb: null,
        fcp: null
    };

    // Collect Web Vitals data
    collectLCP((lcp) => {
        vitals.lcp = lcp;
        reportVital('LCP', lcp);
    });

    collectFID((fid) => {
        vitals.fid = fid;
        reportVital('FID', fid);
    });

    collectCLS((cls) => {
        vitals.cls = cls;
        reportVital('CLS', cls);
    });

    collectTTFB((ttfb) => {
        vitals.ttfb = ttfb;
        reportVital('TTFB', ttfb);
    });

    collectFCP((fcp) => {
        vitals.fcp = fcp;
        reportVital('FCP', fcp);
    });

    // Store vitals in window for debugging
    window.__VITALS__ = vitals;

    // Send beacon on unload
    window.addEventListener('beforeunload', () => {
        sendVitalsBeacon(vitals);
    });

    return vitals;
}

/**
 * Largest Contentful Paint (LCP)
 * Target: < 2.5s (Good)
 */
function collectLCP(callback) {
    let lcp = null;

    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.renderTime || lastEntry.loadTime;
    });

    try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
        console.warn('LCP observer not supported');
    }

    // Report LCP when page visibility changes or when hidden
    const reportLCP = () => {
        if (lcp) {
            observer.disconnect();
            callback(lcp);
        }
    };

    document.addEventListener('visibilitychange', reportLCP);
    window.addEventListener('beforeunload', reportLCP);
}

/**
 * First Input Delay (FID)
 * Target: < 100ms (Good) - Note: being replaced by INP in modern browsers
 */
function collectFID(callback) {
    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];
        const fid = firstEntry.processingDuration;

        observer.disconnect();
        callback(fid);
    });

    try {
        observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
        console.warn('FID observer not supported');
    }

    // Fallback if no first input
    window.addEventListener('beforeunload', () => {
        observer.disconnect();
    });
}

/**
 * Cumulative Layout Shift (CLS)
 * Target: < 0.1 (Good)
 */
function collectCLS(callback) {
    let cls = 0;

    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
                cls += entry.value;
            }
        });
    });

    try {
        observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
        console.warn('CLS observer not supported');
    }

    // Report CLS periodically and on unload
    const reportCLS = () => {
        callback(cls);
    };

    document.addEventListener('visibilitychange', reportCLS);
    window.addEventListener('beforeunload', reportCLS);
}

/**
 * Time to First Byte (TTFB)
 * Target: < 800ms (Good)
 */
function collectTTFB(callback) {
    if (!window.performance || !window.performance.timing) {
        return;
    }

    const navigation = performance.timing;
    const ttfb = navigation.responseStart - navigation.fetchStart;

    if (ttfb > 0) {
        callback(ttfb);
    }
}

/**
 * First Contentful Paint (FCP)
 * Target: < 1.8s (Good)
 */
function collectFCP(callback) {
    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
                callback(entry.startTime);
            }
        });
    });

    try {
        observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
        console.warn('FCP observer not supported');
    }
}

/**
 * Report individual vital
 */
function reportVital(name, value) {
    // Classify value as Good/Needs Improvement/Poor based on thresholds
    const thresholds = {
        'LCP': { good: 2500, poor: 4000 },
        'FID': { good: 100, poor: 300 },
        'CLS': { good: 0.1, poor: 0.25 },
        'TTFB': { good: 800, poor: 1800 },
        'FCP': { good: 1800, poor: 3000 }
    };

    const threshold = thresholds[name];
    let status = 'poor';

    if (threshold) {
        if (value <= threshold.good) status = 'good';
        else if (value <= threshold.poor) status = 'needs-improvement';
    }

    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        // Log in production (you can send to analytics service)
        console.log(`[VITAL] ${name}: ${value.toFixed(2)}ms - ${status}`);
    }
}

/**
 * Send vitals beacon to server
 */
function sendVitalsBeacon(vitals) {
    if (!vitals.lcp && !vitals.fid && vitals.cls === 0) {
        return; // No meaningful data
    }

    const data = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        vitals: {
            lcp: vitals.lcp ? Math.round(vitals.lcp) : null,
            fid: vitals.fid ? Math.round(vitals.fid) : null,
            cls: Math.round(vitals.cls * 100) / 100,
            ttfb: vitals.ttfb ? Math.round(vitals.ttfb) : null,
            fcp: vitals.fcp ? Math.round(vitals.fcp) : null
        }
    };

    // Use sendBeacon for reliability (doesn't block page unload)
    if (navigator.sendBeacon) {
        // You can send to your analytics endpoint
        // navigator.sendBeacon('/api/vitals', JSON.stringify(data));
    }

    // Store in localStorage for debugging
    try {
        const vitalsLog = JSON.parse(localStorage.getItem('vitals-log') || '[]');
        vitalsLog.push(data);
        // Keep only last 50 entries
        if (vitalsLog.length > 50) vitalsLog.shift();
        localStorage.setItem('vitals-log', JSON.stringify(vitalsLog));
    } catch (e) {
        console.warn('Could not store vitals log:', e);
    }
}

/**
 * Get vitals from localStorage for debugging
 */
export function getVitalsLog() {
    try {
        return JSON.parse(localStorage.getItem('vitals-log') || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * Clear vitals log
 */
export function clearVitalsLog() {
    localStorage.removeItem('vitals-log');
}

/**
 * @module perf-mode
 * @description Manages performance, accessibility, and ultra-compact rendering modes.
 * Detects low-end devices automatically and persists mode preferences in localStorage.
 */

/**
 * Runs a callback when the browser is idle (requestIdleCallback or setTimeout fallback).
 * @param {Function} fn - Callback to run.
 * @param {number} [timeout=1200] - Optional timeout override in ms.
 */
export function runWhenIdle(callback, timeout = 1200) {
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(callback, { timeout });
        return;
    }
    setTimeout(callback, 250);
}

/**
 * Returns true if the device meets low-end thresholds from config.perf.
 * @param {{ lowEndDeviceMemoryGb: number, lowEndCpuThreads: number, lowEndViewportWidth: number }} perfConfig
 * @returns {boolean}
 */
export function shouldAutoEnablePerfMode(perfConfig = {}) {
    const lowThreads = typeof navigator.hardwareConcurrency === 'number'
        && navigator.hardwareConcurrency <= (perfConfig.lowEndCpuThreads || 4);
    const lowMemory = typeof navigator.deviceMemory === 'number'
        && navigator.deviceMemory <= (perfConfig.lowEndDeviceMemoryGb || 4);
    const smallViewport = window.innerWidth <= (perfConfig.lowEndViewportWidth || 900);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return reducedMotion || lowThreads || lowMemory || smallViewport;
}

/**
 * Initializes the perf mode toggle button and applies saved or auto-detected perf mode.
 * @param {HTMLElement|null} perfToggle - The performance toggle button element.
 * @param {boolean} autoEnabled - Whether to auto-enable perf mode for low-end devices.
 */
export function initPerformanceMode(perfToggle, autoEnabled) {
    const hasManualChoice = localStorage.getItem('perf-mode') !== null;
    const isPerfMode = localStorage.getItem('perf-mode') === 'true'
        || (!hasManualChoice && autoEnabled);

    if (isPerfMode) {
        document.body.classList.add('perf-mode');
        perfToggle?.classList.add('active');
    }

    perfToggle?.addEventListener('click', () => {
        const active = document.body.classList.toggle('perf-mode');
        perfToggle.classList.toggle('active', active);
        localStorage.setItem('perf-mode', String(active));
    });
}

/**
 * Initializes the accessibility mode toggle (native cursor, reduced motion).
 * @param {HTMLElement|null} accessibilityToggle
 */
export function initAccessibilityMode(accessibilityToggle) {
    const saved = localStorage.getItem('accessibility-mode') === 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const enabled = saved || reducedMotion;

    document.body.classList.toggle('native-cursor', enabled);
    accessibilityToggle?.classList.toggle('active', enabled);
    accessibilityToggle?.setAttribute('aria-pressed', String(enabled));

    accessibilityToggle?.addEventListener('click', () => {
        const isActive = document.body.classList.toggle('native-cursor');
        accessibilityToggle.classList.toggle('active', isActive);
        accessibilityToggle.setAttribute('aria-pressed', String(isActive));
        localStorage.setItem('accessibility-mode', String(isActive));
    });
}

/**
 * Applies ultra-compact layout class when viewport width is very small.
 */
export function initUltraCompactMode() {
    const params = new URLSearchParams(window.location.search);
    const compactParam = params.get('compact');

    if (compactParam === '1') {
        localStorage.setItem('ultra-compact', 'true');
    } else if (compactParam === '0') {
        localStorage.setItem('ultra-compact', 'false');
    }

    const isUltraCompact = localStorage.getItem('ultra-compact') === 'true';
    document.body.classList.toggle('ultra-compact', isUltraCompact);
}

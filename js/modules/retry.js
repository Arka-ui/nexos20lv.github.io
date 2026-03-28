/**
 * @module retry
 * @description Provides exponential backoff delay calculation for WebSocket/API retries.
 */

/**
 * Returns the delay in ms for the nth retry attempt using exponential backoff with jitter.
 * @param {number} attempt - Zero-based attempt index.
 * @param {{ baseDelayMs: number, maxDelayMs: number }} config - Retry config from js/config.js.
 * @returns {number} Delay in milliseconds.
 */
export function getBackoffDelay(attempt, retriesConfig = {}) {
    const baseDelay = retriesConfig.baseDelayMs || 1200;
    const maxDelay = retriesConfig.maxDelayMs || 30000;
    const expDelay = Math.min(maxDelay, baseDelay * (2 ** attempt));
    const jitter = Math.floor(Math.random() * Math.max(300, expDelay * 0.2));
    return Math.min(maxDelay, expDelay + jitter);
}

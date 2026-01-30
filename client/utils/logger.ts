/**
 * Development-only Logger
 * 
 * Wrapper around console methods that only logs in development mode.
 * In production builds, these calls are effectively no-ops.
 */

const isDev = __DEV__;

export const Logger = {
    /**
     * Log a message (only in development)
     */
    log: (...args: unknown[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    /**
     * Log a warning (only in development)
     */
    warn: (...args: unknown[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },

    /**
     * Log an error (always logs, even in production)
     */
    error: (...args: unknown[]) => {
        console.error(...args);
    },

    /**
     * Log debug info (only in development)
     */
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.debug(...args);
        }
    },

    /**
     * Log with a specific tag (only in development)
     */
    tagged: (tag: string, ...args: unknown[]) => {
        if (isDev) {
            console.log(`[${tag}]`, ...args);
        }
    },
};

export default Logger;

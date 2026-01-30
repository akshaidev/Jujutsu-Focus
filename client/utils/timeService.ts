/**
 * Time Service - Fetches server time and provides tamper-resistant time functions
 * Uses HTTP Date header from fast CDN endpoints (responds in ~50-100ms)
 */

// Store the offset between device time and server time
let serverTimeOffset: number = 0;
let isTimeSynced: boolean = false;
let lastSyncAttempt: number = 0;
const SYNC_COOLDOWN_MS = 30000; // Don't retry more than once per 30 seconds

// Fast endpoints that return Date header
const TIME_ENDPOINTS = [
    "https://www.google.com/generate_204", // Google's connectivity check - very fast
    "https://1.1.1.1/cdn-cgi/trace", // Cloudflare - very fast
    "https://www.cloudflare.com/cdn-cgi/trace", // Cloudflare backup
];

/**
 * Fetch current time from server and calculate offset
 * Returns true if sync was successful
 */
export async function syncServerTime(): Promise<boolean> {
    const now = Date.now();

    // Avoid hammering the endpoints
    if (now - lastSyncAttempt < SYNC_COOLDOWN_MS && isTimeSynced) {
        return true;
    }
    lastSyncAttempt = now;

    for (const endpoint of TIME_ENDPOINTS) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

            const requestStart = Date.now();
            const response = await fetch(endpoint, {
                method: "HEAD",
                cache: "no-store",
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const requestEnd = Date.now();

            const dateHeader = response.headers.get("Date");
            if (dateHeader) {
                // Account for network latency
                const latency = (requestEnd - requestStart) / 2;
                const serverTimeMs = new Date(dateHeader).getTime();
                const adjustedServerTime = serverTimeMs + latency;

                // Calculate offset: positive means device is ahead, negative means behind
                serverTimeOffset = Date.now() - adjustedServerTime;
                isTimeSynced = true;

                if (__DEV__) {
                    console.log(`[TimeService] Synced via ${new URL(endpoint).hostname} - Offset: ${(serverTimeOffset / 1000).toFixed(1)}s`);
                }
                return true;
            }
        } catch (error) {
            // Continue to next endpoint
            continue;
        }
    }

    if (__DEV__) {
        console.warn("[TimeService] All sync attempts failed, using device time");
    }
    return false;
}

/**
 * Get the current server-adjusted timestamp (milliseconds since epoch)
 * This is the tamper-resistant equivalent of Date.now()
 */
export function getServerTime(): number {
    return Date.now() - serverTimeOffset;
}

/**
 * Get the current server-adjusted Date object
 */
export function getServerDate(): Date {
    return new Date(getServerTime());
}

/**
 * Get today's date string in YYYY-MM-DD format using server time
 */
export function getServerTodayString(): string {
    return getServerDate().toISOString().split("T")[0];
}

/**
 * Check if time has been synced with server
 */
export function isServerTimeSynced(): boolean {
    return isTimeSynced;
}

/**
 * Get the current time offset (for debugging)
 * Positive = device is ahead, Negative = device is behind
 */
export function getTimeOffset(): number {
    return serverTimeOffset;
}

/**
 * Force a re-sync of server time
 */
export async function forceTimeSync(): Promise<boolean> {
    lastSyncAttempt = 0; // Reset cooldown
    return syncServerTime();
}

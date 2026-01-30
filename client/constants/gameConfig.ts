/**
 * Game Configuration Constants
 * 
 * Centralized configuration for all game mechanics and balance values.
 * Update these values to adjust game difficulty and progression.
 */

// --- Cursed Energy (CE) Rates ---
/** Base CE earning rate when balance > 0 (CE per minute) */
export const CE_EARNING_RATE_BASE = 1.0;

/** CE earning rate when balance < 0 (CE per minute) - limited earning in debt */
export const CE_EARNING_RATE_DEBT = 0.5;

/** CE earning rate when balance < -10 (severely limited) */
export const CE_EARNING_RATE_SEVERE_DEBT = 0.25;

/** First debt threshold (mild debt starts at this balance) */
export const DEBT_THRESHOLD_MILD = -5;

/** Second debt threshold (severe debt starts at this balance) */
export const DEBT_THRESHOLD_SEVERE = -10;

/** CE consumption rate during leisure/gaming (CE per minute) */
export const CE_CONSUMPTION_RATE = 1.0;

/** Pre-calculated CE consumption per second (for tick optimization) */
export const CE_PER_SECOND = CE_CONSUMPTION_RATE / 60;

// --- Binding Vow ---
/** CE earning boost when Binding Vow is active (added to base rate) */
export const VOW_EARNING_BOOST = 0.5;

/** Grace time earned per second of study while Vow is active (in seconds) */
export const VOW_GRACE_TIME_EARNING_RATE = 0.2;

/** Binding Vow duration (24 hours in milliseconds) */
export const VOW_DURATION_MS = 24 * 60 * 60 * 1000;

/** Penalty cooldown after failing a vow (2 hours in milliseconds) */
export const VOW_PENALTY_COOLDOWN_MS = 2 * 60 * 60 * 1000;

/** Penalty duration after failing vow - doubled debt period (6 hours in milliseconds) */
export const VOW_PENALTY_DURATION_MS = 6 * 60 * 60 * 1000;

/** Penalty multiplier for vow failure */
export const VOW_PENALTY_MULTIPLIER = 1.0;

// --- Negative Cursed Energy (NCE) ---
/** NCE earning rate while studying with an active streak (CE per minute) */
export const NCE_EARNING_RATE = 0.5;

// --- Reverse Cursed Technique (RCT) ---
/** Streak days required to earn one RCT credit */
export const RCT_STREAK_DAYS_REQUIRED = 3;

/** Minimum NCE required to use RCT */
export const RCT_MIN_NCE_REQUIRED = 0.1;

// --- Safe Break ---
/** Safe Break earning ratio: 1 second of break per X seconds of study */
export const SAFE_BREAK_EARN_RATIO = 5;

/** Maximum Safe Break seconds that can be accumulated (60 minutes) */
export const SAFE_BREAK_MAX_SECONDS = 60 * 60;

/** Seconds before Safe Break ends to trigger warning sound */
export const SAFE_BREAK_WARNING_SECONDS = 3;

/** Threshold in seconds to switch from seconds to minutes display (2 minutes) */
export const SAFE_BREAK_MINUTES_THRESHOLD = 120;

// --- Sleep ---
/** CE bonus per hour of sleep logged */
export const SLEEP_CE_PER_HOUR = 5.0;

/** Extra CE bonus for 8+ hours of sleep */
export const SLEEP_BONUS_8_HOURS = 10.0;

// --- System Limits ---
/** Maximum number of log entries to keep */
export const MAX_LOG_ENTRIES = 100;

/** Cooldown between time sync attempts (milliseconds) */
export const TIME_SYNC_COOLDOWN_MS = 30000;

/** Timeout for time sync requests (milliseconds) */
export const TIME_SYNC_TIMEOUT_MS = 3000;

/** Tick interval in milliseconds */
export const TICK_INTERVAL_MS = 1000;


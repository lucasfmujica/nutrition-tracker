import {
    CustomTargets,
    FoodEntry,
    MealTemplate,
    OuraEntry,
    Profile,
    StepsEntry,
    WaterEntry,
    WeightEntry,
    Workout,
} from '../types/domain';
import { storage } from './storage';

// ============================================================================
// MULTI-USER STORAGE KEY SYSTEM
// ============================================================================

/**
 * Legacy cache keys for migration (pre-multi-user)
 * Used to migrate existing user data to new user-specific keys
 */
export const LEGACY_CACHE_KEYS = {
    PROFILE: 'lucas-profile-v5',
    WEIGHT: 'lucas-weight-history-v5',
    FOOD: 'lucas-food-log-v5',
    WORKOUT: 'lucas-workout-log-v5',
    STEPS: 'lucas-steps-log-v5',
    TARGETS: 'lucas-targets-v5',
    OURA: 'lucas-oura-log-v5',
    WATER: 'lucas-water-log-v5',
    TEMPLATES: 'lucas-meal-templates-v1',
    PENDING_SYNC: 'lucas-pending-sync-v1',
    METADATA: 'lucas-cache-metadata-v1',
};

/**
 * Generate user-specific cache keys
 * Uses first 8 chars of userId for brevity while maintaining uniqueness
 * @param userId - Full user ID from Supabase auth
 * @returns Object with all cache keys for this user
 */
export const getCacheKeys = (userId: string) => {
    const shortId = userId.substring(0, 8);
    return {
        PROFILE: `lf-${shortId}-profile-v5`,
        WEIGHT: `lf-${shortId}-weight-v5`,
        FOOD: `lf-${shortId}-food-v5`,
        WORKOUT: `lf-${shortId}-workout-v5`,
        STEPS: `lf-${shortId}-steps-v5`,
        TARGETS: `lf-${shortId}-targets-v5`,
        OURA: `lf-${shortId}-oura-v5`,
        WATER: `lf-${shortId}-water-v5`,
        TEMPLATES: `lf-${shortId}-templates-v1`,
        PENDING_SYNC: `lf-${shortId}-pending-v1`,
        METADATA: `lf-${shortId}-metadata-v1`,
    };
};

/**
 * Backward compatibility: Export CACHE_KEYS as alias to LEGACY_CACHE_KEYS
 * @deprecated Use getCacheKeys(userId) instead
 */
export const CACHE_KEYS = LEGACY_CACHE_KEYS;

/**
 * Migrate legacy storage keys to user-specific keys
 * Called once on login to preserve existing user data
 * @param userId - User ID to migrate data to
 * @returns Promise<boolean> - True if migration occurred, false if no legacy data
 */
export const migrateUserStorage = async (userId: string): Promise<boolean> => {
    try {
        const userKeys = getCacheKeys(userId);

        // Check if legacy data exists
        const legacyProfile = await storage.get(LEGACY_CACHE_KEYS.PROFILE).catch(() => null);
        if (!legacyProfile?.value) {
            console.log('[Migration] No legacy data found, skipping migration');
            return false;
        }

        // Check if user already has migrated data (prevent double migration)
        const existingUserData = await storage.get(userKeys.PROFILE).catch(() => null);
        if (existingUserData?.value) {
            console.log('[Migration] User already has data, skipping migration');
            return false;
        }

        console.log('[Migration] Starting legacy data migration for user:', userId.substring(0, 8));

        // Migrate all data types
        const migrationPairs = [
            { legacy: LEGACY_CACHE_KEYS.PROFILE, user: userKeys.PROFILE },
            { legacy: LEGACY_CACHE_KEYS.WEIGHT, user: userKeys.WEIGHT },
            { legacy: LEGACY_CACHE_KEYS.FOOD, user: userKeys.FOOD },
            { legacy: LEGACY_CACHE_KEYS.WORKOUT, user: userKeys.WORKOUT },
            { legacy: LEGACY_CACHE_KEYS.STEPS, user: userKeys.STEPS },
            { legacy: LEGACY_CACHE_KEYS.TARGETS, user: userKeys.TARGETS },
            { legacy: LEGACY_CACHE_KEYS.OURA, user: userKeys.OURA },
            { legacy: LEGACY_CACHE_KEYS.WATER, user: userKeys.WATER },
            { legacy: LEGACY_CACHE_KEYS.TEMPLATES, user: userKeys.TEMPLATES },
            { legacy: LEGACY_CACHE_KEYS.PENDING_SYNC, user: userKeys.PENDING_SYNC },
            { legacy: LEGACY_CACHE_KEYS.METADATA, user: userKeys.METADATA },
        ];

        for (const pair of migrationPairs) {
            const legacyData = await storage.get(pair.legacy).catch(() => null);
            if (legacyData?.value) {
                await storage.set(pair.user, legacyData.value);
                console.log(`[Migration] Migrated ${pair.legacy} → ${pair.user}`);
            }
        }

        // Clear legacy keys after successful migration
        for (const key of Object.values(LEGACY_CACHE_KEYS)) {
            await storage.remove(key).catch(() => {});
        }
        console.log('[Migration] Legacy keys cleared');

        return true;
    } catch (err) {
        console.error('[Migration] Failed to migrate user storage:', err);
        return false;
    }
};

// ============================================================================
// SWR PATTERN - Cache Validation & Staleness Detection
// ============================================================================

/**
 * Cache TTL (Time-To-Live)
 * Data older than 5 minutes is considered stale and won't be used for hydration
 * This prevents race conditions with Argentina timezone date filtering
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Schema version for cache validation
 * Increment this when making breaking changes to data structure
 * Mismatched versions will trigger cache invalidation
 */
const SCHEMA_VERSION = 'v6';

interface StorageItem {
    value: string | null;
}

/**
 * Track corrupted cache instances for user notification
 * Cleared after reporting to avoid spam
 */
let corruptedCacheDetected = false;

const safeParse = <T>(item: StorageItem | null, defaultValue: T, key?: string): T => {
    if (!item?.value) return defaultValue;
    try {
        return JSON.parse(item.value);
    } catch (e) {
        // 🔒 IMPROVED: Explicit error recovery for corrupted cache
        console.error('[Cache] CORRUPTED data detected:', {
            key,
            error: e instanceof Error ? e.message : 'Unknown error',
            rawValue: item.value?.substring(0, 100), // First 100 chars for debugging
        });

        // Set flag for user notification (consumed by loadCachedData)
        if (!corruptedCacheDetected) {
            corruptedCacheDetected = true;
            // Flag will be checked by caller to show user notification
        }

        return defaultValue;
    }
};

/**
 * Check if corrupted cache was detected during parsing
 * Caller should show user notification and optionally clear cache
 */
export const hasCorruptedCache = (): boolean => {
    const detected = corruptedCacheDetected;
    corruptedCacheDetected = false; // Reset flag after check
    return detected;
};

interface CachedData {
    localProfile: Profile | null;
    localWeight: WeightEntry[];
    localFood: FoodEntry[];
    localWorkout: Workout[];
    localSteps: StepsEntry[];
    localTargets: CustomTargets | null;
    localOura: OuraEntry[];
    localWater: WaterEntry[];
    localTemplates: MealTemplate[];
}

export const loadCachedData = async (userId?: string): Promise<CachedData> => {
    const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;

    const [
        profileData,
        weightData,
        foodData,
        workoutData,
        stepsData,
        targetsData,
        ouraData,
        waterData,
        templatesData,
    ] = await Promise.all([
        storage.get(keys.PROFILE).catch(() => null),
        storage.get(keys.WEIGHT).catch(() => null),
        storage.get(keys.FOOD).catch(() => null),
        storage.get(keys.WORKOUT).catch(() => null),
        storage.get(keys.STEPS).catch(() => null),
        storage.get(keys.TARGETS).catch(() => null),
        storage.get(keys.OURA).catch(() => null),
        storage.get(keys.WATER).catch(() => null),
        storage.get(keys.TEMPLATES).catch(() => null),
    ]);

    return {
        localProfile: safeParse(profileData, null, 'PROFILE'),
        localWeight: safeParse(weightData, [], 'WEIGHT'),
        localFood: safeParse(foodData, [], 'FOOD'),
        localWorkout: safeParse(workoutData, [], 'WORKOUT'),
        localSteps: safeParse(stepsData, [], 'STEPS'),
        localTargets: safeParse(targetsData, null, 'TARGETS'),
        localOura: safeParse(ouraData, [], 'OURA'),
        localWater: safeParse(waterData, [], 'WATER'),
        localTemplates: safeParse(templatesData, [], 'TEMPLATES'),
    };
};

interface CacheDataInput {
    profile?: Profile;
    targets?: CustomTargets;
    weightHistory?: WeightEntry[];
    foodLog?: FoodEntry[];
    workouts?: Workout[];
    stepsLog?: StepsEntry[];
    ouraLog?: OuraEntry[];
    waterLog?: WaterEntry[];
    mealTemplates?: MealTemplate[];
}

export const cacheData = async (data: CacheDataInput, userId?: string): Promise<boolean> => {
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const promises: Promise<any>[] = [];

        // Profile & Targets: only if they exist
        if (data.profile)
            promises.push(
                storage.set(keys.PROFILE, JSON.stringify(data.profile)),
            );
        if (data.targets)
            promises.push(
                storage.set(keys.TARGETS, JSON.stringify(data.targets)),
            );

        // CRITICAL FIX: Arrays - ALWAYS update cache to reflect Supabase (even if empty)
        // This ensures cache is a mirror of the cloud, not a competitor
        if (data.weightHistory !== undefined)
            promises.push(
                storage.set(keys.WEIGHT, JSON.stringify(data.weightHistory)),
            );
        if (data.foodLog !== undefined)
            promises.push(
                storage.set(keys.FOOD, JSON.stringify(data.foodLog)),
            );
        if (data.workouts !== undefined)
            promises.push(
                storage.set(keys.WORKOUT, JSON.stringify(data.workouts)),
            );
        if (data.stepsLog !== undefined)
            promises.push(
                storage.set(keys.STEPS, JSON.stringify(data.stepsLog)),
            );
        if (data.ouraLog !== undefined)
            promises.push(
                storage.set(keys.OURA, JSON.stringify(data.ouraLog)),
            );
        if (data.waterLog !== undefined)
            promises.push(
                storage.set(keys.WATER, JSON.stringify(data.waterLog)),
            );
        if (data.mealTemplates !== undefined)
            promises.push(
                storage.set(
                    keys.TEMPLATES,
                    JSON.stringify(data.mealTemplates),
                ),
            );

        await Promise.all(promises);
        return true;
    } catch (err) {
        console.error('[Storage] Failed to cache data:', err);
        return false;
    }
};

export const clearCache = async (userId?: string): Promise<void> => {
    const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
    for (const key of Object.values(keys)) {
        await storage.remove(key);
    }
};

// ============================================================================
// CACHE METADATA MANAGEMENT (SWR Pattern)
// ============================================================================

interface CacheMetadata {
    [dataType: string]: {
        lastSynced: number;
        schemaVersion: string;
    };
}

/**
 * Get cache metadata containing sync timestamps and schema versions
 * @param userId - Optional user ID for user-specific metadata
 * @returns {Promise<Object>} Metadata object with structure:
 *   { dataType: { lastSynced: timestamp, schemaVersion: 'v6' } }
 */
export const getCacheMetadata = async (userId?: string): Promise<CacheMetadata> => {
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const item = await storage.get(keys.METADATA);
        if (!item?.value) return {};
        return JSON.parse(item.value);
    } catch (e) {
        console.warn('[Cache] Error parsing metadata:', e);
        return {};
    }
};

// ============================================================================
// MUTEX - Prevents Race Condition in Metadata Updates
// ============================================================================

/**
 * Simple mutex implementation to serialize metadata updates
 * Prevents race conditions when useInitialHydration and useVaultWorker
 * both try to update metadata simultaneously
 */
class MetadataMutex {
    private queue: Array<() => void> = [];
    private locked = false;

    async acquire(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.locked) {
                this.locked = true;
                resolve();
            } else {
                this.queue.push(resolve);
            }
        });
    }

    release(): void {
        if (this.queue.length > 0) {
            const resolve = this.queue.shift();
            resolve?.();
        } else {
            this.locked = false;
        }
    }
}

const metadataMutex = new MetadataMutex();

// CRITICAL: Serializes read-modify-write on the pending_writes queue.
// Without this, a save during Vault processing can overwrite the queue and lose writes.
const vaultMutex = new MetadataMutex();

/**
 * Update cache metadata after successful Supabase sync
 * Uses Argentina timezone (browser local time already in -03:00)
 * CRITICAL: Protected by mutex to prevent race conditions between hooks
 * @param {string} dataType - Data type key (e.g., 'food', 'weight', 'profile')
 * @param {string} userId - Optional user ID for user-specific metadata
 * @param {number} syncTimestamp - Optional timestamp (defaults to now)
 * @returns {Promise<boolean>} Success status
 */
export const updateCacheMetadata = async (
    dataType: string,
    userId?: string,
    syncTimestamp: number = Date.now(),
): Promise<boolean> => {
    await metadataMutex.acquire();
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const metadata = await getCacheMetadata(userId);
        metadata[dataType] = {
            lastSynced: syncTimestamp,
            schemaVersion: SCHEMA_VERSION,
        };
        await storage.set(keys.METADATA, JSON.stringify(metadata));
        return true;
    } catch (err) {
        console.error('[Cache] Failed to update metadata:', err);
        return false;
    } finally {
        metadataMutex.release();
    }
};

export const updateFreshCacheMetadata = async (
    dataTypes: string[],
    userId?: string,
): Promise<void> => {
    const syncTimestamp = Date.now();
    await Promise.all(
        dataTypes.map((dataType) =>
            updateCacheMetadata(dataType, userId, syncTimestamp),
        ),
    );
};

/**
 * Check if cached data is stale (older than TTL or schema mismatch)
 * CRITICAL: Prevents race condition where stale cache renders before Supabase fetch
 * @param {string} dataType - Data type key to check
 * @param {string} userId - Optional user ID for user-specific check
 * @returns {Promise<boolean>} True if stale, false if fresh
 */
export const isCacheStale = async (dataType: string, userId?: string): Promise<boolean> => {
    try {
        const metadata = await getCacheMetadata(userId);
        const dataMetadata = metadata[dataType];

        // No metadata = stale (first load or corrupted cache)
        if (!dataMetadata) return true;

        // Schema version mismatch = stale (breaking change)
        if (dataMetadata.schemaVersion !== SCHEMA_VERSION) return true;

        // Time-based staleness check
        // NOTE: Date.now() is ALWAYS UTC (milliseconds since Unix epoch), regardless of browser timezone
        // Both lastSynced and Date.now() use UTC, so comparison is timezone-agnostic
        // This is intentional and correct - cache TTL is based on absolute time, not local time
        const now = Date.now(); // UTC timestamp
        const age = now - dataMetadata.lastSynced; // Both in UTC
        const isStale = age > CACHE_TTL_MS;

        return isStale;
    } catch (err) {
        console.warn('[Cache] Error checking staleness:', err);
        return true; // Fail-safe: treat as stale on error
    }
};

// ============================================================================
// THE VAULT - Pending Writes Queue (Offline Resilience)
// ============================================================================

const MAX_QUEUE_SIZE = 100; // CRITICAL: Prevent infinite growth and UI blocking
const MAX_RETRY_COUNT = 5; // Maximum retry attempts before discarding

export interface PendingWrite {
    id: string;
    table: string;
    data: any;
    userId: string;
    timestamp: string;
    retryCount: number;
    /**
     * Epoch ms (Date.now()) of the last sync attempt. Used by the Vault worker to
     * compute per-item exponential backoff (30s → 60s → 120s). Absent on items
     * queued before this field existed → treated as immediately eligible.
     */
    lastAttemptAt?: number;
    /** Defaults to 'insert' when absent (backward compat with older queued items). */
    operation?: 'insert' | 'delete';
}

/**
 * Result of addPendingWrite. The NEW write is ALWAYS queued (never dropped);
 * `overflow` signals that older entries had to be evicted to respect
 * MAX_QUEUE_SIZE so the caller can warn the user (Zero Silent Failures).
 */
export interface AddPendingWriteResult {
    success: boolean;
    overflow: boolean;
    discarded: number;
}

/**
 * Per-item exponential backoff for The Vault (CLAUDE.md spec: 0s → 30s → 60s → 120s).
 * Returns true when the item is eligible to be retried now. Items keep their
 * `lastAttemptAt` stamped by incrementRetryCount(sBatch); a fresh/never-tried item
 * (retryCount 0 or no stamp) is always eligible.
 *   retryCount 1 → wait 30s, 2 → 60s, 3+ → 120s (capped).
 * @param item - Pending write to evaluate
 * @param now - Reference timestamp (epoch ms), defaults to Date.now()
 * @returns {boolean} True if the item's backoff window has elapsed
 */
export const isPendingWriteDue = (
    item: PendingWrite,
    now: number = Date.now(),
): boolean => {
    const retries = item.retryCount || 0;
    if (retries === 0 || !item.lastAttemptAt) return true; // First try: immediate
    const BASE_DELAY_MS = 30000;
    const MAX_DELAY_MS = 120000;
    const delay = Math.min(BASE_DELAY_MS * 2 ** (retries - 1), MAX_DELAY_MS);
    return now - item.lastAttemptAt >= delay;
};

/**
 * Add a failed write to the pending sync queue
 * CRITICAL: Enforces MAX_QUEUE_SIZE and MAX_RETRY_COUNT limits
 * @param {string} table - Table name (e.g., 'oura_log', 'food_log')
 * @param {object} data - Entry data to sync
 * @param {string} userId - User ID for deduplication and storage key
 * @returns {Promise<boolean>} Success status
 */
export const addPendingWrite = async (
    table: string,
    data: any,
    userId: string,
): Promise<AddPendingWriteResult> => {
    try {
        // CRITICAL: Validate inputs to prevent data corruption
        if (!userId) {
            console.error('[Vault] Cannot add pending write without userId');
            return { success: false, overflow: false, discarded: 0 };
        }

        // 🔒 IMPROVED: Comprehensive date validation
        if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            console.error(
                '[Vault] Invalid date format (expected YYYY-MM-DD):',
                data.date,
            );
            return { success: false, overflow: false, discarded: 0 };
        }

        // 🔒 NEW: Prevent future dates (Argentina timezone)
        // Import getArgentinaDateString if not already imported
        const { getArgentinaDateString } = await import('./dateUtils');
        const todayArgentina = getArgentinaDateString();
        if (data.date > todayArgentina) {
            console.error(
                `[Vault] Cannot queue future date. Got: ${data.date}, Today (Argentina): ${todayArgentina}`,
            );
            return { success: false, overflow: false, discarded: 0 };
        }

        // CRITICAL: Deterministic ID prevents duplicates on double-click WITHOUT
        // collapsing distinct entries. Tables with many rows/day (food_log, workouts)
        // carry a per-entry data.id; one-row-per-day tables (steps/weight/water/oura)
        // fall back to the date as their natural key.
        const entryKey =
            data.id !== undefined && data.id !== null ? data.id : data.date;
        const deterministicId = `${table}_${userId}_${entryKey}`;

        // CRITICAL: Lock the queue for the full read-modify-write so a concurrent
        // save (or the Vault worker) cannot overwrite it and lose this write.
        let overflowEvicted = 0; // Oldest writes evicted only because queue was full
        await vaultMutex.acquire();
        try {
            const keys = getCacheKeys(userId);
            let queue = await getPendingWrites(userId);

            // PROTECTION 1: Remove entries that exceeded max retry count
            const initialLength = queue.length;
            queue = queue.filter((item) => (item.retryCount || 0) < MAX_RETRY_COUNT);
            const discarded = initialLength - queue.length;
            if (discarded > 0) {
                console.warn(
                    `[Vault] Discarded ${discarded} entries that exceeded max retries`,
                );
            }

            // PROTECTION 2: Enforce max queue size (FIFO - keep most recent).
            // The NEW write always gets in; only OLD writes are evicted. We surface
            // this to the caller (overflow) so the user is warned — silently losing
            // a queued write violates "NUNCA perder datos del usuario".
            if (queue.length >= MAX_QUEUE_SIZE) {
                const kept = queue.slice(-MAX_QUEUE_SIZE + 1);
                overflowEvicted = queue.length - kept.length;
                console.warn(
                    `[Vault] Queue at max size (${MAX_QUEUE_SIZE}), evicting ${overflowEvicted} oldest entr${overflowEvicted === 1 ? 'y' : 'ies'}`,
                );
                queue = kept;
            }

            // PROTECTION 3: Deduplication - update existing entry instead of creating duplicate
            const existingIndex = queue.findIndex(
                (item) => item.id === deterministicId,
            );
            if (existingIndex >= 0) {
                queue[existingIndex] = {
                    ...queue[existingIndex],
                    operation: 'insert',
                    data, // Update with latest data
                    timestamp: new Date().toLocaleString('en-US', {
                        timeZone: 'America/Argentina/Buenos_Aires',
                    }),
                    retryCount: 0, // Reset retry count on update
                    lastAttemptAt: undefined, // Fresh data → eligible immediately
                };
            } else {
                // Create new pending write entry with Argentina timezone
                const pendingWrite: PendingWrite = {
                    id: deterministicId, // Deterministic ID prevents duplicates
                    table,
                    operation: 'insert',
                    data,
                    userId,
                    timestamp: new Date().toLocaleString('en-US', {
                        timeZone: 'America/Argentina/Buenos_Aires',
                    }), // CRITICAL: Argentina TZ
                    retryCount: 0,
                };
                queue.push(pendingWrite);
            }

            await storage.set(keys.PENDING_SYNC, JSON.stringify(queue));
        } finally {
            vaultMutex.release();
        }

        // Zero Silent Failures: the new write was saved, but evicting older queued
        // writes means data the user expected to sync is gone. Warn explicitly.
        // (Lazy import keeps this pure util free of a hard React/context dependency.)
        if (overflowEvicted > 0) {
            try {
                const [{ toast }, { default: i18n }] = await Promise.all([
                    import('../context/ToastContext'),
                    import('../i18n/config'),
                ]);
                toast.error(i18n.t('toast.vaultOverflow'));
            } catch (notifyErr) {
                console.error('[Vault] Failed to surface overflow warning:', notifyErr);
            }
        }

        return {
            success: true,
            overflow: overflowEvicted > 0,
            discarded: overflowEvicted,
        };
    } catch (err) {
        console.error('[Vault] Failed to add pending write:', err);
        return { success: false, overflow: false, discarded: 0 };
    }
};

/**
 * Queue a failed DELETE so it is retried when back online. Unlike inserts,
 * deletes only need the row id (no date payload).
 * @param {string} table - Table name (e.g., 'food_log', 'workouts')
 * @param {string} id - Row id to delete in Supabase
 * @param {string} userId - User ID for the user-specific queue
 * @returns {Promise<boolean>} Success status
 */
export const addPendingDelete = async (
    table: string,
    id: string,
    userId: string,
): Promise<boolean> => {
    try {
        if (!userId) {
            console.error('[Vault] Cannot add pending delete without userId');
            return false;
        }
        if (!id) {
            console.error('[Vault] Cannot add pending delete without id');
            return false;
        }

        const deterministicId = `${table}_${userId}_delete_${id}`;

        await vaultMutex.acquire();
        try {
            const keys = getCacheKeys(userId);
            let queue = await getPendingWrites(userId);

            queue = queue.filter((item) => (item.retryCount || 0) < MAX_RETRY_COUNT);
            if (queue.length >= MAX_QUEUE_SIZE) {
                queue = queue.slice(-MAX_QUEUE_SIZE + 1);
            }

            // If an insert for this same row is still pending, it never reached the
            // cloud — cancel it out instead of queuing a delete for a non-existent row.
            const pendingInsertIdx = queue.findIndex(
                (item) =>
                    item.table === table &&
                    (item.operation ?? 'insert') === 'insert' &&
                    item.data?.id === id,
            );
            if (pendingInsertIdx >= 0) {
                queue.splice(pendingInsertIdx, 1);
                await storage.set(keys.PENDING_SYNC, JSON.stringify(queue));
                return true;
            }

            const existingIndex = queue.findIndex(
                (item) => item.id === deterministicId,
            );
            if (existingIndex < 0) {
                queue.push({
                    id: deterministicId,
                    table,
                    operation: 'delete',
                    data: { id },
                    userId,
                    timestamp: new Date().toLocaleString('en-US', {
                        timeZone: 'America/Argentina/Buenos_Aires',
                    }),
                    retryCount: 0,
                });
            }

            await storage.set(keys.PENDING_SYNC, JSON.stringify(queue));
        } finally {
            vaultMutex.release();
        }

        return true;
    } catch (err) {
        console.error('[Vault] Failed to add pending delete:', err);
        return false;
    }
};

/**
 * Get all pending writes from the queue
 * @param {string} userId - Optional user ID for user-specific queue
 * @returns {Promise<Array>} Array of pending write objects
 */
export const getPendingWrites = async (userId?: string): Promise<PendingWrite[]> => {
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const item = await storage.get(keys.PENDING_SYNC);
        return safeParse(item, []);
    } catch (err) {
        console.error('[Vault] Failed to get pending writes:', err);
        return [];
    }
};

/**
 * Remove a successfully synced write from the queue
 * @param {string} id - Pending write ID
 * @param {string} userId - Optional user ID for user-specific queue
 * @returns {Promise<boolean>} Success status
 */
export const removePendingWrite = async (id: string, userId?: string): Promise<boolean> => {
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const queue = await getPendingWrites(userId);
        const filtered = queue.filter((item) => item.id !== id);

        await storage.set(keys.PENDING_SYNC, JSON.stringify(filtered));
        return true;
    } catch (err) {
        console.error('[Vault] Failed to remove pending write:', err);
        return false;
    }
};

/**
 * Increment retry count for a pending write
 * @param {string} id - Pending write ID
 * @param {string} userId - Optional user ID for user-specific queue
 * @returns {Promise<boolean>} Success status
 */
export const incrementRetryCount = async (id: string, userId?: string): Promise<boolean> => {
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const queue = await getPendingWrites(userId);
        const item = queue.find((w) => w.id === id);

        if (item) {
            item.retryCount = (item.retryCount || 0) + 1;
            item.lastAttemptAt = Date.now();
            await storage.set(keys.PENDING_SYNC, JSON.stringify(queue));
            return true;
        }
        return false;
    } catch (err) {
        console.error('[Vault] Failed to increment retry count:', err);
        return false;
    }
};

/**
 * Remove multiple pending writes in a single operation (reduces localStorage writes)
 * CRITICAL: Batching prevents UI blocking from multiple setItem() calls
 * @param {string[]} ids - Array of pending write IDs to remove
 * @param {string} userId - Optional user ID for user-specific queue
 * @returns {Promise<boolean>} Success status
 */
export const removePendingWritesBatch = async (ids: string[], userId?: string): Promise<boolean> => {
    await vaultMutex.acquire();
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const queue = await getPendingWrites(userId);
        const idsSet = new Set(ids);
        const filtered = queue.filter((item) => !idsSet.has(item.id));

        await storage.set(keys.PENDING_SYNC, JSON.stringify(filtered));
        return true;
    } catch (err) {
        console.error('[Vault] Failed to batch remove pending writes:', err);
        return false;
    } finally {
        vaultMutex.release();
    }
};

/**
 * Increment retry counts for multiple pending writes in a single operation
 * CRITICAL: Batching prevents UI blocking from multiple setItem() calls
 * @param {string[]} ids - Array of pending write IDs
 * @param {string} userId - Optional user ID for user-specific queue
 * @returns {Promise<boolean>} Success status
 */
export const incrementRetryCountsBatch = async (ids: string[], userId?: string): Promise<boolean> => {
    await vaultMutex.acquire();
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const queue = await getPendingWrites(userId);
        const idsSet = new Set(ids);
        const now = Date.now();

        queue.forEach((item) => {
            if (idsSet.has(item.id)) {
                item.retryCount = (item.retryCount || 0) + 1;
                // Stamp the attempt so the Vault worker can apply per-item
                // exponential backoff (30s → 60s → 120s) before the next try.
                item.lastAttemptAt = now;
            }
        });

        await storage.set(keys.PENDING_SYNC, JSON.stringify(queue));
        return true;
    } catch (err) {
        console.error('[Vault] Failed to batch increment retry counts:', err);
        return false;
    } finally {
        vaultMutex.release();
    }
};

/**
 * Clear all pending writes (use on logout or reset)
 * @param {string} userId - Optional user ID for user-specific queue
 * @returns {Promise<boolean>} Success status
 */
export const clearPendingWrites = async (userId?: string): Promise<boolean> => {
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        await storage.remove(keys.PENDING_SYNC);
        return true;
    } catch (err) {
        console.error('[Vault] Failed to clear pending writes:', err);
        return false;
    }
};

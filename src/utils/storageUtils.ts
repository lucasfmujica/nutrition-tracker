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

const safeParse = <T>(item: StorageItem | null, defaultValue: T): T => {
    if (!item?.value) return defaultValue;
    try {
        return JSON.parse(item.value);
    } catch (e) {
        console.warn('Error parsing cached item:', e);
        return defaultValue;
    }
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
        localProfile: safeParse(profileData, null),
        localWeight: safeParse(weightData, []),
        localFood: safeParse(foodData, []),
        localWorkout: safeParse(workoutData, []),
        localSteps: safeParse(stepsData, []),
        localTargets: safeParse(targetsData, null),
        localOura: safeParse(ouraData, []),
        localWater: safeParse(waterData, []),
        localTemplates: safeParse(templatesData, []),
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

/**
 * Update cache metadata after successful Supabase sync
 * Uses Argentina timezone (browser local time already in -03:00)
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
    }
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
        const age = Date.now() - dataMetadata.lastSynced;
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
}

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
): Promise<boolean> => {
    try {
        // CRITICAL: Validate inputs to prevent data corruption
        if (!userId) {
            console.error('[Vault] Cannot add pending write without userId');
            return false;
        }

        if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            console.error(
                '[Vault] Invalid date format (expected YYYY-MM-DD):',
                data.date,
            );
            return false;
        }

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

        // PROTECTION 2: Enforce max queue size (FIFO - keep most recent)
        if (queue.length >= MAX_QUEUE_SIZE) {
            console.warn(
                `[Vault] Queue at max size (${MAX_QUEUE_SIZE}), removing oldest entries`,
            );
            queue = queue.slice(-MAX_QUEUE_SIZE + 1);
        }

        // CRITICAL: Deterministic ID to prevent duplicates on double-click
        const deterministicId = `${table}_${userId}_${data.date}`;

        // PROTECTION 3: Deduplication - update existing entry instead of creating duplicate
        const existingIndex = queue.findIndex((item) => item.id === deterministicId);
        if (existingIndex >= 0) {
            queue[existingIndex] = {
                ...queue[existingIndex],
                data, // Update with latest data
                timestamp: new Date().toLocaleString('en-US', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                }),
                retryCount: 0, // Reset retry count on update
            };
        } else {
            // Create new pending write entry with Argentina timezone
            const pendingWrite: PendingWrite = {
                id: deterministicId, // Deterministic ID prevents duplicates
                table,
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

        return true;
    } catch (err) {
        console.error('[Vault] Failed to add pending write:', err);
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
    try {
        const keys = userId ? getCacheKeys(userId) : LEGACY_CACHE_KEYS;
        const queue = await getPendingWrites(userId);
        const idsSet = new Set(ids);

        queue.forEach((item) => {
            if (idsSet.has(item.id)) {
                item.retryCount = (item.retryCount || 0) + 1;
            }
        });

        await storage.set(keys.PENDING_SYNC, JSON.stringify(queue));
        return true;
    } catch (err) {
        console.error('[Vault] Failed to batch increment retry counts:', err);
        return false;
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

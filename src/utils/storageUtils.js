import { storage } from './storage';

export const CACHE_KEYS = {
  PROFILE: 'lucas-profile-v5',
  WEIGHT: 'lucas-weight-history-v5',
  FOOD: 'lucas-food-log-v5',
  WORKOUT: 'lucas-workout-log-v5',
  STEPS: 'lucas-steps-log-v5',
  TARGETS: 'lucas-targets-v5',
  OURA: 'lucas-oura-log-v5',
  WATER: 'lucas-water-log-v5',
  PENDING_SYNC: 'lucas-pending-sync-v1' // The Vault - offline resilience queue
};

const safeParse = (item, defaultValue) => {
  if (!item?.value) return defaultValue;
  try {
    return JSON.parse(item.value);
  } catch (e) {
    console.warn('Error parsing cached item:', e);
    return defaultValue;
  }
};

export const loadCachedData = async () => {
  const [
    profileData,
    weightData,
    foodData,
    workoutData,
    stepsData,
    targetsData,
    ouraData,
    waterData
  ] = await Promise.all([
    storage.get(CACHE_KEYS.PROFILE).catch(() => null),
    storage.get(CACHE_KEYS.WEIGHT).catch(() => null),
    storage.get(CACHE_KEYS.FOOD).catch(() => null),
    storage.get(CACHE_KEYS.WORKOUT).catch(() => null),
    storage.get(CACHE_KEYS.STEPS).catch(() => null),
    storage.get(CACHE_KEYS.TARGETS).catch(() => null),
    storage.get(CACHE_KEYS.OURA).catch(() => null),
    storage.get(CACHE_KEYS.WATER).catch(() => null)
  ]);

  return {
    localProfile: safeParse(profileData, null),
    localWeight: safeParse(weightData, []),
    localFood: safeParse(foodData, []),
    localWorkout: safeParse(workoutData, []),
    localSteps: safeParse(stepsData, []),
    localTargets: safeParse(targetsData, null),
    localOura: safeParse(ouraData, []),
    localWater: safeParse(waterData, [])
  };
};

export const cacheData = async (data) => {
  try {
    const promises = [];

    // Profile & Targets: only if they exist
    if (data.profile) promises.push(storage.set(CACHE_KEYS.PROFILE, JSON.stringify(data.profile)));
    if (data.targets) promises.push(storage.set(CACHE_KEYS.TARGETS, JSON.stringify(data.targets)));

    // CRITICAL FIX: Arrays - ALWAYS update cache to reflect Supabase (even if empty)
    // This ensures cache is a mirror of the cloud, not a competitor
    if (data.weightHistory !== undefined) promises.push(storage.set(CACHE_KEYS.WEIGHT, JSON.stringify(data.weightHistory)));
    if (data.foodLog !== undefined) promises.push(storage.set(CACHE_KEYS.FOOD, JSON.stringify(data.foodLog)));
    if (data.workouts !== undefined) promises.push(storage.set(CACHE_KEYS.WORKOUT, JSON.stringify(data.workouts)));
    if (data.stepsLog !== undefined) promises.push(storage.set(CACHE_KEYS.STEPS, JSON.stringify(data.stepsLog)));
    if (data.ouraLog !== undefined) promises.push(storage.set(CACHE_KEYS.OURA, JSON.stringify(data.ouraLog)));  // ← FIX
    if (data.waterLog !== undefined) promises.push(storage.set(CACHE_KEYS.WATER, JSON.stringify(data.waterLog)));

    await Promise.all(promises);
    console.log('[Storage] Cache updated from Supabase');
    return true;
  } catch (err) {
    console.error('[Storage] Failed to cache data:', err);
    return false;
  }
};

export const clearCache = async () => {
  const keys = Object.values(CACHE_KEYS);
  for (const key of keys) {
    await storage.remove(key);
  }
};

// ============================================================================
// THE VAULT - Pending Writes Queue (Offline Resilience)
// ============================================================================

const MAX_QUEUE_SIZE = 100; // CRITICAL: Prevent infinite growth and UI blocking
const MAX_RETRY_COUNT = 5; // Maximum retry attempts before discarding

/**
 * Add a failed write to the pending sync queue
 * CRITICAL: Enforces MAX_QUEUE_SIZE and MAX_RETRY_COUNT limits
 * @param {string} table - Table name (e.g., 'oura_log', 'food_log')
 * @param {object} data - Entry data to sync
 * @param {string} userId - User ID for deduplication
 * @returns {Promise<boolean>} Success status
 */
export const addPendingWrite = async (table, data, userId) => {
  try {
    // CRITICAL: Validate inputs to prevent data corruption
    if (!userId) {
      console.error('[Vault] Cannot add pending write without userId');
      return false;
    }

    if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      console.error('[Vault] Invalid date format (expected YYYY-MM-DD):', data.date);
      return false;
    }

    let queue = await getPendingWrites();

    // PROTECTION 1: Remove entries that exceeded max retry count
    const initialLength = queue.length;
    queue = queue.filter(item => (item.retryCount || 0) < MAX_RETRY_COUNT);
    const discarded = initialLength - queue.length;
    if (discarded > 0) {
      console.warn(`[Vault] Discarded ${discarded} entries that exceeded max retries`);
    }

    // PROTECTION 2: Enforce max queue size (FIFO - keep most recent)
    if (queue.length >= MAX_QUEUE_SIZE) {
      console.warn(`[Vault] Queue at max size (${MAX_QUEUE_SIZE}), removing oldest entries`);
      queue = queue.slice(-MAX_QUEUE_SIZE + 1);
    }

    // CRITICAL: Deterministic ID to prevent duplicates on double-click
    const deterministicId = `${table}_${userId}_${data.date}`;

    // PROTECTION 3: Deduplication - update existing entry instead of creating duplicate
    const existingIndex = queue.findIndex(item => item.id === deterministicId);
    if (existingIndex >= 0) {
      console.log('[Vault] Updating existing pending write (prevents duplicate):', deterministicId);
      queue[existingIndex] = {
        ...queue[existingIndex],
        data, // Update with latest data
        timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }),
        retryCount: 0 // Reset retry count on update
      };
    } else {
      // Create new pending write entry with Argentina timezone
      const pendingWrite = {
        id: deterministicId, // Deterministic ID prevents duplicates
        table,
        data,
        userId,
        timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }), // CRITICAL: Argentina TZ
        retryCount: 0
      };
      queue.push(pendingWrite);
    }

    await storage.set(CACHE_KEYS.PENDING_SYNC, JSON.stringify(queue));

    console.log('[Vault] Pending write added:', {
      table,
      date: data.date,
      userId,
      queueSize: queue.length,
      deduplicated: existingIndex >= 0
    });
    return true;
  } catch (err) {
    console.error('[Vault] Failed to add pending write:', err);
    return false;
  }
};

/**
 * Get all pending writes from the queue
 * @returns {Promise<Array>} Array of pending write objects
 */
export const getPendingWrites = async () => {
  try {
    const item = await storage.get(CACHE_KEYS.PENDING_SYNC);
    return safeParse(item, []);
  } catch (err) {
    console.error('[Vault] Failed to get pending writes:', err);
    return [];
  }
};

/**
 * Remove a successfully synced write from the queue
 * @param {string} id - Pending write ID
 * @returns {Promise<boolean>} Success status
 */
export const removePendingWrite = async (id) => {
  try {
    const queue = await getPendingWrites();
    const filtered = queue.filter(item => item.id !== id);

    await storage.set(CACHE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
    console.log('[Vault] Pending write removed:', id);
    return true;
  } catch (err) {
    console.error('[Vault] Failed to remove pending write:', err);
    return false;
  }
};

/**
 * Increment retry count for a pending write
 * @param {string} id - Pending write ID
 * @returns {Promise<boolean>} Success status
 */
export const incrementRetryCount = async (id) => {
  try {
    const queue = await getPendingWrites();
    const item = queue.find(w => w.id === id);

    if (item) {
      item.retryCount = (item.retryCount || 0) + 1;
      await storage.set(CACHE_KEYS.PENDING_SYNC, JSON.stringify(queue));
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
 * @returns {Promise<boolean>} Success status
 */
export const removePendingWritesBatch = async (ids) => {
  try {
    const queue = await getPendingWrites();
    const idsSet = new Set(ids);
    const filtered = queue.filter(item => !idsSet.has(item.id));

    await storage.set(CACHE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
    console.log(`[Vault] Batch removed ${ids.length} pending writes`);
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
 * @returns {Promise<boolean>} Success status
 */
export const incrementRetryCountsBatch = async (ids) => {
  try {
    const queue = await getPendingWrites();
    const idsSet = new Set(ids);

    queue.forEach(item => {
      if (idsSet.has(item.id)) {
        item.retryCount = (item.retryCount || 0) + 1;
      }
    });

    await storage.set(CACHE_KEYS.PENDING_SYNC, JSON.stringify(queue));
    console.log(`[Vault] Batch incremented retry count for ${ids.length} items`);
    return true;
  } catch (err) {
    console.error('[Vault] Failed to batch increment retry counts:', err);
    return false;
  }
};

/**
 * Clear all pending writes (use on logout or reset)
 * @returns {Promise<boolean>} Success status
 */
export const clearPendingWrites = async () => {
  try {
    await storage.remove(CACHE_KEYS.PENDING_SYNC);
    console.log('[Vault] All pending writes cleared');
    return true;
  } catch (err) {
    console.error('[Vault] Failed to clear pending writes:', err);
    return false;
  }
};

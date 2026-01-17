import { useEffect, useRef } from 'react';
import { cacheData, getPendingWrites, incrementRetryCountsBatch, removePendingWritesBatch } from '../../utils/storageUtils';

/**
 * useVaultWorker - Specialized hook for processing The Vault (offline resilience queue)
 *
 * RESPONSIBILITY: Exclusive handling of pending writes queue processing
 * - Processes queue in batches using requestIdleCallback for UI performance
 * - Auto-triggers when network comes back online
 * - Validates userId to prevent cross-user data corruption
 * - Refreshes data after successful sync
 *
 * @param {Object} params - Hook parameters
 * @param {Object} params.supabase - Supabase client with user and save methods
 * @param {boolean} params.useCloud - Whether cloud sync is enabled
 * @param {boolean} params.isOnline - Network online status
 * @param {boolean} params.isAuthenticated - User authentication status
 * @param {boolean} params.offlineMode - Offline mode flag
 * @param {Function} params.setProfile - Profile state setter
 * @param {Function} params.setCustomTargets - Custom targets state setter
 * @param {Function} params.setWeightHistory - Weight history state setter
 * @param {Function} params.setFoodLog - Food log state setter
 * @param {Function} params.setWorkoutLog - Workout log state setter
 * @param {Function} params.setStepsLog - Steps log state setter
 * @param {Function} params.setOuraLog - Oura log state setter
 * @param {Function} params.setWaterLog - Water log state setter
 * @returns {Object} - { processPendingQueue, isProcessingQueue }
 */
export const useVaultWorker = ({
  supabase,
  useCloud,
  isOnline,
  isAuthenticated,
  offlineMode,
  setProfile,
  setCustomTargets,
  setWeightHistory,
  setFoodLog,
  setWorkoutLog,
  setStepsLog,
  setOuraLog,
  setWaterLog
}) => {
  const isProcessingQueue = useRef(false); // CRITICAL: Prevent concurrent queue processing

  /**
   * Process a single pending write item
   * Helper function for batch processing
   * CRITICAL: Validates userId to prevent cross-user data corruption
   * @param {object} item - Pending write item
   * @returns {Promise<{success: boolean, id: string, error?: string}>}
   */
  const processSingleWrite = async (item) => {
    try {
      // CRITICAL: Verify userId matches current user (prevent cross-user corruption)
      const currentUserId = supabase?.user?.id;
      if (item.userId !== currentUserId) {
        console.warn(`[Vault] SECURITY: Skipping item from different user. Queue userId: ${item.userId}, Current: ${currentUserId}`);
        return { success: true, id: item.id }; // Remove from queue without processing
      }

      let result;
      switch (item.table) {
        case 'oura_log':
          result = await supabase.saveOura(item.data);
          break;
        case 'steps_log':
          result = await supabase.saveSteps(item.data);
          break;
        case 'weight_history':
          result = await supabase.saveWeight(item.data);
          break;
        case 'food_log':
          result = await supabase.saveFood(item.data);
          break;
        case 'water_log':
          result = await supabase.saveWater(item.data);
          break;
        case 'workouts':
          result = await supabase.saveWorkout(item.data);
          break;
        default:
          console.warn(`[Vault] Unknown table: ${item.table}`);
          return { success: true, id: item.id }; // Remove unknown entries
      }

      if (result?.error) {
        throw new Error(result.error.message);
      }

      console.log(`[Vault] ✓ Synced ${item.table} for date ${item.data.date}`);
      return { success: true, id: item.id };
    } catch (err) {
      console.error(`[Vault] ✗ Failed to sync ${item.table} for date ${item.data.date}:`, err.message);
      return { success: false, id: item.id, error: err.message };
    }
  };

  /**
   * Process pending writes from The Vault (offline resilience queue)
   * CRITICAL: Uses batch processing with requestIdleCallback to prevent UI blocking
   * @returns {Promise<{success: boolean, synced: number, failed: number}>}
   */
  const processPendingQueue = async () => {
    if (!useCloud) {
      console.log('[Vault] Cannot process queue - not connected to cloud');
      return { success: false, synced: 0, failed: 0 };
    }

    const queue = await getPendingWrites();
    if (queue.length === 0) {
      console.log('[Vault] Queue is empty, nothing to process');
      return { success: true, synced: 0, failed: 0 };
    }

    console.log(`[Vault] Processing ${queue.length} pending writes in batches...`);

    const BATCH_SIZE = 3; // Process 3 items at a time to prevent UI blocking
    let synced = 0;
    let failed = 0;

    // Process in batches for UI performance
    for (let i = 0; i < queue.length; i += BATCH_SIZE) {
      const batch = queue.slice(i, i + BATCH_SIZE);

      // Wait for idle time before processing batch (prevents UI blocking)
      await new Promise(resolve => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => resolve(), { timeout: 2000 });
        } else {
          setTimeout(resolve, 0); // Fallback for older browsers
        }
      });

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(item => processSingleWrite(item))
      );

      // Accumulate IDs for batch localStorage updates
      const successIds = [];
      const failedIds = [];

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successIds.push(batch[idx].id);
          synced++;
        } else {
          failedIds.push(batch[idx].id);
          failed++;
        }
      });

      // CRITICAL: Batch update localStorage to prevent multiple blocking setItem() calls
      if (successIds.length > 0) {
        await removePendingWritesBatch(successIds);
      }
      if (failedIds.length > 0) {
        await incrementRetryCountsBatch(failedIds);
      }

      // Yield to browser between batches
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const message = `[Vault] Queue processed: ${synced} synced, ${failed} failed`;
    console.log(message);

    return { success: true, synced, failed };
  };

  // Auto-trigger pending queue processing when coming back online
  // CRITICAL: Uses debouncing and lock to prevent concurrent processing
  useEffect(() => {
    if (!isAuthenticated || !isOnline || offlineMode) return;

    // Check if already processing
    if (isProcessingQueue.current) {
      console.log('[Vault] Queue processing already in progress, skipping');
      return;
    }

    // Debounce: wait 5s for stable connection (prevents network flapping)
    const timeoutId = setTimeout(async () => {
      isProcessingQueue.current = true;
      try {
        console.log('[Vault] Network stable, checking pending queue...');
        const result = await processPendingQueue();

        if (result.synced > 0) {
          // Delay refresh to allow UI to recover from queue processing
          setTimeout(async () => {
            console.log('[Vault] Queue processed successfully, refreshing data in background...');
            const data = await supabase.fetchAllData();
            if (data) {
              if (data.profile) setProfile(data.profile);
              if (data.targets) setCustomTargets(data.targets);
              if (data.weightHistory !== undefined) setWeightHistory(data.weightHistory);
              if (data.foodLog !== undefined) setFoodLog(data.foodLog);
              if (data.workouts !== undefined) setWorkoutLog(data.workouts);
              if (data.stepsLog !== undefined) setStepsLog(data.stepsLog);
              if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);
              if (data.waterLog !== undefined) setWaterLog(data.waterLog);
              await cacheData(data);
            }
          }, 1000); // 1s delay allows UI to breathe
        }
      } finally {
        isProcessingQueue.current = false;
      }
    }, 5000); // Increased from 2s to 5s for connection stability

    return () => clearTimeout(timeoutId);
  }, [isOnline, isAuthenticated, offlineMode]);

  return {
    processPendingQueue,
    isProcessingQueue: isProcessingQueue.current
  };
};

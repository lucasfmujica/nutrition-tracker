import { useCallback, useEffect, useRef } from 'react';
import {
    cacheData,
    getPendingWrites,
    incrementRetryCountsBatch,
    PendingWrite,
    removePendingWritesBatch,
    updateCacheMetadata,
} from '../../utils/storageUtils';

export interface UseVaultWorkerParams {
    supabase: any; // Using any for the composite hook return to avoid circular type dependency hell for now
    useCloud: boolean;
    isOnline: boolean;
    isAuthenticated: boolean;
    offlineMode: boolean;
    setProfile: (profile: any) => void;
    setCustomTargets: (targets: any) => void;
    setWeightHistory: (history: any[]) => void;
    setFoodLog: (log: any[]) => void;
    setWorkoutLog: (log: any[]) => void;
    setStepsLog: (log: any[]) => void;
    setOuraLog: (log: any[]) => void;
    setWaterLog: (log: any[]) => void;
    setMealTemplates: (templates: any[]) => void;
    setSyncStatus?: (status: string) => void; // Optional: For UI feedback during sync
}

export interface UseVaultWorkerReturn {
    processPendingQueue: () => Promise<{
        success: boolean;
        synced: number;
        failed: number;
    }>;
    isProcessingQueue: boolean;
}

/**
 * useVaultWorker - Specialized hook for processing The Vault (offline resilience queue)
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
    setWaterLog,
    setMealTemplates,
    setSyncStatus,
}: UseVaultWorkerParams): UseVaultWorkerReturn => {
    const isProcessingQueue = useRef(false); // CRITICAL: Prevent concurrent queue processing

    /**
     * Process a single pending write item
     * CRITICAL: Memoized to prevent re-creating processPendingQueue unnecessarily
     */
    const processSingleWrite = useCallback(async (item: PendingWrite) => {
        try {
            // CRITICAL: Verify userId matches current user (prevent cross-user corruption)
            const currentUserId = supabase?.user?.id;
            if (item.userId !== currentUserId) {
                console.warn(
                    `[Vault] SECURITY: Skipping item from different user. Queue userId: ${item.userId}, Current: ${currentUserId}`,
                );
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
                case 'meal_templates':
                    result = await supabase.saveTemplate(item.data);
                    break;
                default:
                    console.warn(`[Vault] Unknown table: ${item.table}`);
                    return { success: true, id: item.id }; // Remove unknown entries
            }

            if (result?.error) {
                throw new Error(result.error.message);
            }

            return { success: true, id: item.id };
        } catch (err: any) {
            console.error(
                `[Vault] ✗ Failed to sync ${item.table} for date ${item.data.date}:`,
                err.message,
            );
            return { success: false, id: item.id, error: err.message };
        }
    }, [supabase]);

    /**
     * Process pending writes from The Vault (offline resilience queue)
     * CRITICAL: Memoized with useCallback to prevent infinite re-renders in useEffect
     */
    const processPendingQueue = useCallback(async () => {
        if (!useCloud) {
            return { success: false, synced: 0, failed: 0 };
        }

        const userId = supabase?.user?.id;
        const queue = await getPendingWrites(userId);
        if (queue.length === 0) {
            return { success: true, synced: 0, failed: 0 };
        }

        // 🔒 UX IMPROVEMENT: Show loading indicator during Vault sync
        if (setSyncStatus) {
            setSyncStatus(`🔄 Sincronizando ${queue.length} ${queue.length === 1 ? 'entrada' : 'entradas'}...`);
        }

        const BATCH_SIZE = 3; // Process 3 items at a time to prevent UI blocking
        let synced = 0;
        let failed = 0;

        // Process in batches for UI performance
        for (let i = 0; i < queue.length; i += BATCH_SIZE) {
            const batch = queue.slice(i, i + BATCH_SIZE);

            // Wait for idle time before processing batch (prevents UI blocking)
            await new Promise<void>((resolve) => {
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(() => resolve(), { timeout: 2000 });
                } else {
                    setTimeout(resolve, 0); // Fallback for older browsers
                }
            });

            // Process batch in parallel
            const results = await Promise.allSettled(
                batch.map((item) => processSingleWrite(item)),
            );

            // Accumulate IDs for batch localStorage updates
            const successIds: string[] = [];
            const failedIds: string[] = [];

            results.forEach((result, idx) => {
                if (result.status === 'fulfilled' && (result.value as any).success) {
                    successIds.push(batch[idx].id);
                    synced++;
                } else {
                    failedIds.push(batch[idx].id);
                    failed++;
                }
            });

            // CRITICAL: Batch update localStorage to prevent multiple blocking setItem() calls
            if (successIds.length > 0) {
                await removePendingWritesBatch(successIds, userId);
            }
            if (failedIds.length > 0) {
                await incrementRetryCountsBatch(failedIds, userId);
            }

            // Yield to browser between batches
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        const message = `[Vault] Queue processed: ${synced} synced, ${failed} failed`;
        console.log(message);

        // 🔒 UX IMPROVEMENT: Show sync completion status
        if (setSyncStatus) {
            if (synced > 0 && failed === 0) {
                setSyncStatus(`✅ ${synced} ${synced === 1 ? 'entrada sincronizada' : 'entradas sincronizadas'}`);
                setTimeout(() => setSyncStatus(''), 3000); // Clear after 3s
            } else if (failed > 0) {
                setSyncStatus(`⚠️ ${synced} ok, ${failed} fallaron - Reintentando...`);
                setTimeout(() => setSyncStatus(''), 5000); // Keep error longer
            }
        }

        return { success: true, synced, failed };
    }, [useCloud, supabase, processSingleWrite, setSyncStatus]);

    // Auto-trigger pending queue processing when coming back online
    useEffect(() => {
        if (!isAuthenticated || !isOnline || offlineMode) return;

        // Check if already processing
        if (isProcessingQueue.current) {
            return;
        }

        // Debounce: wait 5s for stable connection (prevents network flapping)
        const timeoutId = setTimeout(async () => {
            isProcessingQueue.current = true;
            try {
                const result = await processPendingQueue();

                if (result.synced > 0) {
                    // Delay refresh to allow UI to recover from queue processing
                    setTimeout(async () => {
                        const userId = supabase?.user?.id;
                        const data = await supabase.fetchAllData();
                        if (data) {
                            if (data.profile) setProfile(data.profile);
                            if (data.targets) setCustomTargets(data.targets);
                            if (data.weightHistory !== undefined)
                                setWeightHistory(data.weightHistory);
                            if (data.foodLog !== undefined) setFoodLog(data.foodLog);
                            if (data.workouts !== undefined)
                                setWorkoutLog(data.workouts);
                            if (data.stepsLog !== undefined)
                                setStepsLog(data.stepsLog);
                            if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);
                            if (data.waterLog !== undefined)
                                setWaterLog(data.waterLog);
                            if (data.mealTemplates !== undefined)
                                setMealTemplates(data.mealTemplates);
                            await cacheData(data, userId);

                            // SWR PATTERN: Update metadata after Vault sync
                            const argentinaTimestamp = Date.now();
                            await Promise.all([
                                updateCacheMetadata('profile', userId, argentinaTimestamp),
                                updateCacheMetadata('targets', userId, argentinaTimestamp),
                                updateCacheMetadata('weight', userId, argentinaTimestamp),
                                updateCacheMetadata('food', userId, argentinaTimestamp),
                                updateCacheMetadata('workouts', userId, argentinaTimestamp),
                                updateCacheMetadata('steps', userId, argentinaTimestamp),
                                updateCacheMetadata('oura', userId, argentinaTimestamp),
                                updateCacheMetadata('water', userId, argentinaTimestamp),
                                updateCacheMetadata('templates', userId, argentinaTimestamp),
                            ]);
                        }
                    }, 1000); // 1s delay allows UI to breathe
                }
            } finally {
                isProcessingQueue.current = false;
            }
        }, 5000); // Increased from 2s to 5s for connection stability

        return () => clearTimeout(timeoutId);
    }, [isOnline, isAuthenticated, offlineMode, processPendingQueue, supabase]); // Added missing deps

    return {
        processPendingQueue,
        isProcessingQueue: isProcessingQueue.current,
    };
};

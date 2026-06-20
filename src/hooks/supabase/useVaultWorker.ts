import { useCallback, useEffect, useRef } from 'react';
import { toast } from '../../context/ToastContext';
import i18n from '../../i18n/config';
import {
    cacheData,
    getPendingWrites,
    incrementRetryCountsBatch,
    isPendingWriteDue,
    PendingWrite,
    removePendingWritesBatch,
    updateFreshCacheMetadata,
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

            // DELETE operations only carry an id; route them to the right deleter.
            if (item.operation === 'delete') {
                const deleteId = item.data?.id;
                if (!deleteId) {
                    console.warn('[Vault] Delete item without id, dropping:', item.id);
                    return { success: true, id: item.id };
                }
                switch (item.table) {
                    case 'food_log':
                        result = await supabase.deleteFood(deleteId);
                        break;
                    case 'workouts':
                        result = await supabase.deleteWorkout(deleteId);
                        break;
                    case 'weight_history':
                        result = await supabase.deleteWeight(deleteId);
                        break;
                    default:
                        console.warn(
                            `[Vault] Unsupported delete table: ${item.table}`,
                        );
                        return { success: true, id: item.id };
                }
                if (result?.error) {
                    throw new Error(result.error.message);
                }
                return { success: true, id: item.id };
            }

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
        // CRITICAL: Without a confirmed user (e.g. during the token-refresh window)
        // getPendingWrites(undefined) would read the WRONG (legacy) queue. Never
        // process anything until we know whose queue it is.
        if (!userId) {
            return { success: true, synced: 0, failed: 0 };
        }

        const fullQueue = await getPendingWrites(userId);
        if (fullQueue.length === 0) {
            return { success: true, synced: 0, failed: 0 };
        }

        // Per-item exponential backoff (CLAUDE.md: 0s → 30s → 60s → 120s).
        // Skip items still inside their backoff window since the last attempt.
        const now = Date.now();
        const queue = fullQueue.filter((item) => isPendingWriteDue(item, now));

        if (queue.length === 0) {
            // Everything in the queue is still inside its backoff window.
            return { success: true, synced: 0, failed: 0 };
        }

        // 🔒 UX IMPROVEMENT: Show loading indicator during Vault sync
        if (setSyncStatus) {
            setSyncStatus(`🔄 Sincronizando ${queue.length} ${queue.length === 1 ? 'entrada' : 'entradas'}...`);
        }

        const BATCH_SIZE = 3; // Process 3 items at a time to prevent UI blocking
        const MAX_RETRY_COUNT = 5; // Mirror of storageUtils limit (items dropped at this count)
        let synced = 0;
        let failed = 0;
        let exhausted = 0; // Items that just used their final retry

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
                    // Detect items that just exhausted their retries (The Vault
                    // will discard them on the next read) → user must know
                    if ((batch[idx].retryCount || 0) + 1 >= MAX_RETRY_COUNT) {
                        exhausted++;
                    }
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

        // Vault retries are silent by design (auto-retry every 30s); only alert
        // the user when items have exhausted ALL retries and will be discarded.
        if (exhausted > 0) {
            toast.error(i18n.t('toast.syncExhausted'));
        }

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

    // CRITICAL: Hold the latest closures in refs so the auto-trigger effect can run
    // on a STABLE schedule. Previously the effect depended on `processPendingQueue`
    // and `supabase` (both new identities every render), so the 5s debounce timer was
    // cancelled and restarted on each render and the queue could never drain.
    const processPendingQueueRef = useRef(processPendingQueue);
    processPendingQueueRef.current = processPendingQueue;
    const supabaseRef = useRef(supabase);
    supabaseRef.current = supabase;

    const drainAndRefresh = useCallback(async () => {
        if (isProcessingQueue.current) return;
        isProcessingQueue.current = true;
        try {
            const result = await processPendingQueueRef.current();
            if (result.synced > 0) {
                const sb = supabaseRef.current;
                const userId = sb?.user?.id;
                const data = await sb.fetchAllData();
                if (data) {
                    if (data.profile) setProfile(data.profile);
                    if (data.targets) setCustomTargets(data.targets);
                    if (data.weightHistory !== undefined)
                        setWeightHistory(data.weightHistory);
                    if (data.foodLog !== undefined) setFoodLog(data.foodLog);
                    if (data.workouts !== undefined) setWorkoutLog(data.workouts);
                    if (data.stepsLog !== undefined) setStepsLog(data.stepsLog);
                    if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);
                    if (data.waterLog !== undefined) setWaterLog(data.waterLog);
                    if (data.mealTemplates !== undefined)
                        setMealTemplates(data.mealTemplates);
                    await cacheData(data, userId);

                    await updateFreshCacheMetadata(
                        data.freshDataTypes || [],
                        userId,
                    );
                }
            }
        } catch (err) {
            console.error('[Vault] drainAndRefresh error:', err);
        } finally {
            isProcessingQueue.current = false;
        }
    }, [
        setProfile,
        setCustomTargets,
        setWeightHistory,
        setFoodLog,
        setWorkoutLog,
        setStepsLog,
        setOuraLog,
        setWaterLog,
        setMealTemplates,
    ]);

    // CRITICAL: Like processPendingQueueRef, hold the latest drainAndRefresh in a ref
    // so the scheduler effect can depend ONLY on the connectivity primitives. Otherwise
    // drainAndRefresh's identity (which changes whenever the domain setters change)
    // would tear down and rebuild the 30s setInterval on every render — so the poll
    // could be cancelled before it ever fires and the queue would never drain.
    const drainRef = useRef(drainAndRefresh);
    drainRef.current = drainAndRefresh;

    // Auto-trigger: debounce 5s on (re)connection, then poll every 30s while online.
    // Keyed ONLY on connectivity flags so the schedule is stable across renders.
    useEffect(() => {
        if (!isAuthenticated || !isOnline || offlineMode) return;

        const debounceId = setTimeout(() => {
            void drainRef.current();
        }, 5000); // Wait 5s for a stable connection (prevents network flapping)

        const intervalId = setInterval(() => {
            void drainRef.current();
        }, 30000); // CLAUDE.md: process The Vault every 30 seconds

        return () => {
            clearTimeout(debounceId);
            clearInterval(intervalId);
        };
    }, [isOnline, isAuthenticated, offlineMode]);

    // Public entry point: respects the same concurrency guard as the scheduler so a
    // manual drain (e.g. on logout/refresh) can't run in parallel with drainAndRefresh
    // and double-process / overwrite the queue.
    const guardedProcessPendingQueue = useCallback(async () => {
        if (isProcessingQueue.current) {
            return { success: false, synced: 0, failed: 0 };
        }
        isProcessingQueue.current = true;
        try {
            return await processPendingQueueRef.current();
        } finally {
            isProcessingQueue.current = false;
        }
    }, []);

    return {
        processPendingQueue: guardedProcessPendingQueue,
        // isProcessingQueue is a ref (not reactive). Expose its CURRENT value via a
        // getter so callers always read the live flag instead of a stale snapshot
        // captured at render time.
        get isProcessingQueue() {
            return isProcessingQueue.current;
        },
    };
};

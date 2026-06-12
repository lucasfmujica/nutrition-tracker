import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {
    CustomTargets,
    FoodEntry,
    OuraEntry,
    Profile,
    StepsEntry,
    WaterEntry,
    WeightEntry,
    Workout,
} from '../types/domain';
import { toast } from '../context/ToastContext';
import i18n from '../i18n/config';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import {
    clearCache,
    clearPendingWrites,
    getPendingWrites,
    isCacheStale,
    updateFreshCacheMetadata,
} from '../utils/storageUtils';
import type { SupabaseDataSnapshot } from './useSupabase';
import { useInitialHydration } from './supabase/useInitialHydration';
import { useVaultWorker } from './supabase/useVaultWorker';

interface TrackerSyncParams {
    supabase: any; // Dependency injected
    useCloud: boolean; // ← CRITICAL FIX: Receive unified useCloud from parent
    offlineMode: boolean;
    setOfflineMode: Dispatch<SetStateAction<boolean>>;
    setProfile: (profile: Profile) => void;
    setCustomTargets: (targets: CustomTargets) => void;
    setWeightHistory: (history: WeightEntry[]) => void;
    setFoodLog: (log: FoodEntry[]) => void;
    setWorkoutLog: (log: Workout[]) => void;
    setStepsLog: (log: StepsEntry[]) => void;
    setOuraLog: (log: OuraEntry[]) => void;
    setWaterLog: (log: WaterEntry[]) => void;
    setMealTemplates: (templates: any[]) => void;
    setSyncStatus?: (status: string) => void; // Optional: For UI feedback during sync
    // Data needed for forceSync
    foodLog: FoodEntry[];
    workoutLog: Workout[];
    stepsLog: StepsEntry[];
    ouraLog: OuraEntry[];
    waterLog: WaterEntry[];
    weightHistory: WeightEntry[];
}

/**
 * useTrackerSync - Lightweight orchestrator for tracker data synchronization
 *
 * RESPONSIBILITY: High-level coordination of sync operations
 * - Manages auth state and UI visibility
 * - Delegates queue processing to useVaultWorker
 * - Delegates data loading to useInitialHydration
 * - Handles refresh and logout flows
 *
 * This hook has been refactored from 420 lines to ~180 lines by extracting:
 * - Queue processing → useVaultWorker
 * - Data loading → useInitialHydration
 */
export const useTrackerSync = ({
    supabase,
    useCloud,
    offlineMode,
    setOfflineMode,
    setProfile,
    setCustomTargets,
    setWeightHistory,
    setFoodLog,
    setWorkoutLog,
    setStepsLog,
    setOuraLog,
    setWaterLog,
    setMealTemplates,
    setSyncStatus, // For Vault sync UI feedback
    // Data needed for forceSync (unused currently but kept for potential features)
    foodLog,
    workoutLog,
    stepsLog,
    ouraLog,
    waterLog,
    weightHistory,
}: TrackerSyncParams) => {
    const [showAuth, setShowAuth] = useState<boolean | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheStale, setCacheStale] = useState(false); // SWR: Track cache staleness for UI indicator

    const hasInitialized = useRef(false);

    // Get userId for user-specific storage operations
    const userId = supabase.user?.id;

    // SWR PATTERN: Monitor cache staleness for UI indicator
    // Checks every minute if any critical data is stale
    useEffect(() => {
        let isMounted = true;

        const checkStaleness = async () => {
            try {
                // Parallelize checks but be mindful of resource impact
                const [foodStale, workoutStale, weightStale] = await Promise.all([
                    isCacheStale('food', userId),
                    isCacheStale('workouts', userId),
                    isCacheStale('weight', userId),
                ]);

                if (isMounted) {
                    setCacheStale(foodStale || workoutStale || weightStale);
                }
            } catch (err) {
                console.error('[Sync] Error checking staleness:', err);
            }
        };

        // Initial check
        checkStaleness();

        // Check every minute
        const interval = setInterval(checkStaleness, 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [userId]);

    // NOTE: useCloud is now passed from TrackerContext (single source of truth)

    // Vault Worker: Handles queue processing and auto-trigger
    const { processPendingQueue } = useVaultWorker({
        supabase,
        useCloud,
        isOnline: supabase.isOnline,
        isAuthenticated: supabase.isAuthenticated,
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
        setSyncStatus: setSyncStatus || setSaveStatus, // Use provided or fallback to saveStatus
    });

    // Initial Hydration: Handles data loading from cache and Supabase
    useInitialHydration({
        supabase,
        showAuth,
        offlineMode,
        hasInitialized,
        setProfile,
        setCustomTargets,
        setWeightHistory,
        setFoodLog,
        setWorkoutLog,
        setStepsLog,
        setOuraLog,
        setWaterLog,
        setMealTemplates,
        setIsLoading,
        setSaveStatus,
        setShowOnboarding,
        setCacheStale, // SWR: Allow hydration to clear stale state
    });

    // Handle auth state changes
    useEffect(() => {
        console.log(`[TrackerSync ${new Date().toISOString()}] Auth state check:`, {
            loading: supabase.loading,
            isAuthenticated: supabase.isAuthenticated,
            isOnline: supabase.isOnline,
            hasUser: !!supabase.user,
        });

        if (supabase.loading) {
            console.log(`[TrackerSync ${new Date().toISOString()}] Supabase still loading, waiting...`);
            return;
        }

        if (supabase.isAuthenticated) {
            console.log(`[TrackerSync ${new Date().toISOString()}] User authenticated, hiding auth screen`);
            setShowAuth(false);
            // 🔒 Mark auth as completed for SW reload safety
            sessionStorage.setItem('auth-completed', 'true');
        } else {
            console.log(`[TrackerSync ${new Date().toISOString()}] User not authenticated, showing auth screen`);
            setShowAuth(true);
            setIsLoading(false); // Stop loading so AuthUI can be shown
            hasInitialized.current = false;
            // Clear auth-completed flag when logged out
            sessionStorage.removeItem('auth-completed');
        }
    }, [supabase.loading, supabase.isAuthenticated]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            if (useCloud) {
                const data = await retryWithBackoff<SupabaseDataSnapshot | null>(
                    () => supabase.fetchAllData(),
                    3, // max 3 retries
                    1000 // base delay 1s
                );
                if (data) {
                    // Supabase is source of truth - always sync (even empty arrays)
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

                    await updateFreshCacheMetadata(data.freshDataTypes, userId);

                    setCacheStale(data.freshDataTypes.length < 9);

                    setSaveStatus(
                        data.freshDataTypes.length < 9
                            ? '⚠ Actualización parcial'
                            : '✓ Actualizado',
                    );
                    console.log(`[handleRefresh ${new Date().toISOString()}] Data updated successfully`);
                } else {
                    setSaveStatus('Error al actualizar');
                    toast.error(i18n.t('toast.refreshError'));
                }
            } else {
                console.log(`[handleRefresh ${new Date().toISOString()}] useCloud is false, skipping fetch`);
            }
        } catch (err) {
            console.error(`[TrackerSync ${new Date().toISOString()}] Refresh error:`, err);
            setSaveStatus('Error al actualizar');
            toast.error(i18n.t('toast.refreshError'));
        } finally {
            setIsRefreshing(false);
            setTimeout(() => setSaveStatus(''), 2000);
        }
    };

    // Handle Logout
    const handleLogout = async () => {
        try {
            hasInitialized.current = false;
            setOfflineMode(false);
            setIsLoading(false);

            await clearCache(userId);

            // CRITICAL: Never destroy unsynced writes on logout. The queue is already
            // user-scoped, so try to flush it first; only clear it if it actually drained.
            try {
                if (supabase.isOnline) {
                    await processPendingQueue();
                }
                const remaining = await getPendingWrites(userId);
                if (remaining.length === 0) {
                    await clearPendingWrites(userId);
                } else {
                    console.warn(
                        `[TrackerSync] Logout: keeping ${remaining.length} unsynced write(s) for next login.`,
                    );
                }
            } catch (drainErr) {
                // If draining fails, preserve the queue rather than lose data.
                console.error('[TrackerSync] Logout drain failed, preserving queue:', drainErr);
            }

            // Reset state (setters)
            setProfile({
                id: 'default',
                userId: 'default',
                name: 'Usuario',
                avatar: null,
                height: 173,
                currentWeight: 84.9,
                targetWeight: 75,
                stepGoal: 10000,
                age: 27,
                activityLevel: 'moderate',
                goal: 'cut',
                targetCalories: 2100,
                targetProtein: 170,
                targetCarbs: 180,
                targetFat: 70,
                targetFiber: 30,
                trainingDayCaloriesBonus: 200,
                trainingDayCarbs: 220,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            setCustomTargets({
                calories: 2100,
                protein: 170,
                carbs: 180,
                fat: 70,
                fiber: 30,
                trainingDayCaloriesBonus: 200,
                trainingDayCarbs: 220,
            });
            setWeightHistory([]);
            setFoodLog([]);
            setWorkoutLog([]);
            setStepsLog([]);
            setOuraLog([]);
            setWaterLog([]);
            setMealTemplates([]);

            await supabase.signOut();
            setShowAuth(true);
        } catch (err) {
            console.error('Logout error:', err);
            setShowAuth(true);
        }
    };

    return {
        showAuth,
        setShowAuth,
        showOnboarding,
        setShowOnboarding,
        offlineMode,
        setOfflineMode, // Passed through from TrackerContext
        isLoading,
        setIsLoading,
        saveStatus,
        setSaveStatus,
        isRefreshing,
        handleRefresh,
        cacheStale, // SWR: Expose staleness state for UI indicator
        // useCloud removed - now managed in TrackerContext as single source of truth
        processPendingQueue, // The Vault auto-recovery worker
        handleLogout,
    };
};

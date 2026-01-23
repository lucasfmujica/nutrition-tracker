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
import {
    clearCache,
    clearPendingWrites,
    isCacheStale,
    updateCacheMetadata,
} from '../utils/storageUtils';
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

    // SWR PATTERN: Monitor cache staleness for UI indicator
    // Checks every minute if any critical data is stale
    useEffect(() => {
        let isMounted = true;

        const checkStaleness = async () => {
            try {
                // Parallelize checks but be mindful of resource impact
                const [foodStale, workoutStale, weightStale] = await Promise.all([
                    isCacheStale('food'),
                    isCacheStale('workouts'),
                    isCacheStale('weight'),
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
    }, []);

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
        if (supabase.loading) return;

        if (supabase.isAuthenticated) {
            console.log('[Auth] User authenticated, hiding auth screen');
            setShowAuth(false);
        } else {
            console.log('[Auth] User not authenticated, showing auth screen');
            setShowAuth(true);
            setIsLoading(false); // Stop loading so AuthUI can be shown
            hasInitialized.current = false;
        }
    }, [supabase.loading, supabase.isAuthenticated]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            if (useCloud) {
                const data = await supabase.fetchAllData();
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

                    // SWR PATTERN: Update metadata after manual refresh
                    const argentinaTimestamp = Date.now();
                    await Promise.all([
                        updateCacheMetadata('profile', argentinaTimestamp),
                        updateCacheMetadata('targets', argentinaTimestamp),
                        updateCacheMetadata('weight', argentinaTimestamp),
                        updateCacheMetadata('food', argentinaTimestamp),
                        updateCacheMetadata('workouts', argentinaTimestamp),
                        updateCacheMetadata('steps', argentinaTimestamp),
                        updateCacheMetadata('oura', argentinaTimestamp),
                        updateCacheMetadata('water', argentinaTimestamp),
                        updateCacheMetadata('templates', argentinaTimestamp),
                    ]);

                    // Clear stale flag immediately
                    setCacheStale(false);

                    setSaveStatus('✓ Actualizado');
                    console.log('[handleRefresh] Data updated successfully');
                } else {
                    setSaveStatus('Error al actualizar');
                }
            } else {
                console.log('[handleRefresh] useCloud is false, skipping fetch');
            }
        } catch (err) {
            console.error('[TrackerSync] Refresh error:', err);
            setSaveStatus('Error al actualizar');
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

            await clearCache();
            await clearPendingWrites(); // CRITICAL: Prevent cross-user data corruption

            // Reset state (setters)
            setProfile({
                id: 'default',
                userId: 'default',
                name: 'Lucas Mujica',
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

import { MutableRefObject, useEffect, useRef } from 'react';
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
} from '../../types/domain';
import {
    cacheData,
    isCacheStale,
    loadCachedData,
    updateCacheMetadata,
} from '../../utils/storageUtils';

export interface UseInitialHydrationParams {
    supabase: any; // Complex object from useSupabase composed hook
    showAuth: boolean | null;
    offlineMode: boolean;
    hasInitialized: MutableRefObject<boolean>;
    setProfile: (profile: Profile) => void;
    setCustomTargets: (targets: CustomTargets) => void;
    setWeightHistory: (history: WeightEntry[]) => void;
    setFoodLog: (log: FoodEntry[]) => void;
    setWorkoutLog: (log: Workout[]) => void;
    setStepsLog: (log: StepsEntry[]) => void;
    setOuraLog: (log: OuraEntry[]) => void;
    setWaterLog: (log: WaterEntry[]) => void;
    setMealTemplates: (templates: MealTemplate[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setSaveStatus: (status: string) => void;
    setShowOnboarding: (show: boolean) => void;
    setCacheStale?: (stale: boolean) => void;
}

/**
 * useInitialHydration - Specialized hook for initial data loading and hydration
 */
export const useInitialHydration = ({
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
    setCacheStale, // SWR: Setter to clear stale state immediately
}: UseInitialHydrationParams) => {
    // Ref to track fallback timer for cleanup
    const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Track previous auth state to detect changes
    const previousAuthStateRef = useRef<boolean>(supabase.isAuthenticated);

    // 🔒 CRITICAL FIX: Reset hasInitialized when auth state changes
    // This allows re-hydration after login/logout or session recovery
    useEffect(() => {
        const currentAuthState = supabase.isAuthenticated;
        const previousAuthState = previousAuthStateRef.current;

        if (currentAuthState !== previousAuthState) {
            console.log(
                `[Data] Auth state changed: ${previousAuthState} → ${currentAuthState}, resetting hasInitialized`,
            );
            hasInitialized.current = false;
            previousAuthStateRef.current = currentAuthState;
        }
    }, [supabase.isAuthenticated, hasInitialized]);

    // Load data effect
    useEffect(() => {
        console.log('[Data] Hydration effect triggered:', {
            supabaseLoading: supabase.loading,
            showAuth,
            offlineMode,
            isAuthenticated: supabase.isAuthenticated,
            hasUser: !!supabase.user,
            hasInitialized: hasInitialized.current,
        });

        // Basic guards
        if (supabase.loading || showAuth === null) {
            console.log('[Data] Guard: supabase.loading or showAuth is null, skipping');
            return;
        }
        if (showAuth && !offlineMode) {
            console.log('[Data] Guard: showAuth is true and not in offline mode, skipping');
            return;
        }

        // 🔒 CRITICAL AUTH GUARD: Prevent race condition on page refresh (F5)
        if (!supabase.isAuthenticated || !supabase.user) {
            console.log(
                '[Data] Auth not ready, waiting for session confirmation before loading data',
                { isAuthenticated: supabase.isAuthenticated, hasUser: !!supabase.user }
            );
            return;
        }

        if (hasInitialized.current) {
            console.log('[Data] Already initialized, skipping data load');
            return;
        }

        // ✅ Mark as initialized ONLY after auth is confirmed
        hasInitialized.current = true;
        console.log(
            '[Data] ✅ Starting data load with authenticated user:',
            supabase.user?.email,
        );

        // Check for onboarding needs (only when authenticated)
        if (supabase.isAuthenticated) {
            // One-time cleanup of legacy localStorage keys
            cleanupLegacyLocalStorage();

            const checkOnboarding = async () => {
                const needsOnboarding = await supabase.checkNeedsOnboarding();
                if (needsOnboarding) setShowOnboarding(true);
            };
            checkOnboarding();
        }

        const loadData = async () => {
            setIsLoading(true);
            const userId = supabase.user?.id;

            // CRITICAL FIX: Handle loading state correctly
            // Track if we've already set loading to false to prevent double-setting
            // Defined at function level so it's accessible in catch block
            let loadingResolved = false;

            const resolveLoading = (source: string) => {
                if (loadingResolved) return;
                loadingResolved = true;
                if (fallbackTimerRef.current) {
                    clearTimeout(fallbackTimerRef.current);
                    fallbackTimerRef.current = null;
                }
                console.log(`[Data] Loading resolved via: ${source}`);
                setIsLoading(false);

                // 🔒 Mark auth/data load as completed for SW reload safety
                // This signals it's safe for service worker to reload the app
                sessionStorage.setItem('auth-completed', 'true');
            };

            try {
                // SWR PATTERN: Check staleness before loading cache
                const stalenessChecks = await Promise.all([
                    isCacheStale('profile', userId),
                    isCacheStale('targets', userId),
                    isCacheStale('weight', userId),
                    isCacheStale('food', userId),
                    isCacheStale('workouts', userId),
                    isCacheStale('steps', userId),
                    isCacheStale('oura', userId),
                    isCacheStale('water', userId),
                    isCacheStale('templates', userId),
                ]);

                const [
                    profileStale,
                    targetsStale,
                    weightStale,
                    foodStale,
                    workoutsStale,
                    stepsStale,
                    ouraStale,
                    waterStale,
                    templatesStale,
                ] = stalenessChecks;

                const cached = await loadCachedData(userId);

                // SWR: Only hydrate if cache is fresh (within 5-minute TTL)
                // Stale cache is ignored to prevent showing outdated data
                if (cached.localProfile && !profileStale) {
                    // Only hydrate from cache if it's a completed profile or we have no other choice
                    if (cached.localProfile.onboardingCompleted) {
                        setProfile(cached.localProfile);
                    }
                } else if (profileStale && cached.localProfile) {
                    setSaveStatus('⚡ Cargando perfil actualizado...');
                }

                if (cached.localTargets && !targetsStale) {
                    // Only hydrate if profile is likely completed or we have targets
                    setCustomTargets(cached.localTargets);
                }

                if (cached.localWeight.length && !weightStale) {
                    setWeightHistory(cached.localWeight);
                } else if (weightStale && cached.localWeight.length) {
                    setSaveStatus('⚡ Actualizando historial de peso...');
                }

                if (cached.localFood.length && !foodStale) {
                    setFoodLog(cached.localFood);
                } else if (foodStale && cached.localFood.length) {
                    setSaveStatus('⚡ Actualizando registro de comidas...');
                }

                if (cached.localWorkout.length && !workoutsStale) {
                    setWorkoutLog(cached.localWorkout);
                }

                if (cached.localSteps.length && !stepsStale) {
                    setStepsLog(cached.localSteps);
                }

                if (cached.localOura.length && !ouraStale) {
                    setOuraLog(cached.localOura);
                }

                if (cached.localWater.length && !waterStale) {
                    setWaterLog(cached.localWater);
                }

                if (cached.localTemplates.length && !templatesStale) {
                    setMealTemplates(cached.localTemplates);
                }

                const hasCachedData =
                    cached.localFood.length > 0 ||
                    cached.localWorkout.length > 0 ||
                    cached.localWeight.length > 0;
                const hasAnyStaleness = stalenessChecks.some((stale) => stale);

                if (hasCachedData && !hasAnyStaleness) {
                    resolveLoading('fresh-cache'); // Instant load with fresh cache
                } else if (hasCachedData && hasAnyStaleness) {
                    // We have stale cache - set fallback timer to show it if Supabase is too slow
                    // 🔒 CRITICAL FIX: Reduced from 8s to 3s for faster fallback
                    fallbackTimerRef.current = setTimeout(() => {
                        if (loadingResolved) return; // Already resolved, skip fallback

                        console.warn(
                            '[Data] Supabase slow (>3s), falling back to stale cache',
                        );
                        if (
                            cached.localProfile &&
                            profileStale &&
                            cached.localProfile.onboardingCompleted
                        )
                            setProfile(cached.localProfile);
                        if (
                            cached.localTargets &&
                            targetsStale &&
                            cached.localProfile?.onboardingCompleted
                        )
                            setCustomTargets(cached.localTargets);
                        if (cached.localWeight.length && weightStale)
                            setWeightHistory(cached.localWeight);
                        if (cached.localFood.length && foodStale)
                            setFoodLog(cached.localFood);
                        if (cached.localWorkout.length && workoutsStale)
                            setWorkoutLog(cached.localWorkout);
                        if (cached.localSteps.length && stepsStale)
                            setStepsLog(cached.localSteps);
                        if (cached.localOura.length && ouraStale)
                            setOuraLog(cached.localOura);
                        if (cached.localWater.length && waterStale)
                            setWaterLog(cached.localWater);
                        if (cached.localTemplates.length && templatesStale)
                            setMealTemplates(cached.localTemplates);
                        resolveLoading('stale-cache-fallback');
                        setSaveStatus(
                            '⚠️ Mostrando datos antiguos - Actualizando en segundo plano...',
                        );
                    }, 3000); // 3-second grace period for fast fallback to cache
                }

                // Fetch from Supabase if authenticated and online
                if (supabase.isAuthenticated && supabase.isOnline && !offlineMode) {
                    let data: any = null;
                    let timeoutOccurred = false;

                    // Retry logic with exponential backoff (3 attempts, 60s timeout)
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        try {
                            const fetchPromise = supabase.fetchAllData();
                            const timeoutPromise = new Promise((resolve) =>
                                setTimeout(() => resolve(null), 60000),
                            );
                            data = await Promise.race([
                                fetchPromise,
                                timeoutPromise,
                            ]);

                            if (data) {
                                timeoutOccurred = false;
                                break;
                            }

                            // Mark timeout if no data after race
                            if (!data) timeoutOccurred = true;

                            if (attempt < 3)
                                await new Promise((r) =>
                                    setTimeout(r, attempt * 2000),
                                );
                        } catch (err) {
                            console.error(
                                `[Data] Fetch attempt ${attempt} failed:`,
                                err,
                            );
                            if (attempt < 3)
                                await new Promise((r) =>
                                    setTimeout(r, attempt * 2000),
                                );
                        }
                    }

                    if (data) {
                        // CRITICAL FIX: Supabase is the single source of truth,
                        // but only if onboarding is completed to avoid overwriting with DB defaults
                        if (data.profile && data.profile.onboardingCompleted) {
                            setProfile(data.profile);
                        }
                        if (data.targets && data.profile?.onboardingCompleted) {
                            setCustomTargets(data.targets);
                        }

                        // Arrays: Always sync from cloud (even if empty)
                        if (data.weightHistory !== undefined)
                            setWeightHistory(data.weightHistory);
                        if (data.foodLog !== undefined) setFoodLog(data.foodLog);
                        if (data.workouts !== undefined)
                            setWorkoutLog(data.workouts);
                        if (data.stepsLog !== undefined) setStepsLog(data.stepsLog);
                        if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);
                        if (data.waterLog !== undefined) setWaterLog(data.waterLog);
                        if (data.mealTemplates !== undefined)
                            setMealTemplates(data.mealTemplates);

                        await cacheData(data, userId);

                        // SWR PATTERN: Update metadata timestamps after successful sync
                        const argentinaTimestamp = Date.now();

                        await Promise.all([
                            updateCacheMetadata(
                                'profile',
                                userId,
                                argentinaTimestamp,
                            ),
                            updateCacheMetadata(
                                'targets',
                                userId,
                                argentinaTimestamp,
                            ),
                            updateCacheMetadata(
                                'weight',
                                userId,
                                argentinaTimestamp,
                            ),
                            updateCacheMetadata('food', userId, argentinaTimestamp),
                            updateCacheMetadata(
                                'workouts',
                                userId,
                                argentinaTimestamp,
                            ),
                            updateCacheMetadata('steps', userId, argentinaTimestamp),
                            updateCacheMetadata('oura', userId, argentinaTimestamp),
                            updateCacheMetadata('water', userId, argentinaTimestamp),
                            updateCacheMetadata(
                                'templates',
                                userId,
                                argentinaTimestamp,
                            ),
                        ]);

                        // SWR: Clear stale flag immediately after successful sync
                        if (setCacheStale) setCacheStale(false);

                        // Resolve loading with fresh Supabase data
                        resolveLoading('supabase-fresh');
                        setSaveStatus('✓ Sincronizado');
                        setTimeout(() => setSaveStatus(''), 2000);
                    } else {
                        // 🔒 IMPROVED TIMEOUT FEEDBACK: Clear action message for user
                        if (timeoutOccurred && !hasCachedData) {
                            // 🔒 CRITICAL FIX: Reset hasInitialized on timeout to allow retry
                            console.log('[Data] Supabase timeout with no cache, resetting hasInitialized for retry');
                            hasInitialized.current = false;

                            resolveLoading('supabase-timeout-no-cache');
                            setSaveStatus(
                                '❌ Error de conexión - Recargá la página para reintentar',
                            );
                            setTimeout(() => setSaveStatus(''), 5000);
                            console.error(
                                '[Data] Failed to load from Supabase after 3 attempts. No cached data available.',
                            );
                        } else if (timeoutOccurred && hasCachedData) {
                            // Don't resolve loading here - let fallback timer handle it
                            // or it may have already been resolved by fallback
                            if (!loadingResolved) {
                                resolveLoading('supabase-timeout-with-cache');
                            }
                            setSaveStatus(
                                '⚠️ Mostrando datos en caché - Sin conexión a Supabase',
                            );
                            setTimeout(() => setSaveStatus(''), 5000);
                            console.warn(
                                '[Data] Timeout occurred but showing cached data',
                            );
                        } else if (!hasCachedData) {
                            // 🔒 CRITICAL FIX: Reset hasInitialized when no data available
                            console.log('[Data] No Supabase data and no cache, resetting hasInitialized');
                            hasInitialized.current = false;

                            resolveLoading('supabase-no-data-no-cache');
                            setSaveStatus('⚠️ Sin conexión');
                            setTimeout(() => setSaveStatus(''), 3000);
                        }
                    }
                }

                // Ensure loading is resolved even if we skipped Supabase fetch
                if (!loadingResolved) {
                    resolveLoading('final-fallback');
                }
            } catch (err) {
                console.error('[Data] Error loading data:', err);

                // 🔒 CRITICAL FIX: Reset hasInitialized on error to allow retry
                console.log('[Data] Resetting hasInitialized due to error, will retry on next render');
                hasInitialized.current = false;

                // Ensure loading is resolved on error
                if (!loadingResolved) {
                    resolveLoading('error-fallback');
                }

                // Show user-friendly error message
                setSaveStatus('❌ Error al cargar - Reintentando...');
                setTimeout(() => setSaveStatus(''), 3000);
            }
            // Note: No finally block needed - resolveLoading handles all cases
        };

        loadData();

        // Cleanup: Clear fallback timer if effect re-runs or component unmounts
        return () => {
            if (fallbackTimerRef.current) {
                clearTimeout(fallbackTimerRef.current);
                fallbackTimerRef.current = null;
            }
        };
    }, [
        supabase.loading,
        showAuth,
        offlineMode,
        supabase.isAuthenticated,
        supabase.isOnline,
        supabase.user,
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
        setCacheStale,
    ]);

    // This hook only performs side effects, no return value needed
    return {};
};

// One-time cleanup of legacy localStorage keys
const CLEANUP_FLAG = 'migration_cleanup_v1_complete';

const cleanupLegacyLocalStorage = () => {
    if (typeof window === 'undefined') return;
    // Only run once per browser
    if (localStorage.getItem(CLEANUP_FLAG)) return;

    const legacyKeys = [
        // Old "nutrition_*" keys from v1
        'nutrition_data_v1',
        'nutrition_profile',
        'nutrition_targets',
        'nutrition_weight',
        'nutrition_food',
        'nutrition_workouts',
        'nutrition_steps',
        'nutrition_oura',
        'nutrition_water',
        // Old "lucas-*-v5" keys from v5
        'lucas-profile-v5',
        'lucas-weight-history-v5',
        'lucas-food-log-v5',
        'lucas-workout-log-v5',
        'lucas-steps-log-v5',
        'lucas-targets-v5',
        'lucas-oura-log-v5',
    ];

    let cleaned = 0;
    legacyKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            cleaned++;
        }
    });

    // Mark cleanup as complete
    localStorage.setItem(CLEANUP_FLAG, 'true');
};

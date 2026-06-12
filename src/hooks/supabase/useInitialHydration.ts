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
    migrateUserStorage,
    updateFreshCacheMetadata,
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
            console.log(
                '[Data] Guard: supabase.loading or showAuth is null, skipping',
            );
            return;
        }
        if (showAuth && !offlineMode) {
            console.log(
                '[Data] Guard: showAuth is true and not in offline mode, skipping',
            );
            return;
        }

        // 🔒 CRITICAL AUTH GUARD: Prevent race condition on page refresh (F5)
        if (!supabase.isAuthenticated || !supabase.user) {
            console.log(
                '[Data] Auth not ready, waiting for session confirmation before loading data',
                {
                    isAuthenticated: supabase.isAuthenticated,
                    hasUser: !!supabase.user,
                },
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
                // Finish the user-scoped migration before reading or deleting any
                // legacy keys. This prevents hydration cleanup racing the copy.
                if (userId) {
                    await migrateUserStorage(userId);
                }

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

                if (hasCachedData) {
                    // Offline-first: show cached data IMMEDIATELY, even if stale,
                    // and let the Supabase fetch below refresh it in the background.
                    // Blocking the splash screen on the network froze iOS PWA cold
                    // starts (radio half-asleep → fetch hangs → stuck loading).
                    if (hasAnyStaleness) {
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
                        setSaveStatus('⚡ Actualizando en segundo plano...');
                    }
                    resolveLoading(
                        hasAnyStaleness ? 'stale-cache-immediate' : 'fresh-cache',
                    );
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

                        await updateFreshCacheMetadata(
                            data.freshDataTypes || [],
                            userId,
                        );

                        if (setCacheStale) {
                            setCacheStale(
                                (data.freshDataTypes?.length ?? 0) < 9,
                            );
                        }

                        // Resolve loading with fresh Supabase data
                        resolveLoading('supabase-fresh');
                        setSaveStatus('✓ Sincronizado');
                        setTimeout(() => setSaveStatus(''), 2000);
                    } else {
                        // 🔒 IMPROVED TIMEOUT FEEDBACK: Clear action message for user
                        if (timeoutOccurred && !hasCachedData) {
                            console.warn(
                                '[Data] Supabase timeout with no cache, allowing partial hydration',
                            );
                            // Don't reset hasInitialized - let the app load with what we have (even if empty)

                            resolveLoading('supabase-timeout-no-cache');
                            setSaveStatus(
                                '❌ Error de conexión - Intentando cargar modo offline...',
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
                            console.warn(
                                '[Data] No Supabase data and no cache, allowing empty state',
                            );
                            // Don't reset hasInitialized - let the app load empty

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

                console.warn('[Data] Error during load, allowing partial hydration');
                // Don't reset hasInitialized - let the app load with what we have

                // Ensure loading is resolved on error
                if (!loadingResolved) {
                    resolveLoading('error-fallback');
                }

                // Show user-friendly error message
                setSaveStatus('❌ Error al cargar - Modo offline activado');
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
        setSaveStatus,
        setShowOnboarding,
        setCacheStale,
    ]);

    // This hook only performs side effects, no return value needed
    return {};
};

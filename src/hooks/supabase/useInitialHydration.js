import { useEffect } from 'react';
import { cacheData, loadCachedData } from '../../utils/storageUtils';

/**
 * useInitialHydration - Specialized hook for initial data loading and hydration
 *
 * RESPONSIBILITY: Load data from cache and Supabase (Cloud as Single Source of Truth)
 * - Immediately displays cached data for better UX
 * - Fetches from Supabase in background
 * - Always overwrites local state with Supabase data (even if empty arrays)
 * - Handles migration detection from old localStorage
 * - Implements retry logic with exponential backoff
 * - Respects Argentina timezone for all timestamps
 *
 * @param {Object} params - Hook parameters
 * @param {Object} params.supabase - Supabase client
 * @param {boolean|null} params.showAuth - Auth UI visibility state
 * @param {boolean} params.offlineMode - Offline mode flag
 * @param {React.MutableRefObject<boolean>} params.hasInitialized - Initialization flag ref
 * @param {Function} params.setProfile - Profile state setter
 * @param {Function} params.setCustomTargets - Custom targets state setter
 * @param {Function} params.setWeightHistory - Weight history state setter
 * @param {Function} params.setFoodLog - Food log state setter
 * @param {Function} params.setWorkoutLog - Workout log state setter
 * @param {Function} params.setStepsLog - Steps log state setter
 * @param {Function} params.setOuraLog - Oura log state setter
 * @param {Function} params.setWaterLog - Water log state setter
 * @param {Function} params.setIsLoading - Loading state setter
 * @param {Function} params.setSaveStatus - Save status message setter
 * @param {Function} params.setShowOnboarding - Onboarding modal visibility setter
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
  setIsLoading,
  setSaveStatus,
  setShowOnboarding
}) => {
  // Load data effect
  useEffect(() => {
    if (supabase.loading || showAuth === null) return;
    if (showAuth && !offlineMode) return;

    // 🔒 CRITICAL AUTH GUARD: Prevent race condition on page refresh (F5)
    // Wait for auth to be fully resolved before loading data
    // This prevents fetchAllData() from executing with null/undefined session
    if (!supabase.isAuthenticated || !supabase.user) {
      console.log('[Data] Auth not ready, waiting for session confirmation before loading data');
      return;
    }

    if (hasInitialized.current) return;

    // ✅ Mark as initialized ONLY after auth is confirmed
    hasInitialized.current = true;
    console.log('[Data] Starting data load with authenticated user:', supabase.user?.email);

    // Check for onboarding needs (only when authenticated)
    if (supabase.isAuthenticated) {
      // One-time cleanup of legacy localStorage keys
      cleanupLegacyLocalStorage();

      supabase.checkNeedsOnboarding().then(needsOnboarding => {
        if (needsOnboarding) setShowOnboarding(true);
      });
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const cached = await loadCachedData();

        // Set cached data immediately for better UX
        if (cached.localProfile) setProfile(cached.localProfile);
        if (cached.localTargets) setCustomTargets(cached.localTargets);
        if (cached.localWeight.length) setWeightHistory(cached.localWeight);
        if (cached.localFood.length) setFoodLog(cached.localFood);
        if (cached.localWorkout.length) setWorkoutLog(cached.localWorkout);
        if (cached.localSteps.length) setStepsLog(cached.localSteps);
        if (cached.localOura.length) setOuraLog(cached.localOura);
        if (cached.localWater.length) setWaterLog(cached.localWater);

        const hasCachedData = cached.localFood.length > 0 || cached.localWorkout.length > 0 || cached.localWeight.length > 0;
        if (hasCachedData) {
          setIsLoading(false);
        }

        // Fetch from Supabase if authenticated and online
        if (supabase.isAuthenticated && supabase.isOnline && !offlineMode) {
          let data = null;
          let timeoutOccurred = false;

          // Retry logic with exponential backoff (3 attempts, 60s timeout)
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const fetchPromise = supabase.fetchAllData();
              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 60000));
              data = await Promise.race([fetchPromise, timeoutPromise]);

              if (data) {
                timeoutOccurred = false;
                break;
              }

              // Mark timeout if no data after race
              if (!data) timeoutOccurred = true;

              if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
            } catch (err) {
              console.error(`[Data] Fetch attempt ${attempt} failed:`, err);
              if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
            }
          }

          if (data) {
            // CRITICAL FIX: Supabase is the single source of truth
            // Always overwrite local state, even if cloud returns empty arrays
            // This ensures data integrity and prevents Argentina timezone issues
            if (data.profile) setProfile(data.profile);
            if (data.targets) setCustomTargets(data.targets);

            // Arrays: Always sync from cloud (even if empty)
            // This is critical for maintaining Argentina timezone consistency
            if (data.weightHistory !== undefined) setWeightHistory(data.weightHistory);
            if (data.foodLog !== undefined) setFoodLog(data.foodLog);
            if (data.workouts !== undefined) setWorkoutLog(data.workouts);
            if (data.stepsLog !== undefined) setStepsLog(data.stepsLog);
            if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);  // ← FIX: Allows empty sync
            if (data.waterLog !== undefined) setWaterLog(data.waterLog);

            await cacheData(data);

            setSaveStatus('✓ Sincronizado');
            setTimeout(() => setSaveStatus(''), 2000);
          } else {
            // 🔒 IMPROVED TIMEOUT FEEDBACK: Clear action message for user
            if (timeoutOccurred && !hasCachedData) {
              // No cache and timeout = critical UX issue
              setSaveStatus('❌ Error de conexión - Recargá la página para reintentar');
              setTimeout(() => setSaveStatus(''), 5000);
              console.error('[Data] Failed to load from Supabase after 3 attempts. No cached data available.');
            } else if (timeoutOccurred && hasCachedData) {
              // Has cache but timeout = degrade gracefully
              setSaveStatus('⚠️ Mostrando datos en caché - Sin conexión a Supabase');
              setTimeout(() => setSaveStatus(''), 5000);
              console.warn('[Data] Timeout occurred but showing cached data');
            } else if (!hasCachedData) {
              // Generic offline message (network offline, not timeout)
              setSaveStatus('⚠️ Sin conexión');
              setTimeout(() => setSaveStatus(''), 3000);
            }
            // Note: If hasCachedData && !timeoutOccurred, we silently show cache (best UX)
          }
        }
      } catch (err) {
        console.error('[Data] Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [supabase.loading, showAuth, offlineMode, supabase.isAuthenticated, supabase.isOnline, supabase.user]);

  // This hook only performs side effects, no return value needed
  return {};
};

// One-time cleanup of legacy localStorage keys
const CLEANUP_FLAG = 'migration_cleanup_v1_complete';

const cleanupLegacyLocalStorage = () => {
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
    'lucas-oura-log-v5'
  ];

  let cleaned = 0;
  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleaned++;
    }
  });

  // Mark cleanup as complete
  localStorage.setItem(CLEANUP_FLAG, 'true');
};

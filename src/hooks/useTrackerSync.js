import { useEffect, useRef, useState } from 'react';
import { cacheData, clearCache, loadCachedData } from '../utils/storageUtils';
import { useSyncResolver } from './supabase/useSyncResolver';

export const useTrackerSync = ({
  supabase, // Dependency injected
  useCloud, // ← CRITICAL FIX: Receive unified useCloud from parent
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
  // Data needed for forceSync
  foodLog,
  workoutLog,
  stepsLog,
  ouraLog,
  waterLog,
  weightHistory
}) => {
  const [showAuth, setShowAuth] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Migration state
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationData, setMigrationData] = useState(null);

  const hasInitialized = useRef(false);

  // NOTE: useCloud is now passed from TrackerContext (single source of truth)

  const { isMigrating, handleMigration: resolveMigration, forceSyncToCloud: resolveForceSync } = useSyncResolver(
    supabase,
    useCloud,
    { foodLog, workoutLog, stepsLog, ouraLog, waterLog, weightHistory }
  );

  const handleMigration = async () => {
    const success = await resolveMigration(migrationData, {
      onSuccess: (data) => {
        // Supabase is source of truth - always sync
        if (data.profile) setProfile(data.profile);
        if (data.targets) setCustomTargets(data.targets);
        if (data.weightHistory !== undefined) setWeightHistory(data.weightHistory);
        if (data.foodLog !== undefined) setFoodLog(data.foodLog);
        if (data.workouts !== undefined) setWorkoutLog(data.workouts);
        if (data.stepsLog !== undefined) setStepsLog(data.stepsLog);
        if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);
        if (data.waterLog !== undefined) setWaterLog(data.waterLog);
        setShowMigrationModal(false);
        setMigrationData(null);
      }
    });
  };

  const forceSyncToCloud = () => resolveForceSync(setSaveStatus);

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

  // Load data
  useEffect(() => {
    if (supabase.loading || showAuth === null) return;
    if (showAuth && !offlineMode) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log('[Data] Starting data load...');

    if (supabase.isAuthenticated) {
      supabase.checkNeedsOnboarding().then(needsOnboarding => {
        if (needsOnboarding) setShowOnboarding(true);
      });

      const { hasData, localData } = supabase.checkLocalStorageForMigration();
      if (hasData && supabase.isOnline) {
        setMigrationData(localData);
        setShowMigrationModal(true);
      }
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('[Data] Loading localStorage cache...');
        const cached = await loadCachedData();

        // Set cached data immediately
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
          console.log('[Data] Showing cached data, syncing from Supabase in background...');
        }

        if (supabase.isAuthenticated && supabase.isOnline && !offlineMode) {
          console.log('[Data] Fetching from Supabase...');

          let data = null;
          // Retry logic simplified in extraction or kept here? Kept here for simplicity in Component specific logic
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const fetchPromise = supabase.fetchAllData();
              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 60000));
              data = await Promise.race([fetchPromise, timeoutPromise]);
              if (data) break;
              if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
            } catch (err) {
              if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
            }
          }

          if (data) {
            // CRITICAL FIX: Supabase is the single source of truth
            // Always overwrite local state, even if cloud returns empty arrays
            if (data.profile) setProfile(data.profile);
            if (data.targets) setCustomTargets(data.targets);

            // Arrays: Always sync from cloud (even if empty)
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
            if (!hasCachedData) {
              setSaveStatus('⚠️ Sin conexión');
              setTimeout(() => setSaveStatus(''), 3000);
            }
          }
        }
      } catch (err) {
        console.error('[Data] Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [supabase.loading, showAuth, offlineMode, supabase.isAuthenticated, supabase.isOnline]);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (useCloud) {
        const data = await supabase.fetchAllData();
        if (data) {
          // Supabase is source of truth - always sync (even empty arrays)
          if (data.profile) setProfile(data.profile);
          if (data.targets) setCustomTargets(data.targets);
          if (data.weightHistory !== undefined) setWeightHistory(data.weightHistory);
          if (data.foodLog !== undefined) setFoodLog(data.foodLog);
          if (data.workouts !== undefined) setWorkoutLog(data.workouts);
          if (data.stepsLog !== undefined) setStepsLog(data.stepsLog);
          if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);
          if (data.waterLog !== undefined) setWaterLog(data.waterLog);
          setSaveStatus('✓ Actualizado');
        } else {
          setSaveStatus('Error al actualizar');
        }
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

      // Reset state (setters)
      setProfile({ height: 173, currentWeight: 84.9, targetWeight: 75, age: 27, activityLevel: 'moderate', goal: 'cut' });
      setCustomTargets({ calories: 2100, protein: 170, carbs: 180, fat: 70, fiber: 30, trainingDayCaloriesBonus: 200, trainingDayCarbs: 220 });
      setWeightHistory([]);
      setFoodLog([]);
      setWorkoutLog([]);
      setStepsLog([]);
      setOuraLog([]);
      setWaterLog([]);

      await supabase.signOut();
      setShowAuth(true);
    } catch (err) {
      console.error('Logout error:', err);
      setShowAuth(true);
    }
  };

  return {
    showAuth, setShowAuth,
    showOnboarding, setShowOnboarding,
    offlineMode, setOfflineMode, // Passed through from TrackerContext
    isLoading, setIsLoading,
    saveStatus, setSaveStatus,
    isRefreshing, handleRefresh,
    showMigrationModal, setShowMigrationModal,
    migrationData, setMigrationData,
    isMigrating, handleMigration,
    // useCloud removed - now managed in TrackerContext as single source of truth
    forceSyncToCloud,
    handleLogout
  };
};

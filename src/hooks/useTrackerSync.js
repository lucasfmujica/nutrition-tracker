import { useEffect, useRef, useState } from 'react';
import { storage } from '../utils/storage';

export const useTrackerSync = ({
  supabase, // Dependency injected
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
  const [offlineMode, setOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Migration state
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationData, setMigrationData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const hasInitialized = useRef(false);

  // Check if using Supabase (authenticated) or localStorage (offline)
  // We use the properties from the injected supabase object
  const useCloud = supabase.isAuthenticated && !offlineMode && supabase.isOnline; // supabase.isOnline from useSupabase hook

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await supabase.migrateLocalStorageToSupabase(migrationData);
      if (result.success) {
        supabase.clearMigratedLocalStorage();
        // Reload data from Supabase
        const data = await supabase.fetchAllData();
        if (data) {
          if (data.profile) setProfile(data.profile);
          if (data.targets) setCustomTargets(data.targets);
          if (data.weightHistory?.length) setWeightHistory(data.weightHistory);
          if (data.foodLog?.length) setFoodLog(data.foodLog);
          if (data.workouts?.length) setWorkoutLog(data.workouts);
          if (data.stepsLog?.length) setStepsLog(data.stepsLog);
          if (data.ouraLog?.length) setOuraLog(data.ouraLog);
          if (data.waterLog?.length) setWaterLog(data.waterLog);
        }
        setShowMigrationModal(false);
        setMigrationData(null);
      }
    } catch (err) {
      console.error('Migration failed:', err);
    } finally {
      setIsMigrating(false);
    }
  };

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
        const [profileData, weightData, foodData, workoutData, stepsData, targetsData, ouraData, waterData] = await Promise.all([
          storage.get('lucas-profile-v5').catch(() => null),
          storage.get('lucas-weight-history-v5').catch(() => null),
          storage.get('lucas-food-log-v5').catch(() => null),
          storage.get('lucas-workout-log-v5').catch(() => null),
          storage.get('lucas-steps-log-v5').catch(() => null),
          storage.get('lucas-targets-v5').catch(() => null),
          storage.get('lucas-oura-log-v5').catch(() => null),
          storage.get('lucas-water-log-v5').catch(() => null)
        ]);

        const localProfile = profileData?.value ? JSON.parse(profileData.value) : null;
        const localWeight = weightData?.value ? JSON.parse(weightData.value) : [];
        const localFood = foodData?.value ? JSON.parse(foodData.value) : [];
        const localWorkout = workoutData?.value ? JSON.parse(workoutData.value) : [];
        const localSteps = stepsData?.value ? JSON.parse(stepsData.value) : [];
        const localTargets = targetsData?.value ? JSON.parse(targetsData.value) : null;
        const localOura = ouraData?.value ? JSON.parse(ouraData.value) : [];
        const localWater = waterData?.value ? JSON.parse(waterData.value) : [];

        // Set cached data immediately so user sees something
        if (localProfile) setProfile(localProfile);
        if (localTargets) setCustomTargets(localTargets);
        if (localWeight.length) setWeightHistory(localWeight);
        if (localFood.length) setFoodLog(localFood);
        if (localWorkout.length) setWorkoutLog(localWorkout);
        if (localSteps.length) setStepsLog(localSteps);
        if (localOura.length) setOuraLog(localOura);
        if (localWater.length) setWaterLog(localWater);

        // If we have cached data, stop loading immediately (show data while syncing in background)
        const hasCachedData = localFood.length > 0 || localWorkout.length > 0 || localWeight.length > 0;
        if (hasCachedData) {
          setIsLoading(false);
          console.log('[Data] Showing cached data, syncing from Supabase in background...');
        }

        if (supabase.isAuthenticated && supabase.isOnline && !offlineMode) {
          console.log('[Data] Fetching from Supabase...');

          // Retry logic
          let data = null;
          let lastError = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const fetchPromise = supabase.fetchAllData();
              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 60000));
              data = await Promise.race([fetchPromise, timeoutPromise]);

              if (data) {
                break;
              } else {
                if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
              }
            } catch (err) {
              lastError = err;
              if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
            }
          }

          if (data) {
            // Update state with Supabase data
            if (data.profile) setProfile(data.profile);
            if (data.targets) setCustomTargets(data.targets);
            if (data.weightHistory?.length > 0) setWeightHistory(data.weightHistory);
            if (data.foodLog?.length > 0) setFoodLog(data.foodLog);
            if (data.workouts?.length > 0) setWorkoutLog(data.workouts);
            if (data.stepsLog?.length > 0) setStepsLog(data.stepsLog);
            if (data.ouraLog?.length > 0) setOuraLog(data.ouraLog);
            if (data.waterLog?.length > 0) setWaterLog(data.waterLog);

            // Cache Sync
            try {
              if (data.profile) await storage.set('lucas-profile-v5', JSON.stringify(data.profile));
              if (data.targets) await storage.set('lucas-targets-v5', JSON.stringify(data.targets));
              if (data.weightHistory?.length > 0) await storage.set('lucas-weight-history-v5', JSON.stringify(data.weightHistory));
              if (data.foodLog?.length > 0) await storage.set('lucas-food-log-v5', JSON.stringify(data.foodLog));
              if (data.workouts?.length > 0) await storage.set('lucas-workout-log-v5', JSON.stringify(data.workouts));
              if (data.stepsLog?.length > 0) await storage.set('lucas-steps-log-v5', JSON.stringify(data.stepsLog));
              if (data.ouraLog?.length > 0) await storage.set('lucas-oura-log-v5', JSON.stringify(data.ouraLog));
              if (data.waterLog?.length > 0) await storage.set('lucas-water-log-v5', JSON.stringify(data.waterLog));
            } catch (cacheErr) {
              console.warn('[Data] Failed to cache data:', cacheErr);
            }

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
          if (data.profile) setProfile(data.profile);
          if (data.targets) setCustomTargets(data.targets);
          if (data.weightHistory?.length) setWeightHistory(data.weightHistory);
          if (data.foodLog?.length) setFoodLog(data.foodLog);
          if (data.workouts?.length) setWorkoutLog(data.workouts);
          if (data.stepsLog?.length) setStepsLog(data.stepsLog);
          if (data.ouraLog?.length) setOuraLog(data.ouraLog);
          if (data.waterLog?.length) setWaterLog(data.waterLog);
          setSaveStatus('✓ Actualizado');
        } else {
          setSaveStatus('Error al actualizar');
        }
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setSaveStatus('Error al actualizar');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const forceSyncToCloud = async () => {
    if (!useCloud) return { success: false, message: 'No conectado a la nube' };

    setSaveStatus('Sincronizando...');
    let synced = { workouts: 0, foods: 0, steps: 0, oura: 0, water: 0, weight: 0, errors: 0 };

    try {
      // Parallel sync attempts could be done but sequential is safer for now to not flood Supabase
      // Workouts
      for (const w of workoutLog) {
        try { await supabase.saveWorkout(w); synced.workouts++; } catch { synced.errors++; }
      }
      // Food
      for (const f of foodLog) {
        try { await supabase.saveFood(f); synced.foods++; } catch { synced.errors++; }
      }
      // Steps
      for (const s of stepsLog) {
        try { await supabase.saveSteps(s); synced.steps++; } catch { synced.errors++; }
      }
      // Oura
      for (const o of ouraLog) {
        try { await supabase.saveOura(o); synced.oura++; } catch { synced.errors++; }
      }
      // Water
      for (const w of waterLog) {
        try { await supabase.saveWater(w); synced.water++; } catch { synced.errors++; }
      }
      // Weight
      for (const w of weightHistory) {
        try { await supabase.saveWeight(w); synced.weight++; } catch { synced.errors++; }
      }

      const total = Object.values(synced).reduce((a, b) => a + b, 0) - synced.errors;
      setSaveStatus(`✓ Sincronizado: ${total} registros`);
      setTimeout(() => setSaveStatus(''), 4000);
      return { success: true, ...synced };
    } catch (err) {
      setSaveStatus('❌ Error al sincronizar');
      setTimeout(() => setSaveStatus(''), 3000);
      return { success: false, message: err.message };
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      hasInitialized.current = false;
      setOfflineMode(false);
      setIsLoading(false);

      const cacheKeys = [
        'lucas-profile-v5', 'lucas-weight-history-v5', 'lucas-food-log-v5',
        'lucas-workout-log-v5', 'lucas-steps-log-v5', 'lucas-targets-v5',
        'lucas-oura-log-v5', 'lucas-water-log-v5'
      ];
      for (const key of cacheKeys) await storage.remove(key);

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
    offlineMode, setOfflineMode,
    isLoading, setIsLoading,
    saveStatus, setSaveStatus,
    isRefreshing, handleRefresh,
    showMigrationModal, setShowMigrationModal,
    migrationData, setMigrationData,
    isMigrating, handleMigration,
    useCloud,
    forceSyncToCloud,
    handleLogout
  };
};

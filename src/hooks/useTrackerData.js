import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getArgentinaDateString, toArgentinaDateString } from '../utils/dateUtils';
import { useSupabase } from './useSupabase';

export const useTrackerData = () => {
  const supabase = useSupabase();
  const [showAuth, setShowAuth] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  // Migration state
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationData, setMigrationData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

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

  // Data states
  const [profile, setProfile] = useState({
    height: 173,
    currentWeight: 84.9,
    targetWeight: 75,
    age: 27,
    activityLevel: 'moderate',
    goal: 'cut',
    avatar: '',
    name: ''
  });

  const [customTargets, setCustomTargets] = useState({
    calories: 2100,
    protein: 170,
    carbs: 180,
    fat: 70,
    fiber: 30,
    trainingDayCaloriesBonus: 200,
    trainingDayCarbs: 220
  });

  const [weightHistory, setWeightHistory] = useState([
    { id: 'wh-1', date: '2026-01-16', weight: 84.9, timestamp: 1737025200000 }
  ]);

  const [foodLog, setFoodLog] = useState([]);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [stepsLog, setStepsLog] = useState([]);
  const [ouraLog, setOuraLog] = useState([]);
  const [waterLog, setWaterLog] = useState([]);

  // UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newWeight, setNewWeight] = useState('');
  const [newWeightTime, setNewWeightTime] = useState('09:00');
  const [weightDate, setWeightDate] = useState(getArgentinaDateString());
  const [newSteps, setNewSteps] = useState('');
  const [stepsDate, setStepsDate] = useState(getArgentinaDateString());
  const [selectedFoodDate, setSelectedFoodDate] = useState(getArgentinaDateString());
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState(getArgentinaDateString());
  const [dashboardDate, setDashboardDate] = useState(getArgentinaDateString());

  // Modals & Forms
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: null, name: '' });
  const [undoAction, setUndoAction] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFab, setShowFab] = useState(true);

  // Templates

  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  // Forms




  const [editingWeightId, setEditingWeightId] = useState(null);
  const [editingWeightValue, setEditingWeightValue] = useState('');

  // Import Modals
  const [showImportFoodModal, setShowImportFoodModal] = useState(false);
  const [showImportWorkoutModal, setShowImportWorkoutModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');



  // Local config state for debounced saving
  const [localConfig, setLocalConfig] = useState(null);
  const [configDirty, setConfigDirty] = useState(false);

  // Constants
  const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

  // Check if using Supabase (authenticated) or localStorage (offline)
  const useCloud = supabase.isAuthenticated && !offlineMode && supabase.isOnline;

  // Storage helper
  const storage = {
    async get(key) {
      try {
        if (window.storage) {
          return await window.storage.get(key);
        }
        const val = localStorage.getItem(key);
        return val ? { value: val } : null;
      } catch {
        const val = localStorage.getItem(key);
        return val ? { value: val } : null;
      }
    },
    async set(key, value) {
      try {
        if (window.storage) {
          return await window.storage.set(key, value);
        }
        localStorage.setItem(key, value);
        return { key, value };
      } catch {
        localStorage.setItem(key, value);
        return { key, value };
      }
    }
  };

  // Track if we've already initialized
  const hasInitialized = useRef(false);

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

          // Retry logic - try up to 3 times with increasing delay
          let data = null;
          let lastError = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`[Data] Supabase fetch attempt ${attempt}/3...`);
              const fetchPromise = supabase.fetchAllData();
              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 60000)); // 60s timeout

              data = await Promise.race([fetchPromise, timeoutPromise]);

              if (data) {
                console.log(`[Data] Supabase fetch succeeded on attempt ${attempt}`);
                break; // Success, exit retry loop
              } else {
                console.warn(`[Data] Supabase fetch attempt ${attempt} timed out`);
                if (attempt < 3) {
                  // Wait before retry: 2s, 4s
                  await new Promise(r => setTimeout(r, attempt * 2000));
                }
              }
            } catch (err) {
              lastError = err;
              console.warn(`[Data] Supabase fetch attempt ${attempt} failed:`, err.message);
              if (attempt < 3) {
                await new Promise(r => setTimeout(r, attempt * 2000));
              }
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

            // Cache Supabase data to localStorage for next time
            console.log('[Data] Caching Supabase data to localStorage...');
            try {
              if (data.profile) await storage.set('lucas-profile-v5', JSON.stringify(data.profile));
              if (data.targets) await storage.set('lucas-targets-v5', JSON.stringify(data.targets));
              if (data.weightHistory?.length > 0) await storage.set('lucas-weight-history-v5', JSON.stringify(data.weightHistory));
              if (data.foodLog?.length > 0) await storage.set('lucas-food-log-v5', JSON.stringify(data.foodLog));
              if (data.workouts?.length > 0) await storage.set('lucas-workout-log-v5', JSON.stringify(data.workouts));
              if (data.stepsLog?.length > 0) await storage.set('lucas-steps-log-v5', JSON.stringify(data.stepsLog));
              if (data.ouraLog?.length > 0) await storage.set('lucas-oura-log-v5', JSON.stringify(data.ouraLog));
              if (data.waterLog?.length > 0) await storage.set('lucas-water-log-v5', JSON.stringify(data.waterLog));
              console.log('[Data] Cache updated successfully');
            } catch (cacheErr) {
              console.warn('[Data] Failed to cache data:', cacheErr);
            }

            setSaveStatus('✓ Sincronizado');
            setTimeout(() => setSaveStatus(''), 2000);
          } else {
            console.warn('[Data] All Supabase fetch attempts failed - using cached/local data');
            if (!hasCachedData) {
              setSaveStatus('⚠️ Sin conexión');
              setTimeout(() => setSaveStatus(''), 3000);
            }
          }
        }
      } catch (err) {
        console.error('[Data] Error loading data:', err);
      } finally {
        // ALWAYS stop loading
        setIsLoading(false);
      }
    };

    loadData();
  }, [supabase.loading, showAuth, offlineMode, supabase.isAuthenticated, supabase.isOnline]);

  // Debounced config save
  useEffect(() => {
    if (!configDirty || !localConfig) return;
    const timer = setTimeout(() => {
      console.log('[Config] Saving profile and targets...', localConfig.profile);
      saveProfile(localConfig.profile);
      saveTargets(localConfig.targets);
      setConfigDirty(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [localConfig, configDirty]);

  // Auto-hide undo after 5 seconds
  useEffect(() => {
    if (!undoAction) return;
    const timer = setTimeout(() => setUndoAction(null), 5000);
    return () => clearTimeout(timer);
  }, [undoAction]);

  // Helpers
  const sortWeightHistory = (history) => {
    return [...history].sort((a, b) => {
      // First try to sort by timestamp
      const timestampDiff = (b.timestamp || 0) - (a.timestamp || 0);
      if (timestampDiff !== 0) return timestampDiff;

      // If timestamps are equal or both missing, sort by date string (most recent first)
      if (a.date && b.date) {
        return b.date.localeCompare(a.date);
      }

      return 0;
    });
  };

  const getMostRecentWeight = (history) => {
    if (history.length === 0) {
      console.log('[Weight] getMostRecentWeight: history is empty, returning null');
      return null;
    }
    const sorted = sortWeightHistory(history);
    console.log('[Weight] getMostRecentWeight: most recent =', sorted[0]?.weight, 'kg on', sorted[0]?.date);
    return sorted[0];
  };

  const isTrainingDay = useCallback((date) => {
    return workoutLog.some(w => w.date === date);
  }, [workoutLog]);

  const getTargetsForDate = useCallback((date) => {
    const training = isTrainingDay(date);
    if (training) {
      return {
        ...customTargets,
        calories: customTargets.calories + customTargets.trainingDayCaloriesBonus,
        carbs: customTargets.trainingDayCarbs
      };
    }
    return customTargets;
  }, [customTargets, isTrainingDay]);

  const totalsByDate = useMemo(() => {
    const totals = {};
    foodLog.forEach(entry => {
      if (!totals[entry.date]) {
        totals[entry.date] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      }
      totals[entry.date].calories += entry.calories || 0;
      totals[entry.date].protein += entry.protein || 0;
      totals[entry.date].carbs += entry.carbs || 0;
      totals[entry.date].fat += entry.fat || 0;
      totals[entry.date].fiber += entry.fiber || 0;
    });
    return totals;
  }, [foodLog]);

  const getTotalsForDate = useCallback((date) => {
    return totalsByDate[date] || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }, [totalsByDate]);

  const isDayCompleted = useCallback((date) => {
    const totals = getTotalsForDate(date);
    const targets = getTargetsForDate(date);
    const calRange = 150;
    const calOk = totals.calories >= targets.calories - calRange && totals.calories <= targets.calories + calRange;
    const protOk = totals.protein >= targets.protein * 0.9;
    return calOk && protOk;
  }, [getTotalsForDate, getTargetsForDate]);

  // Actions
  const saveProfile = async (newProfile) => {
    setProfile(newProfile);
    try {
      await storage.set('lucas-profile-v5', JSON.stringify(newProfile));
      if (useCloud) {
        await supabase.saveProfile(newProfile, customTargets);
      }
      setSaveStatus('✓');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveStatus('Error');
    }
  };

  const saveTargets = async (newTargets) => {
    setCustomTargets(newTargets);
    try {
      await storage.set('lucas-targets-v5', JSON.stringify(newTargets));
      if (useCloud) {
        await supabase.saveProfile(profile, newTargets);
      }
    } catch (err) {
      console.error('Error saving targets:', err);
    }
  };

  const saveWeightHistory = async (newHistory) => {
    const sorted = sortWeightHistory(newHistory);
    setWeightHistory(sorted);
    try {
      await storage.set('lucas-weight-history-v5', JSON.stringify(sorted));
      const mostRecent = getMostRecentWeight(sorted);
      if (mostRecent) {
        saveProfile({ ...profile, currentWeight: mostRecent.weight });
      }
    } catch (err) {
      console.error('Error saving weight history:', err);
    }
  };

  const saveWeightEntry = async (entry) => {
    if (useCloud) await supabase.saveWeight(entry);
  };

  const saveFoodLog = async (newLog) => {
    setFoodLog(newLog);
    try {
      await storage.set('lucas-food-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving food log:', err);
    }
  };

  const saveFoodEntry = async (entry) => {
    if (useCloud) {
      try {
        const result = await supabase.saveFood(entry);
        return result.data;
      } catch (err) {
        return entry;
      }
    }
    return entry;
  };

  const deleteFoodEntry = async (id) => {
    if (useCloud) await supabase.deleteFood(id);
  };

  const saveWorkoutLog = async (newLog) => {
    setWorkoutLog(newLog);
    try {
      await storage.set('lucas-workout-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving workout log:', err);
    }
  };

  const saveWorkoutEntry = async (entry) => {
    if (useCloud) {
      try {
        const result = await supabase.saveWorkout(entry);
        return result.data;
      } catch (err) {
        return entry;
      }
    }
    return entry;
  };

  const deleteWorkoutEntry = async (id) => {
    if (useCloud) await supabase.deleteWorkout(id);
  };

  const saveStepsLog = async (newLog) => {
    setStepsLog(newLog);
    try {
      await storage.set('lucas-steps-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving steps log:', err);
    }
  };

  const saveStepsEntry = async (entry) => {
    if (useCloud) {
      try {
        const result = await supabase.saveSteps(entry);
        if (result?.error) {
          console.error('[Sync] Error saving steps to Supabase:', result.error);
        } else {
          console.log('[Sync] Steps saved to Supabase');
        }
      } catch (err) {
        console.error('[Sync] Unexpected error saving steps:', err);
      }
    }
  };

  const saveOuraLog = async (newLog) => {
    setOuraLog(newLog);
    try {
      await storage.set('lucas-oura-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving oura log: ', err);
    }
  };

  const saveOuraEntry = async (entry) => {
    if (useCloud) {
      try {
        await supabase.saveOura(entry);
      } catch (err) { }
    }
  };

  const saveWaterLog = async (newLog) => {
    setWaterLog(newLog);
    try {
      await storage.set('lucas-water-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving water log:', err);
    }
  };

  const saveWaterEntry = async (entry) => {
    if (useCloud) {
      try {
        await supabase.saveWater(entry);
      } catch (err) {
        console.error('Error guardando agua', err);
        // Don't throw - water is already saved locally, cloud sync can fail silently
      }
    }
  };

  const getTodayWater = () => {
    const today = getArgentinaDateString();
    return waterLog.find(e => e.date === today) || { date: today, glasses: 0, ml: 0 };
  };

  const addWaterGlass = async () => {
    const today = getArgentinaDateString();
    const existingEntry = waterLog.find(e => e.date === today);
    const newEntry = existingEntry
      ? { ...existingEntry, glasses: existingEntry.glasses + 1, ml: (existingEntry.glasses + 1) * 250 }
      : { date: today, glasses: 1, ml: 250 };
    const newLog = existingEntry
      ? waterLog.map(e => e.date === today ? newEntry : e)
      : [...waterLog, newEntry];
    saveWaterLog(newLog);
    saveWaterEntry(newEntry);
    setSaveStatus('💧 +1 vaso');
    setTimeout(() => setSaveStatus(''), 1500);
  };

  const removeWaterGlass = async () => {
    const today = getArgentinaDateString();
    const existingEntry = waterLog.find(e => e.date === today);
    if (!existingEntry || existingEntry.glasses <= 0) return;
    const newEntry = { ...existingEntry, glasses: existingEntry.glasses - 1, ml: (existingEntry.glasses - 1) * 250 };
    const newLog = waterLog.map(e => e.date === today ? newEntry : e);
    saveWaterLog(newLog);
    saveWaterEntry(newEntry);
    setSaveStatus('💧 -1 vaso');
    setTimeout(() => setSaveStatus(''), 1500);
  };

  // Pull to refresh handler
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

  const updateConfig = (newProfile, newTargets) => {
    setLocalConfig({ profile: newProfile, targets: newTargets });
    setProfile(newProfile);
    setCustomTargets(newTargets);
    setConfigDirty(true);
  };

  // Force sync all local data to Supabase
  const forceSyncToCloud = async () => {
    if (!useCloud) {
      console.log('[Sync] Cannot sync - not connected to cloud');
      return { success: false, message: 'No conectado a la nube' };
    }

    setSaveStatus('Sincronizando...');
    let syncedWorkouts = 0;
    let syncedFoods = 0;
    let syncedSteps = 0;
    let syncedOura = 0;
    let syncedWater = 0;
    let syncedWeight = 0;
    let errors = 0;

    try {
      // Sync all workouts
      for (const workout of workoutLog) {
        try {
          await supabase.saveWorkout(workout);
          syncedWorkouts++;
        } catch (err) {
          console.error('[Sync] Failed to sync workout:', workout.id, err);
          errors++;
        }
      }

      // Sync all foods
      for (const food of foodLog) {
        try {
          await supabase.saveFood(food);
          syncedFoods++;
        } catch (err) {
          console.error('[Sync] Failed to sync food:', food.id, err);
          errors++;
        }
      }

      // Sync all steps
      for (const step of stepsLog) {
        try {
          await supabase.saveSteps(step);
          syncedSteps++;
        } catch (err) {
          console.error('[Sync] Failed to sync steps:', step.date, err);
          errors++;
        }
      }

      // Sync all oura entries
      for (const oura of ouraLog) {
        try {
          await supabase.saveOura(oura);
          syncedOura++;
        } catch (err) {
          console.error('[Sync] Failed to sync oura:', oura.date, err);
          errors++;
        }
      }

      // Sync all water entries
      for (const water of waterLog) {
        try {
          await supabase.saveWater(water);
          syncedWater++;
        } catch (err) {
          console.error('[Sync] Failed to sync water:', water.date, err);
          errors++;
        }
      }

      // Sync all weight entries
      for (const weight of weightHistory) {
        try {
          await supabase.saveWeight(weight);
          syncedWeight++;
        } catch (err) {
          console.error('[Sync] Failed to sync weight:', weight.date, err);
          errors++;
        }
      }

      const total = syncedWorkouts + syncedFoods + syncedSteps + syncedOura + syncedWater + syncedWeight;
      const message = `✓ Sincronizado: ${total} registros${errors > 0 ? ` (${errors} errores)` : ''}`;
      setSaveStatus(message);
      setTimeout(() => setSaveStatus(''), 4000);
      console.log('[Sync] Force sync complete:', { syncedWorkouts, syncedFoods, syncedSteps, syncedOura, syncedWater, syncedWeight, errors });
      return { success: true, message, syncedWorkouts, syncedFoods, syncedSteps, syncedOura, syncedWater, syncedWeight, errors };
    } catch (err) {
      console.error('[Sync] Force sync failed:', err);
      setSaveStatus('❌ Error al sincronizar');
      setTimeout(() => setSaveStatus(''), 3000);
      return { success: false, message: err.message };
    }
  };

  const handleLogout = async () => {
    console.log('[Logout] Handling logout in useTrackerData');
    try {
      hasInitialized.current = false;
      setOfflineMode(false);
      setIsLoading(false);

      // Clear localStorage cache to prevent data from previous session
      console.log('[Logout] Clearing localStorage cache...');
      const cacheKeys = [
        'lucas-profile-v5',
        'lucas-weight-history-v5',
        'lucas-food-log-v5',
        'lucas-workout-log-v5',
        'lucas-steps-log-v5',
        'lucas-targets-v5',
        'lucas-oura-log-v5',
        'lucas-water-log-v5'
      ];
      for (const key of cacheKeys) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('[Logout] Failed to clear:', key);
        }
      }

      // Reset state to defaults
      setProfile({ height: 173, currentWeight: 84.9, targetWeight: 75, age: 27, activityLevel: 'moderate', goal: 'cut' });
      setCustomTargets({ calories: 2100, protein: 170, carbs: 180, fat: 70, fiber: 30, trainingDayCaloriesBonus: 200, trainingDayCarbs: 220 });
      setWeightHistory([]);
      setFoodLog([]);
      setWorkoutLog([]);
      setStepsLog([]);
      setOuraLog([]);
      setWaterLog([]);

      // Sign out from Supabase
      await supabase.signOut();

      // Show auth screen
      setShowAuth(true);
      console.log('[Logout] Logout complete');
    } catch (err) {
      console.error('[Logout] Error during logout:', err);
      // Force auth screen anyway
      setShowAuth(true);
    }
  };


  return {
    supabase,
    showAuth, setShowAuth,
    showOnboarding, setShowOnboarding,
    offlineMode, setOfflineMode,
    isLoading, setIsLoading,
    saveStatus, setSaveStatus,
    showMigrationModal, setShowMigrationModal,
    migrationData, setMigrationData,
    profile, setProfile,
    customTargets, setCustomTargets,
    weightHistory, setWeightHistory,
    foodLog, setFoodLog,
    workoutLog, setWorkoutLog,
    stepsLog, setStepsLog,
    ouraLog, setOuraLog,
    waterLog, setWaterLog,
    useCloud,
    storage,
    sortWeightHistory,
    getMostRecentWeight,
    isTrainingDay,
    getTargetsForDate,
    getTotalsForDate,
    isDayCompleted,
    saveProfile,
    saveTargets,
    saveWeightHistory,
    saveWeightEntry,
    saveFoodLog,
    saveFoodEntry,
    deleteFoodEntry,
    saveWorkoutLog,
    saveWorkoutEntry,
    deleteWorkoutEntry,
    saveStepsLog,
    saveStepsEntry,
    saveOuraEntry,
    saveOuraLog,
    saveWaterLog,
    saveWaterEntry,
    getTodayWater,
    addWaterGlass,
    removeWaterGlass,
    handleRefresh,
    forceSyncToCloud,
    updateConfig,
    handleLogout,
    activeTab, setActiveTab,
    newWeight, setNewWeight,
    newWeightTime, setNewWeightTime,
    weightDate, setWeightDate,
    newSteps, setNewSteps,
    stepsDate, setStepsDate,
    selectedFoodDate, setSelectedFoodDate,
    selectedWorkoutDate, setSelectedWorkoutDate,
    dashboardDate, setDashboardDate,
    deleteModal, setDeleteModal,
    undoAction, setUndoAction,
    isRefreshing, setIsRefreshing,
    showFab, setShowFab,

    showWeeklyReport, setShowWeeklyReport,


    editingWeightId, setEditingWeightId,
    editingWeightValue, setEditingWeightValue,
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    importText, setImportText,
    importError, setImportError,

    isMigrating,
    handleMigration
  };
};

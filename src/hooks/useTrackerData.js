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

  // Data states
  const [profile, setProfile] = useState({
    height: 173,
    currentWeight: 84.9,
    targetWeight: 75,
    age: 27,
    activityLevel: 'moderate',
    goal: 'cut'
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
  const [mealTemplates, setMealTemplates] = useState([
    { id: 'tpl-1', name: 'Desayuno típico', meal: 'Desayuno', description: 'Yogur + fruta + granola', calories: 350, protein: 15, carbs: 45, fat: 12, fiber: 5 },
    { id: 'tpl-2', name: 'Almuerzo proteico', meal: 'Almuerzo', description: 'Pollo + arroz + verduras', calories: 550, protein: 45, carbs: 50, fat: 12, fiber: 6 },
    { id: 'tpl-3', name: 'Merienda', meal: 'Merienda', description: 'Café + tostadas', calories: 200, protein: 8, carbs: 25, fat: 8, fiber: 2 },
  ]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateToSave, setTemplateToSave] = useState(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  // Forms
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [newFood, setNewFood] = useState({
    date: getArgentinaDateString(),
    time: '12:00',
    meal: 'Almuerzo',
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: ''
  });

  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    date: getArgentinaDateString(),
    type: 'gym',
    name: '',
    duration: '',
    calories: '',
    volume: '',
    notes: ''
  });

  const [editingWeightId, setEditingWeightId] = useState(null);
  const [editingWeightValue, setEditingWeightValue] = useState('');

  // Import Modals
  const [showImportFoodModal, setShowImportFoodModal] = useState(false);
  const [showImportWorkoutModal, setShowImportWorkoutModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const [newOuraEntry, setNewOuraEntry] = useState({
    date: getArgentinaDateString(),
    sleepScore: '',
    readinessScore: '',
    activityScore: '',
    hrv: '',
    restingHr: '',
    sleepHours: '',
    deepSleepMins: '',
    remSleepMins: '',
    bedtime: '',
    wakeTime: ''
  });

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
        console.log('[Data] Loading localStorage...');
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

        if (localProfile) setProfile(localProfile);
        if (localTargets) setCustomTargets(localTargets);
        if (localWeight.length) setWeightHistory(localWeight);
        if (localFood.length) setFoodLog(localFood);
        if (localWorkout.length) setWorkoutLog(localWorkout);
        if (localSteps.length) setStepsLog(localSteps);
        if (localOura.length) setOuraLog(localOura);
        if (localWater.length) setWaterLog(localWater);

        if (supabase.isAuthenticated && supabase.isOnline && !offlineMode) {
          console.log('[Data] Fetching from Supabase...');
          try {
            const data = await supabase.fetchAllData();
            if (data) {
              if (data.profile) setProfile(data.profile);
              if (data.targets) setCustomTargets(data.targets);
              if (data.weightHistory?.length > 0) setWeightHistory(data.weightHistory);
              if (data.foodLog?.length > 0) setFoodLog(data.foodLog);
              if (data.workouts?.length > 0) setWorkoutLog(data.workouts);
              if (data.stepsLog?.length > 0) setStepsLog(data.stepsLog);
              if (data.ouraLog?.length > 0) setOuraLog(data.ouraLog);
              if (data.waterLog?.length > 0) setWaterLog(data.waterLog);
            }
          } catch (supabaseErr) {
            console.error('[Data] Supabase fetch failed, using localStorage:', supabaseErr);
          }
        }
      } catch (err) {
        console.error('[Data] Error loading data:', err);
      }
      setIsLoading(false);
    };

    loadData();
  }, [supabase.loading, showAuth, offlineMode, supabase.isAuthenticated, supabase.isOnline]);

  // Debounced config save
  useEffect(() => {
    if (!configDirty || !localConfig) return;
    const timer = setTimeout(() => {
      saveProfile(localConfig.profile);
      saveTargets(localConfig.targets);
      setConfigDirty(false);
    }, 800);
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
    return [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  const getMostRecentWeight = (history) => {
    if (history.length === 0) return null;
    return sortWeightHistory(history)[0];
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
        await supabase.saveSteps(entry);
      } catch (err) { }
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
    if (useCloud) await supabase.saveWater(entry);
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

  const updateConfig = (newProfile, newTargets) => {
    setLocalConfig({ profile: newProfile, targets: newTargets });
    setProfile(newProfile);
    setCustomTargets(newTargets);
    setConfigDirty(true);
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
    removeWaterGlass,
    updateConfig,
    activeTab, setActiveTab,
    newWeight, setNewWeight,
    newWeightTime, setNewWeightTime,
    newSteps, setNewSteps,
    stepsDate, setStepsDate,
    selectedFoodDate, setSelectedFoodDate,
    selectedWorkoutDate, setSelectedWorkoutDate,
    dashboardDate, setDashboardDate,
    deleteModal, setDeleteModal,
    undoAction, setUndoAction,
    isRefreshing, setIsRefreshing,
    showFab, setShowFab,
    mealTemplates, setMealTemplates,
    showTemplatesModal, setShowTemplatesModal,
    showSaveTemplateModal, setShowSaveTemplateModal,
    templateToSave, setTemplateToSave,
    showWeeklyReport, setShowWeeklyReport,
    showFoodForm, setShowFoodForm,
    editingFoodId, setEditingFoodId,
    newFood, setNewFood,
    showWorkoutForm, setShowWorkoutForm,
    newWorkout, setNewWorkout,
    editingWeightId, setEditingWeightId,
    editingWeightValue, setEditingWeightValue,
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    importText, setImportText,
    importError, setImportError,
    newOuraEntry, setNewOuraEntry
  };
};

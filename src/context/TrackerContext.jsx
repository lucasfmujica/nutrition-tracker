import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useDataOperations } from '../hooks/useDataOperations';
import { useExport } from '../hooks/useExport';
import { useFoodEntry } from '../hooks/useFoodEntry';
import { useMealTemplates } from '../hooks/useMealTemplates';
import { useOuraEntry } from '../hooks/useOuraEntry';
import { useSupabase } from '../hooks/useSupabase';
import { useWorkoutEntry } from '../hooks/useWorkoutEntry';

// Micro-hooks
import { useBiometrics } from '../hooks/useBiometrics';
import { useGlobalDelete } from '../hooks/useGlobalDelete';
import { useNutrition } from '../hooks/useNutrition';
import { useOuraSync } from '../hooks/useOuraSync'; // Oura Cloud Sync
import { useTrackerSync } from '../hooks/useTrackerSync';
import { useWeightAnalytics } from '../hooks/useWeightAnalytics'; // Intelligence Engine
import { useWorkoutAnalysis } from '../hooks/useWorkoutAnalysis'; // New import
import { useWorkouts } from '../hooks/useWorkouts';

import { addDaysToDate, formatTime, getArgentinaDateString } from '../utils/dateUtils'; // formatTime imported
import { storage } from '../utils/storage';

const TrackerContext = createContext(null);

export const TrackerProvider = ({ children }) => {
  // Service Layer
  const supabase = useSupabase();

  // CRITICAL FIX: Unified useCloud flag
  // Single source of truth for cloud connectivity status
  const [offlineMode, setOfflineMode] = useState(false);
  const useCloud = supabase.isAuthenticated && !offlineMode && supabase.isOnline;

  // UI State that didn't fit into domain hooks
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardDate, setDashboardDate] = useState(getArgentinaDateString());
  const [selectedFoodDate, setSelectedFoodDate] = useState(getArgentinaDateString());
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState(getArgentinaDateString());
  const [stepsDate, setStepsDate] = useState(getArgentinaDateString());

  const [showImportFoodModal, setShowImportFoodModal] = useState(false);
  const [showImportWorkoutModal, setShowImportWorkoutModal] = useState(false);

  // UI Visibility
  const [showFab, setShowFab] = useState(true);

  // Note: importText, newWeight etc moved to local hooks
  // Note: importText, newWeight etc moved to local hooks

  // 1. Core Domains - all use the same useCloud
  const workouts = useWorkouts(supabase, useCloud);
  const biometrics = useBiometrics(supabase, useCloud);

  const nutrition = useNutrition(
    supabase,
    useCloud,
    biometrics.customTargets,
    workouts.isTrainingDay
  );

  // 2. Sync Orchestrator
  const trackerSync = useTrackerSync({
    supabase,
    useCloud, // ← CRITICAL: Pass unified useCloud flag
    offlineMode,
    setOfflineMode,
    // Setters for initial load
    setProfile: biometrics.setProfile,
    setCustomTargets: biometrics.setCustomTargets,
    setWeightHistory: biometrics.setWeightHistory,
    setFoodLog: nutrition.setFoodLog,
    setWorkoutLog: workouts.setWorkoutLog,
    setStepsLog: biometrics.setStepsLog,
    setOuraLog: biometrics.setOuraLog,
    setWaterLog: nutrition.setWaterLog,
    // Data for Force Sync
    foodLog: nutrition.foodLog,
    workoutLog: workouts.workoutLog,
    stepsLog: biometrics.stepsLog,
    ouraLog: biometrics.ouraLog,
    waterLog: nutrition.waterLog,
    weightHistory: biometrics.weightHistory,
    profile: biometrics.profile
  });

  // Wrapper for ConfigTab to update both profile and targets
  const updateConfig = async (newProfile, newTargets) => {
    // Optimistic update
    biometrics.setProfile(newProfile);
    biometrics.setCustomTargets(newTargets);

    // Save to storage/cloud
    try {
      if (newProfile !== biometrics.profile) await biometrics.saveProfile(newProfile);
      if (newTargets !== biometrics.customTargets) await biometrics.saveTargets(newTargets);
    } catch (err) {
      console.error('Error updating config:', err);
      // Revert on error? For now just log
    }
  };

  // 3. Water Actions - Moved to wrapper to keep context clean
  // (We use simple wrappers here or move logic to useNutrition completely later)
  const addWaterGlass = async () => {
    const msg = await nutrition.addWaterGlass();
    if (msg) trackerSync.setSaveStatus(msg); // Simplified
  };

  const removeWaterGlass = async () => {
    const msg = await nutrition.removeWaterGlass();
    if (msg) trackerSync.setSaveStatus(msg); // Simplified
  };

  // 4. Operations (Legacy hooks support)
  const dataOperations = useDataOperations({
    foodLog: nutrition.foodLog,
    saveFoodLog: nutrition.saveFoodLog,
    workoutLog: workouts.workoutLog,
    saveWorkoutLog: workouts.saveWorkoutLog,
    saveFoodEntry: nutrition.saveFooEntry, // Note: typo in useNutrition? checked: saveFoodEntry
    saveWorkoutEntry: workouts.saveWorkoutEntry,
    supabase,
    useCloud, // ← CRITICAL FIX: Use unified useCloud from TrackerContext
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    setSaveStatus: trackerSync.setSaveStatus,
    dashboardDate
  });

  // 5. Analytics
  const analytics = useAnalytics({
    weightHistory: biometrics.weightHistory,
    foodLog: nutrition.foodLog,
    workoutLog: workouts.workoutLog,
    stepsLog: biometrics.stepsLog,
    customTargets: biometrics.customTargets,
    getTotalsForDate: nutrition.getTotalsForDate,
    getTargetsForDate: nutrition.getTargetsForDate
  });

  // 5b. Intelligence Engine - Weight Analytics (needed by useExport)
  const weightAnalytics = useWeightAnalytics(
    biometrics.weightHistory,
    nutrition.foodLog,
    biometrics.customTargets,
    biometrics.profile.currentWeight
  );

  // 6. Export
  const exportDoc = useExport({
    profile: biometrics.profile, setProfile: biometrics.setProfile,
    customTargets: biometrics.customTargets, setCustomTargets: biometrics.setCustomTargets,
    weightHistory: biometrics.weightHistory, saveWeightHistory: biometrics.saveWeightHistory,
    foodLog: nutrition.foodLog, saveFoodLog: nutrition.saveFoodLog,
    workoutLog: workouts.workoutLog, saveWorkoutLog: workouts.saveWorkoutLog,
    stepsLog: biometrics.stepsLog, saveStepsLog: biometrics.saveStepsLog,
    ouraLog: biometrics.ouraLog, saveOuraLog: biometrics.saveOuraLog,
    getMostRecentWeight: biometrics.getMostRecentWeight,
    getTotalsForDate: nutrition.getTotalsForDate,
    getTargetsForDate: nutrition.getTargetsForDate,
    getStepsForDate: (date) => biometrics.stepsLog.find(s => s.date === date)?.steps || 0,
    getWorkoutsForDate: (date) => workouts.workoutLog.filter(entry => entry.date === date)
  }, analytics, weightAnalytics); // Pass analytics as 2nd arg, weightAnalytics as 3rd

  // 7. Food Entry
  const foodEntry = useFoodEntry({
    foodLog: nutrition.foodLog,
    saveFoodLog: nutrition.saveFoodLog,
    saveFoodEntry: nutrition.saveFoodEntry,
    setSaveStatus: trackerSync.setSaveStatus
  });

  // 8. Workout Entry
  const workoutEntry = useWorkoutEntry({
    workoutLog: workouts.workoutLog,
    saveWorkoutLog: workouts.saveWorkoutLog,
    saveWorkoutEntry: workouts.saveWorkoutEntry
  });

  // 9. Meal Templates
  const mealTemplates = useMealTemplates({
    storage,
    setSaveStatus: trackerSync.setSaveStatus,
    selectedFoodDate,
    saveFoodLog: nutrition.saveFoodLog,
    foodLog: nutrition.foodLog,
    saveFoodEntry: nutrition.saveFoodEntry
  });

  // 10. Oura Entry
  const ouraEntry = useOuraEntry({
    ouraLog: biometrics.ouraLog,
    saveOuraLog: biometrics.saveOuraLog,
    saveOuraEntry: biometrics.saveOuraEntry
  });

  // 11. Global Delete Actions
  const globalDelete = useGlobalDelete(nutrition, workouts, biometrics, supabase, useCloud);

  // 12. Oura Sync Service
  const ouraSync = useOuraSync({
    saveOuraEntry: biometrics.saveOuraEntry,
    saveStepsEntry: biometrics.saveStepsEntry
  });

  // Derived State
  const workoutAnalysis = useWorkoutAnalysis(workouts.workoutLog);

  // Derived state helpers

  const getWorkoutsForDate = (date) => workouts.workoutLog.filter(entry => entry.date === date);
  const getStepsForDate = (date) => biometrics.stepsLog.find(s => s.date === date)?.steps || 0;
  const changeDate = (dateStr, delta) => addDaysToDate(dateStr, delta);



  // Combine everything into value
  const value = useMemo(() => ({
    // Inherit everything from hooks
    ...trackerSync,
    ...nutrition,
    ...biometrics,
    ...workouts,

    // UI State
    activeTab, setActiveTab,
    dashboardDate, setDashboardDate,
    selectedWorkoutDate, setSelectedWorkoutDate,
    stepsDate, setStepsDate, // Added stepsDate
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    showFab, setShowFab,

    // Delete Modal & Undo
    // Delete Modal & Undo
    ...globalDelete,

    // Overrides
    addWaterGlass, // Wrapped version
    removeWaterGlass, // Wrapped version
    updateConfig, // Wrapped version

    // Legacy hooks results
    ...dataOperations,
    ...analytics,
    ...exportDoc,
    ...foodEntry,
    ...workoutEntry,
    ...mealTemplates,
    ...ouraEntry,
    ...ouraSync, // Expose syncOuraData, isSyncing, syncStatus

    // Intelligence Engine
    ...weightAnalytics,

    // Helpers
    workoutAnalysis,
    getWorkoutsForDate,
    getStepsForDate,
    changeDate,
    formatTime,
    storage,
    supabase
  }), [
    trackerSync, nutrition, biometrics, workouts,
    activeTab, // Added dependency
    dashboardDate, selectedFoodDate, selectedWorkoutDate, stepsDate, // Added dependency
    showImportFoodModal, showImportWorkoutModal,
    globalDelete,
    dataOperations, analytics, exportDoc, foodEntry, workoutEntry, mealTemplates, ouraEntry, ouraSync,
    weightAnalytics, workoutAnalysis, supabase,
    showFab // Added dependency
  ]);

  return (
    <TrackerContext.Provider value={value}>
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useBiometrics } from '../hooks/useBiometrics';
import { useDataOperations } from '../hooks/useDataOperations';
import { useExport } from '../hooks/useExport';
import { useFoodEntry } from '../hooks/useFoodEntry';
import { useGlobalDelete } from '../hooks/useGlobalDelete';
import { useMealTemplates } from '../hooks/useMealTemplates';
import { useNutrition } from '../hooks/useNutrition';
import { useOuraSync } from '../hooks/useOuraSync';
import { useQuickLog } from '../hooks/useQuickLog';
import { useSafetyNet } from '../hooks/useSafetyNet';
import { useSupabase } from '../hooks/useSupabase';
import { useTrackerActions } from '../hooks/useTrackerActions';
import { useTrackerAnalytics } from '../hooks/useTrackerAnalytics';
import { useTrackerSync } from '../hooks/useTrackerSync';
import { useTrackerUIState } from '../hooks/useTrackerUIState';
import { useWeightEditing } from '../hooks/useWeightEditing';
import { useWorkoutEntry } from '../hooks/useWorkoutEntry';
import { useWorkouts } from '../hooks/useWorkouts';

const TrackerContext = createContext(null);

export const TrackerProvider = ({ children }) => {
  // Service Layer
  const supabase = useSupabase();

  // CRITICAL FIX: Unified useCloud flag
  // Single source of truth for cloud connectivity status
  const [offlineMode, setOfflineMode] = useState(false);
  const useCloud = supabase.isAuthenticated && !offlineMode && supabase.isOnline;

  // 0. Shared state for templates (needed by both sync and template hook)
  const [mealTemplatesData, setMealTemplatesData] = useState([]);

  // 1. UI State (extracted hook)
  const uiState = useTrackerUIState();

  // 2. Core Domains - all use the same useCloud
  const workouts = useWorkouts(supabase, useCloud);
  const biometrics = useBiometrics(supabase, useCloud);

  // 3. Modo Escudo (Safety Net)
  const safetyNet = useSafetyNet(
    biometrics.profile,
    biometrics.customTargets,
    biometrics.saveProfile
  );

  // 4. Nutrition with Safety Net integration
  const nutrition = useNutrition(
    supabase,
    useCloud,
    biometrics.customTargets,
    workouts.isTrainingDay,
    safetyNet.getTargetsForDate,
    safetyNet.shouldTagAsSafetyNetDay,
    workouts.workoutLog
  );

  // 5. Weight Editing (extracted hook)
  const weightEditing = useWeightEditing(biometrics);

  // 6. Sync Orchestrator
  const trackerSync = useTrackerSync({
    supabase,
    useCloud,
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
    setMealTemplates: setMealTemplatesData,
    // Data for Force Sync
    foodLog: nutrition.foodLog,
    workoutLog: workouts.workoutLog,
    stepsLog: biometrics.stepsLog,
    ouraLog: biometrics.ouraLog,
    waterLog: nutrition.waterLog,
    weightHistory: biometrics.weightHistory,
    profile: biometrics.profile
  });

  // 7. Analytics & Intelligence (extracted hook - WITH date reactivity)
  const analytics = useTrackerAnalytics({
    dashboardDate: uiState.dashboardDate,  // ✅ CRITICAL FIX: Date-reactive
    biometrics,
    nutrition,
    workouts,
    safetyNet,
    updateConfig: null  // Will be defined in actions
  });

  // 8. Actions (extracted hook - needs updateConfig closure)
  const updateConfigClosure = async (newProfile, newTargets) => {
    biometrics.setProfile(newProfile);
    biometrics.setCustomTargets(newTargets);
    try {
      if (newProfile !== biometrics.profile) await biometrics.saveProfile(newProfile);
      if (newTargets !== biometrics.customTargets) await biometrics.saveTargets(newTargets);
    } catch (err) {
      console.error('Error updating config:', err);
    }
  };

  const actions = useTrackerActions({
    nutrition,
    biometrics,
    workouts,
    trackerSync
  });

  // Override updateConfig in actions (needed for dynamicTargets)
  const updateConfig = updateConfigClosure;

  // 9. Operations (Legacy hooks support)
  const dataOperations = useDataOperations({
    foodLog: nutrition.foodLog,
    saveFoodLog: nutrition.saveFoodLog,
    workoutLog: workouts.workoutLog,
    saveWorkoutLog: workouts.saveWorkoutLog,
    saveFoodEntry: nutrition.saveFoodEntry,
    saveWorkoutEntry: workouts.saveWorkoutEntry,
    supabase,
    useCloud,
    showImportFoodModal: uiState.showImportFoodModal,
    setShowImportFoodModal: uiState.setShowImportFoodModal,
    showImportWorkoutModal: uiState.showImportWorkoutModal,
    setShowImportWorkoutModal: uiState.setShowImportWorkoutModal,
    setSaveStatus: trackerSync.setSaveStatus,
    dashboardDate: uiState.dashboardDate
  });

  // 10. Export
  const exportDoc = useExport({
    profile: biometrics.profile,
    setProfile: biometrics.setProfile,
    customTargets: biometrics.customTargets,
    setCustomTargets: biometrics.setCustomTargets,
    weightHistory: biometrics.weightHistory,
    saveWeightHistory: biometrics.saveWeightHistory,
    foodLog: nutrition.foodLog,
    saveFoodLog: nutrition.saveFoodLog,
    workoutLog: workouts.workoutLog,
    saveWorkoutLog: workouts.saveWorkoutLog,
    stepsLog: biometrics.stepsLog,
    saveStepsLog: biometrics.saveStepsLog,
    ouraLog: biometrics.ouraLog,
    saveOuraLog: biometrics.saveOuraLog,
    getMostRecentWeight: biometrics.getMostRecentWeight,
    getTotalsForDate: nutrition.getTotalsForDate,
    getTargetsForDate: nutrition.getTargetsForDate,
    getStepsForDate: (date) => biometrics.stepsLog.find(s => s.date === date)?.steps || 0,
    getWorkoutsForDate: (date) => workouts.workoutLog.filter(entry => entry.date === date)
  }, analytics, analytics.weightAnalytics);

  // 11. Food Entry
  const foodEntry = useFoodEntry({
    foodLog: nutrition.foodLog,
    saveFoodLog: nutrition.saveFoodLog,
    saveFoodEntry: nutrition.saveFoodEntry,
    setSaveStatus: trackerSync.setSaveStatus
  });

  // 12. Fast-Log Library
  const quickLog = useQuickLog(nutrition.foodLog, nutrition.saveFoodEntry);

  // 13. Workout Entry
  const workoutEntry = useWorkoutEntry({
    workoutLog: workouts.workoutLog,
    saveWorkoutLog: workouts.saveWorkoutLog,
    saveWorkoutEntry: workouts.saveWorkoutEntry
  });

  // 14. Meal Templates
  const mealTemplates = useMealTemplates({
    mealTemplates: mealTemplatesData,
    setMealTemplates: setMealTemplatesData,
    storage: actions.storage,
    setSaveStatus: trackerSync.setSaveStatus,
    selectedFoodDate: uiState.selectedFoodDate,
    saveFoodLog: nutrition.saveFoodLog,
    foodLog: nutrition.foodLog,
    saveFoodEntry: nutrition.saveFoodEntry,
    saveTemplate: supabase.saveTemplate,
    deleteTemplateDb: supabase.deleteTemplateDb,
    useCloud
  });

  // 15. Global Delete Actions
  const globalDelete = useGlobalDelete(nutrition, workouts, biometrics, supabase, useCloud);

  // 16. Oura Sync Service
  const ouraSync = useOuraSync({
    saveOuraEntry: biometrics.saveOuraEntry,
    saveStepsEntry: biometrics.saveStepsEntry
  });

  // Combine everything into value
  const value = useMemo(() => ({
    // Sync & Core Domains
    ...trackerSync,
    ...nutrition,
    ...biometrics,
    ...workouts,

    // UI State (extracted)
    ...uiState,

    // Weight Editing (extracted)
    ...weightEditing,

    // Analytics & Intelligence (extracted)
    ...analytics,

    // Actions (extracted)
    ...actions,
    updateConfig,  // Override from closure

    // Delete Modal & Undo
    ...globalDelete,

    // Entry Hooks
    ...dataOperations,
    ...foodEntry,
    ...workoutEntry,
    ...mealTemplates,

    // Oura Sync
    ...ouraSync,

    // Fast-Log Library
    ...quickLog,

    // Modo Escudo (Safety Net)
    ...safetyNet,

    // Supabase
    supabase
  }), [
    trackerSync,
    nutrition,
    biometrics,
    workouts,
    uiState,
    weightEditing,
    analytics,
    actions,
    updateConfig,
    globalDelete,
    dataOperations,
    foodEntry,
    workoutEntry,
    mealTemplates,
    ouraSync,
    quickLog,
    safetyNet,
    supabase
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

import React, { createContext, useContext, useMemo } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useDataOperations } from '../hooks/useDataOperations';
import { useExport } from '../hooks/useExport';
import { useFoodEntry } from '../hooks/useFoodEntry';
import { useMealTemplates } from '../hooks/useMealTemplates';
import { useOuraEntry } from '../hooks/useOuraEntry';
import { useTrackerData } from '../hooks/useTrackerData';
import { useWorkoutEntry } from '../hooks/useWorkoutEntry';
import { addDaysToDate, getArgentinaDateString, getMondayOfWeek } from '../utils/dateUtils';

const TrackerContext = createContext(null);

export const TrackerProvider = ({ children }) => {
  // 1. Core Data
  const trackerData = useTrackerData();
  const {
    supabase,
    saveStatus, setSaveStatus,
    foodLog, saveFoodLog, saveFoodEntry,
    workoutLog, saveWorkoutLog, saveWorkoutEntry,
    stepsLog, saveStepsLog,
    weightHistory, saveWeightHistory,
    ouraLog, saveOuraLog, saveOuraEntry,
    customTargets, setCustomTargets,
    profile, setProfile,
    dashboardDate,
    selectedFoodDate,
    useCloud,
    storage,
    getTotalsForDate,
    getTargetsForDate,
    getMostRecentWeight
  } = trackerData;

  // 2. Operations
  const dataOperations = useDataOperations({
    foodLog, saveFoodLog,
    workoutLog, saveWorkoutLog,
    saveFoodEntry, saveWorkoutEntry,
    supabase, useCloud,
    showImportFoodModal: trackerData.showImportFoodModal,
    setShowImportFoodModal: trackerData.setShowImportFoodModal,
    showImportWorkoutModal: trackerData.showImportWorkoutModal,
    setShowImportWorkoutModal: trackerData.setShowImportWorkoutModal,
    importText: trackerData.importText,
    setImportText: trackerData.setImportText,
    importError: trackerData.importError,
    setImportError: trackerData.setImportError,
    setSaveStatus,
    dashboardDate
  });

  // 3. Analytics
  const analytics = useAnalytics({
    weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    customTargets,
    getTotalsForDate,
    getTargetsForDate
  });

  // 4. Export
  const exportDoc = useExport({
    profile, setProfile,
    customTargets, setCustomTargets,
    weightHistory, saveWeightHistory,
    foodLog, saveFoodLog,
    workoutLog, saveWorkoutLog,
    stepsLog, saveStepsLog,
    ouraLog, saveOuraLog,
    getMostRecentWeight,
    getTotalsForDate,
    getTargetsForDate,
    getStepsForDate: (date) => stepsLog.find(s => s.date === date)?.steps || 0,
    getWorkoutsForDate: (date) => workoutLog.filter(entry => entry.date === date)
  });

  // 5. Food Entry
  const foodEntry = useFoodEntry({
    foodLog,
    saveFoodLog,
    saveFoodEntry,
    setSaveStatus
  });

  // 6. Workout Entry
  const workoutEntry = useWorkoutEntry({
    workoutLog,
    saveWorkoutLog,
    saveWorkoutEntry
  });

  // 7. Meal Templates
  const mealTemplates = useMealTemplates({
    storage,
    setSaveStatus,
    selectedFoodDate,
    saveFoodLog,
    foodLog,
    saveFoodEntry
  });

  // 8. Oura Entry
  const ouraEntry = useOuraEntry({
    ouraLog,
    saveOuraLog,
    saveOuraEntry
  });

  // Derived State (re-implemented from NutritionTracker to keep it available in context)
  const workoutAnalysis = useMemo(() => {
    const today = getArgentinaDateString();
    const monday = getMondayOfWeek(today);
    const sunday = addDaysToDate(monday, 6);

    const currentWeekWorkouts = workoutLog.filter(w => w.date >= monday && w.date <= sunday);

    const gymCount = currentWeekWorkouts.filter(w => w.type === 'gym').length;
    const tennisCount = currentWeekWorkouts.filter(w => w.type === 'tennis').length;
    const totalDuration = currentWeekWorkouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);

    const analysis = [];
    if (gymCount >= 3) analysis.push('¡Excelente constancia en el gimnasio!');
    if (tennisCount >= 2) analysis.push('Buen volumen de tenis esta semana.');
    if (totalDuration > 300) analysis.push('Alta intensidad semanal 🔥');
    if (analysis.length === 0 && currentWeekWorkouts.length > 0) analysis.push('¡Sigue sumando movimiento!');
    if (currentWeekWorkouts.length === 0) analysis.push('Sin actividad registrada esta semana.');

    const weekStartDate = new Date(monday + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

    return {
      weekStart: weekStartDate,
      gymCount,
      tennisCount,
      totalDuration,
      analysis
    };
  }, [workoutLog]);

  // Derived state helpers
  const getFoodsForDate = (date) => foodLog.filter(entry => entry.date === date);
  const getWorkoutsForDate = (date) => workoutLog.filter(entry => entry.date === date);
  const getStepsForDate = (date) => stepsLog.find(s => s.date === date)?.steps || 0;
  const changeDate = (dateStr, delta) => addDaysToDate(dateStr, delta);

  // Format timestamp to time string
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
  };

  // Combine everything into value
  const value = useMemo(() => ({
    ...trackerData,
    ...dataOperations,
    ...analytics,
    ...exportDoc,
    ...foodEntry,
    ...workoutEntry,
    ...mealTemplates,
    ...ouraEntry,
    workoutAnalysis,
    getFoodsForDate,
    getWorkoutsForDate,
    getStepsForDate,
    changeDate,
    formatTime,
  }), [
    trackerData,
    dataOperations,
    analytics,
    exportDoc,
    foodEntry,
    workoutEntry,
    mealTemplates,
    ouraEntry,
    workoutAnalysis
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

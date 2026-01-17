import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

export const useDataOperations = (trackerData) => {
  const {
    foodLog, saveFoodLog,
    workoutLog, saveWorkoutLog,
    saveFoodEntry, saveWorkoutEntry,
    supabase, useCloud,
    // imports state is managed in trackerData
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    importText, setImportText,
    importError, setImportError,
    // other needed state
    dashboardDate,
  } = trackerData;

  // Add or update food entry (for IA imports with deduplication)
  const upsertFood = async (entry) => {
    const finalEntry = { ...entry, id: entry.id || `f-${Date.now()}` };

    if (!entry.sourceId) {
      // No sourceId, just add
      saveFoodLog([...foodLog, finalEntry]);
      // Sync to Supabase
      if (useCloud) {
        try {
          await supabase.saveFood(finalEntry);
          console.log('[Sync] Food synced to Supabase:', finalEntry.id);
        } catch (err) {
          console.error('[Sync] Failed to sync food:', err);
        }
      }
      return;
    }

    // Check for existing entry with same sourceId
    const existingIndex = foodLog.findIndex(f => f.sourceId === entry.sourceId);
    if (existingIndex >= 0) {
      // Update existing
      const newLog = [...foodLog];
      newLog[existingIndex] = { ...newLog[existingIndex], ...entry };
      saveFoodLog(newLog);
      // Sync update to Supabase
      if (useCloud) {
        try {
          await supabase.saveFood(newLog[existingIndex]);
        } catch (err) {
          console.error('[Sync] Failed to sync food update:', err);
        }
      }
    } else {
      // Add new
      saveFoodLog([...foodLog, finalEntry]);
      // Sync new entry to Supabase
      if (useCloud) {
        try {
          await supabase.saveFood(finalEntry);
          console.log('[Sync] Food synced to Supabase:', finalEntry.id);
        } catch (err) {
          console.error('[Sync] Failed to sync food:', err);
        }
      }
    }
  };

  // Add or update workout entry (for IA imports with deduplication)
  const upsertWorkout = async (entry) => {
    const finalEntry = { ...entry, id: entry.id || `w-${Date.now()}` };

    if (!entry.sourceId) {
      saveWorkoutLog([...workoutLog, finalEntry]);
      // Sync to Supabase
      if (useCloud) {
        try {
          await supabase.saveWorkout(finalEntry);
          console.log('[Sync] Workout synced to Supabase:', finalEntry.id);
        } catch (err) {
          console.error('[Sync] Failed to sync workout:', err);
        }
      }
      return;
    }

    const existingIndex = workoutLog.findIndex(w => w.sourceId === entry.sourceId);
    if (existingIndex >= 0) {
      const newLog = [...workoutLog];
      newLog[existingIndex] = { ...newLog[existingIndex], ...entry };
      saveWorkoutLog(newLog);
      // Sync update to Supabase
      if (useCloud) {
        try {
          await supabase.saveWorkout(newLog[existingIndex]);
        } catch (err) {
          console.error('[Sync] Failed to sync workout update:', err);
        }
      }
    } else {
      saveWorkoutLog([...workoutLog, finalEntry]);
      // Sync new entry to Supabase
      if (useCloud) {
        try {
          await supabase.saveWorkout(finalEntry);
          console.log('[Sync] Workout synced to Supabase:', finalEntry.id);
        } catch (err) {
          console.error('[Sync] Failed to sync workout:', err);
        }
      }
    }
  };

  // Confirm/review an entry
  const confirmFood = (id) => {
    const newLog = foodLog.map(f => f.id === id ? { ...f, reviewed: true } : f);
    saveFoodLog(newLog);
  };

  const confirmWorkout = (id) => {
    const newLog = workoutLog.map(w => w.id === id ? { ...w, reviewed: true } : w);
    saveWorkoutLog(newLog);
  };

  // Copy meals from yesterday
  const copyMealsFromYesterday = () => {
    // Helper to calculate yesterday from a date string (YYYY-MM-DD)
    const yesterday = addDaysToDate(dashboardDate, -1);
    const yesterdayMeals = foodLog.filter(f => f.date === yesterday);
    if (yesterdayMeals.length === 0) {
      alert('No hay comidas de ayer para copiar');
      return;
    }
    const newMeals = yesterdayMeals.map(meal => ({
      ...meal,
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: dashboardDate
    }));
    saveFoodLog([...foodLog, ...newMeals]);
  };

  // Import food from JSON text
  const handleImportFood = () => {
    setImportError('');
    try {
      const data = JSON.parse(importText);
      const entries = Array.isArray(data) ? data : [data];

      entries.forEach(entry => {
        const foodEntry = {
          id: entry.id || `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: entry.date || getArgentinaDateString(),
          time: entry.time || '',
          meal: entry.meal || 'Almuerzo',
          name: entry.name || 'Comida importada',
          description: entry.description || '',
          calories: parseInt(entry.calories) || 0,
          protein: parseInt(entry.protein) || 0,
          carbs: parseInt(entry.carbs) || 0,
          fat: parseInt(entry.fat) || 0,
          fiber: parseInt(entry.fiber) || 0,
          source: entry.source || 'ai-text',
          reviewed: false,
          confidence: entry.confidence || 0.8,
          sourceId: entry.sourceId || `import-${Date.now()}`
        };
        upsertFood(foodEntry);
      });

      setShowImportFoodModal(false);
      setImportText('');
    } catch (e) {
      setImportError('JSON inválido. Revisá el formato.');
    }
  };

  // Import workout from JSON text
  const handleImportWorkout = () => {
    setImportError('');
    try {
      const data = JSON.parse(importText);
      const entries = Array.isArray(data) ? data : [data];

      entries.forEach(entry => {
        const workoutEntry = {
          id: entry.id || `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: entry.date || getArgentinaDateString(),
          type: entry.type || 'gym',
          name: entry.name || 'Entreno importado',
          duration: parseInt(entry.duration) || 0,
          calories: parseInt(entry.calories) || 0,
          volume: parseInt(entry.volume) || 0,
          exercises: entry.exercises || [],
          notes: entry.notes || '',
          source: entry.source || 'ai-text',
          reviewed: false,
          confidence: entry.confidence || 0.8,
          sourceId: entry.sourceId || `import-${Date.now()}`
        };
        upsertWorkout(workoutEntry);
      });

      setShowImportWorkoutModal(false);
      setImportText('');
    } catch (e) {
      setImportError('JSON inválido. Revisá el formato.');
    }
  };

  return {
    upsertFood,
    upsertWorkout,
    confirmFood,
    confirmWorkout,
    copyMealsFromYesterday,
    handleImportFood,
    handleImportWorkout
  };
};

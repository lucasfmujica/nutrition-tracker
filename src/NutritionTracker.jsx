import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthUI } from './components/AuthUI';
import { BottomNav } from './components/BottomNav';
import { SimpleBarChart } from './components/Charts/SimpleBarChart';
import { WeightLineChart } from './components/Charts/WeightLineChart';
import { ActivityCards } from './components/Dashboard/ActivityCards';
import { AdherenceCard } from './components/Dashboard/AdherenceCard';
import { MacroCards } from './components/Dashboard/MacroCards';
import { SummaryCard } from './components/Dashboard/SummaryCard';
import { TrainingWidget } from './components/Dashboard/TrainingWidget';
import { WeightChartCard } from './components/Dashboard/WeightChartCard';
import { DaySummary } from './components/Diary/DaySummary';
import { MealSection } from './components/Diary/MealSection';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Layout } from './components/Layout';
import { DeleteConfirmModal } from './components/Modals/DeleteConfirmModal';
import { FoodFormModal } from './components/Modals/FoodFormModal';
import { ImportModal } from './components/Modals/ImportModal';
import { MigrationModal } from './components/Modals/MigrationModal';
import { WorkoutFormModal } from './components/Modals/WorkoutFormModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PullToRefresh } from './components/PullToRefresh';
import { SwipeableItem } from './components/SwipeableItem';
import { OuraTab } from './components/Tabs/OuraTab';
import { StepsTab } from './components/Tabs/StepsTab';
import { WeightTab } from './components/Tabs/WeightTab';
import { CircularProgress } from './components/UI/CircularProgress';
import { MiniBar } from './components/UI/MiniBar';
import { ProgressBar } from './components/UI/ProgressBar';
import { WeeklyReport } from './components/WeeklyReport';
import { useFoodEntry } from './hooks/useFoodEntry';
import { useMealTemplates } from './hooks/useMealTemplates';
import { useOuraEntry } from './hooks/useOuraEntry';
import { useTrackerData } from './hooks/useTrackerData';
import { useWorkoutEntry } from './hooks/useWorkoutEntry';
import { ARGENTINA_TZ, addDaysToDate, getArgentinaDateString, getArgentinaDay, getMondayOfWeek } from './utils/dateUtils';
import { downloadBackup, downloadFile, generateNutritionistReport, parseBackupFile } from './utils/exportUtils';

const WATER_GOAL_GLASSES = 8;

const NutritionTracker = () => {
  // Use custom hook for all data management
  const {
    supabase,
    showAuth, setShowAuth,
    showOnboarding, setShowOnboarding,
    offlineMode, setOfflineMode,
    isLoading,
    saveStatus, setSaveStatus,
    showMigrationModal, setShowMigrationModal,
    migrationData, setMigrationData,
    profile,
    customTargets,
    weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    ouraLog,
    waterLog,
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
    saveOuraLog,
    saveOuraEntry,
    saveWaterLog,
    saveWaterEntry,
    getTodayWater,
    addWaterGlass,
    removeWaterGlass,
    handleRefresh,
    handleLogout,
    forceSyncToCloud,
    updateConfig,
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

    handleMigration,
    editingWeightId, setEditingWeightId,
    editingWeightValue, setEditingWeightValue,
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    importText, setImportText,
    importError, setImportError,
    isMigrating
  } = useTrackerData();

  const {
    showFoodForm, setShowFoodForm,
    editingFoodId, setEditingFoodId,
    newFood, setNewFood,
    addManualFood
  } = useFoodEntry({
    foodLog,
    saveFoodLog,
    saveFoodEntry,
    setSaveStatus
  });

  const {
    showWorkoutForm, setShowWorkoutForm,
    newWorkout, setNewWorkout,
    addManualWorkout
  } = useWorkoutEntry({
    workoutLog,
    saveWorkoutLog,
    saveWorkoutEntry
  });

  const {
    mealTemplates,
    showTemplatesModal, setShowTemplatesModal,
    showSaveTemplateModal, setShowSaveTemplateModal,
    templateToSave, setTemplateToSave,
    saveAsTemplate,
    confirmSaveTemplate,
    deleteTemplate,
    addFromTemplate
  } = useMealTemplates({
    storage,
    setSaveStatus,
    selectedFoodDate,
    saveFoodLog,
    foodLog,
    saveFoodEntry
  });

  const {
    newOuraEntry, setNewOuraEntry,
    addOuraEntry
  } = useOuraEntry({
    ouraLog,
    saveOuraLog,
    saveOuraEntry
  });

  // Derived state for Dashboard
  const dashboardTotals = getTotalsForDate(dashboardDate);
  const dashboardTargets = getTargetsForDate(dashboardDate);




  // Add weight entry with time
  const addWeightEntry = async () => {
    if (!newWeight) return;
    // Parse time input and use selected date to create timestamp
    const [hours, minutes] = newWeightTime.split(':').map(Number);
    const [year, month, day] = weightDate.split('-').map(Number);

    // Create date in Argentina timezone
    const argDate = new Date();
    // Use the selected date and time
    const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);

    const entry = {
      id: `wh-${Date.now()}`,
      date: weightDate,
      weight: parseFloat(newWeight),
      timestamp: dateObj.getTime()
    };
    saveWeightHistory([...weightHistory, entry]);
    await saveWeightEntry(entry); // Save to Supabase
    setNewWeight('');
    setNewWeightTime('09:00');
    // Keep the weightDate as it might be useful for batch entry, or reset to today?
    // User probably wants to stay on the chosen date if they have multiple entries to log.
  };

  // Show delete confirmation
  const confirmDelete = (type, id, name) => {
    setDeleteModal({ show: true, type, id, name });
  };

  // Execute delete with undo option - syncs to Supabase
  const executeDelete = async () => {
    const { type, id } = deleteModal;

    if (type === 'food') {
      const item = foodLog.find(f => f.id === id);
      const newLog = foodLog.filter(f => f.id !== id);
      saveFoodLog(newLog);

      // Sync deletion to Supabase
      if (useCloud) {
        try {
          await supabase.deleteFood(id);
          console.log('[Sync] Food deleted from Supabase:', id);
        } catch (err) {
          console.error('[Sync] Failed to delete food from Supabase:', err);
        }
      }

      setUndoAction({
        type: 'food',
        item,
        restore: async () => {
          saveFoodLog([...newLog, item]);
          // Re-add to Supabase on undo
          if (useCloud && item) {
            await supabase.saveFood(item);
          }
        }
      });
    } else if (type === 'workout') {
      const item = workoutLog.find(w => w.id === id);
      const newLog = workoutLog.filter(w => w.id !== id);
      saveWorkoutLog(newLog);

      // Sync deletion to Supabase
      if (useCloud) {
        try {
          await supabase.deleteWorkout(id);
          console.log('[Sync] Workout deleted from Supabase:', id);
        } catch (err) {
          console.error('[Sync] Failed to delete workout from Supabase:', err);
        }
      }

      setUndoAction({
        type: 'workout',
        item,
        restore: async () => {
          saveWorkoutLog([...newLog, item]);
          if (useCloud && item) {
            await supabase.saveWorkout(item);
          }
        }
      });
    } else if (type === 'weight') {
      const item = weightHistory.find(w => w.id === id || weightHistory.indexOf(w) === id);
      const newHistory = weightHistory.filter(w => w.id !== id && weightHistory.indexOf(w) !== id);
      saveWeightHistory(newHistory);

      // Sync deletion to Supabase
      if (useCloud && item) {
        try {
          await supabase.deleteWeight(item.id);
          console.log('[Sync] Weight deleted from Supabase:', item.id);
        } catch (err) {
          console.error('[Sync] Failed to delete weight from Supabase:', err);
        }
      }

      setUndoAction({
        type: 'weight',
        item,
        restore: async () => {
          saveWeightHistory([...newHistory, item]);
          if (useCloud && item) {
            await supabase.saveWeight(item);
          }
        }
      });
    }

    setDeleteModal({ show: false, type: '', id: null, name: '' });
  };

  // Copy meals from yesterday
  const copyMealsFromYesterday = () => {
    const yesterday = changeDate(dashboardDate, -1);
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

  // Start editing weight by ID
  const startEditWeight = (id) => {
    const entry = weightHistory.find(w => w.id === id);
    if (entry) {
      setEditingWeightId(id);
      setEditingWeightValue(entry.weight.toString());
    }
  };

  // Save edited weight by ID
  const saveEditWeight = () => {
    if (!editingWeightId || !editingWeightValue) return;
    const newHistory = weightHistory.map(entry =>
      entry.id === editingWeightId
        ? { ...entry, weight: parseFloat(editingWeightValue) }
        : entry
    );
    saveWeightHistory(newHistory);
    setEditingWeightId(null);
    setEditingWeightValue('');
  };

  // Cancel weight edit
  const cancelEditWeight = () => {
    setEditingWeightId(null);
    setEditingWeightValue('');
  };

  // Add steps entry
  const addStepsEntry = async () => {
    if (!newSteps) return;
    const entry = { date: stepsDate, steps: parseInt(newSteps) };
    const existingIndex = stepsLog.findIndex(s => s.date === stepsDate);
    let newLog;
    if (existingIndex >= 0) {
      newLog = [...stepsLog];
      newLog[existingIndex] = entry;
    } else {
      newLog = [...stepsLog, entry];
    }
    newLog.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveStepsLog(newLog);
    await saveStepsEntry(entry); // Save to Supabase
    setNewSteps('');
  };







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

  // Export all data as JSON backup
  const exportBackup = () => {
    try {
      downloadBackup({
        profile,
        customTargets,
        weightHistory,
        foodLog,
        workoutLog,
        stepsLog,
        ouraLog
      });
    } catch (err) {
      console.error('Error exporting backup:', err);
      alert('Error al exportar backup');
    }
  };

  // Import backup from JSON file
  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseBackupFile(file);

      if (data.profile) setProfile(data.profile);
      if (data.customTargets) setCustomTargets(data.customTargets);
      if (data.weightHistory) saveWeightHistory(data.weightHistory);
      if (data.foodLog) saveFoodLog(data.foodLog);
      if (data.workoutLog) saveWorkoutLog(data.workoutLog);
      if (data.stepsLog) saveStepsLog(data.stepsLog);
      if (data.ouraLog) saveOuraLog(data.ouraLog);

      alert('Backup restaurado correctamente!');
    } catch (err) {
      console.error('Error importing backup:', err);
      alert('Error al importar backup: archivo inválido');
    }
    event.target.value = ''; // Reset input
  };





  // Get Oura data for date
  const getOuraForDate = (date) => ouraLog.find(o => o.date === date);

  // Export food log for nutritionist as formatted TXT
  const exportForNutritionist = () => {
    try {
      const report = generateNutritionistReport(foodLog, workoutLog, ouraLog, profile);
      downloadFile(report, `registro-nutricionista-${getArgentinaDateString()}.txt`);
    } catch (err) {
      console.error('Error exporting for nutritionist:', err);
      alert('Error al generar el reporte');
    }
  };

  // Export for Claude - generates a structured summary to paste in chat
  const exportForClaude = () => {
    const today = getArgentinaDateString();
    const daysBack = 7; // Last 7 days of data
    const startDate = addDaysToDate(today, -(daysBack - 1));

    // Get dates array
    const dates = [];
    for (let i = 0; i < daysBack; i++) {
      dates.push(addDaysToDate(startDate, i));
    }

    // Current status
    const currentWeight = getMostRecentWeight(weightHistory);
    const todayTotals = getTotalsForDate(today);
    const todayTargets = getTargetsForDate(today);
    const todaySteps = getStepsForDate(today);
    const todayOura = getOuraForDate(today);
    const todayWorkouts = getWorkoutsForDate(today);

    // Weekly stats
    const weekStats = getWeeklyAdherence(0);
    const lastWeekStats = getWeeklyAdherence(1);

    // Build export text
    let txt = '=== LUKENFIT - CONTEXTO PARA CLAUDE ===\n';
    txt += `Fecha: ${today}\n\n`;

    // Current profile
    txt += '## PERFIL ACTUAL\n';
    txt += `Peso actual: ${currentWeight?.weight || profile.currentWeight}kg (${currentWeight?.date || 'N/D'})\n`;
    txt += `Peso objetivo: ${profile.targetWeight}kg\n`;
    txt += `Faltan: ${((currentWeight?.weight || profile.currentWeight) - profile.targetWeight).toFixed(1)}kg\n`;
    txt += `Altura: ${profile.height}cm | Edad: ${profile.age}\n\n`;

    // Targets
    txt += '## OBJETIVOS DIARIOS\n';
    txt += `Rest day: ${customTargets.calories}kcal | ${customTargets.protein}g prot | ${customTargets.carbs}g carbs | ${customTargets.fat}g fat | ${customTargets.fiber}g fibra\n`;
    txt += `Training day: ${customTargets.calories + customTargets.trainingDayCaloriesBonus}kcal | ${customTargets.protein}g prot | ${customTargets.trainingDayCarbs}g carbs\n\n`;

    // Today's status
    txt += '## HOY (' + today + ')\n';
    txt += `Macros: ${todayTotals.calories}/${todayTargets.calories}kcal | ${todayTotals.protein}/${todayTargets.protein}g prot | ${todayTotals.carbs}/${todayTargets.carbs}g carbs | ${todayTotals.fat}/${todayTargets.fat}g fat\n`;
    txt += `Restante: ${todayTargets.calories - todayTotals.calories}kcal | ${todayTargets.protein - todayTotals.protein}g prot\n`;
    txt += `Pasos: ${todaySteps}\n`;
    if (todayWorkouts.length > 0) {
      txt += `Entreno: ${todayWorkouts.map(w => w.name).join(', ')}\n`;
    }
    if (todayOura) {
      txt += `Oura: Sleep ${todayOura.sleepScore} | Readiness ${todayOura.readinessScore} | HRV ${todayOura.hrv}ms\n`;
    }
    txt += '\n';

    // Today's meals
    const todayFoods = getFoodsForDate(today);
    if (todayFoods.length > 0) {
      txt += '## COMIDAS DE HOY\n';
      todayFoods.forEach(f => {
        txt += `- ${f.meal}${f.time ? ' (' + f.time + ')' : ''}: ${f.name} → ${f.calories}kcal, ${f.protein}g prot\n`;
      });
      txt += '\n';
    }

    // Weekly adherence
    txt += '## ADHERENCIA SEMANAL\n';
    txt += `Esta semana: Score ${weekStats.score}/10 | Cal OK: ${weekStats.calOkDays}/${weekStats.daysTracked} | Prot OK: ${weekStats.protOkDays}/${weekStats.daysTracked} | Pasos OK: ${weekStats.stepsOkDays}/${weekStats.daysTracked}\n`;
    txt += `Promedios: ${weekStats.avgCals}kcal/día | ${weekStats.avgProt}g prot/día | ${weekStats.avgSteps} pasos/día\n`;
    txt += `Semana pasada: Score ${lastWeekStats.score}/10 | ${lastWeekStats.avgCals}kcal/día | ${lastWeekStats.avgProt}g prot/día\n\n`;

    // Weight trend
    if (weightHistory.length >= 2) {
      const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
      const recentWeights = sorted.slice(-7);
      txt += '## PESO ÚLTIMOS 7 REGISTROS\n';
      recentWeights.forEach(w => {
        txt += `${w.date}: ${w.weight}kg\n`;
      });

      // Calculate trend
      if (recentWeights.length >= 2) {
        const oldest = recentWeights[0];
        const newest = recentWeights[recentWeights.length - 1];
        const daysDiff = Math.max(1, (new Date(newest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24));
        const weightDiff = oldest.weight - newest.weight;
        const weeklyRate = (weightDiff / daysDiff) * 7;
        txt += `Tendencia: ${weeklyRate > 0 ? '-' : '+'}${Math.abs(weeklyRate).toFixed(2)}kg/semana\n`;
      }
      txt += '\n';
    }

    // Recent workouts
    const recentWorkouts = workoutLog
      .filter(w => w.date >= startDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (recentWorkouts.length > 0) {
      txt += '## ENTRENOS ÚLTIMOS 7 DÍAS\n';
      recentWorkouts.forEach(w => {
        txt += `${w.date}: ${w.type.toUpperCase()} - ${w.name} (${w.duration}min`;
        if (w.volume) txt += `, ${w.volume}kg vol`;
        txt += ')\n';
        if (w.exercises && w.exercises.length > 0) {
          w.exercises.slice(0, 3).forEach(ex => {
            txt += `  - ${ex.name}: ${ex.sets}x${ex.reps}@${ex.weight}kg\n`;
          });
          if (w.exercises.length > 3) txt += `  ... y ${w.exercises.length - 3} ejercicios más\n`;
        }
      });
      txt += '\n';
    }

    // Daily summary last 7 days
    txt += '## RESUMEN DIARIO (ÚLTIMOS 7 DÍAS)\n';
    dates.forEach(date => {
      const totals = getTotalsForDate(date);
      const targets = getTargetsForDate(date);
      const steps = getStepsForDate(date);
      const workouts = getWorkoutsForDate(date);
      const isTraining = workouts.length > 0;

      const calStatus = Math.abs(totals.calories - targets.calories) <= 150 ? '✓' : totals.calories > targets.calories ? '↑' : '↓';
      const protStatus = totals.protein >= targets.protein * 0.9 ? '✓' : '↓';

      txt += `${date}${isTraining ? ' 🏋️' : ''}: ${totals.calories}kcal${calStatus} | ${totals.protein}g prot${protStatus} | ${steps} pasos`;
      if (workouts.length > 0) txt += ` | ${workouts.map(w => w.type).join('+')}`;
      txt += '\n';
    });

    txt += '\n=== FIN EXPORT ===\n';
    txt += 'Pegá esto en el chat con Claude para contexto completo.\n';

    // Copy to clipboard
    navigator.clipboard.writeText(txt).then(() => {
      alert('✓ Copiado al portapapeles!\n\nPegalo en el chat con Claude.');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-claude-${today}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Format timestamp to time string
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
  };

  // Navigation helpers - use Argentina timezone
  const changeDate = (dateStr, delta) => addDaysToDate(dateStr, delta);

  const formatDateDisplay = (dateStr) => {
    const today = getArgentinaDateString();
    const yesterday = changeDate(today, -1);
    if (dateStr === today) return 'Hoy';
    if (dateStr === yesterday) return 'Ayer';
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: ARGENTINA_TZ
    }).format(date);
  };


  // UI components imported from ./components/UI/



  // Charts/UI components imported from ./components/Charts/ and ./components/Dashboard/


  // Get data for date
  const getFoodsForDate = (date) => foodLog.filter(entry => entry.date === date);
  const getWorkoutsForDate = (date) => workoutLog.filter(entry => entry.date === date);
  const getStepsForDate = (date) => stepsLog.find(s => s.date === date)?.steps || 0;

  // ============ ADVANCED ANALYTICS ============

  // Get weight data with 7-day moving average
  const getWeightChartData = useMemo(() => {
    if (weightHistory.length === 0) return [];

    const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    return sorted.map((entry, idx) => {
      const windowStart = Math.max(0, idx - 6);
      const window = sorted.slice(windowStart, idx + 1);
      const avg = window.reduce((sum, e) => sum + e.weight, 0) / window.length;

      return {
        date: entry.date,
        weight: entry.weight,
        avg7d: Math.round(avg * 10) / 10,
        dayLabel: new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
      };
    });
  }, [weightHistory]);

  // Calculate weekly adherence stats
  const getWeeklyAdherence = useCallback((weeksAgo = 0) => {
    const today = getArgentinaDateString();

    // Get Monday of current week, then go back weeksAgo weeks
    let mondayStr = getMondayOfWeek(today);
    for (let i = 0; i < weeksAgo; i++) {
      mondayStr = addDaysToDate(mondayStr, -7);
    }

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = addDaysToDate(mondayStr, i);
      if (dateStr <= today) weekDates.push(dateStr);
    }

    let calOkDays = 0, protOkDays = 0, stepsOkDays = 0;
    let totalCals = 0, totalProt = 0, totalSteps = 0, daysWithFood = 0;

    weekDates.forEach(date => {
      const totals = getTotalsForDate(date);
      const targets = getTargetsForDate(date);
      const steps = getStepsForDate(date);

      if (totals.calories > 0) {
        daysWithFood++;
        totalCals += totals.calories;
        totalProt += totals.protein;
        if (Math.abs(totals.calories - targets.calories) <= 150) calOkDays++;
        if (totals.protein >= targets.protein * 0.9) protOkDays++;
      }

      if (steps > 0) {
        totalSteps += steps;
        if (steps >= 8000) stepsOkDays++;
      }
    });

    const daysTracked = weekDates.length;
    const score = daysTracked > 0 ? Math.round(((calOkDays + protOkDays + stepsOkDays) / (daysTracked * 3)) * 100) / 10 : 0;

    return {
      weekStart: mondayStr,
      daysTracked, daysWithFood, calOkDays, protOkDays, stepsOkDays,
      avgCals: daysWithFood > 0 ? Math.round(totalCals / daysWithFood) : 0,
      avgProt: daysWithFood > 0 ? Math.round(totalProt / daysWithFood) : 0,
      avgSteps: daysTracked > 0 ? Math.round(totalSteps / daysTracked) : 0,
      score
    };
  }, [getTotalsForDate, getTargetsForDate, getStepsForDate]);

  // Compare current week vs last week
  const weekComparison = useMemo(() => {
    const thisWeek = getWeeklyAdherence(0);
    const lastWeek = getWeeklyAdherence(1);
    return {
      thisWeek, lastWeek,
      calsDiff: thisWeek.avgCals - lastWeek.avgCals,
      protDiff: thisWeek.avgProt - lastWeek.avgProt,
      stepsDiff: thisWeek.avgSteps - lastWeek.avgSteps
    };
  }, [getWeeklyAdherence]);

  // Calculate weight loss rate and projection
  const weightProjection = useMemo(() => {
    if (weightHistory.length < 2) return null;

    const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    const daysDiff = Math.max(1, (new Date(newest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24));
    const weightDiff = oldest.weight - newest.weight;
    const weeklyRate = (weightDiff / daysDiff) * 7;

    const kgToLose = profile.currentWeight - profile.targetWeight;
    const weeksToGoal = weeklyRate > 0 ? Math.ceil(kgToLose / weeklyRate) : null;

    const goalDate = weeksToGoal ? new Date() : null;
    if (goalDate && weeksToGoal) goalDate.setDate(goalDate.getDate() + (weeksToGoal * 7));

    let recommendation = null;
    if (daysDiff >= 14) {
      if (weeklyRate < 0.2) recommendation = { type: 'decrease', text: 'Bajando muy lento. Considerá reducir 150-200 kcal.' };
      else if (weeklyRate > 1.0) recommendation = { type: 'increase', text: 'Bajando muy rápido. Considerá subir 100-150 kcal para preservar músculo.' };
      else if (weeklyRate >= 0.3 && weeklyRate <= 0.7) recommendation = { type: 'good', text: 'Ritmo óptimo. Seguí así.' };
    }

    return {
      weeklyRate: Math.round(weeklyRate * 100) / 100,
      weeksToGoal,
      goalDate: goalDate ? goalDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      recommendation,
      dataPoints: sorted.length,
      daysCovered: Math.round(daysDiff)
    };
  }, [weightHistory, profile.currentWeight, profile.targetWeight]);

  // ============ END ADVANCED ANALYTICS ============

  // Weekly workout analysis
  const getWeeklyWorkoutAnalysis = () => {
    const todayStr = getArgentinaDateString();
    const dayOfWeek = getArgentinaDay();
    const mondayStr = getMondayOfWeek(todayStr);

    const weekWorkouts = workoutLog.filter(w => w.date >= mondayStr && w.date <= todayStr);
    const gymSessions = weekWorkouts.filter(w => w.type === 'gym');
    const tennisSessions = weekWorkouts.filter(w =>
      w.type === 'tennis' ||
      (w.type === 'sport' && (w.name.toLowerCase().includes('tenis') || w.name.toLowerCase().includes('tennis')))
    );

    const totalVolume = gymSessions.reduce((sum, w) => sum + (w.volume || 0), 0);
    const totalDuration = weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalCalsBurned = weekWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);

    let analysis = [];
    if (gymSessions.length === 0 && dayOfWeek > 1) {
      analysis.push('⚠️ Sin gym esta semana.');
    } else if (gymSessions.length > 0) {
      analysis.push(`✅ ${gymSessions.length} sesión(es) de gym.`);
      if (totalVolume > 0) analysis.push(`📊 Volumen: ${totalVolume.toLocaleString()} kg`);
    }
    if (tennisSessions.length > 0) {
      analysis.push(`🎾 Tenis: ${tennisSessions.reduce((s, t) => s + t.duration, 0)} min.`);
    } else if (dayOfWeek >= 3 || dayOfWeek === 0) {
      analysis.push('📍 Falta: Tenis (miércoles)');
    }
    if (totalCalsBurned > 0) analysis.push(`🔥 ~${totalCalsBurned} kcal quemadas.`);

    const types = gymSessions.map(g => g.name.toLowerCase());
    const hasPush = types.some(t => t.includes('push') || t.includes('pecho'));
    const hasPull = types.some(t => t.includes('pull') || t.includes('espalda'));
    const hasLegs = types.some(t => t.includes('leg') || t.includes('pierna'));
    if (gymSessions.length >= 1) {
      const missing = [];
      if (!hasPush) missing.push('Push');
      if (!hasPull) missing.push('Pull');
      if (!hasLegs) missing.push('Legs');
      if (missing.length > 0 && missing.length < 3) analysis.push(`📍 Falta: ${missing.join(', ')}`);
    }

    return { gymCount: gymSessions.length, tennisCount: tennisSessions.length, totalVolume, totalDuration, totalCalsBurned, analysis, weekStart: mondayStr };
  };

  // Weekly data for charts
  const getWeeklyData = () => {
    const data = [];
    const today = getArgentinaDateString();
    for (let i = 6; i >= 0; i--) {
      const dateStr = addDaysToDate(today, -i);
      const totals = getTotalsForDate(dateStr);
      const steps = getStepsForDate(dateStr);
      const date = new Date(dateStr + 'T12:00:00');
      const dayLabel = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: ARGENTINA_TZ }).format(date).slice(0, 2);
      data.push({
        date: dateStr,
        day: dayLabel,
        calories: totals.calories,
        protein: totals.protein,
        steps,
        completed: isDayCompleted(dateStr)
      });
    }
    return data;
  };


  // SimpleBarChart imported from ./components/Charts/


  const weeklyData = getWeeklyData();
  const workoutAnalysis = getWeeklyWorkoutAnalysis();

  // Safety timeout: never stay in loading state for more than 8 seconds
  // This runs only once on mount, as a last resort fallback
  // Uses refs to access current values instead of captured closure values
  const showAuthRef = useRef(showAuth);
  const isAuthenticatedRef = useRef(supabase.isAuthenticated);

  useEffect(() => {
    showAuthRef.current = showAuth;
    isAuthenticatedRef.current = supabase.isAuthenticated;
  }, [showAuth, supabase.isAuthenticated]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentShowAuth = showAuthRef.current;
      const currentIsAuthenticated = isAuthenticatedRef.current;

      // Only intervene if STILL stuck in initial loading (showAuth === null)
      if (currentShowAuth === null) {
        if (currentIsAuthenticated) {
          // User is authenticated but UI stuck in loading - hide auth screen
          console.log('[App] Safety timeout: User authenticated, hiding auth screen');
          setShowAuth(false);
        } else {
          // Not authenticated and stuck - show auth screen
          console.warn('[App] Safety timeout: Not authenticated, showing auth screen');
          setShowAuth(true);
        }
      }
      // If showAuth is already true or false, auth flow has resolved - do nothing
    }, 8000); // 8 seconds: longer than useSupabase (5s) + fetchAllData timeout (10s) buffer

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Show loading while checking auth status (max 5 seconds)
  if (showAuth === null && supabase.loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <span className="text-2xl">💪</span>
          </div>
          <div className="text-blue-400 text-lg">Cargando LukenFit...</div>
        </div>
      </div>
    );
  }

  // Show Auth UI if not authenticated and not in offline mode
  if (showAuth === true && !offlineMode) {
    // Wrap signIn to update showAuth immediately on success
    const handleSignIn = async (email, password) => {
      try {
        console.log('[NutritionTracker] handleSignIn called');
        const result = await supabase.signIn(email, password);
        console.log('[NutritionTracker] signIn result:', result);
        if (result && !result.error) {
          console.log('[NutritionTracker] Setting showAuth to false');
          setShowAuth(false);
        }
        return result || { error: { message: 'No response from server' } };
      } catch (err) {
        console.error('[NutritionTracker] signIn error:', err);
        return { error: { message: err.message || 'Error de conexión' } };
      }
    };

    // Wrap signUp to update showAuth on auto-confirm success
    const handleSignUp = async (email, password) => {
      try {
        const result = await supabase.signUp(email, password);
        if (result && !result.error && !result.needsConfirmation) {
          setShowAuth(false);
        }
        return result || { error: { message: 'No response from server' } };
      } catch (err) {
        console.error('[NutritionTracker] signUp error:', err);
        return { error: { message: err.message || 'Error de conexión' } };
      }
    };

    return (
      <AuthUI
        onAuth={{
          signIn: handleSignIn,
          signUp: handleSignUp,
          signInWithGoogle: supabase.signInWithGoogle,
          resetPassword: supabase.resetPassword,
          continueOffline: () => {
            setOfflineMode(true);
            setShowAuth(false);
          },
        }}
        error={supabase.authError}
        isSupabaseConfigured={supabase.isSupabaseConfigured}
        loading={supabase.loading}
      />
    );
  }

  // Show Onboarding Wizard for new users
  if (showOnboarding && !offlineMode) {
    const handleOnboardingComplete = async (profileData) => {
      try {
        await supabase.saveOnboardingProfile(profileData);
        setShowOnboarding(false);

        // Update local config with the new targets
        if (profileData.calorie_goal) {
          setConfig(prev => ({
            ...prev,
            targetCalories: profileData.calorie_goal,
            targetProtein: profileData.protein_goal || 150,
            targetCarbs: profileData.carbs_goal || 220,
            targetFat: profileData.fat_goal || 73,
          }));
        }
      } catch (err) {
        console.error('Error completing onboarding:', err);
        setShowOnboarding(false);
      }
    };

    return (
      <OnboardingWizard
        onComplete={handleOnboardingComplete}
        userEmail={supabase.user?.email}
      />
    );
  }

  // Show loading during initialization (showAuth is null) OR during data loading
  if (showAuth === null || (isLoading && showAuth === false)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <span className="text-2xl">💪</span>
          </div>
          <div className="text-blue-400 text-lg">Cargando datos...</div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} showNav={!showOnboarding}>
      {/* Google Font - Plus Jakarta Sans for modern fitness aesthetic */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.show}
        itemName={deleteModal.name}
        onConfirm={executeDelete}
        onCancel={() => setDeleteModal({ show: false, type: '', id: null, name: '' })}
      />

      {/* Migration Modal */}
      <MigrationModal
        isOpen={showMigrationModal}
        data={migrationData}
        onMigrate={handleMigration}
        onSkip={() => {
          setShowMigrationModal(false);
          setMigrationData(null);
        }}
        isMigrating={isMigrating}
      />

      {/* Manual Food Entry Modal */}
      {showFoodForm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => { setShowFoodForm(false); setEditingFoodId(null); }}>
          <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-sm lg:max-w-md border border-gray-100 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl lg:text-2xl font-bold text-slate-900">{editingFoodId ? '✏️ Editar Comida' : '🍽️ Nueva Comida'}</h3>
              <button onClick={() => { setShowFoodForm(false); setEditingFoodId(null); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">×</button>
            </div>
            <div className="space-y-4">
              {/* Row 1: Meal type + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Comida</label>
                  <select value={newFood.meal} onChange={(e) => setNewFood({ ...newFood, meal: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer">
                    <option>Desayuno</option>
                    <option>Almuerzo</option>
                    <option>Merienda</option>
                    <option>Cena</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Hora</label>
                  <input type="time" value={newFood.time} onChange={(e) => setNewFood({ ...newFood, time: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
              </div>
              </div>
              {/* Row 2: Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Nombre *</label>
                <input type="text" value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} placeholder="Pollo con arroz" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
              </div>
              {/* Row 3: Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Descripción</label>
                <input type="text" value={newFood.description} onChange={(e) => setNewFood({ ...newFood, description: e.target.value })} placeholder="200g pechuga, 150g arroz" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
              </div>
              {/* Row 4: Macros - 3+2 grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Cal *</label>
                  <input type="number" value={newFood.calories} onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })} placeholder="500" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Prot</label>
                  <input type="number" value={newFood.protein} onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })} placeholder="40" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Carbs</label>
                  <input type="number" value={newFood.carbs} onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })} placeholder="50" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Fat</label>
                  <input type="number" value={newFood.fat} onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })} placeholder="15" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Fibra</label>
                  <input type="number" value={newFood.fiber} onChange={(e) => setNewFood({ ...newFood, fiber: e.target.value })} placeholder="5" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <input type="hidden" value={newFood.date} />
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => { setShowFoodForm(false); setEditingFoodId(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 py-4 rounded-2xl text-slate-600 text-sm lg:text-base font-bold transition-all active:scale-95">Cancelar</button>
              <button onClick={addManualFood} className="flex-1 bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 py-4 rounded-2xl text-white text-sm lg:text-base font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                {editingFoodId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Workout Entry Modal */}
      {showWorkoutForm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowWorkoutForm(false)}>
          <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-sm lg:max-w-md border border-gray-100 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl lg:text-2xl font-bold text-slate-900">🏋️ Nuevo Entreno</h3>
              <button onClick={() => setShowWorkoutForm(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">×</button>
            </div>
            <div className="space-y-4">
              {/* Row 1: Type */}
                <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Tipo</label>
                <select value={newWorkout.type} onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer">
                    <option value="gym">Gym</option>
                    <option value="tennis">Tenis</option>
                    <option value="cardio">Cardio</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              {/* Row 2: Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Nombre *</label>
                <input type="text" value={newWorkout.name} onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })} placeholder="Push Day, Clase de Tenis" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" />
              </div>
              {/* Row 3: Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Min</label>
                  <input type="number" value={newWorkout.duration} onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })} placeholder="60" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Kcal</label>
                  <input type="number" value={newWorkout.calories} onChange={(e) => setNewWorkout({ ...newWorkout, calories: e.target.value })} placeholder="300" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Vol (kg)</label>
                  <input type="number" value={newWorkout.volume} onChange={(e) => setNewWorkout({ ...newWorkout, volume: e.target.value })} placeholder="2500" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" />
                </div>
              </div>
              {/* Row 4: Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Notas</label>
                <input type="text" value={newWorkout.notes} onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })} placeholder="Subí peso en press banca" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowWorkoutForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-4 rounded-2xl text-slate-600 text-sm lg:text-base font-bold transition-all active:scale-95">Cancelar</button>
              <button onClick={addManualWorkout} className="flex-1 bg-gradient-to-br from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 py-4 rounded-2xl text-white text-sm lg:text-base font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Food Modal */}
      {showImportFoodModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">📥 Importar Comida</h3>
              <button onClick={() => { setShowImportFoodModal(false); setImportText(''); setImportError(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">×</button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Pegá el JSON de la comida generado por la IA.</p>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder={`{"meal": "Almuerzo", "name": "Pollo", "calories": 500, "protein": 40}`}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 text-sm font-mono h-48 resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            {importError && (
              <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mt-3 flex items-center gap-2">
                <span>⚠️</span> {importError}
              </div>
            )}
            <div className="flex gap-4 mt-6">
              <button onClick={() => { setShowImportFoodModal(false); setImportText(''); setImportError(''); }} className="flex-1 bg-slate-100 hover:bg-slate-200 py-4 rounded-2xl text-slate-600 font-bold transition-all active:scale-95">Cancelar</button>
              <button onClick={handleImportFood} className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-white font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">Importar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Workout Modal */}
      {showImportWorkoutModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">📥 Importar Entreno</h3>
              <button onClick={() => { setShowImportWorkoutModal(false); setImportText(''); setImportError(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">×</button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Pegá el JSON del entreno (Gravl o IA).</p>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder={`{"type": "gym", "name": "Push Day", "duration": 60, "exercises": [...]}`}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 text-sm font-mono h-48 resize-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
            {importError && (
              <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mt-3 flex items-center gap-2">
                <span>⚠️</span> {importError}
              </div>
            )}
            <div className="flex gap-4 mt-6">
              <button onClick={() => { setShowImportWorkoutModal(false); setImportText(''); setImportError(''); }} className="flex-1 bg-slate-100 hover:bg-slate-200 py-4 rounded-2xl text-slate-600 font-bold transition-all active:scale-95">Cancelar</button>
              <button onClick={handleImportWorkout} className="flex-1 bg-amber-600 hover:bg-amber-500 py-4 rounded-2xl text-white font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95">Importar</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast - positioned above bottom nav */}
      {undoAction && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 flex items-center gap-3 z-50 shadow-lg">
          <span className="text-sm text-gray-300">Eliminado</span>
          <button onClick={() => { undoAction.restore(); setUndoAction(null); }} className="text-blue-400 font-bold text-sm active:text-cyan-300">DESHACER</button>
        </div>
      )}

      {/* Header - Premium LukenFit branding */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-4 lg:py-5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 flex items-center gap-4">
            {/* Logo - bigger and refined */}
            <div className="relative">
              <svg viewBox="0 0 32 32" className="w-12 h-12 lg:w-14 lg:h-14 flex-shrink-0">
                <defs>
                  <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#2563EB' }} />
                    <stop offset="100%" style={{ stopColor: '#0891B2' }} />
                  </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="15" fill="#F8FAFC" stroke="url(#headerGrad)" strokeWidth="1.5" />
                <path d="M10 7 L10 21 L19 21 L19 18 L13 18 L13 7 Z" fill="url(#headerGrad)" />
                <path d="M18 7 L14 15 L17 15 L15 25 L23 14 L19 14 L22 7 Z" fill="url(#headerGrad)" opacity="0.9" />
              </svg>
              {isTrainingDay(dashboardDate) && (
                <div className="absolute -top-1 -right-1 bg-amber-400 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">🏋️</div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">LUKEN<span className="text-blue-600">FIT</span></h1>
              <p className="text-xs lg:text-sm font-bold text-slate-400 flex items-center gap-1.5">
                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{getMostRecentWeight(weightHistory)?.weight || profile.currentWeight}kg</span>
                <span className="text-slate-300">→</span>
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{profile.targetWeight}kg</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Save status */}
            {saveStatus && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full animate-pulse border border-blue-100">{saveStatus}</span>
            )}

            {/* Sync status */}
            {supabase.isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Offline indicator */}
                {!supabase.isOnline && (
                  <span className="text-xs font-bold bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100">📴 Offline</span>
                )}

                {/* Sync status */}
                {supabase.isOnline && (
                  <span className={`w-10 h-10 lg:w-11 lg:h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm border transition-all ${
                    supabase.syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    supabase.syncStatus === 'success' ? 'bg-green-50 text-green-600 border-green-100' :
                    supabase.syncStatus === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {supabase.syncStatus === 'syncing' ? (
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : supabase.syncStatus === 'success' ? '✓' : supabase.syncStatus === 'error' ? '⚠' : '☁️'}
                  </span>
                )}

                {/* Force Sync button */}
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await forceSyncToCloud();
                  }}
                  className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-90"
                  title="Forzar sincronización a la nube"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                {/* Logout button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-2xl bg-white hover:bg-red-50 border border-slate-100 text-slate-400 hover:text-red-600 transition-all shadow-sm active:scale-90"
                  title="Cerrar sesión"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAuth(true);
                  setOfflineMode(false);
                }}
                className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-2xl border border-blue-100 shadow-sm transition-all active:scale-95"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Secondary tabs for Pasos/Oura (accessible from Dashboard) */}
      {['pasos', 'oura'].includes(activeTab) && (
        <nav className="bg-white border-b border-gray-200 px-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex gap-1">
            {['pasos', 'oura'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'oura' ? '💍 Oura' : '👟 Pasos'}
            </button>
          ))}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="ml-auto text-gray-500 text-xs px-2"
            >
              ← Volver
            </button>
        </div>
      </nav>
      )}

      {/* Main Content with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
        <main className="p-4 lg:p-6 xl:p-8 pb-32 md:pb-36 w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Date Navigator - Clean Desktop Design */}
              <div className="flex items-center lg:items-start lg:w-full lg:mb-8 justify-center lg:justify-between px-1">
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-500">Resumen diario</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                  <button
                      onClick={() => setDashboardDate(changeDate(dashboardDate, -1))}
                      className="w-10 h-10 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center"
                  >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                  </button>
                  <div className="text-center min-w-[120px]">
                    <span className="block text-sm font-bold text-gray-900">{formatDateDisplay(dashboardDate)}</span>
                  </div>
                  <button
                      onClick={() => setDashboardDate(changeDate(dashboardDate, 1))}
                      disabled={dashboardDate >= getArgentinaDateString()}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dashboardDate >= getArgentinaDateString() ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-400 hover:text-blue-500'}`}
                  >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                  </button>
                </div>
              </div>

              {/* Dashboard Content - Flex Desktop Layout */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Left Column - Main Tracking (67%) */}
                <div className="w-full lg:w-8/12 space-y-4 lg:space-y-6">
                 {/* Summary Card */}
                <SummaryCard totals={dashboardTotals} targets={dashboardTargets} />

                {/* Macro Cards */}
                <MacroCards totals={dashboardTotals} targets={dashboardTargets} />

                  <ActivityCards
                    steps={getStepsForDate(dashboardDate)}
                    stepsTarget={10000}
                    water={getTodayWater().glasses}
                    waterTarget={WATER_GOAL_GLASSES}
                    onAddWater={addWaterGlass}
                  />

                  {/* Training Widget */}
                  <TrainingWidget
                    gymCount={workoutAnalysis.gymCount}
                    tennisCount={workoutAnalysis.tennisCount}
                    totalDuration={workoutAnalysis.totalDuration}
                    analysis={workoutAnalysis.analysis}
                  />
                </div>

              {/* Right Column - Analytics & Weight (33%) */}
              <div className="lg:w-4/12 space-y-4 lg:space-y-6">
                {/* Weight Chart */}
                <WeightChartCard
                  data={weightHistory}
                  currentWeight={getMostRecentWeight(weightHistory)?.weight || profile.currentWeight}
                  targetWeight={profile.targetWeight}
                />

                {/* Weight Projection */}
                {weightProjection && (
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50">
                    <h3 className="text-gray-900 font-bold text-lg mb-4">Proyección</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-xl font-bold text-gray-900">{weightProjection.weeklyRate > 0 ? '-' : '+'}{Math.abs(weightProjection.weeklyRate)} <span className="text-xs font-normal text-gray-500">kg/sem</span></div>
                        <div className="text-xs text-gray-400 mt-1">Ritmo actual</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-xl font-bold text-blue-600">
                          {weightProjection.weeksToGoal ? `~${weightProjection.weeksToGoal}` : '-'} <span className="text-xs font-normal text-gray-500">sem</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Para objetivo</div>
                      </div>
                    </div>
                    {weightProjection.goalDate && (
                      <div className="mb-4 text-center">
                         <span className="text-xs text-gray-400">Fecha estimada: </span>
                         <span className="text-sm font-semibold text-gray-900">{weightProjection.goalDate}</span>
                      </div>
                    )}
                    {weightProjection.recommendation && (
                      <div className={`p-3 rounded-xl text-xs leading-relaxed ${weightProjection.recommendation.type === 'good' ? 'bg-blue-50 text-blue-700' :
                        weightProjection.recommendation.type === 'decrease' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                        💡 {weightProjection.recommendation.text}
                      </div>
                )}
                    <p className="text-[10px] text-gray-400 mt-3 text-center">Basado en {weightProjection.dataPoints} registros ({weightProjection.daysCovered} días)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comidas Tab - uses selectedFoodDate */}
        {activeTab === 'comidas' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Diario</h1>
                <p className="text-sm text-gray-500">Registro de alimentos</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFoodDate(changeDate(selectedFoodDate, -1))}
                  className="w-10 h-10 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <input
                  type="date"
                  value={selectedFoodDate}
                  onChange={(e) => setSelectedFoodDate(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-base flex-1 min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
                <button
                  onClick={() => setSelectedFoodDate(changeDate(selectedFoodDate, 1))}
                  disabled={selectedFoodDate >= getArgentinaDateString()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedFoodDate >= getArgentinaDateString() ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-400 hover:text-blue-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Swipe hint */}
            {getFoodsForDate(selectedFoodDate).length > 0 && (
              <p className="text-xs text-gray-500 text-center">← Desliza para eliminar</p>
            )}

            {getFoodsForDate(selectedFoodDate).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-1">Sin comidas registradas</h3>
                <p className="text-gray-500 text-sm">Registra tu primera comida del día.</p>
                <button
                  onClick={() => { setNewFood({ ...newFood, date: selectedFoodDate, meal: 'Desayuno' }); setShowFoodForm(true); }}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  Registrar Comida
                </button>
              </div>
            ) : (
              <div className="space-y-6 pb-24">
                {['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'].map(mealType => {
                  const mealFoods = getFoodsForDate(selectedFoodDate).filter(f =>
                     // Normalize string comparison
                     (f.meal || '').toLowerCase() === mealType.toLowerCase() ||
                     // Fallback for old data or mismatches
                     (mealType === 'Snack' && !['desayuno', 'almuerzo', 'merienda', 'cena'].includes((f.meal || '').toLowerCase()))
                  );

                  // Skip section if no foods (optional: keeping it clean)
                 // if (mealFoods.length === 0) return null;

                  // Calculate totals for this meal
                  const mealTotals = mealFoods.reduce((acc, food) => ({
                    calories: acc.calories + (parseInt(food.calories) || 0)
                  }), { calories: 0 });

                  return (
                    <MealSection
                      key={mealType}
                      title={mealType}
                      foods={mealFoods}
                      totals={mealTotals}
                      onAddFood={() => {
                        setNewFood({ ...newFood, date: selectedFoodDate, meal: mealType });
                        setShowFoodForm(true);
                      }}
                      onEditFood={(food) => {
                        setNewFood({
                            ...food,
                            calories: food.calories.toString(),
                            protein: food.protein.toString(),
                            carbs: food.carbs.toString(),
                            fat: food.fat.toString(),
                            fiber: food.fiber?.toString() || '0'
                        });
                        setEditingFoodId(food.id);
                        setShowFoodForm(true);
                      }}
                      onDeleteFood={(food) => confirmDelete('food', food.id, food.name)}
                    />
                  );
                })}
              </div>
            )}

            {/* Sticky Day Summary Footer */}
             {getFoodsForDate(selectedFoodDate).length > 0 && (
                <DaySummary
                  totals={getTotalsForDate(selectedFoodDate)}
                  targets={getTargetsForDate(selectedFoodDate)}
                />
             )}
          </div>
        )}

        {/* Entrenos Tab - uses selectedWorkoutDate */}
        {activeTab === 'entrenos' && (
          <div className="space-y-3">
            {/* Weekly Analysis */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-900">Resumen Semanal</h2>
                <span className="text-xs text-gray-500">desde {workoutAnalysis.weekStart}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-amber-500">{workoutAnalysis.gymCount}</div>
                  <div className="text-xs text-gray-500 font-medium">Gym</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-green-500">{workoutAnalysis.tennisCount}</div>
                  <div className="text-xs text-gray-500 font-medium">Tenis</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-cyan-500">{workoutAnalysis.totalDuration}'</div>
                  <div className="text-xs text-gray-500 font-medium">Min</div>
                </div>
              </div>
              <div className="space-y-0.5">
                {workoutAnalysis.analysis.map((line, i) => <p key={i} className="text-xs text-gray-300">{line}</p>)}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Entrenos</h1>
                <p className="text-sm text-gray-500">Registro de actividad física</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWorkoutDate(changeDate(selectedWorkoutDate, -1))}
                  className="w-10 h-10 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <input
                  type="date"
                  value={selectedWorkoutDate}
                  onChange={(e) => setSelectedWorkoutDate(e.target.value)}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                />
                <button
                  onClick={() => setSelectedWorkoutDate(changeDate(selectedWorkoutDate, 1))}
                  disabled={selectedWorkoutDate >= getArgentinaDateString()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedWorkoutDate >= getArgentinaDateString() ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-400 hover:text-blue-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Swipe hint */}
            {getWorkoutsForDate(selectedWorkoutDate).length > 0 && (
              <p className="text-xs text-gray-400 text-center uppercase tracking-widest font-bold">← Desliza para eliminar</p>
            )}

            {getWorkoutsForDate(selectedWorkoutDate).length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💪</div>
                <h3 className="text-gray-900 font-bold text-lg mb-1">Sin entrenos registrados</h3>
                <p className="text-gray-500 text-sm">Registra tu actividad para hoy.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getWorkoutsForDate(selectedWorkoutDate).map(workout => {
                  const needsReview = !workout.reviewed || (workout.confidence && workout.confidence < 0.7);
                  return (
                    <SwipeableItem
                      key={workout.id}
                      onDelete={() => confirmDelete('workout', workout.id, workout.name)}
                    >
                      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
                        {/* Type Indicator */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${workout.type === 'gym' ? 'bg-amber-500' : 'bg-green-500'}`} />

                        <div className="flex justify-between items-start mb-2 pl-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${workout.type === 'gym' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                {workout.type}
                              </span>
                              {needsReview && (
                                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">REVISAR</span>
                              )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{workout.name}</h3>
                          </div>
                          {needsReview && (
                            <button onClick={() => confirmWorkout(workout.id)} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 transition-transform flex-shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3 pl-2">
                          {workout.duration && (
                            <span className="flex items-center gap-1.5 font-medium">
                                <span className="text-blue-500">⏱️</span> {workout.duration} min
                            </span>
                          )}
                          {workout.volume && (
                            <span className="flex items-center gap-1.5 font-medium">
                                <span className="text-amber-500">📊</span> {workout.volume.toLocaleString()} kg
                            </span>
                          )}
                          {workout.calories && (
                            <span className="flex items-center gap-1.5 font-medium">
                                <span className="text-red-500">🔥</span> {workout.calories} kcal
                            </span>
                          )}
                        </div>

                        {workout.exercises?.length > 0 && (
                          <div className="space-y-2 border-t border-gray-50 pt-3 pl-2">
                            {workout.exercises.map((ex, idx) => (
                                <div key={idx} className="text-sm flex justify-between items-center group">
                                  <span className="text-gray-700 font-medium truncate flex-1">{ex.name}</span>
                                  <span className="text-gray-400 font-mono text-xs tabular-nums ml-4 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">{ex.sets}x{ex.reps} · {ex.weight}kg</span>
                                </div>
                            ))}
                          </div>
                        )}

                        {workout.notes && (
                          <div className="mt-3 pl-2 pt-2 border-t border-gray-50">
                            <p className="text-sm text-blue-600 bg-blue-50/50 p-2 rounded-xl italic">
                                "{workout.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    </SwipeableItem>
                  );
                })}
              </div>
            )}

            {/* Schedule */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Plan Semanal</h3>
              <div className="grid grid-cols-7 gap-2 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => {
                  const mondayOfWeek = getMondayOfWeek(getArgentinaDateString());
                  const dayDate = addDaysToDate(mondayOfWeek, i);
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedWorkoutDate(dayDate)}
                      className={`p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer ${[0, 3, 5].includes(i) ? 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100' : i === 2 ? 'bg-green-50 border-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
                    >
                      <div className="font-bold text-xs">{day}</div>
                      <div className="text-[10px] font-bold mt-1 tracking-tighter">{[0, 3, 5].includes(i) ? 'GYM' : i === 2 ? 'TEN' : 'OFF'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Peso Tab */}
        {activeTab === 'peso' && (
          <WeightTab
            weightDate={weightDate}
            setWeightDate={setWeightDate}
            newWeight={newWeight}
            setNewWeight={setNewWeight}
            newWeightTime={newWeightTime}
            setNewWeightTime={setNewWeightTime}
            addWeightEntry={addWeightEntry}
            weightHistory={weightHistory}
            profile={profile}
            getMostRecentWeight={getMostRecentWeight}
            getWeightChartData={getWeightChartData}
            weightProjection={weightProjection}
            editingWeightId={editingWeightId}
            setEditingWeightId={setEditingWeightId}
            editingWeightValue={editingWeightValue}
            setEditingWeightValue={setEditingWeightValue}
            startEditWeight={startEditWeight}
            saveEditWeight={saveEditWeight}
            cancelEditWeight={cancelEditWeight}
            confirmDelete={confirmDelete}
            formatTime={formatTime}
          />
        )}

        {/* Pasos Tab */}
        {activeTab === 'pasos' && (
          <StepsTab
            stepsDate={stepsDate}
            setStepsDate={setStepsDate}
            newSteps={newSteps}
            setNewSteps={setNewSteps}
            addStepsEntry={addStepsEntry}
            weeklyData={weeklyData}
            stepsLog={stepsLog}
          />
        )}

        {/* Oura Tab */}
        {activeTab === 'oura' && (
          <OuraTab
            newOuraEntry={newOuraEntry}
            setNewOuraEntry={setNewOuraEntry}
            addOuraEntry={addOuraEntry}
            ouraLog={ouraLog}
          />
        )}

        {/* Config Tab - with editable targets and debounced saving */}
        {activeTab === 'config' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="mb-2 px-1">
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="text-sm text-gray-500">Ajustes de perfil y objetivos</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
                        {profile.avatar || (profile.name?.substring(0, 1) || 'L')}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">{profile.name || 'Usuario'}</h3>
                        <p className="text-sm text-gray-500 font-medium">Plan Premium · Activo</p>
                    </div>
                </div>

                {/* Avatar Selection */}
                <div className="mb-8">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Avatar</label>
                  <div className="grid grid-cols-8 gap-2">
                    {['💪', '🏋️', '🏃', '🚴', '⚡', '🔥', '🎯', '🏆', '⭐', '💎', '🦾', '🧠', '❤️', '🌟', '👑', '🎪'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => updateConfig({ ...profile, avatar: emoji }, customTargets)}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                          profile.avatar === emoji
                            ? 'bg-blue-100 ring-2 ring-blue-500 shadow-lg'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

              <h2 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                 PERFIL Y DATOS
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nombre</label>
                  <input type="text" value={profile.name || ''} onChange={(e) => updateConfig({ ...profile, name: e.target.value }, customTargets)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="Tu nombre" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Peso Actual (kg)</label>
                  <input type="number" step="0.1" value={profile.currentWeight} onChange={(e) => updateConfig({ ...profile, currentWeight: parseFloat(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Peso Objetivo (kg)</label>
                  <input type="number" step="0.1" value={profile.targetWeight} onChange={(e) => updateConfig({ ...profile, targetWeight: parseFloat(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Altura (cm)</label>
                  <input type="number" value={profile.height} onChange={(e) => updateConfig({ ...profile, height: parseInt(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Edad</label>
                  <input type="number" value={profile.age} onChange={(e) => updateConfig({ ...profile, age: parseInt(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                  OBJETIVOS (REST DAY)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Calorías</label>
                  <input type="number" value={customTargets.calories} onChange={(e) => updateConfig(profile, { ...customTargets, calories: parseInt(e.target.value) || 0 })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-green-600">Prot (g)</label>
                  <input type="number" value={customTargets.protein} onChange={(e) => updateConfig(profile, { ...customTargets, protein: parseInt(e.target.value) || 0 })} className="w-full bg-green-50/30 border border-green-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-green-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-yellow-600">Carbs (g)</label>
                  <input type="number" value={customTargets.carbs} onChange={(e) => updateConfig(profile, { ...customTargets, carbs: parseInt(e.target.value) || 0 })} className="w-full bg-yellow-50/30 border border-yellow-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-yellow-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-red-600">Grasas (g)</label>
                  <input type="number" value={customTargets.fat} onChange={(e) => updateConfig(profile, { ...customTargets, fat: parseInt(e.target.value) || 0 })} className="w-full bg-red-50/30 border border-red-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-red-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Fibra (g)</label>
                  <input type="number" value={customTargets.fiber} onChange={(e) => updateConfig(profile, { ...customTargets, fiber: parseInt(e.target.value) || 0 })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 opacity-50" />
              <h2 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                 TRAINING DAY BONUS
              </h2>
              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Kcal extra</label>
                  <input type="number" value={customTargets.trainingDayCaloriesBonus} onChange={(e) => updateConfig(profile, { ...customTargets, trainingDayCaloriesBonus: parseInt(e.target.value) || 0 })} className="w-full bg-amber-50/30 border border-amber-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-amber-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Carbs (g)</label>
                  <input type="number" value={customTargets.trainingDayCarbs} onChange={(e) => updateConfig(profile, { ...customTargets, trainingDayCarbs: parseInt(e.target.value) || 0 })} className="w-full bg-amber-50/30 border border-amber-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-amber-500 outline-none transition-all" />
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-4 font-bold bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-100">
                Training Day: {customTargets.calories + customTargets.trainingDayCaloriesBonus} kcal · {customTargets.trainingDayCarbs}g carbs
              </p>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 border-dashed rounded-2xl p-4 flex items-center justify-between">
                <p className="text-xs text-blue-600 font-bold">💾 Sincronización automática activa</p>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>

            {/* Export buttons - compact grid */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">📤</span>
                 EXPORTAR
              </h2>
              <div className="grid grid-cols-2 gap-3">
              <button
                onClick={exportForClaude}
                  className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                  🤖 Claude
              </button>
              <button
                onClick={exportForNutritionist}
                  className="bg-pink-50 hover:bg-pink-100 text-pink-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                  🩺 Nutri
              </button>
                <button
                  onClick={exportBackup}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  📤 Backup
                </button>
                <label className="bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  📥 Importar
                  <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                </label>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded-xl">
                  <div className="text-sm font-bold text-gray-900">{weightHistory.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Peso</div>
                  </div>
                <div className="p-2 bg-gray-50 rounded-xl">
                  <div className="text-sm font-bold text-gray-900">{foodLog.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Comidas</div>
                  </div>
                <div className="p-2 bg-gray-50 rounded-xl">
                  <div className="text-sm font-bold text-gray-900">{workoutLog.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Entrenos</div>
                  </div>
                <div className="p-2 bg-gray-50 rounded-xl">
                  <div className="text-sm font-bold text-gray-900">{stepsLog.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Pasos</div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">⚠️ Importar reemplaza TODOS los datos</p>
            </div>
          </div>
        )}
      </main>
      </PullToRefresh>

      {/* Bottom Navigation */}


      {/* Floating Action Button - hide when any modal is open */}
      {showFab && ['dashboard', 'comidas', 'entrenos'].includes(activeTab) &&
       !showFoodForm && !showWorkoutForm && !showImportFoodModal && !showImportWorkoutModal && !showTemplatesModal && (
        <FloatingActionButton
          onAddFood={() => { setNewFood({ ...newFood, date: dashboardDate }); setShowFoodForm(true); }}
          onAddWorkout={() => { setNewWorkout({ ...newWorkout, date: dashboardDate }); setShowWorkoutForm(true); }}
          onImportFood={() => setShowImportFoodModal(true)}
          onImportWorkout={() => setShowImportWorkoutModal(true)}
          onQuickAdd={() => setShowTemplatesModal(true)}
        />
      )}

      {/* Meal Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-2 pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-purple-200 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg lg:text-xl font-bold text-purple-600">⭐ Favoritos</h3>
              <button onClick={() => setShowTemplatesModal(false)} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xl lg:text-2xl transition-colors">×</button>
            </div>

            {mealTemplates.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No hay plantillas guardadas. Agregá comidas y guardalas como favoritos.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {mealTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-purple-50 rounded-xl p-3 border border-purple-100 active:bg-purple-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => addFromTemplate(template)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-600 uppercase font-bold">{template.meal}</span>
                        </div>
                        <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
                        {template.description && (
                          <p className="text-xs text-gray-600 truncate">{template.description}</p>
                        )}
                        <div className="flex gap-2 mt-1 text-xs font-medium">
                          <span className="text-blue-600">{template.calories}kcal</span>
                          <span className="text-blue-600">{template.protein}P</span>
                          <span className="text-amber-600">{template.carbs}C</span>
                          <span className="text-pink-600">{template.fat}F</span>
                        </div>
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-gray-400 hover:text-red-500 active:text-red-600 p-1 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3 text-center">
              Toca una comida para agregarla · Desliza a las comidas para guardar nuevas
            </p>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showSaveTemplateModal && templateToSave && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs border border-purple-200 shadow-2xl">
            <h3 className="text-base font-bold text-purple-600 mb-3">⭐ Guardar como Favorito</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={templateToSave.name}
                  onChange={(e) => setTemplateToSave({ ...templateToSave, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo</label>
                  <select
                    value={templateToSave.meal}
                    onChange={(e) => setTemplateToSave({ ...templateToSave, meal: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  >
                    <option>Desayuno</option>
                    <option>Almuerzo</option>
                    <option>Merienda</option>
                    <option>Cena</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Calorías</label>
                  <input
                    type="number"
                    value={templateToSave.calories}
                    onChange={(e) => setTemplateToSave({ ...templateToSave, calories: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium bg-gray-50 px-3 py-2 rounded-lg">
                P: {templateToSave.protein}g · C: {templateToSave.carbs}g · F: {templateToSave.fat}g
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowSaveTemplateModal(false); setTemplateToSave(null); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={confirmSaveTemplate} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Report Modal */}
      {showWeeklyReport && (
        <WeeklyReport
          foodLog={foodLog}
          workoutLog={workoutLog}
          weightHistory={weightHistory}
          stepsLog={stepsLog}
          targets={{
            calories: config.targetCalories,
            protein: config.targetProtein,
            carbs: config.targetCarbs,
            fat: config.targetFat
          }}
          onClose={() => setShowWeeklyReport(false)}
        />
      )}
    </Layout>
  );
};

export default NutritionTracker;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthUI } from './components/AuthUI';
import { BottomNav } from './components/BottomNav';
import { ActivityCards } from './components/Dashboard/ActivityCards';
import { MacroCards } from './components/Dashboard/MacroCards';
import { SummaryCard } from './components/Dashboard/SummaryCard';
import { WeightChartCard } from './components/Dashboard/WeightChartCard';
import { DaySummary } from './components/Diary/DaySummary';
import { MealSection } from './components/Diary/MealSection';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Layout } from './components/Layout';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PullToRefresh } from './components/PullToRefresh';
import { SwipeableItem } from './components/SwipeableItem';
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
    // Parse time input to create timestamp
    const [hours, minutes] = newWeightTime.split(':').map(Number);
    const dateObj = new Date();
    // Set to Argentina timezone
    const argDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    argDate.setHours(hours, minutes, 0, 0);

    const entry = {
      id: `wh-${Date.now()}`,
      date: getArgentinaDateString(),
      weight: parseFloat(newWeight),
      timestamp: argDate.getTime()
    };
    saveWeightHistory([...weightHistory, entry]);
    await saveWeightEntry(entry); // Save to Supabase
    setNewWeight('');
    setNewWeightTime('09:00');
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

  // Circular progress component - responsive with better fonts
  const CircularProgress = ({ current, target, label, color, size = 80 }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOver = current > target;
    const strokeWidth = size < 60 ? 5 : size < 80 ? 6 : 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    // Better font sizes for readability - scale with size
    const fontSize = size < 60 ? 'text-xs' : size < 80 ? 'text-sm' : 'text-base';
    const subFontSize = size < 60 ? 'text-xs' : size < 80 ? 'text-xs' : 'text-xs';
    const labelSize = size < 60 ? 'text-xs' : size < 80 ? 'text-xs' : 'text-sm';

    return (
      <div className="flex flex-col items-center min-w-0">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg className="transform -rotate-90 drop-shadow-lg" width={size} height={size}>
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1f2937" strokeWidth={strokeWidth} fill="none" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isOver ? '#f87171' : color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 ${size / 10}px ${isOver ? '#f87171' : color}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className={`${fontSize} font-bold ${isOver ? 'text-red-400' : 'text-white'}`}>{current}</span>
            <span className={`${subFontSize} text-gray-400`}>/{target}</span>
          </div>
        </div>
        <span className={`${labelSize} font-medium text-gray-300 mt-1`}>{label}</span>
      </div>
    );
  };

  // Progress bar component
  const ProgressBar = ({ current, target, label, unit, color }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOver = current > target;
    return (
      <div className="mb-2 lg:mb-3">
        <div className="flex justify-between mb-1 lg:mb-1.5">
          <span className="text-xs lg:text-sm font-medium text-gray-300">{label}</span>
          <span className={`text-xs lg:text-sm font-bold ${isOver ? 'text-red-400' : 'text-gray-200'}`}>{current}/{target}{unit}</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2 lg:h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${isOver ? 'bg-red-500' : color}`}
            style={{
              width: `${percentage}%`,
              boxShadow: percentage > 0 ? `0 0 10px ${isOver ? '#f87171' : 'currentColor'}50` : 'none'
            }}
          />
        </div>
      </div>
    );
  };

  // Mini bar
  const MiniBar = ({ current, target, color }) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    );
  };

  // Weight Line Chart with 7-day moving average
  const WeightLineChart = ({ data }) => {
    if (data.length === 0) return null;

    const weights = data.map(d => d.weight);
    const minWeight = Math.min(...weights) - 0.5;
    const maxWeight = Math.max(...weights) + 0.5;
    const range = maxWeight - minWeight;

    const chartHeight = 120;
    const chartWidth = 100; // percentage
    const padding = 10;

    const getY = (weight) => {
      return chartHeight - padding - ((weight - minWeight) / range) * (chartHeight - padding * 2);
    };

    // Create path for actual weight
    const weightPath = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = getY(d.weight);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Create path for 7-day average
    const avgPath = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = getY(d.avg7d);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Target line
    const targetY = getY(profile.targetWeight);

    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-blue-400">📈 PESO</h3>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block"></span> Peso</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block"></span> Media 7d</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-500 inline-block border-dashed"></span> Objetivo</span>
          </div>
        </div>

        <div className="relative" style={{ height: chartHeight }}>
          <svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full">
            {/* Target line */}
            {profile.targetWeight >= minWeight && profile.targetWeight <= maxWeight && (
              <line x1="0" y1={targetY} x2="100" y2={targetY} stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2,2" />
            )}

            {/* 7-day average line */}
            <path d={avgPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Actual weight line */}
            <path d={weightPath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data points */}
            {data.map((d, i) => (
              <circle key={i} cx={(i / (data.length - 1)) * 100} cy={getY(d.weight)} r="2" fill="#3B82F6" />
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-1">
            <span>{maxWeight.toFixed(1)}</span>
            <span>{minWeight.toFixed(1)}</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          {data.length > 0 && <span>{data[0].dayLabel}</span>}
          {data.length > 1 && <span>{data[data.length - 1].dayLabel}</span>}
        </div>

        {/* Current stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{data[data.length - 1]?.weight || '-'}</div>
            <div className="text-xs text-gray-400">Último</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">{data[data.length - 1]?.avg7d || '-'}</div>
            <div className="text-xs text-gray-400">Media 7d</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{profile.targetWeight}</div>
            <div className="text-xs text-gray-400">Objetivo</div>
          </div>
        </div>
      </div>
    );
  };

  // Adherence Card Component
  const AdherenceCard = ({ data, label }) => {
    const getScoreColor = (score) => {
      if (score >= 8) return 'text-blue-400';
      if (score >= 6) return 'text-amber-400';
      return 'text-red-400';
    };

    return (
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold text-gray-400">{label}</h4>
          <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>{data.score}/10</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-blue-400 font-bold">{data.calOkDays}/{data.daysTracked}</div>
            <div className="text-gray-500">Cal OK</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold">{data.protOkDays}/{data.daysTracked}</div>
            <div className="text-gray-500">Prot OK</div>
          </div>
          <div>
            <div className="text-cyan-400 font-bold">{data.stepsOkDays}/{data.daysTracked}</div>
            <div className="text-gray-500">Pasos OK</div>
          </div>
        </div>
      </div>
    );
  };

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
    const tennisSessions = weekWorkouts.filter(w => w.type === 'tennis');

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

  // Simple bar chart
  const SimpleBarChart = ({ data, dataKey, target, color, label }) => {
    const maxVal = Math.max(...data.map(d => d[dataKey]), target) * 1.1 || target * 1.1;
    return (
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-300">{label}</span>
          <span className="text-xs text-gray-500">Meta: {target}</span>
        </div>
        <div className="flex items-end justify-between h-16 gap-0.5">
          {data.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-full bg-gray-700 rounded-t relative" style={{ height: '48px' }}>
                <div className={`absolute bottom-0 w-full rounded-t transition-all ${color} ${d[dataKey] > target ? 'opacity-60' : ''}`} style={{ height: `${Math.min((d[dataKey] / maxVal) * 100, 100)}%` }} />
                <div className="absolute w-full border-t border-dashed border-gray-500" style={{ bottom: `${(target / maxVal) * 100}%` }} />
                {d.completed && <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-xs">✓</div>}
              </div>
              <span className="text-xs text-gray-500 mt-0.5">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} showNav={!!profile.name && !showOnboarding}>
      {/* Google Font - Plus Jakarta Sans for modern fitness aesthetic */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-5 max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar?</h3>
            <p className="text-base text-gray-400 mb-4">"{deleteModal.name}"</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal({ show: false, type: '', id: null, name: '' })} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2.5 rounded text-base">Cancelar</button>
              <button onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-500 py-2.5 rounded text-base font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt 3: Migration Modal */}
      {showMigrationModal && migrationData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-blue-500/30 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">☁️</div>
              <h3 className="text-xl font-bold text-white mb-2">Datos locales encontrados</h3>
              <p className="text-gray-400 text-sm">
                Tienes datos guardados en este dispositivo. ¿Quieres sincronizarlos con tu cuenta?
              </p>
            </div>

            {/* Summary of data to migrate */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-sm">
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                {migrationData.weightHistory?.length > 0 && (
                  <div>📊 {migrationData.weightHistory.length} registros de peso</div>
                )}
                {migrationData.foodLog?.length > 0 && (
                  <div>🍽️ {migrationData.foodLog.length} comidas</div>
                )}
                {migrationData.workouts?.length > 0 && (
                  <div>🏋️ {migrationData.workouts.length} entrenos</div>
                )}
                {migrationData.stepsLog?.length > 0 && (
                  <div>👟 {migrationData.stepsLog.length} días de pasos</div>
                )}
                {migrationData.ouraLog?.length > 0 && (
                  <div>💍 {migrationData.ouraLog.length} registros Oura</div>
                )}
                {migrationData.profile && (
                  <div>👤 Perfil y objetivos</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
              >
                {isMigrating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Migrando datos...
                  </span>
                ) : (
                  'Sí, sincronizar todo'
                )}
              </button>

              <button
                onClick={() => {
                  setShowMigrationModal(false);
                  setMigrationData(null);
                }}
                disabled={isMigrating}
                className="w-full py-3 bg-gray-700 text-gray-300 font-medium rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50"
              >
                No, empezar de cero
              </button>

              <p className="text-xs text-gray-500 text-center">
                Si eliges "empezar de cero", los datos locales se mantendrán pero no se sincronizarán.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Food Entry Modal */}
      {showFoodForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowFoodForm(false); setEditingFoodId(null); }}>
          <div className="bg-gray-800 rounded-xl p-5 lg:p-6 w-full max-w-sm lg:max-w-md border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg lg:text-xl font-bold text-blue-400">{editingFoodId ? '✏️ Editar Comida' : '🍽️ Nueva Comida'}</h3>
              <button onClick={() => { setShowFoodForm(false); setEditingFoodId(null); }} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white text-xl lg:text-2xl transition-colors">×</button>
            </div>
            <div className="space-y-3">
              {/* Row 1: Meal type + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Comida</label>
                  <select value={newFood.meal} onChange={(e) => setNewFood({ ...newFood, meal: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm lg:text-base">
                    <option>Desayuno</option>
                    <option>Almuerzo</option>
                    <option>Merienda</option>
                    <option>Cena</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Hora</label>
                  <input type="time" value={newFood.time} onChange={(e) => setNewFood({ ...newFood, time: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm lg:text-base" />
              </div>
              </div>
              {/* Row 2: Name */}
              <div>
                <label className="block text-sm lg:text-base text-gray-400 mb-1">Nombre *</label>
                <input type="text" value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} placeholder="Pollo con arroz" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm lg:text-base" />
              </div>
              {/* Row 3: Description */}
              <div>
                <label className="block text-sm lg:text-base text-gray-400 mb-1">Descripción</label>
                <input type="text" value={newFood.description} onChange={(e) => setNewFood({ ...newFood, description: e.target.value })} placeholder="200g pechuga, 150g arroz" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm lg:text-base" />
              </div>
              {/* Row 4: Macros - 3+2 grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Cal *</label>
                  <input type="number" value={newFood.calories} onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })} placeholder="500" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2.5 text-sm lg:text-base text-center" />
                </div>
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Prot</label>
                  <input type="number" value={newFood.protein} onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })} placeholder="40" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2.5 text-sm lg:text-base text-center" />
                </div>
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Carbs</label>
                  <input type="number" value={newFood.carbs} onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })} placeholder="50" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2.5 text-sm lg:text-base text-center" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Fat</label>
                  <input type="number" value={newFood.fat} onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })} placeholder="15" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2.5 text-sm lg:text-base text-center" />
                </div>
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Fibra</label>
                  <input type="number" value={newFood.fiber} onChange={(e) => setNewFood({ ...newFood, fiber: e.target.value })} placeholder="5" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2.5 text-sm lg:text-base text-center" />
                </div>
              </div>
              <input type="hidden" value={newFood.date} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowFoodForm(false); setEditingFoodId(null); }} className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg text-sm lg:text-base font-medium transition-colors">Cancelar</button>
              <button onClick={addManualFood} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 py-3 rounded-lg text-sm lg:text-base font-bold transition-all">
                {editingFoodId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Workout Entry Modal */}
      {showWorkoutForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowWorkoutForm(false)}>
          <div className="bg-gray-800 rounded-xl p-5 lg:p-6 w-full max-w-sm lg:max-w-md border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg lg:text-xl font-bold text-amber-400">🏋️ Nuevo Entreno</h3>
              <button onClick={() => setShowWorkoutForm(false)} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white text-xl lg:text-2xl transition-colors">×</button>
            </div>
            <div className="space-y-3">
              {/* Row 1: Type */}
                <div>
                <label className="block text-sm lg:text-base text-gray-400 mb-1">Tipo</label>
                <select value={newWorkout.type} onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm lg:text-base">
                    <option value="gym">Gym</option>
                    <option value="tennis">Tenis</option>
                    <option value="cardio">Cardio</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              {/* Row 2: Name */}
              <div>
                <label className="block text-sm lg:text-base text-gray-400 mb-1">Nombre *</label>
                <input type="text" value={newWorkout.name} onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })} placeholder="Push Day, Clase de Tenis" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm lg:text-base" />
              </div>
              {/* Row 3: Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Min</label>
                  <input type="number" value={newWorkout.duration} onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })} placeholder="60" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2.5 text-sm lg:text-base text-center" />
                </div>
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Kcal</label>
                  <input type="number" value={newWorkout.calories} onChange={(e) => setNewWorkout({ ...newWorkout, calories: e.target.value })} placeholder="300" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2.5 text-sm lg:text-base text-center" />
                </div>
                <div>
                  <label className="block text-sm lg:text-base text-gray-400 mb-1">Vol (kg)</label>
                  <input type="number" value={newWorkout.volume} onChange={(e) => setNewWorkout({ ...newWorkout, volume: e.target.value })} placeholder="2500" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-2.5 text-sm lg:text-base text-center" />
                </div>
              </div>
              {/* Row 4: Notes */}
              <div>
                <label className="block text-sm lg:text-base text-gray-400 mb-1">Notas</label>
                <input type="text" value={newWorkout.notes} onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })} placeholder="Subí peso en press banca" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm lg:text-base" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowWorkoutForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg text-sm lg:text-base font-medium transition-colors">Cancelar</button>
              <button onClick={addManualWorkout} className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-3 rounded-lg text-sm lg:text-base font-bold transition-all">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Food Modal */}
      {showImportFoodModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-2 pt-10 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-sm border border-gray-700">
            <h3 className="text-base font-bold text-blue-400 mb-2">📥 Importar Comida</h3>
            <p className="text-xs text-gray-400 mb-3">Pegá el JSON de la comida.</p>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder={`{"meal": "Almuerzo", "name": "Pollo", "calories": 500, "protein": 40}`}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-xs font-mono h-36 resize-none"
            />
            {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowImportFoodModal(false); setImportText(''); setImportError(''); }} className="flex-1 bg-gray-700 active:bg-gray-600 py-2.5 rounded text-sm">Cancelar</button>
              <button onClick={handleImportFood} className="flex-1 bg-blue-600 active:bg-blue-500 py-2.5 rounded text-sm font-bold">Importar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Workout Modal */}
      {showImportWorkoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-2 pt-10 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-sm border border-gray-700">
            <h3 className="text-base font-bold text-amber-400 mb-2">📥 Importar Entreno</h3>
            <p className="text-xs text-gray-400 mb-3">Pegá el JSON del entreno (Gravl o IA).</p>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder={`{"type": "gym", "name": "Push Day", "duration": 60, "exercises": [...]}`}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-xs font-mono h-36 resize-none"
            />
            {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowImportWorkoutModal(false); setImportText(''); setImportError(''); }} className="flex-1 bg-gray-700 active:bg-gray-600 py-2.5 rounded text-sm">Cancelar</button>
              <button onClick={handleImportWorkout} className="flex-1 bg-amber-600 active:bg-amber-500 py-2.5 rounded text-sm font-bold">Importar</button>
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
      <header className="bg-gradient-to-r from-slate-900 via-gray-800 to-slate-900 border-b border-blue-500/20 px-4 lg:px-8 py-3 lg:py-4 sticky top-0 z-30">
        <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            {/* Logo - bigger */}
            <svg viewBox="0 0 32 32" className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
              <defs>
                <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3B82F6' }} />
                  <stop offset="100%" style={{ stopColor: '#06B6D4' }} />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15" fill="#0F172A" stroke="url(#headerGrad)" strokeWidth="1" />
              <path d="M10 7 L10 21 L19 21 L19 18 L13 18 L13 7 Z" fill="url(#headerGrad)" />
              <path d="M18 7 L14 15 L17 15 L15 25 L23 14 L19 14 L22 7 Z" fill="url(#headerGrad)" opacity="0.9" />
            </svg>
          <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate tracking-tight">LUKENFIT</h1>
            <p className="text-sm text-gray-500 truncate">
              {profile.currentWeight}kg → {profile.targetWeight}kg
                {isTrainingDay(dashboardDate) && <span className="ml-1 text-amber-400">🏋️</span>}
            </p>
          </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Save status */}
            {saveStatus && (
              <span className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded animate-pulse">{saveStatus}</span>
            )}

            {/* Sync status */}
            {supabase.isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Offline indicator */}
                {!supabase.isOnline && (
                  <span className="text-sm bg-amber-500/20 text-amber-400 px-2 py-1 rounded">📴 Offline</span>
                )}

                {/* Sync status - bigger icons */}
                {supabase.isOnline && (
                  <span className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center text-lg ${
                    supabase.syncStatus === 'syncing' ? 'bg-blue-500/20 text-blue-400' :
                    supabase.syncStatus === 'success' ? 'bg-green-500/20 text-green-400' :
                    supabase.syncStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-700/50 text-gray-400'
                  }`}>
                    {supabase.syncStatus === 'syncing' ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                  className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-xl bg-green-500/20 hover:bg-green-500/40 active:bg-green-500/60 text-green-400 hover:text-green-300 transition-all touch-manipulation"
                  title="Forzar sincronización a la nube"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>

                {/* Logout button - bigger and more visible */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-xl bg-red-500/20 hover:bg-red-500/40 active:bg-red-500/60 text-red-400 hover:text-red-300 transition-all touch-manipulation"
                  title="Cerrar sesión"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                className="text-sm text-blue-400 hover:text-cyan-300 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Secondary tabs for Pasos/Oura (accessible from Dashboard) */}
      {['pasos', 'oura'].includes(activeTab) && (
        <nav className="bg-gray-800/50 border-b border-gray-700 px-4">
          <div className="max-w-6xl mx-auto flex gap-1">
            {['pasos', 'oura'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 active:text-gray-200'
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

                {/* Activity Cards */}
                <ActivityCards
                  steps={getStepsForDate(dashboardDate)}
                  stepsTarget={10000}
                  water={getTodayWater().glasses}
                  waterTarget={WATER_GOAL_GLASSES}
                  onAddWater={addWaterGlass}
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
                <input
                  type="date"
                  value={selectedFoodDate}
                  onChange={(e) => setSelectedFoodDate(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-base flex-1 min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
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
                {['Desayuno', 'Almuerzo', 'Cena', 'Snack'].map(mealType => {
                  const mealFoods = getFoodsForDate(selectedFoodDate).filter(f =>
                     // Normalize string comparison
                     (f.meal || '').toLowerCase() === mealType.toLowerCase() ||
                     // Fallback for old data or mismatches
                     (mealType === 'Snack' && !['desayuno', 'almuerzo', 'cena'].includes((f.meal || '').toLowerCase()))
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
                <input
                  type="date"
                  value={selectedWorkoutDate}
                  onChange={(e) => setSelectedWorkoutDate(e.target.value)}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                />
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
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                  <div key={day} className={`p-2 rounded-xl border ${[0, 3, 5].includes(i) ? 'bg-amber-50 border-amber-100 text-amber-700' : i === 2 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <div className="font-bold text-xs">{day}</div>
                    <div className="text-[10px] font-bold mt-1 tracking-tighter">{[0, 3, 5].includes(i) ? 'GYM' : i === 2 ? 'TEN' : 'OFF'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Peso Tab */}
        {activeTab === 'peso' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-2 px-1">
              <h1 className="text-2xl font-bold text-gray-900">Peso</h1>
              <p className="text-sm text-gray-500">Seguimiento de progreso corporal</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">⚖️</span>
                NUEVO REGISTRO
              </h2>
              <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                  <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="84.5" className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                  <span className="flex items-center text-gray-500 text-sm font-medium">kg</span>
                </div>
                <div className="flex gap-2">
                  <input type="time" value={newWeightTime} onChange={(e) => setNewWeightTime(e.target.value)} className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                  <button onClick={addWeightEntry} disabled={!newWeight} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 transition-all">Guardar</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Progreso</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-gray-900">{profile.currentWeight}</div>
                  <div className="text-xs text-gray-400 font-medium mt-1">Actual</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-blue-600">{profile.targetWeight}</div>
                  <div className="text-xs text-gray-400 font-medium mt-1">Objetivo</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-amber-500">{(profile.currentWeight - profile.targetWeight).toFixed(1)}</div>
                  <div className="text-xs text-gray-400 font-medium mt-1">Faltan</div>
                </div>
              </div>
            </div>

            {/* Weight Chart with 7-day moving average */}
            {getWeightChartData.length > 1 && (
              <WeightLineChart data={getWeightChartData} />
            )}

            {/* Projection */}
            {weightProjection && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Proyección</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-xl font-bold text-gray-900">
                      {weightProjection.weeklyRate > 0 ? '-' : '+'}{Math.abs(weightProjection.weeklyRate)} <span className="text-xs font-normal text-gray-500">kg</span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium mt-1">Por semana</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-xl font-bold text-blue-600">
                      {weightProjection.weeksToGoal ? `${weightProjection.weeksToGoal} sem` : '-'}
                    </div>
                    <div className="text-xs text-gray-400 font-medium mt-1">Para llegar</div>
                  </div>
                </div>

                {weightProjection.goalDate && (
                  <div className="text-center p-2 bg-blue-900/20 rounded mb-3">
                    <span className="text-sm text-gray-300">Fecha estimada: </span>
                    <span className="text-sm font-bold text-blue-400">{weightProjection.goalDate}</span>
                  </div>
                )}

                {weightProjection.recommendation && (
                  <div className={`p-3 rounded ${weightProjection.recommendation.type === 'good' ? 'bg-blue-900/30 border border-blue-500/30' :
                    weightProjection.recommendation.type === 'decrease' ? 'bg-amber-900/30 border border-amber-500/30' :
                      'bg-red-900/30 border border-red-500/30'
                    }`}>
                    <p className={`text-sm ${weightProjection.recommendation.type === 'good' ? 'text-blue-400' :
                      weightProjection.recommendation.type === 'decrease' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                      💡 {weightProjection.recommendation.text}
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Análisis basado en {weightProjection.dataPoints} registros durante {weightProjection.daysCovered} días
                </p>
              </div>
            )}

            {weightHistory.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Historial</h2>
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {weightHistory.map((entry, idx) => (
                    <div key={entry.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold">{entry.date}</span>
                        {entry.timestamp && <span className="text-xs text-gray-400 font-medium">{formatTime(entry.timestamp)}</span>}
                      </div>

                      <div className="flex items-center gap-6">
                        {editingWeightId === entry.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={editingWeightValue}
                              onChange={(e) => setEditingWeightValue(e.target.value)}
                              className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-lg font-bold focus:border-blue-500 outline-none transition-all"
                            />
                            <button onClick={saveEditWeight} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">✓</button>
                            <button onClick={cancelEditWeight} className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="text-right flex flex-col items-end">
                              <span className="font-black text-xl text-gray-900">{entry.weight}<span className="text-xs font-medium text-gray-400 ml-1">kg</span></span>
                              {idx < weightHistory.length - 1 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${entry.weight < weightHistory[idx + 1].weight ? 'bg-blue-50 text-blue-600' : entry.weight > weightHistory[idx + 1].weight ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                                  {entry.weight < weightHistory[idx + 1].weight ? '↓' : entry.weight > weightHistory[idx + 1].weight ? '↑' : '='}{Math.abs(entry.weight - weightHistory[idx + 1].weight).toFixed(1)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditWeight(entry.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => confirmDelete('weight', entry.id, `${entry.weight} kg (${entry.date})`)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pasos Tab */}
        {activeTab === 'pasos' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-2 px-1">
              <h1 className="text-2xl font-bold text-gray-900">Pasos</h1>
              <p className="text-sm text-gray-500">Actividad diaria</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">👟</span>
                REGISTRAR PASOS
              </h2>
              <input type="date" value={stepsDate} onChange={(e) => setStepsDate(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm mb-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium" />
              <div className="flex gap-2">
                <input type="number" value={newSteps} onChange={(e) => setNewSteps(e.target.value)} placeholder="ej: 8500" className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-lg font-black focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder-gray-300" />
                <button onClick={addStepsEntry} className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all">OK</button>
              </div>
            </div>

            <SimpleBarChart data={weeklyData} dataKey="steps" target={8000} color="bg-cyan-500" label="Pasos 7 días" />

            {stepsLog.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-sm font-bold text-blue-400 mb-3">📊 HISTORIAL</h2>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {stepsLog.slice(0, 14).map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-700 text-sm">
                      <span className="text-gray-400">{entry.date}</span>
                      <span className={`font-bold ${entry.steps >= 8000 ? 'text-cyan-400' : 'text-gray-300'}`}>{entry.steps.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Oura Tab */}
        {activeTab === 'oura' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-2 px-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900">Oura</h1>
              <p className="text-sm text-gray-500">Sincronización de sueño y recuperación</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">💍</span>
                REGISTRAR DATOS OURA
              </h2>
              <div className="space-y-4">
                <input type="date" value={newOuraEntry.date} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, date: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />

                {/* Scores - 2 cols on mobile, 3 on larger */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Sleep</label>
                    <input type="number" value={newOuraEntry.sleepScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, sleepScore: e.target.value })} placeholder="85" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Ready</label>
                    <input type="number" value={newOuraEntry.readinessScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, readinessScore: e.target.value })} placeholder="80" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Activity</label>
                    <input type="number" value={newOuraEntry.activityScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, activityScore: e.target.value })} placeholder="75" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">HRV</label>
                    <input type="number" value={newOuraEntry.hrv} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, hrv: e.target.value })} placeholder="45" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">RHR</label>
                    <input type="number" value={newOuraEntry.restingHr} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, restingHr: e.target.value })} placeholder="58" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Horas</label>
                    <input type="number" step="0.1" value={newOuraEntry.sleepHours} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, sleepHours: e.target.value })} placeholder="7.5" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                </div>

                {/* Sleep details - compact 2x2 grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Deep</label>
                    <input type="number" value={newOuraEntry.deepSleepMins} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, deepSleepMins: e.target.value })} placeholder="90" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">REM</label>
                    <input type="number" value={newOuraEntry.remSleepMins} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, remSleepMins: e.target.value })} placeholder="100" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Acostarse</label>
                    <input type="time" value={newOuraEntry.bedtime} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, bedtime: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Despertar</label>
                    <input type="time" value={newOuraEntry.wakeTime} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, wakeTime: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                  </div>
                </div>

                <button onClick={addOuraEntry} className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-purple-500/30 transition-all">Guardar Datos</button>
              </div>
            </div>

            {/* Oura History - Compact */}
            {ouraLog.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <h2 className="text-sm font-bold text-purple-400 mb-2">📊 HISTORIAL</h2>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {ouraLog.slice(0, 14).map((entry, idx) => (
                    <div key={idx} className="bg-gray-700/50 rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-300 text-sm font-medium">{entry.date}</span>
                        <div className="flex gap-1.5 text-xs">
                          {entry.sleepScore && <span className="text-purple-400">😴{entry.sleepScore}</span>}
                          {entry.readinessScore && <span className="text-blue-400">⚡{entry.readinessScore}</span>}
                          {entry.activityScore && <span className="text-amber-400">🏃{entry.activityScore}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-400">
                        {entry.hrv && <span>HRV:{entry.hrv}</span>}
                        {entry.restingHr && <span>RHR:{entry.restingHr}</span>}
                        {entry.sleepHours && <span>{entry.sleepHours}h</span>}
                        {entry.bedtime && entry.wakeTime && <span>{entry.bedtime}→{entry.wakeTime}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Oura Insights - Compact */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
              <h3 className="text-xs font-bold text-purple-400 mb-1.5">💡 GUÍA RÁPIDA</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-gray-300">
                <span>😴 Sleep ≥85 = óptimo</span>
                <span>⚡ Ready &lt;70 = descanso</span>
                <span>❤️ HRV = recuperación</span>
              </div>
            </div>
          </div>
        )}

        {/* Config Tab - with editable targets and debounced saving */}
        {activeTab === 'config' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="mb-2 px-1">
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="text-sm text-gray-500">Ajustes de perfil y objetivos</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
                        {profile.name?.substring(0, 1) || 'L'}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">{profile.name || 'Usuario'}</h3>
                        <p className="text-sm text-gray-500 font-medium">Plan Premium · Activo</p>
                    </div>
                </div>

              <h2 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                 PERFIL Y DATOS
              </h2>
              <div className="grid grid-cols-2 gap-6">
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
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-2 pt-8 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-sm border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg lg:text-xl font-bold text-purple-400">⭐ Favoritos</h3>
              <button onClick={() => setShowTemplatesModal(false)} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white text-xl lg:text-2xl transition-colors">×</button>
            </div>

            {mealTemplates.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No hay plantillas guardadas. Agregá comidas y guardalas como favoritos.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {mealTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-gray-700 rounded-lg p-3 border border-gray-600 active:bg-gray-600"
                  >
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => addFromTemplate(template)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-400 uppercase">{template.meal}</span>
                        </div>
                        <h4 className="font-medium text-sm text-white">{template.name}</h4>
                        {template.description && (
                          <p className="text-xs text-gray-400 truncate">{template.description}</p>
                        )}
                        <div className="flex gap-2 mt-1 text-xs">
                          <span className="text-blue-400">{template.calories}kcal</span>
                          <span className="text-blue-400">{template.protein}P</span>
                          <span className="text-amber-400">{template.carbs}C</span>
                          <span className="text-pink-400">{template.fat}F</span>
                        </div>
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-gray-500 active:text-red-400 p-1"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-xs border border-purple-500/30">
            <h3 className="text-sm font-bold text-purple-400 mb-3">⭐ Guardar como Favorito</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={templateToSave.name}
                  onChange={(e) => setTemplateToSave({ ...templateToSave, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                  <select
                    value={templateToSave.meal}
                    onChange={(e) => setTemplateToSave({ ...templateToSave, meal: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm"
                  >
                    <option>Desayuno</option>
                    <option>Almuerzo</option>
                    <option>Merienda</option>
                    <option>Cena</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Calorías</label>
                  <input
                    type="number"
                    value={templateToSave.calories}
                    onChange={(e) => setTemplateToSave({ ...templateToSave, calories: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-400">
                P: {templateToSave.protein}g · C: {templateToSave.carbs}g · F: {templateToSave.fat}g
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowSaveTemplateModal(false); setTemplateToSave(null); }} className="flex-1 bg-gray-700 active:bg-gray-600 py-2.5 rounded text-sm">Cancelar</button>
              <button onClick={confirmSaveTemplate} className="flex-1 bg-purple-600 active:bg-purple-500 py-2.5 rounded text-sm font-bold">Guardar</button>
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

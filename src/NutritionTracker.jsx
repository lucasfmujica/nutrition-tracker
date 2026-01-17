import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthUI } from './components/AuthUI';
import { BottomNav } from './components/BottomNav';
import { FloatingActionButton } from './components/FloatingActionButton';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PullToRefresh } from './components/PullToRefresh';
import { SwipeableItem } from './components/SwipeableItem';
import { WeeklyReport } from './components/WeeklyReport';
import { useTrackerData } from './hooks/useTrackerData';
import { ARGENTINA_TZ, addDaysToDate, getArgentinaDateString, getArgentinaDay, getMondayOfWeek } from './utils/dateUtils';

const WATER_GOAL_GLASSES = 8;

const NutritionTracker = () => {
  // Use custom hook for all data management
  const {
    supabase,
    showAuth,
    showOnboarding, setShowOnboarding,
    offlineMode,
    isLoading,
    saveStatus,
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
  } = useTrackerData();

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

  // Add manual food entry with IA schema
  const addManualFood = async () => {
    // Validate required fields
    if (!newFood.name?.trim()) {
      setSaveStatus('⚠️ Falta el nombre');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    if (!newFood.calories || parseInt(newFood.calories) <= 0) {
      setSaveStatus('⚠️ Faltan calorías');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const isEditing = !!editingFoodId;

    try {
    const sourceId = `manual-${newFood.date}-${Date.now()}`;
    const entry = {
        id: isEditing ? editingFoodId : `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: newFood.date || getArgentinaDateString(),
      time: newFood.time || '',
        meal: newFood.meal || 'Snack',
        name: newFood.name.trim(),
        description: newFood.description?.trim() || '',
      calories: parseInt(newFood.calories) || 0,
      protein: parseInt(newFood.protein) || 0,
      carbs: parseInt(newFood.carbs) || 0,
      fat: parseInt(newFood.fat) || 0,
      fiber: parseInt(newFood.fiber) || 0,
      source: 'manual',
      reviewed: true,
      confidence: 1,
      sourceId
    };

      // Close form immediately for better UX
      setShowFoodForm(false);
      setEditingFoodId(null);

      // Save to Supabase
      let finalEntry = entry;
      try {
        const savedEntry = await saveFoodEntry(entry);
        if (savedEntry?.id) {
          finalEntry = savedEntry;
        }
      } catch (saveErr) {
        console.error('Error saving to Supabase:', saveErr);
        // Continue with local entry
      }

      // Update or add to local state
      if (isEditing) {
        saveFoodLog(foodLog.map(f => f.id === editingFoodId ? finalEntry : f));
        setSaveStatus('✓ Comida actualizada');
      } else {
        saveFoodLog([...foodLog, finalEntry]);
        setSaveStatus('✓ Comida agregada');
      }
      setTimeout(() => setSaveStatus(''), 2000);

      // Reset form
    setNewFood({
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
    } catch (err) {
      console.error('Error adding food:', err);
      setSaveStatus('❌ Error al guardar');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // =====================================================
  // MEAL TEMPLATES / FAVORITES
  // =====================================================

  // Load templates from localStorage on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const stored = await storage.get('lucas-meal-templates-v1');
        if (stored?.value) {
          setMealTemplates(JSON.parse(stored.value));
        }
      } catch (err) {
        console.log('Using default templates');
      }
    };
    loadTemplates();
  }, []);

  // Save templates to localStorage when they change
  const saveMealTemplates = async (templates) => {
    setMealTemplates(templates);
    try {
      await storage.set('lucas-meal-templates-v1', JSON.stringify(templates));
    } catch (err) {
      console.error('Error saving templates:', err);
    }
  };

  // Add food from template
  const addFromTemplate = async (template) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: ARGENTINA_TZ });

    const entry = {
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: selectedFoodDate,
      time,
      meal: template.meal,
      name: template.name,
      description: template.description || '',
      calories: template.calories,
      protein: template.protein,
      carbs: template.carbs,
      fat: template.fat,
      fiber: template.fiber || 0,
      source: 'template',
      reviewed: true,
      confidence: 1,
      sourceId: `tpl-${template.id}-${Date.now()}`
    };

    // Save to Supabase first
    const savedEntry = await saveFoodEntry(entry);
    const finalEntry = savedEntry?.id ? savedEntry : entry;

    saveFoodLog([...foodLog, finalEntry]);
    setShowTemplatesModal(false);
    setSaveStatus(`✓ ${template.name}`);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Save current food as template
  const saveAsTemplate = (food) => {
    setTemplateToSave({
      name: food.name,
      meal: food.meal,
      description: food.description || '',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber || 0
    });
    setShowSaveTemplateModal(true);
  };

  // Confirm save template
  const confirmSaveTemplate = () => {
    if (!templateToSave?.name) return;
    const newTemplate = {
      id: `tpl-${Date.now()}`,
      ...templateToSave
    };
    saveMealTemplates([...mealTemplates, newTemplate]);
    setShowSaveTemplateModal(false);
    setTemplateToSave(null);
    setSaveStatus('✓ Plantilla guardada');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Delete template
  const deleteTemplate = (id) => {
    saveMealTemplates(mealTemplates.filter(t => t.id !== id));
  };

  // Add manual workout entry with IA schema
  const addManualWorkout = async () => {
    if (!newWorkout.name) return;
    const sourceId = `manual-${newWorkout.date}-${Date.now()}`;
    const entry = {
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: newWorkout.date,
      type: newWorkout.type,
      name: newWorkout.name,
      duration: parseInt(newWorkout.duration) || 0,
      calories: parseInt(newWorkout.calories) || 0,
      volume: parseInt(newWorkout.volume) || 0,
      exercises: [],
      notes: newWorkout.notes || '',
      // IA schema
      source: 'manual',
      reviewed: true,
      confidence: 1,
      sourceId
    };

    // Save to Supabase first to get the real ID
    const savedEntry = await saveWorkoutEntry(entry);
    const finalEntry = savedEntry?.id ? savedEntry : entry;

    saveWorkoutLog([...workoutLog, finalEntry]);
    setNewWorkout({
      date: getArgentinaDateString(),
      type: 'gym',
      name: '',
      duration: '',
      calories: '',
      volume: '',
      notes: ''
    });
    setShowWorkoutForm(false);
  };

  // Add or update food entry (for IA imports with deduplication)
  const upsertFood = (entry) => {
    if (!entry.sourceId) {
      // No sourceId, just add
      saveFoodLog([...foodLog, { ...entry, id: entry.id || `f-${Date.now()}` }]);
      return;
    }
    // Check for existing entry with same sourceId
    const existingIndex = foodLog.findIndex(f => f.sourceId === entry.sourceId);
    if (existingIndex >= 0) {
      // Update existing
      const newLog = [...foodLog];
      newLog[existingIndex] = { ...newLog[existingIndex], ...entry };
      saveFoodLog(newLog);
    } else {
      // Add new
      saveFoodLog([...foodLog, { ...entry, id: entry.id || `f-${Date.now()}` }]);
    }
  };

  // Add or update workout entry (for IA imports with deduplication)
  const upsertWorkout = (entry) => {
    if (!entry.sourceId) {
      saveWorkoutLog([...workoutLog, { ...entry, id: entry.id || `w-${Date.now()}` }]);
      return;
    }
    const existingIndex = workoutLog.findIndex(w => w.sourceId === entry.sourceId);
    if (existingIndex >= 0) {
      const newLog = [...workoutLog];
      newLog[existingIndex] = { ...newLog[existingIndex], ...entry };
      saveWorkoutLog(newLog);
    } else {
      saveWorkoutLog([...workoutLog, { ...entry, id: entry.id || `w-${Date.now()}` }]);
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
    const backup = {
      exportDate: new Date().toISOString(),
      version: 'v5',
      profile,
      customTargets,
      weightHistory,
      foodLog,
      workoutLog,
      stepsLog,
      ouraLog
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucas-tracker-backup-${getArgentinaDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import backup from JSON file
  const importBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.profile) setProfile(data.profile);
        if (data.customTargets) setCustomTargets(data.customTargets);
        if (data.weightHistory) saveWeightHistory(data.weightHistory);
        if (data.foodLog) saveFoodLog(data.foodLog);
        if (data.workoutLog) saveWorkoutLog(data.workoutLog);
        if (data.stepsLog) saveStepsLog(data.stepsLog);
        if (data.ouraLog) saveOuraLog(data.ouraLog);

        alert('Backup restaurado correctamente!');
      } catch (err) {
        alert('Error al importar backup: archivo inválido');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };



  // Add Oura entry
  const addOuraEntry = async () => {
    if (!newOuraEntry.sleepScore && !newOuraEntry.readinessScore) return;
    const existingIndex = ouraLog.findIndex(o => o.date === newOuraEntry.date);
    const entry = {
      date: newOuraEntry.date,
      sleepScore: parseInt(newOuraEntry.sleepScore) || null,
      readinessScore: parseInt(newOuraEntry.readinessScore) || null,
      activityScore: parseInt(newOuraEntry.activityScore) || null,
      hrv: parseInt(newOuraEntry.hrv) || null,
      restingHr: parseInt(newOuraEntry.restingHr) || null,
      sleepHours: parseFloat(newOuraEntry.sleepHours) || null,
      deepSleepMins: parseInt(newOuraEntry.deepSleepMins) || null,
      remSleepMins: parseInt(newOuraEntry.remSleepMins) || null,
      bedtime: newOuraEntry.bedtime || null,
      wakeTime: newOuraEntry.wakeTime || null
    };

    let newLog;
    if (existingIndex >= 0) {
      newLog = [...ouraLog];
      newLog[existingIndex] = entry;
    } else {
      newLog = [...ouraLog, entry];
    }
    newLog.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveOuraLog(newLog);
    await saveOuraEntry(entry); // Save to Supabase
    setNewOuraEntry({
      date: getArgentinaDateString(),
      sleepScore: '', readinessScore: '', activityScore: '',
      hrv: '', restingHr: '', sleepHours: '',
      deepSleepMins: '', remSleepMins: '', bedtime: '', wakeTime: ''
    });
  };

  // Get Oura data for date
  const getOuraForDate = (date) => ouraLog.find(o => o.date === date);

  // Export food log for nutritionist as formatted TXT
  const exportForNutritionist = () => {
    const today = getArgentinaDateString();
    const startDate = addDaysToDate(today, -13);

    // Get all dates in range
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(addDaysToDate(startDate, i));
    }

    // Format date range for title
    const formatFullDate = (dateStr) => {
      const date = new Date(dateStr + 'T12:00:00');
      return new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: ARGENTINA_TZ
      }).format(date);
    };

    const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    // Calculate average sleep times from Oura data
    const ouraInRange = ouraLog.filter(o => o.date >= startDate && o.date <= today);
    let avgBedtime = 'N/D';
    let avgWakeTime = 'N/D';
    if (ouraInRange.length > 0) {
      const bedtimes = ouraInRange.filter(o => o.bedtime).map(o => o.bedtime);
      const wakeTimes = ouraInRange.filter(o => o.wakeTime).map(o => o.wakeTime);
      if (bedtimes.length > 0) avgBedtime = bedtimes[Math.floor(bedtimes.length / 2)];
      if (wakeTimes.length > 0) avgWakeTime = wakeTimes[Math.floor(wakeTimes.length / 2)];
    }

    // Get workouts in range
    const workoutsInRange = workoutLog.filter(w => w.date >= startDate && w.date <= today);

    // Build TXT content
    let txt = '';
    txt += '═══════════════════════════════════════════════════════════════\n';
    txt += '                    REGISTRO DE COMIDAS\n';
    txt += '═══════════════════════════════════════════════════════════════\n\n';
    txt += 'Nombre: Lucas Mujica\n';
    txt += `Período: ${capitalizeFirst(formatFullDate(startDate))} → ${capitalizeFirst(formatFullDate(today))}\n\n`;

    txt += '———————————————————————————————————————————————————————————————\n';
    txt += 'HORARIO PROMEDIO\n';
    txt += '———————————————————————————————————————————————————————————————\n';
    txt += `Despertar: ${avgWakeTime}\n`;
    txt += `Dormir: ${avgBedtime}\n\n`;

    txt += '———————————————————————————————————————————————————————————————\n';
    txt += 'ACTIVIDAD FÍSICA DURANTE EL PERÍODO\n';
    txt += '———————————————————————————————————————————————————————————————\n';
    if (workoutsInRange.length === 0) {
      txt += 'Sin actividad registrada.\n';
    } else {
      workoutsInRange.forEach(w => {
        const dayName = capitalizeFirst(formatFullDate(w.date).split(',')[0]);
        const typeMap = { gym: 'Gym', tennis: 'Tenis', cardio: 'Cardio', other: 'Otro' };
        txt += `${dayName}: ${typeMap[w.type] || w.type} ─ ${w.duration} min (${w.name})\n`;
      });
    }
    txt += '\n';

    txt += '═══════════════════════════════════════════════════════════════\n';
    txt += '                    REGISTRO DIARIO\n';
    txt += '═══════════════════════════════════════════════════════════════\n\n';

    // Each day
    dates.forEach(date => {
      const foods = foodLog.filter(f => f.date === date).sort((a, b) => {
        // Sort by time if available, otherwise by meal order
        if (a.time && b.time) return a.time.localeCompare(b.time);
        const mealOrder = { 'Desayuno': 1, 'Almuerzo': 2, 'Merienda': 3, 'Snack': 4, 'Cena': 5 };
        return (mealOrder[a.meal] || 99) - (mealOrder[b.meal] || 99);
      });

      txt += `———————————————————————————————————————————————————————————————\n`;
      txt += `${capitalizeFirst(formatFullDate(date))}\n`;
      txt += `———————————————————————————————————————————————————————————————\n`;

      if (foods.length === 0) {
        txt += 'Sin registro.\n';
      } else {
        foods.forEach(f => {
          const timeStr = f.time ? ` ─ ${f.time}` : '';
          txt += `${f.meal}${timeStr}: ${f.name}`;
          if (f.description) txt += ` (${f.description})`;
          txt += '\n';
        });
      }
      txt += '\n';
    });

    txt += '═══════════════════════════════════════════════════════════════\n';
    txt += `Generado: ${new Date().toLocaleString('es-AR', { timeZone: ARGENTINA_TZ })}\n`;

    // Download
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registro-nutricionista-${today}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  // Show loading only when loading data (after auth is confirmed)
  if (isLoading && showAuth === false) {
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
    <div className="min-h-screen bg-gray-900 text-gray-100 text-base md:text-lg">
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
                onClick={async () => {
                  setIsMigrating(true);
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
                    }
                  }
                  setIsMigrating(false);
                  setShowMigrationModal(false);
                }}
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

                {/* Logout button - bigger and more visible */}
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[Logout] Button clicked');
                    try {
                      // Reset all local state first
                      hasInitialized.current = false;
                      setShowAuth(true);
                      setOfflineMode(false);
                      // Then sign out from Supabase
                      const result = await supabase.signOut();
                      console.log('[Logout] signOut result:', result);
                    } catch (err) {
                      console.error('[Logout] Error:', err);
                      // Force show auth even on error
                      setShowAuth(true);
                    }
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
            <div className="space-y-4 lg:space-y-6">
              {/* Date Navigator - Premium Design */}
              <div className="flex items-center justify-center gap-4 lg:gap-6">
              <button
                  onClick={() => setDashboardDate(changeDate(dashboardDate, -1))}
                  className="group w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gray-800/80 backdrop-blur border border-gray-700 hover:border-blue-500/50 hover:bg-gray-700/80 transition-all duration-200 flex items-center justify-center"
              >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
              </button>
                <div className="text-center px-6 py-3 lg:px-10 lg:py-4 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{formatDateDisplay(dashboardDate)}</span>
                    {isDayCompleted(dashboardDate) && <span className="text-blue-400 text-base lg:text-lg">✓</span>}
                    {isTrainingDay(dashboardDate) && <span className="text-amber-400 text-base lg:text-lg">🏋️</span>}
                  </div>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">{dashboardDate}</p>
                </div>
              <button
                  onClick={() => setDashboardDate(changeDate(dashboardDate, 1))}
                  disabled={dashboardDate >= getArgentinaDateString()}
                  className={`group w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gray-800/80 backdrop-blur border border-gray-700 transition-all duration-200 flex items-center justify-center ${dashboardDate >= getArgentinaDateString() ? 'opacity-30 cursor-not-allowed' : 'hover:border-blue-500/50 hover:bg-gray-700/80'}`}
              >
                  <svg className={`w-5 h-5 lg:w-6 lg:h-6 transition-colors ${dashboardDate >= getArgentinaDateString() ? 'text-gray-600' : 'text-gray-400 group-hover:text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
              </button>
            </div>

              {/* Desktop: 2-column layout / Mobile: single column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Left Column - Macros */}
                <div className="space-y-4 lg:space-y-5">
                  {/* Macro Card - Glass Effect */}
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-gray-700/50 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300">
                    <div className="flex justify-between items-center mb-4 lg:mb-6">
                      <h2 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg lg:text-xl">📊</span>
                        Macros
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">{getFoodsForDate(dashboardDate).length} comidas</span>
                        <button onClick={copyMealsFromYesterday} className="text-xs bg-gray-700/80 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">📋 Copiar ayer</button>
                </div>
            </div>

                    {/* Macro circles - Larger on desktop */}
                    <div className="flex justify-around items-start mb-5 lg:mb-6">
                      <CircularProgress current={dashboardTotals.calories} target={dashboardTargets.calories} label="Calorías" color="#3B82F6" size={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 80 : 58} />
                      <CircularProgress current={dashboardTotals.protein} target={dashboardTargets.protein} label="Proteína" color="#06B6D4" size={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 80 : 58} />
                      <CircularProgress current={dashboardTotals.carbs} target={dashboardTargets.carbs} label="Carbos" color="#f59e0b" size={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 80 : 58} />
                      <CircularProgress current={dashboardTotals.fat} target={dashboardTargets.fat} label="Grasas" color="#ec4899" size={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 80 : 58} />
                      <CircularProgress current={dashboardTotals.fiber} target={dashboardTargets.fiber} label="Fibra" color="#8b5cf6" size={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 80 : 58} />
              </div>

                    <div className="space-y-2 pt-4 border-t border-gray-700/50">
                      <ProgressBar current={dashboardTotals.calories} target={dashboardTargets.calories} label="Calorías" unit="kcal" color="bg-blue-500" />
                      <ProgressBar current={dashboardTotals.protein} target={dashboardTargets.protein} label="Proteína" unit="g" color="bg-cyan-500" />
                <ProgressBar current={dashboardTotals.carbs} target={dashboardTargets.carbs} label="Carbos" unit="g" color="bg-amber-500" />
                <ProgressBar current={dashboardTotals.fat} target={dashboardTargets.fat} label="Grasas" unit="g" color="bg-pink-500" />
                <ProgressBar current={dashboardTotals.fiber} target={dashboardTargets.fiber} label="Fibra" unit="g" color="bg-purple-500" />
              </div>
            </div>

                  {/* Remaining Card */}
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-gray-700/50 shadow-xl shadow-black/20">
                    <h3 className="text-sm lg:text-base font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">🎯</span>
                      Te quedan
                    </h3>
                    <div className="grid grid-cols-5 gap-2 lg:gap-3">
                      {[
                        { val: dashboardTargets.calories - dashboardTotals.calories, label: 'kcal', color: '#3B82F6' },
                        { val: dashboardTargets.protein - dashboardTotals.protein, label: 'prot', color: '#06B6D4', suffix: 'g' },
                  { val: dashboardTargets.carbs - dashboardTotals.carbs, label: 'carbs', color: '#f59e0b', suffix: 'g' },
                  { val: dashboardTargets.fat - dashboardTotals.fat, label: 'fat', color: '#ec4899', suffix: 'g' },
                  { val: dashboardTargets.fiber - dashboardTotals.fiber, label: 'fibra', color: '#8b5cf6', suffix: 'g' }
                ].map((item, i) => (
                        <div key={i} className="text-center p-2 lg:p-3 bg-gray-700/40 rounded-xl hover:bg-gray-700/60 transition-colors">
                          <div className="text-base lg:text-xl font-bold" style={{ color: item.val < 0 ? '#f87171' : item.color }}>{item.val}{item.suffix || ''}</div>
                          <div className="text-xs lg:text-xs text-gray-400 mt-0.5">{item.label}</div>
                  </div>
                ))}
                    </div>
              </div>
                </div>

                {/* Right Column - Activity & Meals */}
                <div className="space-y-4 lg:space-y-5">
                  {/* Quick Access - Pasos & Oura */}
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <button onClick={() => setActiveTab('pasos')} className="group bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-4 lg:p-5 flex flex-col items-center gap-2 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                      <span className="text-2xl lg:text-3xl group-hover:scale-110 transition-transform">👟</span>
                      <span className="text-cyan-400 text-lg lg:text-xl font-bold">{getStepsForDate(dashboardDate).toLocaleString()}</span>
                      <span className="text-cyan-400/60 text-xs lg:text-sm">pasos hoy</span>
                    </button>
                    <button onClick={() => setActiveTab('oura')} className="group bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-4 lg:p-5 flex flex-col items-center gap-2 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                      <span className="text-2xl lg:text-3xl group-hover:scale-110 transition-transform">💍</span>
                      <span className="text-purple-400 text-lg lg:text-xl font-bold">Oura</span>
                      <span className="text-purple-400/60 text-xs lg:text-sm">biométricos</span>
                    </button>
                  </div>

                  {/* Water Card */}
                  <div className="bg-gradient-to-br from-cyan-500/10 to-gray-900/90 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-cyan-500/30 shadow-xl shadow-black/20">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
                        <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">💧</span>
                        Agua
                      </h3>
                      <span className="text-lg lg:text-xl font-bold text-cyan-400">{getTodayWater().glasses}/{WATER_GOAL_GLASSES}</span>
                    </div>

                    <div className="flex justify-center gap-1 lg:gap-1.5 mb-4">
                      {Array.from({ length: WATER_GOAL_GLASSES }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-5 h-7 lg:w-6 lg:h-8 rounded transition-all duration-300 ${
                            i < getTodayWater().glasses
                              ? 'bg-gradient-to-t from-cyan-500 to-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                              : 'bg-gray-700/60'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={removeWaterGlass}
                        disabled={getTodayWater().glasses <= 0}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gray-700/80 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xl transition-all"
                      >
                        −
                      </button>
                      <button
                        onClick={addWaterGlass}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 flex items-center justify-center text-xl font-bold text-white transition-all shadow-lg shadow-cyan-500/30"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-center text-xs lg:text-sm text-gray-400 mt-2">{getTodayWater().ml || 0} ml / {WATER_GOAL_GLASSES * 250} ml</p>
            </div>

            {/* Meals Summary */}
            {getFoodsForDate(dashboardDate).length > 0 && (
                    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-gray-700/50 shadow-xl shadow-black/20">
                      <h3 className="text-sm lg:text-base font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">🍽️</span>
                        Comidas de hoy
                      </h3>
                      <div className="space-y-2 max-h-48 lg:max-h-64 overflow-y-auto">
                  {getFoodsForDate(dashboardDate).map(food => (
                          <div key={food.id} className="flex justify-between items-center p-2 lg:p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors">
                      <div className="min-w-0 flex-1">
                              <span className="text-xs lg:text-xs text-blue-400 uppercase font-medium">{food.meal}</span>
                              <p className="text-sm lg:text-base text-gray-200 truncate">{food.name}</p>
                      </div>
                            <div className="flex gap-2 text-xs lg:text-sm flex-shrink-0 ml-3">
                              <span className="text-blue-400 font-medium">{food.calories} kcal</span>
                              <span className="text-cyan-400">{food.protein}p</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-3">
              <SimpleBarChart data={weeklyData} dataKey="calories" target={customTargets.calories} color="bg-blue-500" label="Calorías 7d" />
              <SimpleBarChart data={weeklyData} dataKey="protein" target={customTargets.protein} color="bg-blue-500" label="Proteína 7d" />
            </div>

            {/* Weekly Adherence */}
            <div className="grid grid-cols-2 gap-3">
              <AdherenceCard data={weekComparison.thisWeek} label="📊 ESTA SEMANA" />
              <AdherenceCard data={weekComparison.lastWeek} label="📊 SEMANA PASADA" />
            </div>

            {/* Week vs Week Comparison */}
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-blue-400">📈 ESTA SEMANA VS ANTERIOR</h3>
                <button
                  onClick={() => setShowWeeklyReport(true)}
                  className="text-xs text-blue-400 hover:text-cyan-400 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  📊 Ver Reporte
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-sm text-gray-400">Calorías/día</div>
                  <div className="text-lg font-bold text-white">{weekComparison.thisWeek.avgCals || '-'}</div>
                  <div className={`text-xs ${weekComparison.calsDiff < 0 ? 'text-blue-400' : weekComparison.calsDiff > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {weekComparison.calsDiff !== 0 && (weekComparison.calsDiff > 0 ? '+' : '')}{weekComparison.calsDiff || '='} vs anterior
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Proteína/día</div>
                  <div className="text-lg font-bold text-white">{weekComparison.thisWeek.avgProt || '-'}g</div>
                  <div className={`text-xs ${weekComparison.protDiff > 0 ? 'text-blue-400' : weekComparison.protDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {weekComparison.protDiff !== 0 && (weekComparison.protDiff > 0 ? '+' : '')}{weekComparison.protDiff || '='}g vs anterior
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Pasos/día</div>
                  <div className="text-lg font-bold text-white">{weekComparison.thisWeek.avgSteps?.toLocaleString() || '-'}</div>
                  <div className={`text-xs ${weekComparison.stepsDiff > 0 ? 'text-blue-400' : weekComparison.stepsDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {weekComparison.stepsDiff !== 0 && (weekComparison.stepsDiff > 0 ? '+' : '')}{weekComparison.stepsDiff?.toLocaleString() || '='} vs anterior
                  </div>
                </div>
              </div>
            </div>

            {/* Weight Projection */}
            {weightProjection && (
              <div className="bg-gray-800 rounded-lg p-3 border border-amber-500/30">
                <h3 className="text-xs font-bold text-amber-400 mb-2">🎯 PROYECCIÓN</h3>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="text-center p-2 bg-gray-700/50 rounded">
                    <div className="text-lg font-bold text-white">{weightProjection.weeklyRate > 0 ? '-' : '+'}{Math.abs(weightProjection.weeklyRate)} kg/sem</div>
                    <div className="text-xs text-gray-400">Ritmo actual</div>
                  </div>
                  <div className="text-center p-2 bg-gray-700/50 rounded">
                    <div className="text-lg font-bold text-blue-400">
                      {weightProjection.weeksToGoal ? `~${weightProjection.weeksToGoal} sem` : '-'}
                    </div>
                    <div className="text-xs text-gray-400">Para objetivo</div>
                  </div>
                </div>
                {weightProjection.goalDate && (
                  <p className="text-xs text-gray-400 text-center">Fecha estimada: <span className="text-blue-400">{weightProjection.goalDate}</span></p>
                )}
                {weightProjection.recommendation && (
                  <div className={`mt-2 p-2 rounded text-xs ${weightProjection.recommendation.type === 'good' ? 'bg-blue-900/30 text-blue-400' :
                    weightProjection.recommendation.type === 'decrease' ? 'bg-amber-900/30 text-amber-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                    💡 {weightProjection.recommendation.text}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">Basado en {weightProjection.dataPoints} registros ({weightProjection.daysCovered} días)</p>
              </div>
            )}
          </div>
        )}

        {/* Comidas Tab - uses selectedFoodDate */}
        {activeTab === 'comidas' && (
          <div className="space-y-3">
            {/* Date selector - compact */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedFoodDate}
                onChange={(e) => setSelectedFoodDate(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2.5 text-base flex-1 min-w-0"
              />
            </div>

            {/* Swipe hint */}
            {getFoodsForDate(selectedFoodDate).length > 0 && (
              <p className="text-xs text-gray-500 text-center">← Desliza para eliminar</p>
            )}

            {getFoodsForDate(selectedFoodDate).length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                <p className="text-gray-400 text-base">Sin comidas registradas.</p>
                <p className="text-sm text-blue-400 mt-2">Usá el botón + abajo a la derecha</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getFoodsForDate(selectedFoodDate).map(entry => {
                  const needsReview = !entry.reviewed || (entry.confidence && entry.confidence < 0.7);
                  // Format time to HH:MM (remove seconds if present)
                  const displayTime = entry.time ? entry.time.substring(0, 5) : '';
                  return (
                    <SwipeableItem
                      key={entry.id}
                      onDelete={() => confirmDelete('food', entry.id, entry.name)}
                    >
                      <div className={`p-3 border-l-4 ${needsReview ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-blue-400 uppercase font-medium">{entry.meal}</span>
                              {displayTime && <span className="text-xs text-gray-500">{displayTime}</span>}
                            {needsReview && (
                                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">⚠️</span>
                            )}
                          </div>
                            <h3 className="font-medium text-base truncate">{entry.name}</h3>
                        </div>
                          {needsReview && (
                            <button onClick={() => confirmFood(entry.id)} className="text-blue-400 active:text-cyan-300 px-2 py-1 text-sm font-medium bg-blue-500/20 rounded ml-2 flex-shrink-0">✓</button>
                          )}
                        </div>
                        {entry.description && <p className="text-xs text-gray-400 mb-1.5 truncate-2">{entry.description}</p>}
                        <div className="flex justify-between items-center">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="text-blue-400 font-medium">{entry.calories}kcal</span>
                            <span className="text-blue-400">{entry.protein}P</span>
                            <span className="text-amber-400">{entry.carbs}C</span>
                            <span className="text-pink-400">{entry.fat}F</span>
                            {entry.fiber > 0 && <span className="text-purple-400">{entry.fiber}Fib</span>}
                      </div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setNewFood({
                                  ...entry,
                                  time: displayTime,
                                  calories: entry.calories.toString(),
                                  protein: entry.protein.toString(),
                                  carbs: entry.carbs.toString(),
                                  fat: entry.fat.toString(),
                                  fiber: entry.fiber?.toString() || '0'
                                });
                                setEditingFoodId(entry.id);
                                setShowFoodForm(true);
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => confirmDelete('food', entry.id, entry.name)}
                              className="text-red-400 hover:text-red-300 text-sm px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                            <button
                              onClick={() => saveAsTemplate(entry)}
                              className="text-purple-400 hover:text-purple-300 text-sm px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 rounded transition-colors"
                              title="Guardar como favorito"
                            >
                              ⭐
                            </button>
                      </div>
                    </div>
                      </div>
                    </SwipeableItem>
                  );
                })}
              </div>
            )}

            {getFoodsForDate(selectedFoodDate).length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-sm font-bold text-blue-400 mb-3">TOTAL DEL DÍA</h3>
                {(() => {
                  const t = getTotalsForDate(selectedFoodDate);
                  return (
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div><span className="text-base font-bold text-blue-400">{t.calories}</span><br /><span className="text-xs text-gray-400">kcal</span></div>
                      <div><span className="text-base font-bold text-blue-400">{t.protein}g</span><br /><span className="text-xs text-gray-400">prot</span></div>
                      <div><span className="text-base font-bold text-amber-400">{t.carbs}g</span><br /><span className="text-xs text-gray-400">carbs</span></div>
                      <div><span className="text-base font-bold text-pink-400">{t.fat}g</span><br /><span className="text-xs text-gray-400">fat</span></div>
                      <div><span className="text-base font-bold text-purple-400">{t.fiber}g</span><br /><span className="text-xs text-gray-400">fibra</span></div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Entrenos Tab - uses selectedWorkoutDate */}
        {activeTab === 'entrenos' && (
          <div className="space-y-3">
            {/* Weekly Analysis */}
            <div className="bg-gray-800 rounded-lg p-3 border border-blue-500/30">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs font-bold text-blue-400">📊 SEMANA</h2>
                <span className="text-xs text-gray-500">desde {workoutAnalysis.weekStart}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center p-2 bg-gray-700/50 rounded">
                  <div className="text-lg font-bold text-amber-400">{workoutAnalysis.gymCount}</div>
                  <div className="text-xs text-gray-400">Gym</div>
                </div>
                <div className="text-center p-2 bg-gray-700/50 rounded">
                  <div className="text-lg font-bold text-green-400">{workoutAnalysis.tennisCount}</div>
                  <div className="text-xs text-gray-400">Tenis</div>
                </div>
                <div className="text-center p-2 bg-gray-700/50 rounded">
                  <div className="text-lg font-bold text-cyan-400">{workoutAnalysis.totalDuration}'</div>
                  <div className="text-xs text-gray-400">Min</div>
                </div>
              </div>
              <div className="space-y-0.5">
                {workoutAnalysis.analysis.map((line, i) => <p key={i} className="text-xs text-gray-300">{line}</p>)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedWorkoutDate}
                onChange={(e) => setSelectedWorkoutDate(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2.5 text-base min-w-0"
              />
            </div>

            {/* Swipe hint */}
            {getWorkoutsForDate(selectedWorkoutDate).length > 0 && (
              <p className="text-xs text-gray-500 text-center">← Desliza para eliminar</p>
            )}

            {getWorkoutsForDate(selectedWorkoutDate).length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                <p className="text-gray-400 text-base">Sin entrenos para esta fecha.</p>
                <p className="text-sm text-amber-400 mt-2">Usá el botón + abajo a la derecha</p>
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
                      <div className={`p-3 border-l-4 ${workout.type === 'gym' ? 'border-l-amber-500' : 'border-l-green-500'}`}>
                      <div className="flex justify-between items-start mb-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs uppercase font-medium ${workout.type === 'gym' ? 'text-amber-400' : 'text-green-400'}`}>{workout.type}</span>
                            {needsReview && (
                                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">⚠️</span>
                            )}
                          </div>
                            <h3 className="font-medium text-base truncate">{workout.name}</h3>
                        </div>
                          {needsReview && (
                            <button onClick={() => confirmWorkout(workout.id)} className="text-blue-400 active:text-cyan-300 px-2 py-1 text-sm font-medium bg-blue-500/20 rounded ml-2 flex-shrink-0">✓</button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2">
                        {workout.duration && <span>⏱️ {workout.duration}'</span>}
                          {workout.volume && <span>📊 {workout.volume.toLocaleString()}kg</span>}
                        {workout.calories && <span>🔥 {workout.calories}</span>}
                      </div>
                      {workout.exercises?.length > 0 && (
                          <div className="space-y-0.5 border-t border-gray-700 pt-2 max-h-32 overflow-y-auto">
                          {workout.exercises.map((ex, idx) => (
                              <div key={idx} className="text-xs text-gray-300 flex justify-between">
                                <span className="truncate flex-1 min-w-0">{ex.name}</span>
                                <span className="text-gray-500 ml-2 flex-shrink-0">{ex.sets}x{ex.reps}@{ex.weight}kg</span>
                            </div>
                          ))}
                        </div>
                      )}
                        {workout.notes && <p className="text-xs text-blue-400 mt-1.5 italic truncate">{workout.notes}</p>}
                    </div>
                    </SwipeableItem>
                  );
                })}
              </div>
            )}

            {/* Schedule */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-bold text-gray-400 mb-2">SCHEDULE</h3>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                  <div key={day} className={`p-1.5 rounded text-xs ${[0, 3, 5].includes(i) ? 'bg-amber-500/20 text-amber-400' : i === 2 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'}`}>
                    <div className="font-bold">{day}</div>
                    <div className="text-xs">{[0, 3, 5].includes(i) ? 'GYM' : i === 2 ? 'TEN' : '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Peso Tab */}
        {activeTab === 'peso' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-bold text-blue-400 mb-2">⚖️ NUEVO PESO</h2>
              <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                  <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="84.5" className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2.5 text-lg min-w-0" />
                  <span className="flex items-center text-gray-400 text-sm">kg</span>
                </div>
                <div className="flex gap-2">
                  <input type="time" value={newWeightTime} onChange={(e) => setNewWeightTime(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2.5 text-sm min-w-0" />
                  <button onClick={addWeightEntry} disabled={!newWeight} className="bg-blue-600 active:bg-blue-500 disabled:opacity-50 px-5 py-2.5 rounded font-bold text-sm flex-shrink-0">Guardar</button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-base font-bold text-blue-400 mb-3">📍 PROGRESO</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-700/50 rounded">
                  <div className="text-xl font-bold text-white">{profile.currentWeight}</div>
                  <div className="text-xs text-gray-400">actual</div>
                </div>
                <div className="p-2 bg-gray-700/50 rounded">
                  <div className="text-xl font-bold text-blue-400">{profile.targetWeight}</div>
                  <div className="text-xs text-gray-400">objetivo</div>
                </div>
                <div className="p-2 bg-gray-700/50 rounded">
                  <div className="text-xl font-bold text-amber-400">{(profile.currentWeight - profile.targetWeight).toFixed(1)}</div>
                  <div className="text-xs text-gray-400">faltan</div>
                </div>
              </div>
            </div>

            {/* Weight Chart with 7-day moving average */}
            {getWeightChartData.length > 1 && (
              <WeightLineChart data={getWeightChartData} />
            )}

            {/* Projection */}
            {weightProjection && (
              <div className="bg-gray-800 rounded-lg p-4 border border-amber-500/30">
                <h2 className="text-sm font-bold text-amber-400 mb-3">🎯 PROYECCIÓN</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-3 bg-gray-700/50 rounded">
                    <div className="text-xl font-bold text-white">
                      {weightProjection.weeklyRate > 0 ? '-' : '+'}{Math.abs(weightProjection.weeklyRate)} kg
                    </div>
                    <div className="text-xs text-gray-400">por semana</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded">
                    <div className="text-xl font-bold text-blue-400">
                      {weightProjection.weeksToGoal ? `${weightProjection.weeksToGoal} sem` : '-'}
                    </div>
                    <div className="text-xs text-gray-400">para llegar a {profile.targetWeight}kg</div>
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
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-base font-bold text-blue-400 mb-3">📉 HISTORIAL</h2>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {weightHistory.map((entry, idx) => (
                    <div key={entry.id} className="flex items-center justify-between py-2.5 border-b border-gray-700 text-base">
                      <div className="flex flex-col">
                        <span className="text-gray-300">{entry.date}</span>
                        {entry.timestamp && <span className="text-sm text-gray-500">{formatTime(entry.timestamp)}</span>}
                      </div>
                      {editingWeightId === entry.id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" step="0.1" value={editingWeightValue} onChange={(e) => setEditingWeightValue(e.target.value)} className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-base" />
                          <button onClick={saveEditWeight} className="text-blue-400 px-2 text-lg">✓</button>
                          <button onClick={cancelEditWeight} className="text-gray-400 px-2 text-lg">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{entry.weight} kg</span>
                          {idx < weightHistory.length - 1 && (
                            <span className={`text-sm ${entry.weight < weightHistory[idx + 1].weight ? 'text-blue-400' : entry.weight > weightHistory[idx + 1].weight ? 'text-red-400' : 'text-gray-400'}`}>
                              {entry.weight < weightHistory[idx + 1].weight ? '↓' : entry.weight > weightHistory[idx + 1].weight ? '↑' : '='}{Math.abs(entry.weight - weightHistory[idx + 1].weight).toFixed(1)}
                            </span>
                          )}
                          <button onClick={() => startEditWeight(entry.id)} className="text-blue-400 px-1 text-lg">✎</button>
                          <button onClick={() => confirmDelete('weight', entry.id, `${entry.weight} kg (${entry.date})`)} className="text-red-400 px-1 text-lg">✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pasos Tab */}
        {activeTab === 'pasos' && (
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-bold text-blue-400 mb-3">👟 REGISTRAR PASOS</h2>
              <input type="date" value={stepsDate} onChange={(e) => setStepsDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm mb-2" />
              <div className="flex gap-2">
                <input type="number" value={newSteps} onChange={(e) => setNewSteps(e.target.value)} placeholder="ej: 8500" className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-3 text-lg" />
                <button onClick={addStepsEntry} className="bg-cyan-600 active:bg-cyan-500 px-6 py-3 rounded font-bold">OK</button>
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
              <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h2 className="text-sm font-bold text-purple-400 mb-2">💍 REGISTRAR DATOS OURA</h2>
              <div className="space-y-2">
                <input type="date" value={newOuraEntry.date} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, date: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />

                {/* Scores - 2 cols on mobile, 3 on larger */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Sleep</label>
                    <input type="number" value={newOuraEntry.sleepScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, sleepScore: e.target.value })} placeholder="85" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Ready</label>
                    <input type="number" value={newOuraEntry.readinessScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, readinessScore: e.target.value })} placeholder="80" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Activity</label>
                    <input type="number" value={newOuraEntry.activityScore} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, activityScore: e.target.value })} placeholder="75" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">HRV</label>
                    <input type="number" value={newOuraEntry.hrv} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, hrv: e.target.value })} placeholder="45" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">RHR</label>
                    <input type="number" value={newOuraEntry.restingHr} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, restingHr: e.target.value })} placeholder="58" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Horas</label>
                    <input type="number" step="0.1" value={newOuraEntry.sleepHours} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, sleepHours: e.target.value })} placeholder="7.5" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                </div>

                {/* Sleep details - compact 2x2 grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Deep</label>
                    <input type="number" value={newOuraEntry.deepSleepMins} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, deepSleepMins: e.target.value })} placeholder="90" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">REM</label>
                    <input type="number" value={newOuraEntry.remSleepMins} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, remSleepMins: e.target.value })} placeholder="100" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Acostarse</label>
                    <input type="time" value={newOuraEntry.bedtime} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, bedtime: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Despertar</label>
                    <input type="time" value={newOuraEntry.wakeTime} onChange={(e) => setNewOuraEntry({ ...newOuraEntry, wakeTime: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                  </div>
                </div>

                <button onClick={addOuraEntry} className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded font-bold text-sm">Guardar</button>
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
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h2 className="text-sm font-bold text-blue-400 mb-3">👤 PERFIL</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Peso Actual</label>
                  <input type="number" step="0.1" value={profile.currentWeight} onChange={(e) => updateConfig({ ...profile, currentWeight: parseFloat(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Peso Objetivo</label>
                  <input type="number" step="0.1" value={profile.targetWeight} onChange={(e) => updateConfig({ ...profile, targetWeight: parseFloat(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Altura (cm)</label>
                  <input type="number" value={profile.height} onChange={(e) => updateConfig({ ...profile, height: parseInt(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Edad</label>
                  <input type="number" value={profile.age} onChange={(e) => updateConfig({ ...profile, age: parseInt(e.target.value) || 0 }, customTargets)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 border border-blue-500/30">
              <h2 className="text-sm font-bold text-blue-400 mb-3">🎯 OBJETIVOS (Rest Day)</h2>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Calorías</label>
                  <input type="number" value={customTargets.calories} onChange={(e) => updateConfig(profile, { ...customTargets, calories: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Prot (g)</label>
                  <input type="number" value={customTargets.protein} onChange={(e) => updateConfig(profile, { ...customTargets, protein: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Carbs (g)</label>
                  <input type="number" value={customTargets.carbs} onChange={(e) => updateConfig(profile, { ...customTargets, carbs: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Grasas (g)</label>
                  <input type="number" value={customTargets.fat} onChange={(e) => updateConfig(profile, { ...customTargets, fat: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fibra (g)</label>
                  <input type="number" value={customTargets.fiber} onChange={(e) => updateConfig(profile, { ...customTargets, fiber: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 border border-amber-500/30">
              <h2 className="text-sm font-bold text-amber-400 mb-3">🏋️ TRAINING DAY</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Kcal extra</label>
                  <input type="number" value={customTargets.trainingDayCaloriesBonus} onChange={(e) => updateConfig(profile, { ...customTargets, trainingDayCaloriesBonus: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Carbs (g)</label>
                  <input type="number" value={customTargets.trainingDayCarbs} onChange={(e) => updateConfig(profile, { ...customTargets, trainingDayCarbs: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-sm" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Training day: {customTargets.calories + customTargets.trainingDayCaloriesBonus} kcal, {customTargets.trainingDayCarbs}g carbs</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2.5">
              <p className="text-xs text-blue-400">💾 Auto-save (800ms)</p>
            </div>

            {/* Export buttons - compact grid */}
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h2 className="text-sm font-bold text-gray-300 mb-3">📤 EXPORTAR</h2>
              <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportForClaude}
                  className="bg-cyan-600 active:bg-cyan-500 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-1"
              >
                  🤖 Claude
              </button>
              <button
                onClick={exportForNutritionist}
                  className="bg-pink-600 active:bg-pink-500 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-1"
              >
                  🩺 Nutri
              </button>
                <button
                  onClick={exportBackup}
                  className="bg-amber-600 active:bg-amber-500 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-1"
                >
                  📤 Backup
                </button>
                <label className="bg-gray-700 active:bg-gray-600 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-1 cursor-pointer">
                  📥 Importar
                  <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                </label>
              </div>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                <div className="p-1.5 bg-gray-700/50 rounded">
                  <div className="text-sm font-bold text-white">{weightHistory.length}</div>
                  <div className="text-xs text-gray-500">Peso</div>
                  </div>
                <div className="p-1.5 bg-gray-700/50 rounded">
                  <div className="text-sm font-bold text-white">{foodLog.length}</div>
                  <div className="text-xs text-gray-500">Comidas</div>
                  </div>
                <div className="p-1.5 bg-gray-700/50 rounded">
                  <div className="text-sm font-bold text-white">{workoutLog.length}</div>
                  <div className="text-xs text-gray-500">Entrenos</div>
                  </div>
                <div className="p-1.5 bg-gray-700/50 rounded">
                  <div className="text-sm font-bold text-white">{stepsLog.length}</div>
                  <div className="text-xs text-gray-500">Pasos</div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2 text-center">⚠️ Importar reemplaza TODOS los datos</p>
            </div>
          </div>
        )}
      </main>
      </PullToRefresh>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

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
    </div>
  );
};

export default NutritionTracker;

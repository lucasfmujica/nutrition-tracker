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
import { ModalsManager } from './components/layout/Modals/ModalsManager';
import { LoadingScreen } from './components/layout/Shell/LoadingScreen';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PullToRefresh } from './components/PullToRefresh';
import { UndoToast } from './components/shared/UndoToast';
import { SwipeableItem } from './components/SwipeableItem';
import { ConfigTab } from './components/Tabs/ConfigTab';
import { DashboardTab } from './components/Tabs/DashboardTab';
import { DiaryTab } from './components/Tabs/DiaryTab';
import { OuraTab } from './components/Tabs/OuraTab';
import { StepsTab } from './components/Tabs/StepsTab';
import { WeightTab } from './components/Tabs/WeightTab';
import { WorkoutsTab } from './components/Tabs/WorkoutsTab';
import { CircularProgress } from './components/UI/CircularProgress';
import { MiniBar } from './components/UI/MiniBar';
import { ProgressBar } from './components/UI/ProgressBar';

import { useAnalytics } from './hooks/useAnalytics';
import { useDataOperations } from './hooks/useDataOperations';
import { useExport } from './hooks/useExport';
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
    addWeightEntry,
    confirmDelete,
    executeDelete,
    startEditWeight,
    saveEditWeight,
    cancelEditWeight,
    addStepsEntry,
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
  } = useTrackerData();

  const {
    upsertFood,
    upsertWorkout,
    confirmFood,
    confirmWorkout,
    copyMealsFromYesterday,
    handleImportFood,
    handleImportWorkout
  } = useDataOperations({
    foodLog, saveFoodLog,
    workoutLog, saveWorkoutLog,
    saveFoodEntry, saveWorkoutEntry,
    supabase, useCloud,
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    importText, setImportText,
    importError, setImportError,
    setSaveStatus,
    dashboardDate
  });

  const {
    getWeightChartData,
    getWeeklyAdherence,
    getWeeklyWorkoutAnalysis,
    getWeeklyData
  } = useAnalytics({
    weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    customTargets,
    getTotalsForDate,
    getTargetsForDate
  });

  const {
    exportBackup,
    importBackup,
    exportForNutritionist,
    exportForClaude
  } = useExport({
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


  // Re-implement derived state for workout analysis
  const workoutAnalysis = useMemo(() => {
    const today = getArgentinaDateString();
    const monday = getMondayOfWeek(today);
    const sunday = addDaysToDate(monday, 6);

    // Filter workouts for current week
    const currentWeekWorkouts = workoutLog.filter(w => w.date >= monday && w.date <= sunday);

    const gymCount = currentWeekWorkouts.filter(w => w.type === 'gym').length;
    const tennisCount = currentWeekWorkouts.filter(w => w.type === 'tennis').length;
    const totalDuration = currentWeekWorkouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);

    // Simple analysis strings
    const analysis = [];
    if (gymCount >= 3) analysis.push('¡Excelente constancia en el gimnasio!');
    if (tennisCount >= 2) analysis.push('Buen volumen de tenis esta semana.');
    if (totalDuration > 300) analysis.push('Alta intensidad semanal 🔥');
    if (analysis.length === 0 && currentWeekWorkouts.length > 0) analysis.push('¡Sigue sumando movimiento!');
    if (currentWeekWorkouts.length === 0) analysis.push('Sin actividad registrada esta semana.');

    // Format week start date
    const weekStartDate = new Date(monday + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

    return {
      weekStart: weekStartDate,
      gymCount,
      tennisCount,
      totalDuration,
      analysis
    };
  }, [workoutLog]);

  const weightProjection = null; // To be implemented or restored if found
















  // Format timestamp to time string
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
  };

  // Navigation helpers - use Argentina timezone
  const changeDate = (dateStr, delta) => addDaysToDate(dateStr, delta);




  // UI components imported from ./components/UI/



  // Charts/UI components imported from ./components/Charts/ and ./components/Dashboard/


  // Get data for date
  const getFoodsForDate = (date) => foodLog.filter(entry => entry.date === date);
  const getWorkoutsForDate = (date) => workoutLog.filter(entry => entry.date === date);
  const getStepsForDate = (date) => stepsLog.find(s => s.date === date)?.steps || 0;




  // SimpleBarChart imported from ./components/Charts/




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
    return <LoadingScreen message="Cargando LukenFit..." />;
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
    return <LoadingScreen message="Cargando datos..." />;
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

      {/* Modals Manager - Handles all modal dialogs */}
      <ModalsManager
        deleteModal={deleteModal}
        setDeleteModal={setDeleteModal}
        executeDelete={executeDelete}
        showMigrationModal={showMigrationModal}
        setShowMigrationModal={setShowMigrationModal}
        migrationData={migrationData}
        setMigrationData={setMigrationData}
        handleMigration={handleMigration}
        isMigrating={isMigrating}
        showFoodForm={showFoodForm}
        setShowFoodForm={setShowFoodForm}
        newFood={newFood}
        setNewFood={setNewFood}
        editingFoodId={editingFoodId}
        setEditingFoodId={setEditingFoodId}
        addManualFood={addManualFood}
        showWorkoutForm={showWorkoutForm}
        setShowWorkoutForm={setShowWorkoutForm}
        newWorkout={newWorkout}
        setNewWorkout={setNewWorkout}
        addManualWorkout={addManualWorkout}
        showImportFoodModal={showImportFoodModal}
        setShowImportFoodModal={setShowImportFoodModal}
        showImportWorkoutModal={showImportWorkoutModal}
        setShowImportWorkoutModal={setShowImportWorkoutModal}
        importText={importText}
        setImportText={setImportText}
        importError={importError}
        setImportError={setImportError}
        handleImportFood={handleImportFood}
        handleImportWorkout={handleImportWorkout}
        showTemplatesModal={showTemplatesModal}
        setShowTemplatesModal={setShowTemplatesModal}
        mealTemplates={mealTemplates}
        addFromTemplate={addFromTemplate}
        deleteTemplate={deleteTemplate}
        showSaveTemplateModal={showSaveTemplateModal}
        setShowSaveTemplateModal={setShowSaveTemplateModal}
        templateToSave={templateToSave}
        setTemplateToSave={setTemplateToSave}
        confirmSaveTemplate={confirmSaveTemplate}
        showWeeklyReport={showWeeklyReport}
        setShowWeeklyReport={setShowWeeklyReport}
        foodLog={foodLog}
        workoutLog={workoutLog}
        weightHistory={weightHistory}
        stepsLog={stepsLog}
        customTargets={customTargets}
      />

      {/* Undo Toast - positioned above bottom nav */}
      {/* Undo Toast - positioned above bottom nav */}
      <UndoToast undoAction={undoAction} setUndoAction={setUndoAction} />

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
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            dashboardDate={dashboardDate}
            setDashboardDate={setDashboardDate}
            changeDate={changeDate}
            dashboardTotals={dashboardTotals}
            dashboardTargets={dashboardTargets}
            getStepsForDate={getStepsForDate}
            getTodayWater={getTodayWater}
            addWaterGlass={addWaterGlass}
            WATER_GOAL_GLASSES={WATER_GOAL_GLASSES}
            workoutAnalysis={workoutAnalysis}
            weightHistory={weightHistory}
            getMostRecentWeight={getMostRecentWeight}
            profile={profile}
            weightProjection={weightProjection}
          />
        )}

        {/* Comidas Tab - uses selectedFoodDate */}

        {activeTab === 'comidas' && (
          <DiaryTab
            selectedFoodDate={selectedFoodDate}
            setSelectedFoodDate={setSelectedFoodDate}
            changeDate={changeDate}
            getFoodsForDate={getFoodsForDate}
            getTotalsForDate={getTotalsForDate}
            getTargetsForDate={getTargetsForDate}
            confirmDelete={confirmDelete}
            newFood={newFood}
            setNewFood={setNewFood}
            setShowFoodForm={setShowFoodForm}
            setEditingFoodId={setEditingFoodId}
          />
        )}


        {/* Entrenos Tab */}
        {activeTab === 'entrenos' && (
          <WorkoutsTab
            selectedWorkoutDate={selectedWorkoutDate}
            setSelectedWorkoutDate={setSelectedWorkoutDate}
            changeDate={changeDate}
            workoutAnalysis={workoutAnalysis}
            getWorkoutsForDate={getWorkoutsForDate}
            confirmDelete={confirmDelete}
            confirmWorkout={confirmWorkout}
          />
        )}

        {/* Peso Tab */}


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
            weeklyData={getWeeklyData}
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

        {/* Config Tab */}
        {activeTab === 'config' && (
          <ConfigTab
            profile={profile}
            customTargets={customTargets}
            updateConfig={updateConfig}
            weightHistory={weightHistory}
            foodLog={foodLog}
            workoutLog={workoutLog}
            stepsLog={stepsLog}
            exportForClaude={exportForClaude}
            exportForNutritionist={exportForNutritionist}
            exportBackup={exportBackup}
            importBackup={importBackup}
          />
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

    </Layout>
  );
};

export default NutritionTracker;

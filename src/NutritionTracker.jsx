import { useEffect, useRef } from 'react';
import { AuthUI } from './components/AuthUI';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Layout } from './components/Layout';
import { TrackerHeader } from './components/layout/Header/TrackerHeader';
import { ModalsManager } from './components/layout/Modals/ModalsManager';
import { LoadingScreen } from './components/layout/Shell/LoadingScreen';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PullToRefresh } from './components/PullToRefresh';
import { UndoToast } from './components/shared/UndoToast';
import { ConfigTab } from './components/Tabs/ConfigTab';
import { DashboardTab } from './components/Tabs/DashboardTab';
import { DiaryTab } from './components/Tabs/DiaryTab';
import { OuraTab } from './components/Tabs/OuraTab';
import { StepsTab } from './components/Tabs/StepsTab';
import { WeightTab } from './components/Tabs/WeightTab';
import { WorkoutsTab } from './components/Tabs/WorkoutsTab';
import { TrackerProvider, useTracker } from './context/TrackerContext';

const WATER_GOAL_GLASSES = 8;

const NutritionTrackerContent = () => {
  const {
    supabase,
    showAuth, setShowAuth,
    showOnboarding, setShowOnboarding,
    offlineMode, setOfflineMode,
    isLoading,
    saveStatus,
    profile, setConfig,
    activeTab, setActiveTab,
    dashboardDate, setDashboardDate,
    changeDate,
    getTotalsForDate,
    getTargetsForDate,
    getMostRecentWeight,
    weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    ouraLog,
    customTargets,
    undoAction, setUndoAction,
    isRefreshing,
    handleRefresh,
    forceSyncToCloud,
    handleLogout,
    showFab,
    // Modals visibility to control FAB
    showFoodForm, setShowFoodForm,
    showWorkoutForm, setShowWorkoutForm,
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    showTemplatesModal, setShowTemplatesModal,
    newFood, setNewFood,
    newWorkout, setNewWorkout,
    updateConfig,
    exportForClaude,
    exportForNutritionist,
    exportBackup,
    importBackup,

    // Tab props
    selectedFoodDate, setSelectedFoodDate,
    getFoodsForDate,
    confirmDelete,
    setEditingFoodId,

    selectedWorkoutDate, setSelectedWorkoutDate,
    workoutAnalysis,
    getWorkoutsForDate,
    confirmWorkout,


    getWeightChartData,
    editingWeightId, setEditingWeightId,
    editingWeightValue, setEditingWeightValue,
    startEditWeight, saveEditWeight, cancelEditWeight,

    stepsDate, setStepsDate,
    newSteps, setNewSteps,
    addStepsEntry,
    getWeeklyData,
    getStepsForDate,

    newOuraEntry, setNewOuraEntry,
    addOuraEntry,

    getTodayWater, addWaterGlass,
    weightProjection,
    formatTime,
    isTrainingDay
  } = useTracker();

  // Safety timeout: never stay in loading state for more than 8 seconds
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

      if (currentShowAuth === null) {
        if (currentIsAuthenticated) {
          console.log('[App] Safety timeout: User authenticated, hiding auth screen');
          setShowAuth(false);
        } else {
          console.warn('[App] Safety timeout: Not authenticated, showing auth screen');
          setShowAuth(true);
        }
      }
    }, 8000);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading while checking auth status (max 5 seconds)
  if (showAuth === null && supabase.loading) {
    return <LoadingScreen message="Cargando LukenFit..." />;
  }

  // Show Auth UI if not authenticated and not in offline mode
  if (showAuth === true && !offlineMode) {
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

  if (showAuth === null || (isLoading && showAuth === false)) {
    return <LoadingScreen message="Cargando datos..." />;
  }

  // Derived state for Dashboard
  const dashboardTotals = getTotalsForDate(dashboardDate);
  const dashboardTargets = getTargetsForDate(dashboardDate);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} showNav={!showOnboarding}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* Modals Manager - Handles all modal dialogs. Internal refactor of ModalsManager to use context is next. */}
      {/* For now, it will look weird as we haven't updated ModalsManager yet, but we will in the next step. */}
      {/* Actually we should remove props here assuming ModalsManager will use context.
          Step Id: 8 in plan says "Refactor Sub-components", but we need the app to run.
          If I remove props here before updating ModalsManager, it will break.
          So we will update ModalsManager IMMEDIATELY after this. */}
      <ModalsManager />

      <UndoToast undoAction={undoAction} setUndoAction={setUndoAction} />

      <TrackerHeader />

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

      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
        <main className="p-4 lg:p-6 xl:p-8 pb-32 md:pb-36 w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
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

        {activeTab === 'peso' && (
            <WeightTab
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

        {activeTab === 'oura' && (
          <OuraTab
            newOuraEntry={newOuraEntry}
            setNewOuraEntry={setNewOuraEntry}
            addOuraEntry={addOuraEntry}
            ouraLog={ouraLog}
          />
        )}

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
    </Layout>
  );
};

const NutritionTracker = () => {
  return (
    <TrackerProvider>
      <NutritionTrackerContent />
    </TrackerProvider>
  );
};

export default NutritionTracker;

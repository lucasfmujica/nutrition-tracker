import { useEffect, useRef } from 'react';
import { TrackerFAB } from './components/layout/FAB/TrackerFAB';
import { TrackerHeader } from './components/layout/Header/TrackerHeader';
import { ModalsManager } from './components/layout/Modals/ModalsManager';
import { TrackerNavigation } from './components/layout/Navigation/TrackerNavigation';
import { AuthShell } from './components/layout/Shell/AuthShell';
import { Layout } from './components/layout/Shell/Layout';
import { UndoToast } from './components/shared/UndoToast';
import { ConfigTab } from './components/Tabs/ConfigTab';
import { DashboardTab } from './components/Tabs/DashboardTab';
import { DiaryTab } from './components/Tabs/DiaryTab';
import { OuraTab } from './components/Tabs/OuraTab';
import { StepsTab } from './components/Tabs/StepsTab';
import { WeightTab } from './components/Tabs/WeightTab';
import { WorkoutsTab } from './components/Tabs/WorkoutsTab';
import { PullToRefresh } from './components/UI/PullToRefresh';
import { TrackerProvider, useTracker } from './context/TrackerContext';

const WATER_GOAL_GLASSES = 8;

const NutritionTrackerContent = () => {
  const {
    supabase,
    showAuth, setShowAuth,
    showOnboarding,
    activeTab, setActiveTab,
    profile,
    // Data for Tabs
    dashboardDate, setDashboardDate, changeDate, getTotalsForDate, getTargetsForDate,
    getMostRecentWeight, weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    ouraLog,
    customTargets, updateConfig,
    // Intelligence Engine
    weightAnalytics,
    // Actions
    undoAction, setUndoAction,
    isRefreshing, handleRefresh,
    exportForClaude, exportForNutritionist, exportBackup, importBackup,
    // Tab Specific Props
    selectedFoodDate, setSelectedFoodDate, getFoodsForDate, confirmDelete, setEditingFoodId, setNewFood, setShowFoodForm,
    selectedWorkoutDate, setSelectedWorkoutDate, workoutAnalysis, getWorkoutsForDate, confirmWorkout,
    getWeightChartData, editingWeightId, setEditingWeightId, editingWeightValue, setEditingWeightValue,
    startEditWeight, saveEditWeight, cancelEditWeight,
    stepsDate, setStepsDate, newSteps, setNewSteps, addStepsEntry, getWeeklyData, getStepsForDate,
    getTodayWater, addWaterGlass, weightProjection, formatTime
  } = useTracker();

  // Safety timeout: never stay in loading state for more than 8 seconds
  // This logic is mostly visual now as AuthShell handles the actual rendering,
  // but we keep this effect to ensure state eventually corrects itself.
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
  }, []);

  // Derived state for Dashboard
  const dashboardTotals = getTotalsForDate(dashboardDate);
  const dashboardTargets = getTargetsForDate(dashboardDate);

  return (
    <AuthShell>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} showNav={!showOnboarding}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
          .scrollbar-hide::-webkit-scrollbar{display:none}
          .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        `}</style>

        <ModalsManager />
        <UndoToast undoAction={undoAction} setUndoAction={setUndoAction} />
        <TrackerHeader />
        <TrackerNavigation />

        <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
          <main className="p-4 lg:p-6 xl:p-8 pb-32 md:pb-36 w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardTab
                dashboardDate={dashboardDate} setDashboardDate={setDashboardDate} changeDate={changeDate}
                dashboardTotals={dashboardTotals} dashboardTargets={dashboardTargets}
                getStepsForDate={getStepsForDate} getTodayWater={getTodayWater} addWaterGlass={addWaterGlass}
                WATER_GOAL_GLASSES={WATER_GOAL_GLASSES} workoutAnalysis={workoutAnalysis}
                weightHistory={weightHistory} getMostRecentWeight={getMostRecentWeight}
                profile={profile} weightProjection={weightProjection}
              />
            )}
            {activeTab === 'comidas' && (
              <DiaryTab
                selectedFoodDate={selectedFoodDate} setSelectedFoodDate={setSelectedFoodDate} changeDate={changeDate}
                getFoodsForDate={getFoodsForDate} getTotalsForDate={getTotalsForDate} getTargetsForDate={getTargetsForDate}
                confirmDelete={confirmDelete} setNewFood={setNewFood} setShowFoodForm={setShowFoodForm}
                setEditingFoodId={setEditingFoodId}
              />
            )}
            {activeTab === 'entrenos' && (
              <WorkoutsTab
                selectedWorkoutDate={selectedWorkoutDate} setSelectedWorkoutDate={setSelectedWorkoutDate} changeDate={changeDate}
                workoutLog={workoutLog} // Added
                workoutAnalysis={workoutAnalysis} weightAnalytics={weightAnalytics}
                ouraLog={ouraLog} currentWeight={profile.currentWeight}
                getWorkoutsForDate={getWorkoutsForDate}
                confirmDelete={confirmDelete} confirmWorkout={confirmWorkout}
              />
            )}
            {activeTab === 'peso' && (
              <WeightTab
                weightHistory={weightHistory} profile={profile} getMostRecentWeight={getMostRecentWeight}
                getWeightChartData={getWeightChartData} weightProjection={weightProjection}
                editingWeightId={editingWeightId} setEditingWeightId={setEditingWeightId}
                editingWeightValue={editingWeightValue} setEditingWeightValue={setEditingWeightValue}
                startEditWeight={startEditWeight} saveEditWeight={saveEditWeight} cancelEditWeight={cancelEditWeight}
                confirmDelete={confirmDelete} formatTime={formatTime}
              />
            )}
            {activeTab === 'pasos' && (
              <StepsTab
                stepsDate={stepsDate} setStepsDate={setStepsDate} newSteps={newSteps} setNewSteps={setNewSteps}
                addStepsEntry={addStepsEntry} weeklyData={getWeeklyData} stepsLog={stepsLog}
              />
            )}
            {activeTab === 'oura' && (
              <OuraTab ouraLog={ouraLog} />
            )}
            {activeTab === 'config' && (
              <ConfigTab
                profile={profile} customTargets={customTargets} updateConfig={updateConfig}
                weightHistory={weightHistory} foodLog={foodLog} workoutLog={workoutLog} stepsLog={stepsLog}
                exportForClaude={exportForClaude} exportForNutritionist={exportForNutritionist}
                exportBackup={exportBackup} importBackup={importBackup}
              />
            )}
          </main>
        </PullToRefresh>

        <TrackerFAB />
      </Layout>
    </AuthShell>
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

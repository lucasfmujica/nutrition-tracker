import React, { lazy, Suspense, useCallback } from 'react';
import { TrackerFAB } from './components/layout/FAB/TrackerFAB';
import { TrackerHeader } from './components/layout/Header/TrackerHeader';
import { ModalsManager } from './components/layout/Modals/ModalsManager';

import { AuthShell } from './components/layout/Shell/AuthShell';
import { Layout } from './components/layout/Shell/Layout';
import { UndoToast } from './components/shared/UndoToast';
import { TutorialOverlay, TutorialProvider } from './components/Tutorial';

// Lazy load heavy tab components
const ConfigTab = lazy(() =>
    import('./components/Tabs/ConfigTab').then((m) => ({ default: m.ConfigTab })),
);
const DashboardTab = lazy(() =>
    import('./components/Tabs/DashboardTab').then((m) => ({
        default: m.DashboardTab,
    })),
);
const DiaryTab = lazy(() =>
    import('./components/Tabs/DiaryTab').then((m) => ({ default: m.DiaryTab })),
);
const OuraTab = lazy(() =>
    import('./components/Tabs/OuraTab').then((m) => ({ default: m.OuraTab })),
);
const StepsTab = lazy(() =>
    import('./components/Tabs/StepsTab').then((m) => ({ default: m.StepsTab })),
);
const WeightTab = lazy(() =>
    import('./components/Tabs/WeightTab').then((m) => ({ default: m.WeightTab })),
);
const WorkoutsTab = lazy(() =>
    import('./components/Tabs/WorkoutsTab').then((m) => ({
        default: m.WorkoutsTab,
    })),
);

import { PullToRefresh } from './components/UI/PullToRefresh';
import { TrackerProvider, useTracker } from './context/TrackerContext';

const NutritionTrackerContent = () => {
    const {
        activeTab,
        setActiveTab,
        profile,
        // Data for Tabs
        dashboardDate,
        setDashboardDate,
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
        updateConfig,
        // Intelligence Engine
        weightAnalytics,
        // Actions
        undoAction,
        setUndoAction,
        isRefreshing,
        handleRefresh,
        exportForClaude,
        exportForNutritionist,
        exportBackup,
        importBackup,
        // Tab Specific Props
        selectedFoodDate,
        setSelectedFoodDate,
        getFoodsForDate,
        confirmDelete,
        setEditingFoodId,
        setShowFoodForm,
        selectedWorkoutDate,
        setSelectedWorkoutDate,
        workoutAnalysis,
        getWorkoutsForDate,
        confirmWorkout,
        getWeightChartData,
        editingWeightId,
        setEditingWeightId,
        editingWeightValue,
        setEditingWeightValue,
        startEditWeight,
        saveEditWeight,
        cancelEditWeight,
        stepsDate,
        setStepsDate,
        newSteps,
        setNewSteps,
        addStepsEntry,
        getWeeklyData,
        getStepsForDate,
        getWaterForDate,
        addWaterGlass,
        removeWaterGlass,
        weightProjection,
        formatTime,
        hydrationTarget,
        showOnboarding,
        setNewFood,
        newFood,
        supabase,
    } = useTracker();

    // Derived state for Dashboard
    const dashboardTotals = getTotalsForDate(dashboardDate);
    const dashboardTargets = getTargetsForDate(dashboardDate);

    // Tutorial: Map tab index to tab ID
    const tabIndexToId = ['dashboard', 'comidas', 'peso', 'entrenos', 'config'];
    const handleTutorialNavigate = useCallback(
        (tabIndex: number) => {
            const tabId = tabIndexToId[tabIndex];
            if (tabId) {
                setActiveTab(tabId);
            }
        },
        [setActiveTab],
    );

    // Tutorial: Mark tutorial as complete
    const handleTutorialComplete = useCallback(() => {
        updateConfig({ ...profile, tutorialCompleted: true }, customTargets);
    }, [profile, customTargets, updateConfig]);

    return (
        <AuthShell>
            <TutorialProvider
                tutorialCompleted={profile?.tutorialCompleted ?? false}
                onComplete={handleTutorialComplete}
                onNavigate={handleTutorialNavigate}>
                <Layout
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    profile={profile}
                    showNav={!showOnboarding}>
                    <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
          .scrollbar-hide::-webkit-scrollbar{display:none}
          .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        `}</style>

                    <ModalsManager />
                    <UndoToast
                        undoAction={undoAction}
                        setUndoAction={setUndoAction}
                    />
                    <TrackerHeader />
                    <TutorialOverlay />

                    <PullToRefresh
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}>
                        <main className="p-4 lg:p-6 xl:p-8 pb-32 md:pb-36 w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
                            <Suspense
                                fallback={
                                    <div className="flex items-center justify-center min-h-[400px]">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                    </div>
                                }>
                                {activeTab === 'dashboard' ? (
                                    <DashboardTab
                                        dashboardDate={dashboardDate}
                                        setDashboardDate={setDashboardDate}
                                        changeDate={changeDate}
                                        dashboardTotals={dashboardTotals}
                                        dashboardTargets={dashboardTargets}
                                        getStepsForDate={getStepsForDate}
                                        getWaterForDate={getWaterForDate}
                                        addWaterGlass={addWaterGlass}
                                        removeWaterGlass={removeWaterGlass}
                                        WATER_GOAL_GLASSES={
                                            hydrationTarget
                                                ? Math.ceil(
                                                      hydrationTarget.target / 250,
                                                  )
                                                : 8
                                        }
                                        hydrationTarget={hydrationTarget}
                                        workoutAnalysis={workoutAnalysis}
                                        weightHistory={weightHistory}
                                        getMostRecentWeight={getMostRecentWeight}
                                        profile={profile}
                                        ouraLog={ouraLog}
                                        getTotalsForDate={getTotalsForDate}
                                        getTargetsForDate={getTargetsForDate}
                                    />
                                ) : null}
                                {activeTab === 'comidas' ? (
                                    <DiaryTab
                                        selectedFoodDate={selectedFoodDate}
                                        setSelectedFoodDate={setSelectedFoodDate}
                                        changeDate={changeDate}
                                        getFoodsForDate={getFoodsForDate}
                                        getTotalsForDate={getTotalsForDate}
                                        getTargetsForDate={getTargetsForDate}
                                        getWaterForDate={getWaterForDate}
                                        hydrationTarget={hydrationTarget}
                                        addWaterGlass={addWaterGlass}
                                        confirmDelete={confirmDelete}
                                        newFood={newFood}
                                        setNewFood={setNewFood}
                                        setShowFoodForm={setShowFoodForm}
                                        setEditingFoodId={setEditingFoodId}
                                    />
                                ) : null}
                                {activeTab === 'entrenos' ? (
                                    <WorkoutsTab
                                        selectedWorkoutDate={selectedWorkoutDate}
                                        setSelectedWorkoutDate={
                                            setSelectedWorkoutDate
                                        }
                                        changeDate={changeDate}
                                        workoutLog={workoutLog}
                                        weightAnalytics={weightAnalytics}
                                        ouraLog={ouraLog}
                                        currentWeight={profile.currentWeight}
                                        getWorkoutsForDate={getWorkoutsForDate}
                                        confirmDelete={confirmDelete}
                                    />
                                ) : null}
                                {activeTab === 'peso' ? (
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
                                ) : null}
                                {activeTab === 'pasos' ? (
                                    <StepsTab
                                        stepsDate={stepsDate}
                                        setStepsDate={setStepsDate}
                                        newSteps={newSteps}
                                        setNewSteps={setNewSteps}
                                        addStepsEntry={addStepsEntry}
                                        weeklyData={getWeeklyData}
                                        stepsLog={stepsLog}
                                        stepGoal={profile.stepGoal || 8000}
                                    />
                                ) : null}
                                {activeTab === 'oura' ? (
                                    <OuraTab ouraLog={ouraLog} />
                                ) : null}
                                {activeTab === 'config' ? (
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
                                        userId={supabase?.user?.id}
                                    />
                                ) : null}
                            </Suspense>
                        </main>
                    </PullToRefresh>

                    <TrackerFAB />
                </Layout>
            </TutorialProvider>
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

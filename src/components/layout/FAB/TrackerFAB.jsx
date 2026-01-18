import React from 'react';
import { useTracker } from '../../../context/TrackerContext';
import { FloatingActionButton } from '../../UI/FloatingActionButton';

export const TrackerFAB = () => {
  const {
    activeTab,
    showFab,
    showFoodForm, setShowFoodForm,
    showWorkoutForm, setShowWorkoutForm,
    showImportFoodModal, setShowImportFoodModal,
    showImportWorkoutModal, setShowImportWorkoutModal,
    showTemplatesModal, setShowTemplatesModal,
    newFood, setNewFood,
    newWorkout, setNewWorkout,
    dashboardDate,
    setShowFoodScanModal // New Setter
  } = useTracker();

  if (!showFab || !['dashboard', 'comidas', 'entrenos'].includes(activeTab)) return null;

  // Don't show FAB if any modal is open
  if (showFoodForm || showWorkoutForm || showImportFoodModal || showImportWorkoutModal || showTemplatesModal) return null;

  return (
    <div className="hidden lg:block">
      <FloatingActionButton
        onAddFood={() => {
          setNewFood({ ...newFood, date: dashboardDate });
          setShowFoodForm(true);
        }}
        onAddWorkout={() => {
          setNewWorkout({ ...newWorkout, date: dashboardDate });
          setShowWorkoutForm(true);
        }}
        onImportFood={() => setShowImportFoodModal(true)}
        onImportWorkout={() => setShowImportWorkoutModal(true)}
        onQuickAdd={() => setShowTemplatesModal(true)}
        onScanFood={() => setShowFoodScanModal(true)}
      />
    </div>
  );
};

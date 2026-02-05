import React from 'react';
import { TrackerContextType, useTracker } from '../../../context/TrackerContext';
import { FloatingActionButton } from '../../UI/FloatingActionButton';

export const TrackerFAB: React.FC = () => {
    const {
        activeTab,
        showFab,
        showFoodForm,
        setShowFoodForm,
        showWorkoutForm,
        setShowWorkoutForm,
        showImportFoodModal,
        setShowImportFoodModal,
        showImportWorkoutModal,
        setShowImportWorkoutModal,
        showTemplatesModal,
        setShowTemplatesModal,
        newFood,
        setNewFood,
        newWorkout,
        setNewWorkout,
        dashboardDate,
        selectedFoodDate,
        selectedWorkoutDate,
        setShowFoodScanModal,
        setShowSuggestionModal,
    } = useTracker() as TrackerContextType & { setShowSuggestionModal: (v: boolean) => void };

    if (
        !showFab ||
        ![
            'dashboard',
            'comidas',
            'entrenos',
            'peso',
            'pasos',
            'oura',
            'config',
        ].includes(activeTab)
    )
        return null;

    // Don't show FAB if any modal is open
    if (
        showFoodForm ||
        showWorkoutForm ||
        showImportFoodModal ||
        showImportWorkoutModal ||
        showTemplatesModal
    )
        return null;

    // Determine which date to use based on active tab
    const getContextualDate = () => {
        if (activeTab === 'comidas') return selectedFoodDate;
        if (activeTab === 'entrenos') return selectedWorkoutDate;
        return dashboardDate; // Default for dashboard, peso, pasos, oura, config
    };

    return (
        <div className="hidden lg:block">
            <FloatingActionButton
                onAddFood={() => {
                    setNewFood({ ...newFood, date: getContextualDate() });
                    setShowFoodForm(true);
                }}
                onAddWorkout={() => {
                    setNewWorkout({ ...newWorkout, date: getContextualDate() });
                    setShowWorkoutForm(true);
                }}
                onImportFood={() => setShowImportFoodModal(true)}
                onImportWorkout={() => setShowImportWorkoutModal(true)}
                onQuickAdd={() => setShowTemplatesModal(true)}
                onScanFood={() => setShowFoodScanModal(true)}
                onAIChef={() => setShowSuggestionModal(true)}
            />
        </div>
    );
};

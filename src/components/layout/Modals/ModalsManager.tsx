import React, { Suspense } from 'react';
import { useAIMeals } from '../../../context/AIMealSuggestionsContext';
import { useTracker } from '../../../context/TrackerContext';
import { useSmartMealType } from '../../../hooks/useSmartMealType';
import { FoodEntry } from '../../../types/domain';
import { getArgentinaDateString, getCurrentTimeString } from '../../../utils/dateUtils';
import { DeleteConfirmModal } from '../../Modals/DeleteConfirmModal';
import {
    AIMealSuggestionModal,
    BarcodeScannerModal,
    FoodCameraModal,
    FoodHistoryPanel,
    FoodSearchModal,
    MondayBriefingModal,
    WeeklyReport,
    WorkoutScanner,
} from './lazyModals';
import { FavoritesTemplatesModal } from '../../Modals/FavoritesTemplatesModal';
import { SaveTemplateModal } from '../../Modals/SaveTemplateModal';
import { FoodFormModal } from '../../Modals/FoodFormModal';
import { ImportModal } from '../../Modals/ImportModal';
import { WorkoutFormModal } from '../../Modals/WorkoutFormModal';

export const ModalsManager: React.FC = () => {
    const {
        // Delete Modal
        deleteModal,
        setDeleteModal,
        executeDelete,

        // Food Form Modal
        showFoodForm,
        setShowFoodForm,
        newFood,
        setNewFood,
        editingFoodId,
        setEditingFoodId,
        addManualFood,
        resetFoodForm,

        // Workout Form Modal
        showWorkoutForm,
        setShowWorkoutForm,
        newWorkout,
        setNewWorkout,
        addManualWorkout,
        saveWorkout,
        saveWorkoutEntry,
        editingWorkout,
        handleEditWorkout,

        // Import Modals
        showImportFoodModal,
        setShowImportFoodModal,
        showImportWorkoutModal,
        setShowImportWorkoutModal,
        importText,
        setImportText,
        importError,
        setImportError,
        handleImportFood,
        showFoodScanModal,
        setShowFoodScanModal,
        showFoodSearchModal,
        setShowFoodSearchModal,
        showBarcodeModal,
        setShowBarcodeModal,
        showFoodHistoryPanel,
        setShowFoodHistoryPanel,

        // Meal Templates Modal
        showTemplatesModal,
        setShowTemplatesModal,
        mealTemplates,
        addFromTemplate,
        deleteTemplate,

        // Save Template Modal
        showSaveTemplateModal,
        setShowSaveTemplateModal,
        templateToSave,
        setTemplateToSave,
        confirmSaveTemplate,

        // Weekly Report
        showWeeklyReport,
        setShowWeeklyReport,
        foodLog,
        workoutLog,
        weightHistory,
        stepsLog,
        customTargets,

        // Monday Briefing
        showMondayBriefing,
        markBriefingReviewed,
        acceptProposedTargets,
        briefingData,
        dashboardDate,

        // Food actions
        saveFoodEntry,
        selectedFoodDate,
    } = useTracker() as any;
    const { showSuggestionModal, setShowSuggestionModal } = useAIMeals();
    const { getAutoMealType } = useSmartMealType();

    // Handler for selecting a food from history - duplicates it to today
    const handleSelectFoodFromHistory = async (food: FoodEntry) => {
        const newEntry: FoodEntry = {
            ...food,
            id: crypto.randomUUID(),
            date: selectedFoodDate,
            time: getCurrentTimeString(),
            meal: getAutoMealType(), // Auto-detect meal type based on current time
        };

        try {
            await saveFoodEntry(newEntry);
        } catch (err) {
            console.error(
                '[ModalsManager] Error duplicating food from history:',
                err,
            );
        }
    };

    return (
        <>
            <DeleteConfirmModal
                isOpen={deleteModal.show}
                itemName={deleteModal.name}
                onConfirm={executeDelete}
                onCancel={() =>
                    setDeleteModal({ show: false, type: '', id: null, name: '' })
                }
            />

            <FoodFormModal
                isOpen={showFoodForm}
                onClose={() => {
                    setShowFoodForm(false);
                    if (editingFoodId) {
                        // Cancelled edit: clear edit mode and discard prefilled values
                        setEditingFoodId(null);
                        resetFoodForm();
                    }
                }}
                food={newFood}
                onFoodChange={setNewFood}
                onSubmit={addManualFood}
                isEditing={!!editingFoodId}
            />

            <WorkoutFormModal
                isOpen={showWorkoutForm}
                onClose={() => {
                    setShowWorkoutForm(false);
                    if (editingWorkout) handleEditWorkout(null);
                }}
                workout={newWorkout}
                onWorkoutChange={setNewWorkout}
                onSubmit={saveWorkout || addManualWorkout}
                mode={editingWorkout ? 'edit' : 'add'}
            />

            <ImportModal
                isOpen={showImportFoodModal}
                onClose={() => {
                    setShowImportFoodModal(false);
                    setImportText('');
                    setImportError('');
                }}
                title="📥 Importar Comida"
                description="Pegá el JSON de la comida generado por la IA."
                placeholder={`{"meal": "lunch", "name": "Pollo", "calories": 500, "protein": 40}`}
                value={importText}
                onChange={(val: string) => {
                    setImportText(val);
                    setImportError('');
                }}
                onImport={handleImportFood}
                error={importError}
                accentColor="blue"
            />

            {showImportWorkoutModal && (
                <Suspense fallback={null}>
                    <WorkoutScanner
                        onSave={async (workoutData: any) => {
                            const newEntry = {
                                ...workoutData,
                                date: workoutData.date || getArgentinaDateString(),
                                source: 'ai-import',
                                reviewed: true,
                                confidence: 1.0,
                            };
                            await saveWorkoutEntry(newEntry);
                            setShowImportWorkoutModal(false);
                        }}
                        onCancel={() => setShowImportWorkoutModal(false)}
                    />
                </Suspense>
            )}

            {showFoodScanModal && (
                <Suspense fallback={null}>
                    <FoodCameraModal
                        isOpen
                        onClose={() => setShowFoodScanModal(false)}
                    />
                </Suspense>
            )}

            {showFoodSearchModal && (
                <Suspense fallback={null}>
                    <FoodSearchModal
                        isOpen
                        onClose={() => setShowFoodSearchModal(false)}
                    />
                </Suspense>
            )}

            {showBarcodeModal && (
                <Suspense fallback={null}>
                    <BarcodeScannerModal
                        isOpen
                        onClose={() => setShowBarcodeModal(false)}
                        onOpenFoodSearch={() => {
                            setShowBarcodeModal(false);
                            setShowFoodSearchModal(true);
                        }}
                    />
                </Suspense>
            )}

            {showFoodHistoryPanel && (
                <Suspense fallback={null}>
                    <FoodHistoryPanel
                        isOpen
                        onClose={() => setShowFoodHistoryPanel(false)}
                        foodLog={foodLog}
                        onSelectFood={handleSelectFoodFromHistory}
                    />
                </Suspense>
            )}

            <FavoritesTemplatesModal
                isOpen={showTemplatesModal}
                onClose={() => setShowTemplatesModal(false)}
                mealTemplates={mealTemplates}
                onAddFromTemplate={addFromTemplate}
                onDeleteTemplate={deleteTemplate}
            />

            <SaveTemplateModal
                isOpen={!!(showSaveTemplateModal && templateToSave)}
                templateToSave={templateToSave}
                onTemplateChange={setTemplateToSave}
                onConfirm={confirmSaveTemplate}
                onCancel={() => {
                    setShowSaveTemplateModal(false);
                    setTemplateToSave(null);
                }}
            />

            {showWeeklyReport && (
                <Suspense fallback={null}>
                    <WeeklyReport
                        foodLog={foodLog}
                        workoutLog={workoutLog}
                        weightHistory={weightHistory}
                        stepsLog={stepsLog}
                        targets={customTargets}
                        onClose={() => setShowWeeklyReport(false)}
                    />
                </Suspense>
            )}

            {showMondayBriefing && briefingData && (
                <Suspense fallback={null}>
                    <MondayBriefingModal
                        onAccept={acceptProposedTargets}
                        onDismiss={markBriefingReviewed}
                        {...briefingData}
                    />
                </Suspense>
            )}

            {showSuggestionModal && (
                <Suspense fallback={null}>
                    <AIMealSuggestionModal
                        isOpen
                        onClose={() => setShowSuggestionModal(false)}
                    />
                </Suspense>
            )}
        </>
    );
};

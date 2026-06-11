import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAIMeals } from '../../../context/AIMealSuggestionsContext';
import { useTracker } from '../../../context/TrackerContext';
import { useSmartMealType } from '../../../hooks/useSmartMealType';
import { FoodEntry } from '../../../types/domain';
import { getArgentinaDateString, getCurrentTimeString } from '../../../utils/dateUtils';
import { FoodHistoryPanel } from '../../Food/FoodHistoryPanel';
import { AIMealSuggestionModal } from '../../Modals/AIMealSuggestionModal';
import { BarcodeScannerModal } from '../../Modals/BarcodeScannerModal';
import { DeleteConfirmModal } from '../../Modals/DeleteConfirmModal';
import { FoodCameraModal } from '../../Modals/FoodCameraModal';
import { FoodFormModal } from '../../Modals/FoodFormModal';
import { FoodSearchModal } from '../../Modals/FoodSearchModal';
import { ImportModal } from '../../Modals/ImportModal';
import { MondayBriefingModal } from '../../Modals/MondayBriefingModal';
import { WorkoutFormModal } from '../../Modals/WorkoutFormModal';
import { WorkoutScanner } from '../../Workouts/WorkoutScanner';
import { WeeklyReport } from './WeeklyReport';

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

    const { t } = useTranslation();
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
            )}

            <FoodCameraModal
                isOpen={showFoodScanModal}
                onClose={() => setShowFoodScanModal(false)}
            />

            <FoodSearchModal
                isOpen={showFoodSearchModal}
                onClose={() => setShowFoodSearchModal(false)}
            />

            <BarcodeScannerModal
                isOpen={showBarcodeModal}
                onClose={() => setShowBarcodeModal(false)}
                onOpenFoodSearch={() => {
                    setShowBarcodeModal(false);
                    setShowFoodSearchModal(true);
                }}
            />

            <FoodHistoryPanel
                isOpen={showFoodHistoryPanel}
                onClose={() => setShowFoodHistoryPanel(false)}
                foodLog={foodLog}
                onSelectFood={handleSelectFoodFromHistory}
            />

            {showTemplatesModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-2 pt-8 overflow-y-auto">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="templates-modal-title"
                        className="bg-surface rounded-2xl p-5 w-full max-w-md border border-purple-200 dark:border-purple-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3
                                id="templates-modal-title"
                                className="text-lg lg:text-xl font-bold text-purple-600 dark:text-purple-400">
                                ⭐ Favoritos
                            </h3>
                            <button
                                onClick={() => setShowTemplatesModal(false)}
                                aria-label={t('common.close')}
                                className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-surface-lighter hover:bg-surface-lighter text-text-secondary hover:text-text-primary text-xl lg:text-2xl transition-colors">
                                ×
                            </button>
                        </div>

                        {mealTemplates.length === 0 ? (
                            <p className="text-text-tertiary text-sm text-center py-4">
                                {t('favorites.empty')}
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                                {/* Sort templates by meal type */}
                                {['breakfast', 'lunch', 'snack', 'dinner', 'other'].map((mealType) => {
                                    const mealsOfType = mealTemplates.filter((t: any) => t.meal === mealType);
                                    if (mealsOfType.length === 0) return null;
                                    return (
                                        <div key={mealType} className="space-y-2">
                                            <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider px-1">
                                                {mealType === 'breakfast' ? `🌅 ${t('mealTypes.breakfast')}` :
                                                 mealType === 'lunch' ? `☀️ ${t('mealTypes.lunch')}` :
                                                 mealType === 'snack' ? `🍎 ${t('mealTypes.snack')}` :
                                                 mealType === 'dinner' ? `🌙 ${t('mealTypes.dinner')}` : `🍴 ${t('mealTypes.other')}`}
                                            </div>
                                            {mealsOfType.map((template: any) => (
                                    <div
                                        key={template.id}
                                        className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3 border border-purple-100 dark:border-purple-800 active:bg-purple-100 dark:active:bg-purple-800/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <button
                                                onClick={() =>
                                                    addFromTemplate(template)
                                                }
                                                className="flex-1 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-purple-600 dark:text-purple-400 uppercase font-bold">
                                                        {template.meal}
                                                    </span>
                                                </div>
                                                <h4 className="font-medium text-sm text-text-primary">
                                                    {template.name}
                                                </h4>
                                                {template.description && (
                                                    <p className="text-xs text-text-secondary truncate">
                                                        {template.description}
                                                    </p>
                                                )}
                                                <div className="flex gap-2 mt-1 text-xs font-medium">
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        {template.calories}kcal
                                                    </span>
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        {template.protein}P
                                                    </span>
                                                    <span className="text-amber-600 dark:text-amber-400">
                                                        {template.carbs}C
                                                    </span>
                                                    <span className="text-pink-600 dark:text-pink-400">
                                                        {template.fat}F
                                                    </span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    deleteTemplate(template.id)
                                                }
                                                aria-label={`${t('a11y.deleteFavorite')}: ${template.name}`}
                                                className="text-text-tertiary hover:text-red-500 active:text-red-600 p-1 transition-colors">
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <p className="text-xs text-text-tertiary mt-3 text-center">
                            {t('favorites.hint')}
                        </p>
                    </div>
                </div>
            )}

            {showSaveTemplateModal && templateToSave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="save-template-modal-title"
                        className="bg-surface rounded-2xl p-5 w-full max-w-xs border border-purple-200 dark:border-purple-800 shadow-2xl">
                        <h3
                            id="save-template-modal-title"
                            className="text-base font-bold text-purple-600 dark:text-purple-400 mb-3">
                            {templateToSave.items && templateToSave.items.length > 0
                                ? `⭐ ${t('favorites.saveCombo')}`
                                : `⭐ ${t('favorites.saveAsFavorite')}`}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                    {t('favorites.name')}
                                </label>
                                <input
                                    type="text"
                                    value={templateToSave.name}
                                    placeholder={
                                        templateToSave.items
                                            ? t('favorites.placeholderCombo')
                                            : t('favorites.placeholderSingle')
                                    }
                                    autoFocus
                                    onChange={(e) =>
                                        setTemplateToSave({
                                            ...templateToSave,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                        {t('favorites.type')}
                                    </label>
                                    <select
                                        value={templateToSave.meal}
                                        onChange={(e) =>
                                            setTemplateToSave({
                                                ...templateToSave,
                                                meal: e.target.value,
                                            })
                                        }
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all">
                                        <option value="breakfast">{t('mealTypes.breakfast')}</option>
                                        <option value="lunch">{t('mealTypes.lunch')}</option>
                                        <option value="snack">{t('mealTypes.snack')}</option>
                                        <option value="dinner">{t('mealTypes.dinner')}</option>
                                        <option value="other">{t('mealTypes.other')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                        {t('favorites.calories')}
                                    </label>
                                    <input
                                        type="number"
                                        value={templateToSave.calories}
                                        disabled={
                                            !!(
                                                templateToSave.items &&
                                                templateToSave.items.length > 0
                                            )
                                        }
                                        onChange={(e) =>
                                            setTemplateToSave({
                                                ...templateToSave,
                                                calories:
                                                    parseInt(e.target.value) || 0,
                                            })
                                        }
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all disabled:opacity-60 disabled:bg-surface-lighter"
                                    />
                                </div>
                            </div>
                            <div className="text-xs text-text-secondary font-medium bg-background px-3 py-2 rounded-lg flex justify-between items-center">
                                <span>
                                    P: {templateToSave.protein}g · C:{' '}
                                    {templateToSave.carbs}g · F: {templateToSave.fat}
                                    g
                                </span>
                                {templateToSave.items &&
                                    templateToSave.items.length > 0 && (
                                        <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                                            {templateToSave.items.length} items
                                        </span>
                                    )}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setShowSaveTemplateModal(false);
                                    setTemplateToSave(null);
                                }}
                                className="flex-1 bg-surface-lighter hover:bg-surface-lighter text-text-secondary py-2.5 rounded-xl text-sm font-medium transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmSaveTemplate}
                                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showWeeklyReport && (
                <WeeklyReport
                    foodLog={foodLog}
                    workoutLog={workoutLog}
                    weightHistory={weightHistory}
                    stepsLog={stepsLog}
                    targets={customTargets}
                    onClose={() => setShowWeeklyReport(false)}
                />
            )}

            {showMondayBriefing && briefingData && (
                <MondayBriefingModal
                    onAccept={acceptProposedTargets}
                    onDismiss={markBriefingReviewed}
                    {...briefingData}
                />
            )}

            <AIMealSuggestionModal
                isOpen={showSuggestionModal}
                onClose={() => setShowSuggestionModal(false)}
            />
        </>
    );
};

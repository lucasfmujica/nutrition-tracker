import React from 'react';
import { useTracker } from '../../../context/TrackerContext';
import { DeleteConfirmModal } from '../../Modals/DeleteConfirmModal';
import { FoodCameraModal } from '../../Modals/FoodCameraModal';
import { FoodFormModal } from '../../Modals/FoodFormModal';
import { ImportModal } from '../../Modals/ImportModal';
import { MondayBriefingModal } from '../../Modals/MondayBriefingModal';
import { WorkoutFormModal } from '../../Modals/WorkoutFormModal';
import { WeeklyReport } from './WeeklyReport';

export const ModalsManager = () => {
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

    // Workout Form Modal
    showWorkoutForm,
    setShowWorkoutForm,
    newWorkout,
    setNewWorkout,
    addManualWorkout,
    saveWorkout,
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
    handleImportWorkout,
    showFoodScanModal,
    setShowFoodScanModal,

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
    setShowMondayBriefing,
    briefingData,
    acceptProposedTargets,
    markBriefingReviewed
  } = useTracker();

  return (
    <>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.show}
        itemName={deleteModal.name}
        onConfirm={executeDelete}
        onCancel={() => setDeleteModal({ show: false, type: '', id: null, name: '' })}
      />

      {/* Manual Food Entry Modal */}
      <FoodFormModal
        isOpen={showFoodForm}
        onClose={() => { setShowFoodForm(false); setEditingFoodId(null); }}
        food={newFood}
        onFoodChange={setNewFood}
        onSubmit={addManualFood}
        isEditing={!!editingFoodId}
      />

      {/* Manual Workout Entry Modal */}
      <WorkoutFormModal
        isOpen={showWorkoutForm}
        onClose={() => { setShowWorkoutForm(false); if (editingWorkout) handleEditWorkout(null); }}
        workout={newWorkout}
        onWorkoutChange={setNewWorkout}
        onSubmit={saveWorkout || addManualWorkout}
        mode={editingWorkout ? 'edit' : 'add'}
      />

      {/* Import Food Modal */}
      <ImportModal
        isOpen={showImportFoodModal}
        onClose={() => { setShowImportFoodModal(false); setImportText(''); setImportError(''); }}
        title="📥 Importar Comida"
        description="Pegá el JSON de la comida generado por la IA."
        placeholder={`{"meal": "Almuerzo", "name": "Pollo", "calories": 500, "protein": 40}`}
        value={importText}
        onChange={(val) => { setImportText(val); setImportError(''); }}
        onImport={handleImportFood}
        error={importError}
        accentColor="blue"
      />

      {/* Import Workout Modal */}
      <ImportModal
        isOpen={showImportWorkoutModal}
        onClose={() => { setShowImportWorkoutModal(false); setImportText(''); setImportError(''); }}
        title="📥 Importar Entreno"
        description="Pegá el JSON del entreno (Gravl o IA)."
        placeholder={`{"type": "gym", "name": "Push Day", "duration": 60, "exercises": [...]}`}
        value={importText}
        onChange={(val) => { setImportText(val); setImportError(''); }}
        onImport={handleImportWorkout}
        error={importError}
        accentColor="amber"
      />

      {/* AI Meal Scanner Modal */}
      <FoodCameraModal
        isOpen={showFoodScanModal}
        onClose={() => setShowFoodScanModal(false)}
      />

      {/* Meal Templates Modal - Inline implementation as in original */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-2 pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-purple-200 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg lg:text-xl font-bold text-purple-600">⭐ Favoritos</h3>
              <button onClick={() => setShowTemplatesModal(false)} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xl lg:text-2xl transition-colors">×</button>
            </div>

            {mealTemplates.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No hay plantillas guardadas. Agregá comidas y guardalas como favoritos.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {mealTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-purple-50 rounded-xl p-3 border border-purple-100 active:bg-purple-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => addFromTemplate(template)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-600 uppercase font-bold">{template.meal}</span>
                        </div>
                        <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
                        {template.description && (
                          <p className="text-xs text-gray-600 truncate">{template.description}</p>
                        )}
                        <div className="flex gap-2 mt-1 text-xs font-medium">
                          <span className="text-blue-600">{template.calories}kcal</span>
                          <span className="text-blue-600">{template.protein}P</span>
                          <span className="text-amber-600">{template.carbs}C</span>
                          <span className="text-pink-600">{template.fat}F</span>
                        </div>
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-gray-400 hover:text-red-500 active:text-red-600 p-1 transition-colors"
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

      {/* Save as Template Modal - Inline implementation as in original */}
      {showSaveTemplateModal && templateToSave && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs border border-purple-200 shadow-2xl">
            <h3 className="text-base font-bold text-purple-600 mb-3">⭐ Guardar como Favorito</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={templateToSave.name}
                  onChange={(e) => setTemplateToSave({ ...templateToSave, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo</label>
                  <select
                    value={templateToSave.meal}
                    onChange={(e) => setTemplateToSave({ ...templateToSave, meal: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  >
                    <option>Desayuno</option>
                    <option>Almuerzo</option>
                    <option>Merienda</option>
                    <option>Cena</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Calorías</label>
                  <input
                    type="number"
                    value={templateToSave.calories}
                    onChange={(e) => setTemplateToSave({ ...templateToSave, calories: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium bg-gray-50 px-3 py-2 rounded-lg">
                P: {templateToSave.protein}g · C: {templateToSave.carbs}g · F: {templateToSave.fat}g
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowSaveTemplateModal(false); setTemplateToSave(null); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={confirmSaveTemplate} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">Guardar</button>
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
          targets={customTargets}
          onClose={() => setShowWeeklyReport(false)}
        />
      )}

      {/* Monday Briefing Modal (Metabolic Auto-Pilot) */}
      {showMondayBriefing && briefingData && (
        <MondayBriefingModal
          onAccept={acceptProposedTargets}
          onDismiss={markBriefingReviewed}
          {...briefingData} // spread { currentWeight, currentTrend, weeklyAdherence, proposal, currentTargets }
        />
      )}
    </>
  );
};

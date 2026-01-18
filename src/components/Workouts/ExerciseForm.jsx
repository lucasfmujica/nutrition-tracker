import { Copy, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * ExerciseForm - Component for adding/editing exercises within a workout
 *
 * Features:
 * - Card-within-card design for clean vertical layout
 * - Quick Add to duplicate last exercise
 * - Individual exercise deletion
 * - Responsive design with proper validation
 */
export const ExerciseForm = ({ exercises = [], onChange, disabled = false }) => {
  const [editingIndex, setEditingIndex] = useState(null);

  const handleAddExercise = () => {
    const newExercise = {
      name: '',
      sets: '',
      reps: '',
      weight: ''
    };
    onChange([...exercises, newExercise]);
    setEditingIndex(exercises.length); // Focus on new exercise
  };

  const handleQuickAdd = () => {
    if (exercises.length === 0) {
      handleAddExercise();
      return;
    }

    // Duplicate the last exercise
    const lastExercise = exercises[exercises.length - 1];
    const duplicated = { ...lastExercise };
    onChange([...exercises, duplicated]);
    setEditingIndex(exercises.length);
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  const handleDeleteExercise = (index) => {
    const updated = exercises.filter((_, i) => i !== index);
    onChange(updated);
    if (editingIndex === index) setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Ejercicios {exercises.length > 0 && `(${exercises.length})`}
        </label>
        <div className="flex gap-2">
          {exercises.length > 0 && (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Duplicar último ejercicio"
            >
              <Copy className="w-3.5 h-3.5" />
              Quick Add
            </button>
          )}
          <button
            type="button"
            onClick={handleAddExercise}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>
      </div>

      {/* Exercise List - Card within Card Design */}
      {exercises.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
            🏋️
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Sin ejercicios registrados
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Hacé click en "Agregar" para comenzar
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {exercises.map((exercise, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ejercicio {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteExercise(index)}
                  disabled={disabled}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Eliminar ejercicio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Exercise Name */}
              <div className="mb-3">
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                  disabled={disabled}
                  placeholder="Ej: Press Banca, Sentadillas"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                {/* Sets */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">
                    Series
                  </label>
                  <input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => handleUpdateExercise(index, 'sets', e.target.value)}
                    disabled={disabled}
                    placeholder="4"
                    min="1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-900 text-sm font-bold text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Reps */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">
                    Reps
                  </label>
                  <input
                    type="number"
                    value={exercise.reps}
                    onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)}
                    disabled={disabled}
                    placeholder="8"
                    min="1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-900 text-sm font-bold text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={exercise.weight}
                    onChange={(e) => handleUpdateExercise(index, 'weight', e.target.value)}
                    disabled={disabled}
                    placeholder="80"
                    min="0"
                    step="0.5"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-900 text-sm font-bold text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Quick Preview */}
              {exercise.name && exercise.sets && exercise.reps && exercise.weight && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500 text-center font-medium">
                    <span className="font-bold text-slate-700">{exercise.name}</span>
                    {' · '}
                    <span className="font-mono">{exercise.sets}x{exercise.reps}</span>
                    {' · '}
                    <span className="font-mono">{exercise.weight}kg</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {exercises.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          💡 Usá "Quick Add" para duplicar el último ejercicio
        </p>
      )}
    </div>
  );
};

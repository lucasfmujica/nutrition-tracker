/**
 * WorkoutFormModal - Manual workout entry form
 * Modal for adding workout entries with exercise tracking
 */
export const WorkoutFormModal = ({
  isOpen,
  onClose,
  workout,
  onWorkoutChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-sm lg:max-w-md border border-gray-100 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl lg:text-2xl font-bold text-slate-900">🏋️ Nuevo Entreno</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Row 1: Type */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Tipo</label>
            <select
              value={workout.type}
              onChange={(e) => onWorkoutChange({ ...workout, type: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="gym">Gym</option>
              <option value="tennis">Tenis</option>
              <option value="cardio">Cardio</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Nombre *</label>
            <input
              type="text"
              value={workout.name}
              onChange={(e) => onWorkoutChange({ ...workout, name: e.target.value })}
              placeholder="Push Day, Clase de Tenis"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {/* Row 3: Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Min</label>
              <input
                type="number"
                value={workout.duration}
                onChange={(e) => onWorkoutChange({ ...workout, duration: e.target.value })}
                placeholder="60"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Kcal</label>
              <input
                type="number"
                value={workout.calories}
                onChange={(e) => onWorkoutChange({ ...workout, calories: e.target.value })}
                placeholder="300"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Vol (kg)</label>
              <input
                type="number"
                value={workout.volume}
                onChange={(e) => onWorkoutChange({ ...workout, volume: e.target.value })}
                placeholder="2500"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 4: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Notas</label>
            <input
              type="text"
              value={workout.notes}
              onChange={(e) => onWorkoutChange({ ...workout, notes: e.target.value })}
              placeholder="Subí peso en press banca"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 py-4 rounded-2xl text-slate-600 text-sm lg:text-base font-bold transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-gradient-to-br from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 py-4 rounded-2xl text-white text-sm lg:text-base font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

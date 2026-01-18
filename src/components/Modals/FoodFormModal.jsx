/**
 * FoodFormModal - Manual food entry form
 * Modal for adding/editing food entries with macro tracking
 */
export const FoodFormModal = ({
  isOpen,
  onClose,
  food,
  onFoodChange,
  onSubmit,
  isEditing
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 pt-20 pb-20 overflow-y-auto backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-sm lg:max-w-md border border-gray-100 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl lg:text-2xl font-bold text-slate-900">
            {isEditing ? '✏️ Editar Comida' : '🍽️ Nueva Comida'}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Row 1: Meal type + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Comida</label>
              <select
                value={food.meal}
                onChange={(e) => onFoodChange({ ...food, meal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option>Desayuno</option>
                <option>Almuerzo</option>
                <option>Merienda</option>
                <option>Cena</option>
                <option>Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Hora</label>
              <input
                type="time"
                value={food.time}
                onChange={(e) => onFoodChange({ ...food, time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Nombre *</label>
            <input
              type="text"
              value={food.name}
              onChange={(e) => onFoodChange({ ...food, name: e.target.value })}
              placeholder="Pollo con arroz"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Descripción</label>
            <input
              type="text"
              value={food.description}
              onChange={(e) => onFoodChange({ ...food, description: e.target.value })}
              placeholder="200g pechuga, 150g arroz"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 text-sm lg:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Row 4: Macros - 3+2 grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Cal *</label>
              <input
                type="number"
                value={food.calories}
                onChange={(e) => onFoodChange({ ...food, calories: e.target.value })}
                placeholder="500"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Prot</label>
              <input
                type="number"
                value={food.protein}
                onChange={(e) => onFoodChange({ ...food, protein: e.target.value })}
                placeholder="40"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Carbs</label>
              <input
                type="number"
                value={food.carbs}
                onChange={(e) => onFoodChange({ ...food, carbs: e.target.value })}
                placeholder="50"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Fat</label>
              <input
                type="number"
                value={food.fat}
                onChange={(e) => onFoodChange({ ...food, fat: e.target.value })}
                placeholder="15"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 text-center font-mono">Fibra</label>
              <input
                type="number"
                value={food.fiber}
                onChange={(e) => onFoodChange({ ...food, fiber: e.target.value })}
                placeholder="5"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-2 py-3 text-slate-900 text-sm lg:text-base text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          <input type="hidden" value={food.date} />
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
            className="flex-1 bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 py-4 rounded-2xl text-white text-sm lg:text-base font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

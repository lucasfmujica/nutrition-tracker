/**
 * FoodCameraInput Component
 * AI-powered meal scanner with camera/file input
 * Features: Image capture, AI analysis, editable results, auto meal-type selection
 */

import { Camera, Edit2, Loader2, Save, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { useFoodAnalysis } from '../../hooks/useFoodAnalysis';
import { getArgentinaDateString } from '../../utils/dateUtils';

export const FoodCameraInput = () => {
  const fileInputRef = useRef(null);
  const { analyzeFood, isLoading, result, error, resetResult } = useFoodAnalysis();
  const { saveFoodEntry } = useTracker();

  // Editable state for AI results
  const [editableMeal, setEditableMeal] = useState('');
  const [editableItems, setEditableItems] = useState([]);
  const [editableMacros, setEditableMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  });
  const [selectedMealType, setSelectedMealType] = useState('');

  /**
   * Auto-select meal type based on current device hour (Argentina TZ)
   */
  const getAutoMealType = () => {
    const now = new Date();
    const hour = parseInt(now.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    }));

    if (hour >= 6 && hour < 11) return 'Desayuno';
    if (hour >= 11 && hour < 16) return 'Almuerzo';
    if (hour >= 16 && hour < 20) return 'Merienda';
    return 'Cena';
  };

  /**
   * Handle file selection from camera/gallery
   */
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Analyze with AI
    const aiResult = await analyzeFood(file);

    if (aiResult) {
      // Populate editable fields with AI results
      setEditableMeal(aiResult.meal_detected || '');
      setEditableItems(aiResult.items || []);
      setEditableMacros(aiResult.total_macros || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      });
      setSelectedMealType(getAutoMealType());
    }

    // Reset file input
    e.target.value = '';
  };

  /**
   * Handle confirm - transform AI result to Supabase schema and save
   */
  const handleConfirm = async () => {
    try {
      // Get current date and time in Argentina TZ
      const date = getArgentinaDateString();
      const time = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });

      // Transform items array to description string
      const description = editableItems
        .map(item => `${item.portion} ${item.name}`)
        .join(', ');

      // Build food entry matching Supabase schema
      const foodEntry = {
        id: `f-${Date.now()}`, // Temporary string ID for new entries (f- prefix indicates new)
        date,
        time,
        meal: selectedMealType,
        name: editableMeal,
        description,
        calories: editableMacros.calories || 0,
        protein: editableMacros.protein || 0,
        carbs: editableMacros.carbs || 0,
        fat: editableMacros.fat || 0,
        fiber: editableMacros.fiber || 0,
        source: 'ai-photo'
      };

      // Save to database via TrackerContext
      await saveFoodEntry(foodEntry);

      // Reset state
      resetResult();
      setEditableMeal('');
      setEditableItems([]);
      setEditableMacros({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
      setSelectedMealType('');

    } catch (err) {
      console.error('[FoodCameraInput] Error saving food entry:', err);
      alert('Error al guardar la comida. Por favor, intenta nuevamente.');
    }
  };

  /**
   * Handle cancel - discard AI results
   */
  const handleCancel = () => {
    resetResult();
    setEditableMeal('');
    setEditableItems([]);
    setEditableMacros({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    setSelectedMealType('');
  };

  // If showing results/edit view
  if (result) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Editar Comida Detectada</h3>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Meal Name */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Nombre de la Comida
          </label>
          <input
            type="text"
            value={editableMeal}
            onChange={(e) => setEditableMeal(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ej: Bife con batatas"
          />
        </div>

        {/* Meal Type Dropdown */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Tipo de Comida
          </label>
          <select
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="Desayuno">Desayuno</option>
            <option value="Almuerzo">Almuerzo</option>
            <option value="Merienda">Merienda</option>
            <option value="Cena">Cena</option>
          </select>
        </div>

        {/* Items List */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Ingredientes Detectados
          </label>
          <div className="space-y-2">
            {editableItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item.portion}
                  onChange={(e) => {
                    const newItems = [...editableItems];
                    newItems[index].portion = e.target.value;
                    setEditableItems(newItems);
                  }}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="160g"
                />
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...editableItems];
                    newItems[index].name = e.target.value;
                    setEditableItems(newItems);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Bife de Chorizo"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Macros */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Macronutrientes
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Calorías</label>
              <input
                type="number"
                value={editableMacros.calories}
                onChange={(e) => setEditableMacros({ ...editableMacros, calories: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Proteína (g)</label>
              <input
                type="number"
                value={editableMacros.protein}
                onChange={(e) => setEditableMacros({ ...editableMacros, protein: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Carbos (g)</label>
              <input
                type="number"
                value={editableMacros.carbs}
                onChange={(e) => setEditableMacros({ ...editableMacros, carbs: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Grasa (g)</label>
              <input
                type="number"
                value={editableMacros.fat}
                onChange={(e) => setEditableMacros({ ...editableMacros, fat: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">Fibra (g)</label>
              <input
                type="number"
                value={editableMacros.fiber}
                onChange={(e) => setEditableMacros({ ...editableMacros, fiber: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Guardar
          </button>
        </div>
      </div>
    );
  }

  // Default view - Scan button
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/70 transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analizando imagen...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            📷 Escanear Comida
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Toma una foto de tu comida para análisis automático con IA
      </p>
    </div>
  );
};

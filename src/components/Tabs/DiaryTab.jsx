import { useMemo } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { useProteinPacing } from '../../hooks/useProteinPacing';
import { useSmartMealCompass } from '../../hooks/useSmartMealCompass';
import { formatDateDisplay, getArgentinaDateString } from '../../utils/dateUtils';
import { FastLogCarousel } from '../Dashboard/FastLogCarousel';
import { HydrationGuard } from '../Dashboard/HydrationGuard';
import { DaySummary } from '../Diary/DaySummary';
import { MealCompassCard } from '../Diary/MealCompassCard';
import { MealSection } from '../Diary/MealSection';
import { ProteinTimeline } from '../Diary/ProteinTimeline';

// Internal Wrapper to safeguard hook usage (conditional rendering in parent)
const MealCompassWrapper = ({ foodLog, remaining, onAdd }) => {
  const suggestions = useSmartMealCompass(foodLog, remaining);
  return <MealCompassCard suggestions={suggestions} onSelect={onAdd} />;
};

/**
 * DiaryTab - Main food diary view
 * Displays meal sections and day summary
 */
export const DiaryTab = ({
  // Date state
  selectedFoodDate,
  setSelectedFoodDate,
  changeDate,

  // Data access
  getFoodsForDate,
  getTotalsForDate,
  getTargetsForDate,
  getWaterForDate,
  hydrationTarget,
  addWaterGlass,

  // Actions
  confirmDelete,

  // Form state handling
  newFood,
  setNewFood,
  setShowFoodForm,
  setEditingFoodId
}) => {
  const { frequentFoods, frequentCombos, quickLog, foodLog, customTargets } = useTracker();

  const foods = getFoodsForDate(selectedFoodDate);
  const hasFoods = foods.length > 0;

  // --- Protein Pacing Engine ---
  const proteinPacing = useProteinPacing(
    foodLog,
    customTargets?.protein,
    selectedFoodDate
  );

  // --- Actions ---

  const handleAddFood = (meal) => {
    setNewFood({ ...newFood, date: selectedFoodDate, meal });
    setShowFoodForm(true);
  };

  const handleEditFood = (food) => {
    setNewFood({
        ...food,
        calories: food.calories.toString(),
        protein: food.protein.toString(),
        carbs: food.carbs.toString(),
        fat: food.fat.toString(),
        fiber: food.fiber?.toString() || '0'
    });
    setEditingFoodId(food.id);
    setShowFoodForm(true);
  };

  const handleSmartAdd = (suggestion) => {
    setNewFood({
      date: selectedFoodDate,
      meal: 'Snack', // Default slot, user can change
      name: suggestion.name,
      calories: suggestion.calories.toString(),
      protein: suggestion.protein.toString(),
      carbs: suggestion.carbs.toString(),
      fat: suggestion.fat.toString(),
      fiber: suggestion.fiber?.toString() || '0'
    });
    setShowFoodForm(true);
  };

  // --- Calculations (Hoisted Hooks) ---

  // 1. Smart Compass Logic
  const compassData = useMemo(() => {
    const totals = getTotalsForDate(selectedFoodDate);
    const rawTargets = getTargetsForDate(selectedFoodDate);
    // Safety fallback to prevent crash if targets are missing
    const targets = rawTargets || { calories: 2000, protein: 150, carbs: 200, fat: 70 };

    const textRemaining = {
      calories: targets.calories - totals.calories,
      protein: targets.protein - totals.protein,
      carbs: targets.carbs - totals.carbs,
      fat: targets.fat - totals.fat
    };

    // Only show if we have gaps to fill (e.g. at least 200 kcal left)
    const show = textRemaining.calories >= 200;


    return { remaining: textRemaining, show };
  }, [selectedFoodDate, getTotalsForDate, getTargetsForDate]);

  // 2. Grouped Foods Logic
  const groupedMeals = useMemo(() => {
    if (!hasFoods) return [];

    const MEAL_ORDER = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'];

    const groups = foods.reduce((acc, food) => {
      let meal = (food.meal || 'Snack').trim();
      const normalizedMeal = MEAL_ORDER.find(m => m.toLowerCase() === meal.toLowerCase()) || 'Snack';

      if (!acc[normalizedMeal]) acc[normalizedMeal] = { items: [], totalCalories: 0 };

      acc[normalizedMeal].items.push(food);
      acc[normalizedMeal].totalCalories += (parseInt(food.calories) || 0);
      return acc;
    }, {});

    return MEAL_ORDER.map(mealType => {
      const group = groups[mealType] || { items: [], totalCalories: 0 };
      return {
        type: mealType,
        items: group.items,
        calories: group.totalCalories
      };
    });
  }, [foods, hasFoods]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Date Navigator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diario</h1>
          <p className="text-sm text-gray-500">Registro de alimentos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFoodDate(changeDate(selectedFoodDate, -1))}
            className="w-10 h-10 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={selectedFoodDate}
            onChange={(e) => setSelectedFoodDate(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-base flex-1 min-w-0 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
          <button
            onClick={() => setSelectedFoodDate(changeDate(selectedFoodDate, 1))}
            disabled={selectedFoodDate >= getArgentinaDateString()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedFoodDate >= getArgentinaDateString() ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-400 hover:text-blue-500'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fast-Log Carousel */}
      <FastLogCarousel
        frequentFoods={frequentFoods}
        frequentCombos={frequentCombos}
        onQuickLog={quickLog}
      />

      {/* Protein Pacing Timeline */}
      <ProteinTimeline
        slots={proteinPacing.slots}
        remaining={proteinPacing.remainingProtein}
        targetProtein={proteinPacing.targetProtein}
      />

      {/* Feature 1: Smart Meal Compass */}
      {compassData.show && (
        <MealCompassWrapper
          foodLog={foodLog}
          remaining={compassData.remaining}
          onAdd={handleSmartAdd}
        />
      )}

      {/* Hydration Intelligence Module */}
      <HydrationGuard
        currentIntake={getWaterForDate(selectedFoodDate).ml || 0}
        hydrationTarget={hydrationTarget}
        onAddWater={addWaterGlass}
      />

      {/* Swipe hint */}
      {hasFoods && (
        <p className="text-xs text-gray-500 text-center">← Desliza para eliminar</p>
      )}

      {!hasFoods ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍽️</span>
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-1">Sin comidas registradas</h3>
          <p className="text-gray-500 text-sm">Registra tu primera comida del día.</p>
          <button
            onClick={() => handleAddFood('Desayuno')}
            className="mt-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            Registrar Comida
          </button>
        </div>
      ) : (
      <div className="space-y-6 pb-24">
        {/* Grouped Foods List */}
        {groupedMeals.map(group => (
          <MealSection
            key={group.type}
            title={group.type}
            foods={group.items}
            totals={{ calories: group.calories }}
            onAddFood={() => handleAddFood(group.type)}
            onEditFood={handleEditFood}
            onDeleteFood={(food) => confirmDelete('food', food.id, food.name)}
          />
        ))}
      </div>
      )}

      {/* Sticky Day Summary Footer */}
       {hasFoods && (
          <DaySummary
            totals={getTotalsForDate(selectedFoodDate)}
            targets={getTargetsForDate(selectedFoodDate) || { calories: 2000, protein: 150, carbs: 200, fat: 70 }}
          />
       )}
    </div>
  );
};

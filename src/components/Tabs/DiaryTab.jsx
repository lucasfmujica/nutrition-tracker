import { useMemo } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { useProteinPacing } from '../../hooks/useProteinPacing';
import { useSmartMealCompass } from '../../hooks/useSmartMealCompass';
// Date utils removed as they are now handled internally by LukenFitDatePicker
import { FastLogCarousel } from '../Dashboard/FastLogCarousel';
import { HydrationGuard } from '../Dashboard/HydrationGuard';
import { DaySummary } from '../Diary/DaySummary';
import { MealCompassCard } from '../Diary/MealCompassCard';
import { MealSection } from '../Diary/MealSection';
import { ProteinTimeline } from '../Diary/ProteinTimeline';
import { FoodCameraInput } from '../Food/FoodCameraInput';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

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
  const {
    frequentFoods,
    frequentCombos,
    quickLog,
    foodLog,
    customTargets,
    setShowSaveTemplateModal,
    setTemplateToSave,
    mealTemplates,
    deleteTemplate
  } = useTracker();

  const foods = getFoodsForDate(selectedFoodDate);
  const hasFoods = foods.length > 0;

  // Memoize favorite Map (name -> id) for toggle logic - HMR FORCE
  const favoriteMap = useMemo(() => {
    const map = new Map();
    mealTemplates.forEach(t => map.set(t.name.toLowerCase().trim(), t.id));
    return map;
  }, [mealTemplates]);

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



  const handleToggleFavorite = (food) => {
    const normalizedName = food.name.toLowerCase().trim();
    if (favoriteMap.has(normalizedName)) {
      // Remove from favorites
      const templateId = favoriteMap.get(normalizedName);
      deleteTemplate(templateId);
    } else {
      // Add to favorites
      setTemplateToSave({
        name: food.name,
        meal: food.meal || 'Snack',
        calories: parseInt(food.calories) || 0,
        protein: parseFloat(food.protein) || 0,
        carbs: parseFloat(food.carbs) || 0,
        fat: parseFloat(food.fat) || 0,
        description: food.description || ''
      });
      setShowSaveTemplateModal(true);
    }
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
    <div className="w-full space-y-6">
      {/* Date Navigator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diario</h1>
          <p className="text-sm text-gray-500">Registro de alimentos</p>
        </div>
        <div className="w-full md:w-auto">
          <LukenFitDatePicker
            selectedDate={selectedFoodDate}
            onChange={setSelectedFoodDate}
            label="Fecha"
          />
        </div>
      </div>

      {/* AI Meal Scanner - Quick Log */}
      <FoodCameraInput />

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
      <div className="space-y-4 pb-12">
        {/* Grouped Foods List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groupedMeals.map(group => (
            <MealSection
              key={group.type}
              title={group.type}
              foods={group.items}
              totals={{ calories: group.calories }}
              onAddFood={() => handleAddFood(group.type)}
              onEditFood={handleEditFood}
              onToggleFavorite={handleToggleFavorite}
              favoriteMap={favoriteMap}
              onDeleteFood={(food) => confirmDelete('food', food.id, food.name)}
            />
          ))}
        </div>

        {/* Sticky Day Summary - Now integrated closely */}
        <DaySummary
          totals={getTotalsForDate(selectedFoodDate)}
          targets={getTargetsForDate(selectedFoodDate) || { calories: 2000, protein: 150, carbs: 200, fat: 70 }}
        />
      </div>
      )}

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
    </div>
  );
};

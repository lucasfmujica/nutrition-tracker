import React, { useMemo } from 'react';
import { Search, ScanBarcode, Plus, Camera } from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';
import { useProteinPacing } from '../../hooks/useProteinPacing';
import { useSmartMealCompass } from '../../hooks/useSmartMealCompass';
import { FoodEntry, Macros, MealTemplate, WaterEntry } from '../../types/domain';
import {
    FastLogCarousel,
    FastLogCombo,
    FastLogFood,
} from '../Dashboard/FastLogCarousel';
import { HydrationGuard, HydrationTarget } from '../Dashboard/HydrationGuard';
import { DaySummary } from '../Diary/DaySummary';
import { CompassSuggestion, MealCompassCard } from '../Diary/MealCompassCard';
import { MealSection } from '../Diary/MealSection';
import { ProteinTimeline } from '../Diary/ProteinTimeline';
import { WeeklyCalendarNav } from '../Diary/WeeklyCalendarNav';
import { FoodCameraInput } from '../Food/FoodCameraInput';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface MealCompassWrapperProps {
    foodLog: FoodEntry[];
    remaining: Macros;
    onAdd: (suggestion: CompassSuggestion) => void;
}

const MealCompassWrapper: React.FC<MealCompassWrapperProps> = ({
    foodLog,
    remaining,
    onAdd,
}) => {
    const suggestions = useSmartMealCompass(foodLog, remaining);
    return (
        <MealCompassCard
            suggestions={suggestions as CompassSuggestion[]}
            onSelect={onAdd}
        />
    );
};

interface DiaryTabProps {
    // Date state
    selectedFoodDate: string;
    setSelectedFoodDate: (date: string) => void;
    changeDate: (days: number) => void;

    // Data access
    getFoodsForDate: (date: string) => FoodEntry[];
    getTotalsForDate: (date: string) => Macros;
    getTargetsForDate: (date: string) => Macros | null;
    getWaterForDate: (date: string) => {
        ml: number;
        glasses: number;
        entries: WaterEntry[];
    };
    hydrationTarget: HydrationTarget;
    addWaterGlass: (date: string) => void;

    // Actions
    confirmDelete: (type: string, id: string, name: string) => void;

    // Form state handling
    newFood: any;
    setNewFood: (food: any) => void;
    setShowFoodForm: (show: boolean) => void;
    setEditingFoodId: (id: string | null) => void;
}

export const DiaryTab: React.FC<DiaryTabProps> = ({
    selectedFoodDate,
    setSelectedFoodDate,
    getFoodsForDate,
    getTotalsForDate,
    getTargetsForDate,
    getWaterForDate,
    hydrationTarget,
    addWaterGlass,
    confirmDelete,
    newFood,
    setNewFood,
    setShowFoodForm,
    setEditingFoodId,
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
        deleteTemplate,
        setShowFoodSearchModal,
        setShowBarcodeModal,
        setShowFoodScanModal,
    } = useTracker() as any;

    const foods = getFoodsForDate(selectedFoodDate);
    const hasFoods = foods.length > 0;

    const favoriteMap = useMemo(() => {
        const map = new Map<string, string>();
        (mealTemplates as MealTemplate[]).forEach((t) =>
            map.set(t.name.toLowerCase().trim(), t.id),
        );
        return map;
    }, [mealTemplates]);

    const proteinPacing = useProteinPacing(
        foodLog,
        customTargets?.protein,
        selectedFoodDate,
    );

    const handleAddFood = (meal: string) => {
        setNewFood({ ...newFood, date: selectedFoodDate, meal });
        setShowFoodForm(true);
    };

    const handleEditFood = (food: FoodEntry) => {
        setNewFood({
            ...food,
            calories: food.calories.toString(),
            protein: food.protein.toString(),
            carbs: food.carbs.toString(),
            fat: food.fat.toString(),
            fiber: food.fiber?.toString() || '0',
        });
        setEditingFoodId(food.id);
        setShowFoodForm(true);
    };

    const handleSmartAdd = (suggestion: CompassSuggestion) => {
        setNewFood({
            date: selectedFoodDate,
            meal: 'Snack',
            name: suggestion.name,
            calories: suggestion.calories.toString(),
            protein: suggestion.protein.toString(),
            carbs: suggestion.carbs.toString(),
            fat: suggestion.fat.toString(),
            fiber: suggestion.fiber?.toString() || '0',
        });
        setShowFoodForm(true);
    };

    const handleToggleFavorite = (food: FoodEntry) => {
        const normalizedName = food.name.toLowerCase().trim();
        if (favoriteMap.has(normalizedName)) {
            const templateId = favoriteMap.get(normalizedName);
            if (templateId) deleteTemplate(templateId);
        } else {
            setTemplateToSave({
                name: food.name,
                meal: food.meal || 'Snack',
                calories: food.calories || 0,
                protein: food.protein || 0,
                carbs: food.carbs || 0,
                fat: food.fat || 0,
                description: food.description || '',
            });
            setShowSaveTemplateModal(true);
        }
    };

    const compassData = useMemo(() => {
        const totals = getTotalsForDate(selectedFoodDate);
        const rawTargets = getTargetsForDate(selectedFoodDate);
        const targets = rawTargets || {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 70,
            fiber: 25,
        };

        const textRemaining: Macros = {
            calories: targets.calories - totals.calories,
            protein: targets.protein - (totals.protein || 0),
            carbs: targets.carbs - (totals.carbs || 0),
            fat: targets.fat - (totals.fat || 0),
            fiber: (targets.fiber || 0) - (totals.fiber || 0),
        };

        const show = textRemaining.calories >= 200;
        return { remaining: textRemaining, show };
    }, [selectedFoodDate, getTotalsForDate, getTargetsForDate]);

    const groupedMeals = useMemo(() => {
        if (!hasFoods) return [];

        const MEAL_ORDER = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'];

        const groups = foods.reduce((acc: any, food) => {
            let meal = (food.meal || 'Snack').trim();
            const normalizedMeal =
                MEAL_ORDER.find((m) => m.toLowerCase() === meal.toLowerCase()) ||
                'Snack';

            if (!acc[normalizedMeal])
                acc[normalizedMeal] = { items: [], totalCalories: 0 };

            acc[normalizedMeal].items.push(food);
            acc[normalizedMeal].totalCalories += food.calories || 0;
            return acc;
        }, {});

        return MEAL_ORDER.map((mealType) => {
            const group = groups[mealType] || { items: [], totalCalories: 0 };
            return {
                type: mealType,
                items: group.items,
                calories: group.totalCalories,
            };
        });
    }, [foods, hasFoods]);

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Diario</h1>
                        <p className="text-sm text-gray-500">Registro de alimentos</p>
                    </div>
                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFoodSearchModal(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200 transition-colors"
                            title="Buscar alimento"
                        >
                            <Search size={20} />
                        </button>
                        <button
                            onClick={() => setShowBarcodeModal(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:bg-emerald-200 transition-colors"
                            title="Escanear código de barras"
                        >
                            <ScanBarcode size={20} />
                        </button>
                        <button
                            onClick={() => setShowFoodScanModal(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 active:bg-purple-200 transition-colors"
                            title="Escanear con cámara AI"
                        >
                            <Camera size={20} />
                        </button>
                        <button
                            onClick={() => handleAddFood('Almuerzo')}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors"
                            title="Agregar manualmente"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
                <div className="w-full md:w-auto hidden md:block">
                    <LukenFitDatePicker
                        selectedDate={selectedFoodDate}
                        onChange={setSelectedFoodDate}
                        label="Fecha"
                    />
                </div>
            </div>

            {/* Weekly Calendar Navigation */}
            <WeeklyCalendarNav
                selectedDate={selectedFoodDate}
                onDateSelect={setSelectedFoodDate}
                getFoodsForDate={getFoodsForDate}
                getTargetsForDate={getTargetsForDate}
            />

            <FoodCameraInput />

            {!hasFoods ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🍽️</span>
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mb-1">
                        Sin comidas registradas
                    </h3>
                    <p className="text-gray-500 text-sm">
                        Registra tu primera comida del día.
                    </p>
                    <button
                        onClick={() => handleAddFood('Desayuno')}
                        className="mt-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                        Registrar Comida
                    </button>
                </div>
            ) : (
                <div className="space-y-4 pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {groupedMeals.map((group) => (
                            <MealSection
                                key={group.type}
                                title={group.type}
                                foods={group.items}
                                totals={{ calories: group.calories }}
                                onAddFood={() => handleAddFood(group.type)}
                                onEditFood={handleEditFood}
                                onToggleFavorite={handleToggleFavorite}
                                favoriteMap={favoriteMap}
                                onDeleteFood={(food) =>
                                    confirmDelete('food', food.id, food.name)
                                }
                            />
                        ))}
                    </div>

                    <DaySummary
                        totals={getTotalsForDate(selectedFoodDate)}
                        targets={
                            getTargetsForDate(selectedFoodDate) || {
                                calories: 2000,
                                protein: 150,
                                carbs: 200,
                                fat: 70,
                                fiber: 25,
                            }
                        }
                    />
                </div>
            )}

            <FastLogCarousel
                frequentFoods={frequentFoods as FastLogFood[]}
                frequentCombos={frequentCombos as FastLogCombo[]}
                onQuickLog={quickLog}
            />

            <ProteinTimeline
                slots={proteinPacing.slots}
                remaining={proteinPacing.remainingProtein}
                targetProtein={proteinPacing.targetProtein}
            />

            {compassData.show && (
                <MealCompassWrapper
                    foodLog={foodLog}
                    remaining={compassData.remaining}
                    onAdd={handleSmartAdd}
                />
            )}

            <HydrationGuard
                currentIntake={getWaterForDate(selectedFoodDate).ml || 0}
                hydrationTarget={hydrationTarget}
            />

            {hasFoods && (
                <p className="text-xs text-gray-500 text-center">
                    ← Desliza para eliminar
                </p>
            )}
        </div>
    );
};

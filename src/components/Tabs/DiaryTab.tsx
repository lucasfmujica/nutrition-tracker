import {
    Clock,
    Drumstick,
    Plus,
    ScanBarcode,
    Search,
    UtensilsCrossed,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIMeals } from '../../context/AIMealSuggestionsContext';
import { useTracker } from '../../context/TrackerContext';
import { useMealTimeStats } from '../../hooks/useMealTimeStats';
import { useProteinPacing } from '../../hooks/useProteinPacing';
import { useSmartMealType } from '../../hooks/useSmartMealType';
import { FoodEntry, Macros, MealTemplate, WaterEntry } from '../../types/domain';
import { getCurrentTimeString } from '../../utils/dateUtils';
import { detectMealInconsistencies } from '../../utils/mealTimeValidation';
import { HydrationGuard, HydrationTarget } from '../Dashboard/HydrationGuard';
import { DaySummary } from '../Diary/DaySummary';
import { MealInconsistencyCard } from '../Diary/MealInconsistencyCard';
import { MealSection } from '../Diary/MealSection';
import { MealTimeStatsCard } from '../Diary/MealTimeStatsCard';
import { ProteinTimeline } from '../Diary/ProteinTimeline';
import { WeeklyCalendarNav } from '../Diary/WeeklyCalendarNav';
import { WeeklyMealPlanView } from '../Diary/WeeklyMealPlanView';
import { FoodCameraInput } from '../Food/FoodCameraInput';
import { EmptyState } from '../UI/EmptyState';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

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
    removeWaterGlass: (date: string) => void;

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
    removeWaterGlass,
    confirmDelete,
    newFood,
    setNewFood,
    setShowFoodForm,
    setEditingFoodId,
}) => {
    const { t } = useTranslation();
    const {
        foodLog,
        customTargets,
        setShowSaveTemplateModal,
        setTemplateToSave,
        mealTemplates,
        deleteTemplate,
        quickSaveTemplate,
        getFoodTemplate,
        setShowFoodSearchModal,
        setShowBarcodeModal,
        setShowFoodScanModal,
        setShowFoodHistoryPanel,
        saveFoodEntry,
        openSaveComboModal,
        isLoading,
    } = useTracker() as any;
    const { getSuggestions } = useAIMeals();

    const { getAutoMealType } = useSmartMealType();

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

    const mealTimeStats = useMealTimeStats(foodLog);
    const inconsistencies = useMemo(
        () => detectMealInconsistencies(foods),
        [foods],
    );

    const handleAddFood = (meal: string) => {
        setNewFood({ ...newFood, date: selectedFoodDate, meal });
        setShowFoodForm(true);
    };

    const handleAddFoodForDate = (date: string, meal: string) => {
        setSelectedFoodDate(date);
        setNewFood({ ...newFood, date, meal });
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

    const handleToggleFavorite = (food: FoodEntry) => {
        // Check if food matches an existing template
        const existingTemplate = getFoodTemplate(food);

        if (existingTemplate) {
            // Already favorited - remove it
            deleteTemplate(existingTemplate.id);
        } else {
            // Not favorited - quick save without modal
            quickSaveTemplate(food);
        }
    };

    const handleDuplicateFood = async (food: FoodEntry) => {
        const duplicatedEntry: FoodEntry = {
            ...food,
            id: crypto.randomUUID(),
            date: selectedFoodDate,
            time: getCurrentTimeString(),
            meal: getAutoMealType(),
        };

        try {
            await saveFoodEntry(duplicatedEntry);
        } catch (err) {
            console.error('[DiaryTab] Error duplicating food:', err);
        }
    };

    const groupedMeals = useMemo(() => {
        if (!hasFoods) return [];

        const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

        const groups = foods.reduce((acc: any, food) => {
            let meal = (food.meal || 'other').trim();
            const normalizedMeal =
                MEAL_ORDER.find((m) => m.toLowerCase() === meal.toLowerCase()) ||
                'other';

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
                        <h1 className="text-2xl font-bold text-text-primary">
                            {t('diary.title')}
                        </h1>
                        <p className="text-sm text-text-tertiary">
                            {t('diary.subtitle')}
                        </p>
                    </div>
                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFoodHistoryPanel(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 active:bg-indigo-200 dark:active:bg-indigo-700/50 transition-colors"
                            title={t('diary.quickActions.history')}>
                            <Clock size={20} />
                        </button>
                        <button
                            onClick={() => setShowFoodSearchModal(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 active:bg-blue-200 dark:active:bg-blue-700/50 transition-colors"
                            title={t('diary.quickActions.search')}>
                            <Search size={20} />
                        </button>
                        <button
                            onClick={() => setShowBarcodeModal(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 active:bg-emerald-200 dark:active:bg-emerald-700/50 transition-colors"
                            title={t('diary.quickActions.barcode')}>
                            <ScanBarcode size={20} />
                        </button>
                        <button
                            onClick={() => setShowFoodScanModal(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/40 active:bg-purple-200 dark:active:bg-purple-700/50 transition-colors"
                            title={t('diary.quickActions.camera')}>
                            <Drumstick size={20} />
                        </button>
                        <button
                            onClick={() => handleAddFood('lunch')}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-lighter text-text-secondary hover:bg-surface-lighter active:bg-surface-lighter transition-colors"
                            title={t('diary.quickActions.manual')}>
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
                <div className="w-full md:w-auto hidden md:block">
                    <LukenFitDatePicker
                        selectedDate={selectedFoodDate}
                        onChange={setSelectedFoodDate}
                        label={t('weight.date')}
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

            {/* Weekly Meal Plan View - Shows meals in a grid format */}
            <WeeklyMealPlanView
                selectedDate={selectedFoodDate}
                onDateSelect={setSelectedFoodDate}
                getFoodsForDate={getFoodsForDate}
                getTargetsForDate={getTargetsForDate}
                onAddFood={handleAddFoodForDate}
            />

            <FoodCameraInput />

            {!hasFoods ? (
                !isLoading && (
                    <div className="bg-surface rounded-2xl border border-border shadow-sm">
                        <EmptyState
                            icon={UtensilsCrossed}
                            title={t('diary.noFoods.title')}
                            description={t('diary.noFoods.subtitle')}
                            actionLabel={t('diary.noFoods.button')}
                            onAction={() => handleAddFood('breakfast')}
                        />
                    </div>
                )
            ) : (
                <div className="space-y-4 pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {groupedMeals.map((group) => {
                            return (
                                <MealSection
                                    key={group.type}
                                    title={group.type}
                                    foods={group.items}
                                    totals={{ calories: group.calories }}
                                    onAddFood={() => handleAddFood(group.type)}
                                    onEditFood={handleEditFood}
                                    onToggleFavorite={handleToggleFavorite}
                                    onDuplicateFood={handleDuplicateFood}
                                    favoriteMap={favoriteMap}
                                    onDeleteFood={(food) =>
                                        confirmDelete('food', food.id, food.name)
                                    }
                                    onCreateCombo={openSaveComboModal}
                                />
                            );
                        })}
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
                        onSuggestMeal={() => {
                            const currentTotals = getTotalsForDate(selectedFoodDate);
                            const currentTargets = getTargetsForDate(
                                selectedFoodDate,
                            ) || {
                                calories: 2000,
                                protein: 150,
                                carbs: 200,
                                fat: 70,
                                fiber: 25,
                            };
                            const remaining = {
                                calories:
                                    currentTargets.calories - currentTotals.calories,
                                protein:
                                    currentTargets.protein - currentTotals.protein,
                                carbs: currentTargets.carbs - currentTotals.carbs,
                                fat: currentTargets.fat - currentTotals.fat,
                                fiber:
                                    (currentTargets.fiber || 0) -
                                    (currentTotals.fiber || 0),
                            };
                            getSuggestions(remaining);
                        }}
                    />
                </div>
            )}

            <HydrationGuard
                currentIntake={getWaterForDate(selectedFoodDate).ml || 0}
                hydrationTarget={hydrationTarget}
                onAddWater={() => addWaterGlass(selectedFoodDate)}
                onRemoveWater={() => removeWaterGlass(selectedFoodDate)}
            />

            <ProteinTimeline
                slots={proteinPacing.slots}
                remaining={proteinPacing.remainingProtein}
                targetProtein={proteinPacing.targetProtein}
            />

            <MealTimeStatsCard stats={mealTimeStats} />

            <MealInconsistencyCard inconsistencies={inconsistencies} />

            {hasFoods && (
                <p className="text-xs text-text-tertiary text-center">
                    {t('diary.swipeHint')}
                </p>
            )}
        </div>
    );
};

import { UtensilsCrossed } from 'lucide-react';
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
import { DiaryHeader } from '../Diary/DiaryHeader';
import { groupMealsByType } from '../Diary/groupMeals';
import { MealInconsistencyCard } from '../Diary/MealInconsistencyCard';
import { MealSection } from '../Diary/MealSection';
import { MealTimeStatsCard } from '../Diary/MealTimeStatsCard';
import { ProteinTimeline } from '../Diary/ProteinTimeline';
import { WeeklyCalendarNav } from '../Diary/WeeklyCalendarNav';
import { WeeklyMealPlanView } from '../Diary/WeeklyMealPlanView';
import { FoodCameraInput } from '../Food/FoodCameraInput';
import { EmptyState } from '../UI/EmptyState';

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

    const groupedMeals = useMemo(() => groupMealsByType(foods), [foods]);

    return (
        <div className="w-full space-y-6">
            <DiaryHeader
                selectedFoodDate={selectedFoodDate}
                setSelectedFoodDate={setSelectedFoodDate}
                onOpenHistory={() => setShowFoodHistoryPanel(true)}
                onOpenSearch={() => setShowFoodSearchModal(true)}
                onOpenBarcode={() => setShowBarcodeModal(true)}
                onOpenScan={() => setShowFoodScanModal(true)}
                onAddManual={() => handleAddFood('lunch')}
            />

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
                    <div className="bg-surface rounded-card border border-border shadow-card">
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

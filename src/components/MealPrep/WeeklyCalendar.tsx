import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Copy,
    ChevronDown,
    ChevronUp,
    Trash2,
    Check,
} from 'lucide-react';
import { useMealPrepPlan, PlannedMealItem } from '../../hooks/useMealPrepPlan';
import { AddMealModal } from './AddMealModal';

interface WeeklyCalendarProps {
    userId: string;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

/**
 * WeeklyCalendar - Mobile-optimized weekly meal prep calendar
 *
 * Features:
 * - Navigate between weeks (previous/next/current)
 * - Accordion view by day (7 cards)
 * - Grid view for meal types (breakfast/lunch/dinner/snack)
 * - Checkboxes to mark meals as completed
 * - Add meals from templates or manually
 * - "Repeat this week" button to copy plan to next week
 *
 * Mobile-First:
 * - Touch-friendly buttons (min 44x44px)
 * - Swipe-friendly cards
 * - Clear typography and spacing
 */
export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ userId }) => {
    const { t } = useTranslation();
    const {
        weekPlan,
        isLoading,
        error,
        currentWeekStart,
        addMealToPlan,
        removeMealFromPlan,
        toggleCompleted,
        repeatCurrentWeek,
        goToPreviousWeek,
        goToNextWeek,
        goToCurrentWeek,
    } = useMealPrepPlan(userId);

    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
    const [isRepeating, setIsRepeating] = useState(false);
    const [addMealModal, setAddMealModal] = useState<{
        isOpen: boolean;
        date: string;
        mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    }>({ isOpen: false, date: '', mealType: 'breakfast' });

    // Generate 7 days (Mon-Sun) from currentWeekStart
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

    const toggleDay = (date: string) => {
        setExpandedDays((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(date)) {
                newSet.delete(date);
            } else {
                newSet.add(date);
            }
            return newSet;
        });
    };

    const handleRepeatWeek = async () => {
        setIsRepeating(true);
        const success = await repeatCurrentWeek();
        setIsRepeating(false);

        if (success) {
            // Optionally show success message or navigate to next week
            goToNextWeek();
        }
    };

    const handleDeleteMeal = async (mealId: string) => {
        if (confirm(t('common.delete') + '?')) {
            await removeMealFromPlan(mealId);
        }
    };

    const isToday = (date: Date) => isSameDay(date, new Date());

    const handleOpenAddMeal = (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
        setAddMealModal({ isOpen: true, date, mealType });
    };

    const handleAddMeal = async (plannedItems: PlannedMealItem[], notes?: string) => {
        await addMealToPlan(addMealModal.date, addMealModal.mealType, plannedItems, notes);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header: Navigation + Repeat Button */}
            <div className="flex items-center justify-between gap-3">
                {/* Week Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousWeek}
                        className="p-2 rounded-xl bg-background-secondary hover:bg-accent/10 transition-colors"
                        aria-label="Previous week"
                    >
                        <ChevronLeft className="w-5 h-5 text-text-secondary" />
                    </button>

                    <button
                        onClick={goToCurrentWeek}
                        className="px-4 py-2 rounded-xl bg-background-secondary hover:bg-accent/10 transition-colors font-semibold text-sm text-text-primary"
                    >
                        {t('diary.calendar.today')}
                    </button>

                    <button
                        onClick={goToNextWeek}
                        className="p-2 rounded-xl bg-background-secondary hover:bg-accent/10 transition-colors"
                        aria-label="Next week"
                    >
                        <ChevronRight className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {/* Repeat Week Button */}
                <button
                    onClick={handleRepeatWeek}
                    disabled={isRepeating || Object.keys(weekPlan).length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Copy className="w-4 h-4" />
                    {isRepeating ? t('common.loading') : t('mealPrep.repeatWeek')}
                </button>
            </div>

            {/* Week Range Display */}
            <div className="text-center">
                <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
                    {format(weekDays[0], 'd MMM', { locale: es })} -{' '}
                    {format(weekDays[6], 'd MMM yyyy', { locale: es })}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-600 font-semibold">{error}</p>
                </div>
            )}

            {/* Day Cards (Accordion) */}
            <div className="space-y-3">
                {weekDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayMeals = weekPlan[dateStr] || [];
                    const isExpanded = expandedDays.has(dateStr);
                    const completedCount = dayMeals.filter((m) => m.is_completed).length;
                    const totalCount = dayMeals.length;

                    return (
                        <div
                            key={dateStr}
                            className={`rounded-2xl border-2 overflow-hidden transition-all ${
                                isToday(day)
                                    ? 'border-accent bg-accent/5'
                                    : 'border-border bg-background-secondary'
                            }`}
                        >
                            {/* Day Header (clickable to expand/collapse) */}
                            <button
                                onClick={() => toggleDay(dateStr)}
                                className="w-full flex items-center justify-between p-4 hover:bg-background/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-left">
                                        <h3 className="text-lg font-black text-text-primary">
                                            {format(day, 'EEEE', { locale: es })}
                                        </h3>
                                        <p className="text-xs text-text-tertiary font-medium">
                                            {format(day, 'd MMMM', { locale: es })}
                                        </p>
                                    </div>

                                    {isToday(day) && (
                                        <span className="px-2 py-1 rounded-lg bg-accent text-white text-xs font-bold uppercase">
                                            {t('diary.calendar.today')}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Meal Count */}
                                    {totalCount > 0 && (
                                        <span className="text-sm font-semibold text-text-secondary">
                                            {completedCount}/{totalCount}
                                        </span>
                                    )}

                                    {/* Expand/Collapse Icon */}
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-text-tertiary" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-text-tertiary" />
                                    )}
                                </div>
                            </button>

                            {/* Expanded Content: Meals Grid */}
                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-3 border-t border-border">
                                    {/* Meal Type Grid */}
                                    {MEAL_TYPES.map((mealType) => {
                                        const meals = dayMeals.filter((m) => m.meal_type === mealType);

                                        return (
                                            <div key={mealType} className="space-y-2">
                                                {/* Meal Type Header */}
                                                <div className="flex items-center justify-between pt-3">
                                                    <h4 className="text-xs font-black text-text-tertiary uppercase tracking-wider">
                                                        {t(`mealTypes.${mealType}`)}
                                                    </h4>

                                                    {/* Add Button */}
                                                    <button
                                                        onClick={() => handleOpenAddMeal(dateStr, mealType)}
                                                        className="p-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
                                                        aria-label={`Add ${mealType}`}
                                                    >
                                                        <Plus className="w-4 h-4 text-accent" />
                                                    </button>
                                                </div>

                                                {/* Meal Items */}
                                                {meals.length === 0 ? (
                                                    <p className="text-sm text-text-tertiary italic py-2">
                                                        {t('diary.noFoodsInMeal')}
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {meals.map((meal) => (
                                                            <div
                                                                key={meal.id}
                                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                                    meal.is_completed
                                                                        ? 'bg-green-500/5 border-green-500/20'
                                                                        : 'bg-background border-border'
                                                                }`}
                                                            >
                                                                {/* Checkbox */}
                                                                <button
                                                                    onClick={() =>
                                                                        toggleCompleted(meal.id, meal.is_completed)
                                                                    }
                                                                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                                        meal.is_completed
                                                                            ? 'bg-green-500 border-green-500'
                                                                            : 'border-border hover:border-accent'
                                                                    }`}
                                                                >
                                                                    {meal.is_completed && (
                                                                        <Check className="w-4 h-4 text-white" />
                                                                    )}
                                                                </button>

                                                                {/* Meal Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    {meal.planned_items.map((item, idx) => (
                                                                        <p
                                                                            key={idx}
                                                                            className={`text-sm font-semibold truncate ${
                                                                                meal.is_completed
                                                                                    ? 'text-text-tertiary line-through'
                                                                                    : 'text-text-primary'
                                                                            }`}
                                                                        >
                                                                            {item.name}
                                                                            {item.calories && (
                                                                                <span className="text-xs text-text-tertiary ml-2">
                                                                                    {item.calories} kcal
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                    ))}
                                                                    {meal.notes && (
                                                                        <p className="text-xs text-text-tertiary mt-1">
                                                                            {meal.notes}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Delete Button */}
                                                                <button
                                                                    onClick={() => handleDeleteMeal(meal.id)}
                                                                    className="flex-shrink-0 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                                                    aria-label="Delete meal"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Meal Modal */}
            <AddMealModal
                isOpen={addMealModal.isOpen}
                onClose={() => setAddMealModal({ ...addMealModal, isOpen: false })}
                onAdd={handleAddMeal}
                date={addMealModal.date}
                mealType={addMealModal.mealType}
            />
        </div>
    );
};

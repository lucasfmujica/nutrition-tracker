/**
 * WeeklyMealPlanView - Weekly meal grid showing what was eaten each day
 * Displays days as columns and meals (Desayuno, Almuerzo, Merienda, Cena) as rows
 */

import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus, Utensils } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FoodEntry, Macros } from '../../types/domain';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
} from '../../utils/dateUtils';

interface WeeklyMealPlanViewProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    getFoodsForDate: (date: string) => FoodEntry[];
    getTargetsForDate: (date: string) => Macros | null;
    onAddFood?: (date: string, meal: string) => void;
}

const MEAL_TYPES = [
    { id: 'breakfast', emoji: '🌅', labelKey: 'mealTypes.breakfast' },
    { id: 'lunch', emoji: '☀️', labelKey: 'mealTypes.lunch' },
    { id: 'dinner', emoji: '🌙', labelKey: 'mealTypes.dinner' },
    { id: 'snack', emoji: '🍵', labelKey: 'mealTypes.snack' },
];

const DAY_NAMES_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES_FULL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const WeeklyMealPlanView: React.FC<WeeklyMealPlanViewProps> = ({
    selectedDate,
    onDateSelect,
    getFoodsForDate,
    getTargetsForDate,
    onAddFood,
}) => {
    const { t, i18n } = useTranslation();
    const today = getArgentinaDateString();
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll today into view on mobile
    useEffect(() => {
        if (scrollContainerRef.current) {
            const todayElement =
                scrollContainerRef.current.querySelector('[data-today="true"]');
            if (todayElement) {
                // Check if we are on mobile (roughly)
                const isMobile = window.innerWidth < 768;
                if (isMobile) {
                    todayElement.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest',
                    });
                }
            }
        }
    }, [selectedDate]); // Re-run when date changes (e.g. week change)

    const dateLocale = i18n.language === 'es' ? es : enUS;

    // Calculate week data with foods organized by meal type
    const weekData = useMemo(() => {
        const monday = getMondayOfWeek(selectedDate);
        const days: Array<{
            date: string;
            dayNum: number;
            dayName: string;
            dayNameFull: string;
            isToday: boolean;
            isSelected: boolean;
            isFuture: boolean;
            meals: Record<string, FoodEntry[]>;
            totalCalories: number;
            targetCalories: number;
        }> = [];

        for (let i = 0; i < 7; i++) {
            const date = addDaysToDate(monday, i);
            const foods = getFoodsForDate(date);
            const targets = getTargetsForDate(date);
            const isFuture = date > today;

            // Group foods by meal type
            const meals: Record<string, FoodEntry[]> = {};
            MEAL_TYPES.forEach((m) => {
                meals[m.id] = foods.filter(
                    (f) => f.meal?.toLowerCase() === m.id.toLowerCase(),
                );
            });

            const totalCalories = foods.reduce(
                (sum, f) => sum + (f.calories || 0),
                0,
            );

            days.push({
                date,
                dayNum: parseInt(date.split('-')[2], 10),
                dayName: format(new Date(date + 'T12:00:00'), 'EEEEE', {
                    locale: dateLocale,
                }),
                dayNameFull: format(new Date(date + 'T12:00:00'), 'EEE', {
                    locale: dateLocale,
                }),
                isToday: date === today,
                isSelected: date === selectedDate,
                isFuture,
                meals,
                totalCalories,
                targetCalories: targets?.calories || 2000,
            });
        }

        return days;
    }, [selectedDate, getFoodsForDate, getTargetsForDate, today]);

    // Week navigation
    const goToPreviousWeek = () => {
        const newDate = addDaysToDate(selectedDate, -7);
        onDateSelect(newDate);
    };

    const goToNextWeek = () => {
        const newDate = addDaysToDate(selectedDate, 7);
        onDateSelect(newDate);
    };

    const goToToday = () => {
        onDateSelect(today);
    };

    // Format week range for display
    const weekRange = useMemo(() => {
        const monday = weekData[0];
        const sunday = weekData[6];
        const startMonth = format(new Date(monday.date + 'T12:00:00'), 'MMM', {
            locale: dateLocale,
        });
        const endMonth = format(new Date(sunday.date + 'T12:00:00'), 'MMM', {
            locale: dateLocale,
        });

        if (startMonth === endMonth) {
            return `${monday.dayNum} - ${sunday.dayNum} ${startMonth}`;
        }
        return `${monday.dayNum} ${startMonth} - ${sunday.dayNum} ${endMonth}`;
    }, [weekData, dateLocale]);

    return (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Week Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <button
                    onClick={goToPreviousWeek}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface/70 text-text-secondary transition-colors">
                    <ChevronLeft size={20} />
                </button>

                <div className="text-center flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <div>
                        <p className="text-sm font-bold text-text-primary capitalize">
                            {weekRange}
                        </p>
                        {selectedDate !== today && (
                            <button
                                onClick={goToToday}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                                {t('diary.calendar.goToToday')}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="ml-2 text-xs text-text-tertiary hover:text-text-secondary px-2 py-1 rounded bg-surface/50">
                        {isExpanded
                            ? t('diary.weeklyPlan.collapse')
                            : t('diary.weeklyPlan.expand')}
                    </button>
                </div>

                <button
                    onClick={goToNextWeek}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface/70 text-text-secondary transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Week Grid */}
            <div className="overflow-x-auto" ref={scrollContainerRef}>
                <table className="w-full min-w-[700px]">
                    {/* Day Headers */}
                    <thead>
                        <tr className="bg-background">
                            <th className="py-2 px-3 text-left text-xs font-bold text-text-tertiary uppercase tracking-wider w-24">
                                {t('diary.weeklyPlan.meal')}
                            </th>
                            {weekData.map((day) => (
                                <th
                                    key={day.date}
                                    onClick={() =>
                                        !day.isFuture && onDateSelect(day.date)
                                    }
                                    data-today={day.isToday}
                                    className={`py-2 px-2 text-center cursor-pointer transition-colors ${
                                        day.isSelected
                                            ? 'bg-blue-100 dark:bg-blue-900/50'
                                            : day.isToday
                                              ? 'bg-blue-50 dark:bg-blue-950'
                                              : day.isFuture
                                                ? 'bg-surface-lighter cursor-not-allowed'
                                                : 'hover:bg-surface-lighter'
                                    }`}>
                                    <div
                                        className={`text-xs font-bold ${day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-text-tertiary'}`}>
                                        {day.dayNameFull}
                                    </div>
                                    <div
                                        className={`text-lg font-bold ${
                                            day.isSelected
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-text-primary'
                                        }`}>
                                        {day.dayNum}
                                    </div>
                                    {!day.isFuture && (
                                        <div
                                            className={`text-[10px] font-medium ${
                                                day.totalCalories >
                                                day.targetCalories * 1.1
                                                    ? 'text-red-500 dark:text-red-400'
                                                    : day.totalCalories > 0
                                                      ? 'text-emerald-600 dark:text-emerald-400'
                                                      : 'text-text-tertiary'
                                            }`}>
                                            {day.totalCalories > 0
                                                ? `${day.totalCalories} kcal`
                                                : '—'}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Meal Rows */}
                    <tbody>
                        {MEAL_TYPES.map((mealType) => (
                            <tr
                                key={mealType.id}
                                className="border-t border-border">
                                <td className="py-2 px-3 bg-background">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">
                                            {mealType.emoji}
                                        </span>
                                        <span className="text-xs font-bold text-text-secondary">
                                            {t(mealType.labelKey!)}
                                        </span>
                                    </div>
                                </td>
                                {weekData.map((day) => {
                                    const mealFoods = day.meals[mealType.id] || [];
                                    const mealCalories = mealFoods.reduce(
                                        (sum, f) => sum + (f.calories || 0),
                                        0,
                                    );

                                    return (
                                        <td
                                            key={`${day.date}-${mealType.id}`}
                                            onClick={() =>
                                                !day.isFuture &&
                                                onDateSelect(day.date)
                                            }
                                            className={`py-1.5 px-1.5 align-top transition-colors ${
                                                day.isSelected
                                                    ? 'bg-blue-50/50 dark:bg-blue-950/50'
                                                    : day.isFuture
                                                      ? 'bg-background cursor-not-allowed'
                                                      : 'hover:bg-background cursor-pointer'
                                            }`}>
                                            {mealFoods.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {isExpanded ? (
                                                        // Expanded view - show food names
                                                        mealFoods
                                                            .slice(0, 3)
                                                            .map((food, idx) => (
                                                                <div
                                                                    key={food.id}
                                                                    className="text-[10px] text-text-secondary truncate px-1 py-0.5 bg-surface rounded border border-border"
                                                                    title={`${food.name} - ${food.calories} kcal`}>
                                                                    {food.name
                                                                        .length > 15
                                                                        ? food.name.substring(
                                                                              0,
                                                                              15,
                                                                          ) + '...'
                                                                        : food.name}
                                                                </div>
                                                            ))
                                                    ) : (
                                                        // Compact view - just show calorie count
                                                        <div className="text-xs font-medium text-text-secondary text-center py-1">
                                                            {mealCalories} kcal
                                                        </div>
                                                    )}
                                                    {isExpanded &&
                                                        mealFoods.length > 3 && (
                                                            <div className="text-[9px] text-text-tertiary text-center">
                                                                +
                                                                {mealFoods.length -
                                                                    3}{' '}
                                                                {t('common.more')}
                                                            </div>
                                                        )}
                                                </div>
                                            ) : !day.isFuture ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddFood?.(
                                                            day.date,
                                                            mealType.id,
                                                        );
                                                    }}
                                                    className="w-full flex items-center justify-center py-2 text-text-tertiary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors group">
                                                    <Plus
                                                        size={14}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    />
                                                </button>
                                            ) : (
                                                <div className="py-2 text-center text-text-tertiary">
                                                    —
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>

                    {/* Summary Row */}
                    <tfoot>
                        <tr className="border-t-2 border-border bg-background">
                            <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                    <Utensils size={14} className="text-text-tertiary" />
                                    <span className="text-xs font-bold text-text-secondary">
                                        {t('diary.weeklyPlan.total')}
                                    </span>
                                </div>
                            </td>
                            {weekData.map((day) => {
                                const percentOfTarget = Math.round(
                                    (day.totalCalories / day.targetCalories) * 100,
                                );
                                const isOver =
                                    day.totalCalories > day.targetCalories * 1.1;
                                const isUnder =
                                    day.totalCalories < day.targetCalories * 0.8 &&
                                    day.totalCalories > 0;

                                return (
                                    <td
                                        key={`total-${day.date}`}
                                        className={`py-2 px-2 text-center ${
                                            day.isSelected ? 'bg-blue-100/50 dark:bg-blue-900/30' : ''
                                        }`}>
                                        {!day.isFuture && day.totalCalories > 0 ? (
                                            <div>
                                                <div
                                                    className={`text-sm font-bold ${
                                                        isOver
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : isUnder
                                                              ? 'text-amber-600 dark:text-amber-400'
                                                              : 'text-emerald-600 dark:text-emerald-400'
                                                    }`}>
                                                    {day.totalCalories}
                                                </div>
                                                <div
                                                    className={`text-[10px] ${
                                                        isOver
                                                            ? 'text-red-500 dark:text-red-400'
                                                            : isUnder
                                                              ? 'text-amber-500 dark:text-amber-400'
                                                              : 'text-text-tertiary'
                                                    }`}>
                                                    {percentOfTarget}%
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-text-tertiary">—</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

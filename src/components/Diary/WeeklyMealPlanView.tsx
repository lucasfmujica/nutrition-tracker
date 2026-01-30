/**
 * WeeklyMealPlanView - Weekly meal grid showing what was eaten each day
 * Displays days as columns and meals (Desayuno, Almuerzo, Merienda, Cena) as rows
 */

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Utensils, Plus } from 'lucide-react';
import { getMondayOfWeek, addDaysToDate, getArgentinaDateString } from '../../utils/dateUtils';
import type { FoodEntry, Macros } from '../../types/domain';

interface WeeklyMealPlanViewProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    getFoodsForDate: (date: string) => FoodEntry[];
    getTargetsForDate: (date: string) => Macros | null;
    onAddFood?: (date: string, meal: string) => void;
}

const MEAL_TYPES = [
    { id: 'Desayuno', emoji: '🌅', label: 'Desayuno' },
    { id: 'Almuerzo', emoji: '☀️', label: 'Almuerzo' },
    { id: 'Merienda', emoji: '🍵', label: 'Merienda' },
    { id: 'Cena', emoji: '🌙', label: 'Cena' },
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
    const today = getArgentinaDateString();
    const [isExpanded, setIsExpanded] = useState(true);

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
                    (f) => f.meal?.toLowerCase() === m.id.toLowerCase()
                );
            });

            const totalCalories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);

            days.push({
                date,
                dayNum: parseInt(date.split('-')[2], 10),
                dayName: DAY_NAMES_SHORT[i],
                dayNameFull: DAY_NAMES_FULL[i],
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
        const startMonth = new Date(monday.date + 'T12:00:00').toLocaleDateString('es-AR', {
            month: 'short',
            timeZone: 'America/Argentina/Buenos_Aires',
        });
        const endMonth = new Date(sunday.date + 'T12:00:00').toLocaleDateString('es-AR', {
            month: 'short',
            timeZone: 'America/Argentina/Buenos_Aires',
        });

        if (startMonth === endMonth) {
            return `${monday.dayNum} - ${sunday.dayNum} ${startMonth}`;
        }
        return `${monday.dayNum} ${startMonth} - ${sunday.dayNum} ${endMonth}`;
    }, [weekData]);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Week Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <button
                    onClick={goToPreviousWeek}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/70 text-slate-600 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="text-center flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <div>
                        <p className="text-sm font-bold text-slate-900 capitalize">{weekRange}</p>
                        {selectedDate !== today && (
                            <button
                                onClick={goToToday}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Ir a hoy
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="ml-2 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded bg-white/50"
                    >
                        {isExpanded ? 'Compactar' : 'Expandir'}
                    </button>
                </div>

                <button
                    onClick={goToNextWeek}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/70 text-slate-600 transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Week Grid */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    {/* Day Headers */}
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="py-2 px-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
                                Comida
                            </th>
                            {weekData.map((day) => (
                                <th
                                    key={day.date}
                                    onClick={() => !day.isFuture && onDateSelect(day.date)}
                                    className={`py-2 px-2 text-center cursor-pointer transition-colors ${
                                        day.isSelected
                                            ? 'bg-blue-100'
                                            : day.isToday
                                                ? 'bg-blue-50'
                                                : day.isFuture
                                                    ? 'bg-slate-100 cursor-not-allowed'
                                                    : 'hover:bg-slate-100'
                                    }`}
                                >
                                    <div className={`text-xs font-bold ${day.isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {day.dayNameFull}
                                    </div>
                                    <div className={`text-lg font-bold ${
                                        day.isSelected ? 'text-blue-600' : 'text-slate-900'
                                    }`}>
                                        {day.dayNum}
                                    </div>
                                    {!day.isFuture && (
                                        <div className={`text-[10px] font-medium ${
                                            day.totalCalories > day.targetCalories * 1.1
                                                ? 'text-red-500'
                                                : day.totalCalories > 0
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-400'
                                        }`}>
                                            {day.totalCalories > 0 ? `${day.totalCalories} kcal` : '—'}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Meal Rows */}
                    <tbody>
                        {MEAL_TYPES.map((mealType) => (
                            <tr key={mealType.id} className="border-t border-slate-100">
                                <td className="py-2 px-3 bg-slate-50">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">{mealType.emoji}</span>
                                        <span className="text-xs font-bold text-slate-700">
                                            {mealType.label}
                                        </span>
                                    </div>
                                </td>
                                {weekData.map((day) => {
                                    const mealFoods = day.meals[mealType.id] || [];
                                    const mealCalories = mealFoods.reduce(
                                        (sum, f) => sum + (f.calories || 0),
                                        0
                                    );

                                    return (
                                        <td
                                            key={`${day.date}-${mealType.id}`}
                                            onClick={() => !day.isFuture && onDateSelect(day.date)}
                                            className={`py-1.5 px-1.5 align-top transition-colors ${
                                                day.isSelected
                                                    ? 'bg-blue-50/50'
                                                    : day.isFuture
                                                        ? 'bg-slate-50 cursor-not-allowed'
                                                        : 'hover:bg-slate-50 cursor-pointer'
                                            }`}
                                        >
                                            {mealFoods.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {isExpanded ? (
                                                        // Expanded view - show food names
                                                        mealFoods.slice(0, 3).map((food, idx) => (
                                                            <div
                                                                key={food.id}
                                                                className="text-[10px] text-slate-700 truncate px-1 py-0.5 bg-white rounded border border-slate-100"
                                                                title={`${food.name} - ${food.calories} kcal`}
                                                            >
                                                                {food.name.length > 15
                                                                    ? food.name.substring(0, 15) + '...'
                                                                    : food.name}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        // Compact view - just show calorie count
                                                        <div className="text-xs font-medium text-slate-600 text-center py-1">
                                                            {mealCalories} kcal
                                                        </div>
                                                    )}
                                                    {isExpanded && mealFoods.length > 3 && (
                                                        <div className="text-[9px] text-slate-400 text-center">
                                                            +{mealFoods.length - 3} más
                                                        </div>
                                                    )}
                                                </div>
                                            ) : !day.isFuture ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddFood?.(day.date, mealType.id);
                                                    }}
                                                    className="w-full flex items-center justify-center py-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors group"
                                                >
                                                    <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ) : (
                                                <div className="py-2 text-center text-slate-200">—</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>

                    {/* Summary Row */}
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                    <Utensils size={14} className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-700">Total</span>
                                </div>
                            </td>
                            {weekData.map((day) => {
                                const percentOfTarget = Math.round(
                                    (day.totalCalories / day.targetCalories) * 100
                                );
                                const isOver = day.totalCalories > day.targetCalories * 1.1;
                                const isUnder = day.totalCalories < day.targetCalories * 0.8 && day.totalCalories > 0;

                                return (
                                    <td
                                        key={`total-${day.date}`}
                                        className={`py-2 px-2 text-center ${
                                            day.isSelected ? 'bg-blue-100/50' : ''
                                        }`}
                                    >
                                        {!day.isFuture && day.totalCalories > 0 ? (
                                            <div>
                                                <div className={`text-sm font-bold ${
                                                    isOver
                                                        ? 'text-red-600'
                                                        : isUnder
                                                            ? 'text-amber-600'
                                                            : 'text-emerald-600'
                                                }`}>
                                                    {day.totalCalories}
                                                </div>
                                                <div className={`text-[10px] ${
                                                    isOver
                                                        ? 'text-red-500'
                                                        : isUnder
                                                            ? 'text-amber-500'
                                                            : 'text-slate-400'
                                                }`}>
                                                    {percentOfTarget}%
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">—</span>
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

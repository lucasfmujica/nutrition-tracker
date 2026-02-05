/**
 * WeeklyCalendarNav - Week view navigation for DiaryTab
 * Shows Mon-Sun with daily macro summaries and visual indicators
 */

import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Target,
    Utensils,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FoodEntry, Macros } from '../../types/domain';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
} from '../../utils/dateUtils';

interface WeeklyCalendarNavProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    getFoodsForDate: (date: string) => FoodEntry[];
    getTargetsForDate: (date: string) => Macros | null;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const WeeklyCalendarNav: React.FC<WeeklyCalendarNavProps> = ({
    selectedDate,
    onDateSelect,
    getFoodsForDate,
    getTargetsForDate,
}) => {
    const { t, i18n } = useTranslation();
    const today = getArgentinaDateString();

    const dateLocale = i18n.language === 'es' ? es : enUS;

    // Calculate week data
    const weekData = useMemo(() => {
        const monday = getMondayOfWeek(selectedDate);
        const days: Array<{
            date: string;
            dayNum: number;
            dayName: string;
            isToday: boolean;
            isSelected: boolean;
            isFuture: boolean;
            calories: number;
            targetCalories: number;
            hasFood: boolean;
            isOnTrack: boolean;
        }> = [];

        for (let i = 0; i < 7; i++) {
            const date = addDaysToDate(monday, i);
            const foods = getFoodsForDate(date);
            const targets = getTargetsForDate(date);
            const calories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
            const targetCalories = targets?.calories || 2000;
            const hasFood = foods.length > 0;
            const isFuture = date > today;

            // Consider "on track" if within 10% of target
            const isOnTrack =
                hasFood &&
                Math.abs(calories - targetCalories) <= targetCalories * 0.1;

            days.push({
                date,
                dayNum: parseInt(date.split('-')[2], 10),
                dayName: format(new Date(date + 'T12:00:00'), 'EEE', {
                    locale: dateLocale,
                }),
                isToday: date === today,
                isSelected: date === selectedDate,
                isFuture,
                calories,
                targetCalories,
                hasFood,
                isOnTrack,
            });
        }

        return days;
    }, [selectedDate, getFoodsForDate, getTargetsForDate, today, dateLocale]);

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
        // Use Javascript Date for display purposes, handling timezone offset roughly by fixing time
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
                <button
                    onClick={goToPreviousWeek}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-lighter text-text-secondary transition-colors">
                    <ChevronLeft size={20} />
                </button>

                <div className="text-center">
                    <p className="text-sm font-bold text-text-primary capitalize">
                        {weekRange}
                    </p>
                    {selectedDate !== today && (
                        <button
                            onClick={goToToday}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-0.5">
                            {t('diary.calendar.goToToday')}
                        </button>
                    )}
                </div>

                <button
                    onClick={goToNextWeek}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-lighter text-text-secondary transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 p-2">
                {weekData.map((day) => (
                    <DayCell
                        key={day.date}
                        day={day}
                        onSelect={() => onDateSelect(day.date)}
                    />
                ))}
            </div>
        </div>
    );
};

// Day cell sub-component
interface DayCellProps {
    day: {
        date: string;
        dayNum: number;
        dayName: string;
        isToday: boolean;
        isSelected: boolean;
        isFuture: boolean;
        calories: number;
        targetCalories: number;
        hasFood: boolean;
        isOnTrack: boolean;
    };
    onSelect: () => void;
}

const DayCell: React.FC<DayCellProps> = ({ day, onSelect }) => {
    const {
        dayNum,
        dayName,
        isToday,
        isSelected,
        isFuture,
        calories,
        targetCalories,
        hasFood,
        isOnTrack,
    } = day;

    // Calculate calorie progress percentage (capped at 100%)
    const progress = Math.min((calories / targetCalories) * 100, 100);

    // Determine status color
    const getStatusColor = () => {
        if (isFuture) return 'bg-surface-lighter';
        if (!hasFood) return 'bg-background';
        if (isOnTrack) return 'bg-emerald-50';
        if (calories > targetCalories * 1.1) return 'bg-red-50';
        return 'bg-amber-50';
    };

    const getBorderColor = () => {
        if (isSelected) return 'border-blue-500 ring-2 ring-blue-500/20';
        if (isToday) return 'border-blue-300';
        return 'border-transparent';
    };

    return (
        <button
            onClick={onSelect}
            disabled={isFuture}
            className={`
                relative flex flex-col items-center py-2 px-1 rounded-xl border-2 transition-all
                ${getStatusColor()}
                ${getBorderColor()}
                ${isFuture ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-lighter active:scale-95'}
            `}>
            {/* Day name */}
            <span
                className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-text-tertiary'}`}>
                {dayName}
            </span>

            {/* Day number */}
            <span
                className={`text-lg font-bold ${isSelected ? 'text-blue-600' : 'text-text-primary'}`}>
                {dayNum}
            </span>

            {/* Status indicator */}
            {!isFuture && (
                <div className="mt-1">
                    {hasFood ? (
                        isOnTrack ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                            <div className="flex items-center gap-0.5">
                                <Utensils size={10} className="text-text-tertiary" />
                                <span
                                    className={`text-[9px] font-bold ${
                                        calories > targetCalories
                                            ? 'text-red-500'
                                            : 'text-text-tertiary'
                                    }`}>
                                    {calories > 0
                                        ? Math.round(calories / 100) * 100
                                        : '-'}
                                </span>
                            </div>
                        )
                    ) : (
                        <span className="text-[10px] text-text-tertiary">—</span>
                    )}
                </div>
            )}

            {/* Progress bar */}
            {hasFood && !isFuture && (
                <div className="absolute bottom-0 left-1 right-1 h-1 bg-surface-lighter rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${
                            isOnTrack
                                ? 'bg-emerald-500'
                                : calories > targetCalories
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </button>
    );
};

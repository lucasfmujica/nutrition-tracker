import { useMemo } from 'react';
import { FoodEntry } from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

interface MealTimeStat {
    avgTime: string; // "HH:mm"
    count: number;   // entries with time data
}

export interface MealTimeStats {
    breakfast: MealTimeStat | null;
    lunch: MealTimeStat | null;
    snack: MealTimeStat | null;
    dinner: MealTimeStat | null;
    hasData: boolean;
}

const MIN_ENTRIES = 3;
const DAYS_BACK = 30;

/**
 * Convert HH:mm to minutes since midnight
 */
const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Convert minutes since midnight to HH:mm
 */
const minutesToTime = (mins: number): string => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.round(mins % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Hook to compute average meal times from food log
 * Looks at last 30 days, requires minimum 3 entries per meal type
 *
 * @param foodLog - Complete food log array
 * @returns MealTimeStats with averages per meal type
 */
export const useMealTimeStats = (foodLog: FoodEntry[]): MealTimeStats => {
    return useMemo(() => {
        const today = getArgentinaDateString();
        const cutoff = addDaysToDate(today, -DAYS_BACK);

        // Filter to last 30 days with non-null time
        const recent = foodLog.filter(
            (f) => f.date >= cutoff && f.date <= today && f.time,
        );

        const computeStat = (meal: string): MealTimeStat | null => {
            const entries = recent.filter((f) => f.meal === meal);
            if (entries.length < MIN_ENTRIES) return null;

            const totalMinutes = entries.reduce(
                (sum, f) => sum + timeToMinutes(f.time!),
                0,
            );
            const avgMinutes = totalMinutes / entries.length;

            return {
                avgTime: minutesToTime(avgMinutes),
                count: entries.length,
            };
        };

        const breakfast = computeStat('breakfast');
        const lunch = computeStat('lunch');
        const snack = computeStat('snack');
        const dinner = computeStat('dinner');

        return {
            breakfast,
            lunch,
            snack,
            dinner,
            hasData: !!(breakfast || lunch || snack || dinner),
        };
    }, [foodLog]);
};

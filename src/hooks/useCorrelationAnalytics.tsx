import { useMemo } from 'react';
import { FoodEntry, OuraEntry, Workout } from '../types/domain';
import { addDaysToDate } from '../utils/dateUtils';

interface CorrelationPoint {
    x: number;
    y: number;
    date: string;
}

export interface CorrelationAnalyticsData {
    fuelData: CorrelationPoint[];
    recoveryData: CorrelationPoint[];
    disciplineData: CorrelationPoint[];
}

/**
 * useCorrelationAnalytics - Uncovering hidden connections
 *
 * 1. Fuel Efficiency: Previous Day Carbs -> Workout Volume
 * 2. Recovery Cost: Workout Volume -> Next Night Deep Sleep
 * 3. Sleep Discipline: Sleep Score -> Dietary Adherence (Calories)
 */
export const useCorrelationAnalytics = (
    foodLog: FoodEntry[],
    workoutLog: Workout[],
    ouraLog: OuraEntry[],
): CorrelationAnalyticsData => {
    return useMemo(() => {
        // 1. Prepare Data Maps for O(1) lookup
        const foodMap = new Map<string, { carbs: number; calories: number }>();
        foodLog.forEach((f) => {
            if (!foodMap.has(f.date)) foodMap.set(f.date, { carbs: 0, calories: 0 });
            const day = foodMap.get(f.date)!;
            day.carbs += Number(f.carbs) || 0;
            day.calories += Number(f.calories) || 0;
        });

        const workoutMap = new Map<string, number>();
        workoutLog.forEach((w) => {
            // Simple volume metric: duration * RPE (if available) or just count/duration
            // For now, let's use Total Duration as a proxy for Volume/Load
            const vol = w.duration || 45;
            if (!workoutMap.has(w.date)) workoutMap.set(w.date, 0);
            workoutMap.set(w.date, workoutMap.get(w.date)! + vol);
        });

        const ouraMap = new Map<string, { score: number; deep: number }>();
        ouraLog.forEach((o) => {
            if (o.readinessScore) {
                // Ensure validity
                ouraMap.set(o.date, {
                    score: o.readinessScore,
                    deep: o.deepSleepMins || 0,
                });
            }
        });

        // 2. Generate Datasets
        const fuelData: CorrelationPoint[] = []; // Carbs (T-1) vs Volume (T)
        const recoveryData: CorrelationPoint[] = []; // Volume (T) vs Deep Sleep (T)
        const disciplineData: CorrelationPoint[] = []; // Sleep Score (T) -> Calories (T)

        const dates = new Set([
            ...foodMap.keys(),
            ...workoutMap.keys(),
            ...ouraMap.keys(),
        ]);

        dates.forEach((date) => {
            const yesterday = addDaysToDate(date, -1);
            const tomorrow = addDaysToDate(date, 1);

            // Correlation 1: Fuel (Carbs yesterday vs Workout today)
            const yesterdayCarbs = foodMap.get(yesterday)?.carbs;
            const todayVolume = workoutMap.get(date);
            if (
                yesterdayCarbs !== undefined &&
                yesterdayCarbs > 0 &&
                todayVolume !== undefined &&
                todayVolume > 0
            ) {
                fuelData.push({ x: yesterdayCarbs, y: todayVolume, date });
            }

            // Correlation 2: Strain (Workout today vs Deep Sleep tomorrow morning)
            const tomorrowSleep = ouraMap.get(tomorrow);
            if (
                todayVolume !== undefined &&
                todayVolume > 0 &&
                tomorrowSleep?.deep !== undefined &&
                tomorrowSleep.deep > 0
            ) {
                recoveryData.push({ x: todayVolume, y: tomorrowSleep.deep, date });
            }

            // Correlation 3: Discipline (Sleep Score today vs Calories today)
            const todaySleep = ouraMap.get(date);
            const todayCals = foodMap.get(date)?.calories;
            if (
                todaySleep?.score !== undefined &&
                todaySleep.score > 0 &&
                todayCals !== undefined &&
                todayCals > 0
            ) {
                disciplineData.push({ x: todaySleep.score, y: todayCals, date });
            }
        });

        return {
            fuelData: fuelData.slice(-30), // Last 30 points for relevance
            recoveryData: recoveryData.slice(-30),
            disciplineData: disciplineData.slice(-30),
        };
    }, [foodLog, workoutLog, ouraLog]);
};

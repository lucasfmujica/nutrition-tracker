import { useMemo } from 'react';
import {
    FoodEntry,
    OuraEntry,
    StepsEntry,
    WaterEntry,
    WeightEntry,
    Workout,
} from '../types/domain';
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
    metabolicData: CorrelationPoint[];
    activitySleepData: CorrelationPoint[];
    hydrationCardioData: CorrelationPoint[];
}

/**
 * useCorrelationAnalytics - Uncovering hidden connections
 *
 * 1. Fuel Efficiency: Previous Day Carbs -> Workout Volume
 * 2. Recovery Cost: Workout Volume -> Next Night Deep Sleep
 * 3. Sleep Discipline: Sleep Score -> Dietary Adherence (Calories)
 * 4. Metabolic Drift: 7d Avg Calories vs 7d Weight Delta
 * 5. Activity-Sleep: Daily Steps vs Sleep Score
 * 6. Hydration-Cardio: Water Intake vs HRV/RHR
 */
export const useCorrelationAnalytics = (
    foodLog: FoodEntry[],
    workoutLog: Workout[],
    ouraLog: OuraEntry[],
    weightHistory: WeightEntry[] = [],
    stepsLog: StepsEntry[] = [],
    waterLog: WaterEntry[] = [],
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
            const vol = w.duration || 45;
            if (!workoutMap.has(w.date)) workoutMap.set(w.date, 0);
            workoutMap.set(w.date, workoutMap.get(w.date)! + vol);
        });

        const ouraMap = new Map<
            string,
            { score: number; deep: number; hrv: number; rhr: number }
        >();
        ouraLog.forEach((o) => {
            if (o.readinessScore) {
                ouraMap.set(o.date, {
                    score: o.sleepScore || 0,
                    deep: o.deepSleepMins || 0,
                    hrv: o.hrv || 0,
                    rhr: o.restingHr || 0,
                });
            }
        });

        const stepsMap = new Map<string, number>();
        stepsLog.forEach((s) => stepsMap.set(s.date, s.steps));

        const waterMap = new Map<string, number>();
        waterLog.forEach((w) => waterMap.set(w.date, w.ml));

        const weightMap = new Map<string, number>();
        weightHistory.forEach((w) => weightMap.set(w.date, w.weight));

        // 2. Generate Datasets
        const fuelData: CorrelationPoint[] = []; // Carbs (T-1) vs Volume (T)
        const recoveryData: CorrelationPoint[] = []; // Volume (T) vs Deep Sleep (T)
        const disciplineData: CorrelationPoint[] = []; // Sleep Score (T) -> Calories (T)
        const metabolicData: CorrelationPoint[] = []; // 7d Avg Calories vs 7d Weight Delta
        const activitySleepData: CorrelationPoint[] = []; // Steps vs Sleep Score
        const hydrationCardioData: CorrelationPoint[] = []; // Water vs HRV

        const dates = Array.from(
            new Set([
                ...foodMap.keys(),
                ...workoutMap.keys(),
                ...ouraMap.keys(),
                ...stepsMap.keys(),
                ...weightMap.keys(),
            ]),
        ).sort();

        dates.forEach((date) => {
            const yesterday = addDaysToDate(date, -1);
            const tomorrow = addDaysToDate(date, 1);

            // Correlation 1: Fuel (Carbs yesterday vs Workout today)
            const yesterdayCarbs = foodMap.get(yesterday)?.carbs;
            const todayVolume = workoutMap.get(date);
            if (yesterdayCarbs && todayVolume) {
                fuelData.push({ x: yesterdayCarbs, y: todayVolume, date });
            }

            // Correlation 2: Strain (Workout today vs Deep Sleep tomorrow morning)
            const tomorrowSleep = ouraMap.get(tomorrow);
            if (todayVolume && tomorrowSleep?.deep) {
                recoveryData.push({ x: todayVolume, y: tomorrowSleep.deep, date });
            }

            // Correlation 3: Discipline (Sleep Score today vs Calories today)
            const todaySleep = ouraMap.get(date);
            const todayCals = foodMap.get(date)?.calories;
            if (todaySleep?.score && todayCals) {
                disciplineData.push({ x: todaySleep.score, y: todayCals, date });
            }

            // Correlation 4: Activity-Sleep (Steps today vs Sleep Score tomorrow)
            const todaySteps = stepsMap.get(date);
            if (todaySteps && tomorrowSleep?.score) {
                activitySleepData.push({
                    x: todaySteps,
                    y: tomorrowSleep.score,
                    date,
                });
            }

            // Correlation 5: Hydration-Cardio (Water today vs HRV tomorrow)
            const todayWater = waterMap.get(date);
            if (todayWater && tomorrowSleep?.hrv) {
                hydrationCardioData.push({
                    x: todayWater,
                    y: tomorrowSleep.hrv,
                    date,
                });
            }

            // Correlation 6: Metabolic (7d Calories -> 7d Weight Delta)
            const weightToday = weightMap.get(date);
            const weight7dAgo = weightMap.get(addDaysToDate(date, -7));
            if (weightToday && weight7dAgo) {
                // Calculate average calories for the week
                let weeklyCals = 0;
                let daysWithCals = 0;
                for (let i = 0; i < 7; i++) {
                    const d = addDaysToDate(date, -i);
                    const c = foodMap.get(d)?.calories;
                    if (c) {
                        weeklyCals += c;
                        daysWithCals++;
                    }
                }
                if (daysWithCals >= 5) {
                    // Minimum 5 days of data for metabolic relevance
                    const avgCals = weeklyCals / daysWithCals;
                    const delta = weightToday - weight7dAgo;
                    metabolicData.push({ x: avgCals, y: delta, date });
                }
            }
        });

        return {
            fuelData: fuelData.slice(-30),
            recoveryData: recoveryData.slice(-30),
            disciplineData: disciplineData.slice(-30),
            metabolicData: metabolicData.slice(-30),
            activitySleepData: activitySleepData.slice(-30),
            hydrationCardioData: hydrationCardioData.slice(-30),
        };
    }, [foodLog, workoutLog, ouraLog, weightHistory, stepsLog, waterLog]);
};

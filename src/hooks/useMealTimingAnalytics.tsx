import { useMemo } from 'react';
import { FoodEntry, OuraEntry, Workout } from '../types/domain';

interface MealTimingInsights {
    avgFirstMealTime: string; // "07:45"
    avgLastMealTime: string; // "21:15"
    avgEatingWindow: number; // hours
    ifDaysCount: number; // days with <10h window

    sleepImpact: {
        avgMealBedtimeGap: number; // hours
        lateEatingDays: number; // meals after 21:00
        sleepScoreCorrelation: number; // -1 to 1
    };

    workoutNutrition: {
        avgPreWorkoutCarbs: number;
        avgPostWorkoutProtein: number;
        workoutDaysWithData: number;
    };

    consistency: {
        breakfastVariance: number; // minutes std dev
        lunchVariance: number;
        dinnerVariance: number;
    };

    hasData: boolean;
}

/**
 * useMealTimingAnalytics - Analyzes meal timing patterns and correlations
 *
 * Provides insights into:
 * - Eating window (first to last meal)
 * - Sleep impact (meal timing vs bedtime)
 * - Workout nutrition timing
 * - Meal time consistency
 */
export const useMealTimingAnalytics = (
    foodLog: FoodEntry[],
    ouraLog: OuraEntry[],
    workouts: Workout[],
): MealTimingInsights => {
    return useMemo(() => {
        // Filter to last 30 days of data
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const last30DaysFoods = foodLog.filter((f) => f.date >= thirtyDaysAgoStr && f.time);
        const last30DaysOura = ouraLog.filter((o) => o.date >= thirtyDaysAgoStr);
        const last30DaysWorkouts = workouts.filter((w) => w.date >= thirtyDaysAgoStr);

        if (last30DaysFoods.length === 0) {
            return {
                avgFirstMealTime: '--:--',
                avgLastMealTime: '--:--',
                avgEatingWindow: 0,
                ifDaysCount: 0,
                sleepImpact: {
                    avgMealBedtimeGap: 0,
                    lateEatingDays: 0,
                    sleepScoreCorrelation: 0,
                },
                workoutNutrition: {
                    avgPreWorkoutCarbs: 0,
                    avgPostWorkoutProtein: 0,
                    workoutDaysWithData: 0,
                },
                consistency: {
                    breakfastVariance: 0,
                    lunchVariance: 0,
                    dinnerVariance: 0,
                },
                hasData: false,
            };
        }

        // 1. EATING WINDOW ANALYSIS
        const dailyWindows = new Map<string, { first: string; last: string }>();
        last30DaysFoods.forEach((f) => {
            if (!f.time) return;
            const existing = dailyWindows.get(f.date);
            if (!existing) {
                dailyWindows.set(f.date, { first: f.time, last: f.time });
            } else {
                if (f.time < existing.first) existing.first = f.time;
                if (f.time > existing.last) existing.last = f.time;
            }
        });

        const windows = Array.from(dailyWindows.values());
        const avgFirstMeal = calculateAvgTime(windows.map((w) => w.first));
        const avgLastMeal = calculateAvgTime(windows.map((w) => w.last));
        const avgWindow = calculateAvgHoursDiff(
            windows.map((w) => ({ first: w.first, last: w.last })),
        );
        const ifDays = windows.filter((w) => hoursDiff(w.first, w.last) < 10).length;

        // 2. SLEEP IMPACT ANALYSIS
        const mealSleepGaps: number[] = [];
        const sleepScores: number[] = [];
        const lateEatingDays = Array.from(dailyWindows.entries()).filter(([date, window]) => {
            const lastMealHour = parseInt(window.last.split(':')[0]);
            return lastMealHour >= 21;
        }).length;

        dailyWindows.forEach((window, date) => {
            const ouraDay = last30DaysOura.find((o) => o.date === date);
            if (ouraDay?.bedtime && ouraDay.sleepScore) {
                const gap = hoursDiff(window.last, ouraDay.bedtime);
                if (gap >= 0 && gap <= 8) {
                    // Valid gap (0-8 hours)
                    mealSleepGaps.push(gap);
                    sleepScores.push(ouraDay.sleepScore);
                }
            }
        });

        const avgMealBedtimeGap =
            mealSleepGaps.length > 0
                ? mealSleepGaps.reduce((a, b) => a + b, 0) / mealSleepGaps.length
                : 0;

        const sleepScoreCorrelation =
            mealSleepGaps.length >= 3
                ? calculateCorrelation(mealSleepGaps, sleepScores)
                : 0;

        // 3. WORKOUT NUTRITION ANALYSIS
        const preWorkoutCarbs: number[] = [];
        const postWorkoutProtein: number[] = [];

        last30DaysWorkouts.forEach((w) => {
            const dayMeals = last30DaysFoods.filter((f) => f.date === w.date);

            if (dayMeals.length > 0) {
                // Simplified: Average macros for workout days
                // In a real implementation, would check meal times relative to workout time
                const totalCarbs = dayMeals.reduce((sum, f) => sum + (f.carbs || 0), 0);
                const totalProtein = dayMeals.reduce((sum, f) => sum + (f.protein || 0), 0);

                if (totalCarbs > 0) preWorkoutCarbs.push(totalCarbs / dayMeals.length);
                if (totalProtein > 0) postWorkoutProtein.push(totalProtein / dayMeals.length);
            }
        });

        const avgPreWorkoutCarbs =
            preWorkoutCarbs.length > 0
                ? preWorkoutCarbs.reduce((a, b) => a + b, 0) / preWorkoutCarbs.length
                : 0;

        const avgPostWorkoutProtein =
            postWorkoutProtein.length > 0
                ? postWorkoutProtein.reduce((a, b) => a + b, 0) / postWorkoutProtein.length
                : 0;

        // 4. CONSISTENCY ANALYSIS
        const breakfastTimes = last30DaysFoods
            .filter((f) => f.meal === 'Desayuno' && f.time)
            .map((f) => f.time!);

        const lunchTimes = last30DaysFoods
            .filter((f) => f.meal === 'Almuerzo' && f.time)
            .map((f) => f.time!);

        const dinnerTimes = last30DaysFoods
            .filter((f) => f.meal === 'Cena' && f.time)
            .map((f) => f.time!);

        return {
            avgFirstMealTime: avgFirstMeal,
            avgLastMealTime: avgLastMeal,
            avgEatingWindow: avgWindow,
            ifDaysCount: ifDays,
            sleepImpact: {
                avgMealBedtimeGap,
                lateEatingDays,
                sleepScoreCorrelation,
            },
            workoutNutrition: {
                avgPreWorkoutCarbs,
                avgPostWorkoutProtein,
                workoutDaysWithData: preWorkoutCarbs.length,
            },
            consistency: {
                breakfastVariance: calculateTimeVariance(breakfastTimes),
                lunchVariance: calculateTimeVariance(lunchTimes),
                dinnerVariance: calculateTimeVariance(dinnerTimes),
            },
            hasData: true,
        };
    }, [foodLog, ouraLog, workouts]);
};

// ========== HELPER FUNCTIONS ==========

/**
 * Convert time strings (HH:mm) to average time
 */
function calculateAvgTime(times: string[]): string {
    if (times.length === 0) return '--:--';

    const totalMinutes = times.reduce((sum, time) => {
        const [h, m] = time.split(':').map(Number);
        return sum + h * 60 + m;
    }, 0);

    const avg = totalMinutes / times.length;
    const hours = Math.floor(avg / 60);
    const mins = Math.round(avg % 60);

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate hours difference between two time strings
 */
function hoursDiff(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);

    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);

    // Handle crossing midnight
    if (diff < 0) diff += 24 * 60;

    return diff / 60;
}

/**
 * Calculate average hours difference for eating windows
 */
function calculateAvgHoursDiff(windows: Array<{ first: string; last: string }>): number {
    if (windows.length === 0) return 0;

    const diffs = windows.map((w) => hoursDiff(w.first, w.last));
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

/**
 * Calculate time variance (standard deviation in minutes)
 */
function calculateTimeVariance(times: string[]): number {
    if (times.length === 0) return 0;

    const minutes = times.map((t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    });

    const avg = minutes.reduce((a, b) => a + b, 0) / minutes.length;
    const variance = minutes.reduce((sum, m) => sum + Math.pow(m - avg, 2), 0) / minutes.length;

    return Math.sqrt(variance); // Standard deviation in minutes
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const avgX = x.reduce((a, b) => a + b, 0) / n;
    const avgY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
        const dx = x[i] - avgX;
        const dy = y[i] - avgY;
        numerator += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    return denom === 0 ? 0 : numerator / denom;
}

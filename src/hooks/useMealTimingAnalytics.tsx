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
        lateNightCalories: number;
        deepSleepCorrelation: number;
        remSleepCorrelation: number;
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
    referenceDate: string,
): MealTimingInsights => {
    return useMemo(() => {
        // Filter to last 30 days relative to referenceDate
        const refDate = new Date(referenceDate);
        const thirtyDaysAgo = new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        // Filter range: [referenceDate - 30 days, referenceDate]
        // This ensures we don't show future data if the user goes back in time,
        // but we mainly care about the window leading UP to the current view.
        const last30DaysFoods = foodLog.filter(
            (f) => f.date >= thirtyDaysAgoStr && f.date <= referenceDate && f.time,
        );
        const last30DaysOura = ouraLog.filter(
            (o) => o.date >= thirtyDaysAgoStr && o.date <= referenceDate,
        );
        const last30DaysWorkouts = workouts.filter(
            (w) => w.date >= thirtyDaysAgoStr && w.date <= referenceDate,
        );

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
                    lateNightCalories: 0,
                    deepSleepCorrelation: 0,
                    remSleepCorrelation: 0,
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
        const deepSleepMins: number[] = [];
        const remSleepMins: number[] = [];

        const lateMeals = last30DaysFoods.filter((f) => {
            if (!f.time) return false;
            const hour = parseInt(f.time.split(':')[0]);
            return hour >= 20; // 8 PM onwards is "late" for this analysis
        });

        const totalLateCalories = lateMeals.reduce(
            (acc, f) => acc + (f.calories || 0),
            0,
        );
        const lateNightCalories =
            lateMeals.length > 0
                ? totalLateCalories / Array.from(dailyWindows.keys()).length
                : 0;

        const lateEatingDays = Array.from(dailyWindows.entries()).filter(
            ([date, window]) => {
                const lastMealHour = parseInt(window.last.split(':')[0]);
                return lastMealHour >= 21;
            },
        ).length;

        dailyWindows.forEach((window, date) => {
            const ouraDay = last30DaysOura.find((o) => o.date === date);
            if (ouraDay?.bedtime && ouraDay.sleepScore) {
                const gap = hoursDiff(window.last, ouraDay.bedtime);
                if (gap >= 0 && gap <= 8) {
                    // Valid gap (0-8 hours)
                    mealSleepGaps.push(gap);
                    sleepScores.push(ouraDay.sleepScore);
                    if (ouraDay.deepSleepMins !== null)
                        deepSleepMins.push(ouraDay.deepSleepMins);
                    if (ouraDay.remSleepMins !== null)
                        remSleepMins.push(ouraDay.remSleepMins);
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

        const deepSleepCorrelation =
            deepSleepMins.length >= 3
                ? calculateCorrelation(
                      mealSleepGaps.slice(0, deepSleepMins.length),
                      deepSleepMins,
                  )
                : 0;

        const remSleepCorrelation =
            remSleepMins.length >= 3
                ? calculateCorrelation(
                      mealSleepGaps.slice(0, remSleepMins.length),
                      remSleepMins,
                  )
                : 0;

        // 3. WORKOUT NUTRITION ANALYSIS
        const preWorkoutCarbs: number[] = [];
        const postWorkoutProtein: number[] = [];

        last30DaysWorkouts.forEach((w) => {
            const dayMeals = last30DaysFoods.filter((f) => f.date === w.date);

            if (dayMeals.length > 0) {
                // Better logic: Look for specific tags first
                const preMeal = dayMeals.find((f) => f.meal === 'preworkout');
                const postMeal = dayMeals.find((f) => f.meal === 'postworkout');

                if (preMeal) {
                    preWorkoutCarbs.push(preMeal.carbs || 0);
                } else {
                    // Fallback: If no tag, take highest carb meal before/on workout day?
                    // For now, let's just stick to tags to avoid "30g" avg confusion
                    // or use the old averaging but ONLY if no tags are present.
                    // Actually, let's take the largest carb meal as "pre-workout" proxy on workout days if no tag
                    const maxCarbMeal = [...dayMeals].sort(
                        (a, b) => (b.carbs || 0) - (a.carbs || 0),
                    )[0];
                    if (maxCarbMeal && maxCarbMeal.carbs > 20) {
                        preWorkoutCarbs.push(maxCarbMeal.carbs);
                    }
                }

                if (postMeal) {
                    postWorkoutProtein.push(postMeal.protein || 0);
                } else {
                    const maxProteinMeal = [...dayMeals].sort(
                        (a, b) => (b.protein || 0) - (a.protein || 0),
                    )[0];
                    if (maxProteinMeal && maxProteinMeal.protein > 15) {
                        postWorkoutProtein.push(maxProteinMeal.protein);
                    }
                }
            }
        });

        const avgPreWorkoutCarbs =
            preWorkoutCarbs.length > 0
                ? preWorkoutCarbs.reduce((a, b) => a + b, 0) / preWorkoutCarbs.length
                : 0;

        const avgPostWorkoutProtein =
            postWorkoutProtein.length > 0
                ? postWorkoutProtein.reduce((a, b) => a + b, 0) /
                  postWorkoutProtein.length
                : 0;

        // 4. CONSISTENCY ANALYSIS
        const breakfastTimes = last30DaysFoods
            .filter((f) => f.meal === 'breakfast' && f.time)
            .map((f) => f.time!);

        const lunchTimes = last30DaysFoods
            .filter((f) => f.meal === 'lunch' && f.time)
            .map((f) => f.time!);

        const dinnerTimes = last30DaysFoods
            .filter((f) => f.meal === 'dinner' && f.time)
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
                lateNightCalories,
                deepSleepCorrelation,
                remSleepCorrelation,
            },
            workoutNutrition: {
                avgPreWorkoutCarbs,
                avgPostWorkoutProtein,
                workoutDaysWithData: Math.max(
                    preWorkoutCarbs.length,
                    postWorkoutProtein.length,
                ),
            },
            consistency: {
                breakfastVariance: calculateTimeVariance(breakfastTimes),
                lunchVariance: calculateTimeVariance(lunchTimes),
                dinnerVariance: calculateTimeVariance(dinnerTimes),
            },
            hasData: true,
        };
    }, [foodLog, ouraLog, workouts, referenceDate]);
};

// ========== HELPER FUNCTIONS ==========

/**
 * Convert time strings (HH:mm) to average time using circular mean
 * Fixes "21:60" bug and handles midnight crossings (e.g. 23:00 and 01:00 avg to 00:00)
 */
function calculateAvgTime(times: string[]): string {
    if (times.length === 0) return '--:--';

    // Use circular mean (unit circle) to handle midnight crossings
    let sumSin = 0;
    let sumCos = 0;

    times.forEach((time) => {
        const [h, m] = time.split(':').map(Number);
        const minutes = h * 60 + m;
        const angle = (minutes / (24 * 60)) * 2 * Math.PI;
        sumSin += Math.sin(angle);
        sumCos += Math.cos(angle);
    });

    const avgAngle = Math.atan2(sumSin / times.length, sumCos / times.length);
    let avgMinutes = (avgAngle * (24 * 60)) / (2 * Math.PI);

    if (avgMinutes < 0) avgMinutes += 24 * 60;

    const hours = Math.floor(avgMinutes / 60);
    const mins = Math.round(avgMinutes % 60);

    // Final check for 60 mins rounding
    let fixedHours = hours;
    let fixedMins = mins;
    if (fixedMins === 60) {
        fixedMins = 0;
        fixedHours = (fixedHours + 1) % 24;
    }

    return `${fixedHours.toString().padStart(2, '0')}:${fixedMins
        .toString()
        .padStart(2, '0')}`;
}

/**
 * Calculate hours difference between two time strings
 */
function hoursDiff(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);

    let diff = h2 * 60 + m2 - (h1 * 60 + m1);

    // Handle crossing midnight
    if (diff < 0) diff += 24 * 60;

    return diff / 60;
}

/**
 * Calculate average hours difference for eating windows
 */
function calculateAvgHoursDiff(
    windows: Array<{ first: string; last: string }>,
): number {
    if (windows.length === 0) return 0;

    const diffs = windows.map((w) => hoursDiff(w.first, w.last));
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

/**
 * Calculate time variance (standard deviation in minutes) using circular statistics
 */
function calculateTimeVariance(times: string[]): number {
    if (times.length <= 1) return 0;

    const angles = times.map((t) => {
        const [h, m] = t.split(':').map(Number);
        return ((h * 60 + m) / (24 * 60)) * 2 * Math.PI;
    });

    let sumSin = 0;
    let sumCos = 0;
    angles.forEach((a) => {
        sumSin += Math.sin(a);
        sumCos += Math.cos(a);
    });

    const n = angles.length;
    const avgSin = sumSin / n;
    const avgCos = sumCos / n;
    const r = Math.sqrt(avgSin * avgSin + avgCos * avgCos);

    // Circular Standard Deviation: sqrt(-2 * ln(R))
    // but in minutes it's more intuitive to show the linear spread around the mean
    // if R is high (near 1), the spread is low.
    if (r === 0) return 0;

    const circularStdDev = Math.sqrt(-2 * Math.log(r));
    // Wrap back to minutes: stdDev * (Total Minutes / 2*PI)
    const stdDevMinutes = circularStdDev * ((24 * 60) / (2 * Math.PI));

    return Math.min(stdDevMinutes, 720); // Cap at 12 hours
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

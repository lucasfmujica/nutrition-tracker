import { supabase } from '../lib/supabase';
import { WeightEntry, Workout, FoodEntry } from '../types/domain';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
    toArgentinaDateString,
} from '../utils/dateUtils';
import { devLog } from '../utils/devLog';

/**
 * Weekly Snapshot Service
 * Generates and updates weekly summaries for leaderboard features
 */

interface WeeklySnapshotData {
    userId: string;
    weekStart: string;
    weightDelta: number | null;
    workoutCount: number;
    consistencyStreak: number;
    avgDeficit: number;
}

/**
 * Get the Monday of the current week as YYYY-MM-DD
 */
export function getWeekStart(date: Date = new Date()): string {
    return getMondayOfWeek(toArgentinaDateString(date));
}

/**
 * Get the Sunday of the previous week as YYYY-MM-DD
 */
export function getPreviousWeekEnd(date: Date = new Date()): string {
    const weekStart = getWeekStart(date);
    return addDaysToDate(weekStart, -1);
}

/**
 * Calculate weight delta for the week
 * Compares Sunday weight to previous Sunday weight
 */
export function calculateWeightDelta(
    weightHistory: WeightEntry[],
    weekStart: string
): number | null {
    if (weightHistory.length < 2) return null;

    const weekEnd = addDaysToDate(weekStart, 6);
    const previousWeekStart = addDaysToDate(weekStart, -7);

    // Find weight closest to end of this week
    const thisWeekWeights = weightHistory.filter((w) => {
        return w.date >= weekStart && w.date <= weekEnd;
    });

    // Find weight from previous week
    const previousWeekWeights = weightHistory.filter((w) => {
        return w.date >= previousWeekStart && w.date < weekStart;
    });

    if (thisWeekWeights.length === 0 || previousWeekWeights.length === 0) {
        return null;
    }

    // Get latest weight from each week
    const sortByDate = (a: WeightEntry, b: WeightEntry) =>
        new Date(b.date).getTime() - new Date(a.date).getTime();

    const currentWeight = thisWeekWeights.sort(sortByDate)[0].weight;
    const previousWeight = previousWeekWeights.sort(sortByDate)[0].weight;

    return Number((currentWeight - previousWeight).toFixed(2));
}

/**
 * Count workouts in the week
 */
export function countWeeklyWorkouts(
    workoutLog: Workout[],
    weekStart: string
): number {
    const weekEnd = addDaysToDate(weekStart, 6);

    return workoutLog.filter((w) => {
        return w.date >= weekStart && w.date <= weekEnd;
    }).length;
}

/**
 * Calculate consistency streak (days with logged activity)
 */
export function calculateConsistencyStreak(
    workoutLog: Workout[],
    weightHistory: WeightEntry[]
): number {
    if (workoutLog.length === 0 && weightHistory.length === 0) return 0;

    // Get all unique dates with activity
    const activityDates = new Set<string>();

    workoutLog.forEach((w) => activityDates.add(w.date));
    weightHistory.forEach((w) => activityDates.add(w.date));

    if (activityDates.size === 0) return 0;

    // Count ONLY consecutive days from today backwards.
    // - A day with activity increments the streak.
    // - The first day without activity breaks the loop, EXCEPT:
    //   * Today (i === 0) may legitimately have no record yet (day in
    //     progress), so it doesn't break the streak.
    //   * We allow at most ONE total gap as grace; a second real gap breaks.
    let streak = 0;
    let gapsUsed = 0;
    const today = getArgentinaDateString();

    for (let i = 0; i < 365; i++) {
        const dateStr = addDaysToDate(today, -i);

        if (activityDates.has(dateStr)) {
            streak++;
            continue;
        }

        // No activity on this day.
        if (i === 0) {
            // Today not logged yet — valid, keep scanning previous days.
            continue;
        }

        // A real gap on a past day: tolerate exactly one, then break.
        if (gapsUsed < 1) {
            gapsUsed++;
            continue;
        }

        break;
    }

    return streak;
}

/**
 * Calculate average calorie deficit/surplus for the week
 * Positive = surplus, Negative = deficit
 */
export function calculateAvgDeficit(
    foodLog: FoodEntry[],
    targetCalories: number,
    weekStart: string
): number {
    if (foodLog.length === 0 || !targetCalories) return 0;

    const weekEnd = addDaysToDate(weekStart, 6);

    // Group foods by date and sum calories
    const dailyTotals: Record<string, number> = {};

    foodLog.forEach((food) => {
        if (food.date >= weekStart && food.date <= weekEnd) {
            if (!dailyTotals[food.date]) {
                dailyTotals[food.date] = 0;
            }
            dailyTotals[food.date] += food.calories || 0;
        }
    });

    // Calculate deficit for each logged day
    const deficits: number[] = [];
    Object.values(dailyTotals).forEach((actualCalories) => {
        // deficit = target - actual
        // Positive deficit = ate less than target (good for weight loss)
        // Negative deficit = ate more than target (surplus)
        deficits.push(targetCalories - actualCalories);
    });

    if (deficits.length === 0) return 0;

    // Calculate average
    const avgDeficit = deficits.reduce((sum, d) => sum + d, 0) / deficits.length;

    return Number(avgDeficit.toFixed(1));
}

/**
 * Generate or update weekly snapshot for a user
 */
export async function generateWeeklySnapshot(
    userId: string,
    weightHistory: WeightEntry[],
    workoutLog: Workout[],
    foodLog: FoodEntry[],
    targetCalories: number
): Promise<void> {
    if (!supabase || !userId) return;

    const weekStart = getWeekStart();

    try {
        const snapshotData: Omit<WeeklySnapshotData, 'userId'> = {
            weekStart,
            weightDelta: calculateWeightDelta(weightHistory, weekStart),
            workoutCount: countWeeklyWorkouts(workoutLog, weekStart),
            consistencyStreak: calculateConsistencyStreak(workoutLog, weightHistory),
            avgDeficit: calculateAvgDeficit(foodLog, targetCalories, weekStart),
        };

        // Upsert the snapshot
        const { error } = await supabase.from('weekly_snapshots').upsert(
            {
                user_id: userId,
                week_start: snapshotData.weekStart,
                weight_delta: snapshotData.weightDelta,
                workout_count: snapshotData.workoutCount,
                consistency_streak: snapshotData.consistencyStreak,
                avg_deficit: snapshotData.avgDeficit,
            },
            {
                onConflict: 'user_id,week_start',
            }
        );

        if (error) {
            console.error('[WeeklySnapshot] Failed to generate snapshot:', error);
        } else {
            devLog('[WeeklySnapshot] Generated snapshot for week:', weekStart);
        }
    } catch (err) {
        console.error('[WeeklySnapshot] Error generating snapshot:', err);
    }
}

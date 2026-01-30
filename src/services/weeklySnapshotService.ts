import { supabase } from '../lib/supabase';
import { WeightEntry, Workout, FoodEntry } from '../types/domain';

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
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
}

/**
 * Get the Sunday of the previous week as YYYY-MM-DD
 */
export function getPreviousWeekEnd(date: Date = new Date()): string {
    const weekStart = getWeekStart(date);
    const monday = new Date(weekStart);
    monday.setDate(monday.getDate() - 1);
    return monday.toISOString().split('T')[0];
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

    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // Sunday

    const previousWeekEnd = new Date(weekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);

    // Find weight closest to end of this week
    const thisWeekWeights = weightHistory.filter((w) => {
        const date = new Date(w.date);
        return date >= weekStartDate && date <= weekEndDate;
    });

    // Find weight from previous week
    const previousWeekWeights = weightHistory.filter((w) => {
        const date = new Date(w.date);
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        return date >= prevWeekStart && date < weekStartDate;
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
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    return workoutLog.filter((w) => {
        const date = new Date(w.date);
        return date >= weekStartDate && date <= weekEndDate;
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

    // Sort dates descending
    const sortedDates = Array.from(activityDates).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    if (sortedDates.length === 0) return 0;

    // Count consecutive days from today
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        if (activityDates.has(dateStr)) {
            streak++;
        } else if (i > 0) {
            // Allow one day gap for flexibility (streak continues if skipped 1 day)
            const prevDate = new Date(today);
            prevDate.setDate(prevDate.getDate() - i + 1);
            if (!activityDates.has(prevDate.toISOString().split('T')[0])) {
                break;
            }
        } else {
            // Today not logged, but check if yesterday was
            continue;
        }
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

    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // Sunday

    // Group foods by date and sum calories
    const dailyTotals: Record<string, number> = {};

    foodLog.forEach((food) => {
        const date = new Date(food.date);
        if (date >= weekStartDate && date <= weekEndDate) {
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
            console.log('[WeeklySnapshot] Generated snapshot for week:', weekStart);
        }
    } catch (err) {
        console.error('[WeeklySnapshot] Error generating snapshot:', err);
    }
}

import { useMemo } from 'react';
import {
    DEFAULT_WEEKLY_PLAN,
    Intensity as PlanIntensity,
    PlannedWorkout,
} from '../constants/weeklyPlan';
import { CustomTargets, FoodEntry, Profile, Workout } from '../types/domain';
import {
    addDaysToDate,
    getArgentinaDateString,
    getMondayOfWeek,
} from '../utils/dateUtils';

/**
 * Day Intensity Categories
 */
const INTENSITY = {
    HIGH: 'high', // Tennis, Leg Day
    MODERATE: 'moderate', // Upper body, cardio
    RECOVERY: 'recovery', // Rest or light activity
} as const;

type Intensity = (typeof INTENSITY)[keyof typeof INTENSITY];

interface PeriodizationDay {
    date: string;
    dayOfWeek: string;
    intensity: Intensity;
    calories: number;
    workouts: string[];
    isPast: boolean;
    isToday: boolean;
    isSafetyNet: boolean;
}

interface PeriodizationData {
    weekDays: PeriodizationDay[];
    weeklyAverage: number;
    totalCalories: number;
    isOnTrack: boolean;
    dayDistribution: {
        high: number;
        moderate: number;
        recovery: number;
    };
    weekStart: string;
    targetAverage: number;
}

/**
 * useWeeklyPeriodization - Weekly planning and calorie distribution
 *
 * Categorizes each day of the week and allocates calories:
 * - HIGH: baseCalories + 300 (Tennis, Leg Day)
 * - MODERATE: baseCalories (Normal gym)
 * - RECOVERY: baseCalories - 150 (Rest)
 *
 * Ensures weekly average meets deficit goal for 75kg target.
 *
 * @param {Workout[]} workoutLog - Workout entries from Supabase
 * @param {Profile} profile - User profile with weight info
 * @param {CustomTargets} customTargets - Base nutrition targets
 * @param {number} currentWeight - Current weight in kg
 * @param {number} targetWeight - Goal weight (default 75)
 * @param {FoodEntry[]} foodLog - Food log for safety net detection
 * @param {Record<number, PlannedWorkout | null>} weeklyPlan - User's custom weekly plan from Supabase
 * @returns {PeriodizationData} Weekly plan with calorie allocation
 */
export const useWeeklyPeriodization = (
    workoutLog: Workout[],
    profile: Profile,
    customTargets: CustomTargets,
    currentWeight: number,
    targetWeight: number = 75,
    foodLog: FoodEntry[] = [], // Safety Net integration
    weeklyPlan: Record<number, PlannedWorkout | null> = {}, // User's custom plan
): PeriodizationData => {
    return useMemo(() => {
        const baseCalories = customTargets?.calories || 2100;
        const today = getArgentinaDateString();
        const monday = getMondayOfWeek(today);

        // Calorie adjustments by intensity
        const CALORIE_ADJUSTMENTS = {
            [INTENSITY.HIGH]: 300,
            [INTENSITY.MODERATE]: 0,
            [INTENSITY.RECOVERY]: -150,
        };

        // Build week days (Mon-Sun)
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = addDaysToDate(monday, i);
            let dayWorkouts: (Workout | PlannedWorkout)[] =
                workoutLog?.filter((w) => w.date === date) || [];

            // Fallback: Use user's custom plan or default plan if no workouts logged
            if (dayWorkouts.length === 0) {
                // Priority 1: User's custom plan from Supabase
                // Priority 2: Default plan constant
                const plannedWorkout = weeklyPlan[i] || DEFAULT_WEEKLY_PLAN[i];
                if (plannedWorkout) {
                    dayWorkouts = [plannedWorkout]; // Use as virtual workout
                }
            }

            // Safety Net Check
            // Check if day is logged as safety net day in food log
            const isSafetyNetDay = foodLog?.some(
                (f) =>
                    f.date === date &&
                    (f.is_safety_net_day || f.sourceId === 'safety-net'),
            );

            // Determine intensity based on workouts
            let intensity: Intensity = INTENSITY.RECOVERY;

            for (const workout of dayWorkouts) {
                const name = (workout.name || '').toLowerCase();
                const type = (workout as any).type;
                const workoutIntensity = (workout as any).intensity;

                // HIGH: Tennis, Leg Day, or explicitly high intensity
                if (
                    type === 'sport' ||
                    type === 'tennis' ||
                    name.includes('tennis') ||
                    name.includes('tenis') ||
                    name.includes('pierna') ||
                    name.includes('leg') ||
                    workoutIntensity === INTENSITY.HIGH
                ) {
                    intensity = INTENSITY.HIGH;
                    break;
                }

                // MODERATE: Any gym, cardio, or other activity
                if (
                    type === 'gym' ||
                    type === 'cardio' ||
                    type === 'other' ||
                    workoutIntensity === INTENSITY.MODERATE ||
                    name.length > 2 // Any actual activity log
                ) {
                    intensity = INTENSITY.MODERATE;
                    // Don't break - might find HIGH later
                }
            }

            const calorieAdjustment = CALORIE_ADJUSTMENTS[intensity];

            // If Safety Net day, use TDEE (Maintenance) instead of calculated deficit
            // TDEE ≈ baseCalories + 500
            const tdee = profile?.tdee || baseCalories + 500;
            const dayCalories = isSafetyNetDay
                ? tdee
                : baseCalories + calorieAdjustment;

            return {
                date,
                dayOfWeek: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
                intensity,
                calories: dayCalories,
                workouts: dayWorkouts.map((w) => w.name),
                isPast: date < today,
                isToday: date === today,
                isSafetyNet: isSafetyNetDay,
            };
        });

        // Calculate weekly stats
        const totalCalories = weekDays.reduce((sum, d) => sum + d.calories, 0);
        const weeklyAverage = Math.round(totalCalories / 7);

        // Calculate if on track for goal
        // Required deficit: ~500 kcal/day for 0.5kg/week loss
        const weightToLose = (currentWeight || 84.9) - targetWeight;
        const tdee = profile?.tdee || baseCalories + 500; // Estimate TDEE
        const neededDeficit = 500;
        const targetDailyCalories = tdee - neededDeficit;

        // Adjusted On Track Check:
        // Check if non-safety net days average matches target
        const nonSafetyNetDays = weekDays.filter((d) => !d.isSafetyNet);
        const nonSafetyNetTotal = nonSafetyNetDays.reduce(
            (sum, d) => sum + d.calories,
            0,
        );
        const nonSafetyNetAvg =
            nonSafetyNetDays.length > 0
                ? Math.round(nonSafetyNetTotal / nonSafetyNetDays.length)
                : targetDailyCalories;

        const isOnTrack = nonSafetyNetAvg <= targetDailyCalories + 50;

        // Count day types
        const highDays = weekDays.filter(
            (d) => d.intensity === INTENSITY.HIGH,
        ).length;
        const moderateDays = weekDays.filter(
            (d) => d.intensity === INTENSITY.MODERATE,
        ).length;
        const recoveryDays = weekDays.filter(
            (d) => d.intensity === INTENSITY.RECOVERY,
        ).length;

        return {
            weekDays,
            weeklyAverage,
            totalCalories,
            isOnTrack,
            dayDistribution: {
                high: highDays,
                moderate: moderateDays,
                recovery: recoveryDays,
            },
            weekStart: monday,
            targetAverage: targetDailyCalories,
        };
    }, [
        workoutLog,
        profile,
        customTargets,
        currentWeight,
        targetWeight,
        foodLog,
        weeklyPlan,
    ]);
};

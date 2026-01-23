import { DEFAULT_WEEKLY_PLAN, PlannedWorkout } from '../constants/weeklyPlan';
import { Workout } from '../types/domain';

export const INTENSITY = {
    HIGH: 'high', // Tennis, Leg Day, MURPH
    MODERATE: 'moderate', // Standard Gym, Cardio
    RECOVERY: 'recovery', // Rest days
} as const;

export type Intensity = (typeof INTENSITY)[keyof typeof INTENSITY];

export const CALORIE_ADJUSTMENTS: Record<Intensity, number> = {
    [INTENSITY.HIGH]: 150, // +150 kcal for high demand (e.g. Tennis)
    [INTENSITY.MODERATE]: 0, // Base maintenance for standard training
    [INTENSITY.RECOVERY]: -150, // -150 kcal for rest days to deepen deficit
};

/**
 * Determines the intensity level for a given date based on workout logs or weekly plan.
 * @param {string} date - YYYY-MM-DD
 * @param {Workout[] | null} workoutLog - List of workout entries
 * @param {Record<number, PlannedWorkout | null>} weeklyPlan - User's custom plan
 * @returns {Intensity} Intensity level (high, moderate, recovery)
 */
export const getDayIntensity = (
    date: string,
    workoutLog: Workout[] | null,
    weeklyPlan: Record<number, PlannedWorkout | null> = {},
): Intensity => {
    // Normalize input date string
    const targetDate = date.split('T')[0];

    // 1. Check logged workouts first (Real data overrides plan)
    const dayWorkouts =
        workoutLog?.filter((w) => {
            if (!w.date) return false;
            return w.date.split('T')[0] === targetDate;
        }) || [];

    if (dayWorkouts.length > 0) {
        // If there are logs, we default to MODERATE (standard training)
        // unless we find a HIGH intensity signal.
        let intensity: Intensity = INTENSITY.MODERATE;

        for (const workout of dayWorkouts) {
            const name = (workout.name || '').toLowerCase();
            const type = (workout as any).type || '';
            const workoutIntensity = (workout as any).intensity;

            // HIGH: Sport, Tennis, Leg Day, Murph, CrossFit, Cardio Intense
            const isHighIntensity =
                type === 'sport' ||
                type === 'tennis' ||
                name.includes('tennis') ||
                name.includes('tenis') ||
                name.includes('murph') ||
                name.includes('futbol') ||
                name.includes('fútbol') ||
                name.includes('partido') ||
                name.includes('crossfit') ||
                name.includes('correr') ||
                name.includes('running') ||
                name.includes('hiit') ||
                name.includes('tabata') ||
                workoutIntensity === INTENSITY.HIGH;

            if (isHighIntensity) {
                return INTENSITY.HIGH;
            }
        }
        // If we have any workout but none matched HIGH, it stays MODERATE
        return intensity;
    }

    // 2. Fallback to Weekly Plan if no workouts logged
    const dayDate = new Date(targetDate + 'T12:00:00');
    const dayOfWeek = dayDate.getDay(); // 0-6 (Sun-Sat)
    // Map JS Sunday=0 to our internal Monday=0 plan structure
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Sun=6

    // 2. Fallback to Weekly Plan if no workouts logged
    // First check user's custom plan, then fallback to default
    const plannedWorkout = weeklyPlan.hasOwnProperty(dayIndex)
        ? weeklyPlan[dayIndex]
        : DEFAULT_WEEKLY_PLAN[dayIndex];

    if (plannedWorkout) {
        return plannedWorkout.intensity || INTENSITY.MODERATE;
    }

    // 3. Absolute fallback: RECOVERY (Rest Day)
    return INTENSITY.RECOVERY;
};

interface BaseTargets {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    [key: string]: any;
}

/**
 * Calculates partial nutrition targets for a specific date.
 * @param {string} date - YYYY-MM-DD
 * @param {Workout[] | null} workoutLog - List of workout entries
 * @param {Object} baseTargets - User's base custom targets
 * @param {Record<number, PlannedWorkout | null>} weeklyPlan - User's custom plan
 * @returns {Object} Adjusted targets for that day
 */
export const getSmartTargets = (
    date: string,
    workoutLog: Workout[] | null,
    baseTargets: BaseTargets,
    weeklyPlan: Record<number, PlannedWorkout | null> = {},
): BaseTargets => {
    const intensity = getDayIntensity(date, workoutLog, weeklyPlan);
    const adjustment = CALORIE_ADJUSTMENTS[intensity];

    const safeBase = baseTargets || {
        calories: 2100,
        protein: 150,
        carbs: 200,
        fat: 70,
    };

    return {
        ...safeBase,
        calories: (Number(safeBase.calories) || 2100) + adjustment,
    };
};

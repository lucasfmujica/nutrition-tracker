/**
 * Default Weekly Training Plan
 * Used as fallback for periodization when no actual workouts are logged
 */

export const INTENSITY = {
    HIGH: 'high',
    MODERATE: 'moderate',
    RECOVERY: 'recovery',
} as const;

export type Intensity = (typeof INTENSITY)[keyof typeof INTENSITY];

export interface PlannedWorkout {
    type: 'gym' | 'sport' | 'cardio' | 'other';
    name: string;
    intensity: Intensity;
}

/**
 * Default weekly plan (Monday = 0, Sunday = 6)
 * Generic plan for new users - can be customized in Dashboard
 */
export const DEFAULT_WEEKLY_PLAN: Record<number, PlannedWorkout> = {
    0: { type: 'gym', name: 'Workout', intensity: INTENSITY.MODERATE }, // Lunes
    2: { type: 'gym', name: 'Workout', intensity: INTENSITY.MODERATE }, // Miércoles
    4: { type: 'gym', name: 'Workout', intensity: INTENSITY.MODERATE }, // Viernes
    // 1, 3, 5, 6 are rest days (recovery by default)
    // Users can customize this plan in Dashboard → Weekly Planning Card
};

/**
 * Get planned workout for a specific day of week (Monday = 0)
 * @param {number} dayIndex - 0-6 where 0 = Monday, 6 = Sunday
 * @returns {PlannedWorkout|null} Planned workout or null for rest days
 */
export const getPlannedWorkout = (dayIndex: number): PlannedWorkout | null => {
    return DEFAULT_WEEKLY_PLAN[dayIndex] || null;
};

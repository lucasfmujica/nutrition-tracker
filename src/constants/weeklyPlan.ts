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
 * This represents the user's recurring weekly training schedule
 */
export const DEFAULT_WEEKLY_PLAN: Record<number, PlannedWorkout> = {
    0: { type: 'gym', name: 'Upper Body', intensity: INTENSITY.MODERATE }, // Lunes
    2: { type: 'sport', name: 'Tenis', intensity: INTENSITY.HIGH }, // Miércoles
    3: { type: 'gym', name: 'Piernas', intensity: INTENSITY.MODERATE }, // Jueves
    5: { type: 'gym', name: 'Full Body', intensity: INTENSITY.MODERATE }, // Sábado
    // 1, 4, 6 are rest days (recovery by default)
};

/**
 * Get planned workout for a specific day of week (Monday = 0)
 * @param {number} dayIndex - 0-6 where 0 = Monday, 6 = Sunday
 * @returns {PlannedWorkout|null} Planned workout or null for rest days
 */
export const getPlannedWorkout = (dayIndex: number): PlannedWorkout | null => {
    return DEFAULT_WEEKLY_PLAN[dayIndex] || null;
};

import { FoodEntry, MealType } from '../types/domain';

export interface MealInconsistency {
    foodId: string;
    foodName: string;
    meal: string;
    time: string;
    expectedWindow: string;
}

/**
 * Time windows for expected meal times (Argentina culture)
 * Only standard meal types are validated
 */
const MEAL_WINDOWS: Record<string, { start: number; end: number; label: string }> = {
    breakfast: { start: 6, end: 11, label: '06:00-11:00' },
    lunch: { start: 11, end: 15, label: '11:00-15:00' },
    snack: { start: 15, end: 19, label: '15:00-19:00' },
    dinner: { start: 19, end: 24, label: '19:00-23:59' },
};

/** Meal types that skip validation (inherently flexible timing) */
const SKIP_TYPES: MealType[] = ['other', 'preworkout', 'postworkout'];

/**
 * Convert HH:mm string to decimal hours
 */
const timeToHours = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h + m / 60;
};

/**
 * Detect meal time inconsistencies for a list of food entries
 * Only checks entries with non-null time field
 * Only checks breakfast, lunch, snack, dinner meal types
 *
 * @param foods - Array of food entries to check
 * @returns Array of inconsistencies found
 */
export const detectMealInconsistencies = (foods: FoodEntry[]): MealInconsistency[] => {
    const inconsistencies: MealInconsistency[] = [];

    foods.forEach((food) => {
        if (!food.time) return;
        if (SKIP_TYPES.includes(food.meal)) return;

        const window = MEAL_WINDOWS[food.meal];
        if (!window) return;

        const hours = timeToHours(food.time);

        // Check if time falls outside the expected window
        if (hours < window.start || hours >= window.end) {
            inconsistencies.push({
                foodId: food.id,
                foodName: food.name,
                meal: food.meal,
                time: food.time,
                expectedWindow: window.label,
            });
        }
    });

    return inconsistencies;
};

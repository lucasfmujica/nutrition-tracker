/**
 * TDEE Calculator Service
 * Calculates Total Daily Energy Expenditure for maintenance mode
 */

import { CustomTargets, Profile } from '../types/domain';

/**
 * Calculates maintenance TDEE (Total Daily Energy Expenditure)
 *
 * Strategy:
 * 1. If profile has explicit TDEE field, use it (future enhancement)
 * 2. Otherwise, estimate from current weight loss target
 *    - Assumes customTargets.calories is set to ~500 kcal deficit
 *    - Adds 500 kcal back to reach maintenance
 *
 * @param {Object} profile - User profile with weight/activity data
 * @param {Object} customTargets - Current nutrition targets
 * @returns {number} Estimated TDEE in kcal
 */
export const calculateTDEE = (
    profile: Profile | null,
    customTargets: CustomTargets | null,
): number => {
    // Method 1: Use explicit TDEE if available (future enhancement)
    // profile type doesn't currently have tdee, casting to any or we should update Profile type if actually used
    if (profile && (profile as any).tdee && (profile as any).tdee > 0) {
        return Math.round((profile as any).tdee);
    }

    // Method 2: Estimate from current weight loss target
    const baseCalories = customTargets?.calories || 2100;
    const estimatedDeficit = 500; // Standard deficit for 0.5kg/week loss

    return Math.round(baseCalories + estimatedDeficit);
};

/**
 * Calculates Safety Net (maintenance) targets
 * Shifts calorie target to TDEE while preserving high protein
 *
 * @param {Object} profile - User profile
 * @param {Object} customTargets - Current targets
 * @returns {Object} Maintenance mode targets
 */
export const getSafetyNetTargets = (
    profile: Profile | null,
    customTargets: CustomTargets | null,
): CustomTargets => {
    const tdee = calculateTDEE(profile, customTargets);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const baseCalories = customTargets?.calories || 2100;

    // Calculate calorie increase
    // const calorieIncrease = tdee - baseCalories;

    // Preserve protein (muscle preservation during maintenance)
    // Increase carbs and fat proportionally to reach TDEE
    const proteinCalories = (customTargets?.protein || 170) * 4;
    const remainingCalories = tdee - proteinCalories;

    // Split remaining between carbs (55%) and fat (45%)
    const carbCalories = remainingCalories * 0.55;
    const fatCalories = remainingCalories * 0.45;

    return {
        ...(customTargets || {
            calories: 2100,
            protein: 170,
            carbs: 180,
            fat: 70,
            fiber: 30,
            trainingDayCaloriesBonus: 200,
            trainingDayCarbs: 220,
        }),
        calories: tdee,
        protein: customTargets?.protein || 170, // Keep protein high
        carbs: Math.round(carbCalories / 4),
        fat: Math.round(fatCalories / 9),
        // Preserve fiber and other targets
        fiber: customTargets?.fiber || 30,
    };
};

/**
 * Checks if a date is a safety net day
 *
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {boolean} safetyNetActive - Current safety net status
 * @param {string} today - Today's date (YYYY-MM-DD)
 * @returns {boolean}
 */
export const isSafetyNetDay = (
    date: string,
    safetyNetActive: boolean,
    today: string,
): boolean => {
    // Safety net only applies to current day when active
    return safetyNetActive && date === today;
};

/**
 * TDEE Calculator Service
 * Calculates Total Daily Energy Expenditure for maintenance mode
 */

import { CustomTargets, Profile } from '../types/domain';
import {
    calculateBMR,
    calculateTDEE as calculateTdeeFromBmr,
    getActivityMultiplier,
} from '../utils/macroCalculator';

/**
 * Maps the profile's coarse activityLevel to a TDEE multiplier.
 * Used as a fallback when trainingDaysPerWeek is not available.
 */
const ACTIVITY_LEVEL_MULTIPLIER: Record<
    Profile['activityLevel'],
    number
> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
};

/**
 * Calculates maintenance TDEE (Total Daily Energy Expenditure)
 *
 * Strategy:
 * 1. If profile has explicit TDEE field, use it
 * 2. If profile has enough data (weight/height/age), derive TDEE from
 *    BMR (Mifflin-St Jeor) × activity factor — reusing macroCalculator
 * 3. Otherwise, reverse the goal-based deficit/surplus that produced the
 *    current target calories (20% deficit for cut, 10% surplus for bulk)
 *
 * @param {Object} profile - User profile with weight/activity data
 * @param {Object} customTargets - Current nutrition targets
 * @returns {number} Estimated TDEE in kcal
 */
export const calculateTDEE = (
    profile: Profile | null,
    customTargets: CustomTargets | null,
): number => {
    // Method 1: Use explicit TDEE if available
    if (profile?.tdee && profile.tdee > 0) {
        return Math.round(profile.tdee);
    }

    // Method 2: Derive real TDEE from BMR × activity factor when profile data
    // is sufficient. This avoids assuming a fixed 500 kcal deficit.
    if (
        profile &&
        profile.currentWeight > 0 &&
        profile.height > 0 &&
        profile.age > 0
    ) {
        const isMale = profile.gender !== 'female'; // default to male if unspecified
        const bmr = calculateBMR(
            profile.currentWeight,
            profile.height,
            profile.age,
            isMale,
        );

        const activityMultiplier =
            typeof profile.trainingDaysPerWeek === 'number'
                ? getActivityMultiplier(profile.trainingDaysPerWeek)
                : ACTIVITY_LEVEL_MULTIPLIER[profile.activityLevel] || 1.375;

        return Math.round(calculateTdeeFromBmr(bmr, activityMultiplier));
    }

    // Method 3: Reverse the goal-based deficit/surplus baked into the current
    // target calories. Mirrors adjustCaloriesForGoal() in macroCalculator.
    const baseCalories = customTargets?.calories || 2100;
    switch (profile?.goal) {
        case 'cut':
            // Targets are TDEE × 0.8 (20% deficit) → reverse it
            return Math.round(baseCalories / 0.8);
        case 'bulk':
            // Targets are TDEE × 1.1 (10% surplus) → reverse it
            return Math.round(baseCalories / 1.1);
        case 'maintain':
        default:
            return Math.round(baseCalories);
    }
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
    // Guard: never distribute a negative remainder (protein alone may exceed TDEE)
    const remainingCalories = Math.max(tdee - proteinCalories, 0);

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
 * @param {string[]} safetyNetDays - Array of dates where Safety Net is active
 * @returns {boolean}
 */
export const isSafetyNetDay = (
    date: string,
    safetyNetDays: string[] = [],
): boolean => {
    // Check if this specific date has Safety Net activated
    return safetyNetDays.includes(date);
};

/**
 * TDEE Calculator Service
 * Calculates Total Daily Energy Expenditure for maintenance mode
 */

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
export const calculateTDEE = (profile, customTargets) => {
  // Method 1: Use explicit TDEE if available (future enhancement)
  if (profile?.tdee && profile.tdee > 0) {
    return Math.round(profile.tdee);
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
export const getSafetyNetTargets = (profile, customTargets) => {
  const tdee = calculateTDEE(profile, customTargets);
  const baseCalories = customTargets?.calories || 2100;

  // Calculate calorie increase
  const calorieIncrease = tdee - baseCalories;

  // Preserve protein (muscle preservation during maintenance)
  // Increase carbs and fat proportionally to reach TDEE
  const proteinCalories = (customTargets?.protein || 170) * 4;
  const remainingCalories = tdee - proteinCalories;

  // Split remaining between carbs (55%) and fat (45%)
  const carbCalories = remainingCalories * 0.55;
  const fatCalories = remainingCalories * 0.45;

  return {
    ...customTargets,
    calories: tdee,
    protein: customTargets?.protein || 170, // Keep protein high
    carbs: Math.round(carbCalories / 4),
    fat: Math.round(fatCalories / 9),
    // Preserve fiber and other targets
    fiber: customTargets?.fiber || 30
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
export const isSafetyNetDay = (date, safetyNetActive, today) => {
  // Safety net only applies to current day when active
  return safetyNetActive && date === today;
};

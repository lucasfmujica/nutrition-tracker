/**
 * Calorie Periodization Logic
 * Shared source of truth for calculating daily targets based on workout intensity.
 */

export const INTENSITY = {
  HIGH: 'high',      // Tennis, Leg Day, MURPH
  MODERATE: 'moderate', // Standard Gym, Cardio
  RECOVERY: 'recovery'  // Rest days
};

export const CALORIE_ADJUSTMENTS = {
  [INTENSITY.HIGH]: 300,      // +300 kcal for high demand
  [INTENSITY.MODERATE]: 0,    // Base maintenance for standard training
  [INTENSITY.RECOVERY]: -150  // -150 kcal for rest days to deepen deficit
};

/**
 * Determines the intensity level for a given date based on workout logs.
 * @param {string} date - YYYY-MM-DD
 * @param {Array} workoutLog - List of workout entries
 * @returns {string} Intensity level (high, moderate, recovery)
 */
export const getDayIntensity = (date, workoutLog) => {
  if (!workoutLog || !Array.isArray(workoutLog)) return INTENSITY.RECOVERY;

  const dayWorkouts = workoutLog.filter(w => w.date === date);

  if (dayWorkouts.length === 0) return INTENSITY.RECOVERY;

  // Check for HIGH intensity signal
  for (const workout of dayWorkouts) {
    const name = (workout.name || '').toLowerCase();
    const type = workout.type;

    // HIGH: Sport, Tennis, Leg Day, Murph, CrossFit, Cardio Intense
    if (type === 'sport' ||
      name.includes('tennis') ||
      name.includes('tenis') ||  // Spanish spelling
      name.includes('pierna') ||
      name.includes('leg') ||
      name.includes('murph') ||
      name.includes('futbol') || // Soccer
      name.includes('fútbol') ||
      name.includes('partido') ||
      name.includes('crossfit') ||
      name.includes('correr') || // Running
      name.includes('running')) {
      return INTENSITY.HIGH;
    }
  }

  // If we found workouts but none were High intensity, default to Moderate
  return INTENSITY.MODERATE;
};

/**
 * Calculates partional nutrition targets for a specific date.
 * @param {string} date - YYYY-MM-DD
 * @param {Array} workoutLog - List of workout entries
 * @param {Object} baseTargets - User's base custom targets { calories, protein, ... }
 * @returns {Object} Adjusted targets for that day
 */
export const getSmartTargets = (date, workoutLog, baseTargets) => {
  const intensity = getDayIntensity(date, workoutLog);
  const adjustment = CALORIE_ADJUSTMENTS[intensity];

  const safeBase = baseTargets || { calories: 2100, protein: 150, carbs: 200, fat: 70 };

  console.log(`[SmartCalories] Date: ${date}, Intensity: ${intensity}, Adj: ${adjustment}, Base: ${safeBase.calories}`);

  return {
    ...safeBase,
    calories: (Number(safeBase.calories) || 2100) + adjustment,
    // We can add macro adjustments here if needed (e.g. more carbs on high days)
    // For now keeping protein static as requested in "Safety Net" discussions,
    // unless we want to vary carbs? periodization implied carb cycling usually.
    // Keeping it simple to calories for now to match user request.
  };
};

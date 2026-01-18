import { useMemo } from 'react';
import { getArgentinaDateString } from '../utils/dateUtils';

/**
 * useAdaptiveCalories - Adaptive Caloric Engine
 *
 * Dynamically adjusts daily calorie and carbohydrate targets based on:
 * - Steps from Apple Health (synced to steps_log)
 * - Workout type (Tennis = High Intensity boost)
 *
 * CRITICAL: Protein remains STATIC - only carbs/calories adjust
 *
 * @param {Array} stepsLog - Daily step entries from Supabase
 * @param {Array} workoutLog - Workout entries with type field
 * @param {Object} profile - User profile with training_day_* settings
 * @param {Object} customTargets - Base nutrition targets
 * @param {string} [selectedDate] - Optional date to check (defaults to today)
 * @returns {Object} Adjusted targets and boost metadata
 */
export const useAdaptiveCalories = (
  stepsLog,
  workoutLog,
  profile,
  customTargets,
  selectedDate
) => {
  return useMemo(() => {
    // Default return if missing required data
    if (!customTargets) {
      return {
        adjustedCalories: 0,
        adjustedCarbs: 0,
        adjustedProtein: 0,
        adjustedFat: 0,
        isTrainingDay: false,
        boostReason: null,
        boostAmount: { calories: 0, carbs: 0 }
      };
    }

    const date = selectedDate || getArgentinaDateString();

    // 1. Get today's steps
    const todaySteps = stepsLog?.find(s => s.date === date)?.steps || 0;
    const isHighSteps = todaySteps > 10000;

    // 2. Check for High Intensity workouts (Tennis or specified types)
    const todayWorkouts = workoutLog?.filter(w => w.date === date) || [];
    const hasTennis = todayWorkouts.some(
      w => w.type === 'sport' || w.name?.toLowerCase().includes('tennis')
    );
    const hasHighIntensityGym = todayWorkouts.some(
      w => w.type === 'gym' && (w.name?.toLowerCase().includes('leg') || w.name?.toLowerCase().includes('pierna'))
    );

    // 3. Determine if boost applies
    const isTrainingDay = isHighSteps || hasTennis || hasHighIntensityGym;

    // 4. Calculate boosts from profile settings
    const calorieBoost = isTrainingDay
      ? (profile?.training_day_calories_bonus || 200)
      : 0;

    // Carb boost: use training_day_carbs if set, otherwise add ~40g
    const baseCarbs = customTargets.carbs || 180;
    const trainingCarbs = profile?.training_day_carbs || (baseCarbs + 40);
    const carbBoost = isTrainingDay ? (trainingCarbs - baseCarbs) : 0;

    // 5. Calculate final adjusted targets
    const adjustedCalories = (customTargets.calories || 2100) + calorieBoost;
    const adjustedCarbs = baseCarbs + carbBoost;

    // CRITICAL: Protein and Fat remain STATIC
    const adjustedProtein = customTargets.protein || 170;
    const adjustedFat = customTargets.fat || 70;

    // 6. Build boost reason string
    let boostReason = null;
    if (isTrainingDay) {
      const reasons = [];
      if (hasTennis) reasons.push('Partido de Tenis');
      if (hasHighIntensityGym) reasons.push('Día de Piernas');
      if (isHighSteps && !hasTennis && !hasHighIntensityGym) {
        reasons.push(`${todaySteps.toLocaleString()} pasos`);
      }
      boostReason = reasons.join(' + ') || 'Día de Entreno';
    }

    console.log('[AdaptiveCalories] Calculation:', {
      date,
      todaySteps,
      isHighSteps,
      hasTennis,
      hasHighIntensityGym,
      isTrainingDay,
      calorieBoost,
      carbBoost,
      adjustedCalories,
      adjustedCarbs
    });

    return {
      adjustedCalories,
      adjustedCarbs,
      adjustedProtein,
      adjustedFat,
      isTrainingDay,
      boostReason,
      boostAmount: {
        calories: calorieBoost,
        carbs: carbBoost
      },
      // Expose raw data for debugging/display
      metadata: {
        steps: todaySteps,
        workoutCount: todayWorkouts.length
      }
    };
  }, [stepsLog, workoutLog, profile, customTargets, selectedDate]);
};

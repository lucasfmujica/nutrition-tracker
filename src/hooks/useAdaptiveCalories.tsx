import { useMemo } from 'react';
import { CustomTargets, Profile, StepsEntry, Workout } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

export interface AdaptiveCaloriesData {
    adjustedCalories: number;
    adjustedCarbs: number;
    adjustedProtein: number;
    adjustedFat: number;
    isTrainingDay: boolean;
    boostReason: string | null;
    boostAmount: {
        calories: number;
        carbs: number;
    };
    metadata: {
        steps: number;
        workoutCount: number;
    };
}

/**
 * useAdaptiveCalories - Adaptive Caloric Engine
 *
 * Dynamically adjusts daily calorie and carbohydrate targets based on:
 * - Steps from Apple Health (synced to steps_log)
 * - Workout type (Tennis = High Intensity boost)
 *
 * CRITICAL: Protein remains STATIC - only carbs/calories adjust
 *
 * @param {StepsEntry[]} stepsLog - Daily step entries from Supabase
 * @param {Workout[]} workoutLog - Workout entries with type field
 * @param {Profile} profile - User profile with trainingDay settings
 * @param {CustomTargets} customTargets - Base nutrition targets
 * @param {string} [selectedDate] - Optional date to check (defaults to today)
 * @returns {AdaptiveCaloriesData} Adjusted targets and boost metadata
 */
export const useAdaptiveCalories = (
    stepsLog: StepsEntry[],
    workoutLog: Workout[],
    profile: Profile,
    customTargets: CustomTargets,
    selectedDate?: string,
): AdaptiveCaloriesData => {
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
                boostAmount: { calories: 0, carbs: 0 },
                metadata: { steps: 0, workoutCount: 0 },
            };
        }

        const date = selectedDate || getArgentinaDateString();

        // 1. Get today's steps
        const todaySteps = stepsLog?.find((s) => s.date === date)?.steps || 0;
        const isHighSteps = todaySteps > 10000;

        // 2. Check for High Intensity workouts (Tennis or specified types)
        const todayWorkouts = workoutLog?.filter((w) => w.date === date) || [];
        const hasTennis = todayWorkouts.some(
            (w) =>
                w.type === 'sport' ||
                w.type === 'tennis' ||
                w.name?.toLowerCase().includes('tennis'),
        );
        const hasHighIntensityGym = false; // Standardized gym days to moderate intensity

        // 3. Determine if boost applies
        const isTrainingDay = isHighSteps || hasTennis || hasHighIntensityGym;

        // 4. Calculate boosts from profile settings
        const calorieBoost = isTrainingDay
            ? profile?.trainingDayCaloriesBonus || 200
            : 0;

        // Carb boost: use trainingDayCarbs if set, otherwise add ~40g
        const baseCarbs = customTargets.carbs || 180;
        const trainingCarbs =
            profile?.trainingDayCarbs && profile.trainingDayCarbs > 0
                ? profile.trainingDayCarbs
                : baseCarbs + 40;
        const carbBoost = isTrainingDay ? trainingCarbs - baseCarbs : 0;

        // 5. Calculate final adjusted targets
        const adjustedCalories = (customTargets.calories || 2100) + calorieBoost;
        const adjustedCarbs = baseCarbs + carbBoost;

        // CRITICAL: Protein and Fat remain STATIC
        const adjustedProtein = customTargets.protein || 170;
        const adjustedFat = customTargets.fat || 70;

        // 6. Build boost reason string
        let boostReason: string | null = null;
        if (isTrainingDay) {
            const reasons: string[] = [];
            if (hasTennis) reasons.push('Partido de Tenis');
            if (isHighSteps && !hasTennis) {
                reasons.push(`${todaySteps.toLocaleString()} pasos`);
            }
            boostReason = reasons.join(' + ') || 'Día de Entreno';
        }

        return {
            adjustedCalories,
            adjustedCarbs,
            adjustedProtein,
            adjustedFat,
            isTrainingDay,
            boostReason,
            boostAmount: {
                calories: calorieBoost,
                carbs: carbBoost,
            },
            metadata: {
                steps: todaySteps,
                workoutCount: todayWorkouts.length,
            },
        };
    }, [stepsLog, workoutLog, profile, customTargets, selectedDate]);
};

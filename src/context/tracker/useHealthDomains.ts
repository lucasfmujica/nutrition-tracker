import { useBiometrics } from '../../hooks/useBiometrics';
import { useNutrition } from '../../hooks/useNutrition';
import { useSafetyNet } from '../../hooks/useSafetyNet';
import { useSupabase } from '../../hooks/useSupabase';
import { useWeeklyPlan } from '../../hooks/useWeeklyPlan';
import { useWeightEditing } from '../../hooks/useWeightEditing';
import { useWorkouts } from '../../hooks/useWorkouts';

/**
 * Core health domains: workouts, biometrics, weekly plan, safety net,
 * nutrition and weight editing.
 *
 * IMPORTANT: hook call order is load-bearing and mirrors the original
 * TrackerContext order (workouts/biometrics -> weeklyPlan -> safetyNet ->
 * nutrition -> weightEditing). Nutrition depends on biometrics targets,
 * safety net helpers, workout log and the weekly plan.
 */
export const useHealthDomains = (
    supabase: ReturnType<typeof useSupabase>,
    useCloud: boolean,
) => {
    // Core Domains - all use the same useCloud
    const workouts = useWorkouts(supabase, useCloud);
    const biometrics = useBiometrics(supabase, useCloud);
    const weeklyPlanHook = useWeeklyPlan(supabase.user?.id);

    // Modo Escudo (Safety Net)
    const safetyNet = useSafetyNet(
        biometrics.profile,
        biometrics.customTargets,
        biometrics.saveProfile,
    );

    // Nutrition with Safety Net integration
    const nutrition = useNutrition(
        supabase,
        useCloud,
        biometrics.customTargets,
        undefined,
        safetyNet.getSafetyNetTargetsForDate,
        safetyNet.shouldTagAsSafetyNetDay,
        workouts.workoutLog,
        weeklyPlanHook.plan, // Pass plan to nutrition
    );

    // Weight Editing (extracted hook)
    const weightEditing = useWeightEditing(biometrics);

    return { workouts, biometrics, weeklyPlanHook, safetyNet, nutrition, weightEditing };
};

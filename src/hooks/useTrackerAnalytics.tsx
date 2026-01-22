import {
    CustomTargets,
    FoodEntry,
    Macros,
    OuraEntry,
    Profile,
    StepsEntry,
    WeightEntry,
    Workout,
} from '../types/domain';
import { useAnalytics } from './useAnalytics';
import { useDynamicTargets } from './useDynamicTargets';
import { useHydrationTarget } from './useHydrationTarget';
import { usePerformanceForecast } from './usePerformanceForecast';
import { useWeightAnalytics } from './useWeightAnalytics';
import { useWeightProjection } from './useWeightProjection';
import { useWorkoutAnalysis } from './useWorkoutAnalysis';

interface AnalyticsParams {
    dashboardDate: string;
    biometrics: {
        weightHistory: WeightEntry[];
        stepsLog: StepsEntry[];
        ouraLog: OuraEntry[];
        customTargets: CustomTargets;
        profile: Profile;
    };
    nutrition: {
        foodLog: FoodEntry[];
        getTotalsForDate: (date: string) => Macros;
        getTargetsForDate: (date: string) => CustomTargets;
    };
    workouts: {
        workoutLog: Workout[];
    };
    safetyNet: any;
    updateConfig: any;
}

/**
 * useTrackerAnalytics - Initializes and coordinates all analytics engines
 *
 * Consolidates analytics and intelligence modules including:
 * - Weight Analytics (Intelligence Engine)
 * - Performance Forecast (Tomorrow's Outlook) - DATE REACTIVE
 * - Predictive Weight Engine
 * - Workout Analysis
 * - Hydration Intelligence
 * - Dynamic Targets (Metabolic Auto-Pilot)
 *
 * CRITICAL: Passes dashboardDate to Performance Forecast for date-reactivity
 *
 * @param {AnalyticsParams} params - Dependencies
 * @returns {Object} All analytics hooks results
 */
export const useTrackerAnalytics = ({
    dashboardDate,
    biometrics,
    nutrition,
    workouts,
    updateConfig,
}: AnalyticsParams) => {
    // Basic Analytics
    const analytics = useAnalytics({
        weightHistory: biometrics.weightHistory,
        foodLog: nutrition.foodLog,
        workoutLog: workouts.workoutLog,
        stepsLog: biometrics.stepsLog,
        customTargets: biometrics.customTargets,
        stepGoal: biometrics.profile.stepGoal,
        getTotalsForDate: nutrition.getTotalsForDate,
        getTargetsForDate: nutrition.getTargetsForDate,
    });

    // Intelligence Engine - Weight Analytics
    const weightAnalytics = useWeightAnalytics(
        biometrics.weightHistory,
        nutrition.foodLog,
        biometrics.customTargets,
        biometrics.profile.currentWeight,
        biometrics.profile.targetWeight,
        biometrics.profile,
        nutrition.getTargetsForDate,
    );

    // Metabolic Auto-Pilot (Dynamic Targets)
    const dynamicTargets = useDynamicTargets(
        weightAnalytics,
        biometrics.customTargets,
        biometrics.profile,
        updateConfig,
    );

    // Performance Forecast (Tomorrow's Outlook)
    const performanceForecast = usePerformanceForecast(
        biometrics.ouraLog,
        workouts.workoutLog,
        dashboardDate,
    );

    // Predictive Weight Engine
    const weightProjection = useWeightProjection(
        biometrics.weightHistory,
        nutrition.foodLog,
        biometrics.stepsLog,
        biometrics.customTargets,
        biometrics.profile,
        nutrition.getTargetsForDate,
    );

    // Workout Analysis (now date-reactive)
    const workoutAnalysis = useWorkoutAnalysis(workouts.workoutLog, dashboardDate);

    // Hydration Intelligence
    const hydrationTarget = useHydrationTarget(workouts.workoutLog, dashboardDate);

    return {
        ...analytics,
        weightAnalytics,
        ...weightAnalytics,
        ...dynamicTargets,
        performanceForecast,
        weightProjection,
        workoutAnalysis,
        hydrationTarget,
    };
};

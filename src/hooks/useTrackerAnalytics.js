import { useAnalytics } from './useAnalytics';
import { useDynamicTargets } from './useDynamicTargets';
import { useHydrationTarget } from './useHydrationTarget';
import { usePerformanceForecast } from './usePerformanceForecast';
import { useWeightAnalytics } from './useWeightAnalytics';
import { useWeightProjection } from './useWeightProjection';
import { useWorkoutAnalysis } from './useWorkoutAnalysis';

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
 * @param {Object} params - Dependencies
 * @returns {Object} All analytics hooks results
 */
export const useTrackerAnalytics = ({
  dashboardDate,
  biometrics,
  nutrition,
  workouts,
  safetyNet,
  updateConfig
}) => {
  // Basic Analytics
  const analytics = useAnalytics({
    weightHistory: biometrics.weightHistory,
    foodLog: nutrition.foodLog,
    workoutLog: workouts.workoutLog,
    stepsLog: biometrics.stepsLog,
    customTargets: biometrics.customTargets,
    stepGoal: biometrics.profile.stepGoal,
    getTotalsForDate: nutrition.getTotalsForDate,
    getTargetsForDate: nutrition.getTargetsForDate
  });

  // Intelligence Engine - Weight Analytics
  const weightAnalytics = useWeightAnalytics(
    biometrics.weightHistory,
    nutrition.foodLog,
    biometrics.customTargets,
    biometrics.profile.currentWeight,
    biometrics.profile.targetWeight
  );

  // Metabolic Auto-Pilot (Dynamic Targets)
  const dynamicTargets = useDynamicTargets(
    weightAnalytics,
    biometrics.customTargets,
    biometrics.profile,
    updateConfig
  );

  // Performance Forecast (Tomorrow's Outlook)
  // ✅ CRITICAL FIX: Now receives dashboardDate for date-reactivity
  const performanceForecast = usePerformanceForecast(
    biometrics.ouraLog,
    workouts.workoutLog,
    dashboardDate  // ✅ Date-reactive parameter
  );

  // Predictive Weight Engine
  const weightProjection = useWeightProjection(
    biometrics.weightHistory,
    nutrition.foodLog,
    biometrics.stepsLog,
    biometrics.customTargets,
    biometrics.profile
  );

  // Workout Analysis (now date-reactive)
  const workoutAnalysis = useWorkoutAnalysis(workouts.workoutLog, dashboardDate);

  // Hydration Intelligence
  const hydrationTarget = useHydrationTarget(workouts.workoutLog);

  return {
    // Spread individual analytics
    ...analytics,

    // Weight Analytics (spread + explicit)
    weightAnalytics,
    ...weightAnalytics,

    // Dynamic Targets
    ...dynamicTargets,

    // Performance Forecast (explicit only - no spread needed)
    performanceForecast,

    // Weight Projection (explicit only)
    weightProjection,

    // Workout Analysis (explicit only)
    workoutAnalysis,

    // Hydration Intelligence (explicit only)
    hydrationTarget
  };
};

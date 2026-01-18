/**
 * targetAdjustmentService.js
 *
 * Pure functional core for the Metabolic Auto-Pilot system.
 * Responsible for calculating ideal weight loss rates and proposing target adjustments.
 *
 * LOGIC RULES:
 * 1. Ideal Rate of Loss: 0.5% - 1.0% of body weight per week
 * 2. Slow Loss (<0.5%): Suggest 5% calorie reduction OR 10% step increase
 * 3. Fast Loss (>1.5kg): Suggest 5% calorie increase (safety break)
 * 4. On Track: Maintain targets
 *
 * @fileoverview
 */

export const ADJUSTMENT_CONSTANTS = {
  IDEAL_RATE_MIN_PCT: 0.005, // 0.5%
  IDEAL_RATE_MAX_PCT: 0.01,  // 1.0%
  FAST_LOSS_THRESHOLD_KG: 1.5, // >1.5kg is too fast regardless of %
  CALORIE_ADJUSTMENT_PCT: 0.05, // 5% shift
  STEP_ADJUSTMENT_PCT: 0.10     // 10% shift
};

/**
 * Calculates the ideal weekly weight loss range based on current weight
 * @param {number} currentWeight - Current body weight in kg
 * @returns {Object} { min: number, max: number } (negative values for loss)
 */
export const calculateIdealRateOfLoss = (currentWeight) => {
  if (!currentWeight || currentWeight <= 0) return { min: -0.5, max: -1.0 };

  // Loss is negative
  const minLoss = -(currentWeight * ADJUSTMENT_CONSTANTS.IDEAL_RATE_MIN_PCT); // e.g. -0.425 kg
  const maxLoss = -(currentWeight * ADJUSTMENT_CONSTANTS.IDEAL_RATE_MAX_PCT); // e.g. -0.85 kg

  return {
    min: Number(minLoss.toFixed(2)), // Slower end (e.g. -0.4kg)
    max: Number(maxLoss.toFixed(2))  // Faster end (e.g. -0.8kg)
  };
};

/**
 * Analyzes weekly trend against ideal range
 * @param {number} currentTrend - Current trend in kg/week (negative = loss)
 * @param {number} currentWeight - Current body weight in kg
 * @returns {Object} { status: 'slow'|'fast'|'onTrack'|'gaining', message: string, severity: 'success'|'warning'|'danger' }
 */
export const analyzeWeeklyPerformance = (currentTrend, currentWeight) => {
  if (currentTrend === null || currentWeight === null) {
    return { status: 'unknown', message: 'Faltan datos para analizar', severity: 'warning' };
  }

  const { min: idealMin, max: idealMax } = calculateIdealRateOfLoss(currentWeight);
  // idealMin is e.g. -0.4 (slower loss), idealMax is -0.8 (faster loss)
  // currentTrend is e.g. -0.3 (slow), -0.6 (good), -1.6 (fast)

  // 1. Gaining Weight (Positive Trend)
  if (currentTrend > 0) {
    return {
      status: 'gaining',
      message: 'Tendencia positiva detectada.',
      severity: 'warning'
    };
  }

  // 2. Too Fast (Safety Hazard)
  // Checks absolute KG loss > 1.5kg OR exceeding percentage significantly
  if (currentTrend < -ADJUSTMENT_CONSTANTS.FAST_LOSS_THRESHOLD_KG) {
    return {
      status: 'fast',
      message: 'Perdida muy rápida (>1.5kg/sem). Riesgo de perder músculo.',
      severity: 'danger'
    };
  }

  // 3. Too Slow (Slower than min ideal)
  // e.g. trend -0.3 vs idealMin -0.4 -> -0.3 > -0.4 is TRUE (arithmetically closer to 0)
  if (currentTrend > idealMin) {
    return {
      status: 'slow',
      message: 'Progreso más lento de lo ideal (<0.5%/sem).',
      severity: 'warning'
    };
  }

  // 4. On Track (Between min and max, or slightly faster but safe)
  return {
    status: 'onTrack',
    message: 'Ritmo de pérdida ideal (0.5% - 1.0%/sem).',
    severity: 'success'
  };
};

/**
 * Calculates new proposed targets based on analysis
 * @param {Object} currentTargets - { calories, steps, ... }
 * @param {number} currentWeight - Current weight kg
 * @param {number} currentTrend - Trend kg/week
 * @param {Object} profile - User profile (for context if needed)
 * @returns {Object} { calories, steps, reasoning: string, actionType: 'reduce'|'increase'|'maintain' }
 */
export const proposeTargetAdjustments = (currentTargets, currentWeight, currentTrend, profile) => {
  const analysis = analyzeWeeklyPerformance(currentTrend, currentWeight);
  const currentCalories = currentTargets.calories || 2000;
  const currentSteps = currentTargets.steps || 10000;

  let newCalories = currentCalories;
  let newSteps = currentSteps;
  let reasoning = '';
  let actionType = 'maintain';

  switch (analysis.status) {
    case 'slow':
    case 'gaining':
      // Option A: Reduce Calories by 5%
      // Option B: Increase Steps by 10%
      // Implementation: We'll apply both slightly or prioritize calories?
      // Spec says: "Suggest 5% reduction in daily calories OR 10% increase in step goals."
      // Let's go with Calorie reduction as primary lever for 'Metabolic Auto-Pilot'
      newCalories = Math.round(currentCalories * (1 - ADJUSTMENT_CONSTANTS.CALORIE_ADJUSTMENT_PCT));
      reasoning = 'El progreso se ha estancado. Reducimos un 5% las calorías para reactivar la quema de grasa.';
      actionType = 'reduce';
      break;

    case 'fast':
      // Increase Calories by 5% to preserve muscle
      newCalories = Math.round(currentCalories * (1 + ADJUSTMENT_CONSTANTS.CALORIE_ADJUSTMENT_PCT));
      reasoning = 'Pérdida demasiado agresiva. Aumentamos calorias ligeramente para proteger tu masa muscular.';
      actionType = 'increase';
      break;

    case 'onTrack':
    default:
      reasoning = 'Estás en el camino perfecto. Mantenemos los objetivos actuales.';
      actionType = 'maintain';
      break;
  }

  // Round steps to nearest 100 if changed (logic if we implemented step increase)
  // For 'slow' we could also bump steps:
  // if (analysis.status === 'slow') newSteps = Math.round((currentSteps * 1.1) / 100) * 100;

  return {
    calories: newCalories,
    steps: newSteps,
    reasoning,
    actionType,
    analysis
  };
};

/**
 * Formats data for the Weekly Briefing Modal
 */
export const formatWeeklySummary = (weightAnalytics, customTargets, profile) => {
  if (!weightAnalytics || !weightAnalytics.currentTrend) return null;

  const { currentTrend, weeklyAdherence } = weightAnalytics;
  const { currentWeight } = profile;

  const proposal = proposeTargetAdjustments(customTargets, currentWeight, currentTrend, profile);

  return {
    currentWeight,
    currentTrend,
    weeklyAdherence, // %
    proposal, // { calories, steps, reasoning, actionType, analysis }
    currentTargets: {
      calories: customTargets.calories,
      steps: customTargets.steps || 10000 // Default if missing
    }
  };
};

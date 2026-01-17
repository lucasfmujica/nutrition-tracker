import { addDaysToDate, getArgentinaDateString, getMondayOfWeek } from './dateUtils';

/**
 * AI-Driven Coach Insights Generator
 *
 * Analyzes user performance data to generate personalized motivational insights
 * for the Weekly Summary section in WorkoutsTab.
 *
 * CRITICAL SAFEGUARDS:
 * - ✅ All dates use Argentina timezone (America/Argentina/Buenos_Aires)
 * - ✅ Gracefully handles missing or incomplete data
 * - ✅ Prioritized logic: Consistency → Recovery → Trend → Fallback
 *
 * @param {Object} data - Performance data
 * @param {Object} data.weightAnalytics - From useWeightAnalytics hook
 * @param {Array} data.ouraLog - Oura sleep/recovery entries
 * @param {Object} data.workoutAnalysis - From useWorkoutAnalysis hook
 * @param {Number} data.currentWeight - Current weight in kg
 * @returns {Object} Insight: { message, icon, type, gradient }
 */

/**
 * Analyze sleep quality from Oura data
 * Returns average sleep score for the last 3 days
 */
const analyzeSleepQuality = (ouraLog) => {
  if (!ouraLog || ouraLog.length === 0) {
    return null;
  }

  // CRITICAL: Use Argentina timezone for date calculations
  const today = getArgentinaDateString();
  const threeDaysAgo = addDaysToDate(today, -3);

  // Get last 3 days of Oura entries
  const recentEntries = ouraLog.filter(entry => {
    return entry.date >= threeDaysAgo && entry.date <= today;
  });

  if (recentEntries.length === 0) {
    return null;
  }

  // Calculate average sleep score
  const totalScore = recentEntries.reduce((sum, entry) => {
    // Oura sleep score is typically 0-100
    return sum + (entry.sleep_score || entry.sleepScore || 0);
  }, 0);

  const avgScore = totalScore / recentEntries.length;

  return {
    avgScore: Math.round(avgScore),
    entries: recentEntries.length
  };
};

/**
 * Check if user needs a recovery day
 * Based on sleep quality and workout frequency
 */
const needsRecovery = (ouraLog, workoutAnalysis) => {
  const sleepData = analyzeSleepQuality(ouraLog);

  if (!sleepData) {
    return false; // Can't determine without Oura data
  }

  const highWorkoutLoad = (workoutAnalysis.gymCount + workoutAnalysis.tennisCount) >= 3;
  const poorSleep = sleepData.avgScore < 70;

  return poorSleep && highWorkoutLoad;
};

/**
 * Get week start date in readable format
 */
const getWeekStartDate = () => {
  const today = getArgentinaDateString();
  const monday = getMondayOfWeek(today);
  const date = new Date(monday + 'T12:00:00');
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

/**
 * Main function: Generate AI-driven weekly coach insight
 */
export const getWeeklyCoachInsight = (data) => {
  const {
    weightAnalytics = {},
    ouraLog = [],
    workoutAnalysis = {},
    currentWeight
  } = data;

  const {
    currentTrend,
    estimatedGoalDate,
    weeklyAdherence = 0,
    remainingWeight = 0
  } = weightAnalytics;

  const TARGET_WEIGHT = 75; // kg - per specifications

  // PRIORITY 1: Perfect Adherence (100%)
  if (weeklyAdherence === 100) {
    const adherencePraise = remainingWeight > 0 && estimatedGoalDate
      ? `¡Impresionante! Estás 100% adherido esta semana. Con esta disciplina, llegarás a ${TARGET_WEIGHT}kg el ${new Date(estimatedGoalDate + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}. Solo faltan ${remainingWeight.toFixed(1)}kg. ¡Imparable! 🚀`
      : `¡Perfecto! Adherencia del 100% esta semana. Estás ejecutando el plan de forma impecable. Así se construyen resultados sólidos. 💪`;

    return {
      message: adherencePraise,
      icon: '🏆',
      type: 'success',
      gradient: 'from-amber-50 to-yellow-50'
    };
  }

  // PRIORITY 2: Recovery Needed (Poor sleep + High activity)
  if (needsRecovery(ouraLog, workoutAnalysis)) {
    const sleepData = analyzeSleepQuality(ouraLog);
    return {
      message: `Tu cuerpo necesita recuperación. Tus últimos ${sleepData.entries} días muestran un promedio de sueño de ${sleepData.avgScore}/100, y has entrenado ${workoutAnalysis.gymCount + workoutAnalysis.tennisCount} veces esta semana. Considera un día de descanso activo o una sesión más ligera para optimizar tu rendimiento. 🌙`,
      icon: '😴',
      type: 'warning',
      gradient: 'from-purple-50 to-indigo-50'
    };
  }

  // PRIORITY 3: Trend Analysis (Weight progress)
  if (currentTrend !== null && currentTrend !== undefined) {
    // Strong weight loss trend
    if (currentTrend < -0.5) {
      const weeksToGoal = remainingWeight > 0 ? (remainingWeight / Math.abs(currentTrend)).toFixed(1) : 0;
      return {
        message: `¡Progreso excelente! Estás perdiendo ${Math.abs(currentTrend).toFixed(2)} kg/semana. A este ritmo, alcanzarás los ${TARGET_WEIGHT}kg en aproximadamente ${weeksToGoal} semanas. Tu consistencia está dando frutos. 📉✨`,
        icon: '🔥',
        type: 'success',
        gradient: 'from-green-50 to-emerald-50'
      };
    }

    // Gaining weight (not ideal for weight loss goal)
    if (currentTrend > 0) {
      return {
        message: `Detecté una tendencia al alza de +${currentTrend.toFixed(2)} kg/semana. Revisa tu adherencia calórica y asegúrate de mantener el déficit. Pequeños ajustes pueden marcar una gran diferencia. 💡`,
        icon: '📊',
        type: 'caution',
        gradient: 'from-orange-50 to-amber-50'
      };
    }

    // Slow progress (between -0.5 and 0)
    if (currentTrend >= -0.5 && currentTrend <= 0) {
      return {
        message: `Tu peso está estable (${currentTrend.toFixed(2)} kg/semana). Esto es normal en algunas semanas. Mantén tu rutina y los resultados vendrán. La consistencia es clave. 🎯`,
        icon: '⚖️',
        type: 'info',
        gradient: 'from-blue-50 to-cyan-50'
      };
    }
  }

  // PRIORITY 4: High Adherence (70-99%)
  if (weeklyAdherence >= 70) {
    return {
      message: `Adherencia del ${weeklyAdherence}% esta semana. Vas muy bien. Cada día de adherencia te acerca más a tu objetivo de ${TARGET_WEIGHT}kg. ¡Sigue así! 💪`,
      icon: '✅',
      type: 'success',
      gradient: 'from-teal-50 to-green-50'
    };
  }

  // PRIORITY 5: Workout Consistency Recognition
  const totalWorkouts = workoutAnalysis.gymCount + workoutAnalysis.tennisCount;
  if (totalWorkouts >= 4) {
    return {
      message: `¡${totalWorkouts} entrenamientos esta semana! Estás mostrando una excelente constancia. Asegúrate de que tu nutrición esté alineada para maximizar estos esfuerzos. 🏋️‍♂️`,
      icon: '💪',
      type: 'success',
      gradient: 'from-amber-50 to-orange-50'
    };
  }

  // FALLBACK: Generic Motivational Message
  const weekStart = getWeekStartDate();
  const hasActivity = totalWorkouts > 0 || weeklyAdherence > 0;

  if (hasActivity) {
    return {
      message: `Semana del ${weekStart}: Cada paso cuenta. Mantén el enfoque en tu objetivo de ${TARGET_WEIGHT}kg. La constancia diaria es lo que genera transformaciones reales. 🌟`,
      icon: '🎯',
      type: 'info',
      gradient: 'from-blue-50 to-purple-50'
    };
  }

  // No data at all
  return {
    message: `Semana del ${weekStart}: Registra tus entrenamientos y comidas para que pueda analizar tu progreso y darte insights personalizados. ¡Empecemos! 📝`,
    icon: '🚀',
    type: 'info',
    gradient: 'from-gray-50 to-slate-50'
  };
};

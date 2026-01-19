import { useMemo } from 'react';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

/**
 * useEffortAnalytics - Adaptive Effort Score (AES)
 *
 * Correlates workout volume with recovery data to optimize effort and prevent overtraining.
 * Now with DYNAMIC scoring that produces meaningful visual variance.
 *
 * @param {Array} workoutLog - List of workout entries
 * @param {Array} ouraLog - List of Oura readiness/sleep entries
 * @param {Object} weightAnalytics - Contains currentTrend (kg/week)
 * @param {string} [selectedDate] - Optional date to check (defaults to today in Argentina TZ)
 */
export const useEffortAnalytics = (workoutLog, ouraLog, weightAnalytics, selectedDate) => {

  return useMemo(() => {
    // 0. Base Data Checks
    if (!workoutLog || !ouraLog || !weightAnalytics) {
      return { status: 'Unknown', insight: 'Need more data.', score: 50 };
    }

    const targetDate = selectedDate || getArgentinaDateString();

    // Helper to calculate daily volume (gym only)
    const getDailyVolume = (date, log) => {
      const entries = log.filter(w => w.date === date && w.type === 'gym');
      return entries.reduce((total, w) => {
        // Use the stored volume field as the source of truth
        // Handle comma decimals for Argentina locale
        const volume = Number(String(w.volume).replace(',', '.')) || 0;
        return total + volume;
      }, 0);
    };

    // Helper to check if any workout exists for a date (gym or tennis/cardio)
    const hasAnyWorkout = (date, log) => {
      return log.some(w => w.date === date);
    };

    // 1. Volume Calculations
    const todayVolume = getDailyVolume(targetDate, workoutLog);
    const hasTrainedToday = hasAnyWorkout(targetDate, workoutLog);
    const hasGymToday = todayVolume > 0;

    // Calculate 7-day average
    let last7DaysVolume = 0;
    for (let i = 0; i < 7; i++) {
      last7DaysVolume += getDailyVolume(addDaysToDate(targetDate, -i), workoutLog);
    }
    const avg7DayVolume = last7DaysVolume / 7;

    // Calculate 30-day average for comparison
    let last30DaysVolume = 0;
    for (let i = 0; i < 30; i++) {
      last30DaysVolume += getDailyVolume(addDaysToDate(targetDate, -i), workoutLog);
    }
    const avg30DayVolume = last30DaysVolume / 30;

    const volumeRatio = avg30DayVolume > 0 ? avg7DayVolume / avg30DayVolume : 1;

    // 2. Recovery Data (Oura) - Get entry for the target date or closest prior
    const targetOura = ouraLog
      .filter(e => e.date <= targetDate)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const readiness = targetOura?.readiness_score || targetOura?.readinessScore || 75;
    const sleepScore = targetOura?.sleep_score || targetOura?.sleepScore || 75;

    // 3. Weight Trend
    const { currentTrend } = weightAnalytics;
    const isAggressiveLoss = currentTrend && currentTrend < -1.0;

    // ===========================================================
    // DYNAMIC SCORE CALCULATION
    // ===========================================================
    // Score 0-100 where:
    // 0-33: Recovery zone (blue/left) - Go easy or rest
    // 34-66: Optimal zone (green/center) - Normal training
    // 67-100: Push zone (orange/right) - Can push hard OR warning

    // Base score from readiness (inverted: high readiness = lower score = more capacity)
    // Readiness 100 -> Score 20 (prime), Readiness 50 -> Score 80 (needs rest)
    let baseScore = 100 - readiness;

    // Adjust for sleep quality
    if (sleepScore < 60) baseScore += 15;
    else if (sleepScore < 70) baseScore += 8;
    else if (sleepScore > 85) baseScore -= 10;

    // Adjust for volume ratio (high recent volume = needs more recovery)
    if (volumeRatio > 1.3) baseScore += 15;
    else if (volumeRatio > 1.1) baseScore += 5;
    else if (volumeRatio < 0.8) baseScore -= 10;

    // Adjust for weight loss rate
    if (isAggressiveLoss) baseScore += 10;

    // Clamp to valid range
    let score = Math.max(5, Math.min(95, baseScore));

    // 4. Determine Status and Insight Based on Score and Context
    let status = 'Optimal';
    let insight = 'Tu cuerpo está recuperado. Buen día para entrenar con intensidad normal.';

    // Override if trained today
    if (hasTrainedToday) {
      status = 'Done';
      insight = hasGymToday
        ? `¡Gran trabajo! ${todayVolume.toLocaleString()} kg de volumen registrado. Enfócate en nutrición y recuperación.`
        : '¡Entreno registrado! Ahora prioriza la recuperación.';
      // Score stays where recovery metrics put it, but shifts slightly left
      score = Math.max(15, score - 15);
    }
    // High fatigue indicators
    else if (score > 75) {
      if (readiness < 60) {
        status = 'Recuperación';
        insight = 'Tu readiness está baja. Considera un día de movilidad o descanso activo.';
      } else if (volumeRatio > 1.3) {
        status = 'Overreaching';
        insight = 'Volumen elevado esta semana. Reduce intensidad para evitar fatiga acumulada.';
      } else {
        status = 'Cuidado';
        insight = 'Señales de fatiga detectadas. Modera la intensidad hoy.';
      }
    }
    // Prime condition
    else if (score < 30 && readiness > 80) {
      status = 'Prime';
      insight = '¡Estás en tu mejor momento! Día ideal para intensidad alta o PR.';
    }
    // Good condition
    else if (score < 45) {
      status = 'Óptimo';
      insight = 'Buena recuperación. Puedes entrenar fuerte hoy.';
    }
    // Normal condition (middle range)
    else {
      status = 'Normal';
      insight = 'Capacidad de entrenamiento normal. Mantén el ritmo planificado.';
    }

    return {
      status,
      insight,
      metrics: {
        volumeRatio: volumeRatio.toFixed(2),
        readiness,
        sleepScore,
        trend: currentTrend,
        todayVolume,
        ouraDate: targetOura?.date || null // Track which date the Oura data is from
      },
      score
    };

  }, [workoutLog, ouraLog, weightAnalytics, selectedDate]);
};

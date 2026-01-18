import { useMemo } from 'react';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

/**
 * useEffortAnalytics - Adaptive Effort Score (AES)
 *
 * Correlates workout volume with recovery data to optimize effort and prevent overtraining.
 *
 * @param {Array} workoutLog - List of workout entries
 * @param {Array} ouraLog - List of Oura readiness/sleep entries
 * @param {Object} weightAnalytics - Contains currentTrend (kg/week)
 */
export const useEffortAnalytics = (workoutLog, ouraLog, weightAnalytics) => {

  return useMemo(() => {
    // 0. Base Data Checks
    if (!workoutLog || !ouraLog || !weightAnalytics) {
      return { status: 'Unknown', insight: 'Need more data.', score: 0 };
    }

    const today = getArgentinaDateString();

    // 1. Calculate Volume Logic
    // Limit to Gym workouts for Volume Load calculation (sets * reps * weight)
    // For Tennis/Other, we might just track duration, but prompt specifies "workout volume (sets/reps/load)"

    // Helper to calculate daily volume
    const getDailyVolume = (date, log) => {
      const entries = log.filter(w => w.date === date && w.type === 'gym');
      return entries.reduce((total, w) => {
        if (w.exercises) {
          return total + w.exercises.reduce((exTotal, ex) => {
            return exTotal + (ex.sets * ex.reps * ex.weight);
          }, 0);
        }
        return total + (w.volume || 0); // Fallback if volume stored directly
      }, 0);
    };

    // Calculate last 7 days volume (including TODAY)
    let last7DaysVolume = 0;
    // Fix: Loop should go from 0 to 6 to count 7 days including today
    for (let i = 0; i < 7; i++) {
      // i=0 is today
      const d = addDaysToDate(today, -i);
      last7DaysVolume += getDailyVolume(d, workoutLog);
    }
    const avg7DayVolume = last7DaysVolume / 7;

    // Check if user ALREADY trained today with significant volume
    const todayVolume = getDailyVolume(today, workoutLog);
    const hasTrainedToday = todayVolume > 500; // Threshold for "significant" workout

    // Calculate last 30 days volume (Monthly Average)
    let last30DaysVolume = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDaysToDate(today, -i);
      last30DaysVolume += getDailyVolume(d, workoutLog);
    }
    const avg30DayVolume = last30DaysVolume / 30;

    // Volume Status
    // Avoid division by zero
    const volumeRatio = avg30DayVolume > 0 ? avg7DayVolume / avg30DayVolume : 1;
    const isHighVolume = volumeRatio > 1.2; // > 20% increase

    // 2. Recovery Logic (Oura)
    // Get latest valid Oura entry (today or yesterday)
    // We prioritize today, but if sync hasn't happened, check yesterday
    const recentOura = ouraLog
      .filter(e => e.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const readiness = recentOura?.readiness_score || recentOura?.readinessScore || 80; // Default to good if missing
    const sleepScore = recentOura?.sleep_score || recentOura?.sleepScore || 80;

    // 3. Weight Correlation
    const { currentTrend } = weightAnalytics;
    // trend is negative for weight loss. "Loss of > 1.5kg/week" means trend < -1.5
    const isAggressiveLoss = currentTrend && currentTrend < -1.5;

    // 4. Decision Matrix (AES)
    let status = 'Optimal';
    let insight = 'Your body is recovering well. Today is a great day for a high-intensity session.';
    let score = 50; // 0-100 scale, 50 is balanced

    // Logic Tree

    // Scenario Pre-check: Already Trained Today
    if (hasTrainedToday) {
      status = 'Done';
      insight = 'Great work today! Your volume is banked. Focus on nutrition and recovery now.';
      score = 40; // Neutral/Recovery zone
    }
    // Scenario A: High Fatigue Warning
    // readiness < 70 AND volume > 20% above monthly avg
    else if (readiness < 70 && isHighVolume) {
      status = 'Overreaching';
      insight = 'Fatigue is high and volume is spiking. Consider a shorter session or active recovery to protect your progress.';
      score = 90;
    }
    // Scenario B: Aggressive Cut Warning
    // Weight loss > 1.5kg/week AND sleep < 65
    else if (isAggressiveLoss && sleepScore < 65) {
      status = 'Deload Needed';
      insight = 'Rapid weight loss combined with poor sleep increases injury risk. Recommended: Immediate Deload Day (Low Intensity/Yoga).';
      score = 80;
    }
    // Scenario C: Recovery Mode
    // Just poor readiness independent of volume
    else if (readiness < 60) {
      status = 'Recovering';
      insight = 'Readiness is low. Focus on technique and mobility rather than heavy loads today.';
      score = 75;
    }
    // Scenario D: Prime Time
    // Good readiness and moderate/high volume usually means adaptation
    else if (readiness > 85 && !isHighVolume) {
      status = 'Prime';
      insight = 'Systems are go! You are primed for a PR attempt or high-volume session.';
      score = 20;
    }

    // 5. Structure for UI
    return {
      status,
      insight,
      metrics: {
        volumeRatio: volumeRatio.toFixed(2),
        readiness,
        sleepScore,
        trend: currentTrend
      },
      score // For gauge position
    };

  }, [workoutLog, ouraLog, weightAnalytics]);
};

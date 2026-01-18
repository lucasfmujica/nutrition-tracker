import { useMemo } from 'react';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

/**
 * usePatternRecognition
 *
 * Analyzes behavioral patterns between sleep and nutrition.
 * Specifically looks for "Protein Adherence Drops" following "Low Sleep" days.
 *
 * @param {Array} ouraLog - Array of Oura entries { date, sleepHours, ... }
 * @param {Function} getTotalsForDate - Function(date) => { protein, ... }
 * @param {Function} getTargetsForDate - Function(date) => { protein, ... }
 */
export const usePatternRecognition = (ouraLog, getTotalsForDate, getTargetsForDate) => {
  const currentDate = getArgentinaDateString();

  const insight = useMemo(() => {
    if (!ouraLog || ouraLog.length === 0) return null;

    // Configuration
    const sleepThreshold = 6.5; // hours
    const correlationThreshold = 0.70; // 70%
    const minOccurrences = 3; // Statistical significance
    const lookbackDays = 14;

    // 1. Identify "Trigger Days" (Low Sleep) in the last 14 days
    const recentHistory = ouraLog
      .filter(entry => {
        // Simple day diff check (naive but sufficient for sorted/recent logs)
        // ideally use date-fns differenceInDays, but we'll stick to string comparison or simple slice if sorted
        // For robustness, let's filter by date string range if possible,
        // but assuming ouraLog is the source of truth for "days with data".
        return entry.date < currentDate && entry.date >= addDaysToDate(currentDate, -lookbackDays);
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Descending

    const lowSleepDays = recentHistory.filter(entry => entry.sleepHours < sleepThreshold);

    if (lowSleepDays.length < minOccurrences) {
      return null; // Not enough data points
    }

    // 2. Check "Effect" (Low Protein) on those specific days
    let lowProteinCount = 0;

    lowSleepDays.forEach(day => {
      const date = day.date;
      const totals = getTotalsForDate(date);
      const targets = getTargetsForDate(date);

      if (!targets) return; // Verify targets exists

      const proteinAdherence = (targets.protein > 0) ? (totals.protein / targets.protein) : 1;

      // Define "Protein Drop" as < 80% adherence (or < 20% drop as requested)
      if (proteinAdherence < 0.8) {
        lowProteinCount++;
      }
    });

    // 3. Calculate Correlation
    const correlation = lowProteinCount / lowSleepDays.length;

    // 4. Check Context (Today's Data)
    // We only want to surface this "Actionable Warning" if the user fits the trigger condition TODAY.
    // Otherwise it's just noise.
    const todayEntry = ouraLog.find(e => e.date === currentDate);
    const isTriggeredToday = todayEntry && todayEntry.sleepHours < sleepThreshold;

    if (correlation >= correlationThreshold && isTriggeredToday) {
      const dropPercentage = Math.round(correlation * 100);

      return {
        type: 'warning',
        title: 'Ojo, Lucas',
        message: `Hoy dormiste menos de ${sleepThreshold}h. Detecté que esto suele bajar tu consumo de proteína un 20%.`,
        description: `En los últimos ${lookbackDays} días, esto pasó ${Math.round(correlation * 100)}% de las veces. ¡Prepará el batido ya!`,
        icon: 'Sleep'
      };
    }

    return null;

  }, [ouraLog, getTotalsForDate, getTargetsForDate, currentDate]);

  return insight;
};

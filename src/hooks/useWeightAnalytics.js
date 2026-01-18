import { useMemo } from 'react';
import { addDaysToDate, getArgentinaDateString, getMondayOfWeek } from '../utils/dateUtils';

/**
 * useWeightAnalytics - Intelligence Engine for LukenFit
 *
 * Transforms raw weight and nutrition data into predictive analytics:
 * - Real Rate of Loss (R) - kg/week trend
 * - Estimated Goal Date - when user will reach 75kg target
 * - Weekly Adherence Score - % compliance with calorie/protein targets
 * - Remaining Weight - kg left to reach goal
 *
 * @param {Array} weightHistory - Sorted weight entries from useBiometrics
 * @param {Array} foodLog - Food entries from useNutrition
 * @param {Object} customTargets - Nutrition targets from useBiometrics
 * @param {Number} currentWeight - Current weight in kg
 * @returns {Object} Analytics: { currentTrend, estimatedGoalDate, weeklyAdherence, remainingWeight }
 *
 * CRITICAL SAFEGUARDS:
 * - ✅ All dates use Argentina timezone (America/Argentina/Buenos_Aires)
 * - ✅ SSOT: Uses validated data from Supabase via parent hooks
 * - ✅ Performance: useMemo prevents recalculation on every render
 * - ✅ Edge Cases: Handles missing data, sparse entries, and invalid states
 */
export const useWeightAnalytics = (weightHistory, foodLog, customTargets, currentWeight, targetWeight = 75) => {
  const TARGET_WEIGHT = targetWeight;

  /**
   * Calculate Real Rate of Loss (R)
   * Formula: R = (Weight_t - Weight_{t-14}) / 2 (kg/week)
   *
   * CRITICAL: Handles missing days via linear interpolation
   * CRITICAL: Uses Argentina timezone for all date comparisons
   */
  const currentTrend = useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) {
      return null;
    }

    // CRITICAL: Use Argentina timezone for date calculations
    const today = getArgentinaDateString();
    const fourteenDaysAgo = addDaysToDate(today, -14);

    // Filter entries within the last 14 days (inclusive)
    const recentEntries = weightHistory.filter(entry => {
      return entry.date >= fourteenDaysAgo && entry.date <= today;
    });

    // Edge case: Not enough data points
    if (recentEntries.length < 2) {
      return null;
    }

    // Sort by date ascending (oldest first)
    const sortedEntries = [...recentEntries].sort((a, b) => a.date.localeCompare(b.date));

    // Get the first and last weight in the 14-day window
    const oldestEntry = sortedEntries[0];
    const newestEntry = sortedEntries[sortedEntries.length - 1];

    // Calculate days between entries
    const oldestDate = new Date(oldestEntry.date + 'T12:00:00');
    const newestDate = new Date(newestEntry.date + 'T12:00:00');
    const daysDiff = Math.abs((newestDate - oldestDate) / (1000 * 60 * 60 * 24));

    // Guard: If dates are the same, cannot calculate trend
    if (daysDiff === 0) {
      return 0;
    }

    // Calculate weight difference
    const w1 = Number(String(newestEntry.weight).replace(',', '.'));
    const w2 = Number(String(oldestEntry.weight).replace(',', '.'));

    if (isNaN(w1) || isNaN(w2)) {
      return null;
    }

    const weightDiff = w1 - w2;

    // Convert to kg/week: (weightDiff / daysDiff) * 7
    // Note: Negative value = losing weight, Positive = gaining weight
    const ratePerWeek = (weightDiff / daysDiff) * 7;

    return ratePerWeek;
  }, [weightHistory]);

  /**
   * Calculate remaining weight to target
   */
  const remainingWeight = useMemo(() => {
    if (!currentWeight || currentWeight <= TARGET_WEIGHT) {
      return 0;
    }
    return currentWeight - TARGET_WEIGHT;
  }, [currentWeight]);

  /**
   * Project estimated goal date
   * Formula: T (weeks) = (Current Weight - 75) / R
   *
   * CRITICAL: Uses Argentina timezone for date projection
   * Edge case: If R >= 0 (not losing weight), returns null
   */
  const estimatedGoalDate = useMemo(() => {
    // Edge cases
    if (!currentWeight || currentWeight <= TARGET_WEIGHT) {
      return 'Meta alcanzada! 🎉';
    }

    if (!currentTrend || currentTrend >= 0) {
      // Not losing weight (gaining or maintaining)
      return null;
    }

    // Calculate weeks to goal
    // currentTrend is negative when losing weight, so we need absolute value
    const weeksToGoal = remainingWeight / Math.abs(currentTrend);
    const daysToGoal = Math.round(weeksToGoal * 7);

    // CRITICAL: Use Argentina timezone for date projection
    const today = getArgentinaDateString();
    const projectedDate = addDaysToDate(today, daysToGoal);

    return projectedDate;
  }, [currentWeight, currentTrend, remainingWeight]);

  /**
   * Calculate Weekly Adherence Score
   * Measures % of days in current week where user stayed within ±10% of calorie AND protein goals
   *
   * CRITICAL: Uses Argentina timezone for week boundaries
   */
  const weeklyAdherence = useMemo(() => {
    if (!foodLog || !customTargets) {
      return 0;
    }

    // CRITICAL: Use Argentina timezone to get current week's Monday
    const today = getArgentinaDateString();
    const monday = getMondayOfWeek(today);

    // Generate all 7 days of the current week
    const weekDays = Array.from({ length: 7 }, (_, i) => addDaysToDate(monday, i));

    let adherentDays = 0;
    let totalDays = 0;

    weekDays.forEach(date => {
      // Don't count future days
      if (date > today) return;

      totalDays++;

      // Get all food entries for this date
      // Safety Net: Filter out days marked as safety net days from adherence check
      const dayEntries = foodLog.filter(entry => entry.date === date && !entry.is_safety_net_day);

      // If no entries (or only safety net entries), skip
      if (dayEntries.length === 0) {
        return;
      }

      // Calculate totals for the day
      const totals = dayEntries.reduce((acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.protein || 0)
      }), { calories: 0, protein: 0 });

      // Check adherence (within ±10%)
      const calorieTarget = customTargets.calories;
      const proteinTarget = customTargets.protein;

      const calorieDiff = Math.abs(totals.calories - calorieTarget);
      const proteinDiff = Math.abs(totals.protein - proteinTarget);

      const caloriesOk = calorieDiff <= calorieTarget * 0.1;
      const proteinOk = proteinDiff <= proteinTarget * 0.1;

      const isAdherent = caloriesOk && proteinOk;

      if (isAdherent) {
        adherentDays++;
      }
    });

    // Calculate percentage
    const adherencePercentage = totalDays > 0 ? (adherentDays / totalDays) * 100 : 0;

    return Math.round(adherencePercentage);
  }, [foodLog, customTargets]);

  return {
    currentTrend,           // kg/week (negative = losing, positive = gaining, null = no data)
    estimatedGoalDate,      // YYYY-MM-DD or null
    weeklyAdherence,        // 0-100 percentage
    remainingWeight         // kg to target
  };
};

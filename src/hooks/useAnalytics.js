import { useCallback, useMemo } from 'react';
import { addDaysToDate, getArgentinaDateString, getMondayOfWeek } from '../utils/dateUtils';

export const useAnalytics = (trackerData) => {
  const {
    weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    customTargets,
    getTotalsForDate,
    getTargetsForDate
  } = trackerData;

  // Get weight data with 7-day moving average
  const getWeightChartData = useMemo(() => {
    if (weightHistory.length === 0) return [];

    const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    return sorted.map((entry, idx) => {
      const windowStart = Math.max(0, idx - 6);
      const window = sorted.slice(windowStart, idx + 1);
      const avg = window.reduce((sum, e) => sum + e.weight, 0) / window.length;

      return {
        date: entry.date,
        weight: entry.weight,
        avg7d: Math.round(avg * 10) / 10,
        dayLabel: new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
      };
    });
  }, [weightHistory]);

  // Calculate weekly adherence stats
  const getWeeklyAdherence = useCallback((weeksAgo = 0) => {
    const today = getArgentinaDateString();

    // Get Monday of current week, then go back weeksAgo weeks
    let mondayStr = getMondayOfWeek(today);
    for (let i = 0; i < weeksAgo; i++) {
      mondayStr = addDaysToDate(mondayStr, -7);
    }

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = addDaysToDate(mondayStr, i);
      // Stop if future
      if (dateStr > today && weeksAgo === 0) break;
      weekDates.push(dateStr);
    }

    let daysTracked = 0;
    let calOkDays = 0;
    let protOkDays = 0;
    let stepsOkDays = 0;
    let totalCals = 0;
    let totalProt = 0;
    let totalSteps = 0;

    weekDates.forEach(date => {
      const totals = getTotalsForDate(date);
      const targets = getTargetsForDate(date);
      // Steps for date
      const stepsEntry = stepsLog.find(s => s.date === date);
      const steps = stepsEntry ? stepsEntry.steps : 0;

      // If registered something
      if (totals.calories > 0 || steps > 0) {
        daysTracked++;
        totalCals += totals.calories;
        totalProt += totals.protein;
        totalSteps += steps;

        // Calorie goal check (+- 150)
        if (Math.abs(totals.calories - targets.calories) <= 150) calOkDays++;
        // Protein goal check (>= 90%)
        if (totals.protein >= targets.protein * 0.9) protOkDays++;
        // Steps goal check (>= 8000 default) - assumes 8000 if not set, or just use hardcoded for now
        if (steps >= 8000) stepsOkDays++;
      }
    });

    const avgCals = daysTracked > 0 ? Math.round(totalCals / daysTracked) : 0;
    const avgProt = daysTracked > 0 ? Math.round(totalProt / daysTracked) : 0;
    const avgSteps = daysTracked > 0 ? Math.round(totalSteps / daysTracked) : 0;

    // Score 1-10 depends on consistency
    // Simple heuristic
    let score = 0;
    if (daysTracked > 0) {
      const consistency = daysTracked / 7;
      const budgetAdherence = calOkDays / daysTracked;
      const protAdherence = protOkDays / daysTracked;
      const stepsAdherence = stepsOkDays / daysTracked;

      score = (consistency * 2) + (budgetAdherence * 4) + (protAdherence * 3) + (stepsAdherence * 1);
      score = Math.min(10, Math.round(score * 10) / 10);
    }

    return {
      daysTracked,
      calOkDays,
      protOkDays,
      stepsOkDays,
      avgCals,
      avgProt,
      avgSteps,
      score,
      monday: mondayStr
    };
  }, [getTotalsForDate, getTargetsForDate, stepsLog]);

  // Weekly workout analysis
  const getWeeklyWorkoutAnalysis = useCallback(() => {
    // Last 4 weeks
    const weeks = [];
    const today = getArgentinaDateString();

    for (let i = 0; i < 4; i++) {
      const stats = getWeeklyAdherence(i);
      // Count workouts in that week
      let workoutCount = 0;
      let volume = 0;

      const monday = stats.monday;
      const sunday = addDaysToDate(monday, 6);

      workoutLog.forEach(w => {
        if (w.date >= monday && w.date <= sunday) {
          workoutCount++;
          volume += w.volume || 0;
        }
      });

      weeks.push({
        label: i === 0 ? 'Esta semana' : `Hace ${i} sem`,
        workouts: workoutCount,
        volume: volume,
        adherence: stats.score
      });
    }
    return weeks.reverse(); // Oldest to newest
  }, [getWeeklyAdherence, workoutLog]);

  // Get weekly data for charts
  const getWeeklyData = useMemo(() => {
    const today = getArgentinaDateString();
    const days = [];
    // Last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const date = addDaysToDate(today, -i);
      const totals = getTotalsForDate(date);
      const targets = getTargetsForDate(date);
      const stepsEntry = stepsLog.find(s => s.date === date);

      days.push({
        name: new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' }),
        calories: totals.calories,
        target: targets.calories,
        protein: totals.protein,
        targetProtein: targets.protein,
        steps: stepsEntry ? stepsEntry.steps : 0
      });
    }
    return days;
  }, [foodLog, stepsLog, customTargets, getTotalsForDate, getTargetsForDate]);

  return {
    getWeightChartData,
    getWeeklyAdherence,
    getWeeklyWorkoutAnalysis,
    getWeeklyData
  };
};

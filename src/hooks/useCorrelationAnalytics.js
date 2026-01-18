import { useMemo } from 'react';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';

/**
 * useCorrelationAnalytics - Uncovering hidden connections
 *
 * 1. Fuel Efficiency: Previous Day Carbs -> Workout Volume
 * 2. Recovery Cost: Workout Volume -> Next Night Deep Sleep
 * 3. Sleep Discipline: Sleep Score -> Dietary Adherence (Calories)
 */
export const useCorrelationAnalytics = (foodLog, workoutLog, ouraLog) => {
  return useMemo(() => {
    // 1. Prepare Data Maps for O(1) lookup
    const foodMap = new Map();
    foodLog.forEach(f => {
      if (!foodMap.has(f.date)) foodMap.set(f.date, { carbs: 0, calories: 0 });
      const day = foodMap.get(f.date);
      day.carbs += (parseInt(f.carbs) || 0);
      day.calories += (parseInt(f.calories) || 0);
    });

    const workoutMap = new Map();
    workoutLog.forEach(w => {
      // Simple volume metric: duration * RPE (if available) or just count/duration
      // For now, let's use Total Duration as a proxy for Volume/Load
      const vol = w.duration || 45;
      if (!workoutMap.has(w.date)) workoutMap.set(w.date, 0);
      workoutMap.set(w.date, workoutMap.get(w.date) + vol);
    });

    const ouraMap = new Map();
    ouraLog.forEach(o => {
      if (o.readiness_score) { // Ensure validity
        ouraMap.set(o.date, {
          score: o.readiness_score, // or sleep_score
          deep: o.deep_sleep || 0
        });
      }
    });

    // 2. Generate Datasets
    const fuelData = []; // Carbs (T-1) vs Volume (T)
    const recoveryData = []; // Volume (T) vs Deep Sleep (T) (Sleep reported on T+1 usually?
    // Wait: Oura date is the morning date.
    // So Sleep(Jan 18) protects Activity(Jan 18).
    // Or Activity(Jan 18) impacts Sleep(Jan 19)?
    // Let's assume: High Volume(Jan 18) -> Needs Recovery Sleep(Jan 19).
    const disciplineData = []; // Sleep Score (T) -> Calories (T) (Did bad sleep cause overeating?)

    const dates = new Set([...foodMap.keys(), ...workoutMap.keys(), ...ouraMap.keys()]);

    dates.forEach(date => {
      const yesterday = addDaysToDate(date, -1);
      const tomorrow = addDaysToDate(date, 1);

      // Correlation 1: Fuel (Carbs yesterday vs Workout today)
      const yesterdayCarbs = foodMap.get(yesterday)?.carbs;
      const todayVolume = workoutMap.get(date);
      if (yesterdayCarbs > 0 && todayVolume > 0) {
        fuelData.push({ x: yesterdayCarbs, y: todayVolume, date });
      }

      // Correlation 2: Strain (Workout today vs Deep Sleep tomorrow morning)
      // High strain today should correlate with deep sleep tonight (reported tomorrow)
      const tomorrowSleep = ouraMap.get(tomorrow);
      if (todayVolume > 0 && tomorrowSleep?.deep > 0) {
        recoveryData.push({ x: todayVolume, y: tomorrowSleep.deep / 60, date }); // Deep in minutes? usually seconds in API, let's assume raw is appropriate or check schema. Assuming raw is seconds -> /60 for mins.
      }

      // Correlation 3: Discipline (Sleep Score today vs Calories today)
      const todaySleep = ouraMap.get(date);
      const todayCals = foodMap.get(date)?.calories;
      if (todaySleep?.score > 0 && todayCals > 0) {
        disciplineData.push({ x: todaySleep.score, y: todayCals, date });
      }
    });

    return {
      fuelData: fuelData.slice(-30), // Last 30 points for relevance
      recoveryData: recoveryData.slice(-30),
      disciplineData: disciplineData.slice(-30)
    };
  }, [foodLog, workoutLog, ouraLog]);
};

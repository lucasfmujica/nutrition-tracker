/**
 * useHydrationTarget.js
 *
 * Dynamic hydration target calculation based on:
 * - Weather conditions (temperature & humidity)
 * - Activity levels (Tennis/Gym workouts)
 *
 * Formula: Target = 2500ml (baseline) + ActivityBonus + HeatBonus
 *
 * @compliance @data-integrity-guardian - 2500ml baseline NEVER reduced
 * @compliance @code-quality-pragmatist - useMemo for performance
 * @compliance @Jenny - Argentina timezone for date operations
 */

import { useEffect, useMemo, useState } from 'react';
import { getCurrentWeather } from '../services/weatherService';
import { getArgentinaDateString } from '../utils/dateUtils';

// Constants
const BASELINE_ML = 2500; // Minimum daily target (never reduced)
const ML_PER_ACTIVITY_MINUTE = 10;

// Heat factor thresholds
const TEMP_THRESHOLD_MILD = 28;  // °C
const TEMP_THRESHOLD_HIGH = 32;  // °C
const HUMIDITY_THRESHOLD = 70;   // %

const HEAT_BONUS_MILD = 500;     // ml
const HEAT_BONUS_HIGH = 300;     // ml (additional, total 800ml)

/**
 * Calculate activity bonus from workout log
 * Sums duration of Tennis and Gym workouts for the current date
 *
 * @param {Array} workoutLog - List of workout entries
 * @param {string} currentDate - YYYY-MM-DD date string
 * @returns {number} Total activity minutes
 */
const calculateActivityMinutes = (workoutLog, currentDate) => {
  if (!workoutLog || !Array.isArray(workoutLog)) return 0;

  const todaysWorkouts = workoutLog.filter(workout => {
    if (workout.date !== currentDate) return false;

    const type = workout.type?.toLowerCase() || '';
    return type === 'tennis' || type === 'gym';
  });

  const totalMinutes = todaysWorkouts.reduce((sum, workout) => {
    const duration = parseInt(workout.duration) || 0;
    return sum + (duration > 0 ? duration : 0); // Validate positive duration
  }, 0);

  return totalMinutes;
};

/**
 * Calculate heat bonus based on weather conditions
 *
 * Rules:
 * - Temp > 28°C OR Humidity > 70%: +500ml
 * - Temp > 32°C: +300ml additional (total +800ml)
 *
 * @param {Object} weather - { temperature, humidity }
 * @returns {Object} { bonus: number, needsElectrolytes: boolean }
 */
const calculateHeatBonus = (weather) => {
  if (!weather || weather.temperature === undefined || weather.humidity === undefined) {
    return { bonus: 0, needsElectrolytes: false };
  }

  const { temperature, humidity } = weather;
  let bonus = 0;
  let needsElectrolytes = false;

  // Check mild heat conditions
  if (temperature > TEMP_THRESHOLD_MILD || humidity > HUMIDITY_THRESHOLD) {
    bonus += HEAT_BONUS_MILD; // +500ml
  }

  // Check high heat conditions (additional bonus + electrolyte recommendation)
  if (temperature > TEMP_THRESHOLD_HIGH) {
    bonus += HEAT_BONUS_HIGH; // +300ml (total 800ml)
    needsElectrolytes = true;
  }

  return { bonus, needsElectrolytes };
};

/**
 * Custom hook for dynamic hydration target calculation
 *
 * @param {Array} workoutLog - User's workout log
 * @returns {Object} Hydration target data
 */
export const useHydrationTarget = (workoutLog) => {
  const [weather, setWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  // Fetch weather data on mount
  useEffect(() => {
    const loadWeather = async () => {
      try {
        setIsLoadingWeather(true);
        const weatherData = await getCurrentWeather();
        setWeather(weatherData);
      } catch (error) {
        console.error('[useHydrationTarget] Error loading weather:', error);
        setWeather(null);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    loadWeather();
  }, []);

  // Calculate hydration target (memoized for performance)
  const hydrationData = useMemo(() => {
    const currentDate = getArgentinaDateString();

    // Calculate activity bonus
    const activityMinutes = calculateActivityMinutes(workoutLog, currentDate);
    const activityBonus = activityMinutes * ML_PER_ACTIVITY_MINUTE;

    // Calculate heat bonus
    const { bonus: heatBonus, needsElectrolytes } = calculateHeatBonus(weather);

    // Final target (baseline + bonuses)
    // CRITICAL: Baseline is 2500ml minimum, never reduced
    const target = BASELINE_ML + activityBonus + heatBonus;

    return {
      target,
      baseline: BASELINE_ML,
      activityBonus,
      heatBonus,
      needsElectrolytes,
      weatherStatus: weather ? {
        temperature: weather.temperature,
        humidity: weather.humidity,
        location: weather.location
      } : null,
      isLoadingWeather,
      activityMinutes
    };
  }, [workoutLog, weather, isLoadingWeather]);

  return hydrationData;
};

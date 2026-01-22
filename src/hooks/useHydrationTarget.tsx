import { useEffect, useMemo, useState } from 'react';
import { getCurrentWeather } from '../services/weatherService';
import { Workout } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

// Constants
const BASELINE_ML = 2500; // Minimum daily target (never reduced)
const ML_PER_ACTIVITY_MINUTE = 10;

// Heat factor thresholds
const TEMP_THRESHOLD_MILD = 28; // °C
const TEMP_THRESHOLD_HIGH = 32; // °C
const HUMIDITY_THRESHOLD = 70; // %

const HEAT_BONUS_MILD = 500; // ml
const HEAT_BONUS_HIGH = 300; // ml (additional, total 800ml)

import { HydrationTarget } from '../components/Dashboard/HydrationGuard';
import { WeatherData } from '../services/weatherService';

/**
 * Calculate activity bonus from workout log
 * Sums duration of Tennis and Gym workouts for the current date
 */
const calculateActivityMinutes = (workoutLog: Workout[], currentDate: string) => {
    if (!workoutLog || !Array.isArray(workoutLog)) return 0;

    const todaysWorkouts = workoutLog.filter((workout) => {
        if (workout.date !== currentDate) return false;

        const type = workout.type?.toLowerCase() || '';
        return type === 'tennis' || type === 'gym';
    });

    const totalMinutes = todaysWorkouts.reduce((sum, workout) => {
        const duration = Number(workout.duration) || 0;
        return sum + (duration > 0 ? duration : 0); // Validate positive duration
    }, 0);

    return totalMinutes;
};

/**
 * Calculate heat bonus based on weather conditions
 */
const calculateHeatBonus = (weather: WeatherData | null) => {
    if (
        !weather ||
        weather.temperature === undefined ||
        weather.humidity === undefined
    ) {
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
 */
export const useHydrationTarget = (
    workoutLog: Workout[],
    date: string,
): HydrationTarget => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);

    // Determine if the requested date is today
    const isToday = useMemo(() => {
        return date === getArgentinaDateString();
    }, [date]);

    // Fetch weather data only if it is today
    useEffect(() => {
        if (!isToday) {
            setWeather(null);
            return;
        }

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
    }, [isToday]);

    // Calculate hydration target (memoized for performance)
    const hydrationData = useMemo(() => {
        // Calculate activity bonus for the specific date
        const activityMinutes = calculateActivityMinutes(workoutLog, date);
        const activityBonus = activityMinutes * ML_PER_ACTIVITY_MINUTE;

        // Calculate heat bonus (only applies if we have weather data, i.e., today)
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
            weatherStatus: weather
                ? {
                      temperature: weather.temperature,
                      humidity: weather.humidity,
                      location: weather.location,
                  }
                : null,
            isLoadingWeather,
            activityMinutes,
        };
    }, [workoutLog, weather, isLoadingWeather, date]);

    return hydrationData;
};

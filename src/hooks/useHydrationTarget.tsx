import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDailyWeather } from '../services/weatherService';
import { Profile, WaterEntry, Workout } from '../types/domain';
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

import {
    HydrationTarget,
    WeatherStatus,
} from '../components/Dashboard/HydrationGuard';
import { DailyWeather } from '../services/weatherService';

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
const calculateHeatBonus = (weather: DailyWeather | null) => {
    if (!weather || weather.maxTemp === undefined) {
        return { bonus: 0, needsElectrolytes: false };
    }

    const { maxTemp, unit } = weather;

    // Normalize temperature to Celsius for checking thresholds
    let tempInCelsius = maxTemp;
    if (unit === 'F') {
        tempInCelsius = (maxTemp - 32) * (5 / 9);
    }

    let bonus = 0;
    let needsElectrolytes = false;

    // Check mild heat conditions
    if (tempInCelsius > TEMP_THRESHOLD_MILD) {
        bonus += HEAT_BONUS_MILD; // +500ml
    }

    // Check high heat conditions (additional bonus + electrolyte recommendation)
    if (tempInCelsius > TEMP_THRESHOLD_HIGH) {
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
    profile: Profile,
    waterLog: WaterEntry[] = [],
): HydrationTarget => {
    const { i18n } = useTranslation();
    const [weather, setWeather] = useState<DailyWeather | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);

    // Get existing water entry for this date to check if we already have data
    const existingEntry = useMemo(
        () => waterLog.find((e) => e.date === date),
        [waterLog, date],
    );

    // Check if smart hydration is enabled
    const isSmartHydrationEnabled = profile.smartHydration !== false; // Default to true

    // Fetch weather data
    useEffect(() => {
        // If smart hydration is disabled, don't fetch
        if (!isSmartHydrationEnabled) {
            setWeather(null);
            return;
        }

        // If we already have stored weather data for this date, use it
        if (existingEntry?.maxTemp !== undefined && existingEntry?.weatherUnit) {
            setWeather({
                date,
                maxTemp: existingEntry.maxTemp,
                unit: existingEntry.weatherUnit,
                location: existingEntry.weatherLocation || '',
                isForecast: false, // Historical/Stored
            });
            return;
        }

        const loadWeather = async () => {
            try {
                setIsLoadingWeather(true);
                // Fetch max temp for the specific date
                const weatherData = await getDailyWeather(date, i18n.language);
                setWeather(weatherData);
            } catch (error) {
                console.error('[useHydrationTarget] Error loading weather:', error);
                setWeather(null);
            } finally {
                setIsLoadingWeather(false);
            }
        };

        loadWeather();
    }, [
        date,
        i18n.language,
        isSmartHydrationEnabled,
        existingEntry?.maxTemp,
        existingEntry?.weatherUnit,
        existingEntry?.weatherLocation,
    ]);

    // Calculate hydration target (memoized for performance)
    const hydrationData = useMemo(() => {
        // 1. Activity Bonus (Always applies)
        const activityMinutes = calculateActivityMinutes(workoutLog, date);
        const activityBonus = activityMinutes * ML_PER_ACTIVITY_MINUTE;

        // 2. Heat Bonus (Only if Smart Hydration enabled)
        let heatBonus = 0;
        let needsElectrolytes = false;
        let weatherStatus: WeatherStatus | null = null;

        if (isSmartHydrationEnabled) {
            // Use stored daily target if available (consistency)
            if (existingEntry?.dailyTarget) {
                // Even if we use stored target, we recalculate breakdown for UI if possible
                // But strictly, if we stored a target, we should probably respect it.
                // For now, we assume the stored target was calculated with the same logic.
                // We still calculate heat bonus based on weather to show the "Why" in UI.
            }

            const heatCalculation = calculateHeatBonus(weather);
            heatBonus = heatCalculation.bonus;
            needsElectrolytes = heatCalculation.needsElectrolytes;

            if (weather) {
                weatherStatus = {
                    temperature: weather.maxTemp,
                    humidity: 0, // Daily max temp API might not give humidity easily, simple version for now
                    location: weather.location,
                    unit: weather.unit,
                };
            }
        }

        // Final target
        // If we have a stored daily target, use it?
        // Logic: The stored target in DB is the "official" one for that day.
        // But if user changes workouts, activity bonus changes.
        // So we should probably re-calculate activity bonus live, but keep heat bonus fixed based on stored weather?
        // Actually, let's keep it dynamic based on current inputs, but using stored weather ensures historical weather doesn't change.

        const target = BASELINE_ML + activityBonus + heatBonus;

        return {
            target,
            baseline: BASELINE_ML,
            activityBonus,
            heatBonus,
            needsElectrolytes,
            weatherStatus,
            isLoadingWeather,
            activityMinutes,
        };
    }, [workoutLog, weather, isLoadingWeather, date, isSmartHydrationEnabled]);

    return hydrationData;
};

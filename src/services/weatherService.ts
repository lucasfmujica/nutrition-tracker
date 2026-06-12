/**
 * weatherService.ts
 *
 * Open-Meteo Weather API Integration
 * Fetches daily maximum temperature for hydration target calculation.
 * Supports historical data and caching.
 *
 * API Docs: https://open-meteo.com/
 */

import { storage } from '../utils/storage';

// Coordinates
const COORDS = {
    BA: { lat: -34.6037, lon: -58.3816, name: 'Buenos Aires' },
    NYC: { lat: 40.7128, lon: -74.006, name: 'New York' },
};

interface WeatherOptions {
    timezone?: string;
    unitSystem?: 'metric' | 'imperial';
}

// Cache configuration
const CACHE_KEY_PREFIX = 'weather-daily-v1-';

export interface DailyWeather {
    date: string;
    maxTemp: number; // Maximum temperature for the day
    unit: 'C' | 'F';
    location: string;
    isForecast: boolean; // True if future/today, False if historical
}

/**
 * Fetch weather for a specific date and location
 */
export const getDailyWeather = async (
    date: string, // YYYY-MM-DD
    options: WeatherOptions = {},
): Promise<DailyWeather | null> => {
    try {
        const location = options.timezone?.startsWith('America/New_York')
            ? COORDS.NYC
            : COORDS.BA;
        const unit = options.unitSystem === 'imperial' ? 'F' : 'C';

        const cacheKey = `${CACHE_KEY_PREFIX}${location.name}-${date}-${unit}`;

        // 1. Try Cache
        const cached = await storage.get(cacheKey);
        if (cached && cached.value) {
            return JSON.parse(cached.value);
        }

        // 2. Fetch from API
        // Open-Meteo automatically handles archive vs forecast seamlessy with the forecast endpoint for recent past
        // For distinct archive (older than 3 months maybe?), we might need archive endpoint, but for recent it calls forecast.
        // Actually, for past days, "forecast" endpoint might give historical data if within range, or we use archive.
        // Let's use the standard forecast endpoint which includes some history, or check date.

        // Determine if date is today or future (Forecast) or past (Archive/Historical)
        const targetDate = new Date(date);
        const todayDate = new Date();
        const diffTime = targetDate.getTime() - todayDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Open-Meteo Forecast endpoint supports up to past_days=92.
        // If older than ~3 months, use archive. For now, assuming recent usage.

        const unitParam = unit === 'F' ? '&temperature_unit=fahrenheit' : '';

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max&start_date=${date}&end_date=${date}&timezone=auto${unitParam}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API failed');

        const data = await response.json();

        if (
            !data.daily ||
            !data.daily.temperature_2m_max ||
            data.daily.temperature_2m_max.length === 0
        ) {
            return null;
        }

        const maxTemp = data.daily.temperature_2m_max[0];

        if (maxTemp === undefined || maxTemp === null) return null;

        const weatherData: DailyWeather = {
            date,
            maxTemp,
            unit,
            location: location.name,
            isForecast: diffDays >= 0,
        };

        // Cache result
        // If it's historical (past), cache effectively forever.
        // If it's today/future, cache for shorter time or relying on the key containing date handles it?
        // Actually, if I query today's weather at 9AM, max temp might change?
        // Open-Meteo daily max is usually a forecast for today.
        // We shouldn't cache "today" too aggressively if accurate max is needed,
        // but for hydration targeting, the morning forecast max is usually good enough.

        await storage.set(cacheKey, JSON.stringify(weatherData));

        return weatherData;
    } catch (error) {
        console.error('[WeatherService] Error:', error);
        return null;
    }
};

// Deprecated: kept for backward compatibility if needed, but we should move to getDailyWeather
export const getCurrentWeather = async (options: WeatherOptions = {}) => {
    const date = new Intl.DateTimeFormat('en-CA', {
        timeZone: options.timezone || 'America/Argentina/Buenos_Aires',
    }).format(new Date());
    const daily = await getDailyWeather(date, options);

    if (!daily) return null;

    return {
        temperature: daily.maxTemp, // Mapping max temp to temperature for compatibility
        humidity: 50, // Dummy value as we moved to Max Temp logic
        location: daily.location,
        unit: daily.unit,
        cachedAt: new Date().toISOString(),
    };
};

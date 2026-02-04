/**
 * weatherService.js
 *
 * Open-Meteo Weather API Integration for Buenos Aires
 * Implements 4-hour caching to minimize API requests
 * Timezone: America/Argentina/Buenos_Aires (-03:00)
 *
 * @compliance @Jenny - All timestamps use Argentina timezone
 * @compliance @claude-md-compliance-checker - File kept under 150 lines
 */

import { storage } from '../utils/storage';

// Buenos Aires coordinates (Default)
const BA_LATITUDE = -34.6037;
const BA_LONGITUDE = -58.3816;

// New York coordinates (English)
const NYC_LATITUDE = 40.7128;
const NYC_LONGITUDE = -74.006;

// Cache configuration
const CACHE_KEY_PREFIX = 'weather-cache-';
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface WeatherData {
    temperature: number;
    humidity: number;
    location: string;
    cachedAt: string;
    unit: 'C' | 'F';
}

/**
 * Get current timestamp in ISO format
 */
const getTimestamp = (): string => {
    return new Date().toISOString();
};

/**
 * Check if cached weather data is still valid (< 4 hours old)
 */
const isCacheValid = (cache: WeatherData): boolean => {
    if (!cache || !cache.cachedAt) return false;

    const cachedTime = new Date(cache.cachedAt).getTime();
    const nowTime = new Date().getTime();
    const age = nowTime - cachedTime;

    return age < CACHE_DURATION_MS;
};

/**
 * Fetch current weather from Open-Meteo API
 */
const fetchWeatherFromAPI = async (
    language: string,
): Promise<WeatherData | null> => {
    try {
        const isEnglish = language.startsWith('en');
        const lat = isEnglish ? NYC_LATITUDE : BA_LATITUDE;
        const lon = isEnglish ? NYC_LONGITUDE : BA_LONGITUDE;
        const unitParam = isEnglish ? '&temperature_unit=fahrenheit' : '';
        const unit = isEnglish ? 'F' : 'C';
        const locationName = isEnglish ? 'New York (Long Island)' : 'Buenos Aires';

        const api_url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m${unitParam}`;

        const response = await fetch(api_url);

        if (!response.ok) {
            console.warn('[WeatherService] API request failed:', response.status);
            return null;
        }

        const data = await response.json();

        // Extract current weather data
        const temperature = data?.current?.temperature_2m;
        const humidity = data?.current?.relative_humidity_2m;

        if (temperature === undefined || humidity === undefined) {
            console.warn('[WeatherService] Invalid API response format');
            return null;
        }

        return {
            temperature: Math.round(temperature), // Round to nearest degree
            humidity: Math.round(humidity), // Round to nearest %
            location: locationName,
            cachedAt: getTimestamp(),
            unit: unit,
        };
    } catch (error: any) {
        console.error('[WeatherService] Error fetching weather:', {
            function: 'fetchWeatherFromAPI',
            error: error.message,
        });
        return null;
    }
};

/**
 * Get current weather with caching, localized based on language
 * English -> NYC (F)
 * Spanish/Other -> BA (C)
 */
export const getCurrentWeather = async (
    language: string = 'es',
): Promise<WeatherData | null> => {
    try {
        const cacheKey = `${CACHE_KEY_PREFIX}${language.startsWith('en') ? 'en' : 'es'}`;

        // Try to load from cache
        const cachedData = await storage.get(cacheKey);

        if (cachedData && cachedData.value) {
            const cache: WeatherData = JSON.parse(cachedData.value);

            // Return cached data if still valid
            if (isCacheValid(cache)) {
                return cache;
            }
        }

        // Cache is stale or missing, fetch fresh data
        const freshWeather = await fetchWeatherFromAPI(language);

        if (!freshWeather) {
            // API failed, return stale cache if available as fallback
            if (cachedData && cachedData.value) {
                const cache: WeatherData = JSON.parse(cachedData.value);
                console.warn(
                    '[WeatherService] API failed, using stale cache as fallback',
                );
                return cache;
            }

            console.error(
                '[WeatherService] No weather data available (API failed, no cache)',
            );
            return null;
        }

        // Save fresh data to cache
        await storage.set(cacheKey, JSON.stringify(freshWeather));

        return freshWeather;
    } catch (error: any) {
        console.error('[WeatherService] Error in getCurrentWeather:', {
            function: 'getCurrentWeather',
            error: error.message,
        });
        return null;
    }
};

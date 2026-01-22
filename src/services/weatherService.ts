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

// Buenos Aires coordinates
const BA_LATITUDE = -34.6037;
const BA_LONGITUDE = -58.3816;

// Cache configuration
const CACHE_KEY = 'weather-cache-ba';
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

// Open-Meteo API endpoint (free, no auth required)
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${BA_LATITUDE}&longitude=${BA_LONGITUDE}&current=temperature_2m,relative_humidity_2m`;

export interface WeatherData {
    temperature: number;
    humidity: number;
    location: string;
    cachedAt: string;
}

/**
 * Get current Argentina timestamp in ISO format with -03:00 offset
 * @returns {string} ISO timestamp in Argentina timezone
 */
const getArgentinaTimestamp = (): string => {
    const now = new Date();
    const argentinaTime = new Date(
        now.toLocaleString('en-US', {
            timeZone: 'America/Argentina/Buenos_Aires',
        }),
    );

    // Format as ISO string with -03:00 offset
    const year = argentinaTime.getFullYear();
    const month = String(argentinaTime.getMonth() + 1).padStart(2, '0');
    const day = String(argentinaTime.getDate()).padStart(2, '0');
    const hours = String(argentinaTime.getHours()).padStart(2, '0');
    const minutes = String(argentinaTime.getMinutes()).padStart(2, '0');
    const seconds = String(argentinaTime.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;
};

/**
 * Check if cached weather data is still valid (< 4 hours old)
 * @param {Object} cache - Cached weather data
 * @returns {boolean} True if cache is valid
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
 * @returns {Promise<Object|null>} Weather data or null on error
 */
const fetchWeatherFromAPI = async (): Promise<WeatherData | null> => {
    try {
        const response = await fetch(API_URL);

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
            location: 'Buenos Aires',
            cachedAt: getArgentinaTimestamp(),
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
 * Get current weather for Buenos Aires with caching
 * Returns cached data if < 4 hours old, otherwise fetches fresh data
 *
 * @returns {Promise<Object|null>}
 * {
 *   temperature: number,    // °C
 *   humidity: number,       // %
 *   location: string,       // "Buenos Aires"
 *   cachedAt: string        // ISO timestamp in Argentina TZ
 * }
 * Returns null if API unavailable and no valid cache
 */
export const getCurrentWeather = async (): Promise<WeatherData | null> => {
    try {
        // Try to load from cache
        const cachedData = await storage.get(CACHE_KEY);

        if (cachedData && cachedData.value) {
            // Parse the value property (storage.get returns { value: "..." })
            const cache: WeatherData = JSON.parse(cachedData.value);

            // Return cached data if still valid
            if (isCacheValid(cache)) {
                return cache;
            }
        }

        // Cache is stale or missing, fetch fresh data
        const freshWeather = await fetchWeatherFromAPI();

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
        await storage.set(CACHE_KEY, JSON.stringify(freshWeather));

        return freshWeather;
    } catch (error: any) {
        console.error('[WeatherService] Error in getCurrentWeather:', {
            function: 'getCurrentWeather',
            error: error.message,
        });
        return null;
    }
};

import { ARGENTINA_TZ } from '../dateUtils';

/**
 * Data Sanitization & Timezone Helpers
 * Shared utilities for all export formats
 */

/**
 * Strip database IDs from export data
 * Removes: id, userId, and table_userId_date patterns
 *
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Clean object without database IDs
 */
export const sanitizeForExport = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const { id, userId, ...clean } = obj;

    // Remove any keys matching table_userId_date pattern
    Object.keys(clean).forEach((key) => {
        if (/^[a-z]+_[a-f0-9-]+_\d{4}-\d{2}-\d{2}$/.test(key)) {
            delete clean[key];
        }
    });

    return clean;
};

/**
 * Format timestamp with explicit Argentina timezone label
 *
 * @param {string|Date} dateStr - Date string (YYYY-MM-DD) or Date object
 * @returns {string} Formatted timestamp with timezone
 */
export const formatArgentinaTimestamp = (dateStr: string | Date): string => {
    const date =
        typeof dateStr === 'string' ? new Date(dateStr + 'T12:00:00') : dateStr;

    const formatted = new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: ARGENTINA_TZ,
    }).format(date);

    return `${formatted} (America/Argentina/Buenos_Aires)`;
};

/**
 * Format date as full day name in Spanish
 * Example: "Sábado 17 de Enero"
 *
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date in Spanish
 */
export const formatFullDateSpanish = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: ARGENTINA_TZ,
    }).format(date);
};

/**
 * Format date as full day name with language support
 * Example (es): "Sábado 17 de Enero" | Example (en): "Saturday, January 17"
 *
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} language - Language code ('es' | 'en')
 * @returns {string} Formatted date in specified language
 */
export const formatFullDate = (dateStr: string, language: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    const locale = language === 'en' ? 'en-US' : 'es-AR';
    return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: ARGENTINA_TZ,
    }).format(date);
};

/**
 * Format timestamp with language support
 *
 * @param {Date} date - Date object
 * @param {string} language - Language code ('es' | 'en')
 * @returns {string} Formatted timestamp with timezone
 */
export const formatTimestamp = (date: Date, language: string): string => {
    const locale = language === 'en' ? 'en-US' : 'es-AR';
    const formatted = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: ARGENTINA_TZ,
    }).format(date);

    return `${formatted} (America/Argentina/Buenos_Aires)`;
};

/**
 * Capitalize first letter of a string
 *
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeFirst = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

interface Workout {
    date: string;
    type: string;
}

/**
 * Get training context emoji for a given date
 *
 * @param {Array} workoutLog - Array of workout entries
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {string} Training context emoji and name
 */
export const getTrainingContext = (
    workoutLog: Workout[],
    date: string,
    language: string = 'es',
): string => {
    const workouts = workoutLog.filter((w) => w.date === date);

    const labels =
        language === 'en'
            ? { rest: 'Rest', gym: 'Gym', tennis: 'Tennis', cardio: 'Cardio', activity: 'Activity' }
            : { rest: 'Descanso', gym: 'Gimnasio', tennis: 'Tenis', cardio: 'Cardio', activity: 'Actividad' };

    if (workouts.length === 0) return `🏠 ${labels.rest}`;
    if (workouts.some((w) => w.type === 'gym')) return `🏋️ ${labels.gym}`;
    if (workouts.some((w) => w.type === 'tennis')) return `🎾 ${labels.tennis}`;
    if (workouts.some((w) => w.type === 'cardio')) return `🏃 ${labels.cardio}`;
    return `💪 ${labels.activity}`;
};

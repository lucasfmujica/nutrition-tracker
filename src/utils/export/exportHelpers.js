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
export const sanitizeForExport = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const { id, userId, ...clean } = obj;

  // Remove any keys matching table_userId_date pattern
  Object.keys(clean).forEach(key => {
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
export const formatArgentinaTimestamp = (dateStr) => {
  const date = typeof dateStr === 'string'
    ? new Date(dateStr + 'T12:00:00')
    : dateStr;

  const formatted = new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ARGENTINA_TZ
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
export const formatFullDateSpanish = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: ARGENTINA_TZ
  }).format(date);
};

/**
 * Capitalize first letter of a string
 *
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Get training context emoji for a given date
 *
 * @param {Array} workoutLog - Array of workout entries
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {string} Training context emoji and name
 */
export const getTrainingContext = (workoutLog, date) => {
  const workouts = workoutLog.filter(w => w.date === date);

  if (workouts.length === 0) {
    return '🏠 Descanso';
  }

  // Check for gym workouts
  if (workouts.some(w => w.type === 'gym')) {
    return '🏋️ Gimnasio';
  }

  // Check for tennis
  if (workouts.some(w => w.type === 'tennis')) {
    return '🎾 Tenis';
  }

  // Check for cardio
  if (workouts.some(w => w.type === 'cardio')) {
    return '🏃 Cardio';
  }

  // Generic activity
  return '💪 Actividad';
};

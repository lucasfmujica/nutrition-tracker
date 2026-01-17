import { ARGENTINA_TZ, addDaysToDate, getArgentinaDateString, getArgentinaDay } from './dateUtils';

/**
 * Generates a text report for the nutritionist based on logs.
 * Matching the exact format from NutritionTracker.jsx
 * @param {Array} foodLog - Array of food entries
 * @param {Array} workoutLog - Array of workout entries
 * @param {Array} ouraLog - Array of Oura entries
 * @param {Object} profile - User profile
 * @returns {string} The formatted text report
 */
export const generateNutritionistReport = (foodLog, workoutLog, ouraLog, profile) => {
  const today = getArgentinaDateString();
  const startDate = addDaysToDate(today, -13);

  // Get all dates in range
  const dates = [];
  for (let i = 0; i < 14; i++) {
    dates.push(addDaysToDate(startDate, i));
  }

  // Format date range for title
  const formatFullDate = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: ARGENTINA_TZ
    }).format(date);
  };

  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Calculate average sleep times from Oura data
  const ouraInRange = ouraLog.filter(o => o.date >= startDate && o.date <= today);
  let avgBedtime = 'N/D';
  let avgWakeTime = 'N/D';
  if (ouraInRange.length > 0) {
    const bedtimes = ouraInRange.filter(o => o.bedtime).map(o => o.bedtime).sort();
    const wakeTimes = ouraInRange.filter(o => o.wakeTime).map(o => o.wakeTime).sort();
    if (bedtimes.length > 0) avgBedtime = bedtimes[Math.floor(bedtimes.length / 2)];
    if (wakeTimes.length > 0) avgWakeTime = wakeTimes[Math.floor(wakeTimes.length / 2)];
  }

  // Get workouts in range
  const workoutsInRange = workoutLog.filter(w => w.date >= startDate && w.date <= today);

  // Build TXT content
  let txt = '';
  txt += '═══════════════════════════════════════════════════════════════\n';
  txt += '                    REGISTRO DE COMIDAS\n';
  txt += '═══════════════════════════════════════════════════════════════\n\n';
  txt += `Nombre: ${profile?.name || 'Lucas Mujica'}\n`;
  txt += `Período: ${capitalizeFirst(formatFullDate(startDate))} → ${capitalizeFirst(formatFullDate(today))}\n\n`;

  txt += '———————————————————————————————————————————————————————————————\n';
  txt += 'HORARIO PROMEDIO\n';
  txt += '———————————————————————————————————————————————————————————————\n';
  txt += `Despertar: ${avgWakeTime}\n`;
  txt += `Dormir: ${avgBedtime}\n\n`;

  txt += '———————————————————————————————————————————————————————————————\n';
  txt += 'ACTIVIDAD FÍ SICA DURANTE EL PERÍ ODO\n';
  txt += '———————————————————————————————————————————————————————————————\n';
  if (workoutsInRange.length === 0) {
    txt += 'Sin actividad registrada.\n';
  } else {
    workoutsInRange.forEach(w => {
      const dayName = capitalizeFirst(formatFullDate(w.date).split(',')[0]);
      const typeMap = { gym: 'Gym', tennis: 'Tenis', cardio: 'Cardio', other: 'Otro' };
      txt += `${dayName}: ${typeMap[w.type] || w.type} ─ ${w.duration} min (${w.name})\n`;
    });
  }
  txt += '\n';

  txt += '═══════════════════════════════════════════════════════════════\n';
  txt += '                    REGISTRO DIARIO\n';
  txt += '═══════════════════════════════════════════════════════════════\n\n';

  // Each day
  dates.forEach(date => {
    const foods = foodLog.filter(f => f.date === date).sort((a, b) => {
      // Sort by time if available, otherwise by meal order
      if (a.time && b.time) return a.time.localeCompare(b.time);
      const mealOrder = { 'Desayuno': 1, 'Almuerzo': 2, 'Merienda': 3, 'Snack': 4, 'Cena': 5 };
      return (mealOrder[a.meal] || 99) - (mealOrder[b.meal] || 99);
    });

    txt += `———————————————————————————————————————————————————————————————\n`;
    txt += `${capitalizeFirst(formatFullDate(date))}\n`;
    txt += `———————————————————————————————————————————————————————————————\n`;

    if (foods.length === 0) {
      txt += 'Sin registro.\n';
    } else {
      foods.forEach(f => {
        const timeStr = f.time ? ` ─ ${f.time}` : '';
        txt += `${f.meal}${timeStr}: ${f.name}`;
        if (f.description) txt += ` (${f.description})`;
        txt += '\n';
      });
    }
    txt += '\n';
  });

  txt += '═══════════════════════════════════════════════════════════════\n';
  txt += `Generado: ${new Date().toLocaleString('es-AR', { timeZone: ARGENTINA_TZ })}\n`;

  return txt;
};

/**
 * Triggers a file download in the browser.
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {string} type - MIME type (default text/plain)
 */
export const downloadFile = (content, filename, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generates and downloads the backup JSON file.
 * @param {Object} data - All application data to backup
 */
export const downloadBackup = (data) => {
  const backup = {
    exportDate: new Date().toISOString(),
    version: 'v5',
    ...data
  };

  const filename = `lucas-tracker-backup-${getArgentinaDateString()}.json`;
  downloadFile(JSON.stringify(backup, null, 2), filename, 'application/json');
};

/**
 * Reads and parses a backup JSON file.
 * @param {File} file - The file object from input input
 * @returns {Promise<Object>} Attributes from the backup
 */
export const parseBackupFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

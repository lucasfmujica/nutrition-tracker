// Argentina timezone constant
export const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

// Helper to format any date to YYYY-MM-DD in Argentina timezone
export const toArgentinaDateString = (date) => {
  if (!date) return ''; // Guard clause
  return new Date(date).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-'); // Returns YYYY-MM-DD
};

// Helper to get current date in Argentina
export const getArgentinaDateString = () => toArgentinaDateString(new Date());

// Helper to get day of week in Argentina (0=Sun, 6=Sat)
export const getArgentinaDay = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TZ,
    weekday: 'short'
  });
  const dayName = formatter.format(date);
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return days[dayName];
};

// Helper to add/subtract days from a date string (returns YYYY-MM-DD in Argentina TZ)
export const addDaysToDate = (dateStr, days) => {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return toArgentinaDateString(date);
};

// Helper to get Monday of the week for a given date
export const getMondayOfWeek = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = getArgentinaDay(date);
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDaysToDate(dateStr, -daysToMonday);
};

// Format date for display (Hoy, Ayer, or date)
export const formatDateDisplay = (dateStr) => {
  const today = getArgentinaDateString();
  const yesterday = addDaysToDate(today, -1);
  if (dateStr === today) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  const date = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: ARGENTINA_TZ
  }).format(date);
};

// Helper to get timestamp in Argentina TZ (strict -03:00 offset)
// Input: dateStr (YYYY-MM-DD), timeStr (HH:mm)
export const getArgentinaTimestamp = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return Date.now();
  // Construct ISO string with fixed offset
  const isoString = `${dateStr}T${timeStr}:00-03:00`;
  return new Date(isoString).getTime();
};

// Format timestamp to time string (HH:mm) in Argentina Timezone
export const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
};

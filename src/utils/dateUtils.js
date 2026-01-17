// Argentina timezone constant
const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

// Helper to format any date to YYYY-MM-DD in Argentina timezone
export const toArgentinaDateString = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date); // Returns YYYY-MM-DD
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

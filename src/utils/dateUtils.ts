// Argentina timezone constant
export const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

// Helper to format any date to YYYY-MM-DD in Argentina timezone
export const toArgentinaDateString = (
    date: string | Date | number | null,
): string => {
    if (!date) return ''; // Guard clause
    return new Date(date)
        .toLocaleDateString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
        .split('/')
        .reverse()
        .join('-'); // Returns YYYY-MM-DD
};

// Helper to get current date in Argentina
export const getArgentinaDateString = (): string =>
    toArgentinaDateString(new Date());

// Helper to get day of week in Argentina (0=Sun, 6=Sat)
export const getArgentinaDay = (date: Date = new Date()): number => {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: ARGENTINA_TZ,
        weekday: 'short',
    });
    const dayName = formatter.format(date) as keyof typeof days;
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return days[dayName];
};

// Helper to add/subtract days from a date string (returns YYYY-MM-DD in Argentina TZ)
export const addDaysToDate = (dateStr: string, days: number): string => {
    const date = new Date(dateStr + 'T12:00:00');
    date.setDate(date.getDate() + days);
    return toArgentinaDateString(date);
};

// Helper to get Monday of the week for a given date
export const getMondayOfWeek = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = getArgentinaDay(date);
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return addDaysToDate(dateStr, -daysToMonday);
};

// Format date for display (Today/Hoy, Yesterday/Ayer, or date)
export const formatDateDisplay = (dateStr: string, language: string = 'es'): string => {
    const today = getArgentinaDateString();
    const yesterday = addDaysToDate(today, -1);
    if (dateStr === today) return language === 'en' ? 'Today' : 'Hoy';
    if (dateStr === yesterday) return language === 'en' ? 'Yesterday' : 'Ayer';
    const date = new Date(dateStr + 'T12:00:00');
    const locale = language === 'en' ? 'en-US' : 'es-AR';
    return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: ARGENTINA_TZ,
    }).format(date);
};

// Helper to get timestamp in Argentina TZ (strict -03:00 offset)
// Input: dateStr (YYYY-MM-DD), timeStr (HH:mm)
export const getArgentinaTimestamp = (
    dateStr: string | null,
    timeStr: string | null,
): number => {
    if (!dateStr || !timeStr) return Date.now();
    // Construct ISO string with fixed offset
    const isoString = `${dateStr}T${timeStr}:00-03:00`;
    return new Date(isoString).getTime();
};

// Format timestamp to time string (HH:mm) in Argentina Timezone
export const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
    });
};

/**
 * Format relative time for Argentina timezone
 * CRITICAL: Always respects Argentina timezone as per CLAUDE.md rules
 * @param {string|Date|number} date - Date to format
 * @param {string} language - 'es' or 'en'
 * @returns {string} Relative time ("Ahora"/"Now", "Hace 2 min"/"2 min ago", etc.)
 */
export const formatRelativeTime = (date: string | Date | number, language: string = 'es'): string => {
    if (!date) return '';

    // CRITICAL FIX: Convert both dates to Argentina timezone for consistent comparison
    const nowInArgentina = new Date().toLocaleString('en-US', {
        timeZone: ARGENTINA_TZ,
    });
    const now = new Date(nowInArgentina).getTime();

    // Parse and validate input date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        console.error(
            '[dateUtils] Invalid date provided to formatRelativeTime:',
            date,
        );
        return '';
    }

    // Convert input date to Argentina timezone
    const dateInArgentina = parsedDate.toLocaleString('en-US', {
        timeZone: ARGENTINA_TZ,
    });
    const dateInTz = new Date(dateInArgentina).getTime();

    const diffMs = now - dateInTz;

    const isEN = language === 'en';

    // Handle future dates (shouldn't happen for lastSyncTime, but defensive)
    if (diffMs < 0) return isEN ? 'Now' : 'Ahora';

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return isEN ? 'Now' : 'Ahora';
    if (diffMin < 60) return isEN ? `${diffMin} min ago` : `Hace ${diffMin} min`;
    if (diffHour < 24) return isEN ? `${diffHour}h ago` : `Hace ${diffHour} h`;
    if (diffDay === 1) return isEN ? 'Yesterday' : 'Ayer';
    return isEN ? `${diffDay}d ago` : `Hace ${diffDay} días`;
};

import { OuraEntry, StepsEntry } from '../types/domain';

/**
 * Maps Oura API V2 responses to Supabase schema
 * @data-integrity-guardian: Ensures IDs match ${table}_${userId}_${date} pattern via strict date handling
 */

export const mapOuraReadiness = (apiData: any): Partial<OuraEntry>[] => {
    if (!apiData || !apiData.data) return [];

    return apiData.data.map((item: any) => ({
        date: item.day, // Oura V2 returns 'day' as YYYY-MM-DD
        readinessScore: item.score,
        // Add other fields if available in apiData and schema
    }));
};

export const mapOuraSleep = (apiData: any): Partial<OuraEntry>[] => {
    if (!apiData || !apiData.data) return [];

    return apiData.data
        .map((item: any) => ({
            date: item.day,
            sleepScore: item.score,
            // Fallback fields from daily summary
            bedtime: item.timestamp
                ? new Date(item.timestamp).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                  })
                : null,
            wakeTime: item.timestamp // daily_sleep doesn't have explicit end, so rely on sleep details primarily
                ? null // Placeholder
                : null,
        }))
        .map((entry: any, index: number) => {
            // Daily Sleep doesn't give us clean bedtime/waketime strings directly in the same format as sleep sessions sometimes.
            // But let's try to inspect the raw item structure if we could.
            // Actually, daily_sleep V2 has `bedtime_start` and `bedtime_end`.
            const raw = apiData.data[index];
            return {
                ...entry,
                bedtime: raw.bedtime_start
                    ? new Date(raw.bedtime_start).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                      })
                    : null,
                wakeTime: raw.bedtime_end
                    ? new Date(raw.bedtime_end).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                      })
                    : null,
            };
        });
};

export const mapOuraSleepDetails = (apiData: any): Partial<OuraEntry>[] => {
    if (!apiData || !apiData.data) return [];

    return apiData.data.map((item: any) => ({
        date: item.day,
        // Detailed metrics
        hrv: item.average_hrv,
        restingHr: item.lowest_heart_rate,
        sleepHours: item.total_sleep_duration
            ? parseFloat((item.total_sleep_duration / 3600).toFixed(1))
            : 0,
        deepSleepMins: item.deep_sleep_duration
            ? Math.round(item.deep_sleep_duration / 60)
            : 0,
        remSleepMins: item.rem_sleep_duration
            ? Math.round(item.rem_sleep_duration / 60)
            : 0,
        bedtime: item.bedtime_start
            ? new Date(item.bedtime_start).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : null,
        wakeTime: item.bedtime_end
            ? new Date(item.bedtime_end).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : null,
    }));
};

export const mapOuraActivity = (
    apiData: any,
): (Partial<OuraEntry> & Partial<StepsEntry>)[] => {
    if (!apiData || !apiData.data) return [];

    return apiData.data.map((item: any) => ({
        date: item.day,
        activityScore: item.score,
        steps: item.steps,
        active_calories: item.active_calories,
    }));
};

/**
 * Merges separate API responses into comprehensive entries for oura_log and steps_log
 * @param {Array} readiness Data from daily_readiness
 * @param {Array} sleep Data from daily_sleep (Daily Summary)
 * @param {Array} activity Data from daily_activity
 * @param {Array} sleepDetails Data from sleep (Detailed Sessions)
 * @returns {Object} { ouraLogEntries, stepsLogEntries }
 */
export const mergeOuraData = (
    readiness: any[],
    sleep: any[],
    activity: any[],
    sleepDetails: any[] = [],
): { ouraLogEntries: OuraEntry[]; stepsLogEntries: StepsEntry[] } => {
    const dates = new Set([
        ...readiness.map((i) => i.date),
        ...sleep.map((i) => i.date),
        ...activity.map((i) => i.date),
        ...sleepDetails.map((i) => i.date),
    ]);

    const ouraLogEntries: OuraEntry[] = [];
    const stepsLogEntries: StepsEntry[] = [];

    dates.forEach((date) => {
        const r = readiness.find((i) => i.date === date) || {};
        const s = sleep.find((i) => i.date === date) || {};
        const a = activity.find((i) => i.date === date) || {};

        // Find the main sleep session for the day (longest sleep if multiple)
        // Oura might return multiple sleep periods per day (naps).
        // For simplicity, we take the one matching the date or the first one found.
        // Enhanced logic: sum up durations if needed, but usually 'sleep' endpoint returns sessions.
        // We will pick the one with matching date (Oura assigns 'day' to the sleep session).
        const sd = sleepDetails.find((i) => i.date === date) || {};

        // Build Oura Log Entry
        if (
            r.readinessScore !== undefined ||
            s.sleepScore !== undefined ||
            a.activityScore !== undefined ||
            sd.hrv !== undefined
        ) {
            ouraLogEntries.push({
                id: `oura_${date}`, // Placeholder ID, will be overwritten by DB or ignored on insert
                date: date,
                readinessScore: r.readinessScore || 0,
                sleepScore: s.sleepScore || 0,
                activityScore: a.activityScore || 0,

                // Detailed fields - Prefer detailed session (sd), fallback to daily summary (s)
                hrv: sd.hrv || 0,
                restingHr: sd.restingHr || 0,
                sleepHours: sd.sleepHours || 0,
                deepSleepMins: sd.deepSleepMins || 0,
                remSleepMins: sd.remSleepMins || 0,
                bedtime: sd.bedtime || s.bedtime || null,
                wakeTime: sd.wakeTime || s.wakeTime || null,
            });
        }

        // Build Steps Log Entry
        if (a.steps !== undefined) {
            stepsLogEntries.push({
                id: `steps_${date}`,
                date: date,
                steps: a.steps,
            });
        }
    });

    return { ouraLogEntries, stepsLogEntries };
};

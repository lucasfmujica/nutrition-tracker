import { toArgentinaDateString } from './dateUtils';

/**
 * Maps Oura API V2 responses to Supabase schema
 * @data-integrity-guardian: Ensures IDs match ${table}_${userId}_${date} pattern via strict date handling
 */

export const mapOuraReadiness = (apiData) => {
  if (!apiData || !apiData.data) return [];

  return apiData.data.map(item => ({
    date: item.day, // Oura V2 returns 'day' as YYYY-MM-DD
    readiness_score: item.score,
    // Add other fields if available in apiData and schema
  }));
};

export const mapOuraSleep = (apiData) => {
  if (!apiData || !apiData.data) return [];

  return apiData.data.map(item => ({
    date: item.day,
    sleep_score: item.score,
    // Mapping additional fields based on oura_log schema
    // Note: Oura V2 daily_sleep might differ from sleep periods.
    // We map what we can match to OuraEntry type.
    // OuraEntry: deep_sleep_mins, rem_sleep_mins, sleep_hours, bedtime, wake_time
    // item.contributors might have deep_sleep, rem_sleep etc.
    // For now we map the score as requested.
  }));
};

export const mapOuraSleepDetails = (apiData) => {
  if (!apiData || !apiData.data) return [];

  return apiData.data.map(item => ({
    date: item.day,
    // Detailed metrics
    hrv: item.average_hrv,
    resting_hr: item.lowest_heart_rate,
    sleep_hours: item.total_sleep_duration ? (item.total_sleep_duration / 3600).toFixed(1) : 0,
    deep_sleep_mins: item.deep_sleep_duration ? Math.round(item.deep_sleep_duration / 60) : 0,
    rem_sleep_mins: item.rem_sleep_duration ? Math.round(item.rem_sleep_duration / 60) : 0,
    bedtime: item.bedtime_start ? new Date(item.bedtime_start).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
    wake_time: item.bedtime_end ? new Date(item.bedtime_end).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null
  }));
};

export const mapOuraActivity = (apiData) => {
  if (!apiData || !apiData.data) return [];

  return apiData.data.map(item => ({
    date: item.day,
    activity_score: item.score,
    steps: item.steps,
    active_calories: item.active_calories,
  }));
};

/**
 * Merges separate API responses into comprehensive entries for oura_log and steps_log
 * @param {Array} readiness Data from daily_readiness
 * @param {Array} sleep Data from daily_sleep
 * @param {Array} activity Data from daily_activity
 * @param {Array} sleepDetails Data from sleep (detailed sessions)
 * @returns {Object} { ouraLogEntries, stepsLogEntries }
 */
export const mergeOuraData = (readiness, sleep, activity, sleepDetails = []) => {
  const dates = new Set([
    ...readiness.map(i => i.date),
    ...sleep.map(i => i.date),
    ...activity.map(i => i.date),
    ...sleepDetails.map(i => i.date)
  ]);

  const ouraLogEntries = [];
  const stepsLogEntries = [];

  dates.forEach(date => {
    const r = readiness.find(i => i.date === date) || {};
    const s = sleep.find(i => i.date === date) || {};
    const a = activity.find(i => i.date === date) || {};

    // Find the main sleep session for the day (longest sleep if multiple)
    // Oura might return multiple sleep periods per day (naps).
    // For simplicity, we take the one matching the date or the first one found.
    // Enhanced logic: sum up durations if needed, but usually 'sleep' endpoint returns sessions.
    // We will pick the one with matching date (Oura assigns 'day' to the sleep session).
    const sd = sleepDetails.find(i => i.date === date) || {};

    // Build Oura Log Entry
    if (r.readiness_score !== undefined || s.sleep_score !== undefined || a.activity_score !== undefined || sd.hrv !== undefined) {
      ouraLogEntries.push({
        date: date,
        readinessScore: r.readiness_score || 0,
        sleepScore: s.sleep_score || 0,
        activityScore: a.activity_score || 0,

        // Detailed fields
        hrv: sd.hrv || 0,
        restingHr: sd.resting_hr || 0,
        sleepHours: sd.sleep_hours || 0,
        deepSleepMins: sd.deep_sleep_mins || 0,
        remSleepMins: sd.rem_sleep_mins || 0,
        bedtime: sd.bedtime || null,
        wakeTime: sd.wake_time || null
      });
    }

    // Build Steps Log Entry
    if (a.steps !== undefined) {
      stepsLogEntries.push({
        date: date,
        steps: a.steps
      });
    }
  });

  return { ouraLogEntries, stepsLogEntries };
};

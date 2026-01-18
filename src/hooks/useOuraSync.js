import { useCallback, useState } from 'react';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';
import { mapOuraActivity, mapOuraReadiness, mapOuraSleep, mapOuraSleepDetails, mergeOuraData } from '../utils/ouraMappers';

const OURA_API_BASE = 'https://api.ouraring.com/v2/usercollection';
const SYNC_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const STORAGE_KEY_LAST_SYNC = 'oura_last_sync';

export const useOuraSync = ({ saveOuraEntry, saveStepsEntry }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  const fetchOuraEndpoint = async (endpoint, start, end) => {
    const token = import.meta.env.VITE_OURA_TOKEN;
    if (!token) throw new Error('VITE_OURA_TOKEN is not configured');

    const url = `${OURA_API_BASE}/${endpoint}?start_date=${start}&end_date=${end}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      // Enhanced CORS error handling
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const corsError = new Error(
          '🚫 CORS Error: Unable to connect to Oura API directly from browser. ' +
          'This is a browser security restriction. Consider using a backend proxy or ' +
          'a browser extension to bypass CORS for development.'
        );
        console.error('[OuraSync] CORS Issue:', corsError.message);
        throw corsError;
      }
      throw err;
    }
  };

  const syncOuraData = useCallback(async (force = false) => {
    if (isSyncing) return;

    // Frequency Control
    const lastSyncStr = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
    const now = Date.now();

    if (!force && lastSync && (now - lastSync < SYNC_COOLDOWN_MS)) {
      console.log('[OuraSync] Skipping sync: Cooldown active');
      return { status: 'skipped', reason: 'cooldown' };
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const today = getArgentinaDateString();
      const sevenDaysAgo = addDaysToDate(today, -7);

      console.log(`[OuraSync] Fetching data from ${sevenDaysAgo} to ${today}...`);

      // Parallel Fetch
      const [readinessData, sleepData, activityData, sleepDetailsData] = await Promise.all([
        fetchOuraEndpoint('daily_readiness', sevenDaysAgo, today),
        fetchOuraEndpoint('daily_sleep', sevenDaysAgo, today),
        fetchOuraEndpoint('daily_activity', sevenDaysAgo, today),
        fetchOuraEndpoint('sleep', sevenDaysAgo, today) // Detailed sleep data
      ]);

      // Map & Merge
      // Note: We use our mappers which handle the API response structure { data: [] }
      const rMapped = mapOuraReadiness(readinessData);
      const sMapped = mapOuraSleep(sleepData);
      const aMapped = mapOuraActivity(activityData);
      const sdMapped = mapOuraSleepDetails(sleepDetailsData);

      const { ouraLogEntries, stepsLogEntries } = mergeOuraData(rMapped, sMapped, aMapped, sdMapped);

      console.log(`[OuraSync] Processing ${ouraLogEntries.length} biometrics and ${stepsLogEntries.length} activity entries`);

      // Map & Upsert to Supabase/Vault via provided hooks
      // We process sequentially to ensure order and avoid overwhelming client/db

      // 1. Biometrics (Oura Log)
      for (const entry of ouraLogEntries) {
        await saveOuraEntry(entry);
      }

      // 2. Activity (Steps Log)
      for (const entry of stepsLogEntries) {
        await saveStepsEntry(entry);
      }

      // Success
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, now.toString());
      setSyncStatus('success');

      setTimeout(() => setSyncStatus('idle'), 3000);
      return { status: 'success' };

    } catch (err) {
      console.error('[OuraSync] Sync Failed:', err);
      // Silent Failure: Log error but do not block UI
      setSyncStatus('error');
      // Do NOT throw, just return error status
      return { status: 'error', error: err.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, saveOuraEntry, saveStepsEntry]);

  return {
    syncOuraData,
    isSyncing,
    syncStatus
  };
};

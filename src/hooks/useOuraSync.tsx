import { useCallback, useEffect, useState } from 'react';
import { OuraEntry, StepsEntry } from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';
import {
    mapOuraActivity,
    mapOuraReadiness,
    mapOuraSleep,
    mapOuraSleepDetails,
    mergeOuraData,
} from '../utils/ouraMappers';

const OURA_API_BASE = 'https://api.ouraring.com/v2/usercollection';
const SYNC_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const STORAGE_KEY_LAST_SYNC = 'oura_last_sync';

interface UseOuraSyncParams {
    saveOuraEntry: (entry: OuraEntry) => Promise<any>;
    saveStepsEntry: (entry: StepsEntry) => Promise<any>;
    /** Per-user Oura token. Falls back to VITE_OURA_TOKEN env var if not provided. */
    ouraPersonalToken?: string;
}

interface SyncResult {
    status: 'success' | 'error' | 'skipped';
    reason?: string;
    error?: string;
}

export const useOuraSync = ({
    saveOuraEntry,
    saveStepsEntry,
    ouraPersonalToken,
}: UseOuraSyncParams) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<
        'idle' | 'syncing' | 'success' | 'error'
    >('idle');

    // Detect production environment
    const isProduction = import.meta.env.PROD;

    // Per-user token takes priority over env var
    const getOuraToken = (): string | null => {
        return ouraPersonalToken || import.meta.env.VITE_OURA_TOKEN || null;
    };

    const fetchOuraEndpoint = async (
        endpoint: string,
        start: string,
        end: string,
    ): Promise<any> => {
        const token = getOuraToken();
        if (!token) throw new Error('Oura token not configured. Set up your personal token in Settings.');

        // Use proxy in production, direct API in development
        if (isProduction) {
            // Production: Use serverless proxy to bypass CORS
            const proxyUrl = `/api/oura-proxy?endpoint=${endpoint}&start_date=${start}&end_date=${end}`;

            try {
                console.log(`[OuraSync] Using proxy: ${endpoint}`);
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || `Proxy error: ${response.status}`,
                    );
                }

                return await response.json();
            } catch (err) {
                console.error('[OuraSync] Proxy Error:', err);
                throw err;
            }
        } else {
            // Development: Use Vite proxy (/api/oura) to bypass CORS
            const url = `/api/oura/${endpoint}?start_date=${start}&end_date=${end}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(
                        `Oura API error: ${response.status} ${response.statusText}`,
                    );
                }

                return await response.json();
            } catch (err: any) {
                // Enhanced CORS error handling for development
                if (err.name === 'TypeError' && err.message.includes('fetch')) {
                    const corsError = new Error(
                        '🚫 CORS Error: Unable to connect to Oura API. ' +
                            'Ensure Vite dev server is running and proxy is configured in vite.config.ts.',
                    );
                    console.error('[OuraSync] Proxy Issue:', corsError.message);
                    throw corsError;
                }
                throw err;
            }
        }
    };

    const syncOuraData = useCallback(
        async (force = false): Promise<SyncResult> => {
            if (isSyncing) return { status: 'skipped', reason: 'already_syncing' };

            // Frequency Control
            const lastSyncStr = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
            const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
            const now = Date.now();

            if (!force && lastSync && now - lastSync < SYNC_COOLDOWN_MS) {
                console.log('[OuraSync] Skipping sync: Cooldown active');
                return { status: 'skipped', reason: 'cooldown' };
            }

            setIsSyncing(true);
            setSyncStatus('syncing');

            try {
                const today = getArgentinaDateString();
                const sevenDaysAgo = addDaysToDate(today, -7);

                console.log(
                    `[OuraSync] Fetching data from ${sevenDaysAgo} to ${today}...`,
                );

                // Parallel Fetch
                const [readinessData, sleepData, activityData, sleepDetailsData] =
                    await Promise.all([
                        fetchOuraEndpoint('daily_readiness', sevenDaysAgo, today),
                        fetchOuraEndpoint('daily_sleep', sevenDaysAgo, today),
                        fetchOuraEndpoint('daily_activity', sevenDaysAgo, today),
                        fetchOuraEndpoint('sleep', sevenDaysAgo, today), // Detailed sleep data
                    ]);

                // Map & Merge
                const rMapped = mapOuraReadiness(readinessData);
                const sMapped = mapOuraSleep(sleepData);
                const aMapped = mapOuraActivity(activityData);
                const sdMapped = mapOuraSleepDetails(sleepDetailsData);

                const { ouraLogEntries, stepsLogEntries } = mergeOuraData(
                    rMapped,
                    sMapped,
                    aMapped,
                    sdMapped,
                );

                console.log(
                    `[OuraSync] Processing ${ouraLogEntries.length} biometrics and ${stepsLogEntries.length} activity entries`,
                );

                // 1. Biometrics (Oura Log)
                for (const entry of ouraLogEntries) {
                    await saveOuraEntry(entry);
                }

                /*
                // 2. Activity (Steps Log) - DISABLED as per user request
                for (const entry of stepsLogEntries) {
                    await saveStepsEntry(entry);
                }
                */

                // Success
                localStorage.setItem(STORAGE_KEY_LAST_SYNC, now.toString());
                setSyncStatus('success');

                setTimeout(() => setSyncStatus('idle'), 3000);
                return { status: 'success' };
            } catch (err: any) {
                console.error('[OuraSync] Sync Failed:', err);
                // Silent Failure: Log error but do not block UI
                setSyncStatus('error');
                // Do NOT throw, just return error status
                return { status: 'error', error: err.message };
            } finally {
                setIsSyncing(false);
            }
        },
        [isSyncing, saveOuraEntry, saveStepsEntry],
    );

    // --- AUTO SYNC LOGIC ---
    useEffect(() => {
        const triggerAutoSync = async () => {
            // Only trigger if we are not already syncing
            if (isSyncing || syncStatus === 'success') return;

            const now = new Date();
            const currentTimestamp = now.getTime();

            // Define sync target: 11:00 AM Argentina (UTC-3)
            // We use the local time since the user and app are aligned to Argentina
            const syncTimeToday = new Date();
            syncTimeToday.setHours(11, 0, 0, 0);

            const lastSyncStr = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
            const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;

            // Trigger criteria:
            // 1. Current time is after 11:00 AM
            // 2. Last sync was before today's 11:00 AM target
            if (
                currentTimestamp >= syncTimeToday.getTime() &&
                lastSync < syncTimeToday.getTime()
            ) {
                console.log(
                    '[OuraSync] Auto-triggering sync (Daily 11 AM schedule)',
                );
                await syncOuraData();
            }
        };

        // Delay slightly to give the app time to settle
        const timer = setTimeout(triggerAutoSync, 2000);
        return () => clearTimeout(timer);
    }, [syncOuraData, isSyncing, syncStatus]);

    return {
        syncOuraData,
        isSyncing,
        syncStatus,
    };
};

import { useCallback, useEffect, useState } from 'react';
import { toast } from '../context/ToastContext';
import i18n from '../i18n/config';
import { OuraEntry, Profile, StepsEntry } from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';
import {
    mapOuraActivity,
    mapOuraReadiness,
    mapOuraSleep,
    mapOuraSleepDetails,
    mergeOuraData,
} from '../utils/ouraMappers';
import {
    consumePendingOuraCallback,
    exchangeOuraCode,
    getStoredOuraOAuthTokens,
    isOuraAccessTokenExpired,
    refreshOuraTokens,
    saveOuraOAuthTokens,
} from '../utils/ouraOAuth';
import { getCacheKeys } from '../utils/storageUtils';
import { useSupabase } from './useSupabase';

const OURA_API_BASE = 'https://api.ouraring.com/v2/usercollection';
const SYNC_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const STORAGE_KEY_LAST_SYNC_LEGACY = 'oura_last_sync';

interface UseOuraSyncParams {
    saveOuraEntry: (entry: OuraEntry) => Promise<any>;
    saveStepsEntry: (entry: StepsEntry) => Promise<any>;
    /** Per-user Oura token. Falls back to VITE_OURA_TOKEN env var if not provided. */
    ouraPersonalToken?: string;
    /** User profile with stepsAutoSync preference */
    profile?: Profile | null;
    /** Current steps log for conflict detection */
    stepsLog?: StepsEntry[];
    /** Persists the profile — used to store the OAuth access token. */
    saveProfile?: (profile: Profile) => Promise<any>;
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
    profile,
    stepsLog = [],
    saveProfile,
}: UseOuraSyncParams) => {
    const supabase = useSupabase();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<
        'idle' | 'syncing' | 'success' | 'error'
    >('idle');

    // Detect production environment
    const isProduction = import.meta.env.PROD;

    /** Persists fresh OAuth tokens (access token goes into the profile). */
    const persistOAuthTokens = async (tokens: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
    }): Promise<void> => {
        saveOuraOAuthTokens(supabase.user?.id, tokens);
        if (saveProfile && profile) {
            await saveProfile({
                ...profile,
                hasOuraRing: true,
                ouraPersonalToken: tokens.access_token,
            });
        }
    };

    // Per-user token takes priority. Refreshes the OAuth access token when
    // expired; manual tokens (no stored OAuth record) are returned as-is.
    const getOuraToken = async (): Promise<string | null> => {
        const oauthTokens = getStoredOuraOAuthTokens(supabase.user?.id);

        if (oauthTokens) {
            if (isOuraAccessTokenExpired(oauthTokens)) {
                try {
                    console.log(
                        '[OuraSync] Access token expired, refreshing...',
                    );
                    const refreshed = await refreshOuraTokens(
                        oauthTokens.refreshToken,
                    );
                    await persistOAuthTokens(refreshed);
                    return refreshed.access_token;
                } catch (err) {
                    console.error('[OuraSync] Token refresh failed:', err);
                    // Fall through to whatever token we have (may 401)
                }
            } else if (oauthTokens.accessToken) {
                return oauthTokens.accessToken;
            }
        }

        // Core Logic: Always use personal token if present (manual or OAuth)
        if (ouraPersonalToken) return ouraPersonalToken;

        // No fallback to system token - users MUST provide their own
        return null;
    };

    const fetchOuraEndpoint = async (
        endpoint: string,
        start: string,
        end: string,
    ): Promise<any> => {
        const token = await getOuraToken();
        if (!token)
            throw new Error(
                'Oura token not configured. Set up your personal token in Settings.',
            );

        // Use proxy in production, direct API in development
        if (isProduction) {
            // Production: Use serverless proxy to bypass CORS
            const proxyUrl = `/api/oura-proxy?endpoint=${endpoint}&start_date=${start}&end_date=${end}`;

            try {
                console.log(`[OuraSync] Using proxy: ${endpoint}`);
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
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
            const userId = supabase.user?.id;
            const keys = userId ? getCacheKeys(userId) : null;
            const storageKey = keys
                ? `${keys.METADATA}_oura_sync`
                : STORAGE_KEY_LAST_SYNC_LEGACY;

            const lastSyncStr = localStorage.getItem(storageKey);
            const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
            const now = Date.now();

            if (!force && lastSync && now - lastSync < SYNC_COOLDOWN_MS) {
                console.log('[OuraSync] Skipping sync: Cooldown active');
                return { status: 'skipped', reason: 'cooldown' };
            }

            // No token configured: nothing to sync (not an error)
            const token = await getOuraToken();
            if (!token) {
                console.log('[OuraSync] Skipping sync: no Oura token configured');
                return { status: 'skipped', reason: 'no_token' };
            }

            setIsSyncing(true);
            setSyncStatus('syncing');

            try {
                const today = getArgentinaDateString();
                const sevenDaysAgo = addDaysToDate(today, -6); // Last 7 days including today

                console.log(
                    `[OuraSync] Fetching data from ${sevenDaysAgo} to ${today} (7 days including today)...`,
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

                // 2. Activity (Steps Log) - Smart Merge with user-controlled auto-sync
                // Check if user has enabled Oura steps sync
                if (!profile?.stepsAutoSync) {
                    console.log(
                        '[OuraSync] Steps auto-sync disabled by user preference',
                    );
                } else {
                    console.log(
                        `[OuraSync] Steps auto-sync enabled - processing ${stepsLogEntries.length} entries`,
                    );

                    // User has enabled Oura - sync steps with smart merge
                    for (const ouraEntry of stepsLogEntries) {
                        const existing = stepsLog.find(
                            (s) => s.date === ouraEntry.date,
                        );

                        if (!existing) {
                            // No conflict - insert Oura data
                            await saveStepsEntry({
                                ...ouraEntry,
                                source: 'oura',
                            });
                            console.log(
                                `[OuraSync] Saved Oura steps for ${ouraEntry.date}: ${ouraEntry.steps}`,
                            );
                        } else {
                            // Entry exists - check source
                            if (
                                existing.source === 'manual' ||
                                existing.source === 'ios-health'
                            ) {
                                // User manually logged - respect their data
                                console.log(
                                    `[OuraSync] Preserving ${existing.source} entry for ${ouraEntry.date} (${existing.steps} steps)`,
                                );
                                // Don't overwrite manual/iOS entries even if Oura auto-sync is ON
                            } else if (existing.source === 'oura') {
                                // Update existing Oura entry with fresh data
                                await saveStepsEntry({
                                    ...ouraEntry,
                                    source: 'oura',
                                });
                                console.log(
                                    `[OuraSync] Updated Oura steps for ${ouraEntry.date}: ${ouraEntry.steps}`,
                                );
                            }
                        }
                    }
                }

                // Success
                const userId = supabase.user?.id;
                const keys = userId ? getCacheKeys(userId) : null;
                const storageKey = keys
                    ? `${keys.METADATA}_oura_sync`
                    : STORAGE_KEY_LAST_SYNC_LEGACY;
                localStorage.setItem(storageKey, now.toString());
                setSyncStatus('success');

                setTimeout(() => setSyncStatus('idle'), 3000);
                return { status: 'success' };
            } catch (err: any) {
                console.error('[OuraSync] Sync Failed:', err);
                setSyncStatus('error');
                // Stamp lastSync so the daily auto-sync effect doesn't
                // retry-loop on persistent failures (rerenders re-trigger it)
                localStorage.setItem(storageKey, now.toString());
                // Only toast on user-initiated syncs; auto-sync stays quiet
                if (force) toast.error(i18n.t('toast.ouraSyncError'));
                // Do NOT throw, just return error status
                return { status: 'error', error: err.message };
            } finally {
                setIsSyncing(false);
            }
        },
        [isSyncing, saveOuraEntry, saveStepsEntry, supabase.user?.id],
    );

    // --- OAUTH CALLBACK HANDLING ---
    // After Oura redirects back to the app root with ?code&state, exchange the
    // code for tokens once the profile is loaded (so we can persist the token).
    useEffect(() => {
        if (!profile || !saveProfile) return;

        const pending = consumePendingOuraCallback();
        if (!pending) return;

        (async () => {
            try {
                console.log('[OuraSync] Exchanging OAuth code for tokens...');
                const tokens = await exchangeOuraCode(pending.code);
                await persistOAuthTokens(tokens);
                toast.success(i18n.t('oura.oauth.connected'));
                // Kick off an initial sync with the fresh token
                syncOuraData(true);
            } catch (err) {
                console.error('[OuraSync] OAuth code exchange failed:', err);
                toast.error(i18n.t('oura.oauth.connectError'));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!profile, !!saveProfile]);

    // --- AUTO SYNC LOGIC ---
    useEffect(() => {
        const userId = supabase.user?.id;
        if (!userId) return; // Wait for user to be hydrated to avoid using legacy keys

        const triggerAutoSync = async () => {
            // Only trigger if we are not already syncing
            if (isSyncing || syncStatus === 'success') return;

            const now = new Date();
            const currentTimestamp = now.getTime();

            // Define sync target: 11:00 AM Argentina (UTC-3)
            const syncTimeToday = new Date();
            syncTimeToday.setHours(11, 0, 0, 0);

            const keys = getCacheKeys(userId);
            const storageKey = `${keys.METADATA}_oura_sync`;

            const lastSyncStr = localStorage.getItem(storageKey);
            const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;

            // Trigger criteria:
            // 1. Current time is after 11:00 AM
            // 2. Last sync was before today's 11:00 AM target
            if (
                currentTimestamp >= syncTimeToday.getTime() &&
                lastSync < syncTimeToday.getTime()
            ) {
                console.log(
                    `[OuraSync] Auto-triggering sync (Schedule: 11 AM | User: ${userId.substring(0, 8)})`,
                );
                await syncOuraData();
            }
        };

        // Delay slightly to give the app time to settle
        const timer = setTimeout(triggerAutoSync, 2000);
        return () => clearTimeout(timer);
    }, [syncOuraData, isSyncing, syncStatus, supabase.user?.id]);

    return {
        syncOuraData,
        isSyncing,
        syncStatus,
    };
};

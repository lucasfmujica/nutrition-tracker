import { useEffect, useRef, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';

/**
 * Unified useCloud flag with stability during token refresh.
 * Single source of truth for cloud connectivity status.
 *
 * CRITICAL: Debounced useCloud calculation to prevent data loss during token
 * refresh. Token refresh causes isAuthenticated to briefly flip to false
 * (50-100ms window). Without debouncing, writes during this window would not
 * be queued in The Vault.
 */
export const useCloudGate = (supabase: ReturnType<typeof useSupabase>) => {
    const [offlineMode, setOfflineMode] = useState<boolean>(false);
    const [useCloud, setUseCloud] = useState<boolean>(false);
    const useCloudRef = useRef<boolean>(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const newValue = Boolean(
            supabase.isAuthenticated && !offlineMode && supabase.isOnline,
        );

        // If switching to FALSE, debounce for 200ms to avoid transient auth states
        if (!newValue && useCloudRef.current) {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                useCloudRef.current = newValue;
                setUseCloud(newValue);
            }, 200); // 200ms debounce protects against token refresh
        } else {
            // If switching to TRUE, apply immediately (no need to delay recovery)
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            useCloudRef.current = newValue;
            setUseCloud(newValue);
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [supabase.isAuthenticated, offlineMode, supabase.isOnline]);

    return { offlineMode, setOfflineMode, useCloud };
};

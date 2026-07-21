/**
 * useVaultCount - Cantidad de escrituras pendientes en The Vault para el badge
 * de la UI (CLAUDE.md: mostrar badge visual cuando vaultCount > 0).
 *
 * Polling liviano cada 30s (misma cadencia que el Vault worker) + refresh al
 * volver online. Autocontenido a propósito: no toca useVaultWorker ni
 * TrackerContext para no desestabilizar los hooks de sync.
 */
import { useEffect, useState } from 'react';
import { getPendingWrites } from '../utils/storageUtils';

const POLL_MS = 30000;

export const useVaultCount = (userId?: string): number => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!userId) {
            setCount(0);
            return;
        }

        let mounted = true;
        const refresh = () => {
            getPendingWrites(userId)
                .then((queue) => {
                    if (mounted) setCount(queue.length);
                })
                .catch((err) => {
                    console.error('[useVaultCount] Failed to read Vault queue:', err);
                });
        };

        refresh();
        const intervalId = setInterval(refresh, POLL_MS);
        window.addEventListener('online', refresh);

        return () => {
            mounted = false;
            clearInterval(intervalId);
            window.removeEventListener('online', refresh);
        };
    }, [userId]);

    return count;
};

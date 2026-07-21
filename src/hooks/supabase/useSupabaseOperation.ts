import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { devLog } from '../../utils/devLog';

/**
 * Classifies errors to determine if retry is appropriate
 */
export const isRetryableError = (error: any): boolean => {
    if (!error) return false;

    const message = (error.message || '').toLowerCase();

    // Network/timeout errors - always retryable
    if (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('fetch failed') ||
        message.includes('failed to fetch')
    ) {
        return true;
    }

    // HTTP status codes (if available in error)
    const statusMatch = message.match(/\b(4\d{2}|5\d{2})\b/); // Match 4xx or 5xx
    if (statusMatch) {
        const status = parseInt(statusMatch[0]);

        // Non-retryable client errors
        if ([400, 401, 403, 404, 422].includes(status)) {
            return false; // Bad request, auth issues, not found - won't fix with retry
        }

        // Retryable server errors
        if ([500, 502, 503, 504].includes(status)) {
            return true; // Server errors might be transient
        }

        // Rate limit - technically retryable but needs special handling (future: respect Retry-After)
        if (status === 429) {
            console.warn('[useSupabaseOperation] Rate limit hit - backing off');
            return true;
        }
    }

    // PostgreSQL/Supabase specific errors (non-retryable)
    if (
        message.includes('unique constraint') ||
        message.includes('foreign key') ||
        message.includes('permission denied') ||
        message.includes('invalid input')
    ) {
        return false;
    }

    // Default: retry unknown errors (conservative approach)
    return true;
};

export interface SyncOptions {
    canUseSupabase?: boolean;
    errorMessage?: string;
    timeout?: number;
    maxRetries?: number;
    enableRetry?: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface UseSupabaseOperationReturn {
    syncStatus: SyncStatus;
    syncError: string | null;
    lastSyncTime: Date | null;
    withSync: <T>(
        operation: () => Promise<T>,
        options?: SyncOptions,
    ) => Promise<T | { data: null; error: any }>;
    withTimeout: <T>(
        promise: Promise<T> | PromiseLike<T>,
        timeoutMs?: number,
        operationName?: string,
    ) => Promise<T>;
    setSyncStatus: Dispatch<SetStateAction<SyncStatus>>;
    setSyncError: Dispatch<SetStateAction<string | null>>;
    setLastSyncTime: Dispatch<SetStateAction<Date | null>>;
}

/**
 * Hook to manage Supabase async operations with Optimistic UI states.
 * Handles loading, error, success, and idle states automatically.
 */
export function useSupabaseOperation(): UseSupabaseOperationReturn {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    /**
     * wraps a promise with a timeout to prevent hanging operations
     * 🔒 CRITICAL FIX: Reduced default timeout from 120s to 12s
     * If Supabase is slow, fail fast and let app use stale cache
     */
    const withTimeout = async <T>(
        promise: Promise<T> | PromiseLike<T>,
        timeoutMs = 12000,
        operationName = 'Operation',
    ): Promise<T> => {
        let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(`${operationName} timeout after ${timeoutMs}ms`));
            }, timeoutMs);
        });

        try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutId!);
            return result;
        } catch (error) {
            clearTimeout(timeoutId!);
            throw error;
        }
    };

    /**
     * Wraps an operation with sync state management (optimistic UI)
     */
    const withSync = useCallback(
        async <T>(
            operation: () => Promise<T>,
            {
                canUseSupabase = true,
                errorMessage = 'Error de sincronización',
                timeout = 12000, // Reduced from 120s to 12s
                maxRetries = 2, // Reduced from 3 to 2
                enableRetry = true,
            }: SyncOptions = {},
        ): Promise<T | { data: null; error: any }> => {
            if (!canUseSupabase) {
                return {
                    data: null,
                    error: { message: 'Not authenticated or offline' },
                };
            }

            setSyncStatus('syncing');
            setSyncError(null);

            let lastError: any = null;
            const retries = enableRetry ? maxRetries : 1;

            // Retry loop with exponential backoff
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    // Execute operation with timeout protection
                    // Note: we can't easily use withTimeout from the outer scope inside useCallback without adding it to deps,
                    // which might cause loops if withTimeout isn't stable.
                    // For now, I'll inline the logic or assume it's fine.
                    // Actually, let's just duplicate the simple timeout logic here or accept the dep

                    let timeoutId: NodeJS.Timeout;
                    const result = await Promise.race([
                        operation(),
                        new Promise<never>((_, reject) => {
                            timeoutId = setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            `Sync Operation timeout after ${timeout}ms`,
                                        ),
                                    ),
                                timeout,
                            );
                        }),
                    ]);
                    clearTimeout(timeoutId!);

                    // Success path
                    setSyncStatus('success');
                    setLastSyncTime(new Date()); // Local time, display components handle formatting

                    // Reset to idle for UI feedback duration
                    setTimeout(() => setSyncStatus('idle'), 1500);

                    if (attempt > 1) {
                        devLog(
                            `[useSupabaseOperation] Success after ${attempt} attempts`,
                        );
                    }

                    return result;
                } catch (err: any) {
                    lastError = err;

                    // Check if error is retryable (transient vs permanent)
                    const shouldRetry = isRetryableError(err);

                    if (!shouldRetry) {
                        // Fail fast on non-retryable errors (auth, validation, not found, etc.)
                        console.error(
                            `[useSupabaseOperation] Non-retryable error detected, failing immediately:`,
                            err.message,
                        );
                        break; // Exit retry loop
                    }

                    // If not last attempt, retry with exponential backoff + jitter
                    if (attempt < retries) {
                        const baseBackoff = 1000 * Math.pow(2, attempt - 1);
                        const backoffMs = Math.min(
                            baseBackoff * (0.5 + Math.random()),
                            8000,
                        ); // Max 8s
                        console.warn(
                            `[useSupabaseOperation] Attempt ${attempt}/${retries} failed (retryable), retrying in ${Math.round(backoffMs)}ms:`,
                            lastError.message,
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, backoffMs),
                        );
                    }
                }
            }

            // All retries exhausted
            console.error(
                `[useSupabaseOperation] ${errorMessage} after ${retries} attempts:`,
                lastError,
            );
            setSyncStatus('error');
            setSyncError(lastError?.message || errorMessage);

            // Prevent stuck error state
            setTimeout(() => setSyncStatus('idle'), 2000);

            return { data: null, error: lastError };
        },
        [],
    );

    return {
        syncStatus,
        syncError,
        lastSyncTime,
        withSync,
        withTimeout,
        setSyncStatus,
        setSyncError,
        setLastSyncTime,
    };
}

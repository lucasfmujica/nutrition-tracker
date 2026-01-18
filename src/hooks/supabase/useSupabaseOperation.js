import { useCallback, useState } from 'react';

/**
 * Classifies errors to determine if retry is appropriate
 * @param {Error} error - The error object
 * @returns {boolean} - true if error is transient and retryable
 */
const isRetryableError = (error) => {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';

  // Network/timeout errors - always retryable
  if (message.includes('timeout') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch')) {
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
  if (message.includes('unique constraint') ||
    message.includes('foreign key') ||
    message.includes('permission denied') ||
    message.includes('invalid input')) {
    return false;
  }

  // Default: retry unknown errors (conservative approach)
  return true;
};

/**
 * Hook to manage Supabase async operations with Optimistic UI states.
 * Handles loading, error, success, and idle states automatically.
 */
export function useSupabaseOperation() {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  /**
   * wraps a promise with a timeout to prevent hanging operations
   * @param {Promise} promise - The async operation
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {string} operationName - Name for error logging
   */
  const withTimeout = async (promise, timeoutMs = 120000, operationName = 'Operation') => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${operationName} timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  /**
   * Wraps an operation with sync state management (optimistic UI)
   * @param {Function} operation - Async function to execute
   * @param {Object} options - Configuration options
   * @param {boolean} options.canUseSupabase - Guard to check if operation should proceed
   * @param {string} options.errorMessage - Custom error message
   * @param {number} options.timeout - Timeout in ms (default 120000)
   * @param {number} options.maxRetries - Maximum retry attempts (default 3)
   * @param {boolean} options.enableRetry - Enable retry logic (default true)
   */
  const withSync = useCallback(async (operation, {
    canUseSupabase = true,
    errorMessage = 'Error de sincronización',
    timeout = 120000,
    maxRetries = 3,
    enableRetry = true
  } = {}) => {

    if (!canUseSupabase) {
      return { data: null, error: { message: 'Not authenticated or offline' } };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    let lastError = null;
    const retries = enableRetry ? maxRetries : 1;

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Execute operation with timeout protection
        const result = await withTimeout(operation(), timeout, 'Sync Operation');

        // Success path
        setSyncStatus('success');
        setLastSyncTime(new Date()); // Local time, display components handle formatting

        // Reset to idle for UI feedback duration
        setTimeout(() => setSyncStatus('idle'), 1500);

        if (attempt > 1) {
          console.log(`[useSupabaseOperation] Success after ${attempt} attempts`);
        }

        return result;
      } catch (err) {
        lastError = err;

        // Check if error is retryable (transient vs permanent)
        const shouldRetry = isRetryableError(err);

        if (!shouldRetry) {
          // Fail fast on non-retryable errors (auth, validation, not found, etc.)
          console.error(`[useSupabaseOperation] Non-retryable error detected, failing immediately:`, err.message);
          break; // Exit retry loop
        }

        // If not last attempt, retry with exponential backoff + jitter
        if (attempt < retries) {
          // Jitter prevents "thundering herd" - multiple clients retrying simultaneously
          // Formula: base_backoff * (0.5 + random[0,1)) = randomize by ±50%
          const baseBackoff = 1000 * Math.pow(2, attempt - 1);
          const backoffMs = Math.min(baseBackoff * (0.5 + Math.random()), 8000); // Max 8s
          console.warn(`[useSupabaseOperation] Attempt ${attempt}/${retries} failed (retryable), retrying in ${Math.round(backoffMs)}ms:`, err.message);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries exhausted
    console.error(`[useSupabaseOperation] ${errorMessage} after ${retries} attempts:`, lastError);
    setSyncStatus('error');
    setSyncError(lastError.message || errorMessage);

    // Prevent stuck error state
    setTimeout(() => setSyncStatus('idle'), 2000);

    return { data: null, error: lastError };
  }, []); // No dependencies needed as helper functions are internal or pure

  return {
    syncStatus,
    syncError,
    lastSyncTime,
    withSync,
    withTimeout,
    setSyncStatus, // Exposed for manual overrides if necessary (e.g. from composed hooks)
    setSyncError, // Exposed for error state management
    setLastSyncTime, // Exposed for manual sync time updates
  };
}

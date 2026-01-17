import { useCallback, useState } from 'react';

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
  const withTimeout = async (promise, timeoutMs = 30000, operationName = 'Operation') => {
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
   * @param {number} options.timeout - Timeout in ms (default 30000)
   */
  const withSync = useCallback(async (operation, {
    canUseSupabase = true,
    errorMessage = 'Error de sincronización',
    timeout = 30000
  } = {}) => {

    if (!canUseSupabase) {
      return { data: null, error: { message: 'Not authenticated or offline' } };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      // Execute operation with timeout protection
      const result = await withTimeout(operation(), timeout, 'Sync Operation');

      setSyncStatus('success');
      setLastSyncTime(new Date()); // Local time, display components handle formatting

      // Reset to idle for UI feedback duration
      setTimeout(() => setSyncStatus('idle'), 1500);

      return result;
    } catch (err) {
      console.error(`[useSupabaseOperation] ${errorMessage}:`, err);
      setSyncStatus('error');
      setSyncError(err.message || errorMessage);

      // Prevent stuck error state
      setTimeout(() => setSyncStatus('idle'), 2000);

      return { data: null, error: err };
    }
  }, []); // No dependencies needed as helper functions are internal or pure

  return {
    syncStatus,
    syncError,
    lastSyncTime,
    withSync,
    withTimeout,
    setSyncStatus, // Exposed for manual overrides if necessary (e.g. from composed hooks)
  };
}

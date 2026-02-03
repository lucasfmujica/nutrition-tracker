/**
 * errorLogger.ts
 *
 * Centralized error handling and logging utility
 * Ensures consistent error reporting across the application
 *
 * FEATURES:
 * - Standardized log format with timestamps
 * - Context-based prefixes for easier debugging
 * - Automatic severity levels
 * - Future-ready for error reporting services (Sentry, etc.)
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface LogContext {
    module: string; // e.g., 'useNutrition', 'VaultWorker', 'Cache'
    operation?: string; // e.g., 'saveFood', 'processQueue', 'loadData'
    userId?: string; // For debugging user-specific issues
    data?: any; // Additional context data
}

/**
 * Format timestamp in Argentina timezone
 */
const getTimestamp = (): string => {
    return new Date().toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour12: false,
    });
};

/**
 * Format log message with context
 */
const formatLogMessage = (
    level: LogLevel,
    context: LogContext,
    message: string,
    error?: Error | any,
): string => {
    const timestamp = getTimestamp();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context.module}]`;
    const operation = context.operation ? ` ${context.operation}:` : '';
    const errorDetails = error instanceof Error ? ` - ${error.message}` : '';
    const userId = context.userId ? ` (User: ${context.userId.substring(0, 8)})` : '';

    return `${prefix}${operation} ${message}${errorDetails}${userId}`;
};

/**
 * Log info message
 * Use for normal operations and state changes
 */
export const logInfo = (context: LogContext, message: string, data?: any): void => {
    const formatted = formatLogMessage('info', context, message);
    console.log(formatted, data !== undefined ? data : '');
};

/**
 * Log warning message
 * Use for recoverable errors or unexpected states
 */
export const logWarn = (context: LogContext, message: string, data?: any): void => {
    const formatted = formatLogMessage('warn', context, message);
    console.warn(formatted, data !== undefined ? data : '');
};

/**
 * Log error message
 * Use for errors that don't crash the app but need attention
 */
export const logError = (
    context: LogContext,
    message: string,
    error?: Error | any,
    data?: any,
): void => {
    const formatted = formatLogMessage('error', context, message, error);
    console.error(formatted, data !== undefined ? data : '');

    // Future: Send to error reporting service (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //     Sentry.captureException(error, { contexts: { custom: context } });
    // }
};

/**
 * Log critical error message
 * Use for errors that might crash the app or cause data loss
 */
export const logCritical = (
    context: LogContext,
    message: string,
    error: Error | any,
    data?: any,
): void => {
    const formatted = formatLogMessage('critical', context, message, error);
    console.error('🔴 CRITICAL:', formatted, data !== undefined ? data : '');

    // Future: Send to error reporting service with high priority
    // if (process.env.NODE_ENV === 'production') {
    //     Sentry.captureException(error, {
    //         level: 'fatal',
    //         contexts: { custom: context },
    //     });
    // }
};

/**
 * Sync Status Formatter
 * Returns user-friendly status messages for UI display
 */
export const formatSyncStatus = (
    type: 'success' | 'error' | 'warning' | 'syncing',
    details?: string,
): string => {
    const emoji = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        syncing: '🔄',
    };

    const defaultMessages = {
        success: 'Sincronizado correctamente',
        error: 'Error de conexión',
        warning: 'Sincronizando en segundo plano',
        syncing: 'Sincronizando...',
    };

    return `${emoji[type]} ${details || defaultMessages[type]}`;
};

/**
 * Example usage:
 *
 * // Info log
 * logInfo({ module: 'useNutrition', operation: 'saveFood' }, 'Food entry saved', { calories: 500 });
 *
 * // Warning log
 * logWarn({ module: 'Cache', operation: 'loadData' }, 'Cache is stale', { age: 360000 });
 *
 * // Error log
 * logError({ module: 'VaultWorker', operation: 'processQueue', userId: 'abc123' },
 *          'Failed to sync food entry', error, { entryId: '123' });
 *
 * // Critical log
 * logCritical({ module: 'StorageUtils' }, 'LocalStorage quota exceeded', error);
 */

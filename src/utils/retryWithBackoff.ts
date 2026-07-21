import { devLog } from './devLog';

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Promise with the function result
 * @throws The last error if all retries fail
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => supabase.from('table').select(),
 *   3,
 *   1000
 * );
 */
/**
 * Determine whether an error should NOT be retried.
 *
 * Non-recoverable client errors (4xx other than 429 Too Many Requests) are
 * permanent for the same request, so retrying only wastes time. 429, network
 * errors and 5xx responses remain retryable.
 *
 * @param error - The error thrown by the retried function.
 * @returns true if the error is a non-retryable 4xx (excluding 429).
 */
function isNonRetryable4xx(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    // Status may live on `.status` or `.code` depending on the source.
    const withStatus = error as { status?: unknown; code?: unknown; message?: unknown };
    let status =
        typeof withStatus.status === 'number'
            ? withStatus.status
            : typeof withStatus.code === 'number'
              ? withStatus.code
              : undefined;

    // Fallback: try to detect an HTTP status code embedded in the message.
    if (status === undefined && typeof withStatus.message === 'string') {
        const match = withStatus.message.match(/\b(4\d{2}|5\d{2})\b/);
        if (match) status = parseInt(match[1], 10);
    }

    if (status === undefined) return false;

    // Retry 429 (rate limit); do not retry other 4xx (e.g. 400/401/403/404).
    return status >= 400 && status < 500 && status !== 429;
}

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const timestamp = new Date().toISOString();
            devLog(`[RetryWithBackoff ${timestamp}] Attempt ${attempt + 1}/${maxRetries + 1}`);

            const result = await fn();

            if (attempt > 0) {
                devLog(`[RetryWithBackoff ${timestamp}] ✓ Success after ${attempt} retries`);
            }

            return result;
        } catch (error) {
            lastError = error as Error;
            const timestamp = new Date().toISOString();

            // Do not retry non-recoverable client errors (4xx except 429).
            if (isNonRetryable4xx(error)) {
                console.error(
                    `[RetryWithBackoff ${timestamp}] ✗ Non-retryable error, aborting:`,
                    lastError.message || lastError
                );
                throw lastError;
            }

            // If this was the last attempt, throw the error
            if (attempt === maxRetries) {
                console.error(`[RetryWithBackoff ${timestamp}] ✗ All ${maxRetries + 1} attempts failed:`, lastError);
                throw lastError;
            }

            // Calculate exponential backoff: 1s, 2s, 4s, 8s...
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(
                `[RetryWithBackoff ${timestamp}] ⚠ Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`,
                lastError.message || lastError
            );

            // Wait before next retry
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // This should never be reached due to the throw above, but TypeScript needs it
    throw lastError || new Error('Unknown error in retryWithBackoff');
}

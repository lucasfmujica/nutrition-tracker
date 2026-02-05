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
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const timestamp = new Date().toISOString();
            console.log(`[RetryWithBackoff ${timestamp}] Attempt ${attempt + 1}/${maxRetries + 1}`);

            const result = await fn();

            if (attempt > 0) {
                console.log(`[RetryWithBackoff ${timestamp}] ✓ Success after ${attempt} retries`);
            }

            return result;
        } catch (error) {
            lastError = error as Error;
            const timestamp = new Date().toISOString();

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

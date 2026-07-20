/**
 * Logs only in local development. Keeps routine/informational tracing out of
 * the production console without touching console.error/warn calls tied to
 * actual error handling (those must always run, per the app's resilience rules).
 */
export const devLog = (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
        console.log(...args);
    }
};

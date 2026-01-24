import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * A wrapper around React.lazy that handles ChunkLoadErrors (common when a new version is deployed)
 * by forcing a full page reload to fetch the latest assets.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
    componentImport: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
    return lazy(async () => {
        try {
            return await componentImport();
        } catch (error: any) {
            // Check if the error is related to failed chunk loading
            const isChunkLoadError =
                error.name === 'ChunkLoadError' ||
                /failed to fetch dynamically imported module/i.test(error.message);

            if (isChunkLoadError) {
                console.warn('[Lazy] Chunk load failed, reloading page...', error);
                window.location.reload();
                // Return a "never" promise to prevent further execution while the page reloads
                return new Promise(() => {}) as any;
            }

            throw error;
        }
    });
}

/**
 * A wrapper around dynamic imports that handles ChunkLoadErrors
 * by forcing a full page reload.
 */
export async function importWithRetry<T>(importFn: () => Promise<T>): Promise<T> {
    try {
        return await importFn();
    } catch (error: any) {
        const isChunkLoadError =
            error.name === 'ChunkLoadError' ||
            /failed to fetch dynamically imported module/i.test(error.message);

        if (isChunkLoadError) {
            console.warn('[Import] Chunk load failed, reloading page...', error);
            window.location.reload();
            // Return a "never" promise to prevent further execution while the page reloads
            return new Promise(() => {}) as any;
        }

        throw error;
    }
}

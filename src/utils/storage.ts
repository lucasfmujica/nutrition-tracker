/**
 * Storage helper for persisting data to localStorage or window.storage (if available)
 */

interface StorageResult<T> {
    value: T | null;
}

interface StorageSetResult<T> {
    key: string;
    value: T;
}

// Minimal interface for window.storage if it exists in your environment
// You might need to add this to a declaration file (e.g., globals.d.ts) later
interface WindowStorage {
    get(key: string): Promise<StorageResult<string>>;
    set(key: string, value: string): Promise<StorageSetResult<string>>;
    remove?(key: string): Promise<void>;
}

export const storage = {
    async get(key: string): Promise<StorageResult<string> | null> {
        try {
            if ((window as any).storage) {
                return await ((window as any).storage as WindowStorage).get(key);
            }
            const val = localStorage.getItem(key);
            return val ? { value: val } : null;
        } catch (err) {
            console.warn('[storage] window.storage get failed, falling back to localStorage:', err);
            const val = localStorage.getItem(key);
            return val ? { value: val } : null;
        }
    },
    async set(key: string, value: string): Promise<StorageSetResult<string>> {
        try {
            if ((window as any).storage) {
                return await ((window as any).storage as WindowStorage).set(
                    key,
                    value,
                );
            }
            localStorage.setItem(key, value);
            return { key, value };
        } catch (err) {
            console.warn('[storage] window.storage set failed, falling back to localStorage:', err);
            localStorage.setItem(key, value);
            return { key, value };
        }
    },
    async remove(key: string): Promise<void> {
        try {
            if ((window as any).storage && (window as any).storage.remove) {
                // Assuming window.storage has remove, if not fallback to localStorage would be tricky if it's mixed
                // But mapped to original code: original code employed localStorage.removeItem inside handleLogout
                // We should just use localStorage.removeItem since the original code did that for logout
                await ((window as any).storage as WindowStorage).remove!(key);
                return;
            }
            localStorage.removeItem(key);
        } catch (err) {
            console.warn('[storage] window.storage remove failed, falling back to localStorage:', err);
            localStorage.removeItem(key);
        }
    },
};

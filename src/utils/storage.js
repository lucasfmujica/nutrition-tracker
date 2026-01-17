/**
 * Storage helper for persisting data to localStorage or window.storage (if available)
 */
export const storage = {
  async get(key) {
    try {
      if (window.storage) {
        return await window.storage.get(key);
      }
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    } catch {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    }
  },
  async set(key, value) {
    try {
      if (window.storage) {
        return await window.storage.set(key, value);
      }
      localStorage.setItem(key, value);
      return { key, value };
    } catch {
      localStorage.setItem(key, value);
      return { key, value };
    }
  },
  async remove(key) {
    try {
      if (window.storage && window.storage.remove) {
        // Assuming window.storage has remove, if not fallback to localStorage would be tricky if it's mixed
        // But mapped to original code: original code employed localStorage.removeItem inside handleLogout
        // We should just use localStorage.removeItem since the original code did that for logout
        await window.storage.remove(key);
        return;
      }
      localStorage.removeItem(key);
    } catch {
      localStorage.removeItem(key);
    }
  }
};

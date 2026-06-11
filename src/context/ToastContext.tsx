/**
 * ToastContext - Lightweight global toast store
 *
 * Implemented as a module-level external store (useSyncExternalStore) so that
 * BOTH React code (via useToast) and non-React code (services, sync workers)
 * can emit toasts via the exported `toast` / `showToast` functions.
 *
 * Variants: success | error | info — auto-dismiss, stackable (max 4).
 */
import { useSyncExternalStore } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
    id: string;
    message: string;
    variant: ToastVariant;
    duration: number;
}

const MAX_TOASTS = 4;

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
    success: 3000,
    info: 4500,
    error: 6000,
};

// ---- Module-level store ----
let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const getSnapshot = () => toasts;

/**
 * Dismiss a toast by id (also clears its auto-dismiss timer)
 */
export const dismissToast = (id: string): void => {
    const timer = timers.get(id);
    if (timer) {
        clearTimeout(timer);
        timers.delete(id);
    }
    if (toasts.some((t) => t.id === id)) {
        toasts = toasts.filter((t) => t.id !== id);
        emit();
    }
};

/**
 * Show a toast notification. Safe to call from anywhere (hooks, services).
 * Duplicate visible messages of the same variant are deduped.
 */
export const showToast = (
    message: string,
    variant: ToastVariant = 'info',
    duration?: number,
): void => {
    if (!message) return;

    // Dedupe: don't stack identical messages
    if (toasts.some((t) => t.message === message && t.variant === variant)) {
        return;
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: ToastItem = {
        id,
        message,
        variant,
        duration: duration ?? DEFAULT_DURATIONS[variant],
    };

    toasts = [...toasts, item];

    // Cap the stack: drop the oldest
    if (toasts.length > MAX_TOASTS) {
        const removed = toasts.slice(0, toasts.length - MAX_TOASTS);
        removed.forEach((t) => {
            const timer = timers.get(t.id);
            if (timer) clearTimeout(timer);
            timers.delete(t.id);
        });
        toasts = toasts.slice(-MAX_TOASTS);
    }

    timers.set(
        id,
        setTimeout(() => dismissToast(id), item.duration),
    );

    emit();
};

/**
 * Convenience API: toast.success / toast.error / toast.info
 */
export const toast = {
    success: (message: string, duration?: number) =>
        showToast(message, 'success', duration),
    error: (message: string, duration?: number) =>
        showToast(message, 'error', duration),
    info: (message: string, duration?: number) =>
        showToast(message, 'info', duration),
};

/**
 * useToast - Hook returning the toast API for components
 */
export const useToast = () => toast;

/**
 * useToasts - Subscribe to the current toast stack (used by the renderer)
 */
export const useToasts = (): ToastItem[] =>
    useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

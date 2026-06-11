import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Local notification scheduling for the PWA.
 * No push server: uses the Notification API + the registered service worker
 * (registration.showNotification) with client-side setTimeout scheduling.
 * Config persists in localStorage. Timers are re-armed on visibility change
 * so reminders recover after the tab/PWA was suspended.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationsConfig {
    enabled: boolean;
    hydration: {
        enabled: boolean;
        intervalHours: number; // every N hours
        startHour: number; // window start (0-23)
        endHour: number; // window end (0-23)
    };
    meals: {
        enabled: boolean;
        times: string[]; // "HH:MM" entries
    };
    weighIn: {
        enabled: boolean;
        time: string; // "HH:MM" (morning)
    };
}

const STORAGE_KEY = 'lukenfit_notifications_config';

export const DEFAULT_NOTIFICATIONS_CONFIG: NotificationsConfig = {
    enabled: false,
    hydration: {
        enabled: true,
        intervalHours: 2,
        startHour: 9,
        endHour: 21,
    },
    meals: {
        enabled: true,
        times: ['09:00', '13:30', '21:00'],
    },
    weighIn: {
        enabled: true,
        time: '08:00',
    },
};

const loadConfig = (): NotificationsConfig => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_NOTIFICATIONS_CONFIG;
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT_NOTIFICATIONS_CONFIG,
            ...parsed,
            hydration: {
                ...DEFAULT_NOTIFICATIONS_CONFIG.hydration,
                ...(parsed.hydration || {}),
            },
            meals: {
                ...DEFAULT_NOTIFICATIONS_CONFIG.meals,
                ...(parsed.meals || {}),
            },
            weighIn: {
                ...DEFAULT_NOTIFICATIONS_CONFIG.weighIn,
                ...(parsed.weighIn || {}),
            },
        };
    } catch (error) {
        console.error('[useNotifications] Error loading config:', error);
        return DEFAULT_NOTIFICATIONS_CONFIG;
    }
};

const getPermission = (): NotificationPermissionState => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
};

/** Parse "HH:MM" → next Date occurrence (today if still ahead, else tomorrow). */
const nextOccurrence = (time: string): Date | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) return null;
    const target = new Date();
    target.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
    if (target.getTime() <= Date.now()) {
        target.setDate(target.getDate() + 1);
    }
    return target;
};

/** Next hydration reminder within [startHour, endHour] every intervalHours, anchored at startHour. */
const nextHydration = (
    intervalHours: number,
    startHour: number,
    endHour: number,
): Date | null => {
    const interval = Math.max(1, intervalHours);
    const now = new Date();
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
        for (let hour = startHour; hour <= endHour; hour += interval) {
            const candidate = new Date(now);
            candidate.setDate(candidate.getDate() + dayOffset);
            candidate.setHours(hour, 0, 0, 0);
            if (candidate.getTime() > now.getTime()) {
                return candidate;
            }
        }
    }
    return null;
};

export const useNotifications = () => {
    const { t } = useTranslation();
    const [permission, setPermission] = useState<NotificationPermissionState>(getPermission);
    const [config, setConfig] = useState<NotificationsConfig>(loadConfig);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const updateConfig = useCallback((updater: Partial<NotificationsConfig>) => {
        setConfig((prev) => {
            const next = { ...prev, ...updater };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch (error) {
                console.error('[useNotifications] Error saving config:', error);
            }
            return next;
        });
    }, []);

    const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
        if (!('Notification' in window)) {
            setPermission('unsupported');
            return 'unsupported';
        }
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        } catch (error) {
            console.error('[useNotifications] Error requesting permission:', error);
            const current = getPermission();
            setPermission(current);
            return current;
        }
    }, []);

    /** Show a notification, preferring the service worker registration. */
    const showNotification = useCallback(
        async (title: string, body: string, tag: string) => {
            if (getPermission() !== 'granted') return;
            const options: NotificationOptions = {
                body,
                tag,
                icon: '/icons/icon-192x192.png',
                badge: '/favicon.png',
            };
            try {
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification(title, options);
                    return;
                }
            } catch (error) {
                console.error('[useNotifications] SW notification failed, falling back:', error);
            }
            try {
                new Notification(title, options);
            } catch (error) {
                console.error('[useNotifications] Error showing notification:', error);
            }
        },
        [],
    );

    // (Re)schedule all reminders whenever config/permission changes or the app
    // becomes visible again (timers don't survive suspension reliably).
    useEffect(() => {
        const clearTimers = () => {
            timersRef.current.forEach((id) => clearTimeout(id));
            timersRef.current = [];
        };

        const schedule = () => {
            clearTimers();
            if (!config.enabled || permission !== 'granted') return;

            const arm = (when: Date | null, fire: () => void) => {
                if (!when) return;
                const delay = when.getTime() - Date.now();
                if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;
                timersRef.current.push(
                    setTimeout(() => {
                        fire();
                        // Re-arm for the following occurrence
                        schedule();
                    }, delay),
                );
            };

            if (config.hydration.enabled) {
                arm(
                    nextHydration(
                        config.hydration.intervalHours,
                        config.hydration.startHour,
                        config.hydration.endHour,
                    ),
                    () =>
                        showNotification(
                            t('config.notifications.hydration.notifTitle'),
                            t('config.notifications.hydration.notifBody'),
                            'lukenfit-hydration',
                        ),
                );
            }

            if (config.meals.enabled) {
                config.meals.times.forEach((time, index) => {
                    arm(nextOccurrence(time), () =>
                        showNotification(
                            t('config.notifications.meals.notifTitle'),
                            t('config.notifications.meals.notifBody'),
                            `lukenfit-meal-${index}`,
                        ),
                    );
                });
            }

            if (config.weighIn.enabled) {
                arm(nextOccurrence(config.weighIn.time), () =>
                    showNotification(
                        t('config.notifications.weighIn.notifTitle'),
                        t('config.notifications.weighIn.notifBody'),
                        'lukenfit-weighin',
                    ),
                );
            }
        };

        schedule();

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                schedule();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            clearTimers();
        };
    }, [config, permission, showNotification, t]);

    return {
        permission,
        config,
        updateConfig,
        requestPermission,
        showNotification,
        isSupported: permission !== 'unsupported',
    };
};

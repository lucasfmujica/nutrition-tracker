import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * NotificationSettings - "Notificaciones" section for ConfigTab.
 * Master toggle + per-type toggles (hydration / meals / weigh-in) with schedules.
 * Handles unsupported browsers and denied permission with clear messaging.
 */
export const NotificationSettings: React.FC = () => {
    const { t } = useTranslation();
    const {
        permission,
        config,
        updateConfig,
        requestPermission,
        isSupported,
    } = useNotifications();

    const handleMasterToggle = async (checked: boolean) => {
        if (checked && permission !== 'granted') {
            const result = await requestPermission();
            if (result !== 'granted') {
                updateConfig({ enabled: false });
                return;
            }
        }
        updateConfig({ enabled: checked });
    };

    const updateMealTime = (index: number, value: string) => {
        const times = [...config.meals.times];
        times[index] = value;
        updateConfig({ meals: { ...config.meals, times } });
    };

    const toggleClass =
        "w-12 h-6 appearance-none bg-muted rounded-full relative cursor-pointer transition-colors checked:bg-primary before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-surface before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6 shrink-0";
    const inputClass =
        'bg-background border border-border rounded-xl px-3 py-2 text-sm font-bold text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all';

    return (
        <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-oura-soft rounded-full -mr-12 -mt-12 opacity-50" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-xs font-black text-oura dark:text-oura mb-1 uppercase tracking-[0.2em] flex items-center gap-2">
                            🔔 {t('config.notifications.title')}
                        </h2>
                        <p className="text-sm text-text-tertiary max-w-md">
                            {t('config.notifications.subtitle')}
                        </p>
                    </div>

                    {isSupported && (
                        <input
                            type="checkbox"
                            role="switch"
                            checked={config.enabled && permission === 'granted'}
                            aria-label={t('config.notifications.title')}
                            onChange={(e) => handleMasterToggle(e.target.checked)}
                            disabled={permission === 'denied'}
                            className={`${toggleClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                        />
                    )}
                </div>

                {/* Unsupported browser */}
                {!isSupported && (
                    <div className="mt-4 text-xs text-text-secondary bg-warning-soft p-3 rounded-lg flex items-start gap-2">
                        <span className="shrink-0">⚠️</span>
                        <span>{t('config.notifications.unsupported')}</span>
                    </div>
                )}

                {/* Permission denied */}
                {isSupported && permission === 'denied' && (
                    <div className="mt-4 text-xs text-danger bg-danger-soft p-3 rounded-lg flex items-start gap-2">
                        <span className="shrink-0">🚫</span>
                        <span>{t('config.notifications.denied')}</span>
                    </div>
                )}

                {/* Detail settings when enabled */}
                {isSupported &&
                    permission === 'granted' &&
                    config.enabled && (
                        <div className="mt-6 space-y-3">
                            {/* Hydration */}
                            <div className="p-4 bg-background rounded-2xl">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <span className="text-sm font-bold text-text-primary block">
                                            💧 {t('config.notifications.hydration.title')}
                                        </span>
                                        <span className="text-xs text-text-tertiary">
                                            {t('config.notifications.hydration.subtitle')}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        role="switch"
                                        checked={config.hydration.enabled}
                                        onChange={(e) =>
                                            updateConfig({
                                                hydration: {
                                                    ...config.hydration,
                                                    enabled: e.target.checked,
                                                },
                                            })
                                        }
                                        className={toggleClass}
                                    />
                                </label>
                                {config.hydration.enabled && (
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">
                                                {t('config.notifications.hydration.interval')}
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={12}
                                                value={config.hydration.intervalHours}
                                                onChange={(e) =>
                                                    updateConfig({
                                                        hydration: {
                                                            ...config.hydration,
                                                            intervalHours: Math.max(
                                                                1,
                                                                parseInt(e.target.value) || 1,
                                                            ),
                                                        },
                                                    })
                                                }
                                                className={`w-full ${inputClass}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">
                                                {t('config.notifications.hydration.from')}
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={23}
                                                value={config.hydration.startHour}
                                                onChange={(e) =>
                                                    updateConfig({
                                                        hydration: {
                                                            ...config.hydration,
                                                            startHour: Math.min(
                                                                23,
                                                                Math.max(0, parseInt(e.target.value) || 0),
                                                            ),
                                                        },
                                                    })
                                                }
                                                className={`w-full ${inputClass}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">
                                                {t('config.notifications.hydration.to')}
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={23}
                                                value={config.hydration.endHour}
                                                onChange={(e) =>
                                                    updateConfig({
                                                        hydration: {
                                                            ...config.hydration,
                                                            endHour: Math.min(
                                                                23,
                                                                Math.max(0, parseInt(e.target.value) || 0),
                                                            ),
                                                        },
                                                    })
                                                }
                                                className={`w-full ${inputClass}`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Meals */}
                            <div className="p-4 bg-background rounded-2xl">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <span className="text-sm font-bold text-text-primary block">
                                            🍽️ {t('config.notifications.meals.title')}
                                        </span>
                                        <span className="text-xs text-text-tertiary">
                                            {t('config.notifications.meals.subtitle')}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        role="switch"
                                        checked={config.meals.enabled}
                                        onChange={(e) =>
                                            updateConfig({
                                                meals: {
                                                    ...config.meals,
                                                    enabled: e.target.checked,
                                                },
                                            })
                                        }
                                        className={toggleClass}
                                    />
                                </label>
                                {config.meals.enabled && (
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        {config.meals.times.map((time, index) => (
                                            <input
                                                key={index}
                                                type="time"
                                                value={time}
                                                onChange={(e) =>
                                                    updateMealTime(index, e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Weigh-in */}
                            <div className="p-4 bg-background rounded-2xl">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <span className="text-sm font-bold text-text-primary block">
                                            ⚖️ {t('config.notifications.weighIn.title')}
                                        </span>
                                        <span className="text-xs text-text-tertiary">
                                            {t('config.notifications.weighIn.subtitle')}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        role="switch"
                                        checked={config.weighIn.enabled}
                                        onChange={(e) =>
                                            updateConfig({
                                                weighIn: {
                                                    ...config.weighIn,
                                                    enabled: e.target.checked,
                                                },
                                            })
                                        }
                                        className={toggleClass}
                                    />
                                </label>
                                {config.weighIn.enabled && (
                                    <div className="mt-4">
                                        <input
                                            type="time"
                                            value={config.weighIn.time}
                                            onChange={(e) =>
                                                updateConfig({
                                                    weighIn: {
                                                        ...config.weighIn,
                                                        time: e.target.value,
                                                    },
                                                })
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                )}
                            </div>

                            <p className="text-[10px] text-text-tertiary px-1">
                                {t('config.notifications.disclaimer')}
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
};

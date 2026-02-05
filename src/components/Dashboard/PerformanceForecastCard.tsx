import { BatteryCharging, Cloud, CloudRain, Info, Loader, Sun } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';

export interface PerformanceForecastMetrics {
    readiness3d?: string;
    readiness7d?: string;
    sleep3d?: string;
    sleep7d?: string;
    readinessTrend?: string;
    sleepTrend?: string;
    todayReadiness?: number;
    todaySleep?: number;
    volume48h?: number;
}

export interface PerformanceForecast {
    status: string;
    forecastCode: string;
    title: string;
    copy: string;
    icon: string;
    ui: {
        gradient: string;
        textColor: string;
    };
    metrics: PerformanceForecastMetrics;
}

/**
 * PerformanceForecastCard - "Tomorrow's Outlook"
 */
export const PerformanceForecastCard: React.FC = () => {
    const { performanceForecast } = useTracker() as {
        performanceForecast: PerformanceForecast;
    };
    const { t } = useTranslation();
    const [showExplanation, setShowExplanation] = useState(false);

    if (!performanceForecast) return null;

    const { title, copy, icon, ui, forecastCode, metrics } = performanceForecast;

    // Icon Mapping
    const getIcon = () => {
        switch (icon) {
            case 'sun':
                return <Sun className="w-8 h-8 text-amber-500" />;
            case 'cloud':
                return <Cloud className="w-8 h-8 text-text-tertiary" />;
            case 'cloud-rain':
                return <CloudRain className="w-8 h-8 text-indigo-400" />;
            case 'battery-charging':
                return <BatteryCharging className="w-8 h-8 text-purple-500" />;
            case 'loading':
                return <Loader className="w-8 h-8 text-text-tertiary animate-spin" />;
            default:
                return <Cloud className="w-8 h-8 text-text-tertiary" />;
        }
    };

    const gradientClass = ui?.gradient || 'from-gray-50 to-slate-50';
    const textClass = ui?.textColor || 'text-text-secondary';

    return (
        <div
            className={`card bg-gradient-to-br ${gradientClass} p-5 shadow-sm rounded-2xl border border-white/60 relative overflow-hidden`}>
            {/* Decorative background circle */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-surface/40 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-surface/80 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-black/5">
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0 w-full">
                    <div className="flex justify-between items-start gap-2 w-full">
                        <div className="min-w-0 flex-1">
                            <h3
                                className={`text-sm font-bold uppercase tracking-wide mb-1 opacity-80 ${textClass} truncate w-full`}>
                                {t('dashboard.forecast.title')}
                            </h3>
                            <div
                                className={`text-lg font-bold leading-tight ${textClass} break-words line-clamp-2`}>
                                {title}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowExplanation(!showExplanation)}
                                className={`p-1.5 rounded-lg transition-all ${showExplanation ? 'bg-surface shadow-sm text-blue-600' : 'text-text-tertiary hover:text-text-secondary'}`}
                                title={t('dashboard.forecast.howCalculated')}>
                                <Info size={18} />
                            </button>
                            {/* Status Badge */}
                            {forecastCode === 'peak' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                    {t('dashboard.forecast.prime')}
                                </span>
                            )}
                            {forecastCode === 'recovery' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-lighter text-text-secondary">
                                    {t('dashboard.forecast.rest')}
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                        {copy}
                    </p>
                </div>
            </div>

            {/* Logic Explanation */}
            {showExplanation && metrics && (
                <div className="mt-4 pt-4 border-t border-white/40 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-surface/60 backdrop-blur-md rounded-xl p-4 space-y-3 ring-1 ring-black/5 shadow-inner">
                        <h4 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            {t('dashboard.forecast.algorithm')}
                        </h4>

                        <p className="text-xs text-text-secondary leading-relaxed">
                            {t('dashboard.forecast.explanation')}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-text-tertiary uppercase">
                                    {t('dashboard.forecast.readinessTrend')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-sm font-black ${(parseFloat(metrics.readinessTrend ?? '0') || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {(parseFloat(
                                            metrics.readinessTrend ?? '0',
                                        ) || 0) > 0
                                            ? '+'
                                            : ''}
                                        {metrics.readinessTrend ?? '0'}%
                                    </span>
                                    <span className="text-[10px] text-text-tertiary">
                                        vs 7d
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-text-tertiary uppercase">
                                    {t('dashboard.forecast.sleepTrend')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-sm font-black ${(parseFloat(metrics.sleepTrend ?? '0') || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {(parseFloat(metrics.sleepTrend ?? '0') ||
                                            0) > 0
                                            ? '+'
                                            : ''}
                                        {metrics.sleepTrend ?? '0'}%
                                    </span>
                                    <span className="text-[10px] text-text-tertiary">
                                        vs 7d
                                    </span>
                                </div>
                            </div>

                            <div className="col-span-2 space-y-1 pt-1 border-t border-border/50">
                                <span className="text-[10px] font-bold text-text-tertiary uppercase">
                                    {t('dashboard.forecast.trainingLoad')}
                                </span>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-text-secondary">
                                        {(metrics.volume48h ?? 0).toLocaleString()}{' '}
                                        <span className="text-[10px] font-medium text-text-tertiary">
                                            kg (48h)
                                        </span>
                                    </span>
                                    <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${(metrics.volume48h ?? 0) > 10000 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                        {(metrics.volume48h ?? 0) > 10000
                                            ? t('dashboard.forecast.highLoad')
                                            : t('dashboard.forecast.optimal')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-2.5 rounded-lg">
                            <div
                                className={`p-4 rounded-xl border border-blue-200 bg-surface/50`}>
                                <p className="text-[10px] text-blue-700 italic leading-snug">
                                    <strong>
                                        {t('dashboard.forecast.whyStatement')}
                                    </strong>{' '}
                                    {forecastCode === 'peak' &&
                                        t('dashboard.forecast.whyReadiness')}
                                    {forecastCode === 'rest_volume' &&
                                        t('dashboard.forecast.whyVolume')}
                                    {forecastCode !== 'peak' &&
                                        forecastCode !== 'rest_volume' &&
                                        t('dashboard.forecast.whyStandard')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

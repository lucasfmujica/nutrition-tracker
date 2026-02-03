import { Cloud, Droplets, Flame, Sun, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface WeatherStatus {
    temperature: number;
    humidity: number;
    location?: string;
}

export interface HydrationTarget {
    target: number;
    baseline: number;
    heatBonus: number;
    activityBonus: number;
    needsElectrolytes: boolean;
    weatherStatus: WeatherStatus | null;
    isLoadingWeather: boolean;
    activityMinutes: number;
}

interface HydrationGuardProps {
    currentIntake: number;
    hydrationTarget: HydrationTarget;
    onAddWater?: (amount: number) => void;
}

/**
 * Weather status badge component
 */
const WeatherBadge: React.FC<{
    weatherStatus: WeatherStatus | null;
    isLoading: boolean;
}> = ({ weatherStatus, isLoading }) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Cloud size={16} className="animate-pulse" />
                <span>{t('dashboard.hydration.loading')}</span>
            </div>
        );
    }

    if (!weatherStatus) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <Cloud size={16} />
                <span>{t('dashboard.hydration.noData')}</span>
            </div>
        );
    }

    const { temperature, humidity, location } = weatherStatus;
    const isHot = temperature > 28;

    return (
        <div className="flex items-center gap-2 text-sm">
            {isHot ? (
                <Sun size={16} className="text-orange-500" />
            ) : (
                <Cloud size={16} className="text-blue-500" />
            )}
            <span className="font-medium text-gray-700">
                {temperature}°C - {location}
            </span>
            <span className="text-gray-400">•</span>
            <Droplets size={14} className="text-blue-400" />
            <span className="text-gray-600">{humidity}%</span>
        </div>
    );
};

/**
 * HydrationGuard Component - Main hydration intelligence dashboard
 */
export const HydrationGuard: React.FC<HydrationGuardProps> = ({
    currentIntake,
    hydrationTarget,
}) => {
    const { t } = useTranslation();
    const {
        target,
        baseline,
        heatBonus,
        activityBonus,
        needsElectrolytes,
        weatherStatus,
        isLoadingWeather,
    } = hydrationTarget;

    const progress = Math.min((currentIntake / target) * 100, 100);
    const isOnTrack = currentIntake >= target * 0.8;

    const getCoachTip = () => {
        if (needsElectrolytes) {
            return t('dashboard.hydration.tips.electrolytes', {
                temp: weatherStatus?.temperature,
                amount: 800, // Hardcoded in original logic, ideally dynamic
            });
        }

        if (activityBonus > 0 && hydrationTarget.activityMinutes > 0) {
            return t('dashboard.hydration.tips.activity', {
                minutes: hydrationTarget.activityMinutes,
                amount: activityBonus,
            });
        }

        if (heatBonus > 0) {
            return t('dashboard.hydration.tips.heat', {
                temp: weatherStatus?.temperature,
                amount: heatBonus,
            });
        }

        return t('dashboard.hydration.tips.ideal');
    };

    const coachTip = getCoachTip();

    return (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500 rounded-xl">
                        <Droplets size={18} className="text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">
                        {t('dashboard.hydration.title')}
                    </h3>
                </div>
                <div className="self-start sm:self-auto">
                    <WeatherBadge
                        weatherStatus={weatherStatus}
                        isLoading={isLoadingWeather}
                    />
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <span className="text-3xl font-bold text-gray-900">
                            {currentIntake}
                        </span>
                        <span className="text-lg text-gray-500 ml-1">ml</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-gray-500">
                            {t('dashboard.activity.goal')}:{' '}
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                            {target}ml
                        </span>
                    </div>
                </div>

                <div className="h-3 w-full bg-white rounded-full overflow-hidden shadow-inner">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            isOnTrack
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                : 'bg-blue-300'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {(heatBonus > 0 || activityBonus > 0) && (
                    <div className="flex gap-2 mt-2 text-xs">
                        <span className="text-gray-500">Base: {baseline}ml</span>
                        {activityBonus > 0 && (
                            <>
                                <span className="text-gray-400">•</span>
                                <span className="text-orange-600 flex items-center gap-1">
                                    <Zap size={12} />+{activityBonus}ml
                                </span>
                            </>
                        )}
                        {heatBonus > 0 && (
                            <>
                                <span className="text-gray-400">•</span>
                                <span className="text-red-600 flex items-center gap-1">
                                    <Flame size={12} />+{heatBonus}ml
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div
                className={`p-3 rounded-xl ${needsElectrolytes ? 'bg-orange-100 border border-orange-200' : 'bg-white border border-gray-100'}`}>
                <p className="text-sm text-gray-700 leading-relaxed">{coachTip}</p>
            </div>
        </div>
    );
};

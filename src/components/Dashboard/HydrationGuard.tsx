import { Cloud, Droplets, Flame, Sun, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface WeatherStatus {
    temperature: number;
    humidity: number;
    location?: string;
    unit?: 'C' | 'F';
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
    onAddWater?: () => void;
    onRemoveWater?: () => void;
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
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Cloud size={16} className="animate-pulse" />
                <span>{t('dashboard.hydration.loading')}</span>
            </div>
        );
    }

    if (!weatherStatus) {
        return (
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Cloud size={16} />
                <span>{t('dashboard.hydration.noData')}</span>
            </div>
        );
    }

    const { temperature, humidity, location, unit = 'C' } = weatherStatus;
    // Check threshold in C. If F, convert to C for logic.
    const tempC = unit === 'F' ? (temperature - 32) * (5 / 9) : temperature;
    const isHot = tempC > 28;

    return (
        <div className="flex items-center gap-2 text-sm">
            {isHot ? (
                <Sun size={16} className="text-warning" />
            ) : (
                <Cloud size={16} className="text-info" />
            )}
            <span className="font-medium text-text-secondary">
                {temperature}°{unit} - {location}
            </span>
            <span className="text-text-tertiary">•</span>
            <Droplets size={14} className="text-info" />
            <span className="text-text-secondary">{humidity}%</span>
        </div>
    );
};

/**
 * HydrationGuard Component - Main hydration intelligence dashboard
 */
export const HydrationGuard: React.FC<HydrationGuardProps> = ({
    currentIntake,
    hydrationTarget,
    onAddWater,
    onRemoveWater,
}) => {
    const { t, i18n } = useTranslation();
    const {
        target,
        baseline,
        heatBonus,
        activityBonus,
        needsElectrolytes,
        weatherStatus,
        isLoadingWeather,
    } = hydrationTarget;

    // Unit conversion for display (User req: English -> oz)
    const isImperial = i18n.language.startsWith('en');
    const displayIntake = isImperial
        ? Math.round(currentIntake * 0.0338)
        : currentIntake;
    const displayTarget = isImperial ? Math.round(target * 0.0338) : target;
    const displayBaseline = isImperial ? Math.round(baseline * 0.0338) : baseline;
    const displayUnit = isImperial ? 'fl oz' : 'ml';

    const heatBonusDisplay = isImperial ? Math.round(heatBonus * 0.0338) : heatBonus;
    const activityBonusDisplay = isImperial
        ? Math.round(activityBonus * 0.0338)
        : activityBonus;

    const progress = Math.min((currentIntake / target) * 100, 100);
    const isOnTrack = currentIntake >= target * 0.8;

    const getCoachTip = () => {
        if (needsElectrolytes) {
            return t('dashboard.hydration.tips.electrolytes', {
                temp: weatherStatus?.temperature,
                amount: isImperial ? '28 fl oz' : 800, // Hardcoded in logic
            });
        }

        if (activityBonus > 0 && hydrationTarget.activityMinutes > 0) {
            return t('dashboard.hydration.tips.activity', {
                minutes: hydrationTarget.activityMinutes,
                amount: activityBonusDisplay + (isImperial ? ' fl oz' : 'ml'),
            });
        }

        if (heatBonus > 0) {
            return t('dashboard.hydration.tips.heat', {
                temp: weatherStatus?.temperature,
                amount: heatBonusDisplay + (isImperial ? ' fl oz' : 'ml'),
            });
        }

        return t('dashboard.hydration.tips.ideal');
    };

    const coachTip = getCoachTip();

    return (
        <div className="bg-gradient-to-br from-primary-soft to-info-soft p-5 rounded-card border border-info/20 shadow-card relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-info/30 rounded-full blur-3xl opacity-20 -mr-10 -mt-10" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-info rounded-control shadow-glow">
                        <Droplets size={18} className="text-white" />
                    </div>
                    <h3 className="font-bold text-text-primary">
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

            <div className="mb-4 relative z-10">
                <div className="flex items-end justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div>
                            <span className="text-3xl font-black text-text-primary tracking-tight">
                                {displayIntake}
                            </span>
                            <span className="text-lg text-text-tertiary ml-1 font-medium">
                                {displayUnit}
                            </span>
                        </div>

                        {/* Controls */}
                        {(onAddWater || onRemoveWater) && (
                            <div className="flex items-center gap-1 bg-surface rounded-control p-1 shadow-sm border border-info/20">
                                {onRemoveWater && (
                                    <button
                                        onClick={onRemoveWater}
                                        className="w-8 h-8 flex items-center justify-center rounded-md text-info/70 hover:bg-info-soft hover:text-info active:bg-info/20 transition-colors">
                                        -
                                    </button>
                                )}
                                <div className="w-px h-4 bg-surface-lighter mx-0.5" />
                                {onAddWater && (
                                    <button
                                        onClick={onAddWater}
                                        className="w-8 h-8 flex items-center justify-center rounded-md text-info hover:bg-info-soft active:bg-info/20 transition-colors">
                                        +
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                            {t('dashboard.activity.goal')}
                        </span>
                        <span className="text-lg font-bold text-info">
                            {displayTarget}
                            {displayUnit}
                        </span>
                    </div>
                </div>

                <div className="h-3 w-full bg-surface rounded-full overflow-hidden shadow-inner">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            isOnTrack
                                ? 'bg-gradient-to-r from-primary to-info'
                                : 'bg-info/50'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {(heatBonus > 0 || activityBonus > 0) && (
                    <div className="flex gap-2 mt-2 text-xs">
                        <span className="text-text-tertiary">Base: {baseline}ml</span>
                        {activityBonus > 0 && (
                            <>
                                <span className="text-text-tertiary">•</span>
                                <span className="text-warning flex items-center gap-1">
                                    <Zap size={12} />+{activityBonus}ml
                                </span>
                            </>
                        )}
                        {heatBonus > 0 && (
                            <>
                                <span className="text-text-tertiary">•</span>
                                <span className="text-danger flex items-center gap-1">
                                    <Flame size={12} />+{heatBonus}ml
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div
                className={`p-3 rounded-control ${needsElectrolytes ? 'bg-warning-soft border border-warning/30' : 'bg-surface border border-border'}`}>
                <p className="text-sm text-text-secondary leading-relaxed">{coachTip}</p>
            </div>
        </div>
    );
};

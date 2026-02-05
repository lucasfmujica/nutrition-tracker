import { useTranslation } from 'react-i18next';
import { Activity, AlertCircle, TrendingUp, Droplets } from 'lucide-react';
import { OuraAutoAdjustData } from '../../hooks/useOuraAutoAdjust';

interface OuraInsightCardProps {
    ouraData: OuraAutoAdjustData;
}

/**
 * OuraInsightCard - Mobile-optimized card showing Oura-based calorie adjustments
 *
 * Shows:
 * - Readiness score with color coding
 * - Calorie adjustment (+/-200 or 0)
 * - Smart hydration multiplier
 * - Recovery alerts
 *
 * Mobile-First Design:
 * - Touch-friendly (min 44x44px touch targets)
 * - Rounded corners (rounded-2xl)
 * - Clear typography (min 14px body, 12px labels)
 * - Color-coded by recovery level
 */
export const OuraInsightCard: React.FC<OuraInsightCardProps> = ({ ouraData }) => {
    const { t } = useTranslation();

    const {
        ouraCalorieBoost,
        ouraAlert,
        hydrationMultiplier,
        readinessScore,
    } = ouraData;

    // No readiness data available
    if (readinessScore === null) {
        return null;
    }

    // Determine color scheme based on readiness
    let bgColor = 'bg-blue-500/10'; // Normal (70-85)
    let textColor = 'text-blue-600';
    let borderColor = 'border-blue-500/20';
    let iconBg = 'bg-blue-500/20';

    if (readinessScore < 70) {
        bgColor = 'bg-red-500/10';
        textColor = 'text-red-600';
        borderColor = 'border-red-500/20';
        iconBg = 'bg-red-500/20';
    } else if (readinessScore > 85) {
        bgColor = 'bg-green-500/10';
        textColor = 'text-green-600';
        borderColor = 'border-green-500/20';
        iconBg = 'bg-green-500/20';
    }

    // Calculate hydration increase percentage
    const hydrationIncrease = Math.round((hydrationMultiplier - 1) * 100);

    return (
        <div
            className={`${bgColor} ${borderColor} border-2 rounded-2xl p-4 space-y-3 shadow-sm`}
        >
            {/* Header with icon and readiness */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`${iconBg} rounded-xl p-2.5`}>
                        <Activity className={`w-5 h-5 ${textColor}`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider">
                            {t('oura.title')}
                        </h3>
                        <p className="text-xs text-text-tertiary font-medium">
                            {t('oura.metrics.readiness')}: {readinessScore}
                        </p>
                    </div>
                </div>

                {/* Calorie Adjustment Badge */}
                {ouraCalorieBoost !== 0 && (
                    <div
                        className={`${textColor} font-black text-lg px-3 py-1 rounded-xl ${iconBg}`}
                    >
                        {ouraCalorieBoost > 0 ? '+' : ''}
                        {ouraCalorieBoost}
                    </div>
                )}
            </div>

            {/* Alert Message (if any) */}
            {ouraAlert && (
                <div className="flex items-start gap-2 p-3 bg-background/50 rounded-xl">
                    <AlertCircle className={`w-4 h-4 ${textColor} flex-shrink-0 mt-0.5`} />
                    <p className="text-sm font-semibold text-text-primary leading-tight">
                        {ouraAlert}
                    </p>
                </div>
            )}

            {/* Bottom Row: Adjustments */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                {/* Calorie Adjustment Info */}
                <div className="flex items-center gap-2 flex-1">
                    <TrendingUp className={`w-4 h-4 ${textColor}`} />
                    <div>
                        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">
                            {t('config.targets.calories')}
                        </p>
                        <p className={`text-sm font-black ${textColor}`}>
                            {ouraCalorieBoost > 0 && '+'}
                            {ouraCalorieBoost} kcal
                        </p>
                    </div>
                </div>

                {/* Hydration Multiplier Info */}
                {hydrationIncrease > 0 && (
                    <div className="flex items-center gap-2 flex-1">
                        <Droplets className={`w-4 h-4 ${textColor}`} />
                        <div>
                            <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">
                                {t('config.smartHydration.title')}
                            </p>
                            <p className={`text-sm font-black ${textColor}`}>
                                +{hydrationIncrease}%
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

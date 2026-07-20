import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';

/**
 * GoalInsightsCard - Strategic long-term progress visualization
 */
export const GoalInsightsCard: React.FC = () => {
    const {
        currentTrend,
        estimatedGoalDate,
        weeklyAdherence,
        remainingWeight,
        profile,
    } = useTracker() as any; // Cast as any for now until TrackerContext is fully typed
    const { t, i18n } = useTranslation();

    const STARTING_WEIGHT = 84.9; // kg - Initial weight
    const TARGET_WEIGHT = profile?.targetWeight || 75; // kg - Goal weight
    const TOTAL_JOURNEY = STARTING_WEIGHT - TARGET_WEIGHT;

    // Calculate progress percentage
    const progressPercentage = useMemo(() => {
        const currentWeight = profile?.currentWeight || STARTING_WEIGHT;
        const completed = STARTING_WEIGHT - currentWeight;
        return Math.min(Math.max((completed / TOTAL_JOURNEY) * 100, 0), 100);
    }, [profile?.currentWeight, TOTAL_JOURNEY]);

    // Format goal date in Argentina locale
    const formattedGoalDate = useMemo(() => {
        if (!estimatedGoalDate || estimatedGoalDate === 'Meta alcanzada! 🎉') {
            return estimatedGoalDate;
        }

        try {
            const date = new Date(estimatedGoalDate + 'T12:00:00');
            return new Intl.DateTimeFormat(i18n.language, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/Argentina/Buenos_Aires',
            }).format(date);
        } catch (err) {
            console.error('[GoalInsightsCard] Error formatting date:', err);
            return t('dashboard.insights.calculating');
        }
    }, [estimatedGoalDate, t, i18n.language]);

    // Edge case: Goal already reached
    if (remainingWeight !== null && remainingWeight <= 0) {
        return (
            <div className="bg-success-soft p-6 shadow-card rounded-card border border-success/20">
                <div className="text-center py-6">
                    <span className="text-6xl">🎉</span>
                    <h3 className="text-2xl font-bold text-success mt-4">
                        {t('dashboard.insights.goalReached')}
                    </h3>
                    <p className="text-sm text-success mt-2">
                        {t('dashboard.insights.congrats', { weight: TARGET_WEIGHT })}
                    </p>
                </div>
            </div>
        );
    }

    // Edge case: Insufficient data
    if (!estimatedGoalDate && !currentTrend) {
        return (
            <div className="bg-surface p-6 shadow-card rounded-card border border-border">
                <div className="text-center py-8">
                    <span className="text-5xl mb-4 block">📊</span>
                    <h3 className="text-lg font-semibold text-text-secondary">
                        {t('dashboard.insights.calculating')}
                    </h3>
                    <p className="text-sm text-text-tertiary mt-2">
                        {t('dashboard.insights.needData')}
                    </p>
                </div>
            </div>
        );
    }

    // Trend color and icon logic
    const getTrendDisplay = () => {
        if (currentTrend === null || currentTrend === undefined) {
            return {
                icon: '—',
                text: t('dashboard.insights.noDataTrend'),
                color: 'text-text-tertiary bg-surface-lighter border-border',
            };
        }

        if (currentTrend < 0) {
            return {
                icon: '↓',
                text: `${Math.abs(currentTrend).toFixed(1)} ${t('dashboard.predictive.units.kgPerWeek')}`,
                color: 'text-success bg-success-soft border-success/30',
            };
        } else if (currentTrend > 0) {
            return {
                icon: '↑',
                text: `${currentTrend.toFixed(1)} ${t('dashboard.predictive.units.kgPerWeek')}`,
                color: 'text-warning bg-warning-soft border-warning/30',
            };
        } else {
            return {
                icon: '→',
                text: t('dashboard.insights.maintain'),
                color: 'text-text-secondary bg-background border-border',
            };
        }
    };

    // Adherence color logic (traffic light system)
    const getAdherenceColor = () => {
        if (weeklyAdherence >= 80) {
            return 'text-success bg-success-soft border-success/30';
        } else if (weeklyAdherence >= 50) {
            return 'text-warning bg-warning-soft border-warning/30';
        } else {
            return 'text-danger bg-danger-soft border-danger/30';
        }
    };

    const trendDisplay = getTrendDisplay();
    const adherenceColor = getAdherenceColor();

    return (
        <div className="bg-surface p-6 shadow-card rounded-card border border-border relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-soft rounded-full -mr-16 -mt-16 opacity-40 pointer-events-none"></div>

            <div className="relative z-10">
                {/* Header */}
                <h2 className="text-text-tertiary text-xs font-semibold mb-4 uppercase tracking-wider">
                    {t('dashboard.insights.goalTarget', { weight: TARGET_WEIGHT })}
                </h2>

                {/* Hero: Estimated Goal Date */}
                <div className="mb-6">
                    <div className="text-3xl font-bold text-text-primary mb-1">
                        {formattedGoalDate || t('dashboard.insights.calculating')}
                    </div>
                    <p className="text-sm text-text-tertiary">
                        {t('dashboard.projection.estimatedDate')}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-text-secondary">
                            {STARTING_WEIGHT}kg
                        </span>
                        <span className="text-xs font-medium text-primary">
                            {progressPercentage.toFixed(0)}%
                        </span>
                        <span className="text-xs font-semibold text-text-secondary">
                            {TARGET_WEIGHT}kg
                        </span>
                    </div>

                    <div className="h-3 w-full bg-surface-lighter rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Secondary Metrics Row */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Trend Badge */}
                    <div
                        className={`rounded-control p-3 border ${trendDisplay.color} transition-colors`}>
                        <div className="text-2xl font-bold mb-0.5">
                            {trendDisplay.icon}
                        </div>
                        <div className="text-xs font-medium">
                            {trendDisplay.text}
                        </div>
                        <div className="text-xs opacity-70 mt-0.5">
                            {t('dashboard.insights.trend')}
                        </div>
                    </div>

                    {/* Adherence Badge */}
                    <div
                        className={`rounded-control p-3 border ${adherenceColor} transition-colors`}>
                        <div className="text-2xl font-bold mb-0.5">
                            {weeklyAdherence}%
                        </div>
                        <div className="text-xs font-medium">
                            {t('dashboard.insights.weekly')}
                        </div>
                        <div className="text-xs opacity-70 mt-0.5">
                            {t('dashboard.insights.adherence')}
                        </div>
                    </div>

                    {/* Remaining Weight Badge */}
                    <div className="rounded-control p-3 border bg-primary-soft text-primary border-primary/20 transition-colors">
                        <div className="text-2xl font-bold mb-0.5">
                            {remainingWeight?.toFixed(1) || '—'}
                        </div>
                        <div className="text-xs font-medium">
                            {t('units.kg', { defaultValue: 'kg' })}
                        </div>
                        <div className="text-xs opacity-70 mt-0.5">
                            {t('dashboard.insights.remaining')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

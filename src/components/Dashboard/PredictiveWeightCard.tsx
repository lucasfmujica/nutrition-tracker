import {
    Activity,
    Calendar,
    Info,
    Target,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeightProjectionChart } from '../Charts/WeightProjectionChart';

interface PathPoint {
    date: string;
    actualWeight?: number;
    projectedWeight?: number;
}

interface CoachMessage {
    emoji: string;
    text: string;
}

interface ProjectionMessage {
    title: string;
    subtitle: string;
}

interface PredictiveWeightCardProps {
    formattedGoalDate: string | null;
    projectionMessage?: ProjectionMessage | null;
    realistTrend: number | null;
    adjustedTrend: number | null;
    adherencePercent: number;
    remainingWeight: number;
    weeksToGoal: string | number | null;
    projectionStatus: 'goal_reached' | 'not_losing' | 'on_track' | undefined;
    actualPath: any[]; // Matches WeightProjectionChart expectations
    projectedPath: any[];
    targetWeight: number;
    coachMessage?: CoachMessage | null;
    goal?: 'cut' | 'maintain' | 'bulk'; // Goal type for context-aware messaging
}

/**
 * MessageCard - Collapsed state for PredictiveWeightCard.
 * Used whenever there is no real projection to show yet, instead of
 * rendering a chart / adherence bar / trend grid full of placeholders.
 */
const MessageCard: React.FC<{ title: string; subtitle: string }> = ({
    title,
    subtitle,
}) => (
    <div className="bg-surface rounded-card p-8 border border-border shadow-card relative overflow-hidden group">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 bg-background rounded-control flex items-center justify-center mb-6 border border-border">
                <Activity className="w-8 h-8 text-primary opacity-50" />
            </div>
            <h3 className="text-text-primary font-satoshi text-3xl tracking-tight uppercase mb-2">
                {title}
            </h3>
            <p className="text-text-tertiary text-sm font-medium max-w-[220px] leading-relaxed">
                {subtitle}
            </p>
        </div>
    </div>
);

/**
 * PredictiveWeightCard - The Predictive Weight Engine UI
 * Revamped for "High-Performance Lab" aesthetic
 */
export const PredictiveWeightCard: React.FC<PredictiveWeightCardProps> = React.memo(
    ({
        formattedGoalDate,
        projectionMessage,
        realistTrend,
        adjustedTrend,
        adherencePercent,
        remainingWeight,
        weeksToGoal,
        projectionStatus,
        actualPath,
        projectedPath,
        targetWeight,
        coachMessage,
        goal = 'cut',
    }) => {
        const { t } = useTranslation();
        const [showAdherenceTooltip, setShowAdherenceTooltip] = useState(false);
        const isGainingGoal = goal === 'bulk';
        // Loading / insufficient data state
        if (
            projectionStatus === undefined ||
            (!actualPath?.length && projectionStatus !== 'goal_reached')
        ) {
            return (
                <MessageCard
                    title={t('dashboard.predictive.emptyState.title')}
                    subtitle={t('dashboard.predictive.emptyState.subtitle')}
                />
            );
        }

        // No projection to show yet (needs more data / wrong trend / maintain
        // mode). Collapse to the reason instead of rendering a chart, an
        // adherence bar and a trend grid full of placeholders.
        if (projectionMessage) {
            return (
                <MessageCard
                    title={projectionMessage.title}
                    subtitle={projectionMessage.subtitle}
                />
            );
        }

        // Goal reached celebration
        if (projectionStatus === 'goal_reached') {
            return (
                <div className="bg-gradient-to-br from-accent to-success rounded-card p-1 shadow-glow">
                    <div className="bg-surface/90 backdrop-blur-xl rounded-card p-8 text-center border border-white/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                        <span className="text-6xl mb-6 block drop-shadow-lg">
                            🏆
                        </span>
                        <h3 className="text-4xl font-satoshi text-text-primary leading-tight mb-2 tracking-tight">
                            {t('dashboard.predictive.goalReached.title')}
                        </h3>
                        <p className="text-accent text-lg font-bold uppercase tracking-widest">
                            {t('dashboard.predictive.goalReached.subtitle', {
                                weight: targetWeight,
                            })}
                        </p>
                    </div>
                </div>
            );
        }

        // Trend display logic - GOAL-AWARE
        const getTrendDisplay = () => {
            if (adjustedTrend === null || adjustedTrend === undefined) {
                return {
                    icon: Target,
                    text: '—',
                    color: 'text-text-tertiary',
                    bg: 'bg-background',
                    label: t('dashboard.predictive.status.stable'),
                };
            }

            if (isGainingGoal) {
                // BULK MODE: Positive trend is good (green), negative is bad (red)
                if (adjustedTrend > 0) {
                    return {
                        icon: TrendingUp,
                        text: `+${adjustedTrend.toFixed(1)}`,
                        color: 'text-accent',
                        bg: 'bg-accent/10',
                        label: t('dashboard.predictive.status.gaining'),
                    };
                }
                return {
                    icon: TrendingDown,
                    text: `${adjustedTrend.toFixed(1)}`,
                    color: 'text-fat',
                    bg: 'bg-fat/10',
                    label: t('dashboard.predictive.status.losing'),
                };
            } else {
                // CUT MODE: Negative trend is good (green), positive is bad (red)
                if (adjustedTrend < 0) {
                    return {
                        icon: TrendingDown,
                        text: `${Math.abs(adjustedTrend).toFixed(1)}`,
                        color: 'text-accent',
                        bg: 'bg-accent/10',
                        label: t('dashboard.predictive.status.burning'),
                    };
                }
                return {
                    icon: TrendingUp,
                    text: `+${adjustedTrend.toFixed(1)}`,
                    color: 'text-fat',
                    bg: 'bg-fat/10',
                    label: t('dashboard.predictive.status.gaining'),
                };
            }
        };

        // Adherence color (traffic light)
        const getAdherenceConfig = () => {
            if (adherencePercent >= 85)
                return {
                    color: 'text-accent',
                    bg: 'bg-accent/10',
                    bar: 'bg-accent',
                    label: t('dashboard.predictive.adherence.optimal'),
                };
            if (adherencePercent >= 70)
                return {
                    color: 'text-primary',
                    bg: 'bg-primary/10',
                    bar: 'bg-primary',
                    label: t('dashboard.predictive.adherence.stable'),
                };
            if (adherencePercent >= 50)
                return {
                    color: 'text-carbs',
                    bg: 'bg-carbs/10',
                    bar: 'bg-carbs',
                    label: t('dashboard.predictive.adherence.inconsistent'),
                };
            return {
                color: 'text-fat',
                bg: 'bg-fat/10',
                bar: 'bg-fat',
                label: t('dashboard.predictive.adherence.critical'),
            };
        };

        const trend = getTrendDisplay();
        const adherence = getAdherenceConfig();
        const TrendIcon = trend.icon;

        return (
            <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden group relative transition-all duration-500 hover:border-primary/10">
                {/* Background Texture */}
                <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

                {/* Animated Scanning Line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[scan_4s_linear_infinite] z-20" />

                {/* Header / Engine Status */}
                <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-control bg-primary/10 flex items-center justify-center shadow-sm border border-primary/5 group-hover:scale-110 transition-transform duration-500">
                                <Activity className="w-6 h-6 text-primary animate-pulse" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-text-primary font-satoshi text-xl sm:text-2xl tracking-tight leading-none mb-1 truncate">
                                    {t('dashboard.predictive.labels.engine')}
                                </h3>
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] shrink-0" />
                                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] truncate">
                                        {t(
                                            'dashboard.predictive.labels.activeAnalysis',
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2 group cursor-default">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow" />
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                    {t('dashboard.predictive.labels.currentWeight')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <span className="w-2.5 h-2.5 rounded-full border-2 border-accent" />
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                    {t('dashboard.predictive.labels.goal')} (
                                    {targetWeight}
                                    {t('units.kg', { defaultValue: 'KG' })})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Section: The Goal Date */}
                    <div className="relative mb-6 sm:mb-8 p-5 sm:p-6 rounded-card bg-background border border-border overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] truncate">
                                {t('dashboard.predictive.labels.projection')}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-3xl sm:text-5xl font-satoshi text-text-primary tracking-tight group-hover:text-primary transition-colors duration-500 truncate">
                                {formattedGoalDate?.toUpperCase()}
                            </p>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-xl sm:text-2xl font-satoshi text-accent leading-none whitespace-nowrap">
                                    {weeksToGoal}{' '}
                                    {t('units.weeks', { defaultValue: 'sem' })}
                                </span>
                                <span className="text-[9px] font-bold text-text-tertiary uppercase truncate">
                                    {t('dashboard.predictive.labels.estimated')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Adherence Bar */}
                <div className="px-8 mb-6 relative z-10">
                    <div className="flex justify-between items-end mb-2.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">
                                {t('dashboard.predictive.labels.systemAdherence')}
                            </span>
                            <button
                                onClick={() =>
                                    setShowAdherenceTooltip(!showAdherenceTooltip)
                                }
                                className="w-4 h-4 rounded-full bg-surface-lighter hover:bg-surface-lighter flex items-center justify-center transition-colors group relative">
                                <Info
                                    size={10}
                                    className="text-text-tertiary group-hover:text-text-secondary"
                                />
                            </button>
                        </div>
                        <span
                            className={`text-[10px] font-black uppercase tracking-widest ${adherence.color} px-2 py-0.5 rounded-md ${adherence.bg} border border-border`}>
                            {adherence.label} • {adherencePercent}%
                        </span>
                    </div>

                    {/* Adherence Tooltip */}
                    {showAdherenceTooltip && (
                        <div className="mb-3 p-4 bg-primary-soft border border-primary/20 rounded-control text-xs">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-text-primary uppercase tracking-wide text-[10px]">
                                    {t('dashboard.predictive.tooltip.title')}
                                </h4>
                                <button
                                    onClick={() => setShowAdherenceTooltip(false)}
                                    className="text-primary/60 hover:text-primary transition-colors">
                                    ×
                                </button>
                            </div>
                            <p className="text-text-secondary mb-3">
                                {t('dashboard.predictive.tooltip.intro')}
                            </p>
                            <div className="space-y-2 mb-3">
                                <div className="flex items-start gap-2">
                                    <span className="text-primary font-bold">
                                        1.
                                    </span>
                                    <div>
                                        <span className="font-bold text-text-primary">
                                            {t(
                                                'dashboard.predictive.tooltip.calories',
                                            )}
                                        </span>
                                        <span className="text-text-secondary">
                                            {' '}
                                            {t(
                                                'dashboard.predictive.tooltip.caloriesDesc',
                                            )}{' '}
                                            (
                                            {goal === 'cut'
                                                ? '-40% a +10%'
                                                : goal === 'bulk'
                                                  ? '-10% a +50%'
                                                  : '±15%'}
                                            )
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-primary font-bold">
                                        2.
                                    </span>
                                    <div>
                                        <span className="font-bold text-text-primary">
                                            {t(
                                                'dashboard.predictive.tooltip.protein',
                                            )}
                                        </span>
                                        <span className="text-text-secondary">
                                            {' '}
                                            {t(
                                                'dashboard.predictive.tooltip.proteinDesc',
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-primary font-bold">
                                        3.
                                    </span>
                                    <div>
                                        <span className="font-bold text-text-primary">
                                            {t('dashboard.predictive.tooltip.steps')}
                                        </span>
                                        <span className="text-text-secondary">
                                            {' '}
                                            {t(
                                                'dashboard.predictive.tooltip.stepsDesc',
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-text-primary font-bold text-[11px]">
                                {t('dashboard.predictive.tooltip.score')}
                            </p>
                            <p className="text-text-secondary mt-2 text-[10px]">
                                {t('dashboard.predictive.tooltip.tip')}
                            </p>
                        </div>
                    )}

                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border relative">
                        <div
                            className={`h-full ${adherence.bar} transition-all duration-[2000ms] ease-out shadow-sm relative overflow-hidden`}
                            style={{ width: `${adherencePercent}%` }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="px-4 mb-4 relative z-10">
                    <div className="bg-background/50 rounded-card py-4 border border-border backdrop-blur-sm">
                        <WeightProjectionChart
                            actualPath={actualPath}
                            projectedPath={projectedPath}
                            targetWeight={targetWeight}
                            height={140}
                        />
                    </div>
                </div>

                {/* Intelligence Grid */}
                <div className="px-5 sm:px-8 py-5 sm:py-6 grid grid-cols-2 gap-3 sm:gap-4 relative z-10 border-t border-border bg-background/20">
                    {/* Trend Module */}
                    <div
                        className={`rounded-control p-4 sm:p-5 ${trend.bg} border border-border shadow-sm flex flex-col justify-between transition-all duration-300 hover:border-border hover:-translate-y-1 min-w-0`}>
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em] truncate">
                                {t('dashboard.predictive.labels.trendVector')}
                            </span>
                            <TrendIcon
                                className={`w-4 h-4 ${trend.color} shrink-0`}
                            />
                        </div>
                        <div className="flex items-baseline gap-1 overflow-hidden">
                            <span
                                className={`text-xl sm:text-4xl font-satoshi ${trend.color} leading-none truncate`}>
                                {trend.text}
                            </span>
                            <span className="text-[9px] font-bold text-text-tertiary uppercase shrink-0">
                                {t('dashboard.predictive.units.kgPerWeek')}
                            </span>
                        </div>
                    </div>

                    {/* Remaining Module */}
                    <div className="rounded-control p-4 sm:p-5 bg-surface border border-border shadow-sm flex flex-col justify-between transition-all duration-300 hover:border-primary/20 hover:-translate-y-1 min-w-0">
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em] truncate">
                                {isGainingGoal
                                    ? t('dashboard.predictive.labels.toGain')
                                    : t('dashboard.predictive.labels.toLose')}
                            </span>
                            <Target className="w-4 h-4 text-primary opacity-60 shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1 overflow-hidden">
                            <span className="text-xl sm:text-4xl font-satoshi text-text-primary leading-none truncate">
                                {remainingWeight?.toFixed(1) || '—'}
                            </span>
                            <span className="text-[9px] font-bold text-primary uppercase whitespace-nowrap shrink-0">
                                {t('dashboard.predictive.units.kgPending')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Styles for custom animations if not in tailwind config */}
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(500px); opacity: 0; }
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `,
                    }}
                />
            </div>
        );
    },
);

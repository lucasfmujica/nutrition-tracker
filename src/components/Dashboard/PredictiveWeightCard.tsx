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

interface PredictiveWeightCardProps {
    formattedGoalDate: string | null;
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
 * PredictiveWeightCard - The Predictive Weight Engine UI
 * Revamped for "High-Performance Lab" aesthetic
 */
export const PredictiveWeightCard: React.FC<PredictiveWeightCardProps> = React.memo(
    ({
        formattedGoalDate,
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
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 animate-pulse border border-slate-100">
                            <Activity className="w-8 h-8 text-primary opacity-50" />
                        </div>
                        <h3 className="text-slate-900 font-satoshi text-3xl tracking-tight uppercase mb-2">
                            {t('dashboard.predictive.calibrating.title')}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium max-w-[220px] leading-relaxed">
                            {t('dashboard.predictive.calibrating.subtitle')}
                        </p>
                    </div>
                </div>
            );
        }

        // Goal reached celebration
        if (projectionStatus === 'goal_reached') {
            return (
                <div className="bg-gradient-to-br from-accent to-emerald-600 rounded-[2.5rem] p-1 shadow-xl shadow-accent/20">
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2.3rem] p-8 text-center border border-white/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                        <span className="text-6xl mb-6 block drop-shadow-lg">
                            🏆
                        </span>
                        <h3 className="text-4xl font-satoshi text-slate-900 leading-tight mb-2 tracking-tight">
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
                    color: 'text-slate-300',
                    bg: 'bg-slate-50',
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
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group relative transition-all duration-500 hover:border-primary/10">
                {/* Background Texture */}
                <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

                {/* Animated Scanning Line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[scan_4s_linear_infinite] z-20" />

                {/* Header / Engine Status */}
                <div className="px-8 pt-8 pb-4 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm border border-primary/5 group-hover:scale-110 transition-transform duration-500">
                                <Activity className="w-6 h-6 text-primary animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-slate-900 font-satoshi text-xl sm:text-2xl tracking-tight leading-none mb-1">
                                    {t('dashboard.predictive.labels.engine')}
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                                        {t(
                                            'dashboard.predictive.labels.activeAnalysis',
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2 group cursor-default">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,102,238,0.2)]" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {t('dashboard.predictive.labels.currentWeight')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <span className="w-2.5 h-2.5 rounded-full border-2 border-accent" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {t('dashboard.predictive.labels.goal')} (
                                    {targetWeight}
                                    {t('units.kg', { defaultValue: 'KG' })})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Section: The Goal Date */}
                    <div className="relative mb-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {t('dashboard.predictive.labels.projection')}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-3xl sm:text-5xl font-satoshi text-slate-900 tracking-tight group-hover:text-primary transition-colors duration-500">
                                {formattedGoalDate?.toUpperCase() ||
                                    t('dashboard.predictive.labels.calculating')}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xl sm:text-2xl font-satoshi text-accent leading-none">
                                    {weeksToGoal}{' '}
                                    {t('units.weeks', { defaultValue: 'sem' })}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
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
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {t('dashboard.predictive.labels.systemAdherence')}
                            </span>
                            <button
                                onClick={() =>
                                    setShowAdherenceTooltip(!showAdherenceTooltip)
                                }
                                className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors group relative">
                                <Info
                                    size={10}
                                    className="text-slate-500 group-hover:text-slate-700"
                                />
                            </button>
                        </div>
                        <span
                            className={`text-[10px] font-black uppercase tracking-widest ${adherence.color} px-2 py-0.5 rounded-md ${adherence.bg} border border-slate-100`}>
                            {adherence.label} • {adherencePercent}%
                        </span>
                    </div>

                    {/* Adherence Tooltip */}
                    {showAdherenceTooltip && (
                        <div className="mb-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-blue-900 uppercase tracking-wide text-[10px]">
                                    {t('dashboard.predictive.tooltip.title')}
                                </h4>
                                <button
                                    onClick={() => setShowAdherenceTooltip(false)}
                                    className="text-blue-400 hover:text-blue-600 transition-colors">
                                    ×
                                </button>
                            </div>
                            <p className="text-blue-800 mb-3">
                                {t('dashboard.predictive.tooltip.intro')}
                            </p>
                            <div className="space-y-2 mb-3">
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">
                                        1.
                                    </span>
                                    <div>
                                        <span className="font-bold text-blue-900">
                                            {t(
                                                'dashboard.predictive.tooltip.calories',
                                            )}
                                        </span>
                                        <span className="text-blue-700">
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
                                    <span className="text-blue-600 font-bold">
                                        2.
                                    </span>
                                    <div>
                                        <span className="font-bold text-blue-900">
                                            {t(
                                                'dashboard.predictive.tooltip.protein',
                                            )}
                                        </span>
                                        <span className="text-blue-700">
                                            {' '}
                                            {t(
                                                'dashboard.predictive.tooltip.proteinDesc',
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">
                                        3.
                                    </span>
                                    <div>
                                        <span className="font-bold text-blue-900">
                                            {t('dashboard.predictive.tooltip.steps')}
                                        </span>
                                        <span className="text-blue-700">
                                            {' '}
                                            {t(
                                                'dashboard.predictive.tooltip.stepsDesc',
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-blue-800 font-bold text-[11px]">
                                {t('dashboard.predictive.tooltip.score')}
                            </p>
                            <p className="text-blue-700 mt-2 text-[10px]">
                                {t('dashboard.predictive.tooltip.tip')}
                            </p>
                        </div>
                    )}

                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative">
                        <div
                            className={`h-full ${adherence.bar} transition-all duration-[2000ms] ease-out shadow-sm relative overflow-hidden`}
                            style={{ width: `${adherencePercent}%` }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="px-4 mb-4 relative z-10">
                    <div className="bg-slate-50/50 rounded-[1.8rem] py-4 border border-slate-100 backdrop-blur-sm">
                        <WeightProjectionChart
                            actualPath={actualPath}
                            projectedPath={projectedPath}
                            targetWeight={targetWeight}
                            height={140}
                        />
                    </div>
                </div>

                {/* Intelligence Grid */}
                <div className="px-8 py-6 grid grid-cols-2 gap-4 relative z-10 border-t border-slate-100 bg-slate-50/20">
                    {/* Trend Module */}
                    <div
                        className={`rounded-2xl p-5 ${trend.bg} border border-slate-100 shadow-sm flex flex-col justify-between transition-all duration-300 hover:border-slate-200 hover:-translate-y-1`}>
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {t('dashboard.predictive.labels.trendVector')}
                            </span>
                            <TrendIcon className={`w-4 h-4 ${trend.color}`} />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span
                                className={`text-2xl sm:text-4xl font-satoshi ${trend.color} leading-none`}>
                                {trend.text}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                {t('dashboard.predictive.units.kgPerWeek')}
                            </span>
                        </div>
                    </div>

                    {/* Remaining Module */}
                    <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex flex-col justify-between transition-all duration-300 hover:border-primary/20 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {isGainingGoal
                                    ? t('dashboard.predictive.labels.toGain')
                                    : t('dashboard.predictive.labels.toLose')}
                            </span>
                            <Target className="w-4 h-4 text-primary opacity-60" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-4xl font-satoshi text-slate-900 leading-none">
                                {remainingWeight?.toFixed(1) || '—'}
                            </span>
                            <span className="text-[9px] font-bold text-primary uppercase whitespace-nowrap">
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

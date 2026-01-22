import { Activity, Calendar, Target, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';
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
}

/**
 * PredictiveWeightCard - The Predictive Weight Engine UI
 */
export const PredictiveWeightCard: React.FC<PredictiveWeightCardProps> = ({
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
}) => {
    // Loading / insufficient data state
    if (
        projectionStatus === undefined ||
        (!actualPath?.length && projectionStatus !== 'goal_reached')
    ) {
        return (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                        <Activity className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-black text-lg">
                        Calibrando Motor Predictivo
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 max-w-[200px]">
                        Necesitamos algunos registros más para proyectar tu futuro
                    </p>
                </div>
            </div>
        );
    }

    // Goal reached celebration
    if (projectionStatus === 'goal_reached') {
        return (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-1 shadow-xl shadow-emerald-200">
                <div className="bg-white/10 backdrop-blur-sm rounded-[22px] p-6 text-center border border-white/20">
                    <span className="text-5xl mb-4 block drop-shadow-lg">🏆</span>
                    <h3 className="text-2xl font-black text-white leading-tight">
                        ¡META ALCANZADA!
                    </h3>
                    <p className="text-emerald-50 text-sm mt-2 font-medium opacity-90">
                        Has conquistado tu objetivo de{' '}
                        <span className="font-black underline underline-offset-4">
                            {targetWeight} kg
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    // Trend display logic
    const getTrendDisplay = () => {
        if (adjustedTrend === null || adjustedTrend === undefined) {
            return {
                icon: Target,
                text: '—',
                color: 'text-slate-400',
                bg: 'bg-slate-50',
                label: 'Estable',
            };
        }
        if (adjustedTrend < 0) {
            return {
                icon: TrendingDown,
                text: `${Math.abs(adjustedTrend).toFixed(1)}`,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                label: 'Perdiendo',
            };
        }
        return {
            icon: TrendingUp,
            text: `+${adjustedTrend.toFixed(1)}`,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            label: 'Ganando',
        };
    };

    // Adherence color (traffic light)
    const getAdherenceConfig = () => {
        if (adherencePercent >= 85)
            return {
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                bar: 'bg-emerald-500',
                label: 'Excelente',
            };
        if (adherencePercent >= 70)
            return {
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                bar: 'bg-blue-500',
                label: 'Buena',
            };
        if (adherencePercent >= 50)
            return {
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                bar: 'bg-amber-500',
                label: 'Regular',
            };
        return {
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            bar: 'bg-rose-500',
            label: 'Baja',
        };
    };

    const trend = getTrendDisplay();
    const adherence = getAdherenceConfig();
    const TrendIcon = trend.icon;

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/60">
            {/* Header / Engine Status */}
            <div className="px-6 pt-6 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Activity className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-slate-900 font-black text-sm tracking-tight leading-none mb-1">
                                LUKEN ENGINE
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Predictive Analysis Engine
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1.5 group cursor-default">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                Peso Actual
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 group cursor-default">
                            <span className="w-1.5 h-1.5 rounded-full border border-emerald-500 group-hover:scale-125 transition-transform" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                Meta ({targetWeight}kg)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hero Section: The Goal Date */}
                <div className="relative mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Fecha Estimada de Llegada ({targetWeight}kg)
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                            {formattedGoalDate || 'Proyectando...'}
                        </p>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                            {weeksToGoal} sem
                        </span>
                    </div>
                </div>
            </div>

            {/* Visual Adherence Bar */}
            <div className="px-6 mb-4">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Adherencia al Plan
                    </span>
                    <span
                        className={`text-[10px] font-black uppercase tracking-widest ${adherence.color}`}>
                        {adherence.label} ({adherencePercent}%)
                    </span>
                </div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                    <div
                        className={`h-full ${adherence.bar} transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                        style={{ width: `${adherencePercent}%` }}
                    />
                </div>
            </div>

            {/* Chart Area */}
            <div className="px-2 mb-2">
                <div className="bg-slate-50/50 rounded-2xl py-2">
                    <WeightProjectionChart
                        actualPath={actualPath}
                        projectedPath={projectedPath}
                        targetWeight={targetWeight}
                        height={120}
                    />
                </div>
            </div>

            {/* Intelligence Grid */}
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
                {/* Trend Module */}
                <div
                    className={`rounded-2xl p-4 ${trend.bg} border border-white shadow-sm flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Tendencia
                        </span>
                        <TrendIcon className={`w-3 h-3 ${trend.color}`} />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${trend.color}`}>
                            {trend.text}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                            kg/sem
                        </span>
                    </div>
                </div>

                {/* Remaining Module */}
                <div className="rounded-2xl p-4 bg-indigo-50/50 border border-indigo-100/50 shadow-sm flex flex-col justify-between transition-transform hover:scale-[1.02]">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Restante
                        </span>
                        <Target className="w-3 h-3 text-indigo-400" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-600">
                            {remainingWeight?.toFixed(1) || '—'}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 underline decoration-indigo-200 decoration-2 underline-offset-2">
                            kg para meta
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

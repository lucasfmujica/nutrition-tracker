import { Dumbbell, Flame, Scale, Trophy } from 'lucide-react';
import React from 'react';
import { LeaderboardEntry, LeaderboardMetric } from '../../types/domain';
import { EmptyState } from './EmptyState';
import { LeaderboardRow } from './LeaderboardRow';

interface LeaderboardCardProps {
    leaderboard: LeaderboardEntry[];
    metric: LeaderboardMetric;
    onMetricChange: (metric: LeaderboardMetric) => void;
    loading?: boolean;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
    leaderboard,
    metric,
    onMetricChange,
    loading = false,
}) => {
    const metrics: { id: LeaderboardMetric; label: string; icon: typeof Flame }[] = [
        { id: 'streak', label: 'Racha', icon: Flame },
        { id: 'workouts', label: 'Entrenos', icon: Dumbbell },
        { id: 'weight', label: 'Peso', icon: Scale },
    ];

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            {/* Premium decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-100/50 flex items-center justify-center border border-amber-100">
                    <Trophy size={20} className="text-amber-500" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 text-lg">Ranking</h2>
                    <p className="text-xs text-slate-500 font-medium">Esta semana</p>
                </div>
            </div>

            {/* Metric Tabs */}
            <div className="grid grid-cols-3 gap-1.5 mb-5 bg-slate-50 rounded-xl p-1.5 border border-slate-100">
                {metrics.map(({ id, label, icon: Icon }) => {
                    const isActive = metric === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onMetricChange(id)}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-lg transition-all duration-300 ${
                                isActive
                                    ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                            }`}>
                            <Icon
                                size={18}
                                className={`transition-colors ${
                                    isActive
                                        ? 'text-primary fill-primary/10'
                                        : 'text-slate-400'
                                }`}
                            />
                            <span
                                className={`text-[10px] sm:text-sm font-bold transition-colors leading-none ${
                                    isActive ? 'text-primary' : 'text-slate-500'
                                }`}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Leaderboard List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-pulse border border-slate-100/50">
                            <div className="w-8 h-8 rounded-full bg-slate-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-24" />
                                <div className="h-3 bg-slate-200 rounded w-16" />
                            </div>
                            <div className="h-6 w-12 bg-slate-200 rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : leaderboard.length === 0 ? (
                <EmptyState
                    icon={Trophy}
                    title="Sin datos"
                    description="Agrega amigos para ver el ranking"
                />
            ) : (
                <div className="space-y-1">
                    {leaderboard.slice(0, 10).map((entry, index) => (
                        <LeaderboardRow
                            key={entry.userId}
                            entry={entry}
                            metric={metric}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

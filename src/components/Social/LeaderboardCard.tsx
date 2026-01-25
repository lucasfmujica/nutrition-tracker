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
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Trophy size={20} className="text-amber-500" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900">Leaderboard</h2>
                    <p className="text-xs text-slate-500">Esta semana</p>
                </div>
            </div>

            {/* Metric Tabs */}
            <div className="flex gap-2 mb-4 bg-slate-100 rounded-xl p-1">
                {metrics.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => onMetricChange(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                            metric === id
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}>
                        <Icon size={16} />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* Leaderboard List */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : leaderboard.length === 0 ? (
                <EmptyState
                    icon={Trophy}
                    title="Sin datos"
                    description="Agrega amigos para ver el leaderboard"
                />
            ) : (
                <div className="space-y-2">
                    {leaderboard.slice(0, 10).map((entry) => (
                        <LeaderboardRow key={entry.userId} entry={entry} metric={metric} />
                    ))}
                </div>
            )}
        </div>
    );
};

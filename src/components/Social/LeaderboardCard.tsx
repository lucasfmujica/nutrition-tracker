import { Dumbbell, Flame, Scale, TrendingDown, Trophy } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

    const metrics: { id: LeaderboardMetric; label: string; icon: typeof Flame }[] = [
        { id: 'streak', label: t('social.leaderboard.metrics.streak'), icon: Flame },
        {
            id: 'workouts',
            label: t('social.leaderboard.metrics.workouts'),
            icon: Dumbbell,
        },
        { id: 'weight', label: t('social.leaderboard.metrics.weight'), icon: Scale },
        {
            id: 'deficit',
            label: t('social.leaderboard.metrics.deficit'),
            icon: TrendingDown,
        },
    ];

    return (
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm relative overflow-hidden">
            {/* Premium decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-warning-soft rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-warning-soft flex items-center justify-center border border-warning/20">
                    <Trophy size={20} className="text-warning" />
                </div>
                <div>
                    <h2 className="font-bold text-text-primary text-lg">
                        {t('social.leaderboard.title')}
                    </h2>
                    <p className="text-xs text-text-tertiary font-medium">
                        {t('social.leaderboard.subtitle')}
                    </p>
                </div>
            </div>

            {/* Metric Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-5 bg-background rounded-xl p-1.5 border border-border">
                {metrics.map(({ id, label, icon: Icon }) => {
                    const isActive = metric === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onMetricChange(id)}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-lg transition-all duration-300 ${
                                isActive
                                    ? 'bg-surface text-primary shadow-sm ring-1 ring-black/5'
                                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-lighter/50'
                            }`}>
                            <Icon
                                size={18}
                                className={`transition-colors ${
                                    isActive
                                        ? 'text-primary fill-primary/10'
                                        : 'text-text-tertiary'
                                }`}
                            />
                            <span
                                className={`text-[10px] sm:text-sm font-bold transition-colors leading-none ${
                                    isActive ? 'text-primary' : 'text-text-tertiary'
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
                            className="flex items-center gap-3 p-3 rounded-xl bg-background animate-pulse border border-border/50">
                            <div className="w-8 h-8 rounded-full bg-surface-lighter" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-surface-lighter rounded w-24" />
                                <div className="h-3 bg-surface-lighter rounded w-16" />
                            </div>
                            <div className="h-6 w-12 bg-surface-lighter rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : leaderboard.length === 0 ? (
                <EmptyState
                    icon={Trophy}
                    title={t('social.leaderboard.noData')}
                    description={t('social.leaderboard.noDataDesc')}
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

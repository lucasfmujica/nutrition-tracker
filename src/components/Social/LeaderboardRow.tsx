import React from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry, LeaderboardMetric } from '../../types/domain';

import { UserAvatar } from './UserAvatar';

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
    metric: LeaderboardMetric;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, metric }) => {
    const { t, i18n } = useTranslation();

    const getRankDisplay = (rank: number) => {
        if (rank === 1)
            return { emoji: '🥇', bg: 'bg-amber-50', text: 'text-amber-600' };
        if (rank === 2)
            return { emoji: '🥈', bg: 'bg-surface-lighter', text: 'text-text-tertiary' };
        if (rank === 3)
            return { emoji: '🥉', bg: 'bg-orange-50', text: 'text-orange-500' };
        return { emoji: `${rank}`, bg: 'bg-background', text: 'text-text-tertiary' };
    };

    const formatValue = (value: number, metric: LeaderboardMetric): string => {
        switch (metric) {
            case 'streak':
                return `${value} ${t('units.days', { count: value })}`;
            case 'workouts':
                return `${value} ${t('units.workouts', { count: value })}`;
            case 'weight':
                const sign = value < 0 ? '' : '+';
                return `${sign}${value.toFixed(1)} kg`;
            case 'deficit':
                const deficitSign = value > 0 ? '-' : '+';
                return `${deficitSign}${Math.abs(value).toFixed(0)} kcal`;
            default:
                return String(value);
        }
    };

    const rankStyle = getRankDisplay(entry.rank);
    const isTopThree = entry.rank <= 3;

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                entry.isCurrentUser
                    ? 'bg-primary/5 border border-primary/20'
                    : 'hover:bg-background'
            }`}>
            {/* Rank */}
            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${rankStyle.bg} ${rankStyle.text} ${
                    isTopThree ? 'text-xl' : 'text-sm'
                }`}>
                {rankStyle.emoji}
            </div>

            {/* Avatar */}
            <UserAvatar
                src={entry.avatar}
                name={entry.name}
                className="w-10 h-10"
                textSize="text-sm"
            />

            {/* Name */}
            <div className="flex-1 min-w-0">
                <p
                    className={`font-bold truncate ${
                        entry.isCurrentUser ? 'text-primary' : 'text-text-primary'
                    }`}>
                    {entry.name}
                    {entry.isCurrentUser && (
                        <span className="text-xs font-medium text-primary/60 ml-2">
                            {t('social.leaderboard.you')}
                        </span>
                    )}
                </p>
            </div>

            {/* Value */}
            <div
                className={`text-right font-black ${
                    metric === 'weight'
                        ? entry.value < 0
                            ? 'text-green-600'
                            : entry.value > 0
                              ? 'text-red-500'
                              : 'text-text-tertiary'
                        : metric === 'deficit'
                          ? entry.value > 0
                              ? 'text-green-600' // Déficit positivo (comió menos)
                              : entry.value < 0
                                ? 'text-red-500' // Superávit (comió más)
                                : 'text-text-tertiary'
                          : 'text-text-secondary'
                }`}>
                {formatValue(entry.value, metric)}
            </div>
        </div>
    );
};

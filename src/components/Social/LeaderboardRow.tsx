import React from 'react';
import { LeaderboardEntry, LeaderboardMetric } from '../../types/domain';

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
    metric: LeaderboardMetric;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, metric }) => {
    const getRankDisplay = (rank: number) => {
        if (rank === 1) return { emoji: '🥇', bg: 'bg-amber-50', text: 'text-amber-600' };
        if (rank === 2) return { emoji: '🥈', bg: 'bg-slate-100', text: 'text-slate-500' };
        if (rank === 3) return { emoji: '🥉', bg: 'bg-orange-50', text: 'text-orange-500' };
        return { emoji: `${rank}`, bg: 'bg-slate-50', text: 'text-slate-400' };
    };

    const formatValue = (value: number, metric: LeaderboardMetric): string => {
        switch (metric) {
            case 'streak':
                return `${value} días`;
            case 'workouts':
                return `${value} entrenos`;
            case 'weight':
                const sign = value < 0 ? '' : '+';
                return `${sign}${value.toFixed(1)} kg`;
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
                    : 'hover:bg-slate-50'
            }`}>
            {/* Rank */}
            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${rankStyle.bg} ${rankStyle.text} ${
                    isTopThree ? 'text-xl' : 'text-sm'
                }`}>
                {rankStyle.emoji}
            </div>

            {/* Avatar */}
            {entry.avatar ? (
                <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/80 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {entry.name.charAt(0).toUpperCase()}
                </div>
            )}

            {/* Name */}
            <div className="flex-1 min-w-0">
                <p
                    className={`font-bold truncate ${
                        entry.isCurrentUser ? 'text-primary' : 'text-slate-900'
                    }`}>
                    {entry.name}
                    {entry.isCurrentUser && (
                        <span className="text-xs font-medium text-primary/60 ml-2">
                            (Tú)
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
                              : 'text-slate-400'
                        : 'text-slate-700'
                }`}>
                {formatValue(entry.value, metric)}
            </div>
        </div>
    );
};

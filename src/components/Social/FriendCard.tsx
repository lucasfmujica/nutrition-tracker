import {
    ChevronDown,
    ChevronUp,
    Dumbbell,
    Flame,
    Scale,
    Trash2,
    TrendingDown,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Friend } from '../../types/domain';

import { UserAvatar } from './UserAvatar';

interface FriendCardProps {
    friend: Friend;
    onRemove: (friendshipId: string) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, onRemove }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const formatWeightDelta = (delta: number | null | undefined): string => {
        if (delta === null || delta === undefined) return 'N/A';
        const sign = delta < 0 ? '' : '+';
        return `${sign}${delta.toFixed(1)} kg`;
    };

    const getWeightDeltaColor = (delta: number | null | undefined): string => {
        if (delta === null || delta === undefined) return 'text-text-tertiary';
        if (delta < 0) return 'text-success';
        if (delta > 0) return 'text-danger';
        return 'text-text-tertiary';
    };

    const formatAvgDeficit = (deficit: number | null | undefined): string => {
        if (deficit === null || deficit === undefined) return 'N/A';
        const sign = deficit > 0 ? '-' : '+';
        return `${sign}${Math.abs(deficit).toFixed(0)} kcal`;
    };

    const getDeficitColor = (deficit: number | null | undefined): string => {
        if (deficit === null || deficit === undefined) return 'text-text-tertiary';
        if (deficit > 0) return 'text-success'; // Déficit = comió menos (bueno)
        if (deficit < 0) return 'text-danger'; // Superávit = comió más (malo)
        return 'text-text-tertiary';
    };

    const handleRemove = () => {
        if (showConfirm) {
            onRemove(friend.id);
            setShowConfirm(false);
        } else {
            setShowConfirm(true);
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all">
            {/* Main Row */}
            <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-background transition-colors"
                onClick={() => setExpanded(!expanded)}>
                {/* Avatar */}
                <UserAvatar
                    src={friend.avatar}
                    name={friend.name}
                    className="w-12 h-12"
                    textSize="text-lg"
                />

                {/* Name & Stats Preview */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-primary truncate">
                        {friend.name}
                    </p>
                    <p className="text-xs text-text-tertiary">
                        {friend.weeklyStats ? (
                            <span
                                className={getWeightDeltaColor(
                                    friend.weeklyStats.weightDelta,
                                )}>
                                {formatWeightDelta(friend.weeklyStats.weightDelta)}{' '}
                                {t('social.leaderboard.subtitle').toLowerCase()}
                            </span>
                        ) : (
                            t('social.leaderboard.noData')
                        )}
                    </p>
                </div>

                {/* Expand Toggle */}
                <div className="text-text-tertiary">
                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                    {friend.weeklyStats ? (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* Weight Delta */}
                            <div className="bg-background rounded-lg p-3 text-center">
                                <Scale
                                    size={16}
                                    className="mx-auto mb-1 text-text-tertiary"
                                />
                                <p
                                    className={`font-black text-sm ${getWeightDeltaColor(friend.weeklyStats.weightDelta)}`}>
                                    {formatWeightDelta(
                                        friend.weeklyStats.weightDelta,
                                    )}
                                </p>
                                <p className="text-[10px] text-text-tertiary uppercase">
                                    {t('social.leaderboard.metrics.weight')}
                                </p>
                            </div>

                            {/* Workouts */}
                            <div className="bg-background rounded-lg p-3 text-center">
                                <Dumbbell
                                    size={16}
                                    className="mx-auto mb-1 text-text-tertiary"
                                />
                                <p className="font-black text-sm text-text-secondary">
                                    {friend.weeklyStats.workoutCount}
                                </p>
                                <p className="text-[10px] text-text-tertiary uppercase">
                                    {t('social.leaderboard.metrics.workouts')}
                                </p>
                            </div>

                            {/* Streak */}
                            <div className="bg-background rounded-lg p-3 text-center">
                                <Flame
                                    size={16}
                                    className="mx-auto mb-1 text-text-tertiary"
                                />
                                <p className="font-black text-sm text-fat">
                                    {friend.weeklyStats.consistencyStreak}
                                </p>
                                <p className="text-[10px] text-text-tertiary uppercase">
                                    {t('social.leaderboard.metrics.streak')}
                                </p>
                            </div>

                            {/* Avg Deficit */}
                            <div className="bg-background rounded-lg p-3 text-center">
                                <TrendingDown
                                    size={16}
                                    className="mx-auto mb-1 text-text-tertiary"
                                />
                                <p
                                    className={`font-black text-sm ${getDeficitColor(friend.weeklyStats.avgDeficit)}`}>
                                    {formatAvgDeficit(friend.weeklyStats.avgDeficit)}
                                </p>
                                <p className="text-[10px] text-text-tertiary uppercase">
                                    {t('social.leaderboard.metrics.deficit')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-text-tertiary text-center py-4">
                            {t('social.leaderboard.noData')}
                        </p>
                    )}

                    {/* Remove Friend Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                            showConfirm
                                ? 'bg-danger text-white'
                                : 'bg-surface-lighter text-text-tertiary hover:bg-danger-soft hover:text-danger'
                        }`}>
                        <Trash2 size={16} />
                        {showConfirm
                            ? t('social.friends.confirmRemove')
                            : t('social.friends.remove')}
                    </button>
                </div>
            )}
        </div>
    );
};

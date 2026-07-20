import { Dumbbell, Flag, Flame, Scale, UserPlus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityItem as ActivityItemType, ActivityType } from '../../types/domain';

import { BadgeActivity } from './BadgeActivity';
import { UserAvatar } from './UserAvatar';

interface ActivityItemProps {
    activity: ActivityItemType;
    onToggleReaction?: (activityId: string) => void;
    onClick?: (activity: ActivityItemType) => void;
}

export const ActivityItemComponent: React.FC<ActivityItemProps> = ({
    activity,
    onToggleReaction,
    onClick,
}) => {
    const { t, i18n } = useTranslation();

    // Check if activity should be rendered as a badge
    const isBadge = ['streak_achieved', 'goal_reached', 'weight_milestone'].includes(
        activity.activityType,
    );

    if (isBadge) {
        return (
            <BadgeActivity activity={activity} onToggleReaction={onToggleReaction} />
        );
    }

    const getActivityConfig = (type: ActivityType) => {
        switch (type) {
            case 'workout_logged':
                return {
                    icon: Dumbbell,
                    bg: 'bg-oura-soft',
                    iconColor: 'text-oura',
                    verb: t('social.activity.workout_logged'),
                };
            case 'weight_milestone':
                return {
                    icon: Scale,
                    bg: 'bg-success-soft',
                    iconColor: 'text-success',
                    verb: t('social.activity.weight_milestone'),
                };
            case 'streak_achieved':
                return {
                    icon: Flame,
                    bg: 'bg-fat-soft',
                    iconColor: 'text-fat',
                    verb: t('social.activity.streak_achieved'),
                };
            case 'goal_reached':
                return {
                    icon: Flag,
                    bg: 'bg-primary-soft',
                    iconColor: 'text-primary',
                    verb: t('social.activity.goal_reached'),
                };
            case 'friend_added':
                return {
                    icon: UserPlus,
                    bg: 'bg-danger-soft',
                    iconColor: 'text-danger',
                    verb: t('social.activity.friend_added'),
                };
            default:
                return {
                    icon: Flame,
                    bg: 'bg-background',
                    iconColor: 'text-text-tertiary',
                    verb: t('social.activity.default'),
                };
        }
    };

    const formatRelativeTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return t('social.activity.now');
        if (diffMins < 60) return t('social.activity.ago', { time: `${diffMins}m` });
        if (diffHours < 24)
            return t('social.activity.ago', { time: `${diffHours}h` });
        if (diffDays < 7) return t('social.activity.ago', { time: `${diffDays}d` });
        return date.toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'short',
        });
    };

    const getDetailText = (activity: ActivityItemType): string | null => {
        const { metadata, activityType } = activity;
        if (!metadata) return null;

        switch (activityType) {
            case 'workout_logged':
                return metadata.workoutName || metadata.type || null;
            case 'weight_milestone':
                return metadata.milestone ? `${metadata.milestone} kg` : null;
            case 'streak_achieved':
                return metadata.days
                    ? `${metadata.days} ${t('progress.comparison.days')}`
                    : null;
            case 'goal_reached':
                return metadata.goalType || null;
            default:
                return null;
        }
    };

    const config = getActivityConfig(activity.activityType);
    const Icon = config.icon;
    const detailText = getDetailText(activity);

    const reactionCount = activity.reactionCount || 0;
    const hasReacted = activity.hasReacted || false;

    const isClickable = onClick && activity.activityType === 'workout_logged';

    return (
        <div
            onClick={() => isClickable && onClick(activity)}
            className={`flex items-start gap-3 py-3 border-b border-border last:border-0 transition-colors ${
                isClickable
                    ? 'cursor-pointer hover:bg-background/50 active:bg-background'
                    : ''
            }`}>
            {/* Activity Icon */}
            <div
                className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={config.iconColor} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary">
                    <span className="font-bold text-text-primary">
                        {activity.userName}
                    </span>{' '}
                    {config.verb}
                    {detailText && (
                        <span className="font-semibold text-text-secondary">
                            {' '}
                            - {detailText}
                        </span>
                    )}
                </p>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-text-tertiary">
                        {formatRelativeTime(activity.createdAt)}
                    </p>
                    {/* Reaction Button */}
                    {onToggleReaction && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleReaction(activity.id);
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                hasReacted
                                    ? 'bg-fat-soft text-fat hover:bg-fat-soft'
                                    : 'bg-background text-text-tertiary hover:bg-surface-lighter hover:text-fat'
                            }`}>
                            <Flame
                                size={14}
                                className={hasReacted ? 'fill-orange-500' : ''}
                            />
                            {reactionCount > 0 && <span>{reactionCount}</span>}
                        </button>
                    )}
                </div>
            </div>

            {/* Avatar */}
            <UserAvatar
                src={activity.userAvatar}
                name={activity.userName}
                className="w-8 h-8 flex-shrink-0"
                textSize="text-xs"
            />
        </div>
    );
};

import { Dumbbell, Flag, Flame, Scale, UserPlus } from 'lucide-react';
import React from 'react';
import { ActivityItem as ActivityItemType, ActivityType } from '../../types/domain';

interface ActivityItemProps {
    activity: ActivityItemType;
}

export const ActivityItemComponent: React.FC<ActivityItemProps> = ({ activity }) => {
    const getActivityConfig = (type: ActivityType) => {
        switch (type) {
            case 'workout_logged':
                return {
                    icon: Dumbbell,
                    bg: 'bg-purple-50',
                    iconColor: 'text-purple-500',
                    verb: 'registró un entreno',
                };
            case 'weight_milestone':
                return {
                    icon: Scale,
                    bg: 'bg-green-50',
                    iconColor: 'text-green-500',
                    verb: 'alcanzó un hito de peso',
                };
            case 'streak_achieved':
                return {
                    icon: Flame,
                    bg: 'bg-orange-50',
                    iconColor: 'text-orange-500',
                    verb: 'logró una racha',
                };
            case 'goal_reached':
                return {
                    icon: Flag,
                    bg: 'bg-blue-50',
                    iconColor: 'text-blue-500',
                    verb: 'alcanzó su meta',
                };
            case 'friend_added':
                return {
                    icon: UserPlus,
                    bg: 'bg-pink-50',
                    iconColor: 'text-pink-500',
                    verb: 'agregó un amigo',
                };
            default:
                return {
                    icon: Flame,
                    bg: 'bg-slate-50',
                    iconColor: 'text-slate-500',
                    verb: 'actividad',
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

        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `hace ${diffMins}m`;
        if (diffHours < 24) return `hace ${diffHours}h`;
        if (diffDays < 7) return `hace ${diffDays}d`;
        return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
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
                return metadata.days ? `${metadata.days} días` : null;
            case 'goal_reached':
                return metadata.goalType || null;
            default:
                return null;
        }
    };

    const config = getActivityConfig(activity.activityType);
    const Icon = config.icon;
    const detailText = getDetailText(activity);

    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
            {/* Activity Icon */}
            <div
                className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={config.iconColor} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                    <span className="font-bold text-slate-900">{activity.userName}</span>{' '}
                    {config.verb}
                    {detailText && (
                        <span className="font-semibold text-slate-600"> - {detailText}</span>
                    )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                    {formatRelativeTime(activity.createdAt)}
                </p>
            </div>

            {/* Avatar */}
            {activity.userAvatar ? (
                <img
                    src={activity.userAvatar}
                    alt={activity.userName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/80 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {activity.userName.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    );
};

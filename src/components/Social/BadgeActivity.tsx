import { Award, Crown, Flame, Medal, Star, Trophy } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityItem } from '../../types/domain';
import { UserAvatar } from './UserAvatar';

interface BadgeActivityProps {
    activity: ActivityItem;
    onToggleReaction?: (activityId: string) => void;
}

export const BadgeActivity: React.FC<BadgeActivityProps> = ({
    activity,
    onToggleReaction,
}) => {
    const { t } = useTranslation();
    const { activityType, metadata, userName, userAvatar } = activity;

    // Determine badge style based on activity type
    const getBadgeConfig = () => {
        switch (activityType) {
            case 'streak_achieved':
                return {
                    icon: Flame,
                    gradient: 'from-orange-400 to-red-500',
                    shadow: 'shadow-float',
                    title: t('social.badges.streakTitle'),
                    subtitle: t('social.badges.streakSubtitle', {
                        count: metadata.days,
                    }),
                    textColor: 'text-fat',
                    borderColor: 'border-fat/20',
                    bg: 'bg-fat-soft',
                };
            case 'goal_reached':
                return {
                    icon: Trophy,
                    gradient: 'from-yellow-400 to-amber-500',
                    shadow: 'shadow-float',
                    title: t('social.badges.goalTitle'),
                    subtitle: metadata.goalType || t('social.badges.goalSubtitle'),
                    textColor: 'text-warning',
                    borderColor: 'border-warning/20',
                    bg: 'bg-warning-soft',
                };
            case 'weight_milestone':
                return {
                    icon: Medal,
                    gradient: 'from-blue-400 to-indigo-500',
                    shadow: 'shadow-float',
                    title: t('social.badges.milestoneTitle'),
                    subtitle: t('social.badges.milestoneSubtitle', {
                        weight: metadata.milestone,
                    }),
                    textColor: 'text-primary',
                    borderColor: 'border-primary/20',
                    bg: 'bg-primary-soft',
                };
            default:
                return {
                    icon: Star,
                    gradient: 'from-purple-400 to-pink-500',
                    shadow: 'shadow-float',
                    title: t('social.badges.achievementTitle'),
                    subtitle: t('social.badges.achievementSubtitle'),
                    textColor: 'text-oura',
                    borderColor: 'border-oura/20',
                    bg: 'bg-oura-soft',
                };
        }
    };

    const config = getBadgeConfig();
    const Icon = config.icon;
    const hasReacted = activity.hasReacted || false;
    const reactionCount = activity.reactionCount || 0;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl ${config.bg} border ${config.borderColor} p-4 mb-3`}>
            {/* Decorative Background Elements */}
            <div
                className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 blur-2xl pointer-events-none`}
            />
            <div
                className={`absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-gradient-to-tr ${config.gradient} opacity-10 blur-2xl pointer-events-none`}
            />

            {/* Header with Avatar and Badge Icon */}
            <div className="flex items-center justify-between mb-3 relative z-10">
                <UserAvatar
                    src={userAvatar}
                    name={userName}
                    className="w-8 h-8 ring-2 ring-white shadow-sm"
                    textSize="text-[10px]"
                />

                <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg transform rotate-12`}>
                    <Crown size={14} className="text-white fill-white/20" />
                </div>
            </div>

            {/* Content */}
            <div className="text-center relative z-10 py-1">
                <div
                    className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg ${config.shadow} flex items-center justify-center transform hover:scale-105 transition-transform duration-300`}>
                    <Icon size={28} className="text-white" strokeWidth={2.5} />
                </div>

                <h3
                    className={`font-black uppercase tracking-tight text-lg leading-tight ${config.textColor}`}>
                    {config.title}
                </h3>
                <p
                    className={`text-xs font-bold opacity-70 mt-1 ${config.textColor}`}>
                    {config.subtitle}
                </p>
                <p className="text-[10px] text-text-tertiary font-medium mt-3 uppercase tracking-widest">
                    {userName}
                </p>
            </div>

            {/* Actions */}
            {onToggleReaction && (
                <div className="absolute bottom-3 right-3 z-20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleReaction(activity.id);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm border ${
                            hasReacted
                                ? 'bg-surface text-fat border-fat/20 ring-2 ring-fat/10'
                                : 'bg-surface/80 hover:bg-surface text-text-tertiary border-white/50 hover:text-fat'
                        }`}>
                        <Flame
                            size={12}
                            className={hasReacted ? 'fill-fat text-fat' : ''}
                        />
                        {reactionCount > 0 && <span>{reactionCount}</span>}
                    </button>
                </div>
            )}
        </div>
    );
};

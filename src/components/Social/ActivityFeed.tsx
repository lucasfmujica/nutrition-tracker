import { Activity, Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityItem as ActivityItemType } from '../../types/domain';
import { ActivityItemComponent } from './ActivityItem';
import { EmptyState } from './EmptyState';

interface ActivityFeedProps {
    activities: ActivityItemType[];
    loading?: boolean;
    onToggleReaction?: (activityId: string) => void;
    onActivityClick?: (activity: ActivityItemType) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    activities,
    loading = false,
    onToggleReaction,
    onActivityClick,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <Sparkles size={20} className="text-indigo-500" />
                </div>
                <div>
                    <h2 className="font-bold text-text-primary text-lg">
                        {t('social.feed.title')}
                    </h2>
                    <p className="text-xs text-text-tertiary font-medium">
                        {t('social.feed.subtitle')}
                    </p>
                </div>
            </div>

            {/* Feed */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 py-2 animate-pulse">
                            <div className="w-10 h-10 rounded-xl bg-surface-lighter" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-surface-lighter rounded w-3/4" />
                                <div className="h-3 bg-surface-lighter rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : activities.length === 0 ? (
                <EmptyState
                    icon={Activity}
                    title={t('social.feed.noActivity')}
                    description={t('social.feed.noActivityDesc')}
                />
            ) : (
                <div className="max-h-96 overflow-y-auto -mx-2 px-2 space-y-1 custom-scrollbar">
                    {activities.map((activity) => (
                        <ActivityItemComponent
                            key={activity.id}
                            activity={activity}
                            onToggleReaction={onToggleReaction}
                            onClick={onActivityClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

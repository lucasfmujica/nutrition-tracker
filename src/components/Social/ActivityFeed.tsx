import { Activity, Sparkles } from 'lucide-react';
import React from 'react';
import { ActivityItem as ActivityItemType } from '../../types/domain';
import { ActivityItemComponent } from './ActivityItem';
import { EmptyState } from './EmptyState';

interface ActivityFeedProps {
    activities: ActivityItemType[];
    loading?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    activities,
    loading = false,
}) => {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Sparkles size={20} className="text-indigo-500" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900">Actividad</h2>
                    <p className="text-xs text-slate-500">Últimos 7 días</p>
                </div>
            </div>

            {/* Feed */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : activities.length === 0 ? (
                <EmptyState
                    icon={Activity}
                    title="Sin actividad reciente"
                    description="Cuando tú o tus amigos registren actividades, aparecerán aquí"
                />
            ) : (
                <div className="max-h-80 overflow-y-auto -mx-1 px-1">
                    {activities.map((activity) => (
                        <ActivityItemComponent key={activity.id} activity={activity} />
                    ))}
                </div>
            )}
        </div>
    );
};

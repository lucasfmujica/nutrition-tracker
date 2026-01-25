import { ChevronDown, ChevronUp, RefreshCw, UserPlus, Users } from 'lucide-react';
import React, { useState } from 'react';
import {
    ActivityItem,
    Friend,
    FriendRequest,
    LeaderboardEntry,
    LeaderboardMetric,
} from '../../types/domain';
import { ActivityFeed } from '../Social/ActivityFeed';
import { AddFriendModal } from '../Social/AddFriendModal';
import { FriendRequestCard } from '../Social/FriendRequestCard';
import { FriendsList } from '../Social/FriendsList';
import { LeaderboardCard } from '../Social/LeaderboardCard';

interface SocialTabProps {
    // Data
    friends: Friend[];
    friendRequests: FriendRequest[];
    activityFeed: ActivityItem[];
    leaderboard: LeaderboardEntry[];
    userFriendCode: string | null;

    // Loading states
    socialLoading: boolean;

    // Leaderboard
    leaderboardMetric: LeaderboardMetric;
    onLeaderboardMetricChange: (metric: LeaderboardMetric) => void;

    // Modal
    showAddFriendModal: boolean;
    onShowAddFriendModal: (show: boolean) => void;

    // Actions
    onSendFriendRequest: (code: string) => Promise<{ success: boolean; error?: string }>;
    onAcceptFriendRequest: (id: string) => void;
    onRejectFriendRequest: (id: string) => void;
    onRemoveFriend: (id: string) => void;
    onRefresh: () => void;
}

export const SocialTab: React.FC<SocialTabProps> = ({
    friends,
    friendRequests,
    activityFeed,
    leaderboard,
    userFriendCode,
    socialLoading,
    leaderboardMetric,
    onLeaderboardMetricChange,
    showAddFriendModal,
    onShowAddFriendModal,
    onSendFriendRequest,
    onAcceptFriendRequest,
    onRejectFriendRequest,
    onRemoveFriend,
    onRefresh,
}) => {
    const [requestsExpanded, setRequestsExpanded] = useState(true);

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users size={28} className="text-primary" />
                        Crew
                    </h1>
                    <p className="text-sm text-gray-500">Conecta con amigos</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={socialLoading}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95 disabled:opacity-50">
                        <RefreshCw
                            size={18}
                            className={socialLoading ? 'animate-spin' : ''}
                        />
                    </button>
                    <button
                        onClick={() => onShowAddFriendModal(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95">
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">Agregar</span>
                    </button>
                </div>
            </div>

            {/* Friend Requests Section */}
            {friendRequests.length > 0 && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100 overflow-hidden">
                    <button
                        onClick={() => setRequestsExpanded(!requestsExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-pink-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                                <UserPlus size={20} className="text-pink-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900">
                                    Solicitudes de Amistad
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {friendRequests.length}{' '}
                                    {friendRequests.length === 1
                                        ? 'solicitud pendiente'
                                        : 'solicitudes pendientes'}
                                </p>
                            </div>
                        </div>
                        <div className="text-slate-400">
                            {requestsExpanded ? (
                                <ChevronUp size={20} />
                            ) : (
                                <ChevronDown size={20} />
                            )}
                        </div>
                    </button>

                    {requestsExpanded && (
                        <div className="px-4 pb-4 space-y-2">
                            {friendRequests.map((request) => (
                                <FriendRequestCard
                                    key={request.id}
                                    request={request}
                                    onAccept={onAcceptFriendRequest}
                                    onReject={onRejectFriendRequest}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Leaderboard */}
            <LeaderboardCard
                leaderboard={leaderboard}
                metric={leaderboardMetric}
                onMetricChange={onLeaderboardMetricChange}
                loading={socialLoading}
            />

            {/* Activity Feed */}
            <ActivityFeed activities={activityFeed} loading={socialLoading} />

            {/* Friends List */}
            <FriendsList
                friends={friends}
                onRemoveFriend={onRemoveFriend}
                onAddFriend={() => onShowAddFriendModal(true)}
                loading={socialLoading}
            />

            {/* Add Friend Modal */}
            <AddFriendModal
                isOpen={showAddFriendModal}
                onClose={() => onShowAddFriendModal(false)}
                userFriendCode={userFriendCode}
                onSendRequest={onSendFriendRequest}
            />
        </div>
    );
};

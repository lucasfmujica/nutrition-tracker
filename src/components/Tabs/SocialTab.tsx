import { ChevronDown, ChevronUp, RefreshCw, UserPlus, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityItem,
    Challenge,
    Friend,
    FriendRequest,
    LeaderboardEntry,
    LeaderboardMetric,
    SocialGroup,
} from '../../types/domain';
import { ActivityFeed } from '../Social/ActivityFeed';
import { AddFriendModal } from '../Social/AddFriendModal';
import { ChallengesSection } from '../Social/ChallengesSection';
import { FriendRequestCard } from '../Social/FriendRequestCard';
import { FriendsList } from '../Social/FriendsList';
import { LeaderboardCard } from '../Social/LeaderboardCard';
import { WorkoutDetailModal } from '../Social/WorkoutDetailModal';

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
    onSendFriendRequest: (
        code: string,
    ) => Promise<{ success: boolean; error?: string }>;
    onAcceptFriendRequest: (id: string) => void;
    onRejectFriendRequest: (id: string) => void;
    onRemoveFriend: (id: string) => void;
    onRefresh: () => void;
    onToggleReaction: (activityId: string) => void;
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
    onToggleReaction,
}) => {
    const { t } = useTranslation();
    const [requestsExpanded, setRequestsExpanded] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
        null,
    );
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');

    // Mock Groups Data
    const groups: SocialGroup[] = [
        {
            id: 'all',
            name: t('social.groups.all'),
            description: '',
            members: [],
            isPrivate: false,
        },
        {
            id: 'g1',
            name: 'Gym Rats',
            description: 'Hardcore lifters',
            members: [],
            isPrivate: true,
        },
        {
            id: 'g2',
            name: 'Run Club',
            description: 'Weekend runners',
            members: [],
            isPrivate: false,
        },
        {
            id: 'g3',
            name: 'Healthy Eats',
            description: 'Food sharing',
            members: [],
            isPrivate: true,
        },
    ];

    // Filter content based on group (Mock logic)
    const filteredFeed =
        selectedGroupId === 'all'
            ? activityFeed
            : activityFeed.filter((_, i) => i % 2 === 0); // content filtering simulation

    const filteredLeaderboard =
        selectedGroupId === 'all' ? leaderboard : leaderboard.slice(0, 3); // content filtering simulation

    // Mock Challenges Data
    const challenges: Challenge[] = [
        {
            id: 'c1',
            title: 'Summer Shred 2024',
            description: 'Get ready for summer with this 30-day challenge',
            type: 'workout_frequency',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            target: 20,
            unit: 'workouts',
            status: 'active',
            participants: [
                { userId: '1', name: 'Alex', avatar: null, progress: 12 },
                { userId: '2', name: 'Sarah', avatar: null, progress: 15 },
                { userId: '3', name: 'Mike', avatar: null, progress: 8 },
                { userId: '4', name: 'Emma', avatar: null, progress: 18 },
                { userId: '5', name: 'Chris', avatar: null, progress: 5 },
            ],
            image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80',
        },
        {
            id: 'c2',
            title: '100k Steps Week',
            description: 'Hit 100,000 steps in 7 days',
            type: 'step_count',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            target: 100000,
            unit: 'steps',
            status: 'active',
            participants: [
                { userId: '1', name: 'Alex', avatar: null, progress: 45000 },
                { userId: '2', name: 'Sarah', avatar: null, progress: 52000 },
            ],
            image: 'https://images.unsplash.com/photo-1552674605-469523170d9e?w=500&q=80',
        },
    ];

    return (
        <div className="w-full space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users size={28} className="text-primary" />
                        {t('social.title')}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        {t('social.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        disabled={socialLoading}
                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all active:scale-95 disabled:opacity-50 ring-1 ring-slate-100">
                        <RefreshCw
                            size={18}
                            className={socialLoading ? 'animate-spin' : ''}
                        />
                    </button>
                    <button
                        onClick={() => onShowAddFriendModal(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95">
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">
                            {t('social.invite')}
                        </span>
                    </button>
                </div>
            </div>

            {/* Group Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 -mx-1 hide-scrollbar snap-x">
                {groups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`
                            whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all snap-start
                            ${
                                selectedGroupId === group.id
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }
                        `}>
                        {group.name}
                    </button>
                ))}
            </div>

            {/* Friend Requests Section */}
            {friendRequests.length > 0 && (
                <div className="bg-rose-50/50 rounded-2xl border border-rose-100 overflow-hidden transition-all duration-300">
                    <button
                        onClick={() => setRequestsExpanded(!requestsExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-rose-500">
                                <UserPlus size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900">
                                    {t('social.friends.requests')}
                                </h3>
                                <p className="text-xs text-rose-600 font-medium">
                                    {friendRequests.length}{' '}
                                    {t('social.friends.pending', {
                                        count: friendRequests.length,
                                    })}
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

            {/* Challenges Section */}
            <ChallengesSection
                challenges={challenges}
                onJoinChallenge={(id) => console.log('Join challenge', id)}
                onViewChallengeDetails={(id) => console.log('View challenge', id)}
            />

            {/* Leaderboard */}
            <LeaderboardCard
                leaderboard={filteredLeaderboard}
                metric={leaderboardMetric}
                onMetricChange={onLeaderboardMetricChange}
                loading={socialLoading}
            />

            {/* Activity Feed */}
            <ActivityFeed
                activities={filteredFeed}
                loading={socialLoading}
                onToggleReaction={onToggleReaction}
                onActivityClick={setSelectedActivity}
            />

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

            {/* Workout Detail Modal */}
            <WorkoutDetailModal
                isOpen={!!selectedActivity}
                onClose={() => setSelectedActivity(null)}
                activity={selectedActivity}
            />
        </div>
    );
};

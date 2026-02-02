import { useCallback, useEffect, useState } from 'react';
import { triggerFriendAddedActivity } from '../services/activityTriggerService';
import {
    ActivityItem,
    Friend,
    FriendRequest,
    LeaderboardEntry,
    LeaderboardMetric,
} from '../types/domain';
import { useSocialData } from './supabase/useSocialData';

interface UseSocialProps {
    supabase: {
        user: { id: string } | null;
        isOnline: boolean;
        isAuthenticated: boolean;
    };
    useCloud: boolean;
}

export interface UseSocialReturn {
    // State
    friends: Friend[];
    friendRequests: FriendRequest[];
    activityFeed: ActivityItem[];
    leaderboard: LeaderboardEntry[];
    userFriendCode: string | null;

    // Loading states
    socialLoading: boolean;
    friendsLoading: boolean;
    feedLoading: boolean;

    // Error state
    socialError: string | null;

    // Current leaderboard metric
    leaderboardMetric: LeaderboardMetric;
    setLeaderboardMetric: (metric: LeaderboardMetric) => void;

    // Modal states
    showAddFriendModal: boolean;
    setShowAddFriendModal: (show: boolean) => void;

    // Actions
    sendFriendRequest: (
        code: string,
    ) => Promise<{ success: boolean; error?: string }>;
    acceptFriendRequest: (id: string) => Promise<void>;
    rejectFriendRequest: (id: string) => Promise<void>;
    removeFriend: (id: string) => Promise<void>;
    refreshSocial: () => Promise<void>;
    refreshLeaderboard: (metric?: LeaderboardMetric) => Promise<void>;
    toggleReaction: (activityId: string) => Promise<void>;

    // Request count for badges
    pendingRequestCount: number;
}

export function useSocial({ supabase, useCloud }: UseSocialProps): UseSocialReturn {
    // State
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userFriendCode, setUserFriendCode] = useState<string | null>(null);

    // Loading states
    const [socialLoading, setSocialLoading] = useState(false);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [feedLoading, setFeedLoading] = useState(false);

    // Error state
    const [socialError, setSocialError] = useState<string | null>(null);

    // Leaderboard metric
    const [leaderboardMetric, setLeaderboardMetric] =
        useState<LeaderboardMetric>('streak');

    // Modal states
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);

    // Data layer hook
    const socialData = useSocialData(supabase.user as any, supabase.isOnline);

    /**
     * Refresh all social data
     */
    const refreshSocial = useCallback(async () => {
        if (!useCloud || !supabase.isAuthenticated) return;

        setSocialLoading(true);
        setSocialError(null);

        try {
            const [
                fetchedFriends,
                fetchedRequests,
                fetchedFeed,
                fetchedLeaderboard,
                fetchedCode,
            ] = await Promise.all([
                socialData.fetchFriends(),
                socialData.fetchFriendRequests(),
                socialData.fetchActivityFeed(),
                socialData.fetchLeaderboard(leaderboardMetric),
                socialData.fetchUserFriendCode(),
            ]);

            setFriends(fetchedFriends);
            setFriendRequests(fetchedRequests);
            setActivityFeed(fetchedFeed);
            setLeaderboard(fetchedLeaderboard);
            setUserFriendCode(fetchedCode);

            console.log('[useSocial] refreshSocial complete:', {
                friendsCount: fetchedFriends.length,
                requestsCount: fetchedRequests.length,
                feedCount: fetchedFeed.length,
                leaderboardCount: fetchedLeaderboard.length,
                userFriendCode: fetchedCode,
            });
        } catch (err: any) {
            console.error('[useSocial] refreshSocial failed:', err);
            setSocialError('Error al cargar datos sociales');
        } finally {
            setSocialLoading(false);
        }
    }, [useCloud, supabase.isAuthenticated, socialData, leaderboardMetric]);

    /**
     * Refresh just the leaderboard with a new metric
     */
    const refreshLeaderboard = useCallback(
        async (metric?: LeaderboardMetric) => {
            if (!useCloud) return;

            const targetMetric = metric || leaderboardMetric;
            if (metric) {
                setLeaderboardMetric(metric);
            }

            try {
                const fetchedLeaderboard =
                    await socialData.fetchLeaderboard(targetMetric);
                setLeaderboard(fetchedLeaderboard);
            } catch (err) {
                console.error('[useSocial] refreshLeaderboard failed:', err);
            }
        },
        [useCloud, leaderboardMetric, socialData],
    );

    /**
     * Send friend request with optimistic updates
     */
    const sendFriendRequest = useCallback(
        async (code: string) => {
            setSocialError(null);
            const result = await socialData.sendFriendRequest(code);

            if (!result.success && result.error) {
                setSocialError(result.error);
            }

            // Refresh friends list after sending
            if (result.success) {
                setShowAddFriendModal(false);
            }

            return result;
        },
        [socialData],
    );

    /**
     * Accept friend request with optimistic update
     */
    const acceptFriendRequest = useCallback(
        async (requestId: string) => {
            // Optimistic: Remove from requests immediately
            const request = friendRequests.find((r) => r.id === requestId);
            setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));

            const result = await socialData.acceptFriendRequest(requestId);

            if (!result.success) {
                // Revert optimistic update
                if (request) {
                    setFriendRequests((prev) => [...prev, request]);
                }
                setSocialError(result.error || 'Error al aceptar solicitud');
                return;
            }

            // Refresh friends list to get new friend
            const newFriends = await socialData.fetchFriends();
            setFriends(newFriends);

            // Post friend added activity (fire and forget)
            if (supabase.user?.id && request) {
                triggerFriendAddedActivity(supabase.user.id, request.fromName).catch(
                    () => {},
                );
            }
        },
        [friendRequests, socialData, supabase.user?.id],
    );

    /**
     * Reject friend request with optimistic update
     */
    const rejectFriendRequest = useCallback(
        async (requestId: string) => {
            // Optimistic: Remove from requests immediately
            const request = friendRequests.find((r) => r.id === requestId);
            setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));

            const result = await socialData.rejectFriendRequest(requestId);

            if (!result.success) {
                // Revert optimistic update
                if (request) {
                    setFriendRequests((prev) => [...prev, request]);
                }
                setSocialError(result.error || 'Error al rechazar solicitud');
            }
        },
        [friendRequests, socialData],
    );

    /**
     * Remove friend with optimistic update
     */
    const removeFriend = useCallback(
        async (friendshipId: string) => {
            // Optimistic: Remove from friends immediately
            const friend = friends.find((f) => f.id === friendshipId);
            setFriends((prev) => prev.filter((f) => f.id !== friendshipId));

            const result = await socialData.removeFriend(friendshipId);

            if (!result.success) {
                // Revert optimistic update
                if (friend) {
                    setFriends((prev) => [...prev, friend]);
                }
                setSocialError(result.error || 'Error al eliminar amigo');
            }
        },
        [friends, socialData],
    );

    /**
     * Toggle reaction on activity with optimistic update
     */
    const toggleReaction = useCallback(
        async (activityId: string) => {
            // Optimistic: Update activity feed immediately
            const activity = activityFeed.find((a) => a.id === activityId);
            if (!activity) return;

            const previousHasReacted = activity.hasReacted || false;
            const previousCount = activity.reactionCount || 0;

            setActivityFeed((prev) =>
                prev.map((a) =>
                    a.id === activityId
                        ? {
                              ...a,
                              hasReacted: !previousHasReacted,
                              reactionCount: previousHasReacted
                                  ? Math.max(0, previousCount - 1)
                                  : previousCount + 1,
                          }
                        : a,
                ),
            );

            const result = await socialData.toggleReaction(activityId);

            if (!result.success) {
                // Revert optimistic update
                setActivityFeed((prev) =>
                    prev.map((a) =>
                        a.id === activityId
                            ? {
                                  ...a,
                                  hasReacted: previousHasReacted,
                                  reactionCount: previousCount,
                              }
                            : a,
                    ),
                );
                setSocialError(result.error || 'Error al reaccionar');
            }
        },
        [activityFeed, socialData],
    );

    // Initial load when authenticated
    useEffect(() => {
        if (useCloud && supabase.isAuthenticated) {
            refreshSocial();
        }
    }, [useCloud, supabase.isAuthenticated]); // Only on auth changes, not refreshSocial

    // Refresh leaderboard when metric changes
    useEffect(() => {
        if (useCloud && supabase.isAuthenticated && leaderboard.length > 0) {
            refreshLeaderboard();
        }
    }, [leaderboardMetric]); // Only when metric changes

    return {
        // State
        friends,
        friendRequests,
        activityFeed,
        leaderboard,
        userFriendCode,

        // Loading states
        socialLoading,
        friendsLoading,
        feedLoading,

        // Error state
        socialError,

        // Leaderboard
        leaderboardMetric,
        setLeaderboardMetric,

        // Modal states
        showAddFriendModal,
        setShowAddFriendModal,

        // Actions
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        refreshSocial,
        refreshLeaderboard,
        toggleReaction,

        // Computed
        pendingRequestCount: friendRequests.length,
    };
}

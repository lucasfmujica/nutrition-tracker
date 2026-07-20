import { useCallback, useEffect, useState } from 'react';
import { toast } from '../context/ToastContext';
import { devLog } from '../utils/devLog';
import i18n from '../i18n/config';
import { triggerFriendAddedActivity } from '../services/activityTriggerService';
import {
    ActivityItem,
    Friend,
    FriendRequest,
    LeaderboardEntry,
    LeaderboardMetric,
} from '../types/domain';
import { useSocialData } from './supabase/useSocialData';
import { useSupabaseOperation } from './supabase/useSupabaseOperation';

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

// Real Supabase round-trips regularly take longer than 2s on cold compute or
// slower connections; too short a timeout here just produces routine "query
// failed" noise instead of catching genuine hangs.
const SOCIAL_QUERY_TIMEOUT_MS = 5000;

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

    // Timeout protection for queries
    const { withTimeout } = useSupabaseOperation();

    /**
     * Refresh all social data
     * CRITICAL: Uses Promise.allSettled with timeout protection
     * Prevents one hanging query from blocking the entire social section
     */
    const refreshSocial = useCallback(async () => {
        if (!useCloud || !supabase.isAuthenticated) return;

        setSocialLoading(true);
        setSocialError(null);

        try {
            // Use Promise.allSettled instead of Promise.all
            // This ensures one failing/hanging query doesn't block others
            const results = await Promise.allSettled([
                withTimeout(
                    socialData.fetchFriends(),
                    SOCIAL_QUERY_TIMEOUT_MS,
                    'fetchFriends',
                ),
                withTimeout(
                    socialData.fetchFriendRequests(),
                    SOCIAL_QUERY_TIMEOUT_MS,
                    'fetchFriendRequests',
                ),
                withTimeout(
                    socialData.fetchActivityFeed(),
                    SOCIAL_QUERY_TIMEOUT_MS,
                    'fetchActivityFeed',
                ),
                withTimeout(
                    socialData.fetchLeaderboard(leaderboardMetric),
                    SOCIAL_QUERY_TIMEOUT_MS,
                    'fetchLeaderboard',
                ),
                withTimeout(
                    socialData.fetchUserFriendCode(),
                    SOCIAL_QUERY_TIMEOUT_MS,
                    'fetchUserFriendCode',
                ),
            ]);

            // Extract fulfilled results, using empty fallback for failures
            const fetchedFriends =
                results[0].status === 'fulfilled' ? results[0].value : [];
            const fetchedRequests =
                results[1].status === 'fulfilled' ? results[1].value : [];
            const fetchedFeed =
                results[2].status === 'fulfilled' ? results[2].value : [];
            const fetchedLeaderboard =
                results[3].status === 'fulfilled' ? results[3].value : [];
            const fetchedCode =
                results[4].status === 'fulfilled' ? results[4].value : null;

            setFriends(fetchedFriends);
            setFriendRequests(fetchedRequests);
            setActivityFeed(fetchedFeed);
            setLeaderboard(fetchedLeaderboard);
            setUserFriendCode(fetchedCode);

            // Log any failures for debugging
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const names = [
                        'Friends',
                        'Requests',
                        'Feed',
                        'Leaderboard',
                        'FriendCode',
                    ];
                    console.warn(
                        `[useSocial] ${names[index]} query failed:`,
                        result.reason,
                    );
                }
            });

            devLog('[useSocial] refreshSocial complete:', {
                friendsCount: fetchedFriends.length,
                requestsCount: fetchedRequests.length,
                feedCount: fetchedFeed.length,
                leaderboardCount: fetchedLeaderboard.length,
                userFriendCode: fetchedCode,
            });
        } catch (err: any) {
            console.error('[useSocial] refreshSocial failed:', err);
            setSocialError('Error al cargar datos sociales');
            toast.error(i18n.t('toast.socialLoadError'));
        } finally {
            setSocialLoading(false);
        }
    }, [
        useCloud,
        supabase.isAuthenticated,
        socialData,
        leaderboardMetric,
        withTimeout,
    ]);

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
                toast.error(i18n.t('toast.leaderboardError'));
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
                setSocialError(result.error || i18n.t('toast.acceptRequestError'));
                toast.error(result.error || i18n.t('toast.acceptRequestError'));
                return;
            }

            // Refresh both friends list AND friend requests to ensure consistency
            // Use Promise.allSettled with timeout protection
            const results = await Promise.allSettled([
                withTimeout(
                    socialData.fetchFriends(),
                    SOCIAL_QUERY_TIMEOUT_MS,
                    'fetchFriends',
                ),
                withTimeout(
                    socialData.fetchFriendRequests(),
                    SOCIAL_QUERY_TIMEOUT_MS,
                    'fetchFriendRequests',
                ),
            ]);

            const newFriends =
                results[0].status === 'fulfilled' ? results[0].value : friends;
            const newRequests =
                results[1].status === 'fulfilled'
                    ? results[1].value
                    : friendRequests;

            setFriends(newFriends);
            setFriendRequests(newRequests);

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
                setSocialError(result.error || i18n.t('toast.rejectRequestError'));
                toast.error(result.error || i18n.t('toast.rejectRequestError'));
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
                setSocialError(result.error || i18n.t('toast.removeFriendError'));
                toast.error(result.error || i18n.t('toast.removeFriendError'));
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
                toast.error(i18n.t('toast.reactionError'));
            }
        },
        [activityFeed, socialData],
    );

    // 🔒 CRITICAL FIX: Defer social data load to prevent blocking initial app load
    // Execute in background AFTER main data hydration completes
    useEffect(() => {
        if (!useCloud || !supabase.isAuthenticated) return;

        // Delay social fetch by 3 seconds to ensure main app loads first
        // This prevents social query timeouts from blocking the entire app
        const timer = setTimeout(() => {
            devLog('[useSocial] Background social data load starting...');
            refreshSocial();
        }, 3000);

        return () => clearTimeout(timer);
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

import { User } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
    ActivityItem,
    ActivityType,
    Friend,
    FriendRequest,
    LeaderboardEntry,
    LeaderboardMetric,
    WeeklySummary,
} from '../../types/domain';
import { useSupabaseOperation } from './useSupabaseOperation';

export interface UseSocialDataReturn {
    fetchFriends: () => Promise<Friend[]>;
    fetchFriendRequests: () => Promise<FriendRequest[]>;
    sendFriendRequest: (friendCode: string) => Promise<{ success: boolean; error?: string }>;
    acceptFriendRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
    rejectFriendRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
    removeFriend: (friendshipId: string) => Promise<{ success: boolean; error?: string }>;
    fetchActivityFeed: () => Promise<ActivityItem[]>;
    fetchLeaderboard: (metric: LeaderboardMetric) => Promise<LeaderboardEntry[]>;
    postActivity: (activityType: ActivityType, metadata?: Record<string, any>) => Promise<void>;
    fetchUserFriendCode: () => Promise<string | null>;
}

export function useSocialData(user: User | null, isOnline: boolean): UseSocialDataReturn {
    const { withSync, withTimeout } = useSupabaseOperation();
    const canUseSupabase = !!(user && isOnline && supabase);

    /**
     * Fetch accepted friends with their weekly stats
     */
    const fetchFriends = useCallback(async (): Promise<Friend[]> => {
        if (!canUseSupabase || !user || !supabase) return [];

        try {
            // Get all accepted friendships
            const { data: friendships, error } = await withTimeout(
                supabase
                    .from('friendships')
                    .select('*')
                    .eq('status', 'accepted')
                    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
                30000,
                'fetchFriends'
            );

            if (error || !friendships) {
                console.error('[useSocialData] Error fetching friendships:', error);
                return [];
            }

            // Extract friend user IDs
            const friendIds = friendships.map((f: any) =>
                f.user_id === user.id ? f.friend_id : f.user_id
            );

            if (friendIds.length === 0) return [];

            // Fetch friend profiles
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('user_id, display_name, avatar_url, friend_code')
                .in('user_id', friendIds);

            if (profileError) {
                console.error('[useSocialData] Error fetching friend profiles:', profileError);
                return [];
            }

            // Fetch weekly snapshots for leaderboard data
            const weekStart = getWeekStart();
            const { data: snapshots } = await supabase
                .from('weekly_snapshots')
                .select('*')
                .in('user_id', friendIds)
                .eq('week_start', weekStart);

            // Map to Friend interface
            return friendships.map((friendship: any) => {
                const friendId = friendship.user_id === user.id
                    ? friendship.friend_id
                    : friendship.user_id;
                const profile = profiles?.find((p: any) => p.user_id === friendId);
                const snapshot = snapshots?.find((s: any) => s.user_id === friendId);

                const weeklyStats: WeeklySummary | undefined = snapshot
                    ? {
                        weightDelta: snapshot.weight_delta,
                        workoutCount: snapshot.workout_count,
                        consistencyStreak: snapshot.consistency_streak,
                        avgDeficit: snapshot.avg_deficit,
                    }
                    : undefined;

                return {
                    id: friendship.id,
                    odId: friendId,
                    name: profile?.display_name || 'Usuario',
                    avatar: profile?.avatar_url || null,
                    friendCode: profile?.friend_code || '',
                    connectedAt: friendship.accepted_at || friendship.created_at,
                    weeklyStats,
                };
            });
        } catch (err) {
            console.error('[useSocialData] fetchFriends failed:', err);
            return [];
        }
    }, [canUseSupabase, user, withTimeout]);

    /**
     * Fetch pending friend requests received by the user
     */
    const fetchFriendRequests = useCallback(async (): Promise<FriendRequest[]> => {
        if (!canUseSupabase || !user || !supabase) return [];

        try {
            const { data: requests, error } = await withTimeout(
                supabase
                    .from('friendships')
                    .select('*')
                    .eq('friend_id', user.id)
                    .eq('status', 'pending'),
                30000,
                'fetchFriendRequests'
            );

            if (error || !requests) {
                console.error('[useSocialData] Error fetching friend requests:', error);
                return [];
            }

            if (requests.length === 0) return [];

            // Fetch requester profiles
            const requesterIds = requests.map((r: any) => r.user_id);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, display_name, avatar_url, friend_code')
                .in('user_id', requesterIds);

            return requests.map((request: any) => {
                const profile = profiles?.find((p: any) => p.user_id === request.user_id);
                return {
                    id: request.id,
                    fromUserId: request.user_id,
                    fromName: profile?.display_name || 'Usuario',
                    fromAvatar: profile?.avatar_url || null,
                    fromFriendCode: profile?.friend_code || '',
                    createdAt: request.created_at,
                };
            });
        } catch (err) {
            console.error('[useSocialData] fetchFriendRequests failed:', err);
            return [];
        }
    }, [canUseSupabase, user, withTimeout]);

    /**
     * Send a friend request using friend code
     */
    const sendFriendRequest = useCallback(
        async (friendCode: string): Promise<{ success: boolean; error?: string }> => {
            if (!canUseSupabase || !user || !supabase) {
                return { success: false, error: 'No autenticado o sin conexión' };
            }

            try {
                // Find user by friend code
                const { data: targetProfile, error: findError } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .ilike('friend_code', friendCode.toUpperCase())
                    .maybeSingle();

                if (findError || !targetProfile) {
                    return { success: false, error: 'Código de amigo no encontrado' };
                }

                const targetUserId = targetProfile.user_id;

                // Prevent self-friending
                if (targetUserId === user.id) {
                    return { success: false, error: 'No puedes agregarte a ti mismo' };
                }

                // Check for existing friendship/request
                const { data: existing } = await supabase
                    .from('friendships')
                    .select('id, status')
                    .or(
                        `and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),` +
                        `and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`
                    )
                    .maybeSingle();

                if (existing) {
                    if (existing.status === 'accepted') {
                        return { success: false, error: 'Ya son amigos' };
                    }
                    if (existing.status === 'pending') {
                        return { success: false, error: 'Ya hay una solicitud pendiente' };
                    }
                    if (existing.status === 'blocked') {
                        return { success: false, error: 'No se puede enviar solicitud' };
                    }
                }

                // Create friend request
                const { error: insertError } = await supabase.from('friendships').insert({
                    user_id: user.id,
                    friend_id: targetUserId,
                    status: 'pending',
                });

                if (insertError) {
                    console.error('[useSocialData] Error sending friend request:', insertError);
                    return { success: false, error: 'Error al enviar solicitud' };
                }

                return { success: true };
            } catch (err: any) {
                console.error('[useSocialData] sendFriendRequest failed:', err);
                return { success: false, error: err.message };
            }
        },
        [canUseSupabase, user]
    );

    /**
     * Accept a friend request
     */
    const acceptFriendRequest = useCallback(
        async (requestId: string): Promise<{ success: boolean; error?: string }> => {
            if (!canUseSupabase || !supabase) {
                return { success: false, error: 'No autenticado o sin conexión' };
            }

            try {
                const { error } = await supabase
                    .from('friendships')
                    .update({
                        status: 'accepted',
                        accepted_at: new Date().toISOString(),
                    })
                    .eq('id', requestId);

                if (error) {
                    console.error('[useSocialData] Error accepting friend request:', error);
                    return { success: false, error: 'Error al aceptar solicitud' };
                }

                return { success: true };
            } catch (err: any) {
                console.error('[useSocialData] acceptFriendRequest failed:', err);
                return { success: false, error: err.message };
            }
        },
        [canUseSupabase]
    );

    /**
     * Reject a friend request (delete it)
     */
    const rejectFriendRequest = useCallback(
        async (requestId: string): Promise<{ success: boolean; error?: string }> => {
            if (!canUseSupabase || !supabase) {
                return { success: false, error: 'No autenticado o sin conexión' };
            }

            try {
                const { error } = await supabase
                    .from('friendships')
                    .delete()
                    .eq('id', requestId);

                if (error) {
                    console.error('[useSocialData] Error rejecting friend request:', error);
                    return { success: false, error: 'Error al rechazar solicitud' };
                }

                return { success: true };
            } catch (err: any) {
                console.error('[useSocialData] rejectFriendRequest failed:', err);
                return { success: false, error: err.message };
            }
        },
        [canUseSupabase]
    );

    /**
     * Remove an existing friend
     */
    const removeFriend = useCallback(
        async (friendshipId: string): Promise<{ success: boolean; error?: string }> => {
            if (!canUseSupabase || !supabase) {
                return { success: false, error: 'No autenticado o sin conexión' };
            }

            try {
                const { error } = await supabase
                    .from('friendships')
                    .delete()
                    .eq('id', friendshipId);

                if (error) {
                    console.error('[useSocialData] Error removing friend:', error);
                    return { success: false, error: 'Error al eliminar amigo' };
                }

                return { success: true };
            } catch (err: any) {
                console.error('[useSocialData] removeFriend failed:', err);
                return { success: false, error: err.message };
            }
        },
        [canUseSupabase]
    );

    /**
     * Fetch activity feed from friends
     */
    const fetchActivityFeed = useCallback(async (): Promise<ActivityItem[]> => {
        if (!canUseSupabase || !user || !supabase) return [];

        try {
            // First get friend IDs
            const { data: friendships } = await supabase
                .from('friendships')
                .select('user_id, friend_id')
                .eq('status', 'accepted')
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

            const friendIds = (friendships || []).map((f: any) =>
                f.user_id === user.id ? f.friend_id : f.user_id
            );

            // Include user's own activities
            const allUserIds = [user.id, ...friendIds];

            // Fetch recent activities (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: activities, error } = await withTimeout(
                supabase
                    .from('activity_feed')
                    .select('*')
                    .in('user_id', allUserIds)
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: false })
                    .limit(50),
                30000,
                'fetchActivityFeed'
            );

            if (error || !activities) {
                console.error('[useSocialData] Error fetching activity feed:', error);
                return [];
            }

            // Fetch user profiles for names
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, display_name, avatar_url')
                .in('user_id', allUserIds);

            return activities.map((activity: any) => {
                const profile = profiles?.find((p: any) => p.user_id === activity.user_id);
                return {
                    id: activity.id,
                    userId: activity.user_id,
                    userName: profile?.display_name || 'Usuario',
                    userAvatar: profile?.avatar_url || null,
                    activityType: activity.activity_type,
                    metadata: activity.metadata || {},
                    createdAt: activity.created_at,
                };
            });
        } catch (err) {
            console.error('[useSocialData] fetchActivityFeed failed:', err);
            return [];
        }
    }, [canUseSupabase, user, withTimeout]);

    /**
     * Fetch leaderboard for a specific metric
     */
    const fetchLeaderboard = useCallback(
        async (metric: LeaderboardMetric): Promise<LeaderboardEntry[]> => {
            if (!canUseSupabase || !user || !supabase) return [];

            try {
                // Get friend IDs
                const { data: friendships } = await supabase
                    .from('friendships')
                    .select('user_id, friend_id')
                    .eq('status', 'accepted')
                    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

                const friendIds = (friendships || []).map((f: any) =>
                    f.user_id === user.id ? f.friend_id : f.user_id
                );

                // Include user in leaderboard
                const allUserIds = [user.id, ...friendIds];

                const weekStart = getWeekStart();

                // Fetch weekly snapshots
                const { data: snapshots, error } = await supabase
                    .from('weekly_snapshots')
                    .select('*')
                    .in('user_id', allUserIds)
                    .eq('week_start', weekStart);

                if (error) {
                    console.error('[useSocialData] Error fetching leaderboard:', error);
                    return [];
                }

                // Fetch profiles
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, display_name, avatar_url')
                    .in('user_id', allUserIds);

                // Sort by metric
                const sortedSnapshots = [...(snapshots || [])].sort((a: any, b: any) => {
                    switch (metric) {
                        case 'streak':
                            return (b.consistency_streak || 0) - (a.consistency_streak || 0);
                        case 'workouts':
                            return (b.workout_count || 0) - (a.workout_count || 0);
                        case 'weight':
                            // For weight loss, more negative is better
                            return (a.weight_delta || 0) - (b.weight_delta || 0);
                        default:
                            return 0;
                    }
                });

                return sortedSnapshots.map((snapshot: any, index: number) => {
                    const profile = profiles?.find((p: any) => p.user_id === snapshot.user_id);
                    let value: number;
                    switch (metric) {
                        case 'streak':
                            value = snapshot.consistency_streak || 0;
                            break;
                        case 'workouts':
                            value = snapshot.workout_count || 0;
                            break;
                        case 'weight':
                            value = snapshot.weight_delta || 0;
                            break;
                        default:
                            value = 0;
                    }

                    return {
                        rank: index + 1,
                        userId: snapshot.user_id,
                        name: profile?.display_name || 'Usuario',
                        avatar: profile?.avatar_url || null,
                        value,
                        isCurrentUser: snapshot.user_id === user.id,
                    };
                });
            } catch (err) {
                console.error('[useSocialData] fetchLeaderboard failed:', err);
                return [];
            }
        },
        [canUseSupabase, user]
    );

    /**
     * Post an activity to the feed
     */
    const postActivity = useCallback(
        async (activityType: ActivityType, metadata: Record<string, any> = {}): Promise<void> => {
            if (!canUseSupabase || !user || !supabase) return;

            try {
                await supabase.from('activity_feed').insert({
                    user_id: user.id,
                    activity_type: activityType,
                    metadata,
                });
            } catch (err) {
                console.error('[useSocialData] postActivity failed:', err);
            }
        },
        [canUseSupabase, user]
    );

    /**
     * Get the user's own friend code
     */
    const fetchUserFriendCode = useCallback(async (): Promise<string | null> => {
        if (!canUseSupabase || !user || !supabase) return null;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('friend_code')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error || !data) return null;
            return data.friend_code;
        } catch (err) {
            console.error('[useSocialData] fetchUserFriendCode failed:', err);
            return null;
        }
    }, [canUseSupabase, user]);

    return {
        fetchFriends,
        fetchFriendRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        fetchActivityFeed,
        fetchLeaderboard,
        postActivity,
        fetchUserFriendCode,
    };
}

/**
 * Helper: Get the Monday of the current week as YYYY-MM-DD
 */
function getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
}

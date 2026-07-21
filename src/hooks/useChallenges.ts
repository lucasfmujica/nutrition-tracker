import { useCallback, useEffect, useState } from 'react';
import { toast } from '../context/ToastContext';
import i18n from '../i18n/config';
import { supabase } from '../lib/supabase';
import {
    ChallengeMetric,
    FriendChallenge,
    FriendChallengeParticipant,
} from '../types/domain';
import { addDaysToDate, getArgentinaDateString } from '../utils/dateUtils';
import { computeOwnChallengeProgress } from '../utils/challengeMetrics';

export interface UseChallengesReturn {
    challenges: FriendChallenge[];
    pendingInvites: FriendChallenge[];
    challengesLoading: boolean;
    refreshChallenges: () => Promise<void>;
    createChallenge: (params: {
        title: string;
        metric: ChallengeMetric;
        durationDays: number;
        friendUserIds: string[];
        goalValue?: number | null;
    }) => Promise<{ success: boolean; error?: string }>;
    respondToInvite: (participantId: string, accept: boolean) => Promise<void>;
}

/**
 * useChallenges - CRUD + progress sync for friend challenges.
 * Progress is computed client-side from the user's own logs (same pattern as
 * the leaderboard's weekly_snapshots: each user publishes their own numbers,
 * RLS lets challenge members read each other's rows).
 */
export function useChallenges(): UseChallengesReturn {
    const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
    const [challengesLoading, setChallengesLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Resolve current user (hook is self-contained, no context dependency)
    useEffect(() => {
        if (!supabase) return;
        let cancelled = false;
        supabase.auth.getUser().then(({ data }) => {
            if (!cancelled) setUserId(data.user?.id || null);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const refreshChallenges = useCallback(async () => {
        if (!supabase || !userId) return;
        setChallengesLoading(true);
        try {
            // RLS already scopes to challenges I created or am invited to
            const { data: rows, error } = await supabase
                .from('challenges')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;

            const challengeIds = (rows || []).map((c: any) => c.id);
            let participants: any[] = [];
            if (challengeIds.length > 0) {
                const { data: pData, error: pError } = await supabase
                    .from('challenge_participants')
                    .select('*')
                    .in('challenge_id', challengeIds);
                if (pError) throw pError;
                participants = pData || [];
            }

            // Profiles for participant display names/avatars
            const participantUserIds = [
                ...new Set(participants.map((p: any) => p.user_id)),
            ];
            let profiles: any[] = [];
            if (participantUserIds.length > 0) {
                const { data: profData } = await supabase
                    .from('profiles')
                    .select('user_id, display_name, avatar_url')
                    .in('user_id', participantUserIds);
                profiles = profData || [];
            }

            const today = getArgentinaDateString();
            const mapped: FriendChallenge[] = (rows || []).map((c: any) => {
                const cParticipants: FriendChallengeParticipant[] = participants
                    .filter((p: any) => p.challenge_id === c.id)
                    .map((p: any) => {
                        const profile = profiles.find(
                            (pr: any) => pr.user_id === p.user_id,
                        );
                        return {
                            id: p.id,
                            challengeId: p.challenge_id,
                            userId: p.user_id,
                            name: profile?.display_name || 'Usuario',
                            avatar: profile?.avatar_url || null,
                            status: p.status,
                            progress: Number(p.progress) || 0,
                            joinedAt: p.joined_at,
                        };
                    });
                const isFinished = c.status !== 'active' || c.end_date < today;
                const daysRemaining = isFinished
                    ? 0
                    : Math.max(
                          0,
                          Math.round(
                              (new Date(c.end_date).getTime() -
                                  new Date(today).getTime()) /
                                  86400000,
                          ),
                      );
                return {
                    id: c.id,
                    creatorId: c.creator_id,
                    title: c.title,
                    metric: c.metric,
                    goalValue: c.goal_value != null ? Number(c.goal_value) : null,
                    startDate: c.start_date,
                    endDate: c.end_date,
                    status: c.status,
                    createdAt: c.created_at,
                    participants: cParticipants,
                    daysRemaining,
                    isFinished,
                    myParticipation:
                        cParticipants.find((p) => p.userId === userId) || null,
                };
            });

            setChallenges(mapped);

            // Publish my own progress for accepted, started challenges (fire & forget)
            void syncOwnProgress(userId, mapped, today);
        } catch (err) {
            console.error('[useChallenges] refreshChallenges failed:', err);
            toast.error(i18n.t('social.challenges.loadError'));
        } finally {
            setChallengesLoading(false);
        }
    }, [userId]);

    /** Recompute and upsert my progress on each visible challenge */
    const syncOwnProgress = async (
        uid: string,
        list: FriendChallenge[],
        today: string,
    ) => {
        if (!supabase) return;
        for (const challenge of list) {
            const mine = challenge.myParticipation;
            if (!mine || mine.status !== 'accepted') continue;
            if (challenge.startDate > today) continue;
            try {
                const progress = await computeOwnChallengeProgress(
                    supabase,
                    uid,
                    challenge.metric,
                    challenge.startDate,
                    challenge.endDate < today ? challenge.endDate : today,
                );
                if (progress !== mine.progress) {
                    await supabase
                        .from('challenge_participants')
                        .update({ progress })
                        .eq('id', mine.id);
                    setChallenges((prev) =>
                        prev.map((c) =>
                            c.id === challenge.id
                                ? {
                                      ...c,
                                      participants: c.participants.map((p) =>
                                          p.id === mine.id
                                              ? { ...p, progress }
                                              : p,
                                      ),
                                      myParticipation: c.myParticipation
                                          ? { ...c.myParticipation, progress }
                                          : null,
                                  }
                                : c,
                        ),
                    );
                }
            } catch (err) {
                console.error('[useChallenges] syncOwnProgress failed:', err);
            }
        }
    };

    const createChallenge = useCallback(
        async (params: {
            title: string;
            metric: ChallengeMetric;
            durationDays: number;
            friendUserIds: string[];
            goalValue?: number | null;
        }): Promise<{ success: boolean; error?: string }> => {
            if (!supabase || !userId) {
                return { success: false, error: 'No autenticado' };
            }
            try {
                const startDate = getArgentinaDateString();
                const endDate = addDaysToDate(startDate, params.durationDays - 1);

                const { data: challenge, error } = await supabase
                    .from('challenges')
                    .insert({
                        creator_id: userId,
                        title: params.title,
                        metric: params.metric,
                        goal_value: params.goalValue ?? null,
                        start_date: startDate,
                        end_date: endDate,
                        status: 'active',
                    })
                    .select()
                    .single();
                if (error || !challenge) throw error;

                // Creator joins automatically; friends get invited
                const rows = [
                    {
                        challenge_id: challenge.id,
                        user_id: userId,
                        status: 'accepted',
                        joined_at: new Date().toISOString(),
                    },
                    ...params.friendUserIds.map((fid) => ({
                        challenge_id: challenge.id,
                        user_id: fid,
                        status: 'invited',
                    })),
                ];
                const { error: pError } = await supabase
                    .from('challenge_participants')
                    .insert(rows);
                if (pError) throw pError;

                toast.success(i18n.t('social.challenges.created'));
                await refreshChallenges();
                return { success: true };
            } catch (err: any) {
                console.error('[useChallenges] createChallenge failed:', err);
                toast.error(i18n.t('social.challenges.createError'));
                return { success: false, error: err?.message };
            }
        },
        [userId, refreshChallenges],
    );

    const respondToInvite = useCallback(
        async (participantId: string, accept: boolean) => {
            if (!supabase || !userId) return;
            try {
                const { error } = await supabase
                    .from('challenge_participants')
                    .update({
                        status: accept ? 'accepted' : 'declined',
                        joined_at: accept ? new Date().toISOString() : null,
                    })
                    .eq('id', participantId);
                if (error) throw error;
                await refreshChallenges();
            } catch (err) {
                console.error('[useChallenges] respondToInvite failed:', err);
                toast.error(i18n.t('social.challenges.respondError'));
            }
        },
        [userId, refreshChallenges],
    );

    // Initial load (deferred like useSocial to avoid blocking app start)
    useEffect(() => {
        if (!userId) return;
        const timer = setTimeout(() => {
            void refreshChallenges();
        }, 3500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const pendingInvites = challenges.filter(
        (c) => !c.isFinished && c.myParticipation?.status === 'invited',
    );

    return {
        challenges,
        pendingInvites,
        challengesLoading,
        refreshChallenges,
        createChallenge,
        respondToInvite,
    };
}

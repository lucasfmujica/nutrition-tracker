import { SupabaseClient } from '@supabase/supabase-js';
import { ChallengeMetric } from '../types/domain';

/**
 * Computes the current user's progress for a challenge metric over a date range.
 * Client-side, same approach as the leaderboard: each user can only read their
 * own logs, so everyone reports their own progress to challenge_participants.
 *
 * Progress = sum of the metric between startDate and endDate (inclusive).
 */
export async function computeOwnChallengeProgress(
    supabase: SupabaseClient<any>,
    userId: string,
    metric: ChallengeMetric,
    startDate: string,
    endDate: string,
): Promise<number> {
    try {
        switch (metric) {
            case 'steps': {
                const { data, error } = await supabase
                    .from('steps_log')
                    .select('steps')
                    .eq('user_id', userId)
                    .gte('date', startDate)
                    .lte('date', endDate);
                if (error) throw error;
                return (data || []).reduce(
                    (sum: number, r: any) => sum + (r.steps || 0),
                    0,
                );
            }
            case 'protein': {
                const { data, error } = await supabase
                    .from('food_log')
                    .select('protein')
                    .eq('user_id', userId)
                    .gte('date', startDate)
                    .lte('date', endDate);
                if (error) throw error;
                return Math.round(
                    (data || []).reduce(
                        (sum: number, r: any) => sum + (Number(r.protein) || 0),
                        0,
                    ),
                );
            }
            case 'workouts': {
                const { count, error } = await supabase
                    .from('workouts')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .gte('date', startDate)
                    .lte('date', endDate);
                if (error) throw error;
                return count || 0;
            }
            case 'water': {
                const { data, error } = await supabase
                    .from('water_log')
                    .select('ml, glasses')
                    .eq('user_id', userId)
                    .gte('date', startDate)
                    .lte('date', endDate);
                if (error) throw error;
                // ml preferred; fallback to glasses (250ml each)
                return (data || []).reduce(
                    (sum: number, r: any) =>
                        sum + (r.ml != null ? r.ml : (r.glasses || 0) * 250),
                    0,
                );
            }
            case 'logging_streak': {
                const { data, error } = await supabase
                    .from('food_log')
                    .select('date')
                    .eq('user_id', userId)
                    .gte('date', startDate)
                    .lte('date', endDate);
                if (error) throw error;
                // Days with at least one logged food entry in the range
                return new Set((data || []).map((r: any) => r.date)).size;
            }
            default:
                return 0;
        }
    } catch (err) {
        console.error(
            `[challengeMetrics] Failed to compute progress for ${metric}:`,
            err,
        );
        return 0;
    }
}

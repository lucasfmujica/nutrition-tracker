import { supabase } from '../lib/supabase';
import { ActivityType, WeightEntry, Workout } from '../types/domain';

/**
 * Activity Trigger Service
 * Posts activities to the activity_feed when users complete actions
 */

interface PostActivityOptions {
    userId: string;
    activityType: ActivityType;
    metadata?: Record<string, any>;
}

/**
 * Post an activity to the feed (fire and forget)
 */
export async function postActivity({
    userId,
    activityType,
    metadata = {},
}: PostActivityOptions): Promise<void> {
    if (!supabase || !userId) return;

    try {
        await supabase.from('activity_feed').insert({
            user_id: userId,
            activity_type: activityType,
            metadata,
        });
    } catch (err) {
        // Fire and forget - don't block main operations
        console.warn('[ActivityTrigger] Failed to post activity:', err);
    }
}

/**
 * Trigger activity for workout logged
 */
export async function triggerWorkoutActivity(
    userId: string,
    workout: Workout
): Promise<void> {
    await postActivity({
        userId,
        activityType: 'workout_logged',
        metadata: {
            workoutName: workout.name,
            type: workout.type,
            duration: workout.duration,
            calories: workout.calories,
        },
    });
}

/**
 * Check for weight milestones and trigger activity
 * Milestones: Every 5kg lost from starting weight
 */
export async function checkWeightMilestone(
    userId: string,
    newWeight: number,
    weightHistory: WeightEntry[],
    targetWeight: number
): Promise<void> {
    if (weightHistory.length < 2) return;

    // Get starting weight (oldest entry)
    const sorted = [...weightHistory].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const startingWeight = sorted[0]?.weight;
    if (!startingWeight) return;

    // Calculate total loss
    const totalLoss = startingWeight - newWeight;

    // Check for 5kg milestones
    const previousWeight = sorted[sorted.length - 2]?.weight || startingWeight;
    const previousLoss = startingWeight - previousWeight;

    const currentMilestone = Math.floor(totalLoss / 5) * 5;
    const previousMilestone = Math.floor(previousLoss / 5) * 5;

    // New milestone reached!
    if (currentMilestone > previousMilestone && currentMilestone > 0) {
        await postActivity({
            userId,
            activityType: 'weight_milestone',
            metadata: {
                milestone: currentMilestone,
                currentWeight: newWeight,
                startingWeight,
                targetWeight,
            },
        });
    }

    // Goal reached!
    if (newWeight <= targetWeight && previousWeight > targetWeight) {
        await postActivity({
            userId,
            activityType: 'goal_reached',
            metadata: {
                goalType: 'target_weight',
                achievedWeight: newWeight,
                targetWeight,
            },
        });
    }
}

/**
 * Check for consistency streak milestones
 * Milestones: 7, 14, 30, 60, 90 days
 */
export async function checkStreakMilestone(
    userId: string,
    currentStreak: number,
    previousStreak: number
): Promise<void> {
    const milestones = [7, 14, 30, 60, 90];

    for (const milestone of milestones) {
        if (currentStreak >= milestone && previousStreak < milestone) {
            await postActivity({
                userId,
                activityType: 'streak_achieved',
                metadata: {
                    days: milestone,
                    currentStreak,
                },
            });
            break; // Only post one milestone at a time
        }
    }
}

/**
 * Trigger friend added activity
 */
export async function triggerFriendAddedActivity(
    userId: string,
    friendName: string
): Promise<void> {
    await postActivity({
        userId,
        activityType: 'friend_added',
        metadata: {
            friendName,
        },
    });
}

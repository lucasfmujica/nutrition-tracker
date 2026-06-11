import { useOuraSync } from '../../hooks/useOuraSync';
import { useSocial } from '../../hooks/useSocial';
import { useSupabase } from '../../hooks/useSupabase';
import { useWeeklySnapshot } from '../../hooks/useWeeklySnapshot';
import { useHealthDomains } from './useHealthDomains';

interface IntegrationsDomainDeps {
    supabase: ReturnType<typeof useSupabase>;
    useCloud: boolean;
    biometrics: ReturnType<typeof useHealthDomains>['biometrics'];
    nutrition: ReturnType<typeof useHealthDomains>['nutrition'];
    workouts: ReturnType<typeof useHealthDomains>['workouts'];
}

/**
 * External integrations & social: Oura sync service, social feature and the
 * weekly snapshot generation (leaderboards, effect-only hook).
 */
export const useIntegrationsDomain = ({
    supabase,
    useCloud,
    biometrics,
    nutrition,
    workouts,
}: IntegrationsDomainDeps) => {
    // Oura Sync Service
    const ouraSync = useOuraSync({
        saveOuraEntry: biometrics.saveOuraEntry,
        saveStepsEntry: biometrics.saveStepsEntry,
        ouraPersonalToken: biometrics.profile?.ouraPersonalToken,
        profile: biometrics.profile,
        stepsLog: biometrics.stepsLog,
        saveProfile: biometrics.saveProfile,
    });

    // Social Feature
    const social = useSocial({
        supabase: {
            user: supabase.user,
            isOnline: supabase.isOnline,
            isAuthenticated: supabase.isAuthenticated,
        },
        useCloud,
    });

    // Weekly Snapshot Generation (for leaderboards)
    useWeeklySnapshot({
        userId: supabase.user?.id,
        weightHistory: biometrics.weightHistory,
        workoutLog: workouts.workoutLog,
        foodLog: nutrition.foodLog,
        targetCalories: biometrics.profile?.targetCalories || 2000,
        useCloud,
    });

    return { ouraSync, social };
};

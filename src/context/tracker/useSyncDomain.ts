import { useSupabase } from '../../hooks/useSupabase';
import { useTrackerSync } from '../../hooks/useTrackerSync';
import { useHealthDomains } from './useHealthDomains';

interface SyncDomainDeps {
    supabase: ReturnType<typeof useSupabase>;
    useCloud: boolean;
    offlineMode: boolean;
    setOfflineMode: React.Dispatch<React.SetStateAction<boolean>>;
    biometrics: ReturnType<typeof useHealthDomains>['biometrics'];
    nutrition: ReturnType<typeof useHealthDomains>['nutrition'];
    workouts: ReturnType<typeof useHealthDomains>['workouts'];
    setMealTemplates: React.Dispatch<React.SetStateAction<any[]>>;
}

/**
 * Sync Orchestrator wiring. Connects useTrackerSync to the domain setters
 * (initial hydration) and the live logs (Force Sync / Vault flush).
 */
export const useSyncDomain = ({
    supabase,
    useCloud,
    offlineMode,
    setOfflineMode,
    biometrics,
    nutrition,
    workouts,
    setMealTemplates,
}: SyncDomainDeps) => {
    return useTrackerSync({
        supabase,
        useCloud,
        offlineMode,
        setOfflineMode,
        // Setters for initial load
        setProfile: biometrics.setProfile,
        setCustomTargets: biometrics.setCustomTargets,
        setWeightHistory: biometrics.setWeightHistory,
        setFoodLog: nutrition.setFoodLog,
        setWorkoutLog: workouts.setWorkoutLog,
        setStepsLog: biometrics.setStepsLog,
        setOuraLog: biometrics.setOuraLog,
        setWaterLog: nutrition.setWaterLog,
        setMealTemplates,
        setSyncStatus: undefined, // Will be populated from trackerSync.setSaveStatus internally
        // Data for Force Sync
        foodLog: nutrition.foodLog,
        workoutLog: workouts.workoutLog,
        stepsLog: biometrics.stepsLog,
        ouraLog: biometrics.ouraLog,
        waterLog: nutrition.waterLog,
        weightHistory: biometrics.weightHistory,
    });
};

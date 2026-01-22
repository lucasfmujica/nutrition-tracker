import { useCallback } from 'react';
import { addDaysToDate, formatTime } from '../utils/dateUtils';
import { storage } from '../utils/storage';

import { CustomTargets, Profile, StepsEntry, Workout } from '../types/domain';

interface TrackerActionsParams {
    nutrition: {
        addWaterGlass: (date?: string) => Promise<string | null>;
        removeWaterGlass: (date?: string) => Promise<string | null>;
    };
    biometrics: {
        profile: Profile;
        customTargets: CustomTargets;
        stepsLog: StepsEntry[];
        setProfile: (p: Profile) => void;
        setCustomTargets: (t: CustomTargets) => void;
        saveProfile: (p: Profile) => Promise<any>;
        saveTargets: (t: CustomTargets) => Promise<any>;
    };
    workouts: {
        workoutLog: Workout[];
    };
    trackerSync: {
        setSaveStatus: (msg: string) => void;
    };
}

/**
 * useTrackerActions - Action wrappers and helper functions
 *
 * Provides wrapper functions for common tracker actions and utility helpers.
 * Keeps TrackerContext clean by delegating to domain-specific hooks.
 *
 * @param {TrackerActionsParams} params - Dependencies
 * @returns {Object} Action functions and helpers
 */
export const useTrackerActions = ({
    nutrition,
    biometrics,
    workouts,
    trackerSync,
}: TrackerActionsParams) => {
    // Config update wrapper
    const updateConfig = useCallback(
        async (newProfile: any, newTargets: any) => {
            // Optimistic update
            biometrics.setProfile(newProfile);
            biometrics.setCustomTargets(newTargets);

            // Save to storage/cloud
            try {
                if (newProfile !== biometrics.profile)
                    await biometrics.saveProfile(newProfile);
                if (newTargets !== biometrics.customTargets)
                    await biometrics.saveTargets(newTargets);
            } catch (err) {
                console.error('Error updating config:', err);
                // Revert on error? For now just log
            }
        },
        [biometrics],
    );

    // Water actions with status updates
    const addWaterGlass = useCallback(
        async (date?: string): Promise<string | null> => {
            const msg = await nutrition.addWaterGlass(date);
            if (msg) trackerSync.setSaveStatus(msg);
            return msg;
        },
        [nutrition, trackerSync],
    );

    const removeWaterGlass = useCallback(
        async (date?: string): Promise<string | null> => {
            const msg = await nutrition.removeWaterGlass(date);
            if (msg) trackerSync.setSaveStatus(msg);
            return msg;
        },
        [nutrition, trackerSync],
    );

    // Helper functions
    const getWorkoutsForDate = useCallback(
        (date: string) => {
            return workouts.workoutLog.filter(
                (entry: Workout) => entry.date === date,
            );
        },
        [workouts.workoutLog],
    );

    const getStepsForDate = useCallback(
        (date: string) => {
            return (
                biometrics.stepsLog.find((s: StepsEntry) => s.date === date)
                    ?.steps || 0
            );
        },
        [biometrics.stepsLog],
    );

    const changeDate = useCallback((dateStr: string, delta: number) => {
        return addDaysToDate(dateStr, delta);
    }, []);

    return {
        updateConfig,
        addWaterGlass,
        removeWaterGlass,
        getWorkoutsForDate,
        getStepsForDate,
        changeDate,
        formatTime,
        storage,
    };
};

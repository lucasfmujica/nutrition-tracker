import { useState } from 'react';
import {
    CustomTargets,
    OuraEntry,
    Profile,
    StepsEntry,
    WeightEntry,
} from '../types/domain';
import { storage } from '../utils/storage';
import { addPendingWrite, getCacheKeys } from '../utils/storageUtils';
import { useSupabase } from './useSupabase';

type SupabaseClient = ReturnType<typeof useSupabase>;

export const useBiometrics = (
    supabase: SupabaseClient,
    useCloud: boolean,
    profileData: Profile | null = null,
    targetsData: CustomTargets | null = null,
) => {
    // Initial states aligned with useTrackerData defaults
    const defaultProfile: Profile = {
        id: '',
        userId: '',
        height: 173,
        currentWeight: 84.9,
        targetWeight: 75,
        age: 27,
        activityLevel: 'moderate',
        goal: 'cut',
        avatar: '',
        name: '',
        stepGoal: 8000,
        targetCalories: 2100,
        targetProtein: 170,
        targetCarbs: 180,
        targetFat: 70,
        targetFiber: 30,
        trainingDayCaloriesBonus: 200,
        trainingDayCarbs: 220,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        safety_net_enabled: false,
    };

    const defaultTargets: CustomTargets = {
        calories: 2100,
        protein: 170,
        carbs: 180,
        fat: 70,
        fiber: 30,
        trainingDayCaloriesBonus: 200,
        trainingDayCarbs: 220,
    };

    const [profile, setProfile] = useState<Profile>(profileData || defaultProfile);

    const [customTargets, setCustomTargets] = useState<CustomTargets>(
        targetsData || defaultTargets,
    );

    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [stepsLog, setStepsLog] = useState<StepsEntry[]>([]);
    const [ouraLog, setOuraLog] = useState<OuraEntry[]>([]);

    // Actions
    const saveProfile = async (newProfile: Profile) => {
        setProfile(newProfile);
        try {
            const userId = supabase.user?.id;
            const keys = userId ? getCacheKeys(userId) : null;
            if (keys) {
                await storage.set(keys.PROFILE, JSON.stringify(newProfile));
            } else {
                await storage.set('lucas-profile-v5', JSON.stringify(newProfile));
            }
            if (useCloud) {
                await supabase.saveProfile(newProfile, customTargets);
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            throw err; // Allow caller to handle UI feedback
        }
    };

    const saveTargets = async (newTargets: CustomTargets) => {
        setCustomTargets(newTargets);
        try {
            const userId = supabase.user?.id;
            const keys = userId ? getCacheKeys(userId) : null;
            if (keys) {
                await storage.set(keys.TARGETS, JSON.stringify(newTargets));
            } else {
                await storage.set('lucas-targets-v5', JSON.stringify(newTargets));
            }
            if (useCloud) {
                await supabase.saveProfile(profile, newTargets);
            }
        } catch (err) {
            console.error('Error saving targets:', err);
        }
    };

    const sortWeightHistory = (history: WeightEntry[]) => {
        return [...history].sort((a, b) => {
            // 1. Primary sort by Date (Desc)
            if (a.date && b.date) {
                const dateDiff = b.date.localeCompare(a.date);
                if (dateDiff !== 0) return dateDiff;
            }

            // 2. Secondary sort by Timestamp (Desc) - only for same day
            const timestampDiff = (b.timestamp || 0) - (a.timestamp || 0);
            return timestampDiff;
        });
    };

    const getMostRecentWeight = (history: WeightEntry[] = weightHistory) => {
        if (!history || history.length === 0) return null;
        const sorted = sortWeightHistory(history);
        return sorted[0];
    };

    const saveWeightHistory = async (newHistory: WeightEntry[]) => {
        const sorted = sortWeightHistory(newHistory);
        setWeightHistory(sorted);
        try {
            const userId = supabase.user?.id;
            const keys = userId ? getCacheKeys(userId) : null;
            if (keys) {
                await storage.set(keys.WEIGHT, JSON.stringify(sorted));
            } else {
                await storage.set('lucas-weight-history-v5', JSON.stringify(sorted));
            }
            const mostRecent = getMostRecentWeight(sorted);
            if (mostRecent) {
                saveProfile({ ...profile, currentWeight: mostRecent.weight });
            }
        } catch (err) {
            console.error('Error saving weight history:', err);
        }
    };

    const saveWeightEntry = async (entry: WeightEntry) => {
        // 1. Optimistic Update (Immediate Feedback)
        const newHistory = [...weightHistory, entry];
        await saveWeightHistory(newHistory);

        if (useCloud) {
            try {
                const result = await supabase.saveWeight(entry);

                if (result?.error) {
                    console.error('[Biometrics] saveWeightEntry failed:', {
                        function: 'saveWeightEntry',
                        date: entry.date,
                        weight: entry.weight,
                        error: result.error.message,
                        userId: supabase.user?.id,
                    });
                    throw new Error(result.error.message);
                }

                return result;
            } catch (err: any) {
                console.error('[Biometrics] saveWeightEntry FAILED:', {
                    function: 'saveWeightEntry',
                    date: entry.date,
                    weight: entry.weight,
                    error: err.message,
                    stack: err.stack,
                    userId: supabase.user?.id,
                });

                // Add to The Vault for offline resilience
                await addPendingWrite(
                    'weight_history',
                    entry,
                    supabase.user?.id || '',
                );

                throw err;
            }
        }
    };

    const saveStepsLog = async (newLog: StepsEntry[]) => {
        setStepsLog(newLog);
        try {
            const userId = supabase.user?.id;
            const keys = userId ? getCacheKeys(userId) : null;
            if (keys) {
                await storage.set(keys.STEPS, JSON.stringify(newLog));
            } else {
                await storage.set('lucas-steps-log-v5', JSON.stringify(newLog));
            }
        } catch (err) {
            console.error('Error saving steps log:', err);
        }
    };

    const saveStepsEntry = async (entry: StepsEntry) => {
        // 1. Optimistic Update
        setStepsLog((prev) => {
            const existingIndex = prev.findIndex((item) => item.date === entry.date);
            if (existingIndex >= 0) {
                const newLog = [...prev];
                newLog[existingIndex] = { ...newLog[existingIndex], ...entry };
                return newLog;
            }
            return [...prev, entry].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
        });

        if (useCloud) {
            try {
                const result = await supabase.saveSteps(entry);

                if (result?.error) {
                    console.error('[Biometrics] saveStepsEntry failed:', {
                        function: 'saveStepsEntry',
                        date: entry.date,
                        error: result.error.message,
                        userId: supabase.user?.id,
                    });
                    throw new Error(result.error.message);
                }

                return result;
            } catch (err: any) {
                console.error('[Biometrics] saveStepsEntry FAILED:', {
                    function: 'saveStepsEntry',
                    date: entry.date,
                    error: err.message,
                    stack: err.stack,
                    userId: supabase.user?.id,
                });

                // Add to The Vault for offline resilience
                await addPendingWrite('steps_log', entry, supabase.user?.id || '');

                throw err;
            }
        }
    };

    const saveOuraLog = async (newLog: OuraEntry[]) => {
        setOuraLog(newLog);
        try {
            const userId = supabase.user?.id;
            const keys = userId ? getCacheKeys(userId) : null;
            if (keys) {
                await storage.set(keys.OURA, JSON.stringify(newLog));
            } else {
                await storage.set('lucas-oura-log-v5', JSON.stringify(newLog));
            }
        } catch (err) {
            console.error('Error saving oura log: ', err);
        }
    };

    const saveOuraEntry = async (entry: OuraEntry) => {
        // 1. Optimistic Update
        setOuraLog((prev) => {
            const existingIndex = prev.findIndex((item) => item.date === entry.date);
            if (existingIndex >= 0) {
                const newLog = [...prev];
                newLog[existingIndex] = { ...newLog[existingIndex], ...entry };
                return newLog;
            }
            return [...prev, entry].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
        });

        if (useCloud) {
            try {
                const result = await supabase.saveOura(entry);

                if (result?.error) {
                    console.error('[Biometrics] saveOuraEntry failed:', {
                        function: 'saveOuraEntry',
                        date: entry.date,
                        error: result.error.message,
                        userId: supabase.user?.id,
                    });
                    throw new Error(result.error.message);
                }

                return result;
            } catch (err: any) {
                // CRITICAL: Log error with full context
                console.error('[Biometrics] saveOuraEntry FAILED:', {
                    function: 'saveOuraEntry',
                    date: entry.date,
                    error: err.message,
                    stack: err.stack,
                    userId: supabase.user?.id,
                });

                // Add to The Vault for offline resilience
                await addPendingWrite('oura_log', entry, supabase.user?.id || '');

                // Propagate error for UI feedback
                throw err;
            }
        }
    };

    return {
        profile,
        setProfile,
        saveProfile,
        customTargets,
        setCustomTargets,
        saveTargets,
        weightHistory,
        setWeightHistory,
        saveWeightHistory,
        saveWeightEntry,
        getMostRecentWeight,
        stepsLog,
        setStepsLog,
        saveStepsLog,
        saveStepsEntry,
        ouraLog,
        setOuraLog,
        saveOuraLog,
        saveOuraEntry,
    };
};

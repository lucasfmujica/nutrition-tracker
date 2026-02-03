import React, {
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from 'react';
import { useBiometrics } from '../hooks/useBiometrics';
import { useDataOperations } from '../hooks/useDataOperations';
import { useExport } from '../hooks/useExport';
import { useFoodEntry } from '../hooks/useFoodEntry';
import { useGlobalDelete } from '../hooks/useGlobalDelete';
import { useMealTemplates } from '../hooks/useMealTemplates';
import { useNutrition } from '../hooks/useNutrition';
import { useOuraSync } from '../hooks/useOuraSync';
import { useQuickLog } from '../hooks/useQuickLog';
import { useSafetyNet } from '../hooks/useSafetyNet';
import { useSocial } from '../hooks/useSocial';
import { useWeeklySnapshot } from '../hooks/useWeeklySnapshot';
import { useSupabase } from '../hooks/useSupabase';
import { useTrackerActions } from '../hooks/useTrackerActions';
import { useTrackerAnalytics } from '../hooks/useTrackerAnalytics';
import { useTrackerSync } from '../hooks/useTrackerSync';
import { useTrackerUIState } from '../hooks/useTrackerUIState';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';
import { useWeightEditing } from '../hooks/useWeightEditing';
import { useWorkoutEntry } from '../hooks/useWorkoutEntry';
import { useWorkouts } from '../hooks/useWorkouts';
import { Database } from '../types/supabase';

// Define the shape of the Context
// Note: Many of these types are inferred as 'any' currently because the sub-hooks are not yet migrated to TypeScript.
// As those hooks are migrated, this interface will become more precise.
export type TrackerContextType = ReturnType<typeof useTrackerSync> &
    Omit<ReturnType<typeof useNutrition>, 'getWaterForDate'> &
    ReturnType<typeof useBiometrics> &
    ReturnType<typeof useWorkouts> &
    ReturnType<typeof useTrackerUIState> &
    ReturnType<typeof useWeightEditing> &
    ReturnType<typeof useTrackerAnalytics> &
    Omit<ReturnType<typeof useTrackerActions>, 'changeDate'> &
    ReturnType<typeof useGlobalDelete> &
    ReturnType<typeof useDataOperations> &
    ReturnType<typeof useFoodEntry> &
    ReturnType<typeof useWorkoutEntry> &
    ReturnType<typeof useMealTemplates> &
    ReturnType<typeof useOuraSync> &
    ReturnType<typeof useQuickLog> &
    ReturnType<typeof useSafetyNet> &
    ReturnType<typeof useExport> &
    ReturnType<typeof useSocial> & {
        supabase: ReturnType<typeof useSupabase>;
        updateConfig: (newProfile: any, newTargets: any) => Promise<void>;
        changeDate: (days: number) => void;
        getWaterForDate: (date: string) => {
            ml: number;
            glasses: number;
            entries: any[];
        };
        addStepsEntry: () => void;
        weeklyPlan: any; // Add weeklyPlan to context type
    };

const TrackerContext = createContext<TrackerContextType | null>(null);

interface TrackerProviderProps {
    children: ReactNode;
}

export const TrackerProvider: React.FC<TrackerProviderProps> = ({ children }) => {
    // Service Layer
    const supabase = useSupabase();

    // CRITICAL FIX: Unified useCloud flag
    // Single source of truth for cloud connectivity status
    const [offlineMode, setOfflineMode] = useState<boolean>(false);
    const useCloud = Boolean(
        supabase.isAuthenticated && !offlineMode && supabase.isOnline,
    );

    // 0. Shared state for templates (needed by both sync and template hook)
    const [mealTemplatesData, setMealTemplatesData] = useState<any[]>([]); // TODO: Type with Database['public']['Tables']['meal_templates']['Row'][]

    // 1. UI State (extracted hook)
    const uiState = useTrackerUIState();

    // 2. Core Domains - all use the same useCloud
    const workouts = useWorkouts(supabase, useCloud);
    const biometrics = useBiometrics(supabase, useCloud);
    const weeklyPlanHook = useWeeklyPlan();

    // 3. Modo Escudo (Safety Net)
    const safetyNet = useSafetyNet(
        biometrics.profile,
        biometrics.customTargets,
        biometrics.saveProfile,
    );

    // 4. Nutrition with Safety Net integration
    const nutrition = useNutrition(
        supabase,
        useCloud,
        biometrics.customTargets,
        undefined,
        safetyNet.getSafetyNetTargetsForDate,
        safetyNet.shouldTagAsSafetyNetDay,
        workouts.workoutLog,
        weeklyPlanHook.plan, // Pass plan to nutrition
    );

    // 5. Weight Editing (extracted hook)
    const weightEditing = useWeightEditing(biometrics);

    // 6. Sync Orchestrator
    const trackerSync = useTrackerSync({
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
        setMealTemplates: setMealTemplatesData,
        // Data for Force Sync
        foodLog: nutrition.foodLog,
        workoutLog: workouts.workoutLog,
        stepsLog: biometrics.stepsLog,
        ouraLog: biometrics.ouraLog,
        waterLog: nutrition.waterLog,
        weightHistory: biometrics.weightHistory,
    });

    // 7. updateConfig closure (must be defined BEFORE analytics)
    const updateConfigClosure = async (newProfile: any, newTargets: any) => {
        biometrics.setProfile(newProfile);
        biometrics.setCustomTargets(newTargets);
        try {
            if (newProfile !== biometrics.profile)
                await biometrics.saveProfile(newProfile);
            if (newTargets !== biometrics.customTargets)
                await biometrics.saveTargets(newTargets);
        } catch (err) {
            console.error('[TrackerContext] Error updating config:', err);
        }
    };

    // 8. Analytics & Intelligence (extracted hook - WITH date reactivity)
    const analytics = useTrackerAnalytics({
        dashboardDate: uiState.dashboardDate, // ✅ CRITICAL FIX: Date-reactive
        biometrics,
        nutrition,
        workouts,
        safetyNet,
        updateConfig: updateConfigClosure, // ✅ FIX: Pass real function instead of null
    });

    // 9. Actions (extracted hook)
    const actions = useTrackerActions({
        nutrition,
        biometrics,
        workouts,
        trackerSync,
    });

    // Override updateConfig in actions (needed for dynamicTargets)
    const updateConfig = updateConfigClosure;

    // 10. Operations (Legacy hooks support)
    const dataOperations = useDataOperations({
        foodLog: nutrition.foodLog,
        saveFoodLog: nutrition.saveFoodLog,
        workoutLog: workouts.workoutLog,
        saveWorkoutLog: workouts.saveWorkoutLog,
        saveFoodEntry: nutrition.saveFoodEntry,
        saveWorkoutEntry: workouts.saveWorkoutEntry,
        supabase,
        useCloud,
        showImportFoodModal: uiState.showImportFoodModal,
        setShowImportFoodModal: uiState.setShowImportFoodModal,
        showImportWorkoutModal: uiState.showImportWorkoutModal,
        setShowImportWorkoutModal: uiState.setShowImportWorkoutModal,
        dashboardDate: uiState.dashboardDate,
    });

    // 11. Export
    const exportDoc = useExport(
        {
            profile: biometrics.profile,
            setProfile: biometrics.setProfile,
            customTargets: biometrics.customTargets,
            setCustomTargets: biometrics.setCustomTargets,
            weightHistory: biometrics.weightHistory,
            saveWeightHistory: biometrics.saveWeightHistory,
            foodLog: nutrition.foodLog,
            saveFoodLog: nutrition.saveFoodLog,
            workoutLog: workouts.workoutLog,
            saveWorkoutLog: workouts.saveWorkoutLog,
            stepsLog: biometrics.stepsLog,
            saveStepsLog: biometrics.saveStepsLog,
            ouraLog: biometrics.ouraLog,
            saveOuraLog: biometrics.saveOuraLog,
            getMostRecentWeight: biometrics.getMostRecentWeight,
            getTotalsForDate: nutrition.getTotalsForDate,
            getTargetsForDate: nutrition.getTargetsForDate,
            getStepsForDate: (date: string) =>
                biometrics.stepsLog.find((s: any) => s.date === date)?.steps || 0,
            getWorkoutsForDate: (date: string) =>
                workouts.workoutLog.filter((entry: any) => entry.date === date),
        },
        analytics,
        analytics.weightAnalytics,
    );

    // 12. Food Entry
    const foodEntry = useFoodEntry({
        foodLog: nutrition.foodLog,
        saveFoodLog: nutrition.saveFoodLog,
        saveFoodEntry: nutrition.saveFoodEntry,
        setSaveStatus: trackerSync.setSaveStatus,
    });

    // 13. Fast-Log Library
    const quickLog = useQuickLog(nutrition.foodLog, nutrition.saveFoodEntry);

    // 14. Workout Entry
    const workoutEntry = useWorkoutEntry({
        workoutLog: workouts.workoutLog,
        saveWorkoutLog: workouts.saveWorkoutLog,
        saveWorkoutEntry: workouts.saveWorkoutEntry,
    });

    // 15. Meal Templates
    const mealTemplates = useMealTemplates({
        mealTemplates: mealTemplatesData,
        setMealTemplates: setMealTemplatesData,
        storage: actions.storage,
        setSaveStatus: trackerSync.setSaveStatus,
        selectedFoodDate: uiState.selectedFoodDate,
        saveFoodLog: nutrition.saveFoodLog,
        foodLog: nutrition.foodLog,
        saveFoodEntry: nutrition.saveFoodEntry,
        saveTemplate: supabase.saveTemplate,
        deleteTemplateDb: supabase.deleteTemplateDb,
        useCloud,
    });

    // 16. Global Delete Actions
    const globalDelete = useGlobalDelete(
        nutrition,
        workouts,
        biometrics,
        supabase,
        useCloud,
    );

    // 17. Oura Sync Service
    const ouraSync = useOuraSync({
        saveOuraEntry: biometrics.saveOuraEntry,
        saveStepsEntry: biometrics.saveStepsEntry,
        ouraPersonalToken: biometrics.profile?.ouraPersonalToken,
    });

    // 18. Social Feature
    const social = useSocial({
        supabase: {
            user: supabase.user,
            isOnline: supabase.isOnline,
            isAuthenticated: supabase.isAuthenticated,
        },
        useCloud,
    });

    // 19. Weekly Snapshot Generation (for leaderboards)
    useWeeklySnapshot({
        userId: supabase.user?.id,
        weightHistory: biometrics.weightHistory,
        workoutLog: workouts.workoutLog,
        foodLog: nutrition.foodLog,
        targetCalories: biometrics.profile?.targetCalories || 2000,
        useCloud,
    });

    // 20. UI Helpers
    const changeDate = (days: number) => {
        const targetTab = uiState.activeTab;
        if (targetTab === 'dashboard') {
            uiState.setDashboardDate((prev) => actions.changeDate(prev, days));
        } else if (targetTab === 'comidas') {
            uiState.setSelectedFoodDate((prev) => actions.changeDate(prev, days));
        } else if (targetTab === 'entrenos') {
            uiState.setSelectedWorkoutDate((prev) => actions.changeDate(prev, days));
        } else if (targetTab === 'pasos') {
            uiState.setStepsDate((prev) => actions.changeDate(prev, days));
        }
    };

    const getWaterDataForDate = (date: string) => {
        const entry = nutrition.getWaterForDate(date);
        return {
            ml: entry.ml || 0,
            glasses: entry.glasses || 0,
            entries: entry.glasses > 0 ? [entry] : [],
        };
    };

    const addStepsEntry = async () => {
        if (!uiState.newSteps) return;
        const entry = {
            id: `s-${uiState.stepsDate}`,
            date: uiState.stepsDate,
            steps: parseInt(uiState.newSteps) || 0,
        };
        await biometrics.saveStepsEntry(entry);
        uiState.setNewSteps('');
    };

    // Combine everything into value
    const value = useMemo(
        () => ({
            // Sync & Core Domains
            ...trackerSync,
            ...nutrition,
            ...biometrics,
            ...workouts,

            // UI State (extracted)
            ...uiState,

            // Weight Editing (extracted)
            ...weightEditing,

            // Analytics & Intelligence (extracted)
            ...analytics,

            // Actions (extracted)
            ...actions,
            updateConfig, // Override from closure

            // Delete Modal & Undo
            ...globalDelete,

            // Entry Hooks
            ...dataOperations,
            ...foodEntry,
            ...workoutEntry,
            ...mealTemplates,

            // Oura Sync
            ...ouraSync,

            // Export
            ...exportDoc,

            // Fast-Log Library
            ...quickLog,

            // Modo Escudo (Safety Net)
            ...safetyNet,

            // Social Feature
            ...social,

            // UI Helpers
            changeDate,
            getWaterForDate: getWaterDataForDate,
            addStepsEntry,

            // Weekly Plan
            ...weeklyPlanHook,
            weeklyPlan: weeklyPlanHook.plan, // Alias for backward compatibility if needed

            // Supabase
            supabase,
        }),
        [
            trackerSync,
            nutrition,
            biometrics,
            workouts,
            uiState,
            weightEditing,
            analytics,
            actions,
            updateConfig,
            globalDelete,
            dataOperations,
            foodEntry,
            workoutEntry,
            mealTemplates,
            ouraSync,
            exportDoc,
            quickLog,
            safetyNet,
            social,
            supabase,
            changeDate,
            addStepsEntry,
            weeklyPlanHook,
        ],
    );

    return (
        <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
    );
};

export const useTracker = () => {
    const context = useContext(TrackerContext);
    if (!context) {
        throw new Error('useTracker must be used within a TrackerProvider');
    }
    return context;
};

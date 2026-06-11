import { useDataOperations } from '../../hooks/useDataOperations';
import { useExport } from '../../hooks/useExport';
import { useFoodEntry } from '../../hooks/useFoodEntry';
import { useGlobalDelete } from '../../hooks/useGlobalDelete';
import { useMealTemplates } from '../../hooks/useMealTemplates';
import { useQuickLog } from '../../hooks/useQuickLog';
import { useSupabase } from '../../hooks/useSupabase';
import { useTrackerSync } from '../../hooks/useTrackerSync';
import { useTrackerUIState } from '../../hooks/useTrackerUIState';
import { useWorkoutEntry } from '../../hooks/useWorkoutEntry';
import { useHealthDomains } from './useHealthDomains';
import { useIntelligenceDomain } from './useIntelligenceDomain';

interface EntryDomainDeps {
    supabase: ReturnType<typeof useSupabase>;
    useCloud: boolean;
    uiState: ReturnType<typeof useTrackerUIState>;
    trackerSync: ReturnType<typeof useTrackerSync>;
    biometrics: ReturnType<typeof useHealthDomains>['biometrics'];
    nutrition: ReturnType<typeof useHealthDomains>['nutrition'];
    workouts: ReturnType<typeof useHealthDomains>['workouts'];
    analytics: ReturnType<typeof useIntelligenceDomain>['analytics'];
    actions: ReturnType<typeof useIntelligenceDomain>['actions'];
    mealTemplatesData: any[];
    setMealTemplatesData: React.Dispatch<React.SetStateAction<any[]>>;
}

/**
 * Data entry & operations: import/export, food/workout entry forms,
 * fast-log library, meal templates and global delete.
 *
 * Hook call order mirrors the original TrackerContext order:
 * dataOperations -> export -> foodEntry -> quickLog -> workoutEntry ->
 * mealTemplates -> globalDelete.
 */
export const useEntryDomain = ({
    supabase,
    useCloud,
    uiState,
    trackerSync,
    biometrics,
    nutrition,
    workouts,
    analytics,
    actions,
    mealTemplatesData,
    setMealTemplatesData,
}: EntryDomainDeps) => {
    // Operations (Legacy hooks support)
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

    // Export
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

    // Food Entry
    const foodEntry = useFoodEntry({
        foodLog: nutrition.foodLog,
        saveFoodLog: nutrition.saveFoodLog,
        saveFoodEntry: nutrition.saveFoodEntry,
        setSaveStatus: trackerSync.setSaveStatus,
    });

    // Fast-Log Library
    const quickLog = useQuickLog(nutrition.foodLog, nutrition.saveFoodEntry);

    // Workout Entry
    const workoutEntry = useWorkoutEntry({
        workoutLog: workouts.workoutLog,
        saveWorkoutLog: workouts.saveWorkoutLog,
        saveWorkoutEntry: workouts.saveWorkoutEntry,
    });

    // Meal Templates
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

    // Global Delete Actions
    const globalDelete = useGlobalDelete(
        nutrition,
        workouts,
        biometrics,
        supabase,
        useCloud,
    );

    return {
        dataOperations,
        exportDoc,
        foodEntry,
        quickLog,
        workoutEntry,
        mealTemplates,
        globalDelete,
    };
};

import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useSupabase } from '../hooks/useSupabase';
import { useTrackerActions } from '../hooks/useTrackerActions';
import { useTrackerAnalytics } from '../hooks/useTrackerAnalytics';
import { useTrackerSync } from '../hooks/useTrackerSync';
import { useTrackerUIState } from '../hooks/useTrackerUIState';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';
import { useWeightEditing } from '../hooks/useWeightEditing';
import { useWorkoutEntry } from '../hooks/useWorkoutEntry';
import { useWorkouts } from '../hooks/useWorkouts';
import { UnitSystem } from '../types/domain';
import { useCloudGate } from './tracker/useCloudGate';
import { useEntryDomain } from './tracker/useEntryDomain';
import { useHealthDomains } from './tracker/useHealthDomains';
import { useIntegrationsDomain } from './tracker/useIntegrationsDomain';
import { useIntelligenceDomain } from './tracker/useIntelligenceDomain';
import { useSyncDomain } from './tracker/useSyncDomain';
import { useUiHelpersDomain } from './tracker/useUiHelpersDomain';

// Define the shape of the Context
// Note: Many of these types are inferred as 'any' currently because the sub-hooks are not yet migrated to TypeScript.
// As those hooks are migrated, this interface will become more precise.
export type TrackerContextType = ReturnType<typeof useTrackerSync> &
    Omit<ReturnType<typeof useNutrition>, 'getWaterForDate'> &
    ReturnType<typeof useWeeklyPlan> &
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
        weeklyPlanLoading: boolean;
        unitSystem: UnitSystem;
        setUnitSystem: (system: UnitSystem) => void;
        updateUnitSystem: (system: UnitSystem) => Promise<void>;
    };

const TrackerContext = createContext<TrackerContextType | null>(null);

interface TrackerProviderProps {
    children: ReactNode;
}

/**
 * TrackerProvider — thin composer over the domain hooks in ./tracker/.
 *
 * IMPORTANT: the call order of the domain hooks below is load-bearing and
 * mirrors the original monolithic implementation (cloud gate -> ui state ->
 * health domains -> sync -> intelligence -> entry -> integrations -> ui
 * helpers). There are subtle dependencies between sync, the offline Vault and
 * initial hydration — do not reorder.
 *
 * Re-renders: the context value is a single useMemo'd object. We deliberately
 * did NOT split the provider into multiple contexts (data vs. actions):
 * several "stable" actions close over fast-changing domain objects
 * (nutrition, biometrics, uiState), so a split would either change identity
 * semantics or require consumer changes — both out of scope for this
 * conservative refactor.
 */
export const TrackerProvider: React.FC<TrackerProviderProps> = ({ children }) => {
    // Service Layer
    const supabase = useSupabase();
    const { i18n } = useTranslation();

    // Unified useCloud flag (debounced against token-refresh flicker)
    const { offlineMode, setOfflineMode, useCloud } = useCloudGate(supabase);

    // 0. Shared state for templates (needed by both sync and template hook)
    const [mealTemplatesData, setMealTemplatesData] = useState<any[]>([]); // TODO: Type with Database['public']['Tables']['meal_templates']['Row'][]

    // 1. UI State (extracted hook)
    const uiState = useTrackerUIState();

    // 2-5. Core health domains (workouts, biometrics, weekly plan, safety
    // net, nutrition, weight editing)
    const { workouts, biometrics, weeklyPlanHook, safetyNet, nutrition, weightEditing } =
        useHealthDomains(supabase, useCloud);

    // 6. Sync Orchestrator
    const trackerSync = useSyncDomain({
        supabase,
        useCloud,
        offlineMode,
        setOfflineMode,
        biometrics,
        nutrition,
        workouts,
        setMealTemplates: setMealTemplatesData,
    });

    // 7-9. Analytics, Intelligence & Actions (updateConfig defined inside,
    // before analytics)
    const { updateConfig, analytics, actions } = useIntelligenceDomain({
        uiState,
        biometrics,
        nutrition,
        workouts,
        safetyNet,
        trackerSync,
    });

    // 10-16. Data entry & operations (import/export, food/workout entry,
    // fast-log, meal templates, global delete)
    const {
        dataOperations,
        exportDoc,
        foodEntry,
        quickLog,
        workoutEntry,
        mealTemplates,
        globalDelete,
    } = useEntryDomain({
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
    });

    // 17-19. Integrations (Oura, Social, Weekly Snapshot)
    const { ouraSync, social } = useIntegrationsDomain({
        supabase,
        useCloud,
        biometrics,
        nutrition,
        workouts,
    });

    // 20-21. UI Helpers & Unit System
    const {
        changeDate,
        getWaterDataForDate,
        addStepsEntry,
        unitSystem,
        setUnitSystem,
        updateUnitSystem,
    } = useUiHelpersDomain({ uiState, actions, biometrics, nutrition });
    const {
        isLoading: weeklyPlanLoading,
        ...weeklyPlanActions
    } = weeklyPlanHook;

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
            ...weeklyPlanActions,
            weeklyPlan: weeklyPlanHook.plan, // Alias for backward compatibility if needed
            weeklyPlanLoading,

            // Unit System
            unitSystem,
            setUnitSystem,
            updateUnitSystem,

            // Language (Forces re-render on language change)
            language: i18n.language,

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
            getWaterDataForDate,
            addStepsEntry,
            weeklyPlanActions,
            weeklyPlanLoading,
            unitSystem,
            i18n.language,
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

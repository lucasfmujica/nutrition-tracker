import { useCallback, useEffect, useState } from 'react';
import { useTrackerUIState } from '../../hooks/useTrackerUIState';
import { UnitSystem } from '../../types/domain';
import { useHealthDomains } from './useHealthDomains';
import { useIntelligenceDomain } from './useIntelligenceDomain';

interface UiHelpersDomainDeps {
    uiState: ReturnType<typeof useTrackerUIState>;
    actions: ReturnType<typeof useIntelligenceDomain>['actions'];
    biometrics: ReturnType<typeof useHealthDomains>['biometrics'];
    nutrition: ReturnType<typeof useHealthDomains>['nutrition'];
}

/**
 * UI helpers (date navigation per tab, water/steps shortcuts) and the
 * unit system preference (local state synced with the cloud profile).
 */
export const useUiHelpersDomain = ({
    uiState,
    actions,
    biometrics,
    nutrition,
}: UiHelpersDomainDeps) => {
    const changeDate = useCallback(
        (days: number) => {
            const targetTab = uiState.activeTab;
            if (targetTab === 'dashboard') {
                uiState.setDashboardDate((prev) => actions.changeDate(prev, days));
            } else if (targetTab === 'comidas') {
                uiState.setSelectedFoodDate((prev) => actions.changeDate(prev, days));
            } else if (targetTab === 'entrenos') {
                uiState.setSelectedWorkoutDate((prev) =>
                    actions.changeDate(prev, days),
                );
            } else if (targetTab === 'pasos') {
                uiState.setStepsDate((prev) => actions.changeDate(prev, days));
            }
        },
        [uiState, actions],
    );

    const getWaterDataForDate = useCallback(
        (date: string) => {
            const entry = nutrition.getWaterForDate(date);
            return {
                ml: entry.ml || 0,
                glasses: entry.glasses || 0,
                entries: entry.glasses > 0 ? [entry] : [],
            };
        },
        [nutrition],
    );

    const addStepsEntry = useCallback(async () => {
        if (!uiState.newSteps) return;
        const entry = {
            id: `s-${uiState.stepsDate}`,
            date: uiState.stepsDate,
            steps: parseInt(uiState.newSteps) || 0,
        };
        await biometrics.saveStepsEntry(entry);
        uiState.setNewSteps('');
    }, [uiState, biometrics]);

    // Unit System
    const [unitSystem, setUnitSystem] = useState<UnitSystem>(
        biometrics.profile?.unitSystem || 'metric',
    );

    // Sync local state with profile changes from cloud/DB
    useEffect(() => {
        if (
            biometrics.profile?.unitSystem &&
            biometrics.profile.unitSystem !== unitSystem
        ) {
            setUnitSystem(biometrics.profile.unitSystem);
        }
    }, [biometrics.profile?.unitSystem]);

    const updateUnitSystem = async (system: UnitSystem) => {
        setUnitSystem(system);
        if (biometrics.profile) {
            const newProfile = { ...biometrics.profile, unitSystem: system };
            await biometrics.saveProfile(newProfile);
        }
    };

    return {
        changeDate,
        getWaterDataForDate,
        addStepsEntry,
        unitSystem,
        setUnitSystem,
        updateUnitSystem,
    };
};

import { useCallback } from 'react';
import { useTrackerActions } from '../../hooks/useTrackerActions';
import { useTrackerAnalytics } from '../../hooks/useTrackerAnalytics';
import { useTrackerSync } from '../../hooks/useTrackerSync';
import { useTrackerUIState } from '../../hooks/useTrackerUIState';
import { useHealthDomains } from './useHealthDomains';

interface IntelligenceDomainDeps {
    uiState: ReturnType<typeof useTrackerUIState>;
    biometrics: ReturnType<typeof useHealthDomains>['biometrics'];
    nutrition: ReturnType<typeof useHealthDomains>['nutrition'];
    workouts: ReturnType<typeof useHealthDomains>['workouts'];
    safetyNet: ReturnType<typeof useHealthDomains>['safetyNet'];
    trackerSync: ReturnType<typeof useTrackerSync>;
}

/**
 * Analytics, intelligence and high-level actions.
 * updateConfig must be defined BEFORE analytics (analytics consumes it).
 */
export const useIntelligenceDomain = ({
    uiState,
    biometrics,
    nutrition,
    workouts,
    safetyNet,
    trackerSync,
}: IntelligenceDomainDeps) => {
    // updateConfig closure (must be defined BEFORE analytics)
    const updateConfig = useCallback(
        async (newProfile: any, newTargets: any) => {
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
        },
        [biometrics],
    );

    // Analytics & Intelligence (extracted hook - WITH date reactivity)
    const analytics = useTrackerAnalytics({
        dashboardDate: uiState.dashboardDate, // ✅ CRITICAL FIX: Date-reactive
        biometrics,
        nutrition,
        workouts,
        safetyNet,
        updateConfig, // ✅ FIX: Pass real function instead of null
    });

    // Actions (extracted hook)
    const actions = useTrackerActions({
        nutrition,
        biometrics,
        workouts,
        trackerSync,
    });

    return { updateConfig, analytics, actions };
};

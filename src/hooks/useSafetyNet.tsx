import { useCallback } from 'react';
import { getSafetyNetTargets, isSafetyNetDay } from '../services/tdeeCalculator';
import { CustomTargets, Profile } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

/**
 * useSafetyNet - Modo Escudo (Safety Net) state management
 *
 * Provides:
 * - Safety net activation state
 * - Maintenance mode calorie targets
 * - Food entry tagging for analytics filtering
 *
 * @param {Profile} profile - User profile
 * @param {CustomTargets} customTargets - Base nutrition targets
 * @param {Function} saveProfile - Profile save function
 * @returns {Object} Safety net state and actions
 */
export const useSafetyNet = (
    profile: Profile,
    customTargets: CustomTargets,
    saveProfile: (p: Profile) => Promise<void>,
) => {
    const safetyNetActive = profile?.safety_net_enabled || false;

    /**
     * Toggle Safety Net mode
     */
    const toggleSafetyNet = useCallback(async () => {
        const newStatus = !safetyNetActive;

        // Update profile
        const updatedProfile: Profile = {
            ...profile,
            safety_net_enabled: newStatus,
        };

        await saveProfile(updatedProfile);

        console.log(
            `[SafetyNet] ${newStatus ? 'ACTIVATED' : 'DEACTIVATED'} - Modo Escudo ${newStatus ? 'ON' : 'OFF'}`,
        );
    }, [profile, safetyNetActive, saveProfile]);

    /**
     * Get targets for a specific date
     * Returns maintenance targets if safety net is active for today
     *
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {CustomTargets} baseTargets - Base targets (can include training day adjustments)
     * @returns {CustomTargets | null} Calorie/macro targets
     */
    const getTargetsForDate = useCallback(
        (date: string, baseTargets: CustomTargets = customTargets) => {
            const today = getArgentinaDateString();

            // Safety Net only applies to current day
            if (isSafetyNetDay(date, safetyNetActive, today)) {
                return getSafetyNetTargets(profile, customTargets);
            }

            // Return null to indicate no override (allow Smart Periodization to work)
            return null;
        },
        [profile, customTargets, safetyNetActive],
    );

    /**
     * Check if a specific date should be tagged as safety net day
     *
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {boolean}
     */
    const shouldTagAsSafetyNetDay = useCallback(
        (date: string) => {
            const today = getArgentinaDateString();
            return isSafetyNetDay(date, safetyNetActive, today);
        },
        [safetyNetActive],
    );

    /**
     * Get status message for UI
     */
    const getStatusMessage = useCallback(() => {
        if (safetyNetActive) {
            const targets = getSafetyNetTargets(profile, customTargets);
            return `🛡️ Modo Escudo activo - ${targets.calories} kcal (Mantenimiento)`;
        }
        return null;
    }, [safetyNetActive, profile, customTargets]);

    return {
        safetyNetActive,
        toggleSafetyNet,
        getSafetyNetTargetsForDate: getTargetsForDate,
        shouldTagAsSafetyNetDay,
        getStatusMessage,
    };
};

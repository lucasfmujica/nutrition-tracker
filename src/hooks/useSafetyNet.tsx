import { useCallback } from 'react';
import { getSafetyNetTargets, isSafetyNetDay } from '../services/tdeeCalculator';
import { CustomTargets, Profile } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';
import { devLog } from '../utils/devLog';

/**
 * useSafetyNet - Modo Escudo (Safety Net) state management
 *
 * Provides:
 * - Safety net activation state per day
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
    const safetyNetDays = profile?.safety_net_days || [];

    /**
     * Toggle Safety Net mode for a specific date
     * @param {string} date - Date to toggle (YYYY-MM-DD)
     */
    const toggleSafetyNet = useCallback(async (date: string) => {
        const isActive = safetyNetDays.includes(date);

        let updatedDays: string[];
        if (isActive) {
            // Remove date from array
            updatedDays = safetyNetDays.filter(d => d !== date);
        } else {
            // Add date to array
            updatedDays = [...safetyNetDays, date];
        }

        // Update profile
        const updatedProfile: Profile = {
            ...profile,
            safety_net_days: updatedDays,
        };

        await saveProfile(updatedProfile);

        devLog(
            `[SafetyNet] ${!isActive ? 'ACTIVATED' : 'DEACTIVATED'} for ${date} - Modo Escudo ${!isActive ? 'ON' : 'OFF'}`,
        );
    }, [profile, safetyNetDays, saveProfile]);

    /**
     * Get targets for a specific date
     * Returns maintenance targets if safety net is active for that date
     *
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {CustomTargets} baseTargets - Base targets (can include training day adjustments)
     * @returns {CustomTargets | null} Calorie/macro targets
     */
    const getTargetsForDate = useCallback(
        (date: string, baseTargets: CustomTargets = customTargets) => {
            // Check if this specific date has Safety Net activated
            if (isSafetyNetDay(date, safetyNetDays)) {
                return getSafetyNetTargets(profile, customTargets);
            }

            // Return null to indicate no override (allow Smart Periodization to work)
            return null;
        },
        [profile, customTargets, safetyNetDays],
    );

    /**
     * Check if a specific date should be tagged as safety net day
     *
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {boolean}
     */
    const shouldTagAsSafetyNetDay = useCallback(
        (date: string) => {
            return isSafetyNetDay(date, safetyNetDays);
        },
        [safetyNetDays],
    );

    /**
     * Check if a specific date is a safety net day (for UI indicators)
     *
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {boolean}
     */
    const isSafetyNetActive = useCallback(
        (date: string) => {
            return safetyNetDays.includes(date);
        },
        [safetyNetDays],
    );

    /**
     * Get status message for UI for a specific date
     * @param {string} date - Date to check (YYYY-MM-DD)
     */
    const getStatusMessage = useCallback((date: string) => {
        if (safetyNetDays.includes(date)) {
            const targets = getSafetyNetTargets(profile, customTargets);
            return `🛡️ Modo Escudo activo - ${targets.calories} kcal (Mantenimiento)`;
        }
        return null;
    }, [safetyNetDays, profile, customTargets]);

    return {
        safetyNetDays,
        isSafetyNetActive,
        toggleSafetyNet,
        getSafetyNetTargetsForDate: getTargetsForDate,
        shouldTagAsSafetyNetDay,
        getStatusMessage,
    };
};

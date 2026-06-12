import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { OuraEntry } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

export interface OuraAutoAdjustData {
    ouraCalorieBoost: number; // -200, 0, or +200
    ouraAlert: string | null; // Alert message for low/optimal recovery
    hydrationMultiplier: number; // 1.0 (normal) to 1.3 (high temp/steps)
    readinessScore: number | null;
    bodyTemp: number | null;
    stepsFromOura: number | null;
}

/**
 * useOuraAutoAdjust - Auto-adjust calories based on Oura readiness + Smart hydration
 *
 * Calorie Adjustment Logic:
 * - Readiness < 70: -200 kcal (recovery mode)
 * - Readiness 70-85: 0 kcal (maintain)
 * - Readiness > 85: +200 kcal (optimal recovery)
 *
 * Smart Hydration Logic:
 * - Body temp > 37.2°C: +30% hydration
 * - Steps > 12,000: +30% hydration
 * - Otherwise: 1.0x (baseline)
 *
 * @param ouraLog - Array of Oura data entries
 * @param selectedDate - Date to check (defaults to today)
 * @returns OuraAutoAdjustData with calorie boost and hydration multiplier
 */
export const useOuraAutoAdjust = (
    ouraLog: OuraEntry[],
    selectedDate?: string,
    stepsForDate: number = 0,
): OuraAutoAdjustData => {
    const { t } = useTranslation();

    return useMemo(() => {
        const today = selectedDate || getArgentinaDateString();

        // Find Oura data for today
        const todayOura = ouraLog.find((entry) => entry.date === today);

        if (!todayOura) {
            return {
                ouraCalorieBoost: 0,
                ouraAlert: null,
                hydrationMultiplier: 1.0,
                readinessScore: null,
                bodyTemp: null,
                stepsFromOura: null,
            };
        }

        const readiness = todayOura.readinessScore ?? null;
        const bodyTemp = null;
        const steps = stepsForDate;

        // If readiness is null/undefined, return neutral values
        if (readiness === null) {
            return {
                ouraCalorieBoost: 0,
                ouraAlert: null,
                hydrationMultiplier: 1.0,
                readinessScore: null,
                bodyTemp,
                stepsFromOura: steps,
            };
        }

        // 1. Calculate calorie boost based on readiness
        let ouraCalorieBoost = 0;
        let ouraAlert: string | null = null;

        if (readiness < 70) {
            ouraCalorieBoost = -200;
            ouraAlert = t('oura.adjust.criticalRecovery');
        } else if (readiness > 85) {
            ouraCalorieBoost = +200;
            ouraAlert = t('oura.adjust.optimalRecovery');
        } else {
            ouraCalorieBoost = 0;
            ouraAlert = null;
        }

        // 2. Calculate hydration multiplier
        let hydrationMultiplier = 1.0;

        const highTemp = bodyTemp !== null && bodyTemp > 37.2;
        const highSteps = steps > 12000;

        if (highTemp || highSteps) {
            hydrationMultiplier = 1.3; // +30% hydration
        }

        return {
            ouraCalorieBoost,
            ouraAlert,
            hydrationMultiplier,
            readinessScore: readiness,
            bodyTemp,
            stepsFromOura: steps,
        };
    }, [ouraLog, selectedDate, stepsForDate, t]);
};

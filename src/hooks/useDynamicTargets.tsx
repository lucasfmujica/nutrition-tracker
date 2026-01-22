import { useCallback, useEffect, useState } from 'react';
import {
    formatWeeklySummary,
    proposeTargetAdjustments,
} from '../services/targetAdjustmentService';
import { CustomTargets, Profile, WeightAnalytics } from '../types/domain';
import { getArgentinaDateString, getArgentinaDay } from '../utils/dateUtils';

const BRIEFING_STORAGE_KEY = 'lukenfit_last_briefing_monday';

/**
 * useDynamicTargets
 *
 * Orchestrates the Metabolic Auto-Pilot system:
 * 1. Detects if it's Monday in Argentina
 * 2. Checks if user has already reviewed briefing for this specific Monday
 * 3. Generates weekly analysis & proposed targets
 * 4. Handles applying new targets
 *
 * @param {WeightAnalytics} weightAnalytics - From useWeightAnalytics
 * @param {CustomTargets} customTargets - Current goals
 * @param {Profile} profile - User profile
 * @param {Function} updateConfig - Function to save new targets (from TrackerContext)
 */
export const useDynamicTargets = (
    weightAnalytics: WeightAnalytics,
    customTargets: CustomTargets,
    profile: Profile,
    updateConfig: (profile: Profile, targets: CustomTargets) => Promise<void>,
) => {
    const [showMondayBriefing, setShowMondayBriefing] = useState(false);
    const [briefingData, setBriefingData] = useState<any>(null);

    // Check for Monday on mount / data change
    useEffect(() => {
        if (
            !weightAnalytics ||
            weightAnalytics.currentTrend === null ||
            !customTargets
        )
            return;

        const checkBriefing = () => {
            // 1. Is it Monday?
            const today = getArgentinaDateString(); // YYYY-MM-DD
            const dayOfWeek = getArgentinaDay(new Date(today)); // 0=Sun, 1=Mon...

            // Development Override: Uncomment to force test
            // const isMonday = true;
            const isMonday = dayOfWeek === 1;

            if (!isMonday) return;

            // 2. Have we shown it today?
            const lastBriefingDate = localStorage.getItem(BRIEFING_STORAGE_KEY);
            if (lastBriefingDate === today) return;

            // 3. Generate Data
            const summary = formatWeeklySummary(
                weightAnalytics,
                customTargets,
                profile,
            );

            if (summary) {
                setBriefingData(summary);
                setShowMondayBriefing(true);
            }
        };

        checkBriefing();
    }, [weightAnalytics, customTargets, profile]);

    // Action: Mark as reviewed (dismiss)
    const markBriefingReviewed = useCallback(() => {
        const today = getArgentinaDateString();
        localStorage.setItem(BRIEFING_STORAGE_KEY, today);
        setShowMondayBriefing(false);
    }, []);

    // Action: Accept Targets
    const acceptProposedTargets = useCallback(async () => {
        if (!briefingData || !briefingData.proposal) return;

        const { calories } = briefingData.proposal;

        const oldCalories = customTargets.calories || 2000;
        const ratio = calories / oldCalories;

        const newTargets: CustomTargets = {
            ...customTargets,
            calories: calories,
            protein: Math.round(customTargets.protein * ratio),
            carbs: Math.round(customTargets.carbs * ratio),
            fat: Math.round(customTargets.fat * ratio),
        };

        await updateConfig(profile, newTargets);
        markBriefingReviewed();
    }, [briefingData, customTargets, profile, updateConfig, markBriefingReviewed]);

    return {
        showMondayBriefing,
        setShowMondayBriefing,
        briefingData, // { currentWeight, currentTrend, proposal, ... }
        markBriefingReviewed,
        acceptProposedTargets,
    };
};

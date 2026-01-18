import { useCallback, useEffect, useState } from 'react';
import { formatWeeklySummary, proposeTargetAdjustments } from '../services/targetAdjustmentService';
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
 * @param {Object} weightAnalytics - From useWeightAnalytics
 * @param {Object} customTargets - Current goals
 * @param {Object} profile - User profile
 * @param {Function} updateConfig - Function to save new targets (from TrackerContext)
 */
export const useDynamicTargets = (weightAnalytics, customTargets, profile, updateConfig) => {
  const [showMondayBriefing, setShowMondayBriefing] = useState(false);
  const [briefingData, setBriefingData] = useState(null);

  // Check for Monday on mount / data change
  useEffect(() => {
    if (!weightAnalytics || !weightAnalytics.currentTrend || !customTargets) return;

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
      const summary = formatWeeklySummary(weightAnalytics, customTargets, profile);

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

    // Optional: Save to Supabase 'settings' if field exists
    // for cross-device sync (future enhancement)
  }, []);

  // Action: Accept Targets
  const acceptProposedTargets = useCallback(async () => {
    if (!briefingData || !briefingData.proposal) return;

    const { calories, steps } = briefingData.proposal;

    // Construct new targets object preserving other macros
    // Recalculate macros based on new calories?
    // For now, simple scaler or just update calories and let user adjust macros?
    // Let's scale macros proportionally to keep it simple and safe.

    const oldCalories = customTargets.calories || 2000;
    const ratio = calories / oldCalories;

    const newTargets = {
      ...customTargets,
      calories: calories,
      protein: Math.round(customTargets.protein * ratio),
      carbs: Math.round(customTargets.carbs * ratio),
      fat: Math.round(customTargets.fat * ratio),
      // steps: steps // If steps were in customTargets
    };

    // If steps are tracked in profile or separate log, we might need a separate setter
    // Assuming steps might be part of targets in future, but currently mostly just a daily goal
    // For now, we update the nutrition targets.

    await updateConfig(profile, newTargets);
    markBriefingReviewed();
  }, [briefingData, customTargets, profile, updateConfig, markBriefingReviewed]);

  return {
    showMondayBriefing,
    setShowMondayBriefing,
    briefingData, // { currentWeight, currentTrend, proposal, ... }
    markBriefingReviewed,
    acceptProposedTargets
  };
};

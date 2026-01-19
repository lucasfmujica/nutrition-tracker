import { useCallback } from 'react';
import { addDaysToDate, formatTime } from '../utils/dateUtils';
import { storage } from '../utils/storage';

/**
 * useTrackerActions - Action wrappers and helper functions
 *
 * Provides wrapper functions for common tracker actions and utility helpers.
 * Keeps TrackerContext clean by delegating to domain-specific hooks.
 *
 * @param {Object} params - Dependencies
 * @returns {Object} Action functions and helpers
 */
export const useTrackerActions = ({
  nutrition,
  biometrics,
  workouts,
  trackerSync
}) => {
  // Config update wrapper
  const updateConfig = useCallback(async (newProfile, newTargets) => {
    // Optimistic update
    biometrics.setProfile(newProfile);
    biometrics.setCustomTargets(newTargets);

    // Save to storage/cloud
    try {
      if (newProfile !== biometrics.profile) await biometrics.saveProfile(newProfile);
      if (newTargets !== biometrics.customTargets) await biometrics.saveTargets(newTargets);
    } catch (err) {
      console.error('Error updating config:', err);
      // Revert on error? For now just log
    }
  }, [biometrics]);

  // Water actions with status updates
  const addWaterGlass = useCallback(async (date) => {
    const msg = await nutrition.addWaterGlass(date);
    if (msg) trackerSync.setSaveStatus(msg);
  }, [nutrition, trackerSync]);

  const removeWaterGlass = useCallback(async (date) => {
    const msg = await nutrition.removeWaterGlass(date);
    if (msg) trackerSync.setSaveStatus(msg);
  }, [nutrition, trackerSync]);

  // Helper functions
  const getWorkoutsForDate = useCallback((date) => {
    return workouts.workoutLog.filter(entry => entry.date === date);
  }, [workouts.workoutLog]);

  const getStepsForDate = useCallback((date) => {
    return biometrics.stepsLog.find(s => s.date === date)?.steps || 0;
  }, [biometrics.stepsLog]);

  const changeDate = useCallback((dateStr, delta) => {
    return addDaysToDate(dateStr, delta);
  }, []);

  return {
    updateConfig,
    addWaterGlass,
    removeWaterGlass,
    getWorkoutsForDate,
    getStepsForDate,
    changeDate,
    formatTime,
    storage
  };
};

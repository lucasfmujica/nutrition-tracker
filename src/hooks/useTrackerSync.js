import { useEffect, useRef, useState } from 'react';
import { clearCache, clearPendingWrites } from '../utils/storageUtils';
import { useInitialHydration } from './supabase/useInitialHydration';
import { useVaultWorker } from './supabase/useVaultWorker';

/**
 * useTrackerSync - Lightweight orchestrator for tracker data synchronization
 *
 * RESPONSIBILITY: High-level coordination of sync operations
 * - Manages auth state and UI visibility
 * - Delegates queue processing to useVaultWorker
 * - Delegates data loading to useInitialHydration
 * - Handles refresh and logout flows
 *
 * This hook has been refactored from 420 lines to ~180 lines by extracting:
 * - Queue processing → useVaultWorker
 * - Data loading → useInitialHydration
 */
export const useTrackerSync = ({
  supabase, // Dependency injected
  useCloud, // ← CRITICAL FIX: Receive unified useCloud from parent
  offlineMode,
  setOfflineMode,
  setProfile,
  setCustomTargets,
  setWeightHistory,
  setFoodLog,
  setWorkoutLog,
  setStepsLog,
  setOuraLog,
  setWaterLog,
  // Data needed for forceSync
  foodLog,
  workoutLog,
  stepsLog,
  ouraLog,
  waterLog,
  weightHistory
}) => {
  const [showAuth, setShowAuth] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasInitialized = useRef(false);

  // NOTE: useCloud is now passed from TrackerContext (single source of truth)

  // Vault Worker: Handles queue processing and auto-trigger
  const { processPendingQueue } = useVaultWorker({
    supabase,
    useCloud,
    isOnline: supabase.isOnline,
    isAuthenticated: supabase.isAuthenticated,
    offlineMode,
    setProfile,
    setCustomTargets,
    setWeightHistory,
    setFoodLog,
    setWorkoutLog,
    setStepsLog,
    setOuraLog,
    setWaterLog
  });

  // Initial Hydration: Handles data loading from cache and Supabase
  useInitialHydration({
    supabase,
    showAuth,
    offlineMode,
    hasInitialized,
    setProfile,
    setCustomTargets,
    setWeightHistory,
    setFoodLog,
    setWorkoutLog,
    setStepsLog,
    setOuraLog,
    setWaterLog,
    setIsLoading,
    setSaveStatus,
    setShowOnboarding
  });

  // Handle auth state changes
  useEffect(() => {
    if (supabase.loading) return;

    if (supabase.isAuthenticated) {
      console.log('[Auth] User authenticated, hiding auth screen');
      setShowAuth(false);
    } else {
      console.log('[Auth] User not authenticated, showing auth screen');
      setShowAuth(true);
      setIsLoading(false); // Stop loading so AuthUI can be shown
      hasInitialized.current = false;
    }
  }, [supabase.loading, supabase.isAuthenticated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (useCloud) {
        const data = await supabase.fetchAllData();
        if (data) {
          // Supabase is source of truth - always sync (even empty arrays)
          if (data.profile) setProfile(data.profile);
          if (data.targets) setCustomTargets(data.targets);
          if (data.weightHistory !== undefined) setWeightHistory(data.weightHistory);
          if (data.foodLog !== undefined) setFoodLog(data.foodLog);
          if (data.workouts !== undefined) setWorkoutLog(data.workouts);
          if (data.stepsLog !== undefined) setStepsLog(data.stepsLog);
          if (data.ouraLog !== undefined) setOuraLog(data.ouraLog);
          if (data.waterLog !== undefined) setWaterLog(data.waterLog);
          setSaveStatus('✓ Actualizado');
          console.log('[handleRefresh] Data updated successfully');
        } else {
          setSaveStatus('Error al actualizar');
        }
      } else {
        console.log('[handleRefresh] useCloud is false, skipping fetch');
      }
    } catch (err) {
      console.error('[TrackerSync] Refresh error:', err);
      setSaveStatus('Error al actualizar');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      hasInitialized.current = false;
      setOfflineMode(false);
      setIsLoading(false);

      await clearCache();
      await clearPendingWrites(); // CRITICAL: Prevent cross-user data corruption

      // Reset state (setters)
      setProfile({ height: 173, currentWeight: 84.9, targetWeight: 75, age: 27, activityLevel: 'moderate', goal: 'cut' });
      setCustomTargets({ calories: 2100, protein: 170, carbs: 180, fat: 70, fiber: 30, trainingDayCaloriesBonus: 200, trainingDayCarbs: 220 });
      setWeightHistory([]);
      setFoodLog([]);
      setWorkoutLog([]);
      setStepsLog([]);
      setOuraLog([]);
      setWaterLog([]);

      await supabase.signOut();
      setShowAuth(true);
    } catch (err) {
      console.error('Logout error:', err);
      setShowAuth(true);
    }
  };

  return {
    showAuth, setShowAuth,
    showOnboarding, setShowOnboarding,
    offlineMode, setOfflineMode, // Passed through from TrackerContext
    isLoading, setIsLoading,
    saveStatus, setSaveStatus,
    isRefreshing, handleRefresh,
    // useCloud removed - now managed in TrackerContext as single source of truth
    processPendingQueue, // The Vault auto-recovery worker
    handleLogout
  };
};

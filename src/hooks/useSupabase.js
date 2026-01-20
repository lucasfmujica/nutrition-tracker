import { useCallback, useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useActivityData } from './supabase/useActivityData';
import { useNutritionData } from './supabase/useNutritionData';
import { useProfileData } from './supabase/useProfileData';
import { useSupabaseAuth } from './supabase/useSupabaseAuth';
import { useSupabaseOperation } from './supabase/useSupabaseOperation';
import { useTemplateData } from './supabase/useTemplateData';
import { useWeightData } from './supabase/useWeightData';

/**
 * Custom hook for Supabase authentication and data operations
 * Acts as a Facade combining all domain-specific hooks.
 */
export function useSupabase() {
  // Phase 2: Auth Logic
  const {
    user,
    loading: authLoading,
    authError,
    isOnline,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    ensureProfileExists
  } = useSupabaseAuth();

  // Shared Operation State
  const {
    syncStatus,
    syncError,
    lastSyncTime,
    setSyncStatus,
    setSyncError,
    setLastSyncTime
  } = useSupabaseOperation();

  // Phase 3 & 4: Domain Hooks
  const {
    fetchProfile,
    saveProfile,
    saveOnboardingProfile,
    checkNeedsOnboarding
  } = useProfileData(user, isOnline, ensureProfileExists);

  const {
    fetchFoodLog,
    saveFood,
    deleteFood,
    fetchWaterLog,
    saveWater
  } = useNutritionData(user, isOnline);

  const {
    fetchWeightHistory,
    saveWeight,
    deleteWeight
  } = useWeightData(user, isOnline);

  const {
    fetchWorkouts,
    saveWorkout,
    deleteWorkout,
    fetchStepsLog,
    saveSteps,
    fetchOuraLog,
    saveOura
  } = useActivityData(user, isOnline);

  const {
    fetchTemplates,
    saveTemplate,
    deleteTemplate: deleteTemplateDb
  } = useTemplateData(user, isOnline);

  // Legacy loading state compatibility
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(authLoading);
  }, [authLoading]);

  // Real-time subscriptions
  const subscriptionsRef = useRef([]);
  const [realtimeCallbacks, setRealtimeCallbacks] = useState({});
  const canUseSupabase = isSupabaseConfigured() && user && isOnline;

  useEffect(() => {
    if (!canUseSupabase) {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
      return;
    }

    const tables = ['profiles', 'weight_history', 'food_log', 'workouts', 'steps_log', 'oura_log', 'meal_templates'];

    tables.forEach(table => {
      const channel = supabase
        .channel(`${table}_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (realtimeCallbacks[table]) {
              realtimeCallbacks[table](payload);
            }
          }
        )
        .subscribe();

      subscriptionsRef.current.push(channel);
    });

    return () => {
      subscriptionsRef.current.forEach(sub => supabase.removeChannel(sub));
      subscriptionsRef.current = [];
    };
  }, [canUseSupabase, user?.id, realtimeCallbacks]);

  const onRealtimeUpdate = useCallback((table, callback) => {
    setRealtimeCallbacks(prev => ({ ...prev, [table]: callback }));
  }, []);

  // Fetch All Data Orchestrator (CRITICAL FIX: Resilient parallel fetch)
  const fetchAllData = useCallback(async () => {
    if (!canUseSupabase) {
      setSyncStatus('idle');
      return null;
    }

    setSyncStatus(prev => prev === 'syncing' ? prev : 'syncing');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout after 45s')), 45000)
    );

    try {
      // CRITICAL FIX: Use Promise.allSettled instead of Promise.all
      // This ensures that if one source fails (e.g., Oura), others still load
      const fetchPromise = Promise.allSettled([
        fetchProfile(),
        fetchWeightHistory(),
        fetchFoodLog(),
        fetchWorkouts(),
        fetchStepsLog(),
        fetchOuraLog(),
        fetchWaterLog(),
        fetchTemplates(),
      ]);

      const results = await Promise.race([fetchPromise, timeoutPromise]);

      // Extract successful results and log failures
      const [profileResult, weightResult, foodResult, workoutsResult, stepsResult, ouraResult, waterResult, templateResult] = results;

      // Helper to extract value or return fallback
      const getValue = (result, fallback, name) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn(`[Supabase] ${name} fetch failed:`, result.reason?.message || result.reason);
          return fallback;
        }
      };

      const profileData = getValue(profileResult, null, 'Profile');
      const weightHistory = getValue(weightResult, [], 'Weight History');
      const foodLog = getValue(foodResult, [], 'Food Log');
      const workouts = getValue(workoutsResult, [], 'Workouts');
      const stepsLog = getValue(stepsResult, [], 'Steps Log');
      const ouraLog = getValue(ouraResult, [], 'Oura Log');
      const waterLog = getValue(waterResult, [], 'Water Log');
      const mealTemplates = getValue(templateResult, [], 'Meal Templates');

      // Count failures for logging
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        console.warn(`[Supabase] fetchAllData: ${failedCount}/${results.length} sources failed, but proceeding with partial data`);
      }

      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 1500);

      return {
        profile: profileData?.profile,
        targets: profileData?.targets,
        weightHistory,
        foodLog,
        workouts,
        stepsLog,
        ouraLog,
        waterLog,
        mealTemplates,
      };
    } catch (err) {
      console.error('[Supabase] fetchAllData error:', err);
      setSyncStatus('error');
      setSyncError(err.message);
      setTimeout(() => setSyncStatus('idle'), 2000);
      return null;
    }
  }, [
    canUseSupabase,
    user?.id,
    setSyncStatus,
    setSyncError,
    setLastSyncTime,
    fetchProfile,
    fetchWeightHistory,
    fetchFoodLog,
    fetchWorkouts,
    fetchStepsLog,
    fetchOuraLog,
    fetchWaterLog,
    fetchTemplates
  ]);

  return {
    user,
    loading,
    authError,
    isAuthenticated,
    isSupabaseConfigured: isSupabaseConfigured(),
    isOnline,
    syncStatus,
    syncError,
    lastSyncTime,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    fetchProfile,
    saveProfile,
    saveOnboardingProfile,
    checkNeedsOnboarding,
    fetchWeightHistory,
    saveWeight,
    deleteWeight,
    fetchFoodLog,
    saveFood,
    deleteFood,
    fetchWorkouts,
    saveWorkout,
    deleteWorkout,
    fetchStepsLog,
    saveSteps,
    fetchOuraLog,
    saveOura,
    fetchWaterLog,
    saveWater,
    fetchTemplates,
    saveTemplate,
    deleteTemplateDb,
    fetchAllData,
    onRealtimeUpdate,
  };
}

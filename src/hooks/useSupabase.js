import { useCallback, useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useActivityData } from './supabase/useActivityData';
import { useMigration } from './supabase/useMigration';
import { useNutritionData } from './supabase/useNutritionData';
import { useProfileData } from './supabase/useProfileData';
import { useSupabaseAuth } from './supabase/useSupabaseAuth';
import { useSupabaseOperation } from './supabase/useSupabaseOperation';
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
    migrateLocalStorageToSupabase,
    checkLocalStorageForMigration,
    clearMigratedLocalStorage
  } = useMigration(user, isOnline);

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

    const tables = ['profiles', 'weight_history', 'food_log', 'workouts', 'steps_log', 'oura_log'];

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
            console.log(`Real-time update on ${table}:`, payload.eventType);
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

  // Fetch All Data Orchestrator
  const fetchAllData = useCallback(async () => {
    if (!canUseSupabase) {
      console.log('[Supabase] fetchAllData: cannot use Supabase');
      setSyncStatus('idle');
      return null;
    }

    setSyncStatus(prev => prev === 'syncing' ? prev : 'syncing');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout after 45s')), 45000)
    );

    try {
      console.log('[Supabase] fetchAllData: starting for user:', user?.id);

      const fetchPromise = Promise.all([
        fetchProfile().catch(err => { console.warn('[Supabase] Profile fetch failed:', err.message); return null; }),
        fetchWeightHistory().catch(err => { console.warn('[Supabase] Weight fetch failed:', err.message); return []; }),
        fetchFoodLog().catch(err => { console.warn('[Supabase] Food fetch failed:', err.message); return []; }),
        fetchWorkouts().catch(err => { console.warn('[Supabase] Workouts fetch failed:', err.message); return []; }),
        fetchStepsLog().catch(err => { console.warn('[Supabase] Steps fetch failed:', err.message); return []; }),
        fetchOuraLog().catch(err => { console.warn('[Supabase] Oura fetch failed:', err.message); return []; }),
        fetchWaterLog().catch(err => { console.warn('[Supabase] Water fetch failed:', err.message); return []; }),
      ]);

      const [profileData, weightHistory, foodLog, workouts, stepsLog, ouraLog, waterLog] =
        await Promise.race([fetchPromise, timeoutPromise]);

      console.log('[Supabase] fetchAllData: completed successfully');
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
    fetchWaterLog
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
    fetchAllData,
    migrateLocalStorageToSupabase,
    checkLocalStorageForMigration,
    clearMigratedLocalStorage,
    onRealtimeUpdate,
  };
}

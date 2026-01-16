import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mappers } from '../lib/database.types';

/**
 * Custom hook for Supabase authentication and data operations
 * Falls back to localStorage when not authenticated or Supabase is unavailable
 */
export function useSupabase() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check if we can use Supabase
  const canUseSupabase = isSupabaseConfigured() && user;

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // =====================================================
  // AUTH METHODS
  // =====================================================

  const signUp = async (email, password) => {
    if (!isSupabaseConfigured()) {
      setAuthError('Supabase not configured');
      return { error: { message: 'Supabase not configured' } };
    }
    
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      setAuthError(error.message);
    }
    return { data, error };
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) {
      setAuthError('Supabase not configured');
      return { error: { message: 'Supabase not configured' } };
    }

    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setAuthError(error.message);
    }
    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
    return { error };
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  // =====================================================
  // PROFILE OPERATIONS
  // =====================================================

  const fetchProfile = useCallback(async () => {
    if (!canUseSupabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return {
      profile: mappers.profileFromDb(data),
      targets: mappers.targetsFromDb(data),
    };
  }, [canUseSupabase, user?.id]);

  const saveProfile = useCallback(async (profile, targets) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        ...mappers.profileToDb(profile, user.id),
        ...mappers.targetsToDb(targets),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) console.error('Error saving profile:', error);
    return { error };
  }, [canUseSupabase, user?.id]);

  // =====================================================
  // WEIGHT HISTORY OPERATIONS
  // =====================================================

  const fetchWeightHistory = useCallback(async () => {
    if (!canUseSupabase) return [];

    const { data, error } = await supabase
      .from('weight_history')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching weight history:', error);
      return [];
    }

    return data.map(mappers.weightFromDb);
  }, [canUseSupabase, user?.id]);

  const saveWeight = useCallback(async (entry) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('weight_history')
      .upsert(mappers.weightToDb(entry, user.id), {
        onConflict: 'user_id,date',
      })
      .select()
      .single();

    if (error) console.error('Error saving weight:', error);
    return { data: data ? mappers.weightFromDb(data) : null, error };
  }, [canUseSupabase, user?.id]);

  const deleteWeight = useCallback(async (id) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('weight_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) console.error('Error deleting weight:', error);
    return { error };
  }, [canUseSupabase, user?.id]);

  // =====================================================
  // FOOD LOG OPERATIONS
  // =====================================================

  const fetchFoodLog = useCallback(async () => {
    if (!canUseSupabase) return [];

    const { data, error } = await supabase
      .from('food_log')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching food log:', error);
      return [];
    }

    return data.map(mappers.foodFromDb);
  }, [canUseSupabase, user?.id]);

  const saveFood = useCallback(async (entry) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    // Check if entry has an id (update) or not (insert)
    const isUpdate = entry.id && !entry.id.startsWith('f-');
    
    if (isUpdate) {
      const { data, error } = await supabase
        .from('food_log')
        .update(mappers.foodToDb(entry, user.id))
        .eq('id', entry.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) console.error('Error updating food:', error);
      return { data: data ? mappers.foodFromDb(data) : null, error };
    } else {
      const { data, error } = await supabase
        .from('food_log')
        .insert(mappers.foodToDb(entry, user.id))
        .select()
        .single();

      if (error) console.error('Error saving food:', error);
      return { data: data ? mappers.foodFromDb(data) : null, error };
    }
  }, [canUseSupabase, user?.id]);

  const deleteFood = useCallback(async (id) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('food_log')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) console.error('Error deleting food:', error);
    return { error };
  }, [canUseSupabase, user?.id]);

  // =====================================================
  // WORKOUT OPERATIONS
  // =====================================================

  const fetchWorkouts = useCallback(async () => {
    if (!canUseSupabase) return [];

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }

    return data.map(mappers.workoutFromDb);
  }, [canUseSupabase, user?.id]);

  const saveWorkout = useCallback(async (entry) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    const isUpdate = entry.id && !entry.id.startsWith('w');
    
    if (isUpdate) {
      const { data, error } = await supabase
        .from('workouts')
        .update(mappers.workoutToDb(entry, user.id))
        .eq('id', entry.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) console.error('Error updating workout:', error);
      return { data: data ? mappers.workoutFromDb(data) : null, error };
    } else {
      const { data, error } = await supabase
        .from('workouts')
        .insert(mappers.workoutToDb(entry, user.id))
        .select()
        .single();

      if (error) console.error('Error saving workout:', error);
      return { data: data ? mappers.workoutFromDb(data) : null, error };
    }
  }, [canUseSupabase, user?.id]);

  const deleteWorkout = useCallback(async (id) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) console.error('Error deleting workout:', error);
    return { error };
  }, [canUseSupabase, user?.id]);

  // =====================================================
  // STEPS LOG OPERATIONS
  // =====================================================

  const fetchStepsLog = useCallback(async () => {
    if (!canUseSupabase) return [];

    const { data, error } = await supabase
      .from('steps_log')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching steps:', error);
      return [];
    }

    return data.map(mappers.stepsFromDb);
  }, [canUseSupabase, user?.id]);

  const saveSteps = useCallback(async (entry) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('steps_log')
      .upsert(mappers.stepsToDb(entry, user.id), {
        onConflict: 'user_id,date',
      })
      .select()
      .single();

    if (error) console.error('Error saving steps:', error);
    return { data: data ? mappers.stepsFromDb(data) : null, error };
  }, [canUseSupabase, user?.id]);

  // =====================================================
  // OURA LOG OPERATIONS
  // =====================================================

  const fetchOuraLog = useCallback(async () => {
    if (!canUseSupabase) return [];

    const { data, error } = await supabase
      .from('oura_log')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching oura log:', error);
      return [];
    }

    return data.map(mappers.ouraFromDb);
  }, [canUseSupabase, user?.id]);

  const saveOura = useCallback(async (entry) => {
    if (!canUseSupabase) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('oura_log')
      .upsert(mappers.ouraToDb(entry, user.id), {
        onConflict: 'user_id,date',
      })
      .select()
      .single();

    if (error) console.error('Error saving oura data:', error);
    return { data: data ? mappers.ouraFromDb(data) : null, error };
  }, [canUseSupabase, user?.id]);

  // =====================================================
  // FETCH ALL DATA (for initial load)
  // =====================================================

  const fetchAllData = useCallback(async () => {
    if (!canUseSupabase) return null;

    const [profileData, weightHistory, foodLog, workouts, stepsLog, ouraLog] = await Promise.all([
      fetchProfile(),
      fetchWeightHistory(),
      fetchFoodLog(),
      fetchWorkouts(),
      fetchStepsLog(),
      fetchOuraLog(),
    ]);

    return {
      profile: profileData?.profile,
      targets: profileData?.targets,
      weightHistory,
      foodLog,
      workouts,
      stepsLog,
      ouraLog,
    };
  }, [canUseSupabase, fetchProfile, fetchWeightHistory, fetchFoodLog, fetchWorkouts, fetchStepsLog, fetchOuraLog]);

  return {
    // Auth state
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isSupabaseConfigured: isSupabaseConfigured(),

    // Auth methods
    signUp,
    signIn,
    signOut,
    resetPassword,

    // Profile
    fetchProfile,
    saveProfile,

    // Weight
    fetchWeightHistory,
    saveWeight,
    deleteWeight,

    // Food
    fetchFoodLog,
    saveFood,
    deleteFood,

    // Workouts
    fetchWorkouts,
    saveWorkout,
    deleteWorkout,

    // Steps
    fetchStepsLog,
    saveSteps,

    // Oura
    fetchOuraLog,
    saveOura,

    // Bulk operations
    fetchAllData,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { mappers } from '../lib/database.types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

/**
 * Custom hook for Supabase authentication and data operations
 * Falls back to localStorage when not authenticated or Supabase is unavailable
 * 
 * Prompt 3 Features:
 * - Loading states and sync indicators
 * - Error handling and offline detection
 * - localStorage to Supabase migration
 */
export function useSupabase() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Prompt 3: Enhanced state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Check if we can use Supabase
  const canUseSupabase = isSupabaseConfigured() && user && isOnline;

  // Prompt 3: Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
      async (_event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        // If user just logged in, ensure profile exists
        if (newUser && _event === 'SIGNED_IN') {
          await ensureProfileExists(newUser.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // =====================================================
  // HELPER: Ensure profile exists (fixes trigger issue)
  // =====================================================
  const ensureProfileExists = async (userId) => {
    if (!isSupabaseConfigured()) return;

    try {
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating profile for user:', userId);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: userId });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
    } catch (err) {
      console.error('Error checking profile:', err);
    }
  };

  // =====================================================
  // AUTH METHODS
  // =====================================================

  const signUp = async (email, password) => {
    if (!isSupabaseConfigured()) {
      setAuthError('Supabase not configured');
      return { error: { message: 'Supabase not configured' } };
    }

    if (!isOnline) {
      setAuthError('No hay conexión a internet');
      return { error: { message: 'No hay conexión a internet' } };
    }

    setAuthError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return { data, error };
      }

      // If signup successful and user confirmed (or auto-confirm enabled)
      if (data.user && !data.user.email_confirmed_at) {
        // User needs to confirm email
        setLoading(false);
        return { data, error: null, needsConfirmation: true };
      }

      // Create profile manually if trigger didn't work
      if (data.user) {
        await ensureProfileExists(data.user.id);
      }

      setLoading(false);
      return { data, error };
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      return { error: err };
    }
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) {
      setAuthError('Supabase not configured');
      return { error: { message: 'Supabase not configured' } };
    }

    if (!isOnline) {
      setAuthError('No hay conexión a internet');
      return { error: { message: 'No hay conexión a internet' } };
    }

    setAuthError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        // Ensure profile exists
        await ensureProfileExists(data.user.id);
      }

      setLoading(false);
      return { data, error };
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      return { error: err };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) return { error: null };

    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
    setLoading(false);
    setSyncStatus('idle');
    setLastSyncTime(null);
    return { error };
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    if (!isOnline) {
      return { error: { message: 'No hay conexión a internet' } };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  // =====================================================
  // PROMPT 3: Sync wrapper with error handling
  // =====================================================
  const withSync = async (operation, errorMessage = 'Error de sincronización') => {
    if (!canUseSupabase) {
      return { data: null, error: 'Not authenticated or offline' };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const result = await operation();
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
      // Reset to idle after showing success
      setTimeout(() => setSyncStatus('idle'), 2000);
      
      return result;
    } catch (err) {
      console.error(errorMessage, err);
      setSyncStatus('error');
      setSyncError(err.message || errorMessage);
      return { data: null, error: err };
    }
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
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        await ensureProfileExists(user.id);
        // Retry fetch
        const { data: retryData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (retryData) {
          return {
            profile: mappers.profileFromDb(retryData),
            targets: mappers.targetsFromDb(retryData),
          };
        }
      }
      console.error('Error fetching profile:', error);
      return null;
    }

    return {
      profile: mappers.profileFromDb(data),
      targets: mappers.targetsFromDb(data),
    };
  }, [canUseSupabase, user?.id]);

  const saveProfile = useCallback(async (profile, targets) => {
    return withSync(async () => {
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

      if (error) throw error;
      return { error: null };
    }, 'Error guardando perfil');
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
    return withSync(async () => {
      const { data, error } = await supabase
        .from('weight_history')
        .upsert(mappers.weightToDb(entry, user.id), {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mappers.weightFromDb(data) : null, error: null };
    }, 'Error guardando peso');
  }, [canUseSupabase, user?.id]);

  const deleteWeight = useCallback(async (id) => {
    return withSync(async () => {
      const { error } = await supabase
        .from('weight_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    }, 'Error eliminando peso');
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
    return withSync(async () => {
      // Check if entry has a UUID (update) or local ID (insert)
      const isUpdate = entry.id && !entry.id.startsWith('f-');

      if (isUpdate) {
        const { data, error } = await supabase
          .from('food_log')
          .update(mappers.foodToDb(entry, user.id))
          .eq('id', entry.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.foodFromDb(data) : null, error: null };
      } else {
        const { data, error } = await supabase
          .from('food_log')
          .insert(mappers.foodToDb(entry, user.id))
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.foodFromDb(data) : null, error: null };
      }
    }, 'Error guardando comida');
  }, [canUseSupabase, user?.id]);

  const deleteFood = useCallback(async (id) => {
    return withSync(async () => {
      const { error } = await supabase
        .from('food_log')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    }, 'Error eliminando comida');
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
    return withSync(async () => {
      const isUpdate = entry.id && !entry.id.startsWith('w');

      if (isUpdate) {
        const { data, error } = await supabase
          .from('workouts')
          .update(mappers.workoutToDb(entry, user.id))
          .eq('id', entry.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.workoutFromDb(data) : null, error: null };
      } else {
        const { data, error } = await supabase
          .from('workouts')
          .insert(mappers.workoutToDb(entry, user.id))
          .select()
          .single();

        if (error) throw error;
        return { data: data ? mappers.workoutFromDb(data) : null, error: null };
      }
    }, 'Error guardando entreno');
  }, [canUseSupabase, user?.id]);

  const deleteWorkout = useCallback(async (id) => {
    return withSync(async () => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    }, 'Error eliminando entreno');
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
    return withSync(async () => {
      const { data, error } = await supabase
        .from('steps_log')
        .upsert(mappers.stepsToDb(entry, user.id), {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mappers.stepsFromDb(data) : null, error: null };
    }, 'Error guardando pasos');
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
    return withSync(async () => {
      const { data, error } = await supabase
        .from('oura_log')
        .upsert(mappers.ouraToDb(entry, user.id), {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mappers.ouraFromDb(data) : null, error: null };
    }, 'Error guardando datos Oura');
  }, [canUseSupabase, user?.id]);

  // =====================================================
  // FETCH ALL DATA (for initial load)
  // =====================================================

  const fetchAllData = useCallback(async () => {
    if (!canUseSupabase) return null;

    setSyncStatus('syncing');

    try {
      const [profileData, weightHistory, foodLog, workouts, stepsLog, ouraLog] = await Promise.all([
        fetchProfile(),
        fetchWeightHistory(),
        fetchFoodLog(),
        fetchWorkouts(),
        fetchStepsLog(),
        fetchOuraLog(),
      ]);

      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 2000);

      return {
        profile: profileData?.profile,
        targets: profileData?.targets,
        weightHistory,
        foodLog,
        workouts,
        stepsLog,
        ouraLog,
      };
    } catch (err) {
      console.error('Error fetching all data:', err);
      setSyncStatus('error');
      setSyncError(err.message);
      return null;
    }
  }, [canUseSupabase, fetchProfile, fetchWeightHistory, fetchFoodLog, fetchWorkouts, fetchStepsLog, fetchOuraLog]);

  // =====================================================
  // PROMPT 3: Migrate localStorage data to Supabase
  // =====================================================
  const migrateLocalStorageToSupabase = useCallback(async (localData) => {
    if (!canUseSupabase) {
      return { success: false, error: 'Not authenticated' };
    }

    setSyncStatus('syncing');
    const errors = [];

    try {
      // Migrate profile and targets
      if (localData.profile || localData.targets) {
        const { error } = await saveProfile(
          localData.profile || {},
          localData.targets || {}
        );
        if (error) errors.push('profile');
      }

      // Migrate weight history
      if (localData.weightHistory?.length > 0) {
        for (const entry of localData.weightHistory) {
          try {
            await supabase
              .from('weight_history')
              .upsert(mappers.weightToDb(entry, user.id), {
                onConflict: 'user_id,date',
              });
          } catch (e) {
            errors.push(`weight-${entry.date}`);
          }
        }
      }

      // Migrate food log
      if (localData.foodLog?.length > 0) {
        for (const entry of localData.foodLog) {
          try {
            await supabase
              .from('food_log')
              .insert(mappers.foodToDb(entry, user.id));
          } catch (e) {
            // Might be duplicate, try upsert by date+time+meal
            errors.push(`food-${entry.id}`);
          }
        }
      }

      // Migrate workouts
      if (localData.workouts?.length > 0) {
        for (const entry of localData.workouts) {
          try {
            await supabase
              .from('workouts')
              .insert(mappers.workoutToDb(entry, user.id));
          } catch (e) {
            errors.push(`workout-${entry.id}`);
          }
        }
      }

      // Migrate steps
      if (localData.stepsLog?.length > 0) {
        for (const entry of localData.stepsLog) {
          try {
            await supabase
              .from('steps_log')
              .upsert(mappers.stepsToDb(entry, user.id), {
                onConflict: 'user_id,date',
              });
          } catch (e) {
            errors.push(`steps-${entry.date}`);
          }
        }
      }

      // Migrate Oura data
      if (localData.ouraLog?.length > 0) {
        for (const entry of localData.ouraLog) {
          try {
            await supabase
              .from('oura_log')
              .upsert(mappers.ouraToDb(entry, user.id), {
                onConflict: 'user_id,date',
              });
          } catch (e) {
            errors.push(`oura-${entry.date}`);
          }
        }
      }

      setSyncStatus('success');
      setLastSyncTime(new Date());

      if (errors.length > 0) {
        console.warn('Some items failed to migrate:', errors);
        return { success: true, partialErrors: errors };
      }

      return { success: true };
    } catch (err) {
      console.error('Migration error:', err);
      setSyncStatus('error');
      setSyncError(err.message);
      return { success: false, error: err.message };
    }
  }, [canUseSupabase, user?.id, saveProfile]);

  // =====================================================
  // PROMPT 3: Check if localStorage has data to migrate
  // =====================================================
  const checkLocalStorageForMigration = useCallback(() => {
    const keys = [
      'lucas-profile-v5',
      'lucas-weight-history-v5',
      'lucas-food-log-v5',
      'lucas-workout-log-v5',
      'lucas-steps-log-v5',
      'lucas-targets-v5',
      'lucas-oura-log-v5'
    ];

    let hasData = false;
    const localData = {};

    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        hasData = true;
        try {
          const parsed = JSON.parse(value);
          // Map keys to our structure
          if (key.includes('profile')) localData.profile = parsed;
          if (key.includes('targets')) localData.targets = parsed;
          if (key.includes('weight')) localData.weightHistory = parsed;
          if (key.includes('food')) localData.foodLog = parsed;
          if (key.includes('workout')) localData.workouts = parsed;
          if (key.includes('steps')) localData.stepsLog = parsed;
          if (key.includes('oura')) localData.ouraLog = parsed;
        } catch (e) {
          console.error('Error parsing localStorage:', key, e);
        }
      }
    }

    return { hasData, localData };
  }, []);

  // =====================================================
  // PROMPT 3: Clear localStorage after successful migration
  // =====================================================
  const clearMigratedLocalStorage = useCallback(() => {
    const keys = [
      'lucas-profile-v5',
      'lucas-weight-history-v5',
      'lucas-food-log-v5',
      'lucas-workout-log-v5',
      'lucas-steps-log-v5',
      'lucas-targets-v5',
      'lucas-oura-log-v5'
    ];

    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, []);

  return {
    // Auth state
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isSupabaseConfigured: isSupabaseConfigured(),

    // Prompt 3: Enhanced state
    isOnline,
    syncStatus,
    syncError,
    lastSyncTime,

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

    // Prompt 3: Migration
    migrateLocalStorageToSupabase,
    checkLocalStorageForMigration,
    clearMigratedLocalStorage,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { mappers } from '../lib/database.types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

/**
 * Custom hook for Supabase authentication and data operations
 *
 * Features:
 * - Prompt 2: Auth + CRUD operations
 * - Prompt 3: Loading states, error handling, offline detection, migration
 * - Prompt 4: Real-time sync, optimistic updates
 */
export function useSupabase() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Prompt 3: Enhanced state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Prompt 4: Real-time subscriptions
  const subscriptionsRef = useRef([]);
  const [realtimeCallbacks, setRealtimeCallbacks] = useState({});

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

  // Initialize auth state with timeout protection
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log('[Auth] Supabase not configured, running offline');
      setLoading(false);
      return;
    }

    let mounted = true;
    let timeoutId = null;
    let authResolved = false; // Track if we already resolved auth

    const resolveAuth = (source) => {
      if (authResolved) return;
      authResolved = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      console.log(`[Auth] Auth resolved via: ${source}`);
      setLoading(false);
    };

    // Timeout safety: never hang more than 5 seconds
    timeoutId = setTimeout(() => {
      if (mounted && !authResolved) {
        console.warn('[Auth] Session check timed out, proceeding without auth');
        resolveAuth('timeout');
      }
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted) {
        if (error) {
          console.error('[Auth] Session retrieval error:', error);
          // Clear potentially corrupted session
          supabase.auth.signOut({ scope: 'local' });
          setUser(null);
        } else {
          console.log('[Auth] Session check complete, user:', session?.user?.email);
          setUser(session?.user ?? null);
        }
        resolveAuth('getSession');
      }
    }).catch((err) => {
      if (mounted) {
        console.error('[Auth] Session check failed:', err);
        // Clear potentially corrupted session
        supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        resolveAuth('getSession-error');
      }
    });

    // Listen for auth changes - this can fire BEFORE getSession completes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        const newUser = session?.user ?? null;
        console.log('[Auth] Auth state changed:', _event, newUser?.email);
        setUser(newUser);

        // If we get a valid auth event, resolve loading immediately
        if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'INITIAL_SESSION' || _event === 'SIGNED_OUT') {
          resolveAuth(`onAuthStateChange-${_event}`);
        }

        // If user just logged in, ensure profile exists
        if (newUser && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
          await ensureProfileExists(newUser.id);
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // Prompt 4: Real-time subscriptions setup
  // =====================================================
  useEffect(() => {
    if (!canUseSupabase) {
      // Cleanup subscriptions when user logs out
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
      return;
    }

    // Setup real-time subscriptions for all tables
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
            // Call registered callback if exists
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
  }, [canUseSupabase, user?.id]);

  // Register callback for real-time updates
  const onRealtimeUpdate = useCallback((table, callback) => {
    setRealtimeCallbacks(prev => ({ ...prev, [table]: callback }));
  }, []);

  // =====================================================
  // HELPER: Ensure profile exists (app-side, no trigger)
  // =====================================================
  const ensureProfileExists = async (userId) => {
    if (!isSupabaseConfigured()) return { success: false };

    try {
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!data && !error) {
        // Profile doesn't exist, create it
        console.log('Creating profile for user:', userId);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: userId });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return { success: false, error: insertError };
        }
        return { success: true, created: true };
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
        return { success: false, error };
      }

      return { success: true, exists: true };
    } catch (err) {
      console.error('Error in ensureProfileExists:', err);
      return { success: false, error: err };
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
      // Sign up without trying to create profile - that happens on SIGNED_IN
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This helps with the confirmation flow
          emailRedirectTo: window.location.origin,
        }
      });

      setLoading(false);

      if (error) {
        setAuthError(error.message);
        return { data, error };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // No session = needs email confirmation
        return { data, error: null, needsConfirmation: true };
      }

      // If we have a session, user is logged in (auto-confirm enabled)
      // Profile will be created by the onAuthStateChange handler
      return { data, error: null };
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

      setLoading(false);

      if (error) {
        setAuthError(error.message);
        return { data, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[useSupabase] signIn error:', err);
      setAuthError(err.message);
      setLoading(false);
      return { error: { message: err.message || 'Error de autenticación' } };
    }
  };

  const signOut = async () => {
    console.log('[Auth] signOut called');

    // Immediately reset all state - don't wait for Supabase
    setUser(null);
    setSyncStatus('idle');
    setLastSyncTime(null);
    setSyncError(null);
    setAuthError(null);

    if (!isSupabaseConfigured()) {
      console.log('[Auth] Supabase not configured, signOut complete');
      return { error: null };
    }

    try {
      // Clear subscriptions first
      subscriptionsRef.current.forEach(sub => {
        try { supabase.removeChannel(sub); } catch (e) { /* ignore */ }
      });
      subscriptionsRef.current = [];

      // Sign out from Supabase (this clears the localStorage token)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] signOut error:', error);
        setAuthError(error.message);
      } else {
        console.log('[Auth] signOut successful');
      }
      return { error };
    } catch (err) {
      console.error('[Auth] signOut exception:', err);
      return { error: err };
    }
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
  // Prompt 3 & 4: Sync wrapper with optimistic updates and timeout
  // =====================================================
  const withSync = async (operation, errorMessage = 'Error de sincronización') => {
    if (!canUseSupabase) {
      return { data: null, error: 'Not authenticated or offline' };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    // Timeout protection - never stay syncing more than 15 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sync timeout')), 15000)
    );

    try {
      const result = await Promise.race([operation(), timeoutPromise]);
      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 1500);
      return result;
    } catch (err) {
      console.error(errorMessage, err);
      setSyncStatus('error');
      setSyncError(err.message || errorMessage);
      // Always reset to idle after error to prevent stuck spinner
      setTimeout(() => setSyncStatus('idle'), 2000);
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
      .maybeSingle();

    if (!data) {
      // Profile doesn't exist, create it
      const result = await ensureProfileExists(user.id);
      if (result.success) {
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
      return null;
    }

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

  // Save onboarding profile data
  const saveOnboardingProfile = useCallback(async (onboardingData) => {
    if (!canUseSupabase) return { error: 'Not authenticated or offline' };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          current_weight: onboardingData.current_weight,
          target_weight: onboardingData.goal_weight,
          height: onboardingData.height,
          age: onboardingData.age,
          gender: onboardingData.gender,
          activity_level: onboardingData.activity_level,
          goal: onboardingData.primary_goal === 'lose' ? 'cut' : onboardingData.primary_goal === 'gain' ? 'bulk' : 'maintain',
          target_calories: onboardingData.calorie_goal,
          target_protein: onboardingData.protein_goal,
          target_carbs: onboardingData.carbs_goal,
          target_fat: onboardingData.fat_goal,
          training_days_per_week: onboardingData.training_days_per_week,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error('Error saving onboarding profile:', err);
      return { error: err.message };
    }
  }, [canUseSupabase, user?.id]);

  // Check if user needs onboarding
  const checkNeedsOnboarding = useCallback(async () => {
    if (!canUseSupabase) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false; // Default to not needing onboarding on error
      }

      // If no profile or onboarding not completed
      return !data?.onboarding_completed;
    } catch (err) {
      console.error('Error checking onboarding:', err);
      return false;
    }
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
  // WATER LOG OPERATIONS
  // =====================================================

  const fetchWaterLog = useCallback(async () => {
    if (!canUseSupabase) return [];

    const { data, error } = await supabase
      .from('water_log')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching water log:', error);
      return [];
    }

    return data.map(mappers.waterFromDb);
  }, [canUseSupabase, user?.id]);

  const saveWater = useCallback(async (entry) => {
    return withSync(async () => {
      const { data, error } = await supabase
        .from('water_log')
        .upsert(mappers.waterToDb(entry, user.id), {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mappers.waterFromDb(data) : null, error: null };
    }, 'Error guardando agua');
  }, [canUseSupabase, user?.id]);

  // =====================================================
  // FETCH ALL DATA (for initial load)
  // =====================================================

  const fetchAllData = useCallback(async () => {
    if (!canUseSupabase) {
      console.log('[Supabase] fetchAllData: cannot use Supabase');
      setSyncStatus('idle');
      return null;
    }

    // Only set syncing if not already syncing (prevent multiple spinners)
    setSyncStatus(prev => prev === 'syncing' ? prev : 'syncing');

    // Timeout protection - max 12 seconds for all fetches
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout after 12s')), 12000)
    );

    try {
      console.log('[Supabase] fetchAllData: starting...');

      const fetchPromise = Promise.all([
        fetchProfile(),
        fetchWeightHistory(),
        fetchFoodLog(),
        fetchWorkouts(),
        fetchStepsLog(),
        fetchOuraLog(),
        fetchWaterLog(),
      ]);

      const [profileData, weightHistory, foodLog, workouts, stepsLog, ouraLog, waterLog] =
        await Promise.race([fetchPromise, timeoutPromise]);

      console.log('[Supabase] fetchAllData: completed successfully');
      setSyncStatus('success');
      setLastSyncTime(new Date());
      // Reset to idle after 1.5 seconds
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
      // Reset to idle quickly after error so it doesn't stay stuck
      setTimeout(() => setSyncStatus('idle'), 2000);
      return null;
    }
  }, [canUseSupabase, fetchProfile, fetchWeightHistory, fetchFoodLog, fetchWorkouts, fetchStepsLog, fetchOuraLog, fetchWaterLog]);

  // =====================================================
  // Prompt 3: Migrate localStorage data to Supabase
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

      // Migrate food log - use upsert to avoid duplicates
      if (localData.foodLog?.length > 0) {
        for (const entry of localData.foodLog) {
          try {
            await supabase
              .from('food_log')
              .upsert(mappers.foodToDb(entry, user.id), {
                onConflict: 'id',
              });
          } catch (e) {
            errors.push(`food-${entry.id}`);
          }
        }
      }

      // Migrate workouts - use upsert to avoid duplicates
      if (localData.workouts?.length > 0) {
        for (const entry of localData.workouts) {
          try {
            await supabase
              .from('workouts')
              .upsert(mappers.workoutToDb(entry, user.id), {
                onConflict: 'id',
              });
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
      setTimeout(() => setSyncStatus('idle'), 1500);

      if (errors.length > 0) {
        console.warn('Some items failed to migrate:', errors);
        return { success: true, partialErrors: errors };
      }

      return { success: true };
    } catch (err) {
      console.error('Migration error:', err);
      setSyncStatus('error');
      setSyncError(err.message);
      // Reset to idle after error
      setTimeout(() => setSyncStatus('idle'), 3000);
      return { success: false, error: err.message };
    }
  }, [canUseSupabase, user?.id, saveProfile]);

  // =====================================================
  // Check if localStorage has data to migrate
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

  // Clear localStorage after successful migration
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
    saveOnboardingProfile,
    checkNeedsOnboarding,

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

    // Water
    fetchWaterLog,
    saveWater,

    // Bulk operations
    fetchAllData,

    // Prompt 3: Migration
    migrateLocalStorageToSupabase,
    checkLocalStorageForMigration,
    clearMigratedLocalStorage,

    // Prompt 4: Real-time
    onRealtimeUpdate,
  };
}

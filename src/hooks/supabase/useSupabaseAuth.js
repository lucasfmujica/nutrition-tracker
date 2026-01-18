import { useCallback, useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useSupabaseOperation } from './useSupabaseOperation';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track current user ID to prevent duplicate state updates
  const currentUserIdRef = useRef(null);

  const { withTimeout } = useSupabaseOperation();

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper: Ensure profile exists
  const ensureProfileExists = async (userId) => {
    if (!isSupabaseConfigured()) return { success: false };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!data && !error) {
        console.log('[Auth] Creating profile for user:', userId);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: userId });

        if (insertError) {
          console.error('[Auth] Error creating profile:', insertError);
          return { success: false, error: insertError };
        }
        return { success: true, created: true };
      }

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Error checking profile:', error);
        return { success: false, error };
      }

      return { success: true, exists: true };
    } catch (err) {
      console.error('[Auth] Exception in ensureProfileExists:', err);
      return { success: false, error: err };
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log('[Auth] Supabase not configured, running offline');
      setLoading(false);
      return;
    }

    let mounted = true;
    let timeoutId = null;
    let authResolved = false;

    const resolveAuth = (source) => {
      if (authResolved) return;
      authResolved = true;
      if (timeoutId) clearTimeout(timeoutId);
      console.log(`[Auth] Auth resolved via: ${source}`);
      setLoading(false);
    };

    // Timeout safety
    timeoutId = setTimeout(() => {
      if (mounted && !authResolved) {
        console.warn('[Auth] Session check timed out');
        resolveAuth('timeout');
      }
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted) {
        if (error) {
          console.error('[Auth] Session retrieval error:', error);
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
        setUser(null);
        resolveAuth('getSession-error');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        const newUser = session?.user ?? null;
        const newUserId = newUser?.id ?? null;

        // Only update state if user actually changed
        if (currentUserIdRef.current !== newUserId) {
          console.log('[Auth] Auth state changed:', _event, newUser?.email);
          currentUserIdRef.current = newUserId;
          setUser(newUser);

          if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION', 'SIGNED_OUT'].includes(_event)) {
            resolveAuth(`onAuthStateChange-${_event}`);
          }

          if (newUser && ['SIGNED_IN', 'TOKEN_REFRESHED'].includes(_event)) {
            await ensureProfileExists(newUser.id);
          }
        } else if (_event === 'TOKEN_REFRESHED') {
          // Silent token refresh - don't log or update state
          // This prevents log spam every hour
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      currentUserIdRef.current = null;
      subscription.unsubscribe();
    };
  }, []);

  // Auth Methods
  const checkPreconditions = () => {
    if (!isSupabaseConfigured()) {
      const msg = 'Supabase not configured';
      setAuthError(msg);
      return { error: { message: msg } };
    }
    if (!isOnline) {
      const msg = 'No hay conexión a internet';
      setAuthError(msg);
      return { error: { message: msg } };
    }
    return null;
  };

  const signUp = async (email, password) => {
    const error = checkPreconditions();
    if (error) return error;

    setAuthError(null);
    setLoading(true);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        }),
        15000,
        'signUp'
      );

      setLoading(false);
      if (error) {
        setAuthError(error.message);
        return { data, error };
      }

      if (data.user && !data.session) {
        return { data, error: null, needsConfirmation: true };
      }
      return { data, error: null };
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      return { error: err };
    }
  };

  const signIn = async (email, password) => {
    const error = checkPreconditions();
    if (error) return error;

    setAuthError(null);
    setLoading(true);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000,
        'signIn'
      );

      setLoading(false);
      if (error) {
        setAuthError(error.message);
        return { data, error };
      }
      return { data, error: null };
    } catch (err) {
      console.error('[Auth] signIn error:', err);
      setAuthError(err.message);
      setLoading(false);
      return { error: { message: err.message || 'Error de autenticación' } };
    }
  };

  const signInWithGoogle = async () => {
    const error = checkPreconditions();
    if (error) return error;

    setAuthError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return { data, error };
      }
      // Redirect happens, no setLoading(false) needed
      return { data, error: null };
    } catch (err) {
      console.error('[Auth] signInWithGoogle error:', err);
      setAuthError(err.message);
      setLoading(false);
      return { error: { message: err.message || 'Error con Google' } };
    }
  };

  const signOut = async () => {
    console.log('[Auth] signOut called');
    setUser(null);
    setAuthError(null);

    if (!isSupabaseConfigured()) return { error: null };

    try {
      const { error } = await withTimeout(supabase.auth.signOut(), 10000, 'signOut');
      if (error) setAuthError(error.message);
      return { error };
    } catch (err) {
      console.error('[Auth] signOut exception:', err);
      return { error: err };
    }
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) return { error: { message: 'Supabase not configured' } };
    if (!isOnline) return { error: { message: 'No hay conexión a internet' } };

    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  return {
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isOnline,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    ensureProfileExists
  };
}

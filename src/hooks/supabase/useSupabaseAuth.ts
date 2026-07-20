import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { devLog } from '../../utils/devLog';
import { useSupabaseOperation } from './useSupabaseOperation';

export interface AuthResult {
    data?: any;
    error?: any;
    needsConfirmation?: boolean;
}

export interface SupabaseAuthReturn {
    user: User | null;
    loading: boolean;
    authError: string | null;
    isAuthenticated: boolean;
    isOnline: boolean;
    signUp: (email: string, password: string) => Promise<AuthResult>;
    signIn: (email: string, password: string) => Promise<AuthResult>;
    signInWithGoogle: () => Promise<AuthResult>;
    signOut: () => Promise<{ error: any }>;
    resetPassword: (email: string) => Promise<any>;
    ensureProfileExists: (userId: string) => Promise<{
        success: boolean;
        created?: boolean;
        exists?: boolean;
        error?: any;
    }>;
}

export function useSupabaseAuth(): SupabaseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true,
    );

    // Track current user ID to prevent duplicate state updates
    const currentUserIdRef = useRef<string | null>(null);

    const { withTimeout } = useSupabaseOperation();

    // Online/Offline detection
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // PWA Visibility Change Handler - Refresh auth when app comes back from background
    // This fixes the issue where iOS PWAs resume with stale auth state
    useEffect(() => {
        if (typeof document === 'undefined' || !supabase) return;

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && !loading && supabase) {
                devLog('[Auth] App became visible, checking session...');
                try {
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (error) {
                        console.error('[Auth] Visibility check error:', error);
                        return;
                    }

                    const currentUserId = currentUserIdRef.current;
                    const newUserId = session?.user?.id ?? null;

                    // Only update if user actually changed (login/logout while backgrounded)
                    if (currentUserId !== newUserId) {
                        devLog('[Auth] Session changed while backgrounded, updating state');
                        currentUserIdRef.current = newUserId;
                        setUser(session?.user ?? null);
                    }
                } catch (err) {
                    console.error('[Auth] Visibility check failed:', err);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [loading]);

    // Helper: Ensure profile exists
    const ensureProfileExists = async (userId: string) => {
        if (!supabase) return { success: false };

        try {
            const { data, error } = await supabase!
                .from('profiles')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();

            if (!data && !error) {
                const { error: upsertError } = await supabase!
                    .from('profiles')
                    .upsert({ user_id: userId }, { onConflict: 'user_id' });

                if (upsertError) {
                    console.error(
                        '[Auth] Error fixing/creating profile:',
                        upsertError,
                    );
                    return { success: false, error: upsertError };
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
        if (!supabase) {
            devLog('[Auth] Supabase not configured, running offline');
            setLoading(false);
            return;
        }

        let mounted = true;
        let timeoutId: NodeJS.Timeout | null = null;
        let authResolved = false;

        const resolveAuth = (source: string) => {
            if (authResolved) return;
            authResolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            devLog(`[Auth] Auth resolved via: ${source}`);
            setLoading(false);
        };

        // Timeout safety - extended to 10s for cold starts and slow networks
        // PWA apps especially need more time after being backgrounded
        timeoutId = setTimeout(() => {
            if (mounted && !authResolved) {
                console.warn('[Auth] Session check timed out after 10s');
                resolveAuth('timeout');
            }
        }, 10000);

        // Get initial session
        supabase!.auth
            .getSession()
            .then(({ data: { session }, error }) => {
                if (mounted) {
                    if (error) {
                        console.error('[Auth] Session retrieval error:', error);
                        setUser(null);
                    } else {
                        devLog(
                            '[Auth] Session check complete, user:',
                            session?.user?.email,
                        );
                        setUser(session?.user ?? null);
                    }
                    resolveAuth('getSession');
                }
            })
            .catch((err) => {
                if (mounted) {
                    console.error('[Auth] Session check failed:', err);
                    setUser(null);
                    resolveAuth('getSession-error');
                }
            });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase!.auth.onAuthStateChange(
            async (_event: AuthChangeEvent, session: Session | null) => {
                if (!mounted) return;

                const newUser = session?.user ?? null;
                const newUserId = newUser?.id ?? null;

                // Only update state if user actually changed
                if (currentUserIdRef.current !== newUserId) {
                    devLog(
                        '[Auth] Auth state changed:',
                        _event,
                        newUser?.email,
                    );
                    currentUserIdRef.current = newUserId;
                    setUser(newUser);

                    if (
                        [
                            'SIGNED_IN',
                            'TOKEN_REFRESHED',
                            'INITIAL_SESSION',
                            'SIGNED_OUT',
                        ].includes(_event)
                    ) {
                        resolveAuth(`onAuthStateChange-${_event}`);
                    }

                    if (
                        newUser &&
                        ['SIGNED_IN', 'TOKEN_REFRESHED'].includes(_event)
                    ) {
                        await ensureProfileExists(newUser.id);
                    }
                } else if (_event === 'TOKEN_REFRESHED') {
                    // Silent token refresh - don't log or update state
                    // This prevents log spam every hour
                }
            },
        );

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
            currentUserIdRef.current = null;
            subscription.unsubscribe();
        };
    }, []);

    // Auth Methods
    const checkPreconditions = (): { error: { message: string } } | null => {
        if (!supabase) {
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

    const signUp = async (email: string, password: string): Promise<AuthResult> => {
        const error = checkPreconditions();
        if (error) return error;

        setAuthError(null);
        setLoading(true);

        try {
            const { data, error } = await withTimeout(
                supabase!.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo:
                            typeof window !== 'undefined'
                                ? window.location.origin
                                : undefined,
                    },
                }),
                15000,
                'signUp',
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
        } catch (err: any) {
            setAuthError(err.message);
            setLoading(false);
            return { error: err };
        }
    };

    const signIn = async (email: string, password: string): Promise<AuthResult> => {
        const error = checkPreconditions();
        if (error) return error;

        setAuthError(null);
        setLoading(true);

        try {
            const { data, error } = await withTimeout(
                supabase!.auth.signInWithPassword({ email, password }),
                15000,
                'signIn',
            );

            setLoading(false);
            if (error) {
                setAuthError(error.message);
                return { data, error };
            }
            return { data, error: null };
        } catch (err: any) {
            console.error('[Auth] signIn error:', err);
            setAuthError(err.message);
            setLoading(false);
            return { error: { message: err.message || 'Error de autenticación' } };
        }
    };

    const signInWithGoogle = async (): Promise<AuthResult> => {
        const error = checkPreconditions();
        if (error) return error;

        setAuthError(null);
        setLoading(true);

        try {
            const { data, error } = await supabase!.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo:
                        typeof window !== 'undefined'
                            ? window.location.origin
                            : undefined,
                },
            });

            if (error) {
                setAuthError(error.message);
                setLoading(false);
                return { data, error };
            }
            // Redirect happens, no setLoading(false) needed
            return { data, error: null };
        } catch (err: any) {
            console.error('[Auth] signInWithGoogle error:', err);
            setAuthError(err.message);
            setLoading(false);
            return { error: { message: err.message || 'Error con Google' } };
        }
    };

    const signOut = async () => {
        devLog('[Auth] signOut called');
        setUser(null);
        setAuthError(null);

        if (!supabase) return { error: null };

        try {
            const { error } = await withTimeout(
                supabase!.auth.signOut(),
                10000,
                'signOut',
            );
            if (error) setAuthError(error.message);
            return { error };
        } catch (err) {
            console.error('[Auth] signOut exception:', err);
            return { error: err };
        }
    };

    const resetPassword = async (email: string) => {
        if (!supabase) return { error: { message: 'Supabase not configured' } };
        if (!isOnline) return { error: { message: 'No hay conexión a internet' } };

        return await supabase!.auth.resetPasswordForEmail(email, {
            redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
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
        ensureProfileExists,
    };
}

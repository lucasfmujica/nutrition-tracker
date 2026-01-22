import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: log configuration status
console.log('[Supabase] URL configured:', !!supabaseUrl);
console.log('[Supabase] Key configured:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '[Supabase] Credentials not found. Running in offline/localStorage mode.',
    );
}

// Client with auth persistence enabled and better defaults
export const supabase =
    supabaseUrl && supabaseAnonKey
        ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
              auth: {
                  persistSession: true,
                  storageKey: 'lukenfit-auth',
                  storage: window.localStorage,
                  autoRefreshToken: true,
                  detectSessionInUrl: true,
              },
              global: {
                  headers: {
                      'x-client-info': 'nutrition-tracker-web',
                  },
              },
              db: {
                  schema: 'public',
              },
              // Add timeout for realtime connections
              realtime: {
                  timeout: 10000,
              },
          })
        : null;

export const isSupabaseConfigured = (): boolean => !!supabase;

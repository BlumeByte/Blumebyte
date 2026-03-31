import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, publicAnonKey, supabaseUrl } from '../config/env';

type AuthResult<T = any> = Promise<{ data: T; error: Error | null }>;

const unconfiguredError = () =>
  new Error('Supabase is not configured in this deployment. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

const createUnconfiguredClient = () => ({
  auth: {
    signInWithPassword: async (): AuthResult => ({ data: { session: null, user: null }, error: unconfiguredError() }),
    getSession: async (): AuthResult => ({ data: { session: null }, error: null }),
    refreshSession: async (): AuthResult => ({ data: { session: null }, error: unconfiguredError() }),
    signOut: async (): AuthResult => ({ data: {}, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
  },
});

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, publicAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : (createUnconfiguredClient() as any);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase client disabled in supabase-client.ts because environment variables are missing.'
  );
}

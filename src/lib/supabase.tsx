import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, publicAnonKey, supabaseProjectId, supabaseUrl } from '../config/env';

export const supabaseStorageKey = `sb-${supabaseProjectId || 'project'}-auth-token`;

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
        storageKey: supabaseStorageKey,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : (createUnconfiguredClient() as any);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase client disabled because env vars are missing. Auth/database actions are blocked until Vercel production env vars are configured.'
  );
}

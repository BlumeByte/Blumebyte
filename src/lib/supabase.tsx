import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, publicAnonKey, supabaseProjectId, supabaseUrl } from '../config/env';

export const supabaseStorageKey = `sb-${supabaseProjectId || 'project'}-auth-token`;

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : FALLBACK_SUPABASE_URL,
  isSupabaseConfigured ? publicAnonKey : FALLBACK_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: supabaseStorageKey,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase client is running in fallback mode; authentication and database operations are disabled until env vars are configured.'
  );
}

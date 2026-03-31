import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, publicAnonKey, supabaseUrl } from '../config/env';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : FALLBACK_SUPABASE_URL,
  isSupabaseConfigured ? publicAnonKey : FALLBACK_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase client fallback mode enabled in supabase-client.ts. Configure production env vars to enable API calls.'
  );
}

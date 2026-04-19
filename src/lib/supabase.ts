import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Vite exposes env vars via import.meta.env; fall back to the hardcoded project values
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: `sb-${projectId}-auth-token`,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
import { createClient } from '@supabase/supabase-js';
import { publicAnonKey, supabaseProjectId, supabaseUrl } from '../config/env';

export const supabaseStorageKey = `sb-${supabaseProjectId || 'project'}-auth-token`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    storageKey: supabaseStorageKey,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
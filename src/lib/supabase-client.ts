import { createClient } from '@supabase/supabase-js';
import { publicAnonKey, supabaseUrl } from '../config/env';

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionUrl: true,
  },
});

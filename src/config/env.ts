const env = import.meta.env;

const DEFAULT_SUPABASE_URL = 'https://ivohczdtuxasyfoiphqu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2b2hjemR0dXhhc3lmb2lwaHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzgyNDcsImV4cCI6MjA4ODM1NDI0N30.loRm7iik0lgBW7yRK-ANIjpyKVZGLCdSuqVZ5VDnQNQ';
const DEFAULT_SUPABASE_FUNCTIONS_SLUG = 'make-server-a35148f0';

function getEnv(name: keyof ImportMetaEnv, fallback = ''): string {
  const value = env[name];
  return typeof value === 'string' ? value.trim() : fallback;
}

export const supabaseUrl = getEnv('VITE_SUPABASE_URL');
export const publicAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(supabaseUrl && publicAnonKey);

export const supabaseProjectId = getEnv('VITE_SUPABASE_PROJECT_ID') || (() => {
  if (!supabaseUrl) return '';
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || '';
  } catch {
    return '';
  }
})();

export const supabaseFunctionSlug = getEnv('VITE_SUPABASE_FUNCTIONS_SLUG', 'make-server-668731fc');
export const supabaseFunctionsBaseUrl = isSupabaseConfigured
  ? `${supabaseUrl}/functions/v1/${supabaseFunctionSlug}`
  : '';

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Production Environment Variables.'
  );
}

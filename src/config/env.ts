const env = import.meta.env;
const LEGACY_SUPABASE_URL = 'https://ivohczdtuxasyfoiphqu.supabase.co';
const LEGACY_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2b2hjemR0dXhhc3lmb2lwaHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzgyNDcsImV4cCI6MjA4ODM1NDI0N30.loRm7iik0lgBW7yRK-ANIjpyKVZGLCdSuqVZ5VDnQNQ';

function getEnv(name: keyof ImportMetaEnv, fallback = ''): string {
  const value = env[name];
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export const supabaseUrl = getEnv('VITE_SUPABASE_URL', LEGACY_SUPABASE_URL).replace(/\/+$/, '');
export const publicAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', LEGACY_SUPABASE_ANON_KEY);
export const supabaseProjectId = getEnv('VITE_SUPABASE_PROJECT_ID') || (() => {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || '';
  } catch {
    return '';
  }
})();

export const supabaseFunctionSlug = getEnv('VITE_SUPABASE_FUNCTIONS_SLUG', 'make-server-668731fc');
export const supabaseFunctionsBaseUrl = `${supabaseUrl}/functions/v1/${supabaseFunctionSlug}`;

if (!supabaseUrl || !publicAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure these in Vercel Environment Variables.');
}

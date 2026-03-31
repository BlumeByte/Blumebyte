const env = import.meta.env;

function getEnv(name: keyof ImportMetaEnv, fallback = ''): string {
  const value = env[name];
  return typeof value === 'string' ? value.trim() : fallback;
}

export const supabaseUrl = getEnv('VITE_SUPABASE_URL');
export const publicAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
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

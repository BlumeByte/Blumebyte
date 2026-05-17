import { projectId } from '../utils/supabase/info';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

export const SUPABASE_FUNCTION_NAME = trimSlashes(
  import.meta.env.VITE_SUPABASE_FUNCTION_NAME || 'make-server',
);

export const SUPABASE_FUNCTIONS_BASE_URL = `${trimTrailingSlash(
  import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`,
)}/functions/v1/${SUPABASE_FUNCTION_NAME}`;

export function buildFunctionsUrl(path = ''): string {
  if (!path) return SUPABASE_FUNCTIONS_BASE_URL;
  return `${SUPABASE_FUNCTIONS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

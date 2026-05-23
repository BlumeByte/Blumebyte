import { projectId } from '../utils/supabase/info';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');
const RETRYABLE_FUNCTION_STATUSES = new Set([404, 405, 501]);

const SUPABASE_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`,
);

export const SUPABASE_FUNCTION_NAME_CANDIDATES = Array.from(
  new Set(
    [
      trimSlashes(import.meta.env.VITE_SUPABASE_FUNCTION_NAME || ''),
      'make-server-a35148f0',
      'make-server',
      'server',
    ].filter(Boolean),
  ),
);

export const SUPABASE_FUNCTION_NAME = SUPABASE_FUNCTION_NAME_CANDIDATES[0];

export function buildFunctionsUrl(path = '', functionName = SUPABASE_FUNCTION_NAME): string {
  const normalizedPath = !path ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${SUPABASE_BASE_URL}/functions/v1/${functionName}${normalizedPath}`;
}

export function getFunctionsUrlCandidates(path = ''): string[] {
  return SUPABASE_FUNCTION_NAME_CANDIDATES.map((functionName) => buildFunctionsUrl(path, functionName));
}

export async function fetchFunctionsUrl(path: string, init?: RequestInit): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown;

  for (const url of getFunctionsUrlCandidates(path)) {
    try {
      const response = await fetch(url, init);
      if (response.ok || !RETRYABLE_FUNCTION_STATUSES.has(response.status)) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) return lastResponse;
  if (lastError instanceof Error) throw lastError;
  throw new Error('Unable to reach Supabase function');
}

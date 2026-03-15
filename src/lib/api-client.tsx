import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-668731fc`;

export function authHeaders(userToken?: string | null, json = true): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
  };
  if (userToken) h['X-User-Token'] = userToken;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

export async function api(path: string, options: RequestInit & { token?: string | null } = {}) {
  const { token, ...fetchOpts } = options;
  const method = (fetchOpts.method || 'GET').toUpperCase();
  const needsJson = method !== 'GET' && fetchOpts.body;
  const res = await fetch(`${BASE}${path}`, {
    ...fetchOpts,
    headers: {
      ...authHeaders(token, !!needsJson),
      ...(fetchOpts.headers || {}),
    },
  });
  
  // Handle non-JSON responses
  const text = await res.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch (parseError) {
    console.error(`API response for ${method} ${path}: ${res.status}`, text);
    throw new Error(`Server returned an invalid response for ${path} (${res.status}). Please try again later.`);
  }
  
  if (!res.ok) {
    // Create a custom error object with additional context
    const error: any = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.accountInactive = data.accountInactive;
    error.subscriptionInactive = data.subscriptionInactive;
    error.noSuperAdmin = data.noSuperAdmin;
    error.needsSubscription = data.needsSubscription;
    error.needsLicenses = data.needsLicenses;
    throw error;
  }
  return data;
}

export async function apiUpload(path: string, formData: FormData, token?: string | null) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
  };
  if (token) headers['X-User-Token'] = token;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  // Handle non-JSON responses
  const text = await res.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch (parseError) {
    console.error('Upload response text:', text);
    throw new Error('Server returned an invalid response. Please try again later.');
  }
  
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}

// Helper object for easier API calls with token from auth context
export const apiClient = {
  get: async (path: string, token?: string | null) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'GET',
      headers: authHeaders(token, false),
    });
    return res; // Return response object for manual handling
  },
  
  post: async (path: string, body: any, token?: string | null) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify(body),
    });
    return res; // Return response object for manual handling
  },
  
  put: async (path: string, body: any, token?: string | null) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: authHeaders(token, true),
      body: JSON.stringify(body),
    });
    return res;
  },
  
  delete: async (path: string, token?: string | null) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'DELETE',
      headers: authHeaders(token, false),
    });
    return res;
  },
};
import { publicAnonKey, supabaseFunctionsBaseUrl } from '../config/env';

const BASE = supabaseFunctionsBaseUrl;

// PERFORMANCE: Simple in-memory cache for GET requests
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache for GET requests

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
  
  // PERFORMANCE: Check cache for GET requests
  if (method === 'GET') {
    const cacheKey = `${path}:${token || 'anon'}`;
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
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
  
  // PERFORMANCE: Cache successful GET responses
  if (method === 'GET') {
    const cacheKey = `${path}:${token || 'anon'}`;
    requestCache.set(cacheKey, { data, timestamp: Date.now() });
    
    // Clean up old cache entries (keep last 100)
    if (requestCache.size > 100) {
      const entries = Array.from(requestCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      requestCache.clear();
      entries.slice(0, 100).forEach(([key, value]) => requestCache.set(key, value));
    }
  }
  
  return data;
}

// File upload helper function
export async function apiUpload(path: string, formData: FormData, token?: string | null) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      ...(token ? { 'X-User-Token': token } : {}),
    },
    body: formData,
  });
  
  const text = await res.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch (parseError) {
    console.error(`Upload API response for ${path}: ${res.status}`, text);
    throw new Error(`Server returned an invalid response for ${path} (${res.status}). Please try again later.`);
  }
  
  if (!res.ok) {
    const error: any = new Error(data.error || `Upload failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  
  return data;
}

// apiClient object for components that need direct Response access
export const apiClient = {
  async get(path: string, token?: string | null): Promise<Response> {
    return fetch(`${BASE}${path}`, {
      method: 'GET',
      headers: authHeaders(token, false),
    });
  },
  
  async post(path: string, body: any, token?: string | null): Promise<Response> {
    return fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify(body),
    });
  },
  
  async put(path: string, body: any, token?: string | null): Promise<Response> {
    return fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: authHeaders(token, true),
      body: JSON.stringify(body),
    });
  },
  
  async delete(path: string, token?: string | null): Promise<Response> {
    return fetch(`${BASE}${path}`, {
      method: 'DELETE',
      headers: authHeaders(token, false),
    });
  },
};
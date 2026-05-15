import { api, invalidateCache } from './api-client';

export interface PublicHiring {
  id: string;
  companyName: string;
  roleTitle: string;
  department?: string;
  employmentType?: string;
  location?: string;
  description?: string;
  requirements?: string;
  qualifications?: string;
  salaryRange?: string;
  deadline?: string | null;
  createdAt: string;
  visibilityType?: string;
  status?: string;
}

export interface PublicHiringFilters {
  companies: string[];
  departments: string[];
  employmentTypes: string[];
  locations: string[];
}

export interface PublicHiringSummary {
  totalJobs: number;
  totalCompanies: number;
}

export interface PublicHiringCatalog {
  jobs: PublicHiring[];
  total: number;
  filters: PublicHiringFilters;
  summary: PublicHiringSummary;
}

export interface PublicHiringApplicationInput {
  jobId: string;
  companyName: string;
  roleTitle: string;
  fullName: string;
  email: string;
  phone: string;
  contactDetails: string;
  qualification: string;
  cvMessage: string;
}

export interface PublicHiringApplicationFormData {
  fullName: string;
  email: string;
  phone: string;
  contactDetails: string;
  qualification: string;
  cvMessage: string;
}

export const MAX_PUBLIC_HIRING_CV_CHARS = 4000;
export const APPLIED_PUBLIC_HIRINGS_STORAGE_KEY = 'public_hiring_applied_jobs';
export const PUBLIC_HIRINGS_ENDPOINT = '/public/hirings';
export const PUBLIC_HIRING_APPLICATION_ENDPOINT = '/public/hirings/apply';
export const DEFAULT_PUBLIC_HIRING_COMPANY_NAME = 'Hiring Organization';
// Keep this list aligned with backend aliases:
// - `/public/jobs` and `/public/job-openings` were historical public endpoints
// - `/hirings/jobs` is a legacy route used by older public pages
const PUBLIC_HIRING_ENDPOINT_ALIASES = ['/public/jobs', '/public/job-openings', '/hirings/jobs'] as const;
const PUBLIC_HIRING_LIST_ENDPOINTS = [PUBLIC_HIRINGS_ENDPOINT, ...PUBLIC_HIRING_ENDPOINT_ALIASES] as const;
const PUBLIC_HIRING_APPLICATION_ENDPOINT_ALIASES = ['/public/job/apply'] as const;
const PUBLIC_HIRING_APPLY_ENDPOINTS = [PUBLIC_HIRING_APPLICATION_ENDPOINT, ...PUBLIC_HIRING_APPLICATION_ENDPOINT_ALIASES] as const;

const EMPTY_FILTERS: PublicHiringFilters = {
  companies: [],
  departments: [],
  employmentTypes: [],
  locations: [],
};

function ensureStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

function shouldTryNextPublicHiringEndpoint(error: any): boolean {
  const status = typeof error?.status === 'number' ? error.status : 0;
  return status === 0 || status === 404 || status === 405 || status === 501;
}

async function requestPublicHiringWithFallback<T>(
  operation: 'list' | 'detail' | 'apply',
  endpoints: readonly string[],
  request: (endpoint: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      return await request(endpoint);
    } catch (error) {
      lastError = error;
      if (!shouldTryNextPublicHiringEndpoint(error)) throw error;
    }
  }

  const lastErrorMessage = typeof (lastError as any)?.message === 'string'
    ? (lastError as any).message
    : 'unknown';
  throw new Error(`Unable to ${operation} public hiring data after trying: ${endpoints.join(', ')}. Last error: ${lastErrorMessage}`);
}

function extractPublicHiringJobs(data: any): PublicHiring[] {
  if (Array.isArray(data?.jobs)) return data.jobs;
  if (Array.isArray(data)) return data;
  return [];
}

export async function fetchPublicHiringCatalog(): Promise<PublicHiringCatalog> {
  const data = await requestPublicHiringWithFallback('list', PUBLIC_HIRING_LIST_ENDPOINTS, (endpoint) => api(endpoint));
  const jobs = extractPublicHiringJobs(data);
  if (typeof data?.total !== 'number') {
    console.warn('Public hiring API response missing "total"; using jobs.length as fallback.');
  }
  return {
    jobs,
    total: typeof data?.total === 'number' ? data.total : jobs.length,
    filters: {
      companies: ensureStringArray(data?.filters?.companies),
      departments: ensureStringArray(data?.filters?.departments),
      employmentTypes: ensureStringArray(data?.filters?.employmentTypes),
      locations: ensureStringArray(data?.filters?.locations),
    },
    summary: {
      totalJobs: typeof data?.summary?.totalJobs === 'number' ? data.summary.totalJobs : 0,
      totalCompanies: typeof data?.summary?.totalCompanies === 'number' ? data.summary.totalCompanies : 0,
    },
  };
}

export async function fetchPublicHiringDetail(jobId: string): Promise<PublicHiring> {
  return requestPublicHiringWithFallback(
    'detail',
    PUBLIC_HIRING_LIST_ENDPOINTS.map((endpoint) => `${endpoint}/${jobId}`),
    (endpoint) => api(endpoint),
  );
}

export async function submitPublicHiringApplication(payload: PublicHiringApplicationInput) {
  return requestPublicHiringWithFallback('apply', PUBLIC_HIRING_APPLY_ENDPOINTS, (endpoint) =>
    api(endpoint, {
      method: 'POST',
      body: payload,
    }),
  );
}

export function invalidatePublicHiringCache(jobId?: string) {
  for (const endpoint of PUBLIC_HIRING_LIST_ENDPOINTS) {
    invalidateCache(endpoint);
    if (jobId) invalidateCache(`${endpoint}/${jobId}`);
  }
}

export function loadAppliedPublicHiringIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(APPLIED_PUBLIC_HIRINGS_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveAppliedPublicHiringIds(jobIds: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APPLIED_PUBLIC_HIRINGS_STORAGE_KEY, JSON.stringify(Array.from(new Set(jobIds))));
  } catch {}
}

export function markPublicHiringApplied(jobId: string) {
  if (!jobId) return;
  saveAppliedPublicHiringIds([...loadAppliedPublicHiringIds(), jobId]);
}

export function hasAppliedToPublicHiring(jobId: string) {
  return loadAppliedPublicHiringIds().includes(jobId);
}

export function getEmptyPublicHiringFilters(): PublicHiringFilters {
  return EMPTY_FILTERS;
}

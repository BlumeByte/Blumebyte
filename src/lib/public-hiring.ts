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

export async function fetchPublicHiringCatalog(): Promise<PublicHiringCatalog> {
  const data = await api(PUBLIC_HIRINGS_ENDPOINT);
  return {
    jobs: Array.isArray(data?.jobs) ? data.jobs : [],
    total: typeof data?.total === 'number' ? data.total : 0,
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
  return api(`${PUBLIC_HIRINGS_ENDPOINT}/${jobId}`);
}

export async function submitPublicHiringApplication(payload: PublicHiringApplicationInput) {
  return api(PUBLIC_HIRING_APPLICATION_ENDPOINT, {
    method: 'POST',
    body: payload,
  });
}

export function invalidatePublicHiringCache(jobId?: string) {
  invalidateCache(PUBLIC_HIRINGS_ENDPOINT);
  if (jobId) invalidateCache(`${PUBLIC_HIRINGS_ENDPOINT}/${jobId}`);
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

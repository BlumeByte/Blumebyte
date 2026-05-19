import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Briefcase, Calendar, Clock3, DollarSign, Eye, MapPin, RefreshCw, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PublicFooter, PublicNavbar } from '../components/PublicNavFooter';
import { PublicHiringApplyDialog } from '../components/PublicHiringApplyDialog';
import { supabase } from '../lib/supabase';
import {
  ALL_ROUTES_EXHAUSTED_PREFIX,
  fetchPublicHiringCatalog,
  getEmptyPublicHiringFilters,
  invalidatePublicHiringCache,
  loadAppliedPublicHiringIds,
  type PublicHiring,
  type PublicHiringCatalog,
} from '../lib/public-hiring';

const SEARCH_SCORE_EXACT = 250;
const SEARCH_SCORE_PREFIX = 180;
const SEARCH_SCORE_CONTAINS = 120;
const SEARCH_SCORE_WORD_EXACT = 120;
const SEARCH_SCORE_WORD_PREFIX = 80;
const SEARCH_SCORE_WORD_CONTAINS = 40;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeSearchTerm(value: unknown): string {
  return asString(value).toLowerCase().trim();
}

function getSearchScore(job: PublicHiring, query: string): number {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return 0;

  const role = normalizeSearchTerm(job.roleTitle);
  const company = normalizeSearchTerm(job.companyName);
  const department = normalizeSearchTerm(job.department);
  const location = normalizeSearchTerm(job.location);
  const type = normalizeSearchTerm(job.employmentType);
  const fields = [role, company, department, location, type].filter(Boolean);
  const words = normalizedQuery.split(/\s+/).filter(Boolean);

  let score = 0;
  for (const field of fields) {
    if (field === normalizedQuery) score += SEARCH_SCORE_EXACT;
    if (field.startsWith(normalizedQuery)) score += SEARCH_SCORE_PREFIX;
    if (field.includes(normalizedQuery)) score += SEARCH_SCORE_CONTAINS;
    for (const word of words) {
      if (!word) continue;
      if (field === word) score += SEARCH_SCORE_WORD_EXACT;
      else if (field.startsWith(word)) score += SEARCH_SCORE_WORD_PREFIX;
      else if (field.includes(word)) score += SEARCH_SCORE_WORD_CONTAINS;
    }
  }

  return score;
}

function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-5/6 mb-4" />
      <div className="flex gap-2">
        <div className="h-6 bg-gray-100 rounded-full w-20" />
        <div className="h-6 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  );
}

function JobCard({
  job,
  applied,
  onDetails,
  onApply,
}: {
  job: PublicHiring;
  applied: boolean;
  onDetails: () => void;
  onApply: () => void;
}) {
  const status = job.status || 'open';
  const applyButtonClass = applied
    ? 'flex-1 bg-slate-200 text-blue-700 hover:bg-slate-300'
    : 'flex-1 bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-700/70 shadow-lg hover:shadow-xl transition-all duration-200 p-5 flex flex-col gap-4 cursor-pointer" onClick={onDetails}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-100 text-base truncate" title={job.roleTitle || 'Untitled Role'}>
            {job.roleTitle || 'Untitled Role'}
          </h3>
          <p className="text-sm text-slate-400 truncate mt-1" title={job.companyName || 'Hiring Organization'}>
            {job.companyName || 'Hiring Organization'}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 capitalize">{status}</span>
      </div>

      <div className="space-y-1 text-sm text-slate-300">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span>{job.location || 'Location not specified'}</span>
          {job.employmentType && (
            <>
              <Clock3 className="h-3.5 w-3.5 text-slate-400 ml-2" />
              <span>{job.employmentType}</span>
            </>
          )}
        </p>
        {job.deadline && (
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
          </p>
        )}
        {!!job.salaryRange && (
          <p className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <DollarSign className="h-3.5 w-3.5" />
            <span>{job.salaryRange}</span>
          </p>
        )}
      </div>

      <p className="text-sm text-slate-300 line-clamp-2">{job.description || ''}</p>
      <div className="text-xs text-slate-400 pt-2 border-t border-slate-700/60">
        Posted {new Date(job.createdAt).toLocaleDateString()}
      </div>

      <div className="flex gap-2 mt-auto" onClick={(event) => event.stopPropagation()}>
        <Button variant="outline" size="sm" className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700" onClick={onDetails}>
          <Eye className="h-4 w-4 mr-1" />
          Details
        </Button>
        <Button size="sm" disabled={applied} className={applyButtonClass} onClick={onApply}>
          {applied ? 'Applied' : 'Apply'}
        </Button>
      </div>
    </div>
  );
}

export default function HiringsPage() {
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [catalog, setCatalog] = useState<PublicHiringCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [applyJob, setApplyJob] = useState<PublicHiring | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  useEffect(() => {
    setAppliedJobIds(loadAppliedPublicHiringIds());
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchJobs = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    setLoading(true);
    if (!isRetry) setError(null);

    try {
      const nextCatalog = await fetchPublicHiringCatalog();
      if (!mountedRef.current) return;
      setCatalog(nextCatalog);
      setError(null);
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error('Failed to load public jobs:', err?.message);
      // If all endpoints were exhausted (every alias returned 404/route-not-found),
      // retrying won't help — skip the 3-second retry and go straight to error state.
      const allRoutesExhausted =
        typeof err?.message === 'string' && err.message.startsWith(ALL_ROUTES_EXHAUSTED_PREFIX);
      if (!isRetry && !allRoutesExhausted) {
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          invalidatePublicHiringCache();
          fetchJobs(true);
        }, 3000);
      } else {
        setError('Unable to load job openings. Please try again later.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      invalidatePublicHiringCache();
      fetchJobs();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchJobs]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      invalidatePublicHiringCache();
      fetchJobs();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchJobs]);

  useEffect(() => {
    const refetch = () => {
      invalidatePublicHiringCache();
      fetchJobs();
    };

    const channel = supabase
      .channel('realtime:job-posting')
      .on('broadcast', { event: 'INSERT' }, refetch)
      .on('broadcast', { event: 'UPDATE' }, refetch)
      .on('broadcast', { event: 'DELETE' }, refetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobs]);

  const jobs = catalog?.jobs ?? [];
  const filters = catalog?.filters ?? getEmptyPublicHiringFilters();
  const summary = catalog?.summary ?? { totalJobs: jobs.length, totalCompanies: 0 };

  const normalizedSearch = normalizeSearchTerm(search);
  const typedLocation = normalizeSearchTerm(filterLocation);
  const typedType = normalizeSearchTerm(filterType);
  const typedDepartment = normalizeSearchTerm(filterDepartment);

  const filtered = useMemo(
    () =>
      jobs
        .filter((job) => {
          const location = normalizeSearchTerm(job.location);
          const employmentType = normalizeSearchTerm(job.employmentType);
          const department = normalizeSearchTerm(job.department);
          const matchSearch = !normalizedSearch || getSearchScore(job, normalizedSearch) > 0;
          const matchLocation = !typedLocation || location.includes(typedLocation);
          const matchType = !typedType || employmentType.includes(typedType);
          const matchDepartment = !typedDepartment || department.includes(typedDepartment);
          return matchSearch && matchLocation && matchType && matchDepartment;
        })
        .sort((a, b) => {
          const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (!normalizedSearch) return timeDiff;
          const scoreDiff = getSearchScore(b, normalizedSearch) - getSearchScore(a, normalizedSearch);
          if (scoreDiff !== 0) return scoreDiff;
          if (timeDiff !== 0) return timeDiff;
          return asString(a.roleTitle).localeCompare(asString(b.roleTitle));
        }),
    [jobs, normalizedSearch, typedDepartment, typedLocation, typedType],
  );

  const clearAllFilters = () => {
    setSearch('');
    setFilterLocation('');
    setFilterType('');
    setFilterDepartment('');
  };

  return (
    <div className="min-h-screen public-page-bg flex flex-col">
      <PublicNavbar />

      <section className="relative text-white py-16 px-4 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/5439438/pexels-photo-5439438.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-gray-900/80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Find Your Next Opportunity</h1>
          <p className="text-lg text-gray-300">
            {summary.totalCompanies > 0
              ? `Browse ${summary.totalJobs} open roles from ${summary.totalCompanies} companies hiring through Blumebyte HR`
              : 'Browse live job openings published by Blumebyte tenants'}
          </p>
          <div className="relative max-w-xl mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by job title, company, department, or location..."
              aria-label="Search jobs by title, company, department, or location"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            value={filterLocation}
            onChange={(event) => setFilterLocation(event.target.value)}
            placeholder="Type location filter"
            className="w-44 bg-white"
            list="public-hiring-locations"
            aria-label="Filter jobs by location"
            aria-describedby="public-hiring-filter-help"
          />
          <Input
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            placeholder="Type job type filter"
            className="w-44 bg-white"
            list="public-hiring-types"
            aria-label="Filter jobs by employment type"
            aria-describedby="public-hiring-filter-help"
          />
          <Input
            value={filterDepartment}
            onChange={(event) => setFilterDepartment(event.target.value)}
            placeholder="Type department filter"
            className="w-52 bg-white"
            list="public-hiring-departments"
            aria-label="Filter jobs by department"
            aria-describedby="public-hiring-filter-help"
          />

          {(search || filterLocation || filterType || filterDepartment) && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )}

          {!loading && (
            <span className="ml-auto text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found
            </span>
          )}
        </div>
        <p id="public-hiring-filter-help" className="sr-only">
          Select one of the suggested values or type your own filter text.
        </p>

        <datalist id="public-hiring-locations">
          {filters.locations.map((location) => <option key={location} value={location} />)}
        </datalist>
        <datalist id="public-hiring-types">
          {filters.employmentTypes.map((employmentType) => <option key={employmentType} value={employmentType} />)}
        </datalist>
        <datalist id="public-hiring-departments">
          {filters.departments.map((department) => <option key={department} value={department} />)}
        </datalist>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => <JobCardSkeleton key={index} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-600">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                invalidatePublicHiringCache();
                fetchJobs(true);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-600">No Job Openings</h3>
            <p className="text-sm text-gray-400">
              {jobs.length === 0
                ? 'No public roles are available right now. Check back soon.'
                : 'No jobs match your current filters. Try adjusting your search criteria.'}
            </p>
            {jobs.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                applied={appliedJobIds.includes(job.id)}
                onDetails={() => navigate(`/hirings/${job.id}`)}
                onApply={() => {
                  if (!appliedJobIds.includes(job.id)) setApplyJob(job);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <PublicHiringApplyDialog
        job={applyJob}
        open={!!applyJob}
        onClose={() => setApplyJob(null)}
        onApplied={(jobId) => setAppliedJobIds((current) => Array.from(new Set([...current, jobId])))}
      />

      <PublicFooter />
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  Search, MapPin, Briefcase, Building2,
  Loader2, AlertCircle, RefreshCw, Calendar, Clock3, Eye, DollarSign
} from 'lucide-react';
import { api, invalidateCache } from '../lib/api-client';
import { supabase } from '../lib/supabase';
import { PublicNavbar, PublicFooter } from '../components/PublicNavFooter';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PublicJob {
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
  deadline?: string;
  createdAt: string;
  visibilityType: string;
  status: string;
}

interface ApplyFormData {
  fullName: string;
  email: string;
  phone: string;
  contactDetails: string;
  qualification: string;
  cvMessage: string;
}

const MAX_CV_CHARS = 4000;
const APPLIED_JOBS_STORAGE_KEY = 'public_hiring_applied_jobs';

function loadAppliedJobs(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(APPLIED_JOBS_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveAppliedJobs(jobIds: string[]) {
  try {
    localStorage.setItem(APPLIED_JOBS_STORAGE_KEY, JSON.stringify(jobIds));
  } catch {}
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ─── Job Card Skeleton ────────────────────────────────────────────────────────
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

// ─── Tag Chip ─────────────────────────────────────────────────────────────────
function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {children}
    </span>
  );
}

// ─── Apply Modal ─────────────────────────────────────────────────────────────
function ApplyModal({
  job,
  open,
  onClose,
  onApplied,
}: {
  job: PublicJob | null;
  open: boolean;
  onClose: () => void;
  onApplied: (jobId: string) => void;
}) {
  const [form, setForm] = useState<ApplyFormData>({
    fullName: '',
    email: '',
    phone: '',
    contactDetails: '',
    qualification: '',
    cvMessage: '',
  });
  const [errors, setErrors] = useState<Partial<ApplyFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setForm({ fullName: '', email: '', phone: '', contactDetails: '', qualification: '', cvMessage: '' });
    setErrors({});
    setSubmitted(false);
    setSubmitting(false);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const validate = (): boolean => {
    const e: Partial<ApplyFormData> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\+?[\d\s\-().]{7,15}$/.test(form.phone)) e.phone = 'Please enter a valid phone number';
    if (!form.contactDetails.trim()) e.contactDetails = 'Contact details are required';
    if (!form.qualification.trim()) e.qualification = 'Qualification is required';
    if (!form.cvMessage.trim()) e.cvMessage = 'CV message is required';
    else if (form.cvMessage.length > MAX_CV_CHARS) e.cvMessage = `Maximum ${MAX_CV_CHARS} characters`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !job) return;
    setSubmitting(true);
    try {
      await api('/public/job/apply', {
        method: 'POST',
        body: {
          jobId: job.id,
          companyName: job.companyName,
          roleTitle: job.roleTitle,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          contactDetails: form.contactDetails,
          qualification: form.qualification,
          cvMessage: form.cvMessage,
        },
      });
      if (job?.id) {
        onApplied(job.id);
        const next = Array.from(new Set([...loadAppliedJobs(), job.id]));
        saveAppliedJobs(next);
      }
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof ApplyFormData,
    label: string,
    type: 'input' | 'textarea' = 'input',
    inputType = 'text'
  ) => (
    <div className="space-y-1">
      <Label htmlFor={key}>{label} <span className="text-red-500">*</span></Label>
      {type === 'textarea' ? (
        <>
          <Textarea
            id={key}
            rows={6}
            maxLength={MAX_CV_CHARS}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder="Paste or type your CV / cover letter here..."
            className={errors[key] ? 'border-red-400' : ''}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span className={errors[key] ? 'text-red-500' : ''}>{errors[key] || ' '}</span>
            <span className={form[key].length > MAX_CV_CHARS ? 'text-red-500' : ''}>
              {form[key].length} / {MAX_CV_CHARS}
            </span>
          </div>
        </>
      ) : (
        <>
          <Input
            id={key}
            type={inputType}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className={errors[key] ? 'border-red-400' : ''}
          />
          {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {submitted ? 'Application Submitted!' : `Apply — ${job?.roleTitle || 'Untitled Role'}`}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Application submitted successfully!</h3>
            <p className="text-sm text-gray-500">
              Thank you for applying to <strong>{job?.roleTitle || 'Untitled Role'}</strong> at <strong>{job?.companyName || 'Hiring Organization'}</strong>.
              You will be contacted if selected.
            </p>
            <Button onClick={onClose} className="bg-primary text-primary-foreground hover:bg-primary/90">Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              {submitting ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-black" />
                  <p className="text-sm text-gray-500">Submitting application…</p>
                </div>
              ) : (
                <>
                  {field('fullName', 'Full Name')}
                  {field('email', 'Email Address', 'input', 'email')}
                  {field('phone', 'Phone Number', 'input', 'tel')}
                  {field('contactDetails', 'Contact Details (LinkedIn / alternate contact)')}
                  {field('qualification', 'Qualifications')}
                  {field('cvMessage', 'CV / Cover Letter', 'textarea')}
                </>
              )}
            </div>
            {!submitting && (
              <DialogFooter>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Submit Application
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({
  job,
  applied,
  onDetails,
  onApply,
}: {
  job: PublicJob;
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

      <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700" onClick={onDetails}>
          <Eye className="h-4 w-4 mr-1" />
          Details
        </Button>
        <Button
          size="sm"
          disabled={applied}
          className={applyButtonClass}
          onClick={onApply}
        >
          {applied ? 'Applied' : 'Apply'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Hirings List Page ───────────────────────────────────────────────────
export default function HiringsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'deadline' | 'alphabetical'>('latest');
  const [applyJob, setApplyJob] = useState<PublicJob | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    setAppliedJobIds(loadAppliedJobs());
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;
    // Clear any pending retry timer before starting a new fetch
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    setLoading(true);
    if (!isRetry) setError(null);
    try {
      // HIRING-FIX: Public endpoint now returns { jobs, total }.
      const data = await api('/public/jobs');
      // HIRING-FIX: Keep backward compatibility with older array-only payloads.
      const nextJobs = Array.isArray(data?.jobs) ? data.jobs : (Array.isArray(data) ? data : []);
      if (mountedRef.current) {
        setJobs(nextJobs);
        setError(null);
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      console.error('Failed to load public jobs:', e?.message);
      if (!isRetry) {
        // On first failure, silently retry once after 3 s before surfacing the error
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          invalidateCache('/public/jobs');
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
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Periodic polling: re-fetch every 60 s as fallback when realtime fails ──
  useEffect(() => {
    const iv = setInterval(() => {
      // Skip the poll while the tab is hidden — the visibilitychange handler
      // will trigger a fresh fetch as soon as the user returns to the page.
      if (document.visibilityState !== 'visible') return;
      invalidateCache('/public/jobs');
      fetchJobs();
    }, 60000);
    return () => clearInterval(iv);
  }, [fetchJobs]);

  // ── Refetch when the tab regains focus / visibility ────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        invalidateCache('/public/jobs');
        fetchJobs();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchJobs]);

  // ── Supabase Realtime: re-fetch when job postings change ───────────────────
  useEffect(() => {
    const refetch = () => {
      // Bust the cache so the next fetch always gets fresh data from the server
      invalidateCache('/public/jobs');
      fetchJobs();
    };
    const channel = supabase
      .channel('realtime:job-posting')
      .on('broadcast', { event: 'INSERT' }, refetch)
      .on('broadcast', { event: 'UPDATE' }, refetch)
      .on('broadcast', { event: 'DELETE' }, refetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchJobs]);

  // Unique locations for filter
  const locations = Array.from(
    new Set(jobs.map((j) => asString(j.location).trim()).filter(Boolean))
  ) as string[];

  // Unique employment types for filter — only show types that exist in the loaded jobs
  const employmentTypes = Array.from(
    new Set(jobs.map((j) => asString(j.employmentType).trim()).filter(Boolean))
  ).sort() as string[];

  // HIRING-FIX: Add department filter options from loaded jobs.
  const departments = Array.from(
    new Set(jobs.map((j) => asString(j.department).trim()).filter(Boolean))
  ).sort() as string[];

  // Filter + sort
  const filtered = jobs
    .filter((j) => {
      const q = search.toLowerCase();
      const roleTitle = asString(j.roleTitle);
      const companyName = asString(j.companyName);
      const employmentType = asString(j.employmentType);
      const department = asString(j.department);
      const matchSearch = !q || roleTitle.toLowerCase().includes(q) || companyName.toLowerCase().includes(q);
      const matchLocation = !filterLocation || filterLocation === 'all' || j.location === filterLocation;
      const matchType = !filterType || filterType === 'all' || employmentType === filterType;
      const matchDepartment = !filterDepartment || filterDepartment === 'all' || department === filterDepartment;
      return matchSearch && matchLocation && matchType && matchDepartment;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return a.roleTitle.localeCompare(b.roleTitle);
    });

  return (
    <div className="min-h-screen public-page-bg flex flex-col">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative text-white py-16 px-4 overflow-hidden">
        {/* Background Image */}
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
            Browse job openings from organizations hiring through Blumebyte HR
          </p>
          <div className="relative max-w-xl mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or company…"
              aria-label="Search jobs by title or company"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {employmentTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* HIRING-FIX: Department filter */}
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>

          {(search || (filterLocation && filterLocation !== 'all') || (filterType && filterType !== 'all') || (filterDepartment && filterDepartment !== 'all')) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterLocation(''); setFilterType(''); setFilterDepartment(''); }}>
              Clear Filters
            </Button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found
          </span>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-600">{error}</p>
            <Button variant="outline" onClick={() => { invalidateCache('/public/jobs'); fetchJobs(true); }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-600">No Job Openings</h3>
            <p className="text-sm text-gray-400">
              {jobs.length === 0
                ? 'No open positions right now. Check back soon.'
                : 'No jobs match your current filters. Try adjusting your search criteria.'}
            </p>
            {jobs.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterLocation(''); setFilterType(''); setFilterDepartment(''); }}>
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

      {/* Modals */}
      <ApplyModal
        job={applyJob}
        open={!!applyJob}
        onClose={() => setApplyJob(null)}
        onApplied={(jobId) => setAppliedJobIds((prev) => Array.from(new Set([...prev, jobId])))}
      />

      <PublicFooter />
    </div>
  );
}

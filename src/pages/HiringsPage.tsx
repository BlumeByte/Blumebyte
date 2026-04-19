import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  Search, MapPin, Briefcase, Building2, Clock, ChevronLeft,
  Loader2, AlertCircle, RefreshCw, ArrowLeft, Calendar
} from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { api } from '../lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PublicJob {
  id: string;
  companyName: string;
  roleTitle: string;
  employmentType?: string;
  location?: string;
  description?: string;
  requirements?: string;
  qualifications?: string;
  deadline?: string;
  createdAt: string;
  visibilityType: string;
  status: string;
}

interface ApplyFormData {
  fullName: string;
  email: string;
  phone: string;
  qualification: string;
  cvMessage: string;
}

const EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Remote', 'Hybrid'];
const MAX_CV_CHARS = 4000;

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
}: {
  job: PublicJob | null;
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ApplyFormData>({
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    cvMessage: '',
  });
  const [errors, setErrors] = useState<Partial<ApplyFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setForm({ fullName: '', email: '', phone: '', qualification: '', cvMessage: '' });
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
          qualification: form.qualification,
          cvMessage: form.cvMessage,
        },
      });
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
            {submitted ? 'Application Submitted!' : `Apply — ${job?.roleTitle || ''}`}
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
              Thank you for applying to <strong>{job?.roleTitle}</strong> at <strong>{job?.companyName}</strong>.
              You will be contacted if selected.
            </p>
            <Button onClick={onClose} className="bg-black text-white hover:bg-gray-800">Close</Button>
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
                  {field('qualification', 'Qualifications')}
                  {field('cvMessage', 'CV / Cover Letter', 'textarea')}
                </>
              )}
            </div>
            {!submitting && (
              <DialogFooter>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-black text-white hover:bg-gray-800">
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

// ─── Job Details Modal ────────────────────────────────────────────────────────
function JobDetailsModal({
  job,
  open,
  onClose,
  onApply,
}: {
  job: PublicJob | null;
  open: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  if (!job) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{job.roleTitle}</DialogTitle>
          <p className="text-sm text-gray-500 flex items-center gap-1 pt-1">
            <Building2 className="h-4 w-4" /> {job.companyName}
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-wrap gap-2">
            {job.location && (
              <TagChip><MapPin className="h-3 w-3 inline mr-1" />{job.location}</TagChip>
            )}
            {job.employmentType && <TagChip>{job.employmentType}</TagChip>}
            {job.deadline && (
              <TagChip><Calendar className="h-3 w-3 inline mr-1" />Deadline: {new Date(job.deadline).toLocaleDateString()}</TagChip>
            )}
          </div>

          {job.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}
          {job.requirements && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}
          {job.qualifications && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Qualifications</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.qualifications}</p>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white pt-4 border-t">
          <Button onClick={onApply} className="w-full bg-black text-white hover:bg-gray-800">
            Apply Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({
  job,
  onDetails,
  onApply,
}: {
  job: PublicJob;
  onDetails: () => void;
  onApply: () => void;
}) {
  const preview = job.description
    ? job.description.length > 150
      ? job.description.slice(0, 150) + '…'
      : job.description
    : '';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col gap-4 cursor-pointer" onClick={onDetails}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{job.roleTitle}</h3>
          <p className="text-sm text-gray-500 truncate">{job.companyName}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2">
        {job.location && (
          <TagChip><MapPin className="h-3 w-3 inline mr-0.5" />{job.location}</TagChip>
        )}
        {job.employmentType && <TagChip>{job.employmentType}</TagChip>}
        {job.deadline && (
          <TagChip>Due {new Date(job.deadline).toLocaleDateString()}</TagChip>
        )}
      </div>

      {/* Preview */}
      {preview && <p className="text-sm text-gray-600 line-clamp-3">{preview}</p>}

      {/* Buttons */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" className="flex-1" onClick={onDetails}>
          View Details
        </Button>
        <Button size="sm" className="flex-1 bg-black text-white hover:bg-gray-800" onClick={onApply}>
          Apply Now
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
  const [sortBy, setSortBy] = useState<'latest' | 'deadline' | 'alphabetical'>('latest');
  const [detailJob, setDetailJob] = useState<PublicJob | null>(null);
  const [applyJob, setApplyJob] = useState<PublicJob | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/public/jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError('Unable to load job openings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Unique locations for filter
  const locations = Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))) as string[];

  // Filter + sort
  const filtered = jobs
    .filter((j) => {
      const q = search.toLowerCase();
      const matchSearch = !q || j.roleTitle.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q);
      const matchLocation = !filterLocation || filterLocation === 'all' || j.location === filterLocation;
      const matchType = !filterType || filterType === 'all' || j.employmentType === filterType;
      return matchSearch && matchLocation && matchType;
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
    <div className="min-h-screen bg-gray-50">
      {/* Simple Nav */}
      <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logoImage} alt="Blumebyte" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
              </Button>
              <Button size="sm" onClick={() => navigate('/login')} className="bg-black text-white hover:bg-gray-800">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-black to-gray-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Find Your Next Opportunity</h1>
          <p className="text-lg text-gray-300">
            Browse job openings from organizations hiring through Blumebyte HR
          </p>
          <div className="relative max-w-xl mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or company…"
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
              {EMPLOYMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
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

          {(search || (filterLocation && filterLocation !== 'all') || (filterType && filterType !== 'all')) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterLocation(''); setFilterType(''); }}>
              Clear Filters
            </Button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found
          </span>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-600">{error}</p>
            <Button variant="outline" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-600">No open positions available right now</h3>
            <p className="text-sm text-gray-400">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDetails={() => setDetailJob(job)}
                onApply={() => setApplyJob(job)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <JobDetailsModal
        job={detailJob}
        open={!!detailJob}
        onClose={() => setDetailJob(null)}
        onApply={() => { setApplyJob(detailJob); setDetailJob(null); }}
      />
      <ApplyModal
        job={applyJob}
        open={!!applyJob}
        onClose={() => setApplyJob(null)}
      />

      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Blumebyte HR. All rights reserved.
      </footer>
    </div>
  );
}

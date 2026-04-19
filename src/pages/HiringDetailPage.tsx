import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, MapPin, Calendar, Loader2, AlertCircle
} from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { api } from '../lib/api-client';

const MAX_CV_CHARS = 4000;

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
}

interface ApplyFormData {
  fullName: string;
  email: string;
  phone: string;
  qualification: string;
  cvMessage: string;
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {children}
    </span>
  );
}

export default function HiringDetailPage() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    api(`/public/jobs/${jobId}`)
      .then((data) => { setJob(data); })
      .catch(() => setError('Job not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [jobId]);

  // ─── Apply Form ───────────────────────────────────────────────────────────
  const [form, setForm] = useState<ApplyFormData>({
    fullName: '', email: '', phone: '', qualification: '', cvMessage: ''
  });
  const [errors, setErrors] = useState<Partial<ApplyFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      toast.error(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputField = (key: keyof ApplyFormData, label: string, type = 'text') => (
    <div className="space-y-1">
      <Label htmlFor={key}>{label} <span className="text-red-500">*</span></Label>
      <Input
        id={key}
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={errors[key] ? 'border-red-400' : ''}
      />
      {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logoImage} alt="Blumebyte" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
            <Button variant="ghost" size="sm" onClick={() => navigate('/hirings')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> All Jobs
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-600">{error}</p>
            <Button variant="outline" onClick={() => navigate('/hirings')}>Browse all jobs</Button>
          </div>
        ) : job ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.roleTitle}</h1>
                <p className="text-gray-600 mt-1 flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> {job.companyName}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {job.location && <TagChip><MapPin className="h-3 w-3 inline mr-0.5" />{job.location}</TagChip>}
              {job.employmentType && <TagChip>{job.employmentType}</TagChip>}
              {job.deadline && (
                <TagChip>
                  <Calendar className="h-3 w-3 inline mr-0.5" />
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </TagChip>
              )}
            </div>

            {/* Sections */}
            {job.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </div>
            )}
            {job.requirements && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
              </div>
            )}
            {job.qualifications && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Qualifications</h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.qualifications}</p>
              </div>
            )}

            {/* CTA */}
            <div className="border-t pt-6 mt-6">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-black text-white hover:bg-gray-800"
                onClick={() => setApplyOpen(true)}
              >
                Apply for this position
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Apply Modal */}
      <Dialog open={applyOpen} onOpenChange={(v) => { if (!v) { setApplyOpen(false); setSubmitted(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{submitted ? 'Application Submitted!' : `Apply — ${job?.roleTitle}`}</DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Application submitted successfully!</h3>
              <p className="text-sm text-gray-500">You will be contacted if selected.</p>
              <Button onClick={() => { setApplyOpen(false); setSubmitted(false); }} className="bg-black text-white hover:bg-gray-800">Close</Button>
            </div>
          ) : submitting ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
              <p className="text-sm text-gray-500">Submitting application…</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                {inputField('fullName', 'Full Name')}
                {inputField('email', 'Email Address', 'email')}
                {inputField('phone', 'Phone Number', 'tel')}
                {inputField('qualification', 'Qualifications')}
                <div className="space-y-1">
                  <Label htmlFor="cvMessage">CV / Cover Letter <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="cvMessage"
                    rows={6}
                    maxLength={MAX_CV_CHARS}
                    value={form.cvMessage}
                    onChange={(e) => setForm((f) => ({ ...f, cvMessage: e.target.value }))}
                    placeholder="Paste or type your CV / cover letter here..."
                    className={errors.cvMessage ? 'border-red-400' : ''}
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className={errors.cvMessage ? 'text-red-500' : ''}>{errors.cvMessage || ' '}</span>
                    <span className={form.cvMessage.length > MAX_CV_CHARS ? 'text-red-500' : ''}>
                      {form.cvMessage.length} / {MAX_CV_CHARS}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setApplyOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-black text-white hover:bg-gray-800">
                  Submit Application
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <footer className="border-t bg-white py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Blumebyte HR. All rights reserved.
      </footer>
    </div>
  );
}

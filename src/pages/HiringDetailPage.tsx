import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, ArrowLeft, Building2, Calendar, Loader2, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PublicFooter, PublicNavbar } from '../components/PublicNavFooter';
import { PublicHiringApplyDialog } from '../components/PublicHiringApplyDialog';
import {
  DEFAULT_PUBLIC_HIRING_COMPANY_NAME,
  fetchPublicHiringDetail,
  hasAppliedToPublicHiring,
  type PublicHiring,
} from '../lib/public-hiring';

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
  const [job, setJob] = useState<PublicHiring | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    setApplied(jobId ? hasAppliedToPublicHiring(jobId) : false);
  }, [jobId]);

  useEffect(() => {
    const loadJob = async () => {
      if (!jobId) {
        setError('This position is no longer available.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextJob = await fetchPublicHiringDetail(jobId);
        setJob(nextJob);
      } catch (err: any) {
        setJob(null);
        setError(err?.status === 404 ? 'This position is no longer available.' : 'Unable to load this position right now.');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId]);

  return (
    <div className="min-h-screen public-page-bg flex flex-col">
      <PublicNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <Button variant="ghost" size="sm" onClick={() => navigate('/hirings')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> All Jobs
        </Button>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-600">{error}</p>
            <Button variant="outline" onClick={() => navigate('/hirings')}>Back to all jobs</Button>
          </div>
        ) : job ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.roleTitle}</h1>
                <p className="text-gray-600 mt-1 flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> {job.companyName || DEFAULT_PUBLIC_HIRING_COMPANY_NAME}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {job.location && <TagChip><MapPin className="h-3 w-3 inline mr-0.5" />{job.location}</TagChip>}
              {job.department && <TagChip>{job.department}</TagChip>}
              {job.employmentType && <TagChip>{job.employmentType}</TagChip>}
              {job.salaryRange && <TagChip>{job.salaryRange}</TagChip>}
              {job.deadline && (
                <TagChip>
                  <Calendar className="h-3 w-3 inline mr-0.5" />
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </TagChip>
              )}
            </div>

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

            <div className="border-t pt-6 mt-6">
              <Button
                size="lg"
                disabled={applied}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-slate-200 disabled:text-blue-700"
                onClick={() => setApplyOpen(true)}
              >
                {applied ? 'Already Applied' : 'Apply for this position'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <PublicHiringApplyDialog
        job={job}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onApplied={() => setApplied(true)}
      />

      <PublicFooter />
    </div>
  );
}

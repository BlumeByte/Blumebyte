import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  MAX_PUBLIC_HIRING_CV_CHARS,
  markPublicHiringApplied,
  type PublicHiring,
  type PublicHiringApplicationFormData,
  submitPublicHiringApplication,
} from '../lib/public-hiring';

export function PublicHiringApplyDialog({
  job,
  open,
  onClose,
  onApplied,
}: {
  job: PublicHiring | null;
  open: boolean;
  onClose: () => void;
  onApplied?: (jobId: string) => void;
}) {
  const [form, setForm] = useState<PublicHiringApplicationFormData>({
    fullName: '',
    email: '',
    phone: '',
    contactDetails: '',
    qualification: '',
    cvMessage: '',
  });
  const [errors, setErrors] = useState<Partial<PublicHiringApplicationFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setForm({
      fullName: '',
      email: '',
      phone: '',
      contactDetails: '',
      qualification: '',
      cvMessage: '',
    });
    setErrors({});
    setSubmitting(false);
    setSubmitted(false);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const validate = () => {
    const nextErrors: Partial<PublicHiringApplicationFormData> = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Please enter a valid email';
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s\-().]{7,15}$/.test(form.phone)) nextErrors.phone = 'Please enter a valid phone number';
    if (!form.contactDetails.trim()) nextErrors.contactDetails = 'Contact details are required';
    if (!form.qualification.trim()) nextErrors.qualification = 'Qualification is required';
    if (!form.cvMessage.trim()) nextErrors.cvMessage = 'CV message is required';
    else if (form.cvMessage.length > MAX_PUBLIC_HIRING_CV_CHARS) {
      nextErrors.cvMessage = `Maximum ${MAX_PUBLIC_HIRING_CV_CHARS} characters`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!job || !validate()) return;
    setSubmitting(true);
    try {
      await submitPublicHiringApplication({
        jobId: job.id,
        companyName: job.companyName,
        roleTitle: job.roleTitle,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        contactDetails: form.contactDetails,
        qualification: form.qualification,
        cvMessage: form.cvMessage,
      });
      markPublicHiringApplied(job.id);
      onApplied?.(job.id);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof PublicHiringApplicationFormData,
    label: string,
    type: 'input' | 'textarea' = 'input',
    inputType = 'text',
  ) => (
    <div className="space-y-1">
      <Label htmlFor={key}>{label} <span className="text-red-500">*</span></Label>
      {type === 'textarea' ? (
        <>
          <Textarea
            id={key}
            rows={6}
            maxLength={MAX_PUBLIC_HIRING_CV_CHARS}
            value={form[key]}
            onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
            placeholder="Paste or type your CV / cover letter here..."
            className={errors[key] ? 'border-red-400' : ''}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span className={errors[key] ? 'text-red-500' : ''}>{errors[key] || ' '}</span>
            <span className={form[key].length > MAX_PUBLIC_HIRING_CV_CHARS ? 'text-red-500' : ''}>
              {form[key].length} / {MAX_PUBLIC_HIRING_CV_CHARS}
            </span>
          </div>
        </>
      ) : (
        <>
          <Input
            id={key}
            type={inputType}
            value={form[key]}
            onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
            className={errors[key] ? 'border-red-400' : ''}
          />
          {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{submitted ? 'Application Submitted!' : `Apply — ${job?.roleTitle || 'Untitled Role'}`}</DialogTitle>
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

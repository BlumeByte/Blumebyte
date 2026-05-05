import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import {
  Briefcase, Clock, CalendarDays, GraduationCap, Star, ClipboardList,
  Loader2, RefreshCw, Search, MapPin, Building2, DollarSign, Send, Eye,
  FileText, CheckCircle, XCircle, AlertCircle, ChevronRight, Play,
  BookOpen, MessageSquare, CheckSquare, Square
} from 'lucide-react';
import { LeaveApplicationForm } from './LeaveApplicationForm';

export function SharedSelfServiceHub({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'tasks' | 'onboarding' | 'reviews' | 'questionnaires' | 'leave'>('jobs');
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [myTraining, setMyTraining] = useState<any[]>([]);
  const [myOnboarding, setMyOnboarding] = useState<any[]>([]);
  const [myQuestionnaires, setMyQuestionnaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobSearch, setJobSearch] = useState('');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Interactive dialogs
  const [taskDialog, setTaskDialog] = useState<any>(null);
  const [trainingDialog, setTrainingDialog] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [questionnaireDialog, setQuestionnaireDialog] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for interactive dialogs
  const [taskNotes, setTaskNotes] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSelfRating, setReviewSelfRating] = useState('');
  const [trainingAnswers, setTrainingAnswers] = useState<Record<number, string>>({});
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jobs, apps, tasks, reviews, train, onboard, questionnaires] = await Promise.all([
        api('/open-job-postings', { token: accessToken }).catch(() => []),
        api('/job-applications', { token: accessToken }).catch(() => []),
        api('/my-tasks', { token: accessToken }).catch(() => []),
        api('/my-reviews', { token: accessToken }).catch(() => []),
        api('/my-training', { token: accessToken }).catch(() => []),
        api('/my-onboarding', { token: accessToken }).catch(() => []),
        api('/my-questionnaires', { token: accessToken }).catch(() => []),
      ]);
      setJobPostings((Array.isArray(jobs) ? jobs : []).filter((j: any) => j.status === 'open' || j.status === 'active'));
      setMyApplications(Array.isArray(apps) ? apps : []);
      setMyTasks(Array.isArray(tasks) ? tasks : []);
      setMyReviews(Array.isArray(reviews) ? reviews : []);
      setMyTraining(Array.isArray(train) ? train : []);
      setMyOnboarding(Array.isArray(onboard) ? onboard : []);
      setMyQuestionnaires(Array.isArray(questionnaires) ? questionnaires : []);
    } catch (e) { console.log('Self-service hub load error:', e); }
    setLoading(false);
  }, [accessToken, user]);

  useEffect(() => { load(); }, [load]);
  // PERFORMANCE: Reduced polling from 30s to 60s
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      await api('/job-applications', {
        method: 'POST',
        body: {
          jobPostingId: selectedJob.id,
          jobTitle: selectedJob.title || selectedJob.name,
          jobDepartment: selectedJob.department || '',
          jobCompany: selectedJob.company || '',
          jobSalaryRange: selectedJob.salary || selectedJob.salaryRange || '',
          jobType: selectedJob.type || selectedJob.employmentType || '',
          coverLetter,
        },
        token: accessToken,
      });
      toast.success('Application submitted! HR will review your application.');
      setApplyDialogOpen(false);
      setCoverLetter('');
      load();
    } catch (e: any) { toast.error(e.message); }
    setApplying(false);
  };

  const alreadyApplied = (jobId: string) => myApplications.some(a => a.jobPostingId === jobId);

  const filteredJobs = jobPostings.filter(j => {
    if (!jobSearch) return true;
    const s = jobSearch.toLowerCase();
    return (j.title || j.name || '').toLowerCase().includes(s) || (j.department || '').toLowerCase().includes(s) || (j.location || '').toLowerCase().includes(s);
  });

  // ============ TASK HANDLERS ============
  const openTask = (t: any) => {
    setTaskDialog(t);
    setTaskNotes(t.notes || t.employeeNotes || '');
    setTaskStatus(t.status || 'pending');
  };

  const handleTaskUpdate = async () => {
    if (!taskDialog) return;
    setSubmitting(true);
    try {
      const res = await api(`/my-tasks/${taskDialog.id}`, {
        method: 'PUT',
        body: { status: taskStatus, notes: taskNotes },
        token: accessToken,
      });
      toast.success('Task updated successfully');
      setTaskDialog(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  // ============ TRAINING HANDLERS ============
  const openTraining = (t: any) => {
    setTrainingDialog(t);
    const existing: Record<number, string> = {};
    if (Array.isArray(t.assessmentAnswers)) {
      t.assessmentAnswers.forEach((a: string, i: number) => { existing[i] = a; });
    }
    setTrainingAnswers(existing);
  };

  const handleTrainingSubmit = async () => {
    if (!trainingDialog) return;
    setSubmitting(true);
    try {
      const answers = Object.entries(trainingAnswers).sort(([a], [b]) => Number(a) - Number(b)).map(([, v]) => v);
      await api(`/my-training/${trainingDialog.id}`, {
        method: 'PUT',
        body: { assessmentAnswers: answers, completedByUser: user?.id, completedAt: new Date().toISOString() },
        token: accessToken,
      });
      toast.success('Training assessment submitted');
      setTrainingDialog(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  // ============ REVIEW HANDLERS ============
  const openReview = (r: any) => {
    setReviewDialog(r);
    setReviewNotes(r.employeeNotes || r.selfAssessment || '');
    setReviewSelfRating(r.selfRating?.toString() || '');
  };

  const handleReviewSubmit = async () => {
    if (!reviewDialog) return;
    setSubmitting(true);
    try {
      await api(`/my-reviews/${reviewDialog.id}`, {
        method: 'PUT',
        body: {
          employeeNotes: reviewNotes,
          selfRating: reviewSelfRating ? Number(reviewSelfRating) : undefined,
          employeeSubmittedAt: new Date().toISOString(),
        },
        token: accessToken,
      });
      toast.success('Review response submitted');
      setReviewDialog(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  // ============ QUESTIONNAIRE HANDLERS ============
  const openQuestionnaire = (q: any) => {
    setQuestionnaireDialog(q);
    const existing: Record<number, string> = {};
    if (Array.isArray(q.answers)) {
      q.answers.forEach((a: string, i: number) => { existing[i] = a; });
    }
    setQuestionnaireAnswers(existing);
  };

  const handleQuestionnaireSubmit = async () => {
    if (!questionnaireDialog) return;
    setSubmitting(true);
    try {
      const answers = Object.entries(questionnaireAnswers).sort(([a], [b]) => Number(a) - Number(b)).map(([, v]) => v);
      await api(`/my-questionnaires/${questionnaireDialog.id}`, {
        method: 'PUT',
        body: { answers, status: 'submitted', submittedAt: new Date().toISOString() },
        token: accessToken,
      });
      toast.success('Questionnaire submitted successfully');
      setQuestionnaireDialog(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  // ============ ONBOARDING HANDLERS ============
  const handleOnboardingToggle = async (item: any) => {
    try {
      const newStatus = item.status === 'completed' ? 'pending' : 'completed';
      await api(`/my-onboarding/${item.id}`, {
        method: 'PUT',
        body: { status: newStatus },
        token: accessToken,
      });
      toast.success(newStatus === 'completed' ? 'Step marked complete' : 'Step unmarked');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': case 'submitted': case 'reviewed': return 'bg-green-100 text-green-800';
      case 'in-progress': case 'active': return 'bg-blue-100 text-blue-800';
      case 'overdue': case 'urgent': case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  const tabs = [
    { id: 'jobs', label: 'Job Board', icon: Briefcase },
    { id: 'tasks', label: 'My Tasks & Training', icon: ClipboardList },
    { id: 'onboarding', label: 'My Onboarding', icon: GraduationCap },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'questionnaires', label: 'My Questionnaires', icon: FileText },
    { id: 'leave', label: 'Leave Application', icon: BookOpen },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><Briefcase className="w-5 h-5 text-green-600" /></div>
        <div>
          <h1 className="text-xl font-bold">My Self-Service Hub</h1>
          <p className="text-sm text-muted-foreground">Apply for vacancies, complete tasks, view reviews & more</p>
        </div>
      </div>

      <div className="flex gap-1 mt-4 border-b overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
        ) : (
          <>
            {/* ============ JOB BOARD ============ */}
            {activeTab === 'jobs' && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div><CardTitle className="text-base">Open Job Vacancies</CardTitle><p className="text-sm text-muted-foreground mt-0.5">Current open positions &mdash; click "Apply Now" to submit</p></div>
                      <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search by title, department, location..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} className="pl-9" />
                    </div>
                    {filteredJobs.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground"><Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No open positions at this time</p></div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredJobs.map(job => (
                          <Card key={job.id} className="border-2 hover:border-blue-200 transition-colors flex flex-col">
                            <CardContent className="pt-5 flex flex-col flex-1">
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <h3 className="font-semibold text-sm flex-1 min-w-0">{job.title || job.name}</h3>
                                <Badge className="bg-green-100 text-green-700 text-[10px] flex-shrink-0">Open</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Building2 className="w-3 h-3 flex-shrink-0" /><span className="truncate">{job.department || job.company || 'General'}</span></p>
                              <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                                {job.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{job.location}</span></span>}
                                {(job.type || job.employmentType) && <span className="flex items-center gap-0.5 whitespace-nowrap"><Clock className="w-3 h-3 flex-shrink-0" />{job.type || job.employmentType}</span>}
                              </div>
                              {job.deadline && <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-0.5"><CalendarDays className="w-3 h-3 flex-shrink-0" />Deadline: {job.deadline}</p>}
                              {(job.salary || job.salaryRange) && (
                                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1"><DollarSign className="w-3 h-3 flex-shrink-0" /><span className="truncate">{job.salary || job.salaryRange}</span></p>
                              )}
                              {job.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
                              <div className="flex flex-col gap-2 mt-auto pt-3 border-t">
                                <span className="text-[10px] text-muted-foreground">Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</span>
                                <div className="flex gap-1.5 flex-wrap">
                                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1 min-w-[80px]" onClick={() => { setSelectedJob(job); setDetailDialogOpen(true); }}>
                                    <Eye className="w-3 h-3 mr-1" />Details
                                  </Button>
                                  {alreadyApplied(job.id) ? (
                                    <Badge className="bg-blue-100 text-blue-700 text-[10px] h-7 px-3 flex items-center">Applied</Badge>
                                  ) : (
                                    <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 flex-1 min-w-[100px]" onClick={() => { setSelectedJob(job); setCoverLetter(''); setApplyDialogOpen(true); }}>
                                      <Send className="w-3 h-3 mr-1" />Apply Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* My Applications */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /><div><CardTitle className="text-base">My Applications</CardTitle><p className="text-sm text-muted-foreground">Track your submitted applications</p></div></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {myApplications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground"><p>No applications submitted yet</p></div>
                    ) : (
                      <div className="space-y-3">
                        {myApplications.map(app => (
                          <div key={app.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{app.jobTitle}</p>
                              <p className="text-xs text-muted-foreground">{app.jobCompany || app.jobDepartment || ''} &middot; Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                            </div>
                            <Badge className={statusColor(app.status)}>{app.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* ============ MY TASKS & TRAINING ============ */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-600" /><CardTitle className="text-base">My Tasks</CardTitle></div>
                      <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {myTasks.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground"><ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No tasks assigned to you</p></div>
                    ) : (
                      <div className="space-y-2">
                        {myTasks.map(t => (
                          <div key={t.id} onClick={() => openTask(t)}
                            className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{t.title || t.name}</p>
                                <Badge className={statusColor(t.status || 'pending')}>{t.status || 'pending'}</Badge>
                                {t.priority && <Badge variant="outline" className="text-[10px]">{t.priority}</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString()}` : 'No due date'}
                                {t.category ? ` \u2022 ${t.category}` : ''}
                                {t.description ? ` \u2014 ${t.description.slice(0, 80)}` : ''}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-cyan-600" /><CardTitle className="text-base">My Training Programs</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    {myTraining.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground"><GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No training programs assigned</p></div>
                    ) : (
                      <div className="space-y-2">
                        {myTraining.map(t => (
                          <div key={t.id} onClick={() => openTraining(t)}
                            className="flex items-center justify-between p-4 bg-cyan-50/50 rounded-lg hover:bg-cyan-50 cursor-pointer transition-colors group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{t.name || t.title}</p>
                                <Badge className={statusColor(t.status || 'planned')}>{t.status || 'planned'}</Badge>
                                {t.type && <Badge variant="outline" className="text-[10px]">{t.type}</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t.duration ? `${t.duration} hours` : ''}
                                {t.instructorName ? ` \u2022 Instructor: ${t.instructorName}` : ''}
                                {t.startDate ? ` \u2022 Start: ${new Date(t.startDate).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ============ MY ONBOARDING ============ */}
            {activeTab === 'onboarding' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-green-600" /><CardTitle className="text-base">My Onboarding Checklist</CardTitle></div>
                    <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {myOnboarding.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p>Your onboarding steps will appear here once assigned by HR</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const completed = myOnboarding.filter(i => i.status === 'completed').length;
                        const total = myOnboarding.length;
                        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return (
                          <div className="mb-4 p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800">Progress</span>
                              <span className="text-sm font-bold text-green-700">{completed}/{total} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                      {myOnboarding.map(item => (
                        <div key={item.id}
                          onClick={() => handleOnboardingToggle(item)}
                          className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${item.status === 'completed' ? 'bg-green-50' : 'bg-accent hover:bg-blue-50'}`}>
                          {item.status === 'completed' ? (
                            <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{item.title || item.name || item.step}</p>
                            {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                            {item.category && <span className="text-[10px] text-muted-foreground">{item.category}</span>}
                          </div>
                          <Badge className={statusColor(item.status || 'pending')}>{item.status || 'pending'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ============ MY REVIEWS ============ */}
            {activeTab === 'reviews' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /><CardTitle className="text-base">My Performance Reviews</CardTitle></div>
                    <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {myReviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground"><Star className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No reviews found</p></div>
                  ) : (
                    <div className="space-y-2">
                      {myReviews.map(r => (
                        <div key={r.id} onClick={() => openReview(r)}
                          className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-amber-50 cursor-pointer transition-colors group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{r.title || r.period || r.reviewPeriod || r.reviewType || 'Performance Review'}</p>
                              <Badge className={statusColor(r.status || 'pending')}>{r.status || 'pending'}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {r.reviewerName || r.reviewer || r.reviewedBy ? `Reviewer: ${r.reviewerName || r.reviewer || r.reviewedBy}` : ''}
                              {r.rating || r.score ? ` \u2022 Rating: ${r.rating || r.score}/5` : ''}
                              {r.createdAt ? ` \u2022 ${new Date(r.createdAt).toLocaleDateString()}` : ''}
                            </p>
                            {r.employeeNotes && <p className="text-xs text-blue-500 mt-0.5">You submitted a self-assessment</p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ============ MY QUESTIONNAIRES ============ */}
            {activeTab === 'questionnaires' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-purple-500" /><CardTitle className="text-base">My Questionnaires & 360° Feedback</CardTitle></div>
                    <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {myQuestionnaires.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground"><FileText className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No questionnaires assigned at this time</p></div>
                  ) : (
                    <div className="space-y-2">
                      {myQuestionnaires.map(q => (
                        <div key={q.id} onClick={() => openQuestionnaire(q)}
                          className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-purple-50 cursor-pointer transition-colors group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">
                                {q.type ? `360\u00b0 ${q.type.charAt(0).toUpperCase() + q.type.slice(1)} Feedback` : 'Feedback Questionnaire'}
                              </p>
                              <Badge className={statusColor(q.status || 'pending')}>{q.status || 'pending'}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {q.period ? `Period: ${q.period}` : ''}
                              {q.employeeName ? ` \u2022 For: ${q.employeeName}` : ''}
                              {q.reviewerName ? ` \u2022 From: ${q.reviewerName}` : ''}
                              {Array.isArray(q.customQuestions) ? ` \u2022 ${q.customQuestions.length} question${q.customQuestions.length !== 1 ? 's' : ''}` : ''}
                            </p>
                            {q.submittedAt && <p className="text-xs text-green-500 mt-0.5">Submitted on {new Date(q.submittedAt).toLocaleDateString()}</p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ============ LEAVE APPLICATION ============ */}
            {activeTab === 'leave' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-cyan-600" /><CardTitle className="text-base">Leave Application</CardTitle></div>
                    <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <LeaveApplicationForm />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ============ APPLY DIALOG ============ */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Apply for {selectedJob?.title || selectedJob?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-accent rounded-lg p-3">
              <p className="text-sm font-medium">{selectedJob?.title || selectedJob?.name}</p>
              <p className="text-xs text-muted-foreground">{selectedJob?.department || selectedJob?.company || ''}</p>
              {(selectedJob?.salary || selectedJob?.salaryRange) && <p className="text-xs text-green-600 mt-1">{selectedJob?.salary || selectedJob?.salaryRange}</p>}
            </div>
            <div>
              <Label>Cover Letter / Why are you a good fit?</Label>
              <Textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={5} placeholder="Tell us why you're interested in this role..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={applying} className="bg-blue-600 hover:bg-blue-700">
              {applying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}<Send className="w-4 h-4 mr-1" />Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ JOB DETAILS DIALOG ============ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selectedJob?.title || selectedJob?.name}</DialogTitle></DialogHeader>
          {selectedJob && (
            <div className="space-y-3 py-2">
              {[
                { label: 'Department', value: selectedJob.department },
                { label: 'Company', value: selectedJob.company },
                { label: 'Location', value: selectedJob.location },
                { label: 'Type', value: selectedJob.type || selectedJob.employmentType },
                { label: 'Salary', value: selectedJob.salary || selectedJob.salaryRange },
                { label: 'Deadline', value: selectedJob.deadline },
                { label: 'Status', value: selectedJob.status },
                { label: 'Description', value: selectedJob.description },
                { label: 'Requirements', value: selectedJob.requirements },
              ].filter(f => f.value).map((f, i) => (
                <div key={i} className="flex justify-between items-start py-1.5 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{f.label}</span>
                  <span className="text-sm text-right max-w-[60%]">{f.value}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
            {selectedJob && !alreadyApplied(selectedJob.id) && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setDetailDialogOpen(false); setCoverLetter(''); setApplyDialogOpen(true); }}>
                <Send className="w-4 h-4 mr-1" />Apply Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ TASK DIALOG ============ */}
      <Dialog open={!!taskDialog} onOpenChange={() => setTaskDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{taskDialog?.title || taskDialog?.name || 'Task Details'}</DialogTitle></DialogHeader>
          {taskDialog && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusColor(taskDialog.status || 'pending')}>{taskDialog.status || 'pending'}</Badge>
                {taskDialog.priority && <Badge variant="outline">{taskDialog.priority}</Badge>}
                {taskDialog.category && <Badge variant="outline" className="text-[10px]">{taskDialog.category}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {taskDialog.dueDate && <div><Label className="text-xs text-muted-foreground">Due Date</Label><p className="text-sm">{new Date(taskDialog.dueDate).toLocaleDateString()}</p></div>}
                {(taskDialog.assignedByName || taskDialog.assignedBy) && <div><Label className="text-xs text-muted-foreground">Assigned By</Label><p className="text-sm">{taskDialog.assignedByName || taskDialog.assignedBy}</p></div>}
                {taskDialog.progress && <div><Label className="text-xs text-muted-foreground">Progress</Label><p className="text-sm">{taskDialog.progress}%</p></div>}
                {taskDialog.createdAt && <div><Label className="text-xs text-muted-foreground">Created</Label><p className="text-sm">{new Date(taskDialog.createdAt).toLocaleDateString()}</p></div>}
              </div>
              {taskDialog.description && <div><Label className="text-xs text-muted-foreground">Description</Label><p className="text-sm mt-1 p-3 bg-accent rounded-lg whitespace-pre-wrap">{taskDialog.description}</p></div>}
              <Separator />
              <div>
                <Label className="text-xs font-medium">Update Status</Label>
                <Select value={taskStatus} onValueChange={setTaskStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Notes</Label>
                <Textarea value={taskNotes} onChange={e => setTaskNotes(e.target.value)} rows={3} placeholder="Add your notes here..." className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialog(null)}>Cancel</Button>
            <Button onClick={handleTaskUpdate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <CheckCircle className="w-4 h-4 mr-1" />Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ TRAINING DIALOG ============ */}
      <Dialog open={!!trainingDialog} onOpenChange={() => setTrainingDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{trainingDialog?.name || trainingDialog?.title || 'Training Details'}</DialogTitle></DialogHeader>
          {trainingDialog && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusColor(trainingDialog.status || 'planned')}>{trainingDialog.status || 'planned'}</Badge>
                {trainingDialog.type && <Badge variant="outline">{trainingDialog.type}</Badge>}
              </div>
              {trainingDialog.description && <div><Label className="text-xs text-gray-500">Description</Label><p className="text-sm mt-1">{trainingDialog.description}</p></div>}
              <div className="grid grid-cols-2 gap-3">
                {trainingDialog.duration && <div><Label className="text-xs text-gray-500">Duration</Label><p className="text-sm">{trainingDialog.duration} hours</p></div>}
                {trainingDialog.instructorName && <div><Label className="text-xs text-gray-500">Instructor</Label><p className="text-sm">{trainingDialog.instructorName}</p></div>}
                {trainingDialog.startDate && <div><Label className="text-xs text-gray-500">Start Date</Label><p className="text-sm">{new Date(trainingDialog.startDate).toLocaleDateString()}</p></div>}
                {trainingDialog.endDate && <div><Label className="text-xs text-gray-500">End Date</Label><p className="text-sm">{new Date(trainingDialog.endDate).toLocaleDateString()}</p></div>}
              </div>
              {Array.isArray(trainingDialog.assessmentQuestions) && trainingDialog.assessmentQuestions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Assessment Questions</Label>
                    <p className="text-xs text-gray-500 mb-3">Answer the questions below to complete this training assessment.</p>
                    <div className="space-y-4">
                      {trainingDialog.assessmentQuestions.map((q: string, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Label className="text-xs font-medium flex items-start gap-1.5">
                            <span className="text-gray-400 font-mono">Q{idx + 1}.</span>
                            <span>{q}</span>
                          </Label>
                          <Textarea
                            value={trainingAnswers[idx] || ''}
                            onChange={e => setTrainingAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                            rows={2}
                            placeholder="Your answer..."
                            className="mt-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {trainingDialog.completedByUser && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Assessment previously submitted{trainingDialog.completedAt ? ` on ${new Date(trainingDialog.completedAt).toLocaleDateString()}` : ''}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrainingDialog(null)}>Cancel</Button>
            {Array.isArray(trainingDialog?.assessmentQuestions) && trainingDialog.assessmentQuestions.length > 0 && (
              <Button onClick={handleTrainingSubmit} disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700">
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <Send className="w-4 h-4 mr-1" />Submit Assessment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ REVIEW DIALOG ============ */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{reviewDialog?.title || reviewDialog?.period || 'Performance Review'}</DialogTitle></DialogHeader>
          {reviewDialog && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusColor(reviewDialog.status || 'pending')}>{reviewDialog.status || 'pending'}</Badge>
                {(reviewDialog.rating || reviewDialog.score) && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-amber-700">{reviewDialog.rating || reviewDialog.score}/5</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(reviewDialog.reviewerName || reviewDialog.reviewer || reviewDialog.reviewedBy) && (
                  <div><Label className="text-xs text-gray-500">Reviewer</Label><p className="text-sm">{reviewDialog.reviewerName || reviewDialog.reviewer || reviewDialog.reviewedBy}</p></div>
                )}
                {reviewDialog.period && <div><Label className="text-xs text-gray-500">Period</Label><p className="text-sm">{reviewDialog.period}</p></div>}
                {reviewDialog.reviewType && <div><Label className="text-xs text-gray-500">Review Type</Label><p className="text-sm">{reviewDialog.reviewType}</p></div>}
                {reviewDialog.createdAt && <div><Label className="text-xs text-gray-500">Date</Label><p className="text-sm">{new Date(reviewDialog.createdAt).toLocaleDateString()}</p></div>}
              </div>
              {reviewDialog.comments && (
                <div><Label className="text-xs text-gray-500">Reviewer Comments</Label><p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg whitespace-pre-wrap">{reviewDialog.comments}</p></div>
              )}
              {reviewDialog.publicNotes && (
                <div><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm mt-1 p-3 bg-blue-50 rounded-lg whitespace-pre-wrap">{reviewDialog.publicNotes}</p></div>
              )}
              {Array.isArray(reviewDialog.goals) && reviewDialog.goals.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Goals</Label>
                  <div className="space-y-1.5">
                    {reviewDialog.goals.map((g: any, gi: number) => (
                      <div key={gi} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <Badge className={g.status === 'completed' ? 'bg-green-100 text-green-800' : g.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>{g.status || 'pending'}</Badge>
                        <span className="flex-1">{g.description || g.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <div>
                <Label className="text-sm font-semibold mb-2 block">Your Self-Assessment</Label>
                <p className="text-xs text-gray-500 mb-3">Provide your self-assessment and rating below.</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium">Self-Rating (1-5)</Label>
                    <Select value={reviewSelfRating} onValueChange={setReviewSelfRating}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select rating" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} - {['Needs Improvement', 'Below Average', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding'][n - 1]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Self-Assessment Notes</Label>
                    <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={4} placeholder="Describe your accomplishments, challenges, and growth areas..." className="mt-1" />
                  </div>
                </div>
              </div>
              {reviewDialog.employeeSubmittedAt && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Self-assessment submitted on {new Date(reviewDialog.employeeSubmittedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button onClick={handleReviewSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Send className="w-4 h-4 mr-1" />Submit Self-Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ QUESTIONNAIRE DIALOG ============ */}
      <Dialog open={!!questionnaireDialog} onOpenChange={() => setQuestionnaireDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {questionnaireDialog?.type ? `360\u00b0 ${questionnaireDialog.type.charAt(0).toUpperCase() + questionnaireDialog.type.slice(1)} Feedback` : 'Feedback Questionnaire'}
            </DialogTitle>
          </DialogHeader>
          {questionnaireDialog && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusColor(questionnaireDialog.status || 'pending')}>{questionnaireDialog.status || 'pending'}</Badge>
                {questionnaireDialog.type && <Badge variant="outline">{questionnaireDialog.type}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {questionnaireDialog.period && <div><Label className="text-xs text-gray-500">Period</Label><p className="text-sm">{questionnaireDialog.period}</p></div>}
                {questionnaireDialog.employeeName && <div><Label className="text-xs text-gray-500">Employee</Label><p className="text-sm">{questionnaireDialog.employeeName}</p></div>}
                {questionnaireDialog.reviewerName && <div><Label className="text-xs text-gray-500">Reviewer</Label><p className="text-sm">{questionnaireDialog.reviewerName}</p></div>}
              </div>
              {(questionnaireDialog.communication || questionnaireDialog.teamwork || questionnaireDialog.leadership || questionnaireDialog.technical) && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Ratings</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {questionnaireDialog.communication && <div className="flex items-center justify-between p-2 bg-blue-50 rounded"><span className="text-xs text-blue-700">Communication</span><span className="font-bold text-blue-700">{questionnaireDialog.communication}/5</span></div>}
                    {questionnaireDialog.teamwork && <div className="flex items-center justify-between p-2 bg-green-50 rounded"><span className="text-xs text-green-700">Teamwork</span><span className="font-bold text-green-700">{questionnaireDialog.teamwork}/5</span></div>}
                    {questionnaireDialog.leadership && <div className="flex items-center justify-between p-2 bg-purple-50 rounded"><span className="text-xs text-purple-700">Leadership</span><span className="font-bold text-purple-700">{questionnaireDialog.leadership}/5</span></div>}
                    {questionnaireDialog.technical && <div className="flex items-center justify-between p-2 bg-amber-50 rounded"><span className="text-xs text-amber-700">Technical</span><span className="font-bold text-amber-700">{questionnaireDialog.technical}/5</span></div>}
                  </div>
                </div>
              )}
              {questionnaireDialog.comments && (
                <div><Label className="text-xs text-gray-500">Comments</Label><p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{questionnaireDialog.comments}</p></div>
              )}
              {Array.isArray(questionnaireDialog.customQuestions) && questionnaireDialog.customQuestions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Answer the Questions Below</Label>
                    <div className="space-y-4">
                      {questionnaireDialog.customQuestions.map((q: string, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Label className="text-xs font-medium flex items-start gap-1.5">
                            <span className="text-gray-400 font-mono">Q{idx + 1}.</span>
                            <span>{q}</span>
                          </Label>
                          <Textarea
                            value={questionnaireAnswers[idx] || ''}
                            onChange={e => setQuestionnaireAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                            rows={2}
                            placeholder="Your answer..."
                            className="mt-2"
                            disabled={questionnaireDialog.status === 'submitted' || questionnaireDialog.status === 'reviewed'}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {questionnaireDialog.submittedAt && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Submitted on {new Date(questionnaireDialog.submittedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionnaireDialog(null)}>Cancel</Button>
            {questionnaireDialog?.status !== 'submitted' && questionnaireDialog?.status !== 'reviewed' && (
              <Button onClick={handleQuestionnaireSubmit} disabled={submitting} className="bg-purple-600 hover:bg-purple-700">
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <Send className="w-4 h-4 mr-1" />Submit Answers
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
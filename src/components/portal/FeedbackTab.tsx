import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import {
  MessageSquare, Loader2, Send, Star, ThumbsUp, AlertCircle,
  CheckCircle2, ClipboardList, BarChart3, Eye, Lock, Shield
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { toast } from 'sonner@2.0.3';
import { brandGradientStyle } from '../../lib/branding-context';

interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  deadline?: string;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  anonymous?: boolean;
  category?: string;
}

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'choice' | 'scale';
  options?: string[];
  required?: boolean;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyTitle: string;
  submittedAt: string;
}

interface FeedbackSubmission {
  id: string;
  category: string;
  message: string;
  anonymous: boolean;
  status: 'submitted' | 'reviewed' | 'acknowledged';
  createdAt: string;
}

interface FeedbackTabProps {
  accessToken: string;
  surveys: Survey[];
  surveyResponses: SurveyResponse[];
  feedbackHistory: FeedbackSubmission[];
  onRefresh: () => void;
  primaryColor: string;
}

export function FeedbackTab({ accessToken, surveys, surveyResponses, feedbackHistory, onRefresh, primaryColor }: FeedbackTabProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const [feedbackForm, setFeedbackForm] = useState({
    category: '',
    message: '',
    anonymous: true,
  });

  const completedSurveyIds = new Set(surveyResponses.map(r => r.surveyId));
  const activeSurveys = surveys.filter(s => s.status === 'active' && !completedSurveyIds.has(s.id));
  const completedSurveys = surveyResponses.length;

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.category || !feedbackForm.message) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api('/employee/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackForm),
        token: accessToken,
      });
      toast.success('Feedback submitted successfully' + (feedbackForm.anonymous ? ' (anonymously)' : ''));
      setFeedbackForm({ category: '', message: '', anonymous: true });
      setShowFeedbackForm(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSurveySubmit = async () => {
    if (!activeSurvey) return;

    // Validate required questions
    const unanswered = activeSurvey.questions.filter(q => q.required && !surveyAnswers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all required questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      await api('/employee/survey-response', {
        method: 'POST',
        body: JSON.stringify({
          surveyId: activeSurvey.id,
          surveyTitle: activeSurvey.title,
          answers: surveyAnswers,
          anonymous: isAnonymous,
        }),
        token: accessToken,
      });
      toast.success('Survey response submitted successfully');
      setActiveSurvey(null);
      setSurveyAnswers({});
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit survey response');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (questionId: string, currentValue: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setSurveyAnswers(prev => ({ ...prev, [questionId]: star }))}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${star <= currentValue ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{activeSurveys.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active Surveys</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedSurveys}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{feedbackHistory.length}</p>
            <p className="text-xs text-gray-500 mt-1">Feedback Sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Surveys */}
      {activeSurveys.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              Pending Surveys
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] ml-1">{activeSurveys.length} new</Badge>
            </CardTitle>
            <CardDescription>Your responses help improve our workplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSurveys.map((survey) => (
                <div
                  key={survey.id}
                  onClick={() => { setActiveSurvey(survey); setSurveyAnswers({}); setIsAnonymous(survey.anonymous !== false); }}
                  className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">{survey.title}</h4>
                      {survey.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{survey.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{survey.questions?.length || 0} questions</span>
                        {survey.deadline && (
                          <span className="text-red-400">Due {new Date(survey.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                        {survey.anonymous && (
                          <span className="flex items-center gap-0.5 text-blue-400"><Lock className="w-3 h-3" /> Anonymous</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      Take Survey
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anonymous Feedback */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-600" />
                Submit Feedback
              </CardTitle>
              <CardDescription>Share your thoughts with management - anonymously if you prefer</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowFeedbackForm(!showFeedbackForm)}>
              <Send className="w-3.5 h-3.5 mr-1" />
              New Feedback
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showFeedbackForm && (
            <form onSubmit={handleFeedbackSubmit} className="mb-6 p-4 bg-violet-50/50 rounded-xl border border-violet-100 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Category *</Label>
                  <Select value={feedbackForm.category} onValueChange={(v) => setFeedbackForm({ ...feedbackForm, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Work Environment">Work Environment</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Benefits">Benefits & Compensation</SelectItem>
                      <SelectItem value="Culture">Company Culture</SelectItem>
                      <SelectItem value="Tools">Tools & Resources</SelectItem>
                      <SelectItem value="Communication">Communication</SelectItem>
                      <SelectItem value="Career Growth">Career Growth</SelectItem>
                      <SelectItem value="Suggestion">General Suggestion</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Submit Anonymously</Label>
                  <div className="flex items-center gap-2 h-9">
                    <Switch
                      checked={feedbackForm.anonymous}
                      onCheckedChange={(v) => setFeedbackForm({ ...feedbackForm, anonymous: v })}
                    />
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {feedbackForm.anonymous ? <><Lock className="w-3 h-3" /> Your identity is hidden</> : <><Eye className="w-3 h-3" /> Your name will be visible</>}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Your Feedback *</Label>
                <Textarea
                  placeholder="Share your thoughts, suggestions, or concerns..."
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                  {feedbackForm.anonymous ? 'Submit Anonymously' : 'Submit Feedback'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFeedbackForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {/* Feedback History */}
          <div className="space-y-2">
            {feedbackHistory.map((fb) => (
              <div key={fb.id} className="p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{fb.category}</Badge>
                    {fb.anonymous && (
                      <span className="text-[10px] text-blue-400 flex items-center gap-0.5"><Lock className="w-3 h-3" /> Anonymous</span>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${
                    fb.status === 'acknowledged' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    fb.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>{fb.status}</Badge>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{fb.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
            {feedbackHistory.length === 0 && !showFeedbackForm && (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No feedback submitted yet</p>
                <p className="text-xs text-gray-300 mt-1">Your voice matters - share your thoughts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completed Survey Responses */}
      {surveyResponses.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Completed Surveys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {surveyResponses.map((resp) => (
                <div key={resp.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{resp.surveyTitle}</p>
                    <p className="text-xs text-gray-400">Submitted {new Date(resp.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Survey Dialog */}
      <Dialog open={!!activeSurvey} onOpenChange={() => setActiveSurvey(null)}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          {activeSurvey && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                  {activeSurvey.title}
                </DialogTitle>
                <DialogDescription>{activeSurvey.description || 'Please answer the following questions'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {activeSurvey.anonymous !== false && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-600">
                    <Shield className="w-4 h-4" />
                    <span>This survey is anonymous - your identity will not be shared</span>
                  </div>
                )}
                {activeSurvey.questions?.map((q, idx) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {idx + 1}. {q.text} {q.required && <span className="text-red-400">*</span>}
                    </Label>
                    {q.type === 'rating' || q.type === 'scale' ? (
                      renderStarRating(q.id, surveyAnswers[q.id] || 0)
                    ) : q.type === 'choice' && q.options ? (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            type="button"
                            onClick={() => setSurveyAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                              surveyAnswers[q.id] === opt
                                ? 'border-blue-400 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Textarea
                        placeholder="Type your answer..."
                        value={surveyAnswers[q.id] || ''}
                        onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        rows={2}
                      />
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveSurvey(null)}>Cancel</Button>
                <Button onClick={handleSurveySubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                  Submit Response
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

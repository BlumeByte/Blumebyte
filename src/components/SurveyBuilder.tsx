import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  ClipboardList, Loader2, Plus, Pencil, Trash2, Eye, Send, Star,
  MessageSquare, BarChart3, Lock, Globe, RefreshCw, Search,
  GripVertical, ChevronDown, ChevronUp, X, Copy, CheckCircle2, Play
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { toast } from 'sonner';

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'choice' | 'scale';
  options?: string[];
  required?: boolean;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  deadline?: string;
  status: 'draft' | 'active' | 'closed';
  anonymous?: boolean;
  category?: string;
  createdBy?: string;
  createdAt: string;
}

export function SurveyBuilder() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [responsesDialog, setResponsesDialog] = useState<{ surveyId: string; title: string; questions: SurveyQuestion[] } | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Builder form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formAnonymous, setFormAnonymous] = useState(true);
  const [formDeadline, setFormDeadline] = useState('');
  const [formQuestions, setFormQuestions] = useState<SurveyQuestion[]>([]);

  const loadSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/admin/surveys', { token: accessToken });
      setSurveys(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Load surveys error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadSurveys(); }, [loadSurveys]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('General');
    setFormAnonymous(true);
    setFormDeadline('');
    setFormQuestions([]);
    setEditingSurvey(null);
  };

  const openBuilder = (survey?: Survey) => {
    if (survey) {
      setEditingSurvey(survey);
      setFormTitle(survey.title);
      setFormDescription(survey.description || '');
      setFormCategory(survey.category || 'General');
      setFormAnonymous(survey.anonymous !== false);
      setFormDeadline(survey.deadline || '');
      setFormQuestions(survey.questions || []);
    } else {
      resetForm();
    }
    setShowBuilder(true);
  };

  const addQuestion = (type: SurveyQuestion['type']) => {
    const newQ: SurveyQuestion = {
      id: crypto.randomUUID(),
      text: '',
      type,
      required: true,
      ...(type === 'choice' ? { options: ['Option 1', 'Option 2'] } : {}),
    };
    setFormQuestions([...formQuestions, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setFormQuestions(formQuestions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setFormQuestions(formQuestions.filter(q => q.id !== id));
  };

  const moveQuestion = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= formQuestions.length) return;
    const updated = [...formQuestions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setFormQuestions(updated);
  };

  const addOption = (questionId: string) => {
    const q = formQuestions.find(q => q.id === questionId);
    if (q) {
      updateQuestion(questionId, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] });
    }
  };

  const updateOption = (questionId: string, optIdx: number, value: string) => {
    const q = formQuestions.find(q => q.id === questionId);
    if (q?.options) {
      const opts = [...q.options];
      opts[optIdx] = value;
      updateQuestion(questionId, { options: opts });
    }
  };

  const removeOption = (questionId: string, optIdx: number) => {
    const q = formQuestions.find(q => q.id === questionId);
    if (q?.options && q.options.length > 2) {
      updateQuestion(questionId, { options: q.options.filter((_, i) => i !== optIdx) });
    }
  };

  const handleSave = async (status: 'draft' | 'active') => {
    if (!formTitle.trim()) {
      toast.error('Survey title is required');
      return;
    }
    if (formQuestions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    const emptyQuestions = formQuestions.filter(q => !q.text.trim());
    if (emptyQuestions.length > 0) {
      toast.error('All questions must have text');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        anonymous: formAnonymous,
        deadline: formDeadline || null,
        questions: formQuestions,
        status,
      };

      if (editingSurvey) {
        await api(`/admin/survey/${editingSurvey.id}`, { method: 'PUT', body: payload, token: accessToken });
        toast.success('Survey updated');
      } else {
        await api('/admin/survey', { method: 'POST', body: payload, token: accessToken });
        toast.success(status === 'active' ? 'Survey published!' : 'Survey saved as draft');
      }

      setShowBuilder(false);
      resetForm();
      loadSurveys();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save survey');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (survey: Survey, newStatus: 'active' | 'closed') => {
    try {
      await api(`/admin/survey/${survey.id}`, { method: 'PUT', body: { status: newStatus }, token: accessToken });
      toast.success(`Survey ${newStatus === 'active' ? 'published' : 'closed'}`);
      loadSurveys();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update survey status');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api(`/admin/survey/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Survey deleted');
      loadSurveys();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const viewResponses = async (survey: Survey) => {
    setResponsesDialog({ surveyId: survey.id, title: survey.title, questions: survey.questions });
    setLoadingResponses(true);
    try {
      const data = await api(`/admin/survey-responses/${survey.id}`, { token: accessToken });
      setResponses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Load responses error:', e);
      setResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  };

  const filteredSurveys = surveys.filter(s => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'closed': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'rating': return 'Star Rating';
      case 'scale': return 'Scale (1-5)';
      case 'choice': return 'Multiple Choice';
      case 'text': return 'Free Text';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 mx-auto mb-2 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{surveys.filter(s => s.status === 'draft').length}</p>
            <p className="text-xs text-gray-500 mt-1">Draft Surveys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 mx-auto mb-2 flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{surveys.filter(s => s.status === 'active').length}</p>
            <p className="text-xs text-gray-500 mt-1">Active Surveys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 mx-auto mb-2 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{surveys.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Surveys</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search surveys..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-60" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSurveys}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => openBuilder()}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Survey
          </Button>
        </div>
      </div>

      {/* Surveys List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{survey.title}</p>
                      {survey.description && <p className="text-xs text-gray-400 truncate max-w-[250px]">{survey.description}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        {survey.anonymous && <span className="text-[10px] text-blue-500 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Anonymous</span>}
                        {survey.deadline && <span className="text-[10px] text-red-400">Due {new Date(survey.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{survey.category || 'General'}</Badge></TableCell>
                  <TableCell className="text-sm">{survey.questions?.length || 0}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${getStatusColor(survey.status)}`}>{survey.status}</Badge></TableCell>
                  <TableCell className="text-xs text-gray-500">{new Date(survey.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => viewResponses(survey)} title="View Responses">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openBuilder(survey)} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {survey.status === 'draft' && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600" onClick={() => handleStatusChange(survey, 'active')} title="Publish">
                          <Play className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {survey.status === 'active' && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600" onClick={() => handleStatusChange(survey, 'closed')} title="Close">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(survey.id)} disabled={deletingId === survey.id} title="Delete">
                        {deletingId === survey.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSurveys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No surveys found</p>
                    <Button size="sm" className="mt-3" onClick={() => openBuilder()}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Create Your First Survey
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Survey Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={(open) => { if (!open) { setShowBuilder(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-600" />
              {editingSurvey ? 'Edit Survey' : 'Create New Survey'}
            </DialogTitle>
            <DialogDescription>Build a survey with various question types</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Survey Details */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Survey Title *</Label>
                <Input placeholder="e.g. Employee Satisfaction Q1 2026" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Description</Label>
                <Textarea placeholder="Brief description..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Engagement">Engagement</SelectItem>
                      <SelectItem value="Satisfaction">Satisfaction</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Exit">Exit Interview</SelectItem>
                      <SelectItem value="Pulse">Pulse Check</SelectItem>
                      <SelectItem value="Culture">Culture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Deadline</Label>
                  <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Anonymous</Label>
                  <div className="flex items-center gap-2 h-9">
                    <Switch checked={formAnonymous} onCheckedChange={setFormAnonymous} />
                    <span className="text-xs text-gray-500">{formAnonymous ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Questions ({formQuestions.length})</h4>
                <div className="flex gap-1">
                  {([
                    { type: 'rating' as const, label: 'Rating', icon: Star },
                    { type: 'text' as const, label: 'Text', icon: MessageSquare },
                    { type: 'choice' as const, label: 'Choice', icon: ClipboardList },
                    { type: 'scale' as const, label: 'Scale', icon: BarChart3 },
                  ]).map(qt => (
                    <Button key={qt.type} variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => addQuestion(qt.type)}>
                      <qt.icon className="w-3 h-3" /> {qt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {formQuestions.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No questions yet</p>
                  <p className="text-xs text-gray-300 mt-1">Use the buttons above to add questions</p>
                </div>
              )}

              <div className="space-y-3">
                {formQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <span className="text-[10px] text-gray-400 font-mono">{idx + 1}</span>
                        <button onClick={() => moveQuestion(idx, 1)} disabled={idx === formQuestions.length - 1} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Enter question text..."
                            value={q.text}
                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                            className="flex-1 text-sm"
                          />
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">{getQuestionTypeLabel(q.type)}</Badge>
                        </div>

                        {q.type === 'choice' && (
                          <div className="space-y-1.5 pl-2">
                            {q.options?.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                <Input
                                  value={opt}
                                  onChange={(e) => updateOption(q.id, oi, e.target.value)}
                                  className="h-7 text-xs flex-1"
                                />
                                {(q.options?.length || 0) > 2 && (
                                  <button onClick={() => removeOption(q.id, oi)} className="p-0.5 text-gray-400 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-600" onClick={() => addOption(q.id)}>
                              <Plus className="w-3 h-3 mr-0.5" /> Add Option
                            </Button>
                          </div>
                        )}

                        {q.type === 'rating' && (
                          <div className="flex gap-1 pl-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className="w-4 h-4 text-gray-300" />
                            ))}
                            <span className="text-[10px] text-gray-400 ml-1">(1-5 star rating)</span>
                          </div>
                        )}

                        {q.type === 'scale' && (
                          <div className="flex items-center gap-2 pl-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <div key={s} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">{s}</div>
                            ))}
                            <span className="text-[10px] text-gray-400">(1-5 scale)</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch checked={q.required !== false} onCheckedChange={(v) => updateQuestion(q.id, { required: v })} />
                            <span className="text-[10px] text-gray-500">Required</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeQuestion(q.id)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowBuilder(false); resetForm(); }}>Cancel</Button>
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save as Draft
            </Button>
            <Button onClick={() => handleSave('active')} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
              Publish Survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Responses Dialog */}
      <Dialog open={!!responsesDialog} onOpenChange={() => { setResponsesDialog(null); setResponses([]); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {responsesDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Responses: {responsesDialog.title}
                </DialogTitle>
                <DialogDescription>{responses.length} response(s) collected</DialogDescription>
              </DialogHeader>

              {loadingResponses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : responses.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No responses yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary per question */}
                  {responsesDialog.questions.map((q, qIdx) => (
                    <div key={q.id} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {qIdx + 1}. {q.text}
                        <Badge variant="outline" className="text-[10px] ml-2">{getQuestionTypeLabel(q.type)}</Badge>
                      </p>

                      {(q.type === 'rating' || q.type === 'scale') && (() => {
                        const values = responses.map(r => r.answers?.[q.id]).filter(v => typeof v === 'number');
                        const avg = values.length > 0 ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1) : 'N/A';
                        const distribution = [1, 2, 3, 4, 5].map(n => values.filter(v => v === n).length);
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-lg font-bold text-gray-900">{avg}</span>
                              <span className="text-xs text-gray-400">/ 5 ({values.length} responses)</span>
                            </div>
                            <div className="flex items-end gap-1 h-8">
                              {distribution.map((count, i) => (
                                <div key={i} className="flex flex-col items-center flex-1">
                                  <div className="w-full bg-purple-200 rounded-t" style={{ height: `${values.length ? (count / values.length) * 32 : 0}px` }} />
                                  <span className="text-[9px] text-gray-400 mt-0.5">{i + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {q.type === 'choice' && (() => {
                        const values = responses.map(r => r.answers?.[q.id]).filter(Boolean);
                        const counts: Record<string, number> = {};
                        values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
                        return (
                          <div className="space-y-1">
                            {(q.options || []).map(opt => (
                              <div key={opt} className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${values.length ? ((counts[opt] || 0) / values.length) * 100 : 0}%` }} />
                                </div>
                                <span className="text-xs text-gray-600 w-24 truncate">{opt}</span>
                                <span className="text-xs text-gray-400 w-8 text-right">{counts[opt] || 0}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {q.type === 'text' && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {responses.map((r, ri) => r.answers?.[q.id] && (
                            <div key={ri} className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                              "{r.answers[q.id]}"
                              <span className="text-[10px] text-gray-300 ml-2">
                                {r.anonymous ? 'Anonymous' : r.userName}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Clock, DollarSign, Loader2, Send, CheckCircle2, XCircle,
  AlertCircle, X, Receipt, Timer, Plus, CalendarDays, FileText
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { toast } from 'sonner';

interface OvertimeRequest {
  id: string;
  date: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
  rate?: number;
}

interface ExpenseClaim {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

interface OvertimeExpenseTabProps {
  accessToken: string;
  overtimeRequests: OvertimeRequest[];
  expenseClaims: ExpenseClaim[];
  onRefresh: () => void;
  formatCurrency: (amount: number) => string;
}

export function OvertimeExpenseTab({ accessToken, overtimeRequests, expenseClaims, onRefresh, formatCurrency }: OvertimeExpenseTabProps) {
  const [subTab, setSubTab] = useState('overtime');
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [overtimeForm, setOvertimeForm] = useState({
    date: '', hours: '', reason: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    title: '', category: '', amount: '', date: '', description: '', currency: 'NGN',
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="h-3.5 w-3.5" /> },
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertCircle className="h-3.5 w-3.5" /> },
      reimbursed: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    };
    const c = config[status] || config.pending;
    return (
      <Badge variant="outline" className={`${c.color} gap-1 font-medium`}>
        {c.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleOvertimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overtimeForm.date || !overtimeForm.hours || !overtimeForm.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api('/employee/overtime-request', {
        method: 'POST',
        body: JSON.stringify({
          date: overtimeForm.date,
          hours: parseFloat(overtimeForm.hours),
          reason: overtimeForm.reason,
        }),
        token: accessToken,
      });
      toast.success('Overtime request submitted successfully');
      setOvertimeForm({ date: '', hours: '', reason: '' });
      setShowOvertimeForm(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit overtime request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.category || !expenseForm.amount || !expenseForm.date) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api('/employee/expense-claim', {
        method: 'POST',
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
        }),
        token: accessToken,
      });
      toast.success('Expense claim submitted successfully');
      setExpenseForm({ title: '', category: '', amount: '', date: '', description: '', currency: 'NGN' });
      setShowExpenseForm(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit expense claim');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingOvertime = overtimeRequests.filter(r => r.status === 'pending').length;
  const pendingExpenses = expenseClaims.filter(r => r.status === 'pending').length;
  const totalPendingExpenseAmount = expenseClaims.filter(r => r.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0);
  const totalApprovedExpenseAmount = expenseClaims.filter(r => r.status === 'approved' || r.status === 'reimbursed').reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingOvertime}</p>
            <p className="text-xs text-gray-500 mt-1">Pending OT</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {overtimeRequests.filter(r => r.status === 'approved').reduce((s, r) => s + r.hours, 0)}h
            </p>
            <p className="text-xs text-gray-500 mt-1">Approved OT Hours</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingExpenses}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Claims</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalApprovedExpenseAmount)}</p>
            <p className="text-xs text-gray-500 mt-1">Approved Claims</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-white/80 border">
          <TabsTrigger value="overtime" className="text-xs gap-1.5">
            <Timer className="w-3.5 h-3.5" /> Overtime
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Expenses
          </TabsTrigger>
        </TabsList>

        {/* Overtime Sub-Tab */}
        <TabsContent value="overtime" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="w-4 h-4 text-orange-600" />
                    Overtime Requests
                  </CardTitle>
                  <CardDescription>Log your extra working hours for approval</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowOvertimeForm(!showOvertimeForm)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Log Overtime
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showOvertimeForm && (
                <form onSubmit={handleOvertimeSubmit} className="mb-6 p-4 bg-orange-50/50 rounded-xl border border-orange-100 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Date *</Label>
                      <Input type="date" value={overtimeForm.date} onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Hours Worked *</Label>
                      <Input type="number" step="0.5" min="0.5" max="12" placeholder="e.g. 2.5" value={overtimeForm.hours} onChange={(e) => setOvertimeForm({ ...overtimeForm, hours: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Reason / Description *</Label>
                    <Textarea placeholder="Describe the work done during overtime..." value={overtimeForm.reason} onChange={(e) => setOvertimeForm({ ...overtimeForm, reason: e.target.value })} rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting} size="sm">
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                      Submit
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowOvertimeForm(false)}>Cancel</Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {overtimeRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {req.hours}h overtime on {new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{req.reason}</p>
                      </div>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                ))}
                {overtimeRequests.length === 0 && (
                  <div className="text-center py-8">
                    <Timer className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No overtime requests yet</p>
                    <p className="text-xs text-gray-300 mt-1">Click "Log Overtime" to submit your first request</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Sub-Tab */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-teal-600" />
                    Expense Claims
                  </CardTitle>
                  <CardDescription>Submit and track your expense reimbursements</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowExpenseForm(!showExpenseForm)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Claim
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showExpenseForm && (
                <form onSubmit={handleExpenseSubmit} className="mb-6 p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Title *</Label>
                      <Input placeholder="e.g. Client lunch meeting" value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Category *</Label>
                      <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Travel">Travel</SelectItem>
                          <SelectItem value="Meals">Meals & Entertainment</SelectItem>
                          <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Software">Software & Subscriptions</SelectItem>
                          <SelectItem value="Training">Training & Education</SelectItem>
                          <SelectItem value="Communication">Communication</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Amount *</Label>
                      <div className="flex gap-2">
                        <Select value={expenseForm.currency} onValueChange={(v) => setExpenseForm({ ...expenseForm, currency: v })}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGN">NGN</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="flex-1" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Date of Expense *</Label>
                      <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Description</Label>
                    <Textarea placeholder="Additional details about the expense..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting} size="sm">
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                      Submit Claim
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {expenseClaims.map((claim) => (
                  <div key={claim.id} className="p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{claim.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{claim.category}</span>
                            <span className="text-gray-300">|</span>
                            <span>{new Date(claim.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(claim.amount)}</p>
                        {getStatusBadge(claim.status)}
                      </div>
                    </div>
                    {claim.description && (
                      <p className="text-xs text-gray-400 mt-2 ml-11 truncate">{claim.description}</p>
                    )}
                  </div>
                ))}
                {expenseClaims.length === 0 && (
                  <div className="text-center py-8">
                    <Receipt className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No expense claims yet</p>
                    <p className="text-xs text-gray-300 mt-1">Click "New Claim" to submit an expense</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

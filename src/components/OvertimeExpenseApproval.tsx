import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Separator } from './ui/separator';
import {
  Clock, DollarSign, Loader2, CheckCircle2, XCircle, AlertCircle,
  Receipt, Timer, Search, RefreshCw, Eye, Filter, TrendingUp,
  Banknote, Users
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useCurrency } from '../lib/currency-context';
import { api } from '../lib/api-client';
import { toast } from 'sonner';

export function OvertimeExpenseApproval() {
  const { accessToken } = useAuth();
  const { currencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState('overtime');
  const [loading, setLoading] = useState(true);
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([]);
  const [expenseClaims, setExpenseClaims] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionDialog, setRejectionDialog] = useState<{ id: string; type: 'overtime' | 'expense' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [otData, expData] = await Promise.all([
        api('/admin/overtime-requests', { token: accessToken }).catch(() => []),
        api('/admin/expense-claims', { token: accessToken }).catch(() => []),
      ]);
      setOvertimeRequests(Array.isArray(otData) ? otData : []);
      setExpenseClaims(Array.isArray(expData) ? expData : []);
    } catch (e) {
      console.error('Load overtime/expense data error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id: string, type: 'overtime' | 'expense') => {
    setProcessing(id);
    try {
      const endpoint = type === 'overtime' ? `/admin/overtime-requests/${id}` : `/admin/expense-claims/${id}`;
      await api(endpoint, { method: 'PUT', body: { status: 'approved' }, token: accessToken });
      toast.success(`${type === 'overtime' ? 'Overtime request' : 'Expense claim'} approved`);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionDialog) return;
    setProcessing(rejectionDialog.id);
    try {
      const endpoint = rejectionDialog.type === 'overtime'
        ? `/admin/overtime-requests/${rejectionDialog.id}`
        : `/admin/expense-claims/${rejectionDialog.id}`;
      await api(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected', rejectionReason }),
        token: accessToken,
      });
      toast.success(`${rejectionDialog.type === 'overtime' ? 'Overtime request' : 'Expense claim'} rejected`);
      setRejectionDialog(null);
      setRejectionReason('');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const handleReimburse = async (id: string) => {
    setProcessing(id);
    try {
      await api(`/admin/expense-claims/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'reimbursed' }),
        token: accessToken,
      });
      toast.success('Expense marked as reimbursed');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    } finally {
      setProcessing(null);
    }
  };

  const departments = [...new Set([
    ...overtimeRequests.map(r => r.department),
    ...expenseClaims.map(r => r.department),
  ].filter(Boolean))];

  const filterItems = (items: any[]) => {
    return items.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesDept = deptFilter === 'all' || item.department === deptFilter;
      const matchesSearch = !search ||
        (item.userName || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.reason || item.title || '').toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesDept && matchesSearch;
    });
  };

  const filteredOT = filterItems(overtimeRequests);
  const filteredExp = filterItems(expenseClaims);

  const pendingOT = overtimeRequests.filter(r => r.status === 'pending').length;
  const pendingExp = expenseClaims.filter(r => r.status === 'pending').length;
  const totalApprovedOTHours = overtimeRequests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.hours || 0), 0);
  const totalPendingExpAmount = expenseClaims.filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" /> },
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertCircle className="h-3 w-3" /> },
      reimbursed: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle2 className="h-3 w-3" /> },
    };
    const c = config[status] || config.pending;
    return <Badge variant="outline" className={`${c.color} gap-1 text-[10px]`}>{c.icon}{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${(amount || 0).toLocaleString()}`;
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
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">OT & Expenses</h1>
          <p className="text-sm text-muted-foreground">Manage overtime requests and expense claims</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('overtime'); setStatusFilter('pending'); }}>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 mx-auto mb-2 flex items-center justify-center">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{pendingOT}</p>
            <p className="text-xs text-gray-500 mt-1">Pending OT Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-2 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{totalApprovedOTHours}h</p>
            <p className="text-xs text-gray-500 mt-1">Approved OT Hours</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('expenses'); setStatusFilter('pending'); }}>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 mx-auto mb-2 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{pendingExp}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Expense Claims</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 mx-auto mb-2 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalPendingExpAmount)}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Claims Amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name or reason..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="reimbursed">Reimbursed</SelectItem>
          </SelectContent>
        </Select>
        {departments.length > 0 && (
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overtime" className="gap-1.5">
            <Timer className="w-3.5 h-3.5" /> Overtime ({filteredOT.length})
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Expenses ({filteredExp.length})
          </TabsTrigger>
        </TabsList>

        {/* Overtime Tab */}
        <TabsContent value="overtime" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOT.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.userName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{req.department || 'N/A'}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="font-semibold">{req.hours}h</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-gray-600">{req.reason}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleApprove(req.id, 'overtime')} disabled={processing === req.id}>
                              {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setRejectionDialog({ id: req.id, type: 'overtime' })}>
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {req.respondedBy && `by ${req.respondedBy}`}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOT.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                        <Timer className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        No overtime requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExp.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.userName}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{claim.title}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{claim.category}</Badge></TableCell>
                      <TableCell className="font-semibold">{formatCurrency(claim.amount)}</TableCell>
                      <TableCell className="text-sm">{new Date(claim.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell className="text-right">
                        {claim.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleApprove(claim.id, 'expense')} disabled={processing === claim.id}>
                              {processing === claim.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setRejectionDialog({ id: claim.id, type: 'expense' })}>
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : claim.status === 'approved' ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleReimburse(claim.id)} disabled={processing === claim.id}>
                            {processing === claim.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3 mr-1" />}
                            Mark Reimbursed
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">{claim.respondedBy && `by ${claim.respondedBy}`}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredExp.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                        <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        No expense claims found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectionDialog} onOpenChange={() => { setRejectionDialog(null); setRejectionReason(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Reject {rejectionDialog?.type === 'overtime' ? 'Overtime Request' : 'Expense Claim'}
            </DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Rejection Reason</Label>
            <Textarea
              placeholder="Enter the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectionDialog(null); setRejectionReason(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim() || !!processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
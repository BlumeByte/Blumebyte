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
  Banknote, Users, Calendar
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { toast } from 'sonner';

export function ManagerOvertimeExpenseApproval() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overtime');
  const [loading, setLoading] = useState(true);
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([]);
  const [expenseClaims, setExpenseClaims] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionDialog, setRejectionDialog] = useState<{ id: string; type: 'overtime' | 'expense' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [otData, expData] = await Promise.all([
        api('/manager/overtime-requests', { token: accessToken }).catch(() => []),
        api('/manager/expense-claims', { token: accessToken }).catch(() => []),
      ]);
      setOvertimeRequests(Array.isArray(otData) ? otData : []);
      setExpenseClaims(Array.isArray(expData) ? expData : []);
    } catch (e) {
      console.error('Load overtime/expense data error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string, type: 'overtime' | 'expense') => {
    setProcessing(id);
    try {
      const endpoint = type === 'overtime' ? `/manager/overtime-requests/${id}` : `/manager/expense-claims/${id}`;
      await api(endpoint, {
        method: 'PUT',
        token: accessToken,
        body: JSON.stringify({ status: 'approved' }),
      });
      toast.success(`${type === 'overtime' ? 'Overtime request' : 'Expense claim'} approved successfully`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || `Failed to approve ${type}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionDialog || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(rejectionDialog.id);
    try {
      const endpoint = rejectionDialog.type === 'overtime'
        ? `/manager/overtime-requests/${rejectionDialog.id}`
        : `/manager/expense-claims/${rejectionDialog.id}`;
      
      await api(endpoint, {
        method: 'PUT',
        token: accessToken,
        body: JSON.stringify({ status: 'rejected', rejectionReason }),
      });
      
      toast.success(`${rejectionDialog.type === 'overtime' ? 'Overtime request' : 'Expense claim'} rejected`);
      setRejectionDialog(null);
      setRejectionReason('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const filteredOvertime = overtimeRequests.filter(req => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch = !search || 
      req.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      req.reason?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredExpenses = expenseClaims.filter(claim => {
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    const matchesSearch = !search || 
      claim.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      claim.category?.toLowerCase().includes(search.toLowerCase()) ||
      claim.description?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingOvertimeCount = overtimeRequests.filter(r => r.status === 'pending').length;
  const pendingExpensesCount = expenseClaims.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Overtime & Expenses</h2>
          <p className="text-sm text-muted-foreground">Review and approve overtime requests and expense claims from your team</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              Pending Overtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingOvertimeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Receipt className="w-4 h-4 mr-2 text-green-600" />
              Pending Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingExpensesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your review</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overtime" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Overtime Requests ({pendingOvertimeCount})
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Expense Claims ({pendingExpensesCount})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by employee or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('pending');
                  }}
                  className="w-full"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overtime Requests Tab */}
        <TabsContent value="overtime" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Overtime Requests</CardTitle>
              <CardDescription>
                Review overtime requests from employees in your department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOvertime.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-4 text-muted-foreground">No overtime requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOvertime.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.employeeName || 'Unknown'}</TableCell>
                          <TableCell>{req.date ? new Date(req.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{req.hours || 0} hrs</TableCell>
                          <TableCell className="max-w-xs truncate">{req.reason || '-'}</TableCell>
                          <TableCell>₦{req.rate?.toLocaleString() || 0}/hr</TableCell>
                          <TableCell className="font-semibold">₦{((req.hours || 0) * (req.rate || 0)).toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedItem(req)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {req.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(req.id, 'overtime')}
                                    disabled={processing === req.id}
                                  >
                                    {processing === req.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setRejectionDialog({ id: req.id, type: 'overtime' })}
                                    disabled={processing === req.id}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Claims Tab */}
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Claims</CardTitle>
              <CardDescription>
                Review expense reimbursement claims from your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-4 text-muted-foreground">No expense claims found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-medium">{claim.employeeName || 'Unknown'}</TableCell>
                          <TableCell>{claim.date ? new Date(claim.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{claim.category || 'Other'}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{claim.description || '-'}</TableCell>
                          <TableCell className="font-semibold">₦{claim.amount?.toLocaleString() || 0}</TableCell>
                          <TableCell>
                            {claim.receiptUrl ? (
                              <a
                                href={claim.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">No receipt</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(claim.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedItem(claim)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {claim.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(claim.id, 'expense')}
                                    disabled={processing === claim.id}
                                  >
                                    {processing === claim.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setRejectionDialog({ id: claim.id, type: 'expense' })}
                                    disabled={processing === claim.id}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail View Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedItem.category ? 'Expense Claim Details' : 'Overtime Request Details'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Employee</Label>
                  <p className="font-medium">{selectedItem.employeeName || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p className="font-medium">
                    {selectedItem.date ? new Date(selectedItem.date).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Submitted</Label>
                  <p className="font-medium">
                    {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              <Separator />

              {selectedItem.category ? (
                // Expense details
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground">Category</Label>
                    <p className="font-medium">{selectedItem.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p className="font-medium">{selectedItem.description || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Amount</Label>
                    <p className="text-2xl font-bold">₦{selectedItem.amount?.toLocaleString() || 0}</p>
                  </div>
                  {selectedItem.receiptUrl && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Receipt</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedItem.receiptUrl, '_blank')}
                        className="mt-2"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Receipt
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                // Overtime details
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Hours</Label>
                      <p className="text-2xl font-bold">{selectedItem.hours || 0} hrs</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Rate</Label>
                      <p className="text-2xl font-bold">₦{selectedItem.rate?.toLocaleString() || 0}/hr</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Total Amount</Label>
                    <p className="text-3xl font-bold text-green-600">
                      ₦{((selectedItem.hours || 0) * (selectedItem.rate || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Reason</Label>
                    <p className="font-medium">{selectedItem.reason || '-'}</p>
                  </div>
                </>
              )}

              {selectedItem.rejectionReason && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm text-muted-foreground">Rejection Reason</Label>
                    <p className="font-medium text-red-600">{selectedItem.rejectionReason}</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Dialog */}
      {rejectionDialog && (
        <Dialog open={!!rejectionDialog} onOpenChange={() => setRejectionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject {rejectionDialog.type === 'overtime' ? 'Overtime Request' : 'Expense Claim'}</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this {rejectionDialog.type === 'overtime' ? 'overtime request' : 'expense claim'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this request is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectionDialog(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || !!processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Request'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Loader2, RefreshCw, CheckCircle, XCircle, UserCog, Eye } from 'lucide-react';

export function ProfileChangeRequests() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [detailDialog, setDetailDialog] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const data = await api('/profile-change-requests', { token: accessToken });
      setRequests(Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const handleApprove = async (id: string) => {
    try {
      await api(`/profile-change-requests/${id}`, { method: 'PUT', body: { status: 'approved' }, token: accessToken });
      toast.success('Profile changes approved and applied');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    try {
      await api(`/profile-change-requests/${rejectDialog.id}`, { method: 'PUT', body: { status: 'rejected', rejectionReason }, token: accessToken });
      toast.success('Profile change request rejected');
      setRejectDialog(null);
      setRejectionReason('');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const statusColor = (s: string) => {
    switch (s) { case 'approved': return 'bg-green-100 text-green-800'; case 'rejected': return 'bg-red-100 text-red-800'; default: return 'bg-amber-100 text-amber-800'; }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-5xl p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><UserCog className="w-5 h-5 text-blue-600" />Employee Profile Change Requests</h2>
          <p className="text-sm text-gray-500 mt-1">Review and approve or reject profile changes submitted by employees</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <Badge className="bg-amber-100 text-amber-800">{pendingCount} pending</Badge>}
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><UserCog className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No profile change requests</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div><p className="font-medium text-sm">{r.userName}</p><p className="text-xs text-gray-400">{r.userEmail}</p></div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{r.department || '—'}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {r.changedFields && Object.entries(r.changedFields).slice(0, 2).map(([field, vals]: [string, any]) => (
                          <p key={field} className="text-xs"><span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>: <span className="text-red-500 line-through">{vals.oldValue || '(empty)'}</span> → <span className="text-green-600">{vals.newValue}</span></p>
                        ))}
                        {r.changedFields && Object.keys(r.changedFields).length > 2 && (
                          <button onClick={() => setDetailDialog(r)} className="text-[10px] text-blue-600 hover:underline">+{Object.keys(r.changedFields).length - 2} more changes</button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                    <TableCell>
                      {r.status === 'pending' ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(r.id)} title="Approve"><CheckCircle className="w-3.5 h-3.5 mr-1" />Approve</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setRejectDialog(r); setRejectionReason(''); }} title="Reject"><XCircle className="w-3.5 h-3.5 mr-1" />Reject</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => setDetailDialog(r)}><Eye className="w-3.5 h-3.5 mr-1" />View</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Profile Change Details</DialogTitle></DialogHeader>
          {detailDialog && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">{detailDialog.userName}</p><p className="text-xs text-gray-500">{detailDialog.userEmail}</p></div>
                <Badge className={statusColor(detailDialog.status)}>{detailDialog.status}</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                {detailDialog.changedFields && Object.entries(detailDialog.changedFields).map(([field, vals]: [string, any]) => (
                  <div key={field} className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium capitalize text-gray-700">{field.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="text-right">
                      <p className="text-xs text-red-500 line-through">{vals.oldValue || '(empty)'}</p>
                      <p className="text-xs text-green-600 font-medium">{vals.newValue}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">Submitted: {new Date(detailDialog.createdAt).toLocaleString()}</p>
              {detailDialog.reviewedAt && <p className="text-xs text-gray-400">Reviewed: {new Date(detailDialog.reviewedAt).toLocaleString()}</p>}
              {detailDialog.rejectionReason && <p className="text-xs text-red-600">Rejection Reason: {detailDialog.rejectionReason}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Close</Button>
            {detailDialog?.status === 'pending' && (
              <>
                <Button variant="destructive" size="sm" onClick={() => { setRejectDialog(detailDialog); setRejectionReason(''); setDetailDialog(null); }}>Reject</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { handleApprove(detailDialog.id); setDetailDialog(null); }}>Approve</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Reject Profile Change</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {rejectDialog && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">{rejectDialog.userName}'s profile change request</p>
                <p className="text-xs text-gray-500">{Object.keys(rejectDialog.changedFields || {}).length} field(s) changed</p>
              </div>
            )}
            <div><Label>Reason for rejection (optional)</Label><Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Explain why this change was rejected..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject Change Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

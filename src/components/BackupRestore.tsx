import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import {
  Download, Upload, Loader2, Database, Shield, AlertCircle, CheckCircle,
  Archive, RotateCcw, Trash2, UserMinus, ShieldAlert, RefreshCw, Search,
  AlertTriangle, X, Eye, Clock, UserCheck, Ban
} from 'lucide-react';

export function BackupRestore() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'backup' | 'deletion-requests' | 'reset-user' | 'reset-all'>('backup');
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<any>(null);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Deletion requests
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Reset user
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [resetAction, setResetAction] = useState<'reset-data' | 'delete-user' | null>(null);
  const [resetResult, setResetResult] = useState<any>(null);
  const [resettingUser, setResettingUser] = useState(false);

  // Reset all
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [resettingAll, setResettingAll] = useState(false);
  const [resetAllResult, setResetAllResult] = useState<any>(null);

  const loadRequests = useCallback(async () => {
    setLoadingReqs(true);
    try {
      const data = await api('/deletion-requests', { token: accessToken });
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) { console.log(e); }
    setLoadingReqs(false);
  }, [accessToken]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await api('/users', { token: accessToken });
      setUsers(Array.isArray(data) ? data.filter((u: any) => u.role !== 'superadmin') : []);
    } catch (e) { console.log(e); }
    setLoadingUsers(false);
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === 'deletion-requests') loadRequests();
    if (activeTab === 'reset-user') loadUsers();
  }, [activeTab, loadRequests, loadUsers]);

  // Backup / Restore
  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const data = await api('/backup', { token: accessToken });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url; a.download = `blumebyte-hr-backup-${ts}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastBackup({ timestamp: data.timestamp, size: blob.size });
      toast.success('Backup downloaded successfully');
    } catch (e: any) { toast.error(`Backup failed: ${e.message}`); }
    setBackingUp(false);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Are you sure? This will overwrite existing data with backup data.')) { e.target.value = ''; return; }
    setRestoring(true); setRestoreResult(null);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data) throw new Error('Invalid backup file format');
      const result = await api('/backup/restore', { method: 'POST', body: JSON.stringify({ data: backup.data }), token: accessToken });
      setRestoreResult({ success: true, count: result.restoredCount, filename: file.name });
      toast.success(`Restored ${result.restoredCount} records`);
    } catch (err: any) {
      setRestoreResult({ success: false, error: err.message });
      toast.error(`Restore failed: ${err.message}`);
    }
    setRestoring(false); e.target.value = '';
  };

  // Deletion request actions
  const approveRequest = async (id: string) => {
    if (!confirm('Approve this deletion? The user will be permanently removed and all teams will be notified.')) return;
    setProcessing(true);
    try {
      await api(`/deletion-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'approved' }), token: accessToken });
      toast.success('Deletion approved. User removed and all teams notified.');
      loadRequests();
    } catch (e: any) { toast.error(e.message); }
    setProcessing(false);
  };

  const rejectRequest = async () => {
    if (!rejectDialog) return;
    setProcessing(true);
    try {
      await api(`/deletion-requests/${rejectDialog.id}`, { method: 'PUT', body: JSON.stringify({ status: 'rejected', rejectionReason }), token: accessToken });
      toast.success('Deletion request rejected. Requester notified.');
      setRejectDialog(null); setRejectionReason('');
      loadRequests();
    } catch (e: any) { toast.error(e.message); }
    setProcessing(false);
  };

  // Reset user
  const handleResetUserData = async () => {
    if (!selectedUser) return;
    const u = users.find(u => (u.userId || u.id) === selectedUser);
    if (!confirm(`Reset ALL data for ${u?.name || selectedUser}? This will delete their attendance, leave, messages, notifications, and job applications. Their profile will be kept.`)) return;
    setResettingUser(true); setResetResult(null);
    try {
      const result = await api(`/superadmin/reset-user-data/${selectedUser}`, { method: 'POST', token: accessToken });
      setResetResult({ success: true, ...result });
      toast.success(`Reset ${result.deletedRecords} records for ${result.userName}`);
    } catch (e: any) {
      setResetResult({ success: false, error: e.message });
      toast.error(e.message);
    }
    setResettingUser(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const u = users.find(u => (u.userId || u.id) === selectedUser);
    if (!confirm(`PERMANENTLY DELETE ${u?.name || selectedUser}? This removes the user account, profile, and auth credentials. All teams will be notified. This CANNOT be undone!`)) return;
    setResettingUser(true); setResetResult(null);
    try {
      await api(`/superadmin/users/${selectedUser}`, { method: 'DELETE', token: accessToken });
      setResetResult({ success: true, deleted: true, userName: u?.name });
      toast.success(`${u?.name} deleted. All teams notified.`);
      loadUsers();
      setSelectedUser('');
    } catch (e: any) {
      setResetResult({ success: false, error: e.message });
      toast.error(e.message);
    }
    setResettingUser(false);
  };

  // Reset all
  const handleResetAll = async () => {
    if (confirmPhrase !== 'RESET ALL DATA') { toast.error("Type 'RESET ALL DATA' exactly to confirm"); return; }
    if (!confirm('FINAL WARNING: This will permanently delete ALL data except SuperAdmin accounts. Download a backup first! Continue?')) return;
    setResettingAll(true); setResetAllResult(null);
    try {
      const result = await api('/superadmin/reset-all-data', { method: 'POST', body: JSON.stringify({ confirmPhrase }), token: accessToken });
      setResetAllResult({ success: true, ...result });
      toast.success(`Factory reset complete. ${result.deletedRecords} records deleted.`);
      setConfirmPhrase('');
    } catch (e: any) {
      setResetAllResult({ success: false, error: e.message });
      toast.error(e.message);
    }
    setResettingAll(false);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"><Database className="w-5 h-5 text-amber-600" /></div>
        <div>
          <h1 className="text-xl font-bold">Data Management & Backup</h1>
          <p className="text-sm text-gray-500">SuperAdmin-only: Backup, restore, reset, and approve deletion requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {[
          { id: 'backup' as const, label: 'Backup & Restore', icon: Archive },
          { id: 'deletion-requests' as const, label: 'Deletion Requests', icon: ShieldAlert, badge: pendingCount },
          { id: 'reset-user' as const, label: 'Reset / Delete User', icon: UserMinus },
          { id: 'reset-all' as const, label: 'Factory Reset', icon: AlertTriangle },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {tab.badge ? <Badge className="ml-1 bg-red-100 text-red-700 text-[10px]">{tab.badge}</Badge> : null}
          </button>
        ))}
      </div>

      {/* BACKUP & RESTORE TAB */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Archive className="w-5 h-5 text-blue-600" /><CardTitle className="text-base">Create Backup</CardTitle></div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Download a complete JSON backup of all HR system data.</p>
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">Includes all 30+ modules:</p>
                    <p className="text-xs text-blue-700 mt-1">Employees, Companies, Branches, Departments, Assets, Pay Grades, Leave, Attendance, Payroll, Tax, Benefits, Performance, Goals, Feedback, Meetings, Workflows, Recruitment, Disciplinary, Compliance, Training, Tasks, Messages, Notifications, Announcements, Deletion Requests, Settings</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleBackup} disabled={backingUp} className="w-full">
                {backingUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                {backingUp ? 'Creating Backup...' : 'Download Full Backup'}
              </Button>
              {lastBackup && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-700">Last backup: {new Date(lastBackup.timestamp).toLocaleString()} ({(lastBackup.size / 1024).toFixed(1)} KB)</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><RotateCcw className="w-5 h-5 text-amber-600" /><CardTitle className="text-base">Restore from Backup</CardTitle></div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Upload a backup file to restore system data. Records with matching IDs will be overwritten.</p>
              <div className="bg-amber-50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-700"><strong>Warning:</strong> Create a fresh backup before restoring. This cannot be easily undone.</p>
                </div>
              </div>
              <input type="file" accept=".json" ref={fileRef} onChange={handleRestore} className="hidden" />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={restoring} className="w-full border-amber-300 hover:bg-amber-50">
                {restoring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {restoring ? 'Restoring...' : 'Upload Backup File'}
              </Button>
              {restoreResult && (
                <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${restoreResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  {restoreResult.success ? <><CheckCircle className="w-4 h-4 text-green-600" /><p className="text-xs text-green-700">Restored {restoreResult.count} records from {restoreResult.filename}</p></> : <><AlertCircle className="w-4 h-4 text-red-600" /><p className="text-xs text-red-700">Error: {restoreResult.error}</p></>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* DELETION REQUESTS TAB */}
      {activeTab === 'deletion-requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Admin and Manager deletion requests require your approval before execution. All teams are notified upon approval.</p>
            <Button variant="outline" size="sm" onClick={loadRequests}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold">{requests.length}</p><p className="text-[11px] text-gray-400">Total</p></CardContent></Card>
            <Card className="border-amber-200"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-amber-600">{pendingCount}</p><p className="text-[11px] text-amber-500">Pending</p></CardContent></Card>
            <Card className="border-green-200"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'approved').length}</p><p className="text-[11px] text-green-500">Approved</p></CardContent></Card>
            <Card className="border-red-200"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-red-600">{requests.filter(r => r.status === 'rejected').length}</p><p className="text-[11px] text-red-500">Rejected</p></CardContent></Card>
          </div>

          {loadingReqs ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : requests.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-gray-400"><ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No deletion requests</p></CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Requested By</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(r => (
                    <TableRow key={r.id} className={r.status === 'pending' ? 'bg-amber-50/30' : ''}>
                      <TableCell>
                        <div><p className="font-medium text-sm">{r.requesterName}</p><p className="text-[10px] text-gray-400">{r.requesterRole}</p></div>
                      </TableCell>
                      <TableCell>
                        <div><p className="font-medium text-sm">{r.targetUserName}</p><p className="text-[10px] text-gray-400">{r.targetUserEmail}</p></div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{r.targetUserRole}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-gray-600">{r.reason || '\u2014'}</TableCell>
                      <TableCell className="text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '\u2014'}</TableCell>
                      <TableCell>
                        <Badge className={r.status === 'pending' ? 'bg-amber-100 text-amber-800' : r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.status === 'pending' ? (
                          <div className="flex gap-1">
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => approveRequest(r.id)} disabled={processing}>
                              <UserCheck className="w-3 h-3 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { setRejectDialog(r); setRejectionReason(''); }} disabled={processing}>
                              <Ban className="w-3 h-3 mr-1" />Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {r.status === 'approved' ? 'Executed' : 'Declined'}
                            {r.reviewedAt ? ` \u2022 ${new Date(r.reviewedAt).toLocaleDateString()}` : ''}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </div>
      )}

      {/* RESET / DELETE USER TAB */}
      {activeTab === 'reset-user' && (
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><UserMinus className="w-5 h-5 text-orange-600" /><CardTitle className="text-base">Reset or Delete Individual User</CardTitle></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Select a user to reset their data (keeps profile) or permanently delete them.</p>

              <div>
                <Label className="text-xs font-semibold">Select User</Label>
                {loadingUsers ? <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div> : (
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a user..." /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.userId || u.id} value={u.userId || u.id}>
                          {u.name} ({u.role}) \u2022 {u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedUser && (
                <>
                  {(() => {
                    const u = users.find(u => (u.userId || u.id) === selectedUser);
                    return u ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{u.name}</h4>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{u.role}</Badge>
                            <p className="text-xs text-gray-400 mt-1">{u.department || 'No department'} &middot; {u.company || 'No company'}</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-orange-200">
                      <CardContent className="pt-4 pb-4">
                        <h4 className="text-sm font-semibold text-orange-800 mb-1">Reset User Data</h4>
                        <p className="text-xs text-gray-500 mb-3">Deletes attendance, leave, messages, notifications, and applications. Keeps profile intact.</p>
                        <Button variant="outline" className="w-full border-orange-300 hover:bg-orange-50 text-orange-700" onClick={handleResetUserData} disabled={resettingUser}>
                          {resettingUser ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                          Reset Data Only
                        </Button>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardContent className="pt-4 pb-4">
                        <h4 className="text-sm font-semibold text-red-800 mb-1">Delete User Permanently</h4>
                        <p className="text-xs text-gray-500 mb-3">Removes user account, profile, and auth. All teams notified. Cannot be undone.</p>
                        <Button variant="destructive" className="w-full" onClick={handleDeleteUser} disabled={resettingUser}>
                          {resettingUser ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                          Delete User Forever
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {resetResult && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${resetResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      {resetResult.success ? (
                        <><CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-green-700">
                          {resetResult.deleted ? `${resetResult.userName} has been permanently deleted. All teams notified.` : `Reset ${resetResult.deletedRecords} records for ${resetResult.userName}. Profile preserved.`}
                        </p></>
                      ) : (
                        <><AlertCircle className="w-4 h-4 text-red-600" /><p className="text-xs text-red-700">{resetResult.error}</p></>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* FACTORY RESET TAB */}
      {activeTab === 'reset-all' && (
        <div className="max-w-xl">
          <Card className="border-red-300">
            <CardHeader className="bg-red-50">
              <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /><CardTitle className="text-base text-red-800">Factory Reset - Danger Zone</CardTitle></div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="text-sm font-bold text-red-800 mb-2">This action will permanently delete:</h4>
                <ul className="text-xs text-red-700 space-y-1 list-disc pl-4">
                  <li>All companies, branches, departments, and organizational data</li>
                  <li>All employee profiles and accounts (except SuperAdmin)</li>
                  <li>All attendance, leave, payroll, and HR records</li>
                  <li>All messages, notifications, and announcements</li>
                  <li>All recruitment data, job postings, and applications</li>
                  <li>All performance reviews, goals, feedback, and meetings</li>
                  <li>All assets, workflows, training programs, and tasks</li>
                  <li>All deletion requests and company settings</li>
                </ul>
                <p className="text-xs font-bold text-red-900 mt-3">SuperAdmin accounts will be preserved. Download a backup first!</p>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800"><strong>Recommendation:</strong> Download a full backup before proceeding. You can restore from it later if needed.</p>
              </div>

              <Button variant="outline" onClick={handleBackup} disabled={backingUp} className="w-full">
                {backingUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Download Safety Backup First
              </Button>

              <Separator />

              <div>
                <Label className="text-xs font-semibold text-red-800">Type "RESET ALL DATA" to confirm:</Label>
                <Input
                  value={confirmPhrase}
                  onChange={e => setConfirmPhrase(e.target.value)}
                  placeholder="RESET ALL DATA"
                  className="mt-1 border-red-200 focus:border-red-400"
                />
              </div>

              <Button variant="destructive" className="w-full" onClick={handleResetAll} disabled={resettingAll || confirmPhrase !== 'RESET ALL DATA'}>
                {resettingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                {resettingAll ? 'Resetting Everything...' : 'Execute Factory Reset'}
              </Button>

              {resetAllResult && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${resetAllResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  {resetAllResult.success ? (
                    <><CheckCircle className="w-4 h-4 text-green-600" /><p className="text-xs text-green-700">Factory reset complete. {resetAllResult.deletedRecords} records deleted. Only SuperAdmin accounts remain.</p></>
                  ) : (
                    <><AlertCircle className="w-4 h-4 text-red-600" /><p className="text-xs text-red-700">{resetAllResult.error}</p></>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Deletion Request</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              Rejecting deletion of <strong>{rejectDialog?.targetUserName}</strong> requested by <strong>{rejectDialog?.requesterName}</strong>.
            </p>
            <div>
              <Label className="text-xs">Reason for Rejection (optional)</Label>
              <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Enter reason..." rows={3} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={rejectRequest} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

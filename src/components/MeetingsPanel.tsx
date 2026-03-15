import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { NativeSelect } from './ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import {
  Loader2, Plus, Pencil, Trash2, Calendar, Clock, Users, CheckCircle, XCircle,
  Video, RefreshCw, AlertCircle, CalendarCheck
} from 'lucide-react';

interface MeetingsPanelProps {
  mode: 'admin' | 'employee';
}

export function MeetingsPanel({ mode }: MeetingsPanelProps) {
  const { user, accessToken } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'calendar'>('all');
  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const load = useCallback(async () => {
    try {
      const usersEndpoint = mode === 'employee' ? '/users/for-meetings' : '/users';
      const [m, u] = await Promise.all([
        api('/meetings', { token: accessToken }),
        api(usersEndpoint, { token: accessToken }).catch(() => []),
      ]);
      setMeetings(Array.isArray(m) ? m : []);
      setAllUsers(Array.isArray(u) ? u : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken, mode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const getUserName = (id: string) => allUsers.find(u => (u.userId || u.id) === id)?.name || id;

  const handleCreate = async () => {
    setSaving(true);
    try {
      const data = { ...formData };
      
      // Validate meeting date is not in the past
      if (data.date) {
        const meetingDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day for fair comparison
        
        if (meetingDate < today) {
          toast.error('Cannot create or update meeting in the past. Please select a present or future date.');
          setSaving(false);
          return;
        }
      }
      
      if (data.organizerId) data.organizerName = getUserName(data.organizerId);
      // Support multiple participants
      if (data.participantIds?.length) {
        data.participantNames = data.participantIds.map((pid: string) => getUserName(pid));
      }
      // Keep backward compat: if single participantId set
      if (data.participantId) data.participantName = getUserName(data.participantId);
      if (editItem) {
        await api(`/meetings/${editItem.id}`, { method: 'PUT', body: JSON.stringify(data), token: accessToken });
        toast.success('Meeting updated');
      } else {
        await api('/meetings', { method: 'POST', body: JSON.stringify(data), token: accessToken });
        toast.success(mode === 'employee' ? 'Meeting request sent' : 'Meeting scheduled');
      }
      setDialogOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await api(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'scheduled' }), token: accessToken });
      toast.success('Meeting approved and scheduled');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    try {
      await api(`/meetings/${rejectDialog.id}`, { method: 'PUT', body: JSON.stringify({ status: 'rejected', rejectionReason }), token: accessToken });
      toast.success('Meeting declined');
      setRejectDialog(null); setRejectionReason(''); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this meeting?')) return;
    try { await api(`/meetings/${id}`, { method: 'DELETE', token: accessToken }); toast.success('Deleted'); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const pendingMeetings = meetings.filter(m => m.status === 'pending-approval');
  const scheduledMeetings = meetings.filter(m => m.status === 'scheduled');

  const statusColor = (s: string) => {
    switch (s) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending-approval': return 'bg-amber-100 text-amber-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calendar view - show meetings blocked on calendar dates
  const calendarDates = (() => {
    const today = new Date();
    const dates: { date: string; meetings: any[] }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const dm = scheduledMeetings.filter(m => m.date === ds);
      dates.push({ date: ds, meetings: dm });
    }
    return dates;
  })();

  // Check if user is busy at a time
  const isUserBusy = (userId: string, date: string, startTime: string) => {
    return scheduledMeetings.some(m => m.date === date && (m.organizerId === userId || m.participantId === userId || (m.participantIds || []).includes(userId)) && m.startTime === startTime);
  };

  // Get participant display names for a meeting
  const getParticipantDisplay = (m: any) => {
    const names: string[] = [];
    if (m.participantIds?.length) {
      names.push(...m.participantIds.map((pid: string, i: number) => m.participantNames?.[i] || getUserName(pid)));
    } else if (m.participantId) {
      names.push(m.participantName || getUserName(m.participantId));
    }
    if (names.length === 0) return '—';
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2} more`;
  };

  const openNew = () => {
    setEditItem(null);
    setFormData({ date: new Date().toISOString().slice(0, 10), status: mode === 'employee' ? 'pending-approval' : 'scheduled', participantIds: [] });
    setDialogOpen(true);
  };

  const filteredMeetings = activeTab === 'pending' ? pendingMeetings : meetings;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Meetings</h2>
          {pendingMeetings.length > 0 && <Badge className="bg-amber-100 text-amber-800">{pendingMeetings.length} pending</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />{mode === 'employee' ? 'Request Meeting' : 'Schedule Meeting'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-blue-600">{scheduledMeetings.length}</p><p className="text-xs text-gray-500">Scheduled</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-amber-600">{pendingMeetings.length}</p><p className="text-xs text-gray-500">Pending Approval</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-green-600">{meetings.filter(m => m.status === 'completed').length}</p><p className="text-xs text-gray-500">Completed</p></CardContent></Card>
      </div>

      <div className="flex gap-1 border-b">
        {[{ id: 'all', label: 'All Meetings' }, { id: 'pending', label: `Pending (${pendingMeetings.length})` }, { id: 'calendar', label: 'Calendar View' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'calendar' ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Next 14 Days</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {calendarDates.map(d => {
                const isToday = d.date === new Date().toISOString().slice(0, 10);
                const hasMeetings = d.meetings.length > 0;
                const dayName = new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
                const dayNum = new Date(d.date + 'T12:00:00').getDate();
                return (
                  <div key={d.date} className={`border rounded-lg p-2 min-h-[80px] ${isToday ? 'border-blue-500 bg-blue-50' : ''} ${hasMeetings ? 'bg-amber-50 border-amber-200' : ''}`}>
                    <p className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{dayName}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-blue-700' : ''}`}>{dayNum}</p>
                    {d.meetings.map(m => (
                      <div key={m.id} className="mt-1 p-1 bg-blue-100 rounded text-[10px] text-blue-800 truncate" title={`${m.title} at ${m.startTime}`}>
                        <CalendarCheck className="w-2.5 h-2.5 inline mr-0.5" />{m.startTime} {m.title}
                      </div>
                    ))}
                    {hasMeetings && <p className="text-[9px] text-red-500 mt-0.5 font-medium">BOOKED</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredMeetings.length === 0 ? (
              <div className="py-16 text-center text-gray-400"><Video className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No meetings found</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead>
                    <TableHead>Organizer</TableHead><TableHead>Participants</TableHead><TableHead>Status</TableHead><TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeetings.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.title || '—'}</TableCell>
                      <TableCell className="text-sm">{m.date || '—'}</TableCell>
                      <TableCell className="text-sm">{m.startTime}{m.endTime ? ` - ${m.endTime}` : ''}</TableCell>
                      <TableCell className="text-sm">{m.organizerName || getUserName(m.organizerId) || m.createdByName || '—'}</TableCell>
                      <TableCell className="text-sm">{getParticipantDisplay(m)}</TableCell>
                      <TableCell><Badge className={statusColor(m.status)}>{m.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {m.status === 'pending-approval' && (mode === 'admin' || m.participantId === user?.id || (m.participantIds || []).includes(user?.id)) && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => handleApprove(m.id)} title="Approve"><CheckCircle className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => { setRejectDialog(m); setRejectionReason(''); }} title="Decline"><XCircle className="w-3.5 h-3.5" /></Button>
                            </>
                          )}
                          {mode === 'admin' && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditItem(m); setFormData({ ...m }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Meeting Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Meeting' : mode === 'employee' ? 'Request Meeting' : 'Schedule Meeting'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Meeting Title</Label><Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Sprint Planning" /></div>
            <div className="grid grid-cols-2 gap-3">
              {mode === 'admin' && (
                <div><Label>Organizer</Label>
                  <NativeSelect value={formData.organizerId || ''} onChange={e => setFormData({ ...formData, organizerId: e.target.value, organizerName: getUserName(e.target.value) })}>
                    <option value="">Select organizer</option>
                    {allUsers.map(u => <option key={u.userId || u.id} value={u.userId || u.id}>{u.name}</option>)}
                  </NativeSelect>
                </div>
              )}
              <div className={mode === 'admin' ? '' : 'col-span-2'}>
                <Label>{mode === 'employee' ? 'Meeting With' : 'Participants'}</Label>
                <div className="mt-1 border rounded-md max-h-40 overflow-y-auto p-2 space-y-1 bg-white">
                  {allUsers.filter(u => (u.userId || u.id) !== user?.id).length === 0 && (
                    <p className="text-xs text-gray-400 py-2 text-center">No users available</p>
                  )}
                  {allUsers.filter(u => (u.userId || u.id) !== user?.id).map(u => {
                    const uid = u.userId || u.id;
                    const busy = formData.date && formData.startTime && isUserBusy(uid, formData.date, formData.startTime);
                    const selected = (formData.participantIds || []).includes(uid);
                    return (
                      <label key={uid} className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-gray-50 ${busy ? 'opacity-50' : ''} ${selected ? 'bg-blue-50' : ''}`}>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selected}
                          disabled={busy}
                          onChange={() => {
                            if (busy) { toast.error('This user is already booked at this time!'); return; }
                            const current = formData.participantIds || [];
                            const updated = selected ? current.filter((id: string) => id !== uid) : [...current, uid];
                            setFormData({ ...formData, participantIds: updated });
                          }}
                        />
                        <span>{u.name} <span className="text-gray-400">({u.role})</span></span>
                        {busy && <Badge className="bg-red-100 text-red-700 text-[10px] ml-auto">BUSY</Badge>}
                      </label>
                    );
                  })}
                </div>
                {(formData.participantIds || []).length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">{(formData.participantIds || []).length} participant(s) selected</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Date</Label><Input type="date" min={new Date().toISOString().split('T')[0]} value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
              <div><Label>Start Time</Label><Input type="time" value={formData.startTime || ''} onChange={e => setFormData({ ...formData, startTime: e.target.value })} /></div>
              <div><Label>End Time</Label><Input type="time" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} /></div>
            </div>
            <div><Label>Agenda / Details</Label><Textarea value={formData.agenda || ''} onChange={e => setFormData({ ...formData, agenda: e.target.value })} placeholder="Meeting agenda and details..." rows={3} /></div>
            {mode === 'employee' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">Your meeting request will be sent to the selected person for approval. Once approved, both calendars will be blocked for this time.</p>
              </div>
            )}
            {mode === 'admin' && (
              <div>
                <Label>Status</Label>
                <NativeSelect value={formData.status || 'scheduled'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </NativeSelect>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{editItem ? 'Update' : mode === 'employee' ? 'Send Request' : 'Schedule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Decline Meeting Request</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {rejectDialog && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">{rejectDialog.title}</p>
                <p className="text-xs text-gray-500">{rejectDialog.date} at {rejectDialog.startTime} — Requested by {rejectDialog.requestedByName || rejectDialog.createdByName}</p>
              </div>
            )}
            <div><Label>Reason (optional)</Label><Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Reason for declining..." rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Decline Meeting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
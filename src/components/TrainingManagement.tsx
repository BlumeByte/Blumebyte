import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import {
  Loader2, Plus, Pencil, Trash2, BookOpen, Users, Calendar, CheckCircle,
  Clock, FileText, Download, CalendarCheck, GraduationCap, Target, RefreshCw
} from 'lucide-react';

interface TrainingManagementProps {
  mode: 'admin' | 'employee';
}

export function TrainingManagement({ mode }: TrainingManagementProps) {
  const { user, accessToken } = useAuth();
  const [trainings, setTrainings] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'completed' | 'pending' | 'calendar'>('overview');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [assignDialog, setAssignDialog] = useState<any>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const [t, u] = await Promise.all([
        api('/training-programs', { token: accessToken }),
        mode === 'admin' ? api('/users', { token: accessToken }).catch(() => []) : Promise.resolve([]),
      ]);
      setTrainings(Array.isArray(t) ? t : []);
      setAllUsers(Array.isArray(u) ? u : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken, mode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 20000); return () => clearInterval(iv); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await api(`/training-programs/${editItem.id}`, { method: 'PUT', body: formData, token: accessToken });
        toast.success('Training updated');
      } else {
        await api('/training-programs', { method: 'POST', body: { ...formData, status: 'pending' }, token: accessToken });
        toast.success('Training created');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this training program?')) return;
    try {
      await api(`/training-programs/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAssign = async () => {
    if (!assignDialog || selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    setSaving(true);
    try {
      const assignedUsers = assignDialog.assignedUsers || [];
      const newAssignments = [...new Set([...assignedUsers, ...selectedEmployees])];
      await api(`/training-programs/${assignDialog.id}`, {
        method: 'PUT',
        body: { assignedUsers: newAssignments },
        token: accessToken
      });
      toast.success(`Assigned to ${selectedEmployees.length} employee(s)`);
      setAssignDialog(null);
      setSelectedEmployees([]);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const openNew = () => {
    setEditItem(null);
    setFormData({ startDate: new Date().toISOString().slice(0, 10), duration: '1 day', type: 'online' });
    setDialogOpen(true);
  };

  // Filter trainings
  const myTrainings = mode === 'employee' 
    ? trainings.filter(t => (t.assignedUsers || []).includes(user?.id))
    : trainings;

  const activeTrainings = myTrainings.filter(t => t.status === 'active');
  const completedTrainings = myTrainings.filter(t => t.status === 'completed');
  const pendingTrainings = myTrainings.filter(t => t.status === 'pending');
  const upcomingTrainings = myTrainings.filter(t => {
    if (!t.startDate) return false;
    return new Date(t.startDate) > new Date() && t.status !== 'completed';
  });

  // Calendar view
  const calendarDates = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const dates: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
    
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      dates.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      dates.push({ date: d.toISOString().slice(0, 10), day: i, isCurrentMonth: true });
    }
    
    const remaining = 42 - dates.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      dates.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false });
    }
    
    return { dates, monthName: firstDay.toLocaleDateString('en', { month: 'long', year: 'numeric' }) };
  })();

  const filteredList = activeTab === 'active' ? activeTrainings 
    : activeTab === 'completed' ? completedTrainings 
    : activeTab === 'pending' ? pendingTrainings 
    : myTrainings;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Training Programs</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          {mode === 'admin' && <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Create Training</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-blue-600">{activeTrainings.length}</p><p className="text-xs text-gray-500">Active</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-green-600">{completedTrainings.length}</p><p className="text-xs text-gray-500">Completed</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-amber-600">{pendingTrainings.length}</p><p className="text-xs text-gray-500">Pending</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-purple-600">{upcomingTrainings.length}</p><p className="text-xs text-gray-500">Upcoming</p></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'active', label: `Active (${activeTrainings.length})` },
          { id: 'completed', label: `Completed (${completedTrainings.length})` },
          { id: 'pending', label: `Pending (${pendingTrainings.length})` },
          { id: 'calendar', label: 'Calendar' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
        ))}
      </div>

      {/* Calendar View */}
      {activeTab === 'calendar' ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{calendarDates.monthName}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDates.dates.map((d, idx) => {
                const isToday = d.date === new Date().toISOString().slice(0, 10);
                const dayTrainings = myTrainings.filter(t => t.startDate === d.date);
                const hasTrainings = dayTrainings.length > 0;
                
                return (
                  <div 
                    key={idx} 
                    className={`border rounded-lg p-2 min-h-[90px] ${!d.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''} ${isToday ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : ''} ${hasTrainings ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    <p className={`text-sm font-bold ${isToday ? 'text-blue-700' : ''}`}>{d.day}</p>
                    {dayTrainings.slice(0, 2).map(t => (
                      <div key={t.id} className="mt-1 p-1 bg-green-100 rounded text-[9px] text-green-800 truncate" title={t.title}>
                        <CalendarCheck className="w-2.5 h-2.5 inline mr-0.5" />{t.title}
                      </div>
                    ))}
                    {dayTrainings.length > 2 && (
                      <p className="text-[8px] text-green-600 mt-0.5">+{dayTrainings.length - 2} more</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredList.length === 0 ? (
              <div className="py-16 text-center text-gray-400"><GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No training programs found</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    {mode === 'admin' && <TableHead>Assigned</TableHead>}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{t.type || 'online'}</Badge></TableCell>
                      <TableCell className="text-sm">{t.startDate || '—'}</TableCell>
                      <TableCell className="text-sm">{t.duration || '—'}</TableCell>
                      <TableCell>
                        <Badge className={
                          t.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          t.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-amber-100 text-amber-800'
                        }>{t.status}</Badge>
                      </TableCell>
                      {mode === 'admin' && (
                        <TableCell className="text-sm">{(t.assignedUsers || []).length} employee(s)</TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-1">
                          {mode === 'admin' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditItem(t); setFormData({ ...t }); setDialogOpen(true); }} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600" onClick={() => { setAssignDialog(t); setSelectedEmployees([]); }} title="Assign"><Users className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(t.id)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </>
                          )}
                          {t.resources && (
                            <Button size="sm" variant="ghost" className="h-7 text-green-600" title="Resources"><FileText className="w-3.5 h-3.5 mr-1" />Resources</Button>
                          )}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Training' : 'Create Training Program'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Training Title</Label><Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Advanced Excel Training" /></div>
            <div><Label>Description</Label><Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Training objectives and content..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={formData.type || 'online'} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="in-person">In-Person</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Duration</Label><Input value={formData.duration || ''} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g., 3 days" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="date-time-input" /></div>
              <div><Label>Status</Label>
                <Select value={formData.status || 'pending'} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Instructor/Trainer</Label><Input value={formData.instructor || ''} onChange={e => setFormData({ ...formData, instructor: e.target.value })} placeholder="e.g., John Smith" /></div>
            <div><Label>Location/Link</Label><Input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Training Room B or Zoom link" /></div>
            <div><Label>Resources (optional)</Label><Textarea value={formData.resources || ''} onChange={e => setFormData({ ...formData, resources: e.target.value })} placeholder="Links to materials, documents, etc..." rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{editItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Employees Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Assign Employees to Training</DialogTitle></DialogHeader>
          {assignDialog && (
            <div className="space-y-3 py-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium">{assignDialog.title}</p>
                <p className="text-xs text-gray-500">{assignDialog.startDate} • {assignDialog.duration}</p>
              </div>
              <div>
                <Label>Select Employees</Label>
                <div className="mt-2 border rounded-md max-h-64 overflow-y-auto p-2 space-y-1">
                  {allUsers.filter(u => u.role !== 'superadmin').map(u => {
                    const uid = u.userId || u.id;
                    const alreadyAssigned = (assignDialog.assignedUsers || []).includes(uid);
                    const selected = selectedEmployees.includes(uid);
                    return (
                      <label key={uid} className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''} ${alreadyAssigned ? 'opacity-50' : ''}`}>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selected || alreadyAssigned}
                          disabled={alreadyAssigned}
                          onChange={() => {
                            setSelectedEmployees(prev => 
                              selected ? prev.filter(id => id !== uid) : [...prev, uid]
                            );
                          }}
                        />
                        <span>{u.name} <span className="text-gray-400">({u.role})</span></span>
                        {alreadyAssigned && <Badge className="ml-auto text-[10px]">Already Assigned</Badge>}
                      </label>
                    );
                  })}
                </div>
                {selectedEmployees.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">{selectedEmployees.length} employee(s) selected</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving || selectedEmployees.length === 0}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Assign {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

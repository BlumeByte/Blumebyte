import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Eye, RefreshCw } from 'lucide-react';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { useBranding } from '../lib/branding-context';

interface ManagerCrudPanelProps {
  resourceType: 'workflows' | 'performance' | 'disciplinary' | 'compliance' | 'tasks' | 'feedback';
  title: string;
  description: string;
  icon: any;
}

type Field = { key: string; label: string; type: 'text' | 'textarea' | 'select' | 'date' | 'employees'; required?: boolean; options?: string[] };

const RESOURCE_CONFIGS: Record<ManagerCrudPanelProps['resourceType'], { endpoint: string; fields: Field[]; columns: string[] }> = {
  workflows: { endpoint: '/workflows', fields: [
    { key: 'name', label: 'Workflow Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'completed'], required: true },
    { key: 'assignedTo', label: 'Assigned Employees', type: 'employees' },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
  ], columns: ['name', 'status', 'assignedTo', 'dueDate'] },
  performance: { endpoint: '/performance-reviews', fields: [
    { key: 'employeeIds', label: 'Employees', type: 'employees', required: true },
    { key: 'reviewPeriod', label: 'Review Period', type: 'text', required: true },
    { key: 'rating', label: 'Rating', type: 'select', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'], required: true },
    { key: 'comments', label: 'Comments', type: 'textarea' },
    { key: 'goals', label: 'Goals', type: 'textarea' },
    { key: 'reviewDate', label: 'Review Date', type: 'date', required: true },
  ], columns: ['employeeIds', 'reviewPeriod', 'rating', 'reviewDate'] },
  disciplinary: { endpoint: '/disciplinary-actions', fields: [
    { key: 'employeeIds', label: 'Employees', type: 'employees', required: true },
    { key: 'actionType', label: 'Action Type', type: 'select', options: ['Verbal Warning', 'Written Warning', 'Suspension'], required: true },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true },
    { key: 'actionDate', label: 'Action Date', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['pending', 'active', 'resolved'], required: true },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ], columns: ['employeeIds', 'actionType', 'actionDate', 'status'] },
  compliance: { endpoint: '/compliance-records', fields: [
    { key: 'title', label: 'Compliance Item', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['Labour Law', 'Safety', 'Documentation', 'Training', 'Other'], required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['compliant', 'non-compliant', 'in-progress'], required: true },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
    { key: 'assignedTo', label: 'Assigned Employees', type: 'employees' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ], columns: ['title', 'category', 'status', 'dueDate'] },
  tasks: { endpoint: '/task-assignments', fields: [
    { key: 'taskName', label: 'Task Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'assignedTo', label: 'Assigned Employees', type: 'employees', required: true },
    { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'], required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'completed', 'cancelled'], required: true },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
  ], columns: ['taskName', 'assignedTo', 'priority', 'status', 'dueDate'] },
  feedback: { endpoint: '/360-feedback', fields: [
    { key: 'employeeIds', label: 'Employees', type: 'employees', required: true },
    { key: 'feedbackType', label: 'Feedback Type', type: 'select', options: ['Peer', 'Manager', 'Self', 'Subordinate'], required: true },
    { key: 'strengths', label: 'Strengths', type: 'textarea', required: true },
    { key: 'improvements', label: 'Areas for Improvement', type: 'textarea', required: true },
    { key: 'rating', label: 'Overall Rating', type: 'select', options: ['1', '2', '3', '4', '5'], required: true },
    { key: 'feedbackDate', label: 'Feedback Date', type: 'date', required: true },
  ], columns: ['employeeIds', 'feedbackType', 'rating', 'feedbackDate'] },
};

const asArray = (value: any): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (!value) return [];
  if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
  return [String(value)];
};

export function ManagerCrudPanel({ resourceType, title, description, icon: Icon }: ManagerCrudPanelProps) {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const config = RESOURCE_CONFIGS[resourceType];
  const [items, setItems] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [managerDepartments, setManagerDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(config.columns[0]);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const teamIds = useMemo(() => new Set(team.flatMap(u => [u.id, u.userId, u.email].filter(Boolean).map(String))), [team]);

  const belongsToTeam = useCallback((item: any) => {
    if (!item) return false;
    const itemDepts = asArray(item.departments || item.department);
    if (itemDepts.some(d => managerDepartments.includes(d))) return true;
    const targetIds = [
      ...asArray(item.assignedTo), ...asArray(item.employeeIds), ...asArray(item.userIds),
      ...asArray(item.employeeId), ...asArray(item.userId), ...asArray(item.targetUsers),
    ];
    return targetIds.some(id => teamIds.has(String(id)));
  }, [managerDepartments, teamIds]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, users, data] = await Promise.all([
        api('/profile', { token: accessToken }),
        api('/users', { token: accessToken }),
        api(config.endpoint, { token: accessToken }),
      ]);
      const depts = asArray(profile?.departments || profile?.department);
      setManagerDepartments(depts);
      const teamUsers = Array.isArray(users) ? users.filter((u: any) => {
        const userDepts = asArray(u.departments || u.department);
        return u.role === 'employee' && userDepts.some(d => depts.includes(d));
      }) : [];
      setTeam(teamUsers);

      const ids = new Set(teamUsers.flatMap((u: any) => [u.id, u.userId, u.email].filter(Boolean).map(String)));
      const scoped = Array.isArray(data) ? data.filter((item: any) => {
        const itemDepts = asArray(item.departments || item.department);
        if (itemDepts.some(d => depts.includes(d))) return true;
        const targetIds = [...asArray(item.assignedTo), ...asArray(item.employeeIds), ...asArray(item.userIds), ...asArray(item.employeeId), ...asArray(item.userId), ...asArray(item.targetUsers)];
        return targetIds.some(id => ids.has(String(id)));
      }) : [];
      setItems(scoped);
    } catch (e: any) {
      console.error(`Failed to load manager ${resourceType}:`, e);
      setItems([]);
      toast.error(e?.message || `Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [accessToken, config.endpoint, resourceType, title]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setFormData({ status: 'pending', department: managerDepartments[0] || '', departments: managerDepartments });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    if (!belongsToTeam(item)) return toast.error('This record is outside your team scope');
    setEditItem(item);
    setFormData({ ...item });
    setDialogOpen(true);
  };

  const validateTargets = (payload: any) => {
    const targets = [...asArray(payload.assignedTo), ...asArray(payload.employeeIds), ...asArray(payload.userIds), ...asArray(payload.employeeId), ...asArray(payload.userId)];
    return targets.length === 0 || targets.every(id => teamIds.has(String(id)));
  };

  const save = async () => {
    const missing = config.fields.filter(f => f.required && asArray(formData[f.key]).length === 0).map(f => f.label);
    if (missing.length) return toast.error(`Required: ${missing.join(', ')}`);
    const payload = { ...formData, department: managerDepartments[0] || '', departments: managerDepartments };
    if (!validateTargets(payload)) return toast.error('You can only assign records to employees in your team');
    setSaving(true);
    try {
      if (editItem) {
        if (!belongsToTeam(editItem)) throw new Error('This record is outside your team scope');
        await api(`${config.endpoint}/${editItem.id}`, { method: 'PUT', body: payload, token: accessToken });
      } else {
        await api(config.endpoint, { method: 'POST', body: payload, token: accessToken });
      }
      toast.success(editItem ? 'Updated successfully' : 'Created successfully');
      setDialogOpen(false);
      await load();
    } catch (e: any) { toast.error(e?.message || 'Unable to save'); }
    finally { setSaving(false); }
  };

  const remove = async (item: any) => {
    if (!belongsToTeam(item)) return toast.error('This record is outside your team scope');
    if (!confirm('Delete this record?')) return;
    try {
      await api(`${config.endpoint}/${item.id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted');
      await load();
    } catch (e: any) { toast.error(e?.message || 'Unable to delete'); }
  };

  const filtered = items.filter(item => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
    const cmp = String(a?.[sortField] ?? '').localeCompare(String(b?.[sortField] ?? ''));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const renderField = (field: Field) => {
    const value = formData[field.key] ?? '';
    if (field.type === 'textarea') return <Textarea value={value} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />;
    if (field.type === 'select') return <Select value={String(value || field.options?.[0] || '')} onValueChange={v => setFormData({ ...formData, [field.key]: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>;
    if (field.type === 'employees') {
      const selected = asArray(value);
      return <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">{team.length === 0 ? <p className="text-xs text-muted-foreground">No employees in your assigned departments.</p> : team.map(emp => {
        const id = String(emp.userId || emp.id || emp.email);
        const checked = selected.includes(id);
        return <label key={id} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={checked} onChange={() => setFormData({ ...formData, [field.key]: checked ? selected.filter(x => x !== id) : [...selected, id] })} /> <span>{emp.name || emp.email}</span></label>;
      })}</div>;
    }
    return <Input type={field.type === 'date' ? 'date' : 'text'} value={value} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />;
  };

  return <div className="space-y-4">
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
      <Icon className="w-5 h-5 text-blue-600 mt-0.5" />
      <div className="flex-1"><h3 className="font-semibold text-blue-900">{title}</h3><p className="text-sm text-blue-700">{description}</p><p className="text-xs text-blue-600 mt-1">Strict scope: {managerDepartments.join(', ') || 'No assigned department'} • {team.length} team member(s)</p></div>
      <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
    </div>
    <div className="flex gap-3 items-start">
      <div className="flex-1"><ListControls searchValue={searchTerm} onSearchChange={setSearchTerm} sortField={sortField} sortDir={sortDir} sortOptions={config.columns.map(c => ({ value: c, label: c }))} onSortChange={setSortField} onToggleSortDir={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} onExportCSV={() => exportToCSV(filtered, `manager-${resourceType}`)} onExportPDF={() => exportToPDF(title, filtered, config.columns, branding.companyName)} placeholder={`Search ${title.toLowerCase()}...`} /></div>
      <Button onClick={openCreate} disabled={managerDepartments.length === 0}><Plus className="w-4 h-4 mr-1" />New</Button>
    </div>
    <Card><CardContent className="p-0">{loading ? <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : filtered.length === 0 ? <div className="py-14 text-center text-sm text-muted-foreground">No team-scoped records found.</div> : <Table><TableHeader><TableRow>{config.columns.map(c => <TableHead key={c}>{c}</TableHead>)}<TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((item, idx) => <TableRow key={item.id || idx}>{config.columns.map(c => <TableCell key={c}>{Array.isArray(item[c]) ? item[c].join(', ') : String(item[c] ?? '—')}</TableCell>)}<TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => { setViewItem(item); setViewDialogOpen(true); }}><Eye className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => remove(item)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Create'} {title}</DialogTitle></DialogHeader><div className="space-y-4">{config.fields.map(field => <div key={field.key}><Label>{field.label}{field.required ? ' *' : ''}</Label>{renderField(field)}</div>)}</div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{editItem ? 'Save changes' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}><DialogContent><DialogHeader><DialogTitle>{title} details</DialogTitle></DialogHeader><div className="space-y-2">{viewItem && Object.entries(viewItem).filter(([k]) => !['companyId','company'].includes(k)).map(([k,v]) => <div key={k} className="grid grid-cols-3 gap-2 text-sm"><span className="font-medium">{k}</span><span className="col-span-2 break-words">{Array.isArray(v) ? v.join(', ') : String(v ?? '—')}</span></div>)}</div></DialogContent></Dialog>
  </div>;
}

export default ManagerCrudPanel;

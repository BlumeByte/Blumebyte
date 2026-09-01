import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, DollarSign, Heart, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

type Resource = 'benefits' | 'compensations';
type TargetType = 'all' | 'department' | 'branch' | 'user';

type ResourceConfig = {
  title: string;
  description: string;
  endpoint: string;
  icon: React.ComponentType<any>;
  defaultValues: Record<string, any>;
};

const configs: Record<Resource, ResourceConfig> = {
  benefits: {
    title: 'Benefits',
    description: 'Manage company benefits for the current organization.',
    endpoint: '/admin/benefits',
    icon: Heart,
    defaultValues: {
      name: '', type: 'health', description: '', employerCost: '', employeeCost: '',
      targetType: 'all', active: true,
    },
  },
  compensations: {
    title: 'Compensation',
    description: 'Manage allowances, bonuses, deductions and compensation packages.',
    endpoint: '/admin/compensations',
    icon: DollarSign,
    defaultValues: {
      name: '', type: 'allowance', description: '', amount: '', frequency: 'monthly',
      targetType: 'all', taxable: true, active: true,
    },
  },
};

const optionName = (value: any) => typeof value === 'string' ? value : String(value?.name || value?.id || '');
const userId = (user: any) => String(user?.userId || user?.id || user?.email || '');

function ResourcePanel({ resource }: { resource: Resource }) {
  const { accessToken } = useAuth();
  const config = configs[resource];
  const Icon = config.icon;
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>(config.defaultValues);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [records, refs, employeeRows] = await Promise.all([
        api(config.endpoint, { token: accessToken }),
        api('/reference-data', { token: accessToken }).catch(() => ({})),
        api('/users', { token: accessToken }).catch(() => []),
      ]);
      setItems(Array.isArray(records) ? records : []);
      setDepartments((refs?.departments || []).map(optionName).filter(Boolean));
      setBranches((refs?.branches || []).map(optionName).filter(Boolean));
      setUsers(Array.isArray(employeeRows) ? employeeRows.filter((row: any) => row?.role !== 'developer') : []);
    } catch (error: any) {
      console.error(`Failed to load ${resource}`, error);
      toast.error(error?.message || `Failed to load ${config.title.toLowerCase()}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, config.endpoint, config.title, resource]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...config.defaultValues });
    setSelectedUsers([]);
    setSelectedDepartments([]);
    setSelectedBranches([]);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ ...item });
    setSelectedUsers(item.targetUsers || []);
    setSelectedDepartments(item.targetDepartments || []);
    setSelectedBranches(item.targetBranches || []);
    setDialogOpen(true);
  };

  const targetType = (form.targetType || 'all') as TargetType;

  const toggle = (value: string, values: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(values.includes(value) ? values.filter(v => v !== value) : [...values, value]);
  };

  const save = async () => {
    if (!String(form.name || '').trim()) return toast.error('Name is required');
    if (resource === 'compensations' && !Number(form.amount)) return toast.error('A valid amount is required');

    const payload: Record<string, any> = {
      ...form,
      targetUsers: targetType === 'user' ? selectedUsers : [],
      targetDepartments: targetType === 'department' ? selectedDepartments : [],
      targetBranches: targetType === 'branch' ? selectedBranches : [],
    };
    if (resource === 'benefits') {
      payload.employerCost = Number(form.employerCost) || 0;
      payload.employeeCost = Number(form.employeeCost) || 0;
    } else {
      payload.amount = Number(form.amount);
    }

    setSaving(true);
    try {
      if (editing?.id) {
        await api(`${config.endpoint}/${editing.id}`, { method: 'PUT', body: payload, token: accessToken });
      } else {
        await api(config.endpoint, { method: 'POST', body: payload, token: accessToken });
      }
      toast.success(`${config.title} ${editing ? 'updated' : 'created'} successfully`);
      setDialogOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error?.message || `Failed to save ${config.title.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: any) => {
    if (!item?.id || !confirm(`Delete ${item.name || 'this record'}?`)) return;
    try {
      await api(`${config.endpoint}/${item.id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted successfully');
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'Delete failed');
    }
  };

  const total = items.length;
  const active = useMemo(() => items.filter(item => item.active !== false).length, [items]);

  return <div className="space-y-4">
    <div className="grid gap-3 md:grid-cols-3">
      <Card><CardHeader className="pb-2"><CardDescription>Total records</CardDescription><CardTitle>{total}</CardTitle></CardHeader></Card>
      <Card><CardHeader className="pb-2"><CardDescription>Active</CardDescription><CardTitle>{active}</CardTitle></CardHeader></Card>
      <Card><CardHeader className="pb-2"><CardDescription>Inactive</CardDescription><CardTitle>{total - active}</CardTitle></CardHeader></Card>
    </div>

    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2"><Icon className="w-5 h-5" /><div><h3 className="font-semibold">{config.title}</h3><p className="text-sm text-muted-foreground">{config.description}</p></div></div>
      <div className="flex gap-2"><Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button><Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add</Button></div>
    </div>

    <Card><CardContent className="p-0">{loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : items.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">No records yet.</div> : <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Target</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map(item => <TableRow key={item.id}><TableCell className="font-medium">{item.name || 'Untitled'}</TableCell><TableCell>{String(item.type || '—').replaceAll('_', ' ')}</TableCell><TableCell>{item.targetType || 'all'}</TableCell><TableCell>{item.active === false ? 'Inactive' : 'Active'}</TableCell><TableCell><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button><Button size="sm" variant="ghost" onClick={() => remove(item)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? 'Edit' : 'Create'} {config.title}</DialogTitle></DialogHeader><div className="space-y-4">
      <div><Label>Name</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Type</Label><Select value={form.type || (resource === 'benefits' ? 'health' : 'allowance')} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(resource === 'benefits' ? ['health','dental','vision','retirement','life_insurance','other'] : ['allowance','bonus','deduction','commission','other']).map(value => <SelectItem key={value} value={value}>{value.replaceAll('_',' ')}</SelectItem>)}</SelectContent></Select></div>
        {resource === 'benefits' ? <div className="grid grid-cols-2 gap-2"><div><Label>Employer cost</Label><Input type="number" min="0" value={form.employerCost || ''} onChange={e => setForm({ ...form, employerCost: e.target.value })} /></div><div><Label>Employee cost</Label><Input type="number" min="0" value={form.employeeCost || ''} onChange={e => setForm({ ...form, employeeCost: e.target.value })} /></div></div> : <div><Label>Amount</Label><Input type="number" min="0" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>}
      </div>
      {resource === 'compensations' && <div><Label>Frequency</Label><Select value={form.frequency || 'monthly'} onValueChange={v => setForm({ ...form, frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['one_time','weekly','monthly','quarterly','yearly'].map(value => <SelectItem key={value} value={value}>{value.replaceAll('_',' ')}</SelectItem>)}</SelectContent></Select></div>}
      <div><Label>Target</Label><Select value={targetType} onValueChange={v => setForm({ ...form, targetType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Company-wide</SelectItem><SelectItem value="department">Departments</SelectItem><SelectItem value="branch">Branches</SelectItem><SelectItem value="user">Employees</SelectItem></SelectContent></Select></div>
      {targetType === 'department' && <SelectionList values={departments} selected={selectedDepartments} onToggle={value => toggle(value, selectedDepartments, setSelectedDepartments)} />}
      {targetType === 'branch' && <SelectionList values={branches} selected={selectedBranches} onToggle={value => toggle(value, selectedBranches, setSelectedBranches)} />}
      {targetType === 'user' && <SelectionList values={users.map(userId).filter(Boolean)} selected={selectedUsers} labels={Object.fromEntries(users.map(user => [userId(user), user.name || user.email || userId(user)]))} onToggle={value => toggle(value, selectedUsers, setSelectedUsers)} />}
      <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.active !== false} onCheckedChange={checked => setForm({ ...form, active: checked })} /></div>
      {resource === 'compensations' && <div className="flex items-center justify-between"><Label>Taxable</Label><Switch checked={form.taxable !== false} onCheckedChange={checked => setForm({ ...form, taxable: checked })} /></div>}
    </div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? 'Save changes' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function SelectionList({ values, selected, labels = {}, onToggle }: { values: string[]; selected: string[]; labels?: Record<string,string>; onToggle: (value: string) => void }) {
  return <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">{values.length === 0 ? <p className="text-sm text-muted-foreground">No options available.</p> : values.map(value => <label key={value} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} /><span>{labels[value] || value}</span></label>)}</div>;
}

export default function AdminPeopleOperations() {
  return <div className="min-h-screen bg-muted/30"><div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">People Operations</h1><p className="text-sm text-muted-foreground">Organization-scoped benefits and compensation administration.</p></div><Button asChild variant="outline"><Link to="/admin"><ArrowLeft className="w-4 h-4 mr-2" />Admin dashboard</Link></Button></div>
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This area intentionally excludes subscription, license, renewal and payment administration. Those commercial functions remain protected under SuperAdmin-only routes.</div>
    <Tabs defaultValue="benefits"><TabsList><TabsTrigger value="benefits">Benefits</TabsTrigger><TabsTrigger value="compensations">Compensation</TabsTrigger></TabsList><TabsContent value="benefits" className="mt-4"><ResourcePanel resource="benefits" /></TabsContent><TabsContent value="compensations" className="mt-4"><ResourcePanel resource="compensations" /></TabsContent></Tabs>
  </div></div>;
}

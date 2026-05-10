import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {
  LayoutDashboard, Building2, Users, Shield, Search, Loader2, RefreshCw,
  Eye, Trash2, LogOut, AlertCircle, Copy, CheckCircle, Settings,
  BarChart3, Briefcase, Ticket, Key, Activity, FileText, UserPlus,
  ChevronRight, ChevronLeft, Wrench, Bell, Lock, Unlock, PanelLeftClose,
  PanelLeftOpen, AlertTriangle, BookOpen, MessageSquare, Server, Zap,
  TrendingUp
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ['ultimateadmin', 'customer_care'];
const PLATFORM_ROLES = ['ultimateadmin', 'customer_care'];

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tenants', label: 'Tenants', icon: Building2 },
  { id: 'users', label: 'All Users', icon: Users },
  { id: 'chat', label: 'Global Chat', icon: MessageSquare },
  { id: 'tickets', label: 'Support Tickets', icon: Ticket },
  { id: 'license-issues', label: 'License Issues', icon: Key },
  { id: 'platform-users', label: 'Platform Users', icon: UserPlus },
  { id: 'assignments', label: 'Assignments', icon: Activity },
  { id: 'audit', label: 'Audit Trail', icon: BookOpen },
  { id: 'dev-tools', label: 'Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const TICKET_STATUSES = ['open', 'pending', 'resolved', 'escalated'];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const ISSUE_TYPES = ['general', 'billing', 'license', 'technical', 'data', 'account', 'integration', 'other'];

// ─── Session helpers ───────────────────────────────────────────────────────────
function setSupportSession() { sessionStorage.setItem('ultimateadmin_support_session', '1'); }
function clearSupportSession() { sessionStorage.removeItem('ultimateadmin_support_session'); }

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tenant {
  id: string; name: string; industry?: string; licenseStatus?: string;
  activeUsers: number; totalUsers: number; purchasedLicenses: number;
  plan?: string; lastActivity?: string; createdAt?: string;
}

interface Ticket {
  id: string; tenantId: string; tenantName: string; issueType: string;
  priority: string; subject: string; description: string; status: string;
  assignedAgentId?: string; assignedAgentName?: string;
  createdAt: string; updatedAt: string; notes?: { text: string; authorEmail: string; timestamp: string }[];
}

interface Agent {
  id: string; name: string; email: string; role: string;
  assignedTenants: string[]; status: string; openTickets: number; resolvedTickets: number;
}

interface Metrics {
  totalTenants: number; activeTenants: number; expiredLicenses: number;
  openTickets: number; resolvedToday: number; totalAgents: number; totalTickets: number;
}

interface AuditLog {
  id: string; actorEmail: string; actionType: string; tenantId: string;
  timestamp: string; description: string;
}

// ─── Root Component ────────────────────────────────────────────────────────────
export default function CustomerCareDashboard() {
  const navigate = useNavigate();
  const { user, sessionLoading, getToken, logout } = useAuth();
  // tri-state: null = verifying, true = authenticated, false = unauthenticated
  const [authState, setAuthState] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user || (user.role !== 'ultimateadmin' && user.role !== 'developer')) {
      clearSupportSession();
      setAuthState(false);
      return;
    }
    getToken().then((t) => {
      if (!t) {
        clearSupportSession();
        setAuthState(false);
        return;
      }
      setSupportSession();
      setToken(t);
      setAuthState(true);
    });
  }, [sessionLoading, user, getToken]);

  const handleLogout = async () => {
    clearSupportSession();
    await logout();
    navigate('/login');
  };

  if (authState === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!authState) {
    // Not authenticated — redirect to global login page
    navigate('/login', { replace: true });
    return null;
  }

  return <SupportDashboard token={token!} onLogout={handleLogout} />;
}
// ─── Metrics Cards ────────────────────────────────────────────────────────────
function MetricsCards({ metrics }: { metrics: Metrics }) {
  const cards = [
    { label: 'Total Tenants', value: metrics.totalTenants, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Tenants', value: metrics.activeTenants, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Expired Licenses', value: metrics.expiredLicenses, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
    { label: 'Open Tickets', value: metrics.openTickets, icon: Ticket, color: 'text-red-600 bg-red-50' },
    { label: 'Resolved Today', value: metrics.resolvedToday, icon: CheckCircle, color: 'text-teal-600 bg-teal-50' },
    { label: 'Support Agents', value: metrics.totalAgents, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Tickets', value: metrics.totalTickets, icon: FileText, color: 'text-gray-600 bg-gray-50' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(card => (
        <Card key={card.label} className="p-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
            <card.icon className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
        </Card>
      ))}
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700', open: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700',
    escalated: 'bg-orange-100 text-orange-700', suspended: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700', unknown: 'bg-gray-100 text-gray-600',
    critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700', low: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ─── Tenants Panel ─────────────────────────────────────────────────────────────
function TenantsPanel({ token }: { token: string }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [licenseDialog, setLicenseDialog] = useState(false);
  const [licenseForm, setLicenseForm] = useState({ purchasedLicenses: '', status: '', expiresAt: '', durationAmount: '', durationUnit: 'days', plan: '' });
  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', industry: '', plan: 'custom', purchasedLicenses: '0', durationAmount: '30', durationUnit: 'days' });
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ name: '', email: '', role: 'superadmin', password: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/ultimateadmin/support/tenants', { token });
      setTenants(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 seconds so new users/tenants appear without manual reload
  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const loadUsers = async (tenant: Tenant) => {
    setSelected(tenant);
    try {
      const data = await api(`/ultimateadmin/support/tenants/${tenant.id}/users`, { token });
      setTenantUsers(Array.isArray(data) ? data : []);
      setShowUsers(true);
    } catch { toast.error('Failed to load users'); }
  };

  const toggleSuspend = async (tenant: Tenant) => {
    const isSuspended = tenant.licenseStatus === 'suspended';
    setActionLoading(tenant.id);
    try {
      await api(`/ultimateadmin/support/tenants/${tenant.id}/suspend`, {
        method: 'POST', token, body: { restore: isSuspended },
      });
      toast.success(isSuspended ? 'Tenant restored' : 'Tenant suspended');
      load();
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(null); }
  };

  const updateLicense = async () => {
    if (!selected) return;
    setActionLoading('license');
    try {
      const body: any = {};
      if (licenseForm.purchasedLicenses) body.purchasedLicenses = Number(licenseForm.purchasedLicenses);
      if (licenseForm.status) body.status = licenseForm.status;
      if (licenseForm.plan) body.plan = licenseForm.plan;
      if (licenseForm.expiresAt) {
        body.expiresAt = licenseForm.expiresAt;
      } else if (licenseForm.durationAmount) {
        body.durationAmount = licenseForm.durationAmount;
        body.durationUnit = licenseForm.durationUnit;
      }
      await api(`/ultimateadmin/support/tenants/${selected.id}/license`, { method: 'PUT', token, body });
      toast.success('License updated');
      setLicenseDialog(false);
      load();
    } catch { toast.error('License update failed'); }
    finally { setActionLoading(null); }
  };

  const createTenant = async () => {
    if (!createForm.name.trim()) return toast.error('Company name required');
    setSaving(true);
    try {
      await api('/ultimateadmin/support/tenants', {
        method: 'POST', token, body: createForm,
      });
      toast.success(`Tenant "${createForm.name}" created`);
      setCreateDialog(false);
      setCreateForm({ name: '', industry: '', plan: 'custom', purchasedLicenses: '0', durationAmount: '30', durationUnit: 'days' });
      load();
    } catch (e: any) { toast.error(e.message || 'Failed to create tenant'); }
    finally { setSaving(false); }
  };

  const createUser = async () => {
    if (!selected) return;
    if (!createUserForm.name.trim() || !createUserForm.email.trim()) return toast.error('Name and email required');
    setSaving(true);
    try {
      const result = await api(`/ultimateadmin/support/tenants/${selected.id}/users`, {
        method: 'POST', token, body: createUserForm,
      });
      toast.success(`User created${result.tempPassword ? ` — temp password: ${result.tempPassword}` : ''}`);
      setCreateUserDialog(false);
      setCreateUserForm({ name: '', email: '', role: 'superadmin', password: '' });
      loadUsers(selected);
    } catch (e: any) { toast.error(e.message || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input className="pl-8" placeholder="Search tenants…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        <Button size="sm" onClick={() => setCreateDialog(true)}>
          <Building2 className="h-3.5 w-3.5 mr-1" />New Tenant
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">No tenants found</TableCell></TableRow>
              )}
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{t.id.slice(0, 12)}…</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{t.industry || '—'}</TableCell>
                  <TableCell className="text-sm">{t.plan || '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={t.licenseStatus || 'unknown'} />
                    <p className="text-xs text-gray-400 mt-0.5">{t.purchasedLicenses} seats</p>
                  </TableCell>
                  <TableCell className="text-sm">{t.activeUsers}/{t.totalUsers}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => loadUsers(t)} title="View/Add Users">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setSelected(t);
                        setLicenseDialog(true);
                        setLicenseForm({ purchasedLicenses: String(t.purchasedLicenses), status: t.licenseStatus || '', expiresAt: '', durationAmount: '30', durationUnit: 'days', plan: t.plan || '' });
                      }} title="Manage License">
                        <Key className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className={t.licenseStatus === 'suspended' ? 'text-green-600' : 'text-orange-600'}
                        onClick={() => toggleSuspend(t)} disabled={actionLoading === t.id} title={t.licenseStatus === 'suspended' ? 'Restore' : 'Suspend'}>
                        {actionLoading === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t.licenseStatus === 'suspended' ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Users Dialog */}
      <Dialog open={showUsers} onOpenChange={setShowUsers}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Users — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => { setCreateUserDialog(true); }}>
              <UserPlus className="h-3.5 w-3.5 mr-1" />Add User
            </Button>
          </div>
          <div className="border rounded-lg overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {tenantUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-sm">{u.name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><StatusBadge status={u.role} /></TableCell>
                    <TableCell><StatusBadge status={u.status} /></TableCell>
                  </TableRow>
                ))}
                {tenantUsers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-4">No users found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowUsers(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Dialog */}
      <Dialog open={licenseDialog} onOpenChange={setLicenseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage License — {selected?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Purchased Seats</Label><Input type="number" value={licenseForm.purchasedLicenses} onChange={e => setLicenseForm(f => ({ ...f, purchasedLicenses: e.target.value }))} /></div>
            <div>
              <Label>Plan</Label>
              <Input value={licenseForm.plan} placeholder="e.g. basic, pro, enterprise, custom" onChange={e => setLicenseForm(f => ({ ...f, plan: e.target.value }))} />
            </div>
            <div>
              <Label>License Status</Label>
              <Select value={licenseForm.status} onValueChange={v => setLicenseForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {['active', 'expired', 'suspended', 'trial'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>License Duration (no payment required)</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" placeholder="30" value={licenseForm.durationAmount} className="w-24"
                  onChange={e => setLicenseForm(f => ({ ...f, durationAmount: e.target.value, expiresAt: '' }))} />
                <Select value={licenseForm.durationUnit} onValueChange={v => setLicenseForm(f => ({ ...f, durationUnit: v, expiresAt: '' }))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-400 mt-1">Or set a specific expiry date below (overrides duration):</p>
            </div>
            <div><Label>Specific Expiry Date</Label><Input type="date" value={licenseForm.expiresAt} onChange={e => setLicenseForm(f => ({ ...f, expiresAt: e.target.value, durationAmount: '' }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLicenseDialog(false)}>Cancel</Button>
            <Button onClick={updateLicense} disabled={actionLoading === 'license'}>
              {actionLoading === 'license' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Apply License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Tenant</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Company Name *</Label><Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" /></div>
            <div><Label>Industry</Label><Input value={createForm.industry} onChange={e => setCreateForm(f => ({ ...f, industry: e.target.value }))} placeholder="Technology, Healthcare, etc." /></div>
            <div>
              <Label>Plan</Label>
              <Input value={createForm.plan} onChange={e => setCreateForm(f => ({ ...f, plan: e.target.value }))} placeholder="custom" />
            </div>
            <div><Label>License Seats</Label><Input type="number" value={createForm.purchasedLicenses} onChange={e => setCreateForm(f => ({ ...f, purchasedLicenses: e.target.value }))} /></div>
            <div>
              <Label>License Duration</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" placeholder="30" value={createForm.durationAmount} className="w-24"
                  onChange={e => setCreateForm(f => ({ ...f, durationAmount: e.target.value }))} />
                <Select value={createForm.durationUnit} onValueChange={v => setCreateForm(f => ({ ...f, durationUnit: v }))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={createTenant} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add User to {selected?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name *</Label><Input value={createUserForm.name} onChange={e => setCreateUserForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={createUserForm.email} onChange={e => setCreateUserForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div>
              <Label>Role</Label>
              <Select value={createUserForm.role} onValueChange={v => setCreateUserForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['superadmin', 'admin', 'manager', 'employee'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Password (leave blank for auto-generated)</Label><Input type="password" value={createUserForm.password} onChange={e => setCreateUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Auto-generated if empty" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialog(false)}>Cancel</Button>
            <Button onClick={createUser} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tickets Panel ─────────────────────────────────────────────────────────────
function TicketsPanel({ token, tenants }: { token: string; tenants: Tenant[] }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState({ tenantId: '', tenantName: '', issueType: 'general', priority: 'medium', subject: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/ultimateadmin/support/tickets', { token });
      setTickets(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const createTicket = async () => {
    if (!form.subject.trim()) return toast.error('Subject required');
    setSaving(true);
    try {
      await api('/ultimateadmin/support/tickets', { method: 'POST', token, body: form });
      toast.success('Ticket created');
      setShowCreate(false);
      setForm({ tenantId: '', tenantName: '', issueType: 'general', priority: 'medium', subject: '', description: '' });
      load();
    } catch { toast.error('Failed to create ticket'); }
    finally { setSaving(false); }
  };

  const updateTicket = async (id: string, patch: any) => {
    try {
      await api(`/ultimateadmin/support/tickets/${id}`, { method: 'PUT', token, body: patch });
      toast.success('Ticket updated');
      load();
      setSelected(null);
    } catch { toast.error('Update failed'); }
  };

  const addNote = async () => {
    if (!selected || !noteText.trim()) return;
    setSaving(true);
    try {
      await api(`/ultimateadmin/support/tickets/${selected.id}`, { method: 'PUT', token, body: { note: noteText } });
      toast.success('Note added');
      setNoteText('');
      load();
      setSelected(null);
    } catch { toast.error('Failed to add note'); }
    finally { setSaving(false); }
  };

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.tenantName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input className="pl-8" placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TICKET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        <Button size="sm" onClick={() => setShowCreate(true)}><UserPlus className="h-3.5 w-3.5 mr-1" />New Ticket</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">No tickets found</TableCell></TableRow>}
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">{t.subject}</TableCell>
                  <TableCell className="text-sm">{t.tenantName || '—'}</TableCell>
                  <TableCell className="text-sm">{t.issueType}</TableCell>
                  <TableCell><StatusBadge status={t.priority} /></TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(t)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => api(`/ultimateadmin/support/tickets/${t.id}`, { method: 'DELETE', token }).then(() => { toast.success('Deleted'); load(); })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tenant</Label>
              <Select value={form.tenantId} onValueChange={v => {
                const t = tenants.find(x => x.id === v);
                setForm(f => ({ ...f, tenantId: v, tenantName: t?.name || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select tenant (optional)" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Issue Type</Label>
                <Select value={form.issueType} onValueChange={v => setForm(f => ({ ...f, issueType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TICKET_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Subject *</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createTicket} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selected.subject}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">Tenant:</span> <span className="font-medium">{selected.tenantName || '—'}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="font-medium">{selected.issueType}</span></div>
                <div><span className="text-gray-500">Priority:</span> <StatusBadge status={selected.priority} /></div>
              </div>
              {selected.description && <p className="text-sm bg-gray-50 p-3 rounded-lg">{selected.description}</p>}
              <div className="flex items-center gap-2">
                <Label className="shrink-0">Update Status:</Label>
                <Select defaultValue={selected.status} onValueChange={v => updateTicket(selected.id, { status: v })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{TICKET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {/* Notes */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Notes ({(selected.notes || []).length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(selected.notes || []).map((n, i) => (
                    <div key={i} className="bg-blue-50 p-2 rounded text-sm">
                      <p>{n.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.authorEmail} · {new Date(n.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Add a note…" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} />
                  <Button size="sm" onClick={addNote} disabled={saving}>Add</Button>
                </div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── License Issues Panel ─────────────────────────────────────────────────────
function LicenseIssuesPanel({ tenants, token, onRefresh }: { tenants: Tenant[]; token: string; onRefresh: () => void }) {
  const problematic = tenants.filter(t => t.licenseStatus !== 'active' && t.licenseStatus !== 'unknown');

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{problematic.length} tenants with license issues</p>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Users</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problematic.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-green-600 py-8">✓ All licenses are healthy</TableCell></TableRow>}
            {problematic.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium text-sm">{t.name}</TableCell>
                <TableCell><StatusBadge status={t.licenseStatus || 'unknown'} /></TableCell>
                <TableCell className="text-sm">{t.plan || '—'}</TableCell>
                <TableCell className="text-sm">{t.purchasedLicenses}</TableCell>
                <TableCell className="text-sm">{t.activeUsers}/{t.totalUsers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Agents Panel ─────────────────────────────────────────────────────────────
function AgentsPanel({ token }: { token: string }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'customer_care' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/ultimateadmin/support/agents', { token });
      setAgents(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load agents'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const createAgent = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    setSaving(true);
    try {
      await api('/ultimateadmin/support/agents', { method: 'POST', token, body: form });
      toast.success('Agent created');
      setShowCreate(false);
      setForm({ name: '', email: '', role: 'customer_care' });
      load();
    } catch { toast.error('Failed to create agent'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (agent: Agent) => {
    try {
      await api(`/ultimateadmin/support/agents/${agent.id}`, { method: 'PUT', token, body: { status: agent.status === 'active' ? 'inactive' : 'active' } });
      toast.success('Agent updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}><UserPlus className="h-3.5 w-3.5 mr-1" />Add Agent</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">No agents yet</TableCell></TableRow>}
              {agents.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">{a.name}</TableCell>
                  <TableCell className="text-sm">{a.email}</TableCell>
                  <TableCell><StatusBadge status={a.role} /></TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => toggleStatus(a)}>
                      {a.status === 'active' ? <Lock className="h-3.5 w-3.5 text-orange-500" /> : <Unlock className="h-3.5 w-3.5 text-green-500" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Support Agent</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createAgent} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Platform Users Panel ─────────────────────────────────────────────────────
function PlatformUsersPanel({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'customer_care_agent' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/ultimateadmin/platform-users', { token });
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load platform users'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    setSaving(true);
    try {
      if (editUser) {
        await api(`/ultimateadmin/platform-users/${editUser.id}`, { method: 'PUT', token, body: form });
        toast.success('User updated');
      } else {
        await api('/ultimateadmin/platform-users', { method: 'POST', token, body: form });
        toast.success('Platform user created');
      }
      setShowCreate(false);
      setEditUser(null);
      setForm({ name: '', email: '', role: 'customer_care_agent' });
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const deleteUser = async (u: any) => {
    if (!confirm(`Delete platform user ${u.email}?`)) return;
    try {
      await api(`/ultimateadmin/platform-users/${u.id}`, { method: 'DELETE', token });
      toast.success('User removed');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name || '', email: u.email || '', role: u.role || 'customer_care' });
    setShowCreate(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditUser(null); setForm({ name: '', email: '', role: 'customer_care' }); setShowCreate(true); }}>
          <UserPlus className="h-3.5 w-3.5 mr-1" />Add Platform User
        </Button>
      </div>
      <p className="text-sm text-gray-500">
        Platform users (developers and customer care agents) are granted access directly here.
        They do not need a tenant subscription or license.
      </p>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">No platform users yet</TableCell></TableRow>}
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-sm">{u.name}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell><StatusBadge status={u.role} /></TableCell>
                  <TableCell><StatusBadge status={u.status || 'active'} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)} title="Edit"><Settings className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteUser(u)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editUser ? 'Edit Platform User' : 'Add Platform User'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editUser} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORM_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={saveUser} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{editUser ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Assignments Panel ────────────────────────────────────────────────────────
function AssignmentsPanel({ token, tenants }: { token: string; tenants: Tenant[] }) {
  const [careAgents, setCareAgents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsData, assignData] = await Promise.all([
        api('/ultimateadmin/platform-users', { token }),
        api('/ultimateadmin/assignments', { token }),
      ]);
      const agents = Array.isArray(agentsData) ? agentsData.filter((u: any) => {
        const r = u.role || '';
        return r === 'customer_care';
      }) : [];
      setCareAgents(agents);
      setAssignments(Array.isArray(assignData) ? assignData : []);
    } catch { toast.error('Failed to load assignments'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const addAssignment = async () => {
    if (!selectedAgent || selectedTenants.length === 0) return toast.error('Select agent and at least one tenant');
    setSaving(true);
    try {
      await api('/ultimateadmin/assignments', { method: 'POST', token, body: { careAgentId: selectedAgent, tenantIds: selectedTenants } });
      toast.success('Assignment saved');
      setSelectedAgent('');
      setSelectedTenants([]);
      load();
    } catch { toast.error('Assignment failed'); }
    finally { setSaving(false); }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      await api(`/ultimateadmin/assignments/${assignmentId}`, { method: 'DELETE', token });
      toast.success('Assignment removed');
      load();
    } catch { toast.error('Remove failed'); }
  };

  const tenantName = (id: string) => tenants.find(t => t.id === id)?.name || id.slice(0, 12) + '…';

  return (
    <div className="space-y-6">
      {/* Create new assignment */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm">Assign Tenants to Care Agent</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Care Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select agent…" /></SelectTrigger>
              <SelectContent>
                {careAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.email})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tenants (comma-separated IDs or select below)</Label>
            <div className="mt-1 border rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
              {tenants.length === 0 && <p className="text-xs text-gray-400">No tenants available</p>}
              {tenants.map(t => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1">
                  <input
                    type="checkbox"
                    checked={selectedTenants.includes(t.id)}
                    onChange={e => {
                      setSelectedTenants(prev =>
                        e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id)
                      );
                    }}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <Button size="sm" onClick={addAssignment} disabled={saving || !selectedAgent || selectedTenants.length === 0}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Assign Selected Tenants
        </Button>
      </div>

      {/* Current assignments per agent */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">Current Assignments</h3>
          {careAgents.length === 0 && <p className="text-sm text-gray-400">No care agents found. Add platform users first.</p>}
          {careAgents.map(agent => {
            const agentAssignments = assignments.filter((a: any) => a.careAgentId === agent.id);
            return (
              <div key={agent.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.email} · <StatusBadge status={agent.role} /></p>
                  </div>
                  <span className="text-xs text-gray-400">{agentAssignments.length} tenant(s)</span>
                </div>
                {agentAssignments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No tenants assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {agentAssignments.map((a: any) => (
                      <span key={a.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {tenantName(a.tenantId)}
                        <button
                          onClick={() => removeAssignment(a.id)}
                          className="ml-1 text-gray-400 hover:text-red-500"
                          title="Remove"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── All Users Panel ──────────────────────────────────────────────────────────
function AllUsersPanel({ token, tenants }: { token: string; tenants: Tenant[] }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/ultimateadmin/users', { token });
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const allRoles = [...new Set(users.map((u: any) => u.role).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input className="pl-8" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {allRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        <Badge variant="secondary">{filtered.length} users</Badge>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">No users found</TableCell></TableRow>}
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-sm">{u.name || '—'}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell><StatusBadge status={u.role} /></TableCell>
                  <TableCell className="text-sm">{u.companyName || tenants.find(t => t.id === u.companyId)?.name || u.companyId || '—'}</TableCell>
                  <TableCell><StatusBadge status={u.status || 'active'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Global Chat Panel ────────────────────────────────────────────────────────
function GlobalChatPanel({ token, tenants }: { token: string; tenants: Tenant[] }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [search, setSearch] = useState('');

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const [threadData, userData] = await Promise.all([
        api('/ultimateadmin/chat/threads', { token }),
        api('/ultimateadmin/users', { token }),
      ]);
      setThreads(Array.isArray(threadData) ? threadData : []);
      setAllUsers(Array.isArray(userData) ? userData : []);
    } catch { toast.error('Failed to load chat'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const loadThread = async (thread: any) => {
    setActiveThread(thread);
    setMsgLoading(true);
    try {
      const data = await api(`/ultimateadmin/chat/threads/${thread.id}`, { token });
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch { toast.error('Failed to load messages'); }
    finally { setMsgLoading(false); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    if (!activeThread && !recipient) return toast.error('Select a recipient');
    setSending(true);
    try {
      const selectedUser = allUsers.find(u => u.id === recipient || u.email === recipient);
      const body: any = {
        message: newMsg.trim(),
        threadId: activeThread?.id,
        recipientId: activeThread?.recipientId || selectedUser?.id || '',
        recipientEmail: activeThread?.recipientEmail || selectedUser?.email || recipient,
        recipientName: activeThread?.recipientName || selectedUser?.name || '',
        tenantId: activeThread?.tenantId || selectedUser?.companyId || '',
      };
      const result = await api('/ultimateadmin/chat/send', { method: 'POST', token, body });
      setNewMsg('');
      if (!activeThread) {
        // New thread created — load it
        await loadThreads();
        setShowNewChat(false);
        setRecipient('');
        // Find and open the new thread
        const freshThreads = await api('/ultimateadmin/chat/threads', { token });
        const newThread = freshThreads.find((t: any) => t.id === result.threadId);
        if (newThread) loadThread(newThread);
      } else {
        // Refresh messages
        const data = await api(`/ultimateadmin/chat/threads/${activeThread.id}`, { token });
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (e: any) { toast.error(e.message || 'Failed to send message'); }
    finally { setSending(false); }
  };

  const filteredThreads = threads.filter(t =>
    (t.recipientName || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.recipientEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Thread list */}
      <div className="w-72 shrink-0 border rounded-lg flex flex-col bg-white">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Conversations</h3>
            <Button size="sm" variant="outline" onClick={() => setShowNewChat(true)}>
              <UserPlus className="h-3.5 w-3.5 mr-1" />New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input className="pl-8 h-8 text-sm" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>}
          {!loading && filteredThreads.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">No conversations yet</div>
          )}
          {filteredThreads.map(t => (
            <button
              key={t.id}
              onClick={() => loadThread(t)}
              className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${activeThread?.id === t.id ? 'bg-blue-50' : ''}`}
            >
              <p className="font-medium text-sm truncate">{t.recipientName || t.recipientEmail}</p>
              <p className="text-xs text-gray-400 truncate">{t.lastMessage}</p>
              <p className="text-xs text-gray-300 mt-0.5">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : ''}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 border rounded-lg flex flex-col bg-white">
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Select a conversation or start a new one</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b flex items-center gap-2">
              <div>
                <p className="font-semibold text-sm">{activeThread.recipientName || activeThread.recipientEmail}</p>
                <p className="text-xs text-gray-400">{activeThread.recipientEmail} · {tenants.find(t => t.id === activeThread.tenantId)?.name || activeThread.tenantId || 'No tenant'}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {msgLoading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.senderRole === 'ultimateadmin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg p-2 text-sm ${m.senderRole === 'ultimateadmin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p>{m.message}</p>
                    <p className={`text-xs mt-0.5 ${m.senderRole === 'ultimateadmin' ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(m.sentAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && !msgLoading && <p className="text-center text-gray-400 text-sm py-4">No messages yet</p>}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Input
                placeholder="Type a message…"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <Button size="sm" onClick={sendMessage} disabled={sending || !newMsg.trim()} aria-label="Send message">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start New Conversation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Select Recipient</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a user…" /></SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email} — {u.role} {u.companyName ? `(${u.companyName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Message</Label><Textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type your message…" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChat(false)}>Cancel</Button>
            <Button onClick={sendMessage} disabled={sending || !newMsg.trim() || !recipient}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function AuditTrailPanel({ token }: { token: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/ultimateadmin/support/audit', { token });
      setLogs(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">No audit logs yet</TableCell></TableRow>}
              {logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{log.actorEmail}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{log.actionType}</Badge></TableCell>
                  <TableCell className="text-xs text-gray-500 font-mono">{log.tenantId ? log.tenantId.slice(0, 12) + '…' : '—'}</TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">{log.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Developer Tools Panel ────────────────────────────────────────────────────
function DevToolsPanel({ tenants, token }: { tenants: Tenant[]; token: string }) {
  const [selectedTenant, setSelectedTenant] = useState('');
  const [running, setRunning] = useState<string | null>(null);

  const runRepair = async (action: string) => {
    if (!selectedTenant) return toast.error('Select a tenant first');
    setRunning(action);
    try {
      const result = await api(`/ultimateadmin/support/repair/${selectedTenant}`, {
        method: 'POST', token, body: { action },
      });
      toast.success(`✓ ${action} executed for ${result.tenantId}`);
    } catch { toast.error('Repair action failed'); }
    finally { setRunning(null); }
  };

  const tools = [
    { id: 'reset_cache', label: 'Reset Tenant Cache', icon: RefreshCw, desc: 'Clears all cached data for this tenant' },
    { id: 'refresh_permissions', label: 'Refresh Permissions', icon: Shield, desc: 'Re-evaluates all role-based permissions' },
    { id: 'resync_database', label: 'Re-sync Database', icon: Server, desc: 'Syncs tenant records with source of truth' },
    { id: 'reset_user_login', label: 'Reset User Login', icon: Key, desc: 'Forces re-authentication for all users' },
    { id: 'rebuild_indexes', label: 'Rebuild Indexes', icon: Zap, desc: 'Rebuilds search and lookup indexes' },
    { id: 'repair_records', label: 'Repair Records', icon: Wrench, desc: 'Fixes common data integrity issues' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex items-center gap-2 pt-4">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-700">These actions affect tenant data. Use with caution. All actions are logged.</p>
        </CardContent>
      </Card>

      <div>
        <Label>Target Tenant</Label>
        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select a tenant…" /></SelectTrigger>
          <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map(tool => (
          <Card key={tool.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <tool.icon className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-sm">{tool.label}</p>
              </div>
              <p className="text-xs text-gray-500">{tool.desc}</p>
              <Button size="sm" variant="outline" className="w-full" onClick={() => runRepair(tool.id)} disabled={!!running || !selectedTenant}>
                {running === tool.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Run
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ myProfile }: { myProfile: { email: string; name: string; role: string } | null }) {
  return (
    <div className="space-y-4 max-w-md">
      <Card>
        <CardHeader><CardTitle className="text-base">My Profile</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="font-medium">{myProfile?.email || '—'}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-medium">{myProfile?.name || '—'}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Role</span><StatusBadge status={myProfile?.role || 'unknown'} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">SQL Setup</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">Run this SQL in Supabase to grant Ultimateadmin access to a user:</p>
          <pre className="bg-gray-950 text-green-400 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{`-- Grant Ultimateadmin access
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) ||
  '{"role": "ultimateadmin"}'::jsonb
WHERE email = 'your-email@example.com';

-- Grant Customer Care access
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) ||
  '{"role": "customer_care"}'::jsonb
WHERE email = 'care-agent@example.com';

-- Verify
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email IN ('your-email@example.com', 'care-agent@example.com');`}</pre>
          <p className="text-xs text-gray-500">Ultimateadmin → /developer dashboard. Customer Care → /customer-care dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
function SupportDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [myProfile, setMyProfile] = useState<{ email: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsData, tenantsData, profileData] = await Promise.all([
        api('/ultimateadmin/support/metrics', { token }),
        api('/ultimateadmin/support/tenants', { token }),
        api('/ultimateadmin/support/verify', { token }),
      ]);
      setMetrics(metricsData);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
      setMyProfile(profileData);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh metrics and tenant list every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const sectionTitle = SIDEBAR_ITEMS.find(s => s.id === activeSection)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} transition-all duration-200 bg-gray-950 text-gray-200 flex flex-col shrink-0`}>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-gray-900" />
          </div>
          {!sidebarCollapsed && <span className="font-semibold text-sm text-white leading-tight">Ultimateadmin</span>}
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSection === item.id ? 'bg-white text-gray-900 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-2 space-y-1">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-950 hover:text-red-300 text-sm"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-semibold text-gray-900">{sectionTitle}</h1>
            {myProfile && <p className="text-xs text-gray-500">{myProfile.email} · <StatusBadge status={myProfile.role} /></p>}
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <>
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  {metrics && <MetricsCards metrics={metrics} />}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'View Tenants', icon: Building2, section: 'tenants' },
                          { label: 'All Users', icon: Users, section: 'users' },
                          { label: 'Global Chat', icon: MessageSquare, section: 'chat' },
                          { label: 'New Ticket', icon: Ticket, section: 'tickets' },
                          { label: 'License Issues', icon: Key, section: 'license-issues' },
                          { label: 'Platform Users', icon: Users, section: 'platform-users' },
                        ].map(a => (
                          <Button key={a.label} variant="outline" className="h-16 flex-col gap-1" onClick={() => setActiveSection(a.section)}>
                            <a.icon className="h-4 w-4" />
                            <span className="text-xs">{a.label}</span>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Platform Health</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { label: 'License Health', value: metrics ? `${metrics.activeTenants}/${metrics.totalTenants} tenants active` : '—', ok: (metrics?.expiredLicenses || 0) === 0 },
                          { label: 'Open Tickets', value: `${metrics?.openTickets || 0} pending`, ok: (metrics?.openTickets || 0) < 10 },
                          { label: 'Support Coverage', value: `${metrics?.totalAgents || 0} agents`, ok: (metrics?.totalAgents || 0) > 0 },
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span>{item.value}</span>
                              {item.ok ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeSection === 'tenants' && <TenantsPanel token={token} />}
              {activeSection === 'users' && <AllUsersPanel token={token} tenants={tenants} />}
              {activeSection === 'chat' && <GlobalChatPanel token={token} tenants={tenants} />}
              {activeSection === 'tickets' && <TicketsPanel token={token} tenants={tenants} />}
              {activeSection === 'license-issues' && <LicenseIssuesPanel tenants={tenants} token={token} onRefresh={loadData} />}
              {activeSection === 'platform-users' && <PlatformUsersPanel token={token} />}
              {activeSection === 'assignments' && <AssignmentsPanel token={token} tenants={tenants} />}
              {activeSection === 'agents' && <AgentsPanel token={token} />}
              {activeSection === 'audit' && <AuditTrailPanel token={token} />}
              {activeSection === 'dev-tools' && <DevToolsPanel tenants={tenants} token={token} />}
              {activeSection === 'settings' && <SettingsPanel myProfile={myProfile} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

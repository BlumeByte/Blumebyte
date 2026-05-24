import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api, invalidateCache } from '../lib/api-client';
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
import { isCustomerCareRole, normalizeRole } from '../lib/role-utils';
import {
  LayoutDashboard, Building2, Users, Shield, Search, Loader2, RefreshCw,
  Eye, Trash2, LogOut, AlertCircle, Copy, CheckCircle, Settings,
  BarChart3, Briefcase, Ticket, Key, Activity, FileText, UserPlus,
  ChevronRight, ChevronLeft, Wrench, Bell, Lock, Unlock, PanelLeftClose,
  PanelLeftOpen, AlertTriangle, BookOpen, MessageSquare, Server, Zap,
  TrendingUp, Menu, X as XIcon
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ['developer', 'customer_care'];
const PLATFORM_ROLES = ['developer', 'customer_care'];

function canonicalPlatformRole(value: unknown): string {
  const normalized = normalizeRole(value);
  return normalized || '';
}

/** Returns true when an API error represents a route that simply doesn't exist yet
 *  (stale backend). These are handled by UI empty-states rather than error toasts. */
function isStaleBackendStatus(status: unknown): boolean {
  return status === 404 || status === 405 || status === 501;
}

function isStaleBackendMessage(message: unknown): boolean {
  const normalized = String(message || '').toLowerCase();
  return (
    normalized.includes('route not found') ||
    normalized.includes('method not allowed') ||
    normalized.includes('cannot get') ||
    normalized.includes('cannot post') ||
    normalized.includes('cannot put') ||
    normalized.includes('cannot patch') ||
    normalized.includes('cannot delete') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('network request failed') ||
    normalized.includes('networkerror when attempting to fetch resource') ||
    normalized.includes('load failed') ||
    normalized.includes('fetch failed')
  );
}

function isRouteNotFound(r: PromiseSettledResult<any>): boolean {
  return (
    r.status === 'rejected' && (
      isStaleBackendMessage(r.reason?.message) ||
      isStaleBackendStatus(r.reason?.status)
    )
  );
}

function isRouteNotFoundError(error: any): boolean {
  return isStaleBackendMessage(error?.message) || isStaleBackendStatus(error?.status);
}

/** Tries `path` first, then each fallback path in order, only for route-not-found style errors. */
async function apiWithRouteFallback(path: string, options: any = {}, fallbackPaths: string[] = []) {
  try {
    return await api(path, options);
  } catch (error: any) {
    if (!isRouteNotFoundError(error)) throw error;
    let lastError: any = error;
    for (const fallbackPath of fallbackPaths) {
      try {
        return await api(fallbackPath, options);
      } catch (fallbackError: any) {
        if (!isRouteNotFoundError(fallbackError)) throw fallbackError;
        lastError = fallbackError;
      }
    }
    throw lastError;
  }
}

function normalizeLegacyTenant(raw: any): Tenant {
  const purchasedLicenses = Number(raw?.purchasedLicenses ?? raw?.licenses ?? raw?.subscription?.licenses ?? 0) || 0;
  const activeUsers = Number(raw?.activeUsers ?? 0) || 0;
  const totalUsers = Number(raw?.totalUsers ?? 0) || 0;
  const status = raw?.licenseStatus || raw?.subscription?.status || raw?.status || 'unknown';
  return {
    id: String(raw?.id || raw?.companyId || raw?.company || ''),
    name: raw?.name || raw?.companyName || 'Unknown Tenant',
    industry: raw?.industry,
    licenseStatus: status,
    activeUsers,
    totalUsers: Math.max(totalUsers, activeUsers),
    purchasedLicenses,
    plan: raw?.plan || raw?.subscription?.plan,
    lastActivity: raw?.lastActivity,
    createdAt: raw?.createdAt || raw?.created_at,
  };
}

async function loadSupportTenantsWithFallback(token?: string | null) {
  invalidateCache('/developer/support/tenants', token);
  try {
    const data = await apiWithRouteFallback('/developer/support/tenants', { token }, ['/support/tenants']);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!isRouteNotFoundError(error)) throw error;
    const legacy = await api('/developer/tenants', { token });
    const tenants = Array.isArray(legacy) ? legacy.map(normalizeLegacyTenant) : [];
    return tenants.filter((t) => !!t.id);
  }
}

async function loadSupportTenantUsersWithFallback(tenantId: string, token?: string | null) {
  try {
    const data = await apiWithRouteFallback(`/developer/support/tenants/${tenantId}/users`, { token }, [`/support/tenants/${tenantId}/users`]);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!isRouteNotFoundError(error)) throw error;
    const data = await api(`/developer/tenants/${tenantId}/users`, { token });
    return Array.isArray(data) ? data : [];
  }
}

async function loadDeveloperUsersWithFallback(token?: string | null) {
  try {
    invalidateCache('/developer/users', token);
    const data = await api('/developer/users', { token });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (!isRouteNotFoundError(error)) throw error;
    try {
      invalidateCache('/support/users', token);
      const data = await api('/support/users', { token });
      return Array.isArray(data) ? data : [];
    } catch (fallbackError: any) {
      const wrapped: any = new Error(
        `Failed to load users: ${fallbackError?.message || 'Unknown error'}`,
      );
      wrapped.status = fallbackError?.status;
      throw wrapped;
    }
  }
}

async function loadPlatformUsersWithFallback(token?: string | null) {
  invalidateCache('/developer/platform-users', token);
  try {
    const data = await api('/developer/platform-users', { token });
    return Array.isArray(data)
      ? data.map((u: any) => ({ ...u, role: canonicalPlatformRole(u?.role) || 'customer_care' }))
      : [];
  } catch (error: any) {
    if (!isRouteNotFoundError(error)) throw error;
    const data = await api('/platform-users', { token });
    return Array.isArray(data)
      ? data.map((u: any) => ({ ...u, role: canonicalPlatformRole(u?.role) || 'customer_care' }))
      : [];
  }
}

async function loadAssignmentsWithFallback(token?: string | null) {
  invalidateCache('/developer/assignments', token);
  try {
    const data = await api('/developer/assignments', { token });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!isRouteNotFoundError(error)) throw error;
    const data = await api('/assignments', { token });
    return Array.isArray(data) ? data : [];
  }
}

async function loadSupportTicketsWithFallback(token?: string | null) {
  invalidateCache('/developer/support/tickets', token);
  try {
    const data = await apiWithRouteFallback('/developer/support/tickets', { token }, ['/support/tickets']);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!isRouteNotFoundError(error)) throw error;
    const data = await api('/developer/tickets', { token });
    return Array.isArray(data) ? data : [];
  }
}

async function loadSupportAgentsWithFallback(token?: string | null) {
  invalidateCache('/developer/support/agents', token);
  try {
    const data = await apiWithRouteFallback('/developer/support/agents', { token }, ['/support/agents']);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!isRouteNotFoundError(error)) throw error;
    const platformUsers = await loadPlatformUsersWithFallback(token);
    return platformUsers
      .filter((u: any) => canonicalPlatformRole(u?.role) === 'customer_care')
      .map((u: any) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        role: canonicalPlatformRole(u?.role) || 'customer_care',
        assignedTenants: u.assignedTenants || [],
        status: u.status || 'active',
        openTickets: u.openTickets || 0,
        resolvedTickets: u.resolvedTickets || 0,
      }));
  }
}

async function loadSupportAuditWithFallback(token?: string | null) {
  invalidateCache('/developer/support/audit', token);
  try {
    const data = await apiWithRouteFallback('/developer/support/audit', { token }, ['/support/audit']);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!isRouteNotFoundError(error)) throw error;
    const data = await api('/developer/audit-log', { token });
    return Array.isArray(data) ? data.map((entry: any) => ({
      id: entry.id,
      actorEmail: entry.actorEmail || entry.userEmail || entry.userId || 'unknown',
      actionType: entry.actionType || entry.action || 'activity',
      tenantId: entry.tenantId || entry.details?.tenantId || '',
      timestamp: entry.timestamp || entry.createdAt || new Date().toISOString(),
      description: entry.description || JSON.stringify(entry.details || {}),
    })) : [];
  }
}

function toNumber(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeMetricsPayload(raw: any, tenants: Tenant[]): Metrics {
  const planBreakdown: Record<string, number> = {};
  let purchased = 0;
  let used = 0;
  const recentTenants = [...tenants]
    .filter((t) => !!t.createdAt)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      name: t.name,
      status: t.licenseStatus || 'unknown',
      createdAt: t.createdAt || '',
      plan: t.plan || 'unknown',
    }));

  for (const tenant of tenants) {
    const plan = String(tenant.plan || 'unknown').toLowerCase();
    planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
    purchased += toNumber(tenant.purchasedLicenses, 0);
    used += toNumber(tenant.activeUsers, 0);
  }

  const totalTenants = toNumber(raw?.totalTenants, tenants.length);
  const activeTenants = toNumber(
    raw?.activeTenants,
    tenants.filter((t) => (t.licenseStatus || '').toLowerCase() === 'active').length,
  );
  const expiredTenants = toNumber(
    raw?.expiredTenants,
    tenants.filter((t) => (t.licenseStatus || '').toLowerCase() === 'expired').length,
  );
  const suspendedTenants = toNumber(
    raw?.suspendedTenants,
    tenants.filter((t) => (t.licenseStatus || '').toLowerCase() === 'suspended').length,
  );
  const trialTenants = toNumber(
    raw?.trialTenants,
    tenants.filter((t) => (t.licenseStatus || '').toLowerCase() === 'trial').length,
  );

  const normalized: Metrics = {
    totalTenants,
    activeTenants,
    expiredTenants,
    suspendedTenants,
    trialTenants,
    openTickets: toNumber(raw?.openTickets, 0),
    pendingTickets: toNumber(raw?.pendingTickets, 0),
    criticalTickets: toNumber(raw?.criticalTickets, 0),
    resolvedToday: toNumber(raw?.resolvedToday, 0),
    totalAgents: toNumber(raw?.totalAgents, raw?.totalCustomerCareAgents || 0),
    totalTickets: toNumber(raw?.totalTickets, raw?.openTickets || 0),
    totalUsers: toNumber(raw?.totalUsers, 0),
    activeUsers: toNumber(raw?.activeUsers, 0),
    newTenantsLast30Days: toNumber(raw?.newTenantsLast30Days, 0),
    newUsersLast30Days: toNumber(raw?.newUsersLast30Days, 0),
    planBreakdown: (raw?.planBreakdown && Object.keys(raw.planBreakdown).length > 0)
      ? raw.planBreakdown
      : planBreakdown,
    licenseUtilization: raw?.licenseUtilization && typeof raw.licenseUtilization === 'object'
      ? {
        purchased: toNumber(raw.licenseUtilization.purchased, purchased),
        used: toNumber(raw.licenseUtilization.used, used),
        available: toNumber(raw.licenseUtilization.available, Math.max(0, purchased - used)),
      }
      : {
        purchased,
        used,
        available: Math.max(0, purchased - used),
      },
    recentTenants: Array.isArray(raw?.recentTenants) && raw.recentTenants.length > 0
      ? raw.recentTenants.map((t: any) => ({
        id: String(t?.id || t?.tenantId || ''),
        name: t?.name || t?.companyName || 'Unknown Tenant',
        status: t?.status || 'unknown',
        createdAt: t?.createdAt || t?.created_at || '',
        plan: t?.plan || 'unknown',
      }))
      : recentTenants,
  };

  return normalized;
}

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tenants', label: 'Tenants', icon: Building2 },
  { id: 'users', label: 'All Users', icon: Users },
  { id: 'chat', label: 'Global Chat', icon: MessageSquare },
  { id: 'tickets', label: 'Support Tickets', icon: Ticket },
  { id: 'license-issues', label: 'License Issues', icon: Key },
  { id: 'platform-users', label: 'Platform Users', icon: UserPlus },
  { id: 'assignments', label: 'Assignments', icon: Activity },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'audit', label: 'Audit Trail', icon: BookOpen },
  { id: 'dev-tools', label: 'Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SECTION_ACCESS_RULES: Record<string, string[]> = {
  overview: ['developer', 'customer_care'],
  tenants: ['developer', 'customer_care'],
  users: ['developer', 'customer_care'],
  chat: ['developer', 'customer_care'],
  tickets: ['developer', 'customer_care'],
  'license-issues': ['developer', 'customer_care'],
  'platform-users': ['developer'],
  assignments: ['developer'],
  agents: ['developer'],
  audit: ['developer'],
  'dev-tools': ['developer'],
  settings: ['developer', 'customer_care'],
};

function isSectionAllowed(sectionId: string, role: string) {
  const allowedRoles = SECTION_ACCESS_RULES[sectionId] || ['developer'];
  return allowedRoles.includes(canonicalPlatformRole(role));
}

const TICKET_STATUSES = ['open', 'pending', 'resolved', 'escalated'];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const ISSUE_TYPES = ['general', 'billing', 'license', 'technical', 'data', 'account', 'integration', 'other'];

// ─── Session helpers ───────────────────────────────────────────────────────────
function setSupportSession() {
  sessionStorage.setItem('developer_support_session', '1');
}
function clearSupportSession() {
  sessionStorage.removeItem('developer_support_session');
}

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
  totalTenants: number; activeTenants: number; expiredTenants: number;
  suspendedTenants: number; trialTenants: number;
  openTickets: number; pendingTickets: number; criticalTickets: number;
  resolvedToday: number; totalAgents: number; totalTickets: number;
  totalUsers: number; activeUsers: number;
  newTenantsLast30Days: number; newUsersLast30Days: number;
  planBreakdown: Record<string, number>;
  licenseUtilization: { purchased: number; used: number; available: number };
  recentTenants: { id: string; name: string; status: string; createdAt: string; plan?: string }[];
}

interface AuditLog {
  id: string; actorEmail: string; actionType: string; tenantId: string;
  timestamp: string; description: string;
}

// ─── Root Component ────────────────────────────────────────────────────────────
export default function CustomerCareDashboard() {
  const navigate = useNavigate();
  const { user, sessionLoading, getToken, logout } = useAuth();
  const normalizedRole = normalizeRole(user?.role);
  const supportRole = canonicalPlatformRole(normalizedRole);
  // tri-state: null = verifying, true = authenticated, false = unauthenticated
  const [authState, setAuthState] = useState<boolean | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user || (normalizedRole !== 'developer' && !isCustomerCareRole(normalizedRole))) {
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
      setAuthState(true);
    }).catch(() => {
      clearSupportSession();
      setAuthState(false);
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

  return <SupportDashboard onLogout={handleLogout} role={supportRole} />;
}
// ─── Metrics Cards ────────────────────────────────────────────────────────────
function MetricsCards({ metrics }: { metrics: Metrics }) {
  const cards = [
    { label: 'Total Tenants', value: metrics.totalTenants, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Tenants', value: metrics.activeTenants, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Expired Licenses', value: metrics.expiredTenants, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
    { label: 'Suspended', value: metrics.suspendedTenants ?? 0, icon: Lock, color: 'text-red-600 bg-red-50' },
    { label: 'Trial Tenants', value: metrics.trialTenants ?? 0, icon: Zap, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Total Users', value: metrics.totalUsers ?? 0, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Active Users', value: metrics.activeUsers ?? 0, icon: CheckCircle, color: 'text-teal-600 bg-teal-50' },
    { label: 'Open Tickets', value: metrics.openTickets, icon: Ticket, color: 'text-red-600 bg-red-50' },
    { label: 'Pending Tickets', value: metrics.pendingTickets ?? 0, icon: Bell, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Critical Tickets', value: metrics.criticalTickets ?? 0, icon: AlertCircle, color: 'text-red-700 bg-red-100' },
    { label: 'Resolved Today', value: metrics.resolvedToday, icon: CheckCircle, color: 'text-teal-600 bg-teal-50' },
    { label: 'Total Tickets', value: metrics.totalTickets, icon: FileText, color: 'text-gray-600 bg-gray-50' },
    { label: 'Support Agents', value: metrics.totalAgents, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'New Tenants (30d)', value: metrics.newTenantsLast30Days ?? 0, icon: TrendingUp, color: 'text-blue-700 bg-blue-100' },
    { label: 'New Users (30d)', value: metrics.newUsersLast30Days ?? 0, icon: TrendingUp, color: 'text-green-700 bg-green-100' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
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
  const label = status === 'ultimateadmin' ? 'developer' : status;
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700', open: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700',
    escalated: 'bg-orange-100 text-orange-700', suspended: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700', unknown: 'bg-gray-100 text-gray-600',
    critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700', low: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[label] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

// ─── Tenants Panel ─────────────────────────────────────────────────────────────
function TenantsPanel() {
  const { getToken } = useAuth();
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

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const token = await getToken();
      const data = await loadSupportTenantsWithFallback(token);
      setTenants(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (!isRouteNotFoundError(e)) {
        toast.error('Failed to load tenants: ' + (e.message || 'Unknown error'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 seconds so new users/tenants appear without manual reload
  useEffect(() => {
    const interval = setInterval(() => {
      const isRefreshPaused = saving || actionLoading || createDialog || createUserDialog || licenseDialog || showUsers;
      if (isRefreshPaused || document.visibilityState !== 'visible') return;
      load({ silent: true });
    }, 30_000);
    return () => clearInterval(interval);
  }, [load, saving, actionLoading, createDialog, createUserDialog, licenseDialog, showUsers]);

  const loadUsers = async (tenant: Tenant) => {
    setSelected(tenant);
    try {
      const token = await getToken();
      const data = await loadSupportTenantUsersWithFallback(tenant.id, token);
      setTenantUsers(Array.isArray(data) ? data : []);
      setShowUsers(true);
    } catch (e: any) {
      if (!isRouteNotFoundError(e)) {
        toast.error('Failed to load users: ' + (e.message || ''));
      }
    }
  };

  const toggleSuspend = async (tenant: Tenant) => {
    const isSuspended = tenant.licenseStatus === 'suspended';
    setActionLoading(tenant.id);
    try {
      const token = await getToken();
      try {
        await apiWithRouteFallback(`/developer/support/tenants/${tenant.id}/suspend`, {
          method: 'POST', token, body: { restore: isSuspended },
        }, [`/support/tenants/${tenant.id}/suspend`]);
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        await api(`/developer/tenants/${tenant.id}/${isSuspended ? 'reinstate' : 'suspend'}`, {
          method: 'POST', token,
        });
      }
      toast.success(isSuspended ? 'Tenant restored' : 'Tenant suspended');
      load();
    } catch (e: any) { toast.error('Action failed: ' + (e.message || '')); }
    finally { setActionLoading(null); }
  };

  const updateLicense = async () => {
    if (!selected) return;
    setActionLoading('license');
    try {
      const token = await getToken();
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
      try {
        await apiWithRouteFallback(`/developer/support/tenants/${selected.id}/license`, { method: 'PUT', token, body }, [`/support/tenants/${selected.id}/license`]);
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        const legacyBody: any = {
          plan: body.plan,
          licenses: body.purchasedLicenses,
        };
        await api(`/developer/tenants/${selected.id}/license`, { method: 'PUT', token, body: legacyBody });
      }
      toast.success('License updated');
      setLicenseDialog(false);
      load();
    } catch (e: any) { toast.error('License update failed: ' + (e.message || '')); }
    finally { setActionLoading(null); }
  };

  const createTenant = async () => {
    if (!createForm.name.trim()) return toast.error('Company name required');
    setSaving(true);
    try {
      const token = await getToken();
      await apiWithRouteFallback('/developer/support/tenants', {
        method: 'POST', token, body: createForm,
      }, ['/support/tenants']);
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
      const token = await getToken();
      const result = await apiWithRouteFallback(`/developer/support/tenants/${selected.id}/users`, {
        method: 'POST', token, body: createUserForm,
      }, [`/support/tenants/${selected.id}/users`]);
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
function TicketsPanel({ tenants }: { tenants: Tenant[] }) {
  const { getToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState({ tenantId: '', tenantName: '', issueType: 'general', priority: 'medium', subject: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await loadSupportTicketsWithFallback(token);
      setTickets(Array.isArray(data) ? data : []);
    } catch (e: any) { toast.error('Failed to load tickets: ' + (e.message || '')); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const createTicket = async () => {
    if (!form.subject.trim()) return toast.error('Subject required');
    setSaving(true);
    try {
      const token = await getToken();
      await apiWithRouteFallback('/developer/support/tickets', { method: 'POST', token, body: form }, ['/support/tickets']);
      toast.success('Ticket created');
      setShowCreate(false);
      setForm({ tenantId: '', tenantName: '', issueType: 'general', priority: 'medium', subject: '', description: '' });
      load();
    } catch (e: any) { toast.error('Failed to create ticket: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const updateTicket = async (id: string, patch: any) => {
    try {
      const token = await getToken();
      await apiWithRouteFallback(`/developer/support/tickets/${id}`, { method: 'PUT', token, body: patch }, [`/support/tickets/${id}`]);
      toast.success('Ticket updated');
      load();
      setSelected(null);
    } catch (e: any) { toast.error('Update failed: ' + (e.message || '')); }
  };

  const addNote = async () => {
    if (!selected || !noteText.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      await apiWithRouteFallback(`/developer/support/tickets/${selected.id}`, { method: 'PUT', token, body: { note: noteText } }, [`/support/tickets/${selected.id}`]);
      toast.success('Note added');
      setNoteText('');
      load();
      setSelected(null);
    } catch (e: any) { toast.error('Failed to add note: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.tenantName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
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
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {TICKET_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        <Badge variant="secondary">{filtered.length} {filtered.length === 1 ? 'ticket' : 'tickets'}</Badge>
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
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={async () => {
                        const token = await getToken();
                        apiWithRouteFallback(`/developer/support/tickets/${t.id}`, { method: 'DELETE', token }, [`/support/tickets/${t.id}`])
                          .then(() => { toast.success('Deleted'); load(); })
                          .catch((error: any) => toast.error('Delete failed: ' + (error?.message || '')));
                      }}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Label className="shrink-0 text-xs">Status:</Label>
                  <Select defaultValue={selected.status} onValueChange={v => updateTicket(selected.id, { status: v })}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{TICKET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="shrink-0 text-xs">Priority:</Label>
                  <Select defaultValue={selected.priority} onValueChange={v => updateTicket(selected.id, { priority: v })}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{TICKET_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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
function LicenseIssuesPanel({ tenants, onRefresh }: { tenants: Tenant[]; onRefresh: () => void }) {
  const { getToken } = useAuth();
  const [fixing, setFixing] = useState<string | null>(null);

  const problematic = tenants.filter(t => t.licenseStatus !== 'active' && t.licenseStatus !== 'unknown');

  const quickFix = async (tenant: Tenant, durationDays = 30) => {
    setFixing(tenant.id);
    try {
      const token = await getToken();
      try {
        await apiWithRouteFallback(`/developer/support/tenants/${tenant.id}/license`, {
          method: 'PUT', token, body: {
            status: 'active',
            durationAmount: String(durationDays),
            durationUnit: 'days',
            purchasedLicenses: String(tenant.purchasedLicenses || 1),
            plan: tenant.plan || 'custom',
          },
        }, [`/support/tenants/${tenant.id}/license`]);
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        await api(`/developer/tenants/${tenant.id}/license`, {
          method: 'PUT',
          token,
          body: { licenses: tenant.purchasedLicenses || 1, plan: tenant.plan || 'custom' },
        });
      }
      toast.success(`License reactivated for ${tenant.name} (+${durationDays}d)`);
      onRefresh();
    } catch (e: any) { toast.error('Failed to fix license: ' + (e.message || '')); }
    finally { setFixing(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{problematic.length} tenants with license issues</p>
        {problematic.length > 0 && (
          <p className="text-xs text-gray-400">Use "Quick Fix" to reactivate for 30 days without payment</p>
        )}
      </div>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problematic.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-green-600 py-8">✓ All licenses are healthy</TableCell></TableRow>}
            {problematic.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium text-sm">{t.name}</TableCell>
                <TableCell><StatusBadge status={t.licenseStatus || 'unknown'} /></TableCell>
                <TableCell className="text-sm">{t.plan || '—'}</TableCell>
                <TableCell className="text-sm">{t.purchasedLicenses}</TableCell>
                <TableCell className="text-sm">{t.activeUsers}/{t.totalUsers}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => quickFix(t, 30)} disabled={fixing === t.id} title="Reactivate license for 30 days">
                      {fixing === t.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                      +30d
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-blue-700 border-blue-300 hover:bg-blue-50"
                      onClick={() => quickFix(t, 365)} disabled={fixing === t.id} title="Reactivate license for 1 year">
                      +1y
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Agents Panel ─────────────────────────────────────────────────────────────
function AgentsPanel() {
  const { getToken } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'customer_care' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await loadSupportAgentsWithFallback(token);
      setAgents(Array.isArray(data) ? data : []);
    } catch (e: any) { toast.error('Failed to load agents: ' + (e.message || '')); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const createAgent = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    setSaving(true);
    try {
      const token = await getToken();
      try {
        await apiWithRouteFallback('/developer/support/agents', { method: 'POST', token, body: form }, ['/support/agents']);
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        await api('/developer/platform-users', {
          method: 'POST',
          token,
          body: { name: form.name, email: form.email, role: form.role },
        });
      }
      toast.success('Agent created');
      setShowCreate(false);
      setForm({ name: '', email: '', role: 'customer_care' });
      load();
    } catch (e: any) { toast.error('Failed to create agent: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (agent: Agent) => {
    try {
      const token = await getToken();
      try {
        await apiWithRouteFallback(`/developer/support/agents/${agent.id}`, { method: 'PUT', token, body: { status: agent.status === 'active' ? 'inactive' : 'active' } }, [`/support/agents/${agent.id}`]);
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        await api(`/developer/platform-users/${agent.id}`, {
          method: 'PUT',
          token,
          body: { status: agent.status === 'active' ? 'inactive' : 'active' },
        });
      }
      toast.success('Agent updated');
      load();
    } catch (e: any) { toast.error('Update failed: ' + (e.message || '')); }
  };

  const deleteAgent = async (agent: Agent) => {
    if (!confirm(`Delete agent ${agent.email}?`)) return;
    try {
      const token = await getToken();
      try {
        await apiWithRouteFallback(`/developer/support/agents/${agent.id}`, { method: 'DELETE', token }, [`/support/agents/${agent.id}`]);
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        await api(`/developer/platform-users/${agent.id}`, { method: 'DELETE', token });
      }
      toast.success('Agent removed');
      load();
    } catch (e: any) { toast.error('Delete failed: ' + (e.message || '')); }
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
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(a)} title={a.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {a.status === 'active' ? <Lock className="h-3.5 w-3.5 text-orange-500" /> : <Unlock className="h-3.5 w-3.5 text-green-500" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteAgent(a)} title="Delete">
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
function PlatformUsersPanel() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'customer_care', password: '' });
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await loadPlatformUsersWithFallback(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) { toast.error('Failed to load platform users: ' + (e.message || '')); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const saveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    setSaving(true);
    try {
      const token = await getToken();
      if (editUser) {
        const body: any = { name: form.name, role: form.role };
        if (form.password) body.password = form.password;
        try {
          await api(`/developer/platform-users/${editUser.id}`, { method: 'PUT', token, body });
        } catch (error: any) {
          if (!isRouteNotFoundError(error)) throw error;
          await api(`/platform-users/${editUser.id}`, { method: 'PUT', token, body });
        }
        toast.success('User updated');
        setTempPassword(null);
      } else {
        const body: any = { name: form.name, email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        let result: any;
        try {
          result = await api('/developer/platform-users', { method: 'POST', token, body });
        } catch (error: any) {
          if (!isRouteNotFoundError(error)) throw error;
          result = await api('/platform-users', { method: 'POST', token, body });
        }
        if (result?.tempPassword) {
          setTempPassword(result.tempPassword);
          toast.success(`Platform user created — temp password shown below`);
        } else {
          toast.success('Platform user created');
        }
      }
      if (!tempPassword) {
        setShowCreate(false);
        setEditUser(null);
        setForm({ name: '', email: '', role: 'customer_care', password: '' });
      }
      load();
    } catch (e: any) { toast.error('Save failed: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const deleteUser = async (u: any) => {
    if (!confirm(`Delete platform user ${u.email}?`)) return;
    try {
      const token = await getToken();
      try {
        await api(`/developer/platform-users/${u.id}`, { method: 'DELETE', token });
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        await api(`/platform-users/${u.id}`, { method: 'DELETE', token });
      }
      toast.success('User removed');
      load();
    } catch (e: any) { toast.error('Delete failed: ' + (e.message || '')); }
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name || '', email: u.email || '', role: canonicalPlatformRole(u?.role) || 'customer_care', password: '' });
    setTempPassword(null);
    setShowCreate(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditUser(null); setForm({ name: '', email: '', role: 'customer_care', password: '' }); setTempPassword(null); setShowCreate(true); }}>
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

      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setTempPassword(null); } setShowCreate(open); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editUser ? 'Edit Platform User' : 'Add Platform User'}</DialogTitle></DialogHeader>
          {tempPassword ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="font-semibold text-green-800 mb-2">✓ Platform user created successfully</p>
                <p className="text-sm text-green-700 mb-3">Share these credentials securely with the new user:</p>
                <div className="bg-white border border-green-300 rounded p-3 space-y-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-mono text-sm font-medium">{form.email}</p>
                  <p className="text-xs text-gray-500 mt-2">Temporary Password</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm font-bold tracking-widest bg-yellow-50 px-2 py-1 rounded flex-1 select-all">{'•'.repeat(tempPassword.length)}</p>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success('Password copied'); }}>
                      Copy
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-orange-700 mt-2">⚠ Copy this password now — it will not be shown again.</p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowCreate(false); setTempPassword(null); setForm({ name: '', email: '', role: 'customer_care', password: '' }); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
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
                <div>
                  <Label>{editUser ? 'New Password (leave blank to keep current)' : 'Password (leave blank to auto-generate)'}</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editUser ? 'Leave blank to keep current' : 'Auto-generated if empty'} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={saveUser} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{editUser ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Assignments Panel ────────────────────────────────────────────────────────
function AssignmentsPanel({ tenants }: { tenants: Tenant[] }) {
  const { getToken } = useAuth();
  const [careAgents, setCareAgents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [agentsData, assignData] = await Promise.all([
        loadPlatformUsersWithFallback(token),
        loadAssignmentsWithFallback(token),
      ]);
      const agents = Array.isArray(agentsData) ? agentsData.filter((u: any) => {
        const r = canonicalPlatformRole(u?.role);
        return r === 'customer_care';
      }) : [];
      setCareAgents(agents);
      setAssignments(Array.isArray(assignData) ? assignData : []);
    } catch (e: any) { toast.error('Failed to load assignments: ' + (e.message || '')); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const addAssignment = async () => {
    if (!selectedAgent || selectedTenants.length === 0) return toast.error('Select agent and at least one tenant');
    setSaving(true);
    try {
      const token = await getToken();
      try {
        await api('/developer/assignments', { method: 'POST', token, body: { careAgentId: selectedAgent, tenantIds: selectedTenants } });
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        await api('/assignments', { method: 'POST', token, body: { careAgentId: selectedAgent, tenantIds: selectedTenants } });
      }
      toast.success('Assignment saved');
      setSelectedAgent('');
      setSelectedTenants([]);
      load();
    } catch (e: any) { toast.error('Assignment failed: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      const token = await getToken();
      try {
        await api(`/developer/assignments/${assignmentId}`, { method: 'DELETE', token });
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        await api(`/assignments/${assignmentId}`, { method: 'DELETE', token });
      }
      toast.success('Assignment removed');
      load();
    } catch (e: any) { toast.error('Remove failed: ' + (e.message || '')); }
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
function AllUsersPanel({ tenants }: { tenants: Tenant[] }) {
  const { getToken, user: authUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [resetTarget, setResetTarget] = useState<{ email: string } | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const normalizedSupportRole = canonicalPlatformRole(authUser?.role);
  const isDeveloperAdmin = normalizedSupportRole === 'developer';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await loadDeveloperUsersWithFallback(token);
      setUsers(Array.isArray(data) ? data.map((u: any) => ({ ...u, role: canonicalPlatformRole(u?.role) })) : []);
    } catch (e: any) {
      if (!isRouteNotFoundError(e)) {
        toast.error('Failed to load users: ' + (e.message || ''));
      }
    }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const generateReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setResetLink(null);
    try {
      const token = await getToken();
      const res = await apiWithRouteFallback('/developer/support/generate-reset-link', {
        method: 'POST', token, body: { email: resetTarget.email },
      }, ['/support/generate-reset-link']);
      setResetLink(res.resetLink || '(link generated — check Supabase logs)');
      toast.success('Reset link generated');
    } catch (e: any) { toast.error('Failed to generate reset link: ' + (e.message || '')); }
    finally { setResetting(false); }
  };

  const filtered = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || canonicalPlatformRole(u.role) === roleFilter;
    return matchSearch && matchRole;
  });

  const allRoles = [...new Set(users.map((u: any) => canonicalPlatformRole(u.role)).filter(Boolean))];

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
                {isDeveloperAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={isDeveloperAdmin ? 6 : 5} className="text-center text-gray-400 py-8">No users found</TableCell></TableRow>}
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-sm">{u.name || '—'}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell><StatusBadge status={u.role} /></TableCell>
                  <TableCell className="text-sm">{u.companyName || tenants.find(t => t.id === u.companyId)?.name || u.companyId || '—'}</TableCell>
                  <TableCell><StatusBadge status={u.status || 'active'} /></TableCell>
                  {isDeveloperAdmin && (
                    <TableCell>
                      <Button size="sm" variant="ghost" title="Generate Password Reset Link"
                        onClick={() => { setResetTarget({ email: u.email }); setResetLink(null); }}>
                        <Key className="h-3.5 w-3.5 text-blue-500" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={open => { if (!open) { setResetTarget(null); setResetLink(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Password Reset Link</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Send a password reset link for <strong>{resetTarget?.email}</strong>.</p>
            {resetLink && (
              <div className="space-y-1">
                <Label>Reset Link</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={resetLink} className="font-mono text-xs" />
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(resetLink); toast.success('Copied'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Send this link to the user. It expires after 24 hours.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setResetLink(null); }}>Close</Button>
            <Button onClick={generateReset} disabled={resetting}>
              {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Global Chat Panel ────────────────────────────────────────────────────────
function GlobalChatPanel({ tenants }: { tenants: Tenant[] }) {
  const { getToken } = useAuth();
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

  const [chatUnavailable, setChatUnavailable] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      invalidateCache('/developer/chat/threads', token);
      const [threadData, userData] = await Promise.allSettled([
        apiWithRouteFallback('/developer/chat/threads', { token }, ['/support/chat/threads']),
        loadDeveloperUsersWithFallback(token),
      ]);
      // Check if routes are unavailable (old deployed function) vs real errors
      if (isRouteNotFound(threadData) || isRouteNotFound(userData)) {
        setChatUnavailable(true);
        return;
      }
      setChatUnavailable(false);
      if (threadData.status === 'fulfilled') setThreads(Array.isArray(threadData.value) ? threadData.value : []);
      if (userData.status === 'fulfilled') setAllUsers(Array.isArray(userData.value) ? userData.value : []);
      if (threadData.status === 'rejected') toast.error('Failed to load chat: ' + (threadData.reason?.message || ''));
      if (userData.status === 'rejected') toast.error('Failed to load users: ' + (userData.reason?.message || ''));
    } catch (e: any) { toast.error('Failed to load chat: ' + (e.message || '')); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => {
    const interval = setInterval(loadThreads, 30_000);
    return () => clearInterval(interval);
  }, [loadThreads]);
  useEffect(() => {
    if (!activeThread) return;
    const interval = setInterval(async () => {
      try {
        const token = await getToken();
        const data = await apiWithRouteFallback(
          `/developer/chat/threads/${activeThread.id}`,
          { token },
          [`/support/chat/threads/${activeThread.id}`],
        );
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch {
        // silent background refresh failure
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [activeThread, getToken]);

  const loadThread = async (thread: any) => {
    setActiveThread(thread);
    setMsgLoading(true);
    try {
      const token = await getToken();
      const data = await apiWithRouteFallback(`/developer/chat/threads/${thread.id}`, { token }, [`/support/chat/threads/${thread.id}`]);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (e: any) {
      if (!isRouteNotFoundError(e)) {
        toast.error('Failed to load messages: ' + (e.message || ''));
      }
    }
    finally { setMsgLoading(false); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    if (!activeThread && !recipient) return toast.error('Select a recipient');
    setSending(true);
    try {
      const token = await getToken();
      const selectedUser = allUsers.find(u => u.id === recipient || u.email === recipient);
      const body: any = {
        message: newMsg.trim(),
        threadId: activeThread?.id,
        recipientId: activeThread?.recipientId || selectedUser?.id || '',
        recipientEmail: activeThread?.recipientEmail || selectedUser?.email || recipient,
        recipientName: activeThread?.recipientName || selectedUser?.name || '',
        tenantId: activeThread?.tenantId || selectedUser?.companyId || '',
      };
      const result = await apiWithRouteFallback('/developer/chat/send', { method: 'POST', token, body }, ['/support/chat/send']);
      setNewMsg('');
      if (!activeThread) {
        // New thread created — load it
        await loadThreads();
        setShowNewChat(false);
        setRecipient('');
        // Find and open the new thread
        const freshToken = await getToken();
        const freshThreads = await apiWithRouteFallback('/developer/chat/threads', { token: freshToken }, ['/support/chat/threads']);
        const newThread = freshThreads.find((t: any) => t.id === result.threadId);
        if (newThread) loadThread(newThread);
      } else {
        // Refresh messages
        const refreshToken = await getToken();
        const data = await apiWithRouteFallback(`/developer/chat/threads/${activeThread.id}`, { token: refreshToken }, [`/support/chat/threads/${activeThread.id}`]);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (e: any) { toast.error(e.message || 'Failed to send message'); }
    finally { setSending(false); }
  };

  const filteredThreads = threads.filter(t =>
    (t.recipientName || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.recipientEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  if (chatUnavailable) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <MessageSquare className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500 font-medium">Global Chat not available</p>
        <p className="text-sm text-gray-400 max-w-sm">
          This feature requires the latest backend to be deployed. Once the Supabase function is updated, chat threads will appear here.
        </p>
      </div>
    );
  }

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
              {messages.map(m => {
                const isDeveloperMessage = canonicalPlatformRole(m.senderRole) === 'developer';
                return (
                  <div key={m.id} className={`flex ${isDeveloperMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg p-2 text-sm ${isDeveloperMessage ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      <p>{m.message}</p>
                      <p className={`text-xs mt-0.5 ${isDeveloperMessage ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(m.sentAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                );
              })}
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
function AuditTrailPanel() {
  const { getToken } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await loadSupportAuditWithFallback(token);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e: any) { toast.error('Failed to load audit logs: ' + (e.message || '')); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const allActionTypes = [...new Set(logs.map(l => l.actionType).filter(Boolean))].sort();

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      (l.actorEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.tenantId || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.actionType === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input className="pl-8" placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {allActionTypes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        <Badge variant="secondary">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</Badge>
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
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">No audit logs found</TableCell></TableRow>}
              {filtered.map(log => (
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
function DevToolsPanel({ tenants }: { tenants: Tenant[] }) {
  const { getToken } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState('');
  const [running, setRunning] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [generatingReset, setGeneratingReset] = useState(false);

  const runRepair = async (action: string) => {
    if (!selectedTenant) return toast.error('Select a tenant first');
    setRunning(action);
    try {
      const token = await getToken();
      const result = await apiWithRouteFallback(`/developer/support/repair/${selectedTenant}`, {
        method: 'POST', token, body: { action },
      }, [`/support/repair/${selectedTenant}`]);
      toast.success(`✓ ${action} executed for ${result.tenantId}`);
    } catch (e: any) { toast.error('Repair action failed: ' + (e.message || '')); }
    finally { setRunning(null); }
  };

  const generateResetLink = async () => {
    if (!resetEmail.trim()) return toast.error('Enter an email address');
    setGeneratingReset(true);
    setResetLink(null);
    try {
      const token = await getToken();
      const res = await apiWithRouteFallback('/developer/support/generate-reset-link', {
        method: 'POST', token, body: { email: resetEmail.trim() },
      }, ['/support/generate-reset-link']);
      setResetLink(res.resetLink || '(link generated — check Supabase logs)');
      toast.success('Reset link generated');
    } catch (e: any) { toast.error('Failed: ' + (e.message || '')); }
    finally { setGeneratingReset(false); }
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
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex items-center gap-2 pt-4">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-700">These actions affect tenant data. Use with caution. All actions are logged.</p>
        </CardContent>
      </Card>

      {/* Password Reset Link Generator */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4" />Generate Password Reset Link</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">Generate a password reset link for any user by email. Link expires after 24 hours.</p>
          <div className="flex gap-2">
            <Input
              placeholder="user@example.com"
              type="email"
              value={resetEmail}
              onChange={e => { setResetEmail(e.target.value); setResetLink(null); }}
              className="flex-1"
            />
            <Button onClick={generateResetLink} disabled={generatingReset || !resetEmail.trim()}>
              {generatingReset ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate
            </Button>
          </div>
          {resetLink && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Reset Link (copy and send to user)</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={resetLink} className="font-mono text-xs flex-1" />
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(resetLink); toast.success('Copied to clipboard'); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenant Repair Tools */}
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
  const { user } = useAuth();
  // Prefer API-fetched profile; fall back to the auth-context user (always available after login)
  const email = myProfile?.email || user?.email || '—';
  const name = myProfile?.name || user?.name || user?.email || '—';
  const role = myProfile?.role || user?.role || 'unknown';
  return (
    <div className="space-y-4 max-w-md">
      <Card>
        <CardHeader><CardTitle className="text-base">My Profile</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="font-medium">{email}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-medium">{name}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Role</span><StatusBadge status={role} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Access Setup</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            Platform role assignment is managed by authorized platform administrators.
            If you need Developer or Customer Care access, contact Blumebyte support.
          </p>
          <p className="text-xs text-gray-500">Developer → /developer dashboard. Support → /support dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
/** Returns the appropriate fallback text for cards that depend on metrics. */
function metricsPlaceholder(metricsLoaded: boolean, errorOccurred: boolean, emptyText: string) {
  if (metricsLoaded) return emptyText;
  if (errorOccurred) return 'Failed to load';
  return 'Loading…';
}

function getSupabaseStatusText(
  supabaseConnected: boolean | null,
  backgroundRefreshing: boolean,
) {
  if (supabaseConnected === null) return 'Checking Supabase…';
  if (supabaseConnected) return backgroundRefreshing ? 'Supabase syncing…' : 'Supabase connected';
  return 'Supabase reconnecting';
}

function SupportDashboard({ onLogout, role }: { onLogout: () => void; role: string }) {
  const { getToken } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoadError, setMetricsLoadError] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [myProfile, setMyProfile] = useState<{ email: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [lastRealtimeSyncAt, setLastRealtimeSyncAt] = useState<Date | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const normalizeAndAliasSupportRole = (value: string) => canonicalPlatformRole(value);
  const [effectiveRole, setEffectiveRole] = useState(() => normalizeAndAliasSupportRole(role));
  const visibleSidebarItems = SIDEBAR_ITEMS.filter(item => isSectionAllowed(item.id, effectiveRole));
  const quickActions = [
    { label: 'View Tenants', icon: Building2, section: 'tenants' },
    { label: 'All Users', icon: Users, section: 'users' },
    { label: 'Global Chat', icon: MessageSquare, section: 'chat' },
    { label: 'New Ticket', icon: Ticket, section: 'tickets' },
    { label: 'License Issues', icon: Key, section: 'license-issues' },
    { label: 'Platform Users', icon: Users, section: 'platform-users' },
  ].filter(item => isSectionAllowed(item.section, effectiveRole));

  useEffect(() => {
    setEffectiveRole(normalizeAndAliasSupportRole(role));
  }, [role]);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (silent) {
      setBackgroundRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const token = await getToken();
      // Invalidate caches so auto-refresh always fetches fresh data from the server
      invalidateCache('/developer/support/metrics', token);
      invalidateCache('/developer/support/verify', token);
      const [metricsResult, tenantsResult, profileResult] = await Promise.allSettled([
        apiWithRouteFallback('/developer/support/metrics', { token }, ['/support/metrics', '/developer/overview']),
        loadSupportTenantsWithFallback(token),
        apiWithRouteFallback('/developer/support/verify', { token }, ['/support/verify']),
      ]);
      const tenantList = tenantsResult.status === 'fulfilled' && Array.isArray(tenantsResult.value)
        ? tenantsResult.value
        : [];
      if (tenantsResult.status === 'fulfilled') setTenants(tenantList);
      if (metricsResult.status === 'fulfilled') {
        setMetrics(normalizeMetricsPayload(metricsResult.value, tenantList));
        setMetricsLoadError(false);
      } else if (!isRouteNotFound(metricsResult)) {
        setMetricsLoadError(true);
        if (!silent) toast.error('Failed to load platform metrics');
      }
      if (profileResult.status === 'fulfilled') {
        setMyProfile(profileResult.value);
        const verifiedRole = normalizeAndAliasSupportRole(profileResult.value?.role || '');
        if (verifiedRole) setEffectiveRole(verifiedRole);
      }

      // Detect stale backend: both metrics and tenants fail with route-not-found
      const bothMissing = isRouteNotFound(metricsResult) && isRouteNotFound(tenantsResult);
      setBackendUnavailable(bothMissing);
      const hasLiveData =
        metricsResult.status === 'fulfilled' ||
        tenantsResult.status === 'fulfilled' ||
        profileResult.status === 'fulfilled';
      setSupabaseConnected(hasLiveData && !bothMissing);
      if (hasLiveData && !bothMissing) setLastRealtimeSyncAt(new Date());

      // Only show error toast if failure is NOT a simple route-not-found (that is handled by the empty-state UI)
      if (!silent && tenantsResult.status === 'rejected' && !isRouteNotFound(tenantsResult)) {
        toast.error('Failed to load tenant data');
      }
    } finally {
      if (silent) {
        setBackgroundRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [getToken]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!isSectionAllowed(activeSection, effectiveRole)) {
      setActiveSection(visibleSidebarItems[0]?.id || 'overview');
    }
  }, [activeSection, effectiveRole, visibleSidebarItems]);

  // Auto-refresh metrics and tenant list every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      loadData({ silent: true });
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const sectionTitle = visibleSidebarItems.find(s => s.id === activeSection)?.label || 'Overview';
  const supabaseStatusClass = supabaseConnected
    ? 'bg-green-100 text-green-700'
    : supabaseConnected === null
      ? 'bg-blue-100 text-blue-700'
      : 'bg-amber-100 text-amber-700';
  const supabaseStatusText = getSupabaseStatusText(supabaseConnected, backgroundRefreshing);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarCollapsed ? 'w-16' : 'w-56'}
        transition-all duration-200 bg-gray-950 text-gray-200 flex flex-col shrink-0
        fixed md:relative h-screen z-50 md:z-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-gray-900" />
          </div>
          {!sidebarCollapsed && <span className="font-semibold text-sm text-white leading-tight">Developer</span>}
          {/* Close button on mobile */}
          {!sidebarCollapsed && (
            <button
              className="ml-auto md:hidden text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {visibleSidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
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
            className="hidden md:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm"
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
      <main className="flex-1 overflow-auto min-w-0">
        <header className="bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger on mobile */}
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-semibold text-gray-900">{sectionTitle}</h1>
              {myProfile && <p className="text-xs text-gray-500 hidden sm:block">{myProfile.email} · <StatusBadge status={myProfile.role} /></p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={supabaseStatusClass}>{supabaseStatusText}</Badge>
            {lastRealtimeSyncAt && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Live sync {lastRealtimeSyncAt.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => loadData()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <>
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  {/* Backend-not-deployed notice */}
                  {backendUnavailable && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-800">Backend not yet deployed</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                          The Supabase Edge Function hasn't been updated yet — tenant, metrics, and chat routes return 404. Deploy the function to see live data here.
                        </p>
                        <code className="mt-2 block text-xs bg-amber-100 text-amber-900 rounded px-2 py-1 font-mono">
                          supabase functions deploy make-server-a35148f0
                        </code>
                      </div>
                    </div>
                  )}
                  {/* Metrics load error notice */}
                  {metricsLoadError && !metrics && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-800 text-sm">Failed to load platform metrics</p>
                        <p className="text-xs text-red-700 mt-0.5">Dashboard data could not be retrieved. Check your connection or server status.</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={loadData} className="shrink-0" aria-label="Retry loading metrics">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />Retry
                      </Button>
                    </div>
                  )}
                  {metrics && <MetricsCards metrics={metrics} />}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Quick Actions */}
                    <Card>
                      <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-3 gap-2">
                        {quickActions.map(a => (
                          <Button key={a.label} variant="outline" className="h-16 flex-col gap-1" onClick={() => setActiveSection(a.section)}>
                            <a.icon className="h-4 w-4" />
                            <span className="text-xs">{a.label}</span>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Platform Health */}
                    <Card>
                      <CardHeader><CardTitle className="text-base">Platform Health</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { label: 'License Health', value: metrics ? `${metrics.activeTenants}/${metrics.totalTenants} active` : '—', ok: metrics ? (metrics.expiredTenants === 0 && metrics.suspendedTenants === 0) : null },
                          { label: 'Open Tickets', value: metrics ? `${metrics.openTickets} open · ${metrics.pendingTickets} pending` : '—', ok: metrics ? metrics.openTickets < 10 : null },
                          { label: 'Critical Issues', value: metrics ? `${metrics.criticalTickets} critical tickets` : '—', ok: metrics ? metrics.criticalTickets === 0 : null },
                          { label: 'Support Coverage', value: metrics ? `${metrics.totalAgents} agents` : '—', ok: metrics ? metrics.totalAgents > 0 : null },
                          { label: 'Suspended Tenants', value: metrics ? `${metrics.suspendedTenants} suspended` : '—', ok: metrics ? metrics.suspendedTenants === 0 : null },
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">{item.value}</span>
                              {item.ok === null
                                ? <span className="h-3.5 w-3.5 rounded-full bg-gray-200 inline-block" />
                                : item.ok
                                  ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  : <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                              }
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* License Utilisation */}
                    <Card>
                      <CardHeader><CardTitle className="text-base">License Utilisation</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        {metrics?.licenseUtilization ? (() => {
                          const { purchased, used, available } = metrics.licenseUtilization;
                          const pct = purchased > 0 ? Math.round((used / purchased) * 100) : 0;
                          return (
                            <>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>{used} used / {purchased} purchased</span>
                                  <span className={pct >= 90 ? 'text-red-600 font-medium' : pct >= 70 ? 'text-orange-600' : 'text-green-600'}>{pct}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-blue-50 rounded-lg p-2">
                                  <p className="text-lg font-bold text-blue-700">{purchased}</p>
                                  <p className="text-xs text-blue-600">Purchased</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-2">
                                  <p className="text-lg font-bold text-green-700">{used}</p>
                                  <p className="text-xs text-green-600">In Use</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <p className="text-lg font-bold text-gray-700">{available}</p>
                                  <p className="text-xs text-gray-600">Free</p>
                                </div>
                              </div>
                            </>
                          );
                        })() : <p className="text-sm text-gray-400 text-center py-4">{metricsPlaceholder(!!metrics, metricsLoadError, 'No data available')}</p>}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Subscription Plan Breakdown */}
                    <Card>
                      <CardHeader><CardTitle className="text-base">Subscription Plans</CardTitle></CardHeader>
                      <CardContent>
                        {metrics?.planBreakdown && Object.keys(metrics.planBreakdown).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(metrics.planBreakdown)
                              .sort(([, a], [, b]) => b - a)
                              .map(([plan, count]) => {
                                const total = Object.values(metrics.planBreakdown).reduce((s, v) => s + v, 0);
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                const PLAN_COLORS: Record<string, string> = {
                                  enterprise: 'bg-purple-500',
                                  pro: 'bg-blue-500',
                                  basic: 'bg-green-500',
                                  trial: 'bg-yellow-500',
                                };
                                const color = PLAN_COLORS[plan] ?? 'bg-gray-400';
                                return (
                                  <div key={plan} className="space-y-0.5">
                                    <div className="flex justify-between text-sm">
                                      <span className="capitalize font-medium">{plan}</span>
                                      <span className="text-gray-500">{count} tenant{count !== 1 ? 's' : ''} · {pct}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">{metricsPlaceholder(!!metrics, metricsLoadError, 'No subscription data yet')}</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recent Tenants */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Recently Added Tenants</CardTitle>
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveSection('tenants')}>
                          View All <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {metrics?.recentTenants && metrics.recentTenants.length > 0 ? (
                          <div className="space-y-2">
                            {metrics.recentTenants.slice(0, 6).map((t, i) => (
                              <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                                <div>
                                  <p className="font-medium text-sm">{t.name}</p>
                                  <p className="text-xs text-gray-400">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {t.plan && t.plan !== 'unknown' && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t.plan}</span>}
                                  <StatusBadge status={t.status || 'unknown'} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">{metricsPlaceholder(!!metrics, metricsLoadError, 'No tenants yet')}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Growth Summary */}
                  {metrics && (metrics.newTenantsLast30Days > 0 || metrics.newUsersLast30Days > 0) && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="flex items-center gap-4 pt-4 flex-wrap">
                        <TrendingUp className="h-5 w-5 text-blue-600 shrink-0" />
                        <p className="text-sm text-blue-800 font-medium">
                          Last 30 days: <strong>{metrics.newTenantsLast30Days} new tenant{metrics.newTenantsLast30Days !== 1 ? 's' : ''}</strong> and <strong>{metrics.newUsersLast30Days} new user{metrics.newUsersLast30Days !== 1 ? 's' : ''}</strong> joined the platform.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeSection === 'tenants' && <TenantsPanel />}
              {activeSection === 'users' && <AllUsersPanel tenants={tenants} />}
              {activeSection === 'chat' && <GlobalChatPanel tenants={tenants} />}
              {activeSection === 'tickets' && <TicketsPanel tenants={tenants} />}
              {activeSection === 'license-issues' && <LicenseIssuesPanel tenants={tenants} onRefresh={loadData} />}
              {activeSection === 'platform-users' && isSectionAllowed('platform-users', effectiveRole) && <PlatformUsersPanel />}
              {activeSection === 'assignments' && isSectionAllowed('assignments', effectiveRole) && <AssignmentsPanel tenants={tenants} />}
              {activeSection === 'agents' && isSectionAllowed('agents', effectiveRole) && <AgentsPanel />}
              {activeSection === 'audit' && isSectionAllowed('audit', effectiveRole) && <AuditTrailPanel />}
              {activeSection === 'dev-tools' && isSectionAllowed('dev-tools', effectiveRole) && <DevToolsPanel tenants={tenants} />}
              {activeSection === 'settings' && <SettingsPanel myProfile={myProfile} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

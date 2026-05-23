import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
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
  Building2, Users, KeyRound, Shield, Search, Loader2, RefreshCw,
  LogOut, Copy, CheckCircle, Briefcase,
  Ticket, MessageSquare, Send
} from 'lucide-react';
import { api } from '../lib/api-client';
import { isCustomerCareRole } from '../lib/role-utils';
import { useAuth } from '../lib/auth-context';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tenant {
  id: string;
  name: string;
  email?: string;
  industry?: string;
  status?: string;
  usedLicenses?: number;
  purchasedLicenses?: number;
  createdAt?: string;
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  companyId?: string;
}

function isRouteNotFoundError(error: any): boolean {
  const status = Number(error?.status || 0);
  const message = String(error?.message || '').toLowerCase();
  return (
    status === 404 ||
    status === 405 ||
    status === 501 ||
    message.includes('route not found') ||
    message.includes('method not allowed') ||
    message.includes('cannot get') ||
    message.includes('cannot post') ||
    message.includes('cannot put') ||
    message.includes('cannot patch') ||
    message.includes('cannot delete')
  );
}

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

// ─── Tenant Row ───────────────────────────────────────────────────────────────
function TenantRow({
  tenant,
  onViewUsers,
  onResetPassword,
}: {
  tenant: Tenant;
  onViewUsers: () => void;
  onResetPassword: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{tenant.name}</TableCell>
      <TableCell className="text-gray-500 text-sm">{tenant.email || '—'}</TableCell>
      <TableCell className="text-gray-500 text-sm">{tenant.industry || '—'}</TableCell>
      <TableCell>
        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
          {tenant.status || 'active'}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">{tenant.usedLicenses ?? '—'} / {tenant.purchasedLicenses ?? '—'}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onViewUsers}>
            <Users className="h-3.5 w-3.5 mr-1" /> Users
          </Button>
          <Button size="sm" variant="outline" onClick={onResetPassword}>
            <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset PW
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function CareDashboard() {
  const navigate = useNavigate();
  const { user, sessionLoading, getToken, logout } = useAuth();
  // Tri-state: null = checking, false = not authenticated, true = authenticated
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [careProfile, setCareProfile] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Tenant | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLinkResult, setResetLinkResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tenants');

  // Global hiring applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketComments, setTicketComments] = useState<any[]>([]);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');

  // Care agents are NOT developers — developers have their own dashboard at /developer.
  // The delete and license-edit actions are developer-only and not shown here.

  const getCareToken = useCallback(async () => {
    return await getToken();
  }, [getToken]);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setAuthenticated(false);
      return;
    }
    const token = await getCareToken();
    if (!token) {
      setAuthenticated(false);
      return;
    }
    try {
      const profileResponse = await apiWithRouteFallback('/care/profile', { token }, ['/developer/support/verify', '/support/verify']);
      // When /care/profile is unavailable on older deployments, /support/verify still
      // provides the role/email needed to route this dashboard correctly.
      const p = profileResponse?.allowed === true && !profileResponse?.id
        ? {
          id: user.id,
          email: profileResponse?.email || user.email,
          name: profileResponse?.name || user.name || user.email,
          role: profileResponse?.role || user.role,
        }
        : profileResponse;
      const role = String(p?.role || '').toLowerCase().replace('-', '_');
      setCareProfile(p);
      const allowed = isCustomerCareRole(role) || role === 'developer' || role === 'ultimateadmin';
      setAuthenticated(allowed);
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        setAuthenticated(false);
        return;
      }
      setCareProfile({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      const role = String(user.role || '').toLowerCase().replace('-', '_');
      setAuthenticated(isCustomerCareRole(role) || role === 'developer' || role === 'ultimateadmin');
    }
  }, [user]);

  const loadTenants = useCallback(async () => {
    const token = await getCareToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiWithRouteFallback('/care/tenants', { token }, ['/developer/support/tenants', '/support/tenants']);
      setTenants(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    const token = await getCareToken();
    if (!token) return;
    setAppsLoading(true);
    try {
      const data = await api('/care/global-applications', { token });
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    const token = await getCareToken();
    if (!token) return;
    setTicketsLoading(true);
    try {
      const data = await apiWithRouteFallback('/care/tickets', { token }, ['/developer/support/tickets', '/support/tickets']);
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const handleViewTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketDetailOpen(true);
    setNewComment('');
    const token = await getCareToken();
    if (!token) return;
    try {
      const data = await apiWithRouteFallback(`/care/tickets/${ticket.id}`, { token }, [`/developer/tickets/${ticket.id}`]);
      setTicketComments(Array.isArray(data?.comments) ? data.comments : []);
    } catch {
      setTicketComments([]);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    setSendingComment(true);
    try {
      const token = await getCareToken();
      await apiWithRouteFallback(`/care/tickets/${selectedTicket.id}/comment`, {
        method: 'POST',
        token,
        body: { comment: newComment.trim() },
      }, [`/developer/tickets/${selectedTicket.id}/comment`]);
      const data = await apiWithRouteFallback(`/care/tickets/${selectedTicket.id}`, { token }, [`/developer/tickets/${selectedTicket.id}`]);
      setTicketComments(Array.isArray(data?.comments) ? data.comments : []);
      setNewComment('');
      toast.success('Message sent');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send message');
    } finally {
      setSendingComment(false);
    }
  };

  const handleEscalateTicket = async (ticketId: string) => {
    const token = await getCareToken();
    if (!token) return;
    try {
      try {
        await api(`/care/tickets/${ticketId}/escalate`, { method: 'POST', token, body: {} });
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        // Legacy support endpoints do not expose a dedicated "escalate" route, so
        // use ticket update semantics to set escalated status.
        await apiWithRouteFallback(
          `/developer/support/tickets/${ticketId}`,
          { method: 'PUT', token, body: { status: 'escalated', escalated: true } },
          [`/support/tickets/${ticketId}`],
        );
      }
      toast.success('Ticket escalated');
      loadTickets();
    } catch (e: any) {
      toast.error(e.message || 'Failed to escalate');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    const token = await getCareToken();
    if (!token) return;
    try {
      try {
        await api(`/care/tickets/${ticketId}/resolve`, { method: 'POST', token, body: {} });
      } catch (error: any) {
        if (!isRouteNotFoundError(error)) throw error;
        try {
          await api(`/developer/tickets/${ticketId}/resolve`, { method: 'POST', token, body: {} });
        } catch (legacyError: any) {
          if (!isRouteNotFoundError(legacyError)) throw legacyError;
          // Legacy support endpoints only expose ticket update for this flow.
          await apiWithRouteFallback(
            `/developer/support/tickets/${ticketId}`,
            { method: 'PUT', token, body: { status: 'resolved', chatClosed: true } },
            [`/support/tickets/${ticketId}`],
          );
        }
      }
      toast.success('Ticket resolved and chat closed');
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status: 'resolved', chatClosed: true } : prev);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to resolve ticket');
    }
  };

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      setAuthenticated(false);
      return;
    }
    loadProfile();
  }, [sessionLoading, user, loadProfile]);

  useEffect(() => {
    if (authenticated === true) {
      loadTenants();
    }
  }, [authenticated, loadTenants]);

  useEffect(() => {
    if (activeTab === 'applications') loadApplications();
  }, [activeTab, loadApplications]);

  useEffect(() => {
    if (activeTab === 'tickets') loadTickets();
  }, [activeTab, loadTickets]);

  const handleViewUsers = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setUsersDialogOpen(true);
    setUsersLoading(true);
    try {
      const token = await getCareToken();
      const data = await apiWithRouteFallback(
        `/care/tenants/${tenant.id}/users`,
        { token },
        [`/developer/support/tenants/${tenant.id}/users`, `/support/tenants/${tenant.id}/users`],
      );
      setTenantUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleResetPassword = (tenant: Tenant) => {
    setResetTarget(tenant);
    setResetEmail('');
    setResetLinkResult(null);
    setResetDialogOpen(true);
  };

  const doPasswordReset = async () => {
    if (!resetEmail || !resetTarget) return;
    try {
      const token = await getCareToken();
      const result = await apiWithRouteFallback('/care/reset-password', {
        method: 'POST',
        token,
        body: { email: resetEmail },
      }, ['/developer/support/generate-reset-link', '/support/generate-reset-link']);
      setResetLinkResult(result?.resetLink || result?.message || 'Reset email sent.');
      toast.success('Password reset initiated.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to reset password');
    }
  };

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    navigate('/login', { replace: true });
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!authenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-5 w-5 flex-shrink-0" />
              <span className="font-semibold truncate text-sm md:text-base">Blumebyte Support</span>
              {careProfile && (
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex flex-shrink-0">
                  Support Agent
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-300 hidden md:inline truncate max-w-[150px]">{careProfile?.name || careProfile?.email}</span>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /><span className="hidden sm:inline ml-1">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { label: 'Total Tenants', value: tenants.length, icon: Building2 },
            { label: 'Active Tenants', value: tenants.filter((t) => t.status !== 'inactive').length, icon: CheckCircle },
            { label: 'Total Users', value: tenants.reduce((sum, t) => sum + (t.usedLicenses || 0), 0), icon: Users },
            { label: 'Applications', value: applications.length, icon: Briefcase },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <s.icon className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="tenants"><Building2 className="h-4 w-4 mr-1" />Tenants</TabsTrigger>
            <TabsTrigger value="tickets"><Ticket className="h-4 w-4 mr-1" />Tickets</TabsTrigger>
            <TabsTrigger value="applications"><Briefcase className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Global Hiring </span>Apps</TabsTrigger>
          </TabsList>

          {/* Tenants Tab */}
          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <CardTitle>Tenant Accounts</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9 w-64"
                      placeholder="Search tenants…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Industry</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Licenses</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTenants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                              No tenants found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTenants.map((t) => (
                            <TenantRow
                              key={t.id}
                              tenant={t}
                              onViewUsers={() => handleViewUsers(t)}
                              onResetPassword={() => handleResetPassword(t)}
                            />
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Hiring Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Global Hiring Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {appsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applicant</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                              No applications yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          applications.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.fullName || a.applicantName}</TableCell>
                              <TableCell className="text-gray-500 text-sm">{a.companyName}</TableCell>
                              <TableCell className="text-sm">{a.roleTitle}</TableCell>
                              <TableCell className="text-sm">{a.email}</TableCell>
                              <TableCell className="text-sm">{a.phone}</TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={a.status === 'reviewed' ? 'default' : 'secondary'}>
                                  {a.status || 'pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets / Chatbox Tab — only assigned tenant tickets */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div>
                    <CardTitle>Support Tickets</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">Only tickets for your assigned tenants are shown.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
                      <SelectTrigger className="w-36 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['all', 'open', 'pending', 'escalated', 'resolved'].map((s) => (
                          <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadTickets}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets
                          .filter((t) => ticketStatusFilter === 'all' || t.status === ticketStatusFilter)
                          .length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                              {tenants.length === 0
                                ? 'No tenants assigned to you yet.'
                                : 'No tickets found for your assigned tenants.'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          tickets
                            .filter((t) => ticketStatusFilter === 'all' || t.status === ticketStatusFilter)
                            .map((t) => (
                              <TableRow key={t.id}>
                                <TableCell className="text-sm font-medium">{t.tenantName || t.tenantId || '—'}</TableCell>
                                <TableCell className="text-sm max-w-[200px] truncate">{t.subject}</TableCell>
                                <TableCell>
                                  <Badge variant={t.priority === 'critical' || t.priority === 'high' ? 'destructive' : 'secondary'}>
                                    {t.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={t.status === 'resolved' ? 'default' : t.status === 'escalated' ? 'destructive' : 'secondary'}>
                                    {t.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">
                                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => handleViewTicket(t)}>
                                      <MessageSquare className="h-3.5 w-3.5 mr-1" />Chat
                                    </Button>
                                    {t.status !== 'escalated' && t.status !== 'resolved' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-orange-600 hover:border-orange-300"
                                        onClick={() => handleEscalateTicket(t.id)}
                                      >
                                        Escalate
                                      </Button>
                                    )}
                                    {t.status !== 'resolved' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-700 hover:border-green-300"
                                        onClick={() => handleResolveTicket(t.id)}
                                      >
                                        Resolve
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Chat Dialog */}
      <Dialog open={ticketDetailOpen} onOpenChange={(v) => { if (!v) { setTicketDetailOpen(false); setSelectedTicket(null); setNewComment(''); } }}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">
              <span className="text-gray-500 text-xs font-normal block mb-0.5">{selectedTicket?.tenantName}</span>
              {selectedTicket?.subject}
            </DialogTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{selectedTicket?.issueType}</Badge>
              <Badge variant={selectedTicket?.priority === 'critical' || selectedTicket?.priority === 'high' ? 'destructive' : 'secondary'}>
                {selectedTicket?.priority}
              </Badge>
              <Badge variant={selectedTicket?.status === 'resolved' ? 'default' : 'secondary'}>
                {selectedTicket?.status}
              </Badge>
            </div>
          </DialogHeader>
          {/* Description */}
          {selectedTicket?.description && (
            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-700 shrink-0">
              <p className="font-medium text-xs text-gray-500 mb-1">Description</p>
              {selectedTicket.description}
            </div>
          )}
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px] max-h-64 bg-gray-50 rounded-lg p-3 border">
            {ticketComments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No messages yet. Start the conversation below.</p>
            ) : (
              ticketComments.map((c: any) => (
                <div key={c.id} className={`flex ${c.authorRole === 'customer_care' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${c.authorRole === 'customer_care' ? 'bg-primary text-primary-foreground' : 'bg-white border text-gray-800'}`}>
                    <p className="text-xs opacity-60 mb-0.5">{c.authorEmail}</p>
                    <p>{c.comment}</p>
                    <p className="text-xs opacity-40 mt-0.5 text-right">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString() : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Send message */}
          {selectedTicket?.status !== 'resolved' && (
            <div className="flex gap-2 shrink-0">
              <Textarea
                className="resize-none text-sm"
                rows={2}
                placeholder="Type a message…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
              />
              <Button
                className="self-end bg-primary text-primary-foreground hover:bg-primary/90"
                size="sm"
                onClick={handleSendComment}
                disabled={sendingComment || !newComment.trim()}
              >
                {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
          <DialogFooter>
            {selectedTicket?.status !== 'resolved' && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 hover:border-green-300"
                onClick={() => selectedTicket?.id && handleResolveTicket(selectedTicket.id)}
              >
                Mark Solved
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setTicketDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Users — {selectedTenant?.name}</DialogTitle>
          </DialogHeader>
          {usersLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">No users found</TableCell>
                  </TableRow>
                ) : (
                  tenantUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>{u.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(v) => { if (!v) { setResetDialogOpen(false); setResetLinkResult(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Password Reset — {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          {resetLinkResult ? (
            <div className="space-y-4 py-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-2">Reset link / result:</p>
                <p className="text-sm text-green-700 break-all">{resetLinkResult}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { navigator.clipboard.writeText(resetLinkResult); toast.success('Copied!'); }}
              >
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-500">
                Enter the email of the user to send a password reset link. The reset link will be generated for you to share.
              </p>
              <div className="space-y-1">
                <Label>User Email</Label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setResetDialogOpen(false); setResetLinkResult(null); }}>Close</Button>
            {!resetLinkResult && (
              <Button onClick={doPasswordReset} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <KeyRound className="h-4 w-4 mr-2" /> Generate Reset Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

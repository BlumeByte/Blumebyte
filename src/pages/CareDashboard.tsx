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
  Eye, Trash2, UserPlus, Lock, Unlock, LogOut, AlertCircle,
  Copy, CheckCircle, Settings, BarChart3, Briefcase
} from 'lucide-react';
import { api } from '../lib/api-client';
import { supabase } from '../lib/supabase-client';

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

// ─── Care Auth Context ────────────────────────────────────────────────────────
// Use sessionStorage so the token is cleared when the tab/browser closes
function getCareToken(): string | null {
  return sessionStorage.getItem('care_token');
}
function setCareToken(token: string) {
  sessionStorage.setItem('care_token', token);
}
function clearCareToken() {
  sessionStorage.removeItem('care_token');
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function CareDashboardLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Verify this account is a developer/care role
      const token = data.session?.access_token;
      if (!token) throw new Error('No session token');

      // Check role via API
      const profileRes = await api('/care/verify-access', { token });
      if (!profileRes?.allowed) {
        await supabase.auth.signOut();
        throw new Error('This account does not have customer care access.');
      }

      setCareToken(token);
      onLogin();
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Customer Care Portal</CardTitle>
          <p className="text-xs text-gray-500">Blumebyte Internal Access Only</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-black text-white hover:bg-gray-800">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tenant Row ───────────────────────────────────────────────────────────────
function TenantRow({
  tenant,
  onViewUsers,
  onResetPassword,
  onDelete,
  isDeveloper,
}: {
  tenant: Tenant;
  onViewUsers: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  isDeveloper: boolean;
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
          {isDeveloper && (
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:border-red-300" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function CareDashboard() {
  const navigate = useNavigate();
  // Tri-state: null = checking, false = not authenticated, true = authenticated
  const [authenticated, setAuthenticated] = useState<boolean | null>(getCareToken() ? null : false);
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
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState('tenants');

  // Global hiring applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const token = getCareToken();
  const isDeveloper = careProfile?.role === 'developer';

  const loadProfile = useCallback(async () => {
    if (!token) {
      setAuthenticated(false);
      return;
    }
    try {
      const p = await api('/care/profile', { token });
      setCareProfile(p);
      setAuthenticated(true);
    } catch {
      clearCareToken();
      setAuthenticated(false);
    }
  }, [token]);

  const loadTenants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api('/care/tenants', { token });
      setTenants(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadApplications = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    // Always verify token on mount; also reload when authenticated flips to true after login
    if (authenticated !== false) {
      loadProfile();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: verify once on mount

  useEffect(() => {
    if (authenticated === true) {
      loadTenants();
    }
  }, [authenticated, loadTenants]);

  useEffect(() => {
    if (activeTab === 'applications') loadApplications();
  }, [activeTab, loadApplications]);

  const handleViewUsers = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setUsersDialogOpen(true);
    setUsersLoading(true);
    try {
      const data = await api(`/care/tenants/${tenant.id}/users`, { token });
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
      const result = await api('/care/reset-password', {
        method: 'POST',
        token,
        body: { email: resetEmail },
      });
      setResetLinkResult(result?.resetLink || result?.message || 'Reset email sent.');
      toast.success('Password reset initiated.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to reset password');
    }
  };

  const handleDeleteTenant = async () => {
    if (!deleteTarget || !isDeveloper) return;
    try {
      await api(`/care/tenants/${deleteTarget.id}`, { method: 'DELETE', token });
      toast.success(`Tenant "${deleteTarget.name}" deleted.`);
      setDeleteDialog(false);
      setDeleteTarget(null);
      loadTenants();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete tenant');
    }
  };

  const handleUpdateLicense = async (tenantId: string, licenses: number) => {
    try {
      await api(`/care/tenants/${tenantId}/license`, {
        method: 'PUT',
        token,
        body: { licenses },
      });
      toast.success('License count updated.');
      loadTenants();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update license');
    }
  };

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearCareToken();
    setAuthenticated(false);
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!authenticated) {
    return <CareDashboardLogin onLogin={() => { setAuthenticated(null); loadProfile(); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <span className="font-semibold">Blumebyte Customer Care</span>
              {careProfile && (
                <Badge variant="secondary" className="text-xs">
                  {isDeveloper ? 'Developer' : 'Support Agent'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">{careProfile?.name || careProfile?.email}</span>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tenants', value: tenants.length, icon: Building2 },
            { label: 'Active Tenants', value: tenants.filter((t) => t.status !== 'inactive').length, icon: CheckCircle },
            { label: 'Total Users', value: tenants.reduce((sum, t) => sum + (t.usedLicenses || 0), 0), icon: Users },
            { label: 'Applications', value: applications.length, icon: Briefcase },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="tenants"><Building2 className="h-4 w-4 mr-1" />Tenants</TabsTrigger>
            <TabsTrigger value="applications"><Briefcase className="h-4 w-4 mr-1" />Global Hiring Apps</TabsTrigger>
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
                              onDelete={() => { setDeleteTarget(t); setDeleteDialog(true); }}
                              isDeveloper={isDeveloper}
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
        </Tabs>
      </div>

      {/* View Users Dialog */}
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
              <Button onClick={doPasswordReset} className="bg-black text-white hover:bg-gray-800">
                <KeyRound className="h-4 w-4 mr-2" /> Generate Reset Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tenant Dialog */}
      {isDeveloper && (
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Tenant</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-gray-600">
                Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>?
                This action cannot be undone and will remove all their data and users.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteTenant}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { api, apiUpload } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, UserPlus, Loader2, Plus, Pencil, Trash2, Search,
  X, Building2, FolderTree, Briefcase, CalendarDays, Megaphone, KeyRound,
  Copy, RefreshCw, PanelLeftClose, PanelLeftOpen, AlertCircle, Settings,
  Clock, CheckCircle, MessageCircle, User, UserCheck, Upload, FileText, Download, LogOut, Camera,
  UserCog, XCircle, Zap, GitMerge, Target, ClipboardList, FileCheck, BarChart3, Eye, EyeOff, ChevronUp, ChevronDown, Play,
  MessageSquare, BookOpen, GraduationCap, CreditCard, ExternalLink, Globe, Menu
} from 'lucide-react';
import { MessagesPanel } from './MessagesPanel';
import { NotificationsBell } from './NotificationsBell';
import { SharedMyProfile } from './SharedMyProfile';
import { SharedSelfServiceHub } from './SharedSelfServiceHub';
import { HiringApprovalPanel } from './HiringApprovalPanel';
import { ClockInOut } from './ClockInOut';
import { ReportsPanel } from './ReportsPanel';
import { MeetingsPanel } from './MeetingsPanel';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { useBranding, brandGradientStyle } from '../lib/branding-context';
import { scrollToTop } from '../lib/navigation-utils';
import { AuditLogsModule } from './AuditLogsModule';
import { AdvancedReportsModule } from './AdvancedReportsModule';
import { UserLicenseAlert } from './LicenseStatusBanner';
import { TrainingManagement } from './TrainingManagement';
import { ComprehensiveReports } from './ComprehensiveReports';
import { AutomationModule } from './AutomationModule';
import { OvertimeExpenseApproval } from './OvertimeExpenseApproval';
import { SurveyBuilder } from './SurveyBuilder';
import { EmployeeEngagementAnalytics } from './EmployeeEngagementAnalytics';
import { LanguageSelector } from './LanguageSelector';
import { useDarkMode } from '../lib/dark-mode-context';
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'departments', label: 'Departments', icon: FolderTree },
  { id: 'leave', label: 'Leave Mgmt', icon: CalendarDays },
  { id: 'assets', label: 'Assets', icon: Briefcase },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'workflows', label: 'Workflows & Approvals', icon: GitMerge },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'performance-reviews', label: 'Performance Reviews', icon: Target },
  { id: 'disciplinary', label: 'Disciplinary', icon: AlertCircle },
  { id: 'compliance', label: 'Labour Compliance', icon: FileCheck },
  { id: 'tasks', label: 'Task Assignments', icon: ClipboardList },
  { id: 'feedback-360', label: '360° Feedback', icon: MessageSquare },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'overtime-expenses', label: 'OT & Expenses', icon: Clock },
  { id: 'surveys', label: 'Surveys', icon: ClipboardList },
  { id: 'engagement-analytics', label: 'Engagement Analytics', icon: BarChart3 },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'meetings', label: 'Meetings', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'advanced-reports', label: 'Advanced Reports', icon: BarChart3 },
  { id: 'audit-logs', label: 'Audit Logs', icon: FileCheck },
  { id: 'pending-approvals', label: 'Approvals', icon: CheckCircle },
  { id: 'hiring', label: 'Hiring', icon: UserCheck },
  { id: 'profile-requests', label: 'Profile Requests', icon: UserCog },
  { id: 'self-service', label: 'Self-Service', icon: Briefcase },
  { id: 'my-profile', label: 'My Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Active statuses for public job posting visibility (mirrors server JOB_ACTIVE_STATUSES)
const JOB_ACTIVE_STATUSES = new Set(['active', 'open', 'interviewing', 'offered']);

function copyToClipboard(text: string) {
  // Use fallback method for sandboxed environments
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast.success('Copied');
  } catch (err) {
    toast.error('Failed to copy');
  } finally {
    document.body.removeChild(ta);
  }
}

export function AdminDashboard() {
  const { user, accessToken, logout } = useAuth();
  const { branding, refresh: refreshBranding } = useBranding();
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`${collapsed ? 'w-[72px]' : 'w-56'} bg-card border-r border-border flex flex-col fixed h-screen z-50 md:z-30 transition-all duration-200 overflow-hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className={`p-3 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} flex-shrink-0`}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-transform overflow-hidden" style={brandGradientStyle(branding.primaryColor)} title="Expand sidebar">
              {branding.logoUrl ? <img src={branding.logoUrl} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-white font-bold text-sm">{branding.companyName?.[0] || 'B'}</span>}
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={brandGradientStyle(branding.primaryColor)}>
                  {branding.logoUrl ? <img src={branding.logoUrl} alt="" className="w-full h-full object-contain p-0.5" /> : <span className="text-white font-bold text-sm">{branding.companyName?.[0] || 'B'}</span>}
                </div>
                <div><p className="text-sm font-semibold">{branding.companyName}</p><p className="text-[10px] text-gray-400 uppercase">Admin</p></div>
              </div>
              <button onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><PanelLeftClose className="w-4 h-4" /></button>
            </>
          )}
        </div>
        <Separator className="flex-shrink-0" />
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarWidth: 'thin' }}>
          <nav className="px-2 space-y-0.5">
            {TABS.filter(t => {
              // Hide "Pending Approvals" from non-SuperAdmin users
              if (t.id === 'pending-approvals' && user?.role !== 'superadmin') return false;
              return true;
            }).map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => { setActiveTab(t.id); scrollToTop(); setMobileMenuOpen(false); }}
                  aria-label={t.label}
                  title={collapsed ? t.label : undefined}
                  className={`w-full flex items-center gap-2.5 rounded-lg transition-colors ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'} ${active ? '' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  style={active ? { backgroundColor: branding.primaryColor + '15', color: branding.primaryColor } : undefined}>
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" style={active ? { color: branding.primaryColor } : undefined} />
                  <span className={`text-[13px] ${active ? 'font-medium' : ''} ${collapsed ? 'hidden' : 'block truncate'}`}>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="border-t p-2 flex-shrink-0">
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} aria-label="Expand sidebar" className="w-full flex justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Expand sidebar"><PanelLeftOpen className="w-5 h-5" /></button>
          ) : (
            <div className="flex items-center gap-2 p-1">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">{user?.name?.[0]}</div>
              )}
              <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{user?.name}</p><p className="text-[10px] text-gray-400 truncate">{user?.email}</p></div>
              <button onClick={logout} aria-label="Log Out" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 transition-colors" title="Log Out"><LogOut className="w-4 h-4" /></button>
            </div>
          )}
          {collapsed && (
            <button onClick={logout} aria-label="Log Out" className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Log Out"><LogOut className="w-5 h-5" /></button>
          )}
        </div>
      </aside>

      <div className={`flex-1 ${collapsed ? 'md:ml-[72px]' : 'md:ml-56'} transition-all duration-200 min-w-0`}>
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{TABS.find(t => t.id === activeTab)?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hidden sm:inline-flex">Admin</Badge>
          </div>
        </header>
        <main className="p-6">
          {/* License Status Alert for Non-SuperAdmin Users */}
          <UserLicenseAlert />
          
          {activeTab === 'overview' && <AdminOverview setTab={setActiveTab} />}
          {activeTab === 'employees' && <AdminEmployees />}
          {activeTab === 'departments' && <AdminDepartments />}
          {activeTab === 'leave' && <AdminLeave />}
          {activeTab === 'assets' && <AdminAssets />}
          {activeTab === 'attendance' && <AdminAttendance />}
          {activeTab === 'workflows' && <AdminCrudPanel entityKey="workflows" />}
          {activeTab === 'automation' && <AutomationModule companyId={user?.companyId || user?.company} />}
          {activeTab === 'performance-reviews' && <AdminCrudPanel entityKey="performance-reviews" />}
          {activeTab === 'disciplinary' && <AdminCrudPanel entityKey="disciplinary" />}
          {activeTab === 'compliance' && <AdminCrudPanel entityKey="compliance" />}
          {activeTab === 'tasks' && <AdminCrudPanel entityKey="tasks" />}
          {activeTab === 'feedback-360' && <AdminCrudPanel entityKey="feedback-360" />}
          {activeTab === 'training' && <TrainingManagement mode="admin" />}
          {activeTab === 'overtime-expenses' && <OvertimeExpenseApproval />}
          {activeTab === 'surveys' && <SurveyBuilder />}
          {activeTab === 'engagement-analytics' && <EmployeeEngagementAnalytics />}
          {activeTab === 'messages' && <MessagesPanel />}
          {activeTab === 'announcements' && <AdminAnnouncements />}
          {activeTab === 'meetings' && <MeetingsPanel mode="admin" />}
          {activeTab === 'reports' && <ComprehensiveReports />}
          {activeTab === 'advanced-reports' && <AdvancedReportsModule />}
          {activeTab === 'audit-logs' && <AuditLogsModule />}
          {activeTab === 'pending-approvals' && user?.role === 'superadmin' && <PendingApprovalsPanel />}
          {activeTab === 'hiring' && <AdminHiring />}
          {activeTab === 'profile-requests' && <AdminProfileChangeRequests />}
          {activeTab === 'self-service' && <SharedSelfServiceHub onNavigate={setActiveTab} />}
          {activeTab === 'my-profile' && <SharedMyProfile />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}

function AdminOverview({ setTab }: { setTab: (t: string) => void }) {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const safeFetch = (path: string) => api(path, { token: accessToken }).catch(e => { console.log(`Admin fetch ${path} failed:`, e); return []; });
    try {
      const [users, depts, leaves, assets] = await Promise.all([
        safeFetch('/users'),
        safeFetch('/admin/departments'),
        safeFetch('/leave-requests'),
        safeFetch('/admin/assets'),
      ]);
      setStats({
        employees: (Array.isArray(users) ? users : []).length,
        departments: (Array.isArray(depts) ? depts : []).length,
        pendingLeaves: (Array.isArray(leaves) ? leaves : []).filter((l: any) => l.status === 'pending').length,
        assets: (Array.isArray(assets) ? assets : []).length,
      });
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { loadStats(); }, [loadStats]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(loadStats, 60000); return () => clearInterval(iv); }, [loadStats]);

  return (
    <div className="space-y-6 max-w-5xl">
      <ClockInOut />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Employees', value: stats.employees, icon: Users, color: 'from-blue-500 to-blue-600', tab: 'employees' },
          { label: 'Departments', value: stats.departments, icon: FolderTree, color: 'from-purple-500 to-purple-600', tab: 'departments' },
          { label: 'Pending Leave', value: stats.pendingLeaves, icon: CalendarDays, color: 'from-amber-500 to-amber-600', tab: 'leave' },
          { label: 'Assets', value: stats.assets, icon: Briefcase, color: 'from-green-500 to-green-600', tab: 'assets' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab(c.tab)}>
              <CardContent className="pt-5 pb-4 text-center">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} mx-auto mb-2 flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
                <p className="text-2xl font-bold">{loading ? '—' : c.value ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Add Employee', icon: UserPlus, tab: 'employees', color: 'bg-blue-500 hover:bg-blue-600' },
            { label: 'Workflows', icon: GitMerge, tab: 'workflows', color: 'bg-indigo-500 hover:bg-indigo-600' },
            { label: 'Reports', icon: BarChart3, tab: 'reports', color: 'bg-green-500 hover:bg-green-600' },
            { label: 'Training', icon: GraduationCap, tab: 'training', color: 'bg-amber-500 hover:bg-amber-600' },
            { label: 'Hiring', icon: Briefcase, tab: 'hiring', color: 'bg-pink-500 hover:bg-pink-600' },
            { label: 'Announcements', icon: Megaphone, tab: 'announcements', color: 'bg-cyan-500 hover:bg-cyan-600' },
            { label: 'Meetings', icon: MessageSquare, tab: 'meetings', color: 'bg-teal-500 hover:bg-teal-600' },
          ].map(link => {
            const Icon = link.icon;
            return (
              <Button
                key={link.label}
                className={`${link.color} text-white h-auto py-4 flex flex-col items-center gap-2`}
                onClick={() => setTab(link.tab)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{link.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminEmployees() {
  const { accessToken, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ role: 'employee' });
  const [editUser, setEditUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tempPw, setTempPw] = useState('');
  const [showTempPw, setShowTempPw] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [contractTarget, setContractTarget] = useState<any>(null);
  const [contractFiles, setContractFiles] = useState<any[]>([]);
  const [uploadingContract, setUploadingContract] = useState(false);
  const contractUploadRef = useRef<HTMLInputElement>(null);
  const isSuperAdminEmp = user?.role === 'superadmin';

  const allowedCompanies = isSuperAdminEmp
    ? companies
    : companies.filter(c => {
        const adminAssigned = (user as any)?.assignedCompanies || [];
        const adminCompanyId = (user as any)?.companyId || (user as any)?.company;
        return adminAssigned.includes(c.id) || adminAssigned.includes(c.name) || c.id === adminCompanyId || c.name === adminCompanyId;
      });

  const allowedDepartments = isSuperAdminEmp
    ? departmentsList
    : departmentsList.filter(d => {
        const adminDepts = (user as any)?.departments || (user as any)?.assignedDepartments || [];
        const adminDept = (user as any)?.department || '';
        const deptName = typeof d === 'string' ? d : d.name || d.id || '';
        return adminDepts.includes(deptName) || deptName === adminDept || adminDepts.length === 0;
      });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, comps, depts] = await Promise.all([
        api('/users', { token: accessToken }),
        api('/reference-data', { token: accessToken }).catch(() => ({})),
        api('/departments', { token: accessToken }).catch(() => [])
      ]);
      setUsers(Array.isArray(data) ? data : []);
      setCompanies(comps?.companies || []);
      setDepartmentsList(Array.isArray(depts) ? depts : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        await api(`/users/${editUser.userId || editUser.id}`, { method: 'PUT', body: formData, token: accessToken });
        toast.success('Updated'); setDialogOpen(false);
      } else {
        const res = await api('/users/create', { method: 'POST', body: formData, token: accessToken });
        setTempPw(res.tempPassword);
        setShowTempPw(true);
        toast.success('Employee created');
      }
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const user = users.find(u => (u.userId || u.id) === id);
    setDeleteTarget(user || { userId: id, name: 'User' });
    setDeleteReason('');
  };

  const submitDeletionRequest = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api('/deletion-requests', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: deleteTarget.userId || deleteTarget.id, reason: deleteReason }),
        token: accessToken,
      });
      toast.success('Deletion request sent to SuperAdmin for approval');
      setDeleteTarget(null); setDeleteReason('');
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  // Contract upload handlers for HR
  const openContractDialog = async (targetUser: any) => {
    setContractTarget(targetUser);
    try {
      const files = await api(`/files/${targetUser.userId || targetUser.id}`, { token: accessToken });
      setContractFiles(Array.isArray(files) ? files.filter((f: any) => f.type !== 'profile-image') : []);
    } catch { setContractFiles([]); }
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contractTarget) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(`File must be less than 5MB. Yours is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`); return; }
    if (contractFiles.length >= 5) { toast.error('Upload limit reached (5 files). Delete some files first.'); return; }
    setUploadingContract(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('docType', 'contract'); fd.append('targetUserId', contractTarget.userId || contractTarget.id);
      await apiUpload('/upload/document', fd, accessToken);
      toast.success('Contract uploaded to employee');
      openContractDialog(contractTarget);
    } catch (err: any) { toast.error(err.message); }
    setUploadingContract(false);
    if (contractUploadRef.current) contractUploadRef.current.value = '';
  };

  const handleDeleteContractFile = async (fileId: string) => {
    if (!contractTarget || !confirm('Delete this file?')) return;
    try { await api(`/files/${contractTarget.userId || contractTarget.id}/${fileId}`, { method: 'DELETE', token: accessToken }); toast.success('File deleted'); openContractDialog(contractTarget); }
    catch (err: any) { toast.error(err.message); }
  };

  // Hide superadmin accounts from admin user management  
  const visibleUsers = users.filter(u => u.role !== 'superadmin');
  const filtered = visibleUsers.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Button size="sm" onClick={() => { setEditUser(null); setFormData({ role: 'employee' }); setShowTempPw(false); setDialogOpen(true); }}><UserPlus className="w-4 h-4 mr-1" />Add Employee</Button>
      </div>
      <Card><CardContent className="p-0">
        {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Company</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead className="w-28">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map(u => (
              <TableRow key={u.userId || u.id}>
                <TableCell className="font-medium">{u.name}</TableCell><TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                <TableCell className="text-sm">{u.company || '—'}</TableCell><TableCell className="text-sm">{u.department || '—'}</TableCell>
                <TableCell><Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : ''}>{u.status || 'active'}</Badge></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditUser(u); setFormData({ ...u }); setShowTempPw(false); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openContractDialog(u)} title="Upload contract/documents"><Upload className="w-3.5 h-3.5 text-blue-500" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => handleDelete(u.userId || u.id)} title="Request deletion"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>

      {/* Contract Upload Dialog */}
      <Dialog open={!!contractTarget} onOpenChange={() => setContractTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Employee Documents — {contractTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Upload contracts or documents for this employee</p>
              <Badge variant="outline" className="text-xs">{contractFiles.length} / 5 files</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => contractUploadRef.current?.click()} disabled={uploadingContract || contractFiles.length >= 5}>
                {uploadingContract ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}Upload (max 5MB)
              </Button>
              <input ref={contractUploadRef} type="file" className="hidden" onChange={handleContractUpload} />
            </div>
            {contractFiles.length >= 5 && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /><p className="text-xs text-amber-800">Limit reached (5 files). Delete files to upload more.</p>
              </div>
            )}
            {contractFiles.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No documents uploaded yet</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {contractFiles.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <div><p className="text-sm font-medium">{f.fileName}</p><p className="text-[10px] text-gray-400">{(f.fileSize / 1024).toFixed(1)}KB · {f.type} · {new Date(f.createdAt).toLocaleDateString()}</p></div>
                    </div>
                    <div className="flex gap-1">
                      {f.signedUrl && <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => window.open(f.signedUrl, '_blank')}><Download className="w-3 h-3 mr-1" />View</Button>}
                      <Button variant="ghost" size="sm" className="h-6 text-red-500" onClick={() => handleDeleteContractFile(f.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setContractTarget(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) { setDialogOpen(false); setShowTempPw(false); } }}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{showTempPw ? 'Temporary Password' : editUser ? 'Edit Employee' : 'Create Employee'}</DialogTitle></DialogHeader>
          {showTempPw ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"><AlertCircle className="w-4 h-4 text-amber-600" /><p className="text-sm text-amber-800">Share this password securely with the employee.</p></div>
              <div className="flex items-center gap-2"><Input value={tempPw} readOnly className="font-mono" /><Button variant="outline" size="sm" onClick={() => copyToClipboard(tempPw)}><Copy className="w-4 h-4" /></Button></div>
              <Button className="w-full" onClick={() => { setDialogOpen(false); setShowTempPw(false); }}>Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Name *</Label><Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div><Label className="text-xs">Email *</Label><Input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editUser} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Role</Label>
                    <Select value={formData.role || 'employee'} onValueChange={v => setFormData({ ...formData, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="employee">Employee</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                    </Select></div>
                  <div><Label className="text-xs">Department</Label>
                    <Select value={formData.department || ''} onValueChange={v => setFormData({ ...formData, department: v })}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {allowedDepartments.filter(d => d.status === 'active').map(d => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Position</Label><Input value={formData.position || ''} onChange={e => setFormData({ ...formData, position: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Phone</Label><Input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                  <div><Label className="text-xs">Status</Label>
                    <Select value={formData.status || 'active'} onValueChange={v => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="on-leave">On Leave</SelectItem></SelectContent>
                    </Select></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{editUser ? 'Update' : 'Create'}</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Deletion Request Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Employee Deletion</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-800">Employee deletions require SuperAdmin approval. A request will be sent for review.</p>
            </div>
            {deleteTarget && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">{deleteTarget.name}</p>
                <p className="text-xs text-gray-500">{deleteTarget.email} &middot; {deleteTarget.role}</p>
              </div>
            )}
            <div>
              <Label className="text-xs">Reason for Deletion</Label>
              <Textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Why should this employee be removed?" rows={3} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitDeletionRequest} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminUsers() {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ role: 'employee' });
  const [editUser, setEditUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tempPw, setTempPw] = useState('');
  const [showTempPw, setShowTempPw] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [initialDepartment, setInitialDepartment] = useState('');
  const isSuperAdmin = user?.role === 'superadmin';

  const allowedCompanies = isSuperAdmin
    ? companies
    : companies.filter(c => {
        const adminAssigned = (user as any)?.assignedCompanies || [];
        const adminCompanyId = (user as any)?.companyId || (user as any)?.company;
        return adminAssigned.includes(c.id) || adminAssigned.includes(c.name) || c.id === adminCompanyId || c.name === adminCompanyId;
      });

  const allowedDepartments = isSuperAdmin
    ? departmentsList
    : departmentsList.filter(d => {
        const adminDepts = (user as any)?.departments || (user as any)?.assignedDepartments || [];
        const adminDept = (user as any)?.department || '';
        const deptName = typeof d === 'string' ? d : d.name || d.id || '';
        return adminDepts.includes(deptName) || deptName === adminDept || adminDepts.length === 0;
      });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, comps, depts] = await Promise.all([
        api('/users', { token: accessToken }),
        api('/reference-data', { token: accessToken }).catch(() => ({})),
        api('/departments', { token: accessToken }).catch(() => [])
      ]);
      setUsers(Array.isArray(data) ? data : []);
      setCompanies(comps?.companies || []);
      setDepartmentsList(Array.isArray(depts) ? depts : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        // Admin changes require approval workflow
        if (!isSuperAdmin) {
          await api('/admin/request-user-update', { 
            method: 'POST', 
            body: { 
              userId: editUser.userId || editUser.id,
              updates: formData,
              reason: 'Admin user update request'
            }, 
            token: accessToken 
          });
          toast.success('Update request sent to SuperAdmin for approval');
        } else {
          // SuperAdmin can directly update
          await api(`/users/${editUser.userId || editUser.id}`, { 
            method: 'PUT', 
            body: formData, 
            token: accessToken 
          });
          toast.success('Updated');
        }
        setDialogOpen(false);
      } else {
        // Creating new users
        if (!isSuperAdmin) {
          await api('/admin/request-user-create', { 
            method: 'POST', 
            body: { 
              userData: formData,
              reason: 'Admin user creation request'
            }, 
            token: accessToken 
          });
          toast.success('User creation request sent to SuperAdmin for approval');
          setDialogOpen(false);
        } else {
          // SuperAdmin can directly create
          const res = await api('/users/create', { method: 'POST', body: formData, token: accessToken });
          setTempPw(res.tempPassword);
          setShowTempPw(true);
          toast.success('Employee created');
        }
      }
      await load();
    } catch (e: any) { 
      if (e.needsLicenses) {
        const usedCount = e.usedLicenses || 0;
        const purchasedCount = e.purchasedLicenses || 0;
        if (e.isAdmin) {
          toast.error(`No available licenses. You have used ${usedCount} of ${purchasedCount} licenses. Please contact your SuperAdmin to purchase more licenses.`);
        } else {
          toast.error(`No available licenses. You have used ${usedCount} of ${purchasedCount} licenses. Please purchase more licenses to add users.`);
        }
      } else {
        toast.error(e.message || 'An error occurred');
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const user = users.find(u => (u.userId || u.id) === id);
    setDeleteTarget(user || { userId: id, name: 'User' });
    setDeleteReason('');
  };

  const submitDeletionRequest = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api('/deletion-requests', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: deleteTarget.userId || deleteTarget.id, reason: deleteReason }),
        token: accessToken,
      });
      toast.success('Deletion request sent to SuperAdmin for approval');
      setDeleteTarget(null); setDeleteReason('');
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  // Hide superadmin accounts from admin user management
  const visibleUsers = users.filter(u => u.role !== 'superadmin');
  const filtered = visibleUsers.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Button size="sm" onClick={() => { setEditUser(null); setFormData({ role: 'employee' }); setShowTempPw(false); setDialogOpen(true); }}><UserPlus className="w-4 h-4 mr-1" />Add Employee</Button>
      </div>
      <Card><CardContent className="p-0">
        {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Company</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map(u => (
              <TableRow key={u.userId || u.id}>
                <TableCell className="font-medium">{u.name}</TableCell><TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                <TableCell className="text-sm">{u.company || '—'}</TableCell><TableCell className="text-sm">{u.department || '—'}</TableCell>
                <TableCell><Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : ''}>{u.status || 'active'}</Badge></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditUser(u); setFormData({ ...u }); setShowTempPw(false); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => handleDelete(u.userId || u.id)} title="Request deletion"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) { setDialogOpen(false); setShowTempPw(false); } }}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{showTempPw ? 'Temporary Password' : editUser ? 'Edit Employee' : 'Create Employee'}</DialogTitle></DialogHeader>
          {showTempPw ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"><AlertCircle className="w-4 h-4 text-amber-600" /><p className="text-sm text-amber-800">Share this password securely with the employee.</p></div>
              <div className="flex items-center gap-2"><Input value={tempPw} readOnly className="font-mono" /><Button variant="outline" size="sm" onClick={() => copyToClipboard(tempPw)}><Copy className="w-4 h-4" /></Button></div>
              <Button className="w-full" onClick={() => { setDialogOpen(false); setShowTempPw(false); }}>Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Name *</Label><Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div><Label className="text-xs">Email *</Label><Input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editUser} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Role</Label>
                    <Select value={formData.role || 'employee'} onValueChange={v => setFormData({ ...formData, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="employee">Employee</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                    </Select></div>
                  <div><Label className="text-xs">Department</Label>
                    <Select value={formData.department || ''} onValueChange={v => setFormData({ ...formData, department: v })}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {allowedDepartments.filter(d => d.status === 'active').map(d => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Position</Label><Input value={formData.position || ''} onChange={e => setFormData({ ...formData, position: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Phone</Label><Input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                  <div><Label className="text-xs">Status</Label>
                    <Select value={formData.status || 'active'} onValueChange={v => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="on-leave">On Leave</SelectItem></SelectContent>
                    </Select></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{editUser ? 'Update' : 'Create'}</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Deletion Request Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request User Deletion</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-800">User deletions require SuperAdmin approval. A request will be sent for review and all teams will be notified upon approval.</p>
            </div>
            {deleteTarget && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">{deleteTarget.name}</p>
                <p className="text-xs text-gray-500">{deleteTarget.email} &middot; {deleteTarget.role}</p>
              </div>
            )}
            <div>
              <Label className="text-xs">Reason for Deletion</Label>
              <Textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Why should this user be removed?" rows={3} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitDeletionRequest} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminDepartments() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api('/admin/departments', { token: accessToken }); setItems(Array.isArray(d) ? d : []); }
    catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) { await api(`/admin/departments/${editItem.id}`, { method: 'PUT', body: formData, token: accessToken }); }
      else { await api('/admin/departments', { method: 'POST', body: formData, token: accessToken }); }
      toast.success('Saved'); setDialogOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api(`/admin/departments/${id}`, { method: 'DELETE', token: accessToken }); toast.success('Deleted'); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex justify-end"><Button size="sm" onClick={() => { setEditItem(null); setFormData({}); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add Department</Button></div>
      <Card><CardContent className="p-0">
        {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Head</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{items.map(i => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell>{i.headOfDepartment || '—'}</TableCell>
                <TableCell><Badge className={i.status === 'active' ? 'bg-green-100 text-green-800' : ''}>{i.status || 'active'}</Badge></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditItem(i); setFormData({ ...i }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(i.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Department</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Name</Label><Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label className="text-xs">Head of Department</Label><Input value={formData.headOfDepartment || ''} onChange={e => setFormData({ ...formData, headOfDepartment: e.target.value })} /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={formData.status || 'active'} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminLeave() {
  const { accessToken } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaves = useCallback(async () => {
    try {
      const d = await api('/leave-requests', { token: accessToken });
      setLeaves(Array.isArray(d) ? d : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(loadLeaves, 60000); return () => clearInterval(iv); }, [loadLeaves]);

  const handleAction = async (id: string, status: string) => {
    try {
      await api(`/leave-requests/${id}`, { method: 'PUT', body: { status }, token: accessToken });
      toast.success(`Leave ${status}`);
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch (e: any) { toast.error(e.message); }
  };

  const statusColor = (s: string) => { switch (s) { case 'approved': return 'bg-green-100 text-green-800'; case 'rejected': return 'bg-red-100 text-red-800'; default: return 'bg-amber-100 text-amber-800'; } };

  return (
    <div className="space-y-4 max-w-5xl">
      <Card><CardContent className="p-0">
        {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : leaves.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No leave requests</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{leaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.employeeName}</TableCell>
                <TableCell>{l.leaveType || l.type || '—'}</TableCell>
                <TableCell className="text-sm">{l.startDate}</TableCell><TableCell className="text-sm">{l.endDate}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{l.reason || '—'}</TableCell>
                <TableCell><Badge className={statusColor(l.status)}>{l.status}</Badge></TableCell>
                <TableCell>{l.status === 'pending' && <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => handleAction(l.id, 'approved')}><CheckCircle className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => handleAction(l.id, 'rejected')}><X className="w-4 h-4" /></Button>
                </div>}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}

function AdminAssets() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState<'assets' | 'categories'>('assets');
  
  // Category management states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<any>({});
  const [editCategory, setEditCategory] = useState<any>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, u, c] = await Promise.all([
        api('/admin/assets', { token: accessToken }),
        api('/users', { token: accessToken }),
        api('/admin/asset-categories', { token: accessToken }).catch(() => []),
      ]);
      setItems(Array.isArray(d) ? d : []);
      setUsers(Array.isArray(u) ? u : []);
      setCategories(Array.isArray(c) ? c : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const submitData = { ...formData };
      if (submitData.assignedToUserId === '__unassigned') {
        submitData.assignedToUserId = '';
        submitData.assignedToName = '';
        submitData.status = 'available';
      }
      // Multiple assets can be assigned to the same user — no per-user limit
      if (editItem) { await api(`/admin/assets/${editItem.id}`, { method: 'PUT', body: submitData, token: accessToken }); }
      else { await api('/admin/assets', { method: 'POST', body: submitData, token: accessToken }); }
      toast.success('Saved'); setDialogOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const getUserName = (userId: string) => {
    if (!userId) return '—';
    const u = users.find(u => (u.userId || u.id) === userId);
    return u?.name || userId;
  };

  const getCategoryName = (item: any) => {
    if (item.category) return item.category;
    if (item.categoryId) {
      const cat = categories.find(c => c.id === item.categoryId);
      return cat?.name || item.categoryId;
    }
    return '—';
  };

  const handleSaveCategory = async () => {
    setSavingCategory(true);
    try {
      const submitData = { ...categoryFormData, status: categoryFormData.status || 'active' };
      if (editCategory) {
        await api(`/admin/asset-categories/${editCategory.id}`, { method: 'PUT', body: submitData, token: accessToken });
      } else {
        await api('/admin/asset-categories', { method: 'POST', body: submitData, token: accessToken });
      }
      toast.success('Category saved');
      setCategoryDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSavingCategory(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api(`/admin/asset-categories/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <Tabs value={subTab} onValueChange={(v: any) => setSubTab(v)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          {subTab === 'assets' && (
            <Button size="sm" onClick={() => { setEditItem(null); setFormData({ status: 'available' }); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />Add Asset
            </Button>
          )}
          {subTab === 'categories' && (
            <Button size="sm" onClick={() => { setEditCategory(null); setCategoryFormData({ status: 'active' }); setCategoryDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />Add Category
            </Button>
          )}
        </div>
        
        <TabsContent value="assets">
      <Card><CardContent className="p-0">
        {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Serial</TableHead><TableHead>Assigned To</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{items.map(i => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell><TableCell>{getCategoryName(i)}</TableCell><TableCell className="text-sm">{i.serialNumber || '—'}</TableCell>
                <TableCell className="text-sm">{i.assignedToName || getUserName(i.assignedToUserId) || '—'}</TableCell>
                <TableCell><Badge className={i.status === 'available' ? 'bg-green-100 text-green-800' : i.status === 'assigned' ? 'bg-blue-100 text-blue-800' : i.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}>{i.status}</Badge></TableCell>
                <TableCell><Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                    setEditItem(i);
                    const fd = { ...i };
                    // If asset has categoryId but no category name, resolve it
                    if (!fd.category && fd.categoryId) {
                      const cat = categories.find(c => c.id === fd.categoryId);
                      if (cat) fd.category = cat.name;
                    }
                    setFormData(fd);
                    setDialogOpen(true);
                  }}><Pencil className="w-3.5 h-3.5" /></Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card><CardContent className="p-0">
            {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{cat.description || '—'}</TableCell>
                      <TableCell>
                        <Badge className={cat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {cat.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0" 
                            onClick={() => {
                              setEditCategory(cat);
                              setCategoryFormData(cat);
                              setCategoryDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700" 
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No categories created yet. Click "Add Category" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Asset</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Name</Label><Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label className="text-xs">Category</Label>
              <Select value={formData.category || ''} onValueChange={v => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.status !== 'inactive').map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                  {categories.filter(c => c.status !== 'inactive').length === 0 && (
                    <SelectItem value="__none" disabled>No categories created yet</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Serial Number</Label><Input value={formData.serialNumber || ''} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} /></div>
            <div><Label className="text-xs">Assign To User</Label>
              <Select value={formData.assignedToUserId || ''} onValueChange={v => {
                if (v === '__unassigned') {
                  setFormData({ ...formData, assignedToUserId: '', assignedToName: '', status: 'available' });
                } else {
                  const u = users.find(u => (u.userId || u.id) === v);
                  setFormData({ ...formData, assignedToUserId: v, assignedToName: u?.name || '', status: 'assigned' });
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned">— Unassigned —</SelectItem>
                  {users.map(u => {
                    const uid = u.userId || u.id;
                    const assignedCount = items.filter(i => i.assignedToUserId === uid && i.status === 'assigned' && i.id !== editItem?.id).length;
                    return <SelectItem key={uid} value={uid}>{u.name} ({u.role}){assignedCount > 0 ? ` — ${assignedCount} asset${assignedCount > 1 ? 's' : ''}` : ''}</SelectItem>;
                  })}
                </SelectContent>
              </Select></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={formData.status || 'available'} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="retired">Retired</SelectItem></SelectContent>
              </Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editCategory ? 'Edit' : 'Add'} Asset Category</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Category Name</Label>
              <Input 
                value={categoryFormData.name || ''} 
                onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} 
                placeholder="e.g., Laptops, Monitors, Furniture" 
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea 
                value={categoryFormData.description || ''} 
                onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })} 
                placeholder="Optional description of this category" 
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={categoryFormData.status || 'active'} onValueChange={v => setCategoryFormData({ ...categoryFormData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={savingCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminAttendance() {
  const { accessToken } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [manualSettings, setManualSettings] = useState<any>({ enabled: true, mode: 'all', specificUsers: [] });
  const [showManualPanel, setShowManualPanel] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  const load = useCallback(async () => {
    try {
      const [att, usrs, manualS] = await Promise.all([
        api('/attendance/all', { token: accessToken }),
        api('/users', { token: accessToken }).catch(() => []),
        api('/manual-clock-settings', { token: accessToken }).catch(() => null),
      ]);
      setRecords(Array.isArray(att) ? att : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
      if (manualS) setManualSettings(manualS);
    } catch (e) { console.log('Attendance load error:', e); }
    setLoading(false);
  }, [accessToken]);

  const handleSaveManualSettings = async () => {
    setSavingManual(true);
    try {
      const res = await api('/manual-clock-settings', { method: 'PUT', body: manualSettings, token: accessToken });
      setManualSettings(res);
      toast.success('Manual clock visibility settings saved');
    } catch (e: any) { toast.error(e.message); }
    setSavingManual(false);
  };

  const toggleUserForManualClock = (userId: string) => {
    const current = manualSettings.specificUsers || [];
    if (current.includes(userId)) {
      setManualSettings({ ...manualSettings, specificUsers: current.filter((id: string) => id !== userId) });
    } else {
      setManualSettings({ ...manualSettings, specificUsers: [...current, userId] });
    }
  };

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const getUserName = (userId: string) => {
    const found = users.find(u => (u.userId || u.id) === userId);
    return found?.name || userId;
  };

  const getUserDept = (userId: string) => {
    const found = users.find(u => (u.userId || u.id) === userId);
    return found?.department || '—';
  };

  const filtered = records
    .filter(r => {
      if (viewMode === 'today') return r.date === dateFilter;
      return true;
    })
    .filter(r => {
      if (!search) return true;
      const name = r.employeeName || getUserName(r.userId) || '';
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => r.date === today);
  // "Present Today" and "Clocked Out" are date-scoped (today only)
  const presentToday = todayRecords.filter(r => r.clockIn).length;
  const clockedOutToday = todayRecords.filter(r => r.clockOut).length;
  // "Currently Working" and "Paused" are live states — include any open session regardless of date
  // (an employee who clocked in yesterday and never clocked out is still "Working")
  const currentlyWorking = records.filter(r => r.clockIn && !r.clockOut && !r.isPaused).length;
  const pausedToday = records.filter(r => r.isPaused).length;

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes && minutes !== 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Attendance Management</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showManualPanel ? 'default' : 'outline'} size="sm" onClick={() => setShowManualPanel(!showManualPanel)} className={showManualPanel ? 'bg-green-600 hover:bg-green-700' : ''}>
            <Play className="w-4 h-4 mr-1" />Manual Clock {manualSettings.enabled ? <Badge className="ml-1 bg-green-100 text-green-700 text-[9px]">ON</Badge> : <Badge className="ml-1 bg-gray-100 text-gray-600 text-[9px]">OFF</Badge>}
          </Button>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {showManualPanel && (
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Manual Clock-In / Clock-Out Visibility</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Enabled</span>
                <button
                  onClick={() => setManualSettings({ ...manualSettings, enabled: !manualSettings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${manualSettings.enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${manualSettings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            {manualSettings.enabled ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-green-700">Show To</Label>
                    <Select value={manualSettings.mode || 'all'} onValueChange={v => setManualSettings({ ...manualSettings, mode: v })}>
                      <SelectTrigger className="border-green-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="specific">Specific Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {manualSettings.mode === 'specific' && (
                  <div>
                    <Label className="text-xs text-green-700 mb-2 block">Select Users Who Can See Manual Clock</Label>
                    <div className="max-h-40 overflow-y-auto border border-green-200 rounded-lg p-2 bg-white space-y-1">
                      {users.map(u => {
                        const uid = u.userId || u.id;
                        const isSelected = (manualSettings.specificUsers || []).includes(uid);
                        return (
                          <label key={uid} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-green-50 ${isSelected ? 'bg-green-100' : ''}`}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleUserForManualClock(uid)} className="rounded border-green-300 text-green-600 focus:ring-green-500" />
                            <span className="text-sm">{u.name}</span>
                            <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-green-500 mt-1">{(manualSettings.specificUsers || []).length} selected</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <p className="text-xs text-green-600">Controls visibility of Clock In/Out buttons on all user dashboards.</p>
                  <Button onClick={handleSaveManualSettings} disabled={savingManual} className="bg-green-600 hover:bg-green-700">
                    {savingManual && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Manual clock-in/out buttons are hidden for all users. Toggle on to allow manual time tracking.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present Today', value: presentToday, icon: CheckCircle, color: 'from-green-500 to-green-600', text: 'text-green-600' },
          { label: 'Currently Working', value: currentlyWorking, icon: Clock, color: 'from-blue-500 to-blue-600', text: 'text-blue-600' },
          { label: 'Paused / Inactive', value: pausedToday, icon: AlertCircle, color: 'from-amber-500 to-amber-600', text: 'text-amber-600' },
          { label: 'Clocked Out', value: clockedOutToday, icon: Download, color: 'from-purple-500 to-purple-600', text: 'text-purple-600' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label}><CardContent className="pt-5 text-center">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} mx-auto mb-2 flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
              <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </CardContent></Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 border rounded-lg p-0.5">
          <button onClick={() => setViewMode('today')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'today' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>By Date</button>
          <button onClick={() => setViewMode('all')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>All Records</button>
        </div>
        {viewMode === 'today' && (
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
        )}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline">{filtered.length} record(s)</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400"><Clock className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No attendance records found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Work Time</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => {
                  const activeMin = r.regularMinutes || 0;
                  const otMin = r.overtimeMinutes || 0;
                  const totalMin = activeMin + otMin;
                  const statusLabel = r.isPaused ? 'Paused' : r.clockOut ? 'Completed' : r.clockIn ? 'Working' : 'No Record';
                  const statusClass = r.isPaused ? 'bg-amber-100 text-amber-800' : r.clockOut ? 'bg-green-100 text-green-800' : r.clockIn ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
                  return (
                    <TableRow key={`${r.userId}-${r.date}-${i}`}>
                      <TableCell className="font-medium">{r.employeeName || getUserName(r.userId)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{getUserDept(r.userId)}</TableCell>
                      <TableCell className="text-sm">{r.date || '—'}</TableCell>
                      <TableCell className="text-sm">{formatTime(r.clockIn)}</TableCell>
                      <TableCell className="text-sm">{formatTime(r.clockOut)}</TableCell>
                      <TableCell className="text-sm font-medium">{r.clockIn ? formatDuration(totalMin || (r.clockOut ? Math.round((new Date(r.clockOut).getTime() - new Date(r.clockIn).getTime()) / 60000) : null)) : '—'}</TableCell>
                      <TableCell className="text-sm">{otMin > 0 ? <Badge className="bg-orange-100 text-orange-800">{formatDuration(otMin)}</Badge> : '—'}</TableCell>
                      <TableCell><Badge className={statusClass}>{statusLabel}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminAnnouncements() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ priority: 'normal', targetAudience: 'all', targetDepartments: [] });
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, refData] = await Promise.all([
        api('/announcements', { token: accessToken }),
        api('/reference-data', { token: accessToken }).catch(() => ({})),
      ]);
      setItems(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
      if (refData?.departments) setDepartments(refData.departments);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        targetDepartments: formData.targetAudience === 'all' ? [] : (formData.targetDepartments || []),
        createdByRole: 'admin',
      };
      await api('/admin/announcements', { method: 'POST', body: payload, token: accessToken });
      toast.success('Published');
      setDialogOpen(false);
      setFormData({ priority: 'normal', targetAudience: 'all', targetDepartments: [] });
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const toggleDept = (name: string) => {
    const current = formData.targetDepartments || [];
    setFormData({ ...formData, targetDepartments: current.includes(name) ? current.filter((d: string) => d !== name) : [...current, name] });
  };

  const getTargetLabel = (item: any) => {
    if (!item.targetAudience || item.targetAudience === 'all') return 'All';
    if (item.targetDepartments?.length > 0) return `${item.targetDepartments.length} Dept${item.targetDepartments.length > 1 ? 's' : ''}`;
    return 'All';
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex justify-end"><Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />New</Button></div>
      {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : items.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-gray-400">No announcements</CardContent></Card>
      ) : items.map(i => (
        <Card key={i.id}><CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium">{i.title}</h3>
            <Badge className={i.priority === 'urgent' ? 'bg-red-100 text-red-800' : i.priority === 'important' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}>{i.priority}</Badge>
            <Badge className={(!i.targetAudience || i.targetAudience === 'all') ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}>{getTargetLabel(i)}</Badge>
          </div>
          <p className="text-sm text-gray-600">{i.content}</p>
          {i.targetDepartments?.length > 0 && i.targetAudience !== 'all' && (
            <div className="flex flex-wrap gap-1 mt-1">
              {i.targetDepartments.map((d: string) => <Badge key={d} variant="outline" className="text-xs">{d}</Badge>)}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{i.authorName} {'\u2022'} {new Date(i.createdAt).toLocaleDateString()}</p>
        </CardContent></Card>
      ))}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Title</Label><Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label className="text-xs">Content</Label><Textarea value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Priority</Label>
                <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="important">Important</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Target</Label>
                <Select value={formData.targetAudience || 'all'} onValueChange={v => setFormData({ ...formData, targetAudience: v, targetDepartments: v === 'all' ? [] : formData.targetDepartments })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Departments</SelectItem><SelectItem value="specific">Specific Department(s)</SelectItem></SelectContent></Select></div>
            </div>
            {formData.targetAudience === 'specific' && (
              <div>
                <Label className="text-xs">Select Departments</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1 mt-1">
                  {departments.length === 0 ? <p className="text-xs text-gray-400">No departments found</p> : departments.map((dept: any) => {
                    const name = dept.name || dept.id;
                    return (
                      <label key={dept.id || name} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                        <input type="checkbox" checked={(formData.targetDepartments || []).includes(name)} onChange={() => toggleDept(name)} className="rounded border-gray-300" />
                        {name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>Publish</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminProfileChangeRequests() {
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
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

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
    <div className="space-y-6 max-w-5xl">
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
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => setDetailDialog(r)}>View</Button>
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

function PendingApprovalsPanel() {
  const { accessToken } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [detailDialog, setDetailDialog] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/superadmin/pending-approvals', { token: accessToken });
      setApprovals(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.log('Failed to load approvals:', e);
      toast.error(e.message);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const res = await api(`/superadmin/approval/${requestId}/approve`, { method: 'POST', token: accessToken });
      toast.success(res.message || 'Approved successfully');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setProcessing(null);
  };

  const handleReject = async (requestId: string, reason: string) => {
    setProcessing(requestId);
    try {
      await api(`/superadmin/approval/${requestId}/reject`, { 
        method: 'POST', 
        body: { reason }, 
        token: accessToken 
      });
      toast.success('Request rejected');
      setDetailDialog(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setProcessing(null);
  };

  const pending = approvals.filter(a => a.status === 'pending');
  const processed = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Pending Approvals</h2>
          {pending.length > 0 && <Badge className="bg-amber-100 text-amber-800">{pending.length} pending</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : pending.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No pending approval requests</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {req.type === 'user_create' ? 'Create User' : req.type === 'user_update' ? 'Update User' : req.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{req.requestedByName}</p>
                        <p className="text-xs text-gray-400">{req.reason}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.type === 'user_create' && (
                        <div className="text-sm">
                          <p className="font-medium">{req.userData?.name}</p>
                          <p className="text-xs text-gray-500">{req.userData?.email} • {req.userData?.role}</p>
                          <p className="text-xs text-gray-500">{req.userData?.department}</p>
                        </div>
                      )}
                      {req.type === 'user_update' && (
                        <div className="text-sm">
                          <p className="font-medium">{req.userName}</p>
                          <p className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => setDetailDialog(req)}>View changes</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(req.id)}
                          disabled={processing === req.id}
                        >
                          {processing === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDetailDialog(req)}
                          disabled={processing === req.id}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {processed.length > 0 && (
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Processed Requests</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processed.slice(0, 10).map(req => (
                    <TableRow key={req.id}>
                      <TableCell><Badge variant="outline">{req.type === 'user_create' ? 'Create User' : 'Update User'}</Badge></TableCell>
                      <TableCell className="text-sm">{req.requestedByName}</TableCell>
                      <TableCell><Badge className={req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{req.status}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail/Reject Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Approval Request Details</DialogTitle></DialogHeader>
          {detailDialog && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">Requested by: {detailDialog.requestedByName}</p>
                <p className="text-xs text-gray-500">{detailDialog.reason}</p>
              </div>
              
              {detailDialog.type === 'user_update' && detailDialog.updates && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Proposed Changes:</p>
                  {Object.entries(detailDialog.updates).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-sm capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="text-right">
                        <p className="text-xs text-red-500 line-through">{detailDialog.currentData?.[key] || '(empty)'}</p>
                        <p className="text-xs text-green-600 font-medium">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {detailDialog.type === 'user_create' && detailDialog.userData && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">New User Details:</p>
                  <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                    <p className="text-sm"><span className="font-medium">Name:</span> {detailDialog.userData.name}</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> {detailDialog.userData.email}</p>
                    <p className="text-sm"><span className="font-medium">Role:</span> {detailDialog.userData.role}</p>
                    <p className="text-sm"><span className="font-medium">Department:</span> {detailDialog.userData.department || '—'}</p>
                    <p className="text-sm"><span className="font-medium">Position:</span> {detailDialog.userData.position || '—'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => handleReject(detailDialog.id, 'Rejected by SuperAdmin')}
              disabled={processing === detailDialog?.id}
            >
              {processing === detailDialog?.id && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Reject
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => { handleApprove(detailDialog.id); setDetailDialog(null); }}
              disabled={processing === detailDialog?.id}
            >
              {processing === detailDialog?.id && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminSettings() {
  const { accessToken } = useAuth();
  const { darkMode, toggleUserDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);

  // Auto-clock settings
  const [autoClockSettings, setAutoClockSettings] = useState<any>({ enabled: false, clockInTime: '08:00', clockOutTime: '17:00', mode: 'all', specificUsers: [], inactivityTimeout: 30 });
  const [savingAutoClock, setSavingAutoClock] = useState(false);

  useEffect(() => {
    api('/auto-clock-settings', { token: accessToken })
      .then((autoSettings) => {
        if (autoSettings) setAutoClockSettings(autoSettings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleSaveAutoClock = async () => {
    setSavingAutoClock(true);
    try {
      const res = await api('/auto-clock-settings', { method: 'PUT', body: autoClockSettings, token: accessToken });
      setAutoClockSettings(res);
      toast.success('Auto-clock settings saved');
    } catch (e: any) { toast.error(e.message); }
    setSavingAutoClock(false);
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Company Branding has been moved to SuperAdmin only */}

      {/* Appearance / Dark Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark interface</p>
            </div>
            <button
              aria-label={darkMode ? 'Disable dark mode' : 'Enable dark mode'}
              onClick={toggleUserDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Billing & Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-500" />Billing &amp; Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Manage your company's subscription, view billing history, and update payment details.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('/subscription', '_blank')}
              className="flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />Manage Subscription
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('/payment-verify', '_blank')}
              className="flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />Verify Payment
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Auto Clock-In / Clock-Out Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500" />Auto Clock Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Auto Clock-In / Clock-Out</p>
              <p className="text-xs text-muted-foreground">Automatically manage attendance for all or specific users</p>
            </div>
            <button
              aria-label={autoClockSettings.enabled ? 'Disable auto clock' : 'Enable auto clock'}
              onClick={() => setAutoClockSettings({ ...autoClockSettings, enabled: !autoClockSettings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoClockSettings.enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoClockSettings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {autoClockSettings.enabled && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Clock-In Time</Label>
                  <Input type="time" value={autoClockSettings.clockInTime || '08:00'} onChange={e => setAutoClockSettings({ ...autoClockSettings, clockInTime: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Clock-Out Time</Label>
                  <Input type="time" value={autoClockSettings.clockOutTime || '17:00'} onChange={e => setAutoClockSettings({ ...autoClockSettings, clockOutTime: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Idle Timeout (min)</Label>
                  <Input type="number" min="5" max="120" value={autoClockSettings.inactivityTimeout || 30} onChange={e => setAutoClockSettings({ ...autoClockSettings, inactivityTimeout: parseInt(e.target.value) || 30 })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Apply To</Label>
                <Select value={autoClockSettings.mode || 'all'} onValueChange={v => setAutoClockSettings({ ...autoClockSettings, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5 bg-muted rounded-lg p-3">
                <p>Auto clock-in when user opens the platform</p>
                <p>Auto-pause after {autoClockSettings.inactivityTimeout || 30} minutes of inactivity</p>
                <p>Auto clock-out at <strong>{autoClockSettings.clockOutTime || '17:00'}</strong> if still clocked in</p>
              </div>
              <Button onClick={handleSaveAutoClock} disabled={savingAutoClock} className="bg-purple-600 hover:bg-purple-700">
                {savingAutoClock && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Save Auto-Clock Settings
              </Button>
            </div>
          )}
          {!autoClockSettings.enabled && (
            <Button onClick={handleSaveAutoClock} disabled={savingAutoClock} variant="outline" size="sm">
              {savingAutoClock && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Save
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Display Language
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose the display language for your dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <LanguageSelector variant="card" />
          <p className="text-xs text-muted-foreground mt-3">
            Powered by Google Translate. Translations are approximate.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminHiring() {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [subTab, setSubTab] = useState<'postings' | 'applications'>('postings');
  const [postings, setPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ status: 'open', employmentType: 'Full Time', visibilityType: 'public_global', applicationNotificationEmails: '' });
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [otherDept, setOtherDept] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, d] = await Promise.all([
        api('/admin/job-postings', { token: accessToken }),
        api('/admin/departments', { token: accessToken }).catch(() => []),
      ]);
      setPostings(Array.isArray(p) ? p.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
      setDepartments(Array.isArray(d) ? d : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure roleTitle mirrors title for the public jobs endpoint compatibility
      // Normalize employment type to Title Case for HiringsPage filter compatibility
      const rawType = formData.employmentType || formData.type || '';
      const typeMap: Record<string, string> = {
        'full-time': 'Full Time', 'part-time': 'Part Time', 'contract': 'Contract', 'internship': 'Internship',
        'remote': 'Remote', 'hybrid': 'Hybrid',
      };
      const employmentType = typeMap[rawType.toLowerCase()] || rawType;
      // Auto-activate status when visibility is set to public_global
      const status = (formData.visibilityType === 'public_global' && !JOB_ACTIVE_STATUSES.has(formData.status))
        ? 'open'
        : (formData.status || 'open');
      const payload = {
        ...formData,
        roleTitle: formData.roleTitle || formData.title || '',
        companyName: formData.companyName || branding.companyName || '',
        employmentType,
        status,
      };
      if (editItem) {
        await api(`/admin/job-postings/${editItem.id}`, { method: 'PUT', body: payload, token: accessToken });
      } else {
        await api('/admin/job-postings', { method: 'POST', body: payload, token: accessToken });
      }
      toast.success(editItem ? 'Job posting updated' : 'Job posting created');
      setDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job posting?')) return;
    try { await api(`/admin/job-postings/${id}`, { method: 'DELETE', token: accessToken }); toast.success('Deleted'); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleToggleVisibility = async (posting: any) => {
    const newVisibility = posting.visibilityType === 'public_global' ? 'internal_only' : 'public_global';
    // Auto-activate status when making a posting public
    const newStatus = (newVisibility === 'public_global' && !JOB_ACTIVE_STATUSES.has(posting.status))
      ? 'open'
      : posting.status;
    try {
      await api(`/admin/job-postings/${posting.id}`, {
        method: 'PUT',
        body: { visibilityType: newVisibility, status: newStatus },
        token: accessToken,
      });
      toast.success(newVisibility === 'public_global'
        ? 'Job is now public — visible on the hiring board immediately'
        : 'Job is now internal only');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const openNew = () => {
    setEditItem(null);
    setFormData({ status: 'open', employmentType: 'Full Time', visibilityType: 'public_global', companyName: branding.companyName || '', applicationNotificationEmails: '' });
    setDialogOpen(true);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-amber-100 text-amber-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Hiring Management</h2>
        </div>
        <div className="flex gap-2 items-center">
          <a
            href="/hirings"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <Globe className="w-3.5 h-3.5" /><span>View Public Hiring Board</span><ExternalLink className="w-3 h-3" />
          </a>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />New Job Posting</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-green-600">{postings.filter(p => p.status === 'open').length}</p><p className="text-xs text-gray-500">Open Positions</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-blue-600">{postings.length}</p><p className="text-xs text-gray-500">Total Postings</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-amber-600">{postings.filter(p => p.status === 'closed').length}</p><p className="text-xs text-gray-500">Closed</p></CardContent></Card>
      </div>

      <div className="flex gap-1 border-b">
        <button onClick={() => setSubTab('postings')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === 'postings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Job Postings ({postings.length})</button>
        <button onClick={() => setSubTab('applications')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Applications</button>
      </div>

      {subTab === 'applications' ? (
        <HiringApprovalPanel />
      ) : (
        <Card>
          <CardContent className="p-0">
            {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : postings.length === 0 ? (
              <div className="py-16 text-center text-gray-400"><Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No job postings yet</p><Button size="sm" className="mt-3" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Create First Posting</Button></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead><TableHead>Department</TableHead><TableHead>Type</TableHead>
                    <TableHead>Location</TableHead><TableHead>Salary</TableHead><TableHead>Public Visibility</TableHead><TableHead>Status</TableHead><TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postings.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title || p.roleTitle || '—'}</TableCell>
                      <TableCell className="text-sm">{p.department || '—'}</TableCell>
                      <TableCell className="text-sm">{p.employmentType || p.type || '—'}</TableCell>
                      <TableCell className="text-sm">{p.location || '—'}</TableCell>
                      <TableCell className="text-sm">{p.salaryRange || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={p.visibilityType === 'public_global'}
                            onCheckedChange={() => handleToggleVisibility(p)}
                            aria-label={p.visibilityType === 'public_global' ? 'Make internal' : 'Make public'}
                          />
                          <span className={`text-xs font-medium ${p.visibilityType === 'public_global' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                            {p.visibilityType === 'public_global' ? 'Public' : 'Internal'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={statusColor(p.status)}>{p.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                            setEditItem(p);
                            setFormData({ ...p, visibilityType: p.visibilityType || 'public_global' });
                            const deptNames = departments.map(d => d.name);
                            if (p.department && p.department !== 'Other' && !deptNames.includes(p.department)) {
                              setOtherDept(p.department);
                            } else {
                              setOtherDept('');
                            }
                            setDialogOpen(true);
                          }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Create'} Job Posting</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Job Title / Role Title</Label><Input value={formData.title || formData.roleTitle || ''} onChange={e => setFormData({ ...formData, title: e.target.value, roleTitle: e.target.value })} placeholder="e.g., Software Engineer" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Department</Label>
                <Select value={(() => {
                  const v = formData.department || '';
                  const deptNames = departments.map((d: any) => d.name);
                  if (v === 'Other' || (v && !deptNames.includes(v))) return 'Other';
                  return v;
                })()} onValueChange={v => {
                  if (v === 'Other') {
                    setFormData({ ...formData, department: otherDept || 'Other' });
                  } else {
                    setFormData({ ...formData, department: v });
                    setOtherDept('');
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {(() => {
                  const v = formData.department || '';
                  const deptNames = departments.map((d: any) => d.name);
                  return (v === 'Other' || (v && !deptNames.includes(v)));
                })() && (
                  <Input className="mt-2" placeholder="Specify department..." value={otherDept || (formData.department !== 'Other' ? formData.department : '')} onChange={e => { setOtherDept(e.target.value); setFormData({ ...formData, department: e.target.value || 'Other' }); }} autoFocus />
                )}
              </div>
              <div><Label className="text-xs">Employment Type</Label>
                <Select value={formData.employmentType || formData.type || 'Full Time'} onValueChange={v => setFormData({ ...formData, employmentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                    <SelectItem value="Part Time">Part Time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Location</Label><Input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Remote / Lagos" /></div>
              <div><Label className="text-xs">Salary Range</Label><Input value={formData.salaryRange || ''} onChange={e => setFormData({ ...formData, salaryRange: e.target.value })} placeholder="e.g., $50K - $80K" /></div>
            </div>
            <div>
              <Label className="text-xs">Application Notification Emails</Label>
              <Input
                value={formData.applicationNotificationEmails || ''}
                onChange={e => setFormData({ ...formData, applicationNotificationEmails: e.target.value })}
                placeholder="e.g., hiring@company.com, hr@company.com"
              />
            </div>
            <div><Label className="text-xs">Job Description</Label><Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Detailed job description..." /></div>
            <div><Label className="text-xs">Requirements</Label><Textarea value={formData.requirements || ''} onChange={e => setFormData({ ...formData, requirements: e.target.value })} rows={2} placeholder="Required qualifications..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Visibility</Label>
                <Select value={formData.visibilityType || 'public_global'} onValueChange={v => setFormData({ ...formData, visibilityType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal_only">Internal Only</SelectItem>
                    <SelectItem value="public_global">Global (public job board)</SelectItem>
                  </SelectContent>
                </Select>
                {(formData.visibilityType === 'public_global' || !formData.visibilityType) && (
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    ✓ Will appear on the hiring board immediately — no approval needed.
                  </p>
                )}
              </div>
              <div><Label className="text-xs">Status</Label>
                <Select value={formData.status || 'open'} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{editItem ? 'Update' : 'Create Posting'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ GENERIC ADMIN CRUD PANEL ============

interface AdminEntityField {
  key: string;
  label: string;
  type?: 'select' | 'user-select' | 'user-multi-select' | 'date' | 'date-future' | 'time' | 'questions';
  options?: string[];
  defaultQuestions?: string[];
}

interface AdminEntityConfig {
  title: string;
  apiPrefix: string;
  fields: AdminEntityField[];
}

const ADMIN_ENTITY_CONFIGS: Record<string, AdminEntityConfig> = {
  workflows: {
    title: 'Workflows & Approvals',
    apiPrefix: '/admin/workflows',
    fields: [
      { key: 'name', label: 'Workflow Name' },
      { key: 'type', label: 'Type', type: 'select', options: ['leave', 'expense', 'purchase', 'hiring', 'promotion', 'termination', 'custom'] },
      { key: 'description', label: 'Description' },
      { key: 'approver1Id', label: 'First Approver', type: 'user-select' },
      { key: 'approver2Id', label: 'Second Approver', type: 'user-select' },
      { key: 'escalationDays', label: 'Escalation Days' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'draft'] },
    ],
  },
  'performance-reviews': {
    title: 'Performance Reviews',
    apiPrefix: '/admin/performance-reviews',
    fields: [
      { key: 'employeeIds', label: 'Employees', type: 'user-multi-select' },
      { key: 'reviewerId', label: 'Reviewer', type: 'user-select' },
      { key: 'period', label: 'Review Period' },
      { key: 'rating', label: 'Rating', type: 'select', options: ['1', '2', '3', '4', '5'] },
      { key: 'strengths', label: 'Strengths' },
      { key: 'improvements', label: 'Areas for Improvement' },
      { key: 'goals', label: 'Next Period Goals' },
      { key: 'goalDeadline', label: 'Goal Target Date', type: 'date-future' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'in-progress', 'completed', 'acknowledged'] },
    ],
  },
  disciplinary: {
    title: 'Disciplinary Cases',
    apiPrefix: '/admin/disciplinary-cases',
    fields: [
      { key: 'employeeIds', label: 'Employees', type: 'user-multi-select' },
      { key: 'type', label: 'Offense Type', type: 'select', options: ['misconduct', 'poor-performance', 'attendance', 'policy-violation', 'harassment', 'insubordination', 'other'] },
      { key: 'description', label: 'Description' },
      { key: 'incidentDate', label: 'Incident Date', type: 'date' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['minor', 'moderate', 'major', 'critical'] },
      { key: 'action', label: 'Disciplinary Action', type: 'select', options: ['verbal-warning', 'written-warning', 'suspension', 'probation', 'termination', 'none'] },
      { key: 'investigatorId', label: 'Investigator', type: 'user-select' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'investigating', 'resolved', 'appealed', 'closed'] },
    ],
  },
  compliance: {
    title: 'Labour Act Compliance',
    apiPrefix: '/admin/compliance-items',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'regulation', label: 'Regulation/Act' },
      { key: 'category', label: 'Category', type: 'select', options: ['employment', 'safety', 'wages', 'discrimination', 'benefits', 'record-keeping', 'other'] },
      { key: 'description', label: 'Description' },
      { key: 'dueDate', label: 'Compliance Due Date', type: 'date' },
      { key: 'assignedTo', label: 'Assigned Employees', type: 'user-multi-select' },
      { key: 'status', label: 'Status', type: 'select', options: ['compliant', 'non-compliant', 'in-progress', 'pending-review', 'overdue'] },
    ],
  },
  tasks: {
    title: 'Task Assignments',
    apiPrefix: '/admin/tasks',
    fields: [
      { key: 'title', label: 'Task Title' },
      { key: 'description', label: 'Description' },
      { key: 'assignedToIds', label: 'Assigned To Employees', type: 'user-multi-select' },
      { key: 'assignedBy', label: 'Assigned By', type: 'user-select' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'category', label: 'Category', type: 'select', options: ['project', 'maintenance', 'review', 'documentation', 'training', 'other'] },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'completed', 'overdue', 'cancelled'] },
    ],
  },
  'feedback-360': {
    title: '360\u00b0 Feedback',
    apiPrefix: '/admin/feedback',
    fields: [
      { key: 'employeeIds', label: 'Employees', type: 'user-multi-select' },
      { key: 'reviewerId', label: 'Reviewer', type: 'user-select' },
      { key: 'type', label: 'Feedback Type', type: 'select', options: ['peer', 'manager', 'self', 'direct-report', 'external'] },
      { key: 'period', label: 'Period' },
      { key: 'communication', label: 'Communication (1-5)' },
      { key: 'teamwork', label: 'Teamwork (1-5)' },
      { key: 'leadership', label: 'Leadership (1-5)' },
      { key: 'technical', label: 'Technical Skills (1-5)' },
      { key: 'comments', label: 'Comments' },
      { key: 'customQuestions', label: 'Custom Questions', type: 'questions', defaultQuestions: [
        'What are this person\'s greatest strengths?',
        'What areas could this person improve?',
        'How effectively does this person collaborate with the team?',
        'Rate this person\'s communication skills and provide examples.',
        'Any additional feedback or suggestions?',
      ] },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'submitted', 'reviewed'] },
    ],
  },
  training: {
    title: 'Training Programs',
    apiPrefix: '/admin/training-program',
    fields: [
      { key: 'name', label: 'Program Name' },
      { key: 'type', label: 'Type', type: 'select', options: ['onboarding', 'technical', 'soft-skills', 'compliance', 'leadership', 'safety', 'custom'] },
      { key: 'description', label: 'Description' },
      { key: 'instructorId', label: 'Instructor', type: 'user-select' },
      { key: 'duration', label: 'Duration (hours)' },
      { key: 'participantIds', label: 'Participants', type: 'user-multi-select' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'assessmentQuestions', label: 'Assessment Questions', type: 'questions', defaultQuestions: [
        'What did you learn from this training program?',
        'How will you apply these skills in your daily work?',
        'Rate the effectiveness of the training materials (1-5).',
        'What improvements would you suggest for this program?',
        'Would you recommend this training to colleagues? Why?',
      ] },
      { key: 'status', label: 'Status', type: 'select', options: ['planned', 'active', 'completed', 'cancelled'] },
    ],
  },
};

function AdminCrudPanel({ entityKey }: { entityKey: string }) {
  const { accessToken } = useAuth();
  const config = ADMIN_ENTITY_CONFIGS[entityKey];
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [viewItem, setViewItem] = useState<any>(null);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(config.apiPrefix, { token: accessToken });
      setItems(Array.isArray(data) ? data : []);
      if (config.fields.some(f => f.type === 'user-select' || f.type === 'user-multi-select')) {
        const users = await api('/users', { token: accessToken });
        setAllUsers(Array.isArray(users) ? users : []);
      }
    } catch (e) { console.log(`Admin load ${entityKey} error:`, e); }
    setLoading(false);
  }, [accessToken, config.apiPrefix, entityKey]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const submitData = { ...formData };
      // Clean up __unassigned for task fields
      if (submitData.assignedTo === '__unassigned') { submitData.assignedTo = ''; submitData.assignedToId = ''; submitData.assigneeId = ''; }
      if (submitData.assignedBy === '__unassigned') { submitData.assignedBy = ''; submitData.assignedById = ''; }
      // Clean up __unassigned for any user-select field
      config.fields.forEach(f => {
        if (f.type === 'user-select' && submitData[f.key] === '__unassigned') {
          submitData[f.key] = '';
        }
      });
      // Handle "Other" custom values
      config.fields.forEach(f => {
        if (f.type === 'select' && f.options && submitData[f.key] === 'other' && otherTexts[f.key]) {
          submitData[f.key] = otherTexts[f.key];
        }
      });

      if (editItem) {
        await api(`${config.apiPrefix}/${editItem.id}`, { method: 'PUT', body: submitData, token: accessToken });
        toast.success(`Updated successfully`);
      } else {
        await api(config.apiPrefix, { method: 'POST', body: submitData, token: accessToken });
        toast.success(`Created successfully`);
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api(`${config.apiPrefix}/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted');
      load();
    } catch (e: any) { toast.error(e.message || 'Delete failed'); }
  };

  const getUserName = (userId: string) => {
    if (!userId) return '';
    const u = allUsers.find(u => (u.userId || u.id) === userId);
    return u?.name || userId;
  };

  const renderValue = (field: AdminEntityField, val: any) => {
    if (!val) return <span className="text-gray-400">—</span>;
    if (field.type === 'user-select') {
      return getUserName(val) || val;
    }
    if (field.type === 'user-multi-select') {
      if (Array.isArray(val) && val.length > 0) {
        return (
          <div className="flex flex-wrap gap-1">
            {val.slice(0, 2).map((uid: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {getUserName(uid) || uid}
              </Badge>
            ))}
            {val.length > 2 && (
              <Badge variant="outline" className="text-xs bg-gray-100">
                +{val.length - 2}
              </Badge>
            )}
          </div>
        );
      }
      return <span className="text-gray-400">—</span>;
    }
    if (field.type === 'questions') {
      if (Array.isArray(val)) return `${val.length} question(s)`;
      return '—';
    }
    return String(val);
  };

  const getSelectValue = (field: AdminEntityField): string => {
    const val = formData[field.key] || '';
    // For task assignedTo/assignedBy, use companion ID field
    if (field.key === 'assignedTo' || field.key === 'assignedBy') {
      return formData[field.key + 'Id'] || formData.assigneeId || (() => { const mu = allUsers.find(u => u.name === formData[field.key]); return mu ? (mu.userId || mu.id) : ''; })() || '';
    }
    return val;
  };

  const getSelectDisplayValue = (field: AdminEntityField, value: string) => {
    if (!value || !field.options) return value || '';
    if (field.options.includes(value)) return value;
    return 'other';
  };

  const singularTitle = config.title.replace(/ies$/, 'y').replace(/ses$/, 'se').replace(/s$/, '');

  const toggleSort = (fKey: string) => {
    if (sortField === fKey) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(fKey); setSortDir('asc'); }
  };

  const filtered = items.filter(i => {
    if (!search) return true;
    const s = search.toLowerCase();
    return config.fields.some(f => {
      const raw = String(i[f.key] || '').toLowerCase();
      if (raw.includes(s)) return true;
      // Also search by resolved user name for user-select fields
      if (f.type === 'user-select' && i[f.key]) {
        const resolved = getUserName(i[f.key]).toLowerCase();
        if (resolved.includes(s)) return true;
        // Also check stored name fields (e.g. employeeName, approver1Name)
        const nameKey = f.key.replace(/Id$/, 'Name');
        if (i[nameKey] && String(i[nameKey]).toLowerCase().includes(s)) return true;
      }
      return false;
    });
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const aV = String(a[sortField] || ''); const bV = String(b[sortField] || '');
    return sortDir === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  // Extract unique values for filters
  const uniqueStatuses = [...new Set(items.map(i => i.status).filter(Boolean))];
  const sortOptions = config.fields.slice(0, 5).map(f => ({ value: f.key, label: f.label }));
  const { branding } = useBranding();

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{config.title}</h2>
          <p className="text-sm text-gray-500">{items.length} {items.length === 1 ? singularTitle.toLowerCase() : config.title.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" onClick={() => { setEditItem(null); setFormData({}); setOtherTexts({}); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add {singularTitle}</Button>
        </div>
      </div>

      <ListControls
        searchValue={search}
        onSearchChange={setSearch}
        sortField={sortField}
        sortDir={sortDir}
        sortOptions={sortOptions}
        onSortChange={setSortField}
        onToggleSortDir={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
        onExportCSV={() => {
          const csvData = sorted.map(item => {
            const row: any = {};
            config.fields.forEach(f => {
              row[f.label] = f.type === 'user-select' ? getUserName(item[f.key]) : (item[f.key] || '');
            });
            return row;
          });
          exportToCSV(csvData, config.title.toLowerCase().replace(/\s+/g, '-'));
        }}
        onExportPDF={() => {
          exportToPDF(
            config.title,
            sorted,
            config.fields.slice(0, 5).map(f => f.key),
            branding.companyName
          );
        }}
        placeholder={`Search ${config.title.toLowerCase()}...`}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {config.fields.slice(0, 5).map(f => (
                <TableHead key={f.key} className="cursor-pointer select-none" onClick={() => toggleSort(f.key)}>
                  <div className="flex items-center gap-1">
                    {f.label}
                    {sortField === f.key && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-10">No {config.title.toLowerCase()} found</TableCell></TableRow>
            ) : sorted.map(item => (
              <TableRow key={item.id}>
                {config.fields.slice(0, 5).map(f => (
                  <TableCell key={f.key}>
                    {f.key === 'status' || f.key === 'severity' || f.key === 'priority' ? (
                      <Badge className={
                        item[f.key] === 'active' || item[f.key] === 'completed' || item[f.key] === 'compliant' || item[f.key] === 'resolved' ? 'bg-green-100 text-green-800' :
                        item[f.key] === 'pending' || item[f.key] === 'draft' || item[f.key] === 'in-progress' || item[f.key] === 'investigating' ? 'bg-blue-100 text-blue-800' :
                        item[f.key] === 'overdue' || item[f.key] === 'non-compliant' || item[f.key] === 'critical' || item[f.key] === 'urgent' || item[f.key] === 'major' ? 'bg-red-100 text-red-800' :
                        item[f.key] === 'high' || item[f.key] === 'moderate' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }>{item[f.key]}</Badge>
                    ) : renderValue(f, item[f.key])}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewItem(item)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                      setEditItem(item);
                      setFormData({ ...item });
                      const ot: Record<string, string> = {};
                      config.fields.forEach(f => {
                        if (f.type === 'select' && f.options && item[f.key] && !f.options.includes(item[f.key])) {
                          ot[f.key] = item[f.key];
                        }
                      });
                      setOtherTexts(ot);
                      setDialogOpen(true);
                    }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>View {singularTitle}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              {config.fields.map(f => (
                <div key={f.key}>
                  <Label className="text-xs text-gray-500">{f.label}</Label>
                  {f.type === 'questions' && Array.isArray(viewItem[f.key]) ? (
                    <div className="space-y-1.5 mt-1">
                      {viewItem[f.key].map((q: string, idx: number) => (
                        <div key={idx} className="text-xs bg-gray-50 rounded px-2 py-1.5">
                          <span className="text-gray-400 font-mono mr-1">Q{idx + 1}.</span> {q}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium">{renderValue(f, viewItem[f.key])}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
            <Button onClick={() => {
              setViewItem(null); setEditItem(viewItem); setFormData({ ...viewItem });
              const ot: Record<string, string> = {};
              config.fields.forEach(f => {
                if (f.type === 'select' && f.options && viewItem[f.key] && !f.options.includes(viewItem[f.key])) {
                  ot[f.key] = viewItem[f.key];
                }
              });
              setOtherTexts(ot);
              setDialogOpen(true);
            }}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? `Edit ${singularTitle}` : `Add ${singularTitle}`}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {config.fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs font-medium">{f.label}</Label>
                {f.type === 'select' ? (
                  <div className="space-y-1">
                    <Select value={getSelectDisplayValue(f, formData[f.key] || '')} onValueChange={v => {
                      if (v === 'other') {
                        setFormData({ ...formData, [f.key]: 'other' });
                      } else {
                        setFormData({ ...formData, [f.key]: v });
                        setOtherTexts(prev => { const n = { ...prev }; delete n[f.key]; return n; });
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder={`Select ${f.label.toLowerCase()}`} /></SelectTrigger>
                      <SelectContent>
                        {f.options!.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).replace(/-/g, ' ')}</SelectItem>)}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {(formData[f.key] === 'other' || (formData[f.key] && f.options && !f.options.includes(formData[f.key]))) && (
                      <Input
                        placeholder={`Enter custom ${f.label.toLowerCase()}`}
                        value={otherTexts[f.key] || (formData[f.key] !== 'other' ? formData[f.key] : '') || ''}
                        onChange={e => {
                          setOtherTexts({ ...otherTexts, [f.key]: e.target.value });
                          setFormData({ ...formData, [f.key]: e.target.value || 'other' });
                        }}
                      />
                    )}
                  </div>
                ) : f.type === 'user-select' ? (
                  <Select value={getSelectValue(f)} onValueChange={v => {
                    const updates: any = { [f.key]: v };
                    // For task assignedTo/assignedBy, store name + userId
                    if (f.key === 'assignedTo' || f.key === 'assignedBy') {
                      if (v === '__unassigned' || !v) {
                        updates[f.key] = '';
                        updates[f.key + 'Id'] = '';
                        if (f.key === 'assignedTo') updates.assigneeId = '';
                      } else {
                        const selectedUser = allUsers.find(u => (u.userId || u.id) === v);
                        if (selectedUser) {
                          updates[f.key] = selectedUser.name;
                          updates[f.key + 'Id'] = v;
                          if (f.key === 'assignedTo') updates.assigneeId = v;
                        }
                      }
                    }
                    // For fields ending in Id, store the name too
                    if (f.key.endsWith('Id') && f.key !== 'assignedToUserId') {
                      const selUser = allUsers.find(u => (u.userId || u.id) === v);
                      const nameKey = f.key.replace(/Id$/, 'Name');
                      updates[nameKey] = (v && v !== '__unassigned' && selUser) ? selUser.name : '';
                    }
                    setFormData({ ...formData, ...updates });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned">— Unassigned —</SelectItem>
                      {allUsers.map(u => {
                        const uid = u.userId || u.id;
                        return <SelectItem key={uid} value={uid}>{u.name} ({u.role})</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                ) : f.type === 'user-multi-select' ? (
                  <div className="border rounded-lg bg-background dark:bg-gray-800">
                    <div className="flex items-center justify-between px-2 py-1.5 border-b dark:border-gray-700">
                      <span className="text-xs text-muted-foreground">{(Array.isArray(formData[f.key]) ? formData[f.key].length : 0)} of {allUsers.length} selected</span>
                      <div className="flex gap-1">
                        <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => {
                          const allIds = allUsers.map(u => u.userId || u.id);
                          const allNames = allUsers.map(u => u.name || '');
                          setFormData({ ...formData, [f.key]: allIds, [f.key.replace(/Ids$/, 'Names')]: allNames });
                        }}>Select All</button>
                        <span className="text-xs text-muted-foreground">·</span>
                        <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => {
                          setFormData({ ...formData, [f.key]: [], [f.key.replace(/Ids$/, 'Names')]: [] });
                        }}>Clear</button>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                      {allUsers.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2">No users loaded</p>
                      ) : allUsers.map(u => {
                        const uid = u.userId || u.id;
                        const selected = Array.isArray(formData[f.key]) ? formData[f.key].includes(uid) : false;
                        return (
                          <label key={uid} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-accent dark:hover:bg-gray-700 ${selected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                            <input type="checkbox" checked={selected} onChange={() => {
                              const current = Array.isArray(formData[f.key]) ? [...formData[f.key]] : [];
                              const updated = selected ? current.filter(id => id !== uid) : [...current, uid];
                              const names = updated.map(id => { const found = allUsers.find(u => (u.userId || u.id) === id); return found?.name || id; });
                              setFormData({ ...formData, [f.key]: updated, [f.key.replace(/Ids$/, 'Names')]: names });
                            }} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm dark:text-gray-200">{u.name}</span>
                            <Badge variant="outline" className="text-[10px] dark:border-gray-600 dark:text-gray-300">{u.role}</Badge>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : f.type === 'questions' ? (
                  <div className="space-y-2">
                    <div className="border rounded-lg p-3 bg-accent/50 space-y-2 max-h-60 overflow-y-auto">
                      {(Array.isArray(formData[f.key]) && formData[f.key].length > 0 ? formData[f.key] : f.defaultQuestions || []).map((q: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 group">
                          <span className="text-xs text-muted-foreground font-mono mt-2.5 min-w-[20px]">Q{idx + 1}</span>
                          <Input
                            value={q}
                            onChange={e => {
                              const qs = Array.isArray(formData[f.key]) && formData[f.key].length > 0 ? [...formData[f.key]] : [...(f.defaultQuestions || [])];
                              qs[idx] = e.target.value;
                              setFormData({ ...formData, [f.key]: qs });
                            }}
                            className="flex-1 text-sm"
                            placeholder={`Question ${idx + 1}`}
                          />
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 h-9 px-2"
                            onClick={() => {
                              const qs = Array.isArray(formData[f.key]) && formData[f.key].length > 0 ? [...formData[f.key]] : [...(f.defaultQuestions || [])];
                              qs.splice(idx, 1);
                              setFormData({ ...formData, [f.key]: qs });
                            }}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      {(!formData[f.key] || formData[f.key].length === 0) && (!f.defaultQuestions || f.defaultQuestions.length === 0) && (
                        <p className="text-xs text-gray-400 text-center py-3">No questions added yet</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        const qs = Array.isArray(formData[f.key]) && formData[f.key].length > 0 ? [...formData[f.key]] : [...(f.defaultQuestions || [])];
                        qs.push('');
                        setFormData({ ...formData, [f.key]: qs });
                      }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />Add Question
                      </Button>
                      {Array.isArray(formData[f.key]) && formData[f.key].length > 0 && (
                        <Button type="button" variant="ghost" size="sm" className="text-xs text-gray-400" onClick={() => {
                          setFormData({ ...formData, [f.key]: [...(f.defaultQuestions || [])] });
                        }}>Reset to Defaults</Button>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {(Array.isArray(formData[f.key]) && formData[f.key].length > 0 ? formData[f.key] : f.defaultQuestions || []).length} question(s)
                      </span>
                    </div>
                  </div>
                ) : f.type === 'date' ? (
                  <Input type="date" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
                ) : f.type === 'date-future' ? (
                  <Input type="date" min={new Date().toISOString().slice(0, 10)} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
                ) : f.type === 'time' ? (
                  <Input type="time" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
                ) : f.label.includes('Description') || f.label.includes('Notes') || f.label.includes('Comments') || f.label.includes('Requirements') || f.label.includes('Improvements') || f.label.includes('Strengths') || f.label.includes('Goals') ? (
                  <Textarea value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} rows={3} placeholder={`Enter ${f.label.toLowerCase()}`} />
                ) : (
                  <Input value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={`Enter ${f.label.toLowerCase()}`} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editItem ? 'Update' : `Create ${singularTitle}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;

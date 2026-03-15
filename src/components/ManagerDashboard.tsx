import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, UserPlus, CalendarDays, Clock, Megaphone,
  Loader2, Plus, X, CheckCircle, Copy, AlertCircle, MessageCircle, Pencil, Search,
  Trash2, User, Settings, Briefcase, LogOut
} from 'lucide-react';
import { MessagesPanel } from './MessagesPanel';
import { MessagesModal } from './MessagesModal';
import { NotificationsBell } from './NotificationsBell';
import { SharedMyProfile } from './SharedMyProfile';
import { SharedSelfServiceHub } from './SharedSelfServiceHub';
import { ClockInOut } from './ClockInOut';
import { MeetingsPanel } from './MeetingsPanel';
import { useBranding, brandGradientStyle } from '../lib/branding-context';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { UserLicenseAlert } from './LicenseStatusBanner';

function TeamTab() {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    role: 'all',
    department: 'all',
    status: 'all',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editUser, setEditUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tempPw, setTempPw] = useState('');
  const [showTempPw, setShowTempPw] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, ref] = await Promise.all([api('/users', { token: accessToken }), api('/reference-data', { token: accessToken }).catch(() => ({}))]);
      setUsers(Array.isArray(data) ? data : []);
      setCompanies(ref?.companies || []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        await api(`/users/${editUser.userId || editUser.id}`, { method: 'PUT', body: JSON.stringify(formData), token: accessToken });
        toast.success('Updated'); setDialogOpen(false);
      } else {
        const res = await api('/manager/employees', { method: 'POST', body: JSON.stringify({ ...formData, role: 'employee' }), token: accessToken });
        setTempPw(res.tempPassword); setShowTempPw(true); toast.success('Employee created');
      }
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  // Get unique values for filters
  const uniqueRoles = Array.from(new Set(users.map(u => u.role).filter(Boolean)));
  const uniqueDepartments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'department', label: 'Department' },
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'role',
      label: 'Role',
      options: uniqueRoles.map(r => ({ value: r, label: r })),
    },
    {
      key: 'department',
      label: 'Department',
      options: uniqueDepartments.map(d => ({ value: d, label: d })),
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  // Apply filtering and sorting
  const filteredAndSorted = users
    .filter(u => {
      const matchSearch = !searchTerm || 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterValues.role === 'all' || u.role === filterValues.role;
      const matchDept = filterValues.department === 'all' || u.department === filterValues.department;
      const matchStatus = filterValues.status === 'all' || (u.status || 'active') === filterValues.status;
      return matchSearch && matchRole && matchDept && matchStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => { setEditUser(null); setFormData({}); setShowTempPw(false); setDialogOpen(true); }}><UserPlus className="w-4 h-4 mr-1" />Add Employee</Button>
      </div>
      
      <ListControls
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        sortField={sortField}
        sortDir={sortDir}
        sortOptions={sortOptions}
        onSortChange={setSortField}
        onToggleSortDir={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
        filters={filterOptions}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
        onClearFilters={() => setFilterValues({ role: 'all', department: 'all', status: 'all' })}
        onExportCSV={() => exportToCSV(
          filteredAndSorted.map(u => ({
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Department: u.department || '',
            Position: u.position || '',
            Status: u.status || 'active',
          })),
          'team-members'
        )}
        onExportPDF={() => exportToPDF(
          'Team Members Report',
          filteredAndSorted,
          ['name', 'email', 'role', 'department', 'status'],
          branding.companyName
        )}
        placeholder="Search team members..."
      />

      <Card><CardContent className="p-0">
        {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filteredAndSorted.map(u => (
              <TableRow key={u.userId || u.id}>
                <TableCell className="font-medium">{u.name}</TableCell><TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell><TableCell className="text-sm">{u.department || '—'}</TableCell>
                <TableCell><Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : ''}>{u.status || 'active'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditUser(u); setFormData({ ...u }); setShowTempPw(false); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    {u.role === 'employee' && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" title="Request deletion" onClick={() => { setDeleteTarget(u); setDeleteReason(''); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}

function LeaveTab() {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: 'all',
    leaveType: 'all',
  });

  useEffect(() => { 
    api('/leave-requests', { token: accessToken })
      .then(d => setLeaves(Array.isArray(d) ? d : []))
      .catch(console.log)
      .finally(() => setLoading(false)); 
  }, [accessToken]);

  const handleAction = async (id: string, status: string) => {
    try { 
      await api(`/leave-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }), token: accessToken }); 
      toast.success(`Leave ${status}`); 
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l)); 
    }
    catch (e: any) { toast.error(e.message); }
  };

  // Get unique values for filters
  const uniqueLeaveTypes = Array.from(new Set(leaves.map(l => l.leaveType).filter(Boolean)));

  // Sort options
  const sortOptions = [
    { value: 'createdAt', label: 'Date Requested' },
    { value: 'employeeName', label: 'Employee Name' },
    { value: 'startDate', label: 'Start Date' },
    { value: 'leaveType', label: 'Leave Type' },
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      key: 'leaveType',
      label: 'Leave Type',
      options: uniqueLeaveTypes.map(t => ({ value: t, label: t })),
    },
  ];

  // Apply filtering and sorting
  const filteredAndSorted = leaves
    .filter(l => {
      const matchSearch = !searchTerm || 
        l.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterValues.status === 'all' || l.status === filterValues.status;
      const matchType = filterValues.leaveType === 'all' || l.leaveType === filterValues.leaveType;
      return matchSearch && matchStatus && matchType;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle date sorting
      if (sortField === 'createdAt' || sortField === 'startDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-4">
      <ListControls
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        sortField={sortField}
        sortDir={sortDir}
        sortOptions={sortOptions}
        onSortChange={setSortField}
        onToggleSortDir={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
        filters={filterOptions}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
        onClearFilters={() => setFilterValues({ status: 'all', leaveType: 'all' })}
        onExportCSV={() => exportToCSV(
          filteredAndSorted.map(l => ({
            Employee: l.employeeName,
            'Leave Type': l.leaveType || '',
            'Start Date': l.startDate,
            'End Date': l.endDate,
            Reason: l.reason || '',
            Status: l.status,
            'Requested On': new Date(l.createdAt).toLocaleDateString(),
          })),
          'leave-requests'
        )}
        onExportPDF={() => exportToPDF(
          'Leave Requests Report',
          filteredAndSorted,
          ['employeeName', 'leaveType', 'startDate', 'endDate', 'status'],
          branding.companyName
        )}
        placeholder="Search leave requests..."
      />

      <Card><CardContent className="p-0">
        {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : filteredAndSorted.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No leave requests found</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Dates</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filteredAndSorted.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.employeeName}</TableCell>
                <TableCell>{l.leaveType || '—'}</TableCell>
                <TableCell className="text-sm">{l.startDate} → {l.endDate}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{l.reason || '—'}</TableCell>
                <TableCell><Badge className={l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{l.status}</Badge></TableCell>
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

export function ManagerDashboard() {
  const { user, accessToken, logout } = useAuth();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState('overview');
  const [showMessages, setShowMessages] = useState(false);

  const handleNavigation = (section: string) => {
    setActiveTab(section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-30 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6" style={{ color: branding.primaryColor }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: branding.primaryColor }}>
                {branding.companyName}
              </h1>
              <p className="text-xs text-gray-500">Manager Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <Button variant="ghost" size="sm" onClick={() => setShowMessages(!showMessages)}>
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('profile')}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 bg-white border-r min-h-screen p-4 space-y-1">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'team' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('team')}
          >
            <Users className="w-4 h-4 mr-2" />
            My Team
          </Button>
          <Button
            variant={activeTab === 'leave' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('leave')}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Leave Requests
          </Button>
          <Button
            variant={activeTab === 'attendance' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('attendance')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Clock In/Out
          </Button>
          <Button
            variant={activeTab === 'announcements' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('announcements')}
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Announcements
          </Button>
          <Button
            variant={activeTab === 'meetings' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('meetings')}
          >
            <Users className="w-4 h-4 mr-2" />
            Meetings
          </Button>
          <Button
            variant={activeTab === 'self-service' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('self-service')}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Self Service
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-4 h-4 mr-2" />
            My Profile
          </Button>
        </nav>

        <main className="flex-1 p-6">
          {/* License Status Alert for Non-SuperAdmin Users */}
          <UserLicenseAlert />
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Team Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" style={{ color: branding.primaryColor }}>—</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pending Leave Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" style={{ color: branding.primaryColor }}>—</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" style={{ color: branding.primaryColor }}>—</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'leave' && <LeaveTab />}
          {activeTab === 'attendance' && <ClockInOut />}
          {activeTab === 'announcements' && (
            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">No announcements to display.</p>
              </CardContent>
            </Card>
          )}
          {activeTab === 'meetings' && <MeetingsPanel mode="employee" />}
          {activeTab === 'self-service' && <SharedSelfServiceHub onNavigate={handleNavigation} />}
          {activeTab === 'profile' && <SharedMyProfile />}
        </main>
      </div>

      {showMessages && (
        <MessagesModal open={showMessages} onOpenChange={setShowMessages} />
      )}
    </div>
  );
}

export default ManagerDashboard;
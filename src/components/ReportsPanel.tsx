import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import {
  Loader2, Download, FileText, Printer, Users, Clock, Search, RefreshCw, BarChart3, PieChart, TrendingUp, CalendarDays, Building2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartPie, Pie, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { useBranding } from '../lib/branding-context';
import { ClientOnlyChart } from './ClientOnlyChart';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];

function exportToExcel(title: string, headers: string[], rows: string[][]) {
  let csv = headers.join(',') + '\n';
  for (const row of rows) csv += row.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success('Report exported as CSV/Excel');
}

function printReport(title: string, headers: string[], rows: string[][], chartHtml = '', companyName = 'Blumebyte') {
  const w = window.open('', '_blank');
  if (!w) { toast.error('Popup blocked'); return; }
  const tableRows = rows.map(r => '<tr>' + r.map(c => `<td>${c || '\u2014'}</td>`).join('') + '</tr>').join('');
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;margin:20px;} h1{font-size:18px;margin-bottom:4px;} .sub{font-size:11px;color:#888;margin-bottom:16px;} table{width:100%;border-collapse:collapse;font-size:12px;} th,td{padding:6px 8px;border:1px solid #ddd;text-align:left;} th{background:#f5f5f5;font-weight:600;} tr:nth-child(even){background:#fafafa;} .footer{margin-top:20px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:8px;} .chart-section{margin:16px 0;page-break-inside:avoid;} .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;} .stat-box{border:1px solid #eee;border-radius:8px;padding:12px;text-align:center;} .stat-box .val{font-size:24px;font-weight:700;} .stat-box .lbl{font-size:11px;color:#666;}
  </style></head><body><h1>${companyName} HR \u2014 ${title}</h1><p class="sub">Generated on ${new Date().toLocaleString()}</p>${chartHtml}<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table><div class="footer">${companyName} HRIS Report</div><script>window.onload=function(){window.print();}</script></body></html>`);
  w.document.close();
}

type ReportTab = 'overview' | 'users' | 'attendance' | 'departments' | 'leave';

export function ReportsPanel() {
  const { accessToken, user } = useAuth();
  const { branding } = useBranding();
  const [activeReport, setActiveReport] = useState<ReportTab>('overview');
  const [usersData, setUsersData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [departmentsData, setDepartmentsData] = useState<any[]>([]);
  const [leavesData, setLeavesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [managerDepartment, setManagerDepartment] = useState<string>('');
  const [managerDepartments, setManagerDepartments] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, a, d, l, profile] = await Promise.all([
        api('/reports/users', { token: accessToken }).catch(() => []),
        api('/reports/attendance', { token: accessToken }).catch(() => []),
        api('/admin/departments', { token: accessToken }).catch(() => []),
        api('/leave-requests', { token: accessToken }).catch(() => []),
        api('/profile', { token: accessToken }).catch(() => null),
      ]);
      
      const myDept = profile?.department || '';
      const myDepts = profile?.departments || (profile?.department ? [profile.department] : []);
      setManagerDepartment(myDept);
      setManagerDepartments(myDepts);
      
      // Filter data by manager's departments for Manager role
      const isManager = user?.role === 'manager';
      setUsersData(Array.isArray(u) ? (isManager ? u.filter(usr => {
        const userDepts = usr.departments || (usr.department ? [usr.department] : []);
        return myDepts.some((dept: string) => userDepts.includes(dept));
      }) : u) : []);
      setAttendanceData(Array.isArray(a) ? (isManager ? a.filter(att => myDepts.includes(att.department)) : a) : []);
      setDepartmentsData(Array.isArray(d) ? (isManager ? d.filter(dept => myDepts.includes(dept.name)) : d) : []);
      setLeavesData(Array.isArray(l) ? (isManager ? l.filter(lv => myDepts.includes(lv.department)) : l) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken, user?.role]);

  useEffect(() => { load(); }, [load]);
  
  // Real-time subscription to Supabase broadcasts for instant updates
  useEffect(() => {
    const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
    const channel = supabase.channel('reports-changes');
    
    channel.on('broadcast', { event: 'data-changed' }, () => {
      console.log('📊 Reports: Real-time update received, reloading data...');
      load();
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Computed analytics
  const roleDistribution = (() => {
    const map: Record<string, number> = {};
    usersData.forEach(u => { map[u.role || 'unknown'] = (map[u.role || 'unknown'] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  })();

  const deptDistribution = (() => {
    const map: Record<string, number> = {};
    usersData.forEach(u => { const d = u.department || 'Unassigned'; map[d] = (map[d] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  })();

  const attendanceTrend = (() => {
    const map: Record<string, { date: string; count: number; hours: number }> = {};
    attendanceData.forEach(a => {
      if (!a.date) return;
      if (!map[a.date]) map[a.date] = { date: a.date, count: 0, hours: 0 };
      map[a.date].count++;
      map[a.date].hours += parseFloat(a.totalHours) || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  })();

  const leaveBreakdown = (() => {
    const map: Record<string, number> = {};
    leavesData.forEach(l => { const t = l.leaveType || l.type || 'Other'; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const leaveStatus = (() => {
    const map: Record<string, number> = {};
    leavesData.forEach(l => { const s = l.status || 'unknown'; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  })();

  const statusDistribution = (() => {
    const map: Record<string, number> = {};
    usersData.forEach(u => { const s = u.status || 'active'; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  })();

  const totalHoursAll = usersData.reduce((s, u) => s + (parseFloat(u.totalHoursWorked) || 0), 0);
  const totalAttDays = usersData.reduce((s, u) => s + (u.attendanceDays || 0), 0);

  const filteredUsers = usersData.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
  const filteredAttendance = attendanceData.filter(a => {
    if (search && !a.employeeName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFilter && a.date !== dateFilter) return false;
    return true;
  });

  const handlePrintOverview = () => {
    const statHtml = `<div class="stat-grid">
      <div class="stat-box"><div class="val" style="color:#3b82f6">${usersData.length}</div><div class="lbl">Total Employees</div></div>
      <div class="stat-box"><div class="val" style="color:#10b981">${departmentsData.length}</div><div class="lbl">Departments</div></div>
      <div class="stat-box"><div class="val" style="color:#f59e0b">${totalAttDays}</div><div class="lbl">Total Att. Days</div></div>
      <div class="stat-box"><div class="val" style="color:#8b5cf6">${totalHoursAll.toFixed(0)}</div><div class="lbl">Total Hours</div></div>
    </div>
    <div class="chart-section"><h3>Role Distribution</h3><table><tr><th>Role</th><th>Count</th></tr>${roleDistribution.map(r => `<tr><td>${r.name}</td><td>${r.value}</td></tr>`).join('')}</table></div>
    <div class="chart-section"><h3>Department Distribution</h3><table><tr><th>Department</th><th>Employees</th></tr>${deptDistribution.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('')}</table></div>
    <div class="chart-section"><h3>Leave Breakdown</h3><table><tr><th>Type</th><th>Count</th></tr>${leaveBreakdown.map(l => `<tr><td>${l.name}</td><td>${l.value}</td></tr>`).join('')}</table></div>`;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Employees', String(usersData.length)],
      ['Active Employees', String(usersData.filter(u => u.status === 'active').length)],
      ['Departments', String(departmentsData.length)],
      ['Total Attendance Days', String(totalAttDays)],
      ['Total Hours Worked', totalHoursAll.toFixed(1)],
      ['Pending Leaves', String(leavesData.filter(l => l.status === 'pending').length)],
    ];
    printReport('HR Overview Report', headers, rows, statHtml, branding.companyName);
  };

  const handleExportUsers = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Company', 'Position', 'Status', 'Attendance Days', 'Total Hours', 'Join Date'];
    const rows = filteredUsers.map(u => [u.name, u.email, u.role, u.department, u.company, u.position, u.status, String(u.attendanceDays), u.totalHoursWorked, u.joinDate ? new Date(u.joinDate).toLocaleDateString() : '']);
    exportToExcel('Employee_Report', headers, rows);
  };

  const handlePrintUsers = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Company', 'Status', 'Att. Days', 'Hours'];
    const rows = filteredUsers.map(u => [u.name, u.email, u.role, u.department, u.company, u.status, String(u.attendanceDays), u.totalHoursWorked]);
    printReport('Employee Report', headers, rows, '', branding.companyName);
  };

  const handleExportAttendance = () => {
    const headers = ['Employee', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'];
    const rows = filteredAttendance.map(a => [a.employeeName, a.date, a.clockIn, a.clockOut || '', a.totalHours || '', a.status || '']);
    exportToExcel('Attendance_Report', headers, rows);
  };

  const handlePrintAttendance = () => {
    const headers = ['Employee', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'];
    const rows = filteredAttendance.map(a => [a.employeeName, a.date, a.clockIn, a.clockOut || '', a.totalHours || '', a.status || '']);
    printReport('Attendance Report', headers, rows, '', branding.companyName);
  };

  const handlePrintLeave = () => {
    const headers = ['Employee', 'Type', 'Start', 'End', 'Reason', 'Status'];
    const rows = leavesData.map(l => [l.employeeName || l.userName || '', l.leaveType || l.type || '', l.startDate || '', l.endDate || '', l.reason || '', l.status || '']);
    const chartHtml = `<div class="chart-section"><h3>Leave Status Summary</h3><table><tr><th>Status</th><th>Count</th></tr>${leaveStatus.map(s => `<tr><td>${s.name}</td><td>${s.value}</td></tr>`).join('')}</table></div>`;
    printReport('Leave Report', headers, rows, chartHtml, branding.companyName);
  };

  const reportTabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
  ];

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Reports & Analytics</h2>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <div className="flex gap-1 border-b pb-0">
        {reportTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setActiveReport(t.id); setSearch(''); setDateFilter(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeReport === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
        <>
          {/* ===== OVERVIEW ===== */}
          {activeReport === 'overview' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handlePrintOverview}><Printer className="w-3.5 h-3.5 mr-1" />Print Overview</Button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Employees', value: usersData.length, color: 'text-blue-600', bg: 'from-blue-500 to-blue-600', icon: Users },
                  { label: 'Departments', value: departmentsData.length, color: 'text-green-600', bg: 'from-green-500 to-green-600', icon: Building2 },
                  { label: 'Attendance Days', value: totalAttDays, color: 'text-amber-600', bg: 'from-amber-500 to-amber-600', icon: Clock },
                  { label: 'Total Hours', value: totalHoursAll.toFixed(0) + 'h', color: 'text-purple-600', bg: 'from-purple-500 to-purple-600', icon: TrendingUp },
                ].map(c => {
                  const Icon = c.icon;
                  return (
                    <Card key={c.label}>
                      <CardContent className="pt-5 text-center">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} mx-auto mb-2 flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
                        <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                        <p className="text-xs text-gray-500">{c.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieChart className="w-4 h-4 text-blue-500" />Role Distribution</CardTitle></CardHeader>
                  <CardContent>
                    {roleDistribution.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
                      <ClientOnlyChart fallback={<div className="h-[220px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                        <ResponsiveContainer width="100%" height={220}>
                          <RechartPie>
                            <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {roleDistribution.map((entry, i) => <Cell key={`role-cell-${entry.name}-${i}`} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </RechartPie>
                        </ResponsiveContainer>
                      </ClientOnlyChart>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-green-500" />Employees by Department</CardTitle></CardHeader>
                  <CardContent>
                    {deptDistribution.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
                      <ClientOnlyChart fallback={<div className="h-[220px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={deptDistribution} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid key="grid-dept" strokeDasharray="3 3" />
                            <XAxis key="xaxis-dept" type="number" />
                            <YAxis key="yaxis-dept" dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip key="tooltip-dept" />
                            <Bar key="bar-dept" dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ClientOnlyChart>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" />Attendance Trend (Last 14 Days)</CardTitle></CardHeader>
                  <CardContent>
                    {attendanceTrend.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
                      <ClientOnlyChart fallback={<div className="h-[220px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={attendanceTrend}>
                            <CartesianGrid key="grid-attend" strokeDasharray="3 3" />
                            <XAxis key="xaxis-attend" dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                            <YAxis key="yaxis-attend" tick={{ fontSize: 11 }} />
                            <Tooltip key="tooltip-attend" />
                            <Legend key="legend-attend" />
                            <Area key="area-count" type="monotone" dataKey="count" name="Attendance" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.3} />
                            <Area key="area-hours" type="monotone" dataKey="hours" name="Hours" stroke="#10b981" fill="#6ee7b7" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ClientOnlyChart>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieChart className="w-4 h-4 text-purple-500" />Leave by Type</CardTitle></CardHeader>
                  <CardContent>
                    {leaveBreakdown.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
                      <ClientOnlyChart fallback={<div className="h-[220px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                        <ResponsiveContainer width="100%" height={220}>
                          <RechartPie>
                            <Pie key="pie-leave" data={leaveBreakdown} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                              {leaveBreakdown.map((entry, i) => <Cell key={`leave-${entry.name}-${i}`} fill={COLORS[(i + 3) % COLORS.length]} />)}
                            </Pie>
                            <Tooltip key="tooltip-leave" />
                          </RechartPie>
                        </ResponsiveContainer>
                      </ClientOnlyChart>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-red-500" />Employee Status & Leave Status</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">Employee Status</p>
                        {statusDistribution.map((s, i) => (
                          <div key={s.name} className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm flex-1">{s.name}</span>
                            <span className="text-sm font-bold">{s.value}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">Leave Status</p>
                        {leaveStatus.map((s, i) => (
                          <div key={s.name} className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(i + 4) % COLORS.length] }} />
                            <span className="text-sm flex-1">{s.name}</span>
                            <span className="text-sm font-bold">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ===== EMPLOYEES REPORT ===== */}
          {activeReport === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-base">Employee Report</CardTitle><p className="text-sm text-gray-500">{filteredUsers.length} employees</p></div>
                  <div className="flex items-center gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 w-48 text-sm" /></div>
                    <Button variant="outline" size="sm" onClick={handleExportUsers}><Download className="w-3.5 h-3.5 mr-1" />Excel</Button>
                    <Button variant="outline" size="sm" onClick={handlePrintUsers}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Att. Days</TableHead><TableHead>Hours</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.userId}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                        <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                        <TableCell className="text-sm">{u.department || '\u2014'}</TableCell>
                        <TableCell className="text-sm">{u.company || '\u2014'}</TableCell>
                        <TableCell><Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{u.status || 'active'}</Badge></TableCell>
                        <TableCell className="text-sm font-medium">{u.attendanceDays}</TableCell>
                        <TableCell className="text-sm font-medium">{u.totalHoursWorked}h</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ===== ATTENDANCE REPORT ===== */}
          {activeReport === 'attendance' && (
            <div className="space-y-4">
              {attendanceTrend.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Daily Attendance Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ClientOnlyChart fallback={<div className="h-[200px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={attendanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" name="Records" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ClientOnlyChart>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div><CardTitle className="text-base">Attendance Report</CardTitle><p className="text-sm text-gray-500">{filteredAttendance.length} records</p></div>
                    <div className="flex items-center gap-2">
                      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 w-40 text-sm" /></div>
                      <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-8 w-36 text-sm" />
                      {dateFilter && <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDateFilter('')}>Clear</Button>}
                      <Button variant="outline" size="sm" onClick={handleExportAttendance}><Download className="w-3.5 h-3.5 mr-1" />Excel</Button>
                      <Button variant="outline" size="sm" onClick={handlePrintAttendance}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead><TableHead>Total Hours</TableHead><TableHead>Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendance.slice(0, 100).map((a, i) => (
                        <TableRow key={a.id || i}>
                          <TableCell className="font-medium">{a.employeeName}</TableCell>
                          <TableCell className="text-sm">{a.date}</TableCell>
                          <TableCell className="text-sm">{a.clockIn || '\u2014'}</TableCell>
                          <TableCell className="text-sm">{a.clockOut || '\u2014'}</TableCell>
                          <TableCell className="text-sm font-medium">{a.totalHours ? `${a.totalHours}h` : '\u2014'}</TableCell>
                          <TableCell><Badge className={a.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>{a.status || 'active'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== DEPARTMENTS REPORT ===== */}
          {activeReport === 'departments' && (
            <div className="space-y-4">
              {deptDistribution.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Employee Count by Department</CardTitle></CardHeader>
                  <CardContent>
                    <ClientOnlyChart fallback={<div className="h-[250px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={deptDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" name="Employees" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ClientOnlyChart>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Departments ({departmentsData.length})</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => {
                      const headers = ['Name', 'Head', 'Status', 'Employees'];
                      const rows = departmentsData.map(d => [d.name, d.headOfDepartment || '', d.status || 'active', String(usersData.filter(u => u.department === d.name).length)]);
                      printReport('Department Report', headers, rows, '', branding.companyName);
                    }}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Department</TableHead><TableHead>Head</TableHead><TableHead>Status</TableHead><TableHead>Employees</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentsData.map(d => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell className="text-sm">{d.headOfDepartment || '\u2014'}</TableCell>
                          <TableCell><Badge className={d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>{d.status || 'active'}</Badge></TableCell>
                          <TableCell className="text-sm font-medium">{usersData.filter(u => u.department === d.name).length}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== LEAVE REPORT ===== */}
          {activeReport === 'leave' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {leaveBreakdown.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Leave by Type</CardTitle></CardHeader>
                    <CardContent>
                      <ClientOnlyChart fallback={<div className="h-[200px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                        <ResponsiveContainer width="100%" height={200}>
                          <RechartPie>
                            <Pie data={leaveBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                              {leaveBreakdown.map((entry, i) => <Cell key={`leave-bd-${entry.name}-${i}`} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </RechartPie>
                        </ResponsiveContainer>
                      </ClientOnlyChart>
                    </CardContent>
                  </Card>
                )}
                {leaveStatus.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Leave by Status</CardTitle></CardHeader>
                    <CardContent>
                      <ClientOnlyChart fallback={<div className="h-[200px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={leaveStatus}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                              {leaveStatus.map((entry, i) => <Cell key={`status-${entry.name}-${i}`} fill={COLORS[(i + 2) % COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ClientOnlyChart>
                    </CardContent>
                  </Card>
                )}
              </div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div><CardTitle className="text-base">Leave Records ({leavesData.length})</CardTitle></div>
                    <Button variant="outline" size="sm" onClick={handlePrintLeave}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {leavesData.slice(0, 100).map((l, i) => (
                        <TableRow key={l.id || i}>
                          <TableCell className="font-medium">{l.employeeName || l.userName || '\u2014'}</TableCell>
                          <TableCell className="text-sm">{l.leaveType || l.type || '\u2014'}</TableCell>
                          <TableCell className="text-sm">{l.startDate || '\u2014'}</TableCell>
                          <TableCell className="text-sm">{l.endDate || '\u2014'}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{l.reason || '\u2014'}</TableCell>
                          <TableCell>
                            <Badge className={l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{l.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
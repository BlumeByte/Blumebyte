import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import {
  Loader2, Download, FileText, Calendar, Users, Clock, Filter, RefreshCw,
  TrendingUp, BarChart3, Printer
} from 'lucide-react';
import { exportToCSV, exportToPDF } from './ListControls';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export function ComprehensiveReports() {
  const { accessToken } = useAuth();
  const [activeReport, setActiveReport] = useState<'attendance' | 'leave' | 'users'>('attendance');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any[]>([]);
  
  // Filters
  const [attendanceFilters, setAttendanceFilters] = useState({
    period: 'month', // day, week, month
    employeeName: '',
    date: new Date().toISOString().slice(0, 10)
  });
  
  const [leaveFilters, setLeaveFilters] = useState({
    status: 'all', // all, approved, pending, rejected
    period: 'month',
    employeeName: '',
    date: new Date().toISOString().slice(0, 10)
  });
  
  const [userFilters, setUserFilters] = useState({
    status: 'all', // all, active, inactive, on-leave
    name: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [att, leave, users] = await Promise.all([
        api('/attendance/all', { token: accessToken }).catch(() => []),
        api('/leave-requests', { token: accessToken }).catch(() => []),
        api('/users', { token: accessToken }).catch(() => []),
      ]);
      setAttendanceData(Array.isArray(att) ? att : []);
      setLeaveData(Array.isArray(leave) ? leave : []);
      setUserData(Array.isArray(users) ? users : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  // Helper to get date range based on period
  const getDateRange = (date: string, period: string) => {
    const d = new Date(date);
    if (period === 'day') {
      return { start: date, end: date };
    } else if (period === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day;
      const sunday = new Date(d.setDate(diff));
      const saturday = new Date(sunday);
      saturday.setDate(saturday.getDate() + 6);
      return { start: sunday.toISOString().slice(0, 10), end: saturday.toISOString().slice(0, 10) };
    } else { // month
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { start: firstDay.toISOString().slice(0, 10), end: lastDay.toISOString().slice(0, 10) };
    }
  };

  // Filter attendance
  const filteredAttendance = attendanceData.filter(a => {
    const range = getDateRange(attendanceFilters.date, attendanceFilters.period);
    const matchesDate = a.date >= range.start && a.date <= range.end;
    const matchesName = !attendanceFilters.employeeName || 
      a.userName?.toLowerCase().includes(attendanceFilters.employeeName.toLowerCase()) ||
      a.employeeName?.toLowerCase().includes(attendanceFilters.employeeName.toLowerCase());
    return matchesDate && matchesName;
  });

  // Filter leave
  const filteredLeave = leaveData.filter(l => {
    const range = getDateRange(leaveFilters.date, leaveFilters.period);
    const matchesDate = (l.startDate >= range.start && l.startDate <= range.end) ||
                       (l.endDate >= range.start && l.endDate <= range.end);
    const matchesStatus = leaveFilters.status === 'all' || l.status === leaveFilters.status;
    const matchesName = !leaveFilters.employeeName || 
      l.employeeName?.toLowerCase().includes(leaveFilters.employeeName.toLowerCase()) ||
      l.userName?.toLowerCase().includes(leaveFilters.employeeName.toLowerCase());
    return matchesDate && matchesStatus && matchesName;
  });

  // Filter users
  const filteredUsers = userData.filter(u => {
    const matchesStatus = userFilters.status === 'all' || u.status === userFilters.status;
    const matchesName = !userFilters.name || u.name?.toLowerCase().includes(userFilters.name.toLowerCase());
    return matchesStatus && matchesName;
  });

  // Export handlers
  const exportAttendanceCSV = () => {
    exportToCSV(
      filteredAttendance.map(a => ({
        Employee: a.employeeName || a.userName,
        Date: a.date,
        'Clock In': a.clockIn || '—',
        'Clock Out': a.clockOut || '—',
        'Total Hours': a.totalHours || '—',
        Status: a.status || '—',
      })),
      `attendance-report-${attendanceFilters.period}`
    );
  };

  const exportLeaveCSV = () => {
    exportToCSV(
      filteredLeave.map(l => ({
        Employee: l.employeeName || l.userName,
        'Leave Type': l.leaveType,
        'Start Date': l.startDate,
        'End Date': l.endDate,
        Days: l.days || '',
        Status: l.status,
        Reason: l.reason || '—',
      })),
      `leave-report-${leaveFilters.period}`
    );
  };

  const exportUsersCSV = () => {
    exportToCSV(
      filteredUsers.map(u => ({
        Name: u.name,
        Email: u.email,
        Role: u.role,
        Department: u.department || '—',
        Position: u.position || '—',
        Status: u.status || 'active',
        'Joined Date': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—',
      })),
      'users-report'
    );
  };

  // Attendance stats
  const attendanceStats = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter(a => a.clockIn).length,
    late: filteredAttendance.filter(a => a.status === 'late').length,
    absent: filteredAttendance.filter(a => a.status === 'absent').length,
  };

  // Leave stats
  const leaveStats = {
    total: filteredLeave.length,
    approved: filteredLeave.filter(l => l.status === 'approved').length,
    pending: filteredLeave.filter(l => l.status === 'pending').length,
    rejected: filteredLeave.filter(l => l.status === 'rejected').length,
  };

  // User stats
  const userStats = {
    total: filteredUsers.length,
    active: filteredUsers.filter(u => u.status === 'active').length,
    inactive: filteredUsers.filter(u => u.status === 'inactive').length,
    onLeave: filteredUsers.filter(u => u.status === 'on-leave').length,
  };

  // Chart data
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Attendance by employee chart data
  const attendanceByEmployee = Object.values(
    filteredAttendance.reduce((acc: any, a) => {
      const name = a.employeeName || a.userName || 'Unknown';
      if (!acc[name]) acc[name] = { name, present: 0, late: 0, absent: 0 };
      if (a.clockIn) acc[name].present++;
      if (a.status === 'late') acc[name].late++;
      if (a.status === 'absent') acc[name].absent++;
      return acc;
    }, {})
  );

  // Leave by type chart data
  const leaveByType = Object.values(
    filteredLeave.reduce((acc: any, l) => {
      const type = l.leaveType || 'Other';
      if (!acc[type]) acc[type] = { name: type, count: 0 };
      acc[type].count++;
      return acc;
    }, {})
  );

  // Leave status pie chart
  const leaveStatusData = [
    { name: 'Approved', value: leaveStats.approved, color: '#10b981' },
    { name: 'Pending', value: leaveStats.pending, color: '#f59e0b' },
    { name: 'Rejected', value: leaveStats.rejected, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // User by department
  const usersByDepartment = Object.values(
    filteredUsers.reduce((acc: any, u) => {
      const dept = u.department || 'Unassigned';
      if (!acc[dept]) acc[dept] = { name: dept, count: 0 };
      acc[dept].count++;
      return acc;
    }, {})
  );

  // User by role
  const usersByRole = Object.values(
    filteredUsers.reduce((acc: any, u) => {
      const role = u.role || 'employee';
      if (!acc[role]) acc[role] = { name: role, count: 0 };
      acc[role].count++;
      return acc;
    }, {})
  );

  // Print handlers
  const printReport = () => {
    window.print();
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Comprehensive Reports</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={printReport} className="print:hidden"><Printer className="w-4 h-4 mr-1" />Print Report</Button>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'attendance', label: 'Attendance Reports', icon: Clock },
          { id: 'leave', label: 'Leave Reports', icon: Calendar },
          { id: 'users', label: 'User Reports', icon: Users }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveReport(t.id as any)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeReport === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Attendance Report */}
      {activeReport === 'attendance' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-blue-600">{attendanceStats.total}</p><p className="text-xs text-gray-500">Total Records</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p><p className="text-xs text-gray-500">Present</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-amber-600">{attendanceStats.late}</p><p className="text-xs text-gray-500">Late</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p><p className="text-xs text-gray-500">Absent</p></CardContent></Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" />Filters</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Period</Label>
                  <Select value={attendanceFilters.period} onValueChange={v => setAttendanceFilters({ ...attendanceFilters, period: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" className="h-9 date-time-input" value={attendanceFilters.date} onChange={e => setAttendanceFilters({ ...attendanceFilters, date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Employee Name</Label>
                  <Input className="h-9" placeholder="Search by name..." value={attendanceFilters.employeeName} onChange={e => setAttendanceFilters({ ...attendanceFilters, employeeName: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <Button size="sm" variant="outline" className="w-full" onClick={exportAttendanceCSV}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {filteredAttendance.length === 0 ? (
                <div className="py-16 text-center text-gray-400"><Clock className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No attendance records found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{a.employeeName || a.userName || '—'}</TableCell>
                        <TableCell className="text-sm">{a.date}</TableCell>
                        <TableCell className="text-sm">{a.clockIn || '—'}</TableCell>
                        <TableCell className="text-sm">{a.clockOut || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{a.totalHours || '—'}</TableCell>
                        <TableCell>
                          <Badge className={
                            a.status === 'present' ? 'bg-green-100 text-green-800' :
                            a.status === 'late' ? 'bg-amber-100 text-amber-800' :
                            a.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>{a.status || 'present'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Charts */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={attendanceByEmployee}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#10b981" />
                      <Bar dataKey="late" fill="#f59e0b" />
                      <Bar dataKey="absent" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Leave Report */}
      {activeReport === 'leave' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-blue-600">{leaveStats.total}</p><p className="text-xs text-gray-500">Total Requests</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-green-600">{leaveStats.approved}</p><p className="text-xs text-gray-500">Approved</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-amber-600">{leaveStats.pending}</p><p className="text-xs text-gray-500">Pending</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-red-600">{leaveStats.rejected}</p><p className="text-xs text-gray-500">Rejected</p></CardContent></Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" />Filters</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={leaveFilters.status} onValueChange={v => setLeaveFilters({ ...leaveFilters, status: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Period</Label>
                  <Select value={leaveFilters.period} onValueChange={v => setLeaveFilters({ ...leaveFilters, period: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" className="h-9 date-time-input" value={leaveFilters.date} onChange={e => setLeaveFilters({ ...leaveFilters, date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Employee Name</Label>
                  <Input className="h-9" placeholder="Search by name..." value={leaveFilters.employeeName} onChange={e => setLeaveFilters({ ...leaveFilters, employeeName: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <Button size="sm" variant="outline" className="w-full" onClick={exportLeaveCSV}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {filteredLeave.length === 0 ? (
                <div className="py-16 text-center text-gray-400"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No leave requests found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeave.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.employeeName || l.userName || '—'}</TableCell>
                        <TableCell className="text-sm">{l.leaveType || '—'}</TableCell>
                        <TableCell className="text-sm">{l.startDate}</TableCell>
                        <TableCell className="text-sm">{l.endDate}</TableCell>
                        <TableCell className="text-sm font-medium">{l.days || '—'}</TableCell>
                        <TableCell>
                          <Badge className={
                            l.status === 'approved' ? 'bg-green-100 text-green-800' :
                            l.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }>{l.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{l.reason || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Charts */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={leaveByType}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={leaveStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leaveStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* User Report */}
      {activeReport === 'users' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-blue-600">{userStats.total}</p><p className="text-xs text-gray-500">Total Users</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-green-600">{userStats.active}</p><p className="text-xs text-gray-500">Active</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-gray-600">{userStats.inactive}</p><p className="text-xs text-gray-500">Inactive</p></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold text-purple-600">{userStats.onLeave}</p><p className="text-xs text-gray-500">On Leave</p></CardContent></Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" />Filters</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={userFilters.status} onValueChange={v => setUserFilters({ ...userFilters, status: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input className="h-9" placeholder="Search by name..." value={userFilters.name} onChange={e => setUserFilters({ ...userFilters, name: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <Button size="sm" variant="outline" className="w-full" onClick={exportUsersCSV}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="py-16 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No users found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.userId || u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                        <TableCell className="text-sm">{u.department || '—'}</TableCell>
                        <TableCell className="text-sm">{u.position || '—'}</TableCell>
                        <TableCell>
                          <Badge className={
                            u.status === 'active' ? 'bg-green-100 text-green-800' :
                            u.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            u.status === 'on-leave' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }>{u.status || 'active'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Charts */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={usersByDepartment}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={usersByRole}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { NativeSelect } from './ui/native-select';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ClientOnlyChart } from './ClientOnlyChart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  FileSpreadsheet,
  TrendingUp,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';
import { exportToCSV, exportToPDF } from './ListControls';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../lib/currency-context';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

interface ReportData {
  employees?: any[];
  attendance?: any[];
  leaves?: any[];
  payroll?: any[];
  performance?: any[];
  training?: any[];
  assets?: any[];
  [key: string]: any;
}

export function AdvancedReportsModule() {
  const { user, accessToken } = useAuth();
  const { currencySymbol } = useCurrency();
  const role = user?.role;
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({});
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');

  const fetchReportData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      
      // Fetch all necessary data in parallel using the same endpoints as ReportsPanel
      const [employees, attendance, leaves, payroll, performance, ref] = await Promise.all([
        api('/reports/users', { token: accessToken }).catch((err) => { console.error('Failed to fetch employees:', err); return []; }),
        api('/reports/attendance', { token: accessToken }).catch((err) => { console.error('Failed to fetch attendance:', err); return []; }),
        api('/leave-requests', { token: accessToken }).catch((err) => { console.error('Failed to fetch leaves:', err); return []; }),
        api('/payroll-runs', { token: accessToken }).catch((err) => { console.error('Failed to fetch payroll:', err); return []; }),
        api('/performance-reviews', { token: accessToken }).catch((err) => { console.error('Failed to fetch performance:', err); return []; }),
        api('/reference-data', { token: accessToken }).catch((err) => { console.error('Failed to fetch reference data:', err); return {}; }),
      ]);

      const refData = ref || {};
      const companiesList = Array.isArray(refData.companies) ? refData.companies : [];
      const departmentsList = Array.isArray(refData.departments) ? refData.departments : [];
      const assetsList = Array.isArray(refData.assets) ? refData.assets : [];

      setReportData({
        employees: Array.isArray(employees) ? employees : [],
        attendance: Array.isArray(attendance) ? attendance : [],
        leaves: Array.isArray(leaves) ? leaves : [],
        payroll: Array.isArray(payroll) ? payroll : [],
        performance: Array.isArray(performance) ? performance : [],
        training: [],
        assets: assetsList,
        companies: companiesList,
        departments: departmentsList,
      });
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchReportData();
    }
  }, [accessToken, fetchReportData]);
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => fetchReportData(), 30000);
    return () => clearInterval(interval);
  }, [accessToken, fetchReportData]);

  // Real-time subscription to Supabase broadcasts for instant updates
  useEffect(() => {
    if (!accessToken) return;
    const channel = supabase.channel('advanced-reports-changes');
    
    channel.on('broadcast', { event: 'data-changed' }, () => {
      fetchReportData();
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [accessToken, fetchReportData]);

  // Filter data by date range, department, and company
  const filterData = (data: any[]) => {
    if (!data) return [];
    
    return data.filter((item) => {
      // Date filter
      if (item.date || item.createdAt) {
        const itemDate = new Date(item.date || item.createdAt);
        if (itemDate < dateRange.from || itemDate > dateRange.to) {
          return false;
        }
      }

      // Department filter
      if (selectedDepartment !== 'all' && item.department !== selectedDepartment) {
        return false;
      }

      // Company filter
      if (selectedCompany !== 'all' && item.company !== selectedCompany && item.companyId !== selectedCompany) {
        return false;
      }

      return true;
    });
  };

  // Overview metrics
  const filteredEmployees = filterData(reportData.employees || []);
  const filteredAttendance = filterData(reportData.attendance || []);
  const filteredLeaves = filterData(reportData.leaves || []);
  const filteredPayroll = filterData(reportData.payroll || []);

  const overviewMetrics = {
    totalEmployees: filteredEmployees.length,
    activeEmployees: filteredEmployees.filter((e) => e.status === 'active').length,
    avgAttendance: filteredAttendance.length > 0
      ? ((filteredAttendance.filter((a) => a.status === 'present').length / filteredAttendance.length) * 100).toFixed(1)
      : '0',
    pendingLeaves: filteredLeaves.filter((l) => l.status === 'pending').length,
    totalPayroll: filteredPayroll.reduce((sum, p) => sum + parseFloat(p.netPay || 0), 0),
  };

  // Department distribution
  const departmentData = Object.entries(
    filteredEmployees.reduce((acc: Record<string, number>, emp) => {
      const dept = emp.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Attendance trend (last 30 days)
  const attendanceTrend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const dayAttendance = (reportData.attendance || []).filter(
      (a) => a.date === dateStr
    );
    
    return {
      date: format(date, 'MM/dd'),
      present: dayAttendance.filter((a) => a.status === 'present').length,
      absent: dayAttendance.filter((a) => a.status === 'absent').length,
      late: dayAttendance.filter((a) => a.status === 'late').length,
    };
  });

  // Leave status distribution
  const leaveStatusData = Object.entries(
    (reportData.leaves || []).reduce((acc: Record<string, number>, leave) => {
      const status = leave.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Payroll trend (last 6 months)
  const payrollTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthStr = format(date, 'MMM yyyy');
    
    const monthPayroll = (reportData.payroll || []).filter((p) => {
      const payDate = new Date(p.payDate || p.createdAt);
      return format(payDate, 'MMM yyyy') === monthStr;
    });
    
    return {
      month: format(date, 'MMM'),
      total: monthPayroll.reduce((sum, p) => sum + (p.netPay || 0), 0),
    };
  });

  // Performance distribution
  const performanceData = Object.entries(
    (reportData.performance || []).reduce((acc: Record<string, number>, review) => {
      const rating = review.overallRating || review.rating || 'Not Rated';
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const handleExportOverview = () => {
    const exportData = [
      { metric: 'Total Employees', value: overviewMetrics.totalEmployees },
      { metric: 'Active Employees', value: overviewMetrics.activeEmployees },
      { metric: 'Average Attendance', value: `${overviewMetrics.avgAttendance}%` },
      { metric: 'Pending Leaves', value: overviewMetrics.pendingLeaves },
      { metric: 'Total Payroll', value: `${currencySymbol}${overviewMetrics.totalPayroll.toFixed(2)}` },
    ];
    exportToCSV(exportData, 'hr-overview-report');
    toast.success('Report exported to CSV');
  };

  const handleExportDepartment = () => {
    exportToCSV(departmentData, 'department-distribution-report');
    toast.success('Report exported to CSV');
  };

  const handleExportAttendance = () => {
    exportToCSV(attendanceTrend, 'attendance-trend-report');
    toast.success('Report exported to CSV');
  };

  const handleExportPayroll = () => {
    exportToCSV(payrollTrend, 'payroll-trend-report');
    toast.success('Report exported to CSV');
  };

  if (!user || !role || !['superadmin', 'admin', 'manager'].includes(role)) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view advanced reports.
        </AlertDescription>
      </Alert>
    );
  }

  const departments = Array.from(new Set((reportData.employees || []).map((e) => e.department).filter(Boolean)));
  const companies = reportData.companies || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your organization
          </p>
        </div>
        <Button onClick={fetchReportData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateRange.from, 'MMM dd, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    />
                  </PopoverContent>
                </Popover>
                <span className="self-center">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateRange.to, 'MMM dd, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <NativeSelect value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {/* Company Filter */}
            {role === 'superadmin' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <NativeSelect value={selectedCompany} onValueChange={setSelectedCompany}>
                  <option value="all">All Companies</option>
                  {companies.map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewMetrics.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {overviewMetrics.activeEmployees} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewMetrics.avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Last {filteredAttendance.length} records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewMetrics.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencySymbol}{overviewMetrics.totalPayroll.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Period total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={handleExportOverview} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Department Distribution</CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleExportDepartment}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ClientOnlyChart fallback={<div className="h-[300px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        key="pie-1"
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`dept-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip key="tooltip-1" />
                    </PieChart>
                  </ResponsiveContainer>
                </ClientOnlyChart>
              </CardContent>
            </Card>

            {/* Leave Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientOnlyChart fallback={<div className="h-[300px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={leaveStatusData}>
                      <CartesianGrid key="grid-1" strokeDasharray="3 3" />
                      <XAxis key="xaxis-1" dataKey="name" />
                      <YAxis key="yaxis-1" />
                      <Tooltip key="tooltip-1" />
                      <Bar key="bar-1" dataKey="value" fill="#8884d8">
                        {leaveStatusData.map((entry, index) => (
                          <Cell key={`leave-status-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ClientOnlyChart>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Trend (Last 30 Days)</CardTitle>
                  <CardDescription>Daily attendance breakdown</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleExportAttendance}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ClientOnlyChart fallback={<div className="h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={attendanceTrend}>
                    <CartesianGrid key="grid-1" strokeDasharray="3 3" />
                    <XAxis key="xaxis-1" dataKey="date" />
                    <YAxis key="yaxis-1" />
                    <Tooltip key="tooltip-1" />
                    <Legend key="legend-1" />
                    <Area key="area-1" type="monotone" dataKey="present" stackId="1" stroke="#00C49F" fill="#00C49F" />
                    <Area key="area-2" type="monotone" dataKey="late" stackId="1" stroke="#FFBB28" fill="#FFBB28" />
                    <Area key="area-3" type="monotone" dataKey="absent" stackId="1" stroke="#FF8042" fill="#FF8042" />
                  </AreaChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payroll Trend (Last 6 Months)</CardTitle>
                  <CardDescription>Monthly payroll totals</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleExportPayroll}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ClientOnlyChart fallback={<div className="h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={payrollTrend}>
                    <CartesianGrid key="grid-1" strokeDasharray="3 3" />
                    <XAxis key="xaxis-1" dataKey="month" />
                    <YAxis key="yaxis-1" />
                    <Tooltip key="tooltip-1" />
                    <Legend key="legend-1" />
                    <Line key="line-1" type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Review Distribution</CardTitle>
              <CardDescription>Employee rating breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientOnlyChart fallback={<div className="h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={performanceData}>
                    <CartesianGrid key="grid-1" strokeDasharray="3 3" />
                    <XAxis key="xaxis-1" dataKey="name" />
                    <YAxis key="yaxis-1" />
                    <Tooltip key="tooltip-1" />
                    <Bar key="bar-1" dataKey="value" fill="#8884d8">
                      {performanceData.map((entry, index) => (
                        <Cell key={`perf-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

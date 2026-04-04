import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Building2, Users, Calendar, FileText, TrendingUp, TrendingDown,
  Activity, Clock, CheckCircle, AlertCircle, RefreshCw, Briefcase,
  MessageCircle, Target, Package, DollarSign
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface CompanyStats {
  companyId: string;
  companyName: string;
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departments: number;
  licenses: number;
  usedLicenses: number;
  subscriptionStatus: string;
  subscriptionPlan: string;
  leaveRequests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  attendance: {
    totalRecords: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
  };
  performance: {
    totalReviews: number;
    completedReviews: number;
    averageRating: number;
  };
  assets: {
    totalAssets: number;
    assignedAssets: number;
    availableAssets: number;
  };
  messages: {
    totalMessages: number;
    unreadMessages: number;
  };
  compliance: {
    activeDocuments: number;
    expiringDocuments: number;
  };
}

interface CompanyUsageAnalyticsProps {
  accessToken: string;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function CompanyUsageAnalytics({ accessToken }: CompanyUsageAnalyticsProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [accessToken]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load all companies
      const companiesData = await api('/superadmin/company', { token: accessToken });
      const companiesList = Array.isArray(companiesData) ? companiesData : [];
      setCompanies(companiesList);

      // Load data for each company
      const [
        allEmployees,
        allDepartments,
        allLeaves,
        allAttendance,
        allReviews,
        allAssets,
        allMessages
      ] = await Promise.all([
        api('/users', { token: accessToken }).catch(() => []),
        api('/admin/departments', { token: accessToken }).catch(() => []),
        api('/leaves', { token: accessToken }).catch(() => []),
        api('/attendance', { token: accessToken }).catch(() => []),
        api('/performance-reviews', { token: accessToken }).catch(() => []),
        api('/admin/assets', { token: accessToken }).catch(() => []),
        api('/messages', { token: accessToken }).catch(() => []),
      ]);

      // Calculate stats per company
      const stats: CompanyStats[] = companiesList.map((company: any) => {
        const companyId = company.id;
        const companyName = company.name;

        // Employees
        const employees = allEmployees.filter((e: any) => 
          (e.companyId === companyId || e.company === companyId)
        );
        const activeEmployees = employees.filter((e: any) => e.status === 'active');
        const inactiveEmployees = employees.filter((e: any) => e.status !== 'active');

        // Departments
        const departments = allDepartments.filter((d: any) => 
          (d.companyId === companyId || d.company === companyId)
        );

        // Leave requests
        const leaves = allLeaves.filter((l: any) => {
          const employee = employees.find((e: any) => e.userId === l.userId || e.id === l.userId);
          return !!employee;
        });
        const pendingLeaves = leaves.filter((l: any) => l.status === 'pending');
        const approvedLeaves = leaves.filter((l: any) => l.status === 'approved');
        const rejectedLeaves = leaves.filter((l: any) => l.status === 'rejected');

        // Attendance
        const attendance = allAttendance.filter((a: any) => {
          const employee = employees.find((e: any) => e.userId === a.userId || e.id === a.userId);
          return !!employee;
        });
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter((a: any) => a.date?.startsWith(today));
        const presentToday = todayAttendance.filter((a: any) => a.status === 'present' || a.checkIn);
        const absentToday = employees.length - presentToday.length;
        const lateToday = todayAttendance.filter((a: any) => a.late === true);

        // Performance reviews
        const reviews = allReviews.filter((r: any) => {
          const employee = employees.find((e: any) => e.userId === r.employeeId || e.id === r.employeeId);
          return !!employee;
        });
        const completedReviews = reviews.filter((r: any) => r.status === 'completed');
        const averageRating = completedReviews.length > 0
          ? completedReviews.reduce((sum: number, r: any) => sum + (r.overallRating || 0), 0) / completedReviews.length
          : 0;

        // Assets
        const assets = allAssets.filter((a: any) => 
          (a.companyId === companyId || a.company === companyId)
        );
        const assignedAssets = assets.filter((a: any) => a.assignedTo);
        const availableAssets = assets.filter((a: any) => !a.assignedTo);

        // Messages
        const messages = allMessages.filter((m: any) => {
          const sender = employees.find((e: any) => e.userId === m.senderId || e.id === m.senderId);
          return !!sender;
        });
        const unreadMessages = messages.filter((m: any) => !m.read);

        return {
          companyId,
          companyName,
          totalEmployees: employees.length,
          activeEmployees: activeEmployees.length,
          inactiveEmployees: inactiveEmployees.length,
          departments: departments.length,
          licenses: company.licenses || 0,
          usedLicenses: company.usedLicenses || activeEmployees.length,
          subscriptionStatus: company.subscriptionStatus || company.status || 'unknown',
          subscriptionPlan: company.subscriptionPlan || 'N/A',
          leaveRequests: {
            total: leaves.length,
            pending: pendingLeaves.length,
            approved: approvedLeaves.length,
            rejected: rejectedLeaves.length,
          },
          attendance: {
            totalRecords: attendance.length,
            presentToday: presentToday.length,
            absentToday,
            lateToday: lateToday.length,
          },
          performance: {
            totalReviews: reviews.length,
            completedReviews: completedReviews.length,
            averageRating: Math.round(averageRating * 10) / 10,
          },
          assets: {
            totalAssets: assets.length,
            assignedAssets: assignedAssets.length,
            availableAssets: availableAssets.length,
          },
          messages: {
            totalMessages: messages.length,
            unreadMessages: unreadMessages.length,
          },
          compliance: {
            activeDocuments: 0, // TODO: Add when documents module is ready
            expiringDocuments: 0,
          },
        };
      });

      setCompanyStats(stats);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load usage analytics');
    } finally {
      setLoading(false);
    }
  };

  // Aggregate stats across all companies
  const totalStats = companyStats.reduce((acc, stat) => ({
    totalCompanies: acc.totalCompanies + 1,
    totalEmployees: acc.totalEmployees + stat.totalEmployees,
    totalDepartments: acc.totalDepartments + stat.departments,
    totalLicenses: acc.totalLicenses + stat.licenses,
    usedLicenses: acc.usedLicenses + stat.usedLicenses,
    totalLeaves: acc.totalLeaves + stat.leaveRequests.total,
    totalAssets: acc.totalAssets + stat.assets.totalAssets,
  }), {
    totalCompanies: 0,
    totalEmployees: 0,
    totalDepartments: 0,
    totalLicenses: 0,
    usedLicenses: 0,
    totalLeaves: 0,
    totalAssets: 0,
  });

  // Chart data
  const employeesByCompany = companyStats.map(stat => ({
    name: stat.companyName,
    active: stat.activeEmployees,
    inactive: stat.inactiveEmployees,
  }));

  const licenseUtilization = companyStats.map(stat => ({
    name: stat.companyName,
    used: stat.usedLicenses,
    available: stat.licenses - stat.usedLicenses,
    utilization: stat.licenses > 0 ? Math.round((stat.usedLicenses / stat.licenses) * 100) : 0,
  }));

  const subscriptionStatus = companyStats.reduce((acc: any[], stat) => {
    const existing = acc.find(item => item.name === stat.subscriptionStatus);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: stat.subscriptionStatus, value: 1 });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm text-muted-foreground">Loading usage analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Company Usage Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor usage, adoption, and performance across all companies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('overview')}
          >
            Overview
          </Button>
          <Button
            variant={selectedView === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('detailed')}
          >
            Detailed
          </Button>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {selectedView === 'overview' ? (
        <>
          {/* Platform-wide summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Companies</p>
                    <p className="text-2xl font-bold">{totalStats.totalCompanies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">{totalStats.totalEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">License Usage</p>
                    <p className="text-2xl font-bold">
                      {totalStats.usedLicenses}/{totalStats.totalLicenses}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Briefcase className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assets</p>
                    <p className="text-2xl font-bold">{totalStats.totalAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employees by Company</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={employeesByCompany}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" fill="#10b981" name="Active" />
                    <Bar dataKey="inactive" fill="#ef4444" name="Inactive" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">License Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={licenseUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="used" fill="#3b82f6" name="Used" />
                    <Bar dataKey="available" fill="#d1d5db" name="Available" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscription Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subscriptionStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Companies by Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyStats
                    .sort((a, b) => b.totalEmployees - a.totalEmployees)
                    .slice(0, 5)
                    .map((stat, index) => (
                      <div key={stat.companyId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{stat.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {stat.departments} departments
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{stat.totalEmployees} employees</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Detailed view */
        <div className="space-y-4">
          {companyStats.map((stat) => {
            const licenseUtilization = stat.licenses > 0 
              ? Math.round((stat.usedLicenses / stat.licenses) * 100) 
              : 0;

            return (
              <Card key={stat.companyId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{stat.companyName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stat.subscriptionPlan} • {stat.subscriptionStatus}
                      </p>
                    </div>
                    <Badge variant={stat.subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                      {stat.subscriptionStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Employees</p>
                      <p className="text-xl font-semibold">
                        {stat.activeEmployees}/{stat.totalEmployees}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.inactiveEmployees} inactive
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">License Usage</p>
                      <p className="text-xl font-semibold">
                        {stat.usedLicenses}/{stat.licenses}
                      </p>
                      <Progress value={licenseUtilization} className="mt-1" />
                      <p className="text-xs text-muted-foreground">{licenseUtilization}%</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Leave Requests</p>
                      <p className="text-xl font-semibold">{stat.leaveRequests.total}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.leaveRequests.pending} pending
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Assets</p>
                      <p className="text-xl font-semibold">{stat.assets.totalAssets}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.assets.assignedAssets} assigned
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Present Today</p>
                        <p className="text-sm font-medium">{stat.attendance.presentToday}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Absent Today</p>
                        <p className="text-sm font-medium">{stat.attendance.absentToday}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Avg. Rating</p>
                        <p className="text-sm font-medium">{stat.performance.averageRating || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Messages</p>
                        <p className="text-sm font-medium">{stat.messages.totalMessages}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

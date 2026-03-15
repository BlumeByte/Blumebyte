import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  Bell, 
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { toast } from 'sonner@2.0.3';

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

interface Attendance {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'late';
  hoursWorked?: number;
}

interface Payslip {
  id: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  generatedAt: string;
}

export default function EmployeePortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);

  // Leave request form
  const [leaveForm, setLeaveForm] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      // Load profile
      const profileData = await api('/employee/profile');
      setProfile(profileData);

      // Load leave requests
      const leaveData = await api('/employee/leave-requests');
      setLeaveRequests(leaveData.requests || []);

      // Load attendance
      const attendanceData = await api('/employee/attendance');
      setAttendance(attendanceData.records || []);
      setTodayAttendance(attendanceData.today || null);
      setIsClockedIn(attendanceData.today?.clockIn && !attendanceData.today?.clockOut);

      // Load payslips
      const payslipData = await api('/employee/payslips');
      setPayslips(payslipData.payslips || []);
    } catch (error: any) {
      console.error('Error loading employee data:', error);
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.type || !leaveForm.startDate || !leaveForm.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api('/employee/leave-request', {
        method: 'POST',
        body: JSON.stringify(leaveForm),
      });

      toast.success('Leave request submitted successfully');
      setLeaveForm({ type: '', startDate: '', endDate: '', reason: '' });
      loadEmployeeData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit leave request');
    }
  };

  const handleClockIn = async () => {
    try {
      await api('/employee/clock-in', { method: 'POST' });
      toast.success('Clocked in successfully');
      loadEmployeeData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await api('/employee/clock-out', { method: 'POST' });
      toast.success('Clocked out successfully');
      loadEmployeeData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clock out');
    }
  };

  const calculateDays = () => {
    if (leaveForm.startDate && leaveForm.endDate) {
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Self-Service Portal</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {profile?.name || user?.email}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clock Status</p>
                  <p className="text-2xl font-bold mt-1">
                    {isClockedIn ? 'In' : 'Out'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <Button
                onClick={isClockedIn ? handleClockOut : handleClockIn}
                className="w-full mt-4"
                variant={isClockedIn ? 'destructive' : 'default'}
              >
                {isClockedIn ? (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Clock Out
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Clock In
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leave Balance</p>
                  <p className="text-2xl font-bold mt-1">
                    {profile?.leaveBalance || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold mt-1">
                    {leaveRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">leave requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold mt-1">
                    {attendance.filter(a => {
                      const date = new Date(a.date);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">days present</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest updates and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaveRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{request.type} Leave</h4>
                          <Badge className={getStatusColor(request.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {leaveRequests.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Tab */}
          <TabsContent value="leave" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Request Leave</CardTitle>
                <CardDescription>Submit a new leave request</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Leave Type *</Label>
                      <Select
                        value={leaveForm.type}
                        onValueChange={(value) => setLeaveForm({ ...leaveForm, type: value })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Annual">Annual Leave</SelectItem>
                          <SelectItem value="Sick">Sick Leave</SelectItem>
                          <SelectItem value="Personal">Personal Leave</SelectItem>
                          <SelectItem value="Emergency">Emergency Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={calculateDays() ? `${calculateDays()} day${calculateDays() > 1 ? 's' : ''}` : 'Select dates'}
                        disabled
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={leaveForm.startDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                        min={leaveForm.startDate}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please provide a reason for your leave request..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Leave Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave History</CardTitle>
                <CardDescription>Your previous leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{request.type} Leave</h4>
                          <Badge className={getStatusColor(request.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} ({request.days} days)
                        </p>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {request.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {leaveRequests.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No leave requests yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>Your clock-in and clock-out times</CardDescription>
              </CardHeader>
              <CardContent>
                {todayAttendance ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {todayAttendance.clockIn ? `Clocked In: ${new Date(todayAttendance.clockIn).toLocaleTimeString()}` : 'Not clocked in'}
                      </p>
                      {todayAttendance.clockOut && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Clocked Out: {new Date(todayAttendance.clockOut).toLocaleTimeString()}
                        </p>
                      )}
                      {todayAttendance.hoursWorked && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Hours Worked: {todayAttendance.hoursWorked.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No attendance record for today
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>Your attendance records for this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attendance.slice(0, 10).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.clockIn ? `In: ${new Date(record.clockIn).toLocaleTimeString()}` : 'Not clocked in'}
                          {record.clockOut && ` | Out: ${new Date(record.clockOut).toLocaleTimeString()}`}
                        </p>
                      </div>
                      <Badge className={record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No attendance records
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payslips Tab */}
          <TabsContent value="payslips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payslips</CardTitle>
                <CardDescription>Download your monthly payslips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payslips.map((payslip) => (
                    <div key={payslip.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{payslip.month} {payslip.year}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Net Salary: ₦{payslip.netSalary.toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                  {payslips.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No payslips available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      <p className="font-medium mt-1">{profile?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium mt-1">{profile?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="font-medium mt-1">{profile?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Position</Label>
                      <p className="font-medium mt-1">{profile?.position || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Join Date</Label>
                      <p className="font-medium mt-1">
                        {profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Employee ID</Label>
                      <p className="font-medium mt-1">{profile?.employeeId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

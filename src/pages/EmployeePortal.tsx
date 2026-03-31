import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { 
  User, Calendar, FileText, Clock, Bell, Loader2,
  CheckCircle2, XCircle, AlertCircle, Download, LogIn, LogOut,
  Megaphone, Send, Edit3, ChevronRight, LayoutDashboard,
  DollarSign, MapPin, Phone, Mail, Building2, Briefcase,
  TrendingUp, CalendarDays, Timer, Coffee, Sun, Moon, 
  ArrowRight, Shield, Heart, Users, FolderOpen, CalendarHeart,
  Search, X, Eye, FileDown, ChevronDown, ChevronUp, Banknote,
  Globe, Hash, UserCheck, ClipboardList, Receipt, GraduationCap,
  MessageSquare, CalendarRange
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useBranding, brandGradientStyle } from '../lib/branding-context';
import { api } from '../lib/api-client';
import { toast } from 'sonner';
import { NotificationsBell } from '../components/NotificationsBell';
import { OvertimeExpenseTab } from '../components/portal/OvertimeExpenseTab';
import { TrainingTab } from '../components/portal/TrainingTab';
import { FeedbackTab } from '../components/portal/FeedbackTab';
import { TeamCalendarTab } from '../components/portal/TeamCalendarTab';

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
  cancelledAt?: string;
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
  grossSalary?: number;
  generatedAt: string;
  housingAllowance?: number;
  transportAllowance?: number;
  mealAllowance?: number;
  taxDeduction?: number;
  pensionDeduction?: number;
  nhfDeduction?: number;
  otherAllowances?: number;
  otherDeductions?: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  author?: string;
  category?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  role: string;
  profileImageUrl?: string | null;
}

interface Holiday {
  id?: string;
  name?: string;
  title?: string;
  date?: string;
  startDate?: string;
  type?: string;
}

interface CompanyDocument {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  fileUrl?: string;
  createdAt?: string;
  uploadedAt?: string;
  fileType?: string;
  size?: number;
}

interface ProfileUpdateRequest {
  id: string;
  changes: Record<string, string>;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export default function EmployeePortal() {
  const { user, accessToken, logout } = useAuth();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [profileUpdateRequests, setProfileUpdateRequests] = useState<ProfileUpdateRequest[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState<any>({});
  const [profileUpdateSubmitting, setProfileUpdateSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cancellingLeaveId, setCancellingLeaveId] = useState<string | null>(null);
  const [showPayslipDialog, setShowPayslipDialog] = useState<Payslip | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamDeptFilter, setTeamDeptFilter] = useState('all');
  
  // New feature states
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([]);
  const [expenseClaims, setExpenseClaims] = useState<any[]>([]);
  const [availableTraining, setAvailableTraining] = useState<any[]>([]);
  const [trainingEnrollments, setTrainingEnrollments] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<any[]>([]);

  // Leave request form
  const [leaveForm, setLeaveForm] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadEmployeeData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, leaveData, attendanceData, payslipData, announcementData, teamData, holidayData, docsData, profileReqData,
        overtimeData, expenseData, trainingData, enrollmentData, surveyData, feedbackData, calendarData
      ] = await Promise.all([
        api('/employee/profile', { token: accessToken }).catch(() => null),
        api('/employee/leave-requests', { token: accessToken }).catch(() => ({ requests: [] })),
        api('/employee/attendance', { token: accessToken }).catch(() => ({ records: [], today: null })),
        api('/employee/payslips', { token: accessToken }).catch(() => ({ payslips: [] })),
        api('/employee/announcements', { token: accessToken }).catch(() => ({ announcements: [] })),
        api('/employee/team', { token: accessToken }).catch(() => ({ team: [] })),
        api('/employee/holidays', { token: accessToken }).catch(() => ({ holidays: [] })),
        api('/employee/documents', { token: accessToken }).catch(() => ({ documents: [] })),
        api('/employee/profile-update-requests', { token: accessToken }).catch(() => ({ requests: [] })),
        api('/employee/overtime-requests', { token: accessToken }).catch(() => ({ requests: [] })),
        api('/employee/expense-claims', { token: accessToken }).catch(() => ({ claims: [] })),
        api('/employee/available-training', { token: accessToken }).catch(() => ({ programs: [] })),
        api('/employee/my-enrollments', { token: accessToken }).catch(() => ({ enrollments: [] })),
        api('/employee/surveys', { token: accessToken }).catch(() => ({ surveys: [], responses: [] })),
        api('/employee/feedback-history', { token: accessToken }).catch(() => ({ feedback: [] })),
        api('/employee/team-calendar', { token: accessToken }).catch(() => ({ leaves: [] })),
      ]);

      if (profileData) setProfile(profileData);
      setLeaveRequests(leaveData?.requests || []);
      setAttendance(attendanceData?.records || []);
      setTodayAttendance(attendanceData?.today || null);
      setIsClockedIn(!!(attendanceData?.today?.clockIn && !attendanceData?.today?.clockOut));
      setPayslips(payslipData?.payslips || []);
      setAnnouncements(announcementData?.announcements || []);
      setTeam(teamData?.team || []);
      setHolidays(holidayData?.holidays || []);
      setDocuments(docsData?.documents || []);
      setProfileUpdateRequests(profileReqData?.requests || []);
      setOvertimeRequests(overtimeData?.requests || []);
      setExpenseClaims(expenseData?.claims || []);
      setAvailableTraining(trainingData?.programs || []);
      setTrainingEnrollments(enrollmentData?.enrollments || []);
      setSurveys(surveyData?.surveys || []);
      setSurveyResponses(surveyData?.responses || []);
      setFeedbackHistory(feedbackData?.feedback || []);
      setTeamLeaves(calendarData?.leaves || []);
    } catch (error: any) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) loadEmployeeData();
  }, [accessToken, loadEmployeeData]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.type || !leaveForm.startDate || !leaveForm.endDate) {
      toast.error('Please fill all required fields');
      return;
    }
    setLeaveSubmitting(true);
    try {
      await api('/employee/leave-request', {
        method: 'POST',
        body: JSON.stringify(leaveForm),
        token: accessToken,
      });
      toast.success('Leave request submitted successfully');
      setLeaveForm({ type: '', startDate: '', endDate: '', reason: '' });
      loadEmployeeData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit leave request');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleLeaveCancel = async (id: string) => {
    setCancellingLeaveId(id);
    try {
      await api(`/employee/leave-cancel/${id}`, { method: 'POST', body: '{}', token: accessToken });
      toast.success('Leave request cancelled');
      loadEmployeeData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel leave request');
    } finally {
      setCancellingLeaveId(null);
    }
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      await api('/employee/clock-in', { method: 'POST', body: '{}', token: accessToken });
      toast.success('Clocked in successfully!');
      loadEmployeeData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clock in');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    try {
      await api('/employee/clock-out', { method: 'POST', body: '{}', token: accessToken });
      toast.success('Clocked out successfully!');
      loadEmployeeData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clock out');
    } finally {
      setClockLoading(false);
    }
  };

  const handleProfileUpdateRequest = async () => {
    if (Object.keys(profileEditForm).length === 0) {
      toast.error('No changes to submit');
      return;
    }
    setProfileUpdateSubmitting(true);
    try {
      await api('/employee/profile-update-request', {
        method: 'POST',
        body: JSON.stringify({ changes: profileEditForm, reason: 'Profile information update' }),
        token: accessToken,
      });
      toast.success('Profile update request submitted for approval');
      setShowProfileEditDialog(false);
      setProfileEditForm({});
      loadEmployeeData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit profile update request');
    } finally {
      setProfileUpdateSubmitting(false);
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="h-3.5 w-3.5" /> },
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertCircle className="h-3.5 w-3.5" /> },
      cancelled: { color: 'bg-gray-50 text-gray-500 border-gray-200', icon: <X className="h-3.5 w-3.5" /> },
    };
    const c = config[status] || config.pending;
    return (
      <Badge variant="outline" className={`${c.color} gap-1 font-medium`}>
        {c.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50/50';
      case 'high': return 'border-l-orange-500 bg-orange-50/50';
      case 'medium': return 'border-l-blue-500 bg-blue-50/50';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 6 || hour >= 20) return <Moon className="w-5 h-5 text-indigo-400" />;
    if (hour < 12) return <Coffee className="w-5 h-5 text-amber-500" />;
    return <Sun className="w-5 h-5 text-yellow-500" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedLeaves = leaveRequests.filter(r => r.status === 'approved').length;
  const thisMonthAttendance = attendance.filter(a => {
    const d = new Date(a.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const workingDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let day = 1; day <= lastDay; day++) {
      const d = new Date(year, month, day);
      if (d.getDay() !== 0 && d.getDay() !== 6) count++;
    }
    return count;
  };

  const attendancePercentage = workingDaysInMonth() > 0 
    ? Math.round((thisMonthAttendance / workingDaysInMonth()) * 100) 
    : 0;

  const upcomingHolidays = holidays.filter(h => {
    const hDate = new Date(h.date || h.startDate || '');
    return hDate >= new Date();
  }).slice(0, 5);

  const departments = [...new Set(team.map(t => t.department).filter(Boolean))];
  const filteredTeam = team.filter(m => {
    const matchesSearch = !teamSearch || 
      m.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      m.position.toLowerCase().includes(teamSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(teamSearch.toLowerCase());
    const matchesDept = teamDeptFilter === 'all' || m.department === teamDeptFilter;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={brandGradientStyle(branding.primaryColor)}>
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-sm" style={brandGradientStyle(branding.primaryColor)}>
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <span className="text-white font-bold text-sm">{branding.companyName?.[0] || 'B'}</span>
                )}
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">{branding.companyName || 'Blumebyte'}</h1>
                <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Self-Service Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationsBell />
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                {profile?.profileImageUrl ? (
                  <img src={profile.profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-white" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={brandGradientStyle(branding.primaryColor)}>
                    {profile?.name?.[0] || user?.email?.[0] || '?'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{profile?.name || user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0" title="Log Out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Welcome Banner */}
          <div className="rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden" style={brandGradientStyle(branding.primaryColor)}>
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getGreetingIcon()}
                  <span className="text-sm text-white/80 font-medium">{getGreeting()}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">{profile?.name || 'Employee'}</h2>
                <p className="text-white/70 mt-1 text-sm">
                  {profile?.position || profile?.jobTitle || 'Team Member'} {profile?.department ? `| ${profile.department}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-3xl font-mono font-bold tracking-wider">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-white/60">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('attendance')}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isClockedIn ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    <Clock className={`w-5 h-5 ${isClockedIn ? 'text-emerald-600' : 'text-gray-500'}`} />
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${isClockedIn ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                    {isClockedIn ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{isClockedIn ? 'In' : 'Out'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Clock Status</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('leave')}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{profile?.leaveBalance ?? profile?.annualLeaveBalance ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Leave Balance</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('leave')}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  {pendingLeaves > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">{pendingLeaves}</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">{pendingLeaves}</p>
                <p className="text-xs text-gray-500 mt-0.5">Pending Requests</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('attendance')}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-400">{attendancePercentage}%</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{thisMonthAttendance}</p>
                <p className="text-xs text-gray-500 mt-0.5">Days Present</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex gap-1 w-auto min-w-full sm:min-w-0 h-auto bg-white/80 backdrop-blur-sm border p-1.5 rounded-xl shadow-sm">
                {[
                  { value: 'overview', icon: LayoutDashboard, label: 'Overview' },
                  { value: 'attendance', icon: Clock, label: 'Attendance' },
                  { value: 'leave', icon: CalendarDays, label: 'Leave' },
                  { value: 'payslips', icon: DollarSign, label: 'Payslips' },
                  { value: 'requests', icon: Receipt, label: 'Requests', count: overtimeRequests.filter(r => r.status === 'pending').length + expenseClaims.filter(r => r.status === 'pending').length || undefined },
                  { value: 'training', icon: GraduationCap, label: 'Training', count: availableTraining.length > 0 ? availableTraining.length : undefined },
                  { value: 'feedback', icon: MessageSquare, label: 'Feedback', count: surveys.filter(s => s.status === 'active').length > 0 ? surveys.filter(s => s.status === 'active').length : undefined },
                  { value: 'calendar', icon: CalendarRange, label: 'Calendar' },
                  { value: 'team', icon: Users, label: 'Team', count: team.length },
                  { value: 'documents', icon: FolderOpen, label: 'Docs', count: documents.length },
                  { value: 'profile', icon: User, label: 'Profile' },
                  { value: 'announcements', icon: Megaphone, label: 'News', count: announcements.length > 0 ? announcements.length : undefined },
                ].map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm gap-1.5 whitespace-nowrap">
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {tab.count > 9 ? '9+' : tab.count}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Clock In/Out Widget */}
                <Card className="border-0 shadow-sm lg:col-span-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Timer className="w-4 h-4 text-blue-600" />
                      Time Clock
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 transition-all ${isClockedIn ? 'bg-emerald-100 ring-4 ring-emerald-50' : 'bg-gray-100 ring-4 ring-gray-50'}`}>
                        <Clock className={`w-8 h-8 ${isClockedIn ? 'text-emerald-600' : 'text-gray-400'}`} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        {isClockedIn ? 'Currently Working' : 'Not Clocked In'}
                      </p>
                      {todayAttendance?.clockIn && (
                        <p className="text-xs text-gray-400 mt-1">
                          Started at {new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={isClockedIn ? handleClockOut : handleClockIn}
                      disabled={clockLoading || (todayAttendance?.clockOut ? true : false)}
                      className={`w-full h-11 text-sm font-medium ${isClockedIn ? 'bg-red-500 hover:bg-red-600' : ''}`}
                      variant={isClockedIn ? 'destructive' : 'default'}
                    >
                      {clockLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : isClockedIn ? (
                        <LogOut className="w-4 h-4 mr-2" />
                      ) : (
                        <LogIn className="w-4 h-4 mr-2" />
                      )}
                      {todayAttendance?.clockOut ? 'Day Complete' : isClockedIn ? 'Clock Out' : 'Clock In'}
                    </Button>
                    {todayAttendance?.hoursWorked && (
                      <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-2">
                        Worked: <span className="font-semibold text-gray-700">{todayAttendance.hoursWorked.toFixed(1)}h</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-0 shadow-sm lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="w-4 h-4 text-violet-600" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaveRequests.slice(0, 4).map((request) => (
                        <div key={request.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{request.type} Leave</p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              <span className="mx-1 text-gray-300">|</span>
                              {request.days} day{request.days !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      ))}
                      {announcements.slice(0, 2).map((ann) => (
                        <div key={ann.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Megaphone className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{ann.title}</p>
                            <p className="text-xs text-gray-500">{new Date(ann.createdAt).toLocaleDateString()}</p>
                          </div>
                          {ann.priority && ann.priority !== 'low' && (
                            <Badge variant="outline" className="text-[10px] border-orange-200 bg-orange-50 text-orange-600">{ann.priority}</Badge>
                          )}
                        </div>
                      ))}
                      {leaveRequests.length === 0 && announcements.length === 0 && (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Heart className="w-5 h-5 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-400">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid sm:grid-cols-4 gap-3">
                <button onClick={() => setActiveTab('leave')} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Send className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Request Leave</p>
                    <p className="text-xs text-gray-400">Submit a new request</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-blue-400 transition-colors" />
                </button>
                <button onClick={() => setActiveTab('requests')} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-left group">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <Receipt className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">OT & Expenses</p>
                    <p className="text-xs text-gray-400">Log overtime & claims</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-orange-400 transition-colors" />
                </button>
                <button onClick={() => setActiveTab('training')} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all text-left group">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Training</p>
                    <p className="text-xs text-gray-400">{availableTraining.length} programs</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-purple-400 transition-colors" />
                </button>
                <button onClick={() => setActiveTab('calendar')} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all text-left group">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <CalendarRange className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Team Calendar</p>
                    <p className="text-xs text-gray-400">Who's on leave</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-teal-400 transition-colors" />
                </button>
              </div>

              {/* Bottom Row: Attendance Progress + Upcoming Holidays */}
              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Monthly Attendance</p>
                      <p className="text-sm font-semibold text-gray-900">{thisMonthAttendance}/{workingDaysInMonth()} days</p>
                    </div>
                    <Progress value={attendancePercentage} className="h-2.5" />
                    <p className="text-xs text-gray-400 mt-2">{attendancePercentage}% attendance this month</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarHeart className="w-4 h-4 text-pink-500" />
                      Upcoming Holidays
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    {upcomingHolidays.length > 0 ? (
                      <div className="space-y-2">
                        {upcomingHolidays.map((h, idx) => {
                          const hDate = new Date(h.date || h.startDate || '');
                          return (
                            <div key={h.id || idx} className="flex items-center gap-3 text-sm">
                              <div className="w-10 h-10 rounded-lg bg-pink-50 flex flex-col items-center justify-center text-pink-600">
                                <span className="text-[10px] font-medium uppercase leading-none">{hDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span className="text-sm font-bold leading-tight">{hDate.getDate()}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{h.name || h.title || 'Holiday'}</p>
                                <p className="text-xs text-gray-400">{hDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-2">No upcoming holidays scheduled</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== ATTENDANCE TAB ===== */}
            <TabsContent value="attendance" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Today's Attendance</h3>
                      <p className="text-sm text-gray-500">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {todayAttendance?.clockIn && (
                        <div className="mt-3 flex items-center gap-4 justify-center sm:justify-start">
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-0.5">Clock In</p>
                            <p className="text-sm font-semibold text-emerald-600">
                              {new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {todayAttendance.clockOut && (
                            <>
                              <div className="w-8 h-px bg-gray-200" />
                              <div className="text-center">
                                <p className="text-xs text-gray-400 mb-0.5">Clock Out</p>
                                <p className="text-sm font-semibold text-red-500">
                                  {new Date(todayAttendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="w-8 h-px bg-gray-200" />
                              <div className="text-center">
                                <p className="text-xs text-gray-400 mb-0.5">Hours</p>
                                <p className="text-sm font-semibold text-gray-700">
                                  {todayAttendance.hoursWorked?.toFixed(1)}h
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={isClockedIn ? handleClockOut : handleClockIn}
                      disabled={clockLoading || !!todayAttendance?.clockOut}
                      size="lg"
                      className={`px-8 ${isClockedIn ? 'bg-red-500 hover:bg-red-600' : ''}`}
                      variant={isClockedIn ? 'destructive' : 'default'}
                    >
                      {clockLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : isClockedIn ? (
                        <LogOut className="w-4 h-4 mr-2" />
                      ) : (
                        <LogIn className="w-4 h-4 mr-2" />
                      )}
                      {todayAttendance?.clockOut ? 'Day Complete' : isClockedIn ? 'Clock Out' : 'Clock In'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{attendance.filter(a => a.status === 'present').length}</p>
                    <p className="text-xs text-gray-500 mt-1">Present</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{attendance.filter(a => a.status === 'late').length}</p>
                    <p className="text-xs text-gray-500 mt-1">Late</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {attendance.length > 0 ? (attendance.reduce((acc, a) => acc + (a.hoursWorked || 0), 0) / attendance.length).toFixed(1) : '0'}h
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Avg Hours/Day</p>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance History */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Attendance History</CardTitle>
                    <Badge variant="outline" className="text-xs">{attendance.length} records</Badge>
                  </div>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attendance.slice(0, 15).map((record, idx) => (
                      <div key={record.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : record.status === 'late' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {record.clockIn ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              {' → '}
                              {record.clockOut ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`text-[10px] ${record.status === 'present' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : record.status === 'late' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                            {record.status}
                          </Badge>
                          {record.hoursWorked && (
                            <p className="text-xs text-gray-400 mt-0.5">{record.hoursWorked.toFixed(1)}h</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {attendance.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No attendance records yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== LEAVE TAB ===== */}
            <TabsContent value="leave" className="space-y-4">
              {/* Leave Balance Cards */}
              <div className="grid sm:grid-cols-3 gap-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{profile?.leaveBalance ?? profile?.annualLeaveBalance ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Available Days</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600">{pendingLeaves}</p>
                    <p className="text-xs text-gray-500 mt-1">Pending Requests</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{approvedLeaves}</p>
                    <p className="text-xs text-gray-500 mt-1">Approved This Year</p>
                  </CardContent>
                </Card>
              </div>

              {/* Leave Request Form */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    New Leave Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLeaveSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">Leave Type *</Label>
                        <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v })}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Annual">Annual Leave</SelectItem>
                            <SelectItem value="Sick">Sick Leave</SelectItem>
                            <SelectItem value="Personal">Personal Leave</SelectItem>
                            <SelectItem value="Emergency">Emergency Leave</SelectItem>
                            <SelectItem value="Maternity">Maternity Leave</SelectItem>
                            <SelectItem value="Paternity">Paternity Leave</SelectItem>
                            <SelectItem value="Compassionate">Compassionate Leave</SelectItem>
                            <SelectItem value="Study">Study Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">Duration</Label>
                        <div className="h-9 px-3 flex items-center rounded-md border bg-gray-50 text-sm">
                          {calculateDays() ? (
                            <span className="font-medium">{calculateDays()} day{calculateDays() > 1 ? 's' : ''}</span>
                          ) : (
                            <span className="text-gray-400">Select dates</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">Start Date *</Label>
                        <Input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">End Date *</Label>
                        <Input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} min={leaveForm.startDate} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Reason</Label>
                      <Textarea placeholder="Brief reason for your leave request..." value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows={2} />
                    </div>
                    <Button type="submit" disabled={leaveSubmitting} className="w-full sm:w-auto">
                      {leaveSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Submit Request
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Leave History */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Leave History</CardTitle>
                    <Badge variant="outline" className="text-xs">{leaveRequests.length} total</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaveRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{request.type} Leave</p>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              <span className="mx-1 text-gray-300">|</span>
                              {request.days} day{request.days !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          {request.status === 'pending' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                  onClick={() => handleLeaveCancel(request.id)}
                                  disabled={cancellingLeaveId === request.id}
                                >
                                  {cancellingLeaveId === request.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <X className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cancel Request</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    ))}
                    {leaveRequests.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No leave requests yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== PAYSLIPS TAB ===== */}
            <TabsContent value="payslips" className="space-y-4">
              {/* Latest Payslip Summary */}
              {payslips.length > 0 && (
                <Card className="border-0 shadow-sm overflow-hidden">
                  <div className="p-5 text-white" style={brandGradientStyle(branding.primaryColor)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70 uppercase tracking-wide">Latest Net Pay</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(payslips[0]?.netSalary || 0)}</p>
                        <p className="text-sm text-white/60 mt-0.5">{payslips[0]?.month} {payslips[0]?.year}</p>
                      </div>
                      <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
                        <Banknote className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    My Payslips
                  </CardTitle>
                  <CardDescription>Click to view detailed breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payslips.map((payslip, idx) => (
                      <div
                        key={payslip.id || idx}
                        onClick={() => setShowPayslipDialog(payslip)}
                        className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {payslip.month} {payslip.year}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Generated {payslip.generatedAt ? new Date(payslip.generatedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(payslip.netSalary || 0)}</p>
                              <p className="text-[10px] text-gray-400">Net Pay</p>
                            </div>
                            <Eye className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-xs text-gray-400">Basic</p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatCurrency(payslip.basicSalary || payslip.grossSalary || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Allowances</p>
                            <p className="text-sm font-medium text-emerald-600">
                              +{formatCurrency(payslip.allowances || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Deductions</p>
                            <p className="text-sm font-medium text-red-500">
                              -{formatCurrency(payslip.deductions || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {payslips.length === 0 && (
                      <div className="text-center py-12">
                        <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 mb-1">No payslips available</p>
                        <p className="text-xs text-gray-300">Payslips will appear here after payroll processing</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== OVERTIME & EXPENSES TAB ===== */}
            <TabsContent value="requests">
              <OvertimeExpenseTab
                accessToken={accessToken || ''}
                overtimeRequests={overtimeRequests}
                expenseClaims={expenseClaims}
                onRefresh={loadEmployeeData}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            {/* ===== TRAINING TAB ===== */}
            <TabsContent value="training">
              <TrainingTab
                accessToken={accessToken || ''}
                availableTraining={availableTraining}
                enrollments={trainingEnrollments}
                onRefresh={loadEmployeeData}
                primaryColor={branding.primaryColor}
              />
            </TabsContent>

            {/* ===== FEEDBACK & SURVEYS TAB ===== */}
            <TabsContent value="feedback">
              <FeedbackTab
                accessToken={accessToken || ''}
                surveys={surveys}
                surveyResponses={surveyResponses}
                feedbackHistory={feedbackHistory}
                onRefresh={loadEmployeeData}
                primaryColor={branding.primaryColor}
              />
            </TabsContent>

            {/* ===== TEAM CALENDAR TAB ===== */}
            <TabsContent value="calendar">
              <TeamCalendarTab
                teamLeaves={teamLeaves}
                holidays={holidays}
                team={team.map(t => ({ ...t, position: t.position || '' }))}
                userDepartment={profile?.department || ''}
                primaryColor={branding.primaryColor}
              />
            </TabsContent>

            {/* ===== TEAM DIRECTORY TAB ===== */}
            <TabsContent value="team" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        Team Directory
                      </CardTitle>
                      <CardDescription>{team.length} colleagues in your company</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input
                          placeholder="Search..."
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          className="pl-8 h-8 text-sm w-40"
                        />
                      </div>
                      {departments.length > 0 && (
                        <Select value={teamDeptFilter} onValueChange={setTeamDeptFilter}>
                          <SelectTrigger className="h-8 text-xs w-36">
                            <SelectValue placeholder="Department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredTeam.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                        {member.profileImageUrl ? (
                          <img src={member.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={brandGradientStyle(branding.primaryColor)}>
                            {member.name?.[0] || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.position || member.role}</p>
                          {member.department && (
                            <Badge variant="outline" className="text-[9px] mt-0.5 px-1.5 py-0">{member.department}</Badge>
                          )}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`mailto:${member.email}`} className="p-1.5 rounded-lg hover:bg-white transition-colors">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>{member.email}</TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                  {filteredTeam.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 mb-1">
                        {teamSearch || teamDeptFilter !== 'all' ? 'No matching colleagues found' : 'No team members yet'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== DOCUMENTS TAB ===== */}
            <TabsContent value="documents" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-600" />
                    Company Documents
                  </CardTitle>
                  <CardDescription>Policies, handbooks, and shared documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {documents.map((doc, idx) => {
                      const docName = doc.name || doc.title || 'Untitled Document';
                      const ext = docName.split('.').pop()?.toLowerCase() || doc.fileType || '';
                      const iconColor = ext === 'pdf' ? 'text-red-500 bg-red-50' : 
                                        ['doc', 'docx'].includes(ext) ? 'text-blue-500 bg-blue-50' :
                                        ['xls', 'xlsx'].includes(ext) ? 'text-emerald-500 bg-emerald-50' :
                                        'text-gray-500 bg-gray-50';
                      return (
                        <div key={doc.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{docName}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                {doc.category && <span>{doc.category}</span>}
                                {(doc.createdAt || doc.uploadedAt) && (
                                  <span>{new Date(doc.createdAt || doc.uploadedAt || '').toLocaleDateString()}</span>
                                )}
                                {doc.size && <span>{(doc.size / 1024).toFixed(0)} KB</span>}
                              </div>
                            </div>
                          </div>
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      );
                    })}
                    {documents.length === 0 && (
                      <div className="text-center py-12">
                        <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 mb-1">No documents available</p>
                        <p className="text-xs text-gray-300">Company documents and policies will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== PROFILE TAB ===== */}
            <TabsContent value="profile" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Personal Information
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => { setProfileEditForm({}); setShowProfileEditDialog(true); }}>
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Request Update
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-5 mb-6">
                    {profile?.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt="" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-50" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={brandGradientStyle(branding.primaryColor)}>
                        {profile?.name?.[0] || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{profile?.name || 'N/A'}</h3>
                      <p className="text-sm text-gray-500">{profile?.position || profile?.jobTitle || 'N/A'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs capitalize">{profile?.role || 'employee'}</Badge>
                        <Badge variant="outline" className={`text-xs ${profile?.status === 'active' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200'}`}>
                          {profile?.status || 'active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { icon: Mail, label: 'Email', value: profile?.email },
                      { icon: Phone, label: 'Phone', value: profile?.phone },
                      { icon: Building2, label: 'Department', value: profile?.department },
                      { icon: Briefcase, label: 'Position', value: profile?.position || profile?.jobTitle },
                      { icon: MapPin, label: 'Location', value: [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || null },
                      { icon: Calendar, label: 'Join Date', value: profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
                      { icon: Shield, label: 'Employee ID', value: profile?.employeeId },
                      { icon: User, label: 'Manager', value: profile?.manager || profile?.reportingTo },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <item.icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                          <p className="text-sm font-medium text-gray-800">{item.value || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Emergency Contact */}
                  {(profile?.emergencyContactName || profile?.emergencyContact) && (
                    <>
                      <Separator className="my-5" />
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50">
                          <User className="w-4 h-4 text-red-400" />
                          <div>
                            <p className="text-[10px] text-gray-400">Name</p>
                            <p className="text-sm font-medium text-gray-800">{profile?.emergencyContactName || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50">
                          <Phone className="w-4 h-4 text-red-400" />
                          <div>
                            <p className="text-[10px] text-gray-400">Phone</p>
                            <p className="text-sm font-medium text-gray-800">{profile?.emergencyContactPhone || profile?.emergencyContact || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Profile Update Request History */}
              {profileUpdateRequests.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-violet-600" />
                      Profile Update Requests
                    </CardTitle>
                    <CardDescription>Track your submitted profile change requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profileUpdateRequests.slice(0, 10).map((req) => (
                        <div key={req.id} className="p-3 rounded-xl border border-gray-100 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-400">
                              {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            {getStatusBadge(req.status)}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(req.changes || {}).map(([key, value]) => (
                              <div key={key} className="text-xs bg-gray-50 rounded-md px-2 py-1">
                                <span className="text-gray-400">{key}:</span>{' '}
                                <span className="font-medium text-gray-700">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                          {req.rejectionReason && (
                            <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-md px-2 py-1">
                              Reason: {req.rejectionReason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ===== ANNOUNCEMENTS TAB ===== */}
            <TabsContent value="announcements" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-purple-600" />
                    Company Announcements
                  </CardTitle>
                  <CardDescription>Stay updated with the latest news</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <div key={ann.id} className={`p-4 rounded-xl border-l-4 border transition-colors hover:shadow-sm ${getPriorityColor(ann.priority)}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">{ann.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {ann.priority && ann.priority !== 'low' && (
                              <Badge variant="outline" className={`text-[10px] ${
                                ann.priority === 'urgent' ? 'border-red-200 text-red-600 bg-red-50' :
                                ann.priority === 'high' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                                'border-blue-200 text-blue-600 bg-blue-50'
                              }`}>{ann.priority}</Badge>
                            )}
                            {ann.category && (
                              <Badge variant="outline" className="text-[10px]">{ann.category}</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                          {ann.author && <span>By {ann.author}</span>}
                          <span>{new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="text-center py-12">
                        <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 mb-1">No announcements</p>
                        <p className="text-xs text-gray-300">Company news and updates will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Profile Edit Request Dialog */}
        <Dialog open={showProfileEditDialog} onOpenChange={setShowProfileEditDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Request Profile Update
              </DialogTitle>
              <DialogDescription>
                Submit changes for admin approval. Only allowed fields can be updated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {[
                { key: 'phone', label: 'Phone Number', type: 'tel', current: profile?.phone },
                { key: 'personalEmail', label: 'Personal Email', type: 'email', current: profile?.personalEmail },
                { key: 'address', label: 'Address', type: 'text', current: profile?.address },
                { key: 'city', label: 'City', type: 'text', current: profile?.city },
                { key: 'state', label: 'State', type: 'text', current: profile?.state },
                { key: 'emergencyContactName', label: 'Emergency Contact Name', type: 'text', current: profile?.emergencyContactName },
                { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', type: 'tel', current: profile?.emergencyContactPhone },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">{field.label}</Label>
                  <Input
                    type={field.type}
                    placeholder={field.current || `Enter ${field.label.toLowerCase()}`}
                    value={profileEditForm[field.key] || ''}
                    onChange={(e) => setProfileEditForm((prev: any) => {
                      const updated = { ...prev };
                      if (e.target.value) {
                        updated[field.key] = e.target.value;
                      } else {
                        delete updated[field.key];
                      }
                      return updated;
                    })}
                  />
                  {field.current && (
                    <p className="text-[10px] text-gray-400">Current: {field.current}</p>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProfileEditDialog(false)}>Cancel</Button>
              <Button onClick={handleProfileUpdateRequest} disabled={profileUpdateSubmitting || Object.keys(profileEditForm).length === 0}>
                {profileUpdateSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit for Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payslip Detail Dialog */}
        <Dialog open={!!showPayslipDialog} onOpenChange={() => setShowPayslipDialog(null)}>
          <DialogContent className="sm:max-w-lg">
            {showPayslipDialog && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Payslip - {showPayslipDialog.month} {showPayslipDialog.year}
                  </DialogTitle>
                  <DialogDescription>
                    {profile?.name || 'Employee'} | {profile?.employeeId || 'N/A'} | {profile?.department || 'N/A'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Earnings */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Earnings</h4>
                    <div className="space-y-2 bg-emerald-50/50 rounded-xl p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Basic Salary</span>
                        <span className="font-medium">{formatCurrency(showPayslipDialog.basicSalary || showPayslipDialog.grossSalary || 0)}</span>
                      </div>
                      {showPayslipDialog.housingAllowance && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Housing Allowance</span>
                          <span className="font-medium">{formatCurrency(showPayslipDialog.housingAllowance)}</span>
                        </div>
                      )}
                      {showPayslipDialog.transportAllowance && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Transport Allowance</span>
                          <span className="font-medium">{formatCurrency(showPayslipDialog.transportAllowance)}</span>
                        </div>
                      )}
                      {showPayslipDialog.mealAllowance && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Meal Allowance</span>
                          <span className="font-medium">{formatCurrency(showPayslipDialog.mealAllowance)}</span>
                        </div>
                      )}
                      {showPayslipDialog.otherAllowances && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Other Allowances</span>
                          <span className="font-medium">{formatCurrency(showPayslipDialog.otherAllowances)}</span>
                        </div>
                      )}
                      {(!showPayslipDialog.housingAllowance && showPayslipDialog.allowances) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Allowances</span>
                          <span className="font-medium text-emerald-600">+{formatCurrency(showPayslipDialog.allowances)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Gross Pay</span>
                        <span>{formatCurrency((showPayslipDialog.basicSalary || showPayslipDialog.grossSalary || 0) + (showPayslipDialog.allowances || 0))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deductions</h4>
                    <div className="space-y-2 bg-red-50/50 rounded-xl p-3">
                      {showPayslipDialog.taxDeduction && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax (PAYE)</span>
                          <span className="font-medium text-red-500">-{formatCurrency(showPayslipDialog.taxDeduction)}</span>
                        </div>
                      )}
                      {showPayslipDialog.pensionDeduction && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pension</span>
                          <span className="font-medium text-red-500">-{formatCurrency(showPayslipDialog.pensionDeduction)}</span>
                        </div>
                      )}
                      {showPayslipDialog.nhfDeduction && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">NHF</span>
                          <span className="font-medium text-red-500">-{formatCurrency(showPayslipDialog.nhfDeduction)}</span>
                        </div>
                      )}
                      {showPayslipDialog.otherDeductions && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Other Deductions</span>
                          <span className="font-medium text-red-500">-{formatCurrency(showPayslipDialog.otherDeductions)}</span>
                        </div>
                      )}
                      {(!showPayslipDialog.taxDeduction && showPayslipDialog.deductions) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Deductions</span>
                          <span className="font-medium text-red-500">-{formatCurrency(showPayslipDialog.deductions)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total Deductions</span>
                        <span className="text-red-600">-{formatCurrency(showPayslipDialog.deductions || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="rounded-xl p-4 text-white" style={brandGradientStyle(branding.primaryColor)}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Net Pay</span>
                      <span className="text-2xl font-bold">{formatCurrency(showPayslipDialog.netSalary || 0)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 text-center">
                    Generated on {showPayslipDialog.generatedAt ? new Date(showPayslipDialog.generatedAt).toLocaleDateString() : 'N/A'} | This is a computer-generated document
                  </p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <footer className="border-t bg-white/50 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">{branding.companyName || 'Blumebyte'} HRIS</p>
            <p className="text-xs text-gray-300">Powered by Blumebyte</p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

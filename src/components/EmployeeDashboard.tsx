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
  User, Clock, CalendarDays, Megaphone, Loader2, Play, Square, Plus,
  CheckCircle, X, Briefcase, LayoutDashboard, FileText, MessageCircle, LogOut,
  Star, Video, MapPin, Building2, Phone, Mail, Printer, ArrowUpDown, ArrowUp, ArrowDown,
  DollarSign, Download, ListTodo, ClipboardCheck, Target, AlertCircle, ChevronRight,
  GraduationCap, ClipboardList, RefreshCw, FileCheck, GitMerge, BarChart3, TrendingUp,
  Shield, Scale, Eye, FileWarning, Ban, Gavel
} from 'lucide-react';
import { Progress } from './ui/progress';
import { MessagesPanel } from './MessagesPanel';
import { NotificationsBell } from './NotificationsBell';
import { SharedSelfServiceHub } from './SharedSelfServiceHub';
import { SharedMyProfile } from './SharedMyProfile';
import { ClockInOut } from './ClockInOut';
import { MeetingsPanel } from './MeetingsPanel';
import { useBranding, brandGradientStyle } from '../lib/branding-context';
import { UserLicenseAlert } from './LicenseStatusBanner';
import { TrainingManagement } from './TrainingManagement';

export function EmployeeDashboard() {
  const { user, accessToken, logout } = useAuth();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState('overview');

  // Poll batch auto-clockout every 60s for all accounts
  useEffect(() => {
    const runAutoClockout = () => {
      api('/attendance/batch-auto-clockout', { method: 'POST', body: '{}', token: accessToken }).catch(() => {});
    };
    runAutoClockout();
    const iv = setInterval(runAutoClockout, 60000);
    return () => clearInterval(iv);
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={brandGradientStyle(branding.primaryColor)}>
            {branding.logoUrl ? <img src={branding.logoUrl} alt="" className="w-full h-full object-contain p-0.5" /> : <span className="text-white font-bold text-sm">{branding.companyName?.[0] || 'B'}</span>}
          </div>
          <div><h1 className="text-sm font-semibold">{branding.companyName} HRIS</h1><p className="text-[10px] text-gray-400">Employee Portal</p></div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <Badge variant="outline" className="bg-gray-100 text-gray-700">Employee</Badge>
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-xs font-bold">{user?.name?.[0]}</div>
          )}
          <span className="text-sm text-gray-600">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-red-500 hover:bg-red-50" title="Log Out"><LogOut className="w-4 h-4 mr-1" /><span className="text-xs">Log Out</span></Button>
        </div>
      </header>
      <main className="p-6 max-w-5xl mx-auto">
        {/* License Status Alert for Non-SuperAdmin Users */}
        <UserLicenseAlert />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 w-full max-w-5xl h-auto">
            <TabsTrigger value="overview"><LayoutDashboard className="w-4 h-4 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-1" />Profile</TabsTrigger>
            <TabsTrigger value="attendance"><Clock className="w-4 h-4 mr-1" />Attendance</TabsTrigger>
            <TabsTrigger value="leave"><CalendarDays className="w-4 h-4 mr-1" />Leave</TabsTrigger>
            <TabsTrigger value="tasks"><ListTodo className="w-4 h-4 mr-1" />Tasks</TabsTrigger>
            <TabsTrigger value="onboarding"><ClipboardCheck className="w-4 h-4 mr-1" />Onboarding</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="w-4 h-4 mr-1" />Reviews</TabsTrigger>
            <TabsTrigger value="disciplinary"><AlertCircle className="w-4 h-4 mr-1" />Disciplinary</TabsTrigger>
            <TabsTrigger value="compliance"><FileCheck className="w-4 h-4 mr-1" />Compliance</TabsTrigger>
            <TabsTrigger value="training"><GraduationCap className="w-4 h-4 mr-1" />Training</TabsTrigger>
            <TabsTrigger value="meetings"><Video className="w-4 h-4 mr-1" />Meetings</TabsTrigger>
            <TabsTrigger value="messages"><MessageCircle className="w-4 h-4 mr-1" />Messages</TabsTrigger>
            <TabsTrigger value="questionnaires"><ClipboardList className="w-4 h-4 mr-1" />Questionnaires</TabsTrigger>
            <TabsTrigger value="self-service"><Briefcase className="w-4 h-4 mr-1" />Jobs</TabsTrigger>
            <TabsTrigger value="my-profile"><User className="w-4 h-4 mr-1" />My Profile</TabsTrigger>
            <TabsTrigger value="announcements"><Megaphone className="w-4 h-4 mr-1" />News</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><EmpOverview onNavigate={setActiveTab} /></TabsContent>
          <TabsContent value="profile"><EmpProfile /></TabsContent>
          <TabsContent value="attendance"><EmpAttendance /></TabsContent>
          <TabsContent value="leave"><EmpLeave /></TabsContent>
          <TabsContent value="tasks"><EmpTasks /></TabsContent>
          <TabsContent value="onboarding"><EmpOnboarding /></TabsContent>
          <TabsContent value="reviews"><EmpReviews /></TabsContent>
          <TabsContent value="disciplinary"><EmpDisciplinary /></TabsContent>
          <TabsContent value="compliance"><EmpCompliance /></TabsContent>
          <TabsContent value="training"><TrainingManagement mode="employee" /></TabsContent>
          <TabsContent value="questionnaires"><EmpQuestionnaires /></TabsContent>
          <TabsContent value="meetings"><MeetingsPanel mode="employee" /></TabsContent>
          <TabsContent value="messages"><MessagesPanel /></TabsContent>
          <TabsContent value="self-service"><SharedSelfServiceHub /></TabsContent>
          <TabsContent value="my-profile"><SharedMyProfile /></TabsContent>
          <TabsContent value="announcements"><EmpAnnouncements /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default EmployeeDashboard;

function EmpOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user, accessToken } = useAuth();
  const { branding } = useBranding();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [empStats, setEmpStats] = useState({ leaveBalance: 0, leaveTaken: 0, attendance: 0, pendingRequests: 0, assets: 0 });
  const [quickClock, setQuickClock] = useState<any>(null);
  const [quickClocking, setQuickClocking] = useState(false);
  const [autoClockSettings, setAutoClockSettings] = useState<any>(null);

  const loadOverview = useCallback(() => {
    Promise.all([
      api('/profile', { token: accessToken }).catch(() => null),
      api('/leave-requests', { token: accessToken }).catch(() => []),
      api('/my-payslips', { token: accessToken }).catch(() => []),
      api('/my-reviews', { token: accessToken }).catch(() => []),
      api('/meetings', { token: accessToken }).catch(() => []),
      api('/attendance/today', { token: accessToken }).catch(() => null),
      api('/auto-clock-settings', { token: accessToken }).catch(() => null),
    ]).then(([p, leaves, pslips, revs, mtgs, todayAtt, autoSettings]) => {
      setAutoClockSettings(autoSettings);
      setProfile(p || { name: user?.name, role: user?.role });
      setPayslips(Array.isArray(pslips) ? pslips : []);
      setQuickClock(todayAtt);
      setReviews(Array.isArray(revs) ? revs.sort((a: any, b: any) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()) : []);
      setMeetings(Array.isArray(mtgs) ? mtgs.filter((m: any) => m.status === 'scheduled' || m.status === 'pending-approval').sort((a: any, b: any) => (a.date || '').localeCompare(b.date || '')) : []);
      const myLeaves = Array.isArray(leaves) ? leaves.filter((l: any) => l.userId === (p?.id || user?.id)) : [];
      const approvedLeaves = myLeaves.filter((l: any) => l.status === 'approved');
      const pendingLeaves = myLeaves.filter((l: any) => l.status === 'pending');
      const totalLeaveDays = approvedLeaves.reduce((sum: number, l: any) => {
        if (l.startDate && l.endDate) {
          const days = Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return sum + days;
        }
        return sum + 1;
      }, 0);
      setEmpStats({
        leaveBalance: Math.max(0, 21 - totalLeaveDays),
        leaveTaken: totalLeaveDays,
        attendance: 0,
        pendingRequests: pendingLeaves.length,
        assets: 0,
      });
    }).catch(console.log).finally(() => setLoading(false));
  }, [accessToken, user]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { const iv = setInterval(loadOverview, 15000); return () => clearInterval(iv); }, [loadOverview]);

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  const ratingColor = (r: number) => r >= 4 ? 'text-green-600' : r >= 3 ? 'text-amber-600' : 'text-red-500';
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || r.score || 0), 0) / reviews.length).toFixed(1) : null;

  const printDoc = (title: string, content: string) => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('Popup blocked'); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333;} h1{font-size:20px;margin-bottom:4px;} .sub{font-size:12px;color:#888;margin-bottom:20px;} table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f3f4f6;font-weight:600;} .footer{margin-top:30px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px;}</style></head><body>${content}<div class="footer">Generated from ${branding.companyName} HRIS on ${new Date().toLocaleString()}</div><script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
  };

  const printReviews = () => {
    if (!profile) return;
    const rows = reviews.map(r => `<tr><td>${r.title || r.reviewType || r.period || 'Review'}</td><td>${r.reviewerName || r.reviewedBy || '—'}</td><td>${r.rating || r.score || '—'}/5</td><td>${r.status || '—'}</td><td>${r.comments || '—'}</td><td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date || '—'}</td></tr>`).join('');
    printDoc('Performance Reviews', `<h1>${branding.companyName} — Performance Review Report</h1><p class="sub">Employee: ${profile.name} | Average Rating: ${avgRating || 'N/A'} | Generated: ${new Date().toLocaleString()}</p><table><thead><tr><th>Review</th><th>Reviewer</th><th>Rating</th><th>Status</th><th>Comments</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`);
  };

  const printPayslips = () => {
    if (!profile) return;
    const rows = payslips.map(p => { const net = (parseFloat(p.basicSalary||0)+parseFloat(p.allowances||0)-parseFloat(p.deductions||0)).toFixed(2); return `<tr><td>${p.period||'—'}</td><td>${p.payDate||'—'}</td><td>GHS ${parseFloat(p.basicSalary||0).toLocaleString()}</td><td>GHS ${parseFloat(p.allowances||0).toLocaleString()}</td><td>GHS ${parseFloat(p.deductions||0).toLocaleString()}</td><td><strong>GHS ${parseFloat(net).toLocaleString()}</strong></td><td>${p.status||'pending'}</td></tr>`; }).join('');
    printDoc('Payslip Report', `<h1>${branding.companyName} — Payslip Report</h1><p class="sub">Employee: ${profile.name} | Generated: ${new Date().toLocaleString()}</p><table><thead><tr><th>Period</th><th>Pay Date</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`);
  };

  const handleQuickClockIn = async () => {
    setQuickClocking(true);
    try { const r = await api('/attendance/clock-in', { method: 'POST', body: '{}', token: accessToken }); setQuickClock(r); toast.success('Clocked in!'); loadOverview(); }
    catch (e: any) { toast.error(e.message); }
    setQuickClocking(false);
  };

  const handleQuickClockOut = async () => {
    setQuickClocking(true);
    try { const r = await api('/attendance/clock-out', { method: 'POST', body: '{}', token: accessToken }); setQuickClock(r); toast.success('Clocked out!'); loadOverview(); }
    catch (e: any) { toast.error(e.message); }
    setQuickClocking(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white overflow-hidden">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">Welcome, {profile?.name || user?.name}!</h2>
              <p className="text-blue-100 mt-1">Role: {profile?.role} {profile?.company ? `• ${profile.company}` : ''}</p>
              <p className="text-blue-200 text-sm mt-0.5">{profile?.department ? `${profile.department} Department` : ''} {profile?.position ? `• ${profile.position}` : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              {avgRating && (
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span className="text-lg font-bold">{avgRating}</span>
                  </div>
                  <p className="text-[10px] text-blue-100">Avg Rating</p>
                </div>
              )}
            </div>
          </div>
          {/* Quick Clock In/Out Bar */}
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-200" />
              <span className="text-sm text-blue-100">
                {quickClock?.clockIn && quickClock?.clockOut ? (
                  <><CheckCircle className="w-3.5 h-3.5 inline mr-1 text-green-300" />Day complete — In: {new Date(quickClock.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Out: {new Date(quickClock.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                ) : quickClock?.clockIn ? (
                  <>Working since {new Date(quickClock.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                ) : (
                  <>Not clocked in yet today</>
                )}
                {autoClockSettings?.enabled && (
                  <span className="ml-2 text-[10px] text-blue-200/80 bg-white/10 px-1.5 py-0.5 rounded">Auto-out at {autoClockSettings.clockOutTime || '17:00'}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!quickClock?.clockIn ? (
                <Button size="sm" onClick={handleQuickClockIn} disabled={quickClocking} className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm gap-1.5">
                  {quickClocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Quick Clock In
                </Button>
              ) : !quickClock?.clockOut ? (
                <Button size="sm" onClick={handleQuickClockOut} disabled={quickClocking} className="bg-red-500/80 hover:bg-red-500 text-white border-0 gap-1.5">
                  {quickClocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                  Quick Clock Out
                </Button>
              ) : (
                <Badge className="bg-green-400/30 text-green-100 border-0 text-xs">Completed</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clock In/Out - Full Details */}
      <ClockInOut />

      {/* Quick Details & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Details Card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-500" />Quick Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {profile?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">{profile.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{profile.phone}</span>
              </div>
            )}
            {profile?.department && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{profile.department}</span>
              </div>
            )}
            {profile?.position && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{profile.position}</span>
              </div>
            )}
            {(profile?.city || profile?.country) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {profile?.createdAt && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {!profile?.phone && !profile?.department && !profile?.position && (
              <p className="text-xs text-gray-400 text-center py-2">Complete your profile to see details here</p>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards - Clickable to navigate */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md hover:border-blue-200 transition-all" onClick={() => onNavigate('leave')}><CardContent className="pt-5 text-center"><CalendarDays className="w-6 h-6 mx-auto mb-1 text-blue-500" /><p className="text-xs text-gray-500">Leave Balance</p><p className="text-lg font-bold">{empStats.leaveBalance} days</p><p className="text-[10px] text-blue-500 mt-1">View Leave →</p></CardContent></Card>
          <Card className="cursor-pointer hover:shadow-md hover:border-orange-200 transition-all" onClick={() => onNavigate('leave')}><CardContent className="pt-5 text-center"><CalendarDays className="w-6 h-6 mx-auto mb-1 text-orange-500" /><p className="text-xs text-gray-500">Leave Taken</p><p className="text-lg font-bold">{empStats.leaveTaken} days</p><p className="text-[10px] text-orange-500 mt-1">View Leave →</p></CardContent></Card>
          <Card className="cursor-pointer hover:shadow-md hover:border-amber-200 transition-all" onClick={() => onNavigate('leave')}><CardContent className="pt-5 text-center"><FileText className="w-6 h-6 mx-auto mb-1 text-amber-500" /><p className="text-xs text-gray-500">Pending Requests</p><p className="text-lg font-bold">{empStats.pendingRequests}</p><p className="text-[10px] text-amber-500 mt-1">View Requests →</p></CardContent></Card>
          <Card className="cursor-pointer hover:shadow-md hover:border-purple-200 transition-all" onClick={() => onNavigate('meetings')}><CardContent className="pt-5 text-center"><Video className="w-6 h-6 mx-auto mb-1 text-purple-500" /><p className="text-xs text-gray-500">Upcoming Meetings</p><p className="text-lg font-bold">{meetings.length}</p><p className="text-[10px] text-purple-500 mt-1">View Meetings →</p></CardContent></Card>
        </div>
      </div>

      {/* Performance Reviews & Upcoming Meetings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reviews */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 cursor-pointer hover:text-amber-600" onClick={() => onNavigate('reviews')}><Star className="w-4 h-4 text-amber-500" />Performance Reviews<ChevronRight className="w-3.5 h-3.5 text-gray-400" /></CardTitle>
              {reviews.length > 0 && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={printReviews}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((r, i) => (
                  <div key={r.id || i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title || r.reviewType || r.period || 'Review'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.reviewerName || r.reviewedBy || 'Manager'} • {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date || '—'}
                      </p>
                      {r.comments && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.comments}</p>}
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <div className={`flex items-center gap-1 ${ratingColor(r.rating || r.score || 0)}`}>
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold text-sm">{r.rating || r.score || '—'}</span>
                      </div>
                      {r.status && <Badge className="mt-1 text-[10px]" variant="outline">{r.status}</Badge>}
                    </div>
                  </div>
                ))}
                {reviews.length > 5 && (
                  <p className="text-xs text-center text-blue-600">+{reviews.length - 5} more reviews</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2 cursor-pointer hover:text-blue-600" onClick={() => onNavigate('meetings')}><Video className="w-4 h-4 text-blue-500" />Upcoming Meetings<ChevronRight className="w-3.5 h-3.5 text-gray-400" /></CardTitle></CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Video className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming meetings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.slice(0, 5).map((m, i) => (
                  <div key={m.id || i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title || 'Meeting'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.date} {m.startTime ? `at ${m.startTime}` : ''}{m.endTime ? ` - ${m.endTime}` : ''}</p>
                      {m.organizerName && <p className="text-xs text-gray-400 mt-0.5">Organized by {m.organizerName}</p>}
                    </div>
                    <Badge className={m.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}>{m.status === 'pending-approval' ? 'Pending' : m.status}</Badge>
                  </div>
                ))}
                {meetings.length > 5 && (
                  <p className="text-xs text-center text-blue-600">+{meetings.length - 5} more meetings</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Print / Export Section */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Printer className="w-4 h-4 text-gray-500" />Quick Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={printReviews} disabled={reviews.length === 0}>
              <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500" />Print Performance Reviews{reviews.length > 0 && ` (${reviews.length})`}
            </Button>
            <Button variant="outline" size="sm" onClick={printPayslips} disabled={payslips.length === 0}>
              <DollarSign className="w-3.5 h-3.5 mr-1.5 text-green-500" />Print Payslips{payslips.length > 0 && ` (${payslips.length})`}
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              if (!profile) return;
              const csv = ['Type,Rating,Reviewer,Status,Date,Comments', ...reviews.map(r => `"${r.title||r.period||'Review'}",${r.rating||r.score||''},${r.reviewerName||r.reviewedBy||''},${r.status||''},"${r.createdAt?new Date(r.createdAt).toLocaleDateString():r.date||''}","${(r.comments||'').replace(/"/g,'""')}"`
              )].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'performance-reviews.csv'; a.click(); URL.revokeObjectURL(url);
              toast.success('Reviews exported');
            }} disabled={reviews.length === 0}>
              <Download className="w-3.5 h-3.5 mr-1.5 text-blue-500" />Export Reviews (CSV)
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              if (!profile) return;
              const csv = ['Period,Pay Date,Basic,Allowances,Deductions,Net,Status', ...payslips.map(p => {
                const net = (parseFloat(p.basicSalary||0)+parseFloat(p.allowances||0)-parseFloat(p.deductions||0)).toFixed(2);
                return `${p.period||''},${p.payDate||''},${p.basicSalary||0},${p.allowances||0},${p.deductions||0},${net},${p.status||'pending'}`;
              })].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'payslips.csv'; a.click(); URL.revokeObjectURL(url);
              toast.success('Payslips exported');
            }} disabled={payslips.length === 0}>
              <Download className="w-3.5 h-3.5 mr-1.5 text-green-500" />Export Payslips (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Apply Leave', icon: CalendarDays, tab: 'leave', color: 'bg-blue-500 hover:bg-blue-600' },
            { label: 'Clock In/Out', icon: Clock, tab: 'attendance', color: 'bg-green-500 hover:bg-green-600' },
            { label: 'My Profile', icon: User, tab: 'my-profile', color: 'bg-purple-500 hover:bg-purple-600' },
            { label: 'Training', icon: GraduationCap, tab: 'training', color: 'bg-amber-500 hover:bg-amber-600' },
            { label: 'My Tasks', icon: ListTodo, tab: 'tasks', color: 'bg-indigo-500 hover:bg-indigo-600' },
            { label: 'Meetings', icon: Video, tab: 'meetings', color: 'bg-pink-500 hover:bg-pink-600' },
            { label: 'Announcements', icon: Megaphone, tab: 'announcements', color: 'bg-cyan-500 hover:bg-cyan-600' },
            { label: 'Messages', icon: MessageCircle, tab: 'messages', color: 'bg-teal-500 hover:bg-teal-600' },
          ].map(link => {
            const Icon = link.icon;
            return (
              <Button
                key={link.label}
                className={`${link.color} text-white h-auto py-4 flex flex-col items-center gap-2`}
                onClick={() => onNavigate(link.tab)}
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

function EmpProfile() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otherGender, setOtherGender] = useState('');
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);

  const loadProfile = useCallback(async () => {
    try {
      const [p, changes] = await Promise.all([
        api('/profile', { token: accessToken }),
        api('/profile-change-requests', { token: accessToken }).catch(() => []),
      ]);
      setProfile(p || {});
      if (p?.gender && !['male', 'female', 'other'].includes(p.gender)) {
        setOtherGender(p.gender);
      }
      setPendingChanges(Array.isArray(changes) ? changes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { const iv = setInterval(loadProfile, 15000); return () => clearInterval(iv); }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api('/employee/profile', { method: 'PUT', body: JSON.stringify(profile), token: accessToken });
      if (result.pendingApproval) {
        toast.success('Change request submitted for HR approval');
        loadProfile();
      } else {
        toast.success('Profile updated');
      }
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  const hasPending = pendingChanges.some(c => c.status === 'pending');

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Pending Change Requests Info */}
      {hasPending && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Profile changes pending HR approval</p>
                <p className="text-xs text-amber-600 mt-0.5">Your recent profile edits are awaiting review by HR. Changes will be applied once approved.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs text-gray-500">Name</Label><p className="text-sm font-medium">{profile.name}</p></div>
            <div><Label className="text-xs text-gray-500">Email</Label><p className="text-sm font-medium">{profile.email}</p></div>
            <div><Label className="text-xs text-gray-500">Role</Label><p className="text-sm font-medium capitalize">{profile.role}</p></div>
            <div><Label className="text-xs text-gray-500">Company</Label><p className="text-sm font-medium">{profile.company || '—'}</p></div>
            <div><Label className="text-xs text-gray-500">Department</Label><p className="text-sm font-medium">{profile.department || '—'}</p></div>
            <div><Label className="text-xs text-gray-500">Position</Label><p className="text-sm font-medium">{profile.position || '—'}</p></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Editable Details</CardTitle>
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Requires HR Approval</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Phone</Label><Input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div><Label className="text-xs">Personal Email</Label><Input value={profile.personalEmail || ''} onChange={e => setProfile({ ...profile, personalEmail: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Address</Label><Input value={profile.address || ''} onChange={e => setProfile({ ...profile, address: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">City</Label><Input value={profile.city || ''} onChange={e => setProfile({ ...profile, city: e.target.value })} /></div>
            <div><Label className="text-xs">State</Label><Input value={profile.state || ''} onChange={e => setProfile({ ...profile, state: e.target.value })} /></div>
            <div><Label className="text-xs">Country</Label><Input value={profile.country || ''} onChange={e => setProfile({ ...profile, country: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Emergency Contact</Label><Input value={profile.emergencyContact || ''} onChange={e => setProfile({ ...profile, emergencyContact: e.target.value })} /></div>
            <div><Label className="text-xs">Emergency Phone</Label><Input value={profile.emergencyPhone || ''} onChange={e => setProfile({ ...profile, emergencyPhone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={profile.dateOfBirth || ''} onChange={e => setProfile({ ...profile, dateOfBirth: e.target.value })} /></div>
            <div><Label className="text-xs">Gender</Label>
              <Select value={['male','female','other'].includes(profile.gender) ? profile.gender : (profile.gender ? 'other' : '')} onValueChange={v => {
                if (v === 'other') {
                  setProfile({ ...profile, gender: otherGender || 'other' });
                } else {
                  setProfile({ ...profile, gender: v });
                  setOtherGender('');
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
              </Select>
              {(profile.gender === 'other' || (profile.gender && !['male','female'].includes(profile.gender))) && (
                <Input className="mt-2" placeholder="Specify gender..." value={otherGender || (profile.gender !== 'other' ? profile.gender : '')} onChange={e => { setOtherGender(e.target.value); setProfile({ ...profile, gender: e.target.value || 'other' }); }} autoFocus />
              )}</div>
            <div><Label className="text-xs">Nationality</Label><Input value={profile.nationality || ''} onChange={e => setProfile({ ...profile, nationality: e.target.value })} /></div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Submit Changes for Approval</Button>
        </CardContent>
      </Card>

      {/* Change Request History */}
      {pendingChanges.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Change Request History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingChanges.slice(0, 10).map(c => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                    <Badge className={statusColor(c.status)}>{c.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    {c.changedFields && Object.entries(c.changedFields).map(([field, vals]: [string, any]) => (
                      <div key={field} className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-red-500 line-through">{vals.oldValue || '(empty)'}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600">{vals.newValue}</span>
                      </div>
                    ))}
                  </div>
                  {c.status === 'rejected' && c.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2">Reason: {c.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmpAttendance() {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [today, setToday] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [attSort, setAttSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, h] = await Promise.all([api('/attendance/today', { token: accessToken }), api('/attendance/history?days=30', { token: accessToken })]);
      setToday(t);
      setHistory(Array.isArray(h) ? h : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const handleClockIn = async () => {
    setClocking(true);
    try { const r = await api('/attendance/clock-in', { method: 'POST', body: '{}', token: accessToken }); setToday(r); toast.success('Clocked in!'); load(); }
    catch (e: any) { toast.error(e.message); }
    setClocking(false);
  };

  const handleClockOut = async () => {
    setClocking(true);
    try { const r = await api('/attendance/clock-out', { method: 'POST', body: '{}', token: accessToken }); setToday(r); toast.success('Clocked out!'); load(); }
    catch (e: any) { toast.error(e.message); }
    setClocking(false);
  };

  const statusColor = (s: string) => { switch (s) { case 'present': return 'bg-green-100 text-green-800'; case 'late': return 'bg-amber-100 text-amber-800'; case 'overtime': return 'bg-blue-100 text-blue-800'; case 'absent': return 'bg-red-100 text-red-800'; default: return 'bg-gray-100 text-gray-800'; } };

  const toggleAttSort = (k: string) => setAttSort(p => p.key === k ? { key: k, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'desc' });
  const sortedHistory = [...history].sort((a, b) => { const av = a[attSort.key]||'', bv = b[attSort.key]||''; if (attSort.key === 'regularMinutes' || attSort.key === 'overtimeMinutes') return attSort.dir === 'asc' ? (Number(av)||0)-(Number(bv)||0) : (Number(bv)||0)-(Number(av)||0); return attSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
  const AttSI = ({ c }: { c: string }) => attSort.key === c ? (attSort.dir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />) : <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader><CardTitle className="text-sm">Today's Attendance — {new Date().toLocaleDateString()}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {!today?.clockIn ? (
              <Button onClick={handleClockIn} disabled={clocking} className="bg-green-600 hover:bg-green-700">
                {clocking ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}Clock In
              </Button>
            ) : !today?.clockOut ? (
              <Button onClick={handleClockOut} disabled={clocking} variant="destructive">
                {clocking ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Square className="w-4 h-4 mr-1" />}Clock Out
              </Button>
            ) : (
              <Badge className="bg-green-100 text-green-800 text-sm py-1 px-3"><CheckCircle className="w-4 h-4 mr-1 inline" />Day Complete</Badge>
            )}
            {today && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {today.clockIn && <span>In: {new Date(today.clockIn).toLocaleTimeString()}</span>}
                {today.clockOut && <span>Out: {new Date(today.clockOut).toLocaleTimeString()}</span>}
                <Badge className={statusColor(today.status)}>{today.status}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Attendance History (Last 30 Days)</CardTitle>
            {history.length > 0 && <Button variant="outline" size="sm" onClick={() => {
              const w = window.open('', '_blank'); if (!w) { toast.error('Popup blocked'); return; }
              const rows = sortedHistory.map(r => `<tr><td>${r.date}</td><td>${r.clockIn?new Date(r.clockIn).toLocaleTimeString():'—'}</td><td>${r.clockOut?new Date(r.clockOut).toLocaleTimeString():'—'}</td><td>${r.regularMinutes?`${Math.floor(r.regularMinutes/60)}h ${r.regularMinutes%60}m`:'—'}</td><td>${r.overtimeMinutes?`${Math.floor(r.overtimeMinutes/60)}h ${r.overtimeMinutes%60}m`:'—'}</td><td>${r.status||'—'}</td></tr>`).join('');
              w.document.write(`<!DOCTYPE html><html><head><title>Attendance</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333;} h1{font-size:20px;} .sub{font-size:12px;color:#888;margin-bottom:16px;} table{width:100%;border-collapse:collapse;font-size:12px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f3f4f6;} .footer{margin-top:30px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px;}</style></head><body><h1>${branding.companyName} — Attendance Report</h1><p class="sub">Last 30 Days | Generated: ${new Date().toLocaleString()}</p><table><thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Regular</th><th>Overtime</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">Generated from ${branding.companyName} HRIS</div><script>window.onload=function(){window.print();}</script></body></html>`);
              w.document.close();
            }}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? <div className="py-8 text-center text-gray-400">No attendance records</div> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleAttSort('date')}>Date<AttSI c="date" /></TableHead>
                <TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleAttSort('regularMinutes')}>Regular<AttSI c="regularMinutes" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleAttSort('overtimeMinutes')}>Overtime<AttSI c="overtimeMinutes" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleAttSort('status')}>Status<AttSI c="status" /></TableHead>
              </TableRow></TableHeader>
              <TableBody>{sortedHistory.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.date}</TableCell>
                  <TableCell className="text-sm">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '—'}</TableCell>
                  <TableCell className="text-sm">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '—'}</TableCell>
                  <TableCell className="text-sm">{r.regularMinutes ? `${Math.floor(r.regularMinutes / 60)}h ${r.regularMinutes % 60}m` : '—'}</TableCell>
                  <TableCell className="text-sm">{r.overtimeMinutes ? `${Math.floor(r.overtimeMinutes / 60)}h ${r.overtimeMinutes % 60}m` : '—'}</TableCell>
                  <TableCell><Badge className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmpLeave() {
  const { accessToken } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [leaveSort, setLeaveSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, lt] = await Promise.all([api('/leave-requests', { token: accessToken }), api('/admin/leave-types', { token: accessToken }).catch(() => [])]);
      setLeaves(Array.isArray(l) ? l : []);
      setLeaveTypes(Array.isArray(lt) ? lt : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api('/leave-requests', { method: 'POST', body: JSON.stringify(formData), token: accessToken });
      toast.success('Leave request submitted');
      setDialogOpen(false);
      setFormData({});
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const statusColor = (s: string) => { switch (s) { case 'approved': return 'bg-green-100 text-green-800'; case 'rejected': return 'bg-red-100 text-red-800'; default: return 'bg-amber-100 text-amber-800'; } };
  const toggleLeaveSort = (k: string) => setLeaveSort(p => p.key === k ? { key: k, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'desc' });
  const sortedLeaves = [...leaves].sort((a, b) => { const av = a[leaveSort.key]||'', bv = b[leaveSort.key]||''; return leaveSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
  const LSI = ({ c }: { c: string }) => leaveSort.key === c ? (leaveSort.dir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />) : <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex justify-end"><Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Request Leave</Button></div>
      <Card><CardContent className="p-0">
        {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : leaves.length === 0 ? (
          <div className="py-16 text-center text-gray-400"><CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No leave requests yet</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleLeaveSort('leaveType')}>Type<LSI c="leaveType" /></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleLeaveSort('startDate')}>From<LSI c="startDate" /></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleLeaveSort('endDate')}>To<LSI c="endDate" /></TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleLeaveSort('status')}>Status<LSI c="status" /></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleLeaveSort('createdAt')}>Submitted<LSI c="createdAt" /></TableHead>
            </TableRow></TableHeader>
            <TableBody>{sortedLeaves.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.leaveType || '—'}</TableCell>
                <TableCell className="text-sm">{l.startDate}</TableCell><TableCell className="text-sm">{l.endDate}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{l.reason || '—'}</TableCell>
                <TableCell><Badge className={statusColor(l.status)}>{l.status}</Badge></TableCell>
                <TableCell className="text-sm text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Leave Type</Label>
              {leaveTypes.length > 0 ? (
                <Select value={formData.leaveType || ''} onValueChange={v => setFormData({ ...formData, leaveType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{leaveTypes.map(lt => <SelectItem key={lt.id} value={lt.name}>{lt.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={formData.leaveType || ''} onChange={e => setFormData({ ...formData, leaveType: e.target.value })} placeholder="e.g., Vacation, Sick, Personal" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Start Date</Label><Input type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} /></div>
              <div><Label className="text-xs">End Date</Label><Input type="date" value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Reason</Label><Textarea value={formData.reason || ''} onChange={e => setFormData({ ...formData, reason: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmpAnnouncements() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api('/announcements', { token: accessToken });
      setItems(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return items.length === 0 ? (
    <div className="text-center py-16 text-gray-400"><Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No announcements</p></div>
  ) : (
    <div className="space-y-3 max-w-3xl">{items.map(i => (
      <Card key={i.id}><CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-medium">{i.title}</h3>
          <Badge className={i.priority === 'urgent' ? 'bg-red-100 text-red-800' : i.priority === 'important' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}>{i.priority}</Badge>
          {i.createdByRole === 'superadmin' && <Badge className="bg-purple-100 text-purple-800">Company</Badge>}
          {i.createdByRole === 'admin' && <Badge className="bg-indigo-100 text-indigo-800">Admin</Badge>}
        </div>
        <p className="text-sm text-gray-600">{i.content}</p>
        <p className="text-xs text-gray-400 mt-2">{i.authorName} {'\u2022'} {new Date(i.createdAt).toLocaleDateString()}</p>
      </CardContent></Card>
    ))}</div>
  );
}

function EmpTasks() {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<any>(null);

  const load = useCallback(async () => {
    try { const d = await api('/my-tasks', { token: accessToken }); setTasks(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt||0).getTime() - new Date(a.createdAt||0).getTime()) : []); } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try { await api(`/my-tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status }), token: accessToken }); toast.success(`Task marked as ${status}`); load(); } catch (e: any) { toast.error(e.message); }
    setUpdating(null);
  };

  const stColor = (s: string) => { switch (s) { case 'completed': case 'approved': return 'bg-green-100 text-green-800'; case 'in-progress': return 'bg-blue-100 text-blue-800'; case 'overdue': return 'bg-red-100 text-red-800'; default: return 'bg-gray-100 text-gray-800'; } };
  const priColor = (p: string) => { switch (p) { case 'high': case 'urgent': return 'border-red-300 text-red-600'; case 'medium': return 'border-amber-300 text-amber-600'; default: return 'border-gray-300 text-gray-500'; } };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const pending = tasks.filter(t => !['completed','approved'].includes(t.status)).length;
  const completed = tasks.filter(t => ['completed','approved'].includes(t.status)).length;

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold flex items-center gap-2"><ListTodo className="w-5 h-5 text-blue-500" />My Tasks</h2><p className="text-sm text-gray-500">{tasks.length} total · {pending} pending · {completed} done</p></div>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Tasks</SelectItem><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><ListTodo className="w-5 h-5 mx-auto mb-1 text-blue-500" /><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{tasks.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" /><p className="text-xs text-gray-500">Pending</p><p className="text-lg font-bold">{pending}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" /><p className="text-xs text-gray-500">Completed</p><p className="text-lg font-bold">{completed}</p></CardContent></Card>
      </div>
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400"><ListTodo className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No tasks {filter !== 'all' ? `with status "${filter}"` : 'assigned to you'}</p></CardContent></Card>
      ) : (
        <div className="space-y-3">{filtered.map(t => (
          <Card key={t.id} className={`hover:shadow-sm transition-all ${['completed','approved'].includes(t.status) ? 'opacity-70' : ''}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailTask(t)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate">{t.title || t.name || 'Untitled Task'}</h3>
                    <Badge className={stColor(t.status)}>{t.status || 'todo'}</Badge>
                    {t.priority && <Badge variant="outline" className={priColor(t.priority)}>{t.priority}</Badge>}
                  </div>
                  {t.description && <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {t.dueDate && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                    {t.category && <span className="flex items-center gap-1"><Target className="w-3 h-3" />{t.category}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-3">
                  {t.status === 'todo' && <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, 'in-progress')} disabled={updating === t.id}>{updating === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}Start</Button>}
                  {t.status === 'in-progress' && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(t.id, 'completed')} disabled={updating === t.id}>{updating === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}Done</Button>}
                  {['completed','approved'].includes(t.status) && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}
      <Dialog open={!!detailTask} onOpenChange={() => setDetailTask(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{detailTask?.title || 'Task Details'}</DialogTitle></DialogHeader>
          {detailTask && (<div className="space-y-4 py-2">
            <div className="flex gap-2 flex-wrap"><Badge className={stColor(detailTask.status)}>{detailTask.status}</Badge>{detailTask.priority && <Badge variant="outline" className={priColor(detailTask.priority)}>{detailTask.priority}</Badge>}{detailTask.category && <Badge variant="outline">{detailTask.category}</Badge>}</div>
            {detailTask.description && <div><Label className="text-xs text-gray-500">Description</Label><p className="text-sm mt-1">{detailTask.description}</p></div>}
            <div className="grid grid-cols-2 gap-3">
              {detailTask.dueDate && <div><Label className="text-xs text-gray-500">Due Date</Label><p className="text-sm">{new Date(detailTask.dueDate).toLocaleDateString()}</p></div>}
              {detailTask.createdAt && <div><Label className="text-xs text-gray-500">Created</Label><p className="text-sm">{new Date(detailTask.createdAt).toLocaleDateString()}</p></div>}
              {detailTask.assignedByName && <div><Label className="text-xs text-gray-500">Assigned By</Label><p className="text-sm">{detailTask.assignedByName}</p></div>}
            </div>
            {detailTask.notes && <div><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm mt-1 p-3 bg-gray-50 rounded">{detailTask.notes}</p></div>}
          </div>)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTask(null)}>Close</Button>
            {detailTask?.status === 'todo' && <Button onClick={() => { updateStatus(detailTask.id, 'in-progress'); setDetailTask(null); }}>Start Task</Button>}
            {detailTask?.status === 'in-progress' && <Button className="bg-green-600 hover:bg-green-700" onClick={() => { updateStatus(detailTask.id, 'completed'); setDetailTask(null); }}>Mark Complete</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmpOnboarding() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await api('/my-onboarding', { token: accessToken }); setItems(Array.isArray(d) ? d.sort((a: any, b: any) => { const o: Record<string, number> = { todo: 0, 'in-progress': 1, completed: 2 }; return (o[a.status]??0) - (o[b.status]??0); }) : []); } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try { await api(`/my-onboarding/${id}`, { method: 'PUT', body: JSON.stringify({ status }), token: accessToken }); toast.success(`Item marked as ${status}`); load(); } catch (e: any) { toast.error(e.message); }
    setUpdating(null);
  };

  const done = items.filter(i => i.status === 'completed').length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h2 className="text-lg font-bold flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-green-500" />My Onboarding</h2><p className="text-sm text-gray-500">Complete your onboarding checklist to get started</p></div>
      {items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">No onboarding items assigned to you</p><p className="text-xs text-gray-400 mt-1">Your HR team will assign onboarding tasks when applicable</p></CardContent></Card>
      ) : (<>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3"><div><p className="text-sm font-semibold text-green-800">Onboarding Progress</p><p className="text-xs text-green-600">{done} of {items.length} items completed</p></div><p className="text-2xl font-bold text-green-700">{progress}%</p></div>
            <Progress value={progress} className="h-2.5" />
            {progress === 100 && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />All onboarding items completed!</p>}
          </CardContent>
        </Card>
        <div className="space-y-3">{items.map((item, idx) => {
          const isComplete = item.status === 'completed';
          return (
            <Card key={item.id} className={`transition-all ${isComplete ? 'opacity-60 bg-green-50/30' : 'hover:shadow-sm'}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isComplete ? 'bg-green-100 text-green-600' : item.status === 'in-progress' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isComplete ? <CheckCircle className="w-4 h-4" /> : item.status === 'in-progress' ? <Clock className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`text-sm font-semibold ${isComplete ? 'line-through text-gray-500' : ''}`}>{item.title || item.name || 'Onboarding Item'}</h3>
                      <Badge className={isComplete ? 'bg-green-100 text-green-800' : item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>{item.status || 'todo'}</Badge>
                      {item.priority && <Badge variant="outline" className={item.priority === 'high' ? 'border-red-300 text-red-600' : ''}>{item.priority}</Badge>}
                    </div>
                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                      {item.responsible && <span>Responsible: {item.responsible}</span>}
                      {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {item.status === 'todo' && <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'in-progress')} disabled={updating === item.id}>{updating === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}Start</Button>}
                    {item.status === 'in-progress' && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(item.id, 'completed')} disabled={updating === item.id}>{updating === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}Complete</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}</div>
      </>)}
    </div>
  );
}

function EmpReviews() {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  const load = useCallback(async () => {
    try { const d = await api('/my-reviews', { token: accessToken }); setReviews(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt||b.date||0).getTime() - new Date(a.createdAt||a.date||0).getTime()) : []); } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const ratingColor = (r: number) => r >= 4 ? 'text-green-600 bg-green-50' : r >= 3 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50';
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating || r.score || 0), 0) / reviews.length : 0;

  const printReviews = () => {
    const w = window.open('', '_blank'); if (!w) { toast.error('Popup blocked'); return; }
    const rows = reviews.map(r => `<tr><td>${r.title||r.reviewType||r.period||'Review'}</td><td>${r.reviewerName||r.reviewedBy||'—'}</td><td>${r.rating||r.score||'—'}/5</td><td>${r.status||'—'}</td><td>${r.comments||'—'}</td><td>${r.createdAt?new Date(r.createdAt).toLocaleDateString():r.date||'—'}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Reviews</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333;} h1{font-size:20px;} .sub{font-size:12px;color:#888;margin-bottom:16px;} table{width:100%;border-collapse:collapse;font-size:12px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f3f4f6;} .footer{margin-top:30px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px;}</style></head><body><h1>${branding.companyName} — Performance Reviews</h1><p class="sub">Average: ${avgRating.toFixed(1)}/5 | Generated: ${new Date().toLocaleString()}</p><table><thead><tr><th>Review</th><th>Reviewer</th><th>Rating</th><th>Status</th><th>Comments</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">Generated from ${branding.companyName} HRIS</div><script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" />Performance Reviews</h2><p className="text-sm text-gray-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''} {avgRating > 0 ? `· Average: ${avgRating.toFixed(1)}/5` : ''}</p></div>
        {reviews.length > 0 && <Button variant="outline" size="sm" onClick={printReviews}><Printer className="w-3.5 h-3.5 mr-1" />Print Report</Button>}
      </div>
      {reviews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 text-center"><div className="flex items-center justify-center gap-1 mb-1"><Star className="w-5 h-5 text-amber-400 fill-amber-400" /><span className="text-xl font-bold">{avgRating.toFixed(1)}</span></div><p className="text-xs text-gray-500">Average Rating</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-xl font-bold">{reviews.length}</p><p className="text-xs text-gray-500">Total Reviews</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-xl font-bold">{reviews.filter(r => (r.rating||r.score||0) >= 4).length}</p><p className="text-xs text-gray-500">Excellent (4+)</p></CardContent></Card>
        </div>
      )}
      {reviews.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><Star className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">No performance reviews yet</p><p className="text-xs text-gray-400 mt-1">Reviews will appear here once submitted by your manager</p></CardContent></Card>
      ) : (
        <div className="space-y-3">{reviews.map((r, i) => {
          const rating = r.rating || r.score || 0;
          return (
            <Card key={r.id || i} className="hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedReview(r)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><h3 className="text-sm font-semibold">{r.title || r.reviewType || r.period || 'Performance Review'}</h3>{r.status && <Badge variant="outline">{r.status}</Badge>}{r.reviewType && <Badge variant="outline" className="text-[10px]">{r.reviewType}</Badge>}</div>
                    <p className="text-xs text-gray-500">{r.reviewerName || r.reviewedBy || 'Manager'} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date || '—'}</p>
                    {r.comments && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{r.comments}</p>}
                    {r.goals && r.goals.length > 0 && <p className="text-[11px] text-blue-500 mt-1">{r.goals.length} goal{r.goals.length !== 1 ? 's' : ''} tracked</p>}
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${ratingColor(rating)}`}><Star className="w-4 h-4 fill-current" /><span className="font-bold">{rating || '—'}</span><span className="text-xs">/5</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}</div>
      )}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{selectedReview?.title || selectedReview?.reviewType || 'Review Details'}</DialogTitle></DialogHeader>
          {selectedReview && (<div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${ratingColor(selectedReview.rating||selectedReview.score||0)}`}><Star className="w-5 h-5 fill-current" /><span className="text-xl font-bold">{selectedReview.rating||selectedReview.score||'—'}</span><span className="text-sm">/5</span></div>
              {selectedReview.status && <Badge>{selectedReview.status}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-gray-500">Reviewer</Label><p className="text-sm font-medium">{selectedReview.reviewerName||selectedReview.reviewedBy||'—'}</p></div>
              <div><Label className="text-xs text-gray-500">Date</Label><p className="text-sm">{selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleDateString() : selectedReview.date||'—'}</p></div>
              {selectedReview.period && <div><Label className="text-xs text-gray-500">Period</Label><p className="text-sm">{selectedReview.period}</p></div>}
            </div>
            {selectedReview.comments && <div><Label className="text-xs text-gray-500">Comments</Label><p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedReview.comments}</p></div>}
            {selectedReview.publicNotes && <div><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm mt-1 p-3 bg-blue-50 rounded-lg">{selectedReview.publicNotes}</p></div>}
            {selectedReview.goals?.length > 0 && (<div><Label className="text-xs text-gray-500 mb-2 block">Goals</Label><div className="space-y-2">{selectedReview.goals.map((g: any, gi: number) => (<div key={gi} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"><Badge className={g.status === 'completed' ? 'bg-green-100 text-green-800' : g.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>{g.status||'pending'}</Badge><span className="flex-1">{g.description||g.title}</span></div>))}</div></div>)}
            {selectedReview.actionItems?.length > 0 && (<div><Label className="text-xs text-gray-500 mb-2 block">Action Items</Label><div className="space-y-2">{selectedReview.actionItems.map((a: any, ai: number) => (<div key={ai} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"><CheckCircle className={`w-4 h-4 ${a.completed ? 'text-green-500' : 'text-gray-300'}`} /><span className="flex-1">{a.description}</span>{a.dueDate && <span className="text-xs text-gray-400">{new Date(a.dueDate).toLocaleDateString()}</span>}</div>))}</div></div>)}
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedReview(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmpTraining() {
  const { accessToken } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const d = await api('/my-training', { token: accessToken });
      setPrograms(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const stColor = (s: string) => {
    switch (s) { case 'completed': return 'bg-green-100 text-green-800'; case 'active': return 'bg-blue-100 text-blue-800'; case 'planned': return 'bg-amber-100 text-amber-800'; default: return 'bg-gray-100 text-gray-800'; }
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-cyan-500" />My Training Programs</h2>
          <p className="text-sm text-gray-500">{programs.length} program{programs.length !== 1 ? 's' : ''} assigned</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><GraduationCap className="w-5 h-5 mx-auto mb-1 text-cyan-500" /><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{programs.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" /><p className="text-xs text-gray-500">Active</p><p className="text-lg font-bold">{programs.filter(p => p.status === 'active').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" /><p className="text-xs text-gray-500">Completed</p><p className="text-lg font-bold">{programs.filter(p => p.status === 'completed').length}</p></CardContent></Card>
      </div>
      {programs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400"><GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No training programs assigned to you yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">{programs.map(p => (
          <Card key={p.id} className="hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedProgram(p)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate">{p.name || 'Untitled Program'}</h3>
                    <Badge className={stColor(p.status || 'planned')}>{p.status || 'planned'}</Badge>
                    {p.type && <Badge variant="outline" className="text-[10px]">{p.type}</Badge>}
                  </div>
                  {p.description && <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                    {p.startDate && <span>Start: {new Date(p.startDate).toLocaleDateString()}</span>}
                    {p.endDate && <span>End: {new Date(p.endDate).toLocaleDateString()}</span>}
                    {p.duration && <span>{p.duration} hours</span>}
                    {p.instructorName && <span>Instructor: {p.instructorName}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}
      <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{selectedProgram?.name || 'Training Details'}</DialogTitle></DialogHeader>
          {selectedProgram && (<div className="space-y-4 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={stColor(selectedProgram.status || 'planned')}>{selectedProgram.status || 'planned'}</Badge>
              {selectedProgram.type && <Badge variant="outline">{selectedProgram.type}</Badge>}
            </div>
            {selectedProgram.description && <div><Label className="text-xs text-gray-500">Description</Label><p className="text-sm mt-1">{selectedProgram.description}</p></div>}
            <div className="grid grid-cols-2 gap-3">
              {selectedProgram.startDate && <div><Label className="text-xs text-gray-500">Start Date</Label><p className="text-sm">{new Date(selectedProgram.startDate).toLocaleDateString()}</p></div>}
              {selectedProgram.endDate && <div><Label className="text-xs text-gray-500">End Date</Label><p className="text-sm">{new Date(selectedProgram.endDate).toLocaleDateString()}</p></div>}
              {selectedProgram.duration && <div><Label className="text-xs text-gray-500">Duration</Label><p className="text-sm">{selectedProgram.duration} hours</p></div>}
              {selectedProgram.instructorName && <div><Label className="text-xs text-gray-500">Instructor</Label><p className="text-sm">{selectedProgram.instructorName}</p></div>}
            </div>
            {Array.isArray(selectedProgram.assessmentQuestions) && selectedProgram.assessmentQuestions.length > 0 && (
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Assessment Questions</Label>
                <div className="space-y-2">
                  {selectedProgram.assessmentQuestions.map((q: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-400 font-mono min-w-[24px]">Q{idx + 1}.</span>
                      <span className="text-sm">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedProgram(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmpQuestionnaires() {
  const { accessToken } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const d = await api('/my-questionnaires', { token: accessToken });
      setFeedbacks(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const stColor = (s: string) => {
    switch (s) { case 'submitted': case 'reviewed': return 'bg-green-100 text-green-800'; case 'pending': return 'bg-amber-100 text-amber-800'; default: return 'bg-gray-100 text-gray-800'; }
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-500" />My Questionnaires & 360° Feedback</h2>
          <p className="text-sm text-gray-500">{feedbacks.length} feedback item{feedbacks.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><ClipboardList className="w-5 h-5 mx-auto mb-1 text-purple-500" /><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{feedbacks.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" /><p className="text-xs text-gray-500">Pending</p><p className="text-lg font-bold">{feedbacks.filter(f => f.status === 'pending').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" /><p className="text-xs text-gray-500">Completed</p><p className="text-lg font-bold">{feedbacks.filter(f => f.status === 'submitted' || f.status === 'reviewed').length}</p></CardContent></Card>
      </div>
      {feedbacks.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400"><ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No questionnaires or feedback assigned to you yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">{feedbacks.map(f => (
          <Card key={f.id} className="hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedFeedback(f)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate">{f.type ? `360\u00b0 ${f.type.charAt(0).toUpperCase() + f.type.slice(1)} Feedback` : 'Feedback'}</h3>
                    <Badge className={stColor(f.status || 'pending')}>{f.status || 'pending'}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    {f.period && <span>Period: {f.period}</span>}
                    {f.employeeName && <span>Employee: {f.employeeName}</span>}
                    {f.reviewerName && <span>Reviewer: {f.reviewerName}</span>}
                    {f.createdAt && <span>{new Date(f.createdAt).toLocaleDateString()}</span>}
                  </div>
                  {(f.communication || f.teamwork || f.leadership || f.technical) && (
                    <div className="flex items-center gap-3 mt-1.5">
                      {f.communication && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">Comm: {f.communication}/5</span>}
                      {f.teamwork && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600">Team: {f.teamwork}/5</span>}
                      {f.leadership && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">Lead: {f.leadership}/5</span>}
                      {f.technical && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">Tech: {f.technical}/5</span>}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{selectedFeedback?.type ? `360\u00b0 ${selectedFeedback.type.charAt(0).toUpperCase() + selectedFeedback.type.slice(1)} Feedback` : 'Feedback Details'}</DialogTitle></DialogHeader>
          {selectedFeedback && (<div className="space-y-4 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={stColor(selectedFeedback.status || 'pending')}>{selectedFeedback.status || 'pending'}</Badge>
              {selectedFeedback.type && <Badge variant="outline">{selectedFeedback.type}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {selectedFeedback.period && <div><Label className="text-xs text-gray-500">Period</Label><p className="text-sm">{selectedFeedback.period}</p></div>}
              {selectedFeedback.employeeName && <div><Label className="text-xs text-gray-500">Employee</Label><p className="text-sm">{selectedFeedback.employeeName}</p></div>}
              {selectedFeedback.reviewerName && <div><Label className="text-xs text-gray-500">Reviewer</Label><p className="text-sm">{selectedFeedback.reviewerName}</p></div>}
              {selectedFeedback.createdAt && <div><Label className="text-xs text-gray-500">Date</Label><p className="text-sm">{new Date(selectedFeedback.createdAt).toLocaleDateString()}</p></div>}
            </div>
            {(selectedFeedback.communication || selectedFeedback.teamwork || selectedFeedback.leadership || selectedFeedback.technical) && (
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Ratings</Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFeedback.communication && <div className="flex items-center justify-between p-2 bg-blue-50 rounded"><span className="text-xs text-blue-700">Communication</span><span className="font-bold text-blue-700">{selectedFeedback.communication}/5</span></div>}
                  {selectedFeedback.teamwork && <div className="flex items-center justify-between p-2 bg-green-50 rounded"><span className="text-xs text-green-700">Teamwork</span><span className="font-bold text-green-700">{selectedFeedback.teamwork}/5</span></div>}
                  {selectedFeedback.leadership && <div className="flex items-center justify-between p-2 bg-purple-50 rounded"><span className="text-xs text-purple-700">Leadership</span><span className="font-bold text-purple-700">{selectedFeedback.leadership}/5</span></div>}
                  {selectedFeedback.technical && <div className="flex items-center justify-between p-2 bg-amber-50 rounded"><span className="text-xs text-amber-700">Technical</span><span className="font-bold text-amber-700">{selectedFeedback.technical}/5</span></div>}
                </div>
              </div>
            )}
            {selectedFeedback.comments && <div><Label className="text-xs text-gray-500">Comments</Label><p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedFeedback.comments}</p></div>}
            {Array.isArray(selectedFeedback.customQuestions) && selectedFeedback.customQuestions.length > 0 && (
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Custom Questions</Label>
                <div className="space-y-2">
                  {selectedFeedback.customQuestions.map((q: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-400 font-mono min-w-[24px]">Q{idx + 1}.</span>
                      <span className="text-sm">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedFeedback(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmpDisciplinary() {
  const { accessToken } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const d = await api('/my-disciplinary', { token: accessToken });
      setCases(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const severityColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'critical': case 'termination': return 'bg-red-100 text-red-800 border-red-200';
      case 'major': case 'suspension': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': case 'written-warning': case 'written_warning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'verbal': case 'verbal-warning': case 'verbal_warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const discStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'resolved': case 'closed': return 'bg-green-100 text-green-800';
      case 'open': case 'active': case 'pending': return 'bg-red-100 text-red-800';
      case 'under-review': case 'under_review': case 'investigating': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openCases = cases.filter(c => !['resolved', 'closed'].includes(c.status?.toLowerCase()));
  const resolvedCases = cases.filter(c => ['resolved', 'closed'].includes(c.status?.toLowerCase()));

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500" />Disciplinary Records</h2>
          <p className="text-sm text-gray-500">{cases.length} record{cases.length !== 1 ? 's' : ''} · {openCases.length} open · {resolvedCases.length} resolved</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>
      {cases.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 text-center"><AlertCircle className="w-5 h-5 mx-auto mb-1 text-gray-500" /><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{cases.length}</p></CardContent></Card>
          <Card className={openCases.length > 0 ? 'border-red-200' : ''}><CardContent className="pt-4 text-center"><Ban className="w-5 h-5 mx-auto mb-1 text-red-500" /><p className="text-xs text-gray-500">Open</p><p className="text-lg font-bold text-red-600">{openCases.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" /><p className="text-xs text-gray-500">Resolved</p><p className="text-lg font-bold text-green-600">{resolvedCases.length}</p></CardContent></Card>
        </div>
      )}
      {cases.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No disciplinary records</p>
          <p className="text-xs text-gray-400 mt-1">You have a clean record. Keep up the good work!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">{cases.map((c, i) => (
          <Card key={c.id || i} className="hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedCase(c)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold truncate">{c.title || c.type || c.incidentType || 'Disciplinary Case'}</h3>
                    <Badge className={discStatusColor(c.status)}>{c.status || 'open'}</Badge>
                    {(c.severity || c.type) && <Badge variant="outline" className={severityColor(c.severity || c.type)}>{c.severity || c.type}</Badge>}
                  </div>
                  {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                    {(c.date || c.incidentDate) && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(c.date || c.incidentDate).toLocaleDateString()}</span>}
                    {c.issuedBy && <span>Issued by: {c.issuedBy}</span>}
                    {c.department && <span>{c.department}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{selectedCase?.title || selectedCase?.type || 'Disciplinary Details'}</DialogTitle></DialogHeader>
          {selectedCase && (<div className="space-y-4 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={discStatusColor(selectedCase.status)}>{selectedCase.status || 'open'}</Badge>
              {(selectedCase.severity || selectedCase.type) && <Badge variant="outline" className={severityColor(selectedCase.severity || selectedCase.type)}>{selectedCase.severity || selectedCase.type}</Badge>}
            </div>
            {selectedCase.description && <div><Label className="text-xs text-gray-500">Description</Label><p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedCase.description}</p></div>}
            <div className="grid grid-cols-2 gap-3">
              {(selectedCase.date || selectedCase.incidentDate) && <div><Label className="text-xs text-gray-500">Incident Date</Label><p className="text-sm">{new Date(selectedCase.date || selectedCase.incidentDate).toLocaleDateString()}</p></div>}
              {selectedCase.issuedBy && <div><Label className="text-xs text-gray-500">Issued By</Label><p className="text-sm">{selectedCase.issuedBy}</p></div>}
              {selectedCase.department && <div><Label className="text-xs text-gray-500">Department</Label><p className="text-sm">{selectedCase.department}</p></div>}
              {selectedCase.createdAt && <div><Label className="text-xs text-gray-500">Created</Label><p className="text-sm">{new Date(selectedCase.createdAt).toLocaleDateString()}</p></div>}
            </div>
            {selectedCase.actionTaken && <div><Label className="text-xs text-gray-500">Action Taken</Label><p className="text-sm mt-1 p-3 bg-amber-50 rounded-lg border border-amber-100">{selectedCase.actionTaken}</p></div>}
            {selectedCase.resolution && <div><Label className="text-xs text-gray-500">Resolution</Label><p className="text-sm mt-1 p-3 bg-green-50 rounded-lg border border-green-100">{selectedCase.resolution}</p></div>}
            {selectedCase.notes && <div><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedCase.notes}</p></div>}
            {selectedCase.followUpDate && <div><Label className="text-xs text-gray-500">Follow-up Date</Label><p className="text-sm">{new Date(selectedCase.followUpDate).toLocaleDateString()}</p></div>}
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedCase(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmpCompliance() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const d = await api('/my-compliance', { token: accessToken });
      setItems(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt || b.dueDate || 0).getTime() - new Date(a.createdAt || a.dueDate || 0).getTime()) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const compStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'compliant': case 'completed': case 'met': return 'bg-green-100 text-green-800';
      case 'non-compliant': case 'non_compliant': case 'overdue': case 'failed': return 'bg-red-100 text-red-800';
      case 'in-progress': case 'in_progress': case 'pending': return 'bg-amber-100 text-amber-800';
      case 'under-review': case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const priorityColor = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'critical': case 'high': return 'border-red-300 text-red-600';
      case 'medium': return 'border-amber-300 text-amber-600';
      default: return 'border-gray-300 text-gray-500';
    }
  };

  const checkOverdue = (item: any) => {
    if (!item.dueDate) return false;
    return new Date(item.dueDate) < new Date() && !['compliant', 'completed', 'met'].includes(item.status?.toLowerCase());
  };

  const compliant = items.filter(i => ['compliant', 'completed', 'met'].includes(i.status?.toLowerCase()));
  const pendingItems = items.filter(i => ['in-progress', 'in_progress', 'pending', 'under-review', 'under_review'].includes(i.status?.toLowerCase()));
  const overdueItems = items.filter(i => checkOverdue(i));

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><FileCheck className="w-5 h-5 text-blue-500" />Compliance & Policies</h2>
          <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} · {compliant.length} compliant · {pendingItems.length} pending</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 text-center"><FileCheck className="w-5 h-5 mx-auto mb-1 text-gray-500" /><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{items.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" /><p className="text-xs text-gray-500">Compliant</p><p className="text-lg font-bold text-green-600">{compliant.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" /><p className="text-xs text-gray-500">Pending</p><p className="text-lg font-bold text-amber-600">{pendingItems.length}</p></CardContent></Card>
          <Card className={overdueItems.length > 0 ? 'border-red-200' : ''}><CardContent className="pt-4 text-center"><AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-500" /><p className="text-xs text-gray-500">Overdue</p><p className="text-lg font-bold text-red-600">{overdueItems.length}</p></CardContent></Card>
        </div>
      )}

      {overdueItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">You have {overdueItems.length} overdue compliance item{overdueItems.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-red-600 mt-0.5">Please complete these items as soon as possible to remain compliant.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400">
          <Scale className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No compliance items assigned</p>
          <p className="text-xs text-gray-400 mt-1">Compliance requirements will appear here when assigned by your HR team</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">{items.map((item, i) => {
          const itemOverdue = checkOverdue(item);
          return (
            <Card key={item.id || i} className={`hover:shadow-sm transition-all cursor-pointer ${itemOverdue ? 'border-red-200 bg-red-50/30' : ''}`} onClick={() => setSelectedItem(item)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold truncate">{item.title || item.name || item.requirement || 'Compliance Item'}</h3>
                      <Badge className={compStatusColor(item.status)}>{item.status || 'pending'}</Badge>
                      {item.priority && <Badge variant="outline" className={priorityColor(item.priority)}>{item.priority}</Badge>}
                      {item.category && <Badge variant="outline" className="text-[10px]">{item.category}</Badge>}
                      {itemOverdue && <Badge className="bg-red-500 text-white text-[10px]">OVERDUE</Badge>}
                    </div>
                    {item.description && <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                      {item.dueDate && <span className={`flex items-center gap-1 ${itemOverdue ? 'text-red-500 font-medium' : ''}`}><CalendarDays className="w-3 h-3" />Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                      {item.responsibleName && <span>Assigned by: {item.responsibleName}</span>}
                      {item.department && <span>{item.department}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}</div>
      )}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{selectedItem?.title || selectedItem?.name || 'Compliance Details'}</DialogTitle></DialogHeader>
          {selectedItem && (<div className="space-y-4 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={compStatusColor(selectedItem.status)}>{selectedItem.status || 'pending'}</Badge>
              {selectedItem.priority && <Badge variant="outline" className={priorityColor(selectedItem.priority)}>{selectedItem.priority}</Badge>}
              {selectedItem.category && <Badge variant="outline">{selectedItem.category}</Badge>}
              {checkOverdue(selectedItem) && <Badge className="bg-red-500 text-white">OVERDUE</Badge>}
            </div>
            {selectedItem.description && <div><Label className="text-xs text-gray-500">Description</Label><p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedItem.description}</p></div>}
            <div className="grid grid-cols-2 gap-3">
              {selectedItem.dueDate && <div><Label className="text-xs text-gray-500">Due Date</Label><p className={`text-sm ${checkOverdue(selectedItem) ? 'text-red-600 font-medium' : ''}`}>{new Date(selectedItem.dueDate).toLocaleDateString()}</p></div>}
              {selectedItem.responsibleName && <div><Label className="text-xs text-gray-500">Assigned By</Label><p className="text-sm">{selectedItem.responsibleName}</p></div>}
              {selectedItem.department && <div><Label className="text-xs text-gray-500">Department</Label><p className="text-sm">{selectedItem.department}</p></div>}
              {selectedItem.createdAt && <div><Label className="text-xs text-gray-500">Created</Label><p className="text-sm">{new Date(selectedItem.createdAt).toLocaleDateString()}</p></div>}
              {selectedItem.lastReviewDate && <div><Label className="text-xs text-gray-500">Last Reviewed</Label><p className="text-sm">{new Date(selectedItem.lastReviewDate).toLocaleDateString()}</p></div>}
              {selectedItem.nextReviewDate && <div><Label className="text-xs text-gray-500">Next Review</Label><p className="text-sm">{new Date(selectedItem.nextReviewDate).toLocaleDateString()}</p></div>}
            </div>
            {selectedItem.requirement && <div><Label className="text-xs text-gray-500">Requirement</Label><p className="text-sm mt-1 p-3 bg-blue-50 rounded-lg border border-blue-100">{selectedItem.requirement}</p></div>}
            {selectedItem.actions && <div><Label className="text-xs text-gray-500">Required Actions</Label><p className="text-sm mt-1 p-3 bg-amber-50 rounded-lg border border-amber-100">{selectedItem.actions}</p></div>}
            {selectedItem.notes && <div><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedItem.notes}</p></div>}
            {Array.isArray(selectedItem.documents) && selectedItem.documents.length > 0 && (
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Related Documents</Label>
                <div className="space-y-1">
                  {selectedItem.documents.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span>{typeof doc === 'string' ? doc : doc.name || doc.title || `Document ${idx + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
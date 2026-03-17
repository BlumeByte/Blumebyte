import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Calendar, ChevronLeft, ChevronRight, Users, Plane,
  UserCheck, UserX, Sun, CalendarDays, Briefcase
} from 'lucide-react';
import { brandGradientStyle } from '../../lib/branding-context';

interface TeamLeaveEntry {
  userId: string;
  userName: string;
  department: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
}

interface Holiday {
  id?: string;
  name?: string;
  title?: string;
  date?: string;
  startDate?: string;
  type?: string;
}

interface TeamMember {
  id: string;
  name: string;
  department: string;
  position: string;
}

interface TeamCalendarTabProps {
  teamLeaves: TeamLeaveEntry[];
  holidays: Holiday[];
  team: TeamMember[];
  userDepartment: string;
  primaryColor: string;
}

export function TeamCalendarTab({ teamLeaves, holidays, team, userDepartment, primaryColor }: TeamCalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deptFilter, setDeptFilter] = useState('my');

  const departments = [...new Set(team.map(t => t.department).filter(Boolean))];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filter leaves by department
  const filteredLeaves = useMemo(() => {
    return teamLeaves.filter(l => {
      if (l.status !== 'approved') return false;
      if (deptFilter === 'my') return l.department === userDepartment;
      if (deptFilter === 'all') return true;
      return l.department === deptFilter;
    });
  }, [teamLeaves, deptFilter, userDepartment]);

  // Build a map of date -> events (leaves + holidays)
  const dateEvents = useMemo(() => {
    const events: Record<string, { leaves: TeamLeaveEntry[]; holidays: Holiday[] }> = {};

    // Add leaves
    filteredLeaves.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const current = new Date(start);
      while (current <= end) {
        const key = current.toISOString().split('T')[0];
        if (!events[key]) events[key] = { leaves: [], holidays: [] };
        events[key].leaves.push(leave);
        current.setDate(current.getDate() + 1);
      }
    });

    // Add holidays
    holidays.forEach(h => {
      const hDate = h.date || h.startDate;
      if (hDate) {
        const key = new Date(hDate).toISOString().split('T')[0];
        if (!events[key]) events[key] = { leaves: [], holidays: [] };
        events[key].holidays.push(h);
      }
    });

    return events;
  }, [filteredLeaves, holidays]);

  const today = new Date().toISOString().split('T')[0];

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Get unique people on leave for a date key
  const getLeaveNames = (dateKey: string) => {
    const ev = dateEvents[dateKey];
    if (!ev?.leaves.length) return [];
    const uniqueNames = new Map<string, TeamLeaveEntry>();
    ev.leaves.forEach(l => uniqueNames.set(l.userId, l));
    return Array.from(uniqueNames.values());
  };

  // Get people on leave today
  const todayLeaves = getLeaveNames(today);
  const todayHoliday = dateEvents[today]?.holidays?.[0];

  // People available today
  const filteredTeam = deptFilter === 'my' ? team.filter(t => t.department === userDepartment)
    : deptFilter === 'all' ? team
    : team.filter(t => t.department === deptFilter);
  const onLeaveIds = new Set(todayLeaves.map(l => l.userId));
  const availableToday = filteredTeam.filter(t => !onLeaveIds.has(t.id));

  const leaveTypeColors: Record<string, string> = {
    Annual: 'bg-blue-400',
    Sick: 'bg-red-400',
    Personal: 'bg-violet-400',
    Emergency: 'bg-orange-400',
    Maternity: 'bg-pink-400',
    Paternity: 'bg-indigo-400',
    Compassionate: 'bg-amber-400',
    Study: 'bg-teal-400',
  };

  return (
    <div className="space-y-4">
      {/* Today's Status Card */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{availableToday.length}</p>
                <p className="text-xs text-gray-500">Available Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Plane className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{todayLeaves.length}</p>
                <p className="text-xs text-gray-500">On Leave Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{filteredTeam.length}</p>
                <p className="text-xs text-gray-500">Team Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                Team Leave Calendar
              </CardTitle>
              <CardDescription>See who's available across your team</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-8 text-xs w-44">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my">My Department</SelectItem>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-sm font-semibold text-gray-900">{monthName}</h3>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-gray-50 text-center py-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase">{day}</span>
              </div>
            ))}

            {/* Calendar Cells */}
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-white min-h-[72px] sm:min-h-[80px]" />;
              }

              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateKey === today;
              const dayOfWeek = new Date(year, month, day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const dayLeaves = getLeaveNames(dateKey);
              const dayHolidays = dateEvents[dateKey]?.holidays || [];
              const hasEvents = dayLeaves.length > 0 || dayHolidays.length > 0;

              return (
                <div
                  key={dateKey}
                  className={`bg-white min-h-[72px] sm:min-h-[80px] p-1 relative transition-colors ${
                    isToday ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/30' :
                    isWeekend ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-medium px-1 rounded ${
                      isToday ? 'bg-blue-500 text-white' : isWeekend ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {day}
                    </span>
                  </div>

                  {/* Holiday */}
                  {dayHolidays.map((h, hi) => (
                    <div key={hi} className="text-[9px] px-1 py-0.5 bg-pink-100 text-pink-700 rounded truncate mb-0.5 font-medium">
                      {h.name || h.title || 'Holiday'}
                    </div>
                  ))}

                  {/* Leave entries */}
                  {dayLeaves.slice(0, 2).map((leave, li) => (
                    <div
                      key={li}
                      className="text-[9px] px-1 py-0.5 rounded truncate mb-0.5 flex items-center gap-0.5"
                      title={`${leave.userName} - ${leave.type} Leave`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${leaveTypeColors[leave.type] || 'bg-gray-400'}`} />
                      <span className="truncate text-gray-600">{leave.userName?.split(' ')[0]}</span>
                    </div>
                  ))}
                  {dayLeaves.length > 2 && (
                    <div className="text-[9px] text-gray-400 px-1">+{dayLeaves.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-500">
            <span className="font-medium text-gray-600">Leave Types:</span>
            {Object.entries(leaveTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span>{type}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-pink-100 rounded" />
              <span>Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Who's On Leave Today */}
      {todayLeaves.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plane className="w-4 h-4 text-amber-500" />
              On Leave Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2">
              {todayLeaves.map((leave, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={brandGradientStyle(primaryColor)}>
                    {leave.userName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{leave.userName}</p>
                    <p className="text-xs text-gray-500">{leave.type} Leave | {leave.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Today */}
      {todayLeaves.length > 0 && availableToday.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              Available Today ({availableToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableToday.map((member) => (
                <div key={member.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={brandGradientStyle(primaryColor)}>
                    {member.name?.[0] || '?'}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{member.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

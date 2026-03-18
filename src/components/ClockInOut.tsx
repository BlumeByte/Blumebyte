import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Clock, Play, Square, Loader2, CheckCircle, Pause, Zap, AlertTriangle } from 'lucide-react';

function formatTime(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes: number) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ClockInOut() {
  const { user, accessToken } = useAuth();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [autoSettings, setAutoSettings] = useState<any>(null);
  const [isAutoEnabled, setIsAutoEnabled] = useState(false);
  const [manualSettings, setManualSettings] = useState<any>(null);
  const [isManualVisible, setIsManualVisible] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoClockOutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoPausedRef = useRef(false);
  const hasAutoResumedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const [data, settings, manualS] = await Promise.all([
        api('/attendance/my-today', { token: accessToken }),
        api('/auto-clock-settings', { token: accessToken }).catch(() => null),
        api('/manual-clock-settings', { token: accessToken }).catch(() => null),
      ]);
      setRecord(data);
      setAutoSettings(settings);
      setManualSettings(manualS);

      // Determine if auto-clock applies to this user
      if (settings?.enabled) {
        if (settings.mode === 'all') {
          setIsAutoEnabled(true);
        } else if (settings.mode === 'specific' && Array.isArray(settings.specificUsers)) {
          setIsAutoEnabled(settings.specificUsers.includes(user?.id));
        } else {
          setIsAutoEnabled(false);
        }
      } else {
        setIsAutoEnabled(false);
      }

      // Determine if manual clock-in/out is visible for this user
      // Superadmin and admin always see manual clock buttons
      const userRole = user?.role?.toLowerCase();
      if (userRole === 'superadmin' || userRole === 'admin') {
        setIsManualVisible(true);
      } else if (manualS) {
        if (manualS.enabled === false) {
          setIsManualVisible(false);
        } else if (manualS.mode === 'all') {
          setIsManualVisible(true);
        } else if (manualS.mode === 'specific' && Array.isArray(manualS.specificUsers)) {
          setIsManualVisible(manualS.specificUsers.includes(user?.id));
        } else {
          setIsManualVisible(true);
        }
      } else {
        setIsManualVisible(true); // default: visible for all
      }
    } catch (e) { console.log('Clock load error:', e); }
    setLoading(false);
  }, [accessToken, user?.id, user?.role]);

  useEffect(() => { load(); }, [load]);

  // ============ AUTO CLOCK-IN ON MOUNT ============
  useEffect(() => {
    if (!isAutoEnabled || loading || !accessToken) return;
    // If not clocked in yet and not clocked out, auto clock-in
    if (!record?.clockIn) {
      api('/attendance/auto-clock-in', { method: 'POST', body: '{}', token: accessToken })
        .then(data => {
          if (data?.clockIn) {
            setRecord(data);
            toast.success('Auto clocked in', { description: 'Auto-attendance is enabled for your account' });
          }
        })
        .catch(e => console.log('Auto clock-in error:', e));
    }
    // If was paused (user came back), auto-resume
    else if (record?.isPaused && !hasAutoResumedRef.current) {
      hasAutoResumedRef.current = true;
      api('/attendance/auto-clock-in', { method: 'POST', body: '{}', token: accessToken })
        .then(data => {
          if (data && !data.isPaused) {
            setRecord(data);
            hasAutoPausedRef.current = false;
            toast.success('Clock resumed', { description: 'Welcome back! Your attendance has been resumed.' });
          }
        })
        .catch(e => console.log('Auto resume error:', e));
    }
  }, [isAutoEnabled, loading, record?.clockIn, record?.isPaused, accessToken]);

  // ============ ACTIVITY TRACKING & INACTIVITY PAUSE ============
  useEffect(() => {
    if (!isAutoEnabled || !record?.clockIn || record?.clockOut) return;

    const timeout = (autoSettings?.inactivityTimeout || 30) * 60 * 1000; // default 30 min in ms

    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      // If we were paused and user interacts, auto-resume
      if (record?.isPaused && !hasAutoResumedRef.current) {
        hasAutoResumedRef.current = true;
        api('/attendance/auto-clock-in', { method: 'POST', body: '{}', token: accessToken })
          .then(data => {
            if (data && !data.isPaused) {
              setRecord(data);
              hasAutoPausedRef.current = false;
              toast.success('Clock resumed', { description: 'Activity detected — attendance resumed.' });
            }
          })
          .catch(e => console.log('Resume error:', e));
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, updateActivity, { passive: true }));

    // Check for inactivity every minute
    inactivityCheckRef.current = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= timeout && !hasAutoPausedRef.current && !record?.isPaused && !record?.clockOut) {
        hasAutoPausedRef.current = true;
        hasAutoResumedRef.current = false;
        api('/attendance/auto-pause', { method: 'POST', body: '{}', token: accessToken })
          .then(data => {
            if (data?.isPaused) {
              setRecord(data);
              toast.warning('Clock paused', { description: `No activity for ${autoSettings?.inactivityTimeout || 30} minutes. Clock will resume when you return.` });
            }
          })
          .catch(e => console.log('Auto pause error:', e));
      }
    }, 60000);

    // Heartbeat every 5 min to track activity on server
    heartbeatRef.current = setInterval(() => {
      if (!record?.isPaused && !record?.clockOut) {
        api('/attendance/heartbeat', { method: 'POST', body: '{}', token: accessToken }).catch(() => {});
      }
    }, 300000);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
      if (inactivityCheckRef.current) clearInterval(inactivityCheckRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [isAutoEnabled, record?.clockIn, record?.clockOut, record?.isPaused, accessToken, autoSettings?.inactivityTimeout]);

  // ============ AUTO CLOCK-OUT AT SCHEDULED TIME ============
  useEffect(() => {
    if (!isAutoEnabled || !autoSettings?.clockOutTime || !record?.clockIn || record?.clockOut) return;

    const checkAutoClockOut = () => {
      const now = new Date();
      const [h, m] = (autoSettings.clockOutTime || '17:00').split(':').map(Number);
      const clockOutTime = new Date();
      clockOutTime.setHours(h, m, 0, 0);

      if (now >= clockOutTime) {
        api('/attendance/auto-clock-out', { method: 'POST', body: '{}', token: accessToken })
          .then(data => {
            if (data?.clockOut) {
              setRecord(data);
              toast.info('Auto clocked out', { description: `Scheduled clock-out at ${autoSettings.clockOutTime}` });
            }
          })
          .catch(e => console.log('Auto clock-out error:', e));
      }
    };

    // Check every minute for scheduled clock-out
    autoClockOutRef.current = setInterval(checkAutoClockOut, 60000);
    // Also check immediately
    checkAutoClockOut();

    return () => {
      if (autoClockOutRef.current) clearInterval(autoClockOutRef.current);
    };
  }, [isAutoEnabled, autoSettings?.clockOutTime, record?.clockIn, record?.clockOut, accessToken]);

  // Live elapsed timer
  useEffect(() => {
    if (!record?.clockIn || record?.clockOut) { setElapsed(0); return; }
    const update = () => {
      const totalMs = Date.now() - new Date(record.clockIn).getTime();
      const pausedMs = (record.totalPausedMinutes || 0) * 60000;
      // If currently paused, add current pause duration
      let currentPauseMs = 0;
      if (record.isPaused && record.pauses?.length > 0) {
        const lastPause = record.pauses[record.pauses.length - 1];
        if (lastPause && !lastPause.resumedAt) {
          currentPauseMs = Date.now() - new Date(lastPause.pausedAt).getTime();
        }
      }
      const activeMs = totalMs - pausedMs - currentPauseMs;
      setElapsed(Math.max(0, Math.round(activeMs / 60000)));
    };
    update();
    // PERFORMANCE: Update elapsed time every 60s instead of 30s (time is in minutes anyway)
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [record?.clockIn, record?.clockOut, record?.isPaused, record?.totalPausedMinutes, record?.pauses]);

  const handleClockIn = async () => {
    setActing(true);
    try {
      const data = await api('/attendance/clock-in', { method: 'POST', body: '{}', token: accessToken });
      setRecord(data);
      toast.success('Clocked in successfully!');
    } catch (e: any) { toast.error(e.message); }
    setActing(false);
  };

  const handleClockOut = async () => {
    setActing(true);
    try {
      const endpoint = isAutoEnabled ? '/attendance/auto-clock-out' : '/attendance/clock-out';
      const data = await api(endpoint, { method: 'POST', body: '{}', token: accessToken });
      setRecord(data);
      toast.success('Clocked out successfully!');
    } catch (e: any) { toast.error(e.message); }
    setActing(false);
  };

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-400">Loading attendance...</span>
        </CardContent>
      </Card>
    );
  }

  // If manual clock is hidden and user is NOT auto-clocked, hide completely
  if (!isManualVisible && !isAutoEnabled && !record?.clockIn) {
    return null;
  }

  const isClockedIn = record?.clockIn && !record?.clockOut && !record?.isPaused;
  const isPaused = record?.isPaused;
  const isClockedOut = record?.clockIn && record?.clockOut;
  const notClockedIn = !record?.clockIn;
  const pauseCount = record?.pauses?.length || 0;
  const showManualButtons = isManualVisible;

  return (
    <Card className={`overflow-hidden ${isPaused ? 'border-amber-300 bg-amber-50/30' : isClockedIn ? 'border-green-200 bg-green-50/30' : isClockedOut ? 'border-blue-200 bg-blue-50/30' : 'border-dashed'}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPaused ? 'bg-amber-100' : isClockedIn ? 'bg-green-100' : isClockedOut ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {isPaused ? <Pause className="w-5 h-5 text-amber-600" /> :
               <Clock className={`w-5 h-5 ${isClockedIn ? 'text-green-600' : isClockedOut ? 'text-blue-600' : 'text-gray-400'}`} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">
                  {isPaused ? 'Paused — Away' : isClockedIn ? 'Currently Working' : isClockedOut ? 'Work Complete' : 'Not Clocked In'}
                </p>
                {isAutoEnabled && (
                  <Badge className="bg-purple-100 text-purple-700 text-[10px] gap-0.5"><Zap className="w-2.5 h-2.5" />AUTO</Badge>
                )}
                {isPaused && (
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] animate-pulse gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />PAUSED</Badge>
                )}
                {isClockedIn && !isPaused && (
                  <Badge className="bg-green-100 text-green-700 text-[10px] animate-pulse">LIVE</Badge>
                )}
                {isClockedOut && (
                  <Badge className="bg-blue-100 text-blue-700 text-[10px]">DONE</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {record?.clockIn && (
                  <span className="text-xs text-gray-500">In: <span className="font-medium text-gray-700">{formatTime(record.clockIn)}</span></span>
                )}
                {record?.clockOut && (
                  <span className="text-xs text-gray-500">Out: <span className="font-medium text-gray-700">{formatTime(record.clockOut)}</span></span>
                )}
                {(isClockedIn || isPaused) && elapsed > 0 && (
                  <span className={`text-xs font-medium ${isPaused ? 'text-amber-600' : 'text-green-600'}`}>
                    {formatDuration(elapsed)} active
                  </span>
                )}
                {pauseCount > 0 && (
                  <span className="text-xs text-amber-600">
                    {pauseCount} pause{pauseCount !== 1 ? 's' : ''}
                    {record.totalPausedMinutes > 0 && ` (${formatDuration(record.totalPausedMinutes)} idle)`}
                  </span>
                )}
                {isClockedOut && (record.regularMinutes > 0 || record.overtimeMinutes > 0) && (
                  <span className="text-xs text-blue-600 font-medium">
                    {formatDuration(record.regularMinutes)} worked
                    {record.overtimeMinutes > 0 && ` + ${formatDuration(record.overtimeMinutes)} OT`}
                    {record.totalPausedMinutes > 0 && ` (${formatDuration(record.totalPausedMinutes)} paused)`}
                  </span>
                )}
                {record?.autoClocked && isClockedOut && (
                  <Badge variant="outline" className="text-[9px] border-purple-200 text-purple-500">Auto-tracked</Badge>
                )}
                {record?.autoClockoutApplied && isClockedOut && (
                  <Badge variant="outline" className="text-[9px] border-orange-200 text-orange-500">Auto clocked out at {autoSettings?.clockOutTime || '17:00'}</Badge>
                )}
                {notClockedIn && (
                  <span className="text-xs text-gray-400">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notClockedIn && showManualButtons && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                onClick={handleClockIn}
                disabled={acting}
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Clock In
              </Button>
            )}
            {(isClockedIn || isPaused) && showManualButtons && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={handleClockOut}
                disabled={acting}
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Clock Out
              </Button>
            )}
            {isClockedOut && (
              <div className="flex items-center gap-1.5 text-blue-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Day Complete</span>
              </div>
            )}
          </div>
        </div>

        {/* Auto-clock info bar */}
        {isAutoEnabled && !isClockedOut && (
          <div className="mt-3 pt-2.5 border-t border-dashed flex items-center gap-2 text-[11px] text-gray-400">
            <Zap className="w-3 h-3 text-purple-400" />
            <span>Auto-attendance: Clock-in at {autoSettings?.clockInTime || '08:00'} · Clock-out at {autoSettings?.clockOutTime || '17:00'} · Auto-pause after {autoSettings?.inactivityTimeout || 30}min idle</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
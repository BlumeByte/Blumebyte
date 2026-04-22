import React, { useState, useEffect } from 'react';
import { Bell, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { toast } from 'sonner';

interface NotificationPrefs {
  emailOnNewHire: boolean;
  emailOnLeaveUpdate: boolean;
  emailOnPayslip: boolean;
  emailOnTaskAssignment: boolean;
  emailOnMeeting: boolean;
  emailOnAnnouncement: boolean;
  emailOnPerformanceReview: boolean;
  inAppNotifications: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  emailOnNewHire: true,
  emailOnLeaveUpdate: true,
  emailOnPayslip: true,
  emailOnTaskAssignment: true,
  emailOnMeeting: true,
  emailOnAnnouncement: true,
  emailOnPerformanceReview: true,
  inAppNotifications: true,
};

const EMAIL_SETTINGS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'emailOnLeaveUpdate', label: 'Leave Request Updates', description: 'Email when your leave request is approved or rejected' },
  { key: 'emailOnPayslip', label: 'New Payslip', description: 'Email when a new payslip is generated for you' },
  { key: 'emailOnTaskAssignment', label: 'Task Assignments', description: 'Email when you are assigned a new task' },
  { key: 'emailOnMeeting', label: 'Meeting Invitations', description: 'Email when you are invited to a meeting' },
  { key: 'emailOnAnnouncement', label: 'Company Announcements', description: 'Email for important company-wide announcements' },
  { key: 'emailOnPerformanceReview', label: 'Performance Reviews', description: 'Email when a performance review is scheduled' },
  { key: 'emailOnNewHire', label: 'New Team Members', description: 'Email when someone new joins your team' },
];

export function NotificationSettings() {
  const { getToken } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const data = await api('/notification-preferences', { token });
        if (!cancelled && data && typeof data === 'object') {
          setPrefs({ ...DEFAULT_PREFS, ...data });
        }
      } catch {
        // Silently fail - use defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      await api('/notification-preferences', {
        method: 'PUT',
        token,
        body: prefs,
      });
      toast.success('Notification preferences saved');
    } catch (e: any) {
      toast.error(e?.message === 'Not authenticated' ? 'Please sign in again to save preferences' : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const emailSettings = EMAIL_SETTINGS;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            In-App Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable in-app notifications</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Show notification bell alerts inside the platform</p>
            </div>
            <Switch
              checked={prefs.inAppNotifications}
              onCheckedChange={() => toggle('inAppNotifications')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Notifications
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Choose which events trigger an email to your registered address. Emails help you stay informed even when you're not logged in.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSettings.map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium cursor-pointer" htmlFor={`notif-${key}`}>{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <Switch
                id={`notif-${key}`}
                checked={prefs[key] as boolean}
                onCheckedChange={() => toggle(key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
        Save Notification Preferences
      </Button>
    </div>
  );
}

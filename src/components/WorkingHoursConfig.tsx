import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { Loader2, Clock, Calendar, Save } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';

interface DayConfig {
  day: string;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_DAYS: DayConfig[] = [
  { day: 'monday', label: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'tuesday', label: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'wednesday', label: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'thursday', label: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'friday', label: 'Friday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'saturday', label: 'Saturday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'sunday', label: 'Sunday', enabled: true, startTime: '09:00', endTime: '17:00' },
];

export function WorkingHoursConfig() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState<DayConfig[]>(DEFAULT_DAYS);
  const [blockWeekendsForLeaves, setBlockWeekendsForLeaves] = useState(false);
  const [blockWeekendsForMeetings, setBlockWeekendsForMeetings] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await api('/company/working-hours', { token: accessToken });
      if (config) {
        setWorkingDays(config.workingDays || DEFAULT_DAYS);
        setBlockWeekendsForLeaves(config.blockWeekendsForLeaves ?? true);
        setBlockWeekendsForMeetings(config.blockWeekendsForMeetings ?? true);
      }
    } catch (e: any) {
      if (e.message !== 'Not found') {
        console.error('Error loading working hours config:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (index: number) => {
    const updated = [...workingDays];
    updated[index].enabled = !updated[index].enabled;
    setWorkingDays(updated);
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...workingDays];
    updated[index][field] = value;
    setWorkingDays(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate at least one day is enabled
      if (!workingDays.some(d => d.enabled)) {
        toast.error('At least one working day must be enabled');
        return;
      }
      
      // Validate times
      for (const day of workingDays) {
        if (day.enabled && day.startTime >= day.endTime) {
          toast.error(`Invalid time range for ${day.label}`);
          return;
        }
      }
      
      await api('/company/working-hours', {
        method: 'POST',
        body: JSON.stringify({
          workingDays,
          blockWeekendsForLeaves,
          blockWeekendsForMeetings,
        }),
        token: accessToken,
      });
      
      toast.success('Working hours configuration saved successfully');
    } catch (e: any) {
      console.error('Error saving working hours:', e);
      toast.error(e.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  const enabledDays = workingDays.filter(d => d.enabled);
  const weekendDays = workingDays.filter(d => ['saturday', 'sunday'].includes(d.day));
  const hasWeekendWork = weekendDays.some(d => d.enabled);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Working Days & Hours
          </CardTitle>
          <CardDescription>
            Configure your company's working schedule. By default, all 7 days are enabled as working days. Disable weekends if your company doesn't work on Saturday/Sunday.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Current Schedule</p>
                <p className="text-sm text-blue-700 mt-1">
                  {enabledDays.length} working days per week
                  {hasWeekendWork && ' (including weekends)'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Working Days Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Working Days</h3>
            <div className="space-y-3">
              {workingDays.map((day, index) => (
                <div
                  key={day.day}
                  className={`p-4 border rounded-lg transition-colors ${
                    day.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Switch
                        checked={day.enabled}
                        onCheckedChange={() => handleDayToggle(index)}
                      />
                      <Label className={`font-medium ${day.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {day.label}
                      </Label>
                    </div>
                    
                    {day.enabled && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-600">Start</Label>
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-600">End</Label>
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekend Blocking Options */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700">Weekend Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <Label className="font-medium text-gray-900">Block Weekends for Leave Requests</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Prevent employees from selecting weekends in leave requests
                    {hasWeekendWork && ' (Note: You have weekend working days enabled)'}
                  </p>
                </div>
                <Switch
                  checked={blockWeekendsForLeaves}
                  onCheckedChange={setBlockWeekendsForLeaves}
                  disabled={hasWeekendWork}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <Label className="font-medium text-gray-900">Block Weekends for Meetings</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Prevent scheduling meetings on weekends
                    {hasWeekendWork && ' (Note: You have weekend working days enabled)'}
                  </p>
                </div>
                <Switch
                  checked={blockWeekendsForMeetings}
                  onCheckedChange={setBlockWeekendsForMeetings}
                  disabled={hasWeekendWork}
                />
              </div>
            </div>

            {hasWeekendWork && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Weekend blocking is automatically disabled when you have Saturday or Sunday enabled as working days.
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

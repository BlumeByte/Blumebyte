import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useNavigate } from 'react-router';
import {
  Bell, Check, CheckCheck, MessageCircle, UserPlus, CalendarDays, Briefcase,
  AlertCircle, DollarSign, FileText, Users, X, Loader2, Trash2, UserMinus, ShieldAlert, ArrowRight
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  message: MessageCircle,
  'job-application': FileText,
  'hire-approved': UserPlus,
  'new-hire': Users,
  'new-user': UserPlus,
  'application-rejected': AlertCircle,
  'leave-update': CalendarDays,
  'task-assignment': Briefcase,
  'task-approved': Briefcase,
  'meeting-invite': CalendarDays,
  'meeting-request': CalendarDays,
  'meeting-scheduled': CalendarDays,
  'meeting-approved': CalendarDays,
  'meeting-rejected': AlertCircle,
  'onboarding-approved': UserPlus,
  'training-update': FileText,
  'profile-update': Users,
  'finance-update': DollarSign,
  'user-removed': UserMinus,
  'deletion-request': ShieldAlert,
  'deletion-approved': Check,
  'deletion-rejected': AlertCircle,
  default: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  message: 'bg-blue-100 text-blue-600',
  'job-application': 'bg-purple-100 text-purple-600',
  'hire-approved': 'bg-green-100 text-green-600',
  'new-hire': 'bg-emerald-100 text-emerald-600',
  'new-user': 'bg-emerald-100 text-emerald-600',
  'application-rejected': 'bg-red-100 text-red-600',
  'leave-update': 'bg-amber-100 text-amber-600',
  'task-assignment': 'bg-indigo-100 text-indigo-600',
  'task-approved': 'bg-green-100 text-green-600',
  'meeting-invite': 'bg-cyan-100 text-cyan-600',
  'meeting-request': 'bg-amber-100 text-amber-600',
  'meeting-scheduled': 'bg-blue-100 text-blue-600',
  'meeting-approved': 'bg-green-100 text-green-600',
  'meeting-rejected': 'bg-red-100 text-red-600',
  'onboarding-approved': 'bg-green-100 text-green-600',
  'training-update': 'bg-purple-100 text-purple-600',
  'profile-update': 'bg-teal-100 text-teal-600',
  'finance-update': 'bg-orange-100 text-orange-600',
  'user-removed': 'bg-red-100 text-red-600',
  'deletion-request': 'bg-amber-100 text-amber-600',
  'deletion-approved': 'bg-green-100 text-green-600',
  'deletion-rejected': 'bg-red-100 text-red-600',
  default: 'bg-gray-100 text-gray-600',
};

export function NotificationsBell() {
  const { accessToken, user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api('/notifications', { token: accessToken });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e: any) { 
      console.log('Notifications fetch error:', e);
      // Don't throw error, just set empty array
      setNotifications([]);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PUT', token: accessToken });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) { console.log(e); }
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await api('/notifications/mark-all-read', { method: 'PUT', token: accessToken });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && <Badge className="bg-red-100 text-red-700 text-[10px]">{unreadCount} new</Badge>}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead} disabled={loading}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5 mr-1" />}
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.slice(0, 5).map(n => {
                  const Icon = TYPE_ICONS[n.type] || TYPE_ICONS.default;
                  const colorClass = TYPE_COLORS[n.type] || TYPE_COLORS.default;
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3 flex gap-3 hover:bg-accent cursor-pointer transition-colors border-b border-border ${!n.read ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}
                      onClick={() => { if (!n.read) markAsRead(n.id); }}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* View All Button */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications');
                }}
              >
                View All Notifications ({notifications.length})
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
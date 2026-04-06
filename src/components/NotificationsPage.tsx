import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import {
  Bell, Check, CheckCheck, MessageCircle, UserPlus, CalendarDays, Briefcase,
  AlertCircle, DollarSign, FileText, Users, Loader2, Trash2, UserMinus, ShieldAlert,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Eye, Archive, Mail, MailOpen
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
  'profile-change-request': Users,
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
  'profile-change-request': 'bg-teal-100 text-teal-600',
  'finance-update': 'bg-orange-100 text-orange-600',
  'user-removed': 'bg-red-100 text-red-600',
  'deletion-request': 'bg-amber-100 text-amber-600',
  'deletion-approved': 'bg-green-100 text-green-600',
  'deletion-rejected': 'bg-red-100 text-red-600',
  default: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS: Record<string, string> = {
  message: 'Messages',
  'job-application': 'Job Applications',
  'hire-approved': 'Hiring',
  'new-hire': 'New Hires',
  'new-user': 'New Users',
  'application-rejected': 'Rejections',
  'leave-update': 'Leave Updates',
  'task-assignment': 'Tasks',
  'task-approved': 'Tasks',
  'meeting-invite': 'Meetings',
  'meeting-request': 'Meetings',
  'meeting-scheduled': 'Meetings',
  'meeting-approved': 'Meetings',
  'meeting-rejected': 'Meetings',
  'onboarding-approved': 'Onboarding',
  'training-update': 'Training',
  'profile-update': 'Profile Updates',
  'profile-change-request': 'Profile Requests',
  'finance-update': 'Finance',
  'user-removed': 'User Removal',
  'deletion-request': 'Deletion Requests',
  'deletion-approved': 'Deletions',
  'deletion-rejected': 'Deletions',
};

export function NotificationsPage() {
  const { accessToken, user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'createdAt' | 'title'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/notifications', { token: accessToken });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.log('Notifications fetch error:', e);
      setNotifications([]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PUT', token: accessToken });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.log(e);
    }
  };

  const markAllRead = async () => {
    setActionLoading(true);
    try {
      await api('/notifications/mark-all-read', { method: 'PUT', token: accessToken });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark all as read');
    }
    setActionLoading(false);
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    setActionLoading(true);
    try {
      await api(`/notifications/${id}`, { method: 'DELETE', token: accessToken });
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
      if (selectedNotification?.id === id) {
        setViewDialogOpen(false);
        setSelectedNotification(null);
      }
    } catch (e) {
      toast.error('Failed to delete notification');
    }
    setActionLoading(false);
  };

  const deleteAllRead = async () => {
    if (!confirm('Delete all read notifications?')) return;
    setActionLoading(true);
    try {
      const readIds = notifications.filter(n => n.read).map(n => n.id);
      await Promise.all(readIds.map(id => api(`/notifications/${id}`, { method: 'DELETE', token: accessToken })));
      setNotifications(prev => prev.filter(n => !n.read));
      toast.success('All read notifications deleted');
    } catch (e) {
      toast.error('Failed to delete notifications');
    }
    setActionLoading(false);
  };

  const handleViewDetails = (notification: any) => {
    setSelectedNotification(notification);
    setViewDialogOpen(true);
    if (!notification.read) {
      markAsRead(notification.id);
    }
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

  const fullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get unique notification types
  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)));

  // Filter and sort
  const filteredAndSorted = notifications
    .filter(n => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' || n.type === filterType;

      // Status filter
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'unread' && !n.read) ||
        (filterStatus === 'read' && n.read);

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        aVal = a.title || '';
        bVal = b.title || '';
      }

      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllRead} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCheck className="w-4 h-4 mr-2" />}
                Mark All Read
              </Button>
            )}
            {notifications.some(n => n.read) && (
              <Button variant="outline" onClick={deleteAllRead} disabled={actionLoading}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {notificationTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {TYPE_LABELS[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sort by:</span>
            <div className="flex gap-2">
              <Button
                variant={sortField === 'createdAt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortField('createdAt')}
              >
                Date
              </Button>
              <Button
                variant={sortField === 'title' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortField('title')}
              >
                Title
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            >
              {sortDir === 'asc' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
              {sortDir === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>

          {/* Active Filters */}
          {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <Badge variant="outline" className="gap-1">
                  Search: "{searchTerm}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                </Badge>
              )}
              {filterType !== 'all' && (
                <Badge variant="outline" className="gap-1">
                  Type: {TYPE_LABELS[filterType] || filterType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterType('all')} />
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="outline" className="gap-1">
                  Status: {filterStatus}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {filteredAndSorted.length} of {notifications.length} notification{notifications.length === 1 ? '' : 's'}
      </div>

      {/* Notifications List */}
      {loading ? (
        <Card>
          <CardContent className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </CardContent>
        </Card>
      ) : filteredAndSorted.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {notifications.length === 0 ? 'No notifications yet' : 'No notifications match your filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAndSorted.map(notification => {
            const Icon = TYPE_ICONS[notification.type] || TYPE_ICONS.default;
            const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.default;

            return (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md cursor-pointer ${
                  !notification.read ? 'bg-blue-50/40 border-blue-200' : ''
                }`}
                onClick={() => handleViewDetails(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className={`text-sm leading-tight ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <Badge className="bg-blue-500 text-white text-[10px] h-5">NEW</Badge>
                          )}
                          <span className="text-xs text-gray-500">{timeAgo(notification.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {TYPE_LABELS[notification.type] || notification.type}
                        </Badge>
                        {notification.read ? (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <MailOpen className="w-3 h-3" /> Read
                          </span>
                        ) : (
                          <span className="text-[10px] text-blue-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Unread
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(notification);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        disabled={actionLoading}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              {/* Icon and Title */}
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                  TYPE_COLORS[selectedNotification.type] || TYPE_COLORS.default
                }`}>
                  {React.createElement(
                    TYPE_ICONS[selectedNotification.type] || TYPE_ICONS.default,
                    { className: 'w-6 h-6' }
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedNotification.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {TYPE_LABELS[selectedNotification.type] || selectedNotification.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {fullDate(selectedNotification.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Message */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              {/* Metadata */}
              {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                      {Object.entries(selectedNotification.metadata).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="font-medium text-gray-600">{key}:</span>
                          <span className="text-gray-800">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Status */}
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedNotification.read ? (
                    <>
                      <MailOpen className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Marked as read</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">Unread</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-400">ID: {selectedNotification.id}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                deleteNotification(selectedNotification.id);
              }}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

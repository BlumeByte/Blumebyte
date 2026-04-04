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
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Loader2, Plus, Megaphone, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { useBranding } from '../lib/branding-context';
import { MultiEmployeeSelect } from './MultiEmployeeSelect';

export function ManagerAnnouncementsModule() {
  const { accessToken, user } = useAuth();
  const { branding } = useBranding();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [managerDepartment, setManagerDepartment] = useState('');
  const [departmentEmployees, setDepartmentEmployees] = useState<any[]>([]);
  const [filterScope, setFilterScope] = useState<'all' | 'my-department' | 'created-by-me'>('all');

  const loadDepartmentInfo = useCallback(async () => {
    try {
      const [profile, users] = await Promise.all([
        api('/profile', { token: accessToken }),
        api('/users', { token: accessToken })
      ]);
      const dept = profile?.department || '';
      setManagerDepartment(dept);
      
      const deptEmps = Array.isArray(users) 
        ? users.filter((u: any) => u.department === dept && u.role === 'employee')
        : [];
      setDepartmentEmployees(deptEmps);
    } catch (e) {
      console.log('Failed to load department info:', e);
    }
  }, [accessToken]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/announcements', { token: accessToken });
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Failed to load announcements:', e);
      setAnnouncements([]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { loadDepartmentInfo(); }, [loadDepartmentInfo]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  const handleCreate = () => {
    setEditItem(null);
    setFormData({
      title: '',
      message: '',
      priority: 'normal',
      targetAudience: 'department', // Default to department-only
      department: managerDepartment,
      createdBy: user?.name || 'Manager',
      createdByRole: 'manager',
      specificEmployees: [],
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    // Managers can only edit their own announcements
    if (item.createdByRole !== 'manager' || item.createdBy !== user?.name) {
      toast.error('You can only edit announcements you created');
      return;
    }
    setEditItem(item);
    setFormData({ ...item });
    setDialogOpen(true);
  };

  const handleView = (item: any) => {
    setViewItem(item);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.title || !formData.message) {
        toast.error('Title and message are required');
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        department: managerDepartment,
        createdBy: user?.name || 'Manager',
        createdByRole: 'manager',
      };

      if (editItem) {
        await api(`/announcements/${editItem.id}`, {
          method: 'PUT',
          body: payload,
          token: accessToken,
        });
        toast.success('Announcement updated successfully');
      } else {
        await api('/announcements', {
          method: 'POST',
          body: payload,
          token: accessToken,
        });
        toast.success('Announcement created successfully');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save announcement');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, item: any) => {
    // Managers can only delete their own announcements
    if (item.createdByRole !== 'manager' || item.createdBy !== user?.name) {
      toast.error('You can only delete announcements you created');
      return;
    }

    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await api(`/announcements/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Announcement deleted successfully');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete announcement');
    }
  };

  // Filter announcements based on scope
  const filteredAnnouncements = announcements.filter(item => {
    if (filterScope === 'created-by-me') {
      return item.createdBy === user?.name && item.createdByRole === 'manager';
    }
    if (filterScope === 'my-department') {
      return item.department === managerDepartment || item.targetAudience === 'all';
    }
    // 'all' - show company-wide and department-specific
    return item.targetAudience === 'all' || item.department === managerDepartment;
  });

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Megaphone className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Department Announcements</h3>
            <p className="text-sm text-blue-700 mt-1">
              Create and manage announcements for your department employees.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Department: <span className="font-medium">{managerDepartment || 'Loading...'}</span> • 
              Department Employees: <span className="font-medium">{departmentEmployees.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Create Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Show:</Label>
          <Select value={filterScope} onValueChange={(v: any) => setFilterScope(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Announcements</SelectItem>
              <SelectItem value="my-department">My Department</SelectItem>
              <SelectItem value="created-by-me">Created by Me</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No announcements found</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <Badge
                        className={
                          item.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : item.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {item.priority || 'normal'}
                      </Badge>
                      {item.targetAudience === 'all' && (
                        <Badge className="bg-purple-100 text-purple-800">Company-wide</Badge>
                      )}
                      {item.targetAudience === 'department' && (
                        <Badge className="bg-green-100 text-green-800">Department</Badge>
                      )}
                      {item.targetAudience === 'specific' && !item.targetDepartments?.length && (
                        <Badge className="bg-amber-100 text-amber-800">Specific Employees</Badge>
                      )}
                      {item.targetDepartments?.length > 0 && item.targetAudience !== 'all' && (
                        <Badge className="bg-teal-100 text-teal-800">{item.targetDepartments.length} Dept{item.targetDepartments.length > 1 ? 's' : ''}</Badge>
                      )}
                      {item.createdByRole === 'superadmin' && (
                        <Badge className="bg-violet-100 text-violet-800">SuperAdmin</Badge>
                      )}
                      {item.createdByRole === 'admin' && (
                        <Badge className="bg-indigo-100 text-indigo-800">Admin</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      By {item.createdBy || 'Unknown'} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      {item.department && item.department !== 'all' && ` • ${item.department}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleView(item)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {item.createdByRole === 'manager' && item.createdBy === user?.name && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600"
                          onClick={() => handleDelete(item.id, item)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 line-clamp-2">{item.message}</p>
                {item.specificEmployees && item.specificEmployees.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>Sent to {item.specificEmployees.length} employee(s)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Create'} Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter announcement title"
              />
            </div>
            <div>
              <Label>
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.message || ''}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter announcement message"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={formData.priority || 'normal'}
                  onValueChange={v => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Select
                  value={formData.targetAudience || 'department'}
                  onValueChange={v => setFormData({ ...formData, targetAudience: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">My Department Only</SelectItem>
                    <SelectItem value="specific">Specific Employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.targetAudience === 'specific' && (
              <div>
                <Label>Select Employees</Label>
                <MultiEmployeeSelect
                  employees={departmentEmployees}
                  selectedIds={formData.specificEmployees || []}
                  onChange={ids => setFormData({ ...formData, specificEmployees: ids })}
                />
              </div>
            )}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
              <p className="text-amber-800">
                <strong>Note:</strong> As a manager, you can only send announcements to employees in your department ({managerDepartment}).
                Company-wide announcements can only be created by Admins and SuperAdmins.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create Announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Announcement Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Title</Label>
                <p className="text-lg font-semibold mt-1">{viewItem.title}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Message</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{viewItem.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Priority</Label>
                  <Badge className="mt-1">{viewItem.priority || 'normal'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Target Audience</Label>
                  <Badge className="mt-1">{viewItem.targetAudience || 'department'}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Created By</Label>
                  <p className="text-sm mt-1">{viewItem.createdBy || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Department</Label>
                  <p className="text-sm mt-1">{viewItem.department || '—'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Created At</Label>
                <p className="text-sm mt-1">
                  {viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              {viewItem.specificEmployees && viewItem.specificEmployees.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Specific Employees</Label>
                  <p className="text-sm mt-1">{viewItem.specificEmployees.join(', ')}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { CalendarDays, Loader2, Plus, CheckCircle, X, Pencil, Trash2 } from 'lucide-react';
import { useBranding } from '../lib/branding-context';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';

interface LeaveApplicationFormProps {
  mode?: 'employee' | 'manager' | 'admin' | 'superadmin';
}

export function LeaveApplicationForm({ mode = 'employee' }: LeaveApplicationFormProps) {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    leaveType: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: 'all',
    leaveType: 'all',
  });

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/leave-requests', { token: accessToken });
      setLeaves(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.log('Error loading leaves:', e);
      setLeaves([]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  useEffect(() => {
    const interval = setInterval(loadLeaves, 20000);
    return () => clearInterval(interval);
  }, [loadLeaves]);

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setSaving(true);
    try {
      await api('/leave-requests', {
        method: 'POST',
        body: formData,
        token: accessToken,
      });
      toast.success('Leave request submitted successfully');
      setDialogOpen(false);
      setFormData({
        leaveType: 'Annual Leave',
        startDate: '',
        endDate: '',
        reason: '',
      });
      loadLeaves();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit leave request');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await api(`/leave-requests/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Leave request deleted');
      loadLeaves();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete leave request');
    }
  };

  // Get unique values for filters
  const uniqueLeaveTypes = Array.from(new Set(leaves.map(l => l.leaveType).filter(Boolean)));

  // Sort options
  const sortOptions = [
    { value: 'createdAt', label: 'Date Requested' },
    { value: 'startDate', label: 'Start Date' },
    { value: 'leaveType', label: 'Leave Type' },
    { value: 'status', label: 'Status' },
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      key: 'leaveType',
      label: 'Leave Type',
      options: uniqueLeaveTypes.map(t => ({ value: t, label: t })),
    },
  ];

  // Apply filtering and sorting
  const filteredAndSorted = leaves
    .filter(l => {
      const matchSearch = !searchTerm || 
        l.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterValues.status === 'all' || l.status === filterValues.status;
      const matchType = filterValues.leaveType === 'all' || l.leaveType === filterValues.leaveType;
      return matchSearch && matchStatus && matchType;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle date sorting
      if (sortField === 'createdAt' || sortField === 'startDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });

  const leaveTypes = [
    'Annual Leave',
    'Sick Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Unpaid Leave',
    'Study Leave',
    'Compassionate Leave',
    'Other',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">My Leave Requests</h3>
          <p className="text-sm text-gray-500">Apply for and manage your leave requests</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} style={{ backgroundColor: branding.primaryColor }}>
          <Plus className="w-4 h-4 mr-2" />
          New Leave Request
        </Button>
      </div>

      <ListControls
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        sortField={sortField}
        sortDir={sortDir}
        sortOptions={sortOptions}
        onSortChange={setSortField}
        onToggleSortDir={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
        filters={filterOptions}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
        onClearFilters={() => setFilterValues({ status: 'all', leaveType: 'all' })}
        onExportCSV={() => exportToCSV(
          filteredAndSorted.map(l => ({
            'Leave Type': l.leaveType || '',
            'Start Date': l.startDate,
            'End Date': l.endDate,
            Reason: l.reason || '',
            Status: l.status,
            'Requested On': new Date(l.createdAt).toLocaleDateString(),
          })),
          'my-leave-requests'
        )}
        onExportPDF={() => exportToPDF(
          'My Leave Requests',
          filteredAndSorted,
          ['leaveType', 'startDate', 'endDate', 'status'],
          branding.companyName
        )}
        placeholder="Search leave requests..."
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No leave requests found</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Request
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map(leave => {
                  const start = new Date(leave.startDate);
                  const end = new Date(leave.endDate);
                  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.leaveType || 'N/A'}</TableCell>
                      <TableCell>{leave.startDate}</TableCell>
                      <TableCell>{leave.endDate}</TableCell>
                      <TableCell>{days} day{days !== 1 ? 's' : ''}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{leave.reason || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            leave.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : leave.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(leave.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {leave.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(leave.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Leave Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Leave Type</Label>
              <Select
                value={formData.leaveType}
                onValueChange={v => setFormData({ ...formData, leaveType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please provide a reason for your leave request..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

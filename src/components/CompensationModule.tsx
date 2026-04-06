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
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { Loader2, Plus, DollarSign, Pencil, Trash2, Eye, TrendingUp, Users, Building2, User } from 'lucide-react';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { useBranding } from '../lib/branding-context';

export function CompensationModule() {
  const { accessToken, user } = useAuth();
  const { branding } = useBranding();
  const [compensations, setCompensations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, refData, usersData] = await Promise.all([
        api('/admin/compensations', { token: accessToken }),
        api('/reference-data', { token: accessToken }).catch(() => ({})),
        api('/users', { token: accessToken }).catch(() => [])
      ]);
      setCompensations(Array.isArray(data) ? data : []);
      setDepartments(refData?.departments || []);
      setBranches(refData?.branches || []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (e) {
      console.log('Failed to load compensations:', e);
      setCompensations([]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 20000); return () => clearInterval(iv); }, [load]);

  const handleCreate = () => {
    setEditItem(null);
    setFormData({
      name: '',
      type: 'allowance',
      amount: '',
      frequency: 'monthly',
      targetType: 'all', // all, department, branch, user
      description: '',
      taxable: true,
      active: true,
    });
    setSelectedUsers([]);
    setSelectedDepts([]);
    setSelectedBranches([]);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setFormData({ ...item });
    setSelectedUsers(item.targetUsers || []);
    setSelectedDepts(item.targetDepartments || []);
    setSelectedBranches(item.targetBranches || []);
    setDialogOpen(true);
  };

  const handleView = (item: any) => {
    setViewItem(item);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.name || !formData.amount) {
        toast.error('Name and amount are required');
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        targetUsers: formData.targetType === 'user' ? selectedUsers : [],
        targetDepartments: formData.targetType === 'department' ? selectedDepts : [],
        targetBranches: formData.targetType === 'branch' ? selectedBranches : [],
      };

      if (editItem) {
        await api(`/admin/compensations/${editItem.id}`, {
          method: 'PUT',
          body: payload,
          token: accessToken,
        });
        toast.success('Compensation updated successfully');
      } else {
        await api('/admin/compensations', {
          method: 'POST',
          body: payload,
          token: accessToken,
        });
        toast.success('Compensation created successfully');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save compensation');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this compensation?')) return;
    try {
      await api(`/admin/compensations/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Compensation deleted successfully');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete compensation');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleDeptSelection = (dept: string) => {
    setSelectedDepts(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const toggleBranchSelection = (branch: string) => {
    setSelectedBranches(prev =>
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  const filteredAndSorted = compensations
    .filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        item.type?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (sortField === 'amount') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (sortField === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' },
    { value: 'amount', label: 'Amount' },
    { value: 'frequency', label: 'Frequency' },
    { value: 'createdAt', label: 'Created Date' },
  ];

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">Compensation Management</h3>
            <p className="text-sm text-green-700 mt-1">
              Configure compensation packages, allowances, deductions, and bonuses. Target specific departments, branches, or individual employees.
            </p>
            {!isSuperAdmin && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                View-only mode. Only SuperAdmin can create or modify compensations.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <ListControls
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            sortField={sortField}
            sortDir={sortDir}
            sortOptions={sortOptions}
            onSortChange={setSortField}
            onToggleSortDir={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            onExportCSV={() => exportToCSV(
              filteredAndSorted.map(item => ({
                Name: item.name,
                Type: item.type,
                Amount: item.amount,
                Frequency: item.frequency,
                Target: item.targetType,
                Taxable: item.taxable ? 'Yes' : 'No',
                Active: item.active ? 'Yes' : 'No',
              })),
              'compensations'
            )}
            onExportPDF={() => exportToPDF(
              'Compensation Report',
              filteredAndSorted,
              ['name', 'type', 'amount', 'frequency', 'targetType'],
              branding.companyName
            )}
            placeholder="Search compensations..."
          />
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Compensation
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="py-16 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No compensations found</p>
              {isSuperAdmin && (
                <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Compensation
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Taxable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.type === 'salary' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'allowance' ? 'bg-green-100 text-green-800' :
                          item.type === 'bonus' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">${item.amount?.toLocaleString()}</TableCell>
                    <TableCell>{item.frequency}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.targetType === 'all' && <Badge variant="outline">Company-wide</Badge>}
                        {item.targetType === 'department' && (
                          <Badge className="bg-indigo-100 text-indigo-800">
                            <Building2 className="w-3 h-3 mr-1" />
                            {item.targetDepartments?.length || 0} Dept(s)
                          </Badge>
                        )}
                        {item.targetType === 'branch' && (
                          <Badge className="bg-cyan-100 text-cyan-800">
                            <Building2 className="w-3 h-3 mr-1" />
                            {item.targetBranches?.length || 0} Branch(es)
                          </Badge>
                        )}
                        {item.targetType === 'user' && (
                          <Badge className="bg-amber-100 text-amber-800">
                            <User className="w-3 h-3 mr-1" />
                            {item.targetUsers?.length || 0} User(s)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={item.taxable ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>
                        {item.taxable ? 'Taxable' : 'Non-taxable'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {item.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleView(item)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {isSuperAdmin && (
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
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Create'} Compensation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Housing Allowance"
                />
              </div>
              <div>
                <Label>Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.type || 'allowance'}
                  onValueChange={v => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Base Salary</SelectItem>
                    <SelectItem value="allowance">Allowance</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency || 'monthly'}
                  onValueChange={v => setFormData({ ...formData, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter compensation description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxable"
                  checked={formData.taxable ?? true}
                  onCheckedChange={checked => setFormData({ ...formData, taxable: checked })}
                />
                <Label htmlFor="taxable" className="cursor-pointer">Taxable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.active ?? true}
                  onCheckedChange={checked => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active" className="cursor-pointer">Active</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label>Target <span className="text-red-500">*</span></Label>
              <Select
                value={formData.targetType || 'all'}
                onValueChange={v => setFormData({ ...formData, targetType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Company-wide (All Employees)</SelectItem>
                  <SelectItem value="department">Specific Departments</SelectItem>
                  <SelectItem value="branch">Specific Branches</SelectItem>
                  <SelectItem value="user">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department Selection */}
            {formData.targetType === 'department' && (
              <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-y-auto">
                <Label className="mb-2 block">Select Departments</Label>
                <div className="space-y-2">
                  {departments.map(dept => {
                    const deptId = typeof dept === 'string' ? dept : (dept?.id || dept?.name);
                    const deptName = typeof dept === 'string' ? dept : (dept?.name || dept?.id);
                    return (
                      <div key={deptId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${deptId}`}
                          checked={selectedDepts.includes(deptId)}
                          onCheckedChange={() => toggleDeptSelection(deptId)}
                        />
                        <Label htmlFor={`dept-${deptId}`} className="cursor-pointer font-normal">
                          {deptName}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {selectedDepts.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {selectedDepts.length} department(s) selected
                  </p>
                )}
              </div>
            )}

            {/* Branch Selection */}
            {formData.targetType === 'branch' && (
              <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-y-auto">
                <Label className="mb-2 block">Select Branches</Label>
                <div className="space-y-2">
                  {branches.map(branch => {
                    const branchId = typeof branch === 'string' ? branch : (branch?.id || branch?.name);
                    const branchName = typeof branch === 'string' ? branch : (branch?.name || branch?.id);
                    return (
                      <div key={branchId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`branch-${branchId}`}
                          checked={selectedBranches.includes(branchId)}
                          onCheckedChange={() => toggleBranchSelection(branchId)}
                        />
                        <Label htmlFor={`branch-${branchId}`} className="cursor-pointer font-normal">
                          {branchName}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {selectedBranches.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {selectedBranches.length} branch(es) selected
                  </p>
                )}
              </div>
            )}

            {/* User Selection */}
            {formData.targetType === 'user' && (
              <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                <Label className="mb-2 block">Select Users</Label>
                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u.userId || u.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${u.userId || u.id}`}
                        checked={selectedUsers.includes(u.userId || u.id)}
                        onCheckedChange={() => toggleUserSelection(u.userId || u.id)}
                      />
                      <Label htmlFor={`user-${u.userId || u.id}`} className="cursor-pointer font-normal">
                        {u.name} ({u.email}) - {u.department || 'No Dept'}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedUsers.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {selectedUsers.length} user(s) selected
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create Compensation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compensation Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <p className="font-semibold mt-1">{viewItem.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <Badge className="mt-1">{viewItem.type}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Amount</Label>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    ${viewItem.amount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Frequency</Label>
                  <p className="mt-1">{viewItem.frequency}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <p className="text-sm mt-1">{viewItem.description || '—'}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Taxable</Label>
                  <Badge className="mt-1">{viewItem.taxable ? 'Yes' : 'No'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge className="mt-1">{viewItem.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Target Type</Label>
                  <Badge className="mt-1">{viewItem.targetType}</Badge>
                </div>
              </div>
              {viewItem.targetDepartments && viewItem.targetDepartments.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Target Departments</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewItem.targetDepartments.map((d: string) => (
                      <Badge key={d} variant="outline">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {viewItem.targetBranches && viewItem.targetBranches.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Target Branches</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewItem.targetBranches.map((b: string) => (
                      <Badge key={b} variant="outline">{b}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {viewItem.targetUsers && viewItem.targetUsers.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Target Users</Label>
                  <p className="text-sm mt-1">{viewItem.targetUsers.length} user(s) selected</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Created At</Label>
                <p className="text-sm mt-1">
                  {viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : '—'}
                </p>
              </div>
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
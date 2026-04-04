import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent } from './ui/card';
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
import { Loader2, Plus, Heart, Pencil, Trash2, Eye, TrendingUp, User, Building2} from 'lucide-react';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { useBranding } from '../lib/branding-context';

export function BenefitsModule() {
  const { accessToken, user } = useAuth();
  const { branding } = useBranding();
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
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
        api('/admin/benefits', { token: accessToken }),
        api('/reference-data', { token: accessToken }).catch(() => ({})),
        api('/users', { token: accessToken }).catch(() => [])
      ]);
      setBenefits(Array.isArray(data) ? data : []);
      setDepartments(refData?.departments || []);
      setBranches(refData?.branches || []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (e) {
      console.log('Failed to load benefits:', e);
      setBenefits([]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 20000); return () => clearInterval(iv); }, [load]);

  const handleCreate = () => {
    setEditItem(null);
    setFormData({
      name: '',
      type: 'health', // health, dental, vision, retirement, life_insurance, other
      description: '',
      employerCost: '',
      employeeCost: '',
      targetType: 'all',
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
      if (!formData.name || !formData.type) {
        toast.error('Name and type are required');
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        employerCost: parseFloat(formData.employerCost) || 0,
        employeeCost: parseFloat(formData.employeeCost) || 0,
        targetUsers: formData.targetType === 'user' ? selectedUsers : [],
        targetDepartments: formData.targetType === 'department' ? selectedDepts : [],
        targetBranches: formData.targetType === 'branch' ? selectedBranches : [],
      };

      if (editItem) {
        await api(`/admin/benefits/${editItem.id}`, {
          method: 'PUT',
          body: payload,
          token: accessToken,
        });
        toast.success('Benefit updated successfully');
      } else {
        await api('/admin/benefits', {
          method: 'POST',
          body: payload,
          token: accessToken,
        });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save benefit');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this benefit?')) return;
    try {
      await api(`/admin/benefits/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Benefit deleted successfully');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete benefit');
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

  const filteredAndSorted = benefits
    .filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        item.type?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' },
    { value: 'employerCost', label: 'Employer Cost' },
  ];

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-pink-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-pink-900">Benefits Management</h3>
            <p className="text-sm text-pink-700 mt-1">
              Configure employee benefits including health insurance, retirement plans, and other perks.
            </p>
            {!isSuperAdmin && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                View-only mode. Only SuperAdmin can create or modify benefits.
              </p>
            )}
          </div>
        </div>
      </div>

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
                'Employer Cost': item.employerCost,
                'Employee Cost': item.employeeCost,
                Target: item.targetType,
                Active: item.active ? 'Yes' : 'No',
              })),
              'benefits'
            )}
            onExportPDF={() => exportToPDF(
              'Benefits Report',
              filteredAndSorted,
              ['name', 'type', 'employerCost', 'employeeCost'],
              branding.companyName
            )}
            placeholder="Search benefits..."
          />
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Benefit
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="py-16 text-center">
              <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No benefits found</p>
              {isSuperAdmin && (
                <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Benefit
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Employer Cost</TableHead>
                  <TableHead>Employee Cost</TableHead>
                  <TableHead>Target</TableHead>
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
                          item.type === 'health' ? 'bg-red-100 text-red-800' :
                          item.type === 'dental' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'vision' ? 'bg-purple-100 text-purple-800' :
                          item.type === 'retirement' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {item.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${item.employerCost?.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      ${item.employeeCost?.toLocaleString()}
                    </TableCell>
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
            <DialogTitle>{editItem ? 'Edit' : 'Create'} Benefit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Health Insurance"
                />
              </div>
              <div>
                <Label>Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.type || 'health'}
                  onValueChange={v => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health Insurance</SelectItem>
                    <SelectItem value="dental">Dental Insurance</SelectItem>
                    <SelectItem value="vision">Vision Insurance</SelectItem>
                    <SelectItem value="retirement">Retirement Plan</SelectItem>
                    <SelectItem value="life_insurance">Life Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employer Cost (Monthly)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.employerCost || ''}
                  onChange={e => setFormData({ ...formData, employerCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Employee Cost (Monthly)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.employeeCost || ''}
                  onChange={e => setFormData({ ...formData, employeeCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter benefit description"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={formData.active ?? true}
                onCheckedChange={checked => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active" className="cursor-pointer">Active</Label>
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

            {formData.targetType === 'department' && (
              <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-y-auto">
                <Label className="mb-2 block">Select Departments</Label>
                <div className="space-y-2">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={selectedDepts.includes(dept)}
                        onCheckedChange={() => toggleDeptSelection(dept)}
                      />
                      <Label htmlFor={`dept-${dept}`} className="cursor-pointer font-normal">{dept}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.targetType === 'branch' && (
              <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-y-auto">
                <Label className="mb-2 block">Select Branches</Label>
                <div className="space-y-2">
                  {branches.map(branch => (
                    <div key={branch} className="flex items-center space-x-2">
                      <Checkbox
                        id={`branch-${branch}`}
                        checked={selectedBranches.includes(branch)}
                        onCheckedChange={() => toggleBranchSelection(branch)}
                      />
                      <Label htmlFor={`branch-${branch}`} className="cursor-pointer font-normal">{branch}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                        {u.name} ({u.email})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create Benefit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Benefit Details</DialogTitle>
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
                  <Label className="text-xs text-gray-500">Employer Cost</Label>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    ${viewItem.employerCost?.toLocaleString()}/mo
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Employee Cost</Label>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    ${viewItem.employeeCost?.toLocaleString()}/mo
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <p className="text-sm mt-1">{viewItem.description || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Target Type</Label>
                  <Badge className="mt-1">{viewItem.targetType}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge className="mt-1">{viewItem.active ? 'Active' : 'Inactive'}</Badge>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
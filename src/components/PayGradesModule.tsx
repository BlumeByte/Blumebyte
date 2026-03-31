import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Loader2, Plus, TrendingUp, Pencil, Trash2, Eye, Award } from 'lucide-react';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { useBranding } from '../lib/branding-context';

export function PayGradesModule() {
  const { accessToken, user } = useAuth();
  const { branding } = useBranding();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('level');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/admin/paygrades', { token: accessToken });
      setGrades(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Failed to load pay grades:', e);
      setGrades([]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 20000); return () => clearInterval(iv); }, [load]);

  const handleCreate = () => {
    setEditItem(null);
    setFormData({
      name: '',
      level: '',
      minSalary: '',
      maxSalary: '',
      description: '',
      currency: 'USD',
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
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
      if (!formData.name || !formData.level || !formData.minSalary || !formData.maxSalary) {
        toast.error('All fields except description are required');
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        level: parseInt(formData.level),
        minSalary: parseFloat(formData.minSalary),
        maxSalary: parseFloat(formData.maxSalary),
      };

      if (parseFloat(formData.maxSalary) < parseFloat(formData.minSalary)) {
        toast.error('Max salary must be greater than min salary');
        setSaving(false);
        return;
      }

      if (editItem) {
        await api(`/admin/paygrades/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          token: accessToken,
        });
        toast.success('Pay grade updated successfully');
      } else {
        await api('/admin/paygrades', {
          method: 'POST',
          body: JSON.stringify(payload),
          token: accessToken,
        });
        toast.success('Pay grade created successfully');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save pay grade');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pay grade?')) return;
    try {
      await api(`/admin/paygrades/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Pay grade deleted successfully');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete pay grade');
    }
  };

  const filteredAndSorted = grades
    .filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aVal = a[sortField] || 0;
      let bVal = b[sortField] || 0;
      
      if (sortField === 'level' || sortField === 'minSalary' || sortField === 'maxSalary') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });

  const sortOptions = [
    { value: 'level', label: 'Level' },
    { value: 'name', label: 'Name' },
    { value: 'minSalary', label: 'Min Salary' },
    { value: 'maxSalary', label: 'Max Salary' },
  ];

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-purple-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900">Pay Grades Management</h3>
            <p className="text-sm text-purple-700 mt-1">
              Define salary ranges and compensation levels for different job grades and positions.
            </p>
            {!isSuperAdmin && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                View-only mode. Only SuperAdmin can create or modify pay grades.
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
                Level: item.level,
                'Min Salary': item.minSalary,
                'Max Salary': item.maxSalary,
                Currency: item.currency || 'USD',
                Description: item.description || '',
              })),
              'pay-grades'
            )}
            onExportPDF={() => exportToPDF(
              'Pay Grades Report',
              filteredAndSorted,
              ['name', 'level', 'minSalary', 'maxSalary'],
              branding.companyName
            )}
            placeholder="Search pay grades..."
          />
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Pay Grade
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
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No pay grades found</p>
              {isSuperAdmin && (
                <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Pay Grade
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Min Salary</TableHead>
                  <TableHead>Max Salary</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge className="bg-indigo-100 text-indigo-800">
                        Level {item.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${item.minSalary?.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${item.maxSalary?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        Spread: ${(item.maxSalary - item.minSalary)?.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {item.description || '—'}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Create'} Pay Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Entry Level"
                />
              </div>
              <div>
                <Label>Level <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.level || ''}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Salary <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.minSalary || ''}
                  onChange={e => setFormData({ ...formData, minSalary: e.target.value })}
                  placeholder="30000.00"
                />
              </div>
              <div>
                <Label>Maximum Salary <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.maxSalary || ''}
                  onChange={e => setFormData({ ...formData, maxSalary: e.target.value })}
                  placeholder="50000.00"
                />
              </div>
            </div>

            {formData.minSalary && formData.maxSalary && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-blue-800">
                  <strong>Salary Range:</strong> ${parseFloat(formData.minSalary).toLocaleString()} - ${parseFloat(formData.maxSalary).toLocaleString()}
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Spread: ${(parseFloat(formData.maxSalary) - parseFloat(formData.minSalary)).toLocaleString()}
                </p>
              </div>
            )}

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter pay grade description and criteria"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create Pay Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pay Grade Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <p className="font-semibold text-lg mt-1">{viewItem.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Level</Label>
                  <Badge className="mt-1 bg-indigo-100 text-indigo-800">Level {viewItem.level}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Minimum Salary</Label>
                  <p className="text-xl font-bold text-green-600 mt-1">
                    ${viewItem.minSalary?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Maximum Salary</Label>
                  <p className="text-xl font-bold text-green-600 mt-1">
                    ${viewItem.maxSalary?.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded">
                <Label className="text-xs text-gray-500">Salary Range</Label>
                <p className="text-sm mt-1">
                  <strong>Spread:</strong> ${(viewItem.maxSalary - viewItem.minSalary)?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This grade allows for salary progression from ${viewItem.minSalary?.toLocaleString()} to ${viewItem.maxSalary?.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{viewItem.description || '—'}</p>
              </div>
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
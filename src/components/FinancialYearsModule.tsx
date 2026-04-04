import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { Loader2, Plus, Calendar, Pencil, Trash2, Eye, TrendingUp } from 'lucide-react';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { useBranding } from '../lib/branding-context';

export function FinancialYearsModule() {
  const { accessToken, user } = useAuth();
  const { branding } = useBranding();
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('year');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/financial-years', { token: accessToken });
      setYears(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Failed to load financial years:', e);
      setYears([]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 20000); return () => clearInterval(iv); }, [load]);

  const handleCreate = () => {
    setEditItem(null);
    const currentYear = new Date().getFullYear();
    setFormData({
      year: currentYear,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      isCurrent: false,
      isClosed: false,
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
      if (!formData.year || !formData.startDate || !formData.endDate) {
        toast.error('Year, start date, and end date are required');
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        year: parseInt(formData.year),
      };

      if (editItem) {
        await api(`/financial-years/${editItem.id}`, {
          method: 'PUT',
          body: payload,
          token: accessToken,
        });
        toast.success('Financial year updated successfully');
      } else {
        await api('/financial-years', {
          method: 'POST',
          body: payload,
          token: accessToken,
        });
        toast.success('Financial year created successfully');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save financial year');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this financial year?')) return;
    try {
      await api(`/financial-years/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Financial year deleted successfully');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete financial year');
    }
  };

  const filteredAndSorted = years
    .filter(item => {
      if (!searchTerm) return true;
      return String(item.year).includes(searchTerm);
    })
    .sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const sortOptions = [
    { value: 'year', label: 'Year' },
    { value: 'startDate', label: 'Start Date' },
  ];

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-cyan-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-cyan-900">Financial Years Management</h3>
            <p className="text-sm text-cyan-700 mt-1">
              Define financial years for payroll processing, tax calculation, and financial reporting.
            </p>
            {!isSuperAdmin && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                View-only mode. Only SuperAdmin can create or modify financial years.
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
                Year: item.year,
                'Start Date': item.startDate,
                'End Date': item.endDate,
                'Is Current': item.isCurrent ? 'Yes' : 'No',
                'Is Closed': item.isClosed ? 'Yes' : 'No',
              })),
              'financial-years'
            )}
            onExportPDF={() => exportToPDF(
              'Financial Years Report',
              filteredAndSorted,
              ['year', 'startDate', 'endDate', 'isCurrent', 'isClosed'],
              branding.companyName
            )}
            placeholder="Search years..."
          />
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Financial Year
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
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No financial years found</p>
              {isSuperAdmin && (
                <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Financial Year
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-lg">{item.year}</TableCell>
                    <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(item.endDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </TableCell>
                    <TableCell>
                      {item.isCurrent && (
                        <Badge className="bg-green-100 text-green-800">Current</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={item.isClosed ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                        {item.isClosed ? 'Closed' : 'Open'}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Create'} Financial Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Year <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.year || ''}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
                placeholder="2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCurrent"
                  checked={formData.isCurrent ?? false}
                  onCheckedChange={checked => setFormData({ ...formData, isCurrent: checked })}
                />
                <Label htmlFor="isCurrent" className="cursor-pointer">Mark as current financial year</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isClosed"
                  checked={formData.isClosed ?? false}
                  onCheckedChange={checked => setFormData({ ...formData, isClosed: checked })}
                />
                <Label htmlFor="isClosed" className="cursor-pointer">Mark as closed (no new transactions)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create Financial Year'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Financial Year Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Year</Label>
                <p className="text-2xl font-bold mt-1">{viewItem.year}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Start Date</Label>
                  <p className="mt-1">{new Date(viewItem.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">End Date</Label>
                  <p className="mt-1">{new Date(viewItem.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Current Year</Label>
                  <Badge className="mt-1">{viewItem.isCurrent ? 'Yes' : 'No'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge className="mt-1">{viewItem.isClosed ? 'Closed' : 'Open'}</Badge>
                </div>
              </div>
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
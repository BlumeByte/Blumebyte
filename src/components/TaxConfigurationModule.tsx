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
import { Loader2, Plus, Receipt, Pencil, Trash2, Eye, TrendingUp } from 'lucide-react';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { useBranding } from '../lib/branding-context';

export function TaxConfigurationModule() {
  const { accessToken, user } = useAuth();
  const { branding } = useBranding();
  const [taxConfigs, setTaxConfigs] = useState<any[]>([]);
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
  const [taxBrackets, setTaxBrackets] = useState<any[]>([{ min: 0, max: 0, rate: 0 }]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/tax-configurations', { token: accessToken });
      setTaxConfigs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Failed to load tax configurations:', e);
      setTaxConfigs([]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 20000); return () => clearInterval(iv); }, [load]);

  const handleCreate = () => {
    setEditItem(null);
    setFormData({
      name: '',
      type: 'income', // income, social_security, medicare, other
      calculationType: 'percentage', // percentage, fixed, brackets
      rate: 0,
      description: '',
      active: true,
    });
    setTaxBrackets([{ min: 0, max: 0, rate: 0 }]);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setFormData({ ...item });
    setTaxBrackets(item.brackets || [{ min: 0, max: 0, rate: 0 }]);
    setDialogOpen(true);
  };

  const handleView = (item: any) => {
    setViewItem(item);
    setViewDialogOpen(true);
  };

  const addBracket = () => {
    setTaxBrackets([...taxBrackets, { min: 0, max: 0, rate: 0 }]);
  };

  const removeBracket = (index: number) => {
    if (taxBrackets.length > 1) {
      setTaxBrackets(taxBrackets.filter((_, i) => i !== index));
    }
  };

  const updateBracket = (index: number, field: string, value: any) => {
    const updated = [...taxBrackets];
    updated[index][field] = parseFloat(value) || 0;
    setTaxBrackets(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.name || !formData.type || !formData.calculationType) {
        toast.error('Name, type, and calculation type are required');
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        rate: parseFloat(formData.rate) || 0,
        brackets: formData.calculationType === 'brackets' ? taxBrackets : undefined,
      };

      if (editItem) {
        await api(`/tax-configurations/${editItem.id}`, {
          method: 'PUT',
          body: payload,
          token: accessToken,
        });
        toast.success('Tax configuration updated successfully');
      } else {
        await api('/tax-configurations', {
          method: 'POST',
          body: payload,
          token: accessToken,
        });
        toast.success('Tax configuration created successfully');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save tax configuration');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax configuration?')) return;
    try {
      await api(`/tax-configurations/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Tax configuration deleted successfully');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete tax configuration');
    }
  };

  const filteredAndSorted = taxConfigs
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
    { value: 'calculationType', label: 'Calculation Type' },
  ];

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Receipt className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900">Tax Configuration</h3>
            <p className="text-sm text-orange-700 mt-1">
              Configure tax rates, brackets, and deductions for accurate payroll tax calculations.
            </p>
            {!isSuperAdmin && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                View-only mode. Only SuperAdmin can create or modify tax configurations.
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
                'Calculation Type': item.calculationType,
                Rate: item.rate || '',
                Active: item.active ? 'Yes' : 'No',
              })),
              'tax-configurations'
            )}
            onExportPDF={() => exportToPDF(
              'Tax Configurations Report',
              filteredAndSorted,
              ['name', 'type', 'calculationType', 'rate'],
              branding.companyName
            )}
            placeholder="Search tax configurations..."
          />
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Tax Config
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
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No tax configurations found</p>
              {isSuperAdmin && (
                <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Tax Config
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Calculation Type</TableHead>
                  <TableHead>Rate/Details</TableHead>
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
                          item.type === 'income' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'social_security' ? 'bg-green-100 text-green-800' :
                          item.type === 'medicare' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {item.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.calculationType}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.calculationType === 'percentage' && `${item.rate}%`}
                      {item.calculationType === 'fixed' && `$${item.rate}`}
                      {item.calculationType === 'brackets' && `${item.brackets?.length || 0} brackets`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Create'} Tax Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Federal Income Tax"
                />
              </div>
              <div>
                <Label>Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.type || 'income'}
                  onValueChange={v => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income Tax</SelectItem>
                    <SelectItem value="social_security">Social Security</SelectItem>
                    <SelectItem value="medicare">Medicare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Calculation Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.calculationType || 'percentage'}
                onValueChange={v => setFormData({ ...formData, calculationType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="brackets">Tax Brackets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.calculationType === 'percentage' || formData.calculationType === 'fixed') && (
              <div>
                <Label>
                  {formData.calculationType === 'percentage' ? 'Rate (%)' : 'Amount ($)'}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rate || ''}
                  onChange={e => setFormData({ ...formData, rate: e.target.value })}
                  placeholder={formData.calculationType === 'percentage' ? '15.00' : '100.00'}
                />
              </div>
            )}

            {formData.calculationType === 'brackets' && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <Label>Tax Brackets</Label>
                  <Button type="button" size="sm" onClick={addBracket}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Bracket
                  </Button>
                </div>
                <div className="space-y-2">
                  {taxBrackets.map((bracket, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end">
                      <div>
                        <Label className="text-xs">Min ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.min || ''}
                          onChange={e => updateBracket(index, 'min', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.max || ''}
                          onChange={e => updateBracket(index, 'max', e.target.value)}
                          placeholder="10000"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bracket.rate || ''}
                          onChange={e => updateBracket(index, 'rate', e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => removeBracket(index)}
                        disabled={taxBrackets.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter tax configuration description"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create Tax Config'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tax Configuration Details</DialogTitle>
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
                  <Label className="text-xs text-gray-500">Calculation Type</Label>
                  <Badge className="mt-1" variant="outline">{viewItem.calculationType}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge className="mt-1">{viewItem.active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
              {viewItem.calculationType === 'brackets' && viewItem.brackets && (
                <div>
                  <Label className="text-xs text-gray-500">Tax Brackets</Label>
                  <div className="mt-2 border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Min</th>
                          <th className="text-left p-2">Max</th>
                          <th className="text-left p-2">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewItem.brackets.map((b: any, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">${b.min?.toLocaleString()}</td>
                            <td className="p-2">${b.max?.toLocaleString()}</td>
                            <td className="p-2">{b.rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {viewItem.calculationType !== 'brackets' && (
                <div>
                  <Label className="text-xs text-gray-500">
                    {viewItem.calculationType === 'percentage' ? 'Rate' : 'Amount'}
                  </Label>
                  <p className="font-semibold mt-1">
                    {viewItem.calculationType === 'percentage' ? `${viewItem.rate}%` : `$${viewItem.rate}`}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <p className="text-sm mt-1">{viewItem.description || '—'}</p>
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
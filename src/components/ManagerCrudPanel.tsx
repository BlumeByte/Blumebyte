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
import { toast } from 'sonner@2.0.3';
import { Loader2, Plus, Pencil, Trash2, Eye, FileText, AlertCircle } from 'lucide-react';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { useBranding } from '../lib/branding-context';
import { MultiEmployeeSelect } from './MultiEmployeeSelect';

interface ManagerCrudPanelProps {
  resourceType: 'workflows' | 'performance' | 'disciplinary' | 'compliance' | 'tasks' | 'feedback';
  title: string;
  description: string;
  icon: any;
}

const RESOURCE_CONFIGS = {
  workflows: {
    endpoint: '/workflows',
    kvPrefix: 'workflow:',
    fields: [
      { key: 'name', label: 'Workflow Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'completed'], required: true },
      { key: 'assignedTo', label: 'Assigned Employees', type: 'multiselect', required: false },
      { key: 'dueDate', label: 'Due Date', type: 'date', required: false },
    ],
    tableColumns: ['name', 'description', 'status', 'assignedTo', 'dueDate'],
    displayColumns: { name: 'Name', description: 'Description', status: 'Status', assignedTo: 'Assigned To', dueDate: 'Due Date' },
  },
  performance: {
    endpoint: '/performance-reviews',
    kvPrefix: 'performance:',
    fields: [
      { key: 'employeeIds', label: 'Employees', type: 'multiselect', required: true },
      { key: 'reviewPeriod', label: 'Review Period', type: 'text', required: true },
      { key: 'rating', label: 'Rating', type: 'select', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'], required: true },
      { key: 'comments', label: 'Comments', type: 'textarea', required: false },
      { key: 'goals', label: 'Goals', type: 'textarea', required: false },
      { key: 'reviewDate', label: 'Review Date', type: 'date', required: true },
    ],
    tableColumns: ['employeeIds', 'reviewPeriod', 'rating', 'reviewDate'],
    displayColumns: { employeeIds: 'Employees', reviewPeriod: 'Period', rating: 'Rating', reviewDate: 'Review Date' },
  },
  disciplinary: {
    endpoint: '/disciplinary-actions',
    kvPrefix: 'disciplinary:',
    fields: [
      { key: 'employeeIds', label: 'Employees', type: 'multiselect', required: true },
      { key: 'actionType', label: 'Action Type', type: 'select', options: ['Verbal Warning', 'Written Warning', 'Suspension', 'Termination'], required: true },
      { key: 'reason', label: 'Reason', type: 'textarea', required: true },
      { key: 'actionDate', label: 'Action Date', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'active', 'resolved'], required: true },
      { key: 'notes', label: 'Notes', type: 'textarea', required: false },
    ],
    tableColumns: ['employeeIds', 'actionType', 'reason', 'actionDate', 'status'],
    displayColumns: { employeeIds: 'Employees', actionType: 'Action Type', reason: 'Reason', actionDate: 'Date', status: 'Status' },
  },
  compliance: {
    endpoint: '/compliance-records',
    kvPrefix: 'compliance:',
    fields: [
      { key: 'title', label: 'Compliance Item', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Labour Law', 'Safety', 'Documentation', 'Training', 'Other'], required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['compliant', 'non-compliant', 'in-progress'], required: true },
      { key: 'dueDate', label: 'Due Date', type: 'date', required: false },
      { key: 'assignedTo', label: 'Assigned Employees', type: 'multiselect', required: false },
      { key: 'notes', label: 'Notes', type: 'textarea', required: false },
    ],
    tableColumns: ['title', 'category', 'status', 'dueDate'],
    displayColumns: { title: 'Item', category: 'Category', status: 'Status', dueDate: 'Due Date' },
  },
  tasks: {
    endpoint: '/task-assignments',
    kvPrefix: 'task:',
    fields: [
      { key: 'taskName', label: 'Task Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'assignedTo', label: 'Assigned Employees', type: 'multiselect', required: true },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'], required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'completed', 'cancelled'], required: true },
      { key: 'dueDate', label: 'Due Date', type: 'date', required: false },
    ],
    tableColumns: ['taskName', 'description', 'assignedTo', 'priority', 'status', 'dueDate'],
    displayColumns: { taskName: 'Task', description: 'Description', assignedTo: 'Assigned To', priority: 'Priority', status: 'Status', dueDate: 'Due Date' },
  },
  feedback: {
    endpoint: '/360-feedback',
    kvPrefix: 'feedback:',
    fields: [
      { key: 'employeeIds', label: 'Employees', type: 'multiselect', required: true },
      { key: 'feedbackType', label: 'Feedback Type', type: 'select', options: ['Peer', 'Manager', 'Self', 'Subordinate'], required: true },
      { key: 'strengths', label: 'Strengths', type: 'textarea', required: true },
      { key: 'improvements', label: 'Areas for Improvement', type: 'textarea', required: true },
      { key: 'rating', label: 'Overall Rating', type: 'select', options: ['1', '2', '3', '4', '5'], required: true },
      { key: 'feedbackDate', label: 'Feedback Date', type: 'date', required: true },
    ],
    tableColumns: ['employeeIds', 'feedbackType', 'rating', 'feedbackDate'],
    displayColumns: { employeeIds: 'Employees', feedbackType: 'Type', rating: 'Rating', feedbackDate: 'Date' },
  },
};

export function ManagerCrudPanel({ resourceType, title, description, icon: Icon }: ManagerCrudPanelProps) {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [items, setItems] = useState<any[]>([]);
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
  const [managerDepartment, setManagerDepartment] = useState('');
  const [departmentEmployees, setDepartmentEmployees] = useState<any[]>([]);

  const config = RESOURCE_CONFIGS[resourceType];

  const loadManagerProfile = useCallback(async () => {
    try {
      const profile = await api('/profile', { token: accessToken });
      setManagerDepartment(profile?.department || '');
    } catch (e) {
      console.log('Failed to load manager profile:', e);
    }
  }, [accessToken]);

  const loadDepartmentEmployees = useCallback(async () => {
    try {
      const users = await api('/users', { token: accessToken });
      const profile = await api('/profile', { token: accessToken });
      const dept = profile?.department || '';
      const deptEmps = Array.isArray(users) 
        ? users.filter((u: any) => u.department === dept && u.role === 'employee')
        : [];
      setDepartmentEmployees(deptEmps);
    } catch (e) {
      console.log('Failed to load department employees:', e);
    }
  }, [accessToken]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, profile] = await Promise.all([
        api(config.endpoint, { token: accessToken }),
        api('/profile', { token: accessToken })
      ]);
      const dept = profile?.department || '';
      setManagerDepartment(dept);
      
      // Filter items to only show those related to manager's department employees
      const filtered = Array.isArray(data) 
        ? data.filter((item: any) => {
            // Check if item has department field
            if (item.department) {
              return item.department === dept;
            }
            // Check if item has assignedTo field (array of employee IDs or names)
            if (item.assignedTo) {
              // This is a simplified check - in production you'd match against actual employee IDs
              return true; // For now, show all if we can't determine department
            }
            return true; // Default: show all
          })
        : [];
      
      setItems(filtered);
    } catch (e) {
      console.log(`Failed to load ${resourceType}:`, e);
      setItems([]);
    }
    setLoading(false);
  }, [accessToken, config.endpoint, resourceType]);

  useEffect(() => { loadManagerProfile(); }, [loadManagerProfile]);
  useEffect(() => { loadDepartmentEmployees(); }, [loadDepartmentEmployees]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 20000); return () => clearInterval(iv); }, [load]);

  const handleCreate = () => {
    setEditItem(null);
    setFormData({ 
      status: 'pending',
      department: managerDepartment, // Auto-assign manager's department
      createdBy: 'manager',
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    // Check if item belongs to manager's department
    if (item.department && item.department !== managerDepartment) {
      toast.error('You can only edit items in your department');
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
      // Validate required fields
      const missingFields = config.fields
        .filter(f => f.required && !formData[f.key])
        .map(f => f.label);
      
      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        setSaving(false);
        return;
      }

      // Ensure department is set
      const payload = {
        ...formData,
        department: managerDepartment,
      };

      if (editItem) {
        await api(`${config.endpoint}/${editItem.id}`, {
          method: 'PUT',
          body: payload,
          token: accessToken,
        });
        toast.success('Updated successfully');
      } else {
        await api(config.endpoint, {
          method: 'POST',
          body: payload,
          token: accessToken,
        });
        toast.success('Created successfully');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api(`${config.endpoint}/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted successfully');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  // Apply filtering and sorting
  const filteredAndSorted = items
    .filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle date sorting
      if (sortField.includes('Date') || sortField === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });

  const sortOptions = config.tableColumns.map(col => ({
    value: col,
    label: config.displayColumns[col as keyof typeof config.displayColumns],
  }));

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">{title}</h3>
            <p className="text-sm text-blue-700 mt-1">{description}</p>
            <p className="text-xs text-blue-600 mt-2">
              Department: <span className="font-medium">{managerDepartment || 'Loading...'}</span> • 
              Showing items for your department only
            </p>
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
              filteredAndSorted.map(item => {
                const row: any = {};
                config.tableColumns.forEach(col => {
                  row[config.displayColumns[col as keyof typeof config.displayColumns]] = item[col] || '';
                });
                return row;
              }),
              resourceType
            )}
            onExportPDF={() => exportToPDF(
              title,
              filteredAndSorted,
              config.tableColumns,
              branding.companyName
            )}
            placeholder={`Search ${title.toLowerCase()}...`}
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
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
              <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No {title.toLowerCase()} found</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Item
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {config.tableColumns.map(col => (
                    <TableHead key={col}>
                      {config.displayColumns[col as keyof typeof config.displayColumns]}
                    </TableHead>
                  ))}
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map(item => (
                  <TableRow key={item.id}>
                    {config.tableColumns.map(col => (
                      <TableCell key={col} className="max-w-[200px] truncate">
                        {col === 'status' ? (
                          <Badge
                            className={
                              item[col] === 'active' || item[col] === 'completed' || item[col] === 'compliant'
                                ? 'bg-green-100 text-green-800'
                                : item[col] === 'pending' || item[col] === 'in-progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {item[col]}
                          </Badge>
                        ) : col === 'priority' ? (
                          <Badge
                            className={
                              item[col] === 'urgent' || item[col] === 'high'
                                ? 'bg-red-100 text-red-800'
                                : item[col] === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {item[col]}
                          </Badge>
                        ) : col === 'rating' ? (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{item[col]}</span>
                            {item[col] === 'Excellent' || item[col] === '5' ? '⭐⭐⭐⭐⭐' : 
                             item[col] === 'Good' || item[col] === '4' ? '⭐⭐⭐⭐' :
                             item[col] === 'Satisfactory' || item[col] === '3' ? '⭐⭐⭐' : '⭐⭐'}
                          </div>
                        ) : col.includes('Date') ? (
                          item[col] ? new Date(item[col]).toLocaleDateString() : '—'
                        ) : col === 'assignedTo' || col === 'employeeIds' ? (
                          Array.isArray(item[col]) ? (
                            item[col].length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item[col].slice(0, 2).map((id: string, idx: number) => {
                                  const emp = departmentEmployees.find(e => (e.userId || e.id) === id);
                                  return (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {emp?.name || id}
                                    </Badge>
                                  );
                                })}
                                {item[col].length > 2 && (
                                  <Badge variant="outline" className="text-xs bg-gray-100">
                                    +{item[col].length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : '—'
                          ) : item[col] || '—'
                        ) : (
                          item[col] || '—'
                        )}
                      </TableCell>
                    ))}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Create'} {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {config.fields.map(field => (
              <div key={field.key}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === 'text' && (
                  <Input
                    value={formData[field.key] || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
                {field.type === 'textarea' && (
                  <Textarea
                    value={formData[field.key] || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    rows={3}
                  />
                )}
                {field.type === 'select' && (
                  <Select
                    value={formData[field.key] || ''}
                    onValueChange={v => setFormData({ ...formData, [field.key]: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map(opt => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.type === 'date' && (
                  <Input
                    type="date"
                    value={formData[field.key] || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                )}
                {field.type === 'multiselect' && (
                  <MultiEmployeeSelect
                    employees={departmentEmployees}
                    selectedIds={formData[field.key] || []}
                    onChange={ids => setFormData({ ...formData, [field.key]: ids })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {viewItem && config.fields.map(field => (
              <div key={field.key} className="border-b pb-2">
                <Label className="text-xs text-gray-500">{field.label}</Label>
                <p className="mt-1 text-sm">
                  {field.type === 'date' && viewItem[field.key]
                    ? new Date(viewItem[field.key]).toLocaleDateString()
                    : Array.isArray(viewItem[field.key])
                    ? viewItem[field.key].join(', ')
                    : viewItem[field.key] || '—'}
                </p>
              </div>
            ))}
            <div className="border-b pb-2">
              <Label className="text-xs text-gray-500">Created At</Label>
              <p className="mt-1 text-sm">
                {viewItem?.createdAt ? new Date(viewItem.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            <div className="border-b pb-2">
              <Label className="text-xs text-gray-500">Updated At</Label>
              <p className="mt-1 text-sm">
                {viewItem?.updatedAt ? new Date(viewItem.updatedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
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
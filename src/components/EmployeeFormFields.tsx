import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface EmployeeFormFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
  editUser?: any;
  companies?: any[];
  departmentsList?: any[];
  roleOptions?: string[];
}

export function EmployeeFormFields({ 
  formData, 
  setFormData, 
  editUser, 
  companies = [], 
  departmentsList = [],
  roleOptions = ['employee', 'manager', 'admin']
}: EmployeeFormFieldsProps) {
  return (
    <div className="space-y-3 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Name *</Label>
          <Input 
            value={formData.name || ''} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
          />
        </div>
        <div>
          <Label className="text-xs">Email *</Label>
          <Input 
            type="email" 
            value={formData.email || ''} 
            onChange={e => setFormData({ ...formData, email: e.target.value })} 
            disabled={!!editUser} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Role</Label>
          <Select value={formData.role || 'employee'} onValueChange={v => setFormData({ ...formData, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {roleOptions.map(role => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {companies.length > 0 && (
          <div>
            <Label className="text-xs">Company</Label>
            <Select value={formData.companyId || ''} onValueChange={v => setFormData({ ...formData, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Department</Label>
          <Select value={formData.department || ''} onValueChange={v => setFormData({ ...formData, department: v })}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {departmentsList.filter(d => d.status === 'active').map(d => (
                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Position</Label>
          <Input 
            value={formData.position || ''} 
            onChange={e => setFormData({ ...formData, position: e.target.value })} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Grade/Level</Label>
          <Select value={formData.grade || ''} onValueChange={v => setFormData({ ...formData, grade: v })}>
            <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Junior">Junior</SelectItem>
              <SelectItem value="Mid-Level">Mid-Level</SelectItem>
              <SelectItem value="Senior">Senior</SelectItem>
              <SelectItem value="Lead">Lead</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Director">Director</SelectItem>
              <SelectItem value="VP">VP</SelectItem>
              <SelectItem value="C-Level">C-Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input 
            value={formData.phone || ''} 
            onChange={e => setFormData({ ...formData, phone: e.target.value })} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={formData.status || 'active'} onValueChange={v => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on-leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

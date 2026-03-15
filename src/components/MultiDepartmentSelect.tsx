import React, { useState } from 'react';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { NativeSelect } from './ui/native-select';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface MultiDepartmentSelectProps {
  departments: any[];
  selectedDepartments: string[];
  onChange: (departments: string[]) => void;
  label?: string;
  primaryDepartment?: string;
  onPrimaryChange?: (dept: string) => void;
  showPrimary?: boolean;
}

export function MultiDepartmentSelect({
  departments,
  selectedDepartments,
  onChange,
  label = 'Departments',
  primaryDepartment,
  onPrimaryChange,
  showPrimary = true,
}: MultiDepartmentSelectProps) {
  const [selectValue, setSelectValue] = useState('');

  const handleAdd = () => {
    if (!selectValue) return;
    if (selectedDepartments.includes(selectValue)) {
      toast.error('Department already added');
      return;
    }
    const newDepts = [...selectedDepartments, selectValue];
    onChange(newDepts);
    
    // Auto-set as primary if it's the first department
    if (showPrimary && !primaryDepartment && onPrimaryChange) {
      onPrimaryChange(selectValue);
    }
    
    setSelectValue('');
  };

  const handleRemove = (dept: string) => {
    const newDepts = selectedDepartments.filter(d => d !== dept);
    onChange(newDepts);
    
    // If we removed the primary department, set a new primary
    if (showPrimary && primaryDepartment === dept && newDepts.length > 0 && onPrimaryChange) {
      onPrimaryChange(newDepts[0]);
    }
  };

  const handleSetPrimary = (dept: string) => {
    if (onPrimaryChange) {
      onPrimaryChange(dept);
    }
  };

  const availableDepts = departments.filter(
    d => !selectedDepartments.includes(d.name)
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Selected departments */}
      {selectedDepartments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
          {selectedDepartments.map(dept => (
            <div key={dept} className="flex items-center gap-1">
              <Badge
                className={`cursor-pointer transition-colors ${
                  showPrimary && primaryDepartment === dept
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                onClick={() => showPrimary && handleSetPrimary(dept)}
              >
                {dept}
                {showPrimary && primaryDepartment === dept && (
                  <span className="ml-1 text-xs">(Primary)</span>
                )}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-red-100"
                onClick={() => handleRemove(dept)}
              >
                <X className="w-3 h-3 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showPrimary && selectedDepartments.length > 1 && (
        <p className="text-xs text-gray-500">
          Click a department to set it as primary. Primary department is used for default filtering.
        </p>
      )}

      {/* Add new department */}
      {availableDepts.length > 0 && (
        <div className="flex gap-2">
          <NativeSelect
            value={selectValue}
            onChange={e => setSelectValue(e.target.value)}
            className="flex-1"
          >
            <option value="">Select department to add...</option>
            {availableDepts.map(d => (
              <option key={d.id || d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!selectValue}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}

      {selectedDepartments.length === 0 && (
        <p className="text-sm text-amber-600">
          No departments assigned. User will have limited access.
        </p>
      )}
    </div>
  );
}

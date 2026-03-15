import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface MultiEmployeeSelectProps {
  employees: any[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function MultiEmployeeSelect({ employees, selectedIds, onChange, placeholder = "Select employees..." }: MultiEmployeeSelectProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = employees.filter(emp => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (emp.name || emp.fullName || '').toLowerCase().includes(s) ||
           (emp.email || '').toLowerCase().includes(s) ||
           (emp.department || '').toLowerCase().includes(s);
  });

  const toggleEmployee = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(eid => eid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedEmployees = employees.filter(emp => selectedIds.includes(emp.id || emp.userId));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {selectedEmployees.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedEmployees.slice(0, 3).map(emp => (
                <Badge key={emp.id || emp.userId} variant="secondary" className="text-xs">
                  {emp.name || emp.fullName}
                </Badge>
              ))}
              {selectedEmployees.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedEmployees.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="p-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No employees found</p>
            ) : (
              filtered.map(emp => {
                const id = emp.id || emp.userId;
                const isSelected = selectedIds.includes(id);
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleEmployee(id)}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{emp.name || emp.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.department} • {emp.role}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t bg-gray-50 flex justify-between items-center">
          <span className="text-xs text-gray-600">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-7 text-xs"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

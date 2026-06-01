import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NativeSelect } from './ui/native-select';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, Printer, Filter, X } from 'lucide-react';

type SortOption = {
  value: string;
  label: string;
};

type FilterOption = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

type ListControlsProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  sortOptions?: SortOption[];
  onSortChange?: (field: string) => void;
  onToggleSortDir?: () => void;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
  showExport?: boolean;
  showPrint?: boolean;
  className?: string;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
};

export function ListControls({
  searchValue,
  onSearchChange,
  sortField,
  sortDir = 'asc',
  sortOptions,
  onSortChange,
  onToggleSortDir,
  filters,
  filterValues = {},
  onFilterChange,
  onClearFilters,
  onExportCSV,
  onExportPDF,
  onPrint,
  showExport = true,
  showPrint = true,
  className = '',
  placeholder = 'Search...',
  resultCount,
  totalCount,
}: ListControlsProps) {
  const hasActiveFilters = filters && Object.values(filterValues).some(v => v !== 'all' && v !== '');

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Sort Controls */}
      {sortOptions && sortOptions.length > 0 && onSortChange && (
        <NativeSelect 
          value={sortField} 
          onChange={(e) => onSortChange(e.target.value)}
          className="w-36 h-9"
        >
          <option value="">Sort by...</option>
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
      )}

      {onToggleSortDir && (
        <Button variant="outline" size="sm" className="h-9" onClick={onToggleSortDir}>
          {sortDir === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Filters */}
      {filters && filters.map((filter) => (
        <NativeSelect
          key={filter.key}
          value={filterValues[filter.key] || 'all'}
          onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
          className="w-36 h-9"
        >
          <option value="all">All {filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
      ))}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <Button variant="ghost" size="sm" className="h-9" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      {/* Export/Print Actions */}
      <div className="flex gap-1 ml-auto">
        {typeof resultCount === 'number' && typeof totalCount === 'number' && (
          <div className="hidden sm:flex items-center px-2 text-xs text-muted-foreground">
            {resultCount} of {totalCount}
          </div>
        )}
        {showExport && onExportCSV && (
          <Button variant="outline" size="sm" className="h-9" onClick={onExportCSV}>
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            CSV
          </Button>
        )}
        {showExport && onExportPDF && (
          <Button variant="outline" size="sm" className="h-9" onClick={onExportPDF}>
            <Printer className="w-4 h-4 mr-1" />
            PDF
          </Button>
        )}
        {showPrint && onPrint && (
          <Button variant="outline" size="sm" className="h-9" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
        )}
      </div>
    </div>
  );
}

// Export utilities for CSV/PDF generation
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] ?? '';
        const stringValue = String(value);
        // Escape values containing commas or quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportToPDF(title: string, data: any[], fields: string[], companyName: string) {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const headers = fields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join('</th><th>');
  const rows = data.map(item => 
    `<tr>${fields.map(f => `<td>${item[f] ?? ''}</td>`).join('')}</tr>`
  ).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          <div>${companyName}</div>
          <div>Generated: ${new Date().toLocaleString()}</div>
          <div>Total Records: ${data.length}</div>
        </div>
        <table>
          <thead><tr><th>${headers}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <script>
          window.onload = () => {
            setTimeout(() => window.print(), 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

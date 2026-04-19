import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { PaginationControls, usePagination } from './PaginationControls';
import { useRealtimeRefresh } from '../lib/use-realtime';
import { Badge } from './ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  LogIn, 
  LogOut, 
  Shield,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { useBranding } from '../lib/branding-context';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT' | 'ACCESS';
  resourceType: string;
  resourceId: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

const ACTION_ICONS: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  READ: Eye,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  ACCESS: Shield,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  READ: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  ACCESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function AuditLogsModule() {
  const { user, accessToken } = useAuth();
  const { branding } = useBranding();
  const role = user?.role;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // List controls state
  const [searchValue, setSearchValue] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    action: 'all',
    resourceType: 'all',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api('/audit-logs', { token: accessToken });
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Real-time updates
  useRealtimeRefresh({
    channelName: `audit-logs-${user?.id ?? 'anon'}`,
    onRefresh: fetchLogs,
    enabled: true,
  });

  // Filter and sort
  const filteredLogs = logs.filter((log) => {
    // Search filter
    if (searchValue) {
      const search = searchValue.toLowerCase();
      if (
        !log.userName?.toLowerCase().includes(search) &&
        !log.action?.toLowerCase().includes(search) &&
        !log.resourceType?.toLowerCase().includes(search) &&
        !log.resourceId?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Action filter
    if (filterValues.action !== 'all' && log.action !== filterValues.action) {
      return false;
    }

    // Resource type filter
    if (filterValues.resourceType !== 'all' && log.resourceType !== filterValues.resourceType) {
      return false;
    }

    return true;
  });

  // Sort
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aVal: any = a[sortField as keyof AuditLog];
    let bVal: any = b[sortField as keyof AuditLog];

    if (sortField === 'timestamp') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }

    if (sortDir === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination
  const pagination = usePagination(sortedLogs.length, 50);
  const paginatedLogs = sortedLogs.slice(pagination.startIndex, pagination.endIndex);

  // Get unique resource types for filter
  const resourceTypes = Array.from(new Set(logs.map((l) => l.resourceType))).sort();

  const handleExportCSV = () => {
    const exportData = sortedLogs.map((log) => ({
      timestamp: new Date(log.timestamp).toLocaleString(),
      user: log.userName,
      action: log.action,
      resource: log.resourceType,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
    }));
    exportToCSV(exportData, 'audit-logs');
    toast.success('Exported to CSV');
  };

  const handleExportPDF = () => {
    const exportData = sortedLogs.map((log) => ({
      timestamp: new Date(log.timestamp).toLocaleString(),
      user: log.userName,
      action: log.action,
      resource: log.resourceType,
      resourceId: log.resourceId,
    }));
    exportToPDF('Audit Logs', exportData, ['timestamp', 'user', 'action', 'resource', 'resourceId'], branding.companyName);
    toast.success('Exported to PDF');
  };

  if (!user || !role || !['superadmin', 'admin', 'manager'].includes(role)) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                System activity and security audit trail
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListControls
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            sortField={sortField}
            sortDir={sortDir}
            sortOptions={[
              { value: 'timestamp', label: 'Time' },
              { value: 'userName', label: 'User' },
              { value: 'action', label: 'Action' },
              { value: 'resourceType', label: 'Resource' },
            ]}
            onSortChange={setSortField}
            onToggleSortDir={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            filters={[
              {
                key: 'action',
                label: 'Action',
                options: [
                  { value: 'CREATE', label: 'Create' },
                  { value: 'UPDATE', label: 'Update' },
                  { value: 'DELETE', label: 'Delete' },
                  { value: 'READ', label: 'Read' },
                  { value: 'LOGIN', label: 'Login' },
                  { value: 'LOGOUT', label: 'Logout' },
                  { value: 'ACCESS', label: 'Access' },
                ],
              },
              {
                key: 'resourceType',
                label: 'Resource',
                options: resourceTypes.map((type) => ({
                  value: type,
                  label: type.charAt(0).toUpperCase() + type.slice(1),
                })),
              },
            ]}
            filterValues={filterValues}
            onFilterChange={(key, value) =>
              setFilterValues((prev) => ({ ...prev, [key]: value }))
            }
            onClearFilters={() => setFilterValues({ action: 'all', resourceType: 'all' })}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            placeholder="Search by user, action, resource..."
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => {
                    const ActionIcon = ACTION_ICONS[log.action] || Shield;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell>
                          <Badge className={ACTION_COLORS[log.action] || ''}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{log.resourceType}</TableCell>
                        <TableCell className="font-mono text-xs">{log.resourceId}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.details && Object.keys(log.details).length > 0
                            ? JSON.stringify(log.details)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={sortedLogs.length}
            onPageChange={pagination.handlePageChange}
            onPageSizeChange={pagination.handlePageSizeChange}
            pageSizeOptions={[25, 50, 100, 250, 500]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
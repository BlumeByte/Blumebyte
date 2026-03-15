# Advanced Features Guide

This document describes the four major production-grade enhancements added to the Blumebyte HR Management System.

## Table of Contents

1. [Pagination for Large Datasets](#pagination-for-large-datasets)
2. [Real-time Updates](#real-time-updates)
3. [Audit Logging](#audit-logging)
4. [Advanced Reporting](#advanced-reporting)

---

## 1. Pagination for Large Datasets

### Overview
The pagination system efficiently handles large datasets (1000+ records) by dividing data into manageable pages, improving performance and user experience.

### Components

#### `PaginationControls`
Location: `/components/PaginationControls.tsx`

A reusable pagination component with:
- Page navigation (first, previous, next, last)
- Page size selection (10, 25, 50, 100, 250, 500)
- Smart page number display with ellipsis
- Item count display

**Props:**
```typescript
{
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}
```

#### `usePagination` Hook
A custom hook for managing pagination state:

```typescript
const pagination = usePagination(totalItems, initialPageSize);

// Returns:
{
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;  // For array slicing
  endIndex: number;    // For array slicing
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
}
```

### Usage Example

```tsx
import { PaginationControls, usePagination } from './components/PaginationControls';

function MyList() {
  const [data, setData] = useState<Item[]>([]);
  
  // Initialize pagination
  const pagination = usePagination(data.length, 25);
  
  // Get current page of data
  const paginatedData = data.slice(
    pagination.startIndex, 
    pagination.endIndex
  );
  
  return (
    <div>
      {/* Render your list */}
      {paginatedData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      
      {/* Pagination controls */}
      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={data.length}
        onPageChange={pagination.handlePageChange}
        onPageSizeChange={pagination.handlePageSizeChange}
      />
    </div>
  );
}
```

### Features
- Automatically resets to page 1 when page size changes
- Prevents navigating beyond available pages
- Responsive design that works on mobile and desktop
- Accessible with proper ARIA labels

---

## 2. Real-time Updates

### Overview
Real-time updates use Supabase Realtime to automatically refresh data when changes occur, providing a collaborative experience across multiple users.

### Components

#### `useRealtime` Hook
Location: `/lib/use-realtime.tsx`

Subscribe to real-time events for a specific channel:

```typescript
const { events, latestEvent, isConnected, error, broadcast } = useRealtime({
  channelName: 'employees',
  eventType: 'UPDATE',
  onEvent: (event) => {
    console.log('Event received:', event);
    // Refresh your data
  },
  filter: (event) => event.data.company === myCompany,
  enabled: true,
});
```

**Event Types:**
- `INSERT` - New record created
- `UPDATE` - Record updated
- `DELETE` - Record deleted
- `READ` - Record accessed
- `LOGIN` / `LOGOUT` - User authentication
- `ACCESS` - Permission-based access
- `BROADCAST` - Custom events
- `*` - All events

#### `useRealtimeBroadcast` Hook
Use in components that modify data to notify other clients:

```typescript
const { broadcastChange } = useRealtimeBroadcast('employees');

const handleUpdate = async (employeeId, data) => {
  await updateEmployee(employeeId, data);
  
  // Notify other clients
  broadcastChange('UPDATE', employeeId, data);
};
```

#### `useRealtimeRefresh` Hook
Automatically refresh data when events occur (with debouncing):

```typescript
useRealtimeRefresh({
  channelName: 'employees',
  onRefresh: fetchEmployees,
  debounceMs: 1000,  // Wait 1 second before refreshing
  enabled: true,
});
```

### Usage Example

```tsx
import { useRealtimeRefresh } from '../lib/use-realtime';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  
  const fetchEmployees = async () => {
    const data = await fetchAPI('/employees');
    setEmployees(data);
  };
  
  // Initial load
  useEffect(() => {
    fetchEmployees();
  }, []);
  
  // Auto-refresh on changes
  useRealtimeRefresh({
    channelName: 'employees',
    onRefresh: fetchEmployees,
    debounceMs: 1000,
  });
  
  return (
    <div>
      {employees.map(emp => (
        <div key={emp.id}>{emp.name}</div>
      ))}
    </div>
  );
}
```

### Best Practices
- Use debouncing to avoid excessive refreshes
- Only enable realtime when component is mounted
- Use specific channel names to avoid unnecessary updates
- Clean up subscriptions when component unmounts (handled automatically)

---

## 3. Audit Logging

### Overview
Comprehensive audit logging tracks all system activities for security, compliance, and troubleshooting.

### Backend Implementation

Location: `/supabase/functions/server/index.tsx`

#### `logAudit` Function
```typescript
await logAudit({
  userId: user.id,
  userName: user.name,
  action: 'UPDATE',
  resourceType: 'employee',
  resourceId: employeeId,
  details: { field: 'salary', oldValue: 50000, newValue: 55000 },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

#### API Endpoints

**Get All Audit Logs** (Admin+)
```
GET /make-server-a35148f0/audit-logs
```
Returns all audit logs (filtered by company for non-superadmin)

**Get User's Audit Logs**
```
GET /make-server-a35148f0/audit-logs/user/:userId
```
Returns logs for a specific user (users can only see their own)

**Create Audit Log**
```
POST /make-server-a35148f0/audit-logs
Body: {
  userName: "John Doe",
  action: "UPDATE",
  resourceType: "employee",
  resourceId: "emp-123",
  details: { ... }
}
```

### Frontend Component

#### `AuditLogsModule`
Location: `/components/AuditLogsModule.tsx`

Features:
- **Real-time updates** - Auto-refreshes when new logs are created
- **Search & filter** - By user, action, resource type
- **Sorting** - By timestamp, user, action, resource
- **Pagination** - Handles thousands of log entries
- **Export** - CSV and PDF export capabilities
- **Auto-refresh** - Optional 30-second auto-refresh

**Access:**
- SuperAdmin: `/advanced-reports` → Audit Logs tab
- Admin: Admin Dashboard → Audit Logs tab
- Available in both SuperAdminDashboard and AdminDashboard

### Logged Actions

The system logs:
- **CREATE** - New records (employees, departments, etc.)
- **UPDATE** - Record modifications
- **DELETE** - Record deletions
- **LOGIN/LOGOUT** - User authentication
- **ACCESS** - Permission-based access to sensitive data
- **READ** - Viewing sensitive information

### Log Structure

```typescript
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT' | 'ACCESS';
  resourceType: string;  // 'employee', 'payroll', 'asset', etc.
  resourceId: string;
  details: any;          // Custom data about the action
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}
```

### Usage Example

```tsx
// In your component where you modify data
import { fetchAPI } from '../lib/api-client';

const handleUpdateEmployee = async (employeeId, data) => {
  const oldData = await fetchAPI(`/employees/${employeeId}`);
  await fetchAPI(`/employees/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  // Log the audit trail
  await fetchAPI('/audit-logs', {
    method: 'POST',
    body: JSON.stringify({
      userName: currentUser.name,
      action: 'UPDATE',
      resourceType: 'employee',
      resourceId: employeeId,
      details: {
        changes: {
          salary: { old: oldData.salary, new: data.salary },
          department: { old: oldData.department, new: data.department },
        }
      }
    }),
  });
};
```

### Retention
- Last 1000 entries per user are indexed for quick retrieval
- All logs are stored indefinitely in the KV store
- Logs are prefixed with `audit:` for easy filtering

---

## 4. Advanced Reporting

### Overview
Comprehensive analytics and reporting with interactive charts, filters, and export capabilities.

### Component

#### `AdvancedReportsModule`
Location: `/components/AdvancedReportsModule.tsx`

Features:
- **Interactive Charts** - Bar, line, pie, and area charts
- **Date Range Filtering** - Custom date ranges
- **Department/Company Filtering** - Drill down by organization unit
- **Multiple Report Types:**
  - Overview (department distribution, leave status)
  - Attendance Trends (30-day view)
  - Payroll Trends (6-month view)
  - Performance Distribution
- **Export** - CSV export for all report data
- **Real-time Updates** - Auto-refreshes with new data

### Available Reports

#### 1. Overview Report
- Total/Active Employees
- Average Attendance Rate
- Pending Leave Requests
- Total Payroll Amount
- Department Distribution (Pie Chart)
- Leave Status Distribution (Bar Chart)

#### 2. Attendance Report
- 30-day attendance trend
- Present/Late/Absent breakdown
- Stacked area chart visualization
- Daily attendance rates

#### 3. Payroll Report
- 6-month payroll trend
- Monthly totals
- Line chart visualization
- Cost analysis

#### 4. Performance Report
- Performance review ratings distribution
- Rating categories breakdown
- Visual distribution chart

### Usage

**Access:**
- SuperAdmin: Dashboard → Advanced Reports
- Admin: Admin Dashboard → Advanced Reports

**Filters:**
```tsx
// Available filters
- Date Range: Custom start/end dates
- Department: Filter by specific department
- Company: Filter by company (SuperAdmin only)
```

**Export Options:**
```tsx
// Each report section has export buttons
- Export Overview (CSV)
- Export Department Distribution (CSV)
- Export Attendance Trend (CSV)
- Export Payroll Trend (CSV)
```

### Customization

To add a new report:

```tsx
// In AdvancedReportsModule.tsx

// 1. Add a new tab
<TabsTrigger value="custom-report">Custom Report</TabsTrigger>

// 2. Add tab content
<TabsContent value="custom-report">
  <Card>
    <CardHeader>
      <CardTitle>My Custom Report</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={myCustomData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
</TabsContent>
```

### Chart Library

Uses **Recharts** for all visualizations:
- BarChart
- LineChart
- PieChart
- AreaChart
- Responsive containers
- Custom tooltips and legends

---

## Integration Guide

### Combining Features

Here's how to use all features together:

```tsx
import { usePagination, PaginationControls } from './components/PaginationControls';
import { useRealtimeRefresh } from './lib/use-realtime';
import { fetchAPI } from './lib/api-client';

function ComprehensiveList() {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const items = await fetchAPI('/items');
      setData(items);
      
      // Log audit
      await fetchAPI('/audit-logs', {
        method: 'POST',
        body: JSON.stringify({
          action: 'READ',
          resourceType: 'items',
          resourceId: 'list',
          details: { count: items.length }
        }),
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    fetchData();
  }, []);
  
  // Real-time updates
  useRealtimeRefresh({
    channelName: 'items',
    onRefresh: fetchData,
    debounceMs: 1000,
  });
  
  // Filter and sort
  const filteredData = data
    .filter(item => 
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === 'asc' 
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });
  
  // Pagination
  const pagination = usePagination(filteredData.length, 25);
  const paginatedData = filteredData.slice(
    pagination.startIndex,
    pagination.endIndex
  );
  
  return (
    <div className="space-y-4">
      {/* List controls */}
      <ListControls
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        sortField={sortField}
        sortDir={sortDir}
        onSortChange={setSortField}
        onToggleSortDir={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
        onExportCSV={() => exportToCSV(filteredData, 'items')}
      />
      
      {/* Data display */}
      <div>
        {paginatedData.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
      
      {/* Pagination */}
      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={filteredData.length}
        onPageChange={pagination.handlePageChange}
        onPageSizeChange={pagination.handlePageSizeChange}
      />
    </div>
  );
}
```

---

## Performance Considerations

### Pagination
- **Memory**: Only renders visible page items
- **Performance**: O(1) for page navigation
- **Recommended**: Use for lists with 100+ items

### Real-time
- **Debouncing**: Prevents excessive updates (default: 500ms)
- **Cleanup**: Auto-unsubscribes on component unmount
- **Channels**: Use specific channels to reduce noise

### Audit Logging
- **Indexing**: User logs are indexed for fast retrieval
- **Storage**: Logs are stored in KV store (efficient key-value storage)
- **Retention**: Last 1000 per user in quick-access index

### Advanced Reports
- **Caching**: Consider adding React Query for data caching
- **Filtering**: Client-side filtering for best UX
- **Charts**: Recharts is optimized for performance

---

## Security Considerations

### Audit Logging
- Captures IP addresses and user agents for security analysis
- Admin+ required to view system-wide logs
- Company-based filtering ensures data isolation
- Immutable logs (no delete endpoint)

### Real-time
- Broadcast channels use `self: false` to prevent echo
- No sensitive data in broadcast payloads
- Authorization checked on backend for all operations

### Advanced Reports
- Role-based access control (Admin+ only)
- Company filtering for multi-tenant isolation
- No raw data exposure - only aggregated metrics

---

## Troubleshooting

### Pagination Issues
**Problem**: Page resets unexpectedly
**Solution**: Ensure `totalItems` prop is stable and not changing unexpectedly

**Problem**: Wrong items showing after filter
**Solution**: Call `setCurrentPage(1)` when applying new filters

### Real-time Issues
**Problem**: Not receiving updates
**Solution**: Check that channel name matches between broadcaster and subscriber

**Problem**: Too many refreshes
**Solution**: Increase `debounceMs` value in `useRealtimeRefresh`

### Audit Log Issues
**Problem**: Logs not appearing
**Solution**: Verify user has Admin+ role and is in correct company scope

**Problem**: Old logs missing
**Solution**: Check the `audit-index` - only last 1000 per user are indexed

### Report Issues
**Problem**: Charts not rendering
**Solution**: Ensure data is in correct format for chart type (array of objects)

**Problem**: Filters not working
**Solution**: Check that date range is valid and filter values match data fields

---

## Future Enhancements

Potential additions:
- [ ] Export audit logs to external SIEM systems
- [ ] Real-time notifications for specific events
- [ ] Scheduled report generation and email delivery
- [ ] Custom dashboard builder
- [ ] Advanced analytics with ML insights
- [ ] Data retention policies for audit logs
- [ ] Bulk operations with progress tracking
- [ ] Webhooks for external integrations

---

## Related Documentation

- [Production Readiness Report](/PRODUCTION_READINESS_REPORT.md)
- [Testing Guide](/TESTING_GUIDE.md)
- [Company Filtering Implementation](/COMPANY_FILTERING_IMPLEMENTATION.md)

---

**Last Updated**: March 6, 2026
**Version**: 1.0
**Maintained by**: Blumebyte Development Team

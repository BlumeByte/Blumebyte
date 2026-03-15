# Company-Based Filtering & Sort/Filter/Print Implementation Summary

## ✅ Server-Side Changes (Completed)

### 1. Added Company Filtering Helpers

**File**: `/supabase/functions/server/index.tsx`

Two new helper functions added after `resolveCompanyName`:

```typescript
// --- Company-based filtering helper ---
async function applyCompanyFilter(items: any[], userId: string, role: string): Promise<any[]> {
  // Superadmin sees everything
  if (role === "superadmin") return items;
  
  // Get user's assigned companies
  const assignedCompanies = await resolveCompanyScope(userId);
  
  // If no company restrictions, return all
  if (!assignedCompanies || assignedCompanies.length === 0) return items;
  
  // Filter items by company
  return items.filter((item: any) => {
    const itemCompany = item.company || item.companyId || item.companyName;
    if (!itemCompany) return true; // Include items without company assignment
    return assignedCompanies.includes(itemCompany);
  });
}

// --- Filter employees by company scope ---
async function filterEmployeesByCompany(employees: any[], userId: string, role: string): Promise<any[]> {
  // Superadmin sees everyone
  if (role === "superadmin") return employees;
  
  const scope = await resolveCompanyScope(userId);
  
  // If no scope, return all employees
  if (!scope || scope.length === 0) return employees;
  
  // Filter by company
  return employees.filter((e: any) => {
    const empCompany = e.company || e.companyId;
    if (!empCompany) return false; // Exclude employees without company
    return scope.includes(empCompany);
  });
}
```

### 2. Updated Generic CRUD Factory

Modified the List endpoint in `makeCrud` to apply company filtering:

```typescript
app.get(`${PREFIX}/${prefix}`, async (c) => {
  try {
    const { user, role } = await guardFn(c);  // Now captures user and role
    let items = await kv.getByPrefix(`${kvPrefix}`);
    // Apply company filtering for non-superadmin users
    items = await applyCompanyFilter(items, user.id, role);
    return c.json(items || []);
  } catch (e: any) {
    // ... error handling
  }
});
```

### 3. Updated Specific Endpoints

✅ `/users/for-meetings` - Added company filtering
✅ `/meetings` - Added company filtering  
✅ `/job-applications` - Added company filtering
✅ `/announcements` - Added company filtering
✅ `/attendance/all` - Added company filtering via employee filtering
✅ `/leave-requests` - Added company filtering for managers/admins

All CRUD endpoints created via `makeCrud` now automatically have company filtering.

### 4. Endpoints That Already Had Company Filtering

These endpoints already had company-based filtering logic:
- `/users` (admin/manager endpoints)
- `/admin/profile-change-requests`

## ✅ Frontend-Side Changes (Completed)

### 1. Created ListControls Component

**File**: `/components/ListControls.tsx`

Reusable component with:
- Search input
- Sort field selector
- Sort direction toggle (asc/desc)
- Multiple filter dropdowns
- Clear filters button
- Export to CSV button
- Export to PDF button
- Print button

Includes utility functions:
- `exportToCSV(data, filename)` - Generates CSV file
- `exportToPDF(title, data, fields, companyName)` - Generates printable PDF

## 📋 Frontend Integration Tasks Needed

The following components need to be updated to use `ListControls`:

### Priority 1: User/Employee Lists

1. **SuperAdminDashboard** (`/components/SuperAdminDashboard.tsx`)
   - ✅ Employees panel - **COMPLETED** (Updated with full ListControls integration)
   - ⏳ User Management panel (has basic search, could use ListControls for consistency)
   - ⏳ Reports Panel (already has some - lines 1575-1800)
   - ✅ All EntityCrud panels (companies, branches, departments, assets, etc.) - Already integrated

2. **AdminDashboard** (`/components/AdminDashboard.tsx`)
   - ⏳ Employees tab
   - ⏳ Users tab
   - ⏳ Departments tab
   - ✅ All AdminCrudPanel sections - Already integrated
   - ⏳ Leave management
   - ⏳ Assets
   - ⏳ Attendance
   - ⏳ Tasks
   - ⏳ Training
   - ⏳ Feedback

3. **ManagerDashboard** (`/components/ManagerDashboard.tsx`)
   - ✅ Team members view - Completed
   - ✅ Leave requests - Completed
   - ⏳ Attendance
   - ⏳ Tasks
   - ⏳ Performance reviews

### Priority 2: Reports & Analytics

4. **ReportsPanel** (`/components/ReportsPanel.tsx`)
   - Already has some export functionality
   - Needs sort/filter controls integration

### Priority 3: Modules

5. ⏳ **TimeTrackingModule** - Attendance records
6. ⏳ **VacationModule** - Leave requests
7. ⏳ **TasksModule** - Task assignments
8. ⏳ **TrainingModule** - Training programs
9. ⏳ **FeedbackModule** - 360 feedback
10. ⏳ **ReviewsModule** - Performance reviews
11. ⏳ **MeetingsPanel** - Meeting list
12. ✅ **HiringApprovalPanel** - Job applications - Completed (has existing sort/filter, ready for export)
13. ⏳ **OnboardingModule** - Onboarding checklists

## 🎯 Implementation Pattern

For each section, follow this pattern:

### Step 1: Add State

```typescript
const [searchTerm, setSearchTerm] = useState('');
const [sortField, setSortField] = useState('name');
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
const [filterValues, setFilterValues] = useState<Record<string, string>>({
  department: 'all',
  company: 'all',
  status: 'all',
});
```

### Step 2: Define Options

```typescript
const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'department', label: 'Department' },
  { value: 'createdAt', label: 'Date Created' },
];

const filterOptions = [
  {
    key: 'department',
    label: 'Department',
    options: uniqueDepartments.map(d => ({ value: d, label: d })),
  },
  {
    key: 'company',
    label: 'Company',
    options: uniqueCompanies.map(c => ({ value: c, label: c })),
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
];
```

### Step 3: Apply Filtering & Sorting

```typescript
const filteredAndSorted = items
  .filter(item => {
    const matchSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterValues.department === 'all' || item.department === filterValues.department;
    const matchCompany = filterValues.company === 'all' || item.company === filterValues.company;
    const matchStatus = filterValues.status === 'all' || item.status === filterValues.status;
    return matchSearch && matchDept && matchCompany && matchStatus;
  })
  .sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDir === 'asc' ? comparison : -comparison;
  });
```

### Step 4: Add ListControls Component

```typescript
import { ListControls, exportToCSV, exportToPDF } from './ListControls';

// In render:
<ListControls
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  sortField={sortField}
  sortDir={sortDir}
  sortOptions={sortOptions}
  onSortChange={setSortField}
  onToggleSortDir={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
  filters={filterOptions}
  filterValues={filterValues}
  onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
  onClearFilters={() => setFilterValues({ department: 'all', company: 'all', status: 'all' })}
  onExportCSV={() => exportToCSV(
    filteredAndSorted.map(item => ({
      Name: item.name,
      Email: item.email,
      Department: item.department,
      Company: item.company,
      Status: item.status,
    })),
    'employees'
  )}
  onExportPDF={() => exportToPDF(
    'Employees Report',
    filteredAndSorted,
    ['name', 'email', 'department', 'company', 'status'],
    branding.companyName
  )}
  placeholder="Search employees..."
/>
```

## 🔑 Key Points

### Company Filtering Rules

1. **Superadmin**: Sees all data from all companies
2. **Admin/Manager/Employee**: If they have `assignedCompanies` array:
   - See only data where `company`, `companyId`, or `companyName` matches one of their assigned companies
   - Items without company assignment are included (configurable)
3. **Admin/Manager/Employee**: If they have NO `assignedCompanies`:
   - See all data (no company restrictions)

### User Company Assignment

Users get company assignments via:
1. Direct assignment in their employee record: `assignedCompanies: ['companyId1', 'companyId2']`
2. Stored in KV store: `employee:{userId}` → `assignedCompanies`
3. Also synced to Supabase Auth user_metadata

### Data Company Assignment

Entities should have a company reference via one of these fields:
- `company` (company name string)
- `companyId` (company ID string)
- `companyName` (company name string)

## 🚀 Next Steps

1. ✅ Server filtering is complete (all CRUD + key endpoints)
2. ✅ ListControls component is ready
3. 🔄 Integrate ListControls into all dashboard sections (IN PROGRESS)
   - ✅ ManagerDashboard: Team & Leave tabs
   - ✅ HiringApprovalPanel: Job applications
   - ⏳ SuperAdminDashboard: Employees, Users, Reports panels
   - ⏳ AdminDashboard: Various management tabs
   - ⏳ Module-specific panels
4. ⏳ Ensure all entity forms include company field
5. ⏳ Test company filtering with multi-company scenarios
6. ⏳ Add company filter to all module-specific panels

## ✅ Recent Updates (March 6, 2026)

### Server-Side
- Added company filtering to `/announcements` endpoint
- Added company filtering to `/attendance/all` endpoint (via employee filtering)
- Added company filtering to `/leave-requests` endpoint (for managers/admins)
- Added company filtering to `/meetings` endpoint
- Added company filtering to `/job-applications` endpoint

### Frontend-Side  
- Updated `ManagerDashboard`:
  - `TeamTab`: Full ListControls integration with search, sort (name/email/role/dept), filter (role/dept/status), CSV/PDF export
  - `LeaveTab`: Full ListControls integration with search, sort (date/name/type), filter (status/type), CSV/PDF export
- Updated `HiringApprovalPanel`:
  - Added branding context and export utilities (ready for CSV/PDF export buttons if needed)
- Updated `SuperAdminDashboard`:
  - **EmployeesView**: Refactored to use ListControls with search, sort (name/email/role/dept/company/status), filter (role/dept/company/status), CSV/PDF export, and result count display

## 💡 Testing Checklist

- [ ] Create multiple companies
- [ ] Assign admin to specific companies
- [ ] Verify admin sees only their company's data
- [ ] Verify superadmin sees all data
- [ ] Test sort functionality on all lists
- [ ] Test filter combinations
- [ ] Test CSV export with filtered data
- [ ] Test PDF export with filtered data
- [ ] Test print functionality
- [ ] Test cross-company data isolation

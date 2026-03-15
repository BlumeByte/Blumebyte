# Multi-Department Assignment Guide

## Overview
The Blumebyte HR system now supports assigning multiple departments to users (especially Admins, Managers, and HR staff). This allows for more flexible organizational structures where users can oversee or work with multiple departments.

## Features

### 1. Multiple Department Assignment
- **Super Admin** and **Admin** can assign multiple departments to any user
- Users can have a **primary department** (starred) and multiple **additional departments**
- The primary department is used as the default for filtering and reporting

### 2. User Dashboards Updated Based on Departments

#### Manager Dashboard
- Managers now see employees from **all their assigned departments**
- Data filtering includes:
  - Employee lists
  - Leave requests
  - Attendance records
  - Department statistics
  - Reports

#### Reports Panel
- Managers see reports filtered by **all assigned departments**
- Includes:
  - User reports
  - Attendance reports
  - Department reports
  - Leave reports

### 3. How It Works

#### Data Structure
Each user profile now has:
```typescript
{
  department: string,      // Primary department (for backward compatibility)
  departments: string[],   // Array of all assigned departments
  // ... other fields
}
```

#### Department Selection Component
- Visual multi-select interface with badges
- Click a department badge to set it as primary (shows star ★)
- Add/remove departments with intuitive UI
- Warns if no departments are assigned

## Usage Guide

### For Super Admin

1. **Creating a New User**
   - Go to User Management
   - Click "Create User"
   - Fill in basic details (name, email, role)
   - In the "Assigned Departments" section:
     - Select a department from dropdown
     - Click "Add" button
     - Repeat to add more departments
     - Click on any department badge to make it primary (shows ★)
   - Click "Create"

2. **Editing Existing User**
   - Go to User Management
   - Click edit icon (pencil) on any user
   - Update departments as needed
   - The primary department (starred) is used for default filtering
   - Click "Update"

### For Admin

- Similar process to Super Admin
- Can assign departments to employees, managers, and other admins
- Cannot modify Super Admin accounts

### For Managers

- Automatically see data from all assigned departments
- Cannot modify department assignments (view-only)
- Dashboard and reports auto-filter based on assigned departments

## Permission System

### Department Assignment Permissions
- ✅ **Super Admin**: Can assign/modify departments for ANY user
- ✅ **Admin**: Can assign/modify departments for employees, managers, and other admins
- ❌ **Manager**: Cannot modify department assignments (view-only)
- ❌ **Employee**: Cannot modify department assignments

### Data Access Rules

#### Super Admin
- Sees all departments and all employees
- No filtering applied

#### Admin
- Sees all departments within their company
- Can manage all employees in their company

#### Manager
- Sees only data from their **assigned departments**
- Can edit employees who belong to **any** of their assigned departments
- Cannot edit employees outside their assigned departments

#### Employee
- Sees only their own data
- No department-based filtering

## Technical Implementation

### Frontend Components
- **MultiDepartmentSelect**: Reusable component for multi-department selection
- **SuperAdminDashboard**: Updated user management with multi-department support
- **ManagerDashboard**: Filters data by all assigned departments
- **ReportsPanel**: Filters reports by all assigned departments

### Backend (Server-Side)
- User creation endpoint preserves `departments` array
- User update endpoint validates department changes (SuperAdmin only)
- Backward compatibility: Single `department` field maintained for existing functionality

### Data Filtering Logic
```typescript
// Manager sees employees in ANY of their assigned departments
const managerDepts = profile.departments || [profile.department];
const employees = allUsers.filter(user => {
  const userDepts = user.departments || [user.department];
  return managerDepts.some(dept => userDepts.includes(dept));
});
```

## Migration & Backward Compatibility

### Existing Users
- Users with only a single `department` field are automatically converted:
  - `department: "Engineering"` → `departments: ["Engineering"]`
- No data migration required - handled automatically at runtime

### Legacy Code Support
- The `department` field is still maintained as the primary department
- All existing queries using single department still work
- New queries can leverage the `departments` array

## Best Practices

### 1. Department Assignment Strategy
- Assign multiple departments to managers who oversee cross-functional teams
- Keep employee assignments simple (usually one department)
- Use primary department for official reporting

### 2. Naming Consistency
- Use consistent department names across the organization
- Avoid creating duplicate departments with slight variations
- Super Admin should maintain a clean department list

### 3. Access Control
- Review manager department assignments regularly
- Ensure managers only have access to relevant departments
- Use primary department for organizational hierarchy

## Troubleshooting

### Issue: Manager Not Seeing Expected Employees
**Solution**: 
- Verify manager's assigned departments in User Management
- Check if employees are assigned to those departments
- Ensure at least one department overlaps

### Issue: Department Changes Not Reflected
**Solution**:
- Hard refresh the dashboard (Ctrl+Shift+R)
- Check that changes were saved successfully
- Verify you have SuperAdmin permissions for department changes

### Issue: Employee Appears in Wrong Department
**Solution**:
- Check employee's `departments` array in User Management
- Verify which department is marked as primary (★)
- Update assignments as needed

## Future Enhancements
- Department hierarchy (parent-child relationships)
- Department-specific permissions and workflows
- Advanced reporting by department combinations
- Department transfer history and audit logs

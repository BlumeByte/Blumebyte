# Dropdown Fix Guide - Replace Radix Select with NativeSelect

## Problem
Radix UI Select components cause freezing in Figma's iframe environment due to Portal rendering issues.

## Solution
Replace all Radix Select instances with NativeSelect (native HTML select elements).

## Fixed Components ✅
- `/components/ListControls.tsx` - All search/sort/filter dropdowns
- `/components/PaginationControls.tsx` - Page size selector
- `/components/MeetingsPanel.tsx` - Organizer and Status selects + Date restricted to present/future
- `/components/SuperAdminDashboard.tsx` - Partially fixed (2 instances in Time Tracking)

## Components Still Needing Fixes ⚠️
The following 22 files still use Radix Select and will cause freezing:

1. `/components/MessagesPanel.tsx`
2. `/components/SharedMyProfile.tsx`
3. `/components/SharedSelfServiceHub.tsx`
4. `/components/BackupRestore.tsx`
5. `/components/HiringApprovalPanel.tsx`
6. `/components/AdvancedReportsModule.tsx`
7. `/components/AdminDashboard.tsx`
8. `/components/AnalyticsModule.tsx`
9. `/components/AnnouncementsModule.tsx`
10. `/components/AssetModule.tsx`
11. `/components/CompensationModule.tsx`
12. `/components/DocumentsModule.tsx`
13. `/components/EmployeeDashboard.tsx`
14. `/components/EmployeeProfiles.tsx`
15. `/components/FeedbackModule.tsx`
16. `/components/ManagerDashboard.tsx`
17. `/components/MobilityModule.tsx`
18. `/components/OnboardingModule.tsx`
19. `/components/OrgChartModule.tsx`
20. `/components/ReviewsModule.tsx`
21. `/components/TimeTrackingModule.tsx`
22. `/components/TrainingModule.tsx`
23. `/components/VacationModule.tsx`
24. `/components/SuperAdminDashboard.tsx` - Still has 100+ Select instances remaining

## Replacement Pattern

### Step 1: Replace Import
```tsx
// OLD:
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// NEW:
import { NativeSelect } from './ui/native-select';
```

### Step 2: Replace Select JSX
```tsx
// OLD:
<Select value={value} onValueChange={setValue}>
  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>

// NEW:
<NativeSelect value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="">Select...</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</NativeSelect>
```

### Step 3: Handle Complex onValueChange
```tsx
// OLD:
<Select value={formData.userId} onValueChange={v => {
  const user = users.find(u => u.id === v);
  setFormData({ ...formData, userId: v, userName: user?.name });
}}>

// NEW:
<NativeSelect value={formData.userId} onChange={(e) => {
  const v = e.target.value;
  const user = users.find(u => u.id === v);
  setFormData({ ...formData, userId: v, userName: user?.name });
}}>
```

## Date Inputs - Block Past Dates

For any date inputs that should only allow present/future dates, add `min` attribute:

```tsx
// Meetings, Goals, Tasks, etc.
<Input 
  type="date" 
  min={new Date().toISOString().split('T')[0]}
  value={formData.date} 
  onChange={e => setFormData({ ...formData, date: e.target.value })} 
/>
```

## SuperAdminDashboard Specific Fixes Needed

The file has 100+ Select instances in these sections:
- Line 1360: Attendance Employee Select
- Line 1372: Attendance Status Select  
- Line 1521: Payroll Employee Select
- Line 1537: Payroll Status Select
- Line 1650: Report Type Select
- Line 1776-1787: Employee filters (Department, Company, Role)
- Line 2013: Leave Employee Select
- Line 2021: Leave Type Select
- Line 2043: Leave Status Select
- Line 2198: Checklist Employee Select
- Line 2209: Checklist Category Select
- Line 2224: Checklist Assigned By Select
- Line 2235: Checklist Status Select
- Line 2435: Leave Request Type Select
- Line 2556: Announcement Priority Select
- Line 2877-2894: User Management (Role, Company, Department)
- And many more...

## Priority Fix Order

1. **HIGH**: SuperAdminDashboard (most used interface)
2. **HIGH**: EmployeeDashboard, ManagerDashboard, AdminDashboard
3. **MEDIUM**: Form modules (EmployeeProfiles, AssetModule, CompensationModule)
4. **LOW**: Specialized panels (BackupRestore, AnalyticsModule)

## Testing

After each fix:
1. Open the dialog/form
2. Click the dropdown
3. Verify it opens WITHOUT freezing
4. Verify selection works correctly
5. Check console for absence of Figma prop warnings

## Console Warnings

The enhanced suppressor in `/main.tsx` should block all `_fg*` prop warnings, but the root cause is still the Radix Select components creating invalid DOM props.

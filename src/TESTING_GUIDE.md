# Testing Guide - Blumebyte HR System

## Quick Start Testing

### 1. Initial Setup
```
1. Open the application in browser
2. Check if setup page appears (if no superadmin exists)
3. Create superadmin account if needed
4. Login with superadmin credentials
```

### 2. Core Functionality Tests

#### A. SuperAdmin Tests
```
✓ Dashboard loads with stats and charts
✓ Create a company (Companies tab)
✓ Create a branch (Branches tab)
✓ Create a department (Departments tab)
✓ Create an admin user (User Management tab)
  - Test role assignment
  - Copy temporary password
  - Verify user appears in list
✓ Create an employee (User Management tab)
✓ Assign companies to admin user
✓ Test company filtering:
  - Logout
  - Login as admin
  - Verify admin only sees data from assigned companies
```

#### B. Admin Tests
```
✓ Login as admin
✓ Dashboard loads correctly
✓ Can view employees (limited to assigned companies)
✓ Can create employee
✓ Can approve leave requests
✓ Can manage attendance
✓ Can view reports (filtered by company)
✓ Cannot delete superadmin users
✓ Cannot see data from other companies
```

#### C. Manager Tests
```
✓ Login as manager
✓ Dashboard shows team overview
✓ Can view team members
✓ Can approve leave requests for team
✓ Can view team attendance
✓ Can assign tasks
✓ Can schedule meetings
✓ Export team data (CSV/PDF)
```

#### D. Employee Tests
```
✓ Login as employee
✓ Dashboard shows personal stats
✓ Can clock in/out (if enabled)
✓ Can request leave
✓ Can view own attendance history
✓ Can view own tasks
✓ Can view own training programs
✓ Can apply for internal jobs
✓ Can send messages
✓ Can update profile (triggers approval)
```

### 3. Feature-Specific Tests

#### Leave Management
```
1. Employee requests leave
   ✓ Leave request appears in pending state
   ✓ Manager/Admin receives notification
2. Manager approves leave
   ✓ Status changes to approved
   ✓ Employee receives notification
   ✓ Leave balance updates
3. Try overlapping leave requests
   ✓ System should allow (no conflict detection currently)
```

#### Attendance
```
1. Manual Clock In/Out
   ✓ Employee clicks clock in
   ✓ Record created with timestamp
   ✓ Employee clicks clock out
   ✓ Duration calculated
2. Auto Clock In/Out (if enabled)
   ✓ System auto-clocks in at configured time
   ✓ System auto-clocks out at configured time
3. Admin Management
   ✓ Admin can create attendance record for any user
   ✓ Admin can edit existing record
   ✓ Admin can delete record
```

#### Asset Management
```
1. Create asset
   ✓ Asset appears in list
2. Assign asset to user
   ✓ Assignment recorded
3. Try assigning same asset type to user who already has one
   ✓ Should show error (user already has this asset type)
4. Unassign asset
   ✓ Asset becomes available
```

#### Meetings
```
1. Create meeting
   ✓ Meeting created with participants
2. Check conflict detection
   ✓ Create overlapping meeting for same participant
   ✓ Should show busy time warning
3. View meeting in participant's dashboard
   ✓ Meeting appears for all participants
```

#### Performance Reviews
```
1. Admin creates performance review for employee
   ✓ Review appears in employee's "My Reviews"
2. Employee adds self-assessment
   ✓ Notes saved
3. Admin views and completes review
   ✓ Rating and feedback saved
```

#### Training & Development
```
1. Admin creates training program with custom questions
   ✓ Program created with questions
2. Assign training to employee
   ✓ Appears in employee's "My Training"
3. Employee completes training and answers questions
   ✓ Progress updated
   ✓ Answers saved
4. Admin reviews completion
   ✓ Can see employee answers
```

#### Messaging
```
1. Send message to user
   ✓ Message appears in recipient's inbox
2. Reply to message
   ✓ Thread updated
3. Mark message as read
   ✓ Unread count decreases
```

#### Announcements
```
1. Admin creates announcement
   ✓ All users see announcement
2. Target specific departments (if implemented)
   ✓ Only targeted users see it
```

### 4. Data Export Tests

#### CSV Export
```
1. Go to any list view (employees, leave requests, etc.)
2. Click CSV export button
   ✓ File downloads
   ✓ Contains correct data
   ✓ Includes filtered results only
```

#### PDF Export
```
1. Go to any list view
2. Click PDF export button
   ✓ PDF generates with company branding
   ✓ Contains correct data
   ✓ Formatted properly
```

#### Print
```
1. Go to any list view
2. Click print button
   ✓ Print dialog opens
   ✓ Preview shows formatted data
```

### 5. Company Filtering Tests

#### Multi-Company Setup
```
1. Login as superadmin
2. Create Company A and Company B
3. Create Admin A (assign to Company A)
4. Create Admin B (assign to Company B)
5. Create Employee A (company A)
6. Create Employee B (company B)
```

#### Verify Filtering
```
1. Login as Admin A
   ✓ Can only see employees from Company A
   ✓ Leave requests only from Company A
   ✓ Announcements only for Company A
   ✓ Attendance only for Company A employees
2. Login as Admin B
   ✓ Can only see employees from Company B
   ✓ Cannot see Company A data
```

#### Superadmin Visibility
```
1. Login as superadmin
   ✓ Can see all companies
   ✓ Can see all employees
   ✓ Can see all data across companies
```

### 6. Security Tests

#### Role-Based Access
```
✓ Employee cannot access admin routes (redirected)
✓ Manager cannot access superadmin routes
✓ Admin cannot delete superadmin users
✓ Employee cannot edit other employees' data
```

#### Session Management
```
1. Login
2. Wait for token expiration (~1 hour)
   ✓ Auto-refreshes if within 60 seconds of expiry
3. Close tab, reopen
   ✓ Session persists if valid
4. Manual logout
   ✓ Redirects to login
   ✓ Cannot access protected routes
```

#### Password Security
```
1. Create new user
   ✓ Temporary password generated
2. Login with temp password
   ✓ Forced to change password
3. Reset user password
   ✓ New temp password generated
   ✓ User must change on next login
```

### 7. UI/UX Tests

#### Responsive Design
```
1. Desktop view (1920x1080)
   ✓ All elements visible
   ✓ Sidebar expanded by default
2. Tablet view (768x1024)
   ✓ Layout adapts
   ✓ Sidebar collapsible
3. Mobile view (375x667)
   ✓ Mobile-friendly layout
   ✓ Touch-friendly buttons
```

#### Loading States
```
✓ Spinners show while loading data
✓ Empty states display when no data
✓ Skeletons for loading cards (if implemented)
```

#### Error Handling
```
1. Trigger network error (disconnect internet)
   ✓ Error message displayed
   ✓ User can retry
2. Submit invalid form
   ✓ Validation errors shown
3. Unauthorized access
   ✓ Redirected to login
```

#### Toast Notifications
```
✓ Success messages on save/delete
✓ Error messages on failures
✓ Info messages for important actions
✓ Auto-dismiss after delay
```

### 8. Search, Sort, Filter Tests (ListControls)

#### Manager Dashboard - Team Tab
```
1. Search for employee name
   ✓ Results filter in real-time
2. Sort by name
   ✓ List reorders alphabetically
3. Sort by email (descending)
   ✓ List reorders reverse alphabetically
4. Filter by role
   ✓ Only shows selected role
5. Filter by department
   ✓ Only shows selected department
6. Clear filters
   ✓ All employees shown again
7. Export filtered results
   ✓ CSV contains only filtered items
```

#### Manager Dashboard - Leave Tab
```
1. Search for employee name
   ✓ Leave requests filter
2. Sort by date
   ✓ Orders by start date
3. Filter by status
   ✓ Shows only pending/approved/rejected
4. Filter by leave type
   ✓ Shows only selected type
5. Export
   ✓ CSV/PDF contains filtered leaves
```

#### SuperAdmin Dashboard - Employees Panel
```
1. Search employees
   ✓ Filters by name, email, department, company
2. Sort by multiple fields
   ✓ Name, email, role, department, company, status
3. Filter by role
   ✓ Shows only selected role
4. Filter by department
   ✓ Shows only selected department
5. Filter by company
   ✓ Shows only selected company
6. Filter by status
   ✓ Shows active/inactive
7. Export
   ✓ CSV/PDF with all filtered data
8. Result count
   ✓ Shows "X of Y" employees
```

### 9. Edge Cases

#### Empty States
```
✓ No employees exist → "No employees found"
✓ No leave requests → Empty state message
✓ No tasks assigned → Helpful empty state
✓ No meetings scheduled → Prompt to create
```

#### Data Validation
```
✓ Email format validated
✓ Required fields enforced
✓ Date ranges validated
✓ File size limits enforced
```

#### Concurrent Updates
```
1. User A and B edit same record
   ✓ Last save wins (no conflict resolution yet)
```

### 10. Performance Tests

#### Large Datasets
```
1. Create 100+ employees
   ✓ List loads within 2 seconds
   ✓ Search responds instantly
   ✓ Pagination would help (not implemented)
2. 500+ attendance records
   ✓ May be slow - monitor performance
   ✓ Consider pagination if needed
```

#### Concurrent Users
```
1. Multiple users logged in simultaneously
   ✓ Each sees their appropriate data
   ✓ No data leakage between sessions
```

## Automated Testing Checklist

### Critical Paths
- [ ] User can signup/login
- [ ] User can logout
- [ ] Protected routes work
- [ ] Company filtering works
- [ ] CRUD operations work for all entities
- [ ] Search/sort/filter functions correctly
- [ ] Export (CSV/PDF) works
- [ ] File uploads work
- [ ] Notifications system works

### Regression Tests
- [ ] Previous features still work after updates
- [ ] No console errors in browser
- [ ] No TypeScript errors in build
- [ ] All API endpoints return expected data
- [ ] All forms validate correctly

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Pre-Launch Checklist

### Data Integrity
- [ ] Sample data loaded correctly
- [ ] All relationships intact
- [ ] No orphaned records

### Configuration
- [ ] Environment variables set
- [ ] Supabase project configured
- [ ] Edge functions deployed
- [ ] Branding configured (logo, colors)

### Security
- [ ] Service role key not exposed
- [ ] CORS properly configured
- [ ] All endpoints require authentication
- [ ] Role-based access working

### User Experience
- [ ] All forms have labels
- [ ] All buttons have icons/text
- [ ] Loading states everywhere
- [ ] Error messages are helpful
- [ ] Success feedback provided

### Documentation
- [ ] User manual created
- [ ] Admin guide created
- [ ] FAQ prepared
- [ ] Support contact info added

## Known Issues / Limitations

1. **No pagination** - Large lists may be slow
2. **No real-time updates** - Manual refresh needed
3. **No email notifications** - All notifications in-app only
4. **Last-write-wins** - No optimistic locking for concurrent edits
5. **No audit trail** - No history of who changed what when

## Post-Launch Monitoring

### Week 1
- Monitor error logs daily
- Check user feedback
- Watch performance metrics
- Fix critical bugs immediately

### Month 1
- Analyze usage patterns
- Identify slow queries
- Gather feature requests
- Plan optimizations

---

**Happy Testing! 🎉**

If you find any issues not covered in this guide, please document them and report to the development team.

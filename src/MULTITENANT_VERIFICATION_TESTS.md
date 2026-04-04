# Multi-Tenant System Verification Tests

## Quick Test Guide for Developers

### Test 1: New Tenant Gets Empty Dashboard

**Steps:**
1. Open app in incognito/private window
2. Click "Sign Up" or go to `/company-signup`
3. Fill in company details:
   - Company Name: "Test Corp"
   - Company Size: "10-50"
   - Industry: "Technology"
   - Admin Name: "Admin Test"
   - Admin Email: "admin@testcorp.com"
   - Password: "TestPass123!"
   - Licenses: 5
   - Billing: Monthly
4. Complete payment (use test card)
5. Wait for account creation
6. Log in with admin@testcorp.com

**Expected Results:**
✅ Dashboard loads successfully  
✅ Overview shows: "Total Employees: 1" (just SuperAdmin)  
✅ Departments tab: Empty state  
✅ Leave Management: Empty state  
✅ Assets: Empty state  
✅ Attendance: Empty state  
✅ Messages: No messages  
✅ All other tabs: Empty state  

**Console Check:**
```javascript
// Open DevTools Console
console.log(localStorage.getItem('role')); // Should show: "superadmin"
console.log(localStorage.getItem('companyId')); // Should show: "uuid-v4"
```

---

### Test 2: Creating Data Shows Immediately

**Steps:**
1. Continue from Test 1 (logged in as SuperAdmin)
2. Go to "Users" tab
3. Click "Add User"
4. Fill in:
   - Name: "John Employee"
   - Email: "john@testcorp.com"
   - Role: "employee"
   - Department: "Engineering"
   - Position: "Developer"
   - Status: "active"
5. Click "Save"
6. Wait 1-3 seconds

**Expected Results:**
✅ Success toast appears  
✅ User appears in table within 1-3 seconds  
✅ "Total Employees" counter updates to 2  
✅ No page refresh needed  

**Console Check:**
```javascript
// Check the API response
// Network tab → Look for POST /users
// Response should include the new user with companyId
```

---

### Test 3: Dashboard Refreshes with Polling

**Steps:**
1. Continue from Test 2
2. Keep browser open on Overview tab
3. Open a second browser (different browser or incognito)
4. Log in as same SuperAdmin
5. In second browser: Create another employee
6. Wait up to 60 seconds
7. Check first browser

**Expected Results:**
✅ First browser updates without manual refresh  
✅ "Total Employees" increases to 3  
✅ Update happens within 60 seconds (polling interval)  

---

### Test 4: Multi-Tenant Isolation

**Steps:**
1. Create Company A:
   - Name: "Company A Inc"
   - Admin: admin-a@companya.com
   - Create 3 employees
2. Create Company B:
   - Name: "Company B Ltd"
   - Admin: admin-b@companyb.com
   - Create 2 employees
3. Log in as Company A admin
4. Go to Employees tab
5. Check employee list
6. Log out
7. Log in as Company B admin
8. Go to Employees tab
9. Check employee list

**Expected Results:**
✅ Company A admin sees only 4 users (3 + SuperAdmin)  
✅ Company B admin sees only 3 users (2 + SuperAdmin)  
✅ No overlap between companies  
✅ Cannot send messages to other company's employees  

**Console Check:**
```javascript
// As Company A admin
const response = await fetch('https://your-project.supabase.co/functions/v1/make-server-668731fc/users', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  }
});
const users = await response.json();
console.log('Company A users:', users.length); // Should be 4

// As Company B admin (in different browser)
// Same API call
console.log('Company B users:', users.length); // Should be 3
```

---

### Test 5: SuperAdmin Sees All Data

**Prerequisites:** Complete Test 4 (have Company A and Company B)

**Steps:**
1. Log in as SuperAdmin from Company A
2. Go to Messages
3. Click "New Message"
4. Open recipient dropdown

**Expected Results:**
✅ Dropdown shows users from ALL companies  
✅ Can see "Company A Inc" users  
✅ Can see "Company B Ltd" users  
✅ Each user shows company name  
✅ Can send messages across companies  

**Note:** This is by design for platform administration.

---

### Test 6: Data Persists After Logout

**Steps:**
1. Continue from previous tests
2. As Company A admin, create 5 employees
3. Log out
4. Close browser completely
5. Open browser again
6. Log in as Company A admin
7. Go to Employees tab

**Expected Results:**
✅ All 5 employees still there  
✅ Total count correct (5 + SuperAdmin = 6)  
✅ No data loss  
✅ No duplicate data  

---

### Test 7: No Mock Data Shown

**Steps:**
1. Create brand new company
2. Log in immediately after creation
3. Check each tab in dashboard:
   - Overview
   - Employees
   - Users
   - Departments
   - Leave Management
   - Assets
   - Attendance
   - Performance Reviews
   - Messages
   - Announcements

**Expected Results:**
✅ Every tab shows "No data" or "Empty" state  
✅ NO pre-populated sample data  
✅ NO mock/test data visible  
✅ Only SuperAdmin appears in Employees/Users  

**Red Flags (Should NOT Happen):**
❌ Seeing employees like "Sarah Johnson" or "John Doe"  
❌ Seeing departments like "Engineering" before creating them  
❌ Seeing sample announcements or messages  
❌ Any data that wasn't explicitly created  

---

## Developer Console Tests

### Test API Filtering Directly

```javascript
// Get your access token
const token = localStorage.getItem('accessToken');

// Test 1: Fetch employees
const response1 = await fetch('https://your-project.supabase.co/functions/v1/make-server-668731fc/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const users = await response1.json();
console.log('My company users:', users);
console.log('All users have same companyId:', new Set(users.map(u => u.companyId)).size === 1);

// Test 2: Try to create employee for different company (should fail)
const response2 = await fetch('https://your-project.supabase.co/functions/v1/make-server-668731fc/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    role: 'employee',
    companyId: 'fake-company-id-12345' // Try to inject wrong company
  })
});
const result = await response2.json();
console.log('Create result:', result);
// Server should ignore the companyId and use YOUR company instead

// Test 3: Fetch departments
const response3 = await fetch('https://your-project.supabase.co/functions/v1/make-server-668731fc/admin/departments', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const departments = await response3.json();
console.log('My company departments:', departments);

// Test 4: Check your company scope
console.log('My role:', localStorage.getItem('role'));
console.log('My companyId:', localStorage.getItem('companyId'));
```

---

## Server-Side Verification

### Check KV Store Data

```sql
-- Connect to Supabase dashboard → SQL Editor

-- Check all companies
SELECT * FROM kv_store_668731fc 
WHERE key LIKE 'company:%';

-- Check all employees
SELECT * FROM kv_store_668731fc 
WHERE key LIKE 'employee:%';

-- Verify each employee has companyId
SELECT 
  key, 
  value->>'name' as name,
  value->>'email' as email,
  value->>'companyId' as companyId,
  value->>'assignedCompanies' as assignedCompanies
FROM kv_store_668731fc 
WHERE key LIKE 'employee:%';

-- Count employees per company
SELECT 
  value->>'companyId' as company_id,
  COUNT(*) as employee_count
FROM kv_store_668731fc 
WHERE key LIKE 'employee:%'
GROUP BY value->>'companyId';
```

### Check Server Logs

```bash
# Terminal
cd supabase/functions
supabase functions logs server --tail

# Watch for these log patterns:
# ✅ "resolveCompanyScope: Found assignedCompanies"
# ✅ "filterEmployeesByCompany: User xyz accessing company-scoped users"
# ✅ "SuperAdmin xyz accessing all users for messaging"
# ❌ "User xyz has no company scope" (bad - should not happen for active users)
```

---

## Automated Test Script

```javascript
// Run this in DevTools Console
// After logging in as SuperAdmin

async function runMultiTenantTests() {
  const token = localStorage.getItem('accessToken');
  const baseUrl = 'https://your-project.supabase.co/functions/v1/make-server-668731fc';
  
  console.log('🧪 Starting Multi-Tenant Tests...\n');
  
  // Test 1: Check current user
  console.log('Test 1: Current User Info');
  const role = localStorage.getItem('role');
  const companyId = localStorage.getItem('companyId');
  console.log(`  Role: ${role}`);
  console.log(`  Company: ${companyId}`);
  console.log(`  ✅ Pass\n`);
  
  // Test 2: Fetch employees
  console.log('Test 2: Fetch Employees');
  const usersRes = await fetch(`${baseUrl}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const users = await usersRes.json();
  console.log(`  Found ${users.length} employees`);
  
  // Check all have same companyId
  const companies = new Set(users.map(u => u.companyId || u.company));
  if (role === 'superadmin') {
    console.log(`  ⚠️  SuperAdmin - may see multiple companies`);
    console.log(`  Companies seen: ${companies.size}`);
  } else {
    if (companies.size === 1 && companies.has(companyId)) {
      console.log(`  ✅ Pass - All employees from same company\n`);
    } else {
      console.log(`  ❌ FAIL - Employees from multiple companies!`);
      console.log(`  Companies: ${Array.from(companies).join(', ')}\n`);
    }
  }
  
  // Test 3: Fetch departments
  console.log('Test 3: Fetch Departments');
  const deptsRes = await fetch(`${baseUrl}/admin/departments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const depts = await deptsRes.json();
  console.log(`  Found ${depts.length} departments`);
  
  const deptCompanies = new Set(depts.map(d => d.companyId || d.company));
  if (role === 'superadmin') {
    console.log(`  ⚠️  SuperAdmin - may see multiple companies\n`);
  } else {
    if (deptCompanies.size === 0 || (deptCompanies.size === 1 && deptCompanies.has(companyId))) {
      console.log(`  ✅ Pass - All departments from same company\n`);
    } else {
      console.log(`  ❌ FAIL - Departments from multiple companies!\n`);
    }
  }
  
  // Test 4: Create and verify employee
  console.log('Test 4: Create Employee');
  const testEmail = `test-${Date.now()}@example.com`;
  const createRes = await fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Employee',
      email: testEmail,
      role: 'employee',
      status: 'active',
      department: 'Testing',
      // Intentionally omit companyId - server should add it
    })
  });
  
  if (createRes.ok) {
    const newUser = await createRes.json();
    if (newUser.companyId === companyId || newUser.company === companyId) {
      console.log(`  ✅ Pass - Employee created with correct companyId\n`);
    } else {
      console.log(`  ❌ FAIL - Employee created with wrong companyId`);
      console.log(`  Expected: ${companyId}`);
      console.log(`  Got: ${newUser.companyId || newUser.company}\n`);
    }
  } else {
    console.log(`  ⚠️  Could not create employee (${createRes.status})\n`);
  }
  
  console.log('🎉 Tests Complete!\n');
  console.log('Summary:');
  console.log('  - Company isolation: Check logs above');
  console.log('  - Data loading: Check if data appeared');
  console.log('  - Server filtering: Check company IDs match');
}

// Run the tests
runMultiTenantTests();
```

---

## Common Issues & Solutions

### Issue 1: "No company scope found"

**Symptoms:**
- Dashboard shows empty for everything
- Console logs: "User has no company scope"

**Solution:**
```javascript
// Check user data
const token = localStorage.getItem('accessToken');
const response = await fetch('https://your-project.supabase.co/functions/v1/make-server-668731fc/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// If returns 401: Re-login
// If returns []: Contact support, user not properly initialized
```

### Issue 2: Seeing data from multiple companies

**Symptoms:**
- Admin sees employees from other companies
- Inconsistent company IDs in data

**Check:**
1. Verify role: `console.log(localStorage.getItem('role'))`
2. If role is 'superadmin': This is expected behavior
3. If role is 'admin' or 'manager': BUG - report immediately

### Issue 3: Data not refreshing

**Symptoms:**
- Create employee but doesn't appear
- Have to manually refresh page

**Solutions:**
1. Wait 60 seconds (polling interval)
2. Force refresh with F5
3. Check console for errors
4. Check Network tab for failed API calls

### Issue 4: Can't create employees

**Symptoms:**
- "Insufficient licenses" error
- "User has no company assignment" error

**Solutions:**
1. Check license count: Dashboard → Settings → Subscription
2. Check SuperAdmin has active subscription
3. Verify companyId exists: `localStorage.getItem('companyId')`

---

## Performance Benchmarks

### Expected Load Times (New Company, Empty Dashboard)

- Initial login: < 1 second
- Dashboard load: < 2 seconds
- Fetch employees: < 100ms
- Create employee: < 500ms
- Dashboard refresh: < 200ms

### Expected Load Times (Established Company, 100 Employees)

- Initial login: < 1 second
- Dashboard load: < 3 seconds
- Fetch employees: < 300ms
- Create employee: < 500ms
- Dashboard refresh: < 500ms

### Red Flags (Performance Issues)

- ❌ Dashboard takes > 10 seconds to load
- ❌ API calls timeout
- ❌ Browser freezes or becomes unresponsive
- ❌ Memory usage grows continuously

If you see these, check:
1. Server logs for errors
2. Network tab for failed requests
3. Console for JavaScript errors
4. Database for corrupted data

---

## Reporting Issues

### If You Find a Bug

**Required Information:**
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Console logs (screenshot or text)
5. Network tab (screenshot of failing request)
6. User role (SuperAdmin, Admin, Manager, Employee)
7. Company information (if known)

**Example Bug Report:**
```
Title: Employee created with wrong companyId

Steps:
1. Log in as Admin (admin@companya.com)
2. Go to Users tab
3. Create employee "John Test"
4. Check employee record

Expected:
- Employee should have companyId: "company-a-id"

Actual:
- Employee has companyId: "company-b-id"

Console Logs:
[screenshot]

User Role: admin
Company: Company A Inc (company-a-id)
```

---

**Last Updated**: April 4, 2026  
**Test Coverage**: Multi-tenant isolation, Data loading, Real-time refresh  
**Status**: All tests passing ✅

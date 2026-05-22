# Multi-Tenant Isolation Testing Guide

## Purpose
This document provides step-by-step instructions to test and verify that the multi-tenant isolation fixes are working correctly.

## Test Scenario: Two Independent Companies

### Setup
1. **Company A**: "Tech Solutions Inc."
   - SuperAdmin: alice@techsolutions.com
   - Employees: Bob, Charlie
   
2. **Company B**: "Digital Innovations LLC"
   - SuperAdmin: dave@digitalinnovations.com
   - Employees: Eve, Frank

---

## Test 1: Company Registration and Isolation

### Steps:
1. **Register Company A**
   - Go to `/company-signup`
   - Fill in company details for "Tech Solutions Inc."
   - SuperAdmin: alice@techsolutions.com
   - Purchase 5 licenses and complete payment
   - Note the payment reference
   - Wait for account creation confirmation
   - Login as alice@techsolutions.com

2. **Register Company B**
   - Open a new incognito/private browser window
   - Go to `/company-signup`
   - Fill in company details for "Digital Innovations LLC"
   - SuperAdmin: dave@digitalinnovations.com
   - Purchase 5 licenses and complete payment
   - Wait for account creation confirmation
   - Login as dave@digitalinnovations.com

### Expected Results:
✅ **PASS Criteria:**
- Company A and Company B are created with different `companyId`s
- Alice sees ONLY "Tech Solutions Inc." in her dashboard
- Dave sees ONLY "Digital Innovations LLC" in his dashboard
- Neither can see the other's company

❌ **FAIL Criteria:**
- Alice or Dave sees both companies
- Alice sees Dave's company data or vice versa
- Both are assigned to the same companyId

---

## Test 2: Employee Listing Isolation

### Steps:
1. **As Alice (Company A SuperAdmin):**
   - Navigate to `/superadmin/employees` or employee management page
   - Check the employee list

2. **As Dave (Company B SuperAdmin):**
   - Navigate to `/superadmin/employees` or employee management page
   - Check the employee list

### Expected Results:
✅ **PASS Criteria:**
- Alice sees ONLY: Alice (herself)
- Dave sees ONLY: Dave (himself)
- No cross-company employee visibility

❌ **FAIL Criteria:**
- Alice sees Dave in her employee list
- Dave sees Alice in his employee list
- Employee lists are mixed

---

## Test 3: Create Employees and Verify Isolation

### Steps:
1. **As Alice (Company A SuperAdmin):**
   - Create employee: bob@techsolutions.com (name: Bob)
   - Create employee: charlie@techsolutions.com (name: Charlie)
   - Refresh employee list

2. **As Dave (Company B SuperAdmin):**
   - Create employee: eve@digitalinnovations.com (name: Eve)
   - Create employee: frank@digitalinnovations.com (name: Frank)
   - Refresh employee list

### Expected Results:
✅ **PASS Criteria:**
- Alice sees: Alice, Bob, Charlie (3 employees total)
- Dave sees: Dave, Eve, Frank (3 employees total)
- No cross-company visibility

❌ **FAIL Criteria:**
- Alice sees Eve or Frank
- Dave sees Bob or Charlie
- Employee counts are wrong
- Employees from both companies are mixed

---

## Test 4: Department Isolation

### Steps:
1. **As Alice (Company A):**
   - Create departments: "Engineering", "Sales"
   - Navigate to departments page

2. **As Dave (Company B):**
   - Create departments: "Marketing", "Operations"
   - Navigate to departments page

### Expected Results:
✅ **PASS Criteria:**
- Alice sees ONLY: Engineering, Sales
- Dave sees ONLY: Marketing, Operations

❌ **FAIL Criteria:**
- Alice sees Marketing or Operations
- Dave sees Engineering or Sales

---

## Test 5: Attendance Records Isolation

### Steps:
1. **As Bob (Company A Employee):**
   - Login as bob@techsolutions.com
   - Clock in and clock out
   - Create attendance record

2. **As Eve (Company B Employee):**
   - Login as eve@digitalinnovations.com
   - Clock in and clock out
   - Create attendance record

3. **As Alice (Company A SuperAdmin):**
   - Navigate to Attendance Reports
   - Check attendance records

4. **As Dave (Company B SuperAdmin):**
   - Navigate to Attendance Reports
   - Check attendance records

### Expected Results:
✅ **PASS Criteria:**
- Alice sees attendance for: Alice, Bob, Charlie only
- Dave sees attendance for: Dave, Eve, Frank only

❌ **FAIL Criteria:**
- Alice sees Eve's or Frank's attendance
- Dave sees Bob's or Charlie's attendance

---

## Test 6: Payroll Isolation

### Steps:
1. **As Alice (Company A SuperAdmin):**
   - Create a payroll run for Bob and Charlie
   - Check payroll runs list

2. **As Dave (Company B SuperAdmin):**
   - Create a payroll run for Eve and Frank
   - Check payroll runs list

### Expected Results:
✅ **PASS Criteria:**
- Alice sees ONLY payroll runs for her company
- Dave sees ONLY payroll runs for his company

❌ **FAIL Criteria:**
- Alice sees Dave's payroll runs
- Dave sees Alice's payroll runs

---

## Test 7: Announcements Isolation

### Steps:
1. **As Alice (Company A):**
   - Create announcement: "Company A Meeting Tomorrow"
   - Target: All departments

2. **As Dave (Company B):**
   - Create announcement: "Company B Holiday Notice"
   - Target: All departments

3. **As Bob (Company A Employee):**
   - Check announcements

4. **As Eve (Company B Employee):**
   - Check announcements

### Expected Results:
✅ **PASS Criteria:**
- Bob sees ONLY: "Company A Meeting Tomorrow"
- Eve sees ONLY: "Company B Holiday Notice"

❌ **FAIL Criteria:**
- Bob sees Company B announcements
- Eve sees Company A announcements

---

## Test 8: Job Postings Isolation

### Steps:
1. **As Alice (Company A):**
   - Create job posting: "Software Engineer at Tech Solutions"
   - Status: Open

2. **As Dave (Company B):**
   - Create job posting: "Marketing Manager at Digital Innovations"
   - Status: Open

3. **As Bob (Company A Employee):**
   - Navigate to open job postings

4. **As Eve (Company B Employee):**
   - Navigate to open job postings

### Expected Results:
✅ **PASS Criteria:**
- Bob sees ONLY: "Software Engineer at Tech Solutions"
- Eve sees ONLY: "Marketing Manager at Digital Innovations"

❌ **FAIL Criteria:**
- Bob sees Company B job postings
- Eve sees Company A job postings

---

## Test 9: Audit Logs Isolation

### Steps:
1. **As Alice (Company A):**
   - Perform various actions (create user, update department, etc.)
   - Navigate to Audit Logs

2. **As Dave (Company B):**
   - Perform various actions
   - Navigate to Audit Logs

### Expected Results:
✅ **PASS Criteria:**
- Alice sees ONLY audit logs for Company A actions
- Dave sees ONLY audit logs for Company B actions

❌ **FAIL Criteria:**
- Alice sees Dave's audit logs
- Dave sees Alice's audit logs

---

## Test 10: Deletion Requests Isolation

### Steps:
1. **As Alice (Company A):**
   - Create a deletion request for Bob
   - Navigate to deletion requests page

2. **As Dave (Company B):**
   - Create a deletion request for Eve
   - Navigate to deletion requests page

### Expected Results:
✅ **PASS Criteria:**
- Alice sees ONLY deletion request for Bob
- Dave sees ONLY deletion request for Eve

❌ **FAIL Criteria:**
- Alice sees Dave's deletion requests
- Dave sees Alice's deletion requests

---

## Test 11: Database Verification (Backend)

### Steps:
1. **Check Company Records:**
   ```bash
   # Query KV store for companies
   GET company:*
   ```
   
   Verify:
   - Two separate company records exist
   - Each has unique `id` and `companyId`

2. **Check Employee Records:**
   ```bash
   # Query KV store for employees
   GET employee:*
   ```
   
   Verify each employee has:
   - `companyId`: Matches their company
   - `assignedCompanies`: Array containing their companyId
   - No cross-contamination

3. **Check User Metadata:**
   - Query Supabase Auth users
   - Verify `user_metadata.companyId` matches employee records

---

## Test 12: Edge Cases

### Test 12a: Login After Registration
**Steps:**
1. Complete Company A registration and payment
2. Immediately logout
3. Login again as alice@techsolutions.com

**Expected:**
- ✅ Lands on Company A dashboard
- ✅ Sees only Company A data

### Test 12b: Multiple Browser Sessions
**Steps:**
1. Login as Alice in Browser 1
2. Login as Dave in Browser 2 (different browser/incognito)
3. Both create employees simultaneously

**Expected:**
- ✅ No data leakage between sessions
- ✅ Each sees only their own company data

### Test 12c: Direct API Calls
**Steps:**
1. Get Alice's access token
2. Make direct API call to `/employees` endpoint
3. Check response

**Expected:**
- ✅ Returns ONLY Company A employees
- ✅ No Company B data in response

---

## Test 13: Performance Test

### Steps:
1. Create 10+ employees in Company A
2. Create 10+ employees in Company B
3. As Alice, navigate to employee list
4. Measure load time and verify data

### Expected Results:
✅ **PASS Criteria:**
- Fast response times (< 2 seconds)
- Only Company A employees returned
- No memory leaks or performance degradation

---

## Automated Test Script

### Quick Verification Script
```javascript
// Run this in browser console after logging in as SuperAdmin

async function testMultiTenantIsolation() {
  const token = localStorage.getItem('access_token');
  const projectId = 'YOUR_PROJECT_ID';
  const publicKey = 'YOUR_PUBLIC_KEY';
  
  const tests = [
    { endpoint: 'employees', name: 'Employees' },
    { endpoint: 'companies', name: 'Companies' },
    { endpoint: 'departments', name: 'Departments' },
    { endpoint: 'users', name: 'Users' },
    { endpoint: 'attendance-records', name: 'Attendance' },
    { endpoint: 'audit-logs', name: 'Audit Logs' }
  ];
  
  console.log('🔍 Testing Multi-Tenant Isolation...\n');
  
  for (const test of tests) {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a35148f0/${test.endpoint}`,
        {
          headers: { 
            'Authorization': `Bearer ${publicKey}`,
            'X-User-Token': token 
          }
        }
      );
      const data = await response.json();
      
      // Check if all items belong to same company
      const companies = new Set();
      data.forEach(item => {
        if (item.companyId) companies.add(item.companyId);
        if (item.company) companies.add(item.company);
      });
      
      if (companies.size <= 1) {
        console.log(`✅ ${test.name}: PASS (Single company data)`);
      } else {
        console.log(`❌ ${test.name}: FAIL (Multiple companies: ${Array.from(companies).join(', ')})`);
      }
    } catch (error) {
      console.log(`⚠️  ${test.name}: ERROR (${error.message})`);
    }
  }
}

testMultiTenantIsolation();
```

---

## Test Checklist Summary

### Before Deployment:
- [ ] All 13 tests pass
- [ ] No cross-tenant data leakage
- [ ] Audit logs show proper isolation
- [ ] Performance is acceptable
- [ ] Edge cases handled correctly

### Post-Deployment Monitoring:
- [ ] Monitor error logs for unauthorized access attempts
- [ ] Check audit logs for suspicious cross-company queries
- [ ] Verify database integrity weekly
- [ ] User feedback indicates no data visibility issues

---

## Reporting Issues

If any test fails:

1. **Document the failure:**
   - Which test failed
   - Expected vs actual results
   - Screenshots if applicable

2. **Check backend logs:**
   - Look for company scope resolution errors
   - Verify `resolveCompanyScope()` returns correct data

3. **Verify database:**
   - Check employee records have correct `companyId`
   - Verify `assignedCompanies` array is set

4. **Contact support with:**
   - Test number that failed
   - User IDs involved
   - Company IDs involved
   - Error logs

---

## Status: ✅ READY FOR TESTING
Date: March 16, 2026

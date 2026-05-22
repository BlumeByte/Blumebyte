# Backup Endpoint Test Suite

## Test Overview
This document provides comprehensive tests for the backup and restore endpoints to verify proper functionality before production launch.

## Prerequisites
- SuperAdmin account with valid access token
- At least one test company with sample data
- API access to the server at `https://{projectId}.supabase.co/functions/v1/make-server-a35148f0`

## Test Cases

### Test 1: Backup Endpoint - Authentication
**Endpoint:** `GET /make-server-a35148f0/backup`

**Test Steps:**
1. Send request WITHOUT authorization header
2. Send request with invalid/expired token
3. Send request with non-SuperAdmin token (Admin/Manager/Employee)
4. Send request with valid SuperAdmin token

**Expected Results:**
- Steps 1-3: Should return 401 Unauthorized or 403 Forbidden
- Step 4: Should return 200 OK with backup data

**cURL Example:**
```bash
# Valid request
curl -X GET \
  https://{PROJECT_ID}.supabase.co/functions/v1/make-server-a35148f0/backup \
  -H "Authorization: Bearer {SUPERADMIN_ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

---

### Test 2: Backup Endpoint - Response Format
**Endpoint:** `GET /make-server-a35148f0/backup`

**Test Steps:**
1. Call backup endpoint with valid SuperAdmin token
2. Verify response structure

**Expected Response Format:**
```json
{
  "version": "1.0",
  "timestamp": "2026-03-17T10:30:00.000Z",
  "data": {
    "employee:": [...],
    "company:": [...],
    "department:": [...],
    "leave:": [...],
    "attendance:": [...],
    "_singleton:company-settings": [{...}],
    "_singleton:auto-clock-settings": [{...}],
    "_singleton:manual-clock-settings": [{...}]
  }
}
```

**Validation Checks:**
- [ ] Response has `version` field (should be "1.0")
- [ ] Response has `timestamp` field (valid ISO date string)
- [ ] Response has `data` object
- [ ] Data contains expected prefixes for your company
- [ ] Data only contains records from SuperAdmin's company (multi-tenant isolation)
- [ ] Singleton settings are present if configured

---

### Test 3: Backup Endpoint - Multi-Tenant Isolation
**Endpoint:** `GET /make-server-a35148f0/backup`

**Test Steps:**
1. Create two test companies (Company A and Company B)
2. Add test employees to both companies
3. Login as SuperAdmin from Company A
4. Call backup endpoint
5. Verify backup only contains Company A data

**Expected Results:**
- Backup should ONLY contain data from Company A
- No data from Company B should be present
- Employee records should only include employees from Company A
- Company settings should only be for Company A

**Validation Query:**
```javascript
// Check all employee records in backup
const employees = backupData.data['employee:'] || [];
const hasOtherCompanyData = employees.some(emp => 
  emp.companyId !== 'COMPANY_A_ID'
);
console.assert(!hasOtherCompanyData, 'Backup contains data from other companies!');
```

---

### Test 4: Backup Endpoint - Data Completeness
**Endpoint:** `GET /make-server-a35148f0/backup`

**Test Steps:**
1. Create test data across multiple modules:
   - 5 employees
   - 3 departments
   - 10 leave requests
   - 20 attendance records
   - 5 announcements
   - 3 payslips
2. Call backup endpoint
3. Verify all data is present

**Expected Results:**
- All prefixes with data should be included
- Record counts should match
- No data loss

---

### Test 5: Restore Endpoint - Authentication
**Endpoint:** `POST /make-server-a35148f0/backup/restore`

**Test Steps:**
1. Send request WITHOUT authorization header
2. Send request with invalid/expired token
3. Send request with non-SuperAdmin token
4. Send request with valid SuperAdmin token

**Expected Results:**
- Steps 1-3: Should return 401 Unauthorized or 403 Forbidden
- Step 4: Should return 200 OK with restore count

**cURL Example:**
```bash
curl -X POST \
  https://{PROJECT_ID}.supabase.co/functions/v1/make-server-a35148f0/backup/restore \
  -H "Authorization: Bearer {SUPERADMIN_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "employee:": [...],
      "department:": [...]
    }
  }'
```

---

### Test 6: Restore Endpoint - Invalid Data Handling
**Endpoint:** `POST /make-server-a35148f0/backup/restore`

**Test Steps:**
1. Send request with empty body
2. Send request with invalid JSON
3. Send request with `data` as string instead of object
4. Send request with `data` as null
5. Send request with valid data structure

**Expected Results:**
- Steps 1-4: Should return 400 Bad Request with error message
- Step 5: Should return 200 OK with success message

---

### Test 7: Restore Endpoint - Data Restoration
**Endpoint:** `POST /make-server-a35148f0/backup/restore`

**Test Steps:**
1. Create initial test data (3 employees)
2. Create backup
3. Modify/delete some data (delete 1 employee, modify 1 employee)
4. Restore from backup
5. Verify data is restored to original state

**Expected Results:**
- Deleted employee should be restored
- Modified employee should revert to backup state
- restoredCount should match number of records in backup

---

### Test 8: Restore Endpoint - Multi-Tenant Safety
**Endpoint:** `POST /make-server-a35148f0/backup/restore`

**Test Steps:**
1. Login as SuperAdmin from Company A
2. Create backup of Company A data
3. Login as SuperAdmin from Company B
4. Attempt to restore Company A backup

**Expected Results:**
- Restore should FAIL or only restore data to Company B's scope
- Company A data should NOT overwrite Company B data
- No cross-company data leakage

---

### Test 9: Backup-Restore Round Trip
**Full Workflow Test**

**Test Steps:**
1. Create comprehensive test data:
   - 10 employees across 3 departments
   - 50 leave requests
   - 100 attendance records
   - 10 announcements
   - Company settings configured
   - Auto-clock settings enabled
2. Call GET /backup endpoint
3. Store backup JSON locally
4. Clear some data (delete 5 employees, 20 leave requests)
5. Call POST /backup/restore with saved backup
6. Verify all data is restored correctly
7. Verify counts match original state

**Expected Results:**
- Complete round-trip success
- All deleted data restored
- No data corruption
- Settings properly restored

---

### Test 10: Performance Test
**Endpoint:** Both backup and restore

**Test Steps:**
1. Create large dataset:
   - 500 employees
   - 1000 leave requests
   - 5000 attendance records
2. Measure backup endpoint response time
3. Measure restore endpoint response time
4. Monitor server logs for errors

**Expected Results:**
- Backup completes within 30 seconds
- Restore completes within 60 seconds
- No timeout errors
- No memory issues

**Performance Benchmarks:**
- Small dataset (<100 records): <2 seconds
- Medium dataset (100-1000 records): <10 seconds
- Large dataset (>1000 records): <30 seconds

---

## Manual Testing Checklist

### Before Testing
- [ ] Backup endpoint is deployed: `/supabase/functions/server/index.tsx`
- [ ] SuperAdmin account exists and is accessible
- [ ] Test company with sample data is set up
- [ ] API URL and tokens are ready

### Backup Endpoint Tests
- [ ] Test 1: Authentication checks pass
- [ ] Test 2: Response format is correct
- [ ] Test 3: Multi-tenant isolation verified
- [ ] Test 4: Data completeness verified
- [ ] Test 9: Round-trip test successful

### Restore Endpoint Tests
- [ ] Test 5: Authentication checks pass
- [ ] Test 6: Invalid data handling works
- [ ] Test 7: Data restoration successful
- [ ] Test 8: Multi-tenant safety verified
- [ ] Test 9: Round-trip test successful

### Performance Tests
- [ ] Test 10: Performance benchmarks met
- [ ] No server errors in logs
- [ ] No timeout issues

---

## Browser DevTools Testing

### Using Browser Console

```javascript
// Get access token from auth context
const accessToken = 'YOUR_SUPERADMIN_ACCESS_TOKEN';
const projectId = 'YOUR_PROJECT_ID';

// Test 1: Create Backup
async function testBackup() {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-a35148f0/backup`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  console.log('Backup Response:', data);
  console.log('Status:', response.status);
  
  // Save to localStorage for restore test
  localStorage.setItem('testBackup', JSON.stringify(data));
  
  return data;
}

// Test 2: Restore Backup
async function testRestore() {
  const backup = JSON.parse(localStorage.getItem('testBackup'));
  
  if (!backup || !backup.data) {
    console.error('No backup found in localStorage');
    return;
  }
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-a35148f0/backup/restore`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: backup.data })
    }
  );
  
  const result = await response.json();
  console.log('Restore Response:', result);
  console.log('Status:', response.status);
  
  return result;
}

// Run tests
console.log('Starting backup test...');
testBackup().then(backup => {
  console.log('✓ Backup successful');
  console.log('Starting restore test...');
  return testRestore();
}).then(result => {
  console.log('✓ Restore successful');
  console.log('All tests passed!');
}).catch(error => {
  console.error('✗ Test failed:', error);
});
```

---

## Common Issues and Troubleshooting

### Issue 1: 401 Unauthorized
**Cause:** Invalid or expired access token
**Solution:** 
- Refresh token or re-login as SuperAdmin
- Verify token is being sent in Authorization header
- Check token format: `Bearer {token}`

### Issue 2: 403 Forbidden
**Cause:** User is not SuperAdmin
**Solution:**
- Verify user has SuperAdmin role
- Check role assignment in employee record
- Ensure role is 'superadmin' (case-sensitive)

### Issue 3: Empty Backup Response
**Cause:** No data exists for the company OR multi-tenant filtering is too strict
**Solution:**
- Verify test data exists for the company
- Check company scope resolution
- Review `resolveCompanyScope()` function output in logs

### Issue 4: Restore Count Mismatch
**Cause:** Data format issues or missing IDs
**Solution:**
- Verify all records have `id` field
- Check for attendance records (need userId + date)
- Review backup data structure

### Issue 5: Cross-Company Data Leakage
**Cause:** Multi-tenant isolation bug
**Solution:**
- CRITICAL SECURITY ISSUE - Report immediately
- Review backup filtering logic in `/supabase/functions/server/index.tsx`
- Check `resolveCompanyScope()` implementation

---

## Production Readiness Checklist

Before deploying to production:
- [ ] All 10 test cases pass
- [ ] Multi-tenant isolation verified (Test 3 & 8)
- [ ] Performance benchmarks met (Test 10)
- [ ] No security vulnerabilities detected
- [ ] Error handling works correctly
- [ ] Logs are informative without exposing sensitive data
- [ ] Documentation is complete
- [ ] Frontend integration tested (`/components/BackupRestore.tsx`)
- [ ] Backup files download correctly
- [ ] Restore confirms before overwriting data

---

## Test Results Template

**Test Date:** _________________  
**Tester:** _________________  
**Environment:** Production / Staging / Development  

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Backup Authentication | ⬜ Pass ⬜ Fail | |
| 2 | Backup Response Format | ⬜ Pass ⬜ Fail | |
| 3 | Multi-Tenant Isolation | ⬜ Pass ⬜ Fail | |
| 4 | Data Completeness | ⬜ Pass ⬜ Fail | |
| 5 | Restore Authentication | ⬜ Pass ⬜ Fail | |
| 6 | Invalid Data Handling | ⬜ Pass ⬜ Fail | |
| 7 | Data Restoration | ⬜ Pass ⬜ Fail | |
| 8 | Multi-Tenant Safety | ⬜ Pass ⬜ Fail | |
| 9 | Round Trip Test | ⬜ Pass ⬜ Fail | |
| 10 | Performance Test | ⬜ Pass ⬜ Fail | |

**Overall Result:** ⬜ All Pass ⬜ Some Failed ⬜ Blocked

**Critical Issues Found:**
_____________________

**Sign-off:** _________________

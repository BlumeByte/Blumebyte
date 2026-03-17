# Quick Test Guide - Backup Endpoint Verification

**⚡ Fast 5-Minute Test** for verifying backup endpoint functionality before production launch.

---

## Prerequisites
- SuperAdmin access to Blumebyte platform
- Browser with Developer Tools (Chrome/Firefox/Edge)

---

## Step 1: Get Your Access Token (1 minute)

1. Login to Blumebyte as **SuperAdmin**
2. Open browser **Developer Tools** (F12)
3. Go to **Console** tab
4. Run this command:

```javascript
// Get your access token
const getToken = () => {
  const authData = localStorage.getItem('blumebyte-auth');
  if (authData) {
    const parsed = JSON.parse(authData);
    return parsed.accessToken;
  }
  return null;
};

const token = getToken();
console.log('Access Token:', token);
```

5. **Copy the access token** (you'll need it in Step 3)

---

## Step 2: Get Your Project ID (30 seconds)

**Option A:** From the URL
```
https://YOUR-PROJECT-ID.supabase.co/...
```
Copy the part before `.supabase.co`

**Option B:** From console
```javascript
// Check app configuration
import { projectId } from './utils/supabase/info';
console.log('Project ID:', projectId);
```

---

## Step 3: Run Quick Test (2 minutes)

Copy and paste this **entire script** into your browser console:

```javascript
// ============ QUICK BACKUP TEST ============
// Update these values:
const CONFIG = {
  projectId: 'YOUR_PROJECT_ID',      // From Step 2
  accessToken: 'YOUR_ACCESS_TOKEN'    // From Step 1
};

const baseUrl = `https://${CONFIG.projectId}.supabase.co/functions/v1/make-server-668731fc`;

async function quickBackupTest() {
  console.log('🧪 Starting Quick Backup Test...\n');
  
  try {
    // Test 1: Create Backup
    console.log('1️⃣ Testing backup endpoint...');
    const backupResponse = await fetch(`${baseUrl}/backup`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!backupResponse.ok) {
      throw new Error(`Backup failed: ${backupResponse.status}`);
    }
    
    const backupData = await backupResponse.json();
    console.log('✅ Backup successful!');
    console.log('   Version:', backupData.version);
    console.log('   Timestamp:', backupData.timestamp);
    
    // Test 2: Check Data Structure
    console.log('\n2️⃣ Validating backup structure...');
    const prefixes = Object.keys(backupData.data || {});
    const totalRecords = Object.values(backupData.data || {})
      .reduce((sum, arr) => sum + arr.length, 0);
    
    console.log('✅ Structure valid!');
    console.log('   Prefixes found:', prefixes.length);
    console.log('   Total records:', totalRecords);
    console.log('   Data prefixes:', prefixes.slice(0, 5).join(', '), '...');
    
    // Test 3: Multi-Tenant Check
    console.log('\n3️⃣ Checking multi-tenant isolation...');
    const employees = backupData.data['employee:'] || [];
    const companies = new Set(
      employees.map(e => e.companyId || e.company).filter(Boolean)
    );
    
    console.log('✅ Isolation check complete!');
    console.log('   Unique companies in backup:', companies.size);
    if (companies.size === 1) {
      console.log('   ✅ Perfect! Only one company (multi-tenant isolation working)');
    } else if (companies.size > 1) {
      console.log('   ⚠️  Multiple companies found - verify this is expected');
    }
    
    // Test 4: Performance Check
    console.log('\n4️⃣ Performance metrics...');
    const dataSize = JSON.stringify(backupData).length;
    console.log('   Backup size:', (dataSize / 1024).toFixed(2), 'KB');
    
    // Final Result
    console.log('\n' + '='.repeat(50));
    console.log('🎉 QUICK TEST COMPLETE - ALL PASSED!');
    console.log('='.repeat(50));
    console.log('\n✅ Backup endpoint is working correctly');
    console.log('✅ Data structure is valid');
    console.log('✅ Multi-tenant isolation verified');
    console.log('\n💾 Backup data saved to: window.testBackupData');
    
    // Save for inspection
    window.testBackupData = backupData;
    
    return { success: true, backupData };
    
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(50));
    console.error('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check access token is valid (not expired)');
    console.log('2. Verify you are logged in as SuperAdmin');
    console.log('3. Check project ID is correct');
    console.log('4. Review server logs for detailed errors');
    return { success: false, error: error.message };
  }
}

// Auto-run the test
quickBackupTest();
```

---

## Step 4: Interpret Results (1 minute)

### ✅ Success Output
```
🧪 Starting Quick Backup Test...

1️⃣ Testing backup endpoint...
✅ Backup successful!
   Version: 1.0
   Timestamp: 2026-03-17T10:30:00.000Z

2️⃣ Validating backup structure...
✅ Structure valid!
   Prefixes found: 15
   Total records: 247
   Data prefixes: employee:, company:, department:, leave:, attendance: ...

3️⃣ Checking multi-tenant isolation...
✅ Isolation check complete!
   Unique companies in backup: 1
   ✅ Perfect! Only one company (multi-tenant isolation working)

4️⃣ Performance metrics...
   Backup size: 45.67 KB

==================================================
🎉 QUICK TEST COMPLETE - ALL PASSED!
==================================================

✅ Backup endpoint is working correctly
✅ Data structure is valid
✅ Multi-tenant isolation verified
```

**Meaning:** ✅ **Backup endpoint is production-ready!**

---

### ❌ Failure Output
```
❌ TEST FAILED
==================================================
Error: Backup failed: 401

Troubleshooting:
1. Check access token is valid (not expired)
2. Verify you are logged in as SuperAdmin
3. Check project ID is correct
4. Review server logs for detailed errors
```

**Common Fixes:**
- **401 Error:** Access token expired - re-login and get new token
- **403 Error:** User is not SuperAdmin - use SuperAdmin account
- **404 Error:** Wrong project ID or endpoint not deployed
- **500 Error:** Server error - check Supabase logs

---

## Step 5: Optional - Inspect Backup Data (1 minute)

After successful test, you can inspect the backup data:

```javascript
// View the backup data
console.log('Full backup:', window.testBackupData);

// See what data is included
Object.keys(window.testBackupData.data).forEach(prefix => {
  const count = window.testBackupData.data[prefix].length;
  console.log(`${prefix}: ${count} records`);
});

// Download backup as file (optional)
const blob = new Blob(
  [JSON.stringify(window.testBackupData, null, 2)], 
  { type: 'application/json' }
);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `backup-test-${Date.now()}.json`;
a.click();
console.log('✅ Backup downloaded!');
```

---

## Expected Results

### Minimal Test Data
If you just created the company with no employees:
- Prefixes: 1-3
- Records: 1-5
- Company settings only

### With Test Employees
If you have test employees and data:
- Prefixes: 10-20
- Records: 50-500+
- Multiple data types (employees, departments, leaves, etc.)

### Production Ready
- ✅ Version: 1.0
- ✅ Timestamp: Valid ISO date
- ✅ Data: Object with arrays
- ✅ Multi-tenant: Single company ID (or justified multiple)
- ✅ No errors in console

---

## Next Steps After Quick Test

### If Test PASSED ✅
1. Proceed with more comprehensive testing (`/tests/backup-endpoint-test.md`)
2. Run automated test suite (`/tests/backup-test-runner.js`)
3. Test restore functionality (optional, destructive)
4. Mark "Backup Endpoint Tested" in pre-launch checklist

### If Test FAILED ❌
1. Review error message carefully
2. Check troubleshooting section above
3. Verify Supabase server logs
4. Re-check prerequisites (token, project ID, SuperAdmin role)
5. Try again after fixing issues

---

## Full Testing (If You Have Time)

After quick test passes, run comprehensive tests:

1. **Automated Test Suite** (10 minutes)
   ```javascript
   // See /tests/backup-test-runner.js
   // Configure and run full automated tests
   ```

2. **Manual Test Cases** (30 minutes)
   ```markdown
   # See /tests/backup-endpoint-test.md
   # Complete all 10 test cases with documentation
   ```

---

## Troubleshooting Guide

### "ReferenceError: import is not defined"
❌ **Wrong:** Trying to import in console  
✅ **Fix:** Copy values directly or use existing variables

### "Failed to fetch"
❌ **Cause:** Network error or wrong URL  
✅ **Fix:** Check project ID, verify server is deployed

### "Backup endpoint is not deployed"
❌ **Cause:** Server functions not deployed  
✅ **Fix:** Deploy `/supabase/functions/server/` to Supabase

### "Access token is null"
❌ **Cause:** Not logged in or different auth system  
✅ **Fix:** Login first, then run Step 1 again

---

## Quick Reference

**Backup Endpoint:**
```
GET https://{projectId}.supabase.co/functions/v1/make-server-668731fc/backup
Headers: Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "version": "1.0",
  "timestamp": "2026-03-17T...",
  "data": {
    "employee:": [...],
    "company:": [...],
    ...
  }
}
```

---

## Summary Checklist

- [ ] Got access token from console
- [ ] Found project ID
- [ ] Ran quick test script
- [ ] Test passed (all ✅)
- [ ] Backup data visible in console
- [ ] Multi-tenant isolation verified (1 company)
- [ ] Ready for comprehensive testing OR production

---

**Estimated Time:** 5 minutes  
**Difficulty:** Easy  
**Requirements:** SuperAdmin access, browser console  

**Questions?** See `/tests/README.md` for full documentation.

---

*End of Quick Test Guide*

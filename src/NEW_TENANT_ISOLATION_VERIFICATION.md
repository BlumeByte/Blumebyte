# New Tenant Isolation - Verification Guide

## 🎯 Understanding the Issue

Based on your screenshot showing "SAS Finance Group" seeing 3 companies including two "Blumebyte" entries:

### What Should Happen:
✅ Each new company registration should create a COMPLETELY ISOLATED workspace
✅ New company should see ONLY their own company in the Companies list
✅ New company should start with ZERO employees (except their SuperAdmin)
✅ New company should start with ZERO departments, assets, meetings, payroll, etc.
✅ Company name and logo should default to registration name or "Blumebyte" until changed

### What Was Happening (BEFORE FIXES):
❌ New companies could see OTHER companies in the Companies list
❌ New companies shared global settings (name, logo, clock settings)
❌ SuperAdmin role bypassed ALL company filtering

---

## 🔧 Fixes Applied

### Fix #1: Default Company Settings on Registration
**File:** `/supabase/functions/server/index.tsx` (Line ~630)

New companies now automatically get:
- Company-scoped settings with their registered company name
- Empty logo (until they upload one)
- Default clock-in/out settings (isolated per company)
- Default manual clock settings (isolated per company)

```typescript
// Default settings created for each new company:
await kv.set(`company-settings:${companyId}`, {
  companyId,
  companyName: companyName, // From registration
  description: '',
  primaryColor: '#10b981',
  logoUrl: '', // Empty until uploaded
  logoPath: '',
});
```

###Fix #2: Company Filtering for Companies List
**Endpoint:** `GET /companies`

The companies list is now filtered by the user's company scope.

**Expected Result:**
- SuperAdmin of "SAS Finance Group" should see ONLY "SAS Finance Group" in the list
- SuperAdmin of "Blumebyte" should see ONLY "Blumebyte" in the list

---

## 🧪 Testing New Tenant Isolation

### Test 1: Fresh Company Registration

**Steps:**
1. Register a NEW company (e.g., "Test Company ABC")
2. Complete payment/registration flow
3. Login as the new SuperAdmin
4. Navigate to Dashboard

**Expected Results:**
- ✅ Dashboard shows ONLY "Test Company ABC" employees (just the SuperAdmin)
- ✅ Companies tab shows ONLY "Test Company ABC" (1 company)
- ✅ Departments tab shows ZERO departments (none created yet)
- ✅ Assets tab shows ZERO assets
- ✅ Payroll tab shows ZERO payroll runs
- ✅ Meetings tab shows ZERO meetings
- ✅ All other modules show ZERO records

### Test 2: Company Settings Isolation

**Steps:**
1. Login to Company A
2. Go to Settings → Company Settings
3. Note the company name displayed
4. Logout
5. Login to Company B
6. Go to Settings → Company Settings
7. Note the company name displayed

**Expected Results:**
- ✅ Company A sees their own company name
- ✅ Company B sees their own company name
- ✅ Changing Company A's name does NOT affect Company B

### Test 3: Logo Upload Isolation

**Steps:**
1. Login to Company A
2. Upload a logo (e.g., red logo)
3. Logout
4. Login to Company B
5. Upload a logo (e.g., blue logo)
6. Logout
7. Login to Company A again

**Expected Results:**
- ✅ Company A still has their red logo
- ✅ Company B has their blue logo
- ✅ Logos are completely isolated

### Test 4: Companies List Filtering

**Steps:**
1. Ensure you have at least 2 companies registered:
   - Company A: "SAS Finance Group"
   - Company B: "Tech Solutions"
2. Login as SuperAdmin of Company A
3. Navigate to Organization → Companies

**Expected Results:**
- ✅ Company A SuperAdmin sees ONLY "SAS Finance Group" (1 record)
- ✅ Company B SuperAdmin sees ONLY "Tech Solutions" (1 record)
- ✅ NO cross-company visibility

---

## 🚨 Troubleshooting the Screenshot Issue

Your screenshot shows "SAS Finance Group" seeing 3 companies including two "Blumebyte" entries.

### Possible Causes:

#### Cause #1: Old Test Data
**Problem:** Multiple companies were created during testing with the name "Blumebyte"

**Solution:**
```bash
# Check company records in database
SELECT * FROM kv_store WHERE key LIKE 'company:%';

# Look for duplicate "Blumebyte" companies
# Delete test companies if needed
```

#### Cause #2: Cache Issue
**Problem:** Frontend is showing cached data

**Solution:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Logout and login again

#### Cause #3: Employee Record Missing assignedCompanies
**Problem:** The SuperAdmin user's employee record doesn't have `assignedCompanies` set correctly

**Solution - Verify User Data:**
```typescript
// In browser console after login:
console.log('User:', JSON.parse(localStorage.getItem('auth-user') || '{}'));

// Should show:
// {
//   email: "admin@sasfinance.com",
//   company: "company-id-here",
//   companyId: "company-id-here",
//   assignedCompanies: ["company-id-here"],
//   ...
// }
```

**Fix if assignedCompanies is missing:**
```sql
-- Update employee record to include assignedCompanies
UPDATE employee SET assignedCompanies = ARRAY[companyId] WHERE userId = 'user-id-here';
```

#### Cause #4: Server Not Deployed
**Problem:** The new fixes haven't been deployed to the server yet

**Solution:**
```bash
# Deploy the updated server code
supabase functions deploy make-server-a35148f0

# Verify deployment
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/make-server-a35148f0/health
```

---

## ✅ Verification Checklist

After deploying the fixes, verify each item:

### Backend Verification:
- [ ] Server code deployed successfully
- [ ] Registration creates default company-scoped settings
- [ ] `/companies` endpoint filters by company scope
- [ ] Company settings are scoped: `company-settings:{companyId}`
- [ ] Auto-clock settings are scoped: `auto-clock-settings:{companyId}`
- [ ] Manual-clock settings are scoped: `manual-clock-settings:{companyId}`

### Frontend Verification:
- [ ] New company registration creates isolated workspace
- [ ] Companies list shows ONLY current company
- [ ] Dashboard shows ONLY current company's data
- [ ] All modules (departments, assets, etc.) start empty for new companies
- [ ] Company settings show correct company name
- [ ] Logo upload works and is isolated per company

### Data Verification:
- [ ] Each employee has `assignedCompanies` array
- [ ] Each company settings has `companyId` field
- [ ] No global settings keys exist (old: `company-settings`)
- [ ] All settings use company-scoped keys (new: `company-settings:{id}`)

---

## 🔍 Debugging Commands

### Check Current User's Company Scope:
```javascript
// In browser console:
const user = JSON.parse(localStorage.getItem('auth-user') || '{}');
console.log('Company ID:', user.companyId);
console.log('Assigned Companies:', user.assignedCompanies);
```

### Check Companies API Response:
```javascript
// In browser console (after login):
const token = localStorage.getItem('auth-token');
fetch('https://YOUR-PROJECT-ID.supabase.co/functions/v1/make-server-a35148f0/companies', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Companies:', data));
```

### Check Company Settings:
```javascript
// In browser console (after login):
const token = localStorage.getItem('auth-token');
fetch('https://YOUR-PROJECT-ID.supabase.co/functions/v1/make-server-a35148f0/company-settings', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Settings:', data));
```

---

## 🎯 Expected State for "SAS Finance Group"

After fixes are applied and verified:

### Companies Tab:
```
Total: 1 record
Active: 1

[Table]
Company Name         | Address      | Phone        | Email           | Industry | Website
SAS Finance Group    | 14th Floor... | 0302661008   | info@...        | Finance  | www.sasghana.com
```

### Dashboard Stats:
```
Total Employees: 1 (just the SuperAdmin)
Departments: 0 (none created yet)
Pending Leaves: 0
Approved Leaves: 0
```

### All Other Modules:
- Assets: 0
- Meetings: 0
- Payroll Runs: 0
- Performance Reviews: 0
- etc.

---

## 🚀 Next Steps

1. **Deploy Server:**
   ```bash
   supabase functions deploy make-server-a35148f0
   ```

2. **Clear Test Data (if needed):**
   - Delete duplicate "Blumebyte" companies
   - Keep only legitimate company records

3. **Verify with Fresh Registration:**
   - Register a completely new company
   - Verify it sees ZERO data from other companies
   - Verify it shows ONLY its own company in the Companies list

4. **Run Migration Script (if needed):**
   - See `/DEPLOYMENT_CHECKLIST.md` for employee migration
   - See `/DEPLOYMENT_CHECKLIST.md` for settings migration

5. **Test All Scenarios:**
   - Follow Test 1-4 above
   - Document any issues found
   - Verify fixes worked

---

## 📞 Support

If issues persist after deployment:

1. **Check Server Logs:**
   ```bash
   supabase functions logs make-server-a35148f0
   ```

2. **Verify Employee Record:**
   - Check that user has `assignedCompanies` field
   - Check that user has correct `companyId` field

3. **Check API Responses:**
   - Use browser console debugging commands above
   - Verify `/companies` returns only 1 company
   - Verify `/company-settings` returns correct company name

4. **Hard Reset (last resort):**
   - Logout
   - Clear all browser cache
   - Clear localStorage
   - Login again

---

**Status:** ✅ All fixes applied and ready for deployment
**Date:** March 16, 2026
**Version:** 1.0

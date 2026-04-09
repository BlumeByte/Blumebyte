# 🎨 Company Branding System - Complete Guide

## ✅ What Was Fixed in Phase 11

### 1. **API 404 Error Fixed**
- Changed `GlobalCurrencySettings.tsx` to use `/profile` instead of `/employees/${user.id}`
- Fixed "Route not found" error

### 2. **Enhanced Debugging**
- Added comprehensive console logging to branding context
- Added backend logging for company settings fetch
- Added save operation logging

### 3. **Currency Instructions Removed**
- Cleaned up Paystack payment page
- Removed outdated environment variable instructions

---

## 🔍 How the Branding System Works

### **Architecture:**

1. **Storage:** Company settings stored in KV as `company-settings:{companyId}`
2. **Context:** `BrandingProvider` fetches settings on load and every 60 seconds
3. **Tenant Isolation:** Each company has separate settings based on their `companyId`
4. **Real-time Updates:** Page reload after save ensures all components update

### **Data Flow:**

```
User Saves Branding 
  ↓
PUT /superadmin/company-branding
  ↓
KV Store: company-settings:{companyId}
  ↓
BrandingContext.refresh()
  ↓
GET /company-settings (authenticated)
  ↓
Update React Context
  ↓
Page Reload → All Components Update
```

---

## 📋 Testing Checklist

### **Step 1: Save Company Branding**

1. Log in as **SuperAdmin**
2. Navigate to **Settings** (⚙️ gear icon)
3. Scroll to **"Company Branding Settings"**
4. Fill in:
   - **Company Name:** (e.g., "Acme Corp")
   - **Description:** (e.g., "Employee Management System")
   - **Primary Color:** Choose a color or enter hex code
   - **Logo:** (Optional) Upload and crop
5. Click **"💾 Save Branding Settings"**
6. Wait for success message
7. Page will auto-reload after 1 second

### **Step 2: Verify Browser Console**

Open DevTools Console (F12) and look for:

```
💾 Saving branding settings: { companyName: "...", primaryColor: "...", ... }
✅ Branding save response: { companyName: "...", ... }
🔄 Reloading page to apply branding changes...
```

After reload:
```
🎨 Branding data fetched from backend: { companyName: "...", hasData: true }
🎨 Setting branding to: { companyName: "...", ... }
```

### **Step 3: Check Backend Logs**

In your Supabase Dashboard → Edge Functions Logs:

```
🔍 GET /company-settings - User: xxx, Role: superadmin, CompanyId: xxx
🎨 Fetched settings for xxx: { hasSettings: true, companyName: "...", ... }
```

When saving:
```
🎨 Branding updated for company xxx by SuperAdmin xxx: { companyName: "...", ... }
```

### **Step 4: Verify UI Updates**

After saving and reload, check:

- ✅ **Sidebar Logo/Name:** Should show your company name
- ✅ **PDF Exports:** Generate any PDF → should show your company name
- ✅ **Email Templates:** System emails use your company name
- ✅ **Login Page Footer:** Still shows "Blumebyte" (by design - public page)

---

## 🚨 Troubleshooting

### **Issue: Branding Doesn't Change After Save**

**Check 1: Browser Console Errors**
```javascript
// Look for any errors in console
// Common issues:
// - 401 Unauthorized: Token expired, log out and back in
// - 404 Not Found: Backend not deployed
// - Network error: Check internet connection
```

**Check 2: Backend Response**
```javascript
// In Console after save, check:
console.log('💾 Save response:', response);
// Should contain: { companyName: "...", primaryColor: "...", updatedAt: "..." }
```

**Check 3: Company ID**
```javascript
// In backend logs, verify:
"CompanyId: xxx" // Should NOT be "NONE" or "undefined"
```

**Check 4: KV Storage**
- Go to Supabase Dashboard
- Check KV store has key: `company-settings:{yourCompanyId}`
- Verify it contains your saved data

### **Issue: "No company found" Error**

**Cause:** User profile doesn't have `companyId` assigned

**Fix:**
1. Check user record in database
2. Ensure `companyId` field is set
3. Log out and log back in to refresh session

### **Issue: Changes Only Show for Some Users**

**Cause:** This is expected! Tenant isolation means:
- Company A users see Company A branding
- Company B users see Company B branding

**Verify:** Log in as different companies and confirm each sees their own branding.

---

## 🎯 Expected Behavior

### **What SHOULD Change:**
✅ Company name in sidebar  
✅ Company name in PDFs  
✅ Company name in emails  
✅ Company logo everywhere  
✅ Primary color (buttons, gradients)  
✅ Dashboard headers  
✅ All modules and pages  

### **What SHOULD NOT Change:**
❌ Login page footer (public, no auth)  
❌ Landing page (marketing site)  
❌ Other companies' branding  

---

## 🔒 Security Notes

1. **Only SuperAdmins** can change branding
2. **Tenant Isolation:** Each company has separate settings
3. **Logo Upload:** Stored in Supabase Storage with access control
4. **No Cross-Contamination:** Company A cannot see/edit Company B's branding

---

## 📊 Performance

- **Initial Load:** Branding fetched once on page load
- **Polling:** Refreshes every 60 seconds (reduced from 15s)
- **Manual Refresh:** Triggered by save action + page reload
- **Caching:** Browser caches logo images

---

## 🎉 Success Criteria

Your branding system is working correctly when:

1. ✅ You can save company name and see it in console logs
2. ✅ After reload, sidebar shows your company name (not "Blumebyte")
3. ✅ PDFs generated show your company name
4. ✅ Backend logs show successful fetch with your company name
5. ✅ Different companies see their own branding

---

## 📞 Next Steps If Still Not Working

1. **Clear Browser Cache:** Hard refresh (Ctrl+Shift+R)
2. **Check Token:** Log out completely, log back in
3. **Verify Backend:** Ensure Edge Function is deployed
4. **Database Check:** Confirm company assignment in user record
5. **Share Logs:** Copy console logs and backend logs for debugging

---

## 📝 Additional Files Modified

- `/lib/branding-context.tsx` - Enhanced debugging
- `/components/CompanyBrandingSettings.tsx` - Enhanced save logging
- `/components/GlobalCurrencySettings.tsx` - Fixed API endpoint
- `/components/LicenseManagement.tsx` - Removed currency instructions
- `/supabase/functions/server/index.tsx` - Added backend logging

---

**Last Updated:** Phase 11 - April 2026

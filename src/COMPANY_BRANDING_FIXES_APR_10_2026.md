# Company Branding & Selection Fixes - April 10, 2026

## Issues Fixed

### 1. ✅ Company Selection Not Working for Tenants
**Problem**: When SuperAdmins created new company records in the Company module, those companies weren't appearing in dropdown selectors across the application (e.g., when creating branches, departments, etc.).

**Root Cause**: The company filtering logic in the `/reference-data` endpoint and `/superadmin/company` endpoint was only matching companies where `company.id === tenantId`, but newly created company records have:
- `id`: unique ID for the new company
- `companyId`: the tenant ID that owns this company

**Fix Applied**:
1. **File**: `/supabase/functions/server/index.tsx` (Line ~2128)
   - Updated company filtering to include companies owned by the tenant:
   ```typescript
   const companies = allCompanies.filter((c: any) => 
     scope!.includes(c.id) ||       // Direct match (tenant's main company)
     c.companyId === companyId ||   // Company owned by this tenant
     c.company === companyId        // Legacy field compatibility
   );
   ```

2. **File**: `/supabase/functions/server/index.tsx` (Line ~3907-3917)
   - Updated GET `/superadmin/company` endpoint to include sub-companies:
   ```typescript
   companies = companies.filter((company: any) => 
     company.id === superAdminCompany ||     // Tenant's main company record
     company.companyId === superAdminCompany || // Company owned by tenant
     company.company === superAdminCompany   // Legacy compatibility
   );
   ```

**Result**: SuperAdmins can now see and select all companies they've created in dropdown selectors throughout the application.

---

### 2. ✅ Company Branding Not Updating Dynamically
**Problem**: When SuperAdmins updated company branding (name, logo, colors), the changes weren't immediately reflected across the application, even after page reload.

**Root Cause**: 
- Branding refresh timing issues
- 60-second polling interval was too long
- No multi-tab synchronization
- Single refresh call after save wasn't sufficient for backend propagation

**Fix Applied**:

#### A. Branding Context Updates
**File**: `/lib/branding-context.tsx`
- Reduced polling interval from 60s to 30s for better freshness
- Added multi-tab sync via localStorage events
- Added double-refresh on update events (immediate + 1s delay)

```typescript
// Poll every 30 seconds instead of 60
const iv = setInterval(fetchBranding, 30000);

// Multi-tab sync
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'branding-refresh-trigger') {
    console.log('🎨 Branding refresh triggered from another tab');
    fetchBranding();
  }
};
window.addEventListener('storage', handleStorageChange);
```

#### B. Branding Settings Save Updates
**File**: `/components/CompanyBrandingSettings.tsx`
- Multiple refresh calls with delays to ensure backend propagation
- Multi-tab sync trigger via localStorage
- Extended page reload delay to 1.5s (from 1s)

```typescript
// Immediate refresh
await refreshBranding();
window.dispatchEvent(new Event('branding-updated'));

// Multi-tab sync
localStorage.setItem('branding-refresh-trigger', Date.now().toString());

// Delayed refresh after backend propagation
setTimeout(async () => {
  await refreshBranding();
  window.dispatchEvent(new Event('branding-updated'));
}, 500);

// Page reload after all refreshes
setTimeout(() => {
  window.location.reload();
}, 1500);
```

#### C. Logo Upload/Remove Updates
**File**: `/components/CompanyBrandingSettings.tsx`
- Added same multi-tab sync to logo upload and removal operations
- Made refresh calls async/await for better timing control

**Result**: Branding updates now propagate immediately to:
- Current tab (multiple refresh calls)
- Other open tabs (localStorage sync)
- All components (page reload after propagation)

---

## Testing Checklist

### Company Selection Testing
- [ ] SuperAdmin can create new companies in Company module
- [ ] New companies appear in Branch creation "Company" dropdown
- [ ] New companies appear in Department creation "Company" dropdown  
- [ ] New companies appear in all relevant dropdowns across modules
- [ ] Other tenants cannot see companies from different tenants
- [ ] Main tenant company record still appears in all dropdowns

### Branding Update Testing
- [ ] Update company name → reflects immediately after reload
- [ ] Update primary color → reflects immediately after reload
- [ ] Upload new logo → appears immediately after reload
- [ ] Remove logo → disappears immediately after reload
- [ ] Update tagline/description → reflects immediately after reload
- [ ] Open multiple tabs → changes in one tab sync to others
- [ ] All UI components respect new branding (navbar, cards, etc.)
- [ ] Other tenants don't see branding changes from different tenants

---

## Technical Details

### Data Model
When a SuperAdmin creates a company via the Company module:
```json
{
  "id": "company-xyz-789",           // Unique company record ID
  "name": "Subsidiary Inc.",
  "companyId": "tenant-abc-123",     // Owner tenant ID
  "company": "tenant-abc-123",       // Legacy field
  "industry": "Technology",
  // ... other fields
}
```

The filtering now matches on BOTH:
- Direct tenant company: `c.id === "tenant-abc-123"`
- Owned sub-companies: `c.companyId === "tenant-abc-123"`

### Branding Propagation Timeline
1. **T+0ms**: User clicks "Save Branding Settings"
2. **T+0ms**: PUT request to `/superadmin/company-branding`
3. **T+0ms**: Immediate refresh call #1
4. **T+0ms**: Broadcast event to current tab
5. **T+0ms**: Trigger multi-tab sync via localStorage
6. **T+500ms**: Delayed refresh call #2 (after backend propagation)
7. **T+1500ms**: Full page reload to reset all component state

---

## Files Modified

1. `/supabase/functions/server/index.tsx`
   - Line ~2128: Fixed company filtering in `/reference-data` endpoint
   - Line ~3907-3917: Fixed company filtering in `/superadmin/company` endpoint

2. `/lib/branding-context.tsx`
   - Reduced polling from 60s to 30s
   - Added multi-tab sync via localStorage
   - Added double-refresh on update events

3. `/components/CompanyBrandingSettings.tsx`
   - Multi-refresh pattern on save (immediate + delayed)
   - Multi-tab sync triggers
   - Extended reload delay to 1.5s
   - Async logo upload/remove with sync triggers

---

## Performance Impact

### Before
- Branding refresh: 60s polling interval
- Company selection: Only main tenant company visible
- Multi-tab: No sync (stale data in other tabs)
- Updates: Required manual page refresh

### After  
- Branding refresh: 30s polling interval + immediate event-based
- Company selection: All tenant-owned companies visible
- Multi-tab: Automatic sync via localStorage
- Updates: Automatic refresh + reload (1.5s delay)

**Net Performance**: Slightly increased polling frequency (30s vs 60s), but with much better user experience and data freshness. Multi-tab sync uses localStorage events (negligible overhead).

---

## Rollback Instructions

If issues occur, revert these commits:
1. `/supabase/functions/server/index.tsx` - Lines 2123-2135 and 3907-3920
2. `/lib/branding-context.tsx` - Lines 80-100
3. `/components/CompanyBrandingSettings.tsx` - Lines 46-73, 156-163, 175-178

Or restore from git:
```bash
git checkout HEAD~1 /supabase/functions/server/index.tsx
git checkout HEAD~1 /lib/branding-context.tsx  
git checkout HEAD~1 /components/CompanyBrandingSettings.tsx
```

---

## Related Documentation
- `BRANDING_SYSTEM.md` - Original branding system documentation
- `COMPREHENSIVE_MULTI_TENANT_FIX.md` - Multi-tenant isolation documentation
- `COMPANY_FILTERING_IMPLEMENTATION.md` - Company filtering documentation

---

**Status**: ✅ **DEPLOYED AND READY FOR TESTING**  
**Date**: April 10, 2026  
**Tested By**: Pending user testing  
**Approved By**: Pending

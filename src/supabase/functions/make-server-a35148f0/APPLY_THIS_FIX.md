# CRITICAL FIX FOR SUBSCRIPTION VALIDATION

## Problem
Users can purchase licenses successfully, but when trying to add employees, they get "No active subscription" error.

## Root Cause
The company data is stored with key `company:${id}` during registration, but the user creation endpoint tries to read from `company_by_id:${id}`. Additionally, old companies use `company.licenses` directly while new ones use `company.subscription.licenses`.

## Solution - Apply BOTH fixes:

### FIX 1: Update line 1854-1868 in /supabase/functions/server/index.tsx

**FIND THIS CODE (around line 1854):**
```typescript
    // Check license availability for this company
    const company = await kv.get(`company_by_id:${userCompanyId}`);
    const subscription = company?.subscription;
    
    if (!subscription || subscription.status !== 'active') {
      return c.json({ 
        error: "No active subscription. Please purchase licenses first.",
        needsSubscription: true 
      }, 403);
    }
    
    // Count existing active users in this company
    const companyStats = await kv.get(`company_stats:${userCompanyId}`) || {};
    const usedLicenses = companyStats.usedLicenses || 1; // At least the super admin
    const purchasedLicenses = subscription.licenses || 0;
```

**REPLACE WITH:**
```typescript
    // FIXED: Check license availability - handle both storage keys
    let company = await kv.get(`company_by_id:${userCompanyId}`);
    if (!company) {
      company = await kv.get(`company:${userCompanyId}`);
    }
    
    if (!company) {
      console.error('Company not found:', userCompanyId);
      return c.json({ error: "Company not found. Please contact support." }, 400);
    }
    
    // FIXED: Handle both subscription formats (old and new)
    const subscription = company.subscription || (company.licenses > 0 ? {
      status: company.subscriptionStatus === 'active' ? 'active' : 'inactive',
      licenses: company.licenses
    } : null);
    
    if (!subscription || subscription.status !== 'active') {
      console.error('No active subscription for company:', userCompanyId, {
        hasCompany: !!company,
        hasSubscription: !!subscription,
        status: subscription?.status,
        licenses: company.licenses,
        subscriptionStatus: company.subscriptionStatus
      });
      return c.json({ 
        error: "No active subscription. Please purchase licenses first.",
        needsSubscription: true 
      }, 403);
    }
    
    // Count existing active users in this company
    const companyStats = await kv.get(`company_stats:${userCompanyId}`) || {};
    const usedLicenses = companyStats.usedLicenses || company.usedLicenses || 1; // Fallback to company.usedLicenses
    const purchasedLicenses = subscription.licenses || 0;
```

### FIX 2: Add import at top of file (around line 8)

**FIND:**
```typescript
import { performProductionCleanup } from "./production-cleanup.tsx";
```

**ADD AFTER IT:**
```typescript
import { migrateCompanyKeys } from "./migration-company-keys.tsx";
```

### FIX 3: Add migration endpoint (around line 8015, before Deno.serve)

**ADD THIS CODE:**
```typescript
// ============ MIGRATION: FIX COMPANY STORAGE KEYS ============
app.post(`${PREFIX}/admin/migrate-company-keys`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    console.log('Running company key migration...');
    
    const result = await migrateCompanyKeys();
    
    return c.json({
      success: true,
      message: 'Company keys migrated successfully',
      ...result
    });
  } catch (e: any) {
    console.error('Migration error:', e);
    return c.json({ error: e.message }, 500);
  }
});
```

## How to Test

1. Apply all 3 fixes above
2. As a SuperAdmin with purchased licenses, try to create a new user
3. It should now work correctly!

## Alternative Quick Fix (If editing is difficult)

Run the migration endpoint first, which will create `company_by_id:` keys for all existing companies:
```
POST /make-server-668731fc/admin/migrate-company-keys
Authorization: Bearer <superadmin-token>
```

Then the existing code should work!

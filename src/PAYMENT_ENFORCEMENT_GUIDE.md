# Payment Enforcement & License-Based User Activation Guide

## Overview

The BlumeByte HR Management System now enforces strict payment and license-based user activation. **No users (including Admin and HR roles) can access the system unless SuperAdmin has purchased sufficient licenses through an active subscription.**

## Key Enforcement Rules

### 1. **Subscription Requirement**
- SuperAdmin **MUST** purchase licenses before creating any users
- All non-SuperAdmin users require an active subscription to access the system
- If subscription expires or payment fails, all non-SuperAdmin users are immediately locked out

### 2. **License-Based User Activation**
- Users are created with `status: "active"` only if licenses are available
- System tracks `usedLicenses` (count of active users) vs `purchasedLicenses`
- When licenses run out, new users cannot be created
- Existing users can be deactivated if subscription downgrades or fails

### 3. **Role-Based Access Control**
- **SuperAdmin**: Always has access (needs to manage payments and subscription)
- **Admin/Manager/HR**: Requires active license AND active subscription
- **Employee**: Requires active license AND active subscription

## Backend Implementation

### Authentication Middleware Enhancement

#### `requireAuth()` Function
```typescript
async function requireAuth(c: any) {
  const user = await getAuthUser(c);
  if (!user) throw new Error("Unauthorized");
  
  const kvData = await kv.get(`employee:${user.id}`);
  const role = kvData?.role || user.user_metadata?.role || "employee";
  
  // SuperAdmin is always allowed (they need to access payment pages)
  if (role === 'superadmin') {
    return { user, role, kvData };
  }
  
  // For all other users, verify they have an active status
  if (kvData?.status !== 'active') {
    throw new Error("AccountInactive");
  }
  
  // Verify SuperAdmin has active subscription
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) {
    throw new Error("NoSuperAdmin");
  }
  
  const verification = await verifySubscriptionAndLicenses(superAdmin.id || superAdmin.userId, false);
  if (!verification.valid) {
    throw new Error("SubscriptionInactive");
  }
  
  return { user, role, kvData };
}
```

### Subscription Verification Helper

```typescript
async function verifySubscriptionAndLicenses(superAdminId: string, requiresActiveLicense = true) {
  const subscription = await kv.get(`subscription:${superAdminId}`);
  
  // Check if subscription exists and is active
  if (!subscription || subscription.status !== 'active') {
    return {
      valid: false,
      reason: 'no_subscription',
      message: 'No active subscription found. SuperAdmin must purchase licenses first.',
      subscription: null
    };
  }
  
  // If we need to verify license availability
  if (requiresActiveLicense) {
    const allUsers = await kv.getByPrefix('employee:');
    const activeUsers = allUsers.filter((u: any) => u.status === 'active');
    const usedLicenses = activeUsers.length;
    const purchasedLicenses = subscription.purchasedLicenses || 0;
    
    if (usedLicenses >= purchasedLicenses) {
      return {
        valid: false,
        reason: 'insufficient_licenses',
        message: `Insufficient licenses. Used: ${usedLicenses}, Available: ${purchasedLicenses}`,
        subscription,
        usedLicenses,
        purchasedLicenses
      };
    }
    
    return {
      valid: true,
      subscription,
      usedLicenses,
      purchasedLicenses,
      availableLicenses: purchasedLicenses - usedLicenses
    };
  }
  
  return { valid: true, subscription };
}
```

### Error Types

The system now returns specific error codes:

1. **`AccountInactive`** (403)
   - User's account status is "inactive"
   - Returned when user tries to access system but doesn't have an active license

2. **`SubscriptionInactive`** (403)
   - SuperAdmin's subscription is expired or payment failed
   - Returned when any non-SuperAdmin user tries to access system

3. **`NoSuperAdmin`** (500)
   - System configuration error
   - No SuperAdmin found in the system

4. **`needsSubscription`** (403)
   - Returned when trying to create user without active subscription
   - SuperAdmin must purchase licenses first

5. **`needsLicenses`** (403)
   - Returned when trying to create user but all licenses are used
   - SuperAdmin must purchase more licenses

### New Endpoint: Sync User Licenses

**POST** `/make-server-a35148f0/sync-user-licenses`

**Access**: SuperAdmin only

**Purpose**: Automatically activate/deactivate users based on license availability

**Behavior**:
- If no subscription or inactive: Deactivates ALL non-SuperAdmin users
- If active subscription: 
  - Counts available licenses (purchasedLicenses - superAdminCount)
  - Activates users up to license limit (oldest first by creation date)
  - Deactivates remaining users

**Response**:
```json
{
  "success": true,
  "purchasedLicenses": 10,
  "availableLicenses": 9,
  "activatedCount": 2,
  "deactivatedCount": 1,
  "totalUsers": 8,
  "activeUsers": 8
}
```

## Frontend Implementation

### 1. API Client Enhancement

The `api()` function now captures subscription-related error flags:

```typescript
export async function api(path: string, options: RequestInit & { token?: string | null } = {}) {
  // ... fetch logic ...
  
  if (!res.ok) {
    const error: any = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.accountInactive = data.accountInactive;
    error.subscriptionInactive = data.subscriptionInactive;
    error.noSuperAdmin = data.noSuperAdmin;
    error.needsSubscription = data.needsSubscription;
    error.needsLicenses = data.needsLicenses;
    throw error;
  }
  return data;
}
```

### 2. SubscriptionEnforcement Component

**Location**: `/components/SubscriptionEnforcement.tsx`

**Purpose**: Wraps all protected routes to enforce subscription requirements

**Features**:
- Checks subscription status every 5 minutes
- SuperAdmin bypasses check (needs to manage payments)
- Shows specific error screens for:
  - Account inactive
  - Subscription inactive
  - Generic access errors

**Usage**:
```typescript
<SubscriptionEnforcement>
  {children}
</SubscriptionEnforcement>
```

**Integration**: Automatically applied in `ProtectedRoute` component

### 3. License Management Sync Button

**Location**: `/components/LicenseManagement.tsx`

**Features**:
- "Sync User Licenses" button in license overview card
- Calls `/sync-user-licenses` endpoint
- Shows toast notification with sync results
- Refreshes license info after sync

**UI Location**: 
- In SuperAdmin dashboard
- In License Management page/modal
- Below card information and auto-renewal status

## User Experience Flows

### Flow 1: SuperAdmin Sets Up System
1. SuperAdmin creates account
2. System prompts to purchase licenses
3. SuperAdmin buys initial licenses (e.g., 10 users)
4. SuperAdmin can now create up to 10 users
5. All created users are automatically activated

### Flow 2: Creating Users Beyond License Limit
1. SuperAdmin tries to create 11th user (only 10 licenses purchased)
2. System returns error: "No available licenses"
3. UI shows "Buy More Licenses" button
4. SuperAdmin purchases 5 more licenses
5. Can now create additional users

### Flow 3: Subscription Payment Fails
1. Auto-renewal fails (card declined)
2. Subscription status changes to 'inactive'
3. All non-SuperAdmin users locked out immediately
4. Users see: "Subscription Inactive" screen
5. SuperAdmin receives notification
6. SuperAdmin updates payment method
7. Payment succeeds, subscription reactivates
8. All previously active users regain access

### Flow 4: Downgrading Licenses
1. SuperAdmin has 20 users on 20 licenses
2. SuperAdmin decides to downgrade to 15 licenses
3. After payment, SuperAdmin clicks "Sync User Licenses"
4. System keeps 15 oldest users active
5. 5 newest users are deactivated
6. Deactivated users see: "Account Inactive" screen

### Flow 5: Admin/HR Cannot Create Users
1. Admin tries to create new user
2. System returns: "Only SuperAdmin can create new users"
3. UI shows message directing to SuperAdmin
4. Admin can only edit existing users

## Testing & Verification

### Manual Testing Steps

1. **Test Subscription Enforcement**
   ```bash
   # Deactivate subscription in database
   # Try logging in as Admin/Manager/Employee
   # Should see "Subscription Inactive" screen
   ```

2. **Test License Limits**
   ```bash
   # Create users up to license limit
   # Try creating one more user
   # Should see "No available licenses" error
   ```

3. **Test Sync Functionality**
   ```bash
   # Manually set some users to inactive
   # Click "Sync User Licenses" button
   # Verify correct users are activated
   ```

4. **Test Account Deactivation**
   ```bash
   # Manually set a user to inactive
   # Try logging in as that user
   # Should see "Account Inactive" screen
   ```

### Database Verification

```bash
# Check all users and their status
kv.getByPrefix('employee:')

# Check subscription
kv.get('subscription:${superAdminId}')

# Verify license counts
subscription.purchasedLicenses vs activeUsers.length
```

## Migration Steps for Existing Deployments

If you already have users in your system:

1. **Ensure SuperAdmin has subscription**
   - SuperAdmin must purchase licenses equal to or greater than existing user count
   - If not, excess users will be deactivated

2. **Run License Sync**
   - Go to SuperAdmin Dashboard → License Management
   - Click "Sync User Licenses"
   - This will activate users based on available licenses

3. **Verify User Status**
   - Check that expected users are active
   - Inactive users should contact SuperAdmin

4. **Set up Auto-Renewal**
   - Ensure SuperAdmin has saved payment card
   - Verify auto-renewal is enabled
   - Test that renewal works before expiration

## Security Considerations

### What's Protected
✅ All API endpoints (except `/health`, `/check-setup`, `/setup-superadmin`)  
✅ User profile access  
✅ All module functionality (Time Tracking, Documents, etc.)  
✅ Admin/Manager functions  
✅ File uploads and downloads  

### What's NOT Protected (By Design)
- SuperAdmin login and dashboard
- Payment pages (SuperAdmin needs access to pay)
- Setup and initialization endpoints

### Best Practices
1. **Regular License Audits**: SuperAdmin should regularly review active users vs licenses
2. **Payment Card Updates**: Keep payment card up to date to avoid service interruption
3. **Monitor Notifications**: Watch for payment failure and subscription expiry notices
4. **Plan Ahead**: Purchase licenses before hiring new staff
5. **Use Sync Button**: After any subscription change, use "Sync User Licenses"

## Troubleshooting

### Problem: Users Can't Access System
**Check**:
1. Is subscription active? (`subscription.status === 'active'`)
2. Are there available licenses? (`purchasedLicenses > usedLicenses`)
3. Is user's status active? (`user.status === 'active'`)
4. Has payment been processed? (Check payment records)

**Solution**: 
- SuperAdmin purchases/renews licenses
- SuperAdmin clicks "Sync User Licenses"
- Users refresh their browser

### Problem: Can't Create New Users
**Check**:
1. License availability (`availableLicenses > 0`)
2. Subscription status (`subscription.status === 'active'`)

**Solution**:
- Purchase more licenses
- Deactivate unused users to free up licenses

### Problem: Sync Not Working
**Check**:
1. SuperAdmin logged in
2. API endpoint accessible
3. Subscription data exists

**Solution**:
- Check browser console for errors
- Verify SuperAdmin token is valid
- Ensure backend is running

## API Reference

### Check Subscription Status
```typescript
GET /subscription/license-info
Headers: X-User-Token: ${accessToken}
Response: {
  purchasedLicenses: number,
  usedLicenses: number,
  availableLicenses: number,
  subscriptionStatus: 'active' | 'inactive',
  nextRenewalDate: string,
  cardSaved: boolean,
  cardLast4: string,
  cardExpiry: string
}
```

### Sync User Licenses
```typescript
POST /sync-user-licenses
Headers: X-User-Token: ${accessToken}
Response: {
  success: boolean,
  purchasedLicenses: number,
  availableLicenses: number,
  activatedCount: number,
  deactivatedCount: number,
  totalUsers: number,
  activeUsers: number
}
```

### Create User (with License Check)
```typescript
POST /superadmin/users/create
Headers: X-User-Token: ${accessToken}
Body: {
  email: string,
  name: string,
  role: string,
  companyId?: string,
  department?: string,
  position?: string
}
Response: {
  success: boolean,
  userId: string,
  tempPassword: string
} | {
  error: string,
  needsSubscription?: boolean,
  needsLicenses?: boolean,
  usedLicenses?: number,
  purchasedLicenses?: number
}
```

## Summary

The payment enforcement system ensures:
- ✅ No unauthorized access without valid subscription
- ✅ No user creation beyond purchased licenses
- ✅ Automatic enforcement of license limits
- ✅ Clear user feedback on access restrictions
- ✅ SuperAdmin retains access to manage payments
- ✅ Immediate lockout on payment failure
- ✅ Fair license allocation (oldest users prioritized)

This system guarantees that **every active user in the system has a corresponding paid license**, maintaining revenue integrity and preventing system abuse.

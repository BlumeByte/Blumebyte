# User Alerts for License and Payment Issues - Implementation Guide

## Overview

Comprehensive alert system that notifies users when they need to contact SuperAdmin for license purchases or subscription renewals. Users receive clear, actionable messages across multiple touchpoints.

## Alert Components Created

### 1. **SubscriptionEnforcement.tsx** (Full-Screen Blockers)

**Location**: `/components/SubscriptionEnforcement.tsx`

**Purpose**: Blocks access to entire system with detailed error screens

**Triggers**:
- `accountInactive` - User's account is deactivated
- `subscriptionInactive` - Organization's subscription expired

**UI Features**:
- ✅ Full-screen overlay with gradient background
- ✅ Large, attention-grabbing icons (Lock, CreditCard)
- ✅ Clear heading: "Account Inactive - Action Required"
- ✅ Color-coded sections (blue for actions, yellow for warnings, red for urgency)
- ✅ Numbered step-by-step instructions
- ✅ Animated pulse effect for urgent messages

**User Experience**:
```
1. User tries to access system
2. Backend returns accountInactive/subscriptionInactive error
3. Full-screen alert appears with:
   - Explanation of what happened
   - Why it happened (insufficient licenses, payment failed, etc.)
   - Exactly what to do (contact SuperAdmin)
   - What happens next (automatic restoration after payment)
```

**Example Messages**:

**Account Inactive**:
```
⚠️ Your account has been deactivated

Your organization has insufficient user licenses or 
the subscription payment has failed.

📞 What to do:
1. Contact your SuperAdmin immediately
2. Request them to purchase additional licenses or renew subscription
3. Once payment is complete, your access will be restored automatically

🚫 You cannot access the system until your SuperAdmin purchases licenses
```

**Subscription Inactive**:
```
🔒 System-Wide Access Suspended

The organization's subscription is inactive. 
All system functions are disabled.

💳 Subscription Payment Required

URGENT ACTION NEEDED:
✓ Contact SuperAdmin immediately
✓ Ask them to renew the subscription
✓ Payment must be completed to unlock system

⏰ System will remain locked until SuperAdmin completes payment
```

---

### 2. **LicenseStatusBanner.tsx** (Dashboard Alerts)

**Location**: `/components/LicenseStatusBanner.tsx`

**Components**:

#### a) `LicenseStatusBanner` (SuperAdmin Only)

**Shows**:
- 🚨 No subscription: "URGENT: No Active Subscription" (animated pulse)
- 🚫 No licenses: "No Licenses Available"
- ⚠️ Low licenses (< 3): "Running Low on Licenses"

**Actions**:
- "Purchase Licenses Now" button → navigates to /superadmin/settings
- "Buy More Licenses" button
- Real-time license count display

**Example**:
```
🚨 URGENT: No Active Subscription

Your organization does not have an active subscription. 
All users (except you) are locked out of the system.

⚠️ Purchase licenses immediately to restore access for your team.

[Purchase Licenses Now] ← Button
```

#### b) `UserLicenseAlert` (Non-SuperAdmin Users)

**Shows**: Info banner explaining license-based access

**Message**:
```
ℹ️ License-Based Access

Your access to this system is managed through purchased user licenses. 
If you experience any access issues, please contact your SuperAdmin 
to verify that sufficient licenses have been purchased and payment 
is up to date.
```

**Placement**: Top of all dashboard pages (Admin, Manager, Employee)

#### c) `NoLicenseCreateAlert` (When Trying to Create User)

**Shows**: Full alert explaining why user creation is blocked

**Message**:
```
Cannot Create User - No Licenses Available

🚫 User creation is blocked

Your organization has reached its license limit. Only SuperAdmin 
can create new users, and they must purchase additional licenses first.

📞 Action Required:
1. Contact your SuperAdmin immediately
2. Request them to purchase additional user licenses
3. Once purchased, SuperAdmin can create new users
```

#### d) `SubscriptionExpiryAlert` (Upcoming Expiry)

**Shows**: Warning when subscription expires in ≤7 days

**Message**:
```
⏰ Subscription Expiring Soon

Your subscription will expire in 3 day(s). 
All users will lose access when it expires!

[Renew Subscription Now] ← Button
```

---

### 3. **ContactSuperAdminAlert.tsx** (Contextual Alerts)

**Location**: `/components/ContactSuperAdminAlert.tsx`

**Purpose**: Reusable alert component for specific error scenarios

**Variants**:

1. **`no_subscription`**
   - Icon: CreditCard
   - Title: "⚠️ No Active Subscription"
   - Action: "Contact SuperAdmin to purchase licenses immediately"

2. **`insufficient_licenses`**
   - Icon: Users
   - Title: "🚫 No Licenses Available"
   - Action: "Contact SuperAdmin to buy more user licenses"
   - Extra info: Pricing ($5/month or $48/year per user)

3. **`account_inactive`**
   - Icon: AlertTriangle
   - Title: "⛔ Your Account is Inactive"
   - Action: "Contact SuperAdmin to activate your account"

4. **`subscription_inactive`**
   - Icon: CreditCard
   - Title: "🔒 Subscription Payment Required"
   - Action: "Urgently contact SuperAdmin to complete payment"

5. **`create_user_blocked`**
   - Icon: Users
   - Title: "🚫 Cannot Create New Users"
   - Action: "Contact SuperAdmin to create new users"

**Usage**:
```typescript
import { ContactSuperAdminAlert } from './ContactSuperAdminAlert';

<ContactSuperAdminAlert 
  reason="insufficient_licenses" 
  onDismiss={() => setShowAlert(false)} 
/>
```

**Also includes**:
- `InlineContactSuperAdminMessage` - Compact version for dialogs

---

## Where Alerts Appear

### Full-Screen Blockers
- ✅ Entire app (via SubscriptionEnforcement wrapper in ProtectedRoute)
- Triggers: Any API call returns accountInactive/subscriptionInactive
- Effect: Complete system lockout except for SuperAdmin

### Dashboard Banners

#### SuperAdmin Dashboard
```
/components/SuperAdminDashboard.tsx
└─ DashboardView
   └─ <LicenseStatusBanner /> ← Shows license warnings
```

#### Admin Dashboard
```
/components/AdminDashboard.tsx
└─ main
   └─ <UserLicenseAlert /> ← Shows info about license-based access
```

#### Manager Dashboard
```
/components/ManagerDashboard.tsx
└─ main
   └─ <UserLicenseAlert /> ← Shows info about license-based access
```

#### Employee Dashboard
```
/components/EmployeeDashboard.tsx
└─ main
   └─ <UserLicenseAlert /> ← Shows info about license-based access
```

### License Management Page
```
/components/LicenseManagement.tsx
└─ License Info Card
   └─ "Sync User Licenses" button ← Activates/deactivates users
```

---

## User Journey Examples

### Journey 1: Employee Can't Access System

1. **Employee tries to log in**
   - Gets past authentication
   - Backend checks: User status = "inactive"
   - Backend throws "AccountInactive" error

2. **Full-screen alert appears**:
   ```
   ⚠️ Your account has been deactivated
   
   Your organization has insufficient user licenses
   
   📞 What to do:
   1. Contact your SuperAdmin immediately
   2. Request them to purchase additional licenses
   3. Once payment is complete, access will be restored
   
   🚫 You cannot access the system until SuperAdmin purchases licenses
   ```

3. **Employee contacts SuperAdmin**
   - Emails/calls SuperAdmin
   - SuperAdmin goes to License Management
   - Purchases 5 more licenses

4. **SuperAdmin clicks "Sync User Licenses"**
   - Backend activates oldest inactive users
   - Employee's status changes to "active"

5. **Employee refreshes page**
   - Access restored automatically
   - Can now use system normally

---

### Journey 2: Admin Tries to Create User

1. **Admin clicks "Create User"**
   - Opens create user dialog
   - Fills in details
   - Clicks "Create"

2. **Backend returns error**:
   ```json
   {
     "error": "Only SuperAdmin can create new users",
     "needsSuperAdmin": true
   }
   ```

3. **Alert shows in dialog**:
   ```
   🚫 Cannot Create User - No Licenses Available
   
   User creation is blocked
   
   Your organization has reached its license limit.
   Only SuperAdmin can create new users.
   
   📞 Action Required:
   1. Contact your SuperAdmin immediately
   2. Request them to purchase additional user licenses
   3. Once purchased, SuperAdmin can create new users
   ```

4. **Admin contacts SuperAdmin**
   - SuperAdmin purchases licenses
   - SuperAdmin creates the user
   - Admin can then manage the new user

---

### Journey 3: Subscription Expires

1. **Auto-renewal fails** (card declined)
   - Subscription status → "inactive"
   - Webhook triggers status update

2. **All non-SuperAdmin users locked out**
   - Next API call returns "SubscriptionInactive"
   - Full-screen blocker appears

3. **Users see**:
   ```
   🔒 System-Wide Access Suspended
   
   The organization's subscription is inactive.
   All system functions are disabled.
   
   💳 URGENT ACTION NEEDED:
   ✓ Contact SuperAdmin immediately
   ✓ Ask them to renew the subscription
   ✓ Payment must be completed to unlock system
   
   ⏰ System will remain locked until SuperAdmin completes payment
   ```

4. **Multiple users contact SuperAdmin**
   - SuperAdmin logs in (has access)
   - Sees critical banner: "No Active Subscription"
   - Clicks "Purchase Licenses Now"

5. **SuperAdmin completes payment**
   - Payment succeeds
   - Subscription status → "active"
   - All users automatically regain access

---

## Alert Styling & UX

### Color Coding
- 🔵 **Blue** - Informational, action steps
- 🟡 **Yellow** - Warnings, approaching limits
- 🔴 **Red** - Critical, urgent action required
- 🟢 **Green** - Success, active status

### Typography
- **Extra Large** - Critical messages (2xl font, bold)
- **Large** - Section headers (lg font, semibold)
- **Medium** - Body text (sm font, regular)
- **Small** - Fine print, notes (xs font)

### Icons
- 🔒 Lock - Account locked/inactive
- 💳 CreditCard - Payment required
- 👥 Users - License-related
- ⚠️ AlertTriangle - Warning
- ⏰ Clock - Time-sensitive
- 📞 Phone - Contact action

### Animations
- **Pulse** - Critical alerts (no subscription)
- **Fade-in** - New alerts appearing
- **Slide-in** - Error messages

### Accessibility
- ✅ High contrast colors
- ✅ Large touch targets (buttons ≥44px)
- ✅ Clear hierarchy (headings, lists)
- ✅ Descriptive icons
- ✅ Action-oriented language

---

## Backend Integration

### Error Flags in API Responses

```typescript
// When backend detects issue
return c.json({ 
  error: "No active subscription",
  subscriptionInactive: true 
}, 403);

return c.json({ 
  error: "Your account is inactive",
  accountInactive: true 
}, 403);

return c.json({ 
  error: "No available licenses",
  needsLicenses: true,
  usedLicenses: 10,
  purchasedLicenses: 10
}, 403);
```

### Frontend Catches Flags

```typescript
// In api-client.tsx
if (!res.ok) {
  const error: any = new Error(data.error);
  error.accountInactive = data.accountInactive;
  error.subscriptionInactive = data.subscriptionInactive;
  error.needsLicenses = data.needsLicenses;
  throw error;
}
```

### Component Displays Alert

```typescript
// In SubscriptionEnforcement.tsx
catch (error: any) {
  if (error.accountInactive) {
    // Show account inactive screen
  }
  if (error.subscriptionInactive) {
    // Show subscription inactive screen
  }
}
```

---

## Toast Notifications

### When to Show Toasts

1. **License sync complete**
   ```typescript
   toast.success(
     `License sync complete! Activated: 3, Deactivated: 1`
   );
   ```

2. **Payment successful**
   ```typescript
   toast.success('Payment successful! Licenses activated.');
   ```

3. **Payment failed**
   ```typescript
   toast.error('Payment failed. Please update your payment method.');
   ```

4. **User creation blocked**
   ```typescript
   toast.error('Cannot create user. Contact SuperAdmin for more licenses.');
   ```

---

## Testing Checklist

### Manual Testing

- [ ] Deactivate user, try to log in → See "Account Inactive" screen
- [ ] Expire subscription → Non-SuperAdmin users see "Subscription Inactive"
- [ ] SuperAdmin sees dashboard banner when no subscription
- [ ] SuperAdmin sees warning when licenses < 3
- [ ] Admin/Manager/Employee see info banner on dashboards
- [ ] Try to create user without licenses → See error message
- [ ] Click "Sync User Licenses" → Toast shows results
- [ ] Purchase licenses → Banner updates
- [ ] Renew subscription → Users regain access

### Automated Testing

```typescript
// Test subscription enforcement
test('shows inactive screen when subscription expired', async () => {
  // Mock API to return subscriptionInactive
  // Render component
  // Expect to see "Subscription Inactive" message
});

// Test license banner
test('shows warning when licenses low', async () => {
  // Mock license info with availableLicenses = 2
  // Render LicenseStatusBanner
  // Expect to see "Running Low" message
});
```

---

## Files Modified

### Created:
- `/components/SubscriptionEnforcement.tsx` - Full-screen blockers
- `/components/LicenseStatusBanner.tsx` - Dashboard banners
- `/components/ContactSuperAdminAlert.tsx` - Reusable alerts
- `/USER_ALERTS_IMPLEMENTATION.md` - This guide

### Modified:
- `/components/ProtectedRoute.tsx` - Added SubscriptionEnforcement wrapper
- `/components/SuperAdminDashboard.tsx` - Added LicenseStatusBanner
- `/components/AdminDashboard.tsx` - Added UserLicenseAlert
- `/components/ManagerDashboard.tsx` - Added UserLicenseAlert
- `/components/EmployeeDashboard.tsx` - Added UserLicenseAlert
- `/components/LicenseManagement.tsx` - Added sync button
- `/lib/api-client.tsx` - Enhanced error handling
- `/supabase/functions/server/index.tsx` - Enhanced auth middleware

---

## Summary

### What Users See

**SuperAdmin**:
- ✅ Critical banners when no subscription/low licenses
- ✅ "Sync User Licenses" button to manage activation
- ✅ Real-time license counts
- ✅ Action buttons to purchase licenses

**Admin/Manager**:
- ✅ Info banner explaining license-based access
- ✅ Clear error when trying to create users
- ✅ Full lockout if subscription expires
- ✅ Instructions to contact SuperAdmin

**Employee**:
- ✅ Info banner explaining license-based access
- ✅ Full lockout if account inactive
- ✅ Full lockout if subscription expires
- ✅ Clear instructions on what to do

### Key Messages

1. **"Contact your SuperAdmin immediately"** - Repeated throughout
2. **"Purchase licenses to restore access"** - Clear call to action
3. **"Automatic restoration after payment"** - Reassures users
4. **"Only SuperAdmin can..."** - Sets expectations clearly

### Design Principles

- 🎯 **Clarity** - No technical jargon, plain language
- 🚀 **Action-Oriented** - Always tell users what to do next
- 📱 **Responsive** - Works on all screen sizes
- ⚡ **Immediate** - Alerts show instantly when issues occur
- ✅ **Reassuring** - Explains that access restores automatically

**All alerts guide users to the same solution: Contact SuperAdmin to purchase licenses! 💳**

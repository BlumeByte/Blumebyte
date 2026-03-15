# Paystack Subscription Integration Guide

## Overview

Your BlumeByte HR system now includes a **complete subscription billing system** integrated with **Paystack**, the leading payment gateway for Africa. SuperAdmins are required to maintain an active subscription to access the system.

---

## 🔑 Configuration

### Paystack API Keys

You've successfully added your Paystack keys to Supabase Edge Functions secrets:

- `PAYSTACK_SECRET_KEY` - Used for server-side API calls (transaction initialization, verification)
- `PAYSTACK_PUBLIC_KEY` - Reserved for future client-side features

These keys are automatically loaded in the backend via `Deno.env.get()`.

### Webhook URL (Optional but Recommended)

For automated payment verification, configure this webhook URL in your Paystack Dashboard:

```
https://[your-project-id].supabase.co/functions/v1/make-server-a35148f0/subscription/webhook
```

**To configure:**
1. Log in to [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to **Settings** → **Webhooks**
3. Add the webhook URL above
4. The system will automatically verify payments via webhook

---

## 💰 Pricing Model

### Monthly Plan
- **$5 per user/month**
- Billed every 30 days
- Flexible cancellation
- All features included

### Yearly Plan (20% Discount)
- **$4 per user/month** (billed annually: $48/user/year)
- Save $12 per user per year
- Billed every 365 days
- All features included

### User Count Includes:
- ✅ SuperAdmin (you)
- ✅ Admins
- ✅ Managers
- ✅ Employees

**Example:** If you have 1 SuperAdmin + 2 Admins + 5 Managers + 20 Employees = **28 users**
- Monthly: 28 × $5 = **$140/month**
- Yearly: 28 × $48 = **$1,344/year** (saves $336)

---

## 🚀 How It Works

### 1. Login Flow
```
SuperAdmin logs in
    ↓
SubscriptionGuard checks subscription status
    ↓
If expired/missing → Redirect to /subscription
    ↓
If active → Access dashboard
```

### 2. Subscription Flow
```
1. SuperAdmin selects plan (Monthly/Yearly)
2. System calculates total cost based on user count
3. Click "Pay with Paystack"
4. Redirect to Paystack payment page
5. Complete payment with card/bank transfer/USSD
6. Redirect back to /payment-verify
7. System verifies payment with Paystack API
8. Subscription activated for 30/365 days
9. Redirect to dashboard
```

### 3. Subscription Expiry
```
System checks subscription on every dashboard access
    ↓
If expired:
  - Deactivate all accounts
  - Redirect SuperAdmin to /subscription
  - Block all other users from logging in
    ↓
SuperAdmin renews subscription
    ↓
All accounts reactivated immediately
```

---

## 📊 Technical Implementation

### Frontend Components

#### `/components/SubscriptionPage.tsx`
- Displays current subscription status
- Shows user count and calculates pricing
- Allows plan selection (Monthly/Yearly)
- Initiates Paystack payment
- Features:
  - Real-time user count
  - Pricing calculator
  - Plan comparison
  - Days remaining indicator
  - Expiry warnings

#### `/components/PaymentVerification.tsx`
- Handles return from Paystack payment page
- Verifies payment reference
- Shows success/failure status
- Auto-redirects to dashboard on success

#### `/components/SubscriptionGuard.tsx`
- Middleware component that wraps all dashboards
- Checks subscription status before rendering
- Redirects to /subscription if expired
- Only SuperAdmin subscriptions are checked (other roles are covered)

### Backend Routes

#### `GET /subscription/user-count`
- **Auth:** SuperAdmin only
- Returns total count of all users in the system
- Used for pricing calculation

#### `GET /subscription/status`
- **Auth:** All roles
- Returns subscription details:
  - `status`: 'active' | 'expired' | 'none'
  - `plan`: 'monthly' | 'yearly'
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `daysRemaining`: Number
  - `userCount`: Number
  - `amount`: Number

#### `POST /subscription/initialize`
- **Auth:** SuperAdmin only
- **Body:**
  ```json
  {
    "plan": "monthly" | "yearly",
    "userCount": number,
    "amount": number
  }
  ```
- **Returns:**
  ```json
  {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "SUB_user-id_timestamp"
  }
  ```
- Validates pricing
- Initializes Paystack transaction
- Stores pending subscription in KV store

#### `POST /subscription/verify`
- **Auth:** All authenticated users
- **Body:**
  ```json
  {
    "reference": "SUB_user-id_timestamp"
  }
  ```
- Verifies payment with Paystack API
- Validates amount matches
- Activates subscription for 30/365 days
- Cleans up pending transaction
- Logs audit trail

#### `POST /subscription/webhook` (Webhook Handler)
- **Auth:** Paystack signature verification
- Handles automated payment notifications
- Verifies webhook signature with HMAC-SHA512
- Activates subscription on `charge.success` event
- Provides redundancy to manual verification

### Data Storage (KV Store)

#### `subscription:{userId}`
```typescript
{
  userId: string;
  plan: 'monthly' | 'yearly';
  userCount: number;
  amount: number;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  status: 'active' | 'expired';
  paymentReference: string;
  paystackData: {
    transactionId: number;
    paidAt: string;
  };
  createdAt: string;
}
```

#### `pending-subscription:{reference}`
```typescript
{
  userId: string;
  plan: 'monthly' | 'yearly';
  userCount: number;
  amount: number;
  reference: string;
  status: 'pending';
  createdAt: string;
}
```

---

## 🔒 Security Features

### 1. Server-Side Validation
- All pricing calculations verified on server
- Amount mismatch prevents activation
- Plan validation (only monthly/yearly allowed)

### 2. Paystack Verification
- Dual verification: Manual + Webhook
- Transaction status checked with Paystack API
- Amount verified against expected price

### 3. Webhook Security
- HMAC-SHA512 signature verification
- Rejects requests with invalid signatures
- Prevents unauthorized activations

### 4. Role-Based Access
- Only SuperAdmin can view subscription page
- Other roles automatically covered under SuperAdmin subscription
- Subscription status checked on every dashboard access

### 5. Audit Logging
- All subscription actions logged
- Payment initialization tracked
- Activation/renewal recorded with full details

---

## 🎯 User Experience

### For SuperAdmin

#### First Login (No Subscription)
1. Login successful
2. Redirected to `/subscription`
3. See user count and pricing
4. Select plan and pay
5. Return from Paystack → verification page
6. Redirected to dashboard

#### Subscription Active
1. Login successful
2. Direct access to dashboard
3. See subscription status in UI
4. Warning when < 7 days remaining

#### Subscription Expired
1. Login successful
2. Redirected to `/subscription`
3. See "Expired" status
4. Must renew to access system

### For Other Roles (Admin/Manager/Employee)

#### SuperAdmin Subscription Active
- Normal login and access
- All features available

#### SuperAdmin Subscription Expired
- Login blocked at SubscriptionGuard
- Redirected to login page
- Cannot access system until SuperAdmin renews

---

## 📈 Subscription Lifecycle

### Activation
```
Payment successful
    ↓
startDate = now
endDate = now + 30 days (monthly) or + 365 days (yearly)
status = 'active'
    ↓
Store in KV: subscription:{userId}
    ↓
Log audit trail
    ↓
User gains access
```

### Renewal
- Same process as activation
- New startDate and endDate calculated
- Previous subscription data overwritten
- User count recalculated at payment time

### Expiry
```
Current time > endDate
    ↓
SubscriptionGuard detects expiry
    ↓
SuperAdmin → Redirect to /subscription
Other roles → Access blocked
    ↓
All features deactivated
    ↓
Awaiting renewal
```

---

## 🧪 Testing

### Test Mode
Paystack provides test keys for development:

1. Get test keys from [Paystack Dashboard](https://dashboard.paystack.com) (Settings → API Keys & Webhooks)
2. Replace `PAYSTACK_SECRET_KEY` in Supabase secrets
3. Use test cards:
   - **Success:** 4084084084084081
   - **Insufficient Funds:** 4084080000000408
   - **Invalid CVV:** 5060666666666666666

### Test Scenarios

#### Happy Path
1. Login as SuperAdmin
2. Select monthly plan
3. Pay with test card `4084084084084081`
4. Verify success message
5. Check dashboard access
6. Verify subscription status shows "Active"

#### Payment Failure
1. Select plan
2. Pay with failed card `4084080000000408`
3. Verify error handling
4. Confirm subscription not activated

#### Expiry Simulation
1. Manually edit KV store: `subscription:{userId}`
2. Set `endDate` to past date
3. Refresh dashboard
4. Verify redirect to subscription page

---

## 🛠 Maintenance

### Check Subscription Status
```typescript
// Via backend
GET /subscription/status

// Returns:
{
  "status": "active",
  "plan": "monthly",
  "endDate": "2026-04-08T...",
  "daysRemaining": 25
}
```

### Manual Subscription Extension (Emergency)
```typescript
// Via KV store direct access
const subscription = await kv.get('subscription:user-id');
subscription.endDate = new Date('2027-01-01').toISOString();
await kv.set('subscription:user-id', subscription);
```

### View Payment History
```typescript
// Check audit logs for subscription-related actions
const logs = await kv.getByPrefix('audit:');
const subscriptionLogs = logs.filter(log => 
  log.resourceType === 'subscription' || 
  log.resourceType === 'subscription-payment'
);
```

---

## ❓ FAQ

### Q: What happens if I add new users mid-subscription?
**A:** The current subscription remains valid. New users added will be included in the count when you renew. You can renew early to update the user count if needed.

### Q: Can I downgrade from yearly to monthly?
**A:** Yes, when your current subscription expires, simply select the monthly plan. You cannot switch mid-subscription.

### Q: What if payment fails?
**A:** The subscription status remains as-is. If expired, access remains blocked until successful payment.

### Q: How do I cancel?
**A:** Simply don't renew when the subscription expires. Access will be blocked at expiry.

### Q: Can employees pay for their own access?
**A:** No, only the SuperAdmin manages the subscription for the entire organization.

### Q: What currencies does Paystack support?
**A:** NGN (Nigerian Naira), GHS (Ghanaian Cedi), ZAR (South African Rand), and USD. Configure in your Paystack dashboard.

### Q: Is my payment information secure?
**A:** Yes! Payment is processed entirely on Paystack's secure servers. No card details touch your server.

---

## 🎉 Success!

Your Paystack subscription system is now fully configured and ready to use! 

**Next Steps:**
1. Test with Paystack test keys
2. Switch to live keys when ready for production
3. Configure webhook URL for automated verification
4. Monitor subscription status in the SuperAdmin dashboard

---

**Need help?** 
- Paystack Documentation: https://paystack.com/docs
- Paystack Support: support@paystack.com

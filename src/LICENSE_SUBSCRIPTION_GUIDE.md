# License-Based Subscription System - Complete Guide

## 🎯 Overview

Your BlumeByte HR system now uses a **license-based subscription model** with the following features:

✅ Pre-purchase user licenses (slots)  
✅ Only SuperAdmin can create users  
✅ Admin/Manager/HR can only edit existing users  
✅ Automatic card storage for renewals  
✅ Auto-renewal at subscription expiry  
✅ Payment failure handling with card update prompts  
✅ Real-time license tracking  

---

## 💡 How It Works

### License Model

Instead of billing for all users at the end of the month, SuperAdmins now:

1. **Purchase licenses upfront** - Buy X number of user slots
2. **Create users within license limit** - Can only create users if licenses are available
3. **Auto-renewal** - Subscription automatically renews using saved card
4. **Add more licenses anytime** - Purchase additional licenses when needed

### Pricing

- **Monthly Plan**: $5 per license/month
- **Yearly Plan**: $48 per license/year ($4/month - Save 20%)

**Example:**
- Purchase 20 licenses (monthly) = $100/month
- Can create up to 20 users (SuperAdmin, Admin, Manager, Employee)
- Need more users? Purchase more licenses

---

## 🔐 Access Control

### SuperAdmin
- ✅ Can create new users (if licenses available)
- ✅ Can edit existing users
- ✅ Can delete users
- ✅ Can purchase more licenses
- ✅ Manages billing and subscription

### Admin / Manager / HR
- ❌ **Cannot create new users**
- ✅ Can edit existing users
- ✅ Can delete users
- 💡 Must ask SuperAdmin to purchase licenses for new users

### Employees
- ❌ Cannot create users
- ✅ Can view their own profile
- ✅ Can edit allowed fields (if permissions granted)

---

## 📊 User Creation Flow

### Before (Old Model)
```
Admin clicks "Add User"
  ↓
Fill form
  ↓
User created
  ↓
Bill for user at month end
```

### Now (License Model)
```
SuperAdmin clicks "Add User"
  ↓
System checks: Available licenses > 0?
  ↓
  ├─ YES → Allow user creation
  │         ↓
  │         Fill form → User created
  │
  └─ NO → Show "Buy More Licenses" dialog
            ↓
            Select # of licenses
            ↓
            Pay with Paystack
            ↓
            Licenses added → Now can create user
```

### Admin/Manager tries to create user:
```
Admin clicks "Add User"
  ↓
System blocks:
"Only SuperAdmin can create users.
Please contact your SuperAdmin to purchase more licenses."
```

---

## 💳 Payment & Card Storage

### Initial Purchase

1. SuperAdmin logs in
2. Redirected to License Management page (no licenses)
3. Selects number of licenses (e.g., 10)
4. Selects plan (Monthly or Yearly)
5. Checks "Save card for auto-renewal" ✅
6. Clicks "Purchase Licenses"
7. Redirected to Paystack
8. Completes payment
9. Card details saved securely by Paystack
10. Licenses activated

### Saved Card Information

Paystack stores:
- Authorization code (for charging)
- Card last 4 digits
- Expiry date
- Card brand (Visa, Mastercard, etc.)
- Bank name

**Security:** Card details never touch your server. Paystack handles all PCI compliance.

---

## 🔄 Auto-Renewal Process

### When Subscription Expires

```
Day 30 (or Day 365) arrives
  ↓
System detects expiry
  ↓
Checks: Card saved?
  ↓
  ├─ YES → Auto-charge saved card
  │         ↓
  │         ├─ SUCCESS → Extend subscription 30/365 days
  │         │            ↓
  │         │            Users continue access
  │         │
  │         └─ FAILURE → Show payment failure warning
  │                      ↓
  │                      "Update your payment method"
  │                      ↓
  │                      Block access until payment succeeds
  │
  └─ NO → Prompt to add payment method
            ↓
            Block access until payment succeeds
```

### Auto-Renewal Implementation

The system attempts auto-renewal via:
- **POST `/subscription/auto-renew`**
- Uses Paystack's `charge_authorization` API
- Charges the saved card
- Extends subscription on success
- Logs failure and notifies SuperAdmin on failure

---

## 🚨 Payment Failure Handling

### When Auto-Renewal Fails

**Reasons for failure:**
- Insufficient funds
- Card expired
- Card blocked/cancelled
- Bank declined transaction

**What happens:**
1. System logs the failure
2. Subscription status → "expired"
3. SubscriptionGuard blocks all users
4. SuperAdmin sees warning:
   ```
   ⚠️ Auto-renewal failed
   
   Your payment method was declined.
   Please update your card to restore access.
   
   [Update Payment Method]
   ```

### Updating Payment Method

SuperAdmin can:
1. Click "Update Payment Method"
2. Purchase new licenses (which saves new card)
3. Or manually renew with new card

---

## 📈 License Usage Tracking

### Real-Time Dashboard

SuperAdmin sees:
- **Purchased Licenses**: Total licenses owned
- **Used Licenses**: Current user count
- **Available Licenses**: Purchased - Used
- **Utilization %**: Visual progress bar

**Example:**
```
Purchased: 50
Used: 42
Available: 8
Utilization: 84%
```

### Low License Warning

When available licenses < 3:
```
⚠️ You're running low on licenses!
Purchase more to add new users.
```

When available licenses = 0:
```
🚫 No licenses available.
You must purchase more licenses to add new users.
```

---

## 🛠 Backend API Routes

### License Management

#### `GET /subscription/license-info`
**Auth:** SuperAdmin only

**Response:**
```json
{
  "purchasedLicenses": 50,
  "usedLicenses": 42,
  "availableLicenses": 8,
  "plan": "monthly",
  "endDate": "2026-04-08T...",
  "status": "active",
  "cardSaved": true,
  "cardLast4": "4081",
  "cardExpiry": "12/2028",
  "cardBrand": "Visa"
}
```

#### `GET /subscription/can-create-user`
**Auth:** All roles

**Response (SuperAdmin with licenses):**
```json
{
  "canCreate": true,
  "availableLicenses": 8,
  "purchasedLicenses": 50,
  "usedLicenses": 42
}
```

**Response (Admin/Manager):**
```json
{
  "canCreate": false,
  "reason": "Only SuperAdmin can create users. Please contact your SuperAdmin."
}
```

**Response (SuperAdmin without licenses):**
```json
{
  "canCreate": false,
  "reason": "No available licenses. Purchase more licenses to add users.",
  "needsLicenses": true,
  "purchasedLicenses": 10,
  "usedLicenses": 10
}
```

#### `POST /subscription/purchase-licenses`
**Auth:** SuperAdmin only

**Request:**
```json
{
  "licenses": 10,
  "plan": "monthly",
  "amount": 50,
  "saveCard": true
}
```

**Response:**
```json
{
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "...",
  "reference": "LIC_user-id_timestamp"
}
```

#### `POST /subscription/verify-license`
**Auth:** All authenticated

**Request:**
```json
{
  "reference": "LIC_user-id_timestamp"
}
```

**Response:**
```json
{
  "success": true,
  "licensesAdded": 10,
  "totalLicenses": 60,
  "plan": "monthly",
  "message": "Licenses purchased successfully"
}
```

#### `POST /subscription/auto-renew`
**Auth:** SuperAdmin only

**Response (Success):**
```json
{
  "success": true,
  "message": "Subscription renewed successfully",
  "endDate": "2026-05-08T..."
}
```

**Response (Failure):**
```json
{
  "success": false,
  "message": "Auto-renewal failed. Please update your payment method.",
  "needsCardUpdate": true
}
```

---

## 🎨 Frontend Components

### `/components/LicenseManagement.tsx`
Main license management interface showing:
- Current license usage
- Purchase more licenses form
- Plan selection
- Card save option
- Payment initialization

### `/components/LicensePaymentVerification.tsx`
Handles Paystack payment callback for license purchases:
- Verifies payment
- Shows success/failure
- Displays license information
- Redirects to dashboard

### `/components/SubscriptionBadge.tsx`
Real-time subscription status indicator in header:
- Green "Active" badge
- Yellow "X days left" warning
- Red "Expired" alert
- Clickable for details

### `/components/SubscriptionGuard.tsx`
Middleware protecting all dashboards:
- Checks subscription status
- Redirects to `/subscription` if expired
- Only checks SuperAdmin subscription

### `/components/SubscriptionPage.tsx`
Initial subscription/license purchase page:
- Shows LicenseManagement component
- Logout button
- Minimal, focused interface

---

## 🔍 User Creation Integration

###Before creating a user (Frontend):

```typescript
// Check if can create user
const response = await api.get('/subscription/can-create-user');
const data = await response.json();

if (!data.canCreate) {
  if (data.needsLicenses) {
    // Show "Buy More Licenses" dialog
    showLicenseDialog({ requiredLicenses: 1 });
  } else {
    // Show error message
    toast.error(data.reason);
  }
  return;
}

// Proceed with user creation
```

### Example Implementation:

```typescript
const handleCreateUser = async (userData) => {
  // 1. Check license availability
  const checkResponse = await api.get('/subscription/can-create-user');
  const checkData = await checkResponse.json();
  
  if (!checkData.canCreate) {
    if (checkData.needsLicenses) {
      setShowLicenseModal(true);
      setRequiredLicenses(1); // Need at least 1 more license
      return;
    } else {
      toast.error(checkData.reason);
      return;
    }
  }
  
  // 2. Create user (has available licenses)
  const createResponse = await api.post('/employees', userData);
  
  if (createResponse.ok) {
    toast.success('User created successfully!');
    refreshUserList();
  }
};
```

---

## 📝 Data Storage (KV Store)

### `subscription:{userId}`

```typescript
{
  userId: string;
  purchasedLicenses: number;        // Total licenses owned
  plan: 'monthly' | 'yearly';
  startDate: string;                // ISO date
  endDate: string;                  // ISO date
  status: 'active' | 'expired';
  lastPaymentDate: string;
  lastPaymentAmount: number;
  lastPaymentReference: string;
  cardAuthorization?: {             // Saved card for auto-renewal
    authorizationCode: string;      // Paystack auth code
    bin: string;
    last4: string;
    expMonth: string;
    expYear: string;
    cardType: string;
    bank: string;
    brand: string;
  };
}
```

### `pending-license:{reference}`

```typescript
{
  userId: string;
  plan: 'monthly' | 'yearly';
  licenses: number;
  amount: number;
  saveCard: boolean;
  reference: string;
  status: 'pending';
  createdAt: string;
}
```

---

## 🧪 Testing Guide

### Test Scenario 1: First License Purchase

1. Login as SuperAdmin
2. Should redirect to `/subscription` (no licenses)
3. Enter number of licenses (e.g., 10)
4. Select Monthly plan
5. Check "Save card for auto-renewal"
6. Click "Purchase 10 Licenses"
7. Use Paystack test card: `4084084084084081`
8. Complete payment
9. Verify:
   - Licenses added: 10
   - Card saved: Yes
   - Can now create users

### Test Scenario 2: User Creation with Licenses

1. Navigate to User Management
2. Click "Add User"
3. System allows creation (has available licenses)
4. Fill form and submit
5. User created successfully
6. Check license usage updated (Used += 1)

### Test Scenario 3: User Creation Without Licenses

1. Create users until all licenses used
2. Try to create one more user
3. Should show: "Buy More Licenses" dialog
4. Purchase additional licenses
5. Return to user creation
6. Now allowed to create user

### Test Scenario 4: Admin Cannot Create User

1. Login as Admin
2. Navigate to User Management
3. Click "Add User"
4. Should show error:
   "Only SuperAdmin can create users. Please contact your SuperAdmin."

### Test Scenario 5: Auto-Renewal Success

1. Manually set subscription `endDate` to yesterday
2. Trigger auto-renewal: `POST /subscription/auto-renew`
3. Verify:
   - Payment successful
   - `endDate` extended 30/365 days
   - Status remains "active"

### Test Scenario 6: Auto-Renewal Failure

1. Use expired test card
2. Trigger auto-renewal
3. Verify:
   - Payment fails
   - Status → "expired"
   - SuperAdmin sees warning
   - Access blocked until payment

---

## 🎯 Key Differences from Old Model

| Feature | Old Model | New License Model |
|---------|-----------|-------------------|
| **User Creation** | Any admin can create | Only SuperAdmin |
| **Billing** | Count users, bill monthly | Pre-purchase licenses |
| **Payment** | Manual each month | Auto-renewal with saved card |
| **User Limit** | No limit | Limited by purchased licenses |
| **Adding Users** | Instant | Requires available license |
| **Card Storage** | No | Yes (for auto-renewal) |
| **Payment Failures** | Manual follow-up | Automatic retry + prompts |

---

## ✅ Benefits

### For SuperAdmin
- **Predictable costs** - Know exactly how much you're paying
- **Better control** - Manage who creates users
- **Auto-renewal** - Set it and forget it
- **Flexibility** - Buy more licenses anytime

### For Organization
- **Prevents surprise bills** - Can't accidentally create 100 users
- **Forces planning** - Must think about user needs upfront
- **Better resource management** - Track license utilization

### For Security
- **Centralized control** - Only SuperAdmin manages billing
- **Audit trail** - All license purchases logged
- **Card security** - Paystack PCI compliance

---

## 🚀 Next Steps

1. **Initial Setup:**
   - Login as SuperAdmin
   - Purchase initial licenses (estimate your user count)
   - Enable auto-renewal
   
2. **Create Users:**
   - Add users within license limit
   - Monitor license usage

3. **Monitor & Adjust:**
   - Check license utilization regularly
   - Purchase more licenses when needed (before running out)

4. **Set Reminders:**
   - Review subscription 7 days before expiry
   - Ensure card is valid
   - Plan for growth

---

## 📞 FAQ

### Q: What happens if I run out of licenses mid-month?
**A:** You can purchase more licenses anytime. They're added immediately and billed for the remaining period.

### Q: Can I downgrade licenses?
**A:** No automatic downgrade. When you renew, you can choose to purchase fewer licenses.

### Q: What if my card expires?
**A:** System will attempt auto-renewal and fail. You'll see a prompt to update payment method. Access blocked until payment succeeds.

### Q: Can Admin purchase licenses?
**A:** No, only SuperAdmin can manage billing and purchase licenses.

### Q: What if I delete a user?
**A:** The license becomes available again. You can create a new user with that license.

### Q: How do I cancel my subscription?
**A:** Don't renew when it expires. All access will be blocked after expiry date.

### Q: Can I switch from monthly to yearly mid-cycle?
**A:** When you purchase more licenses, you can choose a different plan. Your subscription will update accordingly.

---

**Need Help?**  
Check `/PAYSTACK_SUBSCRIPTION_GUIDE.md` for Paystack-specific documentation.

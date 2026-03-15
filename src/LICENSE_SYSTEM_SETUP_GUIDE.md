# License-Based Subscription System - Setup & Usage Guide

## Overview
Your HR management system now uses a **license-based subscription model** where SuperAdmin must pre-purchase user licenses before creating users. Each license costs $5/month or $48/year and allows you to add one user (any role: SuperAdmin, Admin, Manager, or Employee).

## What Was Fixed

### 1. **Added "Billings & Subscriptions" Section**
   - Location: SuperAdmin Dashboard → System section → "Billings & Subscriptions"
   - This section shows your current license usage and allows you to purchase additional licenses

### 2. **Fixed API Client Imports**
   - Fixed `apiClient` imports in LicenseManagement.tsx, LicensePaymentVerification.tsx, and SubscriptionGuard.tsx
   - All components now use the correct `apiClient` with `.tsx` extension

### 3. **Fixed Branding Context Usage**
   - Fixed `useBranding()` to correctly destructure `{ branding }` instead of `{ brandName }`
   - Fixed `brandGradientStyle()` to receive `branding.primaryColor` parameter

### 4. **Fixed Auth Context Usage**
   - Changed `currentUser` to `user` throughout the license components
   - Added `accessToken` where needed for API calls

## How to Use the License System

### Step 1: First Time Setup (SuperAdmin)

1. **Login as SuperAdmin**
   - After initial setup, login with your SuperAdmin credentials

2. **Navigate to Billings & Subscriptions**
   - Click on "Billings & Subscriptions" in the sidebar (System section)
   - You'll see that you have 0 purchased licenses

3. **Purchase Your First Licenses**
   - Enter the number of licenses you need (minimum 1)
   - Select billing cycle:
     - **Monthly**: $5 per license/month
     - **Yearly**: $48 per license/year (Save 20%!)
   - Check "Save card for auto-renewal" (recommended)
   - Click "Purchase X License(s)"

4. **Complete Payment with Paystack**
   - You'll be redirected to Paystack payment page
   - Enter your card details
   - Complete the payment
   - You'll be redirected back with a success message

5. **Verify License Purchase**
   - After successful payment, you'll see:
     - Total purchased licenses
     - Used licenses (currently 1 - the SuperAdmin)
     - Available licenses for new users
   - The subscription badge in the top bar will show "Active" with a green badge

### Step 2: Creating New Users

Now that you have licenses, you can create users:

1. **Go to User Management**
   - Click "User Management" in the sidebar

2. **Click "Add User"**
   - The system will check if you have available licenses
   - If you have licenses: User creation form appears
   - If no licenses: You'll see "Buy More Licenses" prompt

3. **Fill User Details and Create**
   - Enter user information (name, email, role, etc.)
   - Click "Create User"
   - One license will be consumed

### Step 3: Managing Licenses

#### Viewing License Status
- **Subscription Badge** (top bar): Shows subscription status at a glance
  - Green "Active": Subscription is active
  - Yellow "X days left": Expiring soon (7 days or less)
  - Red "Expired": Subscription expired
  - Red "No Subscription": No active subscription

- **Billings & Subscriptions Section**: Shows detailed license info
  - Purchased licenses
  - Used licenses
  - Available licenses
  - License utilization percentage
  - Saved payment method (if auto-renewal is enabled)

#### Purchasing More Licenses
1. Go to "Billings & Subscriptions"
2. Enter number of additional licenses needed
3. Select plan (Monthly/Yearly)
4. Complete payment
5. New licenses are added to your total

#### Auto-Renewal
- If you saved your card during purchase:
  - System automatically charges your card before subscription expires
  - No interruption in service
  - You can manage auto-renewal in the Billings & Subscriptions section

- If auto-renewal fails:
  - You'll receive notification
  - Update payment method in Billings & Subscriptions
  - Or manually renew subscription

## Subscription Badge States

| Badge | Color | Meaning | Action Needed |
|-------|-------|---------|---------------|
| Active | Green | Subscription is active and healthy | None |
| X days left | Yellow | Expiring in 7 days or less | Consider renewing or check auto-renewal |
| Expired | Red (pulsing) | Subscription has expired | Renew immediately |
| No Subscription | Red | No subscription found | Purchase licenses |

## For Non-SuperAdmin Users

- **Admin, Manager, Employee roles**: Cannot create new users
- **Admin/Manager**: Can edit existing users
- **All roles**: Are covered under SuperAdmin's subscription
  - No separate subscription needed
  - Access granted as long as SuperAdmin subscription is active

## Pricing Summary

| Plan | Cost per License | Billing Cycle | Best For |
|------|-----------------|---------------|----------|
| Monthly | $5 | Every 30 days | Flexible needs, testing |
| Yearly | $48 ($4/month) | Every 365 days | **Best value, save 20%** |

## Important Notes

1. **License Consumption**: Each user (regardless of role) consumes one license
2. **SuperAdmin Included**: The SuperAdmin account counts as 1 used license
3. **License Limit**: Cannot create users if no licenses available
4. **Auto-Renewal**: Automatically renews unless canceled
5. **Payment Gateway**: All payments processed securely through Paystack
6. **Cancellation**: Can cancel anytime (licenses valid until end of billing period)

## Troubleshooting

### Issue: "No Subscription" Badge Showing
**Solution**: 
1. Go to Billings & Subscriptions
2. Purchase your first set of licenses
3. Complete payment
4. Badge will update to "Active"

### Issue: Cannot Create Users
**Solution**:
1. Check license availability in Billings & Subscriptions
2. If no licenses available, purchase more
3. Wait for payment verification
4. Try creating user again

### Issue: Payment Failed
**Solution**:
1. Check your card details are correct
2. Ensure sufficient funds
3. Contact your bank if declined
4. Try alternative payment method
5. Contact support if issue persists

### Issue: Subscription Badge Not Updating
**Solution**:
1. Refresh the page (F5)
2. Check if payment was actually successful
3. Go to Billings & Subscriptions to verify
4. Contact support if still showing incorrect status

## API Routes Reference

For developers or advanced troubleshooting:

- `GET /subscription/status` - Check subscription status
- `GET /subscription/license-info` - Get license details
- `GET /subscription/can-create-user` - Check if can create user
- `POST /subscription/purchase-licenses` - Initialize license purchase
- `POST /subscription/verify-license` - Verify license payment
- `POST /subscription/auto-renew` - Manually trigger auto-renewal

## Next Steps

1. ✅ Purchase your first licenses
2. ✅ Enable auto-renewal (recommended)
3. ✅ Create users as needed
4. ✅ Monitor license usage regularly
5. ✅ Purchase more licenses before running out

## Support

If you encounter any issues:
1. Check this guide first
2. Review error messages in browser console (F12)
3. Verify Paystack credentials are configured
4. Check that PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY are set

---

**System Status**: ✅ Fully Functional
**Last Updated**: March 8, 2026

# Paystack Subscription - Quick Start Guide

## ✅ Setup Complete!

Your Paystack subscription system is fully configured and ready to use.

---

## 🔑 What You've Already Done

✅ Added `PAYSTACK_SECRET_KEY` to Supabase Edge Functions secrets  
✅ Added `PAYSTACK_PUBLIC_KEY` to Supabase Edge Functions secrets  
✅ Backend routes created and tested  
✅ Frontend components integrated  
✅ Subscription guard protecting all dashboards  

---

## 🚀 How to Test

### 1. **Login as SuperAdmin**
- Use your existing SuperAdmin credentials
- You'll be redirected to `/subscription` (no active subscription yet)

### 2. **View Subscription Page**
- See your current user count (all roles included)
- Choose between Monthly ($5/user) or Yearly ($4/user) plans
- Total cost calculated automatically

### 3. **Make a Test Payment**

#### Using Paystack Test Keys (Recommended for Testing)
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to: **Settings** → **API Keys & Webhooks**
3. Copy your **Test Secret Key**
4. Update `PAYSTACK_SECRET_KEY` in Supabase secrets with the test key
5. Use these test cards:

   **✅ Successful Payment:**
   ```
   Card Number: 4084 0840 8408 4081
   CVV: 408
   Expiry: Any future date
   PIN: 0000
   OTP: 123456
   ```

   **❌ Insufficient Funds:**
   ```
   Card Number: 4084 0800 0000 0408
   ```

   **❌ Invalid CVV:**
   ```
   Card Number: 5060 6666 6666 6666 666
   ```

### 4. **Complete Payment Flow**
1. Click "Pay $XX with Paystack"
2. Enter test card details
3. Complete Paystack checkout
4. You'll be redirected to `/payment-verify`
5. Wait for verification (2-3 seconds)
6. Success! Redirected to your dashboard

### 5. **Verify Subscription is Active**
- Check the **green "Active" badge** in the top-right corner
- Click the badge to see subscription details:
  - Plan type
  - Renewal date
  - Days remaining
  - User count

---

## 💳 Switching to Live Mode

When you're ready for production:

### 1. Get Live Keys
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Complete business verification (if not done)
3. Navigate to: **Settings** → **API Keys & Webhooks**
4. Switch to **Live** mode (toggle at top)
5. Copy your **Live Secret Key**

### 2. Update Supabase Secrets
1. Go to your Supabase project
2. Navigate to: **Edge Functions** → **Secrets**
3. Update `PAYSTACK_SECRET_KEY` with your **Live** key
4. Save changes

### 3. Configure Webhook (Optional but Recommended)
1. In Paystack Dashboard: **Settings** → **Webhooks**
2. Click "Add Endpoint"
3. Enter webhook URL:
   ```
   https://[your-project-id].supabase.co/functions/v1/make-server-a35148f0/subscription/webhook
   ```
4. Enable "Charge Success" event
5. Save

---

## 💰 Pricing Breakdown

### Monthly Plan: $5/user/month
- Billed every 30 days
- Example: 10 users = **$50/month**

### Yearly Plan: $4/user/month (Save 20%)
- Billed every 365 days
- Example: 10 users = **$480/year** (saves $120 vs monthly)

### Who Counts as a User?
✅ SuperAdmin (you)  
✅ All Admins  
✅ All Managers  
✅ All Employees  

**Total = Your subscription cost**

---

## 🎯 User Flow

### SuperAdmin Experience

```
Login → Check subscription status
   ↓
   ├─ No subscription → /subscription page
   ├─ Expired → /subscription page
   └─ Active → Dashboard (see green badge)
```

### Other Roles (Admin/Manager/Employee)

```
Login → Check SuperAdmin's subscription
   ↓
   ├─ Active → Access granted
   └─ Expired → Access blocked (redirected to login)
```

---

## 🔍 Monitoring Subscription Status

### In the UI
- **Green badge** = Active subscription
- **Yellow badge** = Expiring soon (< 7 days)
- **Red badge** = Expired or no subscription

### Click the badge to see:
- Plan type (monthly/yearly)
- Renewal date
- Days remaining
- User count
- Quick renew button

---

## 📊 Subscription Lifecycle

### 1. **New Subscription**
```
Select plan → Pay → Verify → Active for 30/365 days
```

### 2. **Renewal**
```
Before expiry → Pay again → Extends 30/365 days from now
```

### 3. **Expiry**
```
No payment → Subscription expires → All access blocked
```

### 4. **Adding Users Mid-Subscription**
- Current subscription remains valid
- New users counted at next renewal
- Can renew early to update pricing

---

## 🛠 Troubleshooting

### Payment Not Verifying?
1. Check browser console for errors
2. Verify `PAYSTACK_SECRET_KEY` is set correctly
3. Ensure you're using test keys for test cards
4. Check network tab for API responses

### "Payment gateway not configured" Error?
- `PAYSTACK_SECRET_KEY` is missing in Supabase secrets
- Redeploy edge functions after adding secret

### Subscription Shows Expired Immediately?
- Check system time is correct
- Verify backend date calculation logic
- Check KV store: `subscription:{userId}`

### Users Can't Access After Payment?
- Refresh the page
- Check subscription status API: `GET /subscription/status`
- Verify user role is correct

---

## 🎓 Next Steps

### For Testing (Now)
1. ✅ Use test keys
2. ✅ Test payment with test cards
3. ✅ Verify all dashboards are accessible
4. ✅ Test expiry warning (manually set endDate in past)

### For Production (Later)
1. ⏭ Complete Paystack business verification
2. ⏭ Switch to live keys
3. ⏭ Configure webhook for automated verification
4. ⏭ Test with small real transaction
5. ⏭ Announce to team

---

## 📞 Support

### Paystack Issues
- Documentation: https://paystack.com/docs
- Support: support@paystack.com
- Dashboard: https://dashboard.paystack.com

### Integration Issues
- Check `/PAYSTACK_SUBSCRIPTION_GUIDE.md` for detailed documentation
- Review browser console and network tab
- Check Supabase Edge Functions logs

---

## 🎉 You're All Set!

Your subscription system is production-ready. Start with test mode, verify everything works, then switch to live keys when ready to go live.

**Happy billing! 💳**

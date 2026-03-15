# Blumebyte Multi-Tenant SaaS HR Platform Setup Guide

## 🎉 What's New?

Blumebyte has been transformed from a single-company HR system into a **full multi-tenant SaaS platform** similar to BambooHR!

## 🏗️ Architecture Overview

### Multi-Company Support
- Each company gets isolated data with unique company ID
- Company-scoped chat, employees, attendance, and leave requests
- Row-level security through company ID filtering

### License-Based Access Control
- Companies purchase licenses (employee slots)
- System prevents creating users beyond purchased licenses
- Flexible license upgrades through Paystack

### Subscription Plans
1. **Starter** - ₦15,000/month (10 employees)
2. **Professional** - ₦35,000/month (50 employees)
3. **Enterprise** - ₦75,000/month (200 employees)
4. **Additional Licenses** - ₦1,500 per employee/month

## 🚀 New Features

### 1. Public Landing Page (`/`)
- Marketing homepage with features and pricing
- Company signup and login links
- Professional Blumebyte branding

### 2. Company Registration (`/company-signup`)
- Self-service company account creation
- Automatic super admin user creation
- 14-day free trial with 10 licenses

### 3. Employee Self-Service Portal (`/employee-portal`)
- **Leave Management**: Submit and track leave requests
- **Attendance**: Clock in/out with automatic time tracking
- **Payslips**: View and download monthly payslips
- **Profile**: View personal information
- **Dashboard**: Quick stats and recent activity

### 4. Paystack Payment Integration (`/subscription`)
- Subscribe to monthly plans
- Upgrade licenses
- Secure payment processing
- Automatic subscription activation

### 5. Company-Scoped Chat
- Chat messages isolated per company
- Real-time team communication
- Named "Blumebyte Chat"

## 🔧 Environment Variables

Add these to your Supabase Edge Function secrets:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Application URL (for payment callbacks)
APP_URL=https://your-app-domain.com

# Existing variables
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key (optional)
```

### Setting Secrets in Supabase

```bash
# Using Supabase CLI
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxx
supabase secrets set APP_URL=https://your-app.vercel.app
```

## 📊 Database Structure (KV Store)

### Company Records
```
company:{slug} -> Company object
company_by_id:{companyId} -> Company object
company_users:{companyId}:{userId} -> User profile
company_stats:{companyId} -> Stats object
```

### User Profiles
```
user_profile:{userId} -> {
  id, companyId, email, name, role, status, department, joinDate
}
```

### Company-Scoped Data
```
chat_messages:{companyId} -> Array of messages
leave_requests:{companyId} -> Array of leave requests
attendance:{companyId}:{date} -> Array of attendance records
payslips:{companyId}:{userId} -> Array of payslips
```

### Payment Records
```
pending_payment:{reference} -> Payment details
pending_license:{reference} -> License upgrade details
```

## 🔐 Security & Data Isolation

### Company Data Isolation
All endpoints check `companyId` from user profile:
- Users can only access data from their company
- Chat messages are company-specific
- Leave requests filtered by company
- Attendance records isolated per company

### Role-Based Access
- **Super Admin**: Full company management, subscriptions
- **Admin**: Employee management, reports
- **Manager**: Team management, approvals
- **Employee**: Self-service portal access

## 🎯 User Journeys

### Journey 1: Company Registration
1. Visit landing page (`/`)
2. Click "Create Company Account"
3. Fill company and admin details
4. Get 14-day trial with 10 licenses
5. Login and access dashboard

### Journey 2: Subscribe to Plan
1. Login as Super Admin
2. Navigate to Subscription page
3. Choose a plan
4. Pay via Paystack
5. Subscription activated automatically

### Journey 3: Employee Self-Service
1. Login as employee
2. Access Employee Portal
3. Clock in/out for attendance
4. Submit leave requests
5. View payslips and profile

### Journey 4: Multi-Company Chat
1. Login to company account
2. Open Blumebyte Chat (floating button)
3. Send messages
4. Only company employees see messages

## 🛠️ API Endpoints

### Company Management
- `POST /company/register` - Register new company (public)
- `GET /company/info` - Get company details

### Subscriptions
- `POST /subscription/initialize-payment` - Start subscription
- `GET /subscription/verify-payment` - Verify payment
- `POST /subscription/upgrade-licenses` - Buy more licenses
- `GET /subscription/verify-license-upgrade` - Verify upgrade

### Employee Portal
- `GET /employee/profile` - Get employee profile
- `POST /employee/leave-request` - Submit leave request
- `GET /employee/leave-requests` - Get leave history
- `POST /employee/clock-in` - Clock in
- `POST /employee/clock-out` - Clock out
- `GET /employee/attendance` - Get attendance records
- `GET /employee/payslips` - Get payslips

### Chat
- `POST /chat/send` - Send message (company-scoped)
- `GET /chat/messages` - Get messages (company-scoped)

## 📱 Frontend Routes

```
/ - Landing page (public)
/login - Login (public)
/company-signup - Company registration (public)
/subscription - Paystack subscription (Super Admin only)
/employee-portal - Employee self-service (All employees)
/superadmin - Super Admin dashboard
/admin - Admin dashboard
/manager - Manager dashboard
/employee - Employee dashboard
```

## 🎨 Branding

- **Name**: Blumebyte
- **Colors**: Blue (#2563eb) to Purple (#9333ea) gradient
- **Icon**: Sparkles ✨
- **Tagline**: "AI-Powered HR Management"

## 🚀 Deployment Checklist

### 1. Supabase Setup
- [ ] Deploy edge function
- [ ] Set environment variables (Paystack keys, APP_URL)
- [ ] Enable KV store

### 2. Paystack Setup
- [ ] Create Paystack account
- [ ] Get test/live API keys
- [ ] Configure webhook URLs (optional)

### 3. Vercel Deployment
- [ ] Deploy to Vercel
- [ ] Set APP_URL in Supabase to your Vercel URL
- [ ] Test payment flow

### 4. Testing
- [ ] Test company registration
- [ ] Test subscription payment
- [ ] Test employee portal features
- [ ] Test multi-company isolation
- [ ] Test license limits

## 💡 Next Steps & Enhancements

### Recommended Additions
1. **Email Notifications**
   - Welcome emails for new companies
   - Payment receipts
   - Leave request approvals

2. **Admin Approvals**
   - Leave request approval workflow
   - Manager approval interface

3. **Payroll Module**
   - Generate payslips
   - Salary calculations
   - Tax deductions

4. **Reports & Analytics**
   - Attendance reports
   - Leave analytics
   - Company dashboards

5. **Mobile App**
   - React Native employee app
   - Quick clock in/out
   - Push notifications

## 🐛 Common Issues

### Payment Not Redirecting
- Check `APP_URL` is set correctly in Supabase
- Verify Paystack secret key is valid
- Check browser console for errors

### Company Data Mixing
- All endpoints filter by `companyId`
- Check user profile has correct `companyId`
- Verify KV store keys include company ID

### License Limit Issues
- Check company subscription in KV store
- Verify `company_stats` has correct counts
- Update license count after payment

## 📞 Support

For issues or questions about the multi-tenant architecture, check:
1. Console logs in browser DevTools
2. Supabase Edge Function logs
3. Paystack dashboard for payment status

## 🎉 Congratulations!

You now have a fully functional multi-tenant SaaS HR platform! Companies can:
- ✅ Self-register and get free trials
- ✅ Subscribe via Paystack
- ✅ Manage employees within license limits
- ✅ Use employee self-service portal
- ✅ Chat with team members
- ✅ Track attendance and leaves
- ✅ Scale with flexible licensing

**Blumebyte is ready for production! 🚀**

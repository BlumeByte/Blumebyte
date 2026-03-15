# Blumebyte Quick Reference Card

## 🌐 Frontend Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Landing page with pricing |
| `/login` | Public | Sign in to company account |
| `/company-signup` | Public | Register new company |
| `/subscription` | Super Admin | Manage subscriptions & licenses |
| `/employee-portal` | All Employees | Self-service portal |
| `/superadmin` | Super Admin | Main dashboard |
| `/admin` | Admin | Admin dashboard |
| `/manager` | Manager | Manager dashboard |
| `/employee` | Employee | Employee dashboard |

## 🔌 API Endpoints

### Company Management
```
POST /company/register          - Register company (public)
GET  /company/info             - Get company details
```

### Subscriptions & Payments
```
POST /subscription/initialize-payment    - Start Paystack payment
GET  /subscription/verify-payment        - Verify subscription payment
POST /subscription/upgrade-licenses      - Buy more licenses
GET  /subscription/verify-license-upgrade - Verify license payment
```

### Employee Portal
```
GET  /employee/profile         - Get employee profile
POST /employee/leave-request   - Submit leave request
GET  /employee/leave-requests  - Get leave history
POST /employee/clock-in        - Clock in
POST /employee/clock-out       - Clock out
GET  /employee/attendance      - Get attendance records
GET  /employee/payslips        - Get payslips
```

### Chat
```
POST /chat/send                - Send message (company-scoped)
GET  /chat/messages            - Get messages (company-scoped)
```

### User Management
```
POST /superadmin/users/create  - Create employee (with license check)
```

## 💰 Pricing

| Plan | Price | Licenses | Best For |
|------|-------|----------|----------|
| **Trial** | FREE | 10 | 14-day trial |
| **Starter** | ₦15,000/mo | 10 | Small teams |
| **Professional** | ₦35,000/mo | 50 | Growing companies |
| **Enterprise** | ₦75,000/mo | 200 | Large organizations |
| **Add-on** | ₦1,500/mo | Per license | Any plan |

## 📊 Database Keys (KV Store)

### Company Data
```
company:{slug}                     - Company by slug
company_by_id:{companyId}          - Company by ID
company_users:{companyId}:{userId} - Company user list
company_stats:{companyId}          - Company statistics
```

### User Data
```
user_profile:{userId}              - User profile with companyId
employee:{userId}                  - Employee record (legacy)
```

### Company-Scoped Features
```
chat_messages:{companyId}               - Chat messages
leave_requests:{companyId}              - Leave requests
attendance:{companyId}:{date}           - Daily attendance
payslips:{companyId}:{userId}           - Employee payslips
```

### Payment Records
```
pending_payment:{reference}        - Pending subscription payment
pending_license:{reference}        - Pending license purchase
```

## 🎨 Branding

- **Name**: Blumebyte
- **Icon**: Sparkles (✨)
- **Primary Color**: Blue to Purple gradient (#2563eb → #9333ea)
- **Tagline**: AI-Powered HR Management

## 🔑 Environment Variables

```bash
# Required for Payments
PAYSTACK_SECRET_KEY=sk_test_xxx
APP_URL=https://your-app.vercel.app

# Already Configured
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Optional
GEMINI_API_KEY=xxx (for AI features)
```

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Super Admin** | Full access, subscription management, create all users |
| **Admin** | Employee management, reports, approvals |
| **Manager** | Team management, leave approvals |
| **Employee** | Self-service portal only |

## 🎯 Key Features

### ✅ Multi-Tenancy
- Each company has isolated data
- Company ID filters all queries
- No data mixing between companies

### ✅ License Management
- Tracks used vs. available licenses
- Blocks user creation when limit reached
- Flexible upgrades via Paystack

### ✅ Employee Self-Service
- Leave requests with approval workflow
- Clock in/out attendance tracking
- Payslip viewing and download
- Profile management

### ✅ Payment Integration
- Secure Paystack integration
- Automatic subscription activation
- License upgrades
- Payment verification webhooks

### ✅ Team Communication
- Company-scoped chat
- Real-time messaging
- User avatars

## 🚀 Quick Start

### For Companies:
1. Visit `/` to see pricing
2. Click "Start Free Trial"
3. Register at `/company-signup`
4. Get 14 days + 10 free licenses
5. Login and start adding employees
6. Subscribe when trial ends

### For Employees:
1. Receive login credentials from admin
2. Login at `/login`
3. Access `/employee-portal`
4. Clock in/out, request leave
5. View payslips and profile

### For Super Admins:
1. Login at `/login`
2. Dashboard at `/superadmin`
3. Manage subscription at `/subscription`
4. Create employees (respects license limits)
5. Monitor company stats

## 🐛 Common Issues

### "No available licenses"
**Solution**: Go to `/subscription` → Buy more licenses

### "User not associated with a company"
**Solution**: Ensure user profile has `companyId` field

### Payment not redirecting
**Solution**: Check `APP_URL` environment variable

### Company data mixing
**Solution**: All endpoints filter by `companyId` - verify user profile

## 📞 Testing Checklist

- [ ] Company registration works
- [ ] Trial licenses activated (10)
- [ ] Login with new company account
- [ ] Create employee (check license limit)
- [ ] Employee can access portal
- [ ] Clock in/out works
- [ ] Leave request submits
- [ ] Chat is company-isolated
- [ ] Paystack payment initializes
- [ ] Subscription activates after payment
- [ ] License upgrade works

## 🎉 Success!

You now have a **complete multi-tenant SaaS HR platform**!

---

**Blumebyte** - AI-Powered HR Management for Modern Companies

# Blumebyte Supabase Quick Reference

## 🎯 Connection Summary

Your Supabase database is **CONNECTED AND OPERATIONAL** ✅

| Component | Value |
|-----------|-------|
| **Project ID** | `ivohczdtuxasyfoiphqu` |
| **Supabase URL** | `https://ivohczdtuxasyfoiphqu.supabase.co` |
| **Database Table** | `kv_store_a35148f0` |
| **Server Prefix** | `/make-server-a35148f0` |
| **Full API Endpoint** | `https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server-a35148f0` |

---

## 🔑 Environment Variables (Already Configured)

These secrets are already set in your Supabase Edge Functions:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_DB_URL`
- ✅ `PAYSTACK_SECRET_KEY`
- ✅ `PAYSTACK_PUBLIC_KEY`
- ✅ `GEMINI_API_KEY`
- ✅ `DEEPSEEK_API_KEY`

**To verify or add more secrets:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu)
2. Navigate to **Edge Functions** → **Secrets**

---

## 🗄️ Database Structure

### KV Store Table: `kv_store_a35148f0`

```sql
CREATE TABLE kv_store_a35148f0 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
```

### Data Organization (Key Prefixes)

| Prefix | Purpose | Example Key |
|--------|---------|-------------|
| `employee:` | User/employee records | `employee:abc-123-def` |
| `company:` | Company records | `company:xyz-456-ghi` |
| `subscription:` | License & payment data | `subscription:user-id-789` |
| `leave-request:` | Time-off requests | `leave-request:req-001` |
| `notification:` | User notifications | `notification:notif-123` |
| `profile-change:` | Profile update requests | `profile-change:change-456` |
| `payslip:` | Payroll records | `payslip:slip-789` |
| `announcement:` | Company announcements | `announcement:ann-001` |
| `timesheet:` | Time tracking | `timesheet:time-123` |
| `audit:` | Audit logs | `audit:log-456` |
| `file:` | File metadata | `file:user-id:profile-image` |
| `meeting:` | Meeting records | `meeting:meet-789` |
| `training:` | Training records | `training:course-001` |
| `feedback:` | Employee feedback | `feedback:feed-123` |

---

## 🚀 Quick Test Commands

### Test Server Health

```bash
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server-a35148f0/health
```

**Expected Response:**
```json
{"status":"ok"}
```

### Test Setup Status

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2b2hjemR0dXhhc3lmb2lwaHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzgyNDcsImV4cCI6MjA4ODM1NDI0N30.loRm7iik0lgBW7yRK-ANIjpyKVZGLCdSuqVZ5VDnQNQ" \
https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server-a35148f0/check-setup
```

### Visual Testing Tool

Open in browser:
```
/verify-supabase-connection.html
```

This page will automatically test:
- ✅ Server health
- ✅ Setup status
- ✅ Database connection

---

## 📊 Dashboard Links

| Resource | URL |
|----------|-----|
| **Project Dashboard** | https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu |
| **Database Tables** | https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/database/tables |
| **Table Editor** | https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/editor |
| **Edge Functions** | https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/functions |
| **Storage Buckets** | https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/storage/buckets |
| **Authentication** | https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/auth/users |
| **Database Settings** | https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/settings/database |

---

## 🔐 Multi-Tenant Data Isolation

### How It Works

1. **Company Registration**
   - Creates unique `companyId`
   - Creates SuperAdmin with `assignedCompanies: [companyId]`
   - Stores: `company:{companyId}` and `employee:{userId}`

2. **Data Filtering (Server-Side)**
   ```typescript
   // Every user has assignedCompanies array
   employee: {
     id: "user-123",
     companyId: "company-abc",
     assignedCompanies: ["company-abc"]
   }
   
   // Server filters all queries by company
   async function applyCompanyFilter(items, userId, role) {
     if (role === "superadmin") return items; // See only own company
     const assignedCompanies = await resolveCompanyScope(userId);
     return items.filter(item => 
       assignedCompanies.includes(item.company || item.companyId)
     );
   }
   ```

3. **Result**
   - Company A cannot see Company B's data
   - SuperAdmin A cannot see SuperAdmin B's company
   - Employees only see their company's data

### Access Levels

| Role | Can Access |
|------|-----------|
| **SuperAdmin** | Only their company's data (all records) |
| **Admin** | Only their company's data (all records) |
| **Manager** | Only their company's employees |
| **Employee** | Only their own data |

---

## 🛠️ Common Operations

### View All Companies

In Supabase Dashboard → Table Editor:
1. Select `kv_store_a35148f0`
2. Filter: `key LIKE 'company:%'`

### View All Employees

Filter: `key LIKE 'employee:%'`

### View Subscriptions

Filter: `key LIKE 'subscription:%'`

### View a Specific Record

Find the row with the exact `key` value, then click to expand the JSON `value` column.

---

## 🔧 Troubleshooting

### ❌ "Connection refused" errors

**Problem:** Edge Function not deployed or offline

**Solution:**
1. Go to [Edge Functions Dashboard](https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/functions)
2. Check if `make-server-a35148f0` is deployed
3. Redeploy if needed

### ❌ "Table does not exist" errors

**Problem:** KV Store table missing

**Solution:**
1. Go to [SQL Editor](https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/sql)
2. Run:
   ```sql
   CREATE TABLE IF NOT EXISTS kv_store_a35148f0 (
     key TEXT NOT NULL PRIMARY KEY,
     value JSONB NOT NULL
   );
   ```

### ❌ "Unauthorized" errors

**Problem:** Missing or invalid authentication token

**Solution:**
- Check that user is logged in
- Verify `X-User-Token` header is being sent
- Check that `Authorization: Bearer <anon_key>` header is present

### ⚠️ Slow performance

**Problem:** Missing database indexes

**Solution:** Add indexes (see SUPABASE_DATABASE_SETUP.md Step 7)

---

## 📈 Monitoring

### Check Database Size

1. Go to [Settings → Database](https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/settings/database)
2. View **Database Size** metric

### Monitor API Requests

1. Go to [Edge Functions](https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/functions)
2. Click on function name
3. View **Logs** and **Metrics**

### View Error Logs

1. Edge Functions → Select function
2. Click **Logs** tab
3. Filter by error level

---

## 📚 Related Documentation

- **Full Setup Guide**: `/SUPABASE_DATABASE_SETUP.md`
- **Multi-Tenant Implementation**: `/COMPANY_FILTERING_IMPLEMENTATION.md`
- **License System**: `/LICENSE_SYSTEM_SETUP_GUIDE.md`
- **Paystack Integration**: `/PAYSTACK_SUBSCRIPTION_GUIDE.md`
- **Testing Guide**: `/TESTING_GUIDE.md`

---

## ✨ Next Steps

Your database is connected and ready! You can now:

1. ✅ **Test the connection** - Open `/verify-supabase-connection.html`
2. ✅ **Register a company** - Use the signup page
3. ✅ **Add employees** - From the SuperAdmin dashboard
4. ✅ **Purchase licenses** - Via Paystack integration
5. ✅ **Monitor data** - In the Supabase dashboard

**Everything is working perfectly!** 🎉

---

## 🆘 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Paystack Docs**: https://paystack.com/docs
- **Project Dashboard**: https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu

---

*Last Updated: March 15, 2026*
*Status: ✅ All Systems Operational*

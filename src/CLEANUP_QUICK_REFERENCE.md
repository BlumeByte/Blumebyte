# 🗑️ Production Cleanup - Quick Reference Card

## ⚠️ CRITICAL: READ BEFORE USING

**This will DELETE ALL DATA PERMANENTLY. There is NO UNDO!**

---

## 🚀 Quick Access

### Web UI (Easiest)
```
URL: /production-cleanup
```

**From DevSettings:**
1. Go to `/dev-settings`
2. Scroll to bottom
3. Click "Access Production Cleanup" button

### Direct API Call
```bash
curl -X POST \
  https://YOUR-PROJECT-ID.supabase.co/functions/v1/make-server-668731fc/production/cleanup \
  -H "Content-Type: application/json" \
  -H "X-Cleanup-Key: YOUR-SECRET-KEY"
```

---

## ⚙️ Setup (Optional but Recommended)

### Set Cleanup Secret Key

Add to Supabase Edge Functions environment variables:

```bash
CLEANUP_SECRET_KEY=your-secure-random-key-here
```

**Generate a secure key:**
```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output
a7f3e8d9c2b4a1f6e5d3c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8
```

---

## 📝 Usage Steps

### Step 1: Access the Page
Navigate to `/production-cleanup`

### Step 2: Enter Secret Key (if configured)
If you set `CLEANUP_SECRET_KEY`, enter it in the form.

### Step 3: Confirm Action
Type exactly: **`DELETE ALL DATA`** (case-sensitive)

### Step 4: Execute
Click "Execute Production Cleanup" button

### Step 5: Wait
The system will:
- Delete all auth users
- Delete all KV store data  
- Clear all storage buckets
- Show results summary
- Auto-redirect in 5 seconds

---

## ✅ What Gets Deleted

- ✅ All Supabase Auth users (all accounts)
- ✅ All employee records
- ✅ All company data
- ✅ All leave requests, payslips, attendance
- ✅ All audit logs, notifications, messages
- ✅ All documents, training, surveys
- ✅ All storage buckets and files
- ✅ **EVERYTHING** in the database

---

## 🔒 What Remains Intact

- ✅ Database table structure (kv_store)
- ✅ Application code
- ✅ Edge functions
- ✅ Security policies
- ✅ Multi-tenant isolation rules
- ✅ Payment integration setup
- ✅ Frontend application

---

## 🎯 After Cleanup

### Expected State
- **Users:** 0
- **Companies:** 0
- **Data:** Empty
- **Status:** Production-ready

### First Signup
The next company signup will:
1. Create the first production tenant
2. Initialize company settings
3. Create SuperAdmin account
4. Apply purchased licenses
5. System is now live!

---

## 🚨 Common Issues

### "Invalid cleanup key"
- Check `CLEANUP_SECRET_KEY` is set correctly
- Verify the key matches exactly
- Check for spaces or newlines

### "Failed to delete users"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase project is accessible

### Cannot login after cleanup
- **This is EXPECTED!** All users are deleted
- Create new account via `/company-signup`

---

## 📊 Example Output

```json
{
  "success": true,
  "message": "Production cleanup completed successfully...",
  "details": {
    "authUsersDeleted": 15,
    "kvKeysDeleted": 1247,
    "storageBucketsCleared": 2,
    "timestamp": "2026-03-17T10:30:45.123Z"
  }
}
```

---

## 🎬 Complete Workflow

```
1. Backup any important test data (optional)
   ↓
2. Set CLEANUP_SECRET_KEY (recommended)
   ↓
3. Navigate to /production-cleanup
   ↓
4. Enter secret key (if configured)
   ↓
5. Type "DELETE ALL DATA"
   ↓
6. Click "Execute Production Cleanup"
   ↓
7. Wait for completion (30-60 seconds)
   ↓
8. Clear browser cache/storage
   ↓
9. System auto-redirects to homepage
   ↓
10. Database is now clean and production-ready!
   ↓
11. First company can now sign up
   ↓
12. System is LIVE! 🎉
```

---

## 📚 Full Documentation

For complete details, see:
- **[PRODUCTION_CLEANUP_GUIDE.md](./PRODUCTION_CLEANUP_GUIDE.md)** - Complete guide
- **[FINAL_PRODUCTION_READY.md](./FINAL_PRODUCTION_READY.md)** - Production readiness
- **[PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md)** - Full checklist

---

## 🎯 One-Liner Commands

### Check if cleanup is needed
```bash
curl https://YOUR-PROJECT.supabase.co/functions/v1/make-server-668731fc/check-setup
```

### Run cleanup (no secret key)
```bash
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/make-server-668731fc/production/cleanup
```

### Run cleanup (with secret key)
```bash
curl -X POST \
  https://YOUR-PROJECT.supabase.co/functions/v1/make-server-668731fc/production/cleanup \
  -H "X-Cleanup-Key: YOUR-SECRET-KEY"
```

---

## ⏱️ Estimated Time

- **Small dataset** (< 100 records): ~10 seconds
- **Medium dataset** (100-1000 records): ~30 seconds
- **Large dataset** (1000+ records): ~60 seconds

---

## 🎊 Post-Cleanup

After cleanup is complete:

1. ✅ Clear browser cache
2. ✅ Clear local storage
3. ✅ Clear session storage
4. ✅ Reload the page
5. ✅ Visit landing page
6. ✅ Test first company signup
7. ✅ Verify multi-tenant isolation
8. ✅ Launch to customers! 🚀

---

**Last Updated:** March 17, 2026  
**Status:** Production Ready  
**Version:** 2.1

---

## 🆘 Emergency Contact

If something goes wrong:
1. Check server logs for errors
2. Review the errors object in response
3. Try running cleanup again (it's idempotent)
4. Check Supabase Dashboard manually
5. Consult full documentation

---

**⚠️ REMEMBER: THIS ACTION IS IRREVERSIBLE!**

Use with caution. Always backup important data first.

---

✨ **Made with care for Blumebyte HR SaaS** ✨

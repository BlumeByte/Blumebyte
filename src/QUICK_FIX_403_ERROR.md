# ⚡ QUICK FIX: 403 Deployment Error

## 🎯 The Problem
```
Error while deploying: XHR for "/api/integrations/supabase/.../edge_functions/make-server/deploy" failed with status 403
```

**Translation:** Your Supabase integration doesn't have permission to deploy Edge Functions.

---

## ✅ FASTEST FIX (90% Success Rate)

### Option 1: Re-authenticate in Figma Make (2 minutes)

1. **Disconnect Supabase:**
   - Go to your project integrations
   - Find Supabase integration
   - Click "Disconnect"

2. **Reconnect:**
   - Click "Connect to Supabase"
   - Login and select project `ivohczdtuxasyfoiphqu`
   - **IMPORTANT:** Grant "Deploy Edge Functions" permission
   - Complete authorization

3. **Retry deployment:**
   - Should now work ✅

---

### Option 2: Deploy via Supabase CLI (5 minutes)

**If you're comfortable with terminal:**

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Deploy
supabase functions deploy server --project-ref ivohczdtuxasyfoiphqu

# 4. Test
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-668731fc/health
```

**OR use our deployment script:**
```bash
chmod +x deploy-edge-function.sh
./deploy-edge-function.sh
```

---

### Option 3: Check Supabase Project Status (1 minute)

1. Go to https://supabase.com/dashboard
2. Open project `ivohczdtuxasyfoiphqu`
3. Check top-right corner shows **"Active"** (not "Paused")
4. Go to **Organization → Billing** - verify no payment issues
5. If paused or billing issue, resolve it first

---

## 🔍 VERIFICATION

After trying any option above, test if it worked:

```bash
# Should return JSON with status "ok"
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-668731fc/health
```

**Expected response:**
```json
{
  "status": "ok",
  "version": "2.1-payment-flow-UPDATED",
  "timestamp": "2026-03-31T..."
}
```

---

## 💡 WHY THIS HAPPENS

Common causes:
- ✗ OAuth token expired (happens after 30-90 days)
- ✗ Integration permissions changed
- ✗ Project was paused/reactivated
- ✗ Organization settings restrict deployments
- ✗ Billing lapsed (free tier quota exceeded)

---

## 🆘 STILL NOT WORKING?

**See full troubleshooting guide:**
- `/SUPABASE_EDGE_FUNCTION_DEPLOYMENT_FIX.md` - Comprehensive solutions
- Contact Supabase support with error details

---

## 📋 QUICK CHECKLIST

- [ ] Project is **Active** (not paused)
- [ ] Billing is **current**
- [ ] Integration has **deploy permissions**
- [ ] Using correct project: `ivohczdtuxasyfoiphqu`
- [ ] Edge Functions enabled on your plan

---

**TL;DR:** Re-authenticate your Supabase integration in Figma Make, or deploy via CLI.

**Estimated Time to Fix:** 2-5 minutes

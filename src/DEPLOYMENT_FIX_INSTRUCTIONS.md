# 🔴 URGENT: Fix 403 Deployment Error

## The Problem
**Error:** `XHR for "/api/integrations/supabase/.../edge_functions/make-server/deploy" failed with status 403`

This is a **Figma Make → Supabase integration authentication issue**, NOT a code problem.

## ✅ Solution Steps (Choose ONE)

### Option 1: Re-authenticate Figma Make with Supabase (RECOMMENDED)
1. **Disconnect Supabase:**
   - In Figma Make, go to your project settings
   - Find "Integrations" or "Supabase Connection"
   - Click "Disconnect" or "Remove Integration"

2. **Reconnect Supabase:**
   - Click "Connect to Supabase" or "Add Integration"
   - Log in to your Supabase account
   - Grant deployment permissions
   - Select project: `ivohczdtuxasyfoiphqu`
   - Authorize all requested permissions

3. **Retry Deployment**

---

### Option 2: Update Service Role Key in Figma Make
1. **Get Fresh Service Role Key:**
   - Go to https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu
   - Navigate to: Settings → API
   - Copy your `service_role` key (NOT anon key)

2. **Update in Figma Make:**
   - Find your Supabase integration settings
   - Update/paste the new service role key
   - Save changes

3. **Retry Deployment**

---

### Option 3: Manual Deployment via Supabase Dashboard
If Figma Make integration continues to fail:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu
   - Navigate to: Edge Functions

2. **Create/Update make-server Function:**
   - Click "New function" or select existing "make-server"
   - Copy ALL code from `/supabase/functions/make-server/index.tsx`
   - Paste into the editor
   - Click "Deploy"

3. **Upload Dependencies:**
   - Create these helper files in the function:
     - `kv_store.tsx` (copy from `/supabase/functions/make-server/kv_store.tsx`)
     - `license-routes.tsx` (copy from `/supabase/functions/make-server/license-routes.tsx`)
     - `production-cleanup.tsx` (copy from same folder)
     - `migration-company-keys.tsx` (copy from same folder)

4. **Set Environment Variables:**
   - In Edge Functions settings, add:
     - `SUPABASE_URL` = `https://ivohczdtuxasyfoiphqu.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)

---

### Option 4: Deploy via Supabase CLI
If you have access to terminal/command line:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref ivohczdtuxasyfoiphqu

# Deploy the function
supabase functions deploy make-server

# Deploy the main server too
supabase functions deploy server
```

---

## 🔍 Why This Happens

The 403 error means:
- ❌ Figma Make's stored credentials for Supabase are expired/invalid
- ❌ The service role key has been rotated or revoked
- ❌ Project permissions have changed
- ❌ The integration token lacks deployment permissions

## ✅ Code is Already Fixed

All code-level issues have been resolved:
- ✅ `Deno.serve()` export format
- ✅ All dependency files created
- ✅ Tax configurations endpoint added
- ✅ Config file updated

**The deployment will work once authentication is restored.**

---

## 🆘 Still Not Working?

Contact Supabase Support:
- Visit: https://supabase.com/support
- Project ID: `ivohczdtuxasyfoiphqu`
- Error: "403 Forbidden when deploying edge function via Figma Make"
- Ask them to verify your project's edge function deployment permissions

Or check Figma Make support for Supabase integration issues.

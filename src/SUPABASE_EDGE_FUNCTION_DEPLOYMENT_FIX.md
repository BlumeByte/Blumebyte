# 🚨 SUPABASE EDGE FUNCTION 403 DEPLOYMENT ERROR - FIX GUIDE

## Error Details
```
Error while deploying: XHR for "/api/integrations/supabase/PrY5JfNhnyu6zrdCvYUq9t/edge_functions/make-server/deploy" failed with status 403
```

**Status:** 403 Forbidden - Authentication/Authorization Issue

---

## 🎯 ROOT CAUSE

The 403 error means one of the following:

1. **Invalid or Expired Supabase Access Token** - Your integration token has expired or lacks permissions
2. **Missing Edge Function Deployment Permissions** - Your Supabase project settings may restrict deployments
3. **Project Paused/Restricted** - Your Supabase project may be paused or have deployment restrictions
4. **Incorrect Project Configuration** - The project ID or organization settings may be misconfigured

---

## ✅ SOLUTION 1: Re-authenticate Supabase Integration (RECOMMENDED)

### Step 1: Disconnect Current Integration
1. In **Figma Make**, go to your project settings/integrations
2. Find the **Supabase** integration
3. Click **Disconnect** or **Remove**

### Step 2: Reconnect with Fresh Token
1. Click **Connect to Supabase** or **Add Integration**
2. You'll be redirected to Supabase
3. Select your project: `ivohczdtuxasyfoiphqu`
4. **Authorize** the connection
5. Grant **Edge Functions deployment** permissions

### Step 3: Verify Permissions
Ensure the following permissions are enabled:
- ✅ Deploy Edge Functions
- ✅ Read Edge Functions
- ✅ Manage Edge Functions
- ✅ Access Function Logs

### Step 4: Retry Deployment
1. Return to your project
2. Try deploying the edge function again
3. Should now succeed with **200 OK** status

---

## ✅ SOLUTION 2: Check Supabase Project Status

### Step 1: Verify Project is Active
1. Go to https://supabase.com/dashboard
2. Open your project: **ivohczdtuxasyfoiphqu**
3. Check project status in top-right corner
4. Ensure it shows **"Active"** (not "Paused" or "Restricted")

### Step 2: Check Organization Billing
1. Go to **Organization Settings** → **Billing**
2. Verify your subscription is active
3. Check for any payment issues or warnings
4. Edge Function deployments may be blocked if billing has issues

### Step 3: Verify Edge Functions are Enabled
1. In Supabase Dashboard, navigate to **Edge Functions**
2. Check if Edge Functions feature is enabled for your plan
3. Free tier has limits - may need to upgrade if exceeded

---

## ✅ SOLUTION 3: Manual Deployment via Supabase CLI

If the integration continues to fail, deploy manually:

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

This will open a browser window to authenticate.

### Step 3: Link Your Project
```bash
supabase link --project-ref ivohczdtuxasyfoiphqu
```

Enter your database password when prompted.

### Step 4: Create config.toml (if missing)
Create `/supabase/config.toml`:

```toml
[project]
project_id = "ivohczdtuxasyfoiphqu"

[api]
enabled = true
port = 54321
schemas = ["public", "storage"]
extra_search_path = ["public"]
max_rows = 1000

[edge_functions]
enabled = true
```

### Step 5: Deploy the Edge Function
```bash
supabase functions deploy server --project-ref ivohczdtuxasyfoiphqu
```

### Step 6: Verify Deployment
```bash
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-a35148f0/health
```

Should return:
```json
{
  "status": "ok",
  "version": "2.1-payment-flow-UPDATED",
  "timestamp": "2026-03-31T..."
}
```

---

## ✅ SOLUTION 4: Check Edge Function Naming

The error shows deployment path: `/edge_functions/make-server/deploy`

But your function prefix is: `/make-server-a35148f0`

### Potential Issue:
The deployment may be looking for a function named `make-server` but your actual function directory is `server`.

### Fix:
Ensure your edge function directory name matches what Figma Make expects:

**Current structure:**
```
/supabase/functions/server/index.tsx
```

**May need to be:**
```
/supabase/functions/make-server/index.tsx
```

**OR** update your deployment configuration to point to the correct directory name.

---

## ✅ SOLUTION 5: Use Supabase Service Role Key

If using direct API deployment:

### Step 1: Get Your Service Role Key
1. Go to Supabase Dashboard
2. **Settings** → **API**
3. Copy your **service_role** key (NOT the anon key)

### Step 2: Deploy via API
```bash
curl -X POST \
  https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d @/supabase/functions/server/index.tsx
```

---

## 🔧 VERIFICATION STEPS

After implementing any solution above:

### 1. Test Edge Function is Accessible
```bash
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-a35148f0/health
```

### 2. Test from Your App
In your browser console on the deployed app:
```javascript
fetch('https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-a35148f0/health')
  .then(r => r.json())
  .then(console.log)
```

### 3. Check Logs in Supabase
1. Supabase Dashboard → **Edge Functions**
2. Click on your function
3. View **Invocations** and **Logs**
4. Look for any deployment errors

---

## 📋 QUICK CHECKLIST

Before retrying deployment:

- [ ] Supabase project is **Active** (not paused)
- [ ] Organization billing is **current**
- [ ] Edge Functions are **enabled** on your plan
- [ ] Integration token has **deployment permissions**
- [ ] Function directory name matches deployment config
- [ ] No active deployment restrictions in project settings

---

## 🎯 RECOMMENDED ACTION

**Try this order:**

1. **First**: Re-authenticate Supabase integration in Figma Make (SOLUTION 1)
2. **Second**: Verify project status and billing (SOLUTION 2)
3. **Third**: Deploy manually via Supabase CLI (SOLUTION 3)
4. **Fourth**: Contact Supabase support if all else fails

---

## 💡 COMMON CAUSES OF 403 ERRORS

### Expired OAuth Token
If you connected Supabase integration weeks/months ago, the OAuth token may have expired. **Re-authentication fixes this.**

### Project Settings Changed
If you recently changed organization, transferred project, or updated billing, permissions may need to be re-granted.

### Edge Functions Quota Exceeded
Free tier: 500K invocations/month  
Pro tier: 2M invocations/month  

Check your usage in Supabase Dashboard → **Edge Functions** → **Usage**

### Deploy Restrictions
Some organizations enable "Admin-only deployment" settings. Check:
- Supabase Dashboard → **Organization Settings** → **Access Control**

---

## 🆘 IF NOTHING WORKS

Contact Supabase Support with:

1. **Project Ref**: `ivohczdtuxasyfoiphqu`
2. **Error**: `403 Forbidden on edge function deployment`
3. **Attempted Solutions**: List what you tried from above
4. **Request**: Enable edge function deployment permissions

Support: https://supabase.com/dashboard/support

---

## ✅ SUCCESS INDICATORS

You'll know it's fixed when:

1. Deployment completes with **200 OK** status
2. Edge function appears in Supabase Dashboard → **Edge Functions**
3. Health check returns valid JSON:
   ```json
   {
     "status": "ok",
     "version": "2.1-payment-flow-UPDATED"
   }
   ```
4. Your app can successfully call the edge function
5. No CORS or authentication errors in browser console

---

## 📝 NOTES

- Your edge function code is **correct** - this is purely a deployment/permissions issue
- The function is at: `/supabase/functions/server/index.tsx`
- It uses prefix: `/make-server-a35148f0`
- Your Supabase project: `ivohczdtuxasyfoiphqu`

**The 403 error is preventing deployment - not a code issue.**

---

## 🚀 AFTER SUCCESSFUL DEPLOYMENT

Once deployed, verify these endpoints work:

1. **Health Check**:
   ```
   GET https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-a35148f0/health
   ```

2. **Test Payment**:
   ```
   POST https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-a35148f0/company/test-payment
   ```

3. **Init Payment**:
   ```
   POST https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-a35148f0/company/init-payment
   ```

All should return proper JSON responses (not 403).

---

**Last Updated:** March 31, 2026  
**Status:** Deployment blocked by 403 Forbidden  
**Required Action:** Re-authenticate Supabase integration or deploy manually via CLI

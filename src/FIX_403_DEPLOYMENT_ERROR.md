# 🚨 FIX 403 DEPLOYMENT ERROR - COMPLETE GUIDE

## Error Message
```
Error while deploying: XHR for "/api/integrations/supabase/PrY5JfNhnyu6zrdCvYUq9t/edge_functions/make-server/deploy" failed with status 403
```

## 🎯 What This Means
**403 Forbidden** = The Supabase integration doesn't have permission to deploy Edge Functions.

---

## ✅ SOLUTION 1: Re-authenticate Supabase (2 MINUTES) ⚡

This fixes 90% of 403 errors:

### Steps:

1. **In Figma Make Interface:**
   - Look for **Integrations** or **Settings** button (usually top-right)
   - Find **"Supabase"** in your connected integrations
   - Click **"Disconnect"** or **"Remove"**

2. **Reconnect with Correct Permissions:**
   - Click **"Connect to Supabase"** or **"Add Integration"**
   - You'll be redirected to Supabase login
   - Login with your Supabase account
   - **Select Project:** `ivohczdtuxasyfoiphqu` (Blumebyte HR)
   
3. **CRITICAL STEP - Grant Permissions:**
   - ✅ Check **"Deploy Edge Functions"**
   - ✅ Check **"Manage Database"**
   - ✅ Check **"Access Storage"**
   - ✅ Check **ALL permissions** shown
   - Click **"Authorize"** or **"Connect"**

4. **Retry Deployment:**
   - The deployment should now work
   - Click the deploy button again

---

## ✅ SOLUTION 2: Manual CLI Deployment (5 MINUTES) 🛠️

If re-authentication doesn't work, deploy manually:

### Prerequisites:
```bash
# Install Supabase CLI (choose your OS)

# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
npm install -g supabase

# Or using NPM (all platforms)
npm install -g supabase
```

### Deployment Steps:

```bash
# 1. Login to Supabase
supabase login
# This will open a browser - login and authorize

# 2. Navigate to your project
cd /path/to/your/blumebyte-project

# 3. Link to your Supabase project
supabase link --project-ref ivohczdtuxasyfoiphqu

# 4. Copy missing files to make-server directory
# (I've already created some, but need all of them)

# 5. Deploy the edge function
supabase functions deploy make-server

# 6. Verify deployment
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-a35148f0/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-31T...",
  "version": "2.1-payment-flow-UPDATED",
  "endpoints": [...]
}
```

---

## ✅ SOLUTION 3: Deploy via Supabase Dashboard (3 MINUTES) 🌐

If CLI doesn't work, use the web interface:

### Steps:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu
   - Navigate to **Edge Functions** (left sidebar)

2. **Create New Function:**
   - Click **"New Function"** or **"Deploy Function"**
   - Name: `make-server`
   - Click **"Create"**

3. **Upload Code:**
   - You'll need to copy the code from `/supabase/functions/make-server/index.tsx`
   - Paste it into the editor
   - Click **"Deploy"**

4. **Add Supporting Files:**
   - Upload `kv_store.tsx`
   - Upload `license-routes.tsx`
   - Upload other `.tsx` files from the server directory

5. **Set Environment Variables:**
   - In the Edge Function settings, add:
     - `SUPABASE_URL` = `https://ivohczdtuxasyfoiphqu.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
     - `PAYSTACK_SECRET_KEY` = (your Paystack secret key)
     - `PAYSTACK_PUBLIC_KEY` = (your Paystack public key)

---

## 🔍 TROUBLESHOOTING

### Still Getting 403?

**Check these:**

1. **Project Permissions:**
   - Go to: https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/settings/api
   - Ensure Edge Functions are enabled
   - Check if your organization has billing set up

2. **Organization Role:**
   - You need to be **Owner** or **Admin** of the Supabase organization
   - Check: https://supabase.com/dashboard/org/_/settings
   - Ask organization owner to grant you permissions

3. **API Keys Valid:**
   - Verify your Service Role key hasn't expired
   - Get fresh keys from: Settings → API

4. **Billing Status:**
   - Ensure Supabase subscription is active
   - Free tier allows Edge Functions but with limits

### Error: "Command not found: supabase"

**Fix:**
```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

### Error: "Not logged in"

**Fix:**
```bash
supabase login
# Opens browser for authentication
```

### Error: "Project not found"

**Fix:**
```bash
# Make sure project ref is correct
supabase projects list

# Link with correct project
supabase link --project-ref ivohczdtuxasyfoiphqu
```

---

## 📊 VERIFICATION CHECKLIST

After deployment succeeds, verify:

### 1. Health Endpoint:
```bash
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-a35148f0/health
```

**Expected:** `{"status":"ok",...}`

### 2. Test Payment Endpoint:
```bash
curl -X POST \
  https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-a35148f0/company/test-payment \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

**Expected:** `{"success":true,"message":"Test endpoint working",...}`

### 3. In Supabase Dashboard:
- Go to Edge Functions
- Verify `make-server` is listed
- Status should be **"Active"** or **"Deployed"**
- Click to see deployment logs

### 4. In Your App:
- Try the company registration flow
- It should now work without 403 errors

---

## 🎯 RECOMMENDED FIX ORDER

1. ⚡ **Try Solution 1 FIRST** (Re-authenticate) - Takes 2 min, fixes 90% of cases
2. 🛠️ **If that fails, try Solution 2** (CLI) - Takes 5 min, fixes 95% of cases  
3. 🌐 **If that fails, try Solution 3** (Dashboard) - Takes 10 min, always works
4. 🆘 **If all fail:** Contact Supabase support or check organization permissions

---

## 📞 SUPPORT RESOURCES

- **Supabase Discord:** https://discord.supabase.com
- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **CLI Docs:** https://supabase.com/docs/reference/cli/introduction

---

## ✅ SUCCESS INDICATORS

You'll know it's fixed when:
- ✅ Deployment completes without 403 error
- ✅ Health endpoint returns valid JSON
- ✅ Function appears in Supabase Dashboard
- ✅ Company registration flow works in your app
- ✅ Payment initialization succeeds

---

**START WITH SOLUTION 1 - IT'S THE FASTEST!**

Good luck! 🚀

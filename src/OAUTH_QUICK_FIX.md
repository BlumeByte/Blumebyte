# ⚡ OAuth Quick Fix - Supabase Configuration

## The `/oauth/consent` Message

**Don't worry!** This is just a preview message from Supabase. The path is already implemented in your app. Here's what you need to do:

---

## 🎯 Quick Configuration (5 Minutes)

### Step 1: Set Your Site URL

```
Supabase Dashboard
  → Authentication
    → URL Configuration
      → Site URL: https://hr.blumebyte.com
```

**IMPORTANT:** No trailing slash!

---

### Step 2: Add Redirect URLs

In the same screen, add these URLs (one per line):

```
https://hr.blumebyte.com/auth/callback
https://hr.blumebyte.com/auth-callback
https://hr.blumebyte.com/oauth-consent
```

Click **Save** ✅

---

### Step 3: Configure Google OAuth

#### Part A: Google Cloud Console

1. **Go to:** https://console.cloud.google.com/
2. **Create OAuth Client** (if you haven't):
   - APIs & Services → Credentials → Create Credentials
   - Choose: OAuth 2.0 Client ID
   - Application type: Web application
   - Name: `Blumebyte HR`

3. **Add this EXACT redirect URI:**
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   
   Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference.
   
   **How to find it:**
   - Look at your Supabase dashboard URL
   - Example: `https://abcdefg.supabase.co` → `abcdefg` is your ref

4. **⚠️ CRITICAL: Add Authorized JavaScript origins** (Many developers miss this!)
   
   In the same OAuth Client configuration, scroll to **Authorized JavaScript origins** and add:
   ```
   https://hr.blumebyte.com
   ```
   
   **If you have multiple domains, add all of them:**
   ```
   https://blumebyte.com
   https://hr.blumebyte.com
   https://www.blumebyte.com
   ```
   
   **This prevents the common error:** `redirect_uri_mismatch`

5. **Copy your credentials:**
   - Client ID
   - Client Secret

#### Part B: Supabase Dashboard

1. **Go to:** Authentication → Providers → Google

2. **Toggle Google to ON** ✅

3. **Paste credentials:**
   - Client ID: [from Google Console]
   - Client Secret: [from Google Console]

4. **Scroll down → Check these settings:**
   - ✅ Request email from OAuth provider: **ON**

5. **Click Save** ✅

---

## 🧪 Test It Now

1. Open: https://hr.blumebyte.com/login

2. Click **"Sign in with Google"**

3. You should see:
   - Google account selection
   - Permission request screen
   - Redirect back to your app

4. **If new user:**
   - You'll see company creation form
   - Enter company name
   - Click "Create Company & Continue"
   - You'll be redirected to SuperAdmin dashboard

5. **If existing user:**
   - Direct redirect to your dashboard

---

## ❌ If It's Not Working

### Check These URLs in Order:

1. **Google Console → Credentials → Your OAuth Client**
   - Authorized redirect URIs must be:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   - NOT your app URL!
   - Must end with `/auth/v1/callback`

2. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://hr.blumebyte.com` (no trailing slash)
   - Redirect URLs include: `https://hr.blumebyte.com/auth/callback`

3. **Supabase → Authentication → Providers → Google**
   - Toggle is ON (green)
   - Client ID is filled
   - Client Secret is filled
   - "Request email" is checked

---

## 🔍 Common Mistakes

### ❌ WRONG: Using your app URL in Google Console
```
❌ https://hr.blumebyte.com/auth/callback  // WRONG
```

### ✅ CORRECT: Using Supabase callback URL
```
✅ https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback  // CORRECT
```

---

## 📋 Final Checklist

Copy this and check each item:

```
Google Console Configuration:
□ OAuth Client created in Google Cloud Console
□ Authorized JavaScript origins added:
  □ https://hr.blumebyte.com ⭐ CRITICAL!
  □ https://blumebyte.com (if applicable)
  □ http://localhost:5173 (for local dev)
□ Authorized redirect URIs added:
  □ https://YOUR_REF.supabase.co/auth/v1/callback
□ Client ID copied
□ Client Secret copied
□ Changes SAVED in Google Console

Supabase Configuration:
□ Site URL set to https://hr.blumebyte.com in Supabase
□ Redirect URLs added in Supabase URL Configuration
□ Google provider toggled ON in Supabase
□ Client ID pasted to Supabase
□ Client Secret pasted to Supabase
□ "Request email" enabled for Google provider
□ Changes SAVED in Supabase

Testing:
□ Waited 10 seconds for changes to propagate
□ Cleared browser cache
□ Tested "Sign in with Google" button
□ No redirect_uri_mismatch error
□ OAuth flow completes successfully
```

---

## 🎉 That's It!

The `/oauth/consent` route is already implemented in your app. Once you configure the settings above, OAuth will work perfectly.

**Your OAuth flow is complete and ready to use!**

---

## 🆘 Still Having Issues?

### Quick Debug Steps:

1. **Open browser console** (F12)
2. **Click "Sign in with Google"**
3. **Look for errors** in:
   - Console tab
   - Network tab (filter by "auth")
4. **Common errors and fixes:**
   - `redirect_uri_mismatch` → Check Google Console redirect URI
   - `provider is not enabled` → Toggle provider ON in Supabase
   - `invalid_request` → Check Client ID/Secret are correct

### Check Supabase Auth Logs

1. Go to: Supabase Dashboard → Logs
2. Select: Auth Logs
3. Look for error messages
4. They'll tell you exactly what's wrong

---

**Need more details?** See: [SUPABASE_OAUTH_CONFIG.md](./SUPABASE_OAUTH_CONFIG.md)
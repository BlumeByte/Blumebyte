# 🔧 Supabase OAuth Configuration Guide

## ✅ You're Almost There!

You've enabled Google and Email authentication in Supabase. Now let's configure it correctly.

---

## 🎯 Understanding Supabase OAuth Settings

When you see the message about `/oauth/consent`, Supabase is showing you a **preview** of what the authorization flow looks like. **You don't need to do anything special** - this path is now implemented in your app.

---

## 📋 Correct Supabase Configuration

### Step 1: Site URL Configuration

1. **Go to:** Supabase Dashboard → Authentication → URL Configuration

2. **Set Site URL to your production domain:**
   ```
   https://hr.blumebyte.com
   ```
   *(Remove the trailing slash)*

3. **For local development, add:**
   ```
   http://localhost:5173
   ```

---

### Step 2: Redirect URLs Configuration

1. **In the same URL Configuration section**

2. **Add these Redirect URLs (one per line):**

   **For Production:**
   ```
   https://hr.blumebyte.com/auth/callback
   https://hr.blumebyte.com/auth-callback
   https://hr.blumebyte.com/oauth-consent
   ```

   **For Local Development (if testing locally):**
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/auth-callback
   http://localhost:5173/oauth-consent
   ```

3. **Click Save**

---

### Step 3: Google OAuth Provider Setup

Since you've already enabled Google, now configure it properly:

#### 3.1: Get Google OAuth Credentials

1. **Go to:** https://console.cloud.google.com/

2. **Create or Select Project:**
   - If new: Click "Create Project" → Name it "Blumebyte HR"
   - If existing: Select your project

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - If prompted, configure consent screen first (see below)
   - Application type: **Web application**
   - Name: `Blumebyte HR Production`

5. **Add Authorized Redirect URIs:**
   
   **IMPORTANT:** Use the Supabase callback URL, NOT your app URL:
   
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   
   To find your Supabase Project Ref:
   - Look at your Supabase project URL
   - It's the part before `.supabase.co`
   - Example: If URL is `https://abcdefghijk.supabase.co`, then ref is `abcdefghijk`

6. **⚠️ CRITICAL: Add Authorized JavaScript Origins** (Many developers miss this!)
   
   **In the same OAuth Client screen, scroll to "Authorized JavaScript origins" section:**
   
   Add ALL your domains (one per line):
   ```
   https://hr.blumebyte.com
   https://blumebyte.com
   https://www.blumebyte.com
   ```
   
   **For local development, also add:**
   ```
   http://localhost:5173
   http://localhost:3000
   ```
   
   **Why this is important:**
   - Prevents the dreaded `redirect_uri_mismatch` error
   - Required for OAuth to work from your frontend
   - Must match your actual domain exactly (no trailing slashes!)
   
   **Common mistakes to avoid:**
   ❌ `https://hr.blumebyte.com/` (trailing slash - WRONG)
   ❌ `http://hr.blumebyte.com` (http instead of https - WRONG)
   ✅ `https://hr.blumebyte.com` (CORRECT)

7. **Copy your credentials:**
   - Client ID: `1234567890-abc123.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abc123def456...`

#### 3.2: Configure OAuth Consent Screen (if needed)

If Google asks you to configure the consent screen:

1. **User Type:** External (for public access)
2. **App Information:**
   - App name: `Blumebyte HR`
   - User support email: Your email
   - Developer contact: Your email
3. **Scopes:** 
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
4. **Test Users:** Add your email if in development mode
5. **Save and Continue**

#### 3.3: Add Credentials to Supabase

1. **Back in Supabase Dashboard:**
   - Authentication → Providers → Google

2. **Enable Google** (toggle ON)

3. **Paste your Google credentials:**
   - Client ID: `[paste from Google Console]`
   - Client Secret: `[paste from Google Console]`

4. **Additional Settings (scroll down):**
   - Skip nonce check: **OFF** (keep default)
   - Request email from OAuth provider: **ON** ✅
   
5. **Click Save**

---

### Step 4: Email Provider Setup

You mentioned email is enabled. Configure it:

1. **Supabase Dashboard → Authentication → Providers → Email**

2. **Toggle ON** ✅

3. **Settings:**
   - Confirm email: **ON** (recommended)
   - Secure email change: **ON** (recommended)
   - Email OTP: **Optional** (for passwordless login)

4. **Email Templates** (optional customization):
   - You can customize the email templates later
   - Default templates work fine for now

5. **Click Save**

---

## 🔍 Important Settings to Check

### Authentication Settings

1. **Go to:** Authentication → Settings

2. **Enable Email Confirmations:**
   ```
   ✅ Enable email confirmations
   ```

3. **JWT Settings:**
   - JWT expiry: `3600` (1 hour - default is fine)
   - Refresh token expiry: Keep default

4. **Security:**
   - Enable CAPTCHA: Optional (recommended for production)
   - Enable manual linking: OFF (keep default)

---

## 🧪 Testing Your Configuration

### Test Google OAuth

1. **Open your app:** https://hr.blumebyte.com/login

2. **Click "Sign in with Google"**

3. **You should see:**
   - Google account selection screen
   - Consent screen asking for email/profile permission
   - Redirect back to your app

4. **Expected Flow:**
   ```
   Login Page
      ↓
   Click "Sign in with Google"
      ↓
   Google authentication popup
      ↓
   Google asks for permissions
      ↓
   Redirect to /auth/callback
      ↓
   If new user → Company creation form
   If existing → Dashboard
   ```

### Test Email/Password

1. **Use the email/password form**

2. **Check your email for confirmation** (if enabled)

3. **Confirm and login**

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Redirect URI Mismatch"

**Error:** `redirect_uri_mismatch`

**Solution:**
1. Check Google Console → Credentials → Your OAuth Client
2. Ensure authorized redirect URI is:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
3. NO trailing slash
4. Must use `https://`
5. Must include `/auth/v1/callback` path

---

### Issue 2: "Provider is not enabled"

**Error:** Provider shows as disabled

**Solution:**
1. Go to Supabase → Authentication → Providers
2. Toggle Google to ON
3. Add Client ID and Secret
4. Click Save
5. Wait 10 seconds for changes to propagate

---

### Issue 3: "Invalid redirect URL"

**Error:** Supabase shows error about redirect URL

**Solution:**
1. Go to Authentication → URL Configuration
2. Add your app URL to "Redirect URLs":
   ```
   https://hr.blumebyte.com/auth/callback
   ```
3. Click Save

---

### Issue 4: Email Confirmation Not Sent

**Error:** No confirmation email received

**Solution:**
1. Check Supabase → Authentication → Email Templates
2. Verify email provider is configured
3. For production, you may need to set up custom SMTP:
   - Settings → Email → SMTP Settings
   - Or use default (works for testing)

---

## 🚀 Production Checklist

Before going live, verify:

- [ ] Google OAuth Client ID and Secret added to Supabase
- [ ] Authorized redirect URI set to Supabase callback URL
- [ ] Site URL set to `https://hr.blumebyte.com`
- [ ] Redirect URLs include `/auth/callback` and `/oauth-consent`
- [ ] Email provider enabled and working
- [ ] Test OAuth login with fresh account
- [ ] Test company creation flow
- [ ] Verify user lands on correct dashboard
- [ ] Check that multi-tenant isolation works

---

## 📱 OAuth Flow Diagram

```
┌─────────────────────────────────────┐
│     User clicks "Sign in with      │
│           Google" button            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   Supabase redirects to Google      │
│   with your Client ID               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   Google authentication screen      │
│   User selects account              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   Google consent screen             │
│   (email, profile permissions)      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   Google redirects to Supabase:     │
│   /auth/v1/callback?code=...        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   Supabase exchanges code for       │
│   access token and creates session  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   Supabase redirects to your app:   │
│   /auth/callback#access_token=...   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   AuthCallback.tsx processes        │
│   - Checks if user exists           │
│   - Creates company if new user     │
│   - Redirects to dashboard          │
└─────────────────────────────────────┘
```

---

## 🔐 Security Notes

### What Supabase Handles for You

✅ OAuth token exchange  
✅ Secure credential storage  
✅ PKCE flow for mobile apps  
✅ Token refresh automation  
✅ CSRF protection  
✅ Session management  

### What Your App Handles

✅ User profile creation  
✅ Company assignment  
✅ Role management  
✅ Multi-tenant isolation  
✅ Business logic  

---

## 📊 Configuration Summary

Here's what should be set in Supabase:

```yaml
Authentication:
  Providers:
    Google:
      Enabled: true
      Client ID: "YOUR_GOOGLE_CLIENT_ID"
      Client Secret: "YOUR_GOOGLE_CLIENT_SECRET"
      Request email: true
    
    Email:
      Enabled: true
      Confirm email: true
      
  URL Configuration:
    Site URL: "https://hr.blumebyte.com"
    Redirect URLs:
      - "https://hr.blumebyte.com/auth/callback"
      - "https://hr.blumebyte.com/auth-callback"
      - "https://hr.blumebyte.com/oauth-consent"
```

---

## 🎯 Next Steps

1. ✅ **Verify Google Console setup:**
   - Check authorized redirect URIs
   - Verify Client ID and Secret are correct
   - Ensure consent screen is published (if required)

2. ✅ **Test OAuth flow:**
   - Try signing in with Google
   - Create a test company
   - Verify dashboard access

3. ✅ **Monitor for issues:**
   - Check browser console for errors
   - Review Supabase Auth logs
   - Test with multiple accounts

4. ✅ **Optional: Add more providers:**
   - GitHub (for developers)
   - Microsoft (for enterprise)
   - Follow same pattern

---

## 💡 Tips

### For Development
- Use localhost URLs in redirect configuration
- Add test users to Google OAuth consent screen
- Enable detailed logging in browser console

### For Production
- Use HTTPS only
- Set up custom SMTP for reliable emails
- Enable CAPTCHA for security
- Monitor Supabase Auth logs
- Set up error tracking (Sentry, etc.)

---

## 📞 Getting Help

If you're still seeing issues:

1. **Check Supabase Logs:**
   - Dashboard → Logs → Auth Logs
   - Look for specific error messages

2. **Check Browser Console:**
   - Open DevTools → Console
   - Look for network errors or OAuth errors

3. **Verify URLs Match:**
   - Google Console redirect URI
   - Supabase Site URL
   - Your app's actual domain

4. **Common Fixes:**
   - Wait 10 seconds after saving changes
   - Clear browser cache
   - Try incognito/private mode
   - Check for typos in URLs

---

## ✅ Success Criteria

You'll know OAuth is working when:

1. ✅ "Sign in with Google" button is visible on login page
2. ✅ Clicking button opens Google authentication
3. ✅ After Google auth, you return to your app
4. ✅ New users see company creation form
5. ✅ After company creation, redirected to SuperAdmin dashboard
6. ✅ Existing users go directly to dashboard
7. ✅ No console errors
8. ✅ Multi-tenant isolation maintained

---

**That's it! Your OAuth is configured and ready to use.** 🎉

The `/oauth/consent` preview message in Supabase is just informational - your app already handles the OAuth flow correctly through `/auth/callback`.
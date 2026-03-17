# 🎨 OAuth Configuration Visual Guide

## 📍 The Complete Picture

Here's exactly what needs to be configured and where:

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR APP                                │
│                   https://hr.blumebyte.com                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Login Page (/login)                         │  │
│  │                                                          │  │
│  │  [Email/Password Form]                                   │  │
│  │                                                          │  │
│  │  ─── Or continue with ───                               │  │
│  │                                                          │  │
│  │  [🔵 Sign in with Google]  ← User clicks here          │  │
│  └───────────────────┬──────────────────────────────────────┘  │
└────────────────────┬─┴──────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE AUTH                              │
│         https://YOUR_PROJECT_REF.supabase.co                    │
│                                                                 │
│  Supabase receives click and redirects to Google with:         │
│  - Your Client ID                                              │
│  - Callback URL: /auth/v1/callback                             │
│  - Requested scopes: email, profile                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH                                 │
│                accounts.google.com                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Choose an account                                       │  │
│  │  ○ user@gmail.com                                        │  │
│  │  ○ another@gmail.com                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                     ↓                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Blumebyte HR wants to:                                  │  │
│  │  ✓ See your email address                                │  │
│  │  ✓ See your personal info                                │  │
│  │                                                          │  │
│  │  [Cancel]  [Allow]  ← User clicks Allow                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
           Google redirects to:
           https://YOUR_REF.supabase.co/auth/v1/callback?code=...
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE AUTH                                 │
│                                                                 │
│  1. Receives authorization code from Google                     │
│  2. Exchanges code for access token                             │
│  3. Gets user profile from Google                               │
│  4. Creates Supabase auth session                               │
│  5. Redirects to your app                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
           Redirects to:
           https://hr.blumebyte.com/auth/callback#access_token=...
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR APP                                     │
│              /pages/AuthCallback.tsx                            │
│                                                                 │
│  1. Extracts access token from URL                              │
│  2. Checks if user exists in Blumebyte system                   │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   User Exists?       │    │   New User?          │          │
│  │   ↓                  │    │   ↓                  │          │
│  │   Go to Dashboard    │    │   Show Company Form  │          │
│  │   /superadmin        │    │   Create Company     │          │
│  │   /admin             │    │   Set as SuperAdmin  │          │
│  │   /manager           │    │   Go to Dashboard    │          │
│  │   /employee          │    │                      │          │
│  └──────────────────────┘    └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration Points

### 1️⃣ Google Cloud Console

**Location:** https://console.cloud.google.com/ → APIs & Services → Credentials

```
┌─────────────────────────────────────────────────────────────┐
│  OAuth 2.0 Client IDs                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name: Blumebyte HR                                         │
│  Type: Web application                                      │
│                                                             │
│  ⚠️  CRITICAL: Authorized JavaScript origins               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ https://hr.blumebyte.com                              │ │
│  │ https://blumebyte.com                                 │ │
│  │ https://www.blumebyte.com                             │ │
│  │                                                       │ │
│  │ ⭐ Many developers miss this!                         │ │
│  │ ⭐ This prevents redirect_uri_mismatch error          │ │
│  │ ⭐ Must match your domain exactly                     │ │
│  │ ⭐ No trailing slashes!                               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Authorized redirect URIs:                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ https://abcdefg.supabase.co/auth/v1/callback         │ │
│  │                                                       │ │
│  │ ⚠️  IMPORTANT:                                        │ │
│  │ - Use YOUR Supabase project reference                │ │
│  │ - Must end with /auth/v1/callback                    │ │
│  │ - NOT your app URL!                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Client ID:                                                 │
│  1234567890-abc123.apps.googleusercontent.com              │
│                                                             │
│  Client Secret:                                             │
│  GOCSPX-abc123def456ghi789                                 │
│                                                             │
│  [Save]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 2️⃣ Supabase Dashboard - URL Configuration

**Location:** Authentication → URL Configuration

```
┌─────────────────────────────────────────────────────────────┐
│  URL Configuration                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Site URL                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ https://hr.blumebyte.com                              │ │
│  │                                                       │ │
│  │ ⚠️  No trailing slash!                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Redirect URLs (one per line)                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ https://hr.blumebyte.com/auth/callback                │ │
│  │ https://hr.blumebyte.com/auth-callback                │ │
│  │ https://hr.blumebyte.com/oauth-consent                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Update]                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3️⃣ Supabase Dashboard - Google Provider

**Location:** Authentication → Providers → Google

```
┌─────────────────────────────────────────────────────────────┐
│  Google                                      [Toggle: ON ✅] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Google enabled                                             │
│                                                             │
│  Client ID (for OAuth)                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1234567890-abc123.apps.googleusercontent.com          │ │
│  │                                                       │ │
│  │ ← Copy from Google Cloud Console                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Client Secret (for OAuth)                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ GOCSPX-abc123def456ghi789                             │ │
│  │                                                       │ │
│  │ ← Copy from Google Cloud Console                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Additional Settings:                                       │
│  ☑ Request email from OAuth provider                       │
│  ☑ Skip nonce check                                        │
│                                                             │
│  Redirect URL:                                              │
│  https://abcdefg.supabase.co/auth/v1/callback              │
│  ↑ Use this in Google Console                              │
│                                                             │
│  [Save]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### When User Clicks "Sign in with Google"

```javascript
// 1. OAuthButtons.tsx calls Supabase
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://hr.blumebyte.com/auth/callback',
  },
});

// 2. Supabase redirects to Google with:
// https://accounts.google.com/o/oauth2/v2/auth?
//   client_id=YOUR_CLIENT_ID
//   &redirect_uri=https://YOUR_REF.supabase.co/auth/v1/callback
//   &response_type=code
//   &scope=openid email profile

// 3. User authenticates on Google

// 4. Google redirects to Supabase:
// https://YOUR_REF.supabase.co/auth/v1/callback?code=AUTHORIZATION_CODE

// 5. Supabase exchanges code for token, creates session

// 6. Supabase redirects to your app:
// https://hr.blumebyte.com/auth/callback#access_token=JWT_TOKEN

// 7. AuthCallback.tsx processes the token:
const { data: { session } } = await supabase.auth.getSession();
const profile = await api('/profile', { token: session.access_token });

// 8. If user exists → redirect to dashboard
// 9. If new user → show company creation form
```

---

## 📊 URL Mapping Table

| Service | URL Purpose | Exact URL |
|---------|-------------|-----------|
| **Your App** | Login page | `https://hr.blumebyte.com/login` |
| **Your App** | OAuth callback handler | `https://hr.blumebyte.com/auth/callback` |
| **Your App** | Alternative callback | `https://hr.blumebyte.com/auth-callback` |
| **Your App** | Consent page | `https://hr.blumebyte.com/oauth-consent` |
| **Supabase** | OAuth callback endpoint | `https://YOUR_REF.supabase.co/auth/v1/callback` |
| **Google** | Authorization endpoint | `https://accounts.google.com/o/oauth2/v2/auth` |

---

## 🎯 Copy-Paste Configuration

### For Supabase Site URL
```
https://hr.blumebyte.com
```

### For Supabase Redirect URLs
```
https://hr.blumebyte.com/auth/callback
https://hr.blumebyte.com/auth-callback
https://hr.blumebyte.com/oauth-consent
```

### For Google Console Authorized Redirect URI
```
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

Replace `YOUR_SUPABASE_PROJECT_REF` with your actual project reference.

**How to find it:**
1. Go to Supabase Dashboard
2. Look at the URL
3. Example: `https://abcdefghijk.supabase.co` → `abcdefghijk`

---

## ✅ Verification Steps

After configuration, verify each step:

```
1. Supabase URL Configuration
   ✓ Site URL = https://hr.blumebyte.com
   ✓ Redirect URLs include /auth/callback
   ✓ Saved successfully
   
2. Google Cloud Console
   ✓ OAuth Client created
   ✓ Redirect URI = https://YOUR_REF.supabase.co/auth/v1/callback
   ✓ Client ID copied
   ✓ Client Secret copied
   
3. Supabase Google Provider
   ✓ Toggle is ON (green)
   ✓ Client ID pasted
   ✓ Client Secret pasted
   ✓ "Request email" checked
   ✓ Saved successfully
   
4. Test the Flow
   ✓ Open https://hr.blumebyte.com/login
   ✓ See "Sign in with Google" button
   ✓ Click button → Google auth screen appears
   ✓ Select account → Permission screen appears
   ✓ Click Allow → Redirect to app
   ✓ New user → Company creation form
   ✓ Existing user → Dashboard
```

---

## 🚨 Troubleshooting Decision Tree

```
Click "Sign in with Google"
│
├─ Nothing happens?
│  └─ Check browser console for errors
│     ├─ "provider not enabled" → Enable in Supabase
│     └─ Other error → Check Supabase logs
│
├─ Opens Google but shows error?
│  ├─ "redirect_uri_mismatch"
│  │  └─ Fix: Check Google Console redirect URI
│  │     Must be: https://YOUR_REF.supabase.co/auth/v1/callback
│  │
│  ├─ "invalid_client"
│  │  └─ Fix: Check Client ID in Supabase matches Google
│  │
│  └─ "access_denied"
│     └─ User cancelled or Google app not approved
│
├─ Redirects but shows blank page?
│  └─ Check /auth/callback route exists
│     └─ Verify AuthCallback.tsx is imported in routes
│
├─ Shows error on callback?
│  └─ Check browser console and network tab
│     └─ Check backend logs for /oauth/create-company errors
│
└─ Success! 🎉
   └─ User should see dashboard or company creation form
```

---

## 🎉 Success Indicators

You'll know everything is configured correctly when:

1. ✅ "Sign in with Google" button visible
2. ✅ Clicking opens Google authentication
3. ✅ Google shows permission request
4. ✅ After allowing, returns to your app
5. ✅ No errors in browser console
6. ✅ No errors in network tab
7. ✅ New users see company creation form
8. ✅ After creating company → SuperAdmin dashboard
9. ✅ Existing users → Their role's dashboard
10. ✅ Multi-tenant isolation working

---

**This visual guide shows exactly what to configure where. Follow it step by step!** 🚀
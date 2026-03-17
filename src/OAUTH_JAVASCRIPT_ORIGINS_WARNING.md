# ⚠️ CRITICAL: Authorized JavaScript Origins

## 🚨 Don't Skip This Step!

**This is the #1 reason OAuth fails for most developers.**

---

## 📍 Where to Add It

**Google Cloud Console → APIs & Services → Credentials → Your OAuth Client**

Scroll down to find **TWO** sections:

1. ✅ **Authorized JavaScript origins** ← **YOU MUST ADD THIS**
2. ✅ **Authorized redirect URIs** ← You already know this one

---

## 🎯 What to Add

### Authorized JavaScript Origins

```
https://hr.blumebyte.com
https://blumebyte.com
https://www.blumebyte.com
```

**For local testing:**
```
http://localhost:5173
http://localhost:3000
```

### Authorized redirect URIs

```
https://YOUR_SUPABASE_REF.supabase.co/auth/v1/callback
```

---

## ❌ Common Mistakes

### WRONG (with trailing slash)
```
❌ https://hr.blumebyte.com/
❌ https://blumebyte.com/
```

### WRONG (HTTP instead of HTTPS in production)
```
❌ http://hr.blumebyte.com
```

### WRONG (Including a path)
```
❌ https://hr.blumebyte.com/auth/callback
```
*This goes in redirect URIs, not JavaScript origins!*

### ✅ CORRECT
```
✅ https://hr.blumebyte.com
✅ https://blumebyte.com
```

---

## 🔍 Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│  Google Cloud Console                                   │
│  APIs & Services → Credentials                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  OAuth 2.0 Client: Blumebyte HR                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Authorized JavaScript origins                   │   │
│  │                                                 │   │
│  │  🌐 Where your app is hosted                   │   │
│  │  ⭐ THIS IS CRITICAL!                          │   │
│  │                                                 │   │
│  │  Add:                                           │   │
│  │  ┌──────────────────────────────────────────┐  │   │
│  │  │ https://hr.blumebyte.com                 │  │   │
│  │  │ https://blumebyte.com                    │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  │                                                 │   │
│  │  [+ Add URI]                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Authorized redirect URIs                        │   │
│  │                                                 │   │
│  │  🔄 Where OAuth sends the response             │   │
│  │                                                 │   │
│  │  Add:                                           │   │
│  │  ┌──────────────────────────────────────────┐  │   │
│  │  │ https://xyz.supabase.co/auth/v1/callback │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  │                                                 │   │
│  │  [+ Add URI]                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Save]                                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🚨 Why This Matters

### Without Authorized JavaScript Origins:

**You'll see this error:**
```
Error: redirect_uri_mismatch
```

**Or:**
```
Error: origin_mismatch
```

### With Authorized JavaScript Origins:

✅ OAuth popup opens successfully  
✅ User can authenticate  
✅ No CORS errors  
✅ Smooth redirect back to your app  

---

## 🔐 Security Explanation

Google needs to know which domains are allowed to **initiate** OAuth requests.

- **JavaScript origins** = Where the OAuth request **starts** (your frontend)
- **Redirect URIs** = Where the OAuth response **goes** (Supabase backend)

**Both are required for OAuth to work!**

---

## 📋 Quick Checklist

Before testing OAuth, verify:

```
Google Cloud Console → Credentials → Your OAuth Client:

□ Authorized JavaScript origins:
  □ https://hr.blumebyte.com (production)
  □ http://localhost:5173 (local dev - optional)
  
□ Authorized redirect URIs:
  □ https://YOUR_REF.supabase.co/auth/v1/callback
  
□ Client ID copied to Supabase
□ Client Secret copied to Supabase
□ Changes saved
□ Waited 10 seconds for propagation
```

---

## 🧪 Test Your Configuration

### 1. Check if origins are added:

1. Go to: https://console.cloud.google.com/
2. Navigate to: APIs & Services → Credentials
3. Click your OAuth Client
4. Scroll to "Authorized JavaScript origins"
5. **Verify your domains are listed**

### 2. Test the OAuth flow:

1. Open: https://hr.blumebyte.com/login
2. Open browser console (F12)
3. Click "Sign in with Google"
4. **If you see Google login screen → Success!** ✅
5. **If you see `redirect_uri_mismatch` → Add JavaScript origins!** ❌

---

## 📊 Complete Configuration Example

### Your App Domain
```
https://hr.blumebyte.com
```

### Your Supabase Project Reference
```
abcdefg123456
```

### Configuration:

**Authorized JavaScript origins:**
```
https://hr.blumebyte.com
https://blumebyte.com
```

**Authorized redirect URIs:**
```
https://abcdefg123456.supabase.co/auth/v1/callback
```

---

## 💡 Pro Tips

### Multiple Environments

If you have staging/dev environments:

```
Authorized JavaScript origins:
  https://hr.blumebyte.com          (production)
  https://staging.blumebyte.com     (staging)
  http://localhost:5173             (local dev)
```

### Wildcard Subdomains

❌ Google **does not support** wildcard origins:
```
❌ https://*.blumebyte.com  // NOT SUPPORTED
```

✅ You must add each subdomain separately:
```
✅ https://app.blumebyte.com
✅ https://hr.blumebyte.com
✅ https://staging.blumebyte.com
```

---

## 🔄 If You Already Have an OAuth Client

Don't create a new one! Just update the existing one:

1. Go to your existing OAuth Client
2. Click "Edit" (pencil icon)
3. Scroll to "Authorized JavaScript origins"
4. Click "+ Add URI"
5. Add your domain
6. Click "Save"
7. Wait 10 seconds
8. Test again

---

## 📞 Still Getting redirect_uri_mismatch?

### Double-check these:

1. **JavaScript origins has NO trailing slash**
   - ✅ `https://hr.blumebyte.com`
   - ❌ `https://hr.blumebyte.com/`

2. **Protocol matches** (http vs https)
   - Production: Must use `https://`
   - Localhost: Can use `http://`

3. **Domain matches exactly**
   - Check for typos
   - Check for www vs non-www
   - Check subdomain spelling

4. **You clicked Save in Google Console**
   - Changes don't apply until you save!

5. **You waited 10 seconds**
   - Google needs time to propagate changes

---

## 🎯 Summary

**TWO things you must configure in Google OAuth Client:**

1. **Authorized JavaScript origins** ← Your app URL  
   Example: `https://hr.blumebyte.com`

2. **Authorized redirect URIs** ← Supabase callback  
   Example: `https://abcdefg.supabase.co/auth/v1/callback`

**Both are required. Don't skip #1!**

---

## ✅ Verification

After adding JavaScript origins, you should see:

```
Google Cloud Console → Credentials → OAuth 2.0 Client IDs

Name: Blumebyte HR
Type: Web application

Authorized JavaScript origins (1):
  • https://hr.blumebyte.com

Authorized redirect URIs (1):
  • https://abcdefg.supabase.co/auth/v1/callback
```

---

**Now test your OAuth flow - it should work!** 🎉

If you still have issues, check:
- [OAUTH_QUICK_FIX.md](./OAUTH_QUICK_FIX.md) for step-by-step setup
- [OAUTH_CONFIGURATION_DIAGRAM.md](./OAUTH_CONFIGURATION_DIAGRAM.md) for visual guide

# 🔐 OAuth Authentication Setup Guide

## Overview
Blumebyte now supports OAuth2 authentication with Google, GitHub, Microsoft Azure, and other providers. This allows users to sign in using their existing accounts instead of creating passwords.

---

## ⚠️ About the "/oauth/consent" Message

**If you're seeing a message in Supabase that says:**
> "Make sure this path is implemented in your application."
> Preview Authorization URL: https://hr.blumebyte.com//oauth/consent

**Don't worry!** This is just a preview/informational message. The `/oauth/consent` route is already implemented in your app. This path is optional and only used if you want a custom consent screen before redirecting to OAuth providers.

**What you actually need to do:**
1. Configure your Site URL in Supabase (see below)
2. Add redirect URLs in Supabase (see below)
3. Set up Google OAuth credentials (see below)
4. That's it! The OAuth flow will work automatically.

---

## ✅ What's Been Implemented

### Frontend Components
1. **OAuthButtons.tsx** - Social login buttons with Google, GitHub, and Microsoft
2. **AuthCallback.tsx** - OAuth callback handler with company creation flow
3. **LoginPage** - Integrated OAuth buttons with "Or continue with" divider

### Backend
1. **OAuth Company Creation Endpoint** - `/oauth/create-company`
   - Creates company profile for new OAuth users
   - Sets up SuperAdmin role automatically
   - Provides 14-day trial period

### Routes
- `/auth/callback` - Supabase OAuth redirect handler
- `/auth-callback` - Alternative callback route

---

## 🔧 Supabase OAuth Configuration

### Step 1: Enable OAuth Providers in Supabase

1. **Go to Supabase Dashboard:**
   - Open your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to Authentication > Providers:**
   - Left sidebar: **Authentication** → **Providers**

---

### Google OAuth Setup

1. **Enable Google Provider:**
   - Toggle **Google** to ON

2. **Create Google OAuth Credentials:**
   - Go to: https://console.cloud.google.com/
   - Create new project or select existing one
   - Enable **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `Blumebyte HR`
   
3. **⚠️ CRITICAL: Add Authorized JavaScript Origins** (Many developers miss this!)
   
   **In the OAuth Client configuration, you MUST add TWO things:**
   
   **a) Authorized JavaScript origins:**
   ```
   https://hr.blumebyte.com
   https://blumebyte.com
   ```
   
   **Why?** This tells Google which domains can **initiate** OAuth requests. Without this, you'll get `redirect_uri_mismatch` error!
   
   **b) Authorized redirect URIs:**
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   
   **⭐ See [OAUTH_JAVASCRIPT_ORIGINS_WARNING.md](./OAUTH_JAVASCRIPT_ORIGINS_WARNING.md) for detailed explanation!**

4. **Add Authorized Redirect URIs:**
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   
5. **Copy Credentials to Supabase:**
   - Copy **Client ID** and **Client Secret**
   - Paste into Supabase Google provider settings
   - Click **Save**

6. **Important: Enable Email Scope**
   - In Supabase, ensure email scope is enabled
   - Required scopes: `openid`, `email`, `profile`

---

### GitHub OAuth Setup

1. **Enable GitHub Provider:**
   - Toggle **GitHub** to ON

2. **Create GitHub OAuth App:**
   - Go to: https://github.com/settings/developers
   - Click **New OAuth App**
   - Application name: `Blumebyte HR`
   - Homepage URL: Your production URL (e.g., `https://blumebyte.com`)
   - Authorization callback URL:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   
3. **Copy Credentials:**
   - Copy **Client ID**
   - Generate and copy **Client Secret**
   - Paste into Supabase GitHub provider settings
   - Click **Save**

---

### Microsoft Azure (Microsoft 365) Setup

1. **Enable Azure Provider:**
   - Toggle **Azure** to ON

2. **Create Azure App Registration:**
   - Go to: https://portal.azure.com/
   - Navigate to **Azure Active Directory** → **App registrations** → **New registration**
   - Name: `Blumebyte HR`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: **Web**
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```

3. **Configure API Permissions:**
   - Go to **API permissions** → **Add a permission**
   - Select **Microsoft Graph**
   - Add: `openid`, `email`, `profile`

4. **Create Client Secret:**
   - Go to **Certificates & secrets** → **New client secret**
   - Description: `Blumebyte HR Auth`
   - Copy the **Value** (not the Secret ID)

5. **Copy to Supabase:**
   - Application (client) ID → Supabase Azure Client ID
   - Client secret value → Supabase Azure Client Secret
   - Click **Save**

---

## 🔄 OAuth Flow Explanation

### For Existing Users
1. User clicks "Sign in with Google" (or other provider)
2. OAuth provider authenticates user
3. Redirects to `/auth/callback`
4. System checks if user profile exists in Blumebyte
5. If exists → Redirect to role dashboard
6. If new → Show company creation form

### For New OAuth Users
1. After OAuth authentication, user lands on company creation page
2. User enters company name
3. System creates:
   - Company record with 14-day trial
   - SuperAdmin user profile
   - Links OAuth account to company
4. User redirected to SuperAdmin dashboard

---

## 🚀 Testing OAuth Integration

### Local Development
1. **Update Supabase Redirect URLs for localhost:**
   ```
   http://localhost:5173/auth/callback
   ```

2. **Test Flow:**
   - Go to `/login`
   - Click "Sign in with Google"
   - Authenticate
   - Should redirect back to your app
   - Check console for any errors

### Production
1. **Update all provider redirect URLs to production:**
   ```
   https://YOUR_DOMAIN.com/auth/callback
   ```

2. **Verify:**
   - Test each OAuth provider
   - Ensure company creation works
   - Check that SuperAdmin dashboard loads

---

## 🔒 Security Considerations

### Multi-Tenant Isolation
- OAuth users are automatically isolated by company
- Each OAuth signup creates a separate company
- No cross-company data sharing

### Email Verification
- OAuth providers verify email automatically
- No additional email verification required
- Trust transferred from OAuth provider

### Role Assignment
- First OAuth user → SuperAdmin
- Additional OAuth users from same company → Manual role assignment required
- SuperAdmin must invite team members separately

---

## 🛠️ Troubleshooting

### Error: "provider is not enabled"
**Solution:** Enable the provider in Supabase Dashboard
1. Go to Authentication → Providers
2. Toggle the provider ON
3. Add client ID and secret
4. Save changes

### Error: "Redirect URI mismatch"
**Solution:** Check redirect URIs match exactly
1. Supabase callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
2. Add to OAuth provider's allowed redirect URIs
3. Ensure no trailing slashes

### Error: "Invalid access token"
**Solution:** Token refresh issue
1. Check Supabase Auth settings
2. Ensure JWT expiry is configured correctly
3. Clear browser cookies and retry

### User Can't Create Company
**Solution:** Check backend endpoint
1. Verify `/oauth/create-company` endpoint is accessible
2. Check console for errors
3. Ensure user has valid session

---

## 📋 Configuration Checklist

- [ ] Supabase OAuth Server enabled in project
- [ ] Google OAuth configured (if needed)
  - [ ] Client ID and Secret added
  - [ ] Redirect URI configured
  - [ ] Email scope enabled
- [ ] GitHub OAuth configured (if needed)
  - [ ] Client ID and Secret added
  - [ ] Redirect URI configured
- [ ] Microsoft Azure configured (if needed)
  - [ ] App registration created
  - [ ] Client ID and Secret added
  - [ ] Redirect URI configured
  - [ ] API permissions granted
- [ ] Production redirect URLs updated
- [ ] OAuth buttons visible on login page
- [ ] Callback route working (`/auth/callback`)
- [ ] Company creation flow tested
- [ ] SuperAdmin role assignment verified

---

## 🎨 UI Customization

### Hiding OAuth Buttons
If you want to hide OAuth for certain scenarios:

```tsx
// In LoginPage.tsx, wrap OAuthButtons with conditional:
{!hideOAuth && <OAuthButtons mode="login" disabled={loginLoading} />}
```

### Adding More Providers
To add Facebook, Twitter, etc.:

1. Enable in Supabase Dashboard
2. Add button to `/components/OAuthButtons.tsx`:
```tsx
<Button onClick={() => handleOAuthLogin('facebook')}>
  {/* Facebook icon */}
  Sign in with Facebook
</Button>
```

---

## 📚 Additional Resources

- **Supabase OAuth Docs:** https://supabase.com/docs/guides/auth/social-login
- **Google OAuth:** https://supabase.com/docs/guides/auth/social-login/auth-google
- **GitHub OAuth:** https://supabase.com/docs/guides/auth/social-login/auth-github
- **Azure OAuth:** https://supabase.com/docs/guides/auth/social-login/auth-azure

---

## ✨ Next Steps

1. **Configure at least one OAuth provider** in Supabase Dashboard
2. **Test the OAuth flow** with a new account
3. **Update production redirect URLs** before deploying
4. **Enable email service** for 2FA notifications (if using both OAuth + 2FA)
5. **Monitor OAuth logins** in Supabase Auth logs

---

**Note:** OAuth authentication bypasses 2FA for initial signup but can be required after account creation through the Two-Factor Settings page.
# Blumebyte HR — Supabase Email Auth Setup (Vercel Custom Domain)

This guide is for the production domain:

- **Frontend domain**: `https://hr.blumebyte.com`
- **Supabase project**: `ivohczdtuxasyfoiphqu`
- **Email provider**: Resend via Custom SMTP

> If older notes mention `https://blumebyte.vercel.app`, replace those URLs with `https://hr.blumebyte.com`.

---

## 1) Supabase Auth URL Configuration (required)

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**:
  - `https://hr.blumebyte.com`

- **Redirect URLs** (add all):
  - `https://hr.blumebyte.com`
  - `https://hr.blumebyte.com/auth/callback`
  - `https://hr.blumebyte.com/password-reset`
  - `https://hr.blumebyte.com/login`
  - `https://hr.blumebyte.com/update-password`

This fixes most `requested path is invalid` errors.

---

## 2) Enable email-based auth settings

In **Authentication → Sign In / Providers**:

- **Allow new users to sign up**: ON
- **Confirm email**: ON
- **Allow anonymous sign-ins**: OFF (recommended for HR systems)
- **Allow manual linking**: OFF (unless you intentionally support account linking)

---

## 3) Configure SMTP in current Supabase UI

In current dashboards, SMTP is under **Authentication → Email**.

1. Switch provider to **Custom SMTP**
2. Set:
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: `YOUR_RESEND_API_KEY`
   - Sender name: `Blumebyte HR`
   - Sender email: `noreply@hr.blumebyte.com`

### Critical sender-domain rule

If your verified Resend domain is `hr.blumebyte.com`, sender must match that domain (for example `noreply@hr.blumebyte.com`).

---

## 4) Resend domain verification checklist

In **Resend → Domains**:

- Add domain/subdomain used for sending (`hr.blumebyte.com`)
- Complete DNS records at your DNS host
- Wait for status = **Verified**

If verification is not complete, Supabase invite/reset emails can fail with `Error sending invite email`.

---

## 5) Supabase email templates (recommended)

In **Authentication → Email Templates**:

### Confirm signup template

Use `{{ .ConfirmationURL }}` and a branded message. Example:

```html
<h2>Welcome to Blumebyte HR</h2>
<p>Please confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email Address</a></p>
```

### Reset password template

```html
<h2>Reset Your Blumebyte HR Password</h2>
<p>You requested a password reset.</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you did not request this, you can ignore this email.</p>
```

In newer Supabase UI, redirect destination is managed from **URL Configuration**, not always per-template.

---

## 6) Edge Function secrets (for app-triggered emails)

In **Supabase → Edge Functions → Manage Secrets** add:

- `RESEND_API_KEY=...`
- `FRONTEND_URL=https://hr.blumebyte.com`

This is needed for custom notifications (example: leave request notices, security notices, temp password emails).

---

## 7) Route requirement in the frontend app

Your app must have a route handler for:

- `/auth/callback`

This route should process Supabase auth session exchanges and redirect users into the app.

If missing, email links may open but still fail with `requested path is invalid`.

---

## 8) “Send random password” behavior clarification

Supabase Auth does **not** automatically email generated random passwords for admin-created users.

If you want this behavior:

1. Admin creates user and generates temporary password.
2. Your backend/edge function sends a custom email via Resend.
3. User is required to change password on first login.

Do not send plain-text passwords unless absolutely necessary; magic link or reset-link onboarding is safer.

---

## 9) Security notification emails (optional, recommended)

Use your existing email function to notify on events like:

- new login
- new device
- password changed
- forced reset by admin

This improves account security visibility for users.

---

## 10) Verification tests to run after setup

1. **Invite flow test**
   - Supabase → Authentication → Users → Invite user
   - Expect invite email in seconds

2. **Signup confirmation test**
   - Register a new user
   - Expect confirmation email and valid redirect

3. **Forgot password test**
   - Trigger reset from login page
   - Expect reset email and valid `/password-reset` flow

4. **Custom app-notification test**
   - Trigger one app event that sends through Resend edge function
   - Expect delivery and correct branding

If failures remain, check **Supabase → Logs → Auth** for exact error messages (`invalid sender`, `smtp authentication failed`, `domain not verified`, etc.).

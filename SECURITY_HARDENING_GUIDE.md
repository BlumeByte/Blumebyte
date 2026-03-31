# Security Hardening Guide (GitHub + Vercel + Vite)

## 1) Build hardening for React + Vite

Implemented in this repository:
- Production sourcemaps disabled.
- Terser minification with top-level mangling and dropped `console`/`debugger`.
- Hashed output filenames for cache busting and less-readable bundles.

> Important: Frontend JavaScript cannot be fully hidden. Browsers must download runnable JS. Obfuscation only raises effort; it does not prevent determined copying.

## 2) Vercel routing and access controls

Implemented in this repository:
- Route-level 404 blocks for `/src`, `/config`, `/env`, `/.env`, `/.git`, and `/.github` path probes.
- Security response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- Immutable caching for static assets under `/assets`.

Recommended in Vercel dashboard:
1. Team settings: remove inactive users and enforce 2FA.
2. Project settings: restrict who can view logs/settings.
3. Environment Variables: add secret values only in Vercel, never in repo.
4. Deploy hooks/tokens: rotate periodically.

## 3) Environment variable model

Client-safe variables (`VITE_*`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_FUNCTIONS_SLUG`

Server-only secrets (never ship to browser bundle):
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `PAYSTACK_SECRET_KEY`
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`
- `CLEANUP_SECRET_KEY`

## 4) GitHub hardening

### Repository settings
1. **Settings → General → Danger Zone**
   - Disable forking for private repositories (if policy allows).
2. **Settings → Security**
   - Enable secret scanning and push protection.
   - Enable Dependabot alerts and security updates.
3. **Organization settings**
   - Require 2FA for all members.
   - Restrict outside collaborators.

### Branch protection (for `main` and `release`)
1. Require pull request before merge.
2. Require at least 2 approvals.
3. Dismiss stale approvals when new commits are pushed.
4. Require status checks (build/test/lint).
5. Require conversation resolution.
6. Restrict who can push.
7. Require linear history.
8. Disallow force pushes and deletions.

## 5) Restrict Vercel builds to protected branches

Implemented in `vercel.json`:
- Build is blocked unless branch is `main` or `release`.

If you need preview deploys:
- Replace hard fail with soft gating and add an allowlist (`main`, `release`, `staging`).
- Keep production alias assignment restricted to `main` only.

# Vercel Project Security Checklist

This checklist hardens your Vercel project so source code details, environment variables, and logs are only visible to authorized teammates.

## 1) Lock project access to authorized team members only

1. Open **Vercel Dashboard → Your Team → Settings → Members**.
2. Remove any inactive users and outside collaborators.
3. Require team members to use company email domains.
4. Enforce **2FA** for all team members.
5. Use least-privilege roles:
   - **Owner/Admin**: only for trusted platform maintainers.
   - **Developer**: can deploy but should not manage billing/security settings unless needed.
   - **Viewer**: read-only for stakeholders.

## 2) Restrict dashboard/settings/build-log visibility

1. Open **Project → Settings → General**.
2. Confirm the project belongs to the correct team (not Personal account).
3. Ensure only required roles have access to **Project Settings**.
4. In **Project → Deployments**, verify only team members can view deployment logs.
5. If using shared links/previews, disable any settings that allow public access to deployment details.

## 3) Protect environment variables

1. Open **Project → Settings → Environment Variables**.
2. Move all secrets from code into Vercel Environment Variables.
3. Scope each variable to the minimum required environment (Development/Preview/Production).
4. Rotate any variable that was ever committed to Git history.
5. Do not print secret values in build scripts, API responses, or logs.

## 4) Prevent source and secrets leaks from GitHub

1. Use branch protection for `main` and require pull requests.
2. Enable GitHub secret scanning + push protection.
3. Add required reviewers for infrastructure/configuration changes.
4. Keep `.vercel/` and `.env*` ignored locally.

## 5) Recommended operational guardrails

- Use SSO/SAML (if available on your Vercel plan).
- Review Vercel team/member access monthly.
- Rotate high-risk keys regularly (database, payment, service-role keys).
- Keep production-only secrets out of Preview environments.

## Repository-specific notes

- A root `.gitignore` is now present to block env files, local Vercel metadata, keys, and build artifacts.
- A token-snippet debug log was removed from `src/components/HRAIAssistant.tsx` to avoid exposing authentication tokens in browser logs.


## Suggested follow-up file changes (secrets hygiene)

1. `src/tests/QUICK_TEST_GUIDE.md`
   - Remove or rewrite instructions that tell users to print full access tokens to browser console.
2. `src/tests/README.md`
   - Replace token examples with clearly fake placeholders and add a warning not to paste real production tokens.
3. `src/README_PRODUCTION_LAUNCH.md`
   - Keep key examples masked and add a short warning: never commit real `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, or cleanup keys.
4. Any docs under `src/` that include copied logs
   - Redact user emails, reset links, and token-like strings before committing.

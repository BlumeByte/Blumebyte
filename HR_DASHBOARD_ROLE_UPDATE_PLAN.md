# BlumeByte HR Dashboard Role Update Plan

This branch implements the requested role dashboard completion work for hr.blumebyte.com.

> Important: this repository is the BlumeByte HR product. Billing, subscriptions, pricing, renewal, expiry controls, auto-renewal, license management, payment history, Paystack flows, payment verification, and license payment functionality are core product features and must remain in the application.

## Scope

### Employee
Complete missing self-service dashboard features for profile, attendance, leave, tasks, onboarding, performance, training, meetings, messages, documents, payslips, benefits, expenses, assets, notifications, settings, announcements, and internal opportunities, while preserving self-only data access.

### Manager
Complete manager team views and actions for team attendance, leave approvals, performance, tasks, training, meetings, announcements, reports, overtime, and expenses, while preserving department and reporting-line scope.

### HR and Administrator
Use the Administrator dashboard as the organization-wide HR control center. Complete missing workforce administration features across employees, recruitment, onboarding, offboarding, attendance, leave, payroll administration, performance, training, documents, benefits, assets, expenses, employee relations, reports, approvals, settings, audit logs, imports, and exports.

### Billing, Subscription, Renewal, and License Preservation
Preserve and regression-test all existing commercial functionality. Dashboard work must not remove, bypass, weaken, or expose any of the following:

- Subscription management
- Pricing and plan selection
- License purchase and license limits
- Upgrade and renewal flows
- Expiry and tenant access controls
- Auto-renewal behavior
- Payment history
- Paystack payment initiation and callbacks
- Subscription payment verification
- License payment verification
- Protected payment and subscription routes

The routes `/subscription`, `/payment-verify`, and `/payment-verify-license` must remain protected and restricted to the intended authorized role(s). Do not apply the separate SAS HR project's no-billing requirement to BlumeByte HR.

## Authorization and Data Scoping Requirements

- Employee data must remain self-scoped.
- Manager data and actions must remain limited to the appropriate department/reporting line.
- Administrator data must remain organization-scoped.
- No role may cross organization/tenant boundaries unless explicitly intended for platform administration.
- Frontend route guards must be backed by server-side/API/RLS authorization; hiding a UI element is not sufficient protection.
- User creation, reactivation, and imports must continue to respect purchased license limits.

## Testing Priorities Before Merge

### P0 - Billing and payment regression
- Verify `/subscription` is reachable by the intended authorized role and blocked for unauthorized roles and unauthenticated users.
- Verify `/payment-verify` is protected and functional.
- Verify `/payment-verify-license` is protected and functional.
- Verify plan/license purchase, Paystack initialization, callback/verification, license activation, payment history, renewal, and auto-renew behavior.
- Verify failed/cancelled payment states do not activate licenses or subscriptions incorrectly.

### P0 - License lifecycle
- Verify available license count and consumption.
- Verify creation of the last available licensed user succeeds.
- Verify creation/reactivation/import beyond the purchased license limit is blocked.
- Verify purchasing more licenses updates available capacity.
- Verify expiry, renewal, failed renewal, and post-payment restoration behavior.

### P0 - Role and tenant isolation
- Verify Employee A cannot access Employee B private HR data.
- Verify a Manager cannot access unrelated teams or departments.
- Verify an Administrator cannot access another organization.
- Verify role changes and sign-out/sign-in do not leak stale authorized data.

### P1 - Approval workflows
- Verify leave, expense, and overtime submissions reach the correct manager/HR scope.
- Verify unrelated managers cannot see or action requests.
- Verify approval, rejection, cancellation, and resubmission states are reflected correctly.
- Verify Administrator/HR audit visibility where applicable.

### P1 - Dashboard navigation
- Verify Employee, Manager, Admin, and Super Admin dashboards compile and lazy-load correctly.
- Deep-link to role-specific features and refresh the page.
- Verify browser Back/Forward navigation.
- Verify unauthenticated access redirects correctly.
- Verify empty, loading, and error states do not expose restricted data.

### P1 - Backend, Supabase, and security
- Check Supabase API and Auth logs for authorization failures and unexpected access.
- Review RLS, Edge Function authorization, and organization scoping.
- Review Supabase security and performance advisors.
- Confirm any dashboard feature backed by Supabase is protected server-side.

## Merge Gate

Do not mark this PR ready for merge until all of the following are true:

- [ ] Employee dashboard completion work is implemented and tested.
- [ ] Manager dashboard completion work is implemented and tested.
- [ ] Administrator/HR dashboard completion work is implemented and tested.
- [ ] Existing billing, subscription, renewal, expiry, license, and Paystack flows still work.
- [ ] Protected payment/subscription routes remain restricted to authorized roles.
- [ ] Employee self-scope, manager team-scope, and administrator organization-scope are verified.
- [ ] License limits are enforced during user creation/reactivation/import.
- [ ] Supabase/API/RLS authorization has been reviewed.
- [ ] Production Vite build passes.
- [ ] Security checks pass.

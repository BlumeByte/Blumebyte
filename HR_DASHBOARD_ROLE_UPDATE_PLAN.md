# BlumeByte HR Dashboard Role Update Plan

This branch implements the requested role dashboard completion work for hr.blumebyte.com.

## Scope

### Employee
Complete missing self service dashboard features for profile, attendance, leave, tasks, onboarding, performance, training, meetings, messages, documents, payslips, benefits, expenses, assets, notifications, settings, announcements, and internal opportunities, while preserving self only data access.

### Manager
Complete manager team views and actions for team attendance, leave approvals, performance, tasks, training, meetings, announcements, reports, overtime and expenses, while preserving department and reporting line scope.

### HR and Administrator
Use the Administrator dashboard as the organization wide HR control center. Complete missing workforce administration features across employees, recruitment, onboarding, offboarding, attendance, leave, payroll administration, performance, training, documents, benefits, assets, expenses, employee relations, reports, approvals, settings, audit logs, imports and exports.

### Billing Removal
Remove billing, subscriptions, pricing, license payment, upgrade, renewal, payment gateway, payment history, and payment verification surfaces from the HR application routes and dashboards.

### Validation
Before merge:

- Run the production Vite build
- Verify lazy loaded role dashboards compile
- Test Employee, Manager, Admin and Super Admin route guards
- Verify manager data remains department scoped
- Verify employee data remains self scoped
- Verify Admin organization data remains organization scoped
- Check Supabase API and Auth logs
- Review Supabase security and performance advisors
- Confirm no billing or subscription route is reachable from the HR app

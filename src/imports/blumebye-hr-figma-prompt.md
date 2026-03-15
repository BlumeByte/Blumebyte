# BLUMEBYTE HR - Complete Figma Make Replication Prompt

Copy and paste everything below this line into Figma Make:

---

Build a comprehensive, production-ready Human Resource Information System (HRIS) web application called **BLUMEBYTE HR** (also referred to as "BB HRIS"). Use React, TypeScript, Tailwind CSS, React Router (data mode with `react-router`, NOT `react-router-dom`), shadcn/ui components, lucide-react icons, sonner for toasts, recharts for charts, and Supabase for auth + backend (edge functions with Hono + KV store). The app must be fully functional with real backend persistence, not mock data.

---

## ARCHITECTURE

### Frontend
- **React Router data mode** with `RouterProvider` and `createBrowserRouter` in `/src/app/routes.tsx`
- **Root layout** wraps all routes in `<AuthProvider>` and includes `<Toaster richColors position="top-right" />`
- **ThemeProvider** context that fetches company branding settings (company name, logo as base64, primary colour from a palette of 15 predefined colours, dark mode toggle) from the server on mount and applies them to CSS custom properties (`--primary`, `--color-primary`, `--primary-foreground`) and a `dark` class on `<html>`
- **AuthContext** with Supabase Auth: manages `user` (id, email, name, role), `accessToken`, `sessionLoading`, `loginLoading`, `loginError`, `login()`, `logout()`, `clearError()`, and a `getToken()` method that decodes the JWT `exp` claim and forces `refreshSession()` if the token is expired or within 60 seconds of expiry
- **Dual-header API pattern**: An `apiClient.ts` helper (`authHeaders(userToken, json?)`) that always sends the static `publicAnonKey` as `Authorization: Bearer` (so the Supabase edge function gateway accepts it) and the real user JWT as `X-User-Token` header. The server's `extractUserToken()` reads `X-User-Token` first, falling back to Authorization Bearer.
- **ProtectedRoute** component that checks `sessionLoading`, redirects to `/login` if no user, and redirects to `/${user.role}` if the user's role doesn't match the `allowedRole` prop
- **Singleton Supabase client** in `/src/lib/supabase.ts` using `createClient` with projectId and publicAnonKey

### Backend (Supabase Edge Function with Hono)
- Single Hono server at `/supabase/functions/server/index.tsx`
- Uses Supabase Admin client with `SUPABASE_SERVICE_ROLE_KEY` for user management
- KV store (`kv_store.tsx`) with `get`, `set`, `del`, `mget`, `mset`, `mdel`, `getByPrefix` functions for all data storage
- CORS enabled for all origins with headers `Content-Type`, `Authorization`, `X-User-Token`
- Global error handler that catches broken pipe / EPIPE errors gracefully
- Global `unhandledrejection` event listener to suppress transport-level EPIPE errors that escape Hono's error handler (these occur when clients disconnect during response writing)
- `safeFetch` wrapper around `app.fetch` and `Deno.serve({ onError })` for additional broken-pipe resilience

---

## FOUR USER ROLES

1. **Employee** (`/employee`) - Self-service dashboard
2. **Manager/HR** (`/manager`) - Team management dashboard
3. **Admin** (`/admin`) - Company administration dashboard
4. **Super Admin** (`/superadmin`) - System-wide control dashboard

---

## ROUTES

```
/ -> redirect to /login
/login -> LoginPage (clean email/password form, Building2 icon logo, blue gradient background, no setup section)
/setup-superadmin -> SetupSuperAdmin (one-time wizard, server enforces uniqueness)
/superadmin -> ProtectedRoute(superadmin) -> SuperAdminDashboard
/admin -> ProtectedRoute(admin) -> AdminDashboard
/manager -> ProtectedRoute(manager) -> ManagerDashboard
/employee -> ProtectedRoute(employee) -> EmployeeDashboard
* -> redirect to /login
```

---

## LOGIN PAGE

- Clean, centred card on blue-to-indigo gradient background
- Building2 icon in a blue rounded badge as logo
- Title: "BLUMEBYTE", subtitle: "Human Resource Information System"
- Email and password fields with show/hide password toggle (Eye/EyeOff icons)
- Friendly error messages that map Supabase errors to user-friendly text (e.g., "Incorrect email or password. Please double-check your credentials and try again.")
- Loading spinner during session check and login
- Footer: "Don't have an account? Contact your administrator."
- Copyright line: current year BB HRIS
- NO first-time setup section on the login page

---

## MULTI-COMPANY ACCESS CONTROL SYSTEM

### Company Scope Resolution (server-side helper: `resolveCompanyScope`)
Triple-fallback to find a user's `assignedCompanies`:
1. KV store (`employee:{userId}`) -> `assignedCompanies`
2. `user_metadata.assignedCompanies`
3. `supabase.auth.admin.getUserById()` -> `user_metadata.assignedCompanies`

### User Company Resolution (server-side helper: `resolveUserCompany`)
Resolves a target user's company name:
1. Check `company` field on KV record
2. If missing, resolve `companyId` -> company name via `company:{companyId}` KV lookup

### Filtering Logic
- **Super Admin**: sees ALL users, no filtering
- **Admin**: sees all users except superadmins, filtered by company scope (if `assignedCompanies` is set)
- **Manager**: sees only employees and managers, filtered by company scope

### Company Assignment
- Super Admin can assign companies to Admin/HR users via an "Assign Companies" modal with multi-select checkboxes
- When creating users, both `companyId` and resolved `company` name are stored in KV and auth metadata
- PUT endpoints auto-resolve `companyId` -> `company` name to backfill missing `company` fields
- PUT always preserves `userId` in KV records

---

## SUPER ADMIN DASHBOARD

Collapsible sidebar navigation with these sections:

### Entity CRUD (generic CRUD factory on server with KV prefixes):
- **Dashboard** - Overview cards showing total companies, branches, departments, employees, assets, leave types, etc. with quick-action buttons
- **Companies** - CRUD for companies (name, address, phone, email, status, registration number, tax ID, industry, website)
- **Branches** - CRUD for branches linked to companies (name, company, location, manager, phone, status)
- **Departments** - CRUD for departments (name, description, head of department, status)
- **Assets** - CRUD for assets with categories, serial numbers, purchase info, assignment tracking (assigned to user/company/branch/department)
- **Asset Categories** - CRUD for asset types/categories
- **Pay Grades** - CRUD for pay grades (level, min/max salary, currency, benefits description)
- **Financial Years** - CRUD for financial years (name, start/end date, status: active/closed/planning)
- **Leave Types** - CRUD for leave types (name, days allowed, requires approval, carry over, description)

### User & Employee Management:
- **Employees** - Full employee list with company-scope filtering, inline search, role/status/department filters, sortable columns
- **User Management** - Create users of ANY role (employee, manager, admin, superadmin), edit, delete, assign companies to admins via modal with company checkboxes, reset passwords, view temp passwords
- Employee creation generates temp password (`Bb` + random string + `!`)

### HR Modules (each is a separate reusable component):
- **Onboarding & Training** (`OnboardingManager`) - Create onboarding tasks/training modules, assign to roles or all employees, track completion rates, completion stats per task
- **Attendance** (`AttendanceWidget`) - Clock in/out, today's status, attendance history (last 30 days), admin date view with all employees' records, manual attendance marking, late/present/absent/overtime status, regular vs overtime minute calculations (8hr = 480min threshold, weekends = full overtime)
- **Payroll** (`PayrollManager`) - Run monthly payroll for all salaried employees, Ghana tax calculation with configurable brackets, SSNIT employee/employer rates, income tax bands, payslip generation, manual payslip creation, payroll run history, delete payroll runs
- **Tax Configuration** (`TaxConfigManager`) - Configure Ghana PAYE tax brackets, SSNIT rates, tax year, currency, additional deductions, with live preview calculator
- **Performance Reviews** (`PerformanceManager`) - Create/manage review questionnaires with customisable categories, conduct reviews for employees with scoring (1-5 per category), overall rating auto-calculation, strengths/improvements/goals narrative fields, review history per employee
- **Goals & OKRs** (`GoalsManager`) - Create goals with key results, assign to employees, track progress percentage, status (not-started/in-progress/completed/cancelled)
- **360 Feedback** (`Feedback360`) - Request and provide multi-rater feedback, anonymous option, feedback categories
- **1:1 Meetings** (`OneOnOneManager`) - Schedule recurring 1:1s, agenda items, action items, meeting notes
- **Workflows & Approvals** (`WorkflowsManager`) - Configurable approval workflows for leave, expenses, etc.
- **Recruitment** (`RecruitmentManager`) - Create job vacancies (title, department, location, type, salary range, description, requirements, status), manage applicants through pipeline stages (applied -> screening -> interview -> offer -> hired/rejected), internal job board for employees to apply, application notifications
- **Disciplinary** (`DisciplinaryManager`) - Create disciplinary records (verbal warning, written warning, suspension, termination), link to employees, track status (active/resolved/escalated), date and description
- **HR Reports & Analytics** (`HRReports`) - Charts and statistics using recharts: headcount by department, role distribution, attendance trends, leave utilisation, salary distribution, turnover metrics
- **Labour Act Compliance** (`ComplianceManager`) - Ghana Labour Act compliance checklist and tracking
- **Time Off Calendar** (`TimeOffCalendar`) - Visual calendar showing team leave/time-off
- **Benefits** (`BenefitsManager`) - Benefit plan management, employee enrolment
- **Announcements** (`AnnouncementsWidget`) - Create/delete announcements with priority (normal/important/urgent) and target role filtering
- **Messaging Center** (`MessagingCenter`) - Internal messaging system
- **Self-Service Hub** (`SelfServiceHub`) - Employee self-service portal
- **My Profile** (`MyProfile`) - View/edit own profile
- **Backup & Restore** (`BackupManager`) - Data backup/restore functionality

### Debug Endpoint:
- `GET /debug/my-scope` - Returns userId, role, KV/meta/admin assignedCompanies, resolved scope, hasScope (AdminDashboard and ManagerDashboard log this output on mount)

---

## ADMIN DASHBOARD

Collapsible sidebar with sections:
- **Overview** - Dashboard cards (total employees, departments, pending leaves, today's attendance), recent activity
- **Employees** - Company-scoped employee list with search, filters (role, status, department), sortable columns, create/edit/delete employees, inline `EmployeeFormDialog` with extensive fields
- **Users** - User management (admin cannot edit other admins/superadmins, cannot promote to admin/superadmin, cannot assign companies)
- **Departments** - Department CRUD (admin-specific KV prefix `admin-dept:`)
- **Assets, Asset Categories, Pay Grades, Financial Years, Leave Management** - Same CRUD as SuperAdmin but using shared KV prefixes (`asset:`, `asset-category:`, `paygrade:`, `financial-year:`, `leave-type:`) via `makeAdminCrud` server factory
- **System Config** - Email settings (SMTP), security policies (password rules, session timeout, max login attempts), leave policies (annual/sick/maternity/paternity leave days, carry over, medical certificate rules)
- **Company Settings** - Branding: company name, description, logo upload (base64), primary colour picker from palette of 15 colours, dark mode toggle
- All the same HR modules as SuperAdmin: Onboarding, Attendance, Payroll, Tax Config, Performance, Goals, 360 Feedback, 1:1 Meetings, Workflows, Recruitment, Disciplinary, Reports, Compliance, Time Off Calendar, Benefits, Announcements, Self-Service, My Profile

### Employee Form Dialog (`EmployeeFormDialog`):
Reusable modal with tabs for creating/editing employees:
- **Basic**: name, email, employee ID, role, department, position, contract type
- **Personal**: date of birth, gender, marital status, nationality
- **Contact**: phone, address fields
- **Employment**: hire date, status, company (dropdown), branch (dropdown), work location, shift
- **Compensation**: salary, currency (GHS/USD/EUR/GBP), pay grade
- **Identity**: national ID (Ghana Card), SSNIT number, TIN number
- **Assets**: multi-select asset assignment with available assets shown

---

## MANAGER/HR DASHBOARD

Tab-based navigation with sections:
- **Team** - Employee list (company-scoped, role-filtered to employees/managers), search, department filter, create employee, edit employee, view employee details, reset password
- **Leave Requests** - Approve/reject leave requests with comments, filter by status
- **Attendance** - Same AttendanceWidget
- **Performance** - Same PerformanceManager
- **Payroll** - Same PayrollManager (read-only run, view payslips)
- **Onboarding** - Same OnboardingManager
- **Recruitment** - Same RecruitmentManager
- **Disciplinary** - Same DisciplinaryManager
- **Reports** - Same HRReports
- **Goals, 360 Feedback, 1:1 Meetings, Workflows, Compliance, Time Off Calendar, Benefits, Announcements, Self-Service, My Profile**

### Table Toolbar (`TableToolbar`):
Reusable components for data tables:
- `useTableControls` hook (search, sort field/direction, filter, pagination)
- `SearchBar` with debounced input
- `FilterSelect` dropdown
- `SortableHeader` with up/down/neutral arrow icons
- `PrintButton` that opens print-friendly table in new window

---

## EMPLOYEE DASHBOARD

Tab-based navigation with sections:
- **Overview** - Welcome card with name/role/company, quick stats (leave balance, attendance this month, pending requests, performance rating), recent activity feed
- **My Profile** - View personal details, edit allowed personal/contact fields (phone, personal email, address, emergency contact, date of birth, gender, marital status, nationality)
- **Attendance** - Clock in/out button, today's record, attendance history with status badges (present/late/absent/overtime), total hours worked
- **Leave** - Request leave (type, start date, end date, reason), view leave history with status, leave balance display
- **Payslips** - View payslip history, print individual payslips in formatted HTML popup window
- **Assets** - View assigned assets list
- **Assignments** - View assignments, submit completion with notes
- **Training** - View assigned training modules, mark as complete
- **Onboarding** - View onboarding tasks by role, mark as complete, priority ordering
- **Performance** - View own performance review history with scores and ratings, self-assessment submission with questionnaire
- **Goals** - Same GoalsManager (personal view)
- **360 Feedback** - Same Feedback360 (personal view)
- **1:1 Meetings** - Same OneOnOneManager (personal view)
- **Job Board** - Browse open vacancies, apply with cover note/experience/qualification, view own application status with live pipeline stage tracking
- **Disciplinary** - View own disciplinary records
- **Benefits** - View/enrol in benefit plans
- **Compliance** - View compliance information
- **Time Off Calendar** - View team calendar
- **Announcements** - View announcements
- **Messaging** - Same MessagingCenter

---

## SERVER API ENDPOINTS

All prefixed with `/make-server-6a2d891c`:

### Auth & Profile:
- `GET /health` - Health check
- `GET /profile` - Get authenticated user profile
- `GET /debug/my-scope` - Debug company scope resolution
- `POST /signup` - Disabled (returns 403)
- `POST /setup-admin` - One-time admin setup (checks if admin exists in KV)
- `POST /setup-superadmin` - One-time superadmin setup (checks KV + Auth)
- `GET /check-setup` - Check if any admin/superadmin exists

### User Management:
- `POST /users/create` - Admin creates user (employee/manager/admin only)
- `GET /users` - List users with company-scope filtering, auth + KV merge, abort-signal checks for performance
- `PUT /users/:userId` - Update user (admin: company-scope guard, superadmin: unrestricted), auto-resolve companyId->company name
- `DELETE /users/:userId` - Delete user with scope guard

### SuperAdmin CRUD (generic factory `makeCrud`):
- `GET/POST/PUT/DELETE /superadmin/{company,branch,department,asset,asset-category,paygrade,financial-year,leave-type,assignment,training,onboarding}[/:id]`

### SuperAdmin User Management:
- `POST /superadmin/users/create` - Create user of any role with company assignment
- `DELETE /superadmin/users/:userId` - Delete any user

### Admin CRUD (generic factory `makeAdminCrud`, shared KV prefixes):
- `GET/POST/PUT/DELETE /admin/{assets,asset-categories,paygrades,financial-years,leave-types,assignments,trainings,onboarding-tasks}[/:id]`
- Asset assignment/unassignment: `PUT /admin/assets/:id/assign`, `PUT /admin/assets/:id/unassign`

### Admin Departments:
- `GET/POST/PUT/DELETE /admin/departments[/:id]` (KV prefix: `admin-dept:`)

### Manager Employee Management:
- `POST /manager/employees` - Create employee with asset assignment
- `PUT /manager/employees/:userId` - Update employee with asset reassignment, auto-resolve companyId->company

### Leave Requests:
- `POST /leave-requests` - Submit leave request
- `GET /leave-requests` - Get leave requests (employee: own only, manager+: all)
- `PUT /leave-requests/:leaveId` - Manager/admin approve/reject
- `PUT /admin/leave-requests/:leaveId` - Admin approve/reject

### Attendance:
- `POST /attendance/clock-in` - Clock in (late detection after 9am)
- `POST /attendance/clock-out` - Clock out with minute calculations
- `GET /attendance/today` - Today's record
- `GET /attendance/history` - Last N days with batch KV fetch (`mget`), absent backfill for past days
- `GET /admin/attendance` - All users' attendance for a date
- `GET /admin/attendance/report` - Date range report
- `PUT /admin/attendance/manual-mark` - Manual attendance marking

### Payroll:
- `GET /admin/tax-config` - Get tax configuration
- `PUT /admin/tax-config` - Update tax configuration
- `POST /admin/payroll/run` - Run monthly payroll (Ghana PAYE calculation with configurable brackets, SSNIT rates)
- `GET /admin/payroll` - List payroll runs
- `GET /admin/payroll/:runId/payslips` - Get payslips for a run
- `DELETE /admin/payroll/:runId` - Delete payroll run and payslips
- `POST /admin/payroll/manual-slip` - Create manual payslip
- `GET /admin/payroll/manual-slips` - List manual payslips
- `GET /employee/payslips` - Employee's own payslips

### Performance:
- `POST /admin/performance-reviews` - Create/update review
- `GET /admin/performance-reviews` - List all reviews
- `GET /admin/performance-reviews/employee/:userId` - Reviews for specific employee
- `GET /employee/performance-reviews` - Own reviews
- `DELETE /admin/performance-reviews/:id` - Delete review
- `GET/POST/PUT/DELETE /admin/performance-questionnaires[/:id]` - Questionnaire CRUD (default questionnaire is protected)
- `GET /employee/questionnaires` - Read-only questionnaire access
- `POST /employee/self-assessments` - Submit self-assessment
- `GET /employee/self-assessments` - Own self-assessments

### Employee Self-Service:
- `GET /employee/assets` - Own assigned assets
- `GET /employee/assignments` - Own assignments with submission status
- `PUT /assignments/:id/submit` - Submit assignment
- `GET /admin/assignments/:id/submissions` - View submissions
- `GET /employee/trainings` - Own trainings with completion status
- `PUT /trainings/:id/complete` - Complete training
- `GET /employee/onboarding` - Onboarding tasks by role
- `PUT /onboarding/:id/complete` - Complete onboarding task
- `GET /admin/onboarding-tasks/:id/completions` - Completion stats
- `GET /admin/onboarding/completions` - Overall completion overview
- `PUT /employee/profile` - Update own personal/contact fields (restricted allowlist)
- `GET /employee/disciplinary` - Own disciplinary records

### Recruitment:
- `GET/POST/PUT/DELETE /admin/vacancies[/:id]` - Vacancy CRUD
- `GET/POST/PUT/DELETE /admin/vacancies/:vacancyId/applicants[/:appId]` - Applicant management
- `GET /employee/vacancies` - Open vacancies (job board)
- `POST /employee/vacancies/:vacancyId/apply` - Apply with duplicate prevention
- `GET /employee/my-applications` - Own applications with live stage

### Disciplinary:
- `GET/POST/PUT/DELETE /admin/disciplinary[/:id]`

### Benefits:
- `GET/POST /admin/benefit-plans` - Benefit plan CRUD

### Announcements:
- `GET /announcements` - All announcements
- `POST /admin/announcements` - Create announcement
- `DELETE /admin/announcements/:id` - Delete announcement

### Notifications:
- `GET /notifications` - User's notifications
- `PUT /notifications/mark-read` - Mark all as read

### Company Settings:
- `GET /company-settings` - Public read (branding)
- `PUT /admin/company-settings` - Admin write (branding)

### System Config:
- `GET /admin/system-config` - Get system configuration (email, security, leave policies)
- `PUT /admin/system-config` - Update system configuration

### Reference Data:
- `GET /reference-data` - Companies, branches, assets for dropdowns

---

## GHANA-SPECIFIC PAYROLL CALCULATION

Default tax configuration:
- SSNIT Employee Rate: 5.5%
- SSNIT Employer Rate: 13.0%
- Tax Year: 2025
- Currency: GHS
- Income Tax Brackets (monthly):
  - Band 1 (Tax-free): first GHS 490 at 0%
  - Band 2: next GHS 110 at 5%
  - Band 3: next GHS 130 at 10%
  - Band 4: next GHS 3,000 at 17.5%
  - Band 5: next GHS 16,667 at 25%
  - Band 6 (Excess): remainder at 30%

Calculation: Taxable income = Gross - SSNIT Employee contribution. Then apply bands progressively. Net Pay = Gross - SSNIT Employee - Income Tax.

---

## UI/UX DESIGN

- **Primary colour**: Blue (#1d4ed8) default, configurable via company settings palette
- **Design system**: shadcn/ui components throughout (Card, Button, Input, Label, Badge, Table, Dialog, Select, Tabs, Switch, Progress, Textarea, ScrollArea, etc.)
- **Icons**: lucide-react exclusively
- **Toasts**: sonner with richColors and top-right position
- **Charts**: recharts (BarChart, PieChart, LineChart, AreaChart)
- **Responsive**: Collapsible sidebar on SuperAdmin/Admin dashboards, tab-based navigation on Manager/Employee dashboards
- **Loading states**: Loader2 spinners, skeleton loading
- **Empty states**: Friendly messages with icons when no data
- **Print support**: Formatted HTML popup windows for payslips and tables
- **Dark mode**: Toggle in company settings, applies via CSS class
- **Gradient backgrounds**: Blue-to-indigo on auth pages
- **Consistent spacing**: Using Tailwind's spacing scale
- **Status badges**: Colour-coded (green=active/approved, yellow=pending, red=rejected, blue=submitted, purple=assigned)

---

## IMPORTANT IMPLEMENTATION DETAILS

1. Use `react-router` package, NOT `react-router-dom` (it doesn't work in this environment)
2. All KV keys use prefixes: `employee:`, `company:`, `branch:`, `department:`, `asset:`, `asset-category:`, `paygrade:`, `financial-year:`, `leave-type:`, `leave:`, `attendance:`, `payroll-run:`, `payslip:`, `perf-review:`, `perf-questionnaire:`, `self-assessment:`, `assignment:`, `assignment-sub:`, `training:`, `training-completion:`, `onboarding:`, `onboarding-completion:`, `vacancy:`, `applicant:`, `employee-application:`, `notification:`, `disciplinary:`, `benefit-plan:`, `announcement:`, `admin-dept:`, `admin-system-config`, `company-settings`, `tax-config`, `manual-payslip:`
3. Employee creation auto-generates temp password pattern: `Bb` + random alphanumeric + `!`
4. All server routes are prefixed with `/make-server-6a2d891c`
5. The `GET /users` endpoint merges Supabase Auth users with KV employee records, preferring KV data for most fields
6. AbortController pattern used in AdminDashboard and ManagerDashboard for the `/users` fetch to prevent stale data races
7. Server checks `c.req.raw.signal?.aborted` before expensive operations to bail early when client disconnects
8. Auth guard helpers: `requireSuperAdmin`, `requireAdminOrAbove`, `requireManagerOrAbove`
9. `makeCrud(prefix)` creates full CRUD routes for SuperAdmin entities
10. `makeAdminCrud(routePrefix, kvPrefix, guard?)` creates CRUD routes for Admin/Manager entities with shared KV prefixes
11. Attendance uses composite KV key: `attendance:{userId}:{YYYY-MM-DD}`
12. Weekend detection for overtime: Saturday (day 6) and Sunday (day 0) are overtime days
13. The `copyToClipboard` helper has a fallback using `document.execCommand('copy')` for sandboxed iframes
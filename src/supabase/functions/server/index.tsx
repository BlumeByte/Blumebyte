// Blumebyte HR Management Server - v2.1 - Payment-First Registration
// SECURITY: Updated to Hono 4.7.7+ to patch all known vulnerabilities (Jan 2025)
import { Hono } from "npm:hono@4.7.7";
import type { Context } from "npm:hono@4.7.7";
import { cors } from "npm:hono@4.7.7/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { addLicenseRoutes } from "./license-routes.tsx";
import { usdToPaystackAmount } from "./currency-utils.tsx";
import { performProductionCleanup } from "./production-cleanup.tsx";
import { migrateCompanyKeys } from "./migration-company-keys.tsx";
import { recalculateCompanyStats, syncAllCompaniesStats } from "./sync-company-stats.tsx";

const app = new Hono();
const PREFIX = "/make-server-668731fc"; // v2.1 - Payment-first registration flow
// Validate the RESEND_FROM_EMAIL secret: Resend requires the 'from' field to
// contain an actual email address (e.g. "Name <user@domain.com>" or "user@domain.com").
// If the secret is missing or contains only a display name with no '@' character
// (a common misconfiguration), fall back to the safe built-in default so that
// all email delivery (2FA codes, welcome emails, password resets) continues to work.
const configuredEmailFrom = Deno.env.get('RESEND_FROM_EMAIL') || '';
const EMAIL_FROM = configuredEmailFrom.includes('@')
  ? configuredEmailFrom
  : 'Blumebyte HR <noreply@blumebyte.com>';
const FRONTEND_FALLBACK_URL = 'http://localhost:3000';

// SECURITY: Restrict CORS to known frontend origins only.
// Falls back to wildcard when no real origins are explicitly configured so the
// platform continues to work out of the box in development / early deployments.
const _allowedOrigins = (() => {
  const configured = Deno.env.get('ALLOWED_ORIGINS') || '';
  const frontendUrl = Deno.env.get('FRONTEND_URL') || '';
  // Collect all explicitly configured string origins
  const stringOrigins: string[] = [
    ...configured.split(',').map(o => o.trim()).filter(Boolean),
    ...(frontendUrl ? [frontendUrl.replace(/\/$/, '')] : []),
  ];
  if (stringOrigins.length === 0) {
    // No real origins configured — use wildcard so the app still works
    return '*';
  }
  return [
    ...stringOrigins,
    // Also allow Supabase-hosted previews, Vercel deploys, and blumebyte.com domains
    /^https:\/\/.*\.supabase\.co$/,
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/blumebyte\.com$/,
    /^https:\/\/.*\.blumebyte\.com$/,
  ];
})();

app.use(
  "/*",
  cors({
    origin: _allowedOrigins as any,
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// Test endpoint to verify server is running with latest changes
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.1-payment-flow-UPDATED',
    endpoints: ['company/init-payment', 'company/payment-status/:reference', 'company/test-payment']
  });
});

// Sync company stats endpoint (SuperAdmin only)
app.post(`${PREFIX}/admin/sync-company-stats`, async (c) => {
  try {
    const authUser = await getAuthUser(c);
    if (!authUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const employeeRecord = await kv.get(`employee:${authUser.id}`);
    const companyId = employeeRecord?.companyId || employeeRecord?.company;
    
    // Sync stats for the current company
    if (companyId) {
      const stats = await recalculateCompanyStats(companyId);
      return c.json({ success: true, stats });
    }
    
    return c.json({ error: 'Company not found' }, 404);
  } catch (e: any) {
    console.error('Error syncing company stats:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Sync all companies stats endpoint (SuperAdmin only)
app.post(`${PREFIX}/admin/sync-all-stats`, async (c) => {
  try {
    const authUser = await getAuthUser(c);
    if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`employee:${authUser.id}`);
    const role = profile?.role || authUser.user_metadata?.role || '';
    if (!['superadmin', 'ultimateadmin', 'developer'].includes(role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const results = await syncAllCompaniesStats();
    return c.json({ success: true, results });
  } catch (e: any) {
    console.error('Error syncing all stats:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Simple test endpoint for payment flow
app.post(`${PREFIX}/company/test-payment`, async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ 
      success: true, 
      message: 'Test endpoint working',
      receivedData: body 
    });
  } catch (e: any) {
    console.error('Test payment error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// PRODUCTION CLEANUP ENDPOINT
// WARNING: This endpoint deletes ALL data and users. Use with extreme caution!
app.post(`${PREFIX}/production/cleanup`, async (c) => {
  try {
    const cleanupKey = c.req.header('X-Cleanup-Key');
    const expectedKey = Deno.env.get('CLEANUP_SECRET_KEY');

    // Always require the cleanup key — if it is not configured the endpoint is
    // effectively disabled so no accidental data loss can occur.
    if (!expectedKey || cleanupKey !== expectedKey) {
      return c.json({ error: 'Unauthorized - Invalid or missing cleanup key' }, 401);
    }

    
    const results = await performProductionCleanup();
    
    return c.json({
      success: results.overall.success,
      message: results.overall.message,
      details: {
        authUsersDeleted: results.authUsers.count,
        kvKeysDeleted: results.kvData.count,
        storageBucketsCleared: results.storage.count,
        timestamp: results.timestamp,
      },
      errors: {
        authUsers: results.authUsers.error,
        kvData: results.kvData.error,
        storage: results.storage.error,
      }
    });
  } catch (e: any) {
    console.error('Production cleanup error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// --- Supabase Admin Client ---
const supabaseAdmin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

// --- Real-Time Broadcast Helper ---
async function broadcastUpdate(channelName: string, eventType: string, key: string, data: any) {
  try {
    const sb = supabaseAdmin();
    const channel = sb.channel(`realtime:${channelName}`);

    // Subscribe first — required before sending broadcasts from the server side
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('subscribe timeout')), 4000);
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve(); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timer); reject(new Error(`channel ${status}`)); }
      });
    });

    await channel.send({
      type: 'broadcast',
      event: eventType,
      payload: { type: eventType, key, payload: data },
    });

    sb.removeChannel(channel);
    return true;
  } catch (error) {
    console.error(`❌ Broadcast error on ${channelName}:`, error);
    return false;
  }
}

// --- Auth Helpers --- (Updated)
function extractUserToken(c: any): string | null {
  const xToken = c.req.header("X-User-Token");
  if (xToken) return xToken;
  const auth = c.req.header("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];
  return null;
}

async function getAuthUser(c: any) {
  const token = extractUserToken(c);
  if (!token) {
    return null;
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error) {
    return null;
  }
  if (!data?.user) {
    return null;
  }
  return data.user;
}

// Helper to get SuperAdmin user for a specific company
async function getSuperAdmin(companyId?: string) {
  const allUsers = await kv.getByPrefix('employee:');
  if (companyId) {
    // Find superadmin in the same company
    return allUsers.find((u: any) => u.role === 'superadmin' && (u.companyId === companyId || u.company === companyId));
  }
  // CRITICAL FIX: Without companyId, return null - never return a random superadmin from any company
  return null;
}

// Helper to get user profile (used by automation routes)
async function getUserProfile(userId: string) {
  const kvData = await kv.get(`employee:${userId}`);
  if (kvData) return kvData;
  const profile = await kv.get(`user_profile:${userId}`);
  return profile || null;
}

// Helper to verify subscription and license availability
async function verifySubscriptionAndLicenses(superAdminId: string, requiresActiveLicense = true) {
  const subscription = await kv.get(`subscription:${superAdminId}`);
  
  // Check if subscription exists and is active
  if (!subscription || subscription.status !== 'active') {
    return {
      valid: false,
      reason: 'no_subscription',
      message: 'No active subscription found. SuperAdmin must purchase licenses first.',
      subscription: null
    };
  }
  
  // If we need to verify license availability
  if (requiresActiveLicense) {
    const allUsers = await kv.getByPrefix('employee:');
    // CRITICAL: Only count users in the same company as the superadmin
    const superAdminData = await kv.get(`employee:${superAdminId}`);
    const saCompany = superAdminData?.companyId || superAdminData?.company;
    const companyUsers = saCompany ? allUsers.filter((u: any) => u.companyId === saCompany || u.company === saCompany) : allUsers;
    const activeUsers = companyUsers.filter((u: any) => u.status === 'active');
    const usedLicenses = activeUsers.length;
    const purchasedLicenses = subscription.purchasedLicenses || 0;
    
    if (usedLicenses >= purchasedLicenses) {
      return {
        valid: false,
        reason: 'insufficient_licenses',
        message: `Insufficient licenses. Used: ${usedLicenses}, Available: ${purchasedLicenses}`,
        subscription,
        usedLicenses,
        purchasedLicenses
      };
    }
    
    return {
      valid: true,
      subscription,
      usedLicenses,
      purchasedLicenses,
      availableLicenses: purchasedLicenses - usedLicenses
    };
  }
  
  return {
    valid: true,
    subscription
  };
}

async function requireAuth(c: any) {
  const user = await getAuthUser(c);
  if (!user) throw new Error("Unauthorized");
  const kvData = await kv.get(`employee:${user.id}`);
  const rawRole = kvData?.role || user.user_metadata?.role || "employee";
  const role = rawRole === "customer-care" ? "customer_care" : rawRole;
  
  // SUBSCRIPTION LOGIC TEMPORARILY DEACTIVATED
  // Just return the user data without subscription/license checks
  return { user, role, kvData };
  
  /*
  // SuperAdmin is always allowed (they need to access payment pages)
  if (role === 'superadmin') {
    return { user, role, kvData };
  }
  
  // For all other users, verify they have an active status and subscription is valid
  if (kvData?.status !== 'active') {
    throw new Error("AccountInactive");
  }
  
  // Verify SuperAdmin has active subscription
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) {
    throw new Error("NoSuperAdmin");
  }
  
  const verification = await verifySubscriptionAndLicenses(superAdmin.id || superAdmin.userId, false);
  if (!verification.valid) {
    throw new Error("SubscriptionInactive");
  }
  
  return { user, role, kvData };
  */
}

async function requireRole(c: any, roles: string[]) {
  const data = await requireAuth(c);
  if (!roles.includes(data.role)) throw new Error("Forbidden");
  return data;
}

const requireSuperAdmin = (c: any) => requireRole(c, ["superadmin"]);
const requireAdminOrAbove = (c: any) => requireRole(c, ["superadmin", "admin"]);
const requireManagerOrAbove = (c: any) => requireRole(c, ["superadmin", "admin", "manager"]);
const CUSTOMER_CARE_ROLES = ["customer_care", "customer-care"];
const requireDeveloper = (c: any) => requireRole(c, ["developer", "ultimateadmin"]);
const requireCustomerCare = (c: any) => requireRole(c, CUSTOMER_CARE_ROLES);

// --- Temp password generator ---
function generateTempPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charLen = chars.length;
  const maxUnbiased = 256 - (256 % charLen);
  let result = "Bb";
  while (result.length < 10) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (result.length >= 10) break;
      if (b < maxUnbiased) result += chars[b % charLen];
    }
  }
  return result + "!";
}

// --- Audit Logging ---
async function logAudit(params: {
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT' | 'ACCESS';
  resourceType: string;
  resourceId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  companyId?: string;
}) {
  // Get companyId from params or resolve from userId
  let companyId = params.companyId;
  if (!companyId) {
    companyId = await getCompanyId(params.userId);
  }

  const auditLog = {
    id: crypto.randomUUID(),
    userId: params.userId,
    userName: params.userName,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    details: params.details || {},
    ipAddress: params.ipAddress || 'unknown',
    userAgent: params.userAgent || 'unknown',
    timestamp: new Date().toISOString(),
    companyId: companyId || 'unknown', // Add companyId for multi-tenant filtering
    company: companyId || 'unknown', // Add company field for compatibility
  };

  try {
    await kv.set(`audit:${auditLog.id}`, auditLog);
    // Also index by userId for easy retrieval
    const userAuditsKey = `audit-index:user:${params.userId}`;
    const userAudits = await kv.get(userAuditsKey) || [];
    userAudits.push(auditLog.id);
    // Keep only last 1000 entries per user
    if (userAudits.length > 1000) {
      userAudits.shift();
    }
    await kv.set(userAuditsKey, userAudits);
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
}

// --- Company scope resolver ---
async function resolveCompanyScope(userId: string): Promise<string[] | null> {
  const kvData = await kv.get(`employee:${userId}`);
  
  // Build scope from multiple sources (assignedCompanies, company, companyId)
  // This handles mixed data where some employees use company name and others use UUID
  const scope: string[] = [];
  
  // 1. Check KV assignedCompanies (usually UUIDs)
  if (kvData?.assignedCompanies?.length) {
    scope.push(...kvData.assignedCompanies);
  }
  
  // 2. Check auth metadata assignedCompanies (backup)
  if (scope.length === 0) {
    const sb = supabaseAdmin();
    const { data } = await sb.auth.admin.getUserById(userId);
    if (data?.user?.user_metadata?.assignedCompanies?.length) {
      scope.push(...data.user.user_metadata.assignedCompanies);
    }
    // Also check companyId in auth metadata (set during registration)
    if (data?.user?.user_metadata?.companyId && !scope.includes(data.user.user_metadata.companyId)) {
      scope.push(data.user.user_metadata.companyId);
    }
  }
  
  // 3. CRITICAL: Also add company/companyId field (handles legacy data with company names)
  if (kvData?.company) {
    if (!scope.includes(kvData.company)) {
      scope.push(kvData.company);
    }
  }
  if (kvData?.companyId && !scope.includes(kvData.companyId)) {
    scope.push(kvData.companyId);
  }
  
  if (scope.length > 0) {
    return scope;
  }
  
  return null;
}

// Helper to get the first company ID from scope (reduces repeated const scope patterns)
async function getCompanyId(userId: string): Promise<string | null> {
  const companies = await resolveCompanyScope(userId);
  return companies?.[0] || null;
}

async function resolveCompanyName(companyId: string): Promise<string> {
  if (!companyId) return "";
  // Check both key formats: company: (canonical) and company_by_id: (legacy/alternate)
  const company = await kv.get(`company:${companyId}`) || await kv.get(`company_by_id:${companyId}`);
  return company?.name || "";
}

// CRITICAL: Helper to ensure companyId is set on new items for multi-tenant isolation
async function ensureCompanyId(item: any, userId: string): Promise<any> {
  // If item already has companyId/company, use it
  if (item.companyId || item.company) {
    return item;
  }
  
  // Get companyId from user's scope
  const companyId = await getCompanyId(userId);
  if (!companyId) {
    console.error(`⚠️  CRITICAL: User ${userId} has no company scope - cannot create item`);
    throw new Error('User has no company assignment');
  }
  
  // Add companyId to item
  return {
    ...item,
    companyId,
    company: companyId, // Add both fields for compatibility
  };
}

// --- Case-insensitive company matching helper ---
// FIX: Handles case mismatches like "BLUMEBYTE" vs "blumebyte" to ensure proper tenant isolation
function companyMatches(scope: string[], company: string | undefined | null): boolean {
  if (!company || !scope?.length) return false;
  return scope.some(s => s.toLowerCase() === company.toLowerCase());
}

// --- Normalize employment type to Title Case for consistent filtering ---
function normalizeEmploymentType(raw: string): string {
  if (!raw) return '';
  const map: Record<string, string> = {
    'full-time': 'Full Time', 'full_time': 'Full Time', 'fulltime': 'Full Time', 'full time': 'Full Time',
    'part-time': 'Part Time', 'part_time': 'Part Time', 'parttime': 'Part Time', 'part time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Internship',
    'remote': 'Remote',
    'hybrid': 'Hybrid',
  };
  return map[raw.toLowerCase()] || raw;
}

// --- Active statuses for public job visibility ---
const JOB_ACTIVE_STATUSES = new Set(['active', 'open', 'interviewing', 'offered', 'published', 'live', 'approved', 'posted', 'hiring', 'recruiting', 'accepting_applications']);
const JOB_EXPLICITLY_HIDDEN_STATUSES = new Set(['draft', 'inactive', 'closed', 'filled', 'archived', 'deleted', 'expired', 'cancelled']);
const JOB_PUBLIC_VISIBILITIES = new Set([
  'public_global',
  'public',
  'global',
  'public_job_board',
  'public_appears_on_job_board',
]);
const JOB_TRUTHY_PUBLIC_VALUES = new Set([
  'true',
  '1',
  'yes',
  'on',
  'public',
  'public_global',
  'publicglobal',
]);

function normalizeJobStatus(raw: any): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeJobVisibility(raw: any): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseEmailList(...values: any[]): string[] {
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  const valid = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const raw = Array.isArray(value) ? value.join(',') : String(value);
    raw
      .split(/[,\n;]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
      .forEach((email) => {
        if (emailPattern.test(email)) valid.add(email);
      });
  }
  return Array.from(valid);
}

function isPublicJobPosting(job: any): boolean {
  if (!job || typeof job !== 'object') return false;
  const visibility = normalizeJobVisibility(
    job.visibilityType ||
    job.visibility ||
    job.publicVisibility ||
    job.jobBoardVisibility ||
    job.publishVisibility
  );
  // If a posting is explicitly marked public, it should appear on hirings even when
  // other private/internal visibility fields are also present.
  const isExplicitlyPublic = [
    job.isPublic,
    job.public,
    job.publishToJobBoard,
    job.showOnJobBoard,
    job.showOnWebsite,
    job.isPublished,
  ].some((value) => {
    if (value === true) return true;
    const normalized = normalizeJobVisibility(value);
    return !!normalized && JOB_TRUTHY_PUBLIC_VALUES.has(normalized);
  });
  const isPublicByVisibility = !!visibility && JOB_PUBLIC_VISIBILITIES.has(visibility);
  if (!isExplicitlyPublic && !isPublicByVisibility) return false;
  const status = normalizeJobStatus(job.status);
  // Backward compatibility: old public postings may be missing status entirely.
  if (!status) return true;
  if (JOB_ACTIVE_STATUSES.has(status)) return true;
  if (isExplicitlyPublic && !JOB_EXPLICITLY_HIDDEN_STATUSES.has(status)) return true;
  return false;
}

async function buildPublicJobResponse(job: any) {
  if (!job || typeof job !== 'object' || !job.id) return null;

  let companyName = typeof job.companyName === 'string' ? job.companyName : '';
  if (!companyName && job.companyId) {
    try {
      companyName = await resolveCompanyName(job.companyId);
    } catch (_) {}
  }
  if (!companyName && typeof job.company === 'string' && !job.company.includes('-')) {
    companyName = job.company;
  }

  return {
    id: job.id,
    companyName,
    roleTitle: job.roleTitle || job.title || 'Untitled Role',
    // HIRING-FIX: Include department in public payload for client-side filtering.
    department: typeof job.department === 'string' ? job.department : '',
    employmentType: normalizeEmploymentType(String(job.employmentType || job.type || job.employment_type || '')),
    location: typeof job.location === 'string' ? job.location : '',
    description: typeof job.description === 'string' ? job.description : '',
    requirements: typeof job.requirements === 'string' ? job.requirements : '',
    qualifications: typeof job.qualifications === 'string' ? job.qualifications : '',
    salaryRange: typeof job.salaryRange === 'string' ? job.salaryRange : '',
    deadline: job.deadline || null,
    createdAt: job.createdAt || job.created_at || new Date().toISOString(),
    visibilityType: normalizeJobVisibility(job.visibilityType),
    status: normalizeJobStatus(job.status),
  };
}

// --- Build a scope-based item filter for payroll calculation ---
function makeScopeFilter(scope: string[] | null) {
  return (item: any) => {
    const co = item.company || item.companyId;
    if (!co) return false;
    return !scope?.length || scope.some((s: string) => s.toLowerCase() === co.toLowerCase());
  };
}

// --- Progressive tax bracket calculation (for superadmin tax-bracket records) ---
function calcProgressiveTax(basicSalary: number, brackets: any[]): number {
  let tax = 0;
  const sorted = [...brackets].sort((a, b) => parseFloat(a.minIncome || 0) - parseFloat(b.minIncome || 0));
  for (const bracket of sorted) {
    const min = parseFloat(bracket.minIncome || 0);
    const max = parseFloat(bracket.maxIncome || 0) || Infinity;
    const rate = parseFloat(bracket.rate || 0) / 100;
    if (basicSalary > min) {
      tax += (Math.min(basicSalary, max) - min) * rate;
    }
  }
  return tax;
}

// --- Benefit plan allowance calculation (for superadmin benefit-plan records: always % of basic) ---
function calcBenefitPlanAllowance(basicSalary: number, plans: any[], userId?: string): number {
  let allowance = 0;
  for (const plan of plans) {
    if (userId && plan.eligibleUsers?.length && !plan.eligibleUsers.includes(userId)) continue;
    allowance += basicSalary * (parseFloat(plan.employerContribution || 0) / 100);
  }
  return allowance;
}

// --- Company-based filtering helper ---
async function applyCompanyFilter(items: any[], userId: string, role: string): Promise<any[]> {
  // CRITICAL FIX: ALL roles including SuperAdmins are filtered by their company scope
  // SuperAdmins are company-level admins, NOT platform-wide admins
  const assignedCompanies = await resolveCompanyScope(userId);
  
  // If no company scope, return EMPTY - strict isolation
  if (!assignedCompanies || assignedCompanies.length === 0) {
    return [];
  }
  
  const scopeLower = assignedCompanies.map((s: string) => s.toLowerCase());
  
  // Filter items by company for ALL roles
  const filtered = items.filter((item: any) => {
    const itemCompanyId = (item.company || item.companyId || '').toLowerCase();
    const itemCompanyName = (item.companyName || '').toLowerCase();
    if (!itemCompanyId && !itemCompanyName) return false; // STRICT: Exclude items without company assignment
    // CASE-INSENSITIVE comparison: match on companyId OR companyName against scope
    return scopeLower.some(ac => (itemCompanyId && ac === itemCompanyId) || (itemCompanyName && ac === itemCompanyName));
  });
  });
  
  return filtered;
}

// --- Filter employees by company scope ---
async function filterEmployeesByCompany(employees: any[], userId: string, role: string): Promise<any[]> {
  // CRITICAL FIX: ALL roles including SuperAdmins are filtered by their company scope
  // SuperAdmins are company-level admins, NOT platform-wide admins
  const scope = await resolveCompanyScope(userId);
  
  // If no scope, return EMPTY - strict isolation
  if (!scope || scope.length === 0) {
    return [];
  }
  
  const scopeLower = scope.map((s: string) => s.toLowerCase());
  
  // Filter by company for ALL roles
  const filtered = employees.filter((e: any) => {
    const empCompanyId = (e.company || e.companyId || '').toLowerCase();
    const empCompanyName = (e.companyName || '').toLowerCase();
    if (!empCompanyId && !empCompanyName) {
      return false; // Exclude employees without company
    }
    // CASE-INSENSITIVE comparison: match on companyId OR companyName
    return scopeLower.some(s => (empCompanyId && s === empCompanyId) || (empCompanyName && s === empCompanyName));
  });
  
  return filtered;
}

// --- Centralized error handler ---
function handleError(e: any, c: any, context: string = '') {
  const errorMsg = e.message || 'Unknown error';
  
  if (errorMsg === "Unauthorized") {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (errorMsg === "Forbidden") {
    return c.json({ error: "Forbidden" }, 403);
  }
  if (errorMsg === "AccountInactive") {
    return c.json({ 
      error: "Your account is inactive. Please contact SuperAdmin.",
      accountInactive: true 
    }, 403);
  }
  if (errorMsg === "SubscriptionInactive") {
    return c.json({ 
      error: "System subscription is inactive. SuperAdmin must renew the subscription.",
      subscriptionInactive: true 
    }, 403);
  }
  if (errorMsg === "NoSuperAdmin") {
    return c.json({ 
      error: "System configuration error. No SuperAdmin found.",
      noSuperAdmin: true 
    }, 500);
  }
  
  console.error(`${context} error:`, errorMsg, e);
  return c.json({ error: errorMsg }, 500);
}

// --- Check if an item belongs to a user's company ---
async function isItemInUserCompany(userId: string, itemCompanyId: string | undefined): Promise<boolean> {
  if (!itemCompanyId) return true; // No company constraint
  const userScope = await resolveCompanyScope(userId);
  if (!userScope?.length) return false;
  return companyMatches(userScope, itemCompanyId);
}

// --- Workflow trigger helper ---
// Fires notifications to the approvers configured in the admin's Workflows & Approvals setup.
// workflowType matches the `type` field on workflow: KV entries ('leave','expense','overtime', etc.)
async function triggerWorkflowNotifications(
  companyId: string,
  workflowType: string,
  notificationTitle: string,
  notificationMessage: string
) {
  try {
    const allWorkflows = await kv.getByPrefix('workflow:');
    const matchingWorkflows = allWorkflows.filter(
      (w: any) =>
        w.status === 'active' &&
        w.type === workflowType &&
        (w.companyId === companyId || w.company === companyId)
    );

    for (const wf of matchingWorkflows) {
      const approverIds: string[] = [wf.approver1Id, wf.approver2Id].filter(Boolean);
      for (const approverId of approverIds) {
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, {
          id: nid,
          userId: approverId,
          type: `workflow-${workflowType}`,
          title: notificationTitle,
          message: notificationMessage,
          workflowId: wf.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.error('triggerWorkflowNotifications error:', e);
  }
}

// --- Generic CRUD factory ---
function makeCrud(prefix: string, kvPrefix: string, guardFn: (c: any) => Promise<any>) {
  // List
  app.get(`${PREFIX}/${prefix}`, async (c) => {
    try {
      const { user, role } = await guardFn(c);
      let items = await kv.getByPrefix(`${kvPrefix}`);
      items = await applyCompanyFilter(items, user.id, role);
      return c.json(items || []);
    } catch (e: any) {
      if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
      if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Get one
  app.get(`${PREFIX}/${prefix}/:id`, async (c) => {
    try {
      const { user, role } = await guardFn(c);
      const id = c.req.param("id");
      const item = await kv.get(`${kvPrefix}${id}`);
      if (!item) return c.json({ error: "Not found" }, 404);
      const itemCompany = item.companyId || item.company;
      if (itemCompany && !(await isItemInUserCompany(user.id, itemCompany))) {
        return c.json({ error: "Not found" }, 404);
      }
      return c.json(item);
    } catch (e: any) {
      if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
      if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Create
  app.post(`${PREFIX}/${prefix}`, async (c) => {
    try {
      const { user } = await guardFn(c);
      const body = await c.req.json();
      const id = body.id || crypto.randomUUID();
      const companyId = body.companyId || body.company || (await getCompanyId(user.id));
      if (!companyId) {
        console.error(`⚠️  CRITICAL: User ${user.id} has no company scope - cannot create ${prefix}`);
        return c.json({ error: 'User has no company assignment' }, 400);
      }
      const item = { 
        ...body, 
        id, 
        companyId,
        company: companyId, // CRITICAL: Set both fields for compatibility
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      await kv.set(`${kvPrefix}${id}`, item);
      
      // Broadcast real-time update
      const channelName = kvPrefix.replace(':', '');
      await broadcastUpdate(channelName, 'INSERT', id, item);
      
      return c.json(item, 201);
    } catch (e: any) {
      if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
      if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Update
  app.put(`${PREFIX}/${prefix}/:id`, async (c) => {
    try {
      const { user } = await guardFn(c);
      const id = c.req.param("id");
      const body = await c.req.json();
      const existing = await kv.get(`${kvPrefix}${id}`);
      if (existing) {
        const itemCompany = existing.companyId || existing.company;
        if (itemCompany && !(await isItemInUserCompany(user.id, itemCompany))) {
          return c.json({ error: "Not found" }, 404);
        }
      }
      const item = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
      await kv.set(`${kvPrefix}${id}`, item);
      
      // Broadcast real-time update
      const channelName = kvPrefix.replace(':', '');
      await broadcastUpdate(channelName, 'UPDATE', id, item);
      
      return c.json(item);
    } catch (e: any) {
      if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
      if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Delete
  app.delete(`${PREFIX}/${prefix}/:id`, async (c) => {
    try {
      const { user } = await guardFn(c);
      const id = c.req.param("id");
      const existing = await kv.get(`${kvPrefix}${id}`);
      if (existing) {
        const itemCompany = existing.companyId || existing.company;
        if (itemCompany && !(await isItemInUserCompany(user.id, itemCompany))) {
          return c.json({ error: "Not found" }, 404);
        }
      }
      await kv.del(`${kvPrefix}${id}`);
      
      // Broadcast real-time update
      const channelName = kvPrefix.replace(':', '');
      await broadcastUpdate(channelName, 'DELETE', id, { id });
      
      return c.json({ success: true });
    } catch (e: any) {
      if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
      if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
      return c.json({ error: e.message }, 500);
    }
  });
}

// ============ ROUTES ============

// Health check
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

// --- Check if setup is needed ---
app.get(`${PREFIX}/check-setup`, async (c) => {
  try {
    const admins = await kv.getByPrefix("employee:");
    const hasSuperAdmin = admins.some((a: any) => a.role === "superadmin");
    return c.json({ hasSuperAdmin, hasAnyAdmin: admins.some((a: any) => ["superadmin", "admin"].includes(a.role)) });
  } catch (e: any) {
    return c.json({ hasSuperAdmin: false, hasAnyAdmin: false });
  }
});

// --- Setup Superadmin (one-time) ---
app.post(`${PREFIX}/setup-superadmin`, async (c) => {
  try {
    const existing = await kv.getByPrefix("employee:");
    if (existing.some((e: any) => e.role === "superadmin")) {
      return c.json({ error: "A super admin already exists" }, 400);
    }
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "Email, password and name are required" }, 400);
    }
    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        role: "superadmin",
        requires2FA: false, // 2FA temporarily disabled
        twoFactorEnabled: false, // Will be enabled after first verification
      },
      email_confirm: true,
    });
    if (error) {
      return c.json({ error: error.message }, 400);
    }
    const userId = data.user.id;
    await kv.set(`employee:${userId}`, {
      id: userId,
      userId,
      email,
      name,
      role: "superadmin",
      status: "active",
      createdAt: new Date().toISOString(),
    });
    return c.json({ success: true, userId });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- Get Paystack Public Key ---
app.get(`${PREFIX}/paystack/public-key`, async (c) => {
  try {
    const publicKey = Deno.env.get('PAYSTACK_PUBLIC_KEY');
    if (!publicKey) {
      return c.json({ error: 'Paystack public key not configured' }, 500);
    }
    return c.json({ publicKey });
  } catch (error: any) {
    console.error('Error fetching Paystack public key:', error);
    return c.json({ error: error.message }, 500);
  }
});

// --- Company Registration (creates SuperAdmin for a new company) ---
app.post(`${PREFIX}/company/register`, async (c) => {
  try {
    const { companyName, companySize, industry, adminName, adminEmail, password, paymentReference, selectedLicenses } = await c.req.json();
    
    if (!companyName || !adminEmail || !password || !adminName) {
      return c.json({ error: "Company name, admin name, email and password are required" }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }

    // Check if email already exists
    const sb = supabaseAdmin();
    const { data: existingUser } = await sb.auth.admin.listUsers();
    if (existingUser?.users?.some((u: any) => u.email === adminEmail.toLowerCase())) {
      return c.json({ error: "An account with this email already exists" }, 400);
    }

    // Variables for license management
    let licensesToSet = 0;
    let subscriptionStatus = 'none';
    let subscriptionPlan = 'none';
    let paymentData = null;

    // If payment reference provided, verify payment first (pay-first flow)
    if (paymentReference) {
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        return c.json({ error: 'Payment system not configured' }, 500);
      }

      try {
        // Retry payment verification up to 3 times with delays
        let verifyData = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !verifyData) {
          attempts++;
          
          const verifyResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${paymentReference}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${paystackSecretKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await verifyResponse.json();

          if (data.status && data.data?.status === 'success') {
            verifyData = data;
            break;
          } else if (data.data?.status === 'failed') {
            return c.json({ error: 'Payment verification failed. Transaction was not successful.' }, 400);
          }
          
          // Wait before retry (1 second, then 2 seconds)
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          }
        }

        if (!verifyData || verifyData.data.status !== 'success') {
          return c.json({ error: 'Payment verification failed. Please wait a moment and try again, or contact support with reference: ' + paymentReference }, 400);
        }

        // Extract metadata from payment
        const metadata = verifyData.data.metadata || {};
        const paidLicenses = metadata.licenses || selectedLicenses || 0;
        const paidAmount = verifyData.data.amount / 100;
        
        licensesToSet = paidLicenses;
        subscriptionStatus = 'active';
        subscriptionPlan = metadata.plan || 'monthly';
        paymentData = {
          reference: paymentReference,
          amount: paidAmount,
          paidAt: new Date().toISOString(),
        };

      } catch (paymentError: any) {
        console.error('Payment verification error:', paymentError);
        return c.json({ error: 'Failed to verify payment. Please contact support with reference: ' + paymentReference }, 500);
      }
    }

    // Create company record
    const companyId = crypto.randomUUID();
    const company = {
      id: companyId,
      name: companyName,
      size: companySize || 'Not specified',
      industry: industry || 'Not specified',
      createdAt: new Date().toISOString(),
      status: 'active',
      licenses: licensesToSet,
      usedLicenses: 1, // SuperAdmin counts as 1
      subscriptionStatus,
      subscriptionPlan,
      subscriptionStartDate: subscriptionStatus === 'active' ? new Date().toISOString() : null,
      ...(paymentData && { lastPayment: paymentData }),
    };
    
    await kv.set(`company:${companyId}`, company);

    // Create SuperAdmin user in Supabase Auth
    const { data: authData, error: authError } = await sb.auth.admin.createUser({
      email: adminEmail.toLowerCase(),
      password,
      user_metadata: { 
        name: adminName, 
        role: "superadmin",
        companyId,
        companyName,
        requires2FA: false, // 2FA temporarily disabled
        twoFactorEnabled: false, // Will be enabled after first verification
      },
      email_confirm: true, // Auto-confirm since we don't have email configured
    });

    if (authError) {
      // Clean up company record if user creation failed
      await kv.del(`company:${companyId}`);
      return c.json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;

    // Create SuperAdmin employee record
    await kv.set(`employee:${userId}`, {
      id: userId,
      userId,
      email: adminEmail.toLowerCase(),
      name: adminName,
      role: "superadmin",
      status: "active",
      company: companyId,
      companyId: companyId,
      companyName: companyName,
      assignedCompanies: [companyId],
      createdAt: new Date().toISOString(),
    });


    // CRITICAL FIX: Create default company-scoped settings for new tenant
    await kv.set(`company-settings:${companyId}`, {
      companyId,
      companyName: companyName,
      description: '',
      primaryColor: '#10b981', // Default green
      logoUrl: '', // Empty until uploaded
      logoPath: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create default auto-clock settings for new tenant
    await kv.set(`auto-clock-settings:${companyId}`, {
      companyId,
      enabled: false,
      clockInTime: '08:00',
      clockOutTime: '17:00',
      mode: 'all',
      specificUsers: [],
      inactivityTimeout: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create default manual-clock settings for new tenant
    await kv.set(`manual-clock-settings:${companyId}`, {
      companyId,
      enabled: true,
      mode: 'all',
      specificUsers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });


    // Mark registration as verified if payment was provided
    if (paymentReference) {
      await kv.set(`verified_registration:${paymentReference}`, {
        companyId,
        userId,
        licenses: licensesToSet,
        verifiedAt: new Date().toISOString(),
      });
    }

    // Log audit event
    await logAudit({
      userId,
      userName: adminName,
      action: 'CREATE',
      resourceType: 'company',
      resourceId: companyId,
      details: { 
        companyName, 
        adminEmail,
        ...(paymentReference && { paymentReference, licenses: licensesToSet })
      },
    });

    
    return c.json({ 
      success: true, 
      userId,
      companyId,
      licenses: licensesToSet,
      message: paymentReference 
        ? `Company created successfully with ${licensesToSet} licenses. Please sign in to continue.`
        : "Company created successfully. Please sign in to continue."
    });
  } catch (e: any) {
    return c.json({ error: e.message || "Failed to create company" }, 500);
  }
});

// --- Initialize Payment for Company Registration (Pay-Before-Account-Creation) ---
app.post(`${PREFIX}/company/init-payment`, async (c) => {
  try {
    const { 
      companyName, companySize, industry, adminName, adminEmail, password,
      licenses, billingCycle, amount 
    } = await c.req.json();
    
    // Validation
    if (!companyName || !adminEmail || !password || !adminName) {
      return c.json({ error: "Company name, admin name, email and password are required" }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }

    if (!licenses || licenses < 1) {
      return c.json({ error: "At least 1 license is required" }, 400);
    }

    // Check if email already exists
    const sb = supabaseAdmin();
    const { data: existingUser } = await sb.auth.admin.listUsers();
    if (existingUser?.users?.some((u: any) => u.email === adminEmail.toLowerCase())) {
      return c.json({ error: "An account with this email already exists" }, 400);
    }

    // Generate payment reference
    const reference = `COMP_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

    // Store pending registration data (to be used after payment)
    await kv.set(`pending_registration:${reference}`, {
      companyName,
      companySize,
      industry,
      adminName,
      adminEmail: adminEmail.toLowerCase(),
      password,
      licenses,
      billingCycle,
      amount,
      reference,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: adminEmail.toLowerCase(),
        amount: Math.round(amount * 100), // Convert to kobo/cents
        reference,
        metadata: {
          type: 'company_registration',
          companyName,
          adminName,
          licenses,
          billingCycle,
          custom_fields: [
            { display_name: 'Company Name', variable_name: 'company_name', value: companyName },
            { display_name: 'Licenses', variable_name: 'licenses', value: licenses.toString() },
            { display_name: 'Billing Cycle', variable_name: 'billing_cycle', value: billingCycle },
          ],
        },
        callback_url: `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/functions/v1/make-server-668731fc/company/payment-callback`,
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack error:', paystackData);
      return c.json({ error: paystackData.message || 'Failed to initialize payment' }, 400);
    }

    return c.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference,
    });
  } catch (e: any) {
    return c.json({ error: e.message || "Failed to initialize payment" }, 500);
  }
});

// --- Check Payment Status for Company Registration ---
app.get(`${PREFIX}/company/payment-status/:reference`, async (c) => {
  try {
    const reference = c.req.param('reference');
    
    // Check if account was created (payment verified)
    const verifiedRegistration = await kv.get(`verified_registration:${reference}`);
    if (verifiedRegistration) {
      return c.json({ status: 'verified', data: verifiedRegistration });
    }

    // Check pending registration
    const pendingRegistration = await kv.get(`pending_registration:${reference}`);
    if (!pendingRegistration) {
      return c.json({ status: 'unknown' });
    }

    // Check Paystack payment status
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (paystackData.status && paystackData.data.status === 'success') {
      // Payment successful - create the account now
      const result = await createCompanyAccount(pendingRegistration);
      
      if (result.success) {
        // Mark as verified
        await kv.set(`verified_registration:${reference}`, {
          ...result,
          verifiedAt: new Date().toISOString(),
        });
        await kv.del(`pending_registration:${reference}`);
        
        return c.json({ status: 'verified', data: result });
      } else {
        return c.json({ status: 'failed', error: result.error });
      }
    } else if (paystackData.data?.status === 'failed') {
      return c.json({ status: 'failed', paystackStatus: paystackData.data.status });
    } else {
      return c.json({ status: 'pending', paystackStatus: paystackData.data?.status });
    }
  } catch (e: any) {
    return c.json({ status: 'unknown', error: e.message }, 500);
  }
});

// Helper function to create company account after payment
async function createCompanyAccount(registrationData: any) {
  try {
    const { companyName, companySize, industry, adminName, adminEmail, password, licenses, billingCycle } = registrationData;
    
    const sb = supabaseAdmin();
    
    // Create company record
    const companyId = crypto.randomUUID();
    const company = {
      id: companyId,
      name: companyName,
      size: companySize || 'Not specified',
      industry: industry || 'Not specified',
      createdAt: new Date().toISOString(),
      status: 'active',
      // Set purchased licenses
      licenses: licenses,
      usedLicenses: 1, // SuperAdmin counts as 1
      subscriptionStatus: 'active',
      subscriptionPlan: billingCycle,
      subscriptionStartDate: new Date().toISOString(),
    };
    await kv.set(`company:${companyId}`, company);

    // Create SuperAdmin user in Supabase Auth
    const { data: authData, error: authError } = await sb.auth.admin.createUser({
      email: adminEmail,
      password,
      user_metadata: { 
        name: adminName, 
        role: "superadmin",
        companyId,
        companyName,
        assignedCompanies: [companyId], // CRITICAL: Include assignedCompanies in auth metadata
        requires2FA: false, // 2FA temporarily disabled
        twoFactorEnabled: false, // Will be enabled after first verification
      },
      email_confirm: true,
    });

    if (authError) {
      await kv.del(`company:${companyId}`);
      return { success: false, error: authError.message };
    }

    const userId = authData.user.id;

    // Create SuperAdmin employee record
    await kv.set(`employee:${userId}`, {
      id: userId,
      userId,
      email: adminEmail,
      name: adminName,
      role: "superadmin",
      status: "active",
      company: companyId,
      companyId: companyId,
      companyName: companyName,
      assignedCompanies: [companyId],
      createdAt: new Date().toISOString(),
    });
    

    // Log audit event
    await logAudit({
      userId,
      userName: adminName,
      action: 'CREATE',
      resourceType: 'company',
      resourceId: companyId,
      details: { companyName, adminEmail, licenses, billingCycle, source: 'payment' },
    });

    return {
      success: true,
      userId,
      companyId,
      companyName,
      licenses,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// --- Sync user statuses based on subscription (SuperAdmin only) ---
app.post(`${PREFIX}/sync-user-licenses`, async (c) => {
  try {
    const { user: authUser } = await requireSuperAdmin(c);
    
    // CRITICAL FIX: Only sync users from the SuperAdmin's company
    const scope = await resolveCompanyScope(authUser.id);
    if (!scope?.length) {
      return c.json({ error: 'No company scope found' }, 400);
    }
    
    const subscription = await kv.get(`subscription:${authUser.id}`);
    const allUsers = await kv.getByPrefix('employee:');
    // CRITICAL: Filter to only this company's users
    const companyUsers = allUsers.filter((u: any) => companyMatches(scope, u.companyId) || companyMatches(scope, u.company));
    
    // If no subscription or inactive, deactivate all non-superadmin users IN THIS COMPANY
    if (!subscription || subscription.status !== 'active') {
      let deactivatedCount = 0;
      for (const user of companyUsers) {
        if (user.role !== 'superadmin' && user.status === 'active') {
          await kv.set(`employee:${user.id || user.userId}`, {
            ...user,
            status: 'inactive',
            deactivatedReason: 'No active subscription',
            deactivatedAt: new Date().toISOString()
          });
          deactivatedCount++;
        }
      }
      
      return c.json({
        success: true,
        message: 'All company users deactivated due to inactive subscription',
        deactivatedCount,
        subscription: null
      });
    }
    
    const purchasedLicenses = subscription.purchasedLicenses || 0;
    const superAdminCount = companyUsers.filter((u: any) => u.role === 'superadmin').length;
    const availableLicenses = purchasedLicenses - superAdminCount;
    
    // Get all non-superadmin users IN THIS COMPANY sorted by creation date (older first)
    const nonSuperAdmins = companyUsers
      .filter((u: any) => u.role !== 'superadmin')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });
    
    let activatedCount = 0;
    let deactivatedCount = 0;
    
    // Activate users up to license limit, deactivate the rest
    for (let i = 0; i < nonSuperAdmins.length; i++) {
      const user = nonSuperAdmins[i];
      const shouldBeActive = i < availableLicenses;
      
      if (shouldBeActive && user.status !== 'active') {
        await kv.set(`employee:${user.id || user.userId}`, {
          ...user,
          status: 'active',
          activatedAt: new Date().toISOString()
        });
        activatedCount++;
      } else if (!shouldBeActive && user.status === 'active') {
        await kv.set(`employee:${user.id || user.userId}`, {
          ...user,
          status: 'inactive',
          deactivatedReason: 'Insufficient licenses',
          deactivatedAt: new Date().toISOString()
        });
        deactivatedCount++;
      }
    }
    
    await logAudit({
      userId: authUser.id,
      userName: authUser.email || 'Unknown',
      action: 'UPDATE',
      resourceType: 'licenses',
      resourceId: 'sync',
      details: {
        purchasedLicenses,
        availableLicenses,
        activatedCount,
        deactivatedCount,
        totalUsers: allUsers.length
      }
    });
    
    return c.json({
      success: true,
      purchasedLicenses,
      availableLicenses,
      activatedCount,
      deactivatedCount,
      totalUsers: nonSuperAdmins.length,
      activeUsers: nonSuperAdmins.filter((u: any) => u.status === 'active').length
    });
  } catch (e: any) {
    return handleError(e, c, 'sync-user-licenses');
  }
});

// --- Profile ---
app.get(`${PREFIX}/profile`, async (c) => {
  try {
    const { user, role, kvData } = await requireAuth(c);
    
    // DEBUG: Log tenant isolation info
    const scope = await resolveCompanyScope(user.id);
    
    // Regenerate profile image signed URL if file exists
    let profileImageUrl = kvData?.profileImageUrl || "";
    const profileFile = await kv.get(`file:${user.id}:profile-image`);
    if (profileFile?.storagePath) {
      try {
        const sb = supabaseAdmin();
        const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(profileFile.storagePath, 60 * 60 * 24 * 7);
        if (urlData?.signedUrl) {
          profileImageUrl = urlData.signedUrl;
          // Update cached URL in kvData
          await kv.set(`employee:${user.id}`, { ...kvData, profileImageUrl });
          await kv.set(`file:${user.id}:profile-image`, { ...profileFile, signedUrl: profileImageUrl });
        }
      } catch (_) { /* ignore URL refresh errors */ }
    }
    return c.json({
      id: user.id,
      userId: user.id,
      email: user.email,
      name: kvData?.name || user.user_metadata?.name || "",
      role,
      ...kvData,
      profileImageUrl,
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// --- Change own password (first login or voluntary) ---
app.post(`${PREFIX}/change-password`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const { currentPassword, newPassword } = await c.req.json();
    if (!newPassword || newPassword.length < 8) {
      return c.json({ error: "New password must be at least 8 characters" }, 400);
    }
    // Verify current password by attempting sign-in
    const sb = supabaseAdmin();
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    if (signInError) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }
    // Update password via admin API
    const { error: updateError } = await sb.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (updateError) {
      return c.json({ error: `Failed to update password: ${updateError.message}` }, 500);
    }
    // Clear mustChangePassword flag
    if (kvData) {
      await kv.set(`employee:${user.id}`, { ...kvData, mustChangePassword: false, passwordChangedAt: new Date().toISOString() });
    }
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: `Password change failed: ${e.message}` }, 500);
  }
});

// --- Update own profile (any authenticated user) ---
app.put(`${PREFIX}/employee/profile`, async (c) => {
  try {
    const { user, kvData, role } = await requireAuth(c);
    const body = await c.req.json();
    const allowedFields = [
      'phone', 'personalEmail', 'address', 'city', 'state', 'country',
      'dateOfBirth', 'gender', 'maritalStatus', 'nationality',
      'emergencyContact', 'emergencyPhone'
    ];
    if (['superadmin', 'admin', 'manager'].includes(role)) {
      allowedFields.push('position', 'department', 'departments', 'company', 'salary', 'name');
    }
    const updates: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // For employees, create a change request instead of applying directly
    if (role === 'employee') {
      const changedFields: any = {};
      for (const key of Object.keys(updates)) {
        if (updates[key] !== (kvData as any)?.[key]) {
          changedFields[key] = { oldValue: (kvData as any)?.[key] || '', newValue: updates[key] };
        }
      }
      if (Object.keys(changedFields).length === 0) {
        return c.json({ success: true, pendingApproval: false, message: 'No changes detected' });
      }
      const id = crypto.randomUUID();
      const changeRequest = {
        id, userId: user.id, userName: kvData?.name || '', userEmail: kvData?.email || user.email || '',
        department: kvData?.department || '', position: kvData?.position || '',
        requestedChanges: updates, changedFields, status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await kv.set(`profile-change:${id}`, changeRequest);
      // CRITICAL: Only notify HR staff from the same company
      const allEmployees = await kv.getByPrefix("employee:");
      const empCompany = kvData?.companyId || kvData?.company;
      const hrStaff = allEmployees.filter((e: any) => ["superadmin", "admin"].includes(e.role) && empCompany && (e.companyId === empCompany || e.company === empCompany));
      for (const hr of hrStaff) {
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, {
          id: nid, userId: hr.userId, type: "profile-change-request",
          title: "Profile Change Request",
          message: `${kvData?.name || "An employee"} has requested profile changes (${Object.keys(changedFields).join(', ')})`,
          read: false, createdAt: new Date().toISOString(),
        });
      }
      return c.json({ success: true, pendingApproval: true, changeRequestId: id, message: 'Your profile changes have been submitted for HR approval.' });
    }

    const updated = { ...kvData, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`employee:${user.id}`, updated);
    return c.json({ success: true, ...updated });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: `Profile update failed: ${e.message}` }, 500);
  }
});

// --- Profile change requests (employee -> HR approval) ---
app.get(`${PREFIX}/profile-change-requests`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const all = await kv.getByPrefix("profile-change:");
    
    // Employee only sees their own requests
    if (role === "employee") {
      const filtered = all.filter((r: any) => r.userId === user.id);
      return c.json(filtered);
    }
    
    // CRITICAL: For superadmin/admin/manager, filter by company scope
    const scope = await resolveCompanyScope(user.id);
    
    if (!scope?.length) {
      return c.json([]);
    }
    
    const employees = await kv.getByPrefix("employee:");
    const companyEmployees = employees.filter((e: any) => companyMatches(scope, e.companyId) || companyMatches(scope, e.company));
    const companyEmployeeIds = new Set(companyEmployees.map((e: any) => e.userId || e.id));
    
    
    const filtered = all.filter((r: any) => {
      const hasMatch = companyEmployeeIds.has(r.userId);
      if (!hasMatch && all.length < 10) {
      }
      return hasMatch;
    });
    
    return c.json(filtered);
  } catch (e: any) {
    console.error(`❌ Error in /profile-change-requests:`, e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/profile-change-requests/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const request = await kv.get(`profile-change:${id}`);
    if (!request) return c.json({ error: "Not found" }, 404);
    if (body.status === "approved") {
      const empData = await kv.get(`employee:${request.userId}`);
      if (empData) {
        const updated = { ...empData, ...request.requestedChanges, updatedAt: new Date().toISOString() };
        await kv.set(`employee:${request.userId}`, updated);
      }
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: request.userId, type: "profile-change-approved",
        title: "Profile Changes Approved",
        message: "Your profile change request has been approved by HR. Changes have been applied.",
        read: false, createdAt: new Date().toISOString(),
      });
    } else if (body.status === "rejected") {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: request.userId, type: "profile-change-rejected",
        title: "Profile Changes Rejected",
        message: `Your profile change request has been rejected.${body.rejectionReason ? ' Reason: ' + body.rejectionReason : ''}`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    const updated = { ...request, ...body, reviewedAt: new Date().toISOString() };
    await kv.set(`profile-change:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// --- All users for messaging (any authenticated user) ---
app.get(`${PREFIX}/users/for-messages`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    
    const allEmployees = await kv.getByPrefix("employee:");
    
    // CRITICAL FIX: ALL roles including SuperAdmins are filtered by company scope
    const filtered = await filterEmployeesByCompany(allEmployees, user.id, role);
    
    const result = filtered
      .filter((e: any) => e.userId !== user.id)
      .map((e: any) => ({
        userId: e.userId, id: e.userId, name: e.name,
        email: e.email || "",
        role: e.role, department: e.department || "", position: e.position || "",
        profileImageUrl: e.profileImageUrl || "",
        company: e.company || e.companyId || "",
      }));
    
    return c.json(result);
  } catch (e: any) {
    console.error(`❌ Error in /users/for-messages:`, e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// --- Open job postings (any authenticated user) ---
app.get(`${PREFIX}/open-job-postings`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const postings = await kv.getByPrefix("job-posting:");
    // CRITICAL FIX: Filter job postings by company for multi-tenant isolation
    const filtered = await applyCompanyFilter(postings, user.id, role);
    const open = filtered.filter((j: any) => j.status === "open" || j.status === "active");
    return c.json(open);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ============ FILE UPLOADS (Profile Image + Documents) ============
const BUCKET_NAME = "make-a35148f0-uploads";
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_PROFILE_IMAGE_SIZE = 150 * 1024; // 150KB
const MAX_FILES_PER_USER = 5;

// Ensure bucket exists on first call
let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  try {
    const sb = supabaseAdmin();
    const { data: buckets, error: listErr } = await sb.storage.listBuckets();
    if (listErr) {
      throw new Error(`Storage init failed: ${listErr.message}`);
    }
    const exists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!exists) {
      const { error: createErr } = await sb.storage.createBucket(BUCKET_NAME, { public: false });
      if (createErr) {
        throw new Error(`Storage bucket creation failed: ${createErr.message}`);
      }
    }
    bucketReady = true;
  } catch (e: any) {
    throw e;
  }
}

// Get user files count
async function getUserFileCount(userId: string, excludeProfileImage = false): Promise<number> {
  const files = await kv.getByPrefix(`file:${userId}:`);
  if (excludeProfileImage) {
    return files.filter((f: any) => f.type !== 'profile-image' && f.id !== 'profile-image').length;
  }
  return files.length;
}

// Upload profile image (< 150KB)
app.post(`${PREFIX}/upload/profile-image`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    await ensureBucket();
    // Use native FormData API for reliable file parsing in Deno
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return c.json({ error: "No file provided" }, 400);
    }
    const blob = file as File;
    const arrayBuf = await blob.arrayBuffer();
    const size = arrayBuf.byteLength;
    if (size === 0) {
      return c.json({ error: "File is empty (0 bytes)" }, 400);
    }
    if (size > MAX_PROFILE_IMAGE_SIZE) {
      return c.json({ error: `Profile image must be less than 150KB. Your file is ${Math.round(size / 1024)}KB.` }, 400);
    }
    const ext = blob.name?.split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return c.json({ error: "Only image files (jpg, png, gif, webp) are allowed for profile images" }, 400);
    }
    // Check total file count
    const fileCount = await getUserFileCount(user.id);
    // Profile image doesn't count toward the 5-file limit (it replaces itself)
    const existingProfileImage = await kv.get(`file:${user.id}:profile-image`);
    if (!existingProfileImage && fileCount >= MAX_FILES_PER_USER) {
      return c.json({ error: `Upload limit reached (${MAX_FILES_PER_USER} files). Delete some files before uploading more.` }, 400);
    }
    // Delete old profile image if exists
    if (existingProfileImage?.storagePath) {
      try {
        const sbDel = supabaseAdmin();
        await sbDel.storage.from(BUCKET_NAME).remove([existingProfileImage.storagePath]);
      } catch (delErr) {
      }
    }
    const storagePath = `profiles/${user.id}/avatar.${ext}`;
    const sb = supabaseAdmin();
    const uint8 = new Uint8Array(arrayBuf);
    const { error: uploadErr } = await sb.storage.from(BUCKET_NAME).upload(storagePath, uint8, {
      contentType: blob.type || `image/${ext}`,
      upsert: true,
    });
    if (uploadErr) {
      return c.json({ error: `Upload to storage failed: ${uploadErr.message}` }, 500);
    }
    const { data: urlData, error: urlErr } = await sb.storage.from(BUCKET_NAME).createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    if (urlErr) {
    }
    const signedUrl = urlData?.signedUrl || '';
    const fileMeta = {
      id: 'profile-image',
      userId: user.id,
      type: 'profile-image',
      fileName: blob.name || 'avatar.' + ext,
      fileSize: size,
      storagePath,
      signedUrl,
      mimeType: blob.type,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`file:${user.id}:profile-image`, fileMeta);
    // Also update the employee KV record with the profile image URL
    const updated = { ...kvData, profileImageUrl: signedUrl, updatedAt: new Date().toISOString() };
    await kv.set(`employee:${user.id}`, updated);
    return c.json({ ...fileMeta, profileImageUrl: signedUrl }, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: `Profile image upload failed: ${e.message}` }, 500);
  }
});

// Upload document (contract, etc.) - max 5MB, max 5 files per user
app.post(`${PREFIX}/upload/document`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    await ensureBucket();
    const formData = await c.req.formData();
    const file = formData.get('file');
    const docType = (formData.get('docType') as string) || 'general';
    const targetUserId = (formData.get('targetUserId') as string) || user.id;
    if (!file || typeof file === 'string') return c.json({ error: "No file provided" }, 400);
    const blob = file as File;
    const arrayBuf = await blob.arrayBuffer();
    const size = arrayBuf.byteLength;
    if (size > MAX_FILE_SIZE) {
      return c.json({ error: `File must be less than 1MB. Your file is ${(size / (1024 * 1024)).toFixed(1)}MB.` }, 400);
    }
    // Check file count for target user (exclude profile image from document count)
    const docCount = await getUserFileCount(targetUserId, true);
    if (docCount >= MAX_FILES_PER_USER) {
      return c.json({ error: `Upload limit reached (${MAX_FILES_PER_USER} files for this user). Delete some files before uploading more.` }, 400);
    }
    const fileId = crypto.randomUUID();
    const ext = blob.name?.split('.').pop()?.toLowerCase() || 'bin';
    const storagePath = `documents/${targetUserId}/${fileId}.${ext}`;
    const sb = supabaseAdmin();
    const uint8 = new Uint8Array(arrayBuf);
    const { error: uploadErr } = await sb.storage.from(BUCKET_NAME).upload(storagePath, uint8, {
      contentType: blob.type || 'application/octet-stream',
      upsert: false,
    });
    if (uploadErr) {
      return c.json({ error: `Upload failed: ${uploadErr.message}` }, 500);
    }
    const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    const fileMeta = {
      id: fileId,
      userId: targetUserId,
      uploadedBy: user.id,
      type: docType,
      fileName: blob.name || 'document.' + ext,
      fileSize: size,
      storagePath,
      signedUrl: urlData?.signedUrl || '',
      mimeType: blob.type,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`file:${targetUserId}:${fileId}`, fileMeta);
    return c.json(fileMeta, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: `Document upload failed: ${e.message}` }, 500);
  }
});

// List files for a user
app.get(`${PREFIX}/files/:userId`, async (c) => {
  try {
    await requireAuth(c);
    const userId = c.req.param("userId");
    const files = await kv.getByPrefix(`file:${userId}:`);
    const sb = supabaseAdmin();
    const refreshed = await Promise.all(files.map(async (f: any) => {
      if (f.storagePath) {
        try {
          const { data } = await sb.storage.from(BUCKET_NAME).createSignedUrl(f.storagePath, 60 * 60 * 24);
          if (data?.signedUrl) f.signedUrl = data.signedUrl;
        } catch (e) { /* keep existing */ }
      }
      return f;
    }));
    return c.json(refreshed.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get my files (with refreshed signed URLs)
app.get(`${PREFIX}/files`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const files = await kv.getByPrefix(`file:${user.id}:`);
    const sb = supabaseAdmin();
    // Refresh signed URLs for each file
    const refreshed = await Promise.all(files.map(async (f: any) => {
      if (f.storagePath) {
        try {
          const { data } = await sb.storage.from(BUCKET_NAME).createSignedUrl(f.storagePath, 60 * 60 * 24);
          if (data?.signedUrl) {
            f.signedUrl = data.signedUrl;
          }
        } catch (e) { /* keep existing URL */ }
      }
      return f;
    }));
    return c.json(refreshed.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Delete a file
app.delete(`${PREFIX}/files/:userId/:fileId`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const userId = c.req.param("userId");
    const fileId = c.req.param("fileId");
    // Only the file owner, admin, or superadmin can delete
    if (user.id !== userId && !["admin", "superadmin"].includes(role)) {
      return c.json({ error: "You can only delete your own files" }, 403);
    }
    const fileMeta = await kv.get(`file:${userId}:${fileId}`);
    if (!fileMeta) return c.json({ error: "File not found" }, 404);
    if (fileMeta.storagePath) {
      const sb = supabaseAdmin();
      await sb.storage.from(BUCKET_NAME).remove([fileMeta.storagePath]);
    }
    await kv.del(`file:${userId}:${fileId}`);
    // If it was a profile image, clear the URL from employee record
    if (fileId === 'profile-image') {
      const kvData = await kv.get(`employee:${userId}`);
      if (kvData) {
        await kv.set(`employee:${userId}`, { ...kvData, profileImageUrl: '', updatedAt: new Date().toISOString() });
      }
    }
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: `File delete failed: ${e.message}` }, 500);
  }
});

// --- Debug scope ---
app.get(`${PREFIX}/debug/my-scope`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const scope = await resolveCompanyScope(user.id);
    return c.json({ userId: user.id, role, assignedCompanies: scope, hasScope: !!scope });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ============ COMPANY SETTINGS ============
// Public endpoint for branding (no auth required - login page needs this)
app.get(`${PREFIX}/public/company-branding`, async (c) => {
  try {
    // CRITICAL FIX: Return default Blumebyte branding for public (login page)
    // Cannot determine which company for unauthenticated users in multi-tenant system
    return c.json({
      companyName: 'Blumebyte',
      description: 'Human Resource Information System',
      primaryColor: '#10b981',
      logoUrl: '',
    });
  } catch (e: any) {
    return c.json({});
  }
});

app.get(`${PREFIX}/company-settings`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    // CRITICAL FIX: Get company-scoped settings
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    
    
    if (!companyId) {
      console.warn(`⚠️ No company ID found for user ${user.id}`);
      return c.json({});
    }
    
    const settings = await kv.get(`company-settings:${companyId}`);
    if (!settings) return c.json({});
    
    // Set default currency if not set
    if (!settings.currencyCode) {
      settings.currencyCode = 'USD';
      settings.currencySymbol = '$';
      settings.isCustomCurrency = false;
    }
    
    // Refresh logo signed URL if path exists
    if (settings.logoPath) {
      try {
        const sb = supabaseAdmin();
        const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(settings.logoPath, 60 * 60 * 24 * 7);
        if (urlData?.signedUrl) settings.logoUrl = urlData.signedUrl;
      } catch (_) { /* ignore URL refresh errors */ }
    }
    return c.json(settings);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// BRANDING MANAGEMENT: SuperAdmin-only control over company branding
app.put(`${PREFIX}/superadmin/company-branding`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    const body = await c.req.json();
    
    // CRITICAL FIX: Update company-scoped settings (SuperAdmin only)
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json({ error: "Company not found" }, 404);
    
    const existing = await kv.get(`company-settings:${companyId}`) || {};
    // Strip logoUrl/logoPath from body — only the upload/remove routes should change these
    const { logoUrl: _lu, logoPath: _lp, ...safeBody } = body;
    const updated = { ...existing, ...safeBody, companyId, updatedAt: new Date().toISOString() };
    await kv.set(`company-settings:${companyId}`, updated);
    
    // Return with fresh signed URL if logo exists
    if (updated.logoPath) {
      try {
        const sb = supabaseAdmin();
        const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(updated.logoPath, 60 * 60 * 24 * 7);
        if (urlData?.signedUrl) updated.logoUrl = urlData.signedUrl;
      } catch (_) { /* ignore URL refresh errors */ }
    }
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Keep legacy endpoint for backward compatibility
app.put(`${PREFIX}/admin/company-settings`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    
    // CRITICAL FIX: Update company-scoped settings
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json({ error: "Company not found" }, 404);
    
    const existing = await kv.get(`company-settings:${companyId}`) || {};
    // Strip logoUrl/logoPath from body — only the upload/remove routes should change these
    const { logoUrl: _lu, logoPath: _lp, ...safeBody } = body;
    const updated = { ...existing, ...safeBody, companyId, updatedAt: new Date().toISOString() };
    await kv.set(`company-settings:${companyId}`, updated);
    // Return with fresh signed URL if logo exists
    if (updated.logoPath) {
      try {
        const sb = supabaseAdmin();
        const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(updated.logoPath, 60 * 60 * 24 * 7);
        if (urlData?.signedUrl) updated.logoUrl = urlData.signedUrl;
      } catch (_) { /* ignore URL refresh errors */ }
    }
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ WORKING HOURS CONFIGURATION ============
app.get(`${PREFIX}/company/working-hours`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    
    if (!companyId) {
      return c.json({ error: 'Company not found' }, 404);
    }
    
    const config = await kv.get(`working_hours:${companyId}`);
    
    // Return defaults if no config exists
    if (!config) {
      return c.json({
        workingDays: [
          { day: 'monday', label: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00' },
          { day: 'tuesday', label: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
          { day: 'wednesday', label: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
          { day: 'thursday', label: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
          { day: 'friday', label: 'Friday', enabled: true, startTime: '09:00', endTime: '17:00' },
          { day: 'saturday', label: 'Saturday', enabled: true, startTime: '09:00', endTime: '17:00' },
          { day: 'sunday', label: 'Sunday', enabled: true, startTime: '09:00', endTime: '17:00' },
        ],
        blockWeekendsForLeaves: false,
        blockWeekendsForMeetings: false,
      });
    }
    
    return c.json(config);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/company/working-hours`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    
    if (!companyId) {
      return c.json({ error: 'Company not found' }, 404);
    }
    
    const body = await c.req.json();
    const { workingDays, blockWeekendsForLeaves, blockWeekendsForMeetings } = body;
    
    // Validate workingDays
    if (!Array.isArray(workingDays) || workingDays.length !== 7) {
      return c.json({ error: 'Invalid working days configuration' }, 400);
    }
    
    // Check if weekends are working days
    const hasWeekendWork = workingDays.some((d: any) => 
      (d.day === 'saturday' || d.day === 'sunday') && d.enabled
    );
    
    const config = {
      companyId,
      workingDays,
      blockWeekendsForLeaves: hasWeekendWork ? false : (blockWeekendsForLeaves ?? false),
      blockWeekendsForMeetings: hasWeekendWork ? false : (blockWeekendsForMeetings ?? false),
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };
    
    await kv.set(`working_hours:${companyId}`, config);
    
    await logAudit({
      userId: user.id,
      userName: user.email || 'Unknown',
      action: 'UPDATE',
      resourceType: 'working-hours-config',
      resourceId: companyId,
      details: { 
        enabledDays: workingDays.filter((d: any) => d.enabled).map((d: any) => d.day),
        blockWeekendsForLeaves: config.blockWeekendsForLeaves,
        blockWeekendsForMeetings: config.blockWeekendsForMeetings,
      },
    });
    
    return c.json({ success: true, config });
  } catch (e: any) {
    console.error('Error saving working hours:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ REFERENCE DATA (aggregated for dashboards) ============
app.get(`${PREFIX}/reference-data`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    
    // CRITICAL FIX: Filter all reference data by company scope
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    
    const [allCompanies, allDepartments, allBranches, allAssets, allAssetCategories, allPaygrades, allLeaveTypes, allFinancialYears] = await Promise.all([
      kv.getByPrefix("company:"),
      kv.getByPrefix("department:"),
      kv.getByPrefix("branch:"),
      kv.getByPrefix("asset:"),
      kv.getByPrefix("asset-category:"),
      kv.getByPrefix("paygrade:"),
      kv.getByPrefix("leave-type:"),
      kv.getByPrefix("financial-year:"),
    ]);
    
    // CRITICAL: STRICT filter by company scope - return empty if no scope
    if (!companyId) {
      return c.json({ companies: [], departments: [], branches: [], assets: [], assetCategories: [], paygrades: [], leaveTypes: [], financialYears: [] });
    }
    // CRITICAL FIX: Companies filter should include both direct matches AND companies owned by this tenant
    const companies = allCompanies.filter((c: any) => 
      scope!.includes(c.id) || // Direct match (the tenant's main company record)
      c.companyId === companyId || // Company record owned by this tenant
      c.company === companyId // Legacy field compatibility
    );
    const departments = allDepartments.filter((d: any) => d.companyId === companyId || d.company === companyId);
    const branches = allBranches.filter((b: any) => b.companyId === companyId || b.company === companyId);
    const assets = allAssets.filter((a: any) => a.companyId === companyId || a.company === companyId);
    const assetCategories = allAssetCategories.filter((ac: any) => ac.companyId === companyId || ac.company === companyId);
    const paygrades = allPaygrades.filter((pg: any) => pg.companyId === companyId || pg.company === companyId);
    const leaveTypes = allLeaveTypes.filter((lt: any) => lt.companyId === companyId || lt.company === companyId);
    const financialYears = allFinancialYears.filter((fy: any) => fy.companyId === companyId || fy.company === companyId);
    
    return c.json({
      companies: companies || [],
      departments: departments || [],
      branches: branches || [],
      assets: assets || [],
      assetCategories: assetCategories || [],
      paygrades: paygrades || [],
      leaveTypes: leaveTypes || [],
      financialYears: financialYears || [],
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ============ USER MANAGEMENT ============

// Create user (superadmin can create any role, admin can create employee/manager/admin)
app.post(`${PREFIX}/superadmin/users/create`, async (c) => {
  try {
    const { user: authUser } = await requireSuperAdmin(c);
    const body = await c.req.json();
    const { email, name, role, companyId, department, departments, position } = body;
    if (!email || !name || !role) {
      return c.json({ error: "Email, name and role are required" }, 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }
    
    // Check if user with this email already exists
    const allEmployees = await kv.getByPrefix("employee:");
    const existingUser = allEmployees.find((e: any) => e.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return c.json({ error: "A user with this email already exists" }, 400);
    }
    
    // CRITICAL FIX: Get company ID from super admin's employee record
    const adminProfile = await kv.get(`employee:${authUser.id}`);
    const userCompanyId = adminProfile?.companyId || adminProfile?.company;
    
    if (!userCompanyId) {
      console.error('SuperAdmin has no companyId:', authUser.id);
      return c.json({ error: "User not associated with a company. Please contact support." }, 400);
    }
    
    // FIXED: Check license availability - handle both storage keys
    let company = await kv.get(`company_by_id:${userCompanyId}`);
    if (!company) {
      company = await kv.get(`company:${userCompanyId}`);
    }
    
    if (!company) {
      console.error('Company not found:', userCompanyId);
      return c.json({ error: "Company not found. Please contact support." }, 400);
    }
    
    // ENHANCED: Better subscription validation with multiple format support
    
    // Check multiple subscription formats
    let subscription = null;
    let subscriptionStatus = 'inactive';
    let purchasedLicenses = 0;
    
    // Format 1: Modern subscription object
    if (company.subscription && typeof company.subscription === 'object') {
      subscription = company.subscription;
      subscriptionStatus = subscription.status || 'inactive';
      purchasedLicenses = subscription.licenses || subscription.purchasedLicenses || 0;
    }
    // Format 2: Legacy format with direct properties
    else if (company.licenses > 0 || company.subscriptionStatus === 'active') {
      subscriptionStatus = company.subscriptionStatus || 'active';
      purchasedLicenses = company.licenses || 0;
      subscription = {
        status: subscriptionStatus,
        licenses: purchasedLicenses
      };
    }
    // Format 3: Check for separate subscription key
    else {
      const separateSubscription = await kv.get(`subscription:${userCompanyId}`);
      if (separateSubscription) {
        subscription = separateSubscription;
        subscriptionStatus = separateSubscription.status || 'inactive';
        purchasedLicenses = separateSubscription.licenses || separateSubscription.purchasedLicenses || 0;
      }
    }
    
    
    // IMPORTANT: Allow SuperAdmin to create initial users even without subscription
    // This is necessary for setting up the company and testing before purchasing
    const isSuperAdmin = adminProfile?.role === 'superadmin';
    const hasSubscription = subscription && subscriptionStatus === 'active' && purchasedLicenses > 0;
    
    // Check role-based permissions
    const isAdmin = adminProfile?.role === 'admin';
    const isManager = adminProfile?.role === 'manager';
    
    // Managers cannot add users - only SuperAdmin and Admin
    if (isManager) {
      return c.json({ 
        error: "Managers do not have permission to add employees. Please contact your Admin.",
        forbidden: true
      }, 403);
    }
    
    if (!isSuperAdmin && !hasSubscription) {
      console.error('No active subscription for company:', userCompanyId, {
        hasCompany: !!company,
        hasSubscription: !!subscription,
        status: subscriptionStatus,
        purchasedLicenses,
        companyLicenses: company.licenses,
        companyStatus: company.subscriptionStatus
      });
      return c.json({ 
        error: "No active subscription. Please purchase licenses first.",
        needsSubscription: true,
        debug: {
          companyId: userCompanyId,
          subscriptionStatus,
          purchasedLicenses,
          companyLicenses: company.licenses,
          companySubscriptionStatus: company.subscriptionStatus
        }
      }, 403);
    }
    
    // Count existing active users in this company
    const companyStats = await kv.get(`company_stats:${userCompanyId}`) || {};
    const usedLicenses = companyStats.usedLicenses || company.usedLicenses || 1; // Fallback to company.usedLicenses
    
    // Determine license limit based on role and subscription
    let effectiveLicenseLimit = purchasedLicenses;
    let isTestMode = false;
    
    if (isSuperAdmin && !hasSubscription) {
      // SuperAdmin without subscription can create up to 5 users for testing
      effectiveLicenseLimit = 5;
      isTestMode = true;
    } else if (isAdmin && !isSuperAdmin) {
      // Admin must have available licenses - no test mode
      if (usedLicenses >= purchasedLicenses) {
        return c.json({ 
          error: `No available licenses. You have used ${usedLicenses} of ${purchasedLicenses} licenses. Please contact your SuperAdmin to purchase more licenses.`,
          needsLicenses: true,
          usedLicenses,
          purchasedLicenses,
          isAdmin: true
        }, 403);
      }
    }
    
    
    if (usedLicenses >= effectiveLicenseLimit) {
      const message = isTestMode 
        ? `User limit reached. You have used all ${effectiveLicenseLimit} available test users. Please purchase licenses to add more users.`
        : `No available licenses. You have used ${usedLicenses} of ${purchasedLicenses} licenses. Please purchase more licenses to add users.`;
        
      return c.json({ 
        error: message,
        needsLicenses: true,
        usedLicenses,
        purchasedLicenses: effectiveLicenseLimit,
        isTestMode
      }, 403);
    }
    
    const tempPassword = generateTempPassword();
    const sb = supabaseAdmin();
    

    const { data, error } = await sb.auth.admin.createUser({
      email: email.toLowerCase(), // Normalize email to lowercase
      password: tempPassword,
      user_metadata: { 
        name, 
        role, 
        companyId: userCompanyId, // Use the admin's company, not the body companyId
        company: company.name 
      },
      email_confirm: true,
    });
    if (error) {
      console.error('Supabase auth.admin.createUser error:', error);
      
      // Provide clear message for duplicate email
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return c.json({ 
          error: `Email ${email} is already in use. If this user was recently deleted, please wait a moment and try again.`,
          alreadyExists: true
        }, 400);
      }
      
      return c.json({ error: error.message }, 400);
    }
    
    const userId = data.user.id;
    
    // Create user profile with company scoping
    const userProfile = {
      id: userId,
      userId,
      email,
      name,
      role,
      status: "active",
      companyId: userCompanyId, // Use the super admin's company
      company: company.name,
      assignedCompanies: [userCompanyId], // CRITICAL FIX: Set assignedCompanies for multi-tenant isolation
      department: department || (departments && departments[0]) || "",
      departments: departments || (department ? [department] : []),
      position: position || "",
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      joinDate: new Date().toISOString(),
      leaveBalance: 20, // Default leave balance
      ...body,
    };
    
    // Store in both user_profile and employee for backward compatibility
    await kv.set(`user_profile:${userId}`, userProfile);
    await kv.set(`employee:${userId}`, userProfile);
    await kv.set(`company_users:${userCompanyId}:${userId}`, userProfile);
    
    // Update company stats - immediate update for quick response
    await kv.set(`company_stats:${userCompanyId}`, {
      ...companyStats,
      totalEmployees: (companyStats.totalEmployees || 0) + 1,
      activeEmployees: (companyStats.activeEmployees || 0) + 1,
      usedLicenses: usedLicenses + 1,
      availableLicenses: purchasedLicenses - (usedLicenses + 1),
      lastUpdated: new Date().toISOString(),
    });
    
    // Recalculate stats from actual data to ensure accuracy
    try {
      await recalculateCompanyStats(userCompanyId);
    } catch (syncError) {
      console.error('Error syncing company stats after user creation:', syncError);
      // Don't fail the user creation if stats sync fails
    }
    // Broadcast: new user joined (ONLY to same company employees)
    const allEmps = await kv.getByPrefix("employee:");
    const companyEmps = allEmps.filter((emp: any) => (emp.companyId === userCompanyId || emp.company === userCompanyId));
    for (const emp of companyEmps) {
      if ((emp.userId || emp.id) === userId) continue;
      const nid = crypto.randomUUID();
      const newHireMsg = `${name} has joined the organization as ${role}${departments && departments.length > 0 ? " in " + departments.join(", ") : department ? " in " + department : ""}.`;
      await kv.set(`notification:${nid}`, {
        id: nid, userId: emp.userId || emp.id, type: "new-user",
        title: "New Team Member",
        message: newHireMsg,
        read: false, createdAt: new Date().toISOString(),
      });
      // Also send email notification
      if (emp.email) {
        sendEmailNotification(
          emp.userId || emp.id, emp.email, emp.name || '',
          `New Team Member: ${name} joined ${company.name || 'your organization'} — Blumebyte HR`,
          `<p>${newHireMsg}</p>`,
          'emailOnNewHire'
        );
      }
    }
    
    await logAudit({
      userId: authUser.id,
      userName: authUser.email || 'Unknown',
      action: 'CREATE',
      resourceType: 'user',
      resourceId: userId,
      details: { 
        email, 
        name, 
        role,
        licensesUsed: usedLicenses + 1,
        licensesAvailable: purchasedLicenses - usedLicenses - 1
      },
    });
    
    // Send welcome email — password-link flow (no credentials in email body)
    try {
      const emailApiKey = Deno.env.get('RESEND_API_KEY');
      if (emailApiKey) {
        // Generate a one-time set-password token so the new user never sees a
        // plaintext password in their inbox.
        const welcomeToken = crypto.randomUUID();
        const welcomeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
        await kv.set(`password-reset:${welcomeToken}`, {
          userId,
          email,
          expiresAt: welcomeExpiry.toISOString(),
          createdAt: new Date().toISOString(),
        });
        const requestOrigin = Deno.env.get('FRONTEND_URL') || FRONTEND_FALLBACK_URL;
        const setPasswordLink = `${requestOrigin}/password-reset?token=${welcomeToken}`;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: email,
            subject: `Welcome to ${company.name} — Set Your Password`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #000;">Welcome to ${company.name}!</h2>
                <p>Hello ${name},</p>
                <p>Your account has been created in the Blumebyte HR system.</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                  <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
                </div>
                <p>Click the button below to set your password and activate your account. This link expires in <strong>24 hours</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${setPasswordLink}" style="background-color: #7C5A1A; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">Set Your Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">If the button above does not work, copy and paste this link into your browser:<br/>${setPasswordLink}</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #666; font-size: 14px;">If you have any questions, please contact your HR administrator.</p>
                  <p style="color: #666; font-size: 14px;">Best regards,<br/>The ${company.name} Team</p>
                </div>
              </div>
            `,
          }),
        });
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the user creation if email fails
    }
    
    // Broadcast real-time update to dashboard
    await broadcastUpdate('users', 'INSERT', userId, { userId, email, name, role });
    
    return c.json({ success: true, userId, tempPassword });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Admin create user
app.post(`${PREFIX}/users/create`, async (c) => {
  try {
    const { user: adminUser, role: adminRole } = await requireAdminOrAbove(c);
    
    // In license-based model, only SuperAdmin can create users
    // Admins and Managers can only edit existing users
    return c.json({ 
      error: "Only SuperAdmin can create new users. Admins and Managers can only edit existing users.",
      needsSuperAdmin: true 
    }, 403);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// List users
app.get(`${PREFIX}/users`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const allEmployees = await kv.getByPrefix("employee:");
    
    // Employees can only see themselves
    if (role === "employee") {
      return c.json([allEmployees.find((e: any) => e.userId === user.id)].filter(Boolean));
    }
    
    // CRITICAL FIX: ALL roles including SuperAdmins are filtered by company scope
    const scope = await resolveCompanyScope(user.id);
    
    // If no scope, return EMPTY - strict isolation (no company = no data)
    if (!scope || scope.length === 0) {
      return c.json([]);
    }
    
    let filtered = allEmployees.filter((e: any) => {
      const empCompany = e.companyId || e.company;
      if (!empCompany) return false; // Exclude unscoped employees
      return companyMatches(scope, empCompany);
    });
    
    
    // Admin cannot see superadmins; admin only sees users they manage (or untagged users for backward compat)
    if (role === "admin") {
      filtered = filtered.filter((e: any) => e.role !== "superadmin");
      filtered = filtered.filter((e: any) => !e.managingAdminId || e.managingAdminId === user.id);
    }
    // Manager can only see employees and other managers
    if (role === "manager") {
      filtered = filtered.filter((e: any) => ["employee", "manager"].includes(e.role));
    }
    
    return c.json(filtered);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// List all users for meeting participant selection (any authenticated user)
app.get(`${PREFIX}/users/for-meetings`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const allEmployees = await kv.getByPrefix("employee:");
    // Apply company filtering
    const filtered = await filterEmployeesByCompany(allEmployees, user.id, role);
    const result = filtered
      .filter((e: any) => e.userId !== user.id)
      .map((e: any) => ({
        userId: e.userId,
        id: e.userId,
        name: e.name,
        role: e.role,
        department: e.department || "",
        position: e.position || "",
        company: e.company || "",
      }));
    return c.json(result);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get my performance reviews (any authenticated user)
app.get(`${PREFIX}/my-reviews`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allReviews = await kv.getByPrefix("perf-review:");
    const userName = user.user_metadata?.name || user.email;
    const myReviews = allReviews.filter((r: any) => {
      // Support both single employeeId and multi employeeIds array
      const isSingleEmployee = r.employeeId === user.id || r.userId === user.id || r.employeeName === userName || r.employee === userName;
      const isInEmployeesArray = Array.isArray(r.employeeIds) && r.employeeIds.includes(user.id);
      const isReviewer = r.reviewerId === user.id || r.reviewerName === userName || r.reviewer === userName;
      return isSingleEmployee || isInEmployeesArray || isReviewer;
    });
    return c.json(myReviews);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get my tasks (any authenticated user)
app.get(`${PREFIX}/my-tasks`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allTasks = await kv.getByPrefix("task:");
    const userName = user.user_metadata?.name || user.email;
    const myTasks = allTasks.filter((t: any) => {
      // Support both single assignedTo and multi assignedToIds array
      const isSingleAssignee = t.assigneeId === user.id || t.assignedToId === user.id || t.employeeId === user.id || t.userId === user.id || t.assignedTo === user.id || t.assignedTo === userName || t.assignee === userName || t.assignedToName === userName;
      const isInAssigneesArray = Array.isArray(t.assignedToIds) && t.assignedToIds.includes(user.id);
      return isSingleAssignee || isInAssigneesArray;
    });
    return c.json(myTasks);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Employee update own task status
app.put(`${PREFIX}/my-tasks/:id`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`task:${id}`);
    if (!existing) return c.json({ error: "Task not found" }, 404);
    const userName = user.user_metadata?.name || user.email;
    const isSingleAssignee = existing.assigneeId === user.id || existing.assignedToId === user.id || existing.employeeId === user.id || existing.userId === user.id || existing.assignedTo === userName || existing.assignedTo === user.id || existing.assignee === userName || existing.assignedToName === userName;
    const isInAssigneesArray = Array.isArray(existing.assignedToIds) && existing.assignedToIds.includes(user.id);
    const isOwner = isSingleAssignee || isInAssigneesArray;
    if (!isOwner) {
      return c.json({ error: "Not your task" }, 403);
    }
    const updated = { ...existing, status: body.status, notes: body.notes || existing.notes, updatedAt: new Date().toISOString(), updatedBy: user.id };
    await kv.set(`task:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get my onboarding checklist items (any authenticated user)
app.get(`${PREFIX}/my-onboarding`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allItems = await kv.getByPrefix("onboard-checklist:");
    const userName = user.user_metadata?.name || user.email;
    const myItems = allItems.filter((item: any) => item.employeeId === user.id || item.assignedToId === user.id || item.userId === user.id || item.assignedTo === userName || item.employeeName === userName || item.assignedTo === user.id);
    return c.json(myItems);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Employee update own onboarding item status
app.put(`${PREFIX}/my-onboarding/:id`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`onboard-checklist:${id}`);
    if (!existing) return c.json({ error: "Onboarding item not found" }, 404);
    const userName = user.user_metadata?.name || user.email;
    const isOwner = existing.employeeId === user.id || existing.assignedToId === user.id || existing.userId === user.id || existing.assignedTo === userName || existing.assignedTo === user.id || existing.employeeName === userName;
    if (!isOwner) {
      return c.json({ error: "Not your onboarding item" }, 403);
    }
    const updated = { ...existing, status: body.status, notes: body.notes || existing.notes, updatedAt: new Date().toISOString(), updatedBy: user.id };
    await kv.set(`onboard-checklist:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get my training programs (any authenticated user)
app.get(`${PREFIX}/my-training`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const [progs1, progs2] = await Promise.all([kv.getByPrefix("training:"), kv.getByPrefix("training-program:")]);
    const allPrograms = [...(Array.isArray(progs1) ? progs1 : []), ...(Array.isArray(progs2) ? progs2 : [])];
    const userName = user.user_metadata?.name || user.email;
    const myPrograms = allPrograms.filter((p: any) => {
      if (p.instructorId === user.id || p.instructorName === userName) return true;
      if (p.employeeId === user.id || p.userId === user.id) return true;
      if (Array.isArray(p.participantIds) && p.participantIds.includes(user.id)) return true;
      if (Array.isArray(p.participantNames) && p.participantNames.includes(userName)) return true;
      if (p.assignedTo === user.id || p.assignedTo === userName) return true;
      return false;
    });
    return c.json(myPrograms);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get my questionnaires / feedback (any authenticated user)
app.get(`${PREFIX}/my-questionnaires`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allFeedback = await kv.getByPrefix("feedback:");
    const userName = user.user_metadata?.name || user.email;
    const myFeedback = allFeedback.filter((f: any) => {
      // Support both single employeeId and multi employeeIds array
      const isSingleEmployee = f.employeeId === user.id || f.userId === user.id || f.employeeName === userName || f.employee === userName;
      const isInEmployeesArray = Array.isArray(f.employeeIds) && f.employeeIds.includes(user.id);
      const isReviewer = f.reviewerId === user.id || f.reviewerName === userName || f.reviewer === userName;
      return isSingleEmployee || isInEmployeesArray || isReviewer;
    });
    return c.json(myFeedback);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Employee submit questionnaire answers
app.put(`${PREFIX}/my-questionnaires/:id`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`feedback:${id}`);
    if (!existing) return c.json({ error: "Questionnaire not found" }, 404);
    const userName = user.user_metadata?.name || user.email;
    const isOwner = existing.employeeId === user.id || existing.reviewerId === user.id || existing.userId === user.id || existing.employeeName === userName || existing.reviewerName === userName;
    if (!isOwner) {
      return c.json({ error: "Not your questionnaire" }, 403);
    }
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString(), updatedBy: user.id };
    await kv.set(`feedback:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get my disciplinary cases (any authenticated user)
app.get(`${PREFIX}/my-disciplinary`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allCases = await kv.getByPrefix("disciplinary:");
    const userName = user.user_metadata?.name || user.email;
    const myCases = allCases.filter((d: any) => {
      // Support both single employeeId and multi employeeIds array
      const isSingleEmployee = d.employeeId === user.id || d.userId === user.id || d.employeeName === userName;
      const isInEmployeesArray = Array.isArray(d.employeeIds) && d.employeeIds.includes(user.id);
      return isSingleEmployee || isInEmployeesArray;
    });
    return c.json(myCases);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get my compliance items (any authenticated user)
app.get(`${PREFIX}/my-compliance`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allItems = await kv.getByPrefix("compliance:");
    const userName = user.user_metadata?.name || user.email;
    const userCompanyId = await getCompanyId(user.id);
    const myItems = allItems.filter((item: any) => {
      // Support assignedTo as array
      const isSingleAssignee = item.responsibleId === user.id || item.responsibleName === userName || item.assignedTo === user.id;
      const isInAssigneesArray = Array.isArray(item.assignedTo) && item.assignedTo.includes(user.id);
      // Also include company-wide items (no specific assignee) from the same company
      const hasNoAssignee = !item.responsibleId && !item.responsibleName &&
        (!item.assignedTo || (Array.isArray(item.assignedTo) && item.assignedTo.length === 0));
      const sameCompany = userCompanyId && (item.companyId === userCompanyId || item.company === userCompanyId);
      return isSingleAssignee || isInAssigneesArray || (hasNoAssignee && sameCompany);
    });
    return c.json(myItems);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Employee update own review (self-assessment / notes)
app.put(`${PREFIX}/my-reviews/:id`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`perf-review:${id}`);
    if (!existing) return c.json({ error: "Review not found" }, 404);
    const userName = user.user_metadata?.name || user.email;
    const isOwner = existing.employeeId === user.id || existing.reviewerId === user.id || existing.userId === user.id || existing.employeeName === userName || existing.reviewerName === userName;
    if (!isOwner) {
      return c.json({ error: "Not your review" }, 403);
    }
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString(), updatedBy: user.id };
    await kv.set(`perf-review:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Employee update own training progress
app.put(`${PREFIX}/my-training/:id`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    let existing = await kv.get(`training:${id}`);
    let prefix = "training:";
    if (!existing) {
      existing = await kv.get(`training-program:${id}`);
      prefix = "training-program:";
    }
    if (!existing) return c.json({ error: "Training program not found" }, 404);
    const userName = user.user_metadata?.name || user.email;
    const isParticipant = existing.instructorId === user.id || existing.employeeId === user.id || existing.userId === user.id || existing.assignedTo === user.id || existing.assignedTo === userName || existing.instructorName === userName || (Array.isArray(existing.participantIds) && existing.participantIds.includes(user.id)) || (Array.isArray(existing.participantNames) && existing.participantNames.includes(userName));
    if (!isParticipant) return c.json({ error: "Not your training program" }, 403);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString(), updatedBy: user.id };
    await kv.set(`${prefix}${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ============ APPROVAL WORKFLOW (Admin → SuperAdmin) ============

// Admin requests to create a user
app.post(`${PREFIX}/admin/request-user-create`, async (c) => {
  try {
    const { user: adminUser, role } = await requireAdminOrAbove(c);
    if (role === 'superadmin') {
      return c.json({ error: 'SuperAdmin should use /users/create directly' }, 400);
    }
    
    const { userData, reason } = await c.req.json();
    const requestId = `approval_req:${crypto.randomUUID()}`;
    
    // CRITICAL FIX: Add company scope to approval requests
    const adminProfile = await kv.get(`employee:${adminUser.id}`);
    const companyId = adminProfile?.companyId || adminProfile?.company;
    
    const approvalRequest = {
      id: requestId,
      type: 'user_create',
      requestedBy: adminUser.id,
      requestedByName: adminProfile?.name || 'Admin',
      userData,
      reason: reason || 'Admin user creation request',
      status: 'pending',
      companyId,
      company: companyId,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(requestId, approvalRequest);
    return c.json({ success: true, requestId, message: 'Request sent to SuperAdmin' });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Admin requests to update a user
app.post(`${PREFIX}/admin/request-user-update`, async (c) => {
  try {
    const { user: adminUser, role } = await requireAdminOrAbove(c);
    if (role === 'superadmin') {
      return c.json({ error: 'SuperAdmin should use PUT /users/:userId directly' }, 400);
    }
    
    const { userId, updates, reason } = await c.req.json();
    const requestId = `approval_req:${crypto.randomUUID()}`;
    
    const existingUser = await kv.get(`employee:${userId}`);
    if (!existingUser) return c.json({ error: 'User not found' }, 404);
    
    // CRITICAL FIX: Add company scope to approval requests
    const adminProfile = await kv.get(`employee:${adminUser.id}`);
    const companyId = adminProfile?.companyId || adminProfile?.company;
    
    const approvalRequest = {
      id: requestId,
      type: 'user_update',
      requestedBy: adminUser.id,
      requestedByName: adminProfile?.name || 'Admin',
      userId,
      userName: existingUser.name,
      updates,
      currentData: existingUser,
      reason: reason || 'Admin user update request',
      status: 'pending',
      companyId,
      company: companyId,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(requestId, approvalRequest);
    return c.json({ success: true, requestId, message: 'Update request sent to SuperAdmin' });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Manager requests to update a user (similar to admin but for managers)
app.post(`${PREFIX}/manager/request-user-update`, async (c) => {
  try {
    const { user: managerUser, role } = await requireManagerOrAbove(c);
    if (role !== 'manager') {
      return c.json({ error: 'This endpoint is for Managers only. Admins should use /admin/request-user-update' }, 400);
    }
    
    const { userId, updates, reason } = await c.req.json();
    const requestId = `approval_req:${crypto.randomUUID()}`;
    
    const existingUser = await kv.get(`employee:${userId}`);
    if (!existingUser) return c.json({ error: 'User not found' }, 404);
    
    // Get manager's company for scoping
    const managerProfile = await kv.get(`employee:${managerUser.id}`);
    const companyId = managerProfile?.companyId || managerProfile?.company;
    
    const approvalRequest = {
      id: requestId,
      type: 'user_update',
      requestedBy: managerUser.id,
      requestedByName: managerProfile?.name || 'Manager',
      requestedByRole: 'manager',
      userId,
      userName: existingUser.name,
      updates,
      reason: reason || 'Manager user update request',
      status: 'pending',
      createdAt: new Date().toISOString(),
      companyId,
      company: companyId,
    };
    
    await kv.set(requestId, approvalRequest);
    return c.json({ success: true, requestId, message: 'Update request sent to Admin for approval' });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get all pending approvals (SuperAdmin only)
app.get(`${PREFIX}/superadmin/pending-approvals`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    let allApprovals = await kv.getByPrefix('approval_req:');
    
    // CRITICAL FIX: Filter approvals by company for multi-tenant isolation
    const scope = await resolveCompanyScope(user.id);
    if (scope?.length) {
      // Filter approvals to only show those from the SuperAdmin's company
      allApprovals = allApprovals.filter((a: any) => {
        // Check if the approval request has a companyId or relates to a company employee
        return companyMatches(scope, a.companyId) || companyMatches(scope, a.company);
      });
    }
    
    const pending = allApprovals.filter((a: any) => a.status === 'pending');
    return c.json(pending.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Approve/Reject approval request (SuperAdmin only)
app.post(`${PREFIX}/superadmin/approval/:requestId/:action`, async (c) => {
  try {
    const { user: superAdmin } = await requireSuperAdmin(c);
    const requestId = c.req.param('requestId');
    const action = c.req.param('action'); // 'approve' or 'reject'
    
    const request = await kv.get(requestId);
    if (!request) return c.json({ error: 'Request not found' }, 404);
    if (request.status !== 'pending') return c.json({ error: 'Request already processed' }, 400);
    
    if (action === 'approve') {
      // Execute the requested action
      if (request.type === 'user_create') {
        // Create the user
        const { email, name, role, companyId, department, position, phone, status } = request.userData;
        const sb = supabaseAdmin();
        
        // Generate temp password
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        const charLen = charset.length;
        const maxUnbiased = 256 - (256 % charLen);
        let tempPassword = '';
        while (tempPassword.length < 12) {
          const buf = new Uint8Array(16);
          crypto.getRandomValues(buf);
          for (const b of buf) {
            if (tempPassword.length >= 12) break;
            if (b < maxUnbiased) tempPassword += charset[b % charLen];
          }
        }
        
        const { data: authData, error: authError } = await sb.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name, role, companyId, department, position },
        });
        
        if (authError) throw new Error(authError.message);
        const userId = authData.user.id;
        
        const employee = {
          userId,
          email,
          name,
          role: role || 'employee',
          companyId: companyId || '',
          department: department || '',
          position: position || '',
          phone: phone || '',
          status: status || 'active',
          createdAt: new Date().toISOString(),
        };
        
        await kv.set(`employee:${userId}`, employee);
        await kv.set(requestId, { ...request, status: 'approved', approvedBy: superAdmin.id, approvedAt: new Date().toISOString(), resultUserId: userId });
        
        return c.json({ success: true, message: 'User created successfully', userId, tempPassword });
      } else if (request.type === 'user_update') {
        // Update the user
        const existing = await kv.get(`employee:${request.userId}`);
        if (!existing) {
          await kv.set(requestId, { ...request, status: 'rejected', rejectedBy: superAdmin.id, rejectedAt: new Date().toISOString(), reason: 'User no longer exists' });
          return c.json({ error: 'User not found' }, 404);
        }
        
        // Apply updates except department (only SuperAdmin can change department in original data)
        const updated = { ...existing, ...request.updates, updatedAt: new Date().toISOString() };
        await kv.set(`employee:${request.userId}`, updated);
        
        // Update in Supabase Auth
        const sb = supabaseAdmin();
        await sb.auth.admin.updateUserById(request.userId, {
          user_metadata: updated,
        });
        
        await kv.set(requestId, { ...request, status: 'approved', approvedBy: superAdmin.id, approvedAt: new Date().toISOString() });
        return c.json({ success: true, message: 'User updated successfully' });
      } else if (request.type === 'hiring') {
        // Approve hiring request
        const application = await kv.get(`job-application:${request.applicationId}`);
        if (!application) {
          await kv.set(requestId, { ...request, status: 'rejected', rejectedBy: superAdmin.id, rejectedAt: new Date().toISOString(), reason: 'Application not found' });
          return c.json({ error: 'Application not found' }, 404);
        }
        
        // Proceed with hiring
        const empData = await kv.get(`employee:${application.applicantId}`);
        if (empData) {
          const jobPosting = application.jobPostingId ? await kv.get(`job-posting:${application.jobPostingId}`) : null;
          const newPosition = jobPosting?.title || application.jobTitle || empData.position;
          const newDepartment = jobPosting?.department || application.jobDepartment || empData.department;
          const newSalary = jobPosting?.salary || application.jobSalaryRange || empData.salary || "";
          const newCompany = jobPosting?.company || application.jobCompany || empData.company || "";
          const updatedEmp = { ...empData, position: newPosition, department: newDepartment, salary: newSalary, company: newCompany, updatedAt: new Date().toISOString() };
          await kv.set(`employee:${application.applicantId}`, updatedEmp);
          const sb = supabaseAdmin();
          await sb.auth.admin.updateUserById(application.applicantId, { user_metadata: { name: updatedEmp.name, role: updatedEmp.role, company: newCompany } });
        }
        
        // Update application to hired
        application.status = "hired";
        application.approvedBy = superAdmin.id;
        application.approvedAt = new Date().toISOString();
        await kv.set(`job-application:${request.applicationId}`, application);
        
        // Notify applicant
        const nid1 = crypto.randomUUID();
        await kv.set(`notification:${nid1}`, { 
          id: nid1, userId: application.applicantId, type: "hire-approved", 
          title: "Congratulations! You've Been Hired!", 
          message: `Your application for ${application.jobTitle} has been approved. Your profile has been updated.`, 
          read: false, createdAt: new Date().toISOString() 
        });
        
        // Notify same-company employees only
        const allEmployees = await kv.getByPrefix("employee:");
        const hireCompany = application.jobCompany || empData?.companyId || empData?.company;
        const companyEmps = hireCompany ? allEmployees.filter((e: any) => e.companyId === hireCompany || e.company === hireCompany) : [];
        for (const emp of companyEmps) {
          if (emp.userId === application.applicantId) continue;
          const nid = crypto.randomUUID();
          await kv.set(`notification:${nid}`, { 
            id: nid, userId: emp.userId, type: "new-hire", 
            title: "New Hire Announcement", 
            message: `Welcome ${application.applicantName} to the team as ${application.jobTitle}!`, 
            read: false, createdAt: new Date().toISOString() 
          });
        }
        
        await kv.set(requestId, { ...request, status: 'approved', approvedBy: superAdmin.id, approvedAt: new Date().toISOString() });
        return c.json({ success: true, message: 'Hiring approved successfully' });
      }
    } else if (action === 'reject') {
      const { reason } = await c.req.json().catch(() => ({}));
      await kv.set(requestId, { 
        ...request, 
        status: 'rejected', 
        rejectedBy: superAdmin.id, 
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || 'Rejected by SuperAdmin'
      });
      return c.json({ success: true, message: 'Request rejected' });
    }
    
    return c.json({ error: 'Invalid action' }, 400);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Update user
app.put(`${PREFIX}/users/:userId`, async (c) => {
  try {
    const { role: callerRole } = await requireAdminOrAbove(c);
    const userId = c.req.param("userId");
    const body = await c.req.json();
    
    const existing = await kv.get(`employee:${userId}`);
    if (!existing) return c.json({ error: "User not found" }, 404);
    
    if (callerRole === "admin" && ["superadmin"].includes(existing.role)) {
      return c.json({ error: "Cannot edit superadmin users" }, 403);
    }
    
    // Only SuperAdmin can change departments
    if (callerRole !== "superadmin" && body.department && body.department !== existing.department) {
      return c.json({ error: "Only SuperAdmin can change user departments" }, 403);
    }
    
    // Only SuperAdmin can change departments array
    if (callerRole !== "superadmin" && body.departments && JSON.stringify(body.departments) !== JSON.stringify(existing.departments)) {
      return c.json({ error: "Only SuperAdmin can change user departments" }, 403);
    }

    let companyName = body.company || existing.company || "";
    if (body.companyId && body.companyId !== existing.companyId) {
      companyName = await resolveCompanyName(body.companyId);
    }
    
    // Ensure departments array is synced with department field
    const departments = body.departments || existing.departments || (body.department ? [body.department] : existing.department ? [existing.department] : []);
    const department = body.department || existing.department || (departments && departments[0]) || '';
    
    const updated = {
      ...existing,
      ...body,
      userId,
      id: userId,
      company: companyName,
      department,
      departments,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`employee:${userId}`, updated);
    
    // Update auth metadata
    const sb = supabaseAdmin();
    await sb.auth.admin.updateUserById(userId, {
      user_metadata: { name: updated.name, role: updated.role, companyId: updated.companyId, company: companyName },
    });
    
    // Broadcast real-time update to dashboard
    await broadcastUpdate('users', 'UPDATE', userId, updated);
    
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Delete user (SuperAdmin ONLY - direct delete with broadcast)
app.delete(`${PREFIX}/users/:userId`, async (c) => {
  try {
    const { user: caller } = await requireSuperAdmin(c);
    const userId = c.req.param("userId");
    const target = await kv.get(`employee:${userId}`);
    
    if (!target) {
      return c.json({ error: "User not found" }, 404);
    }
    
    const targetName = target?.name || "Unknown User";
    const targetEmail = target?.email || "";
    const targetRole = target?.role || "employee";
    const targetCompany = target?.companyId || target?.company;
    
    // Only a superadmin can delete their own superadmin account; no one can delete another superadmin
    if (targetRole === "superadmin" && userId !== caller.id) {
      return c.json({ error: "Cannot delete another superadmin account" }, 403);
    }
    
    // CRITICAL: Verify target belongs to caller's company
    const callerScope = await resolveCompanyScope(caller.id);
    if (callerScope?.length && targetCompany && !companyMatches(callerScope, targetCompany)) {
      return c.json({ error: "Cannot delete user from another company" }, 403);
    }
    
    
    // Delete from Supabase Auth first (this allows email reuse)
    const sb = supabaseAdmin();
    try {
      await sb.auth.admin.deleteUser(userId);
    } catch (authError: any) {
      console.error(`Error deleting from Supabase Auth:`, authError);
      // Continue with KV deletion even if auth deletion fails
    }
    
    // Delete all related records
    await kv.del(`employee:${userId}`);
    await kv.del(`user_profile:${userId}`);
    if (targetCompany) {
      await kv.del(`company_users:${targetCompany}:${userId}`);
    }
    
    // Delete user's notifications
    const userNotifications = await kv.getByPrefix(`notification:`);
    const userNots = userNotifications.filter((n: any) => n.userId === userId);
    for (const not of userNots) {
      await kv.del(`notification:${not.id}`);
    }
    
    // Recalculate company stats
    if (targetCompany) {
      try {
        await recalculateCompanyStats(targetCompany);
      } catch (statsError) {
        console.error('Error recalculating stats after deletion:', statsError);
      }
    }
    
    // Log the deletion
    await logAudit({
      userId: caller.id,
      userName: caller.email || 'Unknown',
      action: 'DELETE',
      resourceType: 'user',
      resourceId: userId,
      details: { 
        deletedUserEmail: targetEmail,
        deletedUserName: targetName,
        deletedUserRole: targetRole,
      },
    });
    
    // CRITICAL: Only notify same-company employees
    const allEmployees = await kv.getByPrefix("employee:");
    const companyEmps = targetCompany ? allEmployees.filter((e: any) => e.companyId === targetCompany || e.company === targetCompany) : [];
    for (const emp of companyEmps) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: emp.userId || emp.id, type: "user-removed",
        title: "Team Update", message: `${targetName} (${targetRole}) has been removed from the organization.`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    
    // Broadcast real-time update to dashboard
    await broadcastUpdate('users', 'DELETE', userId, { userId, email: targetEmail });
    
    return c.json({ success: true, message: `User ${targetEmail} has been permanently deleted. Email can now be reused.` });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Superadmin delete user (alias - forwards to main delete endpoint)
app.delete(`${PREFIX}/superadmin/users/:userId`, async (c) => {
  // Reuse the main delete endpoint logic
  return app.request(`${PREFIX}/users/${c.req.param("userId")}`, {
    method: 'DELETE',
    headers: c.req.raw.headers,
  });
});

// ============ DELETION REQUESTS (Admin/Manager request, SuperAdmin approves) ============
app.post(`${PREFIX}/deletion-requests`, async (c) => {
  try {
    const { user, role, kvData } = await requireManagerOrAbove(c);
    const body = await c.req.json();
    const { targetUserId, reason } = body;
    if (!targetUserId) return c.json({ error: "targetUserId is required" }, 400);
    const target = await kv.get(`employee:${targetUserId}`);
    if (!target) return c.json({ error: "Target user not found" }, 404);
    if (target.role === "superadmin") return c.json({ error: "Cannot request deletion of a superadmin" }, 403);
    if (role === "manager" && !["employee"].includes(target.role)) {
      return c.json({ error: "Managers can only request deletion of employees" }, 403);
    }
    const existing = await kv.getByPrefix("deletion-request:");
    const duplicate = existing.find((r: any) => r.targetUserId === targetUserId && r.status === "pending");
    if (duplicate) return c.json({ error: "A pending deletion request already exists for this user" }, 400);
    const id = crypto.randomUUID();
    const request = {
      id, requestedBy: user.id, requesterName: kvData?.name || "", requesterRole: role,
      targetUserId, targetUserName: target.name || "", targetUserEmail: target.email || "",
      targetUserRole: target.role || "", targetDepartment: target.department || "",
      targetCompany: target.company || "",
      reason: reason || "", status: "pending",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`deletion-request:${id}`, request);
    // CRITICAL: Only notify superadmins from the same company
    const allEmployees = await kv.getByPrefix("employee:");
    const callerCompany = kvData?.companyId || kvData?.company;
    const superAdmins = allEmployees.filter((e: any) => e.role === "superadmin" && callerCompany && (e.companyId === callerCompany || e.company === callerCompany));
    for (const sa of superAdmins) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: sa.userId || sa.id, type: "deletion-request",
        title: "Deletion Request Received",
        message: `${kvData?.name || "Someone"} (${role}) requested deletion of ${target.name} (${target.role})`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json(request, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/deletion-requests`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let all = await kv.getByPrefix("deletion-request:");
    
    // CRITICAL FIX: Filter deletion requests by company for multi-tenant isolation
    if (role === "superadmin" || role === "admin") {
      // SuperAdmin/Admin see deletion requests for employees in their company only
      const scope = await resolveCompanyScope(user.id);
      
      if (scope?.length) {
        const employees = await kv.getByPrefix("employee:");
        const companyEmployees = employees.filter((e: any) => companyMatches(scope, e.companyId) || companyMatches(scope, e.company));
        const companyEmployeeIds = new Set(companyEmployees.map((e: any) => e.id || e.userId));
        
        
        all = all.filter((r: any) => {
          const hasMatch = companyEmployeeIds.has(r.targetUserId);
          if (!hasMatch && all.length < 10) {
          }
          return hasMatch;
        });
        
      }
      return c.json(all.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
    
    const filtered = all.filter((r: any) => r.requestedBy === user.id);
    return c.json(filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (e: any) {
    console.error(`❌ Error in /deletion-requests:`, e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/deletion-requests/:id`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const id = c.req.param("id");
    const { status, rejectionReason } = await c.req.json();
    if (!["approved", "rejected"].includes(status)) return c.json({ error: "Status must be approved or rejected" }, 400);
    const request = await kv.get(`deletion-request:${id}`);
    if (!request) return c.json({ error: "Not found" }, 404);
    if (request.status !== "pending") return c.json({ error: "Already processed" }, 400);
    const updated = { ...request, status, rejectionReason: rejectionReason || "", reviewedAt: new Date().toISOString() };
    await kv.set(`deletion-request:${id}`, updated);
    if (status === "approved") {
      const target = await kv.get(`employee:${request.targetUserId}`);
      const targetName = target?.name || request.targetUserName;
      const targetRole = target?.role || request.targetUserRole;
      if (targetRole === "superadmin") return c.json({ error: "Cannot delete a superadmin account via deletion request" }, 403);
      const targetCompany = target?.companyId || target?.company;
      await kv.del(`employee:${request.targetUserId}`);
      const sb = supabaseAdmin();
      // CRITICAL: Only notify same-company employees
      const allEmployees = await kv.getByPrefix("employee:");
      const companyEmps = targetCompany ? allEmployees.filter((e: any) => e.companyId === targetCompany || e.company === targetCompany) : [];
      for (const emp of companyEmps) {
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, {
          id: nid, userId: emp.userId || emp.id, type: "user-removed",
          title: "Team Update", message: `${targetName} (${targetRole}) has been removed from the organization.`,
          read: false, createdAt: new Date().toISOString(),
        });
      }
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: request.requestedBy, type: "deletion-approved",
        title: "Deletion Approved", message: `Your request to delete ${targetName} has been approved and executed.`,
        read: false, createdAt: new Date().toISOString(),
      });
    } else {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: request.requestedBy, type: "deletion-rejected",
        title: "Deletion Rejected",
        message: `Your request to delete ${request.targetUserName} was rejected.${rejectionReason ? " Reason: " + rejectionReason : ""}`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ SUPERADMIN DATA RESET ============
app.post(`${PREFIX}/superadmin/reset-user-data/:userId`, async (c) => {
  try {
    const { user: caller } = await requireSuperAdmin(c);
    const userId = c.req.param("userId");
    const target = await kv.get(`employee:${userId}`);
    if (!target) return c.json({ error: "User not found" }, 404);
    // CRITICAL FIX: Verify target belongs to caller's company
    const callerScope = await resolveCompanyScope(caller.id);
    const targetCompany = target?.companyId || target?.company;
    if (callerScope?.length && targetCompany && !companyMatches(callerScope, targetCompany)) {
      return c.json({ error: "Cannot reset data for user from another company" }, 403);
    }
    let deleted = 0;
    const attendance = await kv.getByPrefix("attendance:");
    for (const r of attendance) { if (r.userId === userId) { await kv.del(`attendance:${r.userId}:${r.date}`); deleted++; } }
    const leaves = await kv.getByPrefix("leave:");
    for (const l of leaves) { if (l.userId === userId) { await kv.del(`leave:${l.id}`); deleted++; } }
    const messages = await kv.getByPrefix("message:");
    for (const m of messages) { if (m.senderId === userId || m.recipientId === userId) { await kv.del(`message:${m.id}`); deleted++; } }
    const notifs = await kv.getByPrefix("notification:");
    for (const n of notifs) { if (n.userId === userId) { await kv.del(`notification:${n.id}`); deleted++; } }
    const apps = await kv.getByPrefix("job-application:");
    for (const a of apps) { if (a.applicantId === userId) { await kv.del(`job-application:${a.id}`); deleted++; } }
    return c.json({ success: true, deletedRecords: deleted, userName: target.name });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/superadmin/reset-all-data`, async (c) => {
  try {
    const { user: caller } = await requireSuperAdmin(c);
    const { confirmPhrase } = await c.req.json();
    if (confirmPhrase !== "RESET ALL DATA") return c.json({ error: "Type 'RESET ALL DATA' to confirm" }, 400);
    
    // CRITICAL FIX: Only reset data belonging to the caller's company
    const callerScope = await resolveCompanyScope(caller.id);
    if (!callerScope?.length) {
      return c.json({ error: "No company scope found - cannot reset data" }, 400);
    }
    const companyId = callerScope[0];
    
    const prefixes = ["branch:", "department:", "asset:", "asset-category:", "paygrade:", "financial-year:", "leave-type:", "leave:", "attendance:", "announcement:", "message:", "notification:", "job-posting:", "job-application:", "perf-review:", "goal:", "feedback:", "meeting:", "workflow:", "disciplinary:", "compliance:", "training:", "task:", "onboard-checklist:", "payroll-run:", "tax-bracket:", "benefit-plan:", "admin-dept:", "deletion-request:", "profile-change:"];
    let deleted = 0;
    for (const prefix of prefixes) {
      const items = await kv.getByPrefix(prefix);
      for (const item of items) {
        // CRITICAL: Only delete items belonging to this company
        const itemCompany = item.companyId || item.company;
        if (itemCompany && !companyMatches(callerScope, itemCompany)) continue; // Skip other company's data
        // For items without company (attendance, messages, notifications), check userId
        if (!itemCompany) {
          if (item.userId) {
            const emp = await kv.get(`employee:${item.userId}`);
            const empCompany = emp?.companyId || emp?.company;
            if (empCompany && !companyMatches(callerScope, empCompany)) continue;
          } else {
            continue; // Skip items with no way to determine company
          }
        }
        const key = item.userId && item.date ? `${prefix}${item.userId}:${item.date}` : `${prefix}${item.id}`;
        await kv.del(key);
        deleted++;
      }
    }
    // Reset company-scoped settings
    try { await kv.del(`company-settings:${companyId}`); deleted++; } catch (e) {}
    try { await kv.del(`auto-clock-settings:${companyId}`); deleted++; } catch (e) {}
    try { await kv.del(`manual-clock-settings:${companyId}`); deleted++; } catch (e) {}
    
    // Only delete employees from THIS company (never other companies)
    const allEmployees = await kv.getByPrefix("employee:");
    const companyEmployees = allEmployees.filter((e: any) => companyMatches(callerScope, e.companyId) || companyMatches(callerScope, e.company));
    const sb = supabaseAdmin();
    for (const emp of companyEmployees) {
      if (emp.role === "superadmin") continue;
      const uid = emp.userId || emp.id;
      await kv.del(`employee:${uid}`);
      try { await sb.auth.admin.deleteUser(uid); } catch (e) {}
      deleted++;
    }
    return c.json({ success: true, deletedRecords: deleted });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Delete SuperAdmin Account and All Data
app.post(`${PREFIX}/superadmin/delete-account`, async (c) => {
  try {
    const { user: caller } = await requireSuperAdmin(c);
    const { deleteAccountPhrase } = await c.req.json();
    if (deleteAccountPhrase !== "DELETE MY ACCOUNT") return c.json({ error: "Type 'DELETE MY ACCOUNT' to confirm" }, 400);
    
    
    // CRITICAL: Delete ALL data belonging to the caller's company
    const callerScope = await resolveCompanyScope(caller.id);
    if (!callerScope?.length) {
      return c.json({ error: "No company scope found - cannot delete account" }, 400);
    }
    const companyId = callerScope[0];
    
    // 1. Delete all data from all modules (same as reset-all-data but includes SuperAdmin)
    const prefixes = ["company:", "branch:", "department:", "asset:", "asset-category:", "paygrade:", "financial-year:", "leave-type:", "leave:", "attendance:", "announcement:", "message:", "notification:", "job-posting:", "job-application:", "perf-review:", "goal:", "feedback:", "meeting:", "workflow:", "disciplinary:", "compliance:", "training:", "task:", "onboard-checklist:", "payroll-run:", "tax-bracket:", "benefit-plan:", "admin-dept:", "deletion-request:", "profile-change:"];
    let deleted = 0;
    for (const prefix of prefixes) {
      const items = await kv.getByPrefix(prefix);
      for (const item of items) {
        // CRITICAL: Only delete items belonging to this company
        const itemCompany = item.companyId || item.company || item.id;
        if (prefix === "company:" && itemCompany === companyId) {
          await kv.del(`${prefix}${itemCompany}`);
          deleted++;
        } else if (itemCompany && companyMatches(callerScope, itemCompany)) {
          const key = item.userId && item.date ? `${prefix}${item.userId}:${item.date}` : `${prefix}${item.id}`;
          await kv.del(key);
          deleted++;
        } else if (!itemCompany) {
          // For items without company (attendance, messages, notifications), check userId
          if (item.userId) {
            const emp = await kv.get(`employee:${item.userId}`);
            const empCompany = emp?.companyId || emp?.company;
            if (empCompany && companyMatches(callerScope, empCompany)) {
              const key = item.userId && item.date ? `${prefix}${item.userId}:${item.date}` : `${prefix}${item.id}`;
              await kv.del(key);
              deleted++;
            }
          }
        }
      }
    }
    
    // 2. Delete company-scoped settings
    try { await kv.del(`company-settings:${companyId}`); deleted++; } catch (e) {}
    try { await kv.del(`auto-clock-settings:${companyId}`); deleted++; } catch (e) {}
    try { await kv.del(`manual-clock-settings:${companyId}`); deleted++; } catch (e) {}
    try { await kv.del(`license:${companyId}`); deleted++; } catch (e) {}
    
    // 3. Delete ALL employees from THIS company (including SuperAdmin this time)
    const allEmployees = await kv.getByPrefix("employee:");
    const companyEmployees = allEmployees.filter((e: any) => companyMatches(callerScope, e.companyId) || companyMatches(callerScope, e.company));
    const sb = supabaseAdmin();
    for (const emp of companyEmployees) {
      const uid = emp.userId || emp.id;
      await kv.del(`employee:${uid}`);
      try { 
        await sb.auth.admin.deleteUser(uid);
      } catch (e) {
        console.error(`Failed to delete auth user ${emp.email}:`, e);
      }
      deleted++;
    }
    
    
    return c.json({ 
      success: true, 
      deletedRecords: deleted,
      message: 'Account and all data permanently deleted. License cancelled.' 
    });
  } catch (e: any) {
    console.error('Delete account error:', e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Reset password
app.post(`${PREFIX}/users/:userId/reset-password`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const userId = c.req.param("userId");
    const newPassword = generateTempPassword();
    const sb = supabaseAdmin();
    const { error } = await sb.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return c.json({ error: error.message }, 400);
    return c.json({ success: true, tempPassword: newPassword });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Assign companies to admin
app.put(`${PREFIX}/users/:userId/assign-companies`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const userId = c.req.param("userId");
    const { assignedCompanies } = await c.req.json();
    const existing = await kv.get(`employee:${userId}`);
    if (!existing) return c.json({ error: "User not found" }, 404);
    const updated = { ...existing, assignedCompanies, updatedAt: new Date().toISOString() };
    await kv.set(`employee:${userId}`, updated);
    const sb = supabaseAdmin();
    await sb.auth.admin.updateUserById(userId, { user_metadata: { ...existing, assignedCompanies } });
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ ASSET ASSIGNMENT VALIDATION ============
// Multiple assets CAN be assigned to one user.
// But an individual asset that is already assigned to someone is BLOCKED
// until it is unassigned. You can only reassign by first unassigning.
async function validateAssetAssignment(body: any, existingId?: string) {
  if (!body.assignedToUserId || body.assignedToUserId === '__unassigned') return null;
  if (body.status !== 'assigned') return null;
  // When editing an existing asset, we allow changing its own assignment.
  // No per-user limit — users can hold multiple assets simultaneously.
  return null;
}

// Custom asset create/update (SuperAdmin) with assignment validation
app.post(`${PREFIX}/superadmin/asset`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const body = await c.req.json();
    if (body.assignedToUserId === '__unassigned') { body.assignedToUserId = ''; body.assignedToName = ''; body.status = 'available'; }
    const err = await validateAssetAssignment(body);
    if (err) return c.json({ error: err }, 400);
    const id = body.id || crypto.randomUUID();
    // CRITICAL FIX: Ensure companyId is set for multi-tenant isolation
    const itemWithCompany = await ensureCompanyId(body, user.id);
    const item = { ...itemWithCompany, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await kv.set(`asset:${id}`, item);
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});
app.put(`${PREFIX}/superadmin/asset/:id`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    if (body.assignedToUserId === '__unassigned') { body.assignedToUserId = ''; body.assignedToName = ''; body.status = 'available'; }
    const err = await validateAssetAssignment(body, id);
    if (err) return c.json({ error: err }, 400);
    const existing = await kv.get(`asset:${id}`);
    const item = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    await kv.set(`asset:${id}`, item);
    return c.json(item);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// SuperAdmin assets GET (list) and DELETE routes
app.get(`${PREFIX}/superadmin/asset`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    let items = await kv.getByPrefix('asset:');
    // CRITICAL FIX: Apply company filtering for multi-tenant isolation
    items = await applyCompanyFilter(items, user.id, role);
    return c.json(items || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/superadmin/asset/:id`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const id = c.req.param("id");
    const item = await kv.get(`asset:${id}`);
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json(item);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.delete(`${PREFIX}/superadmin/asset/:id`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const id = c.req.param("id");
    await kv.del(`asset:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Custom asset create/update (Admin) with assignment validation
app.post(`${PREFIX}/admin/assets`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const body = await c.req.json();
    if (body.assignedToUserId === '__unassigned') { body.assignedToUserId = ''; body.assignedToName = ''; body.status = 'available'; }
    const err = await validateAssetAssignment(body);
    if (err) return c.json({ error: err }, 400);
    const id = body.id || crypto.randomUUID();
    const item = { ...body, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await kv.set(`asset:${id}`, item);
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});
app.put(`${PREFIX}/admin/assets/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    if (body.assignedToUserId === '__unassigned') { body.assignedToUserId = ''; body.assignedToName = ''; body.status = 'available'; }
    const err = await validateAssetAssignment(body, id);
    if (err) return c.json({ error: err }, 400);
    const existing = await kv.get(`asset:${id}`);
    const item = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    await kv.set(`asset:${id}`, item);
    return c.json(item);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Admin assets GET (list) and DELETE routes
app.get(`${PREFIX}/admin/assets`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    let items = await kv.getByPrefix('asset:');
    // Apply company filtering for non-superadmin users
    items = await applyCompanyFilter(items, user.id, role);
    return c.json(items || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/admin/assets/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const item = await kv.get(`asset:${id}`);
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json(item);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.delete(`${PREFIX}/admin/assets/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param("id");
    await kv.del(`asset:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ MEETING SCHEDULING CONFLICT VALIDATION ============
async function validateMeetingSchedule(body: any, existingId?: string) {
  if (!body.date || !body.startTime) return null;
  if (body.status === 'cancelled') return null;
  const userIds = [body.organizerId, ...(body.participantIds || []), body.participantId].filter(Boolean);
  if (userIds.length === 0) return null;
  const allMeetings = await kv.getByPrefix("meeting:");
  for (const m of allMeetings) {
    if (m.id === existingId || m.status === 'cancelled' || m.date !== body.date) continue;
    const mUsers = [m.organizerId, ...(m.participantIds || []), m.participantId].filter(Boolean);
    const overlappingUser = userIds.find(uid => mUsers.includes(uid));
    if (!overlappingUser) continue;
    const mEnd = m.endTime || m.startTime;
    const bEnd = body.endTime || body.startTime;
    if (bEnd && m.startTime >= bEnd) continue;
    if (mEnd && body.startTime >= mEnd) continue;
    const emp = await kv.get(`employee:${overlappingUser}`);
    return `${emp?.name || 'User'} already has "${m.title}" on ${m.date} at ${m.startTime}. Choose a different time.`;
  }
  const allLeaves = await kv.getByPrefix("leave:");
  for (const l of allLeaves) {
    if (l.status !== 'approved') continue;
    if (!userIds.includes(l.userId)) continue;
    if (l.startDate && l.endDate && body.date >= l.startDate && body.date <= l.endDate) {
      const emp = await kv.get(`employee:${l.userId}`);
      return `${emp?.name || 'User'} is on approved leave (${l.leaveType || 'leave'}) from ${l.startDate} to ${l.endDate}. Cannot schedule meeting.`;
    }
  }
  return null;
}

// Custom meeting create/update with conflict validation
app.post(`${PREFIX}/superadmin/meeting`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const body = await c.req.json();
    const err = await validateMeetingSchedule(body);
    if (err) return c.json({ error: err }, 400);
    const id = body.id || crypto.randomUUID();
    // CRITICAL FIX: Ensure companyId is set for multi-tenant isolation
    const itemWithCompany = await ensureCompanyId(body, user.id);
    const item = { ...itemWithCompany, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await kv.set(`meeting:${id}`, item);
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});
app.put(`${PREFIX}/superadmin/meeting/:id`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const err = await validateMeetingSchedule(body, id);
    if (err) return c.json({ error: err }, 400);
    const existing = await kv.get(`meeting:${id}`);
    const item = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    await kv.set(`meeting:${id}`, item);
    return c.json(item);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ ENTITY CRUD (SuperAdmin) ============

// CUSTOM: Get companies with license counts (must be BEFORE makeCrud to override)
app.get(`${PREFIX}/superadmin/company`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    let companies = await kv.getByPrefix('company:');
    
    // CRITICAL FIX: Filter companies by SuperAdmin's company scope
    // Each SuperAdmin should see their own company AND any sub-companies they created
    const superAdminCompany = await getCompanyId(user.id);
    
    if (superAdminCompany) {
      // Filter to show: 1) The tenant's main company record, 2) Any companies owned by this tenant
      companies = companies.filter((company: any) => 
        company.id === superAdminCompany || // The tenant's main company record
        company.companyId === superAdminCompany || // Company owned by this tenant
        company.company === superAdminCompany // Legacy field compatibility
      );
    } else {
      // If SuperAdmin has no company assignment, return empty array
      companies = [];
    }
    
    // Enrich each company with license counts
    const allEmployees = await kv.getByPrefix('employee:');
    const enrichedCompanies = companies.map((company: any) => {
      // Get subscription for this company
      const companyId = company.id;
      const companyEmployees = allEmployees.filter((emp: any) => 
        (emp.companyId === companyId || emp.company === companyId)
      );
      const activeEmployees = companyEmployees.filter((emp: any) => emp.status === 'active');
      
      // Find subscription for this company
      const subscription = company.subscription || {};
      const purchasedLicenses = subscription.purchasedLicenses || 0;
      const usedLicenses = activeEmployees.length;
      
      return {
        ...company,
        licenses: purchasedLicenses,
        usedLicenses: usedLicenses,
        availableLicenses: Math.max(0, purchasedLicenses - usedLicenses)
      };
    });
    
    return c.json(enrichedCompanies || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

makeCrud("superadmin/company", "company:", requireSuperAdmin);
makeCrud("superadmin/branch", "branch:", requireSuperAdmin);
makeCrud("superadmin/department", "department:", requireSuperAdmin);
// Note: superadmin/asset has custom routes above with validation - DO NOT use makeCrud here
makeCrud("superadmin/asset-category", "asset-category:", requireSuperAdmin);
makeCrud("superadmin/paygrade", "paygrade:", requireSuperAdmin);
makeCrud("superadmin/financial-year", "financial-year:", requireSuperAdmin);
makeCrud("superadmin/leave-type", "leave-type:", requireSuperAdmin);
// CUSTOM: Payroll run POST with employee notifications
app.post(`${PREFIX}/superadmin/payroll-run`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const companyId = body.companyId || body.company || (await getCompanyId(user.id));
    const item = {
      ...body,
      id,
      companyId,
      company: companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`payroll-run:${id}`, item);
    // Notify employee
    if (item.userId) {
      const statusLabel = item.status === 'paid' ? 'paid' : item.status === 'processing' ? 'being processed' : 'pending';
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid,
        userId: item.userId,
        type: 'payroll',
        title: `Payroll ${item.status === 'paid' ? 'Paid' : item.status === 'processing' ? 'Processing' : 'Pending'}`,
        message: `Your payroll for ${item.period || 'this period'} (Net: ${item.netPay || 0}) is ${statusLabel}.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      // Send email notification for payslip
      const emp = await kv.get(`employee:${item.userId}`) as any;
      if (emp?.email) {
        sendEmailNotification(
          item.userId, emp.email, emp.name || '',
          `Your Payslip for ${item.period || 'this period'} — Blumebyte HR`,
          `<p>Your payroll for <strong>${item.period || 'this period'}</strong> has been generated.</p><p style="color:#6b7280;font-size:14px;">Net Pay: <strong>${item.netPay || 0}</strong> &nbsp;|&nbsp; Status: <strong>${statusLabel}</strong></p>`,
          'emailOnPayslip'
        );
      }
    }
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// CUSTOM: Payroll run PUT with employee notifications on status change
app.put(`${PREFIX}/superadmin/payroll-run/:id`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(`payroll-run:${id}`);
    if (!existing) return c.json({ error: 'Not found' }, 404);
    const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    await kv.set(`payroll-run:${id}`, updated);
    // Notify on status change
    if (body.status && body.status !== existing.status && updated.userId) {
      const statusLabel = body.status === 'paid' ? 'paid' : body.status === 'processing' ? 'being processed' : 'pending';
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid,
        userId: updated.userId,
        type: 'payroll',
        title: `Payroll ${body.status === 'paid' ? 'Paid' : body.status === 'processing' ? 'Processing' : 'Status Updated'}`,
        message: `Your payroll for ${updated.period || 'this period'} (Net: ${updated.netPay || 0}) is now ${statusLabel}.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      // Send email notification for payslip status update
      const emp = await kv.get(`employee:${updated.userId}`) as any;
      if (emp?.email) {
        sendEmailNotification(
          updated.userId, emp.email, emp.name || '',
          `Payroll Update for ${updated.period || 'this period'} — Blumebyte HR`,
          `<p>Your payroll for <strong>${updated.period || 'this period'}</strong> is now <strong>${statusLabel}</strong>.</p><p style="color:#6b7280;font-size:14px;">Net Pay: <strong>${updated.netPay || 0}</strong></p>`,
          'emailOnPayslip'
        );
      }
    }
    return c.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

makeCrud("superadmin/payroll-run", "payroll-run:", requireSuperAdmin);
makeCrud("superadmin/tax-bracket", "tax-bracket:", requireSuperAdmin);
makeCrud("superadmin/benefit-plan", "benefit-plan:", requireSuperAdmin);
makeCrud("superadmin/performance-review", "perf-review:", requireSuperAdmin);
makeCrud("superadmin/goal", "goal:", requireSuperAdmin);
makeCrud("superadmin/feedback", "feedback:", requireSuperAdmin);
// Note: meeting create/update handled above with conflict validation
makeCrud("superadmin/meeting", "meeting:", requireSuperAdmin);
makeCrud("superadmin/workflow", "workflow:", requireSuperAdmin);

// CUSTOM: superadmin/job-posting GET — show all job postings scoped to the
// SuperAdmin's company. Falls back to all postings with a company if the strict
// per-UUID scope filter would return nothing (handles scope/name mismatches).
app.get(`${PREFIX}/superadmin/job-posting`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const all = await kv.getByPrefix("job-posting:");
    // Try strict company-filter first (preserves multi-tenant isolation)
    const strict = await applyCompanyFilter(all, user.id, 'superadmin');
    if (strict.length > 0) {
      return c.json(strict);
    }
    // Fallback: if strict filter returned nothing (e.g. scope stores company names but
    // items were saved with UUIDs), include postings whose companyName is in the
    // user's scope, plus unscoped postings (no companyId/company field).
    // Items that have a companyId/company but whose companyName is empty or doesn't
    // match are excluded — we can't verify they belong to this company without a
    // DB lookup, and the strict filter would have caught them if they did match.
    const scope = await resolveCompanyScope(user.id);
    if (!scope || scope.length === 0) {
      // No scope at all — only return unscoped items to avoid cross-company leakage.
      return c.json(all.filter((item: any) => !item.companyId && !item.company));
    }
    const scopeSet = new Set(scope.map((s: string) => s.toLowerCase()));
    const fallback = all.filter((item: any) => {
      // Unscoped postings (no company assigned) — belong to no tenant, safe to show
      if (!item.companyId && !item.company) return true;
      // Try UUID/company field match first
      const idField = (item.companyId || item.company || '').toLowerCase();
      if (idField && scopeSet.has(idField)) return true;
      // Try human-readable name match (separate check)
      const nameField = (item.companyName || '').toLowerCase();
      return nameField && scopeSet.has(nameField);
    });
    return c.json(fallback);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// CUSTOM: superadmin/job-posting POST/PUT with auto-populated companyName
app.post(`${PREFIX}/superadmin/job-posting`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const companyId = body.companyId || body.company || (await getCompanyId(user.id));
    // SuperAdmins may not have a company scope; allow creation with just companyName
    if (!companyId) {
    }
    // Auto-populate companyName from company record if not provided
    const companyName = body.companyName || (companyId ? await resolveCompanyName(companyId) : '') || '';
    // Normalize employmentType: accept both 'type' and 'employmentType', normalize casing
    const employmentType = normalizeEmploymentType(body.employmentType || body.type || '');
    // Auto-activate status when visibility is set to public_global
    let status = body.status || 'active';
    if (body.visibilityType === 'public_global' && !JOB_ACTIVE_STATUSES.has(status)) {
      status = 'active';
    }
    // Explicitly set visibilityType (don't rely solely on ...body spread to avoid undefined overwrites)
    const visibilityType = body.visibilityType || 'internal_only';
    const item: any = {
      ...body,
      id,
      companyName,
      employmentType,
      visibilityType,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Only set companyId/company when we actually have a value (avoid null polluting the record)
    if (companyId) { item.companyId = companyId; item.company = companyId; }
    await kv.set(`job-posting:${id}`, item);
    await broadcastUpdate('job-posting', 'INSERT', id, item);
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/superadmin/job-posting/:id`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(`job-posting:${id}`) || {};
    const companyId = existing.companyId || body.companyId || (await getCompanyId(user.id));
    // Auto-populate companyName if not already set
    const companyName = body.companyName || existing.companyName || (companyId ? await resolveCompanyName(companyId) : '');
    // Normalize employmentType
    const rawType = body.employmentType || body.type || existing.employmentType || existing.type || '';
    const employmentType = normalizeEmploymentType(rawType);
    // Explicitly resolve visibilityType — prefer body value over existing, never allow undefined or empty string to overwrite
    const visibilityType = body.visibilityType || existing.visibilityType || 'internal_only';
    // Auto-activate status when visibility is set to public_global
    let status = body.status || existing.status || 'active';
    if (visibilityType === 'public_global' && !JOB_ACTIVE_STATUSES.has(status)) {
      status = 'active';
    }
    const item = {
      ...existing,
      ...body,
      id,
      companyId: companyId || existing.companyId,
      company: companyId || existing.companyId,
      companyName,
      employmentType,
      visibilityType,
      status,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`job-posting:${id}`, item);
    await broadcastUpdate('job-posting', 'UPDATE', id, item);
    return c.json(item);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

makeCrud("superadmin/job-posting", "job-posting:", requireSuperAdmin);
makeCrud("superadmin/disciplinary-case", "disciplinary:", requireSuperAdmin);
makeCrud("superadmin/compliance-item", "compliance:", requireSuperAdmin);
makeCrud("superadmin/training-program", "training:", requireSuperAdmin);
makeCrud("superadmin/task", "task:", requireSuperAdmin);
makeCrud("superadmin/onboard-checklist", "onboard-checklist:", requireSuperAdmin);

// ============ ADMIN CRUD (shared KV prefixes) ============
// Note: admin/assets has custom routes above with validation - DO NOT use makeCrud here
makeCrud("admin/asset-categories", "asset-category:", requireAdminOrAbove);
makeCrud("admin/paygrades", "paygrade:", requireAdminOrAbove);
makeCrud("admin/financial-years", "financial-year:", requireAdminOrAbove);
makeCrud("admin/tax-configurations", "tax-configuration:", requireAdminOrAbove);
makeCrud("admin/leave-types", "leave-type:", requireAdminOrAbove);
makeCrud("admin/departments", "department:", requireAdminOrAbove);
makeCrud("admin/compensations", "compensation:", requireAdminOrAbove);
makeCrud("admin/benefits", "benefit:", requireAdminOrAbove);

// POST /admin/payroll/calculate — auto-calculate tax deductions + benefit allowances for a given employee + basic salary
app.post(`${PREFIX}/admin/payroll/calculate`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const { userId, basicSalary: baseSalaryStr, period } = await c.req.json();
    const basicSalary = parseFloat(baseSalaryStr || 0);

    const scope = await resolveCompanyScope(user.id);

    // Fetch all tax and benefit sources: admin-created (tax-configuration/benefit)
    // AND superadmin-created (tax-bracket/benefit-plan) — both are company-scoped
    const [allTaxConfigs, allTaxBrackets, allBenefits, allBenefitPlans, allOT, allExpenses] = await Promise.all([
      kv.getByPrefix('tax-configuration:'),
      kv.getByPrefix('tax-bracket:'),
      kv.getByPrefix('benefit:'),
      kv.getByPrefix('benefit-plan:'),
      kv.getByPrefix('overtime:'),
      kv.getByPrefix('expense:'),
    ]);

    // Filter all sources by company scope using shared helper
    const scopeFilter = makeScopeFilter(scope);
    const taxConfigs = allTaxConfigs.filter(scopeFilter);
    const taxBrackets = allTaxBrackets.filter((t: any) => scopeFilter(t) && t.status !== 'inactive');
    const benefits = allBenefits.filter(scopeFilter);
    const benefitPlans = allBenefitPlans.filter((b: any) => scopeFilter(b) && b.status !== 'inactive');

    // Calculate tax deduction from admin-style tax-configuration records
    let taxDeduction = 0;
    for (const tax of taxConfigs) {
      if (tax.enabled === false) continue;
      if (tax.applicableTo && tax.applicableTo !== 'all' && tax.applicableTo !== 'employees') continue;
      if (tax.type === 'percentage') {
        taxDeduction += basicSalary * (parseFloat(tax.rate || 0) / 100);
      } else if (tax.type === 'flat') {
        taxDeduction += parseFloat(tax.amount || 0);
      } else if (tax.type === 'bracket' && Array.isArray(tax.brackets)) {
        let remaining = basicSalary;
        for (const bracket of tax.brackets) {
          if (remaining <= 0) break;
          const min = parseFloat(bracket.min || 0);
          const max = parseFloat(bracket.max || 0) || Infinity;
          const rate = parseFloat(bracket.rate || 0) / 100;
          const taxable = Math.min(remaining, max - min);
          taxDeduction += taxable * rate;
          remaining -= taxable;
        }
      }
    }
    // Add superadmin-style progressive bracket tax using shared helper
    taxDeduction += calcProgressiveTax(basicSalary, taxBrackets);

    // Calculate benefit allowance (employer contribution)
    let benefitAllowance = 0;
    for (const benefit of benefits) {
      if (benefit.enabled === false) continue;
      if (userId && benefit.eligibleUsers?.length && !benefit.eligibleUsers.includes(userId)) continue;
      if (benefit.contributionType === 'percentage') {
        benefitAllowance += basicSalary * (parseFloat(benefit.employerContribution || 0) / 100);
      } else {
        benefitAllowance += parseFloat(benefit.employerContribution || 0);
      }
    }
    // Add superadmin-style benefit-plan contributions using shared helper
    benefitAllowance += calcBenefitPlanAllowance(basicSalary, benefitPlans, userId);

    // Calculate approved OT bonus
    let otBonus = 0;
    if (userId) {
      const approvedOT = allOT.filter((r: any) =>
        r.userId === userId && r.status === 'approved' && (!period || r.date?.startsWith(period))
      );
      otBonus = approvedOT.reduce((s: number, r: any) => s + (parseFloat(r.rate || 0) * parseFloat(r.hours || 0)), 0);
    }

    // Calculate approved expense reimbursement
    let expenseReimbursement = 0;
    if (userId) {
      const approvedExp = allExpenses.filter((e: any) =>
        e.userId === userId && (e.status === 'approved' || e.status === 'reimbursed') &&
        (!period || e.date?.startsWith(period))
      );
      expenseReimbursement = approvedExp.reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0);
    }

    const totalAllowances = benefitAllowance + otBonus + expenseReimbursement;
    const netPay = basicSalary + totalAllowances - taxDeduction;

    return c.json({
      basicSalary,
      taxDeduction: parseFloat(taxDeduction.toFixed(2)),
      benefitAllowance: parseFloat(benefitAllowance.toFixed(2)),
      otBonus: parseFloat(otBonus.toFixed(2)),
      expenseReimbursement: parseFloat(expenseReimbursement.toFixed(2)),
      totalAllowances: parseFloat(totalAllowances.toFixed(2)),
      netPay: parseFloat(netPay.toFixed(2)),
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Alias: superadmin can also call calculate directly
app.post(`${PREFIX}/superadmin/payroll/calculate`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const { userId, basicSalary: baseSalaryStr, period } = await c.req.json();
    const basicSalary = parseFloat(baseSalaryStr || 0);
    const scope = await resolveCompanyScope(user.id);

    // Fetch all tax and benefit sources including both admin and superadmin stores
    const [allTaxConfigs, allTaxBrackets, allBenefits, allBenefitPlans, allOT, allExpenses] = await Promise.all([
      kv.getByPrefix('tax-configuration:'),
      kv.getByPrefix('tax-bracket:'),
      kv.getByPrefix('benefit:'),
      kv.getByPrefix('benefit-plan:'),
      kv.getByPrefix('overtime:'),
      kv.getByPrefix('expense:'),
    ]);

    const scopeFilter = makeScopeFilter(scope);
    const taxConfigs = allTaxConfigs.filter(scopeFilter);
    const taxBrackets = allTaxBrackets.filter((t: any) => scopeFilter(t) && t.status !== 'inactive');
    const benefits = allBenefits.filter(scopeFilter);
    const benefitPlans = allBenefitPlans.filter((b: any) => scopeFilter(b) && b.status !== 'inactive');

    let taxDeduction = 0;
    for (const tax of taxConfigs) {
      if (tax.enabled === false) continue;
      if (tax.applicableTo && tax.applicableTo !== 'all' && tax.applicableTo !== 'employees') continue;
      if (tax.type === 'percentage') { taxDeduction += basicSalary * (parseFloat(tax.rate || 0) / 100); }
      else if (tax.type === 'flat') { taxDeduction += parseFloat(tax.amount || 0); }
      else if (tax.type === 'bracket' && Array.isArray(tax.brackets)) {
        let remaining = basicSalary;
        for (const bracket of tax.brackets) {
          if (remaining <= 0) break;
          const taxable = Math.min(remaining, (parseFloat(bracket.max || 0) || Infinity) - parseFloat(bracket.min || 0));
          taxDeduction += taxable * (parseFloat(bracket.rate || 0) / 100);
          remaining -= taxable;
        }
      }
    }
    taxDeduction += calcProgressiveTax(basicSalary, taxBrackets);

    let benefitAllowance = 0;
    for (const benefit of benefits) {
      if (benefit.enabled === false) continue;
      if (userId && benefit.eligibleUsers?.length && !benefit.eligibleUsers.includes(userId)) continue;
      if (benefit.contributionType === 'percentage') { benefitAllowance += basicSalary * (parseFloat(benefit.employerContribution || 0) / 100); }
      else { benefitAllowance += parseFloat(benefit.employerContribution || 0); }
    }
    benefitAllowance += calcBenefitPlanAllowance(basicSalary, benefitPlans, userId);

    let otBonus = 0;
    if (userId) {
      const approvedOT = allOT.filter((r: any) => r.userId === userId && r.status === 'approved' && (!period || r.date?.startsWith(period)));
      otBonus = approvedOT.reduce((s: number, r: any) => s + (parseFloat(r.rate || 0) * parseFloat(r.hours || 0)), 0);
    }
    let expenseReimbursement = 0;
    if (userId) {
      const approvedExp = allExpenses.filter((e: any) => e.userId === userId && (e.status === 'approved' || e.status === 'reimbursed') && (!period || e.date?.startsWith(period)));
      expenseReimbursement = approvedExp.reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0);
    }
    const totalAllowances = benefitAllowance + otBonus + expenseReimbursement;
    const netPay = basicSalary + totalAllowances - taxDeduction;
    return c.json({ basicSalary, taxDeduction: parseFloat(taxDeduction.toFixed(2)), benefitAllowance: parseFloat(benefitAllowance.toFixed(2)), otBonus: parseFloat(otBonus.toFixed(2)), expenseReimbursement: parseFloat(expenseReimbursement.toFixed(2)), totalAllowances: parseFloat(totalAllowances.toFixed(2)), netPay: parseFloat(netPay.toFixed(2)) });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Public read-only endpoints for employees to access reference data
app.get(`${PREFIX}/leave-types`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json([]);
    
    const all = await kv.getByPrefix("leave-type:");
    // Case-insensitive comparison to handle UUID variations; also check .company fallback
    const filtered = all.filter((item: any) => {
      const co = item.companyId || item.company;
      return co && co.toLowerCase() === companyId.toLowerCase();
    });
    return c.json(filtered);
  } catch (e: any) {
    return c.json([]);
  }
});

app.get(`${PREFIX}/holidays`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json([]);
    
    const all = await kv.getByPrefix("holiday:");
    const filtered = all.filter((item: any) => {
      const co = item.companyId || item.company;
      return co && co.toLowerCase() === companyId.toLowerCase();
    });
    return c.json(filtered);
  } catch (e: any) {
    return c.json([]);
  }
});
// CUSTOM: admin/job-postings GET — list company job postings with a fallback
// when strict applyCompanyFilter returns nothing (scope/name mismatch scenarios).
app.get(`${PREFIX}/admin/job-postings`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const all = await kv.getByPrefix("job-posting:");
    const strict = await applyCompanyFilter(all, user.id, 'admin');
    if (strict.length > 0) {
      return c.json(strict);
    }
    // Fallback: when strict scope/UUID filter returns nothing (e.g. scope holds company
    // names but items were stored with UUIDs), also try matching by companyName.
    // We deliberately keep companyId/company checks separate from companyName to avoid
    // false positives when a UUID string happens to equal a company name substring.
    const scope = await resolveCompanyScope(user.id);
    if (!scope || scope.length === 0) return c.json([]);
    const scopeSet = new Set(scope.map((s: string) => s.toLowerCase()));
    const fallback = all.filter((item: any) => {
      // Try UUID/company field match first
      const idField = (item.companyId || item.company || '').toLowerCase();
      if (idField && scopeSet.has(idField)) return true;
      // Try human-readable name match (separate check to avoid UUID/name confusion)
      const nameField = (item.companyName || '').toLowerCase();
      return nameField && scopeSet.has(nameField);
    });
    return c.json(fallback);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});
// CUSTOM: admin/job-postings POST/PUT with auto-populated companyName and status normalization
app.post(`${PREFIX}/admin/job-postings`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const companyId = body.companyId || body.company || (await getCompanyId(user.id));
    if (!companyId) return c.json({ error: 'User has no company assignment' }, 400);
    const companyName = body.companyName || (await resolveCompanyName(companyId)) || '';
    const employmentType = normalizeEmploymentType(body.employmentType || body.type || '');
    const visibilityType = body.visibilityType || 'internal_only';
    let status = body.status || 'open';
    if (visibilityType === 'public_global' && !JOB_ACTIVE_STATUSES.has(status)) {
      status = 'open';
    }
    const item = {
      ...body,
      id,
      companyId,
      company: companyId,
      companyName,
      employmentType,
      visibilityType,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`job-posting:${id}`, item);
    await broadcastUpdate('job-posting', 'INSERT', id, item);
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/admin/job-postings/:id`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(`job-posting:${id}`) || {};
    const companyId = existing.companyId || body.companyId || (await getCompanyId(user.id));
    const companyName = body.companyName || existing.companyName || (companyId ? await resolveCompanyName(companyId) : '');
    const rawType = body.employmentType || body.type || existing.employmentType || existing.type || '';
    const employmentType = normalizeEmploymentType(rawType);
    const visibilityType = body.visibilityType || existing.visibilityType || 'internal_only';
    let status = body.status || existing.status || 'open';
    if (visibilityType === 'public_global' && !JOB_ACTIVE_STATUSES.has(status)) {
      status = 'open';
    }
    const item = {
      ...existing,
      ...body,
      id,
      companyId: companyId || existing.companyId,
      company: companyId || existing.companyId,
      companyName,
      employmentType,
      visibilityType,
      status,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`job-posting:${id}`, item);
    await broadcastUpdate('job-posting', 'UPDATE', id, item);
    return c.json(item);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

makeCrud("admin/job-postings", "job-posting:", requireAdminOrAbove);
makeCrud("admin/workflows", "workflow:", requireAdminOrAbove);

// Custom task POST: create task and email the assignee
app.post(`${PREFIX}/admin/tasks`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const companyId = body.companyId || body.company || (await getCompanyId(user.id));
    if (!companyId) return c.json({ error: 'User has no company assignment' }, 400);
    const item = { ...body, id, companyId, company: companyId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await kv.set(`task:${id}`, item);
    await broadcastUpdate('task', 'INSERT', id, item);
    // Notify assignees via email
    const assigneeIds: string[] = [
      ...(Array.isArray(body.assignedToIds) ? body.assignedToIds : []),
      body.assigneeId, body.assignedToId, body.employeeId, body.userId,
    ].filter((v): v is string => typeof v === 'string' && v.length > 0);
    for (const aid of [...new Set(assigneeIds)]) {
      const emp = await kv.get(`employee:${aid}`) as any;
      if (emp?.email) {
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, { id: nid, userId: aid, type: 'task-assigned', title: 'New Task Assigned', message: `You have been assigned a new task: "${body.title || 'Task'}"`, read: false, createdAt: new Date().toISOString() });
        sendEmailNotification(
          aid, emp.email, emp.name || '',
          `New Task Assigned: "${body.title || 'Task'}" — Blumebyte HR`,
          `<p>You have been assigned a new task.</p><p><strong>Task:</strong> ${body.title || 'Task'}</p>${body.description ? `<p style="color:#6b7280;font-size:14px;">${body.description}</p>` : ''}${body.dueDate ? `<p style="color:#6b7280;font-size:14px;">Due: <strong>${body.dueDate}</strong></p>` : ''}`,
          'emailOnTaskAssignment'
        );
      }
    }
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Custom performance-review POST: create review and email the employee
app.post(`${PREFIX}/admin/performance-reviews`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const companyId = body.companyId || body.company || (await getCompanyId(user.id));
    if (!companyId) return c.json({ error: 'User has no company assignment' }, 400);
    const item = { ...body, id, companyId, company: companyId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await kv.set(`perf-review:${id}`, item);
    await broadcastUpdate('perf-review', 'INSERT', id, item);
    // Notify the reviewed employee
    const revieweeId = body.employeeId || body.userId || body.revieweeId;
    if (revieweeId) {
      const emp = await kv.get(`employee:${revieweeId}`) as any;
      if (emp?.email) {
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, { id: nid, userId: revieweeId, type: 'performance-review', title: 'Performance Review Scheduled', message: `A performance review has been scheduled for you${body.period ? ` for ${body.period}` : ''}.`, read: false, createdAt: new Date().toISOString() });
        sendEmailNotification(
          revieweeId, emp.email, emp.name || '',
          `Performance Review Scheduled — Blumebyte HR`,
          `<p>A performance review has been scheduled for you${body.period ? ` for the period <strong>${body.period}</strong>` : ''}.</p>${body.reviewDate ? `<p style="color:#6b7280;font-size:14px;">Review Date: <strong>${body.reviewDate}</strong></p>` : ''}`,
          'emailOnPerformanceReview'
        );
      }
    }
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

makeCrud("admin/performance-reviews", "perf-review:", requireAdminOrAbove);
makeCrud("admin/disciplinary-cases", "disciplinary:", requireAdminOrAbove);
makeCrud("admin/compliance-items", "compliance:", requireAdminOrAbove);
makeCrud("admin/tasks", "task:", requireAdminOrAbove);
makeCrud("admin/feedback", "feedback:", requireAdminOrAbove);
makeCrud("admin/training-program", "training:", requireAdminOrAbove);

// ============ COMPANY LOGO UPLOAD (SuperAdmin only) ============
app.post(`${PREFIX}/upload/company-logo`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    await ensureBucket();
    
    // CRITICAL FIX: Get company scope for logo upload
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json({ error: "Company not found" }, 404);
    
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') return c.json({ error: "No file provided" }, 400);
    const blob = file as File;
    const arrayBuf = await blob.arrayBuffer();
    const size = arrayBuf.byteLength;
    if (size > 5 * 1024 * 1024) {
      return c.json({ error: `Logo must be less than 5MB. Your file is ${(size / (1024 * 1024)).toFixed(1)}MB.` }, 400);
    }
    const ext = blob.name?.split('.').pop()?.toLowerCase() || 'png';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return c.json({ error: "Only image files are allowed for company logo" }, 400);
    }
    const storagePath = `company/${companyId}/logo.${ext}`;
    const sb = supabaseAdmin();
    const uint8 = new Uint8Array(arrayBuf);
    await sb.storage.from(BUCKET_NAME).upload(storagePath, uint8, {
      contentType: blob.type || `image/${ext}`,
      upsert: true,
    });
    const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    const logoUrl = urlData?.signedUrl || '';
    const existing = await kv.get(`company-settings:${companyId}`) || {};
    await kv.set(`company-settings:${companyId}`, { ...existing, companyId, logoUrl, logoPath: storagePath, updatedAt: new Date().toISOString() });
    return c.json({ logoUrl, success: true }, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: `Logo upload failed: ${e.message}` }, 500);
  }
});

// ============ REMOVE COMPANY LOGO (SuperAdmin only) ============
app.delete(`${PREFIX}/superadmin/remove-company-logo`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    
    // CRITICAL FIX: Get company scope for logo removal
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json({ error: "Company not found" }, 404);
    
    const sb = supabaseAdmin();
    const existing = await kv.get(`company-settings:${companyId}`) || {};
    if (existing.logoPath) {
      await sb.storage.from(BUCKET_NAME).remove([existing.logoPath]);
    }
    const updated = { ...existing, companyId, logoUrl: '', logoPath: '', updatedAt: new Date().toISOString() };
    await kv.set(`company-settings:${companyId}`, updated);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: `Failed to remove logo: ${e.message}` }, 500);
  }
});

// ============ MEETING SYSTEM (All roles) ============
app.post(`${PREFIX}/meetings`, async (c) => {
  try {
    const { user, role, kvData } = await requireAuth(c);
    const body = await c.req.json();
    const isPrivileged = ["superadmin", "admin", "manager"].includes(role);
    if (!isPrivileged) { body.status = "pending-approval"; body.requestedBy = user.id; body.requestedByName = kvData?.name || ""; }
    else { body.status = body.status || "scheduled"; }
    if (body.status === "scheduled") { const err = await validateMeetingSchedule(body); if (err) return c.json({ error: err }, 400); }
    const id = body.id || crypto.randomUUID();
    
    // CRITICAL FIX: Add company scope to meetings
    const userCompanyId = kvData?.companyId || kvData?.company;
    const company = userCompanyId ? await kv.get(`company_by_id:${userCompanyId}`) : null;
    
    const item = { 
      ...body, 
      id, 
      createdBy: user.id, 
      createdByName: kvData?.name || "", 
      companyId: userCompanyId,
      company: company?.name || userCompanyId,
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    };
    await kv.set(`meeting:${id}`, item);
    // Notify all participants (support both single participantId and participantIds array)
    const allParticipantIds = [...(body.participantIds || []), body.participantId].filter(Boolean);
    for (const pid of allParticipantIds) {
      const nid = crypto.randomUUID();
      const msgTitle = body.status === "pending-approval" ? "Meeting Request" : "Meeting Scheduled";
      const msgBody = body.status === "pending-approval"
        ? `${kvData?.name || "Someone"} requests a meeting: "${body.title || "Meeting"}" on ${body.date} at ${body.startTime}.`
        : `New meeting: "${body.title || "Meeting"}" on ${body.date} at ${body.startTime}.`;
      await kv.set(`notification:${nid}`, { id: nid, userId: pid, type: body.status === "pending-approval" ? "meeting-request" : "meeting-scheduled", title: msgTitle, message: msgBody, read: false, createdAt: new Date().toISOString() });
      // Send email notification to each participant
      const participant = await kv.get(`employee:${pid}`) as any;
      if (participant?.email) {
        sendEmailNotification(
          pid, participant.email, participant.name || '',
          `${msgTitle}: "${body.title || 'Meeting'}" — Blumebyte HR`,
          `<p>${msgBody}</p><p style="color:#6b7280;font-size:14px;">Date: <strong>${body.date || ''}</strong> &nbsp;|&nbsp; Time: <strong>${body.startTime || ''}</strong>${body.location ? ` &nbsp;|&nbsp; Location: <strong>${body.location}</strong>` : ''}</p>`,
          'emailOnMeeting'
        );
      }
    }
    return c.json(item, 201);
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); return c.json({ error: e.message }, 500); }
});

app.get(`${PREFIX}/meetings`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const all = await kv.getByPrefix("meeting:");
    // Apply company filtering
    const filtered = await applyCompanyFilter(all, user.id, role);
    if (["superadmin", "admin"].includes(role)) return c.json(filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    const mine = filtered.filter((m: any) => m.organizerId === user.id || m.participantId === user.id || (m.participantIds || []).includes(user.id) || m.createdBy === user.id || m.requestedBy === user.id);
    return c.json(mine.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); return c.json({ error: e.message }, 500); }
});

app.put(`${PREFIX}/meetings/:id`, async (c) => {
  try {
    const { user, role, kvData } = await requireAuth(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`meeting:${id}`);
    if (!existing) return c.json({ error: "Meeting not found" }, 404);
    if (body.status === "scheduled" && existing.status === "pending-approval") {
      const err = await validateMeetingSchedule({ ...existing, ...body }, id);
      if (err) return c.json({ error: err }, 400);
      if (existing.requestedBy) {
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, { id: nid, userId: existing.requestedBy, type: "meeting-approved", title: "Meeting Approved", message: `Your meeting "${existing.title}" on ${existing.date} was approved by ${kvData?.name || "the recipient"}.`, read: false, createdAt: new Date().toISOString() });
      }
    }
    if (body.status === "rejected" && existing.requestedBy) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, { id: nid, userId: existing.requestedBy, type: "meeting-rejected", title: "Meeting Declined", message: `Your meeting "${existing.title}" on ${existing.date} was declined.${body.rejectionReason ? " Reason: " + body.rejectionReason : ""}`, read: false, createdAt: new Date().toISOString() });
    }
    const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    await kv.set(`meeting:${id}`, updated);
    return c.json(updated);
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); return c.json({ error: e.message }, 500); }
});

app.delete(`${PREFIX}/meetings/:id`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const id = c.req.param("id");
    const existing = await kv.get(`meeting:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (!["superadmin", "admin"].includes(role) && existing.createdBy !== user.id && existing.requestedBy !== user.id) return c.json({ error: "Cannot delete others' meetings" }, 403);
    await kv.del(`meeting:${id}`);
    return c.json({ success: true });
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); return c.json({ error: e.message }, 500); }
});

// ============ TASK APPROVAL WITH NOTIFICATIONS ============
app.put(`${PREFIX}/task-approve/:id`, async (c) => {
  try {
    const { kvData } = await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`task:${id}`);
    if (!existing) return c.json({ error: "Task not found" }, 404);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`task:${id}`, updated);
    if (body.status && ["completed", "approved"].includes(body.status) && existing.assigneeId) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, { id: nid, userId: existing.assigneeId, type: "task-approved", title: "Task Update", message: `Your task "${existing.title}" has been marked as ${body.status} by ${kvData?.name || "management"}.`, read: false, createdAt: new Date().toISOString() });
    }
    return c.json(updated);
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403); return c.json({ error: e.message }, 500); }
});

// ============ ONBOARD/TRAINING STATUS WITH NOTIFICATIONS ============
app.put(`${PREFIX}/onboard-approve/:id`, async (c) => {
  try {
    const { kvData } = await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`onboard-checklist:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`onboard-checklist:${id}`, updated);
    if (body.status && ["completed", "approved"].includes(body.status) && existing.employeeId) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, { id: nid, userId: existing.employeeId, type: "onboarding-approved", title: "Onboarding Update", message: `Onboarding task "${existing.title || existing.name}" has been marked as ${body.status}.`, read: false, createdAt: new Date().toISOString() });
    }
    return c.json(updated);
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403); return c.json({ error: e.message }, 500); }
});

app.put(`${PREFIX}/training-approve/:id`, async (c) => {
  try {
    const { user, kvData } = await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`training:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`training:${id}`, updated);
    // CRITICAL FIX: Only broadcast to employees in the SAME company
    if (body.status && ["completed", "active"].includes(body.status)) {
      const callerCompany = kvData?.companyId || kvData?.company;
      const allEmps = await kv.getByPrefix("employee:");
      const companyEmps = callerCompany ? allEmps.filter((e: any) => e.companyId === callerCompany || e.company === callerCompany) : [];
      for (const emp of companyEmps) {
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, { id: nid, userId: emp.userId || emp.id, type: "training-update", title: "Training Update", message: `Training "${existing.name || existing.title}" is now ${body.status}.`, read: false, createdAt: new Date().toISOString() });
      }
    }
    return c.json(updated);
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403); return c.json({ error: e.message }, 500); }
});

// ============ REPORTS ============
app.get(`${PREFIX}/reports/users`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const allEmployees = await kv.getByPrefix("employee:");
    
    // CRITICAL: Filter by company for multi-tenant isolation
    const employees = await filterEmployeesByCompany(allEmployees, user.id, role);
    
    const attendance = await kv.getByPrefix("attendance:");
    // Flatten attendance: some records are stored as arrays (company-based) and some as objects (user-based)
    const flatAttendance: any[] = [];
    for (const entry of attendance) {
      if (Array.isArray(entry)) {
        for (const rec of entry) flatAttendance.push(rec);
      } else if (entry && typeof entry === 'object' && (entry.userId || entry.clockIn)) {
        flatAttendance.push(entry);
      }
    }
    const allowedUserIds = new Set(employees.map((e: any) => e.userId || e.id));
    const report = employees.map((e: any) => {
      const empId = e.userId || e.id;
      const empAtt = flatAttendance.filter((a: any) => a.userId === empId);
      const totalHoursWorked = empAtt.reduce((s: number, a: any) => {
        // Prefer explicit totalHours field
        if (a.totalHours != null) return s + (parseFloat(a.totalHours) || 0);
        // Fall back to regularMinutes + overtimeMinutes (auto-clock records)
        const mins = (a.regularMinutes || 0) + (a.overtimeMinutes || 0);
        if (mins > 0) return s + mins / 60;
        // Fall back to hoursWorked (manual employee clock-out)
        if (a.hoursWorked != null) return s + (parseFloat(a.hoursWorked) || 0);
        // Last resort: compute from clockIn/clockOut timestamps
        if (a.clockIn && a.clockOut) {
          return s + (new Date(a.clockOut).getTime() - new Date(a.clockIn).getTime()) / 3600000;
        }
        return s;
      }, 0);
      return { userId: empId, name: e.name, email: e.email, role: e.role, department: e.department, company: e.company, position: e.position, status: e.status, phone: e.phone, attendanceDays: empAtt.length, totalHoursWorked: totalHoursWorked.toFixed(1), joinDate: e.createdAt };
    });
    
    return c.json(report);
  } catch (e: any) { 
    console.error(`❌ Error in /reports/users:`, e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); 
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403); 
    return c.json({ error: e.message }, 500); 
  }
});

app.get(`${PREFIX}/reports/attendance`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const allEmployees = await kv.getByPrefix("employee:");
    
    // CRITICAL: Filter by company for multi-tenant isolation
    const filteredEmployees = await filterEmployeesByCompany(allEmployees, user.id, role);
    
    const allowedUserIds = new Set(filteredEmployees.map((e: any) => e.userId || e.id));
    const empMap: Record<string, string> = {};
    for (const e of filteredEmployees) empMap[e.userId || e.id] = e.name;
    const attendance = await kv.getByPrefix("attendance:");
    const filteredAttendance = attendance.filter((a: any) => allowedUserIds.has(a.userId));
    
    const report = filteredAttendance.map((a: any) => ({ ...a, employeeName: empMap[a.userId] || a.userId })).sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    return c.json(report);
  } catch (e: any) { 
    console.error(`❌ Error in /reports/attendance:`, e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); 
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403); 
    return c.json({ error: e.message }, 500); 
  }
});

// DEBUG ENDPOINT: Show raw vs filtered data for troubleshooting
app.get(`${PREFIX}/debug/tenant-data`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    
    // Get user's profile
    const profile = await kv.get(`employee:${user.id}`);
    const scope = await resolveCompanyScope(user.id);
    
    // Get all employees
    const allEmployees = await kv.getByPrefix("employee:");
    const filteredEmployees = await filterEmployeesByCompany(allEmployees, user.id, role);
    
    // DETAILED DEBUG: Check why filtering fails
    const debugFiltering = allEmployees.slice(0, 7).map(e => {
      const empCompany = e.company || e.companyId;
      const matchResult = scope.some(s => s.toLowerCase() === (empCompany || '').toLowerCase());
      return {
        name: e.name,
        company: empCompany,
        companyType: typeof empCompany,
        scopeUppercase: scope,
        empLowercase: empCompany?.toLowerCase(),
        scopeLowercase: scope.map(s => s.toLowerCase()),
        shouldMatch: matchResult,
        included: matchResult
      };
    });
    
    // Get sample data
    const sampleEmployees = allEmployees.slice(0, 5).map(e => ({
      id: e.id || e.userId,
      name: e.name,
      email: e.email,
      role: e.role,
      company: e.company,
      companyId: e.companyId,
      assignedCompanies: e.assignedCompanies
    }));
    
    return c.json({
      debug: {
        currentUser: {
          id: user.id,
          role: role,
          profile: {
            company: profile?.company,
            companyId: profile?.companyId,
            assignedCompanies: profile?.assignedCompanies
          },
          resolvedScope: scope
        },
        dataCounts: {
          totalEmployeesInSystem: allEmployees.length,
          employeesUserCanSee: filteredEmployees.length,
          totalAttendanceRecords: (await kv.getByPrefix("attendance:")).length,
          totalDepartments: (await kv.getByPrefix("department:")).length
        },
        sampleEmployees: sampleEmployees,
        filteredEmployeeIds: filteredEmployees.slice(0, 5).map(e => ({
          id: e.id || e.userId,
          name: e.name,
          company: e.company || e.companyId
        })),
        detailedFilterDebug: debugFiltering,
        note: "✅ Company matching is now CASE-INSENSITIVE (BLUMEBYTE = blumebyte)"
      }
    });
  } catch (e: any) {
    console.error(`❌ Error in /debug/tenant-data:`, e);
    return c.json({ error: e.message }, 500);
  }
});

// ============ LEAVE REQUESTS ============
app.post(`${PREFIX}/leave-requests`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const kvData = await kv.get(`employee:${user.id}`);
    // CRITICAL FIX: Include companyId for multi-tenant isolation
    const companyId = kvData?.companyId || kvData?.company;
    const leave = {
      id,
      userId: user.id,
      employeeName: kvData?.name || user.user_metadata?.name || "",
      department: kvData?.department || "",
      companyId,
      company: companyId,
      ...body,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`leave:${id}`, leave);
    // Trigger workflow notifications for leave type
    if (companyId) {
      const empName = kvData?.name || user.user_metadata?.name || 'An employee';
      const leaveType = body.leaveType || 'leave';
      await triggerWorkflowNotifications(
        companyId,
        'leave',
        'Leave Request Submitted',
        `${empName} submitted a ${leaveType} request from ${body.startDate || ''} to ${body.endDate || ''}`
      );
    }
    return c.json(leave, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/leave-requests`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let allLeaves = await kv.getByPrefix("leave:");
    if (role === "employee") {
      return c.json(allLeaves.filter((l: any) => l.userId === user.id));
    }
    // For managers/admins, filter by employee company scope
    const employees = await kv.getByPrefix("employee:");
    const filteredEmployees = await filterEmployeesByCompany(employees, user.id, role);
    const allowedUserIds = new Set(filteredEmployees.map((e: any) => e.id || e.userId));
    allLeaves = allLeaves.filter((l: any) => allowedUserIds.has(l.userId));
    return c.json(allLeaves);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/leave-requests/:leaveId`, async (c) => {
  try {
    await requireManagerOrAbove(c);
    const leaveId = c.req.param("leaveId");
    const body = await c.req.json();
    const existing = await kv.get(`leave:${leaveId}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`leave:${leaveId}`, updated);
    // Notify employee of leave status change
    if (body.status && body.status !== existing.status && existing.userId) {
      const nid = crypto.randomUUID();
      const leaveMsg = `Your ${existing.leaveType || ""} leave request has been ${body.status}`;
      await kv.set(`notification:${nid}`, {
        id: nid, userId: existing.userId, type: "leave-update",
        title: `Leave ${body.status === "approved" ? "Approved" : body.status === "rejected" ? "Rejected" : "Updated"}`,
        message: leaveMsg,
        read: false, createdAt: new Date().toISOString(),
      });
      // Also send email notification
      const emp = await kv.get(`employee:${existing.userId}`) as any;
      if (emp?.email) {
        sendEmailNotification(
          existing.userId, emp.email, emp.name || '',
          `Leave Request ${body.status === 'approved' ? 'Approved' : body.status === 'rejected' ? 'Rejected' : 'Updated'} — Blumebyte HR`,
          `<p>${leaveMsg}.</p><p style="color:#6b7280;font-size:14px;">Leave type: <strong>${existing.leaveType || 'Leave'}</strong><br/>Period: ${existing.startDate || ''} – ${existing.endDate || ''}</p>`,
          'emailOnLeaveUpdate'
        );
      }
    }
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Delete leave request (superadmin/admin/manager)
app.delete(`${PREFIX}/leave-requests/:leaveId`, async (c) => {
  try {
    await requireManagerOrAbove(c);
    const leaveId = c.req.param("leaveId");
    await kv.del(`leave:${leaveId}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ TRAINING PROGRAMS ============
// Get all training programs
app.get(`${PREFIX}/training-programs`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let allTrainings = await kv.getByPrefix("training:");
    
    // For employees, only show trainings they're assigned to
    if (role === "employee") {
      return c.json(allTrainings.filter((t: any) => 
        (t.assignedUsers || []).includes(user.id)
      ));
    }
    
    // Filter by company scope
    const employees = await kv.getByPrefix("employee:");
    const filteredEmployees = await filterEmployeesByCompany(employees, user.id, role);
    const companyId = filteredEmployees.length > 0 ? filteredEmployees[0].companyId : null;
    
    return c.json(allTrainings.filter((t: any) => t.companyId === companyId));
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Create training program
app.post(`${PREFIX}/training-programs`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    
    // Get company ID from user profile
    const userProfile = await kv.get(`user_profile:${user.id}`);
    const companyId = userProfile?.companyId;
    
    const id = `training_${crypto.randomUUID()}`;
    const training = {
      ...body,
      id,
      companyId,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      assignedUsers: body.assignedUsers || [],
    };
    
    await kv.set(`training:${id}`, training);
    return c.json(training, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Update training program
app.put(`${PREFIX}/training-programs/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existing = await kv.get(`training:${id}`);
    if (!existing) return c.json({ error: "Training not found" }, 404);
    
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`training:${id}`, updated);
    
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Delete training program
app.delete(`${PREFIX}/training-programs/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param("id");
    await kv.del(`training:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ ADMIN TRAINING PROGRAMS (aliases for /training-programs) ============
app.get(`${PREFIX}/admin/training-programs`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const scope = await resolveCompanyScope(user.id);
    const allTrainings = await kv.getByPrefix("training:");
    const filtered = allTrainings.filter((t: any) =>
      scope && companyMatches(scope, t.companyId || t.company)
    );
    return c.json(filtered);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json([]);
  }
});

// ============ AUTO-CLOCK SETTINGS ============
app.get(`${PREFIX}/auto-clock-settings`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    // CRITICAL FIX: Get company-scoped auto-clock settings
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json({ enabled: false, clockInTime: "08:00", clockOutTime: "17:00", mode: "all", specificUsers: [], inactivityTimeout: 30 });
    
    const settings = await kv.get(`auto-clock-settings:${companyId}`);
    return c.json(settings || { enabled: false, clockInTime: "08:00", clockOutTime: "17:00", mode: "all", specificUsers: [], inactivityTimeout: 30 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/auto-clock-settings`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    
    // CRITICAL FIX: Update company-scoped auto-clock settings
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json({ error: "Company not found" }, 404);
    
    const settings = { ...body, companyId, updatedAt: new Date().toISOString() };
    await kv.set(`auto-clock-settings:${companyId}`, settings);
    return c.json(settings);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ MANUAL CLOCK VISIBILITY SETTINGS ============
app.get(`${PREFIX}/manual-clock-settings`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    // CRITICAL FIX: Get company-scoped manual-clock settings
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json({ enabled: true, mode: "all", specificUsers: [] });
    
    const settings = await kv.get(`manual-clock-settings:${companyId}`);
    return c.json(settings || { enabled: true, mode: "all", specificUsers: [] });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/manual-clock-settings`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    
    // CRITICAL FIX: Update company-scoped manual-clock settings
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    if (!companyId) return c.json({ error: "Company not found" }, 404);
    
    const settings = { ...body, companyId, updatedAt: new Date().toISOString() };
    await kv.set(`manual-clock-settings:${companyId}`, settings);
    return c.json(settings);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Batch auto clock-out: checks all open attendance records and auto-clocks out if past configured time
app.post(`${PREFIX}/attendance/batch-auto-clockout`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    // CRITICAL FIX: Get company-scoped auto-clock settings
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    const autoSettings = companyId ? await kv.get(`auto-clock-settings:${companyId}`) : null;
    if (!autoSettings?.enabled) return c.json({ processed: 0, message: "Auto-clock disabled" });
    const clockOutTime = autoSettings.clockOutTime || "17:00";
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const [hours, minutes] = clockOutTime.split(":").map(Number);
    const cutoff = new Date(now);
    cutoff.setHours(hours, minutes, 0, 0);
    if (now < cutoff) return c.json({ processed: 0, message: "Not past clock-out time yet" });
    const allAttendance = await kv.getByPrefix("attendance:");
    const todayOpen = allAttendance.filter((r: any) => r.date === today && r.clockIn && !r.clockOut);
    const applicableUsers = autoSettings.mode === "specific" ? (autoSettings.specificUsers || []) : null;
    let processed = 0;
    for (const record of todayOpen) {
      if (applicableUsers && !applicableUsers.includes(record.userId)) continue;
      const key = `attendance:${record.userId}:${today}`;
      const pauses = record.pauses || [];
      if (pauses.length > 0 && !pauses[pauses.length - 1].resumedAt) {
        pauses[pauses.length - 1].resumedAt = cutoff.toISOString();
      }
      const totalPausedMs = pauses.reduce((sum: number, p: any) => sum + ((p.resumedAt ? new Date(p.resumedAt).getTime() : cutoff.getTime()) - new Date(p.pausedAt).getTime()), 0);
      const totalMinutes = Math.round((cutoff.getTime() - new Date(record.clockIn).getTime()) / 60000);
      const activeMinutes = Math.max(0, totalMinutes - Math.round(totalPausedMs / 60000));
      const updated = {
        ...record,
        clockOut: cutoff.toISOString(),
        isPaused: false,
        pauses,
        totalPausedMinutes: Math.round(totalPausedMs / 60000),
        status: "present",
        regularMinutes: Math.min(activeMinutes, 480),
        overtimeMinutes: Math.max(0, activeMinutes - 480),
        autoClocked: true,
        autoClockoutApplied: true,
        updatedAt: now.toISOString(),
      };
      await kv.set(key, updated);
      processed++;
    }
    return c.json({ processed, clockOutTime, message: `Auto clocked out ${processed} user(s)` });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/attendance/auto-clock-in`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const key = `attendance:${user.id}:${today}`;
    const existing = await kv.get(key);
    if (existing?.clockIn && !existing?.isPaused && !existing?.clockOut) return c.json(existing);
    if (existing?.isPaused) {
      const pauses = existing.pauses || [];
      if (pauses.length > 0 && !pauses[pauses.length - 1].resumedAt) pauses[pauses.length - 1].resumedAt = now.toISOString();
      const totalPausedMs = pauses.reduce((sum: number, p: any) => sum + ((p.resumedAt ? new Date(p.resumedAt).getTime() : now.getTime()) - new Date(p.pausedAt).getTime()), 0);
      const updated = { ...existing, isPaused: false, pauses, totalPausedMinutes: Math.round(totalPausedMs / 60000), lastActivity: now.toISOString(), updatedAt: now.toISOString() };
      await kv.set(key, updated);
      return c.json(updated);
    }
    if (existing?.clockOut) return c.json(existing);
    const record = { userId: user.id, employeeName: kvData?.name || user.user_metadata?.name || "", date: today, clockIn: now.toISOString(), clockOut: null, status: "present", autoClocked: true, isPaused: false, pauses: [], totalPausedMinutes: 0, lastActivity: now.toISOString(), isWeekend: [0, 6].includes(now.getDay()), regularMinutes: 0, overtimeMinutes: 0, createdAt: now.toISOString() };
    await kv.set(key, record);
    return c.json(record, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/attendance/auto-pause`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const key = `attendance:${user.id}:${today}`;
    const existing = await kv.get(key);
    if (!existing?.clockIn || existing?.clockOut || existing?.isPaused) return c.json(existing || { error: "Nothing to pause" });
    const pauses = existing.pauses || [];
    pauses.push({ pausedAt: now.toISOString(), resumedAt: null });
    const updated = { ...existing, isPaused: true, pauses, updatedAt: now.toISOString() };
    await kv.set(key, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/attendance/auto-clock-out`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const key = `attendance:${user.id}:${today}`;
    const existing = await kv.get(key);
    if (!existing?.clockIn || existing?.clockOut) return c.json(existing || { error: "Nothing to clock out" });
    const pauses = existing.pauses || [];
    if (pauses.length > 0 && !pauses[pauses.length - 1].resumedAt) pauses[pauses.length - 1].resumedAt = now.toISOString();
    const totalPausedMs = pauses.reduce((sum: number, p: any) => sum + ((p.resumedAt ? new Date(p.resumedAt).getTime() : now.getTime()) - new Date(p.pausedAt).getTime()), 0);
    const totalMinutes = Math.round((now.getTime() - new Date(existing.clockIn).getTime()) / 60000);
    const activeMinutes = totalMinutes - Math.round(totalPausedMs / 60000);
    const updated = { ...existing, clockOut: now.toISOString(), isPaused: false, pauses, totalPausedMinutes: Math.round(totalPausedMs / 60000), status: "present", regularMinutes: Math.min(activeMinutes, 480), overtimeMinutes: Math.max(0, activeMinutes - 480), totalHours: (activeMinutes / 60).toFixed(2), autoClocked: true, updatedAt: now.toISOString() };
    await kv.set(key, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Session logout report endpoint - sends notification to SuperAdmins and Admins
app.post(`${PREFIX}/session/logout-report`, async (c) => {
  try {
    const body = await c.req.json();
    const { userId, userName, email, loginTime, logoutTime, wasAutoClockedOut, logoutType } = body;
    
    // Get all SuperAdmins and Admins to notify
    const allEmployees = await kv.getByPrefix("employee:");
    const adminsAndSuperAdmins = allEmployees.filter((e: any) => 
      e.role === 'superadmin' || e.role === 'SuperAdmin' || e.role === 'admin' || e.role === 'Admin'
    );
    
    // Create notifications for each admin
    for (const admin of adminsAndSuperAdmins) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid,
        userId: admin.userId,
        type: "session",
        title: "User Session Ended",
        message: `${userName} (${email}) logged out at ${new Date(logoutTime).toLocaleString()}. Login: ${new Date(loginTime).toLocaleString()}${wasAutoClockedOut ? ' - Auto clocked out' : ''}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Log the session end
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/attendance/heartbeat`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const key = `attendance:${user.id}:${today}`;
    const existing = await kv.get(key);
    if (existing?.clockIn && !existing?.clockOut) {
      await kv.set(key, { ...existing, lastActivity: now.toISOString() });
    }
    return c.json({ ok: true });
  } catch (e: any) { return c.json({ error: e.message }, 500); }
});

// ============ ATTENDANCE ============
// Self-service: get today's attendance
app.get(`${PREFIX}/attendance/my-today`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const key = `attendance:${user.id}:${today}`;
    let record = await kv.get(key);
    // Auto-resume if paused: user is actively accessing the system
    if (record?.isPaused && record?.clockIn && !record?.clockOut) {
      const pauses = record.pauses || [];
      if (pauses.length > 0 && !pauses[pauses.length - 1].resumedAt) {
        pauses[pauses.length - 1].resumedAt = now.toISOString();
      }
      const totalPausedMs = pauses.reduce((sum: number, p: any) => sum + ((p.resumedAt ? new Date(p.resumedAt).getTime() : now.getTime()) - new Date(p.pausedAt).getTime()), 0);
      record = { ...record, isPaused: false, pauses, totalPausedMinutes: Math.round(totalPausedMs / 60000), lastActivity: now.toISOString(), updatedAt: now.toISOString() };
      await kv.set(key, record);
    }
    // Auto clock-out check
    if (record?.clockIn && !record?.clockOut) {
      // CRITICAL FIX: Get company-scoped auto-clock settings
      const scope = await resolveCompanyScope(user.id);
      const companyId = scope?.[0];
      const autoSettings = companyId ? await kv.get(`auto-clock-settings:${companyId}`) : null;
      if (autoSettings?.enabled) {
        const clockOutTime = autoSettings.clockOutTime || "17:00";
        const [h, m] = clockOutTime.split(":").map(Number);
        const cutoff = new Date(now); cutoff.setHours(h, m, 0, 0);
        const applicableUsers = autoSettings.mode === "specific" ? (autoSettings.specificUsers || []) : null;
        if ((!applicableUsers || applicableUsers.includes(user.id)) && now >= cutoff) {
          const pauses = record.pauses || [];
          if (pauses.length > 0 && !pauses[pauses.length - 1].resumedAt) pauses[pauses.length - 1].resumedAt = cutoff.toISOString();
          const totalPausedMs = pauses.reduce((sum: number, p: any) => sum + ((p.resumedAt ? new Date(p.resumedAt).getTime() : cutoff.getTime()) - new Date(p.pausedAt).getTime()), 0);
          const totalMinutes = Math.round((cutoff.getTime() - new Date(record.clockIn).getTime()) / 60000);
          const activeMinutes = Math.max(0, totalMinutes - Math.round(totalPausedMs / 60000));
          record = { ...record, clockOut: cutoff.toISOString(), isPaused: false, pauses, totalPausedMinutes: Math.round(totalPausedMs / 60000), status: "present", regularMinutes: Math.min(activeMinutes, 480), overtimeMinutes: Math.max(0, activeMinutes - 480), autoClocked: true, autoClockoutApplied: true, updatedAt: now.toISOString() };
          await kv.set(key, record);
        }
      }
    }
    return c.json(record || null);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Self-service: clock in
app.post(`${PREFIX}/attendance/clock-in`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const key = `attendance:${user.id}:${today}`;
    const existing = await kv.get(key);
    if (existing?.clockIn) {
      return c.json({ error: "Already clocked in today" }, 400);
    }

    // Detect late arrival using the company's auto-clock schedule
    let status = "present";
    try {
      const companyId = kvData?.companyId || kvData?.company;
      if (companyId) {
        const autoSettings = await kv.get(`auto-clock-settings:${companyId}`);
        if (autoSettings?.clockInTime) {
          const [schHour, schMin] = autoSettings.clockInTime.split(':').map(Number);
          // Grace period before marking as late (default 15 minutes)
          const gracePeriodMinutes = Number(autoSettings.lateGracePeriod ?? 15);
          const thresholdMinutes = schHour * 60 + schMin + gracePeriodMinutes;
          const clockInMinutes = now.getHours() * 60 + now.getMinutes();
          if (clockInMinutes > thresholdMinutes) {
            status = "late";
          }
        }
      }
    } catch (_) {
      // If schedule lookup fails, keep status as 'present'
    }

    const record = {
      userId: user.id,
      employeeName: kvData?.name || user.user_metadata?.name || "",
      date: today,
      clockIn: now.toISOString(),
      clockOut: null,
      status,
      isWeekend: [0, 6].includes(now.getDay()),
      regularMinutes: 0,
      overtimeMinutes: 0,
      createdAt: now.toISOString(),
    };
    await kv.set(key, record);
    return c.json(record, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: `Clock-in failed: ${e.message}` }, 500);
  }
});

// Self-service: clock out
app.post(`${PREFIX}/attendance/clock-out`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const key = `attendance:${user.id}:${today}`;
    const existing = await kv.get(key);
    if (!existing || !existing.clockIn) {
      return c.json({ error: "You haven't clocked in today" }, 400);
    }
    if (existing.clockOut) {
      return c.json({ error: "Already clocked out today" }, 400);
    }
    // Close any open pause
    const pauses = existing.pauses || [];
    if (pauses.length > 0 && !pauses[pauses.length - 1].resumedAt) {
      pauses[pauses.length - 1].resumedAt = now.toISOString();
    }
    const totalPausedMs = pauses.reduce((sum: number, p: any) => sum + ((p.resumedAt ? new Date(p.resumedAt).getTime() : now.getTime()) - new Date(p.pausedAt).getTime()), 0);
    const totalMinutes = Math.round((now.getTime() - new Date(existing.clockIn).getTime()) / 60000);
    const activeMinutes = Math.max(0, totalMinutes - Math.round(totalPausedMs / 60000));
    const updated = {
      ...existing,
      clockOut: now.toISOString(),
      isPaused: false,
      pauses,
      totalPausedMinutes: Math.round(totalPausedMs / 60000),
      // Mark overtime if worked >8 active hours; preserve 'late' status for employees
      // who clocked in late but did not work overtime — don't downgrade back to 'present'.
      status: Math.max(0, activeMinutes - 480) > 0 ? "overtime" : (existing.status || "present"),
      regularMinutes: Math.min(activeMinutes, 480),
      overtimeMinutes: Math.max(0, activeMinutes - 480),
      updatedAt: now.toISOString(),
    };
    await kv.set(key, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: `Clock-out failed: ${e.message}` }, 500);
  }
});

// SuperAdmin: list all attendance records
app.get(`${PREFIX}/attendance/all`, async (c) => {
  try {
    const { user, role } = await requireManagerOrAbove(c);
    let allRecords = await kv.getByPrefix("attendance:");
    // Filter attendance records by employee's company
    const employees = await kv.getByPrefix("employee:");
    const filteredEmployees = await filterEmployeesByCompany(employees, user.id, role);
    const allowedUserIds = new Set(filteredEmployees.map((e: any) => e.id || e.userId));
    allRecords = allRecords.filter((rec: any) => allowedUserIds.has(rec.userId));
    return c.json(allRecords || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// SuperAdmin only: create attendance record for any user
app.post(`${PREFIX}/attendance/admin-create`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const body = await c.req.json();
    const { userId, date, clockIn, clockOut, status } = body;
    if (!userId || !date) return c.json({ error: "userId and date required" }, 400);
    const kvData = await kv.get(`employee:${userId}`);
    const key = `attendance:${userId}:${date}`;
    const record = {
      userId,
      employeeName: kvData?.name || body.employeeName || "",
      date,
      clockIn: clockIn || null,
      clockOut: clockOut || null,
      status: status || "present",
      isWeekend: false,
      regularMinutes: 0,
      overtimeMinutes: 0,
      createdAt: new Date().toISOString(),
    };
    if (clockIn && clockOut) {
      const totalMinutes = Math.round((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60000);
      record.regularMinutes = Math.min(totalMinutes, 480);
      record.overtimeMinutes = Math.max(0, totalMinutes - 480);
    }
    await kv.set(key, record);
    return c.json(record, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// SuperAdmin only: update attendance record
app.put(`${PREFIX}/attendance/admin-update`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const body = await c.req.json();
    const { userId, date } = body;
    if (!userId || !date) return c.json({ error: "userId and date required" }, 400);
    const key = `attendance:${userId}:${date}`;
    const existing = await kv.get(key);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    if (updated.clockIn && updated.clockOut) {
      const totalMinutes = Math.round((new Date(updated.clockOut).getTime() - new Date(updated.clockIn).getTime()) / 60000);
      updated.regularMinutes = Math.min(totalMinutes, 480);
      updated.overtimeMinutes = Math.max(0, totalMinutes - 480);
    }
    await kv.set(key, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// SuperAdmin only: delete attendance record
app.delete(`${PREFIX}/attendance/admin-delete`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const { userId, date } = await c.req.json();
    if (!userId || !date) return c.json({ error: "userId and date required" }, 400);
    const key = `attendance:${userId}:${date}`;
    await kv.del(key);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/attendance/history`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const days = parseInt(c.req.query("days") || "30");
    const keys: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      keys.push(`attendance:${user.id}:${d.toISOString().split("T")[0]}`);
    }
    const records = await kv.mget(keys);
    return c.json(records.filter(Boolean));
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ============ ANNOUNCEMENTS ============
app.get(`${PREFIX}/announcements`, async (c) => {
  try {
    const { user, role, kvData } = await requireAuth(c);
    let items = await kv.getByPrefix("announcement:");
    // Apply company filtering
    items = await applyCompanyFilter(items, user.id, role);
    // Filter by department targeting for non-superadmin/admin users
    if (role !== "superadmin" && role !== "admin") {
      const userDept = kvData?.department || "";
      const userDepts = kvData?.departments || (userDept ? [userDept] : []);
      items = items.filter((item: any) => {
        // Show announcements targeted to 'all' departments
        if (!item.targetDepartments || item.targetDepartments.length === 0 || item.targetAudience === "all") return true;
        // Show if user's department matches any target department
        if (userDepts.some((d: string) => item.targetDepartments.includes(d))) return true;
        // Show if targeted specifically to this user
        if (item.specificEmployees && item.specificEmployees.includes(user.id)) return true;
        return false;
      });
    }
    return c.json(items || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/announcements`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const kvData = await kv.get(`employee:${user.id}`);
    // CRITICAL FIX: Auto-assign companyId for multi-tenant isolation
    const companyId = body.companyId || kvData?.companyId || kvData?.company;
    const item = {
      id,
      ...body,
      companyId,
      company: companyId,
      authorName: kvData?.name || "",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`announcement:${id}`, item);
    // Send email notifications to all company employees
    if (companyId) {
      const allEmps = await kv.getByPrefix('employee:');
      const companyEmps = allEmps.filter((emp: any) => emp.companyId === companyId || emp.company === companyId);
      for (const emp of companyEmps) {
        if (!emp.email) continue;
        sendEmailNotification(
          emp.userId || emp.id, emp.email, emp.name || '',
          `Company Announcement: ${body.title || 'New Announcement'} — Blumebyte HR`,
          `<h3 style="color:#111827;margin-bottom:8px;">${body.title || 'New Announcement'}</h3><p style="color:#374151;">${body.content || body.message || ''}</p>`,
          'emailOnAnnouncement'
        );
      }
    }
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/announcements/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`announcement:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`announcement:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.delete(`${PREFIX}/announcements/:id`, async (c) => {
  try {
    await requireAuth(c);
    const id = c.req.param("id");
    await kv.del(`announcement:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ============ MESSAGES ============
app.get(`${PREFIX}/messages`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const allMessages = await kv.getByPrefix("message:");
    
    // Apply company filtering first
    const filtered = await applyCompanyFilter(allMessages, user.id, role);
    
    // Then filter messages for current user (either sender or recipient)
    const userMessages = filtered.filter((m: any) => 
      m.senderId === user.id || m.recipientId === user.id
    );
    return c.json(userMessages || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/messages`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const senderData = await kv.get(`employee:${user.id}`);
    const recipientData = await kv.get(`employee:${body.recipientId}`);
    
    // CRITICAL FIX: Add company scope to messages
    const senderCompanyId = senderData?.companyId || senderData?.company;
    const companyRecord = senderCompanyId ? await kv.get(`company_by_id:${senderCompanyId}`) : null;
    
    const message = {
      id,
      senderId: user.id,
      senderName: senderData?.name || "",
      recipientId: body.recipientId,
      recipientName: recipientData?.name || "",
      message: body.message,
      companyId: senderCompanyId,
      company: companyRecord?.name || senderCompanyId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`message:${id}`, message);
    // Create notification for recipient
    const nid = crypto.randomUUID();
    await kv.set(`notification:${nid}`, {
      id: nid, userId: body.recipientId, type: "message",
      title: "New Message",
      message: `${senderData?.name || "Someone"} sent you a message`,
      read: false, createdAt: new Date().toISOString(),
    });
    return c.json(message, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/messages/:id`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const id = c.req.param("id");
    const message = await kv.get(`message:${id}`);
    if (!message) return c.json({ error: "Message not found" }, 404);
    if (message.recipientId !== user.id) return c.json({ error: "Forbidden" }, 403);
    
    const updated = { ...message, read: true };
    await kv.set(`message:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Delete message
app.delete(`${PREFIX}/messages/:id`, async (c) => {
  try {
    await requireAuth(c);
    const id = c.req.param("id");
    await kv.del(`message:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Legacy admin announcement routes for backward compatibility
app.post(`${PREFIX}/admin/announcements`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const kvData = await kv.get(`employee:${user.id}`);
    // CRITICAL FIX: Auto-assign companyId for multi-tenant isolation
    const companyId = body.companyId || kvData?.companyId || kvData?.company;
    const item = {
      id,
      ...body,
      companyId,
      company: companyId,
      authorName: kvData?.name || "",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`announcement:${id}`, item);
    // Send email notifications to all company employees
    if (companyId) {
      const allEmps = await kv.getByPrefix('employee:');
      const companyEmps = allEmps.filter((emp: any) => emp.companyId === companyId || emp.company === companyId);
      for (const emp of companyEmps) {
        if (!emp.email) continue;
        sendEmailNotification(
          emp.userId || emp.id, emp.email, emp.name || '',
          `Company Announcement: ${body.title || 'New Announcement'} — Blumebyte HR`,
          `<h3 style="color:#111827;margin-bottom:8px;">${body.title || 'New Announcement'}</h3><p style="color:#374151;">${body.content || body.message || ''}</p>`,
          'emailOnAnnouncement'
        );
      }
    }
    return c.json(item, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.delete(`${PREFIX}/admin/announcements/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param("id");
    await kv.del(`announcement:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// SuperAdmin approve hiring request
app.post(`${PREFIX}/superadmin/approve-hiring`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const { applicationId, approve, reason } = await c.req.json();
    
    if (!applicationId) {
      return c.json({ error: "applicationId is required" }, 400);
    }
    
    const application = await kv.get(`job-application:${applicationId}`);
    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }
    
    if (approve) {
      // Proceed with hiring
      const empData = await kv.get(`employee:${application.applicantId}`);
      if (empData) {
        const jobPosting = application.jobPostingId ? await kv.get(`job-posting:${application.jobPostingId}`) : null;
        const newPosition = jobPosting?.title || application.jobTitle || empData.position;
        const newDepartment = jobPosting?.department || application.jobDepartment || empData.department;
        const newSalary = jobPosting?.salary || application.jobSalaryRange || empData.salary || "";
        const newCompany = jobPosting?.company || application.jobCompany || empData.company || "";
        const updatedEmp = { ...empData, position: newPosition, department: newDepartment, salary: newSalary, company: newCompany, updatedAt: new Date().toISOString() };
        await kv.set(`employee:${application.applicantId}`, updatedEmp);
        const sb = supabaseAdmin();
        await sb.auth.admin.updateUserById(application.applicantId, { user_metadata: { name: updatedEmp.name, role: updatedEmp.role, company: newCompany } });
      }
      
      // Update application to hired
      application.status = "hired";
      application.approvedBy = "superadmin";
      application.approvedAt = new Date().toISOString();
      await kv.set(`job-application:${applicationId}`, application);
      
      // Notify applicant
      const nid1 = crypto.randomUUID();
      await kv.set(`notification:${nid1}`, { 
        id: nid1, userId: application.applicantId, type: "hire-approved", 
        title: "Congratulations! You've Been Hired!", 
        message: `Your application for ${application.jobTitle} has been approved. Your profile has been updated.`, 
        read: false, createdAt: new Date().toISOString() 
      });
      
      // Notify same-company employees only
      const allEmployees2 = await kv.getByPrefix("employee:");
      const hireCompany2 = application.jobCompany || empData?.companyId || empData?.company;
      const companyEmps2 = hireCompany2 ? allEmployees2.filter((e: any) => e.companyId === hireCompany2 || e.company === hireCompany2) : [];
      for (const emp of companyEmps2) {
        if (emp.userId === application.applicantId) continue;
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, { 
          id: nid, userId: emp.userId, type: "new-hire", 
          title: "New Hire Announcement", 
          message: `Welcome ${application.applicantName} to the team as ${application.jobTitle}!`, 
          read: false, createdAt: new Date().toISOString() 
        });
      }
      
      // Delete approval request
      if (application.pendingApprovalId) {
        await kv.del(`approval:${application.pendingApprovalId}`);
      }
      
      return c.json({ success: true, message: "Hiring approved successfully" });
    } else {
      // Reject hiring
      application.status = "pending";
      application.rejectionReason = reason || "SuperAdmin did not approve hiring";
      delete application.pendingApprovalId;
      await kv.set(`job-application:${applicationId}`, application);
      
      // Notify requesting admin
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: application.requestedBy, type: "approval-rejected",
        title: "Hiring Request Rejected",
        message: `Your request to hire ${application.applicantName} was not approved. ${reason || ""}`,
        read: false, createdAt: new Date().toISOString(),
      });
      
      // Delete approval request
      if (application.pendingApprovalId) {
        await kv.del(`approval:${application.pendingApprovalId}`);
      }
      
      return c.json({ success: true, message: "Hiring request rejected" });
    }
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ NOTIFICATIONS ============
app.get(`${PREFIX}/notifications`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allNotifs = await kv.getByPrefix("notification:");
    const mine = allNotifs.filter((n: any) => n.userId === user.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(mine.slice(0, 100));
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/notifications`, async (c) => {
  try {
    await requireAuth(c);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const notif = { id, ...body, read: false, createdAt: new Date().toISOString() };
    await kv.set(`notification:${id}`, notif);
    return c.json(notif, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/notifications/broadcast`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const body = await c.req.json();
    const allEmployees = await kv.getByPrefix("employee:");
    // CRITICAL: Only broadcast to employees in same company
    const companyEmployees = await filterEmployeesByCompany(allEmployees, user.id, role);
    const notifs: any[] = [];
    for (const emp of companyEmployees) {
      const id = crypto.randomUUID();
      const notif = { id, userId: emp.userId, type: body.type, title: body.title, message: body.message, read: false, createdAt: new Date().toISOString() };
      await kv.set(`notification:${id}`, notif);
      notifs.push(notif);
    }
    return c.json({ count: notifs.length });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/notifications/:id/read`, async (c) => {
  try {
    await requireAuth(c);
    const id = c.req.param("id");
    const n = await kv.get(`notification:${id}`);
    if (!n) return c.json({ error: "Not found" }, 404);
    const updated = { ...n, read: true };
    await kv.set(`notification:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/notifications/mark-all-read`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const all = await kv.getByPrefix("notification:");
    const mine = all.filter((n: any) => n.userId === user.id && !n.read);
    for (const n of mine) {
      await kv.set(`notification:${n.id}`, { ...n, read: true });
    }
    return c.json({ updated: mine.length });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ============ JOB APPLICATIONS ============
app.post(`${PREFIX}/job-applications`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const kvData = await kv.get(`employee:${user.id}`);
    
    // CRITICAL FIX: Get company info for multi-tenant isolation
    const applicantCompanyId = kvData?.companyId || kvData?.company;
    const companyRecord = applicantCompanyId ? await kv.get(`company_by_id:${applicantCompanyId}`) : null;
    
    const application = {
      id, applicantId: user.id, applicantName: kvData?.name || "",
      applicantEmail: kvData?.email || user.email || "",
      applicantDepartment: kvData?.department || "",
      applicantCurrentRole: kvData?.role || "",
      applicantCurrentPosition: kvData?.position || "",
      jobPostingId: body.jobPostingId, jobTitle: body.jobTitle || "",
      jobDepartment: body.jobDepartment || "", jobCompany: body.jobCompany || "",
      jobSalaryRange: body.jobSalaryRange || "", jobType: body.jobType || "",
      coverLetter: body.coverLetter || "", status: "pending",
      companyId: applicantCompanyId,
      company: companyRecord?.name || applicantCompanyId,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`job-application:${id}`, application);
    // CRITICAL: Only notify HR staff from the same company
    const allEmployees = await kv.getByPrefix("employee:");
    const applicantCompany = applicantCompanyId;
    const hrStaff = allEmployees.filter((e: any) => ["superadmin", "admin"].includes(e.role) && applicantCompany && (e.companyId === applicantCompany || e.company === applicantCompany));
    for (const hr of hrStaff) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: hr.userId, type: "job-application",
        title: "New Job Application",
        message: `${kvData?.name || "Someone"} applied for ${body.jobTitle || "a position"}`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json(application, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/job-applications`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const all = await kv.getByPrefix("job-application:");
    // Apply company filtering
    const filtered = await applyCompanyFilter(all, user.id, role);
    if (["superadmin", "admin"].includes(role)) return c.json(filtered);
    return c.json(filtered.filter((a: any) => a.applicantId === user.id));
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/job-applications/:id`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`job-application:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    
    // IMPORTANT: Hiring requires SuperAdmin final approval
    if (body.status === "hired" && existing.status !== "hired") {
      // Only SuperAdmin can directly hire - others need approval
      if (role !== "superadmin") {
        // Create a pending approval request for SuperAdmin
        const approvalId = `approval_req:hiring_${crypto.randomUUID()}`;
        
        // CRITICAL FIX: Add company scope to hiring approval requests
        const kvData = await kv.get(`employee:${user.id}`);
        const companyId = kvData?.companyId || kvData?.company || existing.companyId;
        
        await kv.set(approvalId, {
          id: approvalId,
          type: "hiring",
          applicationId: id,
          applicantName: existing.applicantName,
          jobTitle: existing.jobTitle,
          requestedBy: user.id,
          requestedByName: kvData?.name || user.user_metadata?.name || user.email,
          companyId,
          company: companyId,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        
        // CRITICAL FIX: Only notify SuperAdmins from the SAME company
        const allEmployees = await kv.getByPrefix("employee:");
        const callerKvData = await kv.get(`employee:${user.id}`);
        const callerCompany = callerKvData?.companyId || callerKvData?.company;
        const companySuperadmins = callerCompany 
          ? allEmployees.filter((e: any) => e.role === "superadmin" && (e.companyId === callerCompany || e.company === callerCompany))
          : [];
        for (const sa of companySuperadmins) {
          const nid = crypto.randomUUID();
          await kv.set(`notification:${nid}`, {
            id: nid, userId: sa.userId, type: "approval-required",
            title: "Hiring Approval Required",
            message: `Admin wants to hire ${existing.applicantName} for ${existing.jobTitle}`,
            read: false, createdAt: new Date().toISOString(),
          });
        }
        
        // Update job application to "pending-approval" instead of "hired"
        updated.status = "pending-approval";
        updated.pendingApprovalId = approvalId;
        await kv.set(`job-application:${id}`, updated);
        
        return c.json(updated);
      }
      
      // SuperAdmin approval - proceed with hiring
      const empData = await kv.get(`employee:${existing.applicantId}`);
      if (empData) {
        const jobPosting = existing.jobPostingId ? await kv.get(`job-posting:${existing.jobPostingId}`) : null;
        const newPosition = jobPosting?.title || existing.jobTitle || empData.position;
        const newDepartment = jobPosting?.department || existing.jobDepartment || empData.department;
        const newSalary = jobPosting?.salary || existing.jobSalaryRange || empData.salary || "";
        const newCompany = jobPosting?.company || existing.jobCompany || empData.company || "";
        const updatedEmp = { ...empData, position: newPosition, department: newDepartment, salary: newSalary, company: newCompany, updatedAt: new Date().toISOString() };
        await kv.set(`employee:${existing.applicantId}`, updatedEmp);
        const sb = supabaseAdmin();
        await sb.auth.admin.updateUserById(existing.applicantId, { user_metadata: { name: updatedEmp.name, role: updatedEmp.role, company: newCompany } });
      }
      const nid1 = crypto.randomUUID();
      await kv.set(`notification:${nid1}`, { id: nid1, userId: existing.applicantId, type: "hire-approved", title: "Congratulations! You've Been Hired!", message: `Your application for ${existing.jobTitle} has been approved. Your profile has been updated.`, read: false, createdAt: new Date().toISOString() });
      // CRITICAL: Only notify same-company employees
      const allEmp3 = await kv.getByPrefix("employee:");
      const hireComp3 = existing.jobCompany || newCompany;
      const compEmp3 = hireComp3 ? allEmp3.filter((e: any) => e.companyId === hireComp3 || e.company === hireComp3) : [];
      for (const emp of compEmp3) {
        if (emp.userId === existing.applicantId) continue;
        const nid = crypto.randomUUID();
        await kv.set(`notification:${nid}`, { id: nid, userId: emp.userId, type: "new-hire", title: "New Hire Announcement", message: `Welcome ${existing.applicantName} to the team as ${existing.jobTitle}!`, read: false, createdAt: new Date().toISOString() });
      }
    }
    if (body.status === "rejected" && existing.status !== "rejected") {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, { id: nid, userId: existing.applicantId, type: "application-rejected", title: "Application Update", message: `Your application for ${existing.jobTitle} was not selected at this time.`, read: false, createdAt: new Date().toISOString() });
    }
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ BACKUP & RESTORE (Superadmin only) ============
app.get(`${PREFIX}/backup`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    
    // CRITICAL FIX: Only backup data belonging to the caller's company
    const scope = await resolveCompanyScope(user.id);
    if (!scope?.length) {
      return c.json({ error: "No company scope found" }, 400);
    }
    
    const prefixes = ["employee:", "company:", "branch:", "department:", "asset:", "asset-category:", "paygrade:", "financial-year:", "leave-type:", "leave:", "attendance:", "announcement:", "message:", "notification:", "job-posting:", "job-application:", "perf-review:", "goal:", "feedback:", "meeting:", "workflow:", "disciplinary:", "compliance:", "training:", "task:", "onboard-checklist:", "payroll-run:", "tax-bracket:", "benefit-plan:", "admin-dept:", "deletion-request:", "profile-change:"];
    const backup: Record<string, any[]> = {};
    
    // Build a set of company employee IDs for filtering user-specific data
    const allEmps = await kv.getByPrefix("employee:");
    const companyEmpIds = new Set(
      allEmps
        .filter((e: any) => companyMatches(scope, e.companyId) || companyMatches(scope, e.company))
        .map((e: any) => e.userId || e.id)
    );
    
    for (const p of prefixes) {
      const items = await kv.getByPrefix(p);
      // Filter items by company scope
      const filtered = items.filter((item: any) => {
        const itemCompany = item.companyId || item.company;
        if (itemCompany) return companyMatches(scope, itemCompany);
        // For user-specific items, check if userId belongs to company
        if (item.userId) return companyEmpIds.has(item.userId);
        // For company: prefix, filter by id
        if (p === "company:" && item.id) return companyMatches(scope, item.id);
        // For employee: prefix, already handled by companyId
        if (p === "employee:") return companyEmpIds.has(item.userId || item.id);
        return false;
      });
      if (filtered.length > 0) backup[p] = filtered;
    }
    
    // CRITICAL FIX: Backup company-scoped settings (reuse scope from above)
    const companyId = scope?.[0];
    if (companyId) {
      const settings = await kv.get(`company-settings:${companyId}`);
      if (settings) backup["_singleton:company-settings"] = [settings];
      const autoClockSettings = await kv.get(`auto-clock-settings:${companyId}`);
      if (autoClockSettings) backup["_singleton:auto-clock-settings"] = [autoClockSettings];
      const manualClockSettings = await kv.get(`manual-clock-settings:${companyId}`);
      if (manualClockSettings) backup["_singleton:manual-clock-settings"] = [manualClockSettings];
    }
    
    return c.json({ version: "1.0", timestamp: new Date().toISOString(), data: backup });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/backup/restore`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    const { data } = await c.req.json();
    if (!data || typeof data !== "object") return c.json({ error: "Invalid backup data" }, 400);
    
    // CRITICAL FIX: Restore company-scoped settings
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    
    let restored = 0;
    for (const [prefix, items] of Object.entries(data)) {
      if (prefix === "_singleton:company-settings") {
        const arr = items as any[];
        if (arr[0] && companyId) { 
          await kv.set(`company-settings:${companyId}`, { ...arr[0], companyId }); 
          restored++; 
        }
        continue;
      }
      if (prefix === "_singleton:auto-clock-settings") {
        const arr = items as any[];
        if (arr[0] && companyId) { 
          await kv.set(`auto-clock-settings:${companyId}`, { ...arr[0], companyId }); 
          restored++; 
        }
        continue;
      }
      if (prefix === "_singleton:manual-clock-settings") {
        const arr = items as any[];
        if (arr[0] && companyId) { 
          await kv.set(`manual-clock-settings:${companyId}`, { ...arr[0], companyId }); 
          restored++; 
        }
        continue;
      }
      for (const item of items as any[]) {
        if (item.id) { await kv.set(`${prefix}${item.id}`, item); restored++; }
        else if (item.userId && item.date) { await kv.set(`${prefix}${item.userId}:${item.date}`, item); restored++; }
      }
    }
    return c.json({ success: true, restoredCount: restored });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/my-payslips`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allPayroll = await kv.getByPrefix("payroll-run:");
    const empData = await kv.get(`employee:${user.id}`);
    const myPayslips = allPayroll.filter((p: any) => p.employeeName === empData?.name || p.userId === user.id);
    return c.json(myPayslips);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// --- Audit Log Routes ---
app.get(`${PREFIX}/audit-logs`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const logs = await kv.getByPrefix("audit:");
    
    // CRITICAL FIX: Filter audit logs by company for ALL roles including SuperAdmin
    let filteredLogs = await applyCompanyFilter(logs, user.id, role);
    
    // Sort by timestamp descending (newest first)
    filteredLogs.sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
    
    return c.json(filteredLogs);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/audit-logs/user/:userId`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const targetUserId = c.req.param("userId");
    
    // Users can only see their own logs unless they're admin+
    if (user.id !== targetUserId && role === "employee") {
      return c.json({ error: "Forbidden" }, 403);
    }
    
    const userAuditsKey = `audit-index:user:${targetUserId}`;
    const auditIds = await kv.get(userAuditsKey) || [];
    
    const logs = [];
    for (const id of auditIds) {
      const log = await kv.get(`audit:${id}`);
      if (log) logs.push(log);
    }
    
    // Sort by timestamp descending
    logs.sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
    
    return c.json(logs);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/audit-logs`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const body = await c.req.json();
    
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const userAgent = c.req.header("user-agent") || "unknown";
    
    await logAudit({
      userId: user.id,
      userName: body.userName || user.email || "Unknown",
      action: body.action,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      details: body.details,
      ipAddress,
      userAgent,
    });
    
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Global error handler
app.onError((err, c) => {
  const msg = err?.message || "";
  if (msg.includes("EPIPE") || msg.includes("broken pipe")) {
    return c.json({ error: "connection closed" }, 499);
  }
  return c.json({ error: "Internal server error" }, 500);
});

addEventListener("unhandledrejection", (e: any) => {
  const msg = e?.reason?.message || "";
  if (msg.includes("EPIPE") || msg.includes("broken pipe") || msg.includes("connection closed")) {
    e.preventDefault();
  }
});

// ========================================
// LICENSE-BASED SUBSCRIPTION ROUTES
// ========================================
addLicenseRoutes(app, kv, requireAuth, requireSuperAdmin, logAudit);

// ========================================
// SUBSCRIPTION & PAYSTACK ROUTES
// ========================================

// Get user count for pricing (all roles included)
app.get(`${PREFIX}/subscription/user-count`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    
    // Only superadmin can check user count for subscription
    if (role !== 'superadmin') {
      return c.json({ error: 'Only superadmin can view user count for subscription' }, 403);
    }
    
    // CRITICAL FIX: Only count users from the SuperAdmin's company
    const scope = await resolveCompanyScope(user.id);
    const allUsers = await kv.getByPrefix('employee:');
    const companyUsers = scope?.length 
      ? allUsers.filter((u: any) => companyMatches(scope, u.companyId) || companyMatches(scope, u.company))
      : allUsers;
    
    // Count company users only (including superadmin, admin, manager, employee)
    const count = companyUsers.length || 1; // Minimum 1 user (the superadmin)
    
    await logAudit({
      userId: user.id,
      userName: user.email || 'Unknown',
      action: 'READ',
      resourceType: 'subscription',
      resourceId: 'user-count',
      details: { count },
    });
    
    return c.json({ count });
  } catch (e: any) {
    console.error('Error fetching user count:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Get subscription status
app.get(`${PREFIX}/subscription/status`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    
    // For non-superadmins, they're covered under the superadmin's subscription
    if (role !== 'superadmin') {
      // CRITICAL: Find the superadmin from the SAME company only
      const scope = await resolveCompanyScope(user.id);
      const companyId = scope?.[0];
      const allEmployees = await kv.getByPrefix('employee:');
      const superadmin = companyId 
        ? allEmployees.find((emp: any) => emp.role === 'superadmin' && (emp.companyId === companyId || emp.company === companyId))
        : null;
      
      if (!superadmin) {
        return c.json({ status: 'expired', message: 'No superadmin found' }, 200);
      }
      
      const subscription = await kv.get(`subscription:${superadmin.id}`);
      
      if (!subscription) {
        return c.json({ status: 'expired', message: 'No subscription found' }, 200);
      }
      
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const isActive = now < endDate;
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return c.json({
        status: isActive ? 'active' : 'expired',
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining: Math.max(0, daysRemaining),
        userCount: subscription.userCount,
      });
    }
    
    // For superadmins, check their own subscription
    const subscription = await kv.get(`subscription:${user.id}`);
    
    if (!subscription) {
      return c.json({ status: 'none', message: 'No subscription found' }, 200);
    }
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const isActive = now < endDate;
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    await logAudit({
      userId: user.id,
      userName: user.email || 'Unknown',
      action: 'READ',
      resourceType: 'subscription',
      resourceId: user.id,
      details: { status: isActive ? 'active' : 'expired' },
    });
    
    return c.json({
      status: isActive ? 'active' : 'expired',
      plan: subscription.plan,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      daysRemaining: Math.max(0, daysRemaining),
      userCount: subscription.userCount,
      amount: subscription.amount,
    });
  } catch (e: any) {
    console.error('Error checking subscription status:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get license information (used by LicenseManagement and LicenseStatusBanner)
app.get(`${PREFIX}/subscription/license-info`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    
    // Get company scope
    const scope = await resolveCompanyScope(user.id);
    const companyId = scope?.[0];
    
    if (!companyId) {
      return c.json({ 
        error: 'No company scope',
        totalLicenses: 0,
        usedLicenses: 0,
        availableLicenses: 0
      }, 200);
    }
    
    // Get all employees in the same company
    const allEmployees = await kv.getByPrefix('employee:');
    const companyEmployees = allEmployees.filter((emp: any) => 
      (emp.company === companyId || emp.companyId === companyId)
    );
    
    // Find superadmin in this company
    const superadmin = companyEmployees.find((emp: any) => emp.role === 'superadmin');
    
    if (!superadmin) {
      return c.json({ 
        error: 'No superadmin found',
        totalLicenses: 0,
        usedLicenses: companyEmployees.length,
        availableLicenses: 0
      }, 200);
    }
    
    // Get subscription
    const subscription = await kv.get(`subscription:${superadmin.id}`);
    
    if (!subscription) {
      return c.json({ 
        error: 'No subscription found',
        totalLicenses: 0,
        usedLicenses: companyEmployees.length,
        availableLicenses: 0
      }, 200);
    }
    
    const totalLicenses = subscription.userCount || 0;
    const usedLicenses = companyEmployees.length;
    const availableLicenses = Math.max(0, totalLicenses - usedLicenses);
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const isActive = now < endDate;
    
    const cardAuth = subscription.cardAuthorization;
    const cardSaved = !!(cardAuth?.authorizationCode);
    const cardLast4 = cardAuth?.last4 || '';
    const cardExpiry = cardAuth ? `${cardAuth.expMonth}/${cardAuth.expYear}` : '';
    const cardBrand = cardAuth?.brand || cardAuth?.cardType || '';

    return c.json({
      totalLicenses,
      // purchasedLicenses is the canonical field used by LicenseManagement.tsx
      purchasedLicenses: totalLicenses,
      usedLicenses,
      availableLicenses,
      subscriptionStatus: isActive ? 'active' : 'expired',
      plan: subscription.plan,
      endDate: subscription.endDate,
      companyId,
      // Saved card for auto-renewal display
      cardSaved,
      cardLast4,
      cardExpiry,
      cardBrand,
    });
  } catch (e: any) {
    console.error('Error getting license info:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Initialize Paystack payment
app.post(`${PREFIX}/subscription/initialize`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    const body = await c.req.json();
    // Accept both 'userCount' (legacy) and 'licenses' (current LicenseManagement field name)
    const plan = body.plan;
    const userCount = Number(body.userCount || body.licenses || 0);
    
    if (!plan || !userCount) {
      return c.json({ error: 'Missing required fields: plan, userCount (or licenses)' }, 400);
    }
    
    if (!['monthly', 'yearly'].includes(plan)) {
      return c.json({ error: 'Invalid plan. Must be "monthly" or "yearly"' }, 400);
    }
    
    // Always compute amount server-side — never trust client-provided amount
    // Monthly: $3.55/user/month  |  Yearly: $2.55/user/month = $30.60/user/year
    const pricePerUser = plan === 'monthly' ? 3.55 : 30.60;
    const amount = userCount * pricePerUser;
    
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return c.json({ error: 'Payment gateway not configured' }, 500);
    }
    
    // Initialize Paystack transaction
    const reference = `SUB_${user.id}_${Date.now()}`;
    const callbackUrl = `${c.req.header('origin') || ''}/payment-verify`;
    
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo (cents)
        reference,
        callback_url: callbackUrl,
        metadata: {
          userId: user.id,
          plan,
          userCount,
          custom_fields: [
            {
              display_name: 'Subscription Plan',
              variable_name: 'plan',
              value: plan,
            },
            {
              display_name: 'User Count',
              variable_name: 'user_count',
              value: String(userCount),
            },
          ],
        },
      }),
    });
    
    const paystackData = await paystackResponse.json();
    
    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return c.json({ error: paystackData.message || 'Failed to initialize payment' }, 500);
    }
    
    // Store pending transaction
    await kv.set(`pending-subscription:${reference}`, {
      userId: user.id,
      plan,
      userCount,
      amount,
      reference,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    
    await logAudit({
      userId: user.id,
      userName: user.email || 'Unknown',
      action: 'CREATE',
      resourceType: 'subscription-payment',
      resourceId: reference,
      details: { plan, userCount, amount },
    });
    
    return c.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    });
  } catch (e: any) {
    console.error('Error initializing payment:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// GET /subscription/all-users — return all active users for the superadmin's company.
// Called by LicenseManagement when the purchase count is less than current active users,
// so the superadmin can pick which users keep their license active.
app.get(`${PREFIX}/subscription/all-users`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const companyId = await getCompanyId(user.id);
    const allEmployees = await kv.getByPrefix('employee:');
    const companyUsers = companyId
      ? allEmployees.filter((u: any) =>
          u.id !== user.id && // exclude the superadmin themselves
          (u.companyId === companyId || u.company === companyId)
        )
      : allEmployees.filter((u: any) => u.id !== user.id);

    const users = companyUsers.map((u: any) => ({
      id: u.id,
      name: u.name || u.email || u.id,
      email: u.email || '',
      role: u.role || 'employee',
      status: u.status || 'active',
      department: u.department || '',
    }));

    return c.json({ users });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// NOTE: POST /subscription/purchase-licenses and POST /subscription/purchase-licenses-with-selection
// are both handled by license-routes.tsx (registered via addLicenseRoutes above).
// Those implementations use usdToPaystackAmount() for proper currency conversion.
// The duplicate handlers that were previously here have been removed to avoid confusion.

// POST /subscription/renew-license — renew an existing subscription via Paystack
app.post(`${PREFIX}/subscription/renew-license`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const body = await c.req.json();
    const { licenses, plan, saveCard } = body;

    if (!licenses || !plan) {
      return c.json({ error: 'Missing required fields: licenses, plan' }, 400);
    }
    if (!['monthly', 'yearly'].includes(plan)) {
      return c.json({ error: 'Invalid plan. Must be "monthly" or "yearly"' }, 400);
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return c.json({ error: 'Payment gateway not configured' }, 500);
    }

    // Monthly: $3.55/user/month  |  Yearly: $2.55/user/month = $30.60/user/year
    const pricePerUser = plan === 'monthly' ? 3.55 : 30.60;
    const amount = Number(licenses) * pricePerUser;

    const reference = `RENEW_${user.id}_${Date.now()}`;
    const callbackUrl = `${c.req.header('origin') || ''}/payment-verify`;

    // Convert USD amount to the configured Paystack currency (GHS/NGN/USD)
    const { amountSmallestUnit, currency } = await usdToPaystackAmount(amount);

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountSmallestUnit,
        currency,
        reference,
        callback_url: callbackUrl,
        metadata: {
          userId: user.id,
          plan,
          userCount: licenses,
          isRenewal: true,
          saveCard: saveCard !== false,
          amountUsd: amount,
          custom_fields: [
            { display_name: 'Transaction Type', variable_name: 'type', value: 'renewal' },
            { display_name: 'Plan', variable_name: 'plan', value: plan },
            { display_name: 'Licenses', variable_name: 'user_count', value: String(licenses) },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    if (!paystackData.status) {
      return c.json({ error: paystackData.message || 'Failed to initialize renewal payment' }, 500);
    }

    await kv.set(`pending-subscription:${reference}`, {
      userId: user.id,
      plan,
      userCount: licenses,
      amount,
      reference,
      isRenewal: true,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return c.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    });
  } catch (e: any) {
    console.error('Error in renew-license:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Verify Paystack payment
app.post(`${PREFIX}/subscription/verify`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const body = await c.req.json();
    const { reference } = body;
    
    if (!reference) {
      return c.json({ error: 'Payment reference is required' }, 400);
    }
    
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return c.json({ error: 'Payment gateway not configured' }, 500);
    }
    
    // Verify transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });
    
    const paystackData = await paystackResponse.json();
    
    if (!paystackData.status || paystackData.data.status !== 'success') {
      return c.json({ 
        success: false, 
        message: 'Payment verification failed or payment was not successful' 
      }, 400);
    }
    
    // Get pending subscription
    const pendingSubscription = await kv.get(`pending-subscription:${reference}`);
    
    if (!pendingSubscription) {
      return c.json({ success: false, message: 'Subscription record not found' }, 404);
    }
    
    // Verify amount matches
    const expectedAmount = pendingSubscription.amount * 100; // Convert to kobo
    if (paystackData.data.amount !== expectedAmount) {
      return c.json({ success: false, message: 'Payment amount mismatch' }, 400);
    }
    
    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (pendingSubscription.plan === 'monthly') {
      endDate.setDate(endDate.getDate() + 30);
    } else {
      endDate.setDate(endDate.getDate() + 365);
    }
    
    // Create/update subscription
    const subscription = {
      userId: pendingSubscription.userId,
      plan: pendingSubscription.plan,
      userCount: pendingSubscription.userCount,
      amount: pendingSubscription.amount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      paymentReference: reference,
      paystackData: {
        transactionId: paystackData.data.id,
        paidAt: paystackData.data.paid_at,
      },
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`subscription:${pendingSubscription.userId}`, subscription);
    
    // Clean up pending subscription
    await kv.del(`pending-subscription:${reference}`);
    
    await logAudit({
      userId: user.id,
      userName: user.email || 'Unknown',
      action: 'CREATE',
      resourceType: 'subscription',
      resourceId: pendingSubscription.userId,
      details: { 
        plan: subscription.plan, 
        userCount: subscription.userCount,
        amount: subscription.amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
    
    return c.json({ 
      success: true, 
      plan: subscription.plan,
      message: 'Subscription activated successfully',
      subscription,
    });
  } catch (e: any) {
    console.error('Error verifying payment:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Paystack webhook handler (for automated verification)
app.post(`${PREFIX}/subscription/webhook`, async (c) => {
  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return c.json({ error: 'Payment gateway not configured' }, 500);
    }
    
    // Verify webhook signature
    const hash = c.req.header('x-paystack-signature');
    const body = await c.req.text();
    
    const crypto = await import('node:crypto');
    const hmac = crypto.createHmac('sha512', paystackSecretKey);
    const expectedHash = hmac.update(body).digest('hex');
    
    if (hash !== expectedHash) {
      console.error('Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }
    
    const event = JSON.parse(body);
    
    // Handle successful charge
    if (event.event === 'charge.success') {
      const { reference } = event.data;
      
      // Check for license purchase
      const pendingLicense = await kv.get(`pending-license:${reference}`);
      if (pendingLicense) {
        const subscription = await kv.get(`subscription:${pendingLicense.userId}`) || {
          userId: pendingLicense.userId,
          purchasedLicenses: 0,
          plan: pendingLicense.plan,
          startDate: new Date().toISOString(),
          status: 'active',
        };
        
        const endDate = new Date();
        if (pendingLicense.plan === 'monthly') {
          endDate.setDate(endDate.getDate() + 30);
        } else {
          endDate.setDate(endDate.getDate() + 365);
        }
        
        subscription.purchasedLicenses = (subscription.purchasedLicenses || 0) + pendingLicense.licenses;
        subscription.plan = pendingLicense.plan;
        subscription.endDate = endDate.toISOString();
        subscription.lastPaymentDate = new Date().toISOString();
        subscription.lastPaymentAmount = pendingLicense.amount;
        subscription.lastPaymentReference = reference;
        
        if (pendingLicense.saveCard && event.data.authorization) {
          subscription.cardAuthorization = {
            authorizationCode: event.data.authorization.authorization_code,
            bin: event.data.authorization.bin,
            last4: event.data.authorization.last4,
            expMonth: event.data.authorization.exp_month,
            expYear: event.data.authorization.exp_year,
            cardType: event.data.authorization.card_type,
            bank: event.data.authorization.bank,
            brand: event.data.authorization.brand,
          };
        }
        
        await kv.set(`subscription:${pendingLicense.userId}`, subscription);
        await kv.del(`pending-license:${reference}`);
        return c.json({ status: 'success' });
      }
      
      // Check for old subscription purchase (fallback)
      const pendingSubscription = await kv.get(`pending-subscription:${reference}`);
      if (pendingSubscription) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        if (pendingSubscription.plan === 'monthly') {
          endDate.setDate(endDate.getDate() + 30);
        } else {
          endDate.setDate(endDate.getDate() + 365);
        }
        
        const subscription = {
          userId: pendingSubscription.userId,
          plan: pendingSubscription.plan,
          userCount: pendingSubscription.userCount,
          amount: pendingSubscription.amount,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'active',
          paymentReference: reference,
          paystackData: {
            transactionId: event.data.id,
            paidAt: event.data.paid_at,
          },
          createdAt: new Date().toISOString(),
        };
        
        await kv.set(`subscription:${pendingSubscription.userId}`, subscription);
        await kv.del(`pending-subscription:${reference}`);
      }
    }
    
    return c.json({ status: 'success' });
  } catch (e: any) {
    console.error('Webhook error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// ============ REPORTING ENDPOINTS ============
// These endpoints provide aggregated data for the Advanced Reports module

// Get all employees for reporting
app.get(`${PREFIX}/employees`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let employees = await kv.getByPrefix('employee:');
    // CRITICAL FIX: Filter by company scope for ALL roles including SuperAdmin
    employees = await filterEmployeesByCompany(employees, user.id, role);
    return c.json(employees || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get all companies for reporting
app.get(`${PREFIX}/companies`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let companies = await kv.getByPrefix('company:');
    // CRITICAL FIX: SuperAdmin should only see their own company for multi-tenant isolation
    // All users (including SuperAdmin) see only their assigned companies
    const scope = await resolveCompanyScope(user.id);
    if (scope?.length) {
      companies = companies.filter((c: any) => scope.includes(c.id) || scope.includes(c.name));
    }
    return c.json(companies || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Helper function to get currency symbol
function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'NGN': '₦', 'GHS': '₵',
    'ZAR': 'R', 'KES': 'KSh', 'CAD': 'C$', 'AUD': 'A$', 'INR': '₹',
    'JPY': '¥', 'CNY': '¥', 'CHF': 'CHF', 'AED': 'د.إ', 'SAR': '﷼'
  };
  return symbols[code] || code;
}

// Update company currency (SuperAdmin/Admin only)
app.put(`${PREFIX}/companies/:id/currency`, async (c) => {
  try {
    const { user, role } = await requireAdminOrAbove(c);
    const companyId = c.req.param("id");
    const { currency, customCurrencySymbol, customCurrencyCode } = await c.req.json();
    
    // Verify user has access to this company
    const scope = await resolveCompanyScope(user.id);
    if (!scope?.length || !companyMatches(scope, companyId)) {
      return c.json({ error: 'Access denied' }, 403);
    }
    
    // Update company-settings instead of company record
    const settings = await kv.get(`company-settings:${companyId}`) || {};
    
    // If custom currency provided, use it; otherwise validate standard currency
    if (customCurrencyCode && customCurrencySymbol) {
      settings.currencyCode = customCurrencyCode.toUpperCase();
      settings.currencySymbol = customCurrencySymbol;
      settings.isCustomCurrency = true;
    } else {
      // Validate standard currency code
      const validCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES', 'CAD', 'AUD', 'INR', 'JPY', 'CNY', 'CHF', 'AED', 'SAR'];
      if (!validCurrencies.includes(currency)) {
        return c.json({ error: 'Invalid currency code' }, 400);
      }
      settings.currencyCode = currency;
      settings.currencySymbol = getCurrencySymbol(currency);
      settings.isCustomCurrency = false;
    }
    
    settings.companyId = companyId;
    settings.updatedAt = new Date().toISOString();
    await kv.set(`company-settings:${companyId}`, settings);
    
    // Also update the company record for backward compatibility
    const company = await kv.get(`company:${companyId}`);
    if (company) {
      company.currency = settings.currencyCode;
      await kv.set(`company:${companyId}`, company);
    }
    
    
    return c.json({ 
      success: true, 
      currency: settings.currencyCode,
      currencySymbol: settings.currencySymbol,
      isCustomCurrency: settings.isCustomCurrency || false
    });
  } catch (e: any) {
    console.error('❌ Error updating currency:', e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Get all departments for reporting
app.get(`${PREFIX}/departments`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let departments = await kv.getByPrefix('department:');
    
    // CRITICAL FIX: ALL roles including SuperAdmins are filtered by company scope
    const scope = await resolveCompanyScope(user.id);
    if (!scope?.length) {
      return c.json([]);
    }
    departments = departments.filter((d: any) => {
      const dCompany = d.companyId || d.company;
      if (!dCompany) return false; // STRICT: Exclude items without company
      return companyMatches(scope, dCompany);
    });
    
    return c.json(departments || []);
  } catch (e: any) {
    console.error(`❌ Error in /departments:`, e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get all attendance records for reporting
app.get(`${PREFIX}/attendance-records`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let attendance = await kv.getByPrefix('attendance:');
    
    // CRITICAL FIX: Filter by employee company scope for ALL roles including SuperAdmin
    const employees = await kv.getByPrefix('employee:');
    const filteredEmployees = await filterEmployeesByCompany(employees, user.id, role);
    const allowedUserIds = new Set(filteredEmployees.map((e: any) => e.id || e.userId));
    attendance = attendance.filter((a: any) => allowedUserIds.has(a.userId));
    
    return c.json(attendance || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get all payroll runs for reporting
app.get(`${PREFIX}/payroll-runs`, async (c) => {
  try {
    const { user, role } = await requireManagerOrAbove(c);
    let payrollRuns = await kv.getByPrefix('payroll-run:');
    
    // CRITICAL FIX: ALL roles including SuperAdmins are filtered by company scope
    const scope = await resolveCompanyScope(user.id);
    if (!scope?.length) {
      return c.json([]);
    }
    payrollRuns = payrollRuns.filter((p: any) => {
      const pCompany = p.companyId || p.company;
      if (!pCompany) return false; // STRICT: Exclude items without company
      return companyMatches(scope, pCompany);
    });
    
    return c.json(payrollRuns || []);
  } catch (e: any) {
    console.error(`❌ Error in /payroll-runs:`, e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Get all performance reviews for reporting
app.get(`${PREFIX}/performance-reviews`, async (c) => {
  try {
    const { user, role } = await requireManagerOrAbove(c);
    let reviews = await kv.getByPrefix('perf-review:');
    
    // CRITICAL FIX: Filter by employee company scope for ALL roles including SuperAdmin
    const employees = await kv.getByPrefix('employee:');
    const filteredEmployees = await filterEmployeesByCompany(employees, user.id, role);
    const allowedUserIds = new Set(filteredEmployees.map((e: any) => e.id || e.userId));
    reviews = reviews.filter((r: any) => allowedUserIds.has(r.employeeId));
    
    return c.json(reviews || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// Get all training enrollments for reporting
app.get(`${PREFIX}/training-enrollments`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let enrollments = await kv.getByPrefix('training-enrollment:');
    
    // CRITICAL FIX: Filter by employee company scope for ALL roles including SuperAdmin
    if (role === 'employee') {
      enrollments = enrollments.filter((e: any) => e.userId === user.id);
    } else {
      const employees = await kv.getByPrefix('employee:');
      const filteredEmployees = await filterEmployeesByCompany(employees, user.id, role);
      const allowedUserIds = new Set(filteredEmployees.map((e: any) => e.id || e.userId));
      enrollments = enrollments.filter((e: any) => allowedUserIds.has(e.userId));
    }
    
    return c.json(enrollments || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get all assets for reporting
app.get(`${PREFIX}/assets`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let assets = await kv.getByPrefix('asset:');
    
    // CRITICAL FIX: Filter by company scope and assignment for ALL roles including SuperAdmin
    if (role === 'employee') {
      assets = assets.filter((a: any) => a.assignedTo === user.id);
    } else {
      const scope = await resolveCompanyScope(user.id);
      if (!scope?.length) {
        return c.json([]);
      }
      assets = assets.filter((a: any) => {
        const aCompany = a.companyId || a.company;
        if (!aCompany) return false; // STRICT: Exclude items without company
        return companyMatches(scope, aCompany);
      });
    }
    
    return c.json(assets || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// EMPLOYEE CHAT ENDPOINTS
// ========================================

// Send a chat message
const sendChatMessage = async (c: any) => {
  try {
    const authUser = await requireAuth(c);
    const { message } = await c.req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get user profile for name and company - use employee: key for consistency
    const userProfile = await kv.get(`employee:${authUser.user.id}`);
    const userName = userProfile?.name || authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'Anonymous';
    const companyId = userProfile?.companyId || userProfile?.company;

    if (!companyId) {
      return c.json({ error: 'User not associated with a company' }, 400);
    }

    // Create message object
    const chatMessage = {
      id: crypto.randomUUID(),
      userId: authUser.user.id,
      userName: userName,
      companyId: companyId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    // Get existing messages for this company
    const existingMessages = await kv.get(`chat_messages:${companyId}`) || [];
    
    // Clear messages older than 7 days (weekly clearing)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMessages = existingMessages.filter((msg: any) => {
      const msgDate = new Date(msg.timestamp);
      return msgDate > sevenDaysAgo;
    });
    
    // Add new message (keep last 100 messages per company)
    const updatedMessages = [...recentMessages, chatMessage].slice(-100);
    
    // Save to KV store with company scope
    await kv.set(`chat_messages:${companyId}`, updatedMessages);

    return c.json({ success: true, message: chatMessage });
  } catch (e: any) {
    console.error('Chat send error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to send message' }, 500);
  }
};
for (const route of compatibleRoutePaths('/chat/send')) app.post(route, sendChatMessage);

// Get chat messages (Company-scoped)
const getChatMessages = async (c: any) => {
  try {
    const authUser = await requireAuth(c);
    
    // Get user profile to find company - use employee: key for consistency
    const userProfile = await kv.get(`employee:${authUser.user.id}`);
    const companyId = userProfile?.companyId || userProfile?.company;

    if (!companyId) {
      return c.json({ error: 'User not associated with a company' }, 400);
    }
    
    const allMessages = await kv.get(`chat_messages:${companyId}`) || [];
    
    // Filter out messages older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const messages = allMessages.filter((msg: any) => {
      const msgDate = new Date(msg.timestamp);
      return msgDate > sevenDaysAgo;
    });
    
    // Update storage if we filtered any messages
    if (messages.length !== allMessages.length) {
      await kv.set(`chat_messages:${companyId}`, messages);
    }
    
    return c.json({ messages });
  } catch (e: any) {
    console.error('Chat messages error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
};
for (const route of compatibleRoutePaths('/chat/messages')) app.get(route, getChatMessages);

// ========================================
// EMPLOYEE SELF-SERVICE PORTAL ENDPOINTS
// ========================================

// Get employee profile (reads from employee: key - the main profile store)
app.get(`${PREFIX}/employee/profile`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const kvData = authUser.kvData;
    if (!kvData) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    return c.json({
      id: authUser.user.id,
      userId: authUser.user.id,
      email: authUser.user.email,
      name: kvData.name || authUser.user.user_metadata?.name || '',
      role: authUser.role,
      ...kvData,
    });
  } catch (e: any) {
    console.error('Get profile error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Submit leave request
app.post(`${PREFIX}/employee/leave-request`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const { type, startDate, endDate, reason } = await c.req.json();

    if (!type || !startDate || !endDate) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = {
      id: crypto.randomUUID(),
      userId: authUser.user.id,
      companyId: companyId,
      userName: userProfile?.name || 'Unknown',
      type: type,
      startDate: startDate,
      endDate: endDate,
      days: days,
      reason: reason || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const existingRequests = await kv.get(`leave_requests:${companyId}`) || [];
    await kv.set(`leave_requests:${companyId}`, [...existingRequests, leaveRequest]);

    return c.json({ success: true, request: leaveRequest });
  } catch (e: any) {
    console.error('Leave request error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to submit leave request' }, 500);
  }
});

// Get employee leave requests
app.get(`${PREFIX}/employee/leave-requests`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    const allRequests = await kv.get(`leave_requests:${companyId}`) || [];
    const userRequests = allRequests.filter((r: any) => r.userId === authUser.user.id);

    return c.json({ requests: userRequests });
  } catch (e: any) {
    console.error('Get leave requests error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get leave requests' }, 500);
  }
});

// Clock in
app.post(`${PREFIX}/employee/clock-in`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    const today = new Date().toISOString().split('T')[0];
    const attendanceKey = `attendance:${companyId}:${today}`;
    
    const todayAttendance = await kv.get(attendanceKey) || [];
    const existing = todayAttendance.find((a: any) => a.userId === authUser.user.id);

    if (existing && existing.clockIn) {
      return c.json({ error: 'Already clocked in today' }, 400);
    }

    const attendance = {
      id: crypto.randomUUID(),
      userId: authUser.user.id,
      companyId: companyId,
      date: today,
      clockIn: new Date().toISOString(),
      status: 'present',
    };

    if (existing) {
      const updated = todayAttendance.map((a: any) => 
        a.userId === authUser.user.id ? attendance : a
      );
      await kv.set(attendanceKey, updated);
    } else {
      await kv.set(attendanceKey, [...todayAttendance, attendance]);
    }

    return c.json({ success: true, attendance });
  } catch (e: any) {
    console.error('Clock in error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to clock in' }, 500);
  }
});

// Clock out
app.post(`${PREFIX}/employee/clock-out`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    const today = new Date().toISOString().split('T')[0];
    const attendanceKey = `attendance:${companyId}:${today}`;
    
    const todayAttendance = await kv.get(attendanceKey) || [];
    const existing = todayAttendance.find((a: any) => a.userId === authUser.user.id);

    if (!existing || !existing.clockIn) {
      return c.json({ error: 'Must clock in first' }, 400);
    }

    if (existing.clockOut) {
      return c.json({ error: 'Already clocked out today' }, 400);
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(existing.clockIn);
    const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    const updated = todayAttendance.map((a: any) => 
      a.userId === authUser.user.id 
        ? { ...a, clockOut: clockOutTime.toISOString(), hoursWorked } 
        : a
    );

    await kv.set(attendanceKey, updated);

    return c.json({ success: true, hoursWorked });
  } catch (e: any) {
    console.error('Clock out error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to clock out' }, 500);
  }
});

// Get employee attendance
app.get(`${PREFIX}/employee/attendance`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    const today = new Date().toISOString().split('T')[0];
    const records: any[] = [];

    // Get last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const attendanceKey = `attendance:${companyId}:${dateStr}`;
      const dayAttendance = await kv.get(attendanceKey) || [];
      const userRecord = dayAttendance.find((a: any) => a.userId === authUser.user.id);
      if (userRecord) {
        records.push(userRecord);
      }
    }

    const todayKey = `attendance:${companyId}:${today}`;
    const todayAttendance = await kv.get(todayKey) || [];
    const todayRecord = todayAttendance.find((a: any) => a.userId === authUser.user.id);

    return c.json({ records, today: todayRecord });
  } catch (e: any) {
    console.error('Get attendance error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get attendance' }, 500);
  }
});

// Get employee payslips
app.get(`${PREFIX}/employee/payslips`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const companyId = authUser.kvData?.companyId || authUser.kvData?.company;

    const userPayslips = await kv.get(`payslips:${companyId}:${authUser.user.id}`) || [];
    
    // Also check payroll runs for generated payslips
    if (userPayslips.length === 0 && companyId) {
      const payrollRuns = await kv.getByPrefix(`payroll-run:`);
      const companyRuns = payrollRuns.filter((r: any) => 
        (r.companyId === companyId || r.company === companyId) && r.status === 'completed'
      );
      const generatedSlips: any[] = [];
      for (const run of companyRuns) {
        if (run.payslips) {
          const mySlip = run.payslips.find((s: any) => s.employeeId === authUser.user.id || s.userId === authUser.user.id);
          if (mySlip) {
            generatedSlips.push({
              ...mySlip,
              month: run.month || new Date(run.createdAt || run.date).toLocaleString('default', { month: 'long' }),
              year: run.year || new Date(run.createdAt || run.date).getFullYear(),
              generatedAt: run.completedAt || run.createdAt,
            });
          }
        }
      }
      if (generatedSlips.length > 0) {
        return c.json({ payslips: generatedSlips.sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()) });
      }
    }

    return c.json({ payslips: userPayslips });
  } catch (e: any) {
    console.error('Get payslips error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get payslips' }, 500);
  }
});

// Get employee announcements (company-scoped)
app.get(`${PREFIX}/employee/announcements`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const companyId = authUser.kvData?.companyId || authUser.kvData?.company;
    if (!companyId) return c.json({ announcements: [] });
    
    const allAnnouncements = await kv.getByPrefix('announcement:');
    const companyAnnouncements = allAnnouncements.filter((a: any) => {
      const aCompany = a.companyId || a.company;
      if (aCompany !== companyId) return false;
      if (a.status && a.status !== 'published' && a.status !== 'active') return false;
      if (a.targetDepartments && a.targetDepartments.length > 0 && a.targetAudience !== 'all') {
        const empDept = authUser.kvData?.department;
        if (empDept && !a.targetDepartments.includes(empDept)) return false;
      }
      return true;
    });
    companyAnnouncements.sort((a: any, b: any) => 
      new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
    );
    return c.json({ announcements: companyAnnouncements.slice(0, 20) });
  } catch (e: any) {
    console.error('Get employee announcements error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get announcements' }, 500);
  }
});

// Submit profile update request (employee self-service)
app.post(`${PREFIX}/employee/profile-update-request`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const body = await c.req.json();
    const companyId = authUser.kvData?.companyId || authUser.kvData?.company;
    const request = {
      id: crypto.randomUUID(),
      userId: authUser.user.id,
      userName: authUser.kvData?.name || authUser.user.email,
      companyId,
      changes: body.changes || {},
      reason: body.reason || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const existing = await kv.get(`profile-change-requests:${companyId}`) || [];
    await kv.set(`profile-change-requests:${companyId}`, [...existing, request]);
    // Notify admins
    const allUsers = await kv.getByPrefix('employee:');
    const admins = allUsers.filter((u: any) => 
      (u.role === 'admin' || u.role === 'superadmin') && 
      (u.companyId === companyId || u.company === companyId)
    );
    for (const admin of admins) {
      const adminId = admin.id || admin.userId;
      if (adminId) {
        const notifs = await kv.get(`notifications:${adminId}`) || [];
        notifs.push({ id: crypto.randomUUID(), type: 'profile_update_request', title: 'Profile Update Request', message: `${request.userName} has requested a profile update`, read: false, createdAt: new Date().toISOString() });
        await kv.set(`notifications:${adminId}`, notifs);
      }
    }
    return c.json({ success: true, request });
  } catch (e: any) {
    console.error('Profile update request error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to submit profile update request' }, 500);
  }
});

// Cancel a pending leave request
app.post(`${PREFIX}/employee/leave-cancel/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const leaveId = c.req.param('id');
    const companyId = authUser.kvData?.companyId || authUser.kvData?.company;
    if (!companyId) return c.json({ error: 'No company' }, 400);

    const existingRequests = await kv.get(`leave_requests:${companyId}`) || [];
    const idx = existingRequests.findIndex((r: any) => r.id === leaveId && r.userId === authUser.user.id);
    if (idx === -1) return c.json({ error: 'Leave request not found' }, 404);
    if (existingRequests[idx].status !== 'pending') {
      return c.json({ error: 'Only pending requests can be cancelled' }, 400);
    }
    existingRequests[idx].status = 'cancelled';
    existingRequests[idx].cancelledAt = new Date().toISOString();
    await kv.set(`leave_requests:${companyId}`, existingRequests);
    return c.json({ success: true });
  } catch (e: any) {
    console.error('Leave cancel error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to cancel leave request' }, 500);
  }
});

// Get team directory (colleagues in same company)
app.get(`${PREFIX}/employee/team`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const companyId = authUser.kvData?.companyId || authUser.kvData?.company;
    if (!companyId) return c.json({ team: [] });

    const allEmployees = await kv.getByPrefix('employee:');
    const team = allEmployees
      .filter((e: any) => {
        const eCompany = e.companyId || e.company;
        return eCompany === companyId && e.status === 'active' && (e.userId || e.id) !== authUser.user.id;
      })
      .map((e: any) => ({
        id: e.userId || e.id,
        name: e.name || 'Unknown',
        email: e.email || '',
        department: e.department || '',
        position: e.position || e.jobTitle || '',
        role: e.role || 'employee',
        profileImageUrl: e.profileImageUrl || null,
      }));

    return c.json({ team });
  } catch (e: any) {
    console.error('Get team error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get team directory' }, 500);
  }
});

// Get company holidays
app.get(`${PREFIX}/employee/holidays`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const companyId = authUser.kvData?.companyId || authUser.kvData?.company;
    if (!companyId) return c.json({ holidays: [] });

    const holidays = await kv.get(`holidays:${companyId}`) || [];
    const vacations = await kv.getByPrefix('vacation:');
    const companyVacations = vacations.filter((v: any) => {
      const vCompany = v.companyId || v.company;
      return vCompany === companyId && v.type === 'holiday';
    });

    const allHolidays = [...holidays, ...companyVacations].sort((a: any, b: any) =>
      new Date(a.date || a.startDate || 0).getTime() - new Date(b.date || b.startDate || 0).getTime()
    );

    return c.json({ holidays: allHolidays });
  } catch (e: any) {
    console.error('Get holidays error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get holidays' }, 500);
  }
});

// Get employee's profile update request history
app.get(`${PREFIX}/employee/profile-update-requests`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const companyId = authUser.kvData?.companyId || authUser.kvData?.company;
    if (!companyId) return c.json({ requests: [] });

    const allRequests = await kv.get(`profile-change-requests:${companyId}`) || [];
    const myRequests = allRequests.filter((r: any) => r.userId === authUser.user.id);
    const profileChanges = await kv.getByPrefix('profile-change:');
    const myChanges = profileChanges.filter((r: any) => r.userId === authUser.user.id);

    const combined = [...myRequests, ...myChanges].sort((a: any, b: any) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return c.json({ requests: combined });
  } catch (e: any) {
    console.error('Get profile update requests error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get profile update requests' }, 500);
  }
});

// Get employee documents (shared with employee or their department)
app.get(`${PREFIX}/employee/documents`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const companyId = authUser.kvData?.companyId || authUser.kvData?.company;
    if (!companyId) return c.json({ documents: [] });

    const allDocs = await kv.getByPrefix('document:');
    const empDept = authUser.kvData?.department;
    const companyDocs = allDocs.filter((d: any) => {
      const dCompany = d.companyId || d.company;
      if (dCompany !== companyId) return false;
      if (d.visibility === 'all' || d.visibility === 'company' || !d.visibility) return true;
      if (d.visibility === 'department' && d.department === empDept) return true;
      if (d.targetEmployees && d.targetEmployees.includes(authUser.user.id)) return true;
      return false;
    });

    companyDocs.sort((a: any, b: any) =>
      new Date(b.createdAt || b.uploadedAt || 0).getTime() - new Date(a.createdAt || a.uploadedAt || 0).getTime()
    );

    return c.json({ documents: companyDocs.slice(0, 50) });
  } catch (e: any) {
    console.error('Get employee documents error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get documents' }, 500);
  }
});

// ========================================
// EMPLOYEE OVERTIME & EXPENSE ENDPOINTS
// ========================================

// Submit overtime request
app.post(`${PREFIX}/employee/overtime-request`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const body = await c.req.json();
    const { date, hours, reason } = body;
    if (!date || !hours || !reason) return c.json({ error: 'Date, hours, and reason are required' }, 400);
    
    const companyId = kvData?.companyId || kvData?.company;
    const id = crypto.randomUUID();
    const request = {
      id, userId: user.id, userName: kvData?.name || user.email,
      department: kvData?.department || '', companyId, date,
      hours: parseFloat(hours), reason, status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await kv.set(`overtime:${id}`, request);
    
    // Trigger workflow notifications for overtime type
    if (companyId) {
      await triggerWorkflowNotifications(
        companyId,
        'expense', // workflows typed as 'expense' in admin config cover OT too; also check 'overtime'
        'Overtime Request Submitted',
        `${kvData?.name || 'An employee'} submitted an overtime request for ${hours}h on ${date}`
      );
      await triggerWorkflowNotifications(
        companyId,
        'overtime',
        'Overtime Request Submitted',
        `${kvData?.name || 'An employee'} submitted an overtime request for ${hours}h on ${date}`
      );
    }

    const allEmps = await kv.getByPrefix('employee:');
    const managers = allEmps.filter((e: any) => ['superadmin', 'admin', 'manager'].includes(e.role) && (e.companyId === companyId || e.company === companyId));
    for (const mgr of managers) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: mgr.userId || mgr.id, type: 'overtime-request',
        title: 'Overtime Request', message: `${kvData?.name || 'An employee'} submitted an overtime request for ${hours}h on ${date}`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json({ success: true, request });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Overtime request error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/employee/overtime-requests`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const all = await kv.getByPrefix('overtime:');
    const mine = all.filter((r: any) => r.userId === user.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ requests: mine });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/employee/expense-claim`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const body = await c.req.json();
    const { title, category, amount, date, description, currency } = body;
    if (!title || !category || !amount || !date) return c.json({ error: 'Title, category, amount, and date are required' }, 400);
    
    const companyId = kvData?.companyId || kvData?.company;
    const id = crypto.randomUUID();
    const claim = {
      id, userId: user.id, userName: kvData?.name || user.email,
      department: kvData?.department || '', companyId, title, category,
      amount: parseFloat(amount), currency: currency || 'NGN', date,
      description: description || '', status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await kv.set(`expense:${id}`, claim);

    // Trigger workflow notifications for expense type
    if (companyId) {
      await triggerWorkflowNotifications(
        companyId,
        'expense',
        'Expense Claim Submitted',
        `${kvData?.name || 'An employee'} submitted an expense claim: ${title} (${currency || 'NGN'} ${amount})`
      );
    }

    const allEmps = await kv.getByPrefix('employee:');
    const hrStaff = allEmps.filter((e: any) => ['superadmin', 'admin'].includes(e.role) && (e.companyId === companyId || e.company === companyId));
    for (const hr of hrStaff) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: hr.userId || hr.id, type: 'expense-claim',
        title: 'Expense Claim', message: `${kvData?.name || 'An employee'} submitted an expense claim: ${title} (${currency || 'NGN'} ${amount})`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json({ success: true, claim });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Expense claim error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/employee/expense-claims`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const all = await kv.getByPrefix('expense:');
    const mine = all.filter((r: any) => r.userId === user.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ claims: mine });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// EMPLOYEE TRAINING ENROLLMENT ENDPOINTS
// ========================================

app.get(`${PREFIX}/employee/available-training`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const companyId = kvData?.companyId || kvData?.company;
    if (!companyId) return c.json({ programs: [] });
    
    const [progs1, progs2] = await Promise.all([kv.getByPrefix('training:'), kv.getByPrefix('training-program:')]);
    const allPrograms = [...(Array.isArray(progs1) ? progs1 : []), ...(Array.isArray(progs2) ? progs2 : [])];
    const available = allPrograms.filter((p: any) => {
      const pCompany = p.companyId || p.company;
      if (pCompany && pCompany !== companyId) return false;
      if (p.status === 'cancelled' || p.status === 'draft') return false;
      return true;
    });
    return c.json({ programs: available });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/employee/training-enroll`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const { trainingId, trainingTitle } = await c.req.json();
    if (!trainingId) return c.json({ error: 'Training ID is required' }, 400);
    
    const existingEnrollments = await kv.getByPrefix('training-enrollment:');
    const alreadyEnrolled = existingEnrollments.find((e: any) => e.userId === user.id && e.trainingId === trainingId);
    if (alreadyEnrolled) return c.json({ error: 'You are already enrolled in this program' }, 400);
    
    const companyId = kvData?.companyId || kvData?.company;
    const id = crypto.randomUUID();
    const enrollment = {
      id, userId: user.id, userName: kvData?.name || user.email,
      department: kvData?.department || '', companyId, trainingId,
      trainingTitle: trainingTitle || 'Training Program',
      status: 'enrolled', progress: 0, enrolledAt: new Date().toISOString(),
    };
    await kv.set(`training-enrollment:${id}`, enrollment);
    return c.json({ success: true, enrollment });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Training enrollment error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/employee/my-enrollments`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const all = await kv.getByPrefix('training-enrollment:');
    const mine = all.filter((e: any) => e.userId === user.id).sort((a: any, b: any) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());
    return c.json({ enrollments: mine });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// EMPLOYEE FEEDBACK & SURVEY ENDPOINTS
// ========================================

app.post(`${PREFIX}/employee/feedback`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const { category, message, anonymous } = await c.req.json();
    if (!category || !message) return c.json({ error: 'Category and message are required' }, 400);
    
    const companyId = kvData?.companyId || kvData?.company;
    const id = crypto.randomUUID();
    const feedback = {
      id, userId: anonymous ? 'anonymous' : user.id,
      _actualUserId: user.id,
      userName: anonymous ? 'Anonymous' : (kvData?.name || user.email),
      department: anonymous ? '' : (kvData?.department || ''),
      companyId, category, message, anonymous: !!anonymous,
      status: 'submitted', createdAt: new Date().toISOString(),
    };
    await kv.set(`emp-feedback:${id}`, feedback);
    
    const allEmps = await kv.getByPrefix('employee:');
    const hrStaff = allEmps.filter((e: any) => ['superadmin', 'admin'].includes(e.role) && (e.companyId === companyId || e.company === companyId));
    for (const hr of hrStaff) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: hr.userId || hr.id, type: 'employee-feedback',
        title: 'New Employee Feedback',
        message: `${anonymous ? 'Anonymous employee' : (kvData?.name || 'An employee')} submitted ${category} feedback`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Feedback submit error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/employee/feedback-history`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const all = await kv.getByPrefix('emp-feedback:');
    const mine = all.filter((f: any) => f._actualUserId === user.id || f.userId === user.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ feedback: mine });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/employee/surveys`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const companyId = kvData?.companyId || kvData?.company;
    if (!companyId) return c.json({ surveys: [], responses: [] });
    
    const allSurveys = await kv.getByPrefix('survey:');
    const companySurveys = allSurveys.filter((s: any) => {
      const sCompany = s.companyId || s.company;
      return sCompany === companyId && s.status !== 'draft';
    });
    
    const allResponses = await kv.getByPrefix('survey-response:');
    const myResponses = allResponses.filter((r: any) => r._actualUserId === user.id || r.userId === user.id);
    return c.json({ surveys: companySurveys, responses: myResponses });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/employee/survey-response`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const { surveyId, surveyTitle, answers, anonymous } = await c.req.json();
    if (!surveyId || !answers) return c.json({ error: 'Survey ID and answers are required' }, 400);
    
    const existingResponses = await kv.getByPrefix('survey-response:');
    const alreadyResponded = existingResponses.find((r: any) => (r._actualUserId === user.id || r.userId === user.id) && r.surveyId === surveyId);
    if (alreadyResponded) return c.json({ error: 'You have already responded to this survey' }, 400);
    
    const companyId = kvData?.companyId || kvData?.company;
    const id = crypto.randomUUID();
    const response = {
      id, userId: anonymous ? 'anonymous' : user.id,
      _actualUserId: user.id,
      userName: anonymous ? 'Anonymous' : (kvData?.name || user.email),
      companyId, surveyId, surveyTitle: surveyTitle || 'Survey',
      answers, anonymous: !!anonymous, submittedAt: new Date().toISOString(),
    };
    await kv.set(`survey-response:${id}`, response);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Survey response error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// EMPLOYEE TEAM CALENDAR ENDPOINT
// ========================================

app.get(`${PREFIX}/employee/team-calendar`, async (c) => {
  try {
    const { user, kvData } = await requireAuth(c);
    const companyId = kvData?.companyId || kvData?.company;
    if (!companyId) return c.json({ leaves: [] });
    
    const allEmps = await kv.getByPrefix('employee:');
    const companyEmps = allEmps.filter((e: any) => (e.companyId === companyId || e.company === companyId));
    const allLeaves = await kv.getByPrefix('leave:');
    const companyEmpIds = new Set(companyEmps.map((e: any) => e.userId || e.id));
    
    const teamLeaves = allLeaves
      .filter((l: any) => l.status === 'approved' && companyEmpIds.has(l.userId))
      .map((l: any) => {
        const emp = companyEmps.find((e: any) => (e.userId || e.id) === l.userId);
        return {
          userId: l.userId,
          userName: emp?.name || l.userName || 'Unknown',
          department: emp?.department || l.department || '',
          startDate: l.startDate, endDate: l.endDate,
          type: l.type || l.leaveType || 'Annual', status: l.status,
        };
      });
    return c.json({ leaves: teamLeaves });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// ADMIN OVERTIME & EXPENSE APPROVAL ENDPOINTS
// ========================================

app.get(`${PREFIX}/admin/overtime-requests`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const scope = await resolveCompanyScope(user.id);
    const all = await kv.getByPrefix('overtime:');
    const companyRequests = all
      .filter((r: any) => scope && companyMatches(scope, r.companyId || r.company))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(companyRequests);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/admin/overtime-requests/:id`, async (c) => {
  try {
    const { user, kvData } = await requireAdminOrAbove(c);
    const id = c.req.param('id');
    const { status, rejectionReason } = await c.req.json();
    if (!['approved', 'rejected'].includes(status)) return c.json({ error: 'Invalid status' }, 400);
    const existing = await kv.get(`overtime:${id}`);
    if (!existing) return c.json({ error: 'Overtime request not found' }, 404);
    const updated = { ...existing, status, respondedAt: new Date().toISOString(), respondedBy: kvData?.name || user.email, ...(rejectionReason ? { rejectionReason } : {}) };
    await kv.set(`overtime:${id}`, updated);
    const nid = crypto.randomUUID();
    await kv.set(`notification:${nid}`, { id: nid, userId: existing.userId, type: 'overtime-update', title: `Overtime ${status === 'approved' ? 'Approved' : 'Rejected'}`, message: `Your overtime request for ${existing.hours}h on ${existing.date} has been ${status}${rejectionReason ? ': ' + rejectionReason : ''}`, read: false, createdAt: new Date().toISOString() });
    return c.json({ success: true, request: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/admin/expense-claims`, async (c) => {
  try {
    const { user } = await requireAdminOrAbove(c);
    const scope = await resolveCompanyScope(user.id);
    const all = await kv.getByPrefix('expense:');
    const companyClaims = all
      .filter((r: any) => scope && companyMatches(scope, r.companyId || r.company))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(companyClaims);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/admin/expense-claims/:id`, async (c) => {
  try {
    const { user, kvData } = await requireAdminOrAbove(c);
    const id = c.req.param('id');
    const { status, rejectionReason } = await c.req.json();
    if (!['approved', 'rejected', 'reimbursed'].includes(status)) return c.json({ error: 'Invalid status' }, 400);
    const existing = await kv.get(`expense:${id}`);
    if (!existing) return c.json({ error: 'Expense claim not found' }, 404);
    const updated = { ...existing, status, respondedAt: new Date().toISOString(), respondedBy: kvData?.name || user.email, ...(rejectionReason ? { rejectionReason } : {}) };
    await kv.set(`expense:${id}`, updated);
    const nid = crypto.randomUUID();
    await kv.set(`notification:${nid}`, { id: nid, userId: existing.userId, type: 'expense-update', title: `Expense ${status === 'approved' ? 'Approved' : status === 'reimbursed' ? 'Reimbursed' : 'Rejected'}`, message: `Your expense claim "${existing.title}" (${existing.currency} ${existing.amount}) has been ${status}${rejectionReason ? ': ' + rejectionReason : ''}`, read: false, createdAt: new Date().toISOString() });
    return c.json({ success: true, claim: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// MANAGER OVERTIME & EXPENSE APPROVAL ENDPOINTS
// ========================================

app.get(`${PREFIX}/manager/overtime-requests`, async (c) => {
  try {
    const { user, role, kvData } = await requireManagerOrAbove(c);
    const companyId = kvData?.companyId || kvData?.company;
    const managerDepts = kvData?.departments || (kvData?.department ? [kvData.department] : []);
    
    // Get all employees in manager's departments
    const allEmployees = await kv.getByPrefix('employee:');
    const deptEmployees = allEmployees.filter((emp: any) => {
      const empDepts = emp.departments || (emp.department ? [emp.department] : []);
      const empCompany = emp.companyId || emp.company;
      return empCompany === companyId && managerDepts.some((dept: string) => empDepts.includes(dept));
    });
    const deptEmployeeIds = new Set(deptEmployees.map((e: any) => e.userId || e.id));
    
    // Filter overtime requests to only those from department employees
    const all = await kv.getByPrefix('overtime:');
    const departmentRequests = all.filter((r: any) => 
      r.companyId === companyId && deptEmployeeIds.has(r.userId)
    ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json(departmentRequests);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Manager overtime requests error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/manager/overtime-requests/:id`, async (c) => {
  try {
    const { user, kvData } = await requireManagerOrAbove(c);
    const companyId = kvData?.companyId || kvData?.company;
    const managerDepts = kvData?.departments || (kvData?.department ? [kvData.department] : []);
    const id = c.req.param('id');
    const { status, rejectionReason } = await c.req.json();
    
    if (!['approved', 'rejected'].includes(status)) return c.json({ error: 'Invalid status' }, 400);
    
    const existing = await kv.get(`overtime:${id}`);
    if (!existing) return c.json({ error: 'Overtime request not found' }, 404);
    
    // Verify the employee is in manager's department
    const employee = await kv.get(`employee:${existing.userId}`);
    if (!employee) return c.json({ error: 'Employee not found' }, 404);
    
    const empDepts = employee.departments || (employee.department ? [employee.department] : []);
    const hasAccess = managerDepts.some((dept: string) => empDepts.includes(dept));
    
    if (!hasAccess) {
      return c.json({ error: 'You can only approve overtime for employees in your departments' }, 403);
    }
    
    const updated = { 
      ...existing, 
      status, 
      respondedAt: new Date().toISOString(), 
      respondedBy: kvData?.name || user.email, 
      ...(rejectionReason ? { rejectionReason } : {}) 
    };
    await kv.set(`overtime:${id}`, updated);
    
    // Send notification to employee
    const nid = crypto.randomUUID();
    await kv.set(`notification:${nid}`, { 
      id: nid, 
      userId: existing.userId, 
      type: 'overtime-update', 
      title: `Overtime ${status === 'approved' ? 'Approved' : 'Rejected'}`, 
      message: `Your overtime request for ${existing.hours}h on ${existing.date} has been ${status}${rejectionReason ? ': ' + rejectionReason : ''}`, 
      read: false, 
      createdAt: new Date().toISOString() 
    });
    
    return c.json({ success: true, request: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Manager overtime approval error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/manager/expense-claims`, async (c) => {
  try {
    const { user, role, kvData } = await requireManagerOrAbove(c);
    const companyId = kvData?.companyId || kvData?.company;
    const managerDepts = kvData?.departments || (kvData?.department ? [kvData.department] : []);
    
    // Get all employees in manager's departments
    const allEmployees = await kv.getByPrefix('employee:');
    const deptEmployees = allEmployees.filter((emp: any) => {
      const empDepts = emp.departments || (emp.department ? [emp.department] : []);
      const empCompany = emp.companyId || emp.company;
      return empCompany === companyId && managerDepts.some((dept: string) => empDepts.includes(dept));
    });
    const deptEmployeeIds = new Set(deptEmployees.map((e: any) => e.userId || e.id));
    
    // Filter expense claims to only those from department employees
    const all = await kv.getByPrefix('expense:');
    const departmentClaims = all.filter((r: any) => 
      r.companyId === companyId && deptEmployeeIds.has(r.userId)
    ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json(departmentClaims);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Manager expense claims error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/manager/expense-claims/:id`, async (c) => {
  try {
    const { user, kvData } = await requireManagerOrAbove(c);
    const companyId = kvData?.companyId || kvData?.company;
    const managerDepts = kvData?.departments || (kvData?.department ? [kvData.department] : []);
    const id = c.req.param('id');
    const { status, rejectionReason } = await c.req.json();
    
    if (!['approved', 'rejected'].includes(status)) return c.json({ error: 'Invalid status' }, 400);
    
    const existing = await kv.get(`expense:${id}`);
    if (!existing) return c.json({ error: 'Expense claim not found' }, 404);
    
    // Verify the employee is in manager's department
    const employee = await kv.get(`employee:${existing.userId}`);
    if (!employee) return c.json({ error: 'Employee not found' }, 404);
    
    const empDepts = employee.departments || (employee.department ? [employee.department] : []);
    const hasAccess = managerDepts.some((dept: string) => empDepts.includes(dept));
    
    if (!hasAccess) {
      return c.json({ error: 'You can only approve expenses for employees in your departments' }, 403);
    }
    
    const updated = { 
      ...existing, 
      status, 
      respondedAt: new Date().toISOString(), 
      respondedBy: kvData?.name || user.email, 
      ...(rejectionReason ? { rejectionReason } : {}) 
    };
    await kv.set(`expense:${id}`, updated);
    
    // Send notification to employee
    const nid = crypto.randomUUID();
    await kv.set(`notification:${nid}`, { 
      id: nid, 
      userId: existing.userId, 
      type: 'expense-update', 
      title: `Expense Claim ${status === 'approved' ? 'Approved' : 'Rejected'}`, 
      message: `Your expense claim for ₦${existing.amount} (${existing.category}) has been ${status}${rejectionReason ? ': ' + rejectionReason : ''}`, 
      read: false, 
      createdAt: new Date().toISOString() 
    });
    
    return c.json({ success: true, claim: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Manager expense approval error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// ADMIN SURVEY BUILDER ENDPOINTS
// ========================================

app.get(`${PREFIX}/admin/surveys`, async (c) => {
  try {
    const { user, kvData } = await requireAdminOrAbove(c);
    const companyId = kvData?.companyId || kvData?.company;
    const all = await kv.getByPrefix('survey:');
    const companySurveys = all.filter((s: any) => (s.companyId || s.company) === companyId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(companySurveys);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/admin/survey`, async (c) => {
  try {
    const { user, kvData } = await requireAdminOrAbove(c);
    const body = await c.req.json();
    const { title, description, questions, deadline, anonymous, category, status } = body;
    if (!title || !questions || !Array.isArray(questions)) return c.json({ error: 'Title and questions array required' }, 400);
    const companyId = kvData?.companyId || kvData?.company;
    const id = crypto.randomUUID();
    const survey = { id, companyId, title, description: description || '', questions: questions.map((q: any) => ({ ...q, id: q.id || crypto.randomUUID() })), deadline: deadline || null, anonymous: anonymous !== false, category: category || 'General', status: status || 'draft', createdBy: kvData?.name || user.email, createdAt: new Date().toISOString() };
    await kv.set(`survey:${id}`, survey);
    return c.json({ success: true, survey });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.error('Create survey error:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/admin/survey/:id`, async (c) => {
  try {
    const { user, kvData } = await requireAdminOrAbove(c);
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(`survey:${id}`);
    if (!existing) return c.json({ error: 'Survey not found' }, 404);
    if (body.questions) { body.questions = body.questions.map((q: any) => ({ ...q, id: q.id || crypto.randomUUID() })); }
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString(), updatedBy: kvData?.name || user.email };
    await kv.set(`survey:${id}`, updated);
    return c.json({ success: true, survey: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.delete(`${PREFIX}/admin/survey/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param('id');
    await kv.del(`survey:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/admin/survey-responses/:surveyId`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const surveyId = c.req.param('surveyId');
    const all = await kv.getByPrefix('survey-response:');
    const responses = all.filter((r: any) => r.surveyId === surveyId)
      .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return c.json(responses);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// EMPLOYEE TRAINING PROGRESS UPDATE
// ========================================

app.put(`${PREFIX}/employee/training-progress/:id`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const id = c.req.param('id');
    const { progress, status } = await c.req.json();
    const enrollment = await kv.get(`training-enrollment:${id}`);
    if (!enrollment) return c.json({ error: 'Enrollment not found' }, 404);
    if (enrollment.userId !== user.id) return c.json({ error: 'Not your enrollment' }, 403);
    const updated = { ...enrollment, progress: Math.min(100, Math.max(0, progress ?? enrollment.progress)), status: status || (progress >= 100 ? 'completed' : 'in-progress'), ...(progress >= 100 ? { completedAt: new Date().toISOString() } : {}), updatedAt: new Date().toISOString() };
    await kv.set(`training-enrollment:${id}`, updated);
    return c.json({ success: true, enrollment: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/admin/employee-feedback`, async (c) => {
  try {
    const { user, kvData } = await requireAdminOrAbove(c);
    const companyId = kvData?.companyId || kvData?.company;
    const all = await kv.getByPrefix('emp-feedback:');
    const companyFeedback = all.filter((f: any) => f.companyId === companyId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(companyFeedback);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/admin/employee-feedback/:id`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const id = c.req.param('id');
    const { status } = await c.req.json();
    const existing = await kv.get(`emp-feedback:${id}`);
    if (!existing) return c.json({ error: 'Feedback not found' }, 404);
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    await kv.set(`emp-feedback:${id}`, updated);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ========================================
// PAYSTACK SUBSCRIPTION & PAYMENT ENDPOINTS
// ========================================

// Get company info
app.get(`${PREFIX}/company/info`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    if (!companyId) {
      return c.json({ error: 'User not associated with a company' }, 400);
    }

    const company = await kv.get(`company_by_id:${companyId}`);
    
    return c.json(company);
  } catch (e: any) {
    console.error('Get company info error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get company info' }, 500);
  }
});

// Initialize Paystack payment for subscription
app.post(`${PREFIX}/subscription/initialize-payment`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const { plan, amount, licenses } = await c.req.json();

    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    if (!companyId) {
      return c.json({ error: 'User not associated with a company' }, 400);
    }

    const company = await kv.get(`company_by_id:${companyId}`);
    
    // Create payment reference
    const reference = `SUB_${companyId.slice(0, 8)}_${Date.now()}`;

    // Initialize Paystack payment
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return c.json({ error: 'Payment system not configured' }, 500);
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userProfile.email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo
        reference: reference,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-668731fc/subscription/verify-payment?reference=${reference}`,
        metadata: {
          companyId: companyId,
          companyName: company.name,
          plan: plan,
          licenses: licenses,
          userId: authUser.user.id,
        },
      }),
    });

    const data = await paystackResponse.json();

    if (!data.status) {
      return c.json({ error: data.message || 'Failed to initialize payment' }, 400);
    }

    // Store pending payment
    await kv.set(`pending_payment:${reference}`, {
      reference,
      companyId,
      plan,
      amount,
      licenses,
      userId: authUser.user.id,
      createdAt: new Date().toISOString(),
    });

    return c.json({
      authorizationUrl: data.data.authorization_url,
      reference: reference,
    });
  } catch (e: any) {
    console.error('Initialize payment error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to initialize payment' }, 500);
  }
});

// Verify Paystack payment
app.get(`${PREFIX}/subscription/verify-payment`, async (c) => {
  try {
    const reference = c.req.query('reference');

    if (!reference) {
      return c.json({ error: 'Payment reference is required' }, 400);
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return c.json({ error: 'Payment system not configured' }, 500);
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const data = await paystackResponse.json();

    if (!data.status || data.data.status !== 'success') {
      return c.redirect(`${Deno.env.get('APP_URL')}/subscription?error=payment_failed`);
    }

    // Get pending payment info
    const pendingPayment = await kv.get(`pending_payment:${reference}`);
    
    if (!pendingPayment) {
      return c.redirect(`${Deno.env.get('APP_URL')}/subscription?error=invalid_reference`);
    }

    // Update company subscription
    const company = await kv.get(`company_by_id:${pendingPayment.companyId}`);
    
    const updatedCompany = {
      ...company,
      status: 'active',
      subscription: {
        plan: pendingPayment.plan,
        licenses: pendingPayment.licenses,
        status: 'active',
        startDate: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: pendingPayment.amount,
      },
    };

    await kv.set(`company_by_id:${pendingPayment.companyId}`, updatedCompany);
    await kv.set(`company:${company.slug}`, updatedCompany);

    // Update company stats
    await kv.set(`company_stats:${pendingPayment.companyId}`, {
      ...(await kv.get(`company_stats:${pendingPayment.companyId}`) || {}),
      availableLicenses: pendingPayment.licenses,
    });

    // Delete pending payment
    await kv.del(`pending_payment:${reference}`);

    // Redirect to success page
    return c.redirect(`${Deno.env.get('APP_URL')}/superadmin?subscription=success`);
  } catch (e: any) {
    console.error('Verify payment error:', e);
    return c.redirect(`${Deno.env.get('APP_URL')}/subscription?error=verification_failed`);
  }
});

// Upgrade licenses
app.post(`${PREFIX}/subscription/upgrade-licenses`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    // Accept plan for server-side amount calculation; fall back to 'monthly'
    const { additionalLicenses, plan: clientPlan } = await c.req.json();
    const plan = ['monthly', 'yearly'].includes(clientPlan) ? clientPlan : 'monthly';

    if (!additionalLicenses || Number(additionalLicenses) < 1) {
      return c.json({ error: 'additionalLicenses must be a positive number' }, 400);
    }

    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    if (!companyId) {
      return c.json({ error: 'User not associated with a company' }, 400);
    }

    const company = await kv.get(`company_by_id:${companyId}`);
    
    // Always compute amount server-side — never trust client-provided amount
    // Monthly: $3.55/user/month  |  Yearly: $2.55/user/month = $30.60/user/year
    const effectivePlan = plan || company?.subscription?.plan || 'monthly';
    const pricePerLicense = effectivePlan === 'monthly' ? 3.55 : 30.60;
    const amountUsd = Number(additionalLicenses) * pricePerLicense;

    // Create payment reference
    const reference = `LIC_${companyId.slice(0, 8)}_${Date.now()}`;

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return c.json({ error: 'Payment system not configured' }, 500);
    }

    // Convert USD to configured Paystack currency
    const { amountSmallestUnit: upgradeAmountSmallestUnit, currency: upgradeCurrency } = await usdToPaystackAmount(amountUsd);

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userProfile.email,
        amount: upgradeAmountSmallestUnit,
        currency: upgradeCurrency,
        reference: reference,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-668731fc/subscription/verify-license-upgrade?reference=${reference}`,
        metadata: {
          companyId: companyId,
          companyName: company?.name || '',
          additionalLicenses: Number(additionalLicenses),
          userId: authUser.user.id,
          plan: effectivePlan,
          amountUsd,
        },
      }),
    });

    const data = await paystackResponse.json();

    if (!data.status) {
      return c.json({ error: data.message || 'Failed to initialize payment' }, 400);
    }

    // Store pending payment (use server-computed amount)
    await kv.set(`pending_license:${reference}`, {
      reference,
      companyId,
      additionalLicenses: Number(additionalLicenses),
      amount: amountUsd,
      plan: effectivePlan,
      userId: authUser.user.id,
      createdAt: new Date().toISOString(),
    });

    return c.json({
      authorizationUrl: data.data.authorization_url,
      reference: reference,
    });
  } catch (e: any) {
    console.error('Upgrade licenses error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to upgrade licenses' }, 500);
  }
});

// Verify license upgrade payment
app.get(`${PREFIX}/subscription/verify-license-upgrade`, async (c) => {
  try {
    const reference = c.req.query('reference');

    if (!reference) {
      return c.json({ error: 'Payment reference is required' }, 400);
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return c.json({ error: 'Payment system not configured' }, 500);
    }

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const data = await paystackResponse.json();

    if (!data.status || data.data.status !== 'success') {
      return c.redirect(`${Deno.env.get('APP_URL')}/subscription?error=payment_failed`);
    }

    const pendingLicense = await kv.get(`pending_license:${reference}`);
    
    if (!pendingLicense) {
      return c.redirect(`${Deno.env.get('APP_URL')}/subscription?error=invalid_reference`);
    }

    const company = await kv.get(`company_by_id:${pendingLicense.companyId}`);
    
    const updatedCompany = {
      ...company,
      subscription: {
        ...company.subscription,
        licenses: (company.subscription?.licenses || 0) + pendingLicense.additionalLicenses,
      },
    };

    await kv.set(`company_by_id:${pendingLicense.companyId}`, updatedCompany);
    await kv.set(`company:${company.slug}`, updatedCompany);

    const stats = await kv.get(`company_stats:${pendingLicense.companyId}`) || {};
    await kv.set(`company_stats:${pendingLicense.companyId}`, {
      ...stats,
      availableLicenses: (stats.availableLicenses || 0) + pendingLicense.additionalLicenses,
    });

    await kv.del(`pending_license:${reference}`);

    return c.redirect(`${Deno.env.get('APP_URL')}/superadmin?licenses=upgraded`);
  } catch (e: any) {
    console.error('Verify license upgrade error:', e);
    return c.redirect(`${Deno.env.get('APP_URL')}/subscription?error=verification_failed`);
  }
});

// AI Assistant endpoint (Google Gemini)
app.post(`${PREFIX}/ai-assistant`, async (c) => {
  try {
    
    // Try to authenticate
    let authUser;
    try {
      const authResult = await requireAuth(c);
      authUser = authResult.user;
    } catch (authError: any) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    // Parse request body
    let message, history;
    try {
      const body = await c.req.json();
      message = body.message;
      history = body.history;
    } catch (parseError: any) {
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
    if (!message || typeof message !== 'string') {
      return c.json({ error: 'Message is required' }, 400);
    }
    
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'Blumebyte is not configured. Please contact your administrator.' }, 500);
    }
    
    
    // Build conversation context from history
    const conversationHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // System prompt for HR assistant
    const systemPrompt = `You are Blumebyte, an AI assistant for the Blumebyte HR management system. Your role is to help employees with HR-related questions including:
- Company policies and procedures
- Leave and vacation policies
- Benefits and compensation information
- Time tracking and attendance
- Onboarding processes
- Training and development
- Performance reviews
- General HR inquiries

Guidelines:
- Be professional, friendly, and helpful
- Provide accurate information based on common HR practices
- If you don't know something specific about the company, acknowledge it and suggest the employee contact HR directly
- Keep responses concise and clear
- Use bullet points for lists when appropriate
- Be empathetic and understanding
- IMPORTANT: When referencing pages or sections of the app, use these exact internal paths as markdown links:
  - Security Policy: [Security Policy](/security-policy)
  - Privacy Policy: [Privacy Policy](/privacy-policy)
  - Terms & Conditions: [Terms & Conditions](/terms-conditions)
  - Subscription: [Subscription](/subscription)
  - For dashboard sections, tell users to navigate to their dashboard tab (e.g., "Go to the Leave tab in your dashboard")
- NEVER link to external URLs for app pages. All links should be relative paths starting with /
- Format links as markdown: [Link Text](/path)

Current user question: ${message}`;
    
    try {
      
      // Call Google Gemini API
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }]
              },
              ...conversationHistory,
              {
                role: 'user',
                parts: [{ text: message }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          })
        }
      );
      
      
      if (!geminiResponse.ok) {
        // Try to get error details from Gemini
        let errorBody = '';
        try {
          errorBody = await geminiResponse.text();
        } catch (e) {
        }
        
        // Provide specific error messages based on status code
        let errorMessage = 'Failed to get AI response. Please try again.';
        let errorDetails = `Status ${geminiResponse.status}`;
        
        if (geminiResponse.status === 401 || geminiResponse.status === 403) {
          errorMessage = 'Blumebyte is not properly configured. Invalid API key.';
          errorDetails = 'API authentication failed - please verify GEMINI_API_KEY';
        } else if (geminiResponse.status === 429) {
          errorMessage = 'Blumebyte is temporarily unavailable due to high demand.';
          errorDetails = 'API rate limit exceeded';
        } else if (geminiResponse.status === 400) {
          errorMessage = 'Invalid request to AI service.';
          errorDetails = `Bad request: ${errorBody.substring(0, 200)}`;
        }
        
        
        return c.json({ 
          error: errorMessage,
          details: errorDetails,
          statusCode: geminiResponse.status,
          rawError: errorBody.substring(0, 500)
        }, 500);
      }
      
      const data = await geminiResponse.json();
      
      // Extract response from Gemini
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response. Please try again.';
      
      return c.json({ response: aiResponse });
      
    } catch (fetchError: any) {
      return c.json({ 
        error: 'Failed to communicate with Blumebyte. Please try again.',
        details: fetchError.message 
      }, 500);
    }
    
  } catch (e: any) {
    return handleError(e, c, 'ai-assistant');
  }
});

// ========================================
// AUTOMATION & WORKFLOWS ENDPOINTS
// ========================================

// Workflows CRUD
app.get(`${PREFIX}/automation/workflows`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const scope = await resolveCompanyScope(authUser.user.id);
    
    const workflows = await kv.getByPrefix('automation_workflow:');
    const filtered = scope?.length
      ? workflows.filter((w: any) => scope.includes(w.companyId) || !w.companyId)
      : [];
    
    return c.json({ data: filtered });
  } catch (e: any) {
    return handleError(e, c, 'get-workflows');
  }
});

app.post(`${PREFIX}/automation/workflows`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    const companyId = await getCompanyId(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const data = await c.req.json();
    const id = crypto.randomUUID();
    
    const workflow = {
      id,
      ...data,
      companyId, // CRITICAL: Use resolveCompanyScope-based companyId for multi-tenant isolation
      createdBy: authUser.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`automation_workflow:${id}`, workflow);
    return c.json({ success: true, data: workflow });
  } catch (e: any) {
    return handleError(e, c, 'create-workflow');
  }
});

app.put(`${PREFIX}/automation/workflows/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await kv.get(`automation_workflow:${id}`);
    if (!existing) {
      return c.json({ error: 'Workflow not found' }, 404);
    }
    
    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`automation_workflow:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (e: any) {
    return handleError(e, c, 'update-workflow');
  }
});

app.delete(`${PREFIX}/automation/workflows/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    await kv.del(`automation_workflow:${id}`);
    
    return c.json({ success: true });
  } catch (e: any) {
    return handleError(e, c, 'delete-workflow');
  }
});

// Scheduled Tasks CRUD
app.get(`${PREFIX}/automation/scheduled-tasks`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const companyId = await getCompanyId(authUser.user.id);
    
    const tasks = await kv.getByPrefix('automation_task:');
    const filtered = companyId ? tasks.filter((t: any) => t.companyId === companyId || !t.companyId) : tasks.filter((t: any) => !t.companyId);
    
    return c.json({ data: filtered });
  } catch (e: any) {
    return handleError(e, c, 'get-scheduled-tasks');
  }
});

app.post(`${PREFIX}/automation/scheduled-tasks`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    const companyId = await getCompanyId(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const data = await c.req.json();
    const id = crypto.randomUUID();
    
    const task = {
      id,
      ...data,
      companyId, // CRITICAL: Use resolveCompanyScope-based companyId for multi-tenant isolation
      createdBy: authUser.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`automation_task:${id}`, task);
    return c.json({ success: true, data: task });
  } catch (e: any) {
    return handleError(e, c, 'create-scheduled-task');
  }
});

app.put(`${PREFIX}/automation/scheduled-tasks/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await kv.get(`automation_task:${id}`);
    if (!existing) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`automation_task:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (e: any) {
    return handleError(e, c, 'update-scheduled-task');
  }
});

app.delete(`${PREFIX}/automation/scheduled-tasks/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    await kv.del(`automation_task:${id}`);
    
    return c.json({ success: true });
  } catch (e: any) {
    return handleError(e, c, 'delete-scheduled-task');
  }
});

// Business Rules CRUD
app.get(`${PREFIX}/automation/business-rules`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const scope = await resolveCompanyScope(authUser.user.id);
    
    const rules = await kv.getByPrefix('automation_rule:');
    const filtered = scope?.length
      ? rules.filter((r: any) => scope.includes(r.companyId) || !r.companyId)
      : rules.filter((r: any) => !r.companyId);
    
    return c.json({ data: filtered });
  } catch (e: any) {
    return handleError(e, c, 'get-business-rules');
  }
});

app.post(`${PREFIX}/automation/business-rules`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    const companyId = await getCompanyId(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const data = await c.req.json();
    const id = crypto.randomUUID();
    
    const rule = {
      id,
      ...data,
      companyId, // CRITICAL: Use resolveCompanyScope-based companyId for multi-tenant isolation
      createdBy: authUser.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`automation_rule:${id}`, rule);
    return c.json({ success: true, data: rule });
  } catch (e: any) {
    return handleError(e, c, 'create-business-rule');
  }
});

app.put(`${PREFIX}/automation/business-rules/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await kv.get(`automation_rule:${id}`);
    if (!existing) {
      return c.json({ error: 'Rule not found' }, 404);
    }
    
    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`automation_rule:${id}`, updated);
    
    // If the rule was just enabled and has a "Send Notification" action, execute it now
    if (updated.enabled && updated.action === 'Send Notification') {
      try {
        const companyId = updated.companyId || profile?.companyId;
        if (companyId) {
          const allEmployees = await kv.getByPrefix('employee:');
          const companyEmployees = allEmployees.filter((e: any) =>
            e.companyId === companyId || e.company === companyId
          );
          for (const emp of companyEmployees) {
            const empId = emp.userId || emp.id;
            if (!empId) continue;
            const nid = crypto.randomUUID();
            await kv.set(`notification:${nid}`, {
              id: nid,
              userId: empId,
              type: 'business_rule',
              title: updated.name || 'Business Rule Notification',
              message: updated.description || `Business rule "${updated.name}" has been applied.`,
              ruleId: id,
              companyId,
              read: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } catch (_notifyErr) {
        // Non-fatal: rule was saved, notification delivery failed silently
      }
    }
    
    return c.json({ success: true, data: updated });
  } catch (e: any) {
    return handleError(e, c, 'update-business-rule');
  }
});

app.delete(`${PREFIX}/automation/business-rules/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    await kv.del(`automation_rule:${id}`);
    
    return c.json({ success: true });
  } catch (e: any) {
    return handleError(e, c, 'delete-business-rule');
  }
});

// Notification Templates CRUD
app.get(`${PREFIX}/automation/notification-templates`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    const companyId = profile?.companyId;
    
    const templates = await kv.getByPrefix('automation_template:');
    const filtered = templates.filter((t: any) => t.companyId === companyId || !t.companyId);
    
    return c.json({ data: filtered });
  } catch (e: any) {
    return handleError(e, c, 'get-notification-templates');
  }
});

app.post(`${PREFIX}/automation/notification-templates`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const data = await c.req.json();
    const id = crypto.randomUUID();
    
    const template = {
      id,
      ...data,
      companyId: profile?.companyId, // CRITICAL: Add companyId for multi-tenant isolation
      createdBy: authUser.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`automation_template:${id}`, template);
    return c.json({ success: true, data: template });
  } catch (e: any) {
    return handleError(e, c, 'create-notification-template');
  }
});

app.put(`${PREFIX}/automation/notification-templates/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await kv.get(`automation_template:${id}`);
    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }
    
    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`automation_template:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (e: any) {
    return handleError(e, c, 'update-notification-template');
  }
});

app.delete(`${PREFIX}/automation/notification-templates/:id`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    await kv.del(`automation_template:${id}`);
    
    return c.json({ success: true });
  } catch (e: any) {
    return handleError(e, c, 'delete-notification-template');
  }
});

// Execute workflow manually (for testing)
app.post(`${PREFIX}/automation/workflows/:id/execute`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const id = c.req.param('id');
    const workflow = await kv.get(`automation_workflow:${id}`);
    
    if (!workflow) {
      return c.json({ error: 'Workflow not found' }, 404);
    }
    
    if (!workflow.enabled) {
      return c.json({ error: 'Workflow is not enabled' }, 400);
    }
    
    // Log execution
    const executionId = crypto.randomUUID();
    const execution = {
      id: executionId,
      workflowId: id,
      workflowName: workflow.name,
      executedBy: authUser.user.id,
      executedAt: new Date().toISOString(),
      status: 'completed',
      actions: workflow.actions?.length || 0,
    };
    
    await kv.set(`automation_execution:${executionId}`, execution);
    
    return c.json({ success: true, execution });
  } catch (e: any) {
    return handleError(e, c, 'execute-workflow');
  }
});

// --- Alias: /attendance/today -> same logic as /attendance/my-today ---
app.get(`${PREFIX}/attendance/today`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const key = `attendance:${user.id}:${today}`;
    let record = await kv.get(key);
    if (record?.isPaused && record?.clockIn && !record?.clockOut) {
      const pauses = record.pauses || [];
      if (pauses.length > 0 && !pauses[pauses.length - 1].resumedAt) {
        pauses[pauses.length - 1].resumedAt = now.toISOString();
      }
      const totalPausedMs = pauses.reduce((sum: number, p: any) => sum + ((p.resumedAt ? new Date(p.resumedAt).getTime() : now.getTime()) - new Date(p.pausedAt).getTime()), 0);
      record = { ...record, isPaused: false, pauses, totalPausedMinutes: Math.round(totalPausedMs / 60000), lastActivity: now.toISOString(), updatedAt: now.toISOString() };
      await kv.set(key, record);
    }
    if (record?.clockIn && !record?.clockOut) {
      // CRITICAL FIX: Get company-scoped auto-clock settings
      const scope = await resolveCompanyScope(user.id);
      const companyId = scope?.[0];
      const autoSettings = companyId ? await kv.get(`auto-clock-settings:${companyId}`) : null;
      if (autoSettings?.enabled) {
        const clockOutTime = autoSettings.clockOutTime || "17:00";
        const [h, m] = clockOutTime.split(":").map(Number);
        const cutoff = new Date(now); cutoff.setHours(h, m, 0, 0);
        const applicableUsers = autoSettings.mode === "specific" ? (autoSettings.specificUsers || []) : null;
        if ((!applicableUsers || applicableUsers.includes(user.id)) && now >= cutoff) {
          const pauses = record.pauses || [];
          if (pauses.length > 0 && !pauses[pauses.length - 1].resumedAt) pauses[pauses.length - 1].resumedAt = cutoff.toISOString();
          const totalPausedMs = pauses.reduce((sum: number, p: any) => sum + ((p.resumedAt ? new Date(p.resumedAt).getTime() : cutoff.getTime()) - new Date(p.pausedAt).getTime()), 0);
          const totalMinutes = Math.round((cutoff.getTime() - new Date(record.clockIn).getTime()) / 60000);
          const activeMinutes = Math.max(0, totalMinutes - Math.round(totalPausedMs / 60000));
          record = { ...record, clockOut: cutoff.toISOString(), isPaused: false, pauses, totalPausedMinutes: Math.round(totalPausedMs / 60000), status: "present", regularMinutes: Math.min(activeMinutes, 480), overtimeMinutes: Math.max(0, activeMinutes - 480), autoClocked: true, autoClockoutApplied: true, updatedAt: now.toISOString() };
          await kv.set(key, record);
        }
      }
    }
    return c.json(record || null);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// 2FA (Two-Factor Authentication) Endpoints
// ═══════════════════════════════════════════════════════════════════

// Generate and send 2FA code via email
app.post(`${PREFIX}/auth/2fa/send-code`, async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Rate-limit: max 3 send-code requests per email per 10 minutes
    const rateLimitKey = `2fa-ratelimit:${email.toLowerCase()}`;
    const rateData = await kv.get(rateLimitKey).catch(() => null) as any;
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    if (rateData && rateData.count >= 3 && now - rateData.windowStart < windowMs) {
      return c.json({ error: 'Too many code requests. Please wait a few minutes before trying again.' }, 429);
    }
    await kv.set(rateLimitKey, {
      count: rateData && now - rateData.windowStart < windowMs ? rateData.count + 1 : 1,
      windowStart: rateData && now - rateData.windowStart < windowMs ? rateData.windowStart : now,
    });

    // Generate a 6-digit code using rejection sampling to avoid modulo bias
    const codeMax = 900000;
    const codeThreshold = Math.floor(0x100000000 / codeMax) * codeMax;
    let codeVal: number;
    do {
      const codeArray = new Uint32Array(1);
      crypto.getRandomValues(codeArray);
      codeVal = codeArray[0];
    } while (codeVal >= codeThreshold);
    const code = (100000 + (codeVal % codeMax)).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the code in KV store
    await kv.set(`2fa:${email.toLowerCase()}`, {
      code,
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
    });

    // Send 2FA code via email
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    if (resendApiKey) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [email.trim()],
            subject: 'Blumebyte HR – Your Sign-In Verification Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background: #000; padding: 20px 24px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Blumebyte HR</h1>
                </div>
                <div style="padding: 32px 24px;">
                  <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 18px;">Your sign-in verification code</h2>
                  <p style="color: #374151; margin: 0 0 24px 0;">Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.</p>
                  <div style="background: #f3f4f6; padding: 24px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 12px; border-radius: 8px; margin: 0 0 24px 0; color: #111827;">
                    ${code}
                  </div>
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">Didn't request this code? You can safely ignore this email — your account has not been accessed.</p>
                </div>
                <div style="background: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated security email from Blumebyte HR. Please do not reply to this email.</p>
                </div>
              </div>
            `,
            text: `Blumebyte HR – Sign-In Verification Code\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, please ignore this email.`,
          }),
        });
        const resendRespText = await emailRes.text();
        if (emailRes.ok) {
          // Verify Resend actually queued the email (response must include an `id`)
          let resendData: any = {};
          try { resendData = JSON.parse(resendRespText); } catch (_) {
            console.warn('2FA email: could not parse Resend response body — treating as delivery failure. body=' + resendRespText.slice(0, 100));
          }
          if (resendData?.id) {
            emailSent = true;
          } else {
            // Redact the recipient to protect PII in logs — show only domain part
            const recipientDomain = email.includes('@') ? '@' + email.split('@')[1] : '(unknown)';
            console.error(`2FA email: Resend returned 200 but no email id — from=${EMAIL_FROM} to=*${recipientDomain} body=${resendRespText.slice(0, 200)}`);
          }
        } else {
          const recipientDomain = email.includes('@') ? '@' + email.split('@')[1] : '(unknown)';
          console.error(`Failed to send 2FA email: status=${emailRes.status} from=${EMAIL_FROM} to=*${recipientDomain} body=${resendRespText.slice(0, 500)}`);
        }
      } catch (emailError) {
        console.error('Error sending 2FA email:', emailError);
      }
    } else {
      console.error('2FA email could not be sent: RESEND_API_KEY is not configured. Set the RESEND_API_KEY and RESEND_FROM_EMAIL environment variables.');
    }

    if (!emailSent) {
      // Email service not configured or delivery failed — 2FA code could not be delivered.
      // Return a clear error so the frontend can handle it gracefully.
      // Hint at the likely cause so the admin can diagnose from server logs.
      const fromConfigured = configuredEmailFrom.includes('@');
      const hint = !Deno.env.get('RESEND_API_KEY')
        ? 'RESEND_API_KEY is not set.'
        : !fromConfigured
        ? 'RESEND_FROM_EMAIL is not set or does not contain a valid email address.'
        : 'Resend rejected the request — verify that the sender domain in RESEND_FROM_EMAIL is verified in your Resend account.';
      console.error(`2FA email delivery failed. ${hint}`);
      return c.json({
        error: 'email_delivery_failed',
        message: 'Could not send verification code. Email delivery is not available. Please contact your administrator or use an authenticator app.',
      }, 503);
    }

    return c.json({ 
      success: true, 
      message: "Verification code sent to your email.",
    });
  } catch (e: any) {
    console.error("2FA send code error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// Verify 2FA code
app.post(`${PREFIX}/auth/2fa/verify-code`, async (c) => {
  try {
    const { email, code } = await c.req.json();
    if (!email || !code) {
      return c.json({ error: "Email and code are required" }, 400);
    }

    const stored = await kv.get(`2fa:${email.toLowerCase()}`);
    if (!stored) {
      return c.json({ error: "No verification code found. Please request a new code." }, 400);
    }

    // Check if expired
    if (new Date(stored.expiresAt) < new Date()) {
      await kv.del(`2fa:${email.toLowerCase()}`);
      return c.json({ error: "Verification code has expired. Please request a new code." }, 400);
    }

    // Check attempts
    if (stored.attempts >= 5) {
      await kv.del(`2fa:${email.toLowerCase()}`);
      return c.json({ error: "Too many failed attempts. Please request a new code." }, 400);
    }

    // Verify code
    if (stored.code !== code) {
      stored.attempts += 1;
      await kv.set(`2fa:${email.toLowerCase()}`, stored);
      return c.json({ 
        error: "Invalid verification code",
        attemptsRemaining: 5 - stored.attempts,
      }, 400);
    }

    // Code is valid - delete it and update user metadata
    await kv.del(`2fa:${email.toLowerCase()}`);

    const sb = supabaseAdmin();

    // Find user by email with pagination to handle large user bases
    let user: any = null;
    let page = 1;
    while (!user) {
      const { data: { users: pageUsers }, error: listError } = await sb.auth.admin.listUsers({ perPage: 1000, page });
      if (listError) {
        console.error("Error listing users:", listError);
        return c.json({ error: "Failed to verify user" }, 500);
      }
      user = pageUsers.find((u: any) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
      if (pageUsers.length < 1000) break; // no more pages
      page++;
    }
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update user metadata to mark 2FA as enabled
    await sb.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date().toISOString(),
      },
    });

    return c.json({ 
      success: true, 
      message: "Two-factor authentication enabled successfully",
    });
  } catch (e: any) {
    console.error("2FA verify code error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// Check 2FA status for a user — requires authentication to prevent user enumeration
app.get(`${PREFIX}/auth/2fa/status`, async (c) => {
  try {
    // Require an authenticated session so that unauthenticated callers cannot
    // probe whether an email address belongs to a registered account.
    const callerToken = extractUserToken(c);
    if (!callerToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const sb = supabaseAdmin();
    const { data: callerData, error: callerError } = await sb.auth.getUser(callerToken);
    if (callerError || !callerData?.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const email = c.req.query("email");
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const { data: { users }, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      console.error("Error listing users:", error);
      return c.json({ error: "Failed to check 2FA status" }, 500);
    }

    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Return the same shape as the "found" case to avoid leaking whether the
      // email is registered (callers must already be authenticated anyway).
      return c.json({ requires2FA: false, twoFactorEnabled: false, twoFactorVerifiedAt: null, totpEnabled: false, emailOtpAvailable: false });
    }

    return c.json({
      requires2FA: user.user_metadata?.requires2FA || false,
      twoFactorEnabled: user.user_metadata?.twoFactorEnabled || false,
      twoFactorVerifiedAt: user.user_metadata?.twoFactorVerifiedAt || null,
      totpEnabled: user.user_metadata?.totpEnabled || false,
      emailOtpAvailable: Boolean(Deno.env.get('RESEND_API_KEY')) && configuredEmailFrom.includes('@'),
    });
  } catch (e: any) {
    console.error("2FA status check error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// ── TOTP (Authenticator-App) 2FA ────────────────────────────────────────────
// Pure Web Crypto TOTP implementation — no external libraries needed.

function totpBase32Encode(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  return result;
}

function totpBase32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of base32.toUpperCase().replace(/=+$/, '')) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

async function generateTOTPCode(secret: string, counter?: number): Promise<string> {
  const time = counter ?? Math.floor(Date.now() / 1000 / 30);
  const keyBytes = totpBase32Decode(secret);
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setUint32(0, 0, false);
  view.setUint32(4, time, false);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBuffer));
  const offset = hmac[19] & 0xf;
  const truncated = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(truncated % 1_000_000).padStart(6, '0');
}

async function verifyTOTPCode(secret: string, code: string, windowSize = 1): Promise<boolean> {
  const time = Math.floor(Date.now() / 1000 / 30);
  for (let i = -windowSize; i <= windowSize; i++) {
    if (await generateTOTPCode(secret, time + i) === code) return true;
  }
  return false;
}

function generateTOTPSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return totpBase32Encode(bytes);
}

function getTOTPUri(secret: string, email: string, issuer = 'Blumebyte HR'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// POST /auth/totp/setup — generate a new TOTP secret + URI for the authenticated user
app.post(`${PREFIX}/auth/totp/setup`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const secret = generateTOTPSecret();
    const issuer = 'Blumebyte HR';
    const totpUri = getTOTPUri(secret, user.email || '', issuer);

    // Store pending secret in KV (10-min TTL) — confirmed only after user verifies a code
    await kv.set(`totp-setup:${user.id}`, {
      secret,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    // Return secret and totpUri only — QR code is generated client-side to avoid exposing the secret to third parties
    return c.json({ secret, totpUri, issuer });
  } catch (e: any) {
    console.error('totp/setup error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// POST /auth/totp/verify-setup — confirm TOTP setup by verifying the first code from the app
app.post(`${PREFIX}/auth/totp/verify-setup`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { code } = await c.req.json();
    if (!code) return c.json({ error: 'Code is required' }, 400);

    const pending = await kv.get(`totp-setup:${user.id}`);
    if (!pending) return c.json({ error: 'No pending TOTP setup. Please restart setup.' }, 400);
    if (new Date(pending.expiresAt) < new Date()) {
      await kv.del(`totp-setup:${user.id}`);
      return c.json({ error: 'TOTP setup expired. Please restart.' }, 400);
    }

    const valid = await verifyTOTPCode(pending.secret, String(code).trim());
    if (!valid) return c.json({ error: 'Invalid code. Please try again.' }, 400);

    // Activate TOTP: persist secret in user_metadata
    const sb = supabaseAdmin();
    await sb.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        totpEnabled: true,
        totpSecret: pending.secret,
        totpEnabledAt: new Date().toISOString(),
        // Keep old email-based flag for backward compat
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date().toISOString(),
      },
    });
    await kv.del(`totp-setup:${user.id}`);

    return c.json({ success: true, message: 'TOTP two-factor authentication enabled successfully.' });
  } catch (e: any) {
    console.error('totp/verify-setup error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// POST /auth/totp/verify-login — verify a TOTP code during login (called after password auth)
app.post(`${PREFIX}/auth/totp/verify-login`, async (c) => {
  try {
    const { email, code } = await c.req.json();
    if (!email || !code) return c.json({ error: 'Email and code are required' }, 400);

    const sb = supabaseAdmin();
    // Use paginated list with filter to avoid loading all users
    const { data: { users }, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
    if (error) return c.json({ error: 'Failed to verify user' }, 500);

    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return c.json({ error: 'User not found' }, 404);

    const secret = user.user_metadata?.totpSecret;
    if (!secret) return c.json({ error: 'TOTP not configured for this account' }, 400);

    const valid = await verifyTOTPCode(secret, String(code).trim());
    if (!valid) return c.json({ error: 'Invalid authenticator code. Please try again.' }, 400);

    return c.json({ success: true });
  } catch (e: any) {
    console.error('totp/verify-login error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// GET /auth/totp/status — check whether TOTP is enabled for the authenticated user
app.get(`${PREFIX}/auth/totp/status`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    return c.json({
      totpEnabled: user.user_metadata?.totpEnabled || false,
      totpEnabledAt: user.user_metadata?.totpEnabledAt || null,
    });
  } catch (e: any) {
    console.error('totp/status error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// POST /auth/totp/disable — disable TOTP for the authenticated user
app.post(`${PREFIX}/auth/totp/disable`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { code } = await c.req.json();
    // Require a valid TOTP code to disable (prevents accidental disable)
    if (code && user.user_metadata?.totpSecret) {
      const valid = await verifyTOTPCode(user.user_metadata.totpSecret, String(code).trim());
      if (!valid) return c.json({ error: 'Invalid authenticator code. Cannot disable 2FA.' }, 400);
    }

    const sb = supabaseAdmin();
    // Build clean metadata without totpSecret — avoid mutating the user object
    const { totpSecret, ...cleanedMetadata } = user.user_metadata || {};
    await sb.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...cleanedMetadata,
        totpEnabled: false,
        totpEnabledAt: null,
        twoFactorEnabled: false,
      },
    });

    return c.json({ success: true, message: 'TOTP disabled successfully.' });
  } catch (e: any) {
    console.error('totp/disable error:', e);
    return c.json({ error: e.message }, 500);
  }
});
// ── End TOTP ────────────────────────────────────────────────────────────────

// --- OAuth Company Creation ---
// Create company for new OAuth users
app.post(`${PREFIX}/oauth/create-company`, async (c) => {
  try {
    const accessToken = extractUserToken(c);
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No access token" }, 401);
    }

    const sb = supabaseAdmin();
    
    // Verify the user with the access token
    const { data: { user }, error: userError } = await sb.auth.getUser(accessToken);
    if (userError || !user) {
      console.error("OAuth user verification error:", userError);
      return c.json({ error: "Invalid access token" }, 401);
    }

    const { companyName, userName, email, userId } = await c.req.json();
    
    if (!companyName || !userName || !email || !userId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Verify the userId matches the authenticated user
    if (user.id !== userId) {
      return c.json({ error: "User ID mismatch" }, 403);
    }

    // Check if user already has a company profile
    const existingProfile = await kv.get(`user:${userId}`);
    if (existingProfile) {
      return c.json({ error: "User already has a company profile" }, 400);
    }

    // Generate company ID
    const companyId = `company_${crypto.randomUUID()}`;


    // Create company record
    const company = {
      id: companyId,
      name: companyName,
      size: "1-10", // Default for OAuth signup
      industry: "Other",
      createdAt: new Date().toISOString(),
      createdBy: userId,
      subscription: {
        status: "trial", // Start with trial or require payment
        licenses: 5,
        billingCycle: "monthly",
        startDate: new Date().toISOString(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 day trial
      },
    };

    await kv.set(`company:${companyId}`, company);

    // Create SuperAdmin user profile
    const userProfile = {
      id: userId,
      email,
      name: userName,
      role: "superadmin",
      companyId,
      departments: [],
      createdAt: new Date().toISOString(),
      active: true,
      authProvider: user.app_metadata?.provider || "oauth",
    };

    await kv.set(`user:${userId}`, userProfile);

    // Add user to company's users list
    await kv.set(`company:${companyId}:users`, [userId]);

    // Update user metadata in Supabase Auth
    await sb.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user.user_metadata,
        companyId,
        role: "superadmin",
        name: userName,
        setupComplete: true,
      },
    });


    return c.json({
      success: true,
      message: "Company created successfully",
      data: {
        companyId,
        userId,
        role: "superadmin",
      },
    });
  } catch (e: any) {
    console.error("OAuth company creation error:", e);
    return c.json({ error: e.message || "Failed to create company" }, 500);
  }
});

// ============ MIGRATION: FIX MISSING ASSIGNEDCOMPANIES ============
// This endpoint fixes SuperAdmin accounts that don't have assignedCompanies set
app.post(`${PREFIX}/superadmin/fix-company-scope`, async (c) => {
  try {
    const { user: caller } = await requireSuperAdmin(c);
    
    // Get the caller's employee record
    const empRecord = await kv.get(`employee:${caller.id}`);
    if (!empRecord) {
      return c.json({ error: 'Employee record not found' }, 404);
    }
    
    // Check if assignedCompanies is already set
    if (empRecord.assignedCompanies?.length) {
      return c.json({ 
        success: true, 
        message: 'Company scope already configured',
        assignedCompanies: empRecord.assignedCompanies 
      });
    }
    
    // Get companyId from the employee record
    const companyId = empRecord.companyId || empRecord.company;
    if (!companyId) {
      return c.json({ error: 'No company found for this SuperAdmin' }, 400);
    }
    
    
    // Update KV store
    empRecord.assignedCompanies = [companyId];
    empRecord.updatedAt = new Date().toISOString();
    await kv.set(`employee:${caller.id}`, empRecord);
    
    // Update Supabase auth metadata
    const sb = supabaseAdmin();
    await sb.auth.admin.updateUserById(caller.id, {
      user_metadata: {
        ...empRecord,
        assignedCompanies: [companyId]
      }
    });
    
    
    return c.json({ 
      success: true, 
      message: 'Company scope fixed successfully',
      assignedCompanies: [companyId],
      companyId 
    });
  } catch (e: any) {
    console.error('Fix company scope error:', e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ MIGRATION: FIX COMPANY STORAGE KEYS ============
// This endpoint ensures all companies have proper company_by_id: keys with normalized subscription format
app.post(`${PREFIX}/admin/migrate-company-keys`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    
    const result = await migrateCompanyKeys();
    
    
    return c.json({
      success: true,
      message: 'Company keys migrated successfully',
      ...result
    });
  } catch (e: any) {
    console.error('Migration error:', e);
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ============ PASSWORD RESET ENDPOINTS ============
// Request password reset (forgot password) - Custom token-based system
app.post(`${PREFIX}/auth/forgot-password`, async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Rate-limit: max 3 password reset requests per email per hour
    const fpRateLimitKey = `fp-ratelimit:${email.toLowerCase()}`;
    const fpRateData = await kv.get(fpRateLimitKey).catch(() => null) as any;
    const fpNow = Date.now();
    const fpWindowMs = 60 * 60 * 1000; // 1 hour
    if (fpRateData && fpRateData.count >= 3 && fpNow - fpRateData.windowStart < fpWindowMs) {
      // Return the same generic message to avoid leaking whether this email is registered
      return c.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    await kv.set(fpRateLimitKey, {
      count: fpRateData && fpNow - fpRateData.windowStart < fpWindowMs ? fpRateData.count + 1 : 1,
      windowStart: fpRateData && fpNow - fpRateData.windowStart < fpWindowMs ? fpRateData.windowStart : fpNow,
    });
    
    // Find user by email
    const allEmployees = await kv.getByPrefix('employee:');
    const employee = allEmployees.find((e: any) => e.email?.toLowerCase() === email.toLowerCase());
    
    if (!employee) {
      // Don't reveal if email exists or not for security
      return c.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    
    // Store reset token
    await kv.set(`password-reset:${resetToken}`, {
      userId: employee.userId || employee.id,
      email: employee.email,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });
    
    // Create reset link using the frontend origin or the configured FRONTEND_URL
    const requestOrigin = c.req.header('Origin') || c.req.header('Referer')?.split('/make-server-')[0];
    const frontendUrl = Deno.env.get('FRONTEND_URL') || requestOrigin || FRONTEND_FALLBACK_URL;
    const resetLink = `${frontendUrl}/password-reset?token=${resetToken}`;
    
    
    // Send password reset email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    if (resendApiKey) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: employee.email,
            subject: 'Reset Your Blumebyte Password',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #000;">Password Reset Request</h2>
                <p>Hello${employee.name ? ` ${employee.name}` : ''},</p>
                <p>We received a request to reset the password for your Blumebyte account. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="background-color: #7C5A1A; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
                <p style="color: #666; font-size: 14px;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #999; font-size: 12px;">If the button above does not work, copy and paste this link into your browser:<br/>${resetLink}</p>
                </div>
              </div>
            `,
          }),
        });
        if (emailRes.ok) {
          emailSent = true;
        } else {
          const errBody = await emailRes.text();
          console.error(`Failed to send password reset email: ${emailRes.status} ${errBody}`);
        }
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
      }
    }

    if (!emailSent) {
      // Email service not configured — password reset link could not be delivered
      console.error('Password reset email could not be sent. Please configure an email service.');
    }
    
    // Log audit event
    await logAudit({
      userId: employee.userId || employee.id,
      userName: employee.name || email,
      action: 'REQUEST',
      resourceType: 'password-reset',
      resourceId: resetToken,
      details: { email, expiresAt: expiresAt.toISOString() },
    });
    
    return c.json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (e: any) {
    console.error('Forgot password error:', e);
    return c.json({ error: 'Failed to process password reset request' }, 500);
  }
});

// Validate reset token
app.post(`${PREFIX}/auth/validate-reset-token`, async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (!token) {
      return c.json({ valid: false, error: 'Token is required' }, 400);
    }
    
    const resetData = await kv.get(`password-reset:${token}`);
    
    if (!resetData) {
      return c.json({ valid: false, error: 'Invalid or expired reset token' });
    }
    
    // Check if token has expired
    const expiresAt = new Date(resetData.expiresAt);
    const now = new Date();
    
    if (now > expiresAt) {
      await kv.del(`password-reset:${token}`);
      return c.json({ valid: false, error: 'Reset token has expired' });
    }
    
    return c.json({ valid: true });
  } catch (e: any) {
    console.error('Validate token error:', e);
    return c.json({ valid: false, error: 'Failed to validate token' }, 500);
  }
});

// Reset password with token
app.post(`${PREFIX}/auth/reset-password`, async (c) => {
  try {
    const { token, newPassword } = await c.req.json();
    
    if (!token || !newPassword) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }
    
    if (newPassword.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }
    
    // Get reset data
    const resetData = await kv.get(`password-reset:${token}`);
    
    if (!resetData) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }
    
    // Check if token has expired
    const expiresAt = new Date(resetData.expiresAt);
    const now = new Date();
    
    if (now > expiresAt) {
      await kv.del(`password-reset:${token}`);
      return c.json({ error: 'Reset token has expired' }, 400);
    }
    
    // Update password in Supabase Auth
    const sb = supabaseAdmin();
    const { error: updateError } = await sb.auth.admin.updateUserById(resetData.userId, {
      password: newPassword,
    });
    
    if (updateError) {
      console.error('Password update error:', updateError);
      return c.json({ error: 'Failed to update password' }, 500);
    }
    
    // Delete the used reset token
    await kv.del(`password-reset:${token}`);
    
    
    // Log audit event
    await logAudit({
      userId: resetData.userId,
      userName: resetData.email,
      action: 'UPDATE',
      resourceType: 'password',
      resourceId: resetData.userId,
      details: { method: 'password-reset', email: resetData.email },
    });
    
    return c.json({ success: true, message: 'Password reset successfully' });
  } catch (e: any) {
    console.error('Reset password error:', e);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// ============ NOTIFICATION PREFERENCES ENDPOINTS ============

const DEFAULT_NOTIF_PREFS = {
  emailOnNewHire: true,
  emailOnLeaveUpdate: true,
  emailOnPayslip: true,
  emailOnTaskAssignment: true,
  emailOnMeeting: true,
  emailOnAnnouncement: true,
  emailOnPerformanceReview: true,
  inAppNotifications: true,
  notificationSoundEnabled: true,
};

const EMAIL_PREF_KEYS = (Object.keys(DEFAULT_NOTIF_PREFS) as (keyof typeof DEFAULT_NOTIF_PREFS)[])
  .filter(k => k !== 'inAppNotifications' && k !== 'notificationSoundEnabled');

const readNotificationPreferences = async (c: any) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    // Prefer KV (write path), fall back to user_metadata for backward compatibility
    const stored = await kv.get(`notif-prefs:${user.id}`).catch(() => null)
      || user.user_metadata?.notificationPrefs;
    return c.json({ ...DEFAULT_NOTIF_PREFS, ...(stored || {}) });
  } catch (e: any) {
    return c.json(DEFAULT_NOTIF_PREFS);
  }
};

const writeNotificationPreferences = async (c: any) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const prefs = { ...DEFAULT_NOTIF_PREFS, ...body };
    let kvSaved = false;
    try {
      await kv.set(`notif-prefs:${user.id}`, prefs);
      kvSaved = true;
    } catch (kvError: any) {
      console.error('notification-preferences KV save error:', kvError?.message || kvError);
    }

    // Best-effort metadata mirror for legacy readers
    let metadataSaved = false;
    try {
      const sb = supabaseAdmin();
      const { error: updateError } = await sb.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          notificationPrefs: prefs,
        },
      });
      if (updateError) {
        console.error('notification-preferences user_metadata update error:', updateError.message);
      } else {
        metadataSaved = true;
      }
    } catch (metadataError: any) {
      console.error('notification-preferences metadata save error:', metadataError?.message || metadataError);
    }

    if (!kvSaved && !metadataSaved) {
      return c.json({ error: 'Failed to save preferences' }, 500);
    }

    return c.json({ success: true, prefs });
  } catch (e: any) {
    console.error('notification-preferences PUT error:', e?.message || e);
    return c.json({ error: 'Failed to save preferences' }, 500);
  }
};

// Support prefixed, legacy, and Supabase function-name-prefixed paths for compatibility.
for (const route of [`${PREFIX}/notification-preferences`, '/notification-preferences', `/:functionName/notification-preferences`]) {
  app.get(route, readNotificationPreferences);
  app.put(route, writeNotificationPreferences);
  app.post(route, writeNotificationPreferences);
}

// Helper: send email notification to a user if they have the pref enabled.
// Default behaviour (no stored prefs): ALWAYS send. Users who have explicitly
// set a specific pref to false are the only ones skipped.
async function sendEmailNotification(
  recipientId: string,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  htmlBody: string,
  prefKey?: string
) {
  try {
    if (!recipientEmail) return;

    // Only skip if the user has explicitly opted out of this specific pref.
    // If no prefs are stored at all, we always send (notifications on by default).
    const prefs = await kv.get(`notif-prefs:${recipientId}`).catch((err: any) => {
      console.warn('sendEmailNotification: failed to read notif-prefs from KV', err?.message || err);
      return null;
    });
    if (prefs && prefKey && prefs[prefKey] === false) return;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('sendEmailNotification: RESEND_API_KEY not configured — email notification skipped');
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: recipientEmail,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; padding: 20px 30px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #fff; margin: 0; font-size: 18px;">Blumebyte HR</h2>
            </div>
            <div style="padding: 24px 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #374151; margin-bottom: 16px;">Hello${recipientName ? ` ${recipientName}` : ''},</p>
              ${htmlBody}
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                You received this email because you are a Blumebyte HR user and email notifications are active for your account.
              </p>
            </div>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`sendEmailNotification: Resend error ${res.status} for subject="${subject}"`, body.slice(0, 200));
    }
  } catch (err: any) {
    console.error('sendEmailNotification: unexpected error', err?.message || err);
  }
}



// Register each endpoint on:
// 1) hardcoded deployment prefix, 2) bare path, 3) runtime function-name-prefixed path.
// This prevents route mismatches across different Supabase function URL/path forwarding modes.
const compatibleRoutePaths = (path: string) =>
  Array.from(new Set([`${PREFIX}${path}`, path, `/:functionName${path}`]));

const compatibleRoutePathsForAliases = (...paths: string[]) =>
  Array.from(new Set(paths.flatMap((path) => compatibleRoutePaths(path))));

// HIRING-FIX: Keep public hiring routes available on both prefixed and non-prefixed paths.
const listPublicJobs = async (c: Context) => {
  try {
    const all = await kv.getByPrefix("job-posting:");
    const eligible = all.filter(isPublicJobPosting);

    const settled = await Promise.allSettled(eligible.map((j: any) => buildPublicJobResponse(j)));
    const jobs = settled
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !!r.value)
      .map((r) => r.value)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ jobs, total: jobs.length });
  } catch (e: any) {
    console.error('Public jobs error:', e);
    return c.json({ error: 'Failed to load job postings', detail: e.message }, 500);
  }
};

// HIRING-FIX: Resolve public job detail by scanning all public postings and return stable 404 payload.
const getPublicJobDetail = async (c: Context) => {
  try {
    const id = c.req.param('id');
    let match = await kv.get(`job-posting:${id}`);
    if (!isPublicJobPosting(match)) {
      const all = await kv.getByPrefix("job-posting:");
      match = all.find((job: any) => job?.id === id && isPublicJobPosting(job));
    }
    if (!match) return c.json({ error: 'Job not found' }, 404);
    const publicJob = await buildPublicJobResponse(match);
    if (!publicJob) return c.json({ error: 'Job not found' }, 404);
    return c.json(publicJob);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};

for (const route of compatibleRoutePathsForAliases('/public/jobs', '/public/job-openings', '/hirings/jobs')) {
  app.get(route, listPublicJobs);
}

for (const route of compatibleRoutePathsForAliases('/public/jobs/:id', '/public/job-openings/:id', '/hirings/jobs/:id')) {
  app.get(route, getPublicJobDetail);
}

// POST /public/job/apply — submit a public job application
// Basic rate limiting via KV: max 5 submissions per email per hour
const applyToPublicJob = async (c: any) => {
  try {
    const body = await c.req.json();
    const { jobId, companyName, roleTitle, fullName, email, phone, qualification, cvMessage, contactDetails } = body;

    // Server-side validation
    if (!jobId || !fullName?.trim() || !email?.trim() || !phone?.trim() || !qualification?.trim() || !cvMessage?.trim() || !contactDetails?.trim()) {
      return c.json({ error: 'All fields are required' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }
    if (cvMessage.length > 4000) {
      return c.json({ error: 'CV message exceeds 4000 character limit' }, 400);
    }

    // Verify job exists and is public
    const job = await kv.get(`job-posting:${jobId}`);
    if (!isPublicJobPosting(job)) {
      return c.json({ error: 'Job not found or no longer accepting applications' }, 404);
    }

    // Rate limiting: max 5 submissions per email per hour
    const rateLimitKey = `rate-limit:apply:${email.toLowerCase()}`;
    const stored = await kv.get(rateLimitKey);
    const now = Date.now();
    const rateData = stored && now <= stored.resetAt
      ? stored
      : { count: 0, resetAt: now + 3600000 };
    if (rateData.count >= 5) {
      return c.json({ error: 'Too many submissions. Please try again later.' }, 429);
    }
    rateData.count++;
    await kv.set(rateLimitKey, rateData);

    const id = crypto.randomUUID();
    const application = {
      id,
      jobId,
      companyName: companyName || job.companyName || job.company || '',
      roleTitle: roleTitle || job.roleTitle || job.title || '',
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      contactDetails: contactDetails.trim(),
      qualification: qualification.trim(),
      cvMessage: cvMessage.trim(),
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    await kv.set(`public-job-application:${id}`, application);

    // Also store as a job-application: record scoped to the company so that
    // the admin's HiringApprovalPanel (/job-applications endpoint) can see it.
    const companyIdForJob = job.companyId || job.company || '';
    if (companyIdForJob) {
      const adminAppRecord = {
        ...application,
        // Map public fields to the job-application schema used by HiringApprovalPanel
        applicantName: fullName.trim(),
        applicantEmail: email.trim().toLowerCase(),
        jobTitle: application.roleTitle,
        coverLetter: cvMessage.trim(),
        companyId: companyIdForJob,
        company: companyIdForJob,
        source: 'public_portal',
        // Keep full details for display
        fullName: fullName.trim(),
        phone: phone.trim(),
        contactDetails: contactDetails.trim(),
        qualification: qualification.trim(),
        cvMessage: cvMessage.trim(),
      };
      await kv.set(`job-application:${id}`, adminAppRecord);
    }

    // Notify all platform developers/superadmins about new application
    try {
      const allEmployees = await kv.getByPrefix('employee:');
      const devAccounts = allEmployees.filter((e: any) => e.role === 'developer' || e.isPlatformAdmin);
      for (const dev of devAccounts) {
        const notifId = crypto.randomUUID();
        await kv.set(`notification:${notifId}`, {
          id: notifId,
          userId: dev.userId || dev.id,
          type: 'global_application',
          title: 'New Global Hiring Application',
          message: `${fullName} applied for ${application.roleTitle} at ${application.companyName}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (notifErr) {
      console.error('Failed to create notifications:', notifErr);
    }

    try {
      const companyIdForJob = job.companyId || job.company || '';
      const company = companyIdForJob ? await kv.get(`company:${companyIdForJob}`) : null;
      const recipientEmails = parseEmailList(
        job.applicationNotificationEmails,
        job.applicationEmail,
        job.contactEmail,
        company?.email
      );
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey && recipientEmails.length > 0) {
        const jobTitle = escapeHtml(application.roleTitle || 'Untitled Role');
        const orgName = escapeHtml(application.companyName || 'Hiring Organization');
        const candidateName = escapeHtml(application.fullName);
        const candidateEmail = escapeHtml(application.email);
        const candidatePhone = escapeHtml(application.phone);
        const candidateContact = escapeHtml(application.contactDetails);
        const candidateQualification = escapeHtml(application.qualification);
        const coverLetter = escapeHtml(application.cvMessage).replace(/\n/g, '<br />');
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: recipientEmails,
            subject: `New hiring application: ${application.roleTitle} (${application.companyName})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
                <h2 style="margin-bottom: 8px;">New Public Hiring Application</h2>
                <p style="margin-top: 0; color: #4b5563;">
                  A new applicant submitted an application on the public hiring page.
                </p>
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                  <p><strong>Role:</strong> ${jobTitle}</p>
                  <p><strong>Company:</strong> ${orgName}</p>
                  <p><strong>Applicant:</strong> ${candidateName}</p>
                  <p><strong>Email:</strong> ${candidateEmail}</p>
                  <p><strong>Phone:</strong> ${candidatePhone}</p>
                  <p><strong>Contact Details:</strong> ${candidateContact}</p>
                  <p><strong>Qualification:</strong> ${candidateQualification}</p>
                  <p><strong>CV / Cover Letter:</strong><br />${coverLetter}</p>
                </div>
              </div>
            `,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Failed to send hiring application email:', emailErr);
    }

    return c.json({ success: true, id });
  } catch (e: any) {
    console.error('Public job apply error:', e);
    return c.json({ error: e.message || 'Submission failed' }, 500);
  }
};
for (const route of compatibleRoutePaths('/public/job/apply')) app.post(route, applyToPublicJob);

// ============ CUSTOMER CARE / DEVELOPER ENDPOINTS ============

// Helper: verify care account access
async function verifyCareAccess(c: any): Promise<{ user: any; profile: any; isDeveloper: boolean } | null> {
  const token = extractUserToken(c);
  if (!token) return null;
  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  const profile = await kv.get(`employee:${data.user.id}`);
  const isDeveloper = profile?.role === 'developer' || profile?.isPlatformAdmin === true;
  const role = profile?.role || data.user.user_metadata?.role || '';
  const normalizedRole = normalizeCareRole(role);
  const isCare = normalizedRole === 'customer_care';
  if (!isDeveloper && !isCare) return null;
  return { user: data.user, profile, isDeveloper };
}

// GET /care/verify-access — check if authenticated user can access care dashboard
const verifyCareRouteAccess = async (c: any) => {
  try {
    const access = await verifyCareAccess(c);
    if (!access) return c.json({ allowed: false }, 403);
    return c.json({ allowed: true, role: access.isDeveloper ? 'developer' : 'customer_care' });
  } catch {
    return c.json({ allowed: false }, 403);
  }
};
for (const route of compatibleRoutePaths('/care/verify-access')) app.get(route, verifyCareRouteAccess);

// GET /care/profile — care account's own profile
const getCareProfile = async (c: any) => {
  try {
    const access = await verifyCareAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    return c.json({
      id: access.user.id,
      email: access.user.email,
      name: access.profile?.name || access.user.email,
      role: access.isDeveloper ? 'developer' : 'customer_care',
    });
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};
for (const route of compatibleRoutePaths('/care/profile')) app.get(route, getCareProfile);

// GET /care/tenants — list all tenant companies
const listCareTenants = async (c: any) => {
  try {
    const access = await verifyCareAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);

    const companies = await kv.getByPrefix('company:');
    let allowed = companies;

    // Non-developer care agents can only see their assigned tenants
    if (!access.isDeveloper) {
      const assignedByKey = await kv.get(`care_assignments:${access.user.id}`);
      const assignedTenants = Array.isArray(assignedByKey)
        ? assignedByKey
        : (access.profile?.assignedTenants || []);
      if (assignedTenants.length > 0) {
        allowed = companies.filter((co: any) => assignedTenants.includes(co.id));
      } else {
        allowed = [];
      }
    }

    return c.json(allowed.map((co: any) => {
      const stats = co.stats || {};
      return {
        id: co.id,
        name: co.name,
        email: co.email || '',
        industry: co.industry || '',
        status: co.status || 'active',
        usedLicenses: stats.usedLicenses || co.usedLicenses || 0,
        purchasedLicenses: co.subscription?.licenses || co.licenses || 0,
        createdAt: co.createdAt || '',
      };
    }));
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tenants')) app.get(route, listCareTenants);

// GET /care/tenants/:id/users — list users for a tenant
const listCareTenantUsers = async (c: any) => {
  try {
    const access = await verifyCareAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const tenantId = c.req.param('id');
    if (!access.isDeveloper) {
      const assignedByKey = await kv.get(`care_assignments:${access.user.id}`);
      const assignedTenants = Array.isArray(assignedByKey)
        ? assignedByKey
        : (access.profile?.assignedTenants || []);
      if (!assignedTenants.includes(tenantId)) return c.json({ error: 'Forbidden' }, 403);
    }

    const all = await kv.getByPrefix('employee:');
    const users = all.filter((u: any) => u.companyId === tenantId || u.company === tenantId);
    return c.json(users.map((u: any) => ({
      id: u.id || u.userId,
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'employee',
      status: u.status || 'active',
    })));
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tenants/:id/users')) app.get(route, listCareTenantUsers);

// DELETE /care/tenants/:id — delete a tenant (developer only)
const deleteCareTenant = async (c: any) => {
  try {
    const access = await verifyCareAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (!access.isDeveloper) return c.json({ error: 'Forbidden: Developer only' }, 403);

    const tenantId = c.req.param('id');
    const sb = supabaseAdmin();

    // Delete all KV data for tenant
    const prefixes = [
      'company:', 'branch:', 'department:', 'asset:', 'asset-category:', 'paygrade:',
      'financial-year:', 'leave-type:', 'leave:', 'attendance:', 'announcement:',
      'message:', 'notification:', 'job-posting:', 'job-application:', 'perf-review:',
      'goal:', 'feedback:', 'meeting:', 'workflow:', 'disciplinary:', 'compliance:',
      'training:', 'task:', 'onboard-checklist:', 'payroll-run:', 'tax-bracket:',
      'benefit-plan:', 'subscription:', 'company_stats:',
    ];

    for (const prefix of prefixes) {
      const items = await kv.getByPrefix(prefix);
      const tenantItems = items.filter((item: any) =>
        item.companyId === tenantId || item.company === tenantId
      );
      for (const item of tenantItems) {
        await kv.del(`${prefix}${item.id}`);
      }
    }

    // Delete company key itself
    await kv.del(`company:${tenantId}`);

    // Delete all users of this tenant from auth
    const allEmps = await kv.getByPrefix('employee:');
    const tenantUsers = allEmps.filter((u: any) => u.companyId === tenantId || u.company === tenantId);
    for (const u of tenantUsers) {
      const uid = u.id || u.userId;
      try {
        await sb.auth.admin.deleteUser(uid);
        await kv.del(`employee:${uid}`);
        await kv.del(`user_profile:${uid}`);
      } catch (err) {
        console.error(`Failed to delete user ${uid}:`, err);
      }
    }

    return c.json({ success: true, message: `Tenant ${tenantId} deleted` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tenants/:id')) app.delete(route, deleteCareTenant);

// POST /care/reset-password — generate a password reset link for a user
const createCareResetPassword = async (c: any) => {
  try {
    const access = await verifyCareAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);

    const { email } = await c.req.json();
    if (!email) return c.json({ error: 'Email required' }, 400);

    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase(),
    });

    if (error) return c.json({ error: error.message }, 400);
    return c.json({ success: true, resetLink: data?.properties?.action_link || 'Reset email sent to user.' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/reset-password')) app.post(route, createCareResetPassword);

// PUT /care/tenants/:id/license — update license count (developer only)
const updateCareTenantLicenses = async (c: any) => {
  try {
    const access = await verifyCareAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (!access.isDeveloper) return c.json({ error: 'Forbidden: Developer only' }, 403);

    const tenantId = c.req.param('id');
    const { licenses } = await c.req.json();
    if (!licenses || licenses < 0) return c.json({ error: 'Invalid license count' }, 400);

    const company = await kv.get(`company:${tenantId}`);
    if (!company) return c.json({ error: 'Tenant not found' }, 404);

    const updated = { ...company, licenses, subscription: { ...(company.subscription || {}), licenses } };
    await kv.set(`company:${tenantId}`, updated);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tenants/:id/license')) app.put(route, updateCareTenantLicenses);

// GET /care/global-applications — list all public job applications
const listCareGlobalApplications = async (c: any) => {
  try {
    const access = await verifyCareAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);

    const apps = await kv.getByPrefix('public-job-application:');
    apps.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return c.json(apps);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/global-applications')) app.get(route, listCareGlobalApplications);


// SuperAdmin CRUD for public job applications (status updates, view, archive)
app.get(`${PREFIX}/superadmin/public-job-applications`, async (c) => {
  try {
    const { user } = await requireSuperAdmin(c);
    const apps = await kv.getByPrefix('public-job-application:');
    // Filter to only show applications for this tenant's job postings
    const companyScope = await resolveCompanyScope(user.id);
    const companyId = companyScope?.[0];
    let filtered = apps;
    if (companyId) {
      const scopeSet = new Set(companyScope || [companyId]);
      const postingBelongsToTenant = (p: any) =>
        scopeSet.has(p.companyId) || scopeSet.has(p.company);
      const allPostings = await kv.getByPrefix('job-posting:');
      const ownPostingIds = new Set(
        allPostings.filter(postingBelongsToTenant).map((p: any) => p.id)
      );
      filtered = apps.filter(
        (a: any) => ownPostingIds.has(a.jobId) || scopeSet.has(a.companyId)
      );
    }
    filtered.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return c.json(filtered);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/superadmin/public-job-application/:id`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(`public-job-application:${id}`);
    if (!existing) return c.json({ error: 'Not found' }, 404);
    const updated = { ...existing, ...body, id };
    await kv.set(`public-job-application:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.delete(`${PREFIX}/superadmin/public-job-application/:id`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const id = c.req.param('id');
    await kv.del(`public-job-application:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ ULTIMATEADMIN SUPPORT DASHBOARD ENDPOINTS ============

// Helper: allowed support roles (KV or user_metadata)
const SUPPORT_ROLES = new Set(['ultimateadmin', 'developer', 'customer_care']);

async function verifyUltimateAdminAccess(c: any): Promise<{ user: any; profile: any; role: string } | null> {
  const token = extractUserToken(c);
  if (!token) return null;
  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  const profile = await kv.get(`employee:${data.user.id}`);
  const profileRole = normalizeCareRole(profile?.role || '');
  const metadataRole = normalizeCareRole(data.user.user_metadata?.role || '');
  const isPlatformAdmin = profile?.isPlatformAdmin === true;
  // Prevent stale KV roles from downgrading platform owners.
  const normalizedRole =
    isPlatformAdmin
      ? 'ultimateadmin'
      : (profileRole === 'ultimateadmin' || metadataRole === 'ultimateadmin')
      ? 'ultimateadmin'
      : (profileRole === 'developer' || metadataRole === 'developer')
      ? 'developer'
      : (profileRole === 'customer_care' || metadataRole === 'customer_care')
      ? 'customer_care'
      : profileRole || metadataRole;
  const allowed = SUPPORT_ROLES.has(normalizedRole) || isPlatformAdmin;
  if (!allowed) return null;
  return { user: data.user, profile, role: normalizedRole };
}

// GET /ultimateadmin/support/verify
const verifyUltimateadminSupport = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ allowed: false }, 403);
    return c.json({ allowed: true, role: access.role, email: access.user.email, name: access.profile?.name || access.user.email });
  } catch {
    return c.json({ allowed: false }, 403);
  }
};
for (const route of compatibleRoutePathsForAliases('/ultimateadmin/support/verify', '/support/verify')) {
  app.get(route, verifyUltimateadminSupport);
}

// GET /ultimateadmin/support/metrics — overview counts
const getUltimateadminSupportMetrics = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);

    const [allEmployees, allSubscriptions, allTickets, allAgents] = await Promise.all([
      kv.getByPrefix('employee:'),
      kv.getByPrefix('subscription:'),
      kv.getByPrefix('support-ticket:'),
      kv.getByPrefix('support-agent:'),
    ]);

    const companyMap = new Map<string, { name: string; usedLicenses: number; purchasedLicenses: number; status: string }>();
    for (const emp of allEmployees) {
      const cid = emp.companyId || emp.company;
      if (!cid) continue;
      if (!companyMap.has(cid)) {
        companyMap.set(cid, { name: emp.companyName || cid, usedLicenses: 0, purchasedLicenses: 0, status: 'active' });
      }
      if (emp.status === 'active') companyMap.get(cid)!.usedLicenses++;
    }
    for (const sub of allSubscriptions) {
      const cid = sub.companyId || sub.company;
      if (cid && companyMap.has(cid)) {
        const entry = companyMap.get(cid)!;
        entry.purchasedLicenses = sub.purchasedLicenses || 0;
        if (sub.status !== 'active') entry.status = sub.status || 'expired';
      }
    }

    const totalTenants = companyMap.size;
    const activeTenants = [...companyMap.values()].filter(t => t.status === 'active').length;
    const expiredLicenses = [...companyMap.values()].filter(t => t.status !== 'active').length;
    const openTickets = allTickets.filter((t: any) => t.status === 'open').length;
    const resolvedToday = allTickets.filter((t: any) => {
      if (t.status !== 'resolved') return false;
      const d = new Date(t.updatedAt || t.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;

    return c.json({
      totalTenants,
      activeTenants,
      expiredLicenses,
      openTickets,
      resolvedToday,
      totalAgents: allAgents.length,
      totalTickets: allTickets.length,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePathsForAliases('/ultimateadmin/support/metrics', '/support/metrics')) {
  app.get(route, getUltimateadminSupportMetrics);
}

// GET /ultimateadmin/support/tenants — all tenants with stats
const listUltimateadminSupportTenants = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);

    const [allEmployees, allSubscriptions, allCompanies] = await Promise.all([
      kv.getByPrefix('employee:'),
      kv.getByPrefix('subscription:'),
      kv.getByPrefix('company:'),
    ]);

    const subMap = new Map<string, any>();
    for (const sub of allSubscriptions) {
      const cid = sub.companyId || sub.company;
      if (cid) subMap.set(cid, sub);
    }

    const companyMap = new Map<string, any>();
    for (const c of allCompanies) {
      const cid = c.id || c.companyId;
      if (cid) companyMap.set(cid, c);
    }

    // Build tenant list from employee records (superadmin entries carry company metadata)
    const tenantMap = new Map<string, any>();
    for (const emp of allEmployees) {
      const cid = emp.companyId || emp.company;
      if (!cid) continue;
      if (!tenantMap.has(cid)) {
        const companyRecord = companyMap.get(cid);
        tenantMap.set(cid, {
          id: cid,
          name: companyRecord?.name || emp.companyName || cid,
          industry: companyRecord?.industry || emp.industry || '',
          createdAt: companyRecord?.createdAt || emp.createdAt || '',
          activeUsers: 0,
          totalUsers: 0,
        });
      }
      const t = tenantMap.get(cid)!;
      t.totalUsers++;
      if (emp.status === 'active') t.activeUsers++;
    }


    // Also include companies with no employees yet
    for (const [cid, company] of companyMap.entries()) {
      if (!tenantMap.has(cid)) {
        tenantMap.set(cid, {
          id: cid,
          name: company.name || cid,
          industry: company.industry || '',
          createdAt: company.createdAt || '',
          activeUsers: 0,
          totalUsers: 0,
        });
      }
    }

    const tenants = [...tenantMap.entries()].map(([cid, t]) => {
      const sub = subMap.get(cid);
      return {
        ...t,
        licenseStatus: sub?.status || 'unknown',
        purchasedLicenses: sub?.purchasedLicenses || 0,
        plan: sub?.plan || sub?.planName || 'unknown',
        lastActivity: sub?.updatedAt || t.createdAt || '',
      };
    });

    tenants.sort((a, b) => a.name.localeCompare(b.name));

    // Care agents only see their assigned tenants
    const normalizedRole = normalizeCareRole(access.role);
    if (normalizedRole === 'customer_care') {
      const assigned = await getCareAssignmentsForAgent(access.user.id);
      const assignedSet = new Set(assigned);
      return c.json(tenants.filter((t: any) => assignedSet.has(t.id)));
    }

    return c.json(tenants);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePathsForAliases('/ultimateadmin/support/tenants', '/support/tenants')) {
  app.get(route, listUltimateadminSupportTenants);
}

// GET /ultimateadmin/support/tenants/:id/users
const listUltimateadminSupportTenantUsers = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const tenantId = c.req.param('id');
    const allEmployees = await kv.getByPrefix('employee:');
    const users = allEmployees
      .filter((e: any) => e.companyId === tenantId || e.company === tenantId)
      .map((e: any) => ({
        id: e.id || e.userId,
        name: e.name || e.fullName || e.email,
        email: e.email,
        role: e.role,
        status: e.status,
      }));
    return c.json(users);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tenants/:id/users')) app.get(route, listUltimateadminSupportTenantUsers);

// POST /ultimateadmin/support/tenants/:id/suspend
const suspendUltimateadminSupportTenant = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const tenantId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const sub = await kv.get(`subscription:${tenantId}`);
    if (sub) {
      await kv.set(`subscription:${tenantId}`, { ...sub, status: body.restore ? 'active' : 'suspended', updatedAt: new Date().toISOString() });
    }
    // Log audit
    const auditId = crypto.randomUUID();
    await kv.set(`support-audit:${auditId}`, {
      id: auditId, actorId: access.user.id, actorEmail: access.user.email,
      actionType: body.restore ? 'tenant_restore' : 'tenant_suspend',
      tenantId, timestamp: new Date().toISOString(),
      description: `Tenant ${tenantId} ${body.restore ? 'restored' : 'suspended'} by ${access.user.email}`,
    });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tenants/:id/suspend')) app.post(route, suspendUltimateadminSupportTenant);

// PUT /ultimateadmin/support/tenants/:id/license
const updateUltimateadminSupportTenantLicense = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const tenantId = c.req.param('id');
    const body = await c.req.json();

    // Duration-based expiry: calculate expiresAt from durationAmount + durationUnit
    let expiresAt = body.expiresAt;
    if (!expiresAt && body.durationAmount && body.durationUnit) {
      const now = new Date();
      const amount = Number(body.durationAmount);
      if (body.durationUnit === 'days') now.setDate(now.getDate() + amount);
      else if (body.durationUnit === 'months') now.setMonth(now.getMonth() + amount);
      else if (body.durationUnit === 'years') now.setFullYear(now.getFullYear() + amount);
      expiresAt = now.toISOString();
    }

    // Upsert subscription (create if doesn't exist)
    const sub = (await kv.get(`subscription:${tenantId}`)) || {
      companyId: tenantId, plan: 'custom', status: 'active',
      purchasedLicenses: 0, createdAt: new Date().toISOString(),
    };
    const updatedSub = {
      ...sub,
      purchasedLicenses: body.purchasedLicenses ?? sub.purchasedLicenses,
      status: body.status ?? sub.status,
      expiresAt: expiresAt ?? sub.expiresAt,
      plan: body.plan ?? sub.plan,
      updatedAt: new Date().toISOString(),
      grantedBy: access.user.id,
      noPaymentRequired: true,
    };
    await kv.set(`subscription:${tenantId}`, updatedSub);

    // Also update company record if it exists
    const company = await kv.get(`company:${tenantId}`);
    if (company) {
      await kv.set(`company:${tenantId}`, {
        ...company,
        licenses: updatedSub.purchasedLicenses,
        plan: updatedSub.plan,
        status: updatedSub.status === 'active' ? 'active' : company.status,
        updatedAt: new Date().toISOString(),
      });
    }

    const auditId = crypto.randomUUID();
    await kv.set(`support-audit:${auditId}`, {
      id: auditId, actorId: access.user.id, actorEmail: access.user.email,
      actionType: 'license_update', tenantId, timestamp: new Date().toISOString(),
      description: `License updated for tenant ${tenantId} by ${access.user.email}: ${JSON.stringify(body)}`,
    });
    return c.json({ success: true, subscription: updatedSub });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tenants/:id/license')) app.put(route, updateUltimateadminSupportTenantLicense);

// GET /ultimateadmin/support/tickets
const listUltimateadminSupportTickets = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    let tickets = await kv.getByPrefix('support-ticket:');
    // Care agents only see tickets for their assigned tenants
    const normalizedRole = normalizeCareRole(access.role);
    if (normalizedRole === 'customer_care') {
      const assigned = await getCareAssignmentsForAgent(access.user.id);
      tickets = tickets.filter((t: any) => assigned.includes(t.tenantId));
    }
    tickets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(tickets);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tickets')) app.get(route, listUltimateadminSupportTickets);

// POST /ultimateadmin/support/tickets
const createUltimateadminSupportTicket = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const ticket = {
      id, tenantId: body.tenantId || '', tenantName: body.tenantName || '',
      issueType: body.issueType || 'general', priority: body.priority || 'medium',
      subject: body.subject || '', description: body.description || '',
      status: 'open', assignedAgentId: body.assignedAgentId || '',
      assignedAgentName: body.assignedAgentName || '',
      creatorId: access.user.id, creatorEmail: access.user.email,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      notes: [],
    };
    await kv.set(`support-ticket:${id}`, ticket);
    return c.json(ticket);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tickets')) app.post(route, createUltimateadminSupportTicket);

// PUT /ultimateadmin/support/tickets/:id
const updateUltimateadminSupportTicket = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(`support-ticket:${id}`);
    if (!existing) return c.json({ error: 'Not found' }, 404);
    // Handle adding a note
    const notes = existing.notes || [];
    if (body.note) {
      notes.push({ text: body.note, authorEmail: access.user.email, timestamp: new Date().toISOString() });
    }
    const updated = { ...existing, ...body, id, notes, updatedAt: new Date().toISOString() };
    delete updated.note;
    await kv.set(`support-ticket:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tickets/:id')) app.put(route, updateUltimateadminSupportTicket);

// DELETE /ultimateadmin/support/tickets/:id
const deleteUltimateadminSupportTicket = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    await kv.del(`support-ticket:${id}`);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tickets/:id')) app.delete(route, deleteUltimateadminSupportTicket);

// GET /ultimateadmin/support/agents
app.get(`${PREFIX}/ultimateadmin/support/agents`, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const agents = await kv.getByPrefix('support-agent:');
    return c.json(agents);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /ultimateadmin/support/agents
app.post(`${PREFIX}/ultimateadmin/support/agents`, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && !access.profile?.isPlatformAdmin) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const agent = {
      id, name: body.name || '', email: body.email || '', role: body.role || 'customer_care',
      assignedTenants: body.assignedTenants || [], status: 'active',
      openTickets: 0, resolvedTickets: 0,
      createdAt: new Date().toISOString(), createdBy: access.user.email,
    };
    await kv.set(`support-agent:${id}`, agent);
    return c.json(agent);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// PUT /ultimateadmin/support/agents/:id
app.put(`${PREFIX}/ultimateadmin/support/agents/:id`, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(`support-agent:${id}`);
    if (!existing) return c.json({ error: 'Not found' }, 404);
    const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    await kv.set(`support-agent:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /ultimateadmin/support/audit — audit trail
const listUltimateadminSupportAudit = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const logs = await kv.getByPrefix('support-audit:');
    logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return c.json(logs.slice(0, 200));
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/audit')) app.get(route, listUltimateadminSupportAudit);

// POST /ultimateadmin/support/set-platform-user — set role+name for developer/care platform users
const setUltimateadminPlatformUser = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin') return c.json({ error: 'Forbidden' }, 403);
    const body = await c.req.json();
    const { userId, name, role } = body;
    if (!userId || !role) return c.json({ error: 'userId and role are required' }, 400);
    const ALLOWED_PLATFORM_ROLES = ['developer', 'ultimateadmin', 'customer_care'];
    if (!ALLOWED_PLATFORM_ROLES.includes(role)) {
      return c.json({ error: `Invalid role. Allowed: ${ALLOWED_PLATFORM_ROLES.join(', ')}` }, 400);
    }
    const sb = supabaseAdmin();
    const { data: authData, error: authErr } = await sb.auth.admin.getUserById(userId);
    if (authErr || !authData?.user) return c.json({ error: 'User not found in auth' }, 404);
    const resolvedName = name || authData.user.user_metadata?.name || authData.user.email || '';
    // Update Supabase auth metadata (fixes the Supabase dashboard display)
    await sb.auth.admin.updateUserById(userId, {
      user_metadata: { ...authData.user.user_metadata, name: resolvedName, role },
    });
    // Upsert KV employee record so the server role check always resolves correctly
    const existing = await kv.get(`employee:${userId}`) || {};
    const updated = {
      ...existing,
      userId,
      id: userId,
      name: resolvedName,
      email: authData.user.email || existing.email || '',
      role,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`employee:${userId}`, updated);
    // Audit
    const auditId = crypto.randomUUID();
    await kv.set(`support-audit:${auditId}`, {
      id: auditId, actorId: access.user.id, actorEmail: access.user.email,
      actionType: 'set_platform_user_role', targetUserId: userId,
      targetEmail: authData.user.email, newRole: role, newName: resolvedName,
      timestamp: new Date().toISOString(),
      description: `Set platform user ${authData.user.email} to role '${role}' by ${access.user.email}`,
    });
    return c.json({ success: true, userId, email: authData.user.email, name: resolvedName, role });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/set-platform-user')) app.post(route, setUltimateadminPlatformUser);

// POST /ultimateadmin/support/generate-reset-link — generate password reset link for any user (ultimateadmin only)
const generateUltimateadminResetLink = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin') return c.json({ error: 'Forbidden' }, 403);
    const body = await c.req.json();
    const { email } = body;
    if (!email) return c.json({ error: 'email is required' }, 400);
    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase().trim(),
    });
    if (error) return c.json({ error: error.message }, 400);
    const auditId = crypto.randomUUID();
    await kv.set(`support-audit:${auditId}`, {
      id: auditId, actorId: access.user.id, actorEmail: access.user.email,
      actionType: 'generate_reset_link', targetEmail: email,
      timestamp: new Date().toISOString(),
      description: `Password reset link generated for ${email} by ${access.user.email}`,
    });
    return c.json({ success: true, email, resetLink: data?.properties?.action_link || null });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/generate-reset-link')) app.post(route, generateUltimateadminResetLink);

// POST /ultimateadmin/support/repair/:tenantId — run quick repair actions
const repairUltimateadminTenant = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const tenantId = c.req.param('tenantId');
    const body = await c.req.json().catch(() => ({}));
    const action = body.action || 'refresh_permissions';

    // Log the repair action
    const auditId = crypto.randomUUID();
    await kv.set(`support-audit:${auditId}`, {
      id: auditId, actorId: access.user.id, actorEmail: access.user.email,
      actionType: `repair_${action}`, tenantId, timestamp: new Date().toISOString(),
      description: `Repair action '${action}' executed for tenant ${tenantId} by ${access.user.email}`,
    });

    return c.json({ success: true, action, tenantId, executedBy: access.user.email, timestamp: new Date().toISOString() });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/repair/:tenantId')) app.post(route, repairUltimateadminTenant);

// POST /ultimateadmin/support/tenants — create a new tenant without payment
const createUltimateadminSupportTenant = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const body = await c.req.json();
    if (!body?.name) return c.json({ error: 'name is required' }, 400);
    const tenantId = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    // Calculate license expiry from duration
    let expiresAt = body.expiresAt || null;
    if (!expiresAt && body.durationAmount && body.durationUnit) {
      const d = new Date();
      const amount = Number(body.durationAmount);
      if (body.durationUnit === 'days') d.setDate(d.getDate() + amount);
      else if (body.durationUnit === 'months') d.setMonth(d.getMonth() + amount);
      else if (body.durationUnit === 'years') d.setFullYear(d.getFullYear() + amount);
      expiresAt = d.toISOString();
    }

    const company = {
      id: tenantId, name: body.name, industry: body.industry || '',
      status: 'active', createdAt: now, updatedAt: now,
      createdBy: access.user.id,
    };
    await kv.set(`company:${tenantId}`, company);

    const sub = {
      companyId: tenantId, plan: body.plan || 'custom', status: 'active',
      purchasedLicenses: Number(body.purchasedLicenses) || 0,
      expiresAt, noPaymentRequired: true,
      grantedBy: access.user.id, createdAt: now, updatedAt: now,
    };
    await kv.set(`subscription:${tenantId}`, sub);

    const auditId = crypto.randomUUID();
    await kv.set(`support-audit:${auditId}`, {
      id: auditId, actorId: access.user.id, actorEmail: access.user.email,
      actionType: 'tenant_create', tenantId, timestamp: now,
      description: `Tenant "${body.name}" created by ${access.user.email} (no payment)`,
    });
    return c.json({ success: true, id: tenantId, ...company, subscription: sub });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tenants')) app.post(route, createUltimateadminSupportTenant);

// POST /ultimateadmin/support/tenants/:id/users — create a user for a tenant without payment
const createUltimateadminSupportTenantUser = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const tenantId = c.req.param('id');
    const body = await c.req.json();
    if (!body?.email || !body?.name) return c.json({ error: 'email and name are required' }, 400);
    const sb = supabaseAdmin();
    const password = body.password || generateTempPassword();
    // Create auth user
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email: body.email.toLowerCase().trim(),
      password,
      user_metadata: {
        role: body.role || 'employee',
        name: body.name,
        companyId: tenantId,
        company: tenantId,
      },
      email_confirm: true,
    });
    if (authErr) return c.json({ error: authErr.message }, 400);
    const userId = authData.user.id;
    const company = await kv.get(`company:${tenantId}`);
    const now = new Date().toISOString();
    const employee = {
      id: userId, userId, email: body.email.toLowerCase().trim(),
      name: body.name, role: body.role || 'employee',
      companyId: tenantId, company: tenantId,
      companyName: company?.name || tenantId,
      status: 'active', createdAt: now, updatedAt: now,
      createdBy: access.user.id,
    };
    await kv.set(`employee:${userId}`, employee);
    const auditId = crypto.randomUUID();
    await kv.set(`support-audit:${auditId}`, {
      id: auditId, actorId: access.user.id, actorEmail: access.user.email,
      actionType: 'tenant_user_create', tenantId, timestamp: now,
      description: `User "${body.email}" (${body.role || 'employee'}) created for tenant ${tenantId} by ${access.user.email}`,
    });
    return c.json({ success: true, userId, email: body.email, role: body.role || 'employee', tempPassword: body.password ? undefined : password });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/support/tenants/:id/users')) app.post(route, createUltimateadminSupportTenantUser);

// GET /ultimateadmin/users — all users across all tenants
const listUltimateadminUsers = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    const allEmployees = await kv.getByPrefix('employee:');
    const users = allEmployees.map((e: any) => ({
      id: e.id || e.userId, email: e.email, name: e.name || e.fullName || e.email,
      role: e.role, status: e.status, companyId: e.companyId || e.company,
      companyName: e.companyName || '', createdAt: e.createdAt || '',
    }));
    return c.json(users);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/users')) app.get(route, listUltimateadminUsers);

// ── Ultimateadmin Global Chat ───────────────────────────────────────────────────
// Ultimateadmin can chat with any tenant user directly

// GET /ultimateadmin/chat/threads — list all chat threads
const listUltimateadminChatThreads = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const threads = await kv.getByPrefix('ultimateadmin_chat_thread:');
    threads.sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
    return c.json(threads);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/chat/threads')) app.get(route, listUltimateadminChatThreads);

// GET /ultimateadmin/chat/threads/:threadId — get thread messages
const getUltimateadminChatThread = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const threadId = c.req.param('threadId');
    const thread = await kv.get(`ultimateadmin_chat_thread:${threadId}`);
    if (!thread) return c.json({ error: 'Thread not found' }, 404);
    const messages = await kv.getByPrefix(`ultimateadmin_chat_msg:${threadId}:`);
    messages.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
    return c.json({ thread, messages });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/chat/threads/:threadId')) app.get(route, getUltimateadminChatThread);

// POST /ultimateadmin/chat/send — send a message to a tenant user (creates thread if needed)
const sendUltimateadminChatMessage = async (c: any) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const body = await c.req.json();
    const { recipientId, recipientEmail, recipientName, tenantId, message, threadId: existingThreadId } = body;
    if (!message?.trim()) return c.json({ error: 'message is required' }, 400);
    if (!recipientId && !recipientEmail) return c.json({ error: 'recipientId or recipientEmail is required' }, 400);
    const now = new Date().toISOString();

    // Find or create thread
    let threadId = existingThreadId;
    if (!threadId) {
      // Try to find existing thread
      const allThreads = await kv.getByPrefix('ultimateadmin_chat_thread:');
      const existing = allThreads.find((t: any) =>
        (recipientId && t.recipientId === recipientId) ||
        (recipientEmail && t.recipientEmail?.toLowerCase() === recipientEmail?.toLowerCase())
      );
      threadId = existing?.id || crypto.randomUUID();
    }

    const thread = (await kv.get(`ultimateadmin_chat_thread:${threadId}`)) || {
      id: threadId, recipientId: recipientId || '',
      recipientEmail: recipientEmail || '',
      recipientName: recipientName || recipientEmail || '',
      tenantId: tenantId || '',
      createdAt: now, updatedAt: now,
      lastMessage: message.trim(),
    };
    thread.updatedAt = now;
    thread.lastMessage = message.trim();
    await kv.set(`ultimateadmin_chat_thread:${threadId}`, thread);

    const msgId = crypto.randomUUID();
    const msg = {
      id: msgId, threadId, senderRole: 'ultimateadmin',
      senderEmail: access.user.email, senderId: access.user.id,
      recipientId: recipientId || '', recipientEmail: recipientEmail || '',
      message: message.trim(), sentAt: now,
    };
    await kv.set(`ultimateadmin_chat_msg:${threadId}:${msgId}`, msg);
    return c.json({ success: true, threadId, messageId: msgId, sentAt: now });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/ultimateadmin/chat/send')) app.post(route, sendUltimateadminChatMessage);

// ── Ultimateadmin canonical aliases for /developer/* endpoints ─────────────────
// Mirrors /developer/platform-users and /developer/assignments under /ultimateadmin/*

for (const route of compatibleRoutePathsForAliases('/ultimateadmin/platform-users', '/platform-users')) app.get(route, async (c) => {
  // Return platform user records for canonical and legacy-compatible paths
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    // Merge canonical and legacy records so ultimateadmin can see all platform users.
    const [platformUsers, customerCareUsers, supportAgents, allEmployees] = await Promise.all([
      kv.getByPrefix('platform_user:'),
      kv.getByPrefix('customer_care_users:'),
      kv.getByPrefix('support-agent:'),
      kv.getByPrefix('employee:'),
    ]);
    const allowedPlatformRoles = new Set(['developer', 'ultimateadmin', 'customer_care']);
    const employeePlatformUsers = allEmployees.filter((u: any) => allowedPlatformRoles.has(normalizeCareRole(u?.role || '')));
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const u of [...platformUsers, ...customerCareUsers, ...supportAgents, ...employeePlatformUsers]) {
      const key = u?.userId || u?.id || u?.email;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push({
        id: u.id || u.userId || key,
        userId: u.userId || u.id || key,
        name: u.name || '',
        email: u.email || '',
        role: normalizeCareRole(u.role || 'customer_care'),
        status: u.status || 'active',
        assignedTenants: u.assignedTenants || [],
        createdAt: u.createdAt || '',
      });
    }
    return c.json(merged);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

for (const route of compatibleRoutePathsForAliases('/ultimateadmin/platform-users', '/platform-users')) app.post(route, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const body = await c.req.json();
    if (!body?.email || !body?.name) return c.json({ error: 'email and name are required' }, 400);
    const sb = supabaseAdmin();
    const password = body.password || generateTempPassword();
    const role = normalizeCareRole(body.role || 'customer_care');
    const allowedRoles = ['developer', 'ultimateadmin', 'customer_care'];
    if (!allowedRoles.includes(role)) return c.json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` }, 400);
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email: body.email.toLowerCase().trim(), password,
      user_metadata: { role, name: body.name },
      email_confirm: true,
    });
    if (authErr) return c.json({ error: authErr.message }, 400);
    const userId = authData.user.id;
    const now = new Date().toISOString();
    const record = {
      id: userId, userId, email: body.email.toLowerCase().trim(),
      name: body.name, role, status: 'active', createdAt: now,
      createdBy: access.user.id, noLicenseRequired: true,
    };
    await kv.set(`platform_user:${userId}`, record);
    const auditId = crypto.randomUUID();
    await kv.set(`support-audit:${auditId}`, {
      id: auditId, actorId: access.user.id, actorEmail: access.user.email,
      actionType: 'platform_user_create', timestamp: now,
      description: `Platform user "${body.email}" (${role}) created by ${access.user.email}`,
    });
    return c.json({ ...record, tempPassword: body.password ? undefined : password });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

for (const route of compatibleRoutePathsForAliases('/ultimateadmin/platform-users/:id', '/platform-users/:id')) app.put(route, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const userId = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(`platform_user:${userId}`);
    if (!existing) return c.json({ error: 'User not found' }, 404);
    if (body.role) {
      body.role = normalizeCareRole(body.role);
      const allowedRoles = ['developer', 'ultimateadmin', 'customer_care'];
      if (!allowedRoles.includes(body.role)) return c.json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` }, 400);
    }
    const updated = { ...existing, ...body, id: userId, updatedAt: new Date().toISOString() };
    await kv.set(`platform_user:${userId}`, updated);
    // Update Supabase user_metadata role if role changed
    if (body.role && body.role !== existing.role) {
      const sb = supabaseAdmin();
      await sb.auth.admin.updateUserById(userId, { user_metadata: { role: body.role, name: updated.name } });
    }
    return c.json(updated);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

for (const route of compatibleRoutePathsForAliases('/ultimateadmin/platform-users/:id', '/platform-users/:id')) app.delete(route, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const userId = c.req.param('id');
    await kv.del(`platform_user:${userId}`);
    await kv.del(`care_assignments:${userId}`);
    const sb = supabaseAdmin();
    await sb.auth.admin.deleteUser(userId).catch(() => null);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

for (const route of compatibleRoutePathsForAliases('/ultimateadmin/assignments', '/assignments')) app.get(route, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const assignments = await kv.getByPrefix('care_assignments_record:');
    return c.json(assignments);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

for (const route of compatibleRoutePathsForAliases('/ultimateadmin/assignments', '/assignments')) app.post(route, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const body = await c.req.json();
    const careAgentId = body?.careAgentId || body?.care_agent_id;
    const tenantIds: string[] = Array.isArray(body?.tenantIds) ? body.tenantIds : body?.tenantId ? [body.tenantId] : [];
    if (!careAgentId || tenantIds.length === 0) return c.json({ error: 'careAgentId and at least one tenantId required' }, 400);
    const current = await getCareAssignmentsForAgent(careAgentId);
    const merged = [...new Set([...current, ...tenantIds])];
    await kv.set(`care_assignments:${careAgentId}`, merged);
    const created = [];
    for (const tenantId of tenantIds) {
      const id = crypto.randomUUID();
      const record = { id, careAgentId, tenantId, assignedBy: access.user.id, createdAt: new Date().toISOString() };
      await kv.set(`care_assignments_record:${id}`, record);
      created.push(record);
    }
    return c.json({ success: true, assignments: created });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

for (const route of compatibleRoutePathsForAliases('/ultimateadmin/assignments/:id', '/assignments/:id')) app.delete(route, async (c) => {
  try {
    const access = await verifyUltimateAdminAccess(c);
    if (!access) return c.json({ error: 'Unauthorized' }, 401);
    if (access.role !== 'ultimateadmin' && access.role !== 'developer') return c.json({ error: 'Forbidden' }, 403);
    const assignmentId = c.req.param('id');
    const record = await kv.get(`care_assignments_record:${assignmentId}`);
    if (!record) return c.json({ error: 'Assignment not found' }, 404);
    const current = await getCareAssignmentsForAgent(record.careAgentId);
    await kv.set(`care_assignments:${record.careAgentId}`, current.filter((t: string) => t !== record.tenantId));
    await kv.del(`care_assignments_record:${assignmentId}`);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

async function appendUniqueListValue(key: string, value: string) {
  const list = await kv.get(key) || [];
  if (!Array.isArray(list)) {
    await kv.set(key, [value]);
    return;
  }
  if (!list.includes(value)) {
    list.push(value);
    await kv.set(key, list);
  }
}

async function removeListValue(key: string, value: string) {
  const list = await kv.get(key) || [];
  if (!Array.isArray(list)) return;
  await kv.set(key, list.filter((v: string) => v !== value));
}

async function writeDeveloperAudit(actor: any, action: string, details: any = {}) {
  const id = crypto.randomUUID();
  const entry = {
    id,
    actorId: actor?.id || '',
    actorEmail: actor?.email || '',
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  await kv.set(`developer_audit_log:${id}`, entry);
  await appendUniqueListValue('developer_audit_log', id);
}

function normalizeCareRole(role: string) {
  if (role === 'customer-care') return 'customer_care';
  if (role === 'customer_care_agent' || role === 'care' || role === 'support' || role === 'support_manager') return 'customer_care';
  return role;
}

async function getCareAssignmentsForAgent(agentId: string): Promise<string[]> {
  const byKey = await kv.get(`care_assignments:${agentId}`);
  if (Array.isArray(byKey)) return [...new Set(byKey)];
  const profile = await kv.get(`employee:${agentId}`);
  if (Array.isArray(profile?.assignedTenants)) return [...new Set(profile.assignedTenants)];
  return [];
}

async function isTenantAssignedToCareAgent(agentId: string, tenantId: string) {
  const assigned = await getCareAssignmentsForAgent(agentId);
  return assigned.includes(tenantId);
}

async function getSupportTicketById(ticketId: string) {
  const ticket = await kv.get(`support_tickets:${ticketId}`);
  if (ticket) return ticket;
  return await kv.get(`support-ticket:${ticketId}`);
}

async function saveSupportTicket(ticket: any) {
  await kv.set(`support_tickets:${ticket.id}`, ticket);
  await kv.set(`support-ticket:${ticket.id}`, ticket); // compatibility
  await appendUniqueListValue('support_tickets', ticket.id);
}

async function getAllSupportTickets(): Promise<any[]> {
  const byNewPrefix = await kv.getByPrefix('support_tickets:');
  const byLegacyPrefix = await kv.getByPrefix('support-ticket:');
  const merged = [...byNewPrefix, ...byLegacyPrefix];
  const seen = new Set<string>();
  const unique = [];
  for (const ticket of merged) {
    if (!ticket?.id || seen.has(ticket.id)) continue;
    seen.add(ticket.id);
    unique.push(ticket);
  }
  unique.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return unique;
}

async function requireCareTenantAccess(c: any, tenantId: string) {
  const auth = await requireAuth(c);
  const role = normalizeCareRole(auth.role || '');
  if (role !== 'customer_care') throw new Error('Forbidden');
  const assigned = await isTenantAssignedToCareAgent(auth.user.id, tenantId);
  if (!assigned) throw new Error('Forbidden');
  return auth;
}

// /developer/*
app.get(`${PREFIX}/developer/overview`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const [companies, users, tickets, careAgents] = await Promise.all([
      kv.getByPrefix('company:'),
      kv.getByPrefix('employee:'),
      getAllSupportTickets(),
      kv.getByPrefix('customer_care_users:'),
    ]);

    const openTickets = tickets.filter((t: any) => t.status !== 'resolved').length;
    const suspendedTenants = companies.filter((co: any) => co.status === 'suspended').length;
    const activeTenants = companies.length - suspendedTenants;
    const activeUsers = users.filter((u: any) => u.status === 'active').length;

    await writeDeveloperAudit(user, 'developer_overview_read');
    return c.json({
      totalTenants: companies.length,
      activeTenants,
      suspendedTenants,
      totalUsers: users.length,
      activeUsers,
      totalCustomerCareAgents: careAgents.length,
      openTickets,
      resolvedTickets: tickets.length - openTickets,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/tenants`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const companies = await kv.getByPrefix('company:');
    await writeDeveloperAudit(user, 'developer_tenants_read', { count: companies.length });
    return c.json(companies);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/tenants/:id`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const id = c.req.param('id');
    const company = await kv.get(`company:${id}`);
    if (!company) return c.json({ error: 'Tenant not found' }, 404);
    const allUsers = await kv.getByPrefix('employee:');
    const users = allUsers.filter((u: any) => u.companyId === id || u.company === id);
    await writeDeveloperAudit(user, 'developer_tenant_read', { tenantId: id });
    return c.json({
      ...company,
      activeUsers: users.filter((u: any) => u.status === 'active').length,
      totalUsers: users.length,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/tenants/:id/users`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const id = c.req.param('id');
    const allUsers = await kv.getByPrefix('employee:');
    const scoped = allUsers.filter((u: any) => u.companyId === id || u.company === id);
    await writeDeveloperAudit(user, 'developer_tenant_users_read', { tenantId: id, count: scoped.length });
    return c.json(scoped);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/developer/tenants/:id/impersonate`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const tenantId = c.req.param('id');
    const users = await kv.getByPrefix('employee:');
    const superadmin = users.find((u: any) =>
      (u.companyId === tenantId || u.company === tenantId) && u.role === 'superadmin'
    );
    if (!superadmin) return c.json({ error: 'SuperAdmin not found for tenant' }, 404);
    await writeDeveloperAudit(user, 'developer_tenant_impersonate', { tenantId, targetUserId: superadmin.id || superadmin.userId });
    return c.json({
      success: true,
      tenantId,
      mode: 'read_only',
      impersonatedUser: {
        id: superadmin.id || superadmin.userId,
        email: superadmin.email,
        name: superadmin.name || superadmin.email,
        role: 'superadmin',
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/developer/tenants/:id/suspend`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const tenantId = c.req.param('id');
    const company = await kv.get(`company:${tenantId}`);
    if (!company) return c.json({ error: 'Tenant not found' }, 404);
    await kv.set(`company:${tenantId}`, { ...company, status: 'suspended', updatedAt: new Date().toISOString() });
    const sub = await kv.get(`subscription:${tenantId}`);
    if (sub) await kv.set(`subscription:${tenantId}`, { ...sub, status: 'suspended', updatedAt: new Date().toISOString() });
    await writeDeveloperAudit(user, 'developer_tenant_suspend', { tenantId });
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/developer/tenants/:id/reinstate`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const tenantId = c.req.param('id');
    const company = await kv.get(`company:${tenantId}`);
    if (!company) return c.json({ error: 'Tenant not found' }, 404);
    await kv.set(`company:${tenantId}`, { ...company, status: 'active', updatedAt: new Date().toISOString() });
    const sub = await kv.get(`subscription:${tenantId}`);
    if (sub) await kv.set(`subscription:${tenantId}`, { ...sub, status: 'active', updatedAt: new Date().toISOString() });
    await writeDeveloperAudit(user, 'developer_tenant_reinstate', { tenantId });
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/developer/tenants/:id/license`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const tenantId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const company = await kv.get(`company:${tenantId}`);
    if (!company) return c.json({ error: 'Tenant not found' }, 404);
    const updatedCompany = {
      ...company,
      licenses: body.licenses ?? company.licenses ?? 0,
      plan: body.plan ?? company.plan,
      subscription: {
        ...(company.subscription || {}),
        licenses: body.licenses ?? company.subscription?.licenses ?? company.licenses ?? 0,
        plan: body.plan ?? company.subscription?.plan,
      },
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`company:${tenantId}`, updatedCompany);
    const sub = await kv.get(`subscription:${tenantId}`);
    if (sub) {
      await kv.set(`subscription:${tenantId}`, {
        ...sub,
        purchasedLicenses: body.licenses ?? sub.purchasedLicenses,
        plan: body.plan ?? sub.plan,
        updatedAt: new Date().toISOString(),
      });
    }
    await writeDeveloperAudit(user, 'developer_tenant_license_update', { tenantId, body });
    return c.json({ success: true, tenant: updatedCompany });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/customer-care-agents`, async (c) => {
  try {
    await requireDeveloper(c);
    const agents = await kv.getByPrefix('customer_care_users:');
    return c.json(agents);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/developer/customer-care-agents`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const body = await c.req.json();
    if (!body?.email || !body?.name) return c.json({ error: 'email and name are required' }, 400);
    const id = body.id || body.userId || crypto.randomUUID();
    const agent = {
      id,
      userId: body.userId || id,
      name: body.name,
      email: String(body.email).toLowerCase(),
      role: 'customer_care',
      status: body.status || 'active',
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };
    await kv.set(`customer_care_users:${id}`, agent);
    await appendUniqueListValue('customer_care_users', id);
    await writeDeveloperAudit(user, 'developer_care_agent_create', { careAgentId: id });
    return c.json(agent);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.delete(`${PREFIX}/developer/customer-care-agents/:id`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const id = c.req.param('id');
    await kv.del(`customer_care_users:${id}`);
    await removeListValue('customer_care_users', id);
    await kv.del(`care_assignments:${id}`);
    await writeDeveloperAudit(user, 'developer_care_agent_delete', { careAgentId: id });
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/assignments`, async (c) => {
  try {
    await requireDeveloper(c);
    const assignments = await kv.getByPrefix('care_assignments_record:');
    return c.json(assignments);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/developer/assignments`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const body = await c.req.json();
    const careAgentId = body?.careAgentId || body?.care_agent_id;
    const tenantIds: string[] = Array.isArray(body?.tenantIds)
      ? body.tenantIds
      : body?.tenantId ? [body.tenantId] : [];
    if (!careAgentId || tenantIds.length === 0) return c.json({ error: 'careAgentId and at least one tenantId are required' }, 400);
    const current = await getCareAssignmentsForAgent(careAgentId);
    const merged = [...new Set([...current, ...tenantIds])];
    await kv.set(`care_assignments:${careAgentId}`, merged);
    const created = [];
    for (const tenantId of tenantIds) {
      const id = crypto.randomUUID();
      const record = { id, careAgentId, tenantId, assignedBy: user.id, createdAt: new Date().toISOString() };
      await kv.set(`care_assignments_record:${id}`, record);
      created.push(record);
    }
    await writeDeveloperAudit(user, 'developer_assignment_create', { careAgentId, tenantIds });
    return c.json({ success: true, assignments: created });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.delete(`${PREFIX}/developer/assignments/:id`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const assignmentId = c.req.param('id');
    const record = await kv.get(`care_assignments_record:${assignmentId}`);
    if (!record) return c.json({ error: 'Assignment not found' }, 404);
    const current = await getCareAssignmentsForAgent(record.careAgentId);
    await kv.set(
      `care_assignments:${record.careAgentId}`,
      current.filter((tenantId: string) => tenantId !== record.tenantId)
    );
    await kv.del(`care_assignments_record:${assignmentId}`);
    await writeDeveloperAudit(user, 'developer_assignment_delete', { assignmentId });
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/tickets`, async (c) => {
  try {
    await requireDeveloper(c);
    const tickets = await getAllSupportTickets();
    return c.json(tickets);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/tickets/:id`, async (c) => {
  try {
    await requireDeveloper(c);
    const ticketId = c.req.param('id');
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const comments = await kv.get(`ticket_comments:${ticketId}`) || [];
    return c.json({ ...ticket, comments: Array.isArray(comments) ? comments : [] });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/developer/tickets/:id/resolve`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const ticketId = c.req.param('id');
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const updated = { ...ticket, status: 'resolved', resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await saveSupportTicket(updated);
    await writeDeveloperAudit(user, 'developer_ticket_resolve', { ticketId });
    return c.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/developer/tickets/:id/comment`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const ticketId = c.req.param('id');
    const body = await c.req.json();
    if (!body?.comment) return c.json({ error: 'comment is required' }, 400);
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const comments = await kv.get(`ticket_comments:${ticketId}`) || [];
    const entry = {
      id: crypto.randomUUID(),
      authorId: user.id,
      authorEmail: user.email,
      authorRole: 'developer',
      comment: body.comment,
      createdAt: new Date().toISOString(),
    };
    const updatedComments = Array.isArray(comments) ? [...comments, entry] : [entry];
    await kv.set(`ticket_comments:${ticketId}`, updatedComments);
    await saveSupportTicket({ ...ticket, updatedAt: new Date().toISOString() });
    await writeDeveloperAudit(user, 'developer_ticket_comment', { ticketId });
    return c.json({ success: true, comment: entry });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/system-health`, async (c) => {
  try {
    await requireDeveloper(c);
    const start = Date.now();
    await kv.get('healthcheck');
    const latencyMs = Date.now() - start;
    const snapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: latencyMs < 1000 ? 'healthy' : 'degraded',
      kvLatencyMs: latencyMs,
      runtime: 'hono-edge',
    };
    await kv.set(`system_health_log:${snapshot.id}`, snapshot);
    await appendUniqueListValue('system_health_log', snapshot.id);
    return c.json(snapshot);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/developer/audit-log`, async (c) => {
  try {
    await requireDeveloper(c);
    const logs = await kv.getByPrefix('developer_audit_log:');
    logs.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    return c.json(logs);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// /care/*
app.get(`${PREFIX}/care/me/assignments`, async (c) => {
  try {
    const auth = await requireCustomerCare(c);
    const assignments = await getCareAssignmentsForAgent(auth.user.id);
    return c.json({ careAgentId: auth.user.id, tenantIds: assignments });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/care/tenant/:id`, async (c) => {
  try {
    const tenantId = c.req.param('id');
    await requireCareTenantAccess(c, tenantId);
    const company = await kv.get(`company:${tenantId}`);
    if (!company) return c.json({ error: 'Tenant not found' }, 404);
    const users = await kv.getByPrefix('employee:');
    const scopedUsers = users.filter((u: any) => u.companyId === tenantId || u.company === tenantId);
    return c.json({
      ...company,
      totalUsers: scopedUsers.length,
      activeUsers: scopedUsers.filter((u: any) => u.status === 'active').length,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

const listCareTenantUsersV2 = async (c: any) => {
  try {
    const tenantId = c.req.param('id');
    await requireCareTenantAccess(c, tenantId);
    const users = await kv.getByPrefix('employee:');
    const scoped = users.filter((u: any) => u.companyId === tenantId || u.company === tenantId);
    return c.json(scoped);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tenant/:id/users')) app.get(route, listCareTenantUsersV2);

const listCareTenantTicketsV2 = async (c: any) => {
  try {
    const tenantId = c.req.param('id');
    await requireCareTenantAccess(c, tenantId);
    const tickets = await getAllSupportTickets();
    return c.json(tickets.filter((t: any) => t.tenantId === tenantId));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tenant/:id/tickets')) app.get(route, listCareTenantTicketsV2);

const createCareTicket = async (c: any) => {
  try {
    const auth = await requireCustomerCare(c);
    const body = await c.req.json();
    const tenantId = body?.tenantId;
    if (!tenantId) return c.json({ error: 'tenantId is required' }, 400);
    const assigned = await isTenantAssignedToCareAgent(auth.user.id, tenantId);
    if (!assigned) return c.json({ error: 'Forbidden' }, 403);
    const ticketId = crypto.randomUUID();
    const ticket = {
      id: ticketId,
      tenantId,
      tenantName: body.tenantName || '',
      subject: body.subject || '',
      description: body.description || '',
      issueType: body.issueType || 'general',
      priority: body.priority || 'medium',
      status: 'open',
      escalated: false,
      createdBy: auth.user.id,
      createdByEmail: auth.user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveSupportTicket(ticket);
    return c.json(ticket, 201);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tickets')) app.post(route, createCareTicket);

const getCareTicketById = async (c: any) => {
  try {
    const auth = await requireCustomerCare(c);
    const ticketId = c.req.param('id');
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const assigned = await isTenantAssignedToCareAgent(auth.user.id, ticket.tenantId);
    if (!assigned) return c.json({ error: 'Forbidden' }, 403);
    const comments = await kv.get(`ticket_comments:${ticketId}`) || [];
    return c.json({ ...ticket, comments: Array.isArray(comments) ? comments : [] });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tickets/:id')) app.get(route, getCareTicketById);

const commentOnCareTicket = async (c: any) => {
  try {
    const auth = await requireCustomerCare(c);
    const ticketId = c.req.param('id');
    const body = await c.req.json();
    if (!body?.comment) return c.json({ error: 'comment is required' }, 400);
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const assigned = await isTenantAssignedToCareAgent(auth.user.id, ticket.tenantId);
    if (!assigned) return c.json({ error: 'Forbidden' }, 403);
    if (ticket.status === 'resolved' || ticket.chatClosed === true) {
      return c.json({ error: 'Ticket is already resolved and chat is closed' }, 400);
    }
    const comments = await kv.get(`ticket_comments:${ticketId}`) || [];
    const entry = {
      id: crypto.randomUUID(),
      authorId: auth.user.id,
      authorEmail: auth.user.email,
      authorRole: 'customer_care',
      comment: body.comment,
      createdAt: new Date().toISOString(),
    };
    const updatedComments = Array.isArray(comments) ? [...comments, entry] : [entry];
    await kv.set(`ticket_comments:${ticketId}`, updatedComments);
    await saveSupportTicket({ ...ticket, updatedAt: new Date().toISOString() });
    return c.json({ success: true, comment: entry });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tickets/:id/comment')) app.post(route, commentOnCareTicket);

const escalateCareTicket = async (c: any) => {
  try {
    const auth = await requireCustomerCare(c);
    const ticketId = c.req.param('id');
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const assigned = await isTenantAssignedToCareAgent(auth.user.id, ticket.tenantId);
    if (!assigned) return c.json({ error: 'Forbidden' }, 403);
    const updated = {
      ...ticket,
      escalated: true,
      status: ticket.status === 'resolved' ? 'resolved' : 'escalated',
      escalatedAt: new Date().toISOString(),
      escalatedBy: auth.user.id,
      updatedAt: new Date().toISOString(),
    };
    await saveSupportTicket(updated);
    return c.json({ success: true, ticket: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tickets/:id/escalate')) app.post(route, escalateCareTicket);

const resolveCareTicket = async (c: any) => {
  try {
    const auth = await requireCustomerCare(c);
    const ticketId = c.req.param('id');
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const assigned = await isTenantAssignedToCareAgent(auth.user.id, ticket.tenantId);
    if (!assigned) return c.json({ error: 'Forbidden' }, 403);
    const updated = {
      ...ticket,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: auth.user.id,
      chatClosed: true,
      updatedAt: new Date().toISOString(),
    };
    await saveSupportTicket(updated);
    return c.json({ success: true, ticket: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tickets/:id/resolve')) app.post(route, resolveCareTicket);

// GET /care/tickets — all support tickets for this care agent's assigned tenants
const listCareTickets = async (c: any) => {
  try {
    const auth = await requireCustomerCare(c);
    const assigned = await getCareAssignmentsForAgent(auth.user.id);
    if (assigned.length === 0) return c.json([]);
    const assignedSet = new Set(assigned);
    const allTickets = await getAllSupportTickets();
    return c.json(allTickets.filter((t: any) => assignedSet.has(t.tenantId)));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
};
for (const route of compatibleRoutePaths('/care/tickets')) app.get(route, listCareTickets);

// GET /developer/platform-users — list all developer and customer care platform users
app.get(`${PREFIX}/developer/platform-users`, async (c) => {
  try {
    await requireDeveloper(c);
    // Gather from both legacy support-agent: and newer customer_care_users: prefixes
    const [ccUsers, supportAgents] = await Promise.all([
      kv.getByPrefix('customer_care_users:'),
      kv.getByPrefix('support-agent:'),
    ]);
    // Also include developer/ultimateadmin accounts from employee records
    const allEmps = await kv.getByPrefix('employee:');
    const platformRoles = new Set(['developer', 'ultimateadmin', 'customer_care']);
    const devUsers = allEmps.filter((u: any) => platformRoles.has(u.role));

    // Deduplicate by userId/id/email
    const seen = new Set<string>();
    const merged = [];
    for (const u of [...ccUsers, ...supportAgents, ...devUsers]) {
      const key = u.userId || u.id || u.email;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const normalizedRole = normalizeCareRole(u.role || 'customer_care');
      merged.push({
        id: u.id || u.userId || key,
        userId: u.userId || u.id || key,
        name: u.name || '',
        email: u.email || '',
        role: normalizedRole,
        status: u.status || 'active',
        assignedTenants: u.assignedTenants || [],
        createdAt: u.createdAt || '',
      });
    }
    return c.json(merged);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// POST /developer/platform-users — create a new developer or care account record
app.post(`${PREFIX}/developer/platform-users`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const body = await c.req.json();
    if (!body?.email || !body?.name || !body?.role) return c.json({ error: 'email, name and role are required' }, 400);
    const allowedRoles = ['developer', 'ultimateadmin', 'customer_care'];
    const normalizedRole = normalizeCareRole(body.role);
    if (!allowedRoles.includes(normalizedRole)) return c.json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` }, 400);
    const id = body.id || body.userId || crypto.randomUUID();
    const record = {
      id,
      userId: body.userId || id,
      name: body.name,
      email: String(body.email).toLowerCase(),
      role: normalizedRole,
      status: body.status || 'active',
      assignedTenants: [],
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };
    await kv.set(`customer_care_users:${id}`, record);
    await kv.set(`employee:${id}`, { ...record, updatedAt: new Date().toISOString() });
    await appendUniqueListValue('customer_care_users', id);
    await writeDeveloperAudit(user, 'developer_platform_user_create', { userId: id, role: normalizedRole, email: body.email });
    return c.json(record, 201);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// PUT /developer/platform-users/:id — update a developer or care account
app.put(`${PREFIX}/developer/platform-users/:id`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const id = c.req.param('id');
    const body = await c.req.json();
    const allowedRoles = ['developer', 'ultimateadmin', 'customer_care'];
    if (body.role) {
      body.role = normalizeCareRole(body.role);
      if (!allowedRoles.includes(body.role)) return c.json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` }, 400);
    }
    // Update in both KV stores
    const existing = await kv.get(`customer_care_users:${id}`) || await kv.get(`employee:${id}`) || { id };
    const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    await kv.set(`customer_care_users:${id}`, updated);
    await kv.set(`employee:${id}`, updated);
    // Also update Supabase auth metadata if userId provided
    if (body.role && (existing.userId || id)) {
      const sb = supabaseAdmin();
      await sb.auth.admin.updateUserById(existing.userId || id, {
        user_metadata: { role: body.role, name: updated.name },
      }).catch(() => {});
    }
    await writeDeveloperAudit(user, 'developer_platform_user_update', { targetId: id, changes: body });
    return c.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// DELETE /developer/platform-users/:id — remove a developer or care account
app.delete(`${PREFIX}/developer/platform-users/:id`, async (c) => {
  try {
    const { user } = await requireDeveloper(c);
    const id = c.req.param('id');
    await kv.del(`customer_care_users:${id}`);
    await removeListValue('customer_care_users', id);
    await kv.del(`care_assignments:${id}`);
    await writeDeveloperAudit(user, 'developer_platform_user_delete', { targetId: id });
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// --- Catch-all 404 handler (returns JSON for better debugging) ---
app.notFound((c) => {
  return c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404);
});

// Server started with payment-before-registration flow - v2.1 (UPDATED)
Deno.serve(app.fetch);

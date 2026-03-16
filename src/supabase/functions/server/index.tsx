// Blumebyte HR Management Server - v2.1 - Payment-First Registration
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { addLicenseRoutes } from "./license-routes.tsx";

const app = new Hono();
const PREFIX = "/make-server-668731fc"; // v2.1 - Payment-first registration flow

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
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

// Simple test endpoint for payment flow
app.post(`${PREFIX}/company/test-payment`, async (c) => {
  console.log('Test payment endpoint called');
  try {
    const body = await c.req.json();
    console.log('Received body:', body);
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

// --- Supabase Admin Client ---
const supabaseAdmin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

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
    console.log('getAuthUser: No token found in request');
    return null;
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error) {
    console.log('getAuthUser: Error validating token:', error.message);
    return null;
  }
  if (!data?.user) {
    console.log('getAuthUser: No user data returned');
    return null;
  }
  return data.user;
}

// Helper to get SuperAdmin user
async function getSuperAdmin() {
  const allUsers = await kv.getByPrefix('employee:');
  return allUsers.find((u: any) => u.role === 'superadmin');
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
    const activeUsers = allUsers.filter((u: any) => u.status === 'active');
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
  const role = kvData?.role || user.user_metadata?.role || "employee";
  
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

// --- Temp password generator ---
function generateTempPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "Bb";
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
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
}) {
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
async function resolveCompanyScope(userId: string) {
  const kvData = await kv.get(`employee:${userId}`);
  if (kvData?.assignedCompanies?.length) return kvData.assignedCompanies;
  const sb = supabaseAdmin();
  const { data } = await sb.auth.admin.getUserById(userId);
  if (data?.user?.user_metadata?.assignedCompanies?.length)
    return data.user.user_metadata.assignedCompanies;
  return null;
}

async function resolveCompanyName(companyId: string): Promise<string> {
  if (!companyId) return "";
  const company = await kv.get(`company:${companyId}`);
  return company?.name || "";
}

// --- Company-based filtering helper ---
async function applyCompanyFilter(items: any[], userId: string, role: string): Promise<any[]> {
  // Superadmin sees everything
  if (role === "superadmin") return items;
  
  // Get user's assigned companies
  const assignedCompanies = await resolveCompanyScope(userId);
  
  // If no company restrictions, return all
  if (!assignedCompanies || assignedCompanies.length === 0) return items;
  
  // Filter items by company
  return items.filter((item: any) => {
    // Check if item has a company assignment
    const itemCompany = item.company || item.companyId || item.companyName;
    if (!itemCompany) return true; // Include items without company assignment
    
    // Check if item's company is in user's assigned companies
    return assignedCompanies.includes(itemCompany);
  });
}

// --- Filter employees by company scope ---
async function filterEmployeesByCompany(employees: any[], userId: string, role: string): Promise<any[]> {
  // Superadmin sees everyone
  if (role === "superadmin") return employees;
  
  const scope = await resolveCompanyScope(userId);
  
  // If no scope, return all employees (except filter by role restrictions)
  if (!scope || scope.length === 0) return employees;
  
  // Filter by company
  return employees.filter((e: any) => {
    const empCompany = e.company || e.companyId;
    if (!empCompany) return false; // Exclude employees without company
    return scope.includes(empCompany);
  });
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
  
  console.log(`${context} error:`, errorMsg, e);
  return c.json({ error: errorMsg }, 500);
}

// --- Generic CRUD factory ---
function makeCrud(prefix: string, kvPrefix: string, guardFn: (c: any) => Promise<any>) {
  // List
  app.get(`${PREFIX}/${prefix}`, async (c) => {
    try {
      const { user, role } = await guardFn(c);
      let items = await kv.getByPrefix(`${kvPrefix}`);
      // Apply company filtering for non-superadmin users
      items = await applyCompanyFilter(items, user.id, role);
      return c.json(items || []);
    } catch (e: any) {
      if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
      if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
      console.log(`Error listing ${prefix}:`, e);
      return c.json({ error: e.message }, 500);
    }
  });

  // Get one
  app.get(`${PREFIX}/${prefix}/:id`, async (c) => {
    try {
      await guardFn(c);
      const id = c.req.param("id");
      const item = await kv.get(`${kvPrefix}${id}`);
      if (!item) return c.json({ error: "Not found" }, 404);
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
      await guardFn(c);
      const body = await c.req.json();
      const id = body.id || crypto.randomUUID();
      const item = { ...body, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await kv.set(`${kvPrefix}${id}`, item);
      return c.json(item, 201);
    } catch (e: any) {
      if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
      if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
      console.log(`Error creating ${prefix}:`, e);
      return c.json({ error: e.message }, 500);
    }
  });

  // Update
  app.put(`${PREFIX}/${prefix}/:id`, async (c) => {
    try {
      await guardFn(c);
      const id = c.req.param("id");
      const body = await c.req.json();
      const existing = await kv.get(`${kvPrefix}${id}`);
      const item = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
      await kv.set(`${kvPrefix}${id}`, item);
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
      await guardFn(c);
      const id = c.req.param("id");
      await kv.del(`${kvPrefix}${id}`);
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
    console.log("check-setup error:", e);
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
      user_metadata: { name, role: "superadmin" },
      email_confirm: true,
    });
    if (error) {
      console.log("Setup superadmin auth error:", error);
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
    console.log("setup-superadmin error:", e);
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
      console.log('Verifying payment reference:', paymentReference);
      
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
          console.log(`Payment verification attempt ${attempts}/${maxAttempts}...`);
          
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
          console.log(`Attempt ${attempts} - Payment verification response:`, JSON.stringify(data));

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

        console.log(`Payment verified successfully: ${paidLicenses} licenses, ${paidAmount} GHS`);
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
    
    console.log('Creating company record:', companyId);
    await kv.set(`company:${companyId}`, company);

    // Create SuperAdmin user in Supabase Auth
    console.log('Creating SuperAdmin auth user for:', adminEmail);
    const { data: authData, error: authError } = await sb.auth.admin.createUser({
      email: adminEmail.toLowerCase(),
      password,
      user_metadata: { 
        name: adminName, 
        role: "superadmin",
        companyId,
        companyName,
      },
      email_confirm: true, // Auto-confirm since we don't have email configured
    });

    if (authError) {
      console.log("Company registration auth error:", authError);
      // Clean up company record if user creation failed
      await kv.del(`company:${companyId}`);
      return c.json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;
    console.log('SuperAdmin user created with ID:', userId);

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

    console.log('SuperAdmin employee record created');

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

    console.log('Company registration completed successfully for:', companyName);
    
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
    console.log("company-registration error:", e);
    return c.json({ error: e.message || "Failed to create company" }, 500);
  }
});

// --- Initialize Payment for Company Registration (Pay-Before-Account-Creation) ---
app.post(`${PREFIX}/company/init-payment`, async (c) => {
  console.log('Init payment endpoint called');
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
    console.log("company-payment-init error:", e);
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
    console.log("payment-status-check error:", e);
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
      },
      email_confirm: true,
    });

    if (authError) {
      console.log("Account creation auth error:", authError);
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
    console.log("create-company-account error:", e);
    return { success: false, error: e.message };
  }
}

// --- Sync user statuses based on subscription (SuperAdmin only) ---
app.post(`${PREFIX}/sync-user-licenses`, async (c) => {
  try {
    const { user: authUser } = await requireSuperAdmin(c);
    
    const subscription = await kv.get(`subscription:${authUser.id}`);
    const allUsers = await kv.getByPrefix('employee:');
    
    // If no subscription or inactive, deactivate all non-superadmin users
    if (!subscription || subscription.status !== 'active') {
      let deactivatedCount = 0;
      for (const user of allUsers) {
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
        message: 'All users deactivated due to inactive subscription',
        deactivatedCount,
        subscription: null
      });
    }
    
    const purchasedLicenses = subscription.purchasedLicenses || 0;
    const superAdminCount = allUsers.filter((u: any) => u.role === 'superadmin').length;
    const availableLicenses = purchasedLicenses - superAdminCount;
    
    // Get all non-superadmin users sorted by creation date (older first)
    const nonSuperAdmins = allUsers
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
      } catch (e) { console.log("Profile image URL refresh error:", e); }
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
    console.log("change-password error:", e.message);
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
      const allEmployees = await kv.getByPrefix("employee:");
      const hrStaff = allEmployees.filter((e: any) => ["superadmin", "admin"].includes(e.role));
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
    console.log("Profile update error:", e.message);
    return c.json({ error: `Profile update failed: ${e.message}` }, 500);
  }
});

// --- Profile change requests (employee -> HR approval) ---
app.get(`${PREFIX}/profile-change-requests`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const all = await kv.getByPrefix("profile-change:");
    if (["superadmin", "admin"].includes(role)) return c.json(all);
    if (role === "manager") {
      const scope = await resolveCompanyScope(user.id);
      if (scope?.length) {
        const employees = await kv.getByPrefix("employee:");
        const managedIds = employees.filter((e: any) => scope.includes(e.companyId) || scope.includes(e.company)).map((e: any) => e.userId);
        return c.json(all.filter((r: any) => managedIds.includes(r.userId)));
      }
      return c.json(all);
    }
    return c.json(all.filter((r: any) => r.userId === user.id));
  } catch (e: any) {
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
    const { user } = await requireAuth(c);
    const allEmployees = await kv.getByPrefix("employee:");
    const result = allEmployees
      .filter((e: any) => e.userId !== user.id)
      .map((e: any) => ({
        userId: e.userId, id: e.userId, name: e.name,
        role: e.role, department: e.department || "", position: e.position || "",
        profileImageUrl: e.profileImageUrl || "",
      }));
    return c.json(result);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// --- Open job postings (any authenticated user) ---
app.get(`${PREFIX}/open-job-postings`, async (c) => {
  try {
    await requireAuth(c);
    const postings = await kv.getByPrefix("job-posting:");
    const open = postings.filter((j: any) => j.status === "open" || j.status === "active");
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
      console.log("ensureBucket listBuckets error:", listErr.message);
      throw new Error(`Storage init failed: ${listErr.message}`);
    }
    const exists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!exists) {
      const { error: createErr } = await sb.storage.createBucket(BUCKET_NAME, { public: false });
      if (createErr) {
        console.log("ensureBucket createBucket error:", createErr.message);
        throw new Error(`Storage bucket creation failed: ${createErr.message}`);
      }
      console.log(`Storage bucket '${BUCKET_NAME}' created successfully`);
    }
    bucketReady = true;
  } catch (e: any) {
    console.log("ensureBucket error:", e.message);
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
      console.log("Profile image upload: No file in formData. Keys:", [...formData.keys()]);
      return c.json({ error: "No file provided" }, 400);
    }
    const blob = file as File;
    const arrayBuf = await blob.arrayBuffer();
    const size = arrayBuf.byteLength;
    console.log(`Profile image upload: file=${blob.name}, size=${size}, type=${blob.type}`);
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
        console.log("Old profile image delete warning:", delErr);
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
      console.log("Profile image storage upload error:", JSON.stringify(uploadErr));
      return c.json({ error: `Upload to storage failed: ${uploadErr.message}` }, 500);
    }
    const { data: urlData, error: urlErr } = await sb.storage.from(BUCKET_NAME).createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    if (urlErr) {
      console.log("Profile image signed URL error:", JSON.stringify(urlErr));
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
    console.log(`Profile image uploaded successfully for user ${user.id}, URL length: ${signedUrl.length}`);
    return c.json({ ...fileMeta, profileImageUrl: signedUrl }, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    console.log("Profile image upload error:", e.message, e.stack);
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
      console.log("Document upload error:", uploadErr);
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
    console.log("Document upload error:", e.message);
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
    console.log("File delete error:", e.message);
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
    const settings = await kv.get("company-settings");
    if (!settings) return c.json({});
    if (settings.logoPath) {
      try {
        const sb = supabaseAdmin();
        const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(settings.logoPath, 60 * 60 * 24 * 7);
        if (urlData?.signedUrl) settings.logoUrl = urlData.signedUrl;
      } catch (e) { console.log("Public logo URL refresh error:", e); }
    }
    return c.json({
      companyName: settings.companyName || '',
      description: settings.description || '',
      primaryColor: settings.primaryColor || '',
      logoUrl: settings.logoUrl || '',
    });
  } catch (e: any) {
    console.log("Public branding fetch error:", e.message);
    return c.json({});
  }
});

app.get(`${PREFIX}/company-settings`, async (c) => {
  try {
    await requireAuth(c);
    const settings = await kv.get("company-settings");
    if (!settings) return c.json({});
    // Refresh logo signed URL if path exists
    if (settings.logoPath) {
      try {
        const sb = supabaseAdmin();
        const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(settings.logoPath, 60 * 60 * 24 * 7);
        if (urlData?.signedUrl) settings.logoUrl = urlData.signedUrl;
      } catch (e) { console.log("Logo URL refresh error:", e); }
    }
    return c.json(settings);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/admin/company-settings`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const body = await c.req.json();
    const existing = await kv.get("company-settings") || {};
    // Strip logoUrl/logoPath from body — only the upload/remove routes should change these
    const { logoUrl: _lu, logoPath: _lp, ...safeBody } = body;
    const updated = { ...existing, ...safeBody, updatedAt: new Date().toISOString() };
    await kv.set("company-settings", updated);
    // Return with fresh signed URL if logo exists
    if (updated.logoPath) {
      try {
        const sb = supabaseAdmin();
        const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(updated.logoPath, 60 * 60 * 24 * 7);
        if (urlData?.signedUrl) updated.logoUrl = urlData.signedUrl;
      } catch (e) { console.log("Logo URL refresh on settings save:", e); }
    }
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

// ============ REFERENCE DATA (aggregated for dashboards) ============
app.get(`${PREFIX}/reference-data`, async (c) => {
  try {
    await requireAuth(c);
    const [companies, departments, branches, assets, assetCategories, paygrades, leaveTypes, financialYears] = await Promise.all([
      kv.getByPrefix("company:"),
      kv.getByPrefix("department:"),
      kv.getByPrefix("branch:"),
      kv.getByPrefix("asset:"),
      kv.getByPrefix("asset-category:"),
      kv.getByPrefix("paygrade:"),
      kv.getByPrefix("leave-type:"),
      kv.getByPrefix("financial-year:"),
    ]);
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
    console.log("reference-data error:", e.message);
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
    
    // Get company ID from super admin's profile
    const adminProfile = await kv.get(`user_profile:${authUser.id}`);
    const userCompanyId = adminProfile?.companyId;
    
    if (!userCompanyId) {
      return c.json({ error: "User not associated with a company" }, 400);
    }
    
    // Check license availability for this company
    const company = await kv.get(`company_by_id:${userCompanyId}`);
    const subscription = company?.subscription;
    
    if (!subscription || subscription.status !== 'active') {
      return c.json({ 
        error: "No active subscription. Please purchase licenses first.",
        needsSubscription: true 
      }, 403);
    }
    
    // Count existing active users in this company
    const companyStats = await kv.get(`company_stats:${userCompanyId}`) || {};
    const usedLicenses = companyStats.usedLicenses || 1; // At least the super admin
    const purchasedLicenses = subscription.licenses || 0;
    
    if (usedLicenses >= purchasedLicenses) {
      return c.json({ 
        error: "No available licenses. Please purchase more licenses to add users.",
        needsLicenses: true,
        usedLicenses,
        purchasedLicenses 
      }, 403);
    }
    
    const tempPassword = generateTempPassword();
    const sb = supabaseAdmin();
    
    let companyName = "";
    if (companyId) companyName = await resolveCompanyName(companyId);

    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: tempPassword,
      user_metadata: { name, role, companyId, company: companyName },
      email_confirm: true,
    });
    if (error) return c.json({ error: error.message }, 400);
    
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
    
    // Update company stats
    await kv.set(`company_stats:${userCompanyId}`, {
      ...companyStats,
      totalEmployees: (companyStats.totalEmployees || 0) + 1,
      activeEmployees: (companyStats.activeEmployees || 0) + 1,
      usedLicenses: usedLicenses + 1,
      availableLicenses: purchasedLicenses - (usedLicenses + 1),
    });
    // Broadcast: new user joined
    const allEmps = await kv.getByPrefix("employee:");
    for (const emp of allEmps) {
      if ((emp.userId || emp.id) === userId) continue;
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: emp.userId || emp.id, type: "new-user",
        title: "New Team Member",
        message: `${name} has joined the organization as ${role}${departments && departments.length > 0 ? " in " + departments.join(", ") : department ? " in " + department : ""}.`,
        read: false, createdAt: new Date().toISOString(),
      });
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
    
    return c.json({ success: true, userId, tempPassword });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    console.log("create user error:", e);
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
    console.log("admin create user error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// List users
app.get(`${PREFIX}/users`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    const allEmployees = await kv.getByPrefix("employee:");
    
    let filtered = allEmployees;
    if (role === "admin") {
      const scope = await resolveCompanyScope(user.id);
      filtered = allEmployees.filter((e: any) => {
        if (e.role === "superadmin") return false;
        if (scope && scope.length > 0) {
          return scope.includes(e.companyId) || scope.includes(e.company);
        }
        return true;
      });
    } else if (role === "manager") {
      const scope = await resolveCompanyScope(user.id);
      filtered = allEmployees.filter((e: any) => {
        if (!["employee", "manager"].includes(e.role)) return false;
        if (scope && scope.length > 0) {
          return scope.includes(e.companyId) || scope.includes(e.company);
        }
        return true;
      });
    } else if (role === "employee") {
      return c.json([allEmployees.find((e: any) => e.userId === user.id)].filter(Boolean));
    }
    
    return c.json(filtered);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    console.log("list users error:", e);
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
    console.log("list users for meetings error:", e);
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
    console.log("my reviews error:", e);
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
    console.log("my tasks error:", e);
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
    const isOwner = existing.assigneeId === user.id || existing.assignedToId === user.id || existing.employeeId === user.id || existing.userId === user.id || existing.assignedTo === userName || existing.assignedTo === user.id || existing.assignee === userName;
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
    console.log("my onboarding error:", e);
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
    console.log("my training error:", e);
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
    console.log("my questionnaires error:", e);
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
    console.log("my disciplinary error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// Get my compliance items (any authenticated user)
app.get(`${PREFIX}/my-compliance`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const allItems = await kv.getByPrefix("compliance:");
    const userName = user.user_metadata?.name || user.email;
    const myItems = allItems.filter((c: any) => {
      // Support assignedTo as array
      const isSingleAssignee = c.responsibleId === user.id || c.responsibleName === userName || c.assignedTo === user.id;
      const isInAssigneesArray = Array.isArray(c.assignedTo) && c.assignedTo.includes(user.id);
      return isSingleAssignee || isInAssigneesArray;
    });
    return c.json(myItems);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    console.log("my compliance error:", e);
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
    const requestId = `approval_req:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    const approvalRequest = {
      id: requestId,
      type: 'user_create',
      requestedBy: adminUser.id,
      requestedByName: (await kv.get(`employee:${adminUser.id}`))?.name || 'Admin',
      userData,
      reason: reason || 'Admin user creation request',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(requestId, approvalRequest);
    return c.json({ success: true, requestId, message: 'Request sent to SuperAdmin' });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.log('request-user-create error:', e);
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
    const requestId = `approval_req:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    const existingUser = await kv.get(`employee:${userId}`);
    if (!existingUser) return c.json({ error: 'User not found' }, 404);
    
    const approvalRequest = {
      id: requestId,
      type: 'user_update',
      requestedBy: adminUser.id,
      requestedByName: (await kv.get(`employee:${adminUser.id}`))?.name || 'Admin',
      userId,
      userName: existingUser.name,
      updates,
      currentData: existingUser,
      reason: reason || 'Admin user update request',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(requestId, approvalRequest);
    return c.json({ success: true, requestId, message: 'Update request sent to SuperAdmin' });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.log('request-user-update error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Get all pending approvals (SuperAdmin only)
app.get(`${PREFIX}/superadmin/pending-approvals`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const allApprovals = await kv.getByPrefix('approval_req:');
    const pending = allApprovals.filter((a: any) => a.status === 'pending');
    return c.json(pending.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    console.log('pending-approvals error:', e);
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
        const tempPassword = Array.from({ length: 12 }, () => 
          'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 57)]
        ).join('');
        
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
        
        // Notify all employees
        const allEmployees = await kv.getByPrefix("employee:");
        for (const emp of allEmployees) {
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
    console.log('approval action error:', e);
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
    
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    console.log("update user error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// Delete user (SuperAdmin ONLY - direct delete with broadcast)
app.delete(`${PREFIX}/users/:userId`, async (c) => {
  try {
    const { user: caller } = await requireSuperAdmin(c);
    const userId = c.req.param("userId");
    const target = await kv.get(`employee:${userId}`);
    const targetName = target?.name || "Unknown User";
    const targetRole = target?.role || "employee";
    // Only a superadmin can delete their own superadmin account; no one can delete another superadmin
    if (targetRole === "superadmin" && userId !== caller.id) return c.json({ error: "Cannot delete another superadmin account" }, 403);
    await kv.del(`employee:${userId}`);
    const sb = supabaseAdmin();
    await sb.auth.admin.deleteUser(userId);
    const allEmployees = await kv.getByPrefix("employee:");
    for (const emp of allEmployees) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: emp.userId || emp.id, type: "user-removed",
        title: "Team Update", message: `${targetName} (${targetRole}) has been removed from the organization.`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    console.log("delete user error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// Superadmin delete user (alias)
app.delete(`${PREFIX}/superadmin/users/:userId`, async (c) => {
  try {
    const { user: caller } = await requireSuperAdmin(c);
    const userId = c.req.param("userId");
    const target = await kv.get(`employee:${userId}`);
    const targetName = target?.name || "Unknown User";
    const targetRole = target?.role || "employee";
    if (targetRole === "superadmin" && userId !== caller.id) return c.json({ error: "Cannot delete another superadmin account" }, 403);
    await kv.del(`employee:${userId}`);
    const sb = supabaseAdmin();
    await sb.auth.admin.deleteUser(userId);
    const allEmployees = await kv.getByPrefix("employee:");
    for (const emp of allEmployees) {
      const nid = crypto.randomUUID();
      await kv.set(`notification:${nid}`, {
        id: nid, userId: emp.userId || emp.id, type: "user-removed",
        title: "Team Update", message: `${targetName} (${targetRole}) has been removed from the organization.`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
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
    const allEmployees = await kv.getByPrefix("employee:");
    const superAdmins = allEmployees.filter((e: any) => e.role === "superadmin");
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
    const all = await kv.getByPrefix("deletion-request:");
    if (role === "superadmin") return c.json(all.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    return c.json(all.filter((r: any) => r.requestedBy === user.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (e: any) {
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
      await kv.del(`employee:${request.targetUserId}`);
      const sb = supabaseAdmin();
      try { await sb.auth.admin.deleteUser(request.targetUserId); } catch (e) { console.log("Auth delete err:", e); }
      const allEmployees = await kv.getByPrefix("employee:");
      for (const emp of allEmployees) {
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
    await requireSuperAdmin(c);
    const userId = c.req.param("userId");
    const target = await kv.get(`employee:${userId}`);
    if (!target) return c.json({ error: "User not found" }, 404);
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
    await requireSuperAdmin(c);
    const { confirmPhrase } = await c.req.json();
    if (confirmPhrase !== "RESET ALL DATA") return c.json({ error: "Type 'RESET ALL DATA' to confirm" }, 400);
    const prefixes = ["company:", "branch:", "department:", "asset:", "asset-category:", "paygrade:", "financial-year:", "leave-type:", "leave:", "attendance:", "announcement:", "message:", "notification:", "job-posting:", "job-application:", "perf-review:", "goal:", "feedback:", "meeting:", "workflow:", "disciplinary:", "compliance:", "training:", "task:", "onboard-checklist:", "payroll-run:", "tax-bracket:", "benefit-plan:", "admin-dept:", "deletion-request:", "profile-change:"];
    let deleted = 0;
    for (const prefix of prefixes) {
      const items = await kv.getByPrefix(prefix);
      for (const item of items) {
        const key = item.userId && item.date ? `${prefix}${item.userId}:${item.date}` : `${prefix}${item.id}`;
        await kv.del(key);
        deleted++;
      }
    }
    try { await kv.del("company-settings"); deleted++; } catch (e) {}
    const allEmployees = await kv.getByPrefix("employee:");
    const sb = supabaseAdmin();
    for (const emp of allEmployees) {
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
    await requireSuperAdmin(c);
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
    await requireSuperAdmin(c);
    const items = await kv.getByPrefix('asset:');
    return c.json(items || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    console.log('Error listing superadmin/asset:', e);
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
    console.log('Error listing admin/assets:', e);
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
    await requireSuperAdmin(c);
    const body = await c.req.json();
    const err = await validateMeetingSchedule(body);
    if (err) return c.json({ error: err }, 400);
    const id = body.id || crypto.randomUUID();
    const item = { ...body, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
makeCrud("superadmin/company", "company:", requireSuperAdmin);
makeCrud("superadmin/branch", "branch:", requireSuperAdmin);
makeCrud("superadmin/department", "department:", requireSuperAdmin);
// Note: superadmin/asset has custom routes above with validation - DO NOT use makeCrud here
makeCrud("superadmin/asset-category", "asset-category:", requireSuperAdmin);
makeCrud("superadmin/paygrade", "paygrade:", requireSuperAdmin);
makeCrud("superadmin/financial-year", "financial-year:", requireSuperAdmin);
makeCrud("superadmin/leave-type", "leave-type:", requireSuperAdmin);
makeCrud("superadmin/payroll-run", "payroll-run:", requireSuperAdmin);
makeCrud("superadmin/tax-bracket", "tax-bracket:", requireSuperAdmin);
makeCrud("superadmin/benefit-plan", "benefit-plan:", requireSuperAdmin);
makeCrud("superadmin/performance-review", "perf-review:", requireSuperAdmin);
makeCrud("superadmin/goal", "goal:", requireSuperAdmin);
makeCrud("superadmin/feedback", "feedback:", requireSuperAdmin);
// Note: meeting create/update handled above with conflict validation
makeCrud("superadmin/meeting", "meeting:", requireSuperAdmin);
makeCrud("superadmin/workflow", "workflow:", requireSuperAdmin);
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
makeCrud("admin/leave-types", "leave-type:", requireAdminOrAbove);
makeCrud("admin/departments", "department:", requireAdminOrAbove);
makeCrud("admin/job-postings", "job-posting:", requireAdminOrAbove);
makeCrud("admin/workflows", "workflow:", requireAdminOrAbove);
makeCrud("admin/performance-reviews", "perf-review:", requireAdminOrAbove);
makeCrud("admin/disciplinary-cases", "disciplinary:", requireAdminOrAbove);
makeCrud("admin/compliance-items", "compliance:", requireAdminOrAbove);
makeCrud("admin/tasks", "task:", requireAdminOrAbove);
makeCrud("admin/feedback", "feedback:", requireAdminOrAbove);
makeCrud("admin/training-program", "training:", requireAdminOrAbove);

// ============ COMPANY LOGO UPLOAD ============
app.post(`${PREFIX}/upload/company-logo`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    await ensureBucket();
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
    const storagePath = `company/logo.${ext}`;
    const sb = supabaseAdmin();
    const uint8 = new Uint8Array(arrayBuf);
    await sb.storage.from(BUCKET_NAME).upload(storagePath, uint8, {
      contentType: blob.type || `image/${ext}`,
      upsert: true,
    });
    const { data: urlData } = await sb.storage.from(BUCKET_NAME).createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    const logoUrl = urlData?.signedUrl || '';
    const existing = await kv.get("company-settings") || {};
    await kv.set("company-settings", { ...existing, logoUrl, logoPath: storagePath, updatedAt: new Date().toISOString() });
    return c.json({ logoUrl, success: true }, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    console.log("Company logo upload error:", e.message);
    return c.json({ error: `Logo upload failed: ${e.message}` }, 500);
  }
});

// ============ REMOVE COMPANY LOGO ============
app.delete(`${PREFIX}/admin/remove-company-logo`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const sb = supabaseAdmin();
    const existing = await kv.get("company-settings") || {};
    if (existing.logoPath) {
      await sb.storage.from(BUCKET_NAME).remove([existing.logoPath]);
    }
    const updated = { ...existing, logoUrl: '', logoPath: '', updatedAt: new Date().toISOString() };
    await kv.set("company-settings", updated);
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    console.log("Remove company logo error:", e.message);
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
    const item = { ...body, id, createdBy: user.id, createdByName: kvData?.name || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
    const { kvData } = await requireAdminOrAbove(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`training:${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`training:${id}`, updated);
    // Broadcast notification for training completion
    if (body.status && ["completed", "active"].includes(body.status)) {
      const allEmps = await kv.getByPrefix("employee:");
      for (const emp of allEmps) {
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
    await requireAdminOrAbove(c);
    const employees = await kv.getByPrefix("employee:");
    const attendance = await kv.getByPrefix("attendance:");
    const report = employees.map((e: any) => {
      const empAtt = attendance.filter((a: any) => a.userId === (e.userId || e.id));
      return { userId: e.userId || e.id, name: e.name, email: e.email, role: e.role, department: e.department, company: e.company, position: e.position, status: e.status, phone: e.phone, attendanceDays: empAtt.length, totalHoursWorked: empAtt.reduce((s: number, a: any) => s + (parseFloat(a.totalHours) || 0), 0).toFixed(1), joinDate: e.createdAt };
    });
    return c.json(report);
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403); return c.json({ error: e.message }, 500); }
});

app.get(`${PREFIX}/reports/attendance`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const attendance = await kv.getByPrefix("attendance:");
    const employees = await kv.getByPrefix("employee:");
    const empMap: Record<string, string> = {};
    for (const e of employees) empMap[e.userId || e.id] = e.name;
    const report = attendance.map((a: any) => ({ ...a, employeeName: empMap[a.userId] || a.userId })).sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    return c.json(report);
  } catch (e: any) { if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401); if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403); return c.json({ error: e.message }, 500); }
});

// ============ LEAVE REQUESTS ============
app.post(`${PREFIX}/leave-requests`, async (c) => {
  try {
    const { user } = await requireAuth(c);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const kvData = await kv.get(`employee:${user.id}`);
    const leave = {
      id,
      userId: user.id,
      employeeName: kvData?.name || user.user_metadata?.name || "",
      department: kvData?.department || "",
      ...body,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`leave:${id}`, leave);
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
      await kv.set(`notification:${nid}`, {
        id: nid, userId: existing.userId, type: "leave-update",
        title: `Leave ${body.status === "approved" ? "Approved" : body.status === "rejected" ? "Rejected" : "Updated"}`,
        message: `Your ${existing.leaveType || ""} leave request has been ${body.status}`,
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
    console.log('Get training programs error:', e);
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
    
    const id = `training_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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

// ============ AUTO-CLOCK SETTINGS ============
app.get(`${PREFIX}/auto-clock-settings`, async (c) => {
  try {
    await requireAuth(c);
    const settings = await kv.get("auto-clock-settings");
    return c.json(settings || { enabled: false, clockInTime: "08:00", clockOutTime: "17:00", mode: "all", specificUsers: [], inactivityTimeout: 30 });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/auto-clock-settings`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const body = await c.req.json();
    const settings = { ...body, updatedAt: new Date().toISOString() };
    await kv.set("auto-clock-settings", settings);
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
    await requireAuth(c);
    const settings = await kv.get("manual-clock-settings");
    return c.json(settings || { enabled: true, mode: "all", specificUsers: [] });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

app.put(`${PREFIX}/manual-clock-settings`, async (c) => {
  try {
    await requireAdminOrAbove(c);
    const body = await c.req.json();
    const settings = { ...body, updatedAt: new Date().toISOString() };
    await kv.set("manual-clock-settings", settings);
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
    await requireAuth(c);
    const autoSettings = await kv.get("auto-clock-settings");
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
    console.log("Batch auto-clockout error:", e.message);
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
    console.log("Auto clock-in error:", e.message);
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
    console.log("Auto pause error:", e.message);
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
    const updated = { ...existing, clockOut: now.toISOString(), isPaused: false, pauses, totalPausedMinutes: Math.round(totalPausedMs / 60000), status: "present", regularMinutes: Math.min(activeMinutes, 480), overtimeMinutes: Math.max(0, activeMinutes - 480), autoClocked: true, updatedAt: now.toISOString() };
    await kv.set(key, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    console.log("Auto clock-out error:", e.message);
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
      const autoSettings = await kv.get("auto-clock-settings");
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
    const record = {
      userId: user.id,
      employeeName: kvData?.name || user.user_metadata?.name || "",
      date: today,
      clockIn: now.toISOString(),
      clockOut: null,
      status: "present",
      isWeekend: [0, 6].includes(now.getDay()),
      regularMinutes: 0,
      overtimeMinutes: 0,
      createdAt: now.toISOString(),
    };
    await kv.set(key, record);
    return c.json(record, 201);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    console.log("Clock-in error:", e.message);
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
      status: "present",
      regularMinutes: Math.min(activeMinutes, 480),
      overtimeMinutes: Math.max(0, activeMinutes - 480),
      updatedAt: now.toISOString(),
    };
    await kv.set(key, updated);
    return c.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    console.log("Clock-out error:", e.message);
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
    const item = {
      id,
      ...body,
      authorName: kvData?.name || "",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`announcement:${id}`, item);
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
    const { user } = await requireAuth(c);
    const allMessages = await kv.getByPrefix("message:");
    // Filter messages for current user (either sender or recipient)
    const userMessages = allMessages.filter((m: any) => 
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
    
    const message = {
      id,
      senderId: user.id,
      senderName: senderData?.name || "",
      recipientId: body.recipientId,
      recipientName: recipientData?.name || "",
      message: body.message,
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
    const item = {
      id,
      ...body,
      authorName: kvData?.name || "",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`announcement:${id}`, item);
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
      
      // Notify all employees
      const allEmployees = await kv.getByPrefix("employee:");
      for (const emp of allEmployees) {
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
    console.log('Approve hiring error:', e);
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
    await requireAuth(c);
    const body = await c.req.json();
    const allEmployees = await kv.getByPrefix("employee:");
    const notifs: any[] = [];
    for (const emp of allEmployees) {
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
      createdAt: new Date().toISOString(),
    };
    await kv.set(`job-application:${id}`, application);
    const allEmployees = await kv.getByPrefix("employee:");
    const hrStaff = allEmployees.filter((e: any) => ["superadmin", "admin"].includes(e.role));
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
        await kv.set(approvalId, {
          id: approvalId,
          type: "hiring",
          applicationId: id,
          applicantName: existing.applicantName,
          jobTitle: existing.jobTitle,
          requestedBy: user.id,
          requestedByName: user.user_metadata?.name || user.email,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        
        // Notify all SuperAdmins
        const allEmployees = await kv.getByPrefix("employee:");
        const superadmins = allEmployees.filter((e: any) => e.role === "superadmin");
        for (const sa of superadmins) {
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
      const allEmployees = await kv.getByPrefix("employee:");
      for (const emp of allEmployees) {
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
    await requireSuperAdmin(c);
    const prefixes = ["employee:", "company:", "branch:", "department:", "asset:", "asset-category:", "paygrade:", "financial-year:", "leave-type:", "leave:", "attendance:", "announcement:", "message:", "notification:", "job-posting:", "job-application:", "perf-review:", "goal:", "feedback:", "meeting:", "workflow:", "disciplinary:", "compliance:", "training:", "task:", "onboard-checklist:", "payroll-run:", "tax-bracket:", "benefit-plan:", "admin-dept:", "deletion-request:", "profile-change:"];
    const backup: Record<string, any[]> = {};
    for (const p of prefixes) {
      const items = await kv.getByPrefix(p);
      if (items.length > 0) backup[p] = items;
    }
    const settings = await kv.get("company-settings");
    if (settings) backup["_singleton:company-settings"] = [settings];
    return c.json({ version: "1.0", timestamp: new Date().toISOString(), data: backup });
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    if (e.message === "Forbidden") return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/backup/restore`, async (c) => {
  try {
    await requireSuperAdmin(c);
    const { data } = await c.req.json();
    if (!data || typeof data !== "object") return c.json({ error: "Invalid backup data" }, 400);
    let restored = 0;
    for (const [prefix, items] of Object.entries(data)) {
      if (prefix === "_singleton:company-settings") {
        const arr = items as any[];
        if (arr[0]) { await kv.set("company-settings", arr[0]); restored++; }
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
    console.log("Restore error:", e);
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
    
    // Superadmin sees all logs, others see only their company's logs
    let filteredLogs = logs;
    if (role !== "superadmin") {
      filteredLogs = await applyCompanyFilter(logs, user.id, role);
    }
    
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
    console.log("Error fetching audit logs:", e);
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
    console.log("Error fetching user audit logs:", e);
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
    console.log("Error creating audit log:", e);
    return c.json({ error: e.message }, 500);
  }
});

// Global error handler
app.onError((err, c) => {
  const msg = err?.message || "";
  if (msg.includes("EPIPE") || msg.includes("broken pipe")) {
    console.log("Suppressed broken pipe error");
    return c.json({ error: "connection closed" }, 499);
  }
  console.log("Unhandled server error:", err);
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
    
    // Get all employees from KV store
    const allUsers = await kv.getByPrefix('employee:');
    
    // Count all users (including superadmin, admin, manager, employee)
    const count = allUsers.length || 1; // Minimum 1 user (the superadmin)
    
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
      // Find the superadmin's subscription
      const allEmployees = await kv.getByPrefix('employee:');
      const superadmin = allEmployees.find((emp: any) => emp.role === 'superadmin');
      
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

// Initialize Paystack payment
app.post(`${PREFIX}/subscription/initialize`, async (c) => {
  try {
    const { user, role } = await requireSuperAdmin(c);
    const body = await c.req.json();
    const { plan, userCount, amount } = body;
    
    if (!plan || !userCount || !amount) {
      return c.json({ error: 'Missing required fields: plan, userCount, amount' }, 400);
    }
    
    if (!['monthly', 'yearly'].includes(plan)) {
      return c.json({ error: 'Invalid plan. Must be "monthly" or "yearly"' }, 400);
    }
    
    // Validate pricing
    const expectedPrice = plan === 'monthly' ? userCount * 5 : userCount * 4 * 12;
    if (amount !== expectedPrice) {
      return c.json({ error: 'Invalid amount for the selected plan' }, 400);
    }
    
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return c.json({ error: 'Payment gateway not configured' }, 500);
    }
    
    // Initialize Paystack transaction
    const reference = `SUB_${user.id}_${Date.now()}`;
    const callbackUrl = `${c.req.header('origin')}/payment-verify`;
    
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Paystack expects amount in kobo (cents)
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
              value: userCount.toString(),
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
        console.log('Licenses added via webhook:', subscription);
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
        console.log('Subscription activated via webhook:', subscription);
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
    // Filter by company scope for admins and managers
    if (role !== 'superadmin') {
      employees = await filterEmployeesByCompany(employees, user.id, role);
    }
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
    // SuperAdmin sees all, others see only their assigned companies
    if (role !== 'superadmin') {
      const scope = await resolveCompanyScope(user.id);
      if (scope?.length) {
        companies = companies.filter((c: any) => scope.includes(c.id) || scope.includes(c.name));
      }
    }
    return c.json(companies || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get all departments for reporting
app.get(`${PREFIX}/departments`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let departments = await kv.getByPrefix('department:');
    // Filter by company scope if needed
    if (role !== 'superadmin') {
      const scope = await resolveCompanyScope(user.id);
      if (scope?.length) {
        departments = departments.filter((d: any) => !d.companyId || scope.includes(d.companyId));
      }
    }
    return c.json(departments || []);
  } catch (e: any) {
    if (e.message === "Unauthorized") return c.json({ error: "Unauthorized" }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// Get all attendance records for reporting
app.get(`${PREFIX}/attendance-records`, async (c) => {
  try {
    const { user, role } = await requireAuth(c);
    let attendance = await kv.getByPrefix('attendance:');
    
    // Filter by employee company scope
    if (role !== 'superadmin') {
      const employees = await kv.getByPrefix('employee:');
      const filteredEmployees = await filterEmployeesByCompany(employees, user.id, role);
      const allowedUserIds = new Set(filteredEmployees.map((e: any) => e.id || e.userId));
      attendance = attendance.filter((a: any) => allowedUserIds.has(a.userId));
    }
    
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
    
    // Filter by company scope if needed
    if (role !== 'superadmin') {
      const scope = await resolveCompanyScope(user.id);
      if (scope?.length) {
        payrollRuns = payrollRuns.filter((p: any) => !p.companyId || scope.includes(p.companyId));
      }
    }
    
    return c.json(payrollRuns || []);
  } catch (e: any) {
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
    
    // Filter by employee company scope
    if (role !== 'superadmin') {
      const employees = await kv.getByPrefix('employee:');
      const filteredEmployees = await filterEmployeesByCompany(employees, user.id, role);
      const allowedUserIds = new Set(filteredEmployees.map((e: any) => e.id || e.userId));
      reviews = reviews.filter((r: any) => allowedUserIds.has(r.employeeId));
    }
    
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
    
    // Filter by employee company scope
    if (role === 'employee') {
      enrollments = enrollments.filter((e: any) => e.userId === user.id);
    } else if (role !== 'superadmin') {
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
    
    // Filter by company scope and assignment
    if (role === 'employee') {
      assets = assets.filter((a: any) => a.assignedTo === user.id);
    } else if (role !== 'superadmin') {
      const scope = await resolveCompanyScope(user.id);
      if (scope?.length) {
        assets = assets.filter((a: any) => !a.companyId || scope.includes(a.companyId));
      }
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
app.post(`${PREFIX}/chat/send`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const { message } = await c.req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get user profile for name and company - use employee: key for consistency
    const userProfile = await kv.get(`employee:${authUser.user.id}`);
    const userName = userProfile?.name || authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'Anonymous';
    const companyId = userProfile?.companyId;

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
});

// Get chat messages (Company-scoped)
app.get(`${PREFIX}/chat/messages`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    
    // Get user profile to find company - use employee: key for consistency
    const userProfile = await kv.get(`employee:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

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
});

// ========================================
// EMPLOYEE SELF-SERVICE PORTAL ENDPOINTS
// ========================================

// Get employee profile
app.get(`${PREFIX}/employee/profile`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await kv.get(`user_profile:${authUser.user.id}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json(profile);
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
    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    const payslips = await kv.get(`payslips:${companyId}:${authUser.user.id}`) || [];

    return c.json({ payslips });
  } catch (e: any) {
    console.error('Get payslips error:', e);
    if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ error: 'Failed to get payslips' }, 500);
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
        amount: amount * 100, // Paystack expects amount in kobo
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
    await kv.delete(`pending_payment:${reference}`);

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
    const { additionalLicenses, amount } = await c.req.json();

    const userProfile = await kv.get(`user_profile:${authUser.user.id}`);
    const companyId = userProfile?.companyId;

    if (!companyId) {
      return c.json({ error: 'User not associated with a company' }, 400);
    }

    const company = await kv.get(`company_by_id:${companyId}`);
    
    // Create payment reference
    const reference = `LIC_${companyId.slice(0, 8)}_${Date.now()}`;

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
        amount: amount * 100,
        reference: reference,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-668731fc/subscription/verify-license-upgrade?reference=${reference}`,
        metadata: {
          companyId: companyId,
          companyName: company.name,
          additionalLicenses: additionalLicenses,
          userId: authUser.user.id,
        },
      }),
    });

    const data = await paystackResponse.json();

    if (!data.status) {
      return c.json({ error: data.message || 'Failed to initialize payment' }, 400);
    }

    // Store pending payment
    await kv.set(`pending_license:${reference}`, {
      reference,
      companyId,
      additionalLicenses,
      amount,
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

    await kv.delete(`pending_license:${reference}`);

    return c.redirect(`${Deno.env.get('APP_URL')}/superadmin?licenses=upgraded`);
  } catch (e: any) {
    console.error('Verify license upgrade error:', e);
    return c.redirect(`${Deno.env.get('APP_URL')}/subscription?error=verification_failed`);
  }
});

// AI Assistant endpoint (Google Gemini)
app.post(`${PREFIX}/ai-assistant`, async (c) => {
  try {
    console.log('AI Assistant endpoint called');
    console.log('Authorization header:', c.req.header('Authorization')?.substring(0, 30) + '...');
    
    // Try to authenticate
    let authUser;
    try {
      const authResult = await requireAuth(c);
      authUser = authResult.user;
      console.log('AI Assistant: User authenticated:', authUser?.id);
    } catch (authError: any) {
      console.log('AI Assistant: Auth error:', authError.message);
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    // Parse request body
    let message, history;
    try {
      const body = await c.req.json();
      message = body.message;
      history = body.history;
      console.log('AI Assistant: Message received, length:', message?.length || 0);
    } catch (parseError: any) {
      console.log('AI Assistant: JSON parse error:', parseError.message);
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
    if (!message || typeof message !== 'string') {
      console.log('AI Assistant: Invalid message format');
      return c.json({ error: 'Message is required' }, 400);
    }
    
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.log('AI Assistant error: GEMINI_API_KEY not configured');
      return c.json({ error: 'Blumebyte is not configured. Please contact your administrator.' }, 500);
    }
    
    console.log('AI Assistant: API key found, length:', apiKey.length);
    
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
      console.log('AI Assistant: Making request to Gemini API');
      
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
      
      console.log('AI Assistant: Gemini API response status:', geminiResponse.status);
      
      if (!geminiResponse.ok) {
        // Try to get error details from Gemini
        let errorBody = '';
        try {
          errorBody = await geminiResponse.text();
          console.log('AI Assistant: Gemini API error response:', errorBody);
        } catch (e) {
          console.log('AI Assistant: Could not read error body');
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
        
        console.log('AI Assistant: Returning error to client:', { errorMessage, errorDetails, statusCode: geminiResponse.status });
        
        return c.json({ 
          error: errorMessage,
          details: errorDetails,
          statusCode: geminiResponse.status,
          rawError: errorBody.substring(0, 500)
        }, 500);
      }
      
      const data = await geminiResponse.json();
      console.log('AI Assistant: Gemini API response structure:', JSON.stringify(data).substring(0, 200));
      
      // Extract response from Gemini
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response. Please try again.';
      
      return c.json({ response: aiResponse });
      
    } catch (fetchError: any) {
      console.log('AI Assistant: Fetch error:', fetchError.message, fetchError.stack);
      return c.json({ 
        error: 'Failed to communicate with Blumebyte. Please try again.',
        details: fetchError.message 
      }, 500);
    }
    
  } catch (e: any) {
    console.log('AI Assistant: General error:', e.message, e.stack);
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
    const profile = await getUserProfile(authUser.user.id);
    const companyId = profile?.companyId;
    
    const workflows = await kv.getByPrefix('automation_workflow:');
    const filtered = workflows.filter((w: any) => w.companyId === companyId || !w.companyId);
    
    return c.json({ data: filtered });
  } catch (e: any) {
    return handleError(e, c, 'get-workflows');
  }
});

app.post(`${PREFIX}/automation/workflows`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const data = await c.req.json();
    const id = crypto.randomUUID();
    
    const workflow = {
      id,
      ...data,
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
    const profile = await getUserProfile(authUser.user.id);
    const companyId = profile?.companyId;
    
    const tasks = await kv.getByPrefix('automation_task:');
    const filtered = tasks.filter((t: any) => t.companyId === companyId || !t.companyId);
    
    return c.json({ data: filtered });
  } catch (e: any) {
    return handleError(e, c, 'get-scheduled-tasks');
  }
});

app.post(`${PREFIX}/automation/scheduled-tasks`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const data = await c.req.json();
    const id = crypto.randomUUID();
    
    const task = {
      id,
      ...data,
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
    const profile = await getUserProfile(authUser.user.id);
    const companyId = profile?.companyId;
    
    const rules = await kv.getByPrefix('automation_rule:');
    const filtered = rules.filter((r: any) => r.companyId === companyId || !r.companyId);
    
    return c.json({ data: filtered });
  } catch (e: any) {
    return handleError(e, c, 'get-business-rules');
  }
});

app.post(`${PREFIX}/automation/business-rules`, async (c) => {
  try {
    const authUser = await requireAuth(c);
    const profile = await getUserProfile(authUser.user.id);
    
    if (!['superadmin', 'admin'].includes(profile?.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const data = await c.req.json();
    const id = crypto.randomUUID();
    
    const rule = {
      id,
      ...data,
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
      const autoSettings = await kv.get("auto-clock-settings");
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

// --- Catch-all 404 handler (returns JSON for better debugging) ---
app.notFound((c) => {
  console.log(`404 Not Found: ${c.req.method} ${c.req.url}`);
  return c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404);
});

// Server started with payment-before-registration flow - v2.1 (UPDATED)
Deno.serve(app.fetch);
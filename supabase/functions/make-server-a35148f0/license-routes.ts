import { Hono } from 'npm:hono@4.7.7';
import * as kv from './kv_store.ts';
import { usdToPaystackAmount } from './currency-utils.ts';
import { recalculateCompanyStats } from './sync-company-stats.ts';

const PREFIX = '/make-server-a35148f0';
const subscriptionRoutePaths = (path: string) =>
  Array.from(new Set([`${PREFIX}${path}`, path, `/:functionName${path}`]));
const BILLING_EMAIL_FROM = (Deno.env.get('EMAIL_FROM') || 'Blumebyte HR <noreply@blumebyte.com>').includes('@')
  ? (Deno.env.get('EMAIL_FROM') || 'Blumebyte HR <noreply@blumebyte.com>')
  : 'Blumebyte HR <noreply@blumebyte.com>';
const OPERATIONS_COPY_EMAIL = 'info@blumebyte.com';

function getCanonicalSubscriptionLicenses(subscription: any): number {
  return Number(
    subscription?.purchasedLicenses ??
    subscription?.userCount ??
    subscription?.licenses ??
    0
  ) || 0;
}

function normalizeSubscriptionRole(role: any): string {
  return String(role || '').trim().toLowerCase().replace(/[_-]/g, '');
}

function toValidDate(value: any): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSubscriptionActive(subscription: any): boolean {
  const status = String(subscription?.status || '').toLowerCase();
  if (['expired', 'inactive', 'suspended', 'cancelled', 'canceled', 'disabled', 'past_due', 'payment_failed'].includes(status)) {
    return false;
  }
  const endDate = toValidDate(subscription?.endDate) || toValidDate(subscription?.expiresAt);
  if (endDate) return endDate > new Date();
  return status === 'active';
}

function calculateExtendedEndDate(subscription: any, plan: any): Date {
  const now = new Date();
  const currentEnd = toValidDate(subscription?.endDate) || toValidDate(subscription?.expiresAt);
  const base = currentEnd && currentEnd > now ? currentEnd : now;
  const endDate = new Date(base);
  if (String(plan || subscription?.plan || '').toLowerCase() === 'monthly') {
    endDate.setDate(endDate.getDate() + 30);
  } else {
    endDate.setDate(endDate.getDate() + 365);
  }
  return endDate;
}

async function verifyPaystackSignature(body: string, secret: string, signature: string | null) {
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}

async function sendBillingEmail(to: string, subject: string, html: string) {
  if (!to) return;
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.warn(`sendBillingEmail skipped for ${to}: RESEND_API_KEY is not configured`);
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: BILLING_EMAIL_FROM,
      to,
      cc: OPERATIONS_COPY_EMAIL,
      subject,
      html,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`sendBillingEmail failed ${response.status}:`, body.slice(0, 300));
  }
}

async function getBillingRecipient(userId: string, fallbackEmail = '') {
  const employee = await kv.get(`employee:${userId}`);
  return employee?.email || fallbackEmail || '';
}

async function resolveBillingSubscriptionContext(userId: string): Promise<{
  companyId: string | null;
  ownerUserId: string | null;
  subscription: any | null;
}> {
  const employeeRecord = await kv.get(`employee:${userId}`);
  const companyId = employeeRecord?.companyId || employeeRecord?.company || null;
  let ownerUserId: string | null = userId;

  if (companyId) {
    const allEmployees = await kv.getByPrefix('employee:');
    const companySuperAdmin = allEmployees.find((emp: any) =>
      normalizeSubscriptionRole(emp?.role) === 'superadmin' &&
      (emp?.companyId === companyId || emp?.company === companyId)
    );
    ownerUserId = String(companySuperAdmin?.userId || companySuperAdmin?.id || userId || '').trim() || null;
  }

  const candidates = [...new Set(
    [userId, ownerUserId, companyId]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  )];

  for (const candidate of candidates) {
    const subscription = await kv.get(`subscription:${candidate}`);
    if (subscription) {
      return { companyId, ownerUserId, subscription };
    }
  }

  return { companyId, ownerUserId, subscription: null };
}

async function syncCompanySubscriptionMirror(userId: string, subscription: any) {
  const employee = await kv.get(`employee:${userId}`);
  const companyId = employee?.companyId || employee?.company;
  if (!companyId) return null;

  const purchasedLicenses = getCanonicalSubscriptionLicenses(subscription);
  const mirroredSubscription = {
    ...subscription,
    userId,
    companyId,
    purchasedLicenses,
    licenses: purchasedLicenses,
    userCount: purchasedLicenses,
    status: subscription?.status || 'active',
  };

  const existingCompany = await kv.get(`company:${companyId}`) || await kv.get(`company_by_id:${companyId}`);
  if (existingCompany) {
    const updatedCompany = {
      ...existingCompany,
      licenses: purchasedLicenses,
      subscriptionStatus: mirroredSubscription.status,
      subscriptionPlan: mirroredSubscription.plan || existingCompany.subscriptionPlan || 'none',
      subscriptionStartDate: mirroredSubscription.startDate || existingCompany.subscriptionStartDate || null,
      subscriptionEndDate: mirroredSubscription.endDate || existingCompany.subscriptionEndDate || null,
      subscription: {
        ...(existingCompany.subscription || {}),
        ...mirroredSubscription,
      },
    };
    await kv.set(`company:${companyId}`, updatedCompany);
    await kv.set(`company_by_id:${companyId}`, updatedCompany);
  }

  await kv.set(`subscription:${companyId}`, mirroredSubscription);

  try {
    await recalculateCompanyStats(companyId);
  } catch (error) {
    console.error('Failed to sync company subscription mirror:', error);
  }

  return companyId;
}

export function addLicenseRoutes(app: Hono, kv: any, requireAuth: any, requireSuperAdmin: any, logAudit: any) {
  const initializePaystackTransaction = async ({
    paystackSecretKey,
    email,
    reference,
    callbackUrl,
    preferredAmountSmallestUnit,
    preferredCurrency,
    amountUsd,
    metadata,
  }: {
    paystackSecretKey: string;
    email: string;
    reference: string;
    callbackUrl: string;
    preferredAmountSmallestUnit: number;
    preferredCurrency: string;
    amountUsd: number;
    metadata: Record<string, any>;
  }) => {
    const callInitialize = async (payload: Record<string, any>) => {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      let json: any = null;
      try {
        json = rawText ? JSON.parse(rawText) : null;
      } catch {
        json = null;
      }

      return { response, rawText, json };
    };

    const primaryPayload = {
      email,
      amount: preferredAmountSmallestUnit,
      currency: preferredCurrency,
      reference,
      callback_url: callbackUrl,
      metadata,
    };

    const primary = await callInitialize(primaryPayload);
    if (primary.response.ok && primary.json?.status) {
      return {
        success: true,
        paystackData: primary.json,
        amountSmallestUnit: preferredAmountSmallestUnit,
        currency: preferredCurrency,
      };
    }

    const primaryMessage = (primary.json?.message || primary.rawText || '').toString();
    const shouldRetryWithUsd =
      /invalid amount/i.test(primaryMessage) &&
      preferredCurrency !== 'USD';

    if (!shouldRetryWithUsd) {
      return {
        success: false,
        message: primaryMessage || `Paystack API error: ${primary.response.status} ${primary.response.statusText}`,
        details: primary.rawText,
        paystackResponse: primary.json,
      };
    }

    const usdAmountSmallestUnit = Math.round(Number(amountUsd || 0) * 100);
    if (!usdAmountSmallestUnit || usdAmountSmallestUnit < 100) {
      return {
        success: false,
        message: primaryMessage || 'Invalid amount for the selected plan',
        details: primary.rawText,
        paystackResponse: primary.json,
      };
    }

    const fallbackPayload = {
      email,
      amount: usdAmountSmallestUnit,
      currency: 'USD',
      reference,
      callback_url: callbackUrl,
      metadata: {
        ...metadata,
        paystackCurrencyFallback: true,
        originalCurrency: preferredCurrency,
      },
    };

    const fallback = await callInitialize(fallbackPayload);
    if (fallback.response.ok && fallback.json?.status) {
      return {
        success: true,
        paystackData: fallback.json,
        amountSmallestUnit: usdAmountSmallestUnit,
        currency: 'USD',
      };
    }

    return {
      success: false,
      message: (fallback.json?.message || fallback.rawText || primaryMessage || 'Failed to initialize payment').toString(),
      details: fallback.rawText || primary.rawText,
      paystackResponse: fallback.json || primary.json,
    };
  };
  
  // Debug endpoint to check Paystack configuration
  for (const route of subscriptionRoutePaths('/subscription/paystack-debug')) app.get(route, async (c: any) => {
    try {
      await requireSuperAdmin(c);
      
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      const paystackPublicKey = Deno.env.get('PAYSTACK_PUBLIC_KEY');
      
      return c.json({
        hasSecretKey: !!paystackSecretKey,
        hasPublicKey: !!paystackPublicKey,
        secretKeyPrefix: paystackSecretKey ? paystackSecretKey.substring(0, 7) + '...' : 'NOT SET',
        publicKeyPrefix: paystackPublicKey ? paystackPublicKey.substring(0, 7) + '...' : 'NOT SET',
        secretKeyLength: paystackSecretKey?.length || 0,
        publicKeyLength: paystackPublicKey?.length || 0,
      });
    } catch (e: any) {
      console.error('Error in paystack debug:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Test Paystack connection endpoint
  for (const route of subscriptionRoutePaths('/subscription/test-paystack')) app.post(route, async (c: any) => {
    try {
      const { user } = await requireSuperAdmin(c);
      
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        return c.json({ 
          success: false, 
          error: 'PAYSTACK_SECRET_KEY not configured',
          message: 'Please add your Paystack secret key to the environment variables'
        });
      }

      // Test the Paystack API with a minimal transaction initialization
      const testReference = `TEST_${user.id}_${Date.now()}`;
      const testAmount = 10000; // 100 GHS in pesewas (minimum for testing)
      
      
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: testAmount,
          currency: 'GHS',
          reference: testReference,
          metadata: {
            test: true,
            userId: user.id,
          },
        }),
      });

      const responseStatus = paystackResponse.status;
      const responseStatusText = paystackResponse.statusText;
      
      if (!paystackResponse.ok) {
        const errorText = await paystackResponse.text();
        console.error('Paystack test failed:', errorText);
        return c.json({
          success: false,
          error: `Paystack API returned ${responseStatus} ${responseStatusText}`,
          details: errorText,
          httpStatus: responseStatus,
        });
      }

      const paystackData = await paystackResponse.json();
      

      if (!paystackData.status) {
        return c.json({
          success: false,
          error: paystackData.message || 'Paystack initialization failed',
          paystackResponse: paystackData,
        });
      }

      return c.json({
        success: true,
        message: 'Paystack connection successful!',
        hasAuthorizationUrl: !!paystackData.data?.authorization_url,
        hasAccessCode: !!paystackData.data?.access_code,
        reference: paystackData.data?.reference,
      });
    } catch (e: any) {
      console.error('Error testing Paystack:', e);
      return c.json({
        success: false,
        error: e.message,
        stack: e.stack,
      }, 500);
    }
  });

  // Public endpoint to check if system has any licenses (for login page)
  for (const route of subscriptionRoutePaths('/subscription/public-license-check')) app.get(route, async (c: any) => {
    try {
      // Find all subscriptions
      const subscriptions = await kv.getByPrefix('subscription:');
      
      // Check if any subscription has purchased licenses and is active
      const hasLicenses = subscriptions.some((sub: any) => {
        return sub.purchasedLicenses > 0 && sub.status === 'active';
      });
      
      return c.json({ hasLicenses });
    } catch (e: any) {
      console.error('Error checking public license status:', e);
      // On error, return true to avoid blocking login
      return c.json({ hasLicenses: true });
    }
  });

  // Get license information
  for (const route of subscriptionRoutePaths('/subscription/license-info')) app.get(route, async (c: any) => {
    try {
      const { user, role } = await requireAuth(c);
      
      // Only superadmin can view license info
      if (role !== 'superadmin') {
        return c.json({ error: 'Only superadmin can view license information' }, 403);
      }
      
      // CRITICAL FIX: Get company ID from user's employee record
      const employeeRecord = await kv.get(`employee:${user.id}`);
      const companyId = employeeRecord?.companyId || employeeRecord?.company;
      
      if (!companyId) {
        return c.json({
          purchasedLicenses: 0,
          usedLicenses: 0,
          availableLicenses: 0,
          status: 'none',
          cardSaved: false,
        });
      }
      
      // Get subscription AND company record (licenses can be in either)
      const { subscription } = await resolveBillingSubscriptionContext(user.id);
      const company = await kv.get(`company:${companyId}`);
      
      // Recalculate company stats to ensure accuracy
      try {
        await recalculateCompanyStats(companyId);
      } catch (syncError) {
        console.error('Error syncing stats in license-info:', syncError);
        // Continue even if sync fails
      }
      
      // Get updated stats
      const stats = await kv.get(`company_stats:${companyId}`) || {};
      
      // Count used licenses (filtered by company) - fallback if stats not available
      const allUsers = await kv.getByPrefix('employee:');
      const companyUsers = allUsers.filter((u: any) => u.companyId === companyId || u.company === companyId);
      const usedLicenses = stats.usedLicenses || companyUsers.length;
      
      // Get purchased licenses from subscription OR company record
      const purchasedLicensesRaw =
        getCanonicalSubscriptionLicenses(subscription) ||
        company?.licenses ||
        company?.subscription?.licenses ||
        0;
      const purchasedLicensesNumber = Number(purchasedLicensesRaw);
      const purchasedLicenses = Number.isFinite(purchasedLicensesNumber) ? purchasedLicensesNumber : 0;
      const availableLicenses = Math.max(0, purchasedLicenses - usedLicenses);
      const status = subscription
        ? (isSubscriptionActive(subscription) ? 'active' : (String(subscription.status || '').toLowerCase() || 'expired'))
        : (company?.subscriptionStatus || 'none');
      const plan = subscription?.plan || company?.subscriptionPlan || 'none';
      
      return c.json({
        purchasedLicenses,
        usedLicenses,
        availableLicenses,
        plan,
        endDate: subscription?.endDate || null,
        status,
        cardSaved: !!subscription?.cardAuthorization,
        cardLast4: subscription?.cardAuthorization?.last4,
        cardExpiry: subscription?.cardAuthorization 
          ? `${subscription.cardAuthorization.expMonth}/${subscription.cardAuthorization.expYear}`
          : null,
        cardBrand: subscription?.cardAuthorization?.brand,
        autoRenew: subscription?.autoRenew !== false, // default true if card saved
      });
    } catch (e: any) {
      console.error('Error fetching license info:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Check if can create user (has available licenses)
  for (const route of subscriptionRoutePaths('/subscription/can-create-user')) app.get(route, async (c: any) => {
    try {
      const { user, role } = await requireAuth(c);
      
      // Only superadmin can create users in license model
      if (role !== 'superadmin') {
        return c.json({ 
          canCreate: false, 
          reason: 'Only SuperAdmin can create users. Please contact your SuperAdmin.' 
        });
      }
      
      // Get subscription
      const { subscription } = await resolveBillingSubscriptionContext(user.id);
      
      if (!subscription || !isSubscriptionActive(subscription)) {
        return c.json({ 
          canCreate: false, 
          reason: 'No active subscription. Please purchase licenses first.',
          needsSubscription: true,
        });
      }
      
      // Count used licenses
      const employeeRecord = await kv.get(`employee:${user.id}`);
      const companyId = employeeRecord?.companyId || employeeRecord?.company || null;
      const allUsers = await kv.getByPrefix('employee:');
      const companyUsers = companyId
        ? allUsers.filter((u: any) => u.companyId === companyId || u.company === companyId)
        : [];
      const usedLicenses = companyUsers.length;
      const purchasedLicenses = subscription.purchasedLicenses || 0;
      const availableLicenses = purchasedLicenses - usedLicenses;
      
      if (availableLicenses <= 0) {
        return c.json({ 
          canCreate: false, 
          reason: 'No available licenses. Purchase more licenses to add users.',
          needsLicenses: true,
          purchasedLicenses,
          usedLicenses,
        });
      }
      
      return c.json({ 
        canCreate: true,
        availableLicenses,
        purchasedLicenses,
        usedLicenses,
      });
    } catch (e: any) {
      console.error('Error checking user creation:', e);
      return c.json({ canCreate: false, reason: e.message }, 500);
    }
  });

  // Purchase additional licenses
  for (const route of subscriptionRoutePaths('/subscription/purchase-licenses')) app.post(route, async (c: any) => {
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
      
      // Always compute amount server-side from the canonical price list — never trust client-provided amount
      // Monthly: $3.55/user/month  |  Yearly: $2.55/user/month = $30.60/user/year
      const pricePerLicense = plan === 'monthly' ? 3.55 : 30.60;
      const amount = licenses * pricePerLicense;
      
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        console.error('PAYSTACK_SECRET_KEY not configured');
        return c.json({ error: 'Payment gateway not configured' }, 500);
      }
      
      // Initialize Paystack transaction
      const reference = `LIC_${user.id}_${Date.now()}`;
      const callbackOrigin = c.req.header('origin') || c.req.header('referer')?.split('/').slice(0, 3).join('/') || '';
      const callbackUrl = callbackOrigin ? `${callbackOrigin}/payment-verify-license` : '';
      
      // Convert USD to configured Paystack currency
      const { amountSmallestUnit, currency } = await usdToPaystackAmount(amount);

      // Guard against zero/invalid amounts that Paystack would reject
      if (!amountSmallestUnit || amountSmallestUnit < 100) {
        return c.json({ error: `Computed payment amount is too low (${amountSmallestUnit} ${currency}). Please contact support.` }, 400);
      }
      
      const paystackInit = await initializePaystackTransaction({
        paystackSecretKey,
        email: user.email,
        reference,
        callbackUrl,
        preferredAmountSmallestUnit: amountSmallestUnit,
        preferredCurrency: currency,
        amountUsd: amount,
        metadata: {
          userId: user.id,
          plan,
          licenses,
          saveCard,
          amountUsd: amount,
        },
      });

      if (!paystackInit.success) {
        console.error('Paystack initialization failed:', paystackInit);
        return c.json({
          error: paystackInit.message || 'Failed to initialize payment',
          details: paystackInit.details || '',
          paystackResponse: paystackInit.paystackResponse || null,
        }, 500);
      }

      const paystackData = paystackInit.paystackData;
      const finalAmountSmallestUnit = paystackInit.amountSmallestUnit;
      const finalCurrency = paystackInit.currency;
      const { companyId } = await resolveBillingSubscriptionContext(user.id);
      
      // Store pending license purchase
      await kv.set(`pending-license:${reference}`, {
        userId: user.id,
        companyId,
        plan,
        licenses,
        amount,
        amountSmallestUnit: finalAmountSmallestUnit,
        currency: finalCurrency,
        saveCard,
        reference,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      
      await logAudit({
        userId: user.id,
        userName: user.email || 'Unknown',
        action: 'CREATE',
        resourceType: 'license-purchase',
        resourceId: reference,
        details: { plan, licenses, amount, saveCard },
      });
      
      return c.json({
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      });
    } catch (e: any) {
      console.error('Error initializing license purchase:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Verify license purchase payment
  for (const route of subscriptionRoutePaths('/subscription/verify-license')) app.post(route, async (c: any) => {
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
      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      });
      
      const paystackData = await paystackResponse.json();
      
      // Log full Paystack response for debugging
      
      // paystackData.status = API-level success (bool)
      // paystackData.data.status = transaction status string ('success', 'failed', 'abandoned', etc.)
      if (!paystackData.status) {
        console.error('Paystack API-level failure:', paystackData.message);
        return c.json({ 
          success: false,
          message: paystackData.message || 'Paystack could not find or verify this transaction',
          paystackStatus: 'api_error',
        }, 400);
      }

      const txStatus = paystackData.data?.status;
      if (txStatus !== 'success') {
        console.error(`Transaction status is "${txStatus}" (not success). Reference: ${reference}`);
        return c.json({ 
          success: false, 
          message: `Payment was not completed. Transaction status: "${txStatus}". If you were charged, please retry verification in a moment.`,
          paystackStatus: txStatus,
        }, 400);
      }
      
      // Get pending license purchase
      const pendingLicense = await kv.get(`pending-license:${reference}`);
      
      if (!pendingLicense) {
        // Could mean verification was already processed (idempotency)
        // Check if subscription already reflects this payment
        const { subscription } = await resolveBillingSubscriptionContext(user.id);
        if (subscription?.lastPaymentReference === reference) {
          return c.json({
            success: true,
            licensesAdded: 0,
            totalLicenses: subscription.purchasedLicenses,
            plan: subscription.plan,
            amountPaid: subscription.lastPaymentAmount,
            message: 'Payment already verified and processed',
            deactivatedCount: 0,
          });
        }
        return c.json({ success: false, message: 'License purchase record not found. It may have already been processed.' }, 404);
      }

      // ── Race-condition guard ──────────────────────────────────────────
      // Both the Paystack-redirect verification tab AND the main-app
      // polling tab can call this endpoint concurrently. To prevent
      // double-crediting licenses we immediately mark the pending record
      // as 'processing'. If a second request arrives and sees
      // 'processing', it waits briefly then returns the finished result.
      if (pendingLicense.status === 'processing') {
        // Brief wait to let the first request finish, then return the result
        await new Promise(r => setTimeout(r, 3000));
        const { subscription } = await resolveBillingSubscriptionContext(user.id);
        if (subscription?.lastPaymentReference === reference) {
          return c.json({
            success: true,
            licensesAdded: 0,
            totalLicenses: subscription.purchasedLicenses,
            plan: subscription.plan,
            amountPaid: subscription.lastPaymentAmount,
            message: 'Payment already verified and processed',
            deactivatedCount: 0,
          });
        }
        // Still processing or something went wrong — tell the caller to retry
        return c.json({
          success: false,
          message: 'Payment is being processed by another request. Please wait a moment and try again.',
          processing: true,
        }, 409);
      }

      // Mark as processing immediately to prevent concurrent double-crediting
      await kv.set(`pending-license:${reference}`, { ...pendingLicense, status: 'processing' });
      
      const expectedAmount = Number(pendingLicense.amountSmallestUnit || 0);
      if (expectedAmount > 0 && Number(paystackData.data?.amount || 0) !== expectedAmount) {
        return c.json({
          success: false,
          message: `Payment amount mismatch: expected ${expectedAmount}, received ${Number(paystackData.data?.amount || 0)}`,
        }, 400);
      }
      if (pendingLicense.currency && paystackData.data?.currency && paystackData.data.currency !== pendingLicense.currency) {
        return c.json({
          success: false,
          message: `Payment currency mismatch: expected ${pendingLicense.currency}, received ${paystackData.data.currency}`,
        }, 400);
      }
      
      // Get or create subscription
      const subscription = await kv.get(`subscription:${pendingLicense.userId}`) || {
        userId: pendingLicense.userId,
        purchasedLicenses: 0,
        plan: pendingLicense.plan,
        startDate: new Date().toISOString(),
        status: 'active',
      };
      
      const endDate = calculateExtendedEndDate(subscription, pendingLicense.plan);
      
      // Update subscription
      subscription.purchasedLicenses = (subscription.purchasedLicenses || 0) + pendingLicense.licenses;
      subscription.plan = pendingLicense.plan;
      subscription.endDate = endDate.toISOString();
      subscription.status = 'active';
      subscription.lastPaymentDate = new Date().toISOString();
      subscription.lastPaymentAmount = pendingLicense.amount;
      subscription.lastPaymentReference = reference;
      
      // Save card authorization if requested
      if (pendingLicense.saveCard && paystackData.data.authorization) {
        subscription.cardAuthorization = {
          authorizationCode: paystackData.data.authorization.authorization_code,
          bin: paystackData.data.authorization.bin,
          last4: paystackData.data.authorization.last4,
          expMonth: paystackData.data.authorization.exp_month,
          expYear: paystackData.data.authorization.exp_year,
          cardType: paystackData.data.authorization.card_type,
          bank: paystackData.data.authorization.bank,
          brand: paystackData.data.authorization.brand,
        };
      }
      
      await kv.set(`subscription:${pendingLicense.userId}`, subscription);
      await syncCompanySubscriptionMirror(pendingLicense.userId, subscription);
      await kv.del(`pending-license:${reference}`);
      
      // Handle user selection and deactivation if selectedUserIds were provided
      let deactivatedCount = 0;
      if (pendingLicense.selectedUserIds && Array.isArray(pendingLicense.selectedUserIds)) {
        const allUsers = await kv.getByPrefix('employee:');
        const selectedIds = new Set(pendingLicense.selectedUserIds);
        const companyUsers = pendingLicense.companyId
          ? allUsers.filter((u: any) => u.companyId === pendingLicense.companyId || u.company === pendingLicense.companyId)
          : [];
        
        
        // Deactivate users not in the selected list
        for (const user of companyUsers) {
          const userId = user.id || user.userId;
          
          // Never deactivate SuperAdmin
          if (user.role === 'superadmin') {
            continue;
          }
          
          // If user is not in selected list and is currently active, deactivate them
          if (!selectedIds.has(userId) && user.status === 'active') {
            user.status = 'inactive';
            await kv.set(`employee:${userId}`, user);
            deactivatedCount++;
            
            
            await logAudit({
              userId: pendingLicense.userId,
              userName: 'System',
              action: 'UPDATE',
              resourceType: 'user-license-deactivation',
              resourceId: userId,
              details: { 
                reason: 'Insufficient licenses after purchase',
                userEmail: user.email,
                userName: user.name || user.fullName,
              },
            });
          }
        }
        
      }
      
      await logAudit({
        userId: user.id,
        userName: user.email || 'Unknown',
        action: 'CREATE',
        resourceType: 'licenses',
        resourceId: pendingLicense.userId,
        details: { 
          licensesAdded: pendingLicense.licenses,
          totalLicenses: subscription.purchasedLicenses,
          plan: subscription.plan,
          amount: pendingLicense.amount,
          cardSaved: !!subscription.cardAuthorization,
          usersDeactivated: deactivatedCount,
        },
      });
      await sendBillingEmail(
        user.email || await getBillingRecipient(pendingLicense.userId),
        'Your Blumebyte subscription payment was successful',
        `<p>Your Blumebyte subscription payment was successful.</p>
         <p><strong>Licenses added:</strong> ${pendingLicense.licenses}</p>
         <p><strong>Total licenses:</strong> ${subscription.purchasedLicenses}</p>
         <p><strong>Plan:</strong> ${subscription.plan}</p>
         <p><strong>Expires:</strong> ${subscription.endDate}</p>`
      );
      
      return c.json({ 
        success: true, 
        licensesAdded: pendingLicense.licenses,
        totalLicenses: subscription.purchasedLicenses,
        plan: subscription.plan,
        amountPaid: pendingLicense.amount,
        message: deactivatedCount > 0 
          ? `Licenses purchased successfully. ${deactivatedCount} user(s) deactivated.`
          : 'Licenses purchased successfully',
        deactivatedCount,
      });
    } catch (e: any) {
      console.error('Error verifying license purchase:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      return c.json({ success: false, error: e.message }, 500);
    }
  });

  // Auto-renew subscription (charge saved card)
  for (const route of subscriptionRoutePaths('/subscription/auto-renew')) app.post(route, async (c: any) => {
    try {
      const { user } = await requireSuperAdmin(c);
      
      const { ownerUserId, subscription } = await resolveBillingSubscriptionContext(user.id);
      
      if (!subscription) {
        return c.json({ error: 'No subscription found' }, 404);
      }
      
      if (!subscription.cardAuthorization) {
        return c.json({ error: 'No saved card found. Please add a payment method.' }, 400);
      }
      
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        return c.json({ error: 'Payment gateway not configured' }, 500);
      }
      
      // Calculate renewal amount: Monthly $3.55/user/month | Yearly $2.55/user/month = $30.60/year
      const pricePerLicense = subscription.plan === 'monthly' ? 3.55 : 30.60;
      const amount = subscription.purchasedLicenses * pricePerLicense;
      const writeUserId = ownerUserId || user.id;
      
      // Convert USD to GHS for Paystack
      const { amountSmallestUnit: renewAmountSmallestUnit, currency: renewCurrency } = await usdToPaystackAmount(amount);
      
      
      // Charge the saved card
      const paystackResponse = await fetch('https://api.paystack.co/transaction/charge_authorization', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_code: subscription.cardAuthorization.authorizationCode,
          email: user.email,
          amount: renewAmountSmallestUnit,
          currency: renewCurrency,
          metadata: {
            userId: user.id,
            type: 'auto-renewal',
            plan: subscription.plan,
            licenses: subscription.purchasedLicenses,
            amountUsd: amount,
          },
        }),
      });
      
      const paystackData = await paystackResponse.json();
      
      if (!paystackData.status || paystackData.data.status !== 'success') {
        const failureMessage = paystackData.message || 'Auto-renewal failed. Please update your payment method.';
        await logAudit({
          userId: user.id,
          userName: user.email || 'Unknown',
          action: 'UPDATE',
          resourceType: 'subscription-renewal',
          resourceId: user.id,
          details: {
            success: false,
            error: failureMessage,
            amount,
          },
        });

        const notifId = crypto.randomUUID();
        await kv.set(`notification:${notifId}`, {
          id: notifId,
          userId: user.id,
          type: 'subscription-renewal-failed',
          title: 'Subscription Auto‑Renewal Failed',
          message: failureMessage,
          read: false,
          createdAt: new Date().toISOString(),
          metadata: {
            plan: subscription.plan,
            amountUsd: amount,
            endDate: subscription.endDate,
          },
        });

        await sendBillingEmail(
          user.email || await getBillingRecipient(writeUserId),
          'Blumebyte subscription renewal failed',
          `<p>We attempted to renew your Blumebyte subscription using your saved card, but the payment did not go through.</p>
           <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
           <p><strong>Plan:</strong> ${subscription.plan}</p>
           <p><strong>Expiry date:</strong> ${subscription.endDate || 'Unknown'}</p>
           <p>Please sign in and update your payment method or renew manually at <a href="/subscription">Billing & Subscription</a>.</p>`
        );

        return c.json({ 
          success: false, 
          message: failureMessage,
          needsCardUpdate: true,
        });
      }
      
      const endDate = calculateExtendedEndDate(subscription, subscription.plan);
      
      subscription.endDate = endDate.toISOString();
      subscription.status = 'active';
      subscription.lastPaymentDate = new Date().toISOString();
      subscription.lastPaymentAmount = amount;
      subscription.lastPaymentReference = paystackData.data.reference;

      await kv.set(`subscription:${writeUserId}`, subscription);
      await syncCompanySubscriptionMirror(writeUserId, subscription);
      
      await logAudit({
        userId: user.id,
        userName: user.email || 'Unknown',
        action: 'UPDATE',
        resourceType: 'subscription-renewal',
        resourceId: user.id,
        details: { 
          success: true,
          amount,
          endDate: subscription.endDate,
          reference: paystackData.data.reference,
        },
      });
      await sendBillingEmail(
        user.email || await getBillingRecipient(writeUserId),
        'Your Blumebyte subscription was renewed',
        `<p>Your Blumebyte subscription renewal was successful.</p>
         <p><strong>Licenses:</strong> ${subscription.purchasedLicenses}</p>
         <p><strong>Plan:</strong> ${subscription.plan}</p>
         <p><strong>New expiry:</strong> ${subscription.endDate}</p>`
      );
      
      return c.json({ 
        success: true, 
        message: 'Subscription renewed successfully',
        endDate: subscription.endDate,
      });
    } catch (e: any) {
      console.error('Error auto-renewing subscription:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ success: false, error: e.message }, 500);
    }
  });

  // Get all users for license selection (SuperAdmin only)
  for (const route of subscriptionRoutePaths('/subscription/all-users')) app.get(route, async (c: any) => {
    try {
      await requireSuperAdmin(c);
      
      const allUsers = await kv.getByPrefix('employee:');
      
      // Return user details needed for selection
      const users = allUsers.map((u: any) => ({
        id: u.id || u.userId,
        userId: u.userId,
        name: u.name || u.fullName,
        email: u.email,
        role: u.role,
        status: u.status,
        department: u.department,
      }));
      
      return c.json({ users });
    } catch (e: any) {
      console.error('Error fetching all users:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Paystack Webhook
  for (const route of subscriptionRoutePaths('/subscription/paystack-webhook')) app.post(route, async (c: any) => {
    try {
      const bodyText = await c.req.text();
      const signature = c.req.header('x-paystack-signature');
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');

      if (!paystackSecretKey || !signature) {
        console.error('Webhook missing secret key or signature');
        return c.text('Configuration Error or Missing Signature', 400);
      }

      // Verify Paystack HMAC signature
      if (!(await verifyPaystackSignature(bodyText, paystackSecretKey, signature))) {
        console.error('Invalid Paystack signature');
        return c.text('Invalid Signature', 400);
      }

      const event = JSON.parse(bodyText);

      // Only handle successful charges for license purchases
      if (event.event === 'charge.success') {
        const reference = event.data.reference;
        const pendingLicense = await kv.get(`pending-license:${reference}`);
        
        if (!pendingLicense) {
          return c.text('OK'); // Acknowledge to prevent retries
        }

        // Check if it's already processed to prevent double crediting
        if (pendingLicense.status === 'processed') {
          return c.text('OK');
        }

        // Mark as processing
        await kv.set(`pending-license:${reference}`, { ...pendingLicense, status: 'processing' });

        // Update User Subscription
        const userId = pendingLicense.userId;
        let subscription = await kv.get(`subscription:${userId}`) || {
          userId,
          status: 'inactive',
          plan: 'none',
          startDate: null,
          endDate: null,
          purchasedLicenses: 0,
          usedLicenses: 0,
          autoRenew: false,
          billingHistory: []
        };

        const now = new Date();
        const endDate = calculateExtendedEndDate(subscription, pendingLicense.plan);

        subscription.plan = pendingLicense.plan;
        subscription.status = 'active';
        subscription.purchasedLicenses += pendingLicense.licenses;
        subscription.startDate = subscription.startDate || now.toISOString();
        subscription.endDate = endDate.toISOString();
        subscription.lastPaymentDate = now.toISOString();
        subscription.lastPaymentAmount = pendingLicense.amount;
        subscription.lastPaymentReference = reference;
        
        // Optionally save card
        if (pendingLicense.saveCard && event.data.authorization) {
          subscription.cardAuthorization = {
            authorizationCode: event.data.authorization.authorization_code,
            last4: event.data.authorization.last4,
            expMonth: event.data.authorization.exp_month,
            expYear: event.data.authorization.exp_year,
            cardType: event.data.authorization.card_type,
            bank: event.data.authorization.bank,
            reusable: event.data.authorization.reusable,
          };
          subscription.autoRenew = true;
        }

        await kv.set(`subscription:${userId}`, subscription);
        await syncCompanySubscriptionMirror(userId, subscription);

        // Record History
        const transaction = {
          id: `tx_${Date.now()}`,
          date: now.toISOString(),
          amount: pendingLicense.amount,
          licenses: pendingLicense.licenses,
          plan: pendingLicense.plan,
          reference: reference,
          status: 'success',
          type: pendingLicense.type || 'purchase'
        };
        subscription.billingHistory = [...(subscription.billingHistory || []), transaction];
        await kv.set(`subscription:${userId}`, subscription);

        // Process selected users if applicable
        if (Array.isArray(pendingLicense.selectedUserIds) && pendingLicense.selectedUserIds.length > 0) {
          for (const uid of pendingLicense.selectedUserIds) {
            const emp = await kv.get(`employee:${uid}`);
            if (emp) {
              await kv.set(`employee:${uid}`, { ...emp, status: 'active', active: true });
            }
          }
          
          const allEmps = await kv.getByPrefix('employee:');
          const hrEmps = pendingLicense.companyId
            ? allEmps.filter((u: any) => u.companyId === pendingLicense.companyId || u.company === pendingLicense.companyId)
            : [];
          let assignedCount = 0;
          for (const emp of hrEmps) {
            if (emp.status === 'active' || emp.active) {
              assignedCount++;
            }
          }
          subscription.usedLicenses = assignedCount;
          await kv.set(`subscription:${userId}`, subscription);
        }

        // Mark as processed
        await kv.set(`pending-license:${reference}`, { ...pendingLicense, status: 'processed' });
        
        await logAudit({
          userId: userId,
          userName: 'System Webhook',
          action: 'PAYMENT_WEBHOOK',
          resourceType: 'subscription',
          resourceId: userId,
          details: { reference, amount: pendingLicense.amount, licenses: pendingLicense.licenses }
        });
        await sendBillingEmail(
          await getBillingRecipient(userId),
          'Your Blumebyte subscription payment was processed',
          `<p>Your Blumebyte subscription payment was processed successfully.</p>
           <p><strong>Licenses added:</strong> ${pendingLicense.licenses}</p>
           <p><strong>Total licenses:</strong> ${subscription.purchasedLicenses}</p>
           <p><strong>Plan:</strong> ${subscription.plan}</p>
           <p><strong>Expires:</strong> ${subscription.endDate}</p>`
        );
        
      }

      return c.text('OK');
    } catch (e: any) {
      console.error('Webhook error:', e);
      return c.text('Server Error', 500);
    }
  });

  // Purchase licenses with user selection (handles deactivation)
  for (const route of subscriptionRoutePaths('/subscription/purchase-licenses-with-selection')) app.post(route, async (c: any) => {
    try {
      const { user } = await requireSuperAdmin(c);
      const body = await c.req.json();
      const { licenses, plan, saveCard, selectedUserIds } = body;
      
      if (!licenses || !plan) {
        return c.json({ error: 'Missing required fields: licenses, plan' }, 400);
      }
      
      if (!['monthly', 'yearly'].includes(plan)) {
        return c.json({ error: 'Invalid plan. Must be "monthly" or "yearly"' }, 400);
      }
      
      // Always compute amount server-side from the canonical price list — never trust client-provided amount
      // Monthly: $3.55/user/month  |  Yearly: $2.55/user/month = $30.60/user/year
      const pricePerLicense = plan === 'monthly' ? 3.55 : 30.60;
      const amount = licenses * pricePerLicense;
      
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        console.error('PAYSTACK_SECRET_KEY not configured');
        return c.json({ error: 'Payment gateway not configured' }, 500);
      }
      
      // Initialize Paystack transaction
      const reference = `LIC_${user.id}_${Date.now()}`;
      const callbackOrigin = c.req.header('origin') || c.req.header('referer')?.split('/').slice(0, 3).join('/') || '';
      const callbackUrl = callbackOrigin ? `${callbackOrigin}/payment-verify-license` : '';
      
      // Convert USD to configured Paystack currency
      const { amountSmallestUnit, currency } = await usdToPaystackAmount(amount);

      // Guard against zero/invalid amounts that Paystack would reject
      if (!amountSmallestUnit || amountSmallestUnit < 100) {
        return c.json({ error: `Computed payment amount is too low (${amountSmallestUnit} ${currency}). Please contact support.` }, 400);
      }
      
      const paystackInit = await initializePaystackTransaction({
        paystackSecretKey,
        email: user.email,
        reference,
        callbackUrl,
        preferredAmountSmallestUnit: amountSmallestUnit,
        preferredCurrency: currency,
        amountUsd: amount,
        metadata: {
          userId: user.id,
          plan,
          licenses,
          saveCard,
          selectedUserIds: selectedUserIds || [],
          amountUsd: amount,
        },
      });

      if (!paystackInit.success) {
        console.error('Paystack initialization failed:', paystackInit);
        return c.json({
          error: paystackInit.message || 'Failed to initialize payment',
          details: paystackInit.details || '',
          paystackResponse: paystackInit.paystackResponse || null,
        }, 500);
      }

      const paystackData = paystackInit.paystackData;
      const finalAmountSmallestUnit = paystackInit.amountSmallestUnit;
      const finalCurrency = paystackInit.currency;
      const { companyId } = await resolveBillingSubscriptionContext(user.id);
      
      // Store pending license purchase with selected users
      await kv.set(`pending-license:${reference}`, {
        userId: user.id,
        companyId,
        plan,
        licenses,
        amount,
        amountSmallestUnit: finalAmountSmallestUnit,
        currency: finalCurrency,
        saveCard,
        selectedUserIds: selectedUserIds || [],
        reference,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      
      await logAudit({
        userId: user.id,
        userName: user.email || 'Unknown',
        action: 'CREATE',
        resourceType: 'license-purchase',
        resourceId: reference,
        details: { plan, licenses, amount, saveCard, selectedUsers: selectedUserIds?.length || 0 },
      });
      
      return c.json({
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      });
    } catch (e: any) {
      console.error('Error initializing license purchase with selection:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Lightweight endpoint: check if a payment reference has been completed on Paystack
  // without processing/activating anything. Used for polling from the main app tab.
  for (const route of subscriptionRoutePaths('/subscription/check-payment-status')) app.get(route, async (c: any) => {
    try {
      const { user } = await requireAuth(c);
      const reference = c.req.query('reference');

      if (!reference) {
        return c.json({ error: 'reference query param is required' }, 400);
      }

      // First check if already processed (subscription has this reference)
      const { subscription } = await resolveBillingSubscriptionContext(user.id);
      if (subscription?.lastPaymentReference === reference || subscription?.paymentReference === reference) {
        return c.json({
          status: 'completed',
          alreadyProcessed: true,
          paymentType: subscription?.paymentReference === reference ? 'renewal' : 'license',
          totalLicenses: getCanonicalSubscriptionLicenses(subscription),
          plan: subscription.plan,
        });
      }

      // Check if pending record still exists
      const pendingLicense = await kv.get(`pending-license:${reference}`);
      const pendingRenewal = await kv.get(`pending-subscription:${reference}`);
      const pending = pendingLicense || pendingRenewal;
      if (!pending) {
        // No pending and not in subscription — unknown reference
        return c.json({ status: 'unknown', message: 'Reference not found' });
      }

      // Ask Paystack for the current transaction status
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        return c.json({ status: 'error', message: 'Payment gateway not configured' }, 500);
      }

      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${paystackSecretKey}` },
        }
      );

      if (!paystackResponse.ok) {
        return c.json({ status: 'pending', message: 'Transaction not yet available on Paystack' });
      }

      const paystackData = await paystackResponse.json();
      const txStatus = paystackData.data?.status;
      const paymentType = pendingLicense ? 'license' : 'renewal';

      if (txStatus === 'success') {
        return c.json({ status: 'paid', paymentType, message: 'Payment successful on Paystack, ready to verify' });
      } else if (txStatus === 'abandoned' || txStatus === 'failed') {
        return c.json({ status: 'failed', paymentType, paystackStatus: txStatus });
      } else {
        return c.json({ status: 'pending', paymentType, paystackStatus: txStatus || 'unknown' });
      }
    } catch (e: any) {
      console.error('Error checking payment status:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      return c.json({ status: 'error', message: e.message }, 500);
    }
  });

  // ── Card management ──────────────────────────────────────────────────────────

  // DELETE /subscription/card — remove saved card (disables auto-renewal)
  for (const route of subscriptionRoutePaths('/subscription/card')) app.delete(route, async (c: any) => {
    try {
      const { user } = await requireSuperAdmin(c);
      const { ownerUserId, subscription } = await resolveBillingSubscriptionContext(user.id);
      if (!subscription) return c.json({ error: 'No subscription found' }, 404);
      const updated = { ...subscription };
      delete updated.cardAuthorization;
      updated.autoRenew = false;
      const writeUserId = ownerUserId || user.id;
      await kv.set(`subscription:${writeUserId}`, updated);
      await syncCompanySubscriptionMirror(writeUserId, updated);
      await logAudit({ userId: user.id, userName: user.email || 'Unknown', action: 'UPDATE', resourceType: 'subscription-card', resourceId: user.id, details: { action: 'remove_card' } });
      await sendBillingEmail(
        user.email || await getBillingRecipient(writeUserId),
        'Your Blumebyte saved card was removed',
        `<p>Your saved payment card was removed and auto-renewal was disabled.</p>`
      );
      return c.json({ success: true, message: 'Saved card removed. Auto-renewal disabled.' });
    } catch (e: any) {
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // PATCH /subscription/auto-renew — toggle auto-renewal on or off
  for (const route of subscriptionRoutePaths('/subscription/auto-renew')) app.patch(route, async (c: any) => {
    try {
      const { user } = await requireSuperAdmin(c);
      const { enabled } = await c.req.json();
      const { ownerUserId, subscription } = await resolveBillingSubscriptionContext(user.id);
      if (!subscription) return c.json({ error: 'No subscription found' }, 404);
      if (enabled && !subscription.cardAuthorization) {
        return c.json({ error: 'No card saved. Please save a card before enabling auto-renewal.' }, 400);
      }
      const updated = { ...subscription, autoRenew: !!enabled };
      const writeUserId = ownerUserId || user.id;
      await kv.set(`subscription:${writeUserId}`, updated);
      await syncCompanySubscriptionMirror(writeUserId, updated);
      await logAudit({ userId: user.id, userName: user.email || 'Unknown', action: 'UPDATE', resourceType: 'subscription-auto-renew', resourceId: user.id, details: { autoRenew: !!enabled } });
      await sendBillingEmail(
        user.email || await getBillingRecipient(writeUserId),
        `Blumebyte auto-renewal ${enabled ? 'enabled' : 'disabled'}`,
        `<p>Auto-renewal has been <strong>${enabled ? 'enabled' : 'disabled'}</strong> for your Blumebyte subscription.</p>`
      );
      return c.json({ success: true, autoRenew: !!enabled });
    } catch (e: any) {
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ error: e.message }, 500);
    }
  });
}

import { Hono } from 'npm:hono@4.7.7';
import * as kv from './kv_store.tsx';
import { usdToPaystackAmount, getPaystackCurrency } from './currency-utils.tsx';
import { recalculateCompanyStats } from './sync-company-stats.tsx';

const PREFIX = '/make-server-668731fc';

export function addLicenseRoutes(app: Hono, kv: any, requireAuth: any, requireSuperAdmin: any, logAudit: any) {
  
  // Debug endpoint to check Paystack configuration
  app.get(`${PREFIX}/subscription/paystack-debug`, async (c: any) => {
    try {
      const { user, role } = await requireSuperAdmin(c);
      
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
  app.post(`${PREFIX}/subscription/test-paystack`, async (c: any) => {
    try {
      const { user, role } = await requireSuperAdmin(c);
      
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
  app.get(`${PREFIX}/subscription/public-license-check`, async (c: any) => {
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
  app.get(`${PREFIX}/subscription/license-info`, async (c: any) => {
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
      const subscription = await kv.get(`subscription:${user.id}`);
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
      const purchasedLicenses = subscription?.purchasedLicenses || company?.licenses || 0;
      const availableLicenses = Math.max(0, purchasedLicenses - usedLicenses);
      const status = subscription?.status || company?.subscriptionStatus || 'none';
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
      });
    } catch (e: any) {
      console.error('Error fetching license info:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      if (e.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403);
      return c.json({ error: e.message }, 500);
    }
  });

  // Check if can create user (has available licenses)
  app.get(`${PREFIX}/subscription/can-create-user`, async (c: any) => {
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
      const subscription = await kv.get(`subscription:${user.id}`);
      
      if (!subscription || subscription.status !== 'active') {
        return c.json({ 
          canCreate: false, 
          reason: 'No active subscription. Please purchase licenses first.',
          needsSubscription: true,
        });
      }
      
      // Count used licenses
      const allUsers = await kv.getByPrefix('employee:');
      const usedLicenses = allUsers.length;
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
  app.post(`${PREFIX}/subscription/purchase-licenses`, async (c: any) => {
    try {
      const { user, role } = await requireSuperAdmin(c);
      const body = await c.req.json();
      const { licenses, plan, amount, saveCard } = body;
      
      if (!licenses || !plan || !amount) {
        return c.json({ error: 'Missing required fields: licenses, plan, amount' }, 400);
      }
      
      if (!['monthly', 'yearly'].includes(plan)) {
        return c.json({ error: 'Invalid plan. Must be "monthly" or "yearly"' }, 400);
      }
      
      // Validate pricing
      const pricePerLicense = plan === 'monthly' ? 6 : 60; // $6/mo or $60/yr — matches PricingPage & LicenseManagement
      const expectedPrice = licenses * pricePerLicense;
      
      if (Math.round(amount * 100) !== Math.round(expectedPrice * 100)) {
        console.error(`purchase-licenses: amount mismatch — received ${amount}, expected ${expectedPrice} (${licenses} licenses × $${pricePerLicense}/${plan})`);
        return c.json({ error: 'Invalid amount for the selected plan' }, 400);
      }
      
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        console.error('PAYSTACK_SECRET_KEY not configured');
        return c.json({ error: 'Payment gateway not configured' }, 500);
      }
      
      // Initialize Paystack transaction
      const reference = `LIC_${user.id}_${Date.now()}`;
      const callbackUrl = `${c.req.header('origin')}/payment-verify-license`;
      
      // Convert USD to configured Paystack currency
      const { amountSmallestUnit, amountDisplay, currency } = await usdToPaystackAmount(amount);
      
      // Debug logging
      
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
            licenses,
            saveCard,
            amountUsd: amount,
          },
        }),
      });
      
      // Log the response status for debugging
      
      // Check if the response is OK before parsing JSON
      if (!paystackResponse.ok) {
        const errorText = await paystackResponse.text();
        console.error('Paystack API error response:', errorText);
        return c.json({ 
          error: `Paystack API error: ${paystackResponse.status} ${paystackResponse.statusText}`,
          details: errorText 
        }, 500);
      }
      
      const paystackData = await paystackResponse.json();
      
      // Log the full response for debugging
      
      if (!paystackData.status) {
        console.error('Paystack initialization failed:', paystackData);
        // Return detailed error message from Paystack
        const errorMessage = paystackData.message || 'Failed to initialize payment';
        const errorDetails = paystackData.errors ? JSON.stringify(paystackData.errors) : '';
        return c.json({ 
          error: errorMessage,
          details: errorDetails,
          paystackResponse: paystackData 
        }, 500);
      }
      
      // Store pending license purchase
      await kv.set(`pending-license:${reference}`, {
        userId: user.id,
        plan,
        licenses,
        amount,
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
  app.post(`${PREFIX}/subscription/verify-license`, async (c: any) => {
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
        const subscription = await kv.get(`subscription:${user.id}`);
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
        const subscription = await kv.get(`subscription:${user.id}`);
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
      
      // Note: We don't verify the exact amount because it was converted from USD to GHS
      // Paystack will have the GHS amount, and exchange rates may vary slightly
      // We verify the payment was successful, which is sufficient
      
      // Get or create subscription
      const subscription = await kv.get(`subscription:${pendingLicense.userId}`) || {
        userId: pendingLicense.userId,
        purchasedLicenses: 0,
        plan: pendingLicense.plan,
        startDate: new Date().toISOString(),
        status: 'active',
      };
      
      // Calculate subscription end date
      const endDate = new Date();
      if (pendingLicense.plan === 'monthly') {
        endDate.setDate(endDate.getDate() + 30);
      } else {
        endDate.setDate(endDate.getDate() + 365);
      }
      
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
      await kv.del(`pending-license:${reference}`);
      
      // Handle user selection and deactivation if selectedUserIds were provided
      let deactivatedCount = 0;
      if (pendingLicense.selectedUserIds && Array.isArray(pendingLicense.selectedUserIds)) {
        const allUsers = await kv.getByPrefix('employee:');
        const selectedIds = new Set(pendingLicense.selectedUserIds);
        
        
        // Deactivate users not in the selected list
        for (const user of allUsers) {
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
  app.post(`${PREFIX}/subscription/auto-renew`, async (c: any) => {
    try {
      const { user, role } = await requireSuperAdmin(c);
      
      const subscription = await kv.get(`subscription:${user.id}`);
      
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
      
      // Calculate renewal amount
      const pricePerLicense = subscription.plan === 'monthly' ? 6 : 60; // $6/mo or $60/yr
      const amount = subscription.purchasedLicenses * pricePerLicense;
      
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
        await logAudit({
          userId: user.id,
          userName: user.email || 'Unknown',
          action: 'UPDATE',
          resourceType: 'subscription-renewal',
          resourceId: user.id,
          details: { 
            success: false,
            error: paystackData.message || 'Auto-renewal failed',
            amount,
          },
        });
        
        return c.json({ 
          success: false, 
          message: paystackData.message || 'Auto-renewal failed. Please update your payment method.',
          needsCardUpdate: true,
        });
      }
      
      // Extend subscription
      const endDate = new Date();
      if (subscription.plan === 'monthly') {
        endDate.setDate(endDate.getDate() + 30);
      } else {
        endDate.setDate(endDate.getDate() + 365);
      }
      
      subscription.endDate = endDate.toISOString();
      subscription.status = 'active';
      subscription.lastPaymentDate = new Date().toISOString();
      subscription.lastPaymentAmount = amount;
      subscription.lastPaymentReference = paystackData.data.reference;
      
      await kv.set(`subscription:${user.id}`, subscription);
      
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
  app.get(`${PREFIX}/subscription/all-users`, async (c: any) => {
    try {
      const { user, role } = await requireSuperAdmin(c);
      
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
  app.post(`${PREFIX}/subscription/paystack-webhook`, async (c: any) => {
    try {
      const bodyText = await c.req.text();
      const signature = c.req.header('x-paystack-signature');
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');

      if (!paystackSecretKey || !signature) {
        console.error('Webhook missing secret key or signature');
        return c.text('Configuration Error or Missing Signature', 400);
      }

      // Verify Paystack HMAC signature
      const { createHmac } = await import('node:crypto');
      const hash = createHmac('sha512', paystackSecretKey).update(bodyText).digest('hex');
      
      if (hash !== signature) {
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
        const endDate = new Date();
        if (pendingLicense.plan === 'monthly') {
          endDate.setDate(endDate.getDate() + 30);
        } else {
          endDate.setDate(endDate.getDate() + 365);
        }

        const licensesToAssign = Array.isArray(pendingLicense.selectedUserIds) 
            ? pendingLicense.selectedUserIds.length 
            : pendingLicense.licenses;

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
          const hrEmps = allEmps.filter((u: any) => u.companyId === pendingLicense.companyId || !pendingLicense.companyId);
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
        
      }

      return c.text('OK');
    } catch (e: any) {
      console.error('Webhook error:', e);
      return c.text('Server Error', 500);
    }
  });

  // Purchase licenses with user selection (handles deactivation)
  app.post(`${PREFIX}/subscription/purchase-licenses-with-selection`, async (c: any) => {
    try {
      const { user, role } = await requireSuperAdmin(c);
      const body = await c.req.json();
      const { licenses, plan, amount, saveCard, selectedUserIds } = body;
      
      if (!licenses || !plan || !amount) {
        return c.json({ error: 'Missing required fields: licenses, plan, amount' }, 400);
      }
      
      if (!['monthly', 'yearly'].includes(plan)) {
        return c.json({ error: 'Invalid plan. Must be "monthly" or "yearly"' }, 400);
      }
      
      // Validate pricing
      const pricePerLicense = plan === 'monthly' ? 6 : 60; // $6/mo or $60/yr — matches PricingPage & LicenseManagement
      const expectedPrice = licenses * pricePerLicense;
      
      if (Math.round(amount * 100) !== Math.round(expectedPrice * 100)) {
        console.error(`purchase-licenses: amount mismatch — received ${amount}, expected ${expectedPrice} (${licenses} licenses × $${pricePerLicense}/${plan})`);
        return c.json({ error: 'Invalid amount for the selected plan' }, 400);
      }
      
      const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackSecretKey) {
        console.error('PAYSTACK_SECRET_KEY not configured');
        return c.json({ error: 'Payment gateway not configured' }, 500);
      }
      
      // Initialize Paystack transaction
      const reference = `LIC_${user.id}_${Date.now()}`;
      const callbackUrl = `${c.req.header('origin')}/payment-verify-license`;
      
      // Convert USD to configured Paystack currency
      const { amountSmallestUnit, amountDisplay, currency } = await usdToPaystackAmount(amount);
      
      // Debug logging
      
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
            licenses,
            saveCard,
            selectedUserIds: selectedUserIds || [],
            amountUsd: amount,
          },
        }),
      });
      
      // Log the response status for debugging
      
      // Check if the response is OK before parsing JSON
      if (!paystackResponse.ok) {
        const errorText = await paystackResponse.text();
        console.error('Paystack API error response:', errorText);
        return c.json({ 
          error: `Paystack API error: ${paystackResponse.status} ${paystackResponse.statusText}`,
          details: errorText 
        }, 500);
      }
      
      const paystackData = await paystackResponse.json();
      
      // Log the full response for debugging
      
      if (!paystackData.status) {
        console.error('Paystack initialization failed:', paystackData);
        // Return detailed error message from Paystack
        const errorMessage = paystackData.message || 'Failed to initialize payment';
        const errorDetails = paystackData.errors ? JSON.stringify(paystackData.errors) : '';
        return c.json({ 
          error: errorMessage,
          details: errorDetails,
          paystackResponse: paystackData 
        }, 500);
      }
      
      // Store pending license purchase with selected users
      await kv.set(`pending-license:${reference}`, {
        userId: user.id,
        plan,
        licenses,
        amount,
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
  app.get(`${PREFIX}/subscription/check-payment-status`, async (c: any) => {
    try {
      const { user } = await requireAuth(c);
      const reference = c.req.query('reference');

      if (!reference) {
        return c.json({ error: 'reference query param is required' }, 400);
      }

      // First check if already processed (subscription has this reference)
      const subscription = await kv.get(`subscription:${user.id}`);
      if (subscription?.lastPaymentReference === reference) {
        return c.json({
          status: 'completed',
          alreadyProcessed: true,
          totalLicenses: subscription.purchasedLicenses,
          plan: subscription.plan,
        });
      }

      // Check if pending record still exists
      const pending = await kv.get(`pending-license:${reference}`);
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

      if (txStatus === 'success') {
        return c.json({ status: 'paid', message: 'Payment successful on Paystack, ready to verify' });
      } else if (txStatus === 'abandoned' || txStatus === 'failed') {
        return c.json({ status: 'failed', paystackStatus: txStatus });
      } else {
        return c.json({ status: 'pending', paystackStatus: txStatus || 'unknown' });
      }
    } catch (e: any) {
      console.error('Error checking payment status:', e);
      if (e.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401);
      return c.json({ status: 'error', message: e.message }, 500);
    }
  });
}
// Blumebyte HR Management Server - v2.1 - Payment-First Registration
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { addLicenseRoutes } from "./license-routes.tsx";
import { performProductionCleanup } from "./production-cleanup.tsx";
import { migrateCompanyKeys } from "./migration-company-keys.tsx";

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

// Initialize payment for a new company (Step 1)
app.post(`${PREFIX}/company/init-payment`, async (c) => {
  console.log('🔵 Init payment endpoint called');
  
  try {
    const body = await c.req.json();
    console.log('🔍 Received body:', JSON.stringify(body, null, 2));

    const { 
      company_name, 
      admin_email, 
      admin_password,
      admin_full_name,
      billing_frequency,
      employee_count 
    } = body;

    // Validate required fields
    if (!company_name || !admin_email || !admin_password || !admin_full_name) {
      console.error('❌ Missing required fields');
      return c.json({ 
        error: 'Missing required fields',
        required: ['company_name', 'admin_email', 'admin_password', 'admin_full_name']
      }, 400);
    }

    // Calculate amount based on employee count and billing frequency
    const pricePerEmployee = billing_frequency === 'yearly' ? 5 : 6; // $5/month yearly, $6/month monthly
    const employeeCount = parseInt(employee_count) || 1;
    const baseAmount = pricePerEmployee * employeeCount;
    
    // For yearly, multiply by 12 months
    const totalAmount = billing_frequency === 'yearly' ? baseAmount * 12 : baseAmount;

    // Store company data temporarily in KV with timestamp
    const companyKey = `company_pending_${admin_email}_${Date.now()}`;
    const companyData = {
      company_name,
      admin_email,
      admin_password,
      admin_full_name,
      billing_frequency,
      employee_count: employeeCount,
      amount: totalAmount,
      currency: 'USD',
      created_at: new Date().toISOString()
    };

    console.log('💾 Storing company data in KV:', companyKey);
    await kv.set(companyKey, JSON.stringify(companyData));

    console.log('✅ Payment initialized successfully');
    return c.json({
      success: true,
      message: 'Payment initialized',
      payment_reference: companyKey,
      amount: totalAmount,
      currency: 'USD',
      billing_frequency,
      employee_count: employeeCount
    });

  } catch (e: any) {
    console.error('❌ Init payment error:', e);
    return c.json({ 
      error: 'Failed to initialize payment',
      details: e.message 
    }, 500);
  }
});

// Check payment status and create company if paid (Step 2)
app.get(`${PREFIX}/company/payment-status/:reference`, async (c) => {
  console.log('🔵 Payment status check endpoint called');
  
  try {
    const reference = c.req.param('reference');
    console.log('🔍 Checking reference:', reference);

    // Get company data from KV
    const companyDataStr = await kv.get(reference);
    
    if (!companyDataStr) {
      console.error('❌ Payment reference not found');
      return c.json({ 
        error: 'Payment reference not found or expired',
        reference 
      }, 404);
    }

    const companyData = JSON.parse(companyDataStr);
    console.log('📦 Retrieved company data:', companyData);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://ivohczdtuxasyfoiphqu.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
      return c.json({ error: 'Server configuration error' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create auth user for admin
    console.log('👤 Creating auth user for:', companyData.admin_email);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: companyData.admin_email,
      password: companyData.admin_password,
      email_confirm: true,
      user_metadata: {
        full_name: companyData.admin_full_name
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      return c.json({ error: 'Failed to create user', details: authError.message }, 500);
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create company
    console.log('🏢 Creating company:', companyData.company_name);
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyData.company_name,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (companyError) {
      console.error('❌ Company creation failed:', companyError);
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: 'Failed to create company', details: companyError.message }, 500);
    }

    console.log('✅ Company created:', company.id);

    // Create user profile
    console.log('👤 Creating user profile');
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: companyData.admin_email,
        full_name: companyData.admin_full_name,
        role: 'Admin',
        company_id: company.id,
        is_active: true,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      // Rollback: delete company and auth user
      await supabase.from('companies').delete().eq('id', company.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: 'Failed to create user profile', details: profileError.message }, 500);
    }

    console.log('✅ User profile created');

    // Create subscription record
    console.log('💳 Creating subscription record');
    const subscriptionEndDate = new Date();
    if (companyData.billing_frequency === 'yearly') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        company_id: company.id,
        plan_type: 'paid',
        billing_frequency: companyData.billing_frequency,
        employee_licenses: companyData.employee_count,
        amount_paid: companyData.amount,
        currency: companyData.currency,
        status: 'active',
        payment_reference: reference,
        subscription_start: new Date().toISOString(),
        subscription_end: subscriptionEndDate.toISOString(),
        created_at: new Date().toISOString()
      });

    if (subscriptionError) {
      console.error('❌ Subscription creation failed:', subscriptionError);
      // Rollback: delete profile, company and auth user
      await supabase.from('users').delete().eq('id', authData.user.id);
      await supabase.from('companies').delete().eq('id', company.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: 'Failed to create subscription', details: subscriptionError.message }, 500);
    }

    console.log('✅ Subscription created');

    // Clean up KV store
    await kv.del(reference);
    console.log('🧹 Cleaned up temporary data');

    console.log('🎉 Company setup completed successfully');
    return c.json({
      success: true,
      message: 'Company created successfully',
      company: {
        id: company.id,
        name: company.name
      },
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      subscription: {
        billing_frequency: companyData.billing_frequency,
        employee_licenses: companyData.employee_count,
        subscription_end: subscriptionEndDate.toISOString()
      }
    });

  } catch (e: any) {
    console.error('❌ Payment status check error:', e);
    return c.json({ 
      error: 'Failed to process payment status',
      details: e.message 
    }, 500);
  }
});

// Add license management routes
addLicenseRoutes(app, PREFIX);

// Production cleanup endpoint (SuperAdmin only)
app.post(`${PREFIX}/admin/cleanup`, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization' }, 401);
    }

    const token = authHeader.substring(7);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://ivohczdtuxasyfoiphqu.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseKey) {
      return c.json({ error: 'Server configuration error' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Check if user is SuperAdmin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'SuperAdmin') {
      return c.json({ error: 'Unauthorized - SuperAdmin only' }, 403);
    }

    // Perform cleanup
    const result = await performProductionCleanup(supabase);
    return c.json(result);

  } catch (e: any) {
    console.error('Cleanup error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Migration endpoint for company keys
app.post(`${PREFIX}/admin/migrate-company-keys`, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization' }, 401);
    }

    const token = authHeader.substring(7);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://ivohczdtuxasyfoiphqu.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseKey) {
      return c.json({ error: 'Server configuration error' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Check if user is SuperAdmin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'SuperAdmin') {
      return c.json({ error: 'Unauthorized - SuperAdmin only' }, 403);
    }

    // Perform migration
    const result = await migrateCompanyKeys(supabase);
    return c.json(result);

  } catch (e: any) {
    console.error('Migration error:', e);
    return c.json({ error: e.message }, 500);
  }
});

// Fallback for all other routes
app.all("*", (c) => {
  return c.json({ 
    error: "Not found",
    path: c.req.path,
    method: c.req.method,
    prefix: PREFIX,
    availableEndpoints: [
      `GET ${PREFIX}/health`,
      `POST ${PREFIX}/company/init-payment`,
      `GET ${PREFIX}/company/payment-status/:reference`,
      `POST ${PREFIX}/company/test-payment`,
      `POST ${PREFIX}/admin/cleanup`,
      `POST ${PREFIX}/admin/migrate-company-keys`
    ]
  }, 404);
});

// Export the app
export default { 
  fetch: app.fetch,
  port: 8000 
};

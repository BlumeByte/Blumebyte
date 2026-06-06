// This file contains the FIXED version of the user creation endpoint
// Copy this code to replace the user creation endpoint in index.tsx at line 1836

/*
// Create user (superadmin can create any role, admin can create employee/manager/admin)
app.post(`${PREFIX}/superadmin/users/create`, async (c) => {
  try {
    const { user: authUser } = await requireSuperAdmin(c);
    const body = await c.req.json();
    const { email, name, role, companyId, department, departments, position } = body;
    if (!email || !name || !role) {
      return c.json({ error: "Email, name and role are required" }, 400);
    }
    
    // CRITICAL FIX: Get company ID from super admin's employee record
    const adminProfile = await kv.get(`employee:${authUser.id}`);
    const userCompanyId = adminProfile?.companyId || adminProfile?.company;
    
    if (!userCompanyId) {
      console.error('SuperAdmin has no companyId:', authUser.id, adminProfile);
      return c.json({ error: "User not associated with a company. Please contact support." }, 400);
    }
    
    // FIXED: Check license availability using the new utility function
    // This handles both old format (company: key with direct licenses field) 
    // and new format (company_by_id: key with subscription object)
    let company = await kv.get(`company_by_id:${userCompanyId}`);
    if (!company) {
      company = await kv.get(`company:${userCompanyId}`);
    }
    
    if (!company) {
      console.error('Company not found:', userCompanyId);
      return c.json({ error: "Company not found. Please contact support." }, 400);
    }
    
    // Handle both subscription formats
    const subscription = company.subscription || (company.licenses > 0 ? {
      status: company.subscriptionStatus === 'active' ? 'active' : 'inactive',
      licenses: company.licenses
    } : null);
    
    if (!subscription || subscription.status !== 'active') {
      console.error('No active subscription:', { companyId: userCompanyId, subscription });
      return c.json({ 
        error: "No active subscription. Please purchase licenses first.",
        needsSubscription: true 
      }, 403);
    }
    
    // Count existing active users in this company
    const companyStats = await kv.get(`company_stats:${userCompanyId}`) || {};
    const usedLicenses = companyStats.usedLicenses || company.usedLicenses || 1; // At least the super admin
    const purchasedLicenses = subscription.licenses || 0;
    
    if (usedLicenses >= purchasedLicenses) {
      return c.json({ 
        error: "No available licenses. Please purchase more licenses to add users.",
        needsLicenses: true,
        usedLicenses,
        purchasedLicenses 
      }, 403);
    }
    
    // ... rest of the code remains the same ...
  } catch (e: any) {
    // error handling
  }
});
*/

export const FIX_INSTRUCTIONS = `
Replace lines 1854-1863 in /supabase/functions/server/index.tsx with:

    // FIXED: Check license availability for this company
    // Handle both storage formats: company_by_id: (new) and company: (old)
    let company = await kv.get(\`company_by_id:\${userCompanyId}\`);
    if (!company) {
      company = await kv.get(\`company:\${userCompanyId}\`);
    }
    
    if (!company) {
      console.error('Company not found:', userCompanyId);
      return c.json({ error: "Company not found. Please contact support." }, 400);
    }
    
    // Handle both subscription formats
    // New: company.subscription object | Old: company.licenses + company.subscriptionStatus
    const subscription = company.subscription || (company.licenses > 0 ? {
      status: company.subscriptionStatus === 'active' ? 'active' : 'inactive',
      licenses: company.licenses
    } : null);
    
    if (!subscription || subscription.status !== 'active') {
      console.error('No active subscription:', { companyId: userCompanyId, hasSubscription: !!subscription, status: subscription?.status });
      return c.json({ 
        error: "No active subscription. Please purchase licenses first.",
        needsSubscription: true 
      }, 403);
    }

Also update line 1867 to include fallback to company.usedLicenses:
    const usedLicenses = companyStats.usedLicenses || company.usedLicenses || 1; // At least the super admin
`;

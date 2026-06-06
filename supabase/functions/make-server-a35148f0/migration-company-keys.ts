// Migration endpoint to fix company storage keys
// This ensures all companies have both company: and company_by_id: keys

import * as kv from "./kv_store.ts";

export async function migrateCompanyKeys() {
  console.log('Starting company key migration...');
  
  // Get all company: keys
  const companies = await kv.getByPrefix('company:');
  console.log(`Found ${companies.length} companies to migrate`);
  
  let migrated = 0;
  let skipped = 0;
  
  for (const company of companies) {
    // Skip if this is a company_by_id, company_stats, or company_users key
    const keyMatch = company.id || company.companyId;
    if (!keyMatch || company.key?.includes('company_by_id') || company.key?.includes('company_stats') || company.key?.includes('company_users')) {
      skipped++;
      continue;
    }
    
    const companyId = company.id;
    
    // Check if company_by_id already exists
    const existingById = await kv.get(`company_by_id:${companyId}`);
    
    if (!existingById) {
      // Create company_by_id entry with proper subscription format
      const subscription = company.subscription || (company.licenses > 0 ? {
        status: company.subscriptionStatus === 'active' ? 'active' : 'inactive',
        licenses: company.licenses,
        plan: company.subscriptionPlan || 'monthly',
        startDate: company.subscriptionStartDate || company.createdAt,
        nextBillingDate: company.subscriptionStartDate ? 
          new Date(new Date(company.subscriptionStartDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : 
          null
      } : null);
      
      const normalizedCompany = {
        ...company,
        subscription
      };
      
      await kv.set(`company_by_id:${companyId}`, normalizedCompany);
      console.log(`Migrated company ${companyId} (${company.name})`);
      migrated++;
    } else {
      console.log(`Company ${companyId} already has company_by_id key, skipping`);
      skipped++;
    }
  }
  
  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped`);
  
  return {
    success: true,
    migrated,
    skipped,
    total: companies.length
  };
}

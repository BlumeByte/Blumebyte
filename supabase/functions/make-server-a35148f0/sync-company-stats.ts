/**
 * Utility to sync company stats across all tenants
 * Ensures accurate real-time reporting of employee counts and license usage
 */
import * as kv from './kv_store.ts';

export async function recalculateCompanyStats(companyId: string) {
  try {
    console.log(`Recalculating stats for company: ${companyId}`);
    
    // Get all employees for this company
    const allEmployees = await kv.getByPrefix('employee:');
    const companyEmployees = allEmployees.filter((emp: any) => 
      emp.companyId === companyId || emp.company === companyId
    );
    
    // Get company and subscription info
    const company = await kv.get(`company:${companyId}`) || await kv.get(`company_by_id:${companyId}`);
    const subscription = company?.subscription;
    
    // Calculate stats
    const totalEmployees = companyEmployees.length;
    const activeEmployees = companyEmployees.filter((emp: any) => emp.status === 'active').length;
    const inactiveEmployees = companyEmployees.filter((emp: any) => emp.status === 'inactive').length;
    const usedLicenses = activeEmployees;
    const purchasedLicenses = subscription?.licenses || company?.licenses || 0;
    const availableLicenses = Math.max(0, purchasedLicenses - usedLicenses);
    
    // Update company stats
    const stats = {
      companyId,
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      usedLicenses,
      purchasedLicenses,
      availableLicenses,
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set(`company_stats:${companyId}`, stats);
    
    console.log(`✅ Company stats updated for ${companyId}:`, stats);
    return stats;
  } catch (error) {
    console.error(`Error recalculating stats for company ${companyId}:`, error);
    throw error;
  }
}

export async function syncAllCompaniesStats() {
  try {
    console.log('🔄 Starting sync for all company stats...');
    
    // Get all companies
    const allCompanies = await kv.getByPrefix('company_by_id:');
    console.log(`Found ${allCompanies.length} companies to sync`);
    
    const results = [];
    for (const company of allCompanies) {
      const companyId = company.id || company.companyId;
      if (companyId) {
        try {
          const stats = await recalculateCompanyStats(companyId);
          results.push({ companyId, success: true, stats });
        } catch (error: any) {
          results.push({ companyId, success: false, error: error.message });
        }
      }
    }
    
    console.log('✅ Sync completed for all companies');
    return results;
  } catch (error) {
    console.error('Error syncing all companies:', error);
    throw error;
  }
}

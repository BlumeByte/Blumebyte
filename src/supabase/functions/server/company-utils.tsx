// Company utility functions
import * as kv from "./kv_store.tsx";

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

/**
 * Get company record - handles both old and new storage formats
 * @param companyId - The company ID to look up
 * @returns Company object with subscription info
 */
export async function getCompanyWithSubscription(companyId: string) {
  // Try new format first (company_by_id:)
  let company = await kv.get(`company_by_id:${companyId}`);
  
  // Fallback to old format (company:)
  if (!company) {
    company = await kv.get(`company:${companyId}`);
  }
  
  if (!company) {
    return null;
  }
  
  // Normalize subscription format
  // New format: company.subscription object
  // Old format: company.licenses, company.subscriptionStatus fields
  const subscription = company.subscription || (company.licenses > 0 ? {
    status: company.subscriptionStatus === 'active' ? 'active' : 'inactive',
    licenses: company.licenses,
    plan: company.subscriptionPlan || 'monthly',
    startDate: company.subscriptionStartDate || company.createdAt
  } : null);
  
  return {
    ...company,
    subscription
  };
}

/**
 * Check if company has active subscription with available licenses
 * @param companyId - The company ID
 * @returns Object with validation result and details
 */
export async function validateCompanyLicenses(companyId: string) {
  const company = await getCompanyWithSubscription(companyId);
  
  if (!company) {
    return {
      valid: false,
      error: "Company not found",
      needsSubscription: true
    };
  }
  
  const subscription = company.subscription;
  
  if (!subscription || !isSubscriptionActive(subscription)) {
    return {
      valid: false,
      error: "No active subscription. Please purchase licenses first.",
      needsSubscription: true,
      debug: {
        hasSubscription: !!subscription,
        subscriptionStatus: subscription?.status,
        subscriptionEndDate: subscription?.endDate || subscription?.expiresAt
      }
    };
  }
  
  // Get usage stats
  const companyStats = await kv.get(`company_stats:${companyId}`) || {};
  const usedLicenses = companyStats.usedLicenses || company.usedLicenses || 1;
  const purchasedLicenses = subscription.licenses || 0;
  
  if (usedLicenses >= purchasedLicenses) {
    return {
      valid: false,
      error: "No available licenses. Please purchase more licenses to add users.",
      needsLicenses: true,
      usedLicenses,
      purchasedLicenses
    };
  }
  
  return {
    valid: true,
    company,
    subscription,
    usedLicenses,
    purchasedLicenses,
    availableLicenses: purchasedLicenses - usedLicenses
  };
}

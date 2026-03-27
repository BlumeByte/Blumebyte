// Temporary debug helper
export function debugSubscription(company: any, userCompanyId: string) {
  console.log('=== SUBSCRIPTION DEBUG ===');
  console.log('Company ID:', userCompanyId);
  console.log('Company exists:', !!company);
  console.log('Company data:', JSON.stringify(company, null, 2));
  console.log('Subscription exists:', !!company?.subscription);
  console.log('Subscription:', JSON.stringify(company?.subscription, null, 2));
  console.log('Subscription status:', company?.subscription?.status);
  console.log('===========================');
}

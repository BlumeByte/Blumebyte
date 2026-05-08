export const CUSTOMER_CARE_ROLES = ['customer_care', 'customer-care', 'customer_care_agent', 'care', 'support'] as const;

export function isCustomerCareRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return CUSTOMER_CARE_ROLES.includes(role as typeof CUSTOMER_CARE_ROLES[number]);
}

export function getRoleDashboardPath(role: string | null | undefined): string {
  if (!role) return '/login';
  if (role === 'ultimateadmin' || role === 'developer') return '/developer';
  if (isCustomerCareRole(role)) return '/customer-care';
  return `/${role}`;
}

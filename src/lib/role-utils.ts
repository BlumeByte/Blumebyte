export const CUSTOMER_CARE_ROLES = ['customer_care', 'customer-care'] as const;

export function isCustomerCareRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return CUSTOMER_CARE_ROLES.includes(role as typeof CUSTOMER_CARE_ROLES[number]);
}

export function getRoleDashboardPath(role: string | null | undefined): string {
  if (!role) return '/login';
  // developer is the canonical platform admin role; 'ultimateadmin' is a legacy alias
  if (role === 'developer' || role === 'ultimateadmin') return '/developer';
  if (isCustomerCareRole(role)) return '/customer-care';
  if (role === 'superadmin' || role === 'admin' || role === 'manager' || role === 'employee') return `/${role}`;
  return '/login';
}

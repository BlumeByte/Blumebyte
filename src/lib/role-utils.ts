export const CUSTOMER_CARE_ROLES = ['customer_care', 'customer-care'] as const;

export function normalizeRole(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!raw) return '';
  const compact = raw.replace(/[\s_-]+/g, '');
  if (compact === 'superadmin') return 'superadmin';
  if (compact === 'ultimateadmin') return 'ultimateadmin';
  if (compact === 'developer') return 'developer';
  if (compact === 'customercare') return 'customer_care';
  if (compact === 'admin' || compact === 'manager' || compact === 'employee') return compact;
  return raw.replace(/-/g, '_');
}

export function isCustomerCareRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return CUSTOMER_CARE_ROLES.includes(normalized as typeof CUSTOMER_CARE_ROLES[number]);
}

export function getRoleDashboardPath(role: string | null | undefined): string {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return '/login';
  // developer is the canonical platform admin role; 'ultimateadmin' is a legacy alias
  if (normalizedRole === 'developer' || normalizedRole === 'ultimateadmin') return '/developer';
  if (isCustomerCareRole(normalizedRole)) return '/customer-care';
  if (normalizedRole === 'superadmin' || normalizedRole === 'admin' || normalizedRole === 'manager' || normalizedRole === 'employee') return `/${normalizedRole}`;
  return '/login';
}

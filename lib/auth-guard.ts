/**
 * Auth Guard Utilities
 * Check user permissions and redirect if unauthorized
 */

export interface User {
  id: string;
  email: string;
  user_type: 'customer' | 'employee' | 'manager';
  roles?: Array<{ slug: string; name: string }>;
}

/**
 * Check if current user is a customer
 */
export function isCustomer(user: User | null): boolean {
  return user?.user_type === 'customer';
}

/**
 * Check if current user is staff (employee/manager)
 */
export function isStaff(user: User | null): boolean {
  return user?.user_type === 'employee' || user?.user_type === 'manager';
}

/**
 * Check if current user has specific role
 */
export function hasRole(user: User | null, roleSlug: string): boolean {
  return user?.roles?.some(role => role.slug === roleSlug) ?? false;
}

/**
 * Admin-only routes that customers cannot access
 */
export const ADMIN_ONLY_ROUTES = [
  '/dashboard/users',
  '/dashboard/roles',
  '/dashboard/permissions',
  '/dashboard/departments',
  '/dashboard/staff-kpi',
  '/dashboard/payroll',
  '/dashboard/reports',
  '/dashboard/finance',
  '/dashboard/invoices',
  '/dashboard/warehouse',
  '/dashboard/seafood',
  '/dashboard/orders', // Customer should use /dashboard/my-orders instead
  '/dashboard/products', // Customer should use POS instead
];

/**
 * Customer-only routes that staff cannot access
 */
export const CUSTOMER_ONLY_ROUTES = [
  '/dashboard/my-orders',
  '/dashboard/customer',
];

/**
 * Check if customer can access a route
 * @param path Current route path
 * @returns true if allowed, false if forbidden
 */
export function canCustomerAccess(path: string): boolean {
  // Check if path starts with any admin-only route
  return !ADMIN_ONLY_ROUTES.some(adminRoute => path.startsWith(adminRoute));
}

/**
 * Check if staff can access a route
 * @param path Current route path
 * @returns true if allowed, false if forbidden
 */
export function canStaffAccess(path: string): boolean {
  // Check if path starts with any customer-only route
  return !CUSTOMER_ONLY_ROUTES.some(customerRoute => path.startsWith(customerRoute));
}

/**
 * Get redirect path based on user type
 * @param user User object
 * @returns Default dashboard path for user type
 */
export function getDefaultDashboard(user: User | null): string {
  if (!user) return '/auth/login';

  if (isCustomer(user)) {
    return '/dashboard/customer'; // Customer dashboard
  }

  return '/dashboard'; // Staff dashboard
}

/**
 * Validate user access to current route
 * @param user User object
 * @param currentPath Current route path
 * @returns Object with { allowed: boolean, redirectTo?: string }
 */
export function validateRouteAccess(
  user: User | null,
  currentPath: string
): { allowed: boolean; redirectTo?: string } {
  if (!user) {
    return { allowed: false, redirectTo: '/auth/login' };
  }

  // Customer trying to access admin routes
  if (isCustomer(user) && !canCustomerAccess(currentPath)) {
    return {
      allowed: false,
      redirectTo: '/dashboard/customer',
    };
  }

  // Customer trying to access main dashboard - redirect to customer dashboard
  if (isCustomer(user) && currentPath === '/dashboard') {
    return {
      allowed: false,
      redirectTo: '/dashboard/customer',
    };
  }

  // Staff trying to access customer-only routes
  if (isStaff(user) && !canStaffAccess(currentPath)) {
    return {
      allowed: false,
      redirectTo: '/dashboard',
    };
  }

  return { allowed: true };
}

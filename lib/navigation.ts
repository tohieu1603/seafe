import {
  Shield,
  Users,
  Key,
  Building2,
  LayoutDashboard,
  Fish,
  ShoppingCart,
  Package,
  TrendingUp,
  Receipt,
  DollarSign,
  Warehouse,
  FileText,
  BarChart3,
  UserCog,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[]; // Nếu không có roles thì cho tất cả
  permissions?: string[]; // Optional permissions required
}

// Navigation cho Super Admin - Full access
export const superAdminNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Hải sản", href: "/dashboard/seafood", icon: Fish },
  { name: "POS Bán hàng", href: "/dashboard/pos", icon: ShoppingCart },
  { name: "Sản phẩm", href: "/dashboard/products", icon: Package },
  { name: "Đơn hàng", href: "/dashboard/orders", icon: Receipt },
  { name: "Báo cáo", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Tài chính", href: "/dashboard/finance", icon: DollarSign },
  { name: "KPI Nhân viên", href: "/dashboard/staff-kpi", icon: TrendingUp },
  { name: "Vai trò", href: "/dashboard/roles", icon: Shield },
  { name: "Quyền hạn", href: "/dashboard/permissions", icon: Key },
  { name: "Người dùng", href: "/dashboard/users", icon: Users },
  { name: "Phòng ban", href: "/dashboard/departments", icon: Building2 },
];

// Navigation cho Manager - Quản lý
export const managerNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Hải sản", href: "/dashboard/seafood", icon: Fish },
  { name: "POS Bán hàng", href: "/dashboard/pos", icon: ShoppingCart },
  { name: "Sản phẩm", href: "/dashboard/products", icon: Package },
  { name: "Đơn hàng", href: "/dashboard/orders", icon: Receipt },
  { name: "Báo cáo", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Tài chính", href: "/dashboard/finance", icon: DollarSign },
  { name: "KPI Nhân viên", href: "/dashboard/staff-kpi", icon: TrendingUp },
  { name: "Người dùng", href: "/dashboard/users", icon: Users },
];

// Navigation cho Salesperson - Nhân viên bán hàng
export const salespersonNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "POS Bán hàng", href: "/dashboard/pos", icon: ShoppingCart },
  { name: "Sản phẩm", href: "/dashboard/products", icon: Package },
  { name: "Đơn hàng", href: "/dashboard/orders", icon: Receipt },
  { name: "KPI của tôi", href: "/dashboard/my-kpi", icon: TrendingUp },
  { name: "Hồ sơ", href: "/dashboard/profile", icon: UserCog },
];

// Navigation cho Accountant - Kế toán
export const accountantNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Đơn hàng", href: "/dashboard/orders", icon: Receipt },
  { name: "Quản lý lương", href: "/dashboard/payroll", icon: DollarSign },
  { name: "Báo cáo", href: "/dashboard/reports", icon: BarChart3 },
  { name: "KPI Nhân viên", href: "/dashboard/staff-kpi", icon: TrendingUp },
  { name: "Hóa đơn", href: "/dashboard/invoices", icon: FileText },
  { name: "Hồ sơ", href: "/dashboard/profile", icon: UserCog },
];

// Navigation cho Warehouse - Thủ kho
export const warehouseNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Hải sản", href: "/dashboard/seafood", icon: Fish },
  { name: "Sản phẩm", href: "/dashboard/products", icon: Package },
  { name: "Kho hàng", href: "/dashboard/warehouse", icon: Warehouse },
  { name: "Đơn hàng", href: "/dashboard/orders", icon: Receipt },
  { name: "KPI của tôi", href: "/dashboard/my-kpi", icon: TrendingUp },
  { name: "Hồ sơ", href: "/dashboard/profile", icon: UserCog },
];

// Navigation cho Viewer - Người xem
export const viewerNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sản phẩm", href: "/dashboard/products", icon: Package },
  { name: "Đơn hàng", href: "/dashboard/orders", icon: Receipt },
  { name: "Hồ sơ", href: "/dashboard/profile", icon: UserCog },
];

// Navigation cho Customer - Khách hàng
export const customerNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard/customer", icon: LayoutDashboard },
  { name: "Đặt hàng", href: "/dashboard/pos", icon: ShoppingCart },
  { name: "Đơn hàng của tôi", href: "/dashboard/my-orders", icon: Receipt },
  { name: "Hồ sơ", href: "/dashboard/profile", icon: UserCog },
];

/**
 * Get navigation items based on user roles and user type
 */
export function getNavigationForUser(userRoles: string[], userType?: string): NavigationItem[] {
  // Check user_type first for customers
  if (userType === 'customer') {
    return customerNavigation;
  }

  // Check for highest level role first
  if (userRoles.includes('super-admin')) {
    return superAdminNavigation;
  }

  if (userRoles.includes('manager')) {
    return managerNavigation;
  }

  if (userRoles.includes('salesperson')) {
    return salespersonNavigation;
  }

  if (userRoles.includes('accountant')) {
    return accountantNavigation;
  }

  if (userRoles.includes('warehouse')) {
    return warehouseNavigation;
  }

  if (userRoles.includes('viewer')) {
    return viewerNavigation;
  }

  // Default fallback - minimal navigation
  return [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "👤 Hồ sơ", href: "/dashboard/profile", icon: UserCog },
  ];
}

/**
 * Check if user has permission to access a route
 */
export function canAccessRoute(route: string, userRoles: string[]): boolean {
  const userNav = getNavigationForUser(userRoles);
  return userNav.some(item => route.startsWith(item.href));
}

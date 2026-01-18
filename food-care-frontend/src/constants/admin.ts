import type { OrderStatus, MemberTier } from '../types/admin';

// Status configurations
export const ORDER_STATUS_CONFIG: Record<OrderStatus | 'sent' | 'active', { label: string; className: string }> = {
  delivered: { label: 'Đã giao', className: 'bg-green-500' },
  shipping: { label: 'Đang giao', className: 'bg-blue-500' },
  processing: { label: 'Đang xử lý', className: 'bg-yellow-500' },
  pending: { label: 'Chờ xử lý', className: 'bg-gray-500' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-500' },
  sent: { label: 'Đã gửi', className: 'bg-green-500' },
  active: { label: 'Hoạt động', className: 'bg-green-500' },
};

export const MEMBER_TIER_CONFIG: Record<MemberTier, string> = {
  Bronze: 'bg-orange-600',
  Silver: 'bg-gray-400',
  Gold: 'bg-yellow-500',
  Platinum: 'bg-purple-600',
};

// Mock data - will be replaced with API calls
export const MOCK_STATS = {
  totalRevenue: 125000000,
  totalOrders: 1247,
  totalCustomers: 856,
  totalProducts: 45,
  monthlyGrowth: 12.5,
  activeSubscriptions: 342,
};

export const MOCK_REVENUE_DATA = [
  { month: 'Tháng 8', revenue: 18000000 },
  { month: 'Tháng 9', revenue: 21000000 },
  { month: 'Tháng 10', revenue: 19500000 },
  { month: 'Tháng 11', revenue: 23000000 },
  { month: 'Tháng 12', revenue: 25000000 },
  { month: 'Tháng 1', revenue: 28000000 },
];

// Form validation
export const PRODUCT_FORM_REQUIRED_FIELDS = ['name', 'category', 'price', 'unit', 'stock'] as const;
export const SUPPLIER_FORM_REQUIRED_FIELDS = ['name', 'email', 'phone'] as const;

// UI Constants
export const STOCK_THRESHOLDS = {
  CRITICAL: 50,
  LOW: 100,
} as const;

export const REMINDER_DAY_THRESHOLDS = {
  URGENT: 3,
  WARNING: 7,
} as const;

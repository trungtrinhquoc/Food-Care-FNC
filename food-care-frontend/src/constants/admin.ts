// =============================================
// ADMIN CONSTANTS - Clean Architecture
// =============================================

import type { OrderStatus, MemberTier, PaymentStatus, SupplierStatus } from '../types/admin';

// ==================== STATUS CONFIGURATIONS ====================
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string; bgColor: string }> = {
  pending: { label: 'Chờ xử lý', className: 'bg-gray-500', bgColor: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-blue-500', bgColor: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Đang chuẩn bị', className: 'bg-purple-500', bgColor: 'bg-purple-100 text-purple-700' },
  shipping: { label: 'Đang giao', className: 'bg-indigo-500', bgColor: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Đã giao', className: 'bg-green-500', bgColor: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-500', bgColor: 'bg-red-100 text-red-700' },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: 'Chưa thanh toán', className: 'bg-red-100 text-red-700' },
  paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
  refunded: { label: 'Đã hoàn tiền', className: 'bg-yellow-100 text-yellow-700' },
};

export const MEMBER_TIER_CONFIG: Record<MemberTier, { className: string; label: string }> = {
  Bronze: { className: 'bg-orange-600', label: 'Đồng' },
  Silver: { className: 'bg-gray-400', label: 'Bạc' },
  Gold: { className: 'bg-yellow-500', label: 'Vàng' },
  Platinum: { className: 'bg-purple-600', label: 'Bạch kim' },
};

export const SUPPLIER_STATUS_CONFIG: Record<SupplierStatus, { label: string; className: string }> = {
  active: { label: 'Hoạt động', className: 'bg-green-100 text-green-700' },
  inactive: { label: 'Ngừng hoạt động', className: 'bg-gray-100 text-gray-700' },
};

// ==================== USER ROLE CONFIGURATIONS ====================
export const USER_ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin: { label: 'Quản trị viên', className: 'bg-red-100 text-red-700' },
  staff: { label: 'Nhân viên', className: 'bg-blue-100 text-blue-700' },
  customer: { label: 'Khách hàng', className: 'bg-green-100 text-green-700' },
};

// ==================== THRESHOLDS ====================
export const STOCK_THRESHOLDS = {
  CRITICAL: 50,
  LOW: 100,
} as const;

export const REMINDER_DAY_THRESHOLDS = {
  URGENT: 3,
  WARNING: 7,
} as const;

// ==================== PAGINATION ====================
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ==================== FORM VALIDATION ====================
export const PRODUCT_FORM_REQUIRED_FIELDS = ['name', 'category', 'price', 'unit', 'stock'] as const;
export const SUPPLIER_FORM_REQUIRED_FIELDS = ['name', 'email', 'phone'] as const;
export const USER_FORM_REQUIRED_FIELDS = ['email', 'password'] as const;

// ==================== DATE FORMATS ====================
export const DATE_FORMAT = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// ==================== HELPER FUNCTIONS ====================
export const getOrderStatusLabel = (status: string): string => {
  return ORDER_STATUS_CONFIG[status as OrderStatus]?.label || status;
};

export const getOrderStatusColor = (status: string): string => {
  return ORDER_STATUS_CONFIG[status as OrderStatus]?.bgColor || 'bg-gray-100 text-gray-700';
};

export const getPaymentStatusLabel = (status: string): string => {
  return PAYMENT_STATUS_CONFIG[status as PaymentStatus]?.label || status;
};

export const getPaymentStatusColor = (status: string): string => {
  return PAYMENT_STATUS_CONFIG[status as PaymentStatus]?.className || 'bg-gray-100 text-gray-700';
};

export const getMemberTierColor = (tier: MemberTier): string => {
  return MEMBER_TIER_CONFIG[tier]?.className || 'bg-gray-500';
};

export const getUserRoleLabel = (role: string): string => {
  return USER_ROLE_CONFIG[role]?.label || role;
};

export const getUserRoleColor = (role: string): string => {
  return USER_ROLE_CONFIG[role]?.className || 'bg-gray-100 text-gray-700';
};

// ==================== FORMAT HELPERS ====================
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Chưa có';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

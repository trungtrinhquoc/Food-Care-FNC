// =============================================
// ADMIN TYPES - Clean Architecture
// =============================================

// ==================== COMMON ====================
export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// ==================== ENUMS / UNION TYPES ====================
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type MemberTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type SupplierStatus = 'active' | 'inactive';
export type ReminderStatus = 'pending' | 'sent';
export type UserRole = 'admin' | 'staff' | 'customer';
export type PointLogType = 'earn' | 'redeem' | 'adjust';

// ==================== ADMIN STATS ====================
export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  monthlyGrowth: number;
  activeSubscriptions: number;
  lowStockProducts?: number;
  pendingOrders?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

// ==================== USERS / CUSTOMERS ====================
export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  tierId: number | null;
  tierName: string | null;
  loyaltyPoints: number | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
  lastOrderDate?: string | null; // Optional - included in list responses
  totalOrders: number;
  totalSpent: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalReviews: number;
}

export interface CustomerDetail extends AdminUser {
  // Extended fields for detailed view
}

export interface AdminUserFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  tierId?: number;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName?: string;
  role?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  role?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  tierId?: number | null;
  loyaltyPoints?: number;
  isActive: boolean;
}

export interface UpdateCustomerDto {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  tierId?: number | null;
  loyaltyPoints?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<string, number>;
  usersByTier: Record<string, number>;
  newUsersThisMonth: number;
}

// Alias for backward compatibility
export type CustomerStats = UserStats;

export interface MemberTierInfo {
  id: number;
  name: string;
  minPoint: number;
  discountPercent: number | null;
}

// Legacy type alias for backward compatibility
export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  memberTier: MemberTier;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  subscriptions: number;
}

// ==================== ORDERS ====================
export interface AdminOrder {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  note: string | null;
  trackingNumber: string | null;
  shippingAddressSnapshot: string | null;
  paymentMethodSnapshot: string | null;
  createdAt: string;
  updatedAt: string | null;
  orderItems: AdminOrderItem[];
  // Additional fields used in UI
  date?: string;
  phone?: string;
  address?: string;
  products?: string[];
  total?: number;
  subscription?: boolean;
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface AdminOrderFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  userId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface UpdateOrderStatusDto {
  status: string;
  note?: string;
  changedBy?: string;
}

// ==================== PRODUCTS ====================
export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: number | null;
  categoryName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  description: string | null;
  basePrice: number;
  originalPrice: number | null;
  unit: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  images: string[];
  ratingAverage: number;
  ratingCount: number;
  isSubscriptionAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductFormData {
  name: string;
  categoryName: string;
  basePrice: string;
  originalPrice: string;
  imageUrl: string;
  description: string;
  unit: string;
  stockQuantity: string;
}

// ==================== CATEGORIES ====================
export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: number | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  parentId?: number | null;
  displayOrder?: number;
  isActive?: boolean;
}

// ==================== SUPPLIERS ====================
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contact: string;
  products: string[];
  totalProducts: number;
  status: SupplierStatus;
}

export interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  contact: string;
  products: string;
}

export interface CreateSupplierDto {
  name: string;
  email: string;
  phone: string;
  address?: string;
  contact?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact?: string;
  status?: SupplierStatus;
}

// ==================== REVIEWS ====================
export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string | null;
  rating: number;
  comment: string | null;
  images: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  replyComment: string | null;
  replyAt: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminReviewFilter {
  page?: number;
  pageSize?: number;
  productId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  isVerifiedPurchase?: boolean;
  isHidden?: boolean;
  hasReply?: boolean;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  hiddenCount: number;
  repliedCount: number;
  // Rating distribution for charts
  ratingDistribution?: Record<string, number>;
}

// ==================== ZALO REMINDERS ====================
export interface ZaloReminder {
  id: string;
  customerName: string;
  phone: string;
  product: string;
  estimatedDaysLeft: number;
  lastPurchase: string;
  status: ReminderStatus;
  sentDate?: string;
}

// ==================== CUSTOMER LOGS ====================
export interface RecentOrder {
  id: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
}

export interface OrderLog {
  id: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  paymentStatus: string;
}

export interface LoginLog {
  id: string;
  loginAt: string;
  ipAddress: string;
  device: string;
  location: string;
  success: boolean;
}

export interface PaymentLog {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paidAt: string;
  transactionId: string;
}

export interface ReviewLog {
  id: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

export interface PointLog {
  id: string;
  points: number;
  type: PointLogType;
  description: string;
  createdAt: string;
  orderId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

export interface AdjustPointsRequest {
  points: number;
  description?: string;
}

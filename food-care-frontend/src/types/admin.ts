// Admin-specific types
export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  monthlyGrowth: number;
  activeSubscriptions: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';

export interface AdminOrder {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: number;
  subscription: boolean;
  products: string[];
  address: string;
  phone: string;
}

export type MemberTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

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

export type SupplierStatus = 'active' | 'inactive';

export interface Supplier {
  id: string;
  name: string;
  products: string[];
  totalProducts: number;
  status: SupplierStatus;
  phone: string;
  email: string;
  address: string;
  contact: string;
}

export type ReminderStatus = 'pending' | 'sent';

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

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface ProductFormData {
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  image: string;
  description: string;
  unit: string;
  stock: string;
}

export interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  contact: string;
  products: string;
}

// ===== SUPPLIER TYPES =====

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  address: string;
  contactPerson: string;
  taxCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  productCount: number;
}

export interface CreateSupplierRequest {
  name: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxCode?: string;
  isActive?: boolean;
  userId?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxCode?: string;
  isActive?: boolean;
  userId?: string;
}

export interface SupplierFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'productCount';
  sortDescending?: boolean;
}

export interface PagedSupplierResult {
  items: Supplier[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===== ORDER TYPES =====

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  shipping?: {
    timeline: Array<{
      date: string;
      timestamp?: string;
      status: string;
      location: string;
      description: string;
      notes?: string;
    }>;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  ward?: string;
  district?: string;
}

// ===== ALERT TYPES =====

export interface Alert {
  id: string;
  type: 'low_stock' | 'new_order' | 'shipping_delay' | 'payment_issue' | 'system';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

// ===== SUPPLIER ROLE TYPES =====

export interface SupplierProfile {
  id: number;
  name: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxCode?: string;
  createdAt: string;
  updatedAt?: string;
  productCount: number;
  totalRevenue: number;
  totalOrders: number;
}

export interface SupplierProduct {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  price?: number; // For compatibility
  cost?: number; // Cost price
  stockQuantity: number;
  stock?: number; // For compatibility
  minStock?: number;
  maxStock?: number;
  sku?: string;
  category?: string;
  image?: string;
  images?: string[];
  isActive: boolean;
  status?: 'active' | 'inactive' | 'out_of_stock'; // For compatibility
  createdAt: string;
  updatedAt?: string;
  orderCount: number;
  soldCount?: number; // For compatibility
  totalRevenue: number;
}

export interface SupplierOrder {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  customerName: string;
  itemCount: number;
}

export interface SupplierStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
}

// ===== DASHBOARD METRICS TYPES =====

export interface KPIMetrics {
  revenue: {
    today: number;
    month: number;
    change: number; // percentage change
  };
  orders: {
    new: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    new: number;
    returning: number;
    total: number;
  };
}

export interface FulfillmentMetrics {
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  fulfillmentRate: number;
  averageFulfillmentTime: number; // in hours
  onTimeDeliveryRate: number;
  dailyProcessing: Array<{
    date: string;
    processed: number;
    shipped: number;
    delivered: number;
  }>;
}

export interface ShippingInfo {
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  cost: number;
  notes?: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  notes?: string;
  shippingInfo?: ShippingInfo;
}

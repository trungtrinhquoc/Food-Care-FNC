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

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned' | 'new' | 'processing' | 'packed' | 'shipped' | 'refunded';

export interface ShippingTimeline {
  date: string;
  timestamp?: string;
  status: string;
  location: string;
  description: string;
  notes?: string;
}

export interface OrderShipping {
  carrier?: string;
  trackingNumber?: string;
  expectedDelivery?: string;
  status?: ShippingStatus;
  timeline: ShippingTimeline[];
}

export type ShippingStatus = 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';

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
  orderStatus?: OrderStatus;
  products?: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    imageUrl?: string;
  }>;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  shipping?: OrderShipping;
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
  data?: Record<string, unknown>;
  orderNumber?: string;
  orderId?: string;
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
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: Address;
  items?: OrderItem[];
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
  completedOrders: number;
  cancelledOrders: number;
  shippingOrders: number;
  confirmedOrders: number;
  outOfStockProducts: number;
  todayRevenue: number;
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
    shipping?: number;
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
  onTimeRate?: number;
}

export interface ShippingSuccessItem {
  category: string;
  value: number;
  percentage: number;
}

export interface FulfillmentMetrics {
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  fulfillmentRate: number;
  averageFulfillmentTime: number; // in hours
  avgFulfillmentTime?: Array<{ date: string; time: number }>; // For chart
  onTimeDeliveryRate: number;
  dailyProcessing: Array<{
    date: string;
    processed: number;
    shipped: number;
    delivered: number;
  }>;
  shippingSuccess?: ShippingSuccessItem[];
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

// ===== SHIPMENT TYPES =====

export type ShipmentStatus = 'Draft' | 'Dispatched' | 'InTransit' | 'Arrived' | 'Received' | 'Cancelled';

export interface SupplierShipment {
  id: string;
  shipmentNumber: string;
  supplierId: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  status: ShipmentStatus;
  trackingNumber?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  dispatchedAt?: string;
  notes?: string;
  itemCount?: number;
  totalValue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShipmentItem {
  id?: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  expiryDate?: string;
  batchNumber?: string;
}

export interface CreateShipmentRequest {
  warehouseId: string;
  estimatedArrival: string;
  trackingNumber?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    expiryDate?: string;
    batchNumber?: string;
  }[];
}

export interface UpdateShipmentRequest {
  estimatedArrival?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface ShipmentFilter {
  status?: ShipmentStatus;
  warehouseId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

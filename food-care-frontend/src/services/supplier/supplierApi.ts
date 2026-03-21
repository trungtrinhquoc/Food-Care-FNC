import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5022/api';

const supplierApi = axios.create({
  baseURL: `${API_URL}/supplier`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
supplierApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
supplierApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Supplier API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================================================
// TYPES
// =====================================================

export interface SupplierProfile {
  id: number;
  name: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
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
  manufacturer?: string;
  origin?: string;
  basePrice: number;
  price?: number;
  cost?: number;
  stockQuantity: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  sku?: string;
  categoryId?: string;
  category?: string;
  image?: string;
  images?: string[];
  isActive: boolean;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  orderCount: number;
  soldCount?: number;
  totalRevenue: number;
}

export interface SupplierOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SupplierOrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface SupplierOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface SupplierStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  averageOrderValue: number;
  fulfillmentRate: number;
  onTimeDeliveryRate: number;
}

export interface UpdateProfileRequest {
  name?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxCode?: string;
  // Structured address fields
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
}

// =====================================================
// SHIPMENT TYPES
// =====================================================

export interface SupplierShipment {
  id: string;
  externalReference: string;
  warehouseId: string;
  warehouseName?: string;
  status: string;
  expectedDeliveryDate: string;
  actualDispatchDate?: string;
  actualArrivalDate?: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  totalValue?: number;
  totalItems: number;
  totalQuantity: number;
  createdAt: string;
  // Governance fields
  submittedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  adminHoldReason?: string;
  heldAt?: string;
  invoiceUrl?: string;
  packingListUrl?: string;
  // Inbound session link
  inboundSessionId?: string;
  inboundSessionCode?: string;
  inboundSessionSupplierId?: string;
  items: ShipmentItem[];
  documents: ShipmentDocument[];
}

export interface ShipmentItem {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  expectedQuantity: number;
  uom: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  unitCost?: number;
  lineTotal?: number;
  notes?: string;
}

export interface ShipmentDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface CreateShipmentRequest {
  externalReference: string;
  warehouseId?: string;
  expectedDeliveryDate: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  inboundSessionId?: string;
  items: CreateShipmentItemRequest[];
}

export interface CreateShipmentItemRequest {
  productId: string;
  quantity: number;
  uom?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  unitCost?: number;
  notes?: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================================================
// REGISTRATION TYPES
// =====================================================

export interface SupplierRegistration {
  supplierId: number;
  storeName: string;
  businessName?: string;
  businessLicense?: string;
  businessLicenseUrl?: string;
  taxCode?: string;
  operatingRegion?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
  registrationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  registrationNotes?: string;
  submittedAt?: string;
  approvedAt?: string;
  isVerified: boolean;
}

export interface SubmitRegistrationRequest {
  businessName: string;
  businessLicense: string;
  businessLicenseUrl?: string;
  taxCode: string;
  operatingRegion: string;
  contactName?: string;
  contactPhone?: string;
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
  registrationNotes?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  manufacturer?: string;
  origin?: string;
  basePrice: number;
  cost?: number;
  stockQuantity: number;
  minStock?: number;
  maxStock?: number;
  sku?: string;
  categoryId?: string;
  images?: string[];
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  manufacturer?: string;
  origin?: string;
  basePrice?: number;
  cost?: number;
  stockQuantity?: number;
  minStock?: number;
  maxStock?: number;
  sku?: string;
  categoryId?: string;
  images?: string[];
  isActive?: boolean;
}

export interface AvailableWarehouse {
  id: string;
  code: string;
  name: string;
  region?: string;
  addressCity?: string;
  addressDistrict?: string;
}

// =====================================================
// PROFILE API
// =====================================================

export const profileApi = {
  // Get supplier profile
  getProfile: async (): Promise<SupplierProfile> => {
    const response = await supplierApi.get<SupplierProfile>('/profile');
    return response.data;
  },

  // Update supplier profile
  updateProfile: async (request: UpdateProfileRequest): Promise<SupplierProfile> => {
    const response = await supplierApi.put<SupplierProfile>('/profile', request);
    return response.data;
  },
};

// =====================================================
// PRODUCTS API
// =====================================================

export const productsApi = {
  // Get supplier's products
  getProducts: async (): Promise<SupplierProduct[]> => {
    const response = await supplierApi.get<SupplierProduct[]>('/products');
    return response.data;
  },

  // Get product by ID
  getProduct: async (id: string): Promise<SupplierProduct> => {
    const response = await supplierApi.get<SupplierProduct>(`/products/${id}`);
    return response.data;
  },

  // Create a new product (pending approval)
  createProduct: async (request: CreateProductRequest): Promise<SupplierProduct> => {
    const response = await supplierApi.post<SupplierProduct>('/products', request);
    return response.data;
  },

  // Update a product
  updateProduct: async (id: string, request: UpdateProductRequest): Promise<SupplierProduct> => {
    const response = await supplierApi.put<SupplierProduct>(`/products/${id}`, request);
    return response.data;
  },

  // Delete a product
  deleteProduct: async (id: string): Promise<void> => {
    await supplierApi.delete(`/products/${id}`);
  },

  // Submit product for approval
  submitForApproval: async (id: string): Promise<void> => {
    await supplierApi.post(`/products/${id}/submit`);
  },
};

// =====================================================
// ORDERS API
// =====================================================

export const ordersApi = {
  // Get supplier's orders
  getOrders: async (): Promise<SupplierOrder[]> => {
    const response = await supplierApi.get<SupplierOrder[]>('/orders');
    return response.data;
  },

  // Get order by ID
  getOrder: async (id: string): Promise<SupplierOrder> => {
    const response = await supplierApi.get<SupplierOrder>(`/orders/${id}`);
    return response.data;
  },

  // Update order status (legacy PUT)
  updateOrderStatus: async (id: string, status: string, notes?: string): Promise<SupplierOrder> => {
    const response = await supplierApi.put<SupplierOrder>(`/orders/${id}/status`, { status, notes });
    return response.data;
  },

  // Update order status with delivery photo / cancel reason (PATCH)
  patchOrderStatus: async (orderId: string, dto: { status: string; deliveryPhotoUrl?: string; reason?: string }) => {
    const response = await supplierApi.patch(`/orders/${orderId}/status`, dto);
    return response.data;
  },
};

// =====================================================
// STATS API
// =====================================================

export const statsApi = {
  // Get supplier stats
  getStats: async (): Promise<SupplierStats> => {
    const response = await supplierApi.get<SupplierStats>('/stats');
    return response.data;
  },
};

// =====================================================
// REVENUE TYPES & API
// =====================================================

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
  year: number;
  monthNumber: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

export interface RevenueData {
  dailyRevenue: DailyRevenue[];
  monthlyRevenue: MonthlyRevenue[];
  categoryRevenue: CategoryRevenue[];
  topProducts: TopProduct[];
  totalRevenue: number;
  totalOrders: number;
}

export const revenueApi = {
  // Get revenue data
  getRevenue: async (months?: number): Promise<RevenueData> => {
    const params = months ? `?months=${months}` : '';
    const response = await supplierApi.get<RevenueData>(`/revenue${params}`);
    return response.data;
  },
};

// =====================================================
// REVIEWS TYPES & API
// =====================================================

export interface SupplierReview {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  images?: string;
  isVerifiedPurchase: boolean;
  replyComment?: string;
  replyAt?: string;
  createdAt: string;
  orderId?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  pendingReplies: number;
  responseRate: number;
}

export const reviewsApi = {
  // Get all reviews for supplier's products
  getReviews: async (): Promise<SupplierReview[]> => {
    const response = await supplierApi.get<SupplierReview[]>('/reviews');
    return response.data;
  },

  // Get review stats
  getStats: async (): Promise<ReviewStats> => {
    const response = await supplierApi.get<ReviewStats>('/reviews/stats');
    return response.data;
  },

  // Respond to a review
  respondToReview: async (reviewId: string, replyComment: string): Promise<void> => {
    await supplierApi.post(`/reviews/${reviewId}/respond`, { replyComment });
  },
};

// =====================================================
// SHIPMENTS API
// =====================================================

export const shipmentsApi = {
  // Get all shipments for supplier
  getShipments: async (
    page = 1,
    pageSize = 20,
    status?: string
  ): Promise<PagedResponse<SupplierShipment>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (status) params.append('status', status);
    
    const response = await supplierApi.get<PagedResponse<SupplierShipment>>(`/shipments?${params}`);
    return response.data;
  },

  // Get shipment by ID
  getShipment: async (id: string): Promise<SupplierShipment> => {
    const response = await supplierApi.get<SupplierShipment>(`/shipments/${id}`);
    return response.data;
  },

  // Create new shipment
  createShipment: async (request: CreateShipmentRequest): Promise<SupplierShipment> => {
    const response = await supplierApi.post<SupplierShipment>('/shipments', request);
    return response.data;
  },

  // Update shipment
  updateShipment: async (id: string, request: Partial<CreateShipmentRequest>): Promise<SupplierShipment> => {
    const response = await supplierApi.put<SupplierShipment>(`/shipments/${id}`, request);
    return response.data;
  },

  // Add item to shipment
  addItem: async (shipmentId: string, item: CreateShipmentItemRequest): Promise<SupplierShipment> => {
    const response = await supplierApi.post<SupplierShipment>(`/shipments/${shipmentId}/items`, item);
    return response.data;
  },

  // Update shipment item
  updateItem: async (
    shipmentId: string,
    itemId: string,
    item: Partial<CreateShipmentItemRequest>
  ): Promise<SupplierShipment> => {
    const response = await supplierApi.put<SupplierShipment>(
      `/shipments/${shipmentId}/items/${itemId}`,
      item
    );
    return response.data;
  },

  // Remove item from shipment
  removeItem: async (shipmentId: string, itemId: string): Promise<void> => {
    await supplierApi.delete(`/shipments/${shipmentId}/items/${itemId}`);
  },

  // Start delivering shipment (Preparing → Delivering)
  startDelivering: async (
    id: string,
    trackingNumber?: string,
    carrier?: string,
    notes?: string
  ): Promise<SupplierShipment> => {
    const response = await supplierApi.post<SupplierShipment>(`/shipments/${id}/start-delivering`, {
      trackingNumber,
      carrier,
      notes,
    });
    return response.data;
  },

  // Cancel shipment
  cancelShipment: async (id: string, reason: string): Promise<SupplierShipment> => {
    const response = await supplierApi.post<SupplierShipment>(`/shipments/${id}/cancel`, { reason });
    return response.data;
  },

  // Get shipment stats
  getStats: async (): Promise<{
    totalShipments: number;
    draftShipments: number;
    inTransitShipments: number;
    deliveredShipments: number;
  }> => {
    const response = await supplierApi.get('/shipments/stats');
    return response.data;
  },
};

// =====================================================
// REGISTRATION API
// =====================================================

export const registrationApi = {
  getStatus: async (): Promise<SupplierRegistration> => {
    const response = await supplierApi.get<SupplierRegistration>('/registration');
    return response.data;
  },
  submit: async (request: SubmitRegistrationRequest): Promise<SupplierRegistration> => {
    const response = await supplierApi.post<SupplierRegistration>('/registration', request);
    return response.data;
  },
};

// =====================================================
// WAREHOUSES API (filtered by supplier's region)
// =====================================================

export const warehousesApi = {
  getAvailable: async (): Promise<AvailableWarehouse[]> => {
    const response = await supplierApi.get<AvailableWarehouse[]>('/warehouses');
    return response.data;
  },
};

// =====================================================
// ADMIN APPROVAL API (for admin dashboard)
// =====================================================

const adminApi = axios.create({
  baseURL: `${API_URL}/admin/approvals`,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface PendingProduct {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  sku?: string;
  imageUrl?: string;
  categoryName?: string;
  supplierId?: number;
  supplierName?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  submittedAt?: string;
  createdAt?: string;
}

export interface PendingSupplier {
  id: number;
  storeName: string;
  businessName?: string;
  businessLicense?: string;
  businessLicenseUrl?: string;
  taxCode?: string;
  operatingRegion?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressCity?: string;
  registrationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  registrationNotes?: string;
  submittedAt?: string;
  createdAt?: string;
}

export interface ApprovalStats {
  products: { pending: number; approved: number; rejected: number };
  suppliers: { pending: number; approved: number; rejected: number };
}

export const adminApprovalApi = {
  // Products
  getPendingProducts: async (
    status?: string,
    page = 1,
    pageSize = 20
  ): Promise<PagedResponse<PendingProduct>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    const response = await adminApi.get<PagedResponse<PendingProduct>>(`/products?${params}`);
    return response.data;
  },
  approveProduct: async (productId: string, notes?: string): Promise<void> => {
    await adminApi.put(`/products/${productId}`, { action: 'approve', notes });
  },
  rejectProduct: async (productId: string, notes?: string): Promise<void> => {
    await adminApi.put(`/products/${productId}`, { action: 'reject', notes });
  },

  // Suppliers
  getPendingSuppliers: async (
    status?: string,
    page = 1,
    pageSize = 20
  ): Promise<PagedResponse<PendingSupplier>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    const response = await adminApi.get<PagedResponse<PendingSupplier>>(`/suppliers?${params}`);
    return response.data;
  },
  approveSupplier: async (supplierId: number, reason?: string): Promise<void> => {
    await adminApi.put(`/suppliers/${supplierId}`, { action: 'approve', reason });
  },
  rejectSupplier: async (supplierId: number, reason?: string): Promise<void> => {
    await adminApi.put(`/suppliers/${supplierId}`, { action: 'reject', reason });
  },

  // Stats
  getStats: async (): Promise<ApprovalStats> => {
    const response = await adminApi.get<ApprovalStats>('/stats');
    return response.data;
  },
};

// =====================================================
// SUPPLIER INBOUND SESSION TYPES
// =====================================================

export interface SupplierInboundSession {
  sessionId: string;
  sessionCode: string;
  warehouseId?: string;
  warehouseName?: string;
  warehouseWard?: string;
  warehouseDistrict?: string;
  warehouseCity?: string;
  warehouseAddress?: string;
  sessionStatus: string;
  expectedEndDate?: string;
  createdAt: string;
  registrationId: string;
  registrationStatus: string;
  registrationNote?: string;
  estimatedDeliveryDate?: string;
  registeredAt?: string;
}

export interface SupplierRegisterInboundRequest {
  note?: string;
  estimatedDeliveryDate?: string;
}

// =====================================================
// SUPPLIER INBOUND SESSION API
// =====================================================

export const inboundSessionsApi = {
  getSessions: async (): Promise<SupplierInboundSession[]> => {
    const response = await supplierApi.get<SupplierInboundSession[]>('/inbound-sessions');
    return response.data;
  },
  registerForSession: async (
    sessionId: string,
    request: SupplierRegisterInboundRequest
  ): Promise<SupplierInboundSession> => {
    const response = await supplierApi.post<SupplierInboundSession>(
      `/inbound-sessions/${sessionId}/register`,
      request
    );
    return response.data;
  },
  declineSession: async (sessionId: string): Promise<void> => {
    await supplierApi.post(`/inbound-sessions/${sessionId}/decline`);
  },
  createShipmentFromSession: async (
    sessionId: string,
    request: Omit<CreateShipmentRequest, 'inboundSessionId'>
  ): Promise<SupplierShipment> => {
    const response = await supplierApi.post<SupplierShipment>('/shipments', {
      ...request,
      inboundSessionId: sessionId,
    });
    return response.data;
  },
};

// =====================================================
// NEAR-EXPIRY PRODUCTS API
// =====================================================

export interface NearExpiryProduct {
  id: string;
  name: string;
  stockQuantity: number;
  expiryDate: string;
  daysUntilExpiry: number;
  imageUrl?: string;
  basePrice: number;
}

export const nearExpiryApi = {
  getProducts: async (days = 45): Promise<NearExpiryProduct[]> => {
    const response = await supplierApi.get<NearExpiryProduct[]>('/products/near-expiry', { params: { days } });
    return response.data;
  },
};

// =====================================================
// SLA METRICS API
// =====================================================

export interface SupplierSlaMetrics {
  slaComplianceRate: number;
  rating: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  orderSuccessRate: number;
  lateDeliveryCount: number;
  lateConfirmationCount: number;
  qualityScore: number;
  returnRate: number;
  slaCompliant: boolean;
  ratingOk: boolean;
}

export const slaApi = {
  getMetrics: async (): Promise<SupplierSlaMetrics> => {
    const response = await supplierApi.get<SupplierSlaMetrics>('/sla');
    return response.data;
  },
};

// =====================================================
// DELIVERY BATCHES API
// =====================================================

export interface BatchOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerAddress: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface DeliveryBatch {
  district: string;
  orderCount: number;
  totalAmount: number;
  orders: BatchOrder[];
}

export const deliveryBatchesApi = {
  getBatches: async (): Promise<DeliveryBatch[]> => {
    const response = await supplierApi.get<DeliveryBatch[]>('/delivery-batches');
    return response.data;
  },
};

export default {
  profile: profileApi,
  products: productsApi,
  orders: ordersApi,
  stats: statsApi,
  revenue: revenueApi,
  reviews: reviewsApi,
  shipments: shipmentsApi,
  registration: registrationApi,
  warehouses: warehousesApi,
  inboundSessions: inboundSessionsApi,
  nearExpiry: nearExpiryApi,
  sla: slaApi,
  deliveryBatches: deliveryBatchesApi,
};

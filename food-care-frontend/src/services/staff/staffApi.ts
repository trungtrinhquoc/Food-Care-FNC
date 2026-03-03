import axios from 'axios';
import type {
  PagedResponse,
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  StaffMember,
  CreateStaffMemberRequest,
  UpdateStaffMemberRequest,
  SupplierShipment,
  ShipmentItem,
  ShipmentDocument,
  ShipmentStatusHistory,
  ShipmentStats,
  Receipt,
  CreateReceiptRequest,
  InspectReceiptItemRequest,
  WarehouseInventory,
  StockMovement,
  AdjustInventoryRequest,
  TransferInventoryRequest,
  DiscrepancyReport,
  CreateDiscrepancyRequest,
  ReturnShipment,
  CreateReturnRequest,
  StaffDashboardStats,
  InboundSession,
  CreateInboundSessionRequest,
  AddInboundItemRequest,
  AddInboundItemsBatchRequest,
  UpdateInboundDetailRequest,
  CompleteInboundSessionRequest,
  AreaMatchedProduct,
} from '../../types/staff';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5022/api';

const staffApi = axios.create({
  baseURL: `${API_URL}/staff`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
staffApi.interceptors.request.use(
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
staffApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Staff API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================================================
// STAFF MEMBER API
// =====================================================

export const staffMemberApi = {
  // Get current staff member profile
  getMe: async (): Promise<StaffMember> => {
    const response = await staffApi.get<StaffMember>('/me');
    return response.data;
  },

  // Get all staff members
  getAll: async (
    page = 1,
    pageSize = 20,
    warehouseId?: string,
    isActive?: boolean
  ): Promise<PagedResponse<StaffMember>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (warehouseId) params.append('warehouseId', warehouseId);
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    
    const response = await staffApi.get<PagedResponse<StaffMember>>(`/members?${params}`);
    return response.data;
  },

  // Get staff member by ID
  getById: async (id: string): Promise<StaffMember> => {
    const response = await staffApi.get<StaffMember>(`/members/${id}`);
    return response.data;
  },

  // Create staff member (Admin only)
  create: async (request: CreateStaffMemberRequest): Promise<StaffMember> => {
    const response = await staffApi.post<StaffMember>('/members', request);
    return response.data;
  },

  // Update staff member
  update: async (id: string, request: UpdateStaffMemberRequest): Promise<StaffMember> => {
    const response = await staffApi.put<StaffMember>(`/members/${id}`, request);
    return response.data;
  },

  // Delete staff member
  delete: async (id: string): Promise<void> => {
    await staffApi.delete(`/members/${id}`);
  },

  // Assign staff to warehouse
  assignToWarehouse: async (staffId: string, warehouseId: string): Promise<void> => {
    await staffApi.post(`/members/${staffId}/assign-warehouse/${warehouseId}`);
  },
};

// =====================================================
// WAREHOUSE API
// =====================================================

export const warehouseApi = {
  // Get all warehouses
  getAll: async (
    page = 1,
    pageSize = 20,
    isActive?: boolean
  ): Promise<PagedResponse<Warehouse>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    
    const response = await staffApi.get<PagedResponse<Warehouse>>(`/warehouses?${params}`);
    return response.data;
  },

  // Get warehouse by ID
  getById: async (id: string): Promise<Warehouse> => {
    const response = await staffApi.get<Warehouse>(`/warehouses/${id}`);
    return response.data;
  },

  // Create warehouse
  create: async (request: CreateWarehouseRequest): Promise<Warehouse> => {
    const response = await staffApi.post<Warehouse>('/warehouses', request);
    return response.data;
  },

  // Update warehouse
  update: async (id: string, request: UpdateWarehouseRequest): Promise<Warehouse> => {
    const response = await staffApi.put<Warehouse>(`/warehouses/${id}`, request);
    return response.data;
  },

  // Delete warehouse
  delete: async (id: string): Promise<void> => {
    await staffApi.delete(`/warehouses/${id}`);
  },
};

// =====================================================
// SHIPMENT API (for staff viewing supplier shipments)
// =====================================================

export const shipmentApi = {
  // Get all shipments
  getAll: async (
    page = 1,
    pageSize = 20,
    supplierId?: number,
    warehouseId?: string,
    status?: string
  ): Promise<PagedResponse<SupplierShipment>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (supplierId) params.append('supplierId', supplierId.toString());
    if (warehouseId) params.append('warehouseId', warehouseId);
    if (status) params.append('status', status);
    
    const response = await staffApi.get<PagedResponse<SupplierShipment>>(`/shipments?${params}`);
    return response.data;
  },

  // Get shipment by ID
  getById: async (id: string): Promise<SupplierShipment> => {
    const response = await staffApi.get<SupplierShipment>(`/shipments/${id}`);
    return response.data;
  },

  // Mark shipment as arrived
  markArrived: async (id: string): Promise<SupplierShipment> => {
    const response = await staffApi.post<SupplierShipment>(`/shipments/${id}/mark-arrived`);
    return response.data;
  },

  // Confirm arrival
  confirmArrival: async (id: string): Promise<SupplierShipment> => {
    const response = await staffApi.post<SupplierShipment>(`/shipments/${id}/confirm-arrival`);
    return response.data;
  },

  // Get shipment items
  getItems: async (id: string): Promise<ShipmentItem[]> => {
    const response = await staffApi.get<ShipmentItem[]>(`/shipments/${id}/items`);
    return response.data;
  },

  // Get shipment documents
  getDocuments: async (id: string): Promise<ShipmentDocument[]> => {
    const response = await staffApi.get<ShipmentDocument[]>(`/shipments/${id}/documents`);
    return response.data;
  },

  // Get shipment status history
  getHistory: async (id: string): Promise<ShipmentStatusHistory[]> => {
    const response = await staffApi.get<ShipmentStatusHistory[]>(`/shipments/${id}/history`);
    return response.data;
  },

  // Get shipment stats
  getStats: async (warehouseId?: string): Promise<ShipmentStats> => {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
    const response = await staffApi.get<ShipmentStats>(`/shipments/stats${params}`);
    return response.data;
  },
};

// =====================================================
// RECEIPT API
// =====================================================

export const receiptApi = {
  // Get all receipts
  getAll: async (
    page = 1,
    pageSize = 20,
    warehouseId?: string,
    status?: string
  ): Promise<PagedResponse<Receipt>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (warehouseId) params.append('warehouseId', warehouseId);
    if (status) params.append('status', status);
    
    const response = await staffApi.get<PagedResponse<Receipt>>(`/receipts?${params}`);
    return response.data;
  },

  // Get receipt by ID
  getById: async (id: string): Promise<Receipt> => {
    const response = await staffApi.get<Receipt>(`/receipts/${id}`);
    return response.data;
  },

  // Get receipt by shipment ID
  getByShipment: async (shipmentId: string): Promise<Receipt> => {
    const response = await staffApi.get<Receipt>(`/receipts/by-shipment/${shipmentId}`);
    return response.data;
  },

  // Create receipt from shipment
  create: async (request: CreateReceiptRequest): Promise<Receipt> => {
    const response = await staffApi.post<Receipt>('/receipts', request);
    return response.data;
  },

  // Start inspection
  startInspection: async (id: string): Promise<Receipt> => {
    const response = await staffApi.post<Receipt>(`/receipts/${id}/start-inspection`);
    return response.data;
  },

  // Inspect receipt item
  inspectItem: async (
    receiptId: string,
    itemId: string,
    request: InspectReceiptItemRequest
  ): Promise<Receipt> => {
    const response = await staffApi.post<Receipt>(
      `/receipts/${receiptId}/items/${itemId}/inspect`,
      request
    );
    return response.data;
  },

  // Complete inspection
  completeInspection: async (id: string, notes?: string): Promise<Receipt> => {
    const response = await staffApi.post<Receipt>(`/receipts/${id}/complete-inspection`, { notes });
    return response.data;
  },

  // Store goods (after inspection)
  storeGoods: async (id: string): Promise<Receipt> => {
    const response = await staffApi.post<Receipt>(`/receipts/${id}/store`);
    return response.data;
  },
};

// =====================================================
// INVENTORY API
// =====================================================

export const inventoryApi = {
  // Get inventory with filters
  getAll: async (
    page = 1,
    pageSize = 20,
    warehouseId?: string,
    productId?: string,
    inventoryType?: string,
    lowStock?: boolean,
    nearExpiry?: boolean
  ): Promise<PagedResponse<WarehouseInventory>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (warehouseId) params.append('warehouseId', warehouseId);
    if (productId) params.append('productId', productId);
    if (inventoryType) params.append('inventoryType', inventoryType);
    if (lowStock !== undefined) params.append('lowStock', lowStock.toString());
    if (nearExpiry !== undefined) params.append('nearExpiry', nearExpiry.toString());
    
    const response = await staffApi.get<PagedResponse<WarehouseInventory>>(`/inventory?${params}`);
    return response.data;
  },

  // Get inventory by ID
  getById: async (id: string): Promise<WarehouseInventory> => {
    const response = await staffApi.get<WarehouseInventory>(`/inventory/${id}`);
    return response.data;
  },

  // Get inventory by product (across all warehouses)
  getByProduct: async (productId: string): Promise<WarehouseInventory[]> => {
    const response = await staffApi.get<WarehouseInventory[]>(`/inventory/product/${productId}`);
    return response.data;
  },

  // Get available quantity for a product
  getAvailableQuantity: async (
    productId: string,
    warehouseId?: string
  ): Promise<{ productId: string; warehouseId?: string; availableQuantity: number }> => {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
    const response = await staffApi.get(`/inventory/product/${productId}/available${params}`);
    return response.data;
  },

  // Get expiring inventory
  getExpiring: async (days = 30, warehouseId?: string): Promise<WarehouseInventory[]> => {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    if (warehouseId) params.append('warehouseId', warehouseId);
    
    const response = await staffApi.get<WarehouseInventory[]>(`/inventory/expiring?${params}`);
    return response.data;
  },

  // Get low stock inventory
  getLowStock: async (warehouseId?: string): Promise<WarehouseInventory[]> => {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
    const response = await staffApi.get<WarehouseInventory[]>(`/inventory/low-stock${params}`);
    return response.data;
  },

  // Adjust inventory
  adjust: async (id: string, request: AdjustInventoryRequest): Promise<StockMovement> => {
    const response = await staffApi.post<StockMovement>(`/inventory/${id}/adjust`, request);
    return response.data;
  },

  // Transfer inventory to another warehouse
  transfer: async (id: string, request: TransferInventoryRequest): Promise<StockMovement> => {
    const response = await staffApi.post<StockMovement>(`/inventory/${id}/transfer`, request);
    return response.data;
  },

  // Reserve inventory
  reserve: async (
    id: string,
    quantity: number,
    orderId?: string
  ): Promise<{ reservationId: string; quantity: number }> => {
    const response = await staffApi.post(`/inventory/${id}/reserve`, { quantity, orderId });
    return response.data;
  },

  // Release reservation
  releaseReservation: async (reservationId: string): Promise<void> => {
    await staffApi.post(`/inventory/reservations/${reservationId}/release`);
  },

  // Get stock movements for inventory
  getMovements: async (
    inventoryId?: string,
    page = 1,
    pageSize = 20
  ): Promise<PagedResponse<StockMovement>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (inventoryId) params.append('inventoryId', inventoryId);
    
    const response = await staffApi.get<PagedResponse<StockMovement>>(`/inventory/movements?${params}`);
    return response.data;
  },
};

// =====================================================
// DISCREPANCY API
// =====================================================

export const discrepancyApi = {
  // Get all discrepancy reports
  getAll: async (
    page = 1,
    pageSize = 20,
    status?: string,
    supplierId?: number
  ): Promise<PagedResponse<DiscrepancyReport>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (status) params.append('status', status);
    if (supplierId) params.append('supplierId', supplierId.toString());
    
    const response = await staffApi.get<PagedResponse<DiscrepancyReport>>(`/discrepancies?${params}`);
    return response.data;
  },

  // Get discrepancy report by ID
  getById: async (id: string): Promise<DiscrepancyReport> => {
    const response = await staffApi.get<DiscrepancyReport>(`/discrepancies/${id}`);
    return response.data;
  },

  // Create discrepancy report
  create: async (request: CreateDiscrepancyRequest): Promise<DiscrepancyReport> => {
    const response = await staffApi.post<DiscrepancyReport>('/discrepancies', request);
    return response.data;
  },

  // Notify supplier
  notifySupplier: async (id: string): Promise<DiscrepancyReport> => {
    const response = await staffApi.post<DiscrepancyReport>(`/discrepancies/${id}/notify-supplier`);
    return response.data;
  },

  // Resolve discrepancy
  resolve: async (
    id: string,
    resolutionType: string,
    resolutionNotes: string
  ): Promise<DiscrepancyReport> => {
    const response = await staffApi.post<DiscrepancyReport>(`/discrepancies/${id}/resolve`, {
      resolutionType,
      resolutionNotes,
    });
    return response.data;
  },
};

// =====================================================
// RETURN API
// =====================================================

export const returnApi = {
  // Get all returns
  getAll: async (
    page = 1,
    pageSize = 20,
    status?: string,
    supplierId?: number
  ): Promise<PagedResponse<ReturnShipment>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (status) params.append('status', status);
    if (supplierId) params.append('supplierId', supplierId.toString());
    
    const response = await staffApi.get<PagedResponse<ReturnShipment>>(`/returns?${params}`);
    return response.data;
  },

  // Get return by ID
  getById: async (id: string): Promise<ReturnShipment> => {
    const response = await staffApi.get<ReturnShipment>(`/returns/${id}`);
    return response.data;
  },

  // Create return
  create: async (request: CreateReturnRequest): Promise<ReturnShipment> => {
    const response = await staffApi.post<ReturnShipment>('/returns', request);
    return response.data;
  },

  // Approve return
  approve: async (id: string): Promise<ReturnShipment> => {
    const response = await staffApi.post<ReturnShipment>(`/returns/${id}/approve`);
    return response.data;
  },

  // Ship return
  ship: async (id: string, trackingNumber: string, carrier?: string): Promise<ReturnShipment> => {
    const response = await staffApi.post<ReturnShipment>(`/returns/${id}/ship`, {
      trackingNumber,
      carrier,
    });
    return response.data;
  },

  // Mark as received by supplier
  markReceived: async (id: string): Promise<ReturnShipment> => {
    const response = await staffApi.post<ReturnShipment>(`/returns/${id}/received`);
    return response.data;
  },
};

// =====================================================
// DASHBOARD STATS API
// =====================================================

export const staffDashboardApi = {
  getStats: async (warehouseId?: string): Promise<StaffDashboardStats> => {
    // Since there's no specific stats endpoint, we'll aggregate from other endpoints
    try {
      const [
        warehouses,
        receipts,
        lowStock,
        expiring,
        discrepancies,
        returns
      ] = await Promise.all([
        warehouseApi.getAll(1, 100),
        receiptApi.getAll(1, 100, warehouseId, 'Pending'),
        inventoryApi.getLowStock(warehouseId),
        inventoryApi.getExpiring(30, warehouseId),
        discrepancyApi.getAll(1, 100, 'open'),
        returnApi.getAll(1, 100, 'pending'),
      ]);

      return {
        totalWarehouses: warehouses.totalItems,
        activeWarehouses: warehouses.items.filter(w => w.isActive).length,
        pendingShipments: 0, // Would need shipments API
        shipmentsToday: 0,
        pendingReceipts: receipts.totalItems,
        receiptsToday: receipts.items.filter(r => 
          new Date(r.createdAt).toDateString() === new Date().toDateString()
        ).length,
        lowStockItems: lowStock.length,
        expiringItems: expiring.length,
        openDiscrepancies: discrepancies.totalItems,
        pendingReturns: returns.totalItems,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalWarehouses: 0,
        activeWarehouses: 0,
        pendingShipments: 0,
        shipmentsToday: 0,
        pendingReceipts: 0,
        receiptsToday: 0,
        lowStockItems: 0,
        expiringItems: 0,
        openDiscrepancies: 0,
        pendingReturns: 0,
      };
    }
  },
};

// =====================================================
// INBOUND SESSION API (Phiên nhập kho)
// =====================================================

export const inboundSessionApi = {
  // Get all sessions
  getAll: async (
    page = 1,
    pageSize = 20,
    warehouseId?: string,
    status?: string
  ): Promise<PagedResponse<InboundSession>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (warehouseId) params.append('warehouseId', warehouseId);
    if (status) params.append('status', status);

    const response = await staffApi.get<PagedResponse<InboundSession>>(
      `/inbound-sessions?${params}`
    );
    return response.data;
  },

  // Get session by ID
  getById: async (id: string): Promise<InboundSession> => {
    const response = await staffApi.get<InboundSession>(`/inbound-sessions/${id}`);
    return response.data;
  },

  // Create new session
  create: async (request: CreateInboundSessionRequest): Promise<InboundSession> => {
    const response = await staffApi.post<InboundSession>('/inbound-sessions', request);
    return response.data;
  },

  // Add single item (auto-groups by supplier)
  addItem: async (sessionId: string, request: AddInboundItemRequest): Promise<InboundSession> => {
    const response = await staffApi.post<InboundSession>(
      `/inbound-sessions/${sessionId}/items`,
      request
    );
    return response.data;
  },

  // Add items batch
  addItemsBatch: async (
    sessionId: string,
    request: AddInboundItemsBatchRequest
  ): Promise<InboundSession> => {
    const response = await staffApi.post<InboundSession>(
      `/inbound-sessions/${sessionId}/items/batch`,
      request
    );
    return response.data;
  },

  // Update detail line
  updateDetail: async (
    sessionId: string,
    detailId: string,
    request: UpdateInboundDetailRequest
  ): Promise<InboundSession> => {
    const response = await staffApi.put<InboundSession>(
      `/inbound-sessions/${sessionId}/details/${detailId}`,
      request
    );
    return response.data;
  },

  // Remove detail line
  removeDetail: async (sessionId: string, detailId: string): Promise<InboundSession> => {
    const response = await staffApi.delete<InboundSession>(
      `/inbound-sessions/${sessionId}/details/${detailId}`
    );
    return response.data;
  },

  // Start processing session (Draft → Processing)
  startProcessing: async (sessionId: string): Promise<InboundSession> => {
    const response = await staffApi.post<InboundSession>(
      `/inbound-sessions/${sessionId}/start-processing`
    );
    return response.data;
  },

  // Complete session
  complete: async (
    sessionId: string,
    request: CompleteInboundSessionRequest
  ): Promise<InboundSession> => {
    const response = await staffApi.post<InboundSession>(
      `/inbound-sessions/${sessionId}/complete`,
      request
    );
    return response.data;
  },

  // Cancel session
  cancel: async (sessionId: string): Promise<InboundSession> => {
    const response = await staffApi.post<InboundSession>(
      `/inbound-sessions/${sessionId}/cancel`
    );
    return response.data;
  },

  // Get area-matched products for inbound session
  getAreaProducts: async (warehouseId: string): Promise<AreaMatchedProduct[]> => {
    const response = await staffApi.get<AreaMatchedProduct[]>(
      `/inbound-sessions/area-products`,
      { params: { warehouseId } }
    );
    return response.data;
  },
};

export default {
  staffMember: staffMemberApi,
  warehouse: warehouseApi,
  shipment: shipmentApi,
  receipt: receiptApi,
  inventory: inventoryApi,
  discrepancy: discrepancyApi,
  return: returnApi,
  dashboard: staffDashboardApi,
  inboundSession: inboundSessionApi,
};

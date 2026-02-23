import type {
  CreateSupplierShipmentRequest,
  UpdateSupplierShipmentStatusRequest,
  SupplierShipmentResponse,
  StaffReceiveShipmentRequest,
  StaffInboundSummary,
  StaffOutboundSummary,
  StaffUpdateOrderShippingRequest,
  StaffPickItemsRequest,
  StaffOutboundOrder,
  UserOrderTracking,
  UserConfirmDeliveryRequest,
  UserRequestReturnRequest,
  StaffShippingDashboard,
} from '@/types/shipping';

const API_BASE = 'http://localhost:5022/api/shipping';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ===== SUPPLIER API FUNCTIONS =====

export const createSupplierShipment = async (
  request: CreateSupplierShipmentRequest
): Promise<SupplierShipmentResponse> => {
  const response = await fetch(`${API_BASE}/supplier/shipments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể tạo lô hàng');
  }

  return response.json();
};

export const getSupplierShipments = async (
  params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<{ items: SupplierShipmentResponse[]; total: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
  if (params?.toDate) searchParams.append('toDate', params.toDate);

  const response = await fetch(`${API_BASE}/supplier/shipments?${searchParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy danh sách lô hàng');
  }

  return response.json();
};

export const getSupplierShipmentById = async (
  shipmentId: string
): Promise<SupplierShipmentResponse> => {
  const response = await fetch(`${API_BASE}/supplier/shipments/${shipmentId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy thông tin lô hàng');
  }

  return response.json();
};

export const updateSupplierShipmentStatus = async (
  shipmentId: string,
  request: UpdateSupplierShipmentStatusRequest
): Promise<SupplierShipmentResponse> => {
  const response = await fetch(`${API_BASE}/supplier/shipments/${shipmentId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể cập nhật trạng thái');
  }

  return response.json();
};

export const cancelSupplierShipment = async (
  shipmentId: string,
  reason: string
): Promise<void> => {
  const response = await fetch(`${API_BASE}/supplier/shipments/${shipmentId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể hủy lô hàng');
  }
};

// ===== STAFF INBOUND API FUNCTIONS =====

export const getStaffInboundSummary = async (): Promise<StaffInboundSummary> => {
  const response = await fetch(`${API_BASE}/staff/inbound/summary`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy tổng quan nhập kho');
  }

  return response.json();
};

export const markShipmentArrived = async (
  shipmentId: string,
  notes?: string
): Promise<SupplierShipmentResponse> => {
  const response = await fetch(`${API_BASE}/staff/inbound/${shipmentId}/arrived`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể đánh dấu lô hàng đã đến');
  }

  return response.json();
};

export const receiveShipment = async (
  request: StaffReceiveShipmentRequest
): Promise<SupplierShipmentResponse> => {
  const response = await fetch(`${API_BASE}/staff/inbound/shipments/receive`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể nhận lô hàng');
  }

  return response.json();
};

export const storeItemsToInventory = async (
  shipmentId: string
): Promise<SupplierShipmentResponse> => {
  const response = await fetch(`${API_BASE}/staff/inbound/${shipmentId}/store`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lưu kho');
  }

  return response.json();
};

// ===== STAFF OUTBOUND API FUNCTIONS =====

export const getStaffOutboundSummary = async (): Promise<StaffOutboundSummary> => {
  const response = await fetch(`${API_BASE}/staff/outbound/summary`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy tổng quan xuất kho');
  }

  return response.json();
};

export const getStaffOutboundOrders = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ items: StaffOutboundOrder[]; total: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params?.status) searchParams.append('status', params.status);

  const response = await fetch(`${API_BASE}/staff/outbound/orders?${searchParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy danh sách đơn hàng');
  }

  return response.json();
};

export const getStaffOutboundOrderById = async (
  orderId: string
): Promise<StaffOutboundOrder> => {
  const response = await fetch(`${API_BASE}/staff/outbound/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy thông tin đơn hàng');
  }

  return response.json();
};

export const pickOrderItems = async (
  request: StaffPickItemsRequest
): Promise<StaffOutboundOrder> => {
  const response = await fetch(`${API_BASE}/staff/outbound/pick`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy hàng');
  }

  return response.json();
};

export const updateOrderShippingStatus = async (
  request: StaffUpdateOrderShippingRequest
): Promise<StaffOutboundOrder> => {
  const response = await fetch(`${API_BASE}/staff/outbound/orders/${request.orderId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể cập nhật trạng thái');
  }

  return response.json();
};

// ===== USER API FUNCTIONS =====

export const getUserOrders = async (
  params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }
): Promise<{ items: UserOrderTracking[]; total: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params?.status) searchParams.append('status', params.status);

  const response = await fetch(`${API_BASE}/user/orders?${searchParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy danh sách đơn hàng');
  }

  return response.json();
};

export const getUserOrderTracking = async (
  orderId: string
): Promise<UserOrderTracking> => {
  const response = await fetch(`${API_BASE}/user/orders/${orderId}/tracking`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy thông tin theo dõi');
  }

  return response.json();
};

export const confirmDelivery = async (
  request: UserConfirmDeliveryRequest
): Promise<UserOrderTracking> => {
  const response = await fetch(`${API_BASE}/user/orders/${request.orderId}/confirm-delivery`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể xác nhận nhận hàng');
  }

  return response.json();
};

export const requestReturn = async (
  request: UserRequestReturnRequest
): Promise<UserOrderTracking> => {
  const response = await fetch(`${API_BASE}/user/orders/${request.orderId}/request-return`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể yêu cầu trả hàng');
  }

  return response.json();
};

export const cancelUserOrder = async (
  orderId: string,
  reason: string
): Promise<void> => {
  const response = await fetch(`${API_BASE}/user/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể hủy đơn hàng');
  }
};

// ===== STAFF DASHBOARD =====

export const getStaffShippingDashboard = async (): Promise<StaffShippingDashboard> => {
  const response = await fetch(`${API_BASE}/staff/dashboard`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể lấy dữ liệu dashboard');
  }

  return response.json();
};

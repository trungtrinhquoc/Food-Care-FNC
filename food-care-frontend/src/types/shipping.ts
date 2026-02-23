// ===== SHIPPING FLOW TYPES =====
// Luồng vận chuyển: Supplier → Staff (Warehouse) → User

export type DetailedShippingStatus =
  // Supplier → Warehouse flow
  | 'SupplierPreparing'
  | 'SupplierDispatched'
  | 'InTransitToWarehouse'
  | 'ArrivedAtWarehouse'
  | 'WarehouseInspecting'
  | 'WarehouseStored'
  // Warehouse → User flow
  | 'OrderReceived'
  | 'StaffPreparing'
  | 'StaffPacked'
  | 'OutForDelivery'
  | 'InTransitToUser'
  | 'Delivered'
  | 'DeliveryFailed'
  // Return flow
  | 'ReturnRequested'
  | 'ReturnApproved'
  | 'ReturnInTransit'
  | 'ReturnReceived'
  | 'ReturnCompleted'
  | 'Cancelled';

// ===== SHIPPING TIMELINE =====

export interface ShippingTimelineItem {
  id: string;
  timestamp: string;
  status: string;
  statusLabel: string;
  description: string;
  location?: string;
  handler?: string;
  notes?: string;
}

// ===== SUPPLIER SHIPMENT TYPES =====

export interface CreateSupplierShipmentRequest {
  warehouseId: string;
  expectedDeliveryDate: string;
  carrier?: string;
  trackingNumber?: string;
  notes?: string;
  items: SupplierShipmentItemRequest[];
}

export interface SupplierShipmentItemRequest {
  productId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  unitCost?: number;
}

export interface UpdateSupplierShipmentStatusRequest {
  status: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  currentLocation?: string;
}

export interface SupplierShipmentResponse {
  id: string;
  externalReference: string;
  supplierId: number;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  status: string;
  statusLabel: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  trackingNumber?: string;
  carrier?: string;
  totalItems: number;
  totalValue: number;
  createdAt: string;
  updatedAt?: string;
  timeline: ShippingTimelineItem[];
  items: SupplierShipmentItemResponse[];
}

export interface SupplierShipmentItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  quantity: number;
  receivedQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  unitCost: number;
}

// ===== STAFF INBOUND TYPES (Receive from Supplier) =====

export interface StaffReceiveShipmentRequest {
  shipmentId: string;
  notes?: string;
  items: ReceivedItemRequest[];
}

export interface ReceivedItemRequest {
  itemId: string;
  acceptedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  notes?: string;
}

export interface StaffInboundSummary {
  totalPendingShipments: number;
  totalArrivedToday: number;
  totalInspecting: number;
  totalStoredToday: number;
  pendingShipments: SupplierShipmentResponse[];
}

// ===== STAFF OUTBOUND TYPES (Send to User) =====

export interface StaffOutboundOrder {
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  status: string;
  statusLabel: string;
  shippingStatus: string;
  shippingStatusLabel: string;
  totalAmount: number;
  orderDate: string;
  requiredDeliveryDate?: string;
  trackingNumber?: string;
  shippingProvider?: string;
  assignedStaffName?: string;
  assignedWarehouseId?: string;
  assignedWarehouseName?: string;
  items: StaffOutboundItem[];
  timeline: ShippingTimelineItem[];
}

export interface StaffOutboundItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  quantity: number;
  price: number;
  isPicked: boolean;
  pickedFromBatch?: string;
}

export interface StaffUpdateOrderShippingRequest {
  orderId: string;
  status: string;
  trackingNumber?: string;
  shippingProvider?: string;
  notes?: string;
  currentLocation?: string;
}

export interface StaffPickItemsRequest {
  orderId: string;
  items: PickedItemRequest[];
}

export interface PickedItemRequest {
  orderItemId: string;
  inventoryItemId: string;
  quantity: number;
}

export interface StaffOutboundSummary {
  totalPendingOrders: number;
  totalPreparingOrders: number;
  totalPackedOrders: number;
  totalOutForDelivery: number;
  totalDeliveredToday: number;
  pendingOrders: StaffOutboundOrder[];
}

// ===== USER ORDER TRACKING TYPES =====

export interface UserOrderTracking {
  orderId: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  shippingStatus: string;
  shippingStatusLabel: string;
  statusProgress: number;
  totalAmount: number;
  orderDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  trackingNumber?: string;
  shippingProvider?: string;
  currentLocation?: string;
  shippingAddress: string;
  items: UserOrderItem[];
  timeline: ShippingTimelineItem[];
  canCancel: boolean;
  canRequestReturn: boolean;
  canConfirmReceived: boolean;
}

export interface UserOrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
}

export interface UserConfirmDeliveryRequest {
  orderId: string;
  isReceived: boolean;
  rating?: number;
  feedback?: string;
}

export interface UserRequestReturnRequest {
  orderId: string;
  reason: string;
  description?: string;
  itemsToReturn?: string[];
}

// ===== STAFF DASHBOARD TYPES =====

export interface StaffShippingDashboard {
  inbound: StaffInboundSummary;
  outbound: StaffOutboundSummary;
  totalActiveShipments: number;
  alertsCount: number;
  alerts: ShippingAlert[];
}

export interface ShippingAlert {
  type: 'late_delivery' | 'low_stock' | 'damage_report';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
}

// ===== HELPER TYPES =====

export const SHIPMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  Draft: { label: 'Nháp', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  Dispatched: { label: 'Đã gửi', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  InTransit: { label: 'Đang vận chuyển', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  Arrived: { label: 'Đã đến kho', color: 'text-green-600', bgColor: 'bg-green-100' },
  Inspected: { label: 'Đã kiểm tra', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  Stored: { label: 'Đã lưu kho', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  Closed: { label: 'Hoàn tất', color: 'text-gray-600', bgColor: 'bg-gray-200' },
  Cancelled: { label: 'Đã hủy', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const ORDER_SHIPPING_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: { label: 'Chờ xử lý', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: 'Clock' },
  confirmed: { label: 'Đã xác nhận', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: 'CheckCircle' },
  OrderReceived: { label: 'Kho đã nhận', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: 'Inbox' },
  StaffPreparing: { label: 'Đang chuẩn bị', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: 'Package' },
  StaffPacked: { label: 'Đã đóng gói', color: 'text-violet-600', bgColor: 'bg-violet-100', icon: 'Box' },
  OutForDelivery: { label: 'Đang giao', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: 'Truck' },
  shipping: { label: 'Đang giao', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: 'Truck' },
  delivered: { label: 'Đã giao', color: 'text-green-600', bgColor: 'bg-green-100', icon: 'CheckCircle2' },
  Delivered: { label: 'Đã giao', color: 'text-green-600', bgColor: 'bg-green-100', icon: 'CheckCircle2' },
  cancelled: { label: 'Đã hủy', color: 'text-red-600', bgColor: 'bg-red-100', icon: 'XCircle' },
  returned: { label: 'Trả hàng', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: 'RotateCcw' },
};

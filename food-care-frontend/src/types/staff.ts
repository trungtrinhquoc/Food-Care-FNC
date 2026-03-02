// ===== STAFF MODULE TYPES =====

// =====================================================
// PAGINATION & COMMON
// =====================================================

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================================================
// WAREHOUSE TYPES
// =====================================================

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description?: string;
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  region?: string; // North, Central, South
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  description?: string;
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  region?: string;
  isDefault?: boolean;
}

export interface UpdateWarehouseRequest {
  name?: string;
  description?: string;
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

// =====================================================
// STAFF MEMBER TYPES
// =====================================================

export interface StaffMember {
  id: string;
  userId: string;
  employeeCode: string;
  department?: string;
  position?: string;
  staffPositionEnum?: string;
  staffPositionLabel?: string;
  canAccessSystem?: boolean;
  warehouseId?: string;
  warehouseName?: string;
  canApproveReceipts: boolean;
  canAdjustInventory: boolean;
  canOverrideFifo: boolean;
  canCreateInboundSession: boolean;
  hireDate?: string;
  isActive: boolean;
  createdAt: string;
  userFullName?: string;
  userEmail?: string;
  userPhone?: string;
  userAvatarUrl?: string;
}

export interface CreateStaffMemberRequest {
  userId: string;
  employeeCode: string;
  department?: string;
  position?: string;
  staffPositionEnum?: string;
  warehouseId?: string;
  canApproveReceipts?: boolean;
  canAdjustInventory?: boolean;
  canOverrideFifo?: boolean;
  canCreateInboundSession?: boolean;
  hireDate?: string;
}

export interface UpdateStaffMemberRequest {
  department?: string;
  position?: string;
  staffPositionEnum?: string;
  warehouseId?: string;
  canApproveReceipts?: boolean;
  canAdjustInventory?: boolean;
  canOverrideFifo?: boolean;
  canCreateInboundSession?: boolean;
  isActive?: boolean;
}

// =====================================================
// SHIPMENT TYPES
// =====================================================

export type ShipmentStatus = 
  | 'Draft' 
  | 'Dispatched' 
  | 'InTransit' 
  | 'Arrived' 
  | 'Inspected' 
  | 'Stored' 
  | 'Closed' 
  | 'Cancelled';

export interface SupplierShipment {
  id: string;
  externalReference: string;
  shipmentNumber?: string; // Alias for externalReference
  supplierId: number;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  status: ShipmentStatus;
  expectedDeliveryDate: string;
  estimatedArrival?: string; // Alias
  actualDispatchDate?: string;
  dispatchedAt?: string; // Alias
  actualArrivalDate?: string;
  actualArrival?: string; // Alias
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  totalValue?: number;
  totalItems: number;
  totalQuantity: number;
  createdAt: string;
  items: ShipmentItem[];
  documents: ShipmentDocument[];
}

export interface ShipmentItem {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  expectedQuantity: number;
  quantity?: number; // Alias for expectedQuantity
  uom: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  unitCost?: number;
  unitPrice?: number; // Alias for unitCost
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

export interface ShipmentStatusHistory {
  id: string;
  previousStatus?: string;
  newStatus: string;
  previousEta?: string;
  newEta?: string;
  notes?: string;
  changedByName?: string;
  createdAt: string;
}

export interface CreateShipmentRequest {
  externalReference: string;
  warehouseId: string;
  expectedDeliveryDate: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  items: CreateShipmentItemRequest[];
  documents?: string[];
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

export interface UpdateShipmentStatusRequest {
  status: string;
  newEta?: string;
  notes?: string;
}

// =====================================================
// RECEIPT TYPES
// =====================================================

export type ReceiptStatus = 
  | 'Pending' 
  | 'Inspecting' 
  | 'Accepted' 
  | 'Partial' 
  | 'Rejected' 
  | 'Quarantine' 
  | 'Completed';

export interface Receipt {
  id: string;
  receiptNumber: string;
  shipmentId: string;
  shipmentReference?: string;
  warehouseId: string;
  warehouseName?: string;
  receivedBy: string;
  receivedByName?: string;
  inspectedBy?: string;
  inspectedByName?: string;
  status: ReceiptStatus;
  arrivalDate: string;
  inspectionStart?: string;
  inspectionEnd?: string;
  storeDate?: string;
  totalExpected: number;
  totalAccepted: number;
  totalDamaged: number;
  totalMissing: number;
  notes?: string;
  inspectionNotes?: string;
  createdAt: string;
  items: ReceiptItem[];
}

export interface ReceiptItem {
  id: string;
  shipmentItemId: string;
  productId: string;
  productName?: string;
  productSku?: string;
  expectedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  quarantineQuantity: number;
  batchNumber?: string;
  expiryDate?: string;
  status: ReceiptStatus;
  qcRequired: boolean;
  qcPassed?: boolean;
  qcSampleSize?: number;
  qcPassedCount?: number;
  qcNotes?: string;
  inspectionNotes?: string;
}

export interface CreateReceiptRequest {
  shipmentId: string;
  notes?: string;
}

export interface InspectReceiptItemRequest {
  receivedQuantity: number;
  acceptedQuantity: number;
  damagedQuantity?: number;
  quarantineQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  qcPassed?: boolean;
  qcNotes?: string;
  inspectionNotes?: string;
}

// =====================================================
// INVENTORY TYPES
// =====================================================

export type InventoryType = 
  | 'Available' 
  | 'Reserved' 
  | 'Quarantine' 
  | 'Damaged' 
  | 'Expired';

export interface WarehouseInventory {
  id: string;
  warehouseId: string;
  warehouseName?: string;
  productId: string;
  productName?: string;
  productSku?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  inventoryType: InventoryType;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitCost?: number;
  locationCode?: string;
  location?: string;
  supplierId?: number;
  supplierName?: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  minQuantity?: number; // Alias for minStockLevel
  maxQuantity?: number; // Alias for maxStockLevel
  version: number;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
  createdAt: string;
  updatedAt?: string;
}

export type MovementType = 
  | 'Inbound' 
  | 'Outbound' 
  | 'Transfer' 
  | 'Adjustment' 
  | 'ReturnIn' 
  | 'ReturnOut' 
  | 'QuarantineIn' 
  | 'QuarantineOut' 
  | 'Expired' 
  | 'Damaged' 
  | 'Reserved' 
  | 'Unreserved';

export interface StockMovement {
  id: string;
  inventoryId: string;
  warehouseId: string;
  warehouseName?: string;
  productId: string;
  productName?: string;
  movementType: MovementType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  batchNumber?: string;
  referenceType?: string;
  referenceId?: string;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  notes?: string;
  performedByName?: string;
  approvedByName?: string;
  isFifoOverride: boolean;
  overrideReason?: string;
  createdAt: string;
}

export interface AdjustInventoryRequest {
  quantity: number;
  reason: string;
  notes?: string;
  requiresApproval?: boolean;
}

export interface TransferInventoryRequest {
  targetWarehouseId: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

// =====================================================
// DISCREPANCY TYPES
// =====================================================

export type DiscrepancyType = 
  | 'QuantityShort' 
  | 'QuantityOver' 
  | 'Damaged' 
  | 'QualityFailed' 
  | 'WrongItem' 
  | 'WrongBatch' 
  | 'Expired' 
  | 'MissingDocuments' 
  | 'Other';

export interface DiscrepancyReport {
  id: string;
  reportNumber: string;
  shipmentId: string;
  shipmentReference?: string;
  receiptId?: string;
  supplierId: number;
  supplierName?: string;
  discrepancyType: DiscrepancyType;
  status: string;
  description: string;
  affectedQuantity: number;
  affectedValue?: number;
  supplierNotifiedAt?: string;
  supplierResponse?: string;
  supplierResponseAt?: string;
  resolutionType?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedByName?: string;
  reportedByName?: string;
  createdAt: string;
  items: DiscrepancyItem[];
}

export interface DiscrepancyItem {
  id: string;
  productId: string;
  productName?: string;
  shipmentItemId?: string;
  discrepancyType: DiscrepancyType;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancyQuantity: number;
  batchNumber?: string;
  description?: string;
  evidenceUrls?: string[];
}

export interface CreateDiscrepancyRequest {
  shipmentId: string;
  receiptId?: string;
  discrepancyType: string;
  description: string;
  items: CreateDiscrepancyItemRequest[];
}

export interface CreateDiscrepancyItemRequest {
  productId: string;
  shipmentItemId?: string;
  discrepancyType: string;
  expectedQuantity: number;
  actualQuantity: number;
  batchNumber?: string;
  description?: string;
  evidenceUrls?: string[];
}

// =====================================================
// RETURN TYPES
// =====================================================

export interface ReturnShipment {
  id: string;
  returnNumber: string;
  originalShipmentId: string;
  originalShipmentReference?: string;
  discrepancyReportId?: string;
  supplierId: number;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  status: string;
  returnReason: string;
  description?: string;
  totalItems: number;
  totalQuantity: number;
  totalValue?: number;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  supplierReceivedAt?: string;
  creditStatus?: string;
  creditAmount?: number;
  creditIssuedAt?: string;
  creatorName?: string;
  approverName?: string;
  approvedAt?: string;
  createdAt: string;
  items: ReturnItem[];
}

export interface ReturnItem {
  id: string;
  productId: string;
  productName?: string;
  shipmentItemId?: string;
  quantity: number;
  batchNumber?: string;
  returnReason: string;
  description?: string;
  unitCost?: number;
  lineTotal?: number;
}

export interface CreateReturnRequest {
  originalShipmentId: string;
  discrepancyReportId?: string;
  returnReason: string;
  description?: string;
  items: CreateReturnItemRequest[];
}

export interface CreateReturnItemRequest {
  productId: string;
  shipmentItemId?: string;
  quantity: number;
  batchNumber?: string;
  returnReason: string;
  description?: string;
}

// =====================================================
// DASHBOARD STATS
// =====================================================

export interface StaffDashboardStats {
  totalWarehouses: number;
  activeWarehouses: number;
  pendingShipments: number;
  shipmentsToday: number;
  pendingReceipts: number;
  receiptsToday: number;
  lowStockItems: number;
  expiringItems: number;
  openDiscrepancies: number;
  pendingReturns: number;
}

// =====================================================
// SHIPMENT STATS
// =====================================================

export interface ShipmentStats {
  totalShipments: number;
  draftCount: number;
  dispatchedCount: number;
  inTransitCount: number;
  arrivedCount: number;
  inspectedCount: number;
  storedCount: number;
  closedCount: number;
  cancelledCount: number;
}

// =====================================================
// INBOUND SESSION TYPES (Phiên nhập kho)
// =====================================================

export type InboundSessionStatus = 'Draft' | 'Processing' | 'Completed' | 'Cancelled';
export type InboundReceiptStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface InboundSession {
  id: string;
  sessionCode: string;
  warehouseId: string;
  warehouseName?: string;
  createdBy: string;
  createdByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  status: InboundSessionStatus;
  note?: string;
  totalSuppliers: number;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  receipts: InboundReceipt[];
}

export interface InboundReceipt {
  id: string;
  receiptCode: string;
  sessionId: string;
  supplierId: number;
  supplierName?: string;
  status: InboundReceiptStatus;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  note?: string;
  confirmedAt?: string;
  createdAt: string;
  details: InboundReceiptDetail[];
}

export interface InboundReceiptDetail {
  id: string;
  receiptId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  unit?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  note?: string;
  createdAt: string;
}

export interface CreateInboundSessionRequest {
  warehouseId: string;
  note?: string;
}

export interface AddInboundItemRequest {
  productId: string;
  supplierId?: number;
  quantity: number;
  unitPrice: number;
  unit?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  note?: string;
}

export interface AddInboundItemsBatchRequest {
  items: AddInboundItemRequest[];
}

export interface UpdateInboundDetailRequest {
  quantity?: number;
  unitPrice?: number;
  unit?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  note?: string;
}

export interface CompleteInboundSessionRequest {
  note?: string;
}

// =============================================
// ADMIN WAREHOUSE SERVICE
// =============================================

import api from '../api';

// ==================== TYPES ====================

// Staff position enum values matching backend
export type StaffPositionEnum =
  | 'WarehouseManager'
  | 'AssistantManager'
  | 'Supervisor'
  | 'InventoryController'
  | 'WarehouseStaff'
  | 'Loader';

export interface StaffPositionInfo {
  value: StaffPositionEnum;
  numericValue: number;
  label: string;
  canAccessSystem: boolean;
  description: string;
}

// Position labels for frontend display
export const STAFF_POSITION_LABELS: Record<StaffPositionEnum, string> = {
  WarehouseManager: 'Trưởng phòng kho',
  AssistantManager: 'Phó quản lý kho',
  Supervisor: 'Tổ trưởng / Giám sát kho',
  InventoryController: 'NV kiểm soát tồn kho',
  WarehouseStaff: 'Nhân viên kho',
  Loader: 'NV bốc xếp',
};

// Which positions can login to the staff system
export const SYSTEM_ACCESS_POSITIONS: StaffPositionEnum[] = [
  'WarehouseManager',
  'AssistantManager',
  'Supervisor',
];

export const canAccessSystem = (pos?: StaffPositionEnum | null): boolean =>
  !!pos && SYSTEM_ACCESS_POSITIONS.includes(pos);

export interface AdminWarehouse {
  id: string;
  code: string;
  name: string;
  description?: string;
  region?: string;
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  staffCount: number;
  totalInventoryItems: number;
}

export interface AdminWarehouseDetail extends AdminWarehouse {
  staffMembers: WarehouseStaff[];
}

export interface WarehouseStaff {
  staffMemberId: string;
  userId: string;
  employeeCode: string;
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  staffPositionEnum?: StaffPositionEnum;
  staffPositionLabel?: string;
  canAccessSystem: boolean;
  canApproveReceipts: boolean;
  canAdjustInventory: boolean;
  hireDate?: string;
  isActive: boolean;
}

export interface WarehouseStaffDetail extends WarehouseStaff {
  avatarUrl?: string;
  canOverrideFifo: boolean;
  createdAt: string;
  currentWarehouseId?: string;
  currentWarehouseName?: string;
}

export interface PagedWarehouseStaff {
  items: WarehouseStaffDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  warehouseName: string;
}

export interface CreateWarehouseStaffDto {
  email: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  staffPositionEnum?: StaffPositionEnum;
  canApproveReceipts?: boolean;
  canAdjustInventory?: boolean;
  canOverrideFifo?: boolean;
}

export interface TransferStaffDto {
  staffMemberId: string;
  targetWarehouseId: string;
}

export interface UpdateWarehouseStaffDto {
  department?: string;
  position?: string;
  staffPositionEnum?: StaffPositionEnum;
  canApproveReceipts?: boolean;
  canAdjustInventory?: boolean;
  canOverrideFifo?: boolean;
  isActive?: boolean;
}

export interface WarehouseDropdownItem {
  id: string;
  code: string;
  name: string;
  region?: string;
}

export interface CreateWarehouseDto {
  code: string;
  name: string;
  description?: string;
  region?: string;
  addressStreet?: string;
  addressWard?: string;
  addressDistrict?: string;
  addressCity?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  isDefault?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  description?: string;
  region?: string;
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

export interface WarehouseStats {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  totalStaffAssigned: number;
  warehousesByRegion: Record<string, number>;
}

export interface PagedWarehouses {
  items: AdminWarehouse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== API FUNCTIONS ====================

export const getWarehouses = async (params?: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
  region?: string;
}): Promise<PagedWarehouses> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.region) searchParams.append('region', params.region);

  const response = await api.get<PagedWarehouses>(`/admin/warehouses?${searchParams}`);
  return response.data;
};

export const getWarehouseById = async (id: string): Promise<AdminWarehouseDetail> => {
  const response = await api.get<AdminWarehouseDetail>(`/admin/warehouses/${id}`);
  return response.data;
};

export const getWarehousesDropdown = async (): Promise<WarehouseDropdownItem[]> => {
  const response = await api.get<WarehouseDropdownItem[]>('/admin/warehouses/dropdown');
  return response.data;
};

export const createWarehouse = async (data: CreateWarehouseDto): Promise<void> => {
  await api.post('/admin/warehouses', data);
};

export const updateWarehouse = async (id: string, data: UpdateWarehouseDto): Promise<void> => {
  await api.put(`/admin/warehouses/${id}`, data);
};

export const toggleWarehouseActive = async (id: string): Promise<void> => {
  await api.patch(`/admin/warehouses/${id}/toggle-active`);
};

export const deleteWarehouse = async (id: string): Promise<void> => {
  await api.delete(`/admin/warehouses/${id}`);
};

export const getWarehouseStats = async (): Promise<WarehouseStats> => {
  const response = await api.get<WarehouseStats>('/admin/warehouses/stats');
  return response.data;
};

// ==================== WAREHOUSE STAFF MANAGEMENT ====================

export const getStaffPositions = async (): Promise<StaffPositionInfo[]> => {
  const response = await api.get<StaffPositionInfo[]>('/admin/warehouses/staff/positions');
  return response.data;
};

export const getWarehouseStaff = async (
  warehouseId: string,
  params?: { page?: number; pageSize?: number; search?: string; isActive?: boolean }
): Promise<PagedWarehouseStaff> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

  const response = await api.get<PagedWarehouseStaff>(
    `/admin/warehouses/${warehouseId}/staff?${searchParams}`
  );
  return response.data;
};

export const getUnassignedStaff = async (search?: string): Promise<WarehouseStaffDetail[]> => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await api.get<WarehouseStaffDetail[]>(`/admin/warehouses/staff/unassigned${params}`);
  return response.data;
};

export const getAllStaffWithWarehouse = async (
  search?: string,
  excludeWarehouseId?: string
): Promise<WarehouseStaffDetail[]> => {
  const searchParams = new URLSearchParams();
  if (search) searchParams.append('search', search);
  if (excludeWarehouseId) searchParams.append('excludeWarehouseId', excludeWarehouseId);

  const response = await api.get<WarehouseStaffDetail[]>(
    `/admin/warehouses/staff/all?${searchParams}`
  );
  return response.data;
};

export const assignStaffToWarehouse = async (
  warehouseId: string,
  staffMemberId: string
): Promise<void> => {
  await api.post(`/admin/warehouses/${warehouseId}/staff/assign`, { staffMemberId });
};

export const transferStaff = async (
  warehouseId: string,
  data: TransferStaffDto
): Promise<void> => {
  await api.post(`/admin/warehouses/${warehouseId}/staff/transfer`, data);
};

export const createWarehouseStaff = async (
  warehouseId: string,
  data: CreateWarehouseStaffDto
): Promise<void> => {
  await api.post(`/admin/warehouses/${warehouseId}/staff/create`, data);
};

export const removeStaffFromWarehouse = async (
  warehouseId: string,
  staffMemberId: string
): Promise<void> => {
  await api.delete(`/admin/warehouses/${warehouseId}/staff/${staffMemberId}`);
};

export const updateWarehouseStaff = async (
  warehouseId: string,
  staffMemberId: string,
  data: UpdateWarehouseStaffDto
): Promise<void> => {
  await api.put(`/admin/warehouses/${warehouseId}/staff/${staffMemberId}`, data);
};

// Export as object for convenience
export const warehouseService = {
  getWarehouses,
  getWarehouseById,
  getWarehousesDropdown,
  createWarehouse,
  updateWarehouse,
  toggleWarehouseActive,
  deleteWarehouse,
  getWarehouseStats,
  // Staff management
  getStaffPositions,
  getWarehouseStaff,
  getUnassignedStaff,
  getAllStaffWithWarehouse,
  assignStaffToWarehouse,
  transferStaff,
  createWarehouseStaff,
  removeStaffFromWarehouse,
  updateWarehouseStaff,
};

export default warehouseService;

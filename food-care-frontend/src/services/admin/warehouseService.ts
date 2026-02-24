// =============================================
// ADMIN WAREHOUSE SERVICE
// =============================================

import api from '../api';

// ==================== TYPES ====================

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
  canApproveReceipts: boolean;
  canAdjustInventory: boolean;
  hireDate?: string;
  isActive: boolean;
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
};

export default warehouseService;

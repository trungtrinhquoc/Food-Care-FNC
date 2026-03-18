// =============================================
// SUPPLIERS SERVICE - Clean Architecture
// =============================================

import api from '../api';
import type { PagedResult, MartSummary } from '../../types/admin';
import type {
  CreateSupplierDto,
  Supplier,
  UpdateSupplierDto,
} from '../../types/admin';

// Backend DTOs
export interface AdminSupplierDto {
  id: number;
  name: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  totalProducts: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminSupplierProductDto {
  id: string;
  name: string;
  basePrice: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface AdminSupplierDetailDto {
  id: number;
  name: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  totalProducts: number;
  isActive: boolean;
  createdAt: string;
  products: AdminSupplierProductDto[];
}

export interface AdminSupplierFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
}

const mapAdminSupplierToUi = (s: AdminSupplierDto): Supplier => {
  return {
    id: String(s.id),
    name: s.name,
    email: s.contactEmail ?? '',
    phone: s.phone ?? '',
    address: s.address ?? '',
    contact: '',
    products: [],
    totalProducts: s.totalProducts,
    status: s.isActive ? 'active' : 'inactive',
  };
};

const buildParams = (filter: AdminSupplierFilter) => {
  const params = new URLSearchParams();
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
  if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
  if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
  if (filter.sortBy) params.append('sortBy', filter.sortBy);
  if (filter.sortDescending !== undefined) params.append('sortDescending', filter.sortDescending.toString());
  return params;
};

export const getSuppliers = async (
  filter: AdminSupplierFilter = {}
): Promise<PagedResult<Supplier>> => {
  const params = buildParams(filter);
  const response = await api.get<PagedResult<AdminSupplierDto>>(`/admin/suppliers?${params}`);

  return {
    items: response.data.items.map(mapAdminSupplierToUi),
    totalItems: response.data.totalItems,
    page: response.data.page,
    pageSize: response.data.pageSize,
    totalPages: response.data.totalPages,
  };
};

export const getSupplierDetail = async (id: string): Promise<AdminSupplierDetailDto> => {
  const response = await api.get<AdminSupplierDetailDto>(`/admin/suppliers/${id}`);
  return response.data;
};

export const createSupplier = async (dto: CreateSupplierDto): Promise<AdminSupplierDetailDto> => {
  const payload = {
    name: dto.name,
    contactEmail: dto.email,
    phone: dto.phone,
    address: dto.address,
    isActive: true,
  };

  const response = await api.post<AdminSupplierDetailDto>('/admin/suppliers', payload);
  return response.data;
};

export const updateSupplier = async (
  id: string,
  dto: UpdateSupplierDto
): Promise<AdminSupplierDetailDto> => {
  const payload = {
    name: dto.name ?? '',
    contactEmail: dto.email,
    phone: dto.phone,
    address: dto.address,
    isActive: dto.status ? dto.status === 'active' : undefined,
  };

  const response = await api.put<AdminSupplierDetailDto>(`/admin/suppliers/${id}`, payload);
  return response.data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  await api.delete(`/admin/suppliers/${id}`);
};

export const getMartList = async (): Promise<MartSummary[]> => {
  const response = await api.get<MartSummary[]>('/admin/suppliers/mart-list');
  return response.data;
};

export const suppliersService = {
  getSuppliers,
  getSupplierDetail,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getMartList,
};

export default suppliersService;

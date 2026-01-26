import api from './api';
import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierFilter,
  PagedSupplierResult,
  SupplierProfile,
  SupplierProduct,
  SupplierOrder,
  SupplierStats
} from '../types/supplier';

// Public supplier API
export const suppliersApi = {
  getSuppliers: async (filter: SupplierFilter = {}): Promise<PagedSupplierResult> => {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
    if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortDescending !== undefined) params.append('sortDescending', filter.sortDescending.toString());

    const response = await api.get(`/suppliers?${params}`);
    return response.data;
  },

  getSupplier: async (id: number): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  updateSupplier: async (id: number, data: UpdateSupplierRequest): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  deleteSupplier: async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  }
};

// Supplier role API
export const supplierApi = {
  getProfile: async (): Promise<SupplierProfile> => {
    const response = await api.get('/supplier/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateSupplierRequest): Promise<SupplierProfile> => {
    const response = await api.put('/supplier/profile', data);
    return response.data;
  },

  getProducts: async (): Promise<SupplierProduct[]> => {
    const response = await api.get('/supplier/products');
    return response.data;
  },

  getOrders: async (): Promise<SupplierOrder[]> => {
    const response = await api.get('/supplier/orders');
    return response.data;
  },

  getStats: async (): Promise<SupplierStats> => {
    const response = await api.get('/supplier/stats');
    return response.data;
  }
};

export default suppliersApi;

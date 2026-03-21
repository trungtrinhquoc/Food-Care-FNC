import api from '../api';

export interface AdminBlindBox {
  id: string;
  supplierId: number;
  storeName: string;
  title: string;
  description: string;
  originalValue: number;
  blindBoxPrice: number;
  quantity: number;
  quantitySold: number;
  expiryDate: string;
  contents: string;
  imageUrl: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  daysUntilExpiry: number;
  quantityAvailable: number;
}

export interface BlindBoxListParams {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export const adminBlindBoxService = {
  getList: async (params?: BlindBoxListParams) => {
    const { data } = await api.get('/admin/blind-boxes', { params });
    return data;
  },

  getById: async (id: string): Promise<AdminBlindBox> => {
    const { data } = await api.get(`/admin/blind-boxes/${id}`);
    return data;
  },

  approve: async (id: string, adjustedPrice?: number) => {
    const { data } = await api.patch(`/admin/blind-boxes/${id}/approve`, { adjustedPrice });
    return data;
  },

  reject: async (id: string, reason: string) => {
    const { data } = await api.patch(`/admin/blind-boxes/${id}/reject`, { reason });
    return data;
  },

  archive: async (id: string) => {
    const { data } = await api.patch(`/admin/blind-boxes/${id}/archive`);
    return data;
  },
};

import api from '../api';
import type { Complaint, ComplaintFilter, ResolveComplaintDto, PagedResult } from '../../types/admin';

export const complaintsService = {
  getComplaints: async (filter: ComplaintFilter = {}): Promise<PagedResult<Complaint>> => {
    const response = await api.get('/admin/complaints', { params: filter });
    return response.data;
  },

  getById: async (id: string): Promise<Complaint> => {
    const response = await api.get(`/admin/complaints/${id}`);
    return response.data;
  },

  action: async (id: string, dto: ResolveComplaintDto): Promise<Complaint> => {
    const response = await api.patch(`/admin/complaints/${id}/action`, dto);
    return response.data;
  },

  createComplaint: async (dto: {
    orderNumber: string;
    orderId?: string;
    supplierId?: number;
    type: string;
    description: string;
    imageUrls?: string[];
  }): Promise<Complaint> => {
    const response = await api.post('/complaints', dto);
    return response.data;
  },
};

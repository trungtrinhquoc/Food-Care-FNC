import api from '../api';
import type {
  CommissionPolicy,
  SetCommissionRateRequest,
  OrderCommission,
  CommissionReport,
  PagedResult,
} from '../../types/admin';

export const adminCommissionService = {
  // ── Policy endpoints ──────────────────────────────────────────────────────

  getPolicies: async (): Promise<CommissionPolicy[]> => {
    const { data } = await api.get('/admin/commission/policies');
    return data;
  },

  getSupplierPolicy: async (supplierId: number): Promise<CommissionPolicy> => {
    const { data } = await api.get(`/admin/commission/policies/supplier/${supplierId}`);
    return data;
  },

  setDefaultRate: async (request: SetCommissionRateRequest): Promise<CommissionPolicy> => {
    const { data } = await api.put('/admin/commission/policies/default', request);
    return data;
  },

  setSupplierRate: async (
    supplierId: number,
    request: SetCommissionRateRequest,
  ): Promise<CommissionPolicy> => {
    const { data } = await api.put(
      `/admin/commission/policies/supplier/${supplierId}`,
      request,
    );
    return data;
  },

  deletePolicy: async (policyId: number): Promise<void> => {
    await api.delete(`/admin/commission/policies/${policyId}`);
  },

  // ── Reporting endpoints ─────────────────────────────────────────────────

  getOrderCommissions: async (params: {
    supplierId?: number;
    month?: number;
    year?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<OrderCommission>> => {
    const { data } = await api.get('/admin/commission/orders', { params });
    return data;
  },

  getReport: async (month?: number, year?: number): Promise<CommissionReport> => {
    const { data } = await api.get('/admin/commission/report', {
      params: { month, year },
    });
    return data;
  },
};

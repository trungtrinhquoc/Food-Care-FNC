import api from '../api';
import type { FinanceSummary, MartSettlement } from '../../types/admin';

export const financeService = {
  getSummary: async (month?: number, year?: number): Promise<FinanceSummary> => {
    const now = new Date();
    const response = await api.get('/admin/finance/summary', {
      params: { month: month ?? now.getMonth() + 1, year: year ?? now.getFullYear() }
    });
    return response.data;
  },

  getSettlements: async (month?: number, year?: number): Promise<MartSettlement[]> => {
    const now = new Date();
    const response = await api.get('/admin/finance/settlements', {
      params: { month: month ?? now.getMonth() + 1, year: year ?? now.getFullYear() }
    });
    return response.data;
  },

  settleAll: async (month?: number, year?: number): Promise<void> => {
    const now = new Date();
    await api.post('/admin/finance/settle-all', null, {
      params: { month: month ?? now.getMonth() + 1, year: year ?? now.getFullYear() }
    });
  },
};

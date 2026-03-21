import api from '../api';

// ── Types (matching backend AdminAlertDto / AdminAlertFilterDto) ──

export interface AdminAlert {
  id: string;
  supplierId: number;
  storeName: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  data?: string;
}

export interface AdminAlertFilter {
  type?: string;
  severity?: string;
  isRead?: boolean;
  supplierId?: number;
  page?: number;
  pageSize?: number;
}

// ── Service ──

export const alertsService = {
  getAlerts: async (filter?: AdminAlertFilter): Promise<AdminAlert[]> => {
    const response = await api.get('/admin/alerts', { params: filter });
    return response.data?.items ?? response.data ?? [];
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/admin/alerts/unread-count');
    return response.data?.count ?? response.data ?? 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/admin/alerts/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/admin/alerts/mark-all-read');
  },
};

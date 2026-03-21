import api from '../api';

// ── Types (matching backend Zalo DTOs) ──

export interface ZaloMessage {
  id: string;
  userEmail?: string;
  phoneSent: string;
  templateName?: string;
  status?: string;
  errorMessage?: string;
  sentAt: string;
}

export interface ZaloTemplate {
  id: number;
  templateId: string;
  templateName?: string;
  contentSample?: string;
  price?: number;
  isActive: boolean;
}

export interface ZaloMessageFilter {
  searchTerm?: string;
  status?: string;
  templateId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortDescending?: boolean;
}

export interface SendZaloMessage {
  userId?: string;
  orderId?: string;
  templateId: number;
  phoneNumber: string;
}

export interface SendZaloMessageResult {
  success: boolean;
  messageId?: string;
  sentAt?: string;
  errorMessage?: string;
}

// ── Service ──

export const zaloService = {
  getMessages: async (filter?: ZaloMessageFilter): Promise<ZaloMessage[]> => {
    const response = await api.get('/admin/zalo/messages', { params: filter });
    return response.data?.items ?? response.data ?? [];
  },

  getTemplates: async (): Promise<ZaloTemplate[]> => {
    const response = await api.get('/admin/zalo/templates');
    return response.data?.items ?? response.data ?? [];
  },

  sendMessage: async (payload: SendZaloMessage): Promise<SendZaloMessageResult> => {
    const response = await api.post('/admin/zalo/send', payload);
    return response.data;
  },
};

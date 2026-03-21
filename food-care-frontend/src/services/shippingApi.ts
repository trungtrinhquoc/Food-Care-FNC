import api from './api';
import type {
    UserOrderTracking,
    UserConfirmDeliveryRequest,
    UserRequestReturnRequest,
} from '@/types/shipping';

export const shippingApi = {
    getUserOrders: async (params?: { pageSize?: number; status?: string }): Promise<UserOrderTracking[]> => {
        const response = await api.get('/shipping/user/orders', { params });
        return Array.isArray(response.data) ? response.data : (response.data?.items ?? []);
    },

    getUserOrderTracking: async (orderId: string): Promise<UserOrderTracking> => {
        const response = await api.get(`/shipping/user/orders/${orderId}/tracking`);
        return response.data;
    },

    confirmDelivery: async (data: UserConfirmDeliveryRequest): Promise<void> => {
        await api.post(`/shipping/user/orders/${data.orderId}/confirm-delivery`, data);
    },

    requestReturn: async (data: UserRequestReturnRequest): Promise<void> => {
        await api.post(`/shipping/user/orders/${data.orderId}/request-return`, data);
    },

    cancelUserOrder: async (orderId: string, reason: string): Promise<void> => {
        await api.post(`/shipping/user/orders/${orderId}/cancel`, { reason });
    },
};

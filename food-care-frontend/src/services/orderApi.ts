import type { Order, CreateOrderRequest } from '../types';
import api from './api';

export const orderApi = {
    createOrder: async (data: CreateOrderRequest): Promise<Order> => {
        const response = await api.post<Order>('/orders', data);
        return response.data;
    },

    getOrderById: async (id: string): Promise<Order> => {
        const response = await api.get<Order>(`/orders/${id}`);
        return response.data;
    },

    getMyOrders: async (): Promise<Order[]> => {
        const response = await api.get<Order[]>('/orders/my');
        return response.data;
    },
};
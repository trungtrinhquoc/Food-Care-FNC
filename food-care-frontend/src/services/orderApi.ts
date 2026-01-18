import type { Order, CreateOrderRequest } from '../types';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5022/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
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
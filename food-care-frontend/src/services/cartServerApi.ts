import axios from 'axios';
import type {
    ServerCart,
    ServerCartItem,
    AddToCartRequest,
    UpdateCartItemRequest,
    CartCheckoutResult,
} from '../types/mart';

const API_URL = 'http://localhost:5022/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const cartApi = {
    getCart: async (): Promise<ServerCart> => {
        const res = await api.get<ServerCart>('/cart');
        return res.data;
    },

    addItem: async (dto: AddToCartRequest): Promise<ServerCartItem> => {
        const res = await api.post<ServerCartItem>('/cart/items', dto);
        return res.data;
    },

    updateItem: async (itemId: string, dto: UpdateCartItemRequest): Promise<ServerCartItem> => {
        const res = await api.put<ServerCartItem>(`/cart/items/${itemId}`, dto);
        return res.data;
    },

    removeItem: async (itemId: string): Promise<void> => {
        await api.delete(`/cart/items/${itemId}`);
    },

    clearCart: async (): Promise<void> => {
        await api.delete('/cart');
    },

    checkout: async (): Promise<CartCheckoutResult> => {
        const res = await api.post<CartCheckoutResult>('/cart/checkout');
        return res.data;
    },
};

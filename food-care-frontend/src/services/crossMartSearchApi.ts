import axios from 'axios';
import type {
    CrossMartSearchQuery,
    CrossMartProductResult,
    ProductVariant,
    AlternativeMart,
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

export const crossMartSearchApi = {
    search: async (query: CrossMartSearchQuery): Promise<CrossMartProductResult[]> => {
        const res = await api.get<
            CrossMartProductResult[] |
            { products?: CrossMartProductResult[]; totalCount?: number } |
            { item1?: CrossMartProductResult[]; item2?: number }
        >('/crossmartsearch/search', { params: query });
        if (Array.isArray(res.data)) return res.data;
        if ('products' in res.data) return res.data.products ?? [];
        if ('item1' in res.data) return res.data.item1 ?? [];
        return [];
    },

    getVariants: async (productId: string, martId: number): Promise<ProductVariant[]> => {
        const res = await api.get<ProductVariant[]>(`/crossmartsearch/products/${productId}/variants`, {
            params: { martId },
        });
        return res.data;
    },

    getAlternatives: async (productId: string, latitude: number, longitude: number): Promise<AlternativeMart[]> => {
        const res = await api.get<AlternativeMart[]>(`/crossmartsearch/products/${productId}/alternatives`, {
            params: { latitude, longitude },
        });
        return res.data;
    },

    notifyAvailability: async (productId: string, martId: number): Promise<void> => {
        await api.post(`/crossmartsearch/products/${productId}/notify`, null, {
            params: { martId },
        });
    },
};

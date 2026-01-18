import axios from 'axios';
import type {
    Product,
    ProductsResponse,
    CreateProductRequest,
    UpdateProductRequest,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5022/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function parseImageUrl(imageUrl?: string | string[]): string[] {
    if (!imageUrl) return [];
    if (Array.isArray(imageUrl)) return imageUrl;
    if (typeof imageUrl === 'string' && !imageUrl.startsWith('[')) {
        return [imageUrl];
    }
    try {
        const parsed = JSON.parse(imageUrl);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export interface ProductFilter {
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
    isSubscriptionAvailable?: boolean;
    sortBy?: string;
    sortDescending?: boolean;
    page?: number;
    pageSize?: number;
}

// Products API - calls Backend which connects to Supabase
export const productsApi = {
    getProducts: async (filter: ProductFilter = {}): Promise<ProductsResponse> => {
        const response = await api.get<ProductsResponse>('/products', {
            params: filter,
        });

        return {
            ...response.data,
            products: response.data.products.map((p) => ({
                ...p,
                images: parseImageUrl(p.imageUrl) ?? [],
            })),
        };
    },

    getProduct: async (id: string): Promise<Product> => {
        const response = await api.get<Product>(`/products/${id}`);
        const images = parseImageUrl(response.data.imageUrl);

        return {
            ...response.data,
            images,
            imageUrl: images[0] ?? undefined,
        };
    },

    createProduct: async (data: CreateProductRequest): Promise<Product> => {
        const response = await api.post<Product>('/products', data);
        return response.data;
    },

    updateProduct: async (productId: string, data: UpdateProductRequest): Promise<Product> => {
        const response = await api.put<Product>(`/products/${productId}`, data);
        return response.data;
    },

    deleteProduct: async (productId: string): Promise<void> => {
        await api.delete(`/products/${productId}`);
    },

    searchProducts: async (query: string, limit: number = 20): Promise<Product[]> => {
        const response = await api.get<ProductsResponse>('/products', {
            params: { searchTerm: query, pageSize: limit },
        });
        return response.data.products;
    },

    getLowStockProducts: async (threshold: number = 10): Promise<Product[]> => {
        const response = await api.get<ProductsResponse>('/products', {
            params: { pageSize: 100 },
        });
        return response.data.products.filter(p => p.stockQuantity > 0 && p.stockQuantity < threshold);
    },
};

export default productsApi;


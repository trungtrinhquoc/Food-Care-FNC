import axios from 'axios';
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
    ProductsResponse,
    ProductFilter,
    Product,
    Category,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5022/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },
};

// Products API
export const productsApi = {
    getProducts: async (filter: ProductFilter = {}): Promise<ProductsResponse> => {
        const response = await api.get<ProductsResponse>('/products', {
            params: filter,
        });
        return response.data;
    },

    getProduct: async (id: string): Promise<Product> => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },
};

// Categories API
export const categoriesApi = {
    getCategories: async (): Promise<Category[]> => {
        const response = await api.get<Category[]>('/categories');
        return response.data;
    },

    getCategory: async (id: number): Promise<Category> => {
        const response = await api.get<Category>(`/categories/${id}`);
        return response.data;
    },
};

export default api;

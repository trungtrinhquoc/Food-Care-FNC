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
    Address,
    PaymentMethod,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5022/api';
console.log('Configured API_URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
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
    (response) => {
        console.log(`Response from ${response.config.url}:`, response.status);
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
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

// Profile API
export const profileApi = {
    // Profile Management
    updateProfile: async (data: {
        fullName: string;
        email?: string;
        phoneNumber?: string;
        avatarUrl?: string;
    }): Promise<{ message: string; success: boolean }> => {
        const response = await api.put('/profile', data);
        return response.data;
    },

    changePassword: async (data: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }): Promise<{ message: string; success: boolean }> => {
        const response = await api.post('/profile/change-password', data);
        return response.data;
    },

    // Address Management
    getAddresses: async (): Promise<Address[]> => {
        const response = await api.get('/profile/addresses');
        return response.data;
    },

    getAddress: async (addressId: string): Promise<Address> => {
        const response = await api.get(`/profile/addresses/${addressId}`);
        return response.data;
    },

    createAddress: async (data: Omit<Address, 'id'>): Promise<Address> => {
        const response = await api.post('/profile/addresses', data);
        return response.data;
    },

    updateAddress: async (addressId: string, data: Omit<Address, 'id'>): Promise<Address> => {
        const response = await api.put(`/profile/addresses/${addressId}`, data);
        return response.data;
    },

    deleteAddress: async (addressId: string): Promise<{ message: string; success: boolean }> => {
        const response = await api.delete(`/profile/addresses/${addressId}`);
        return response.data;
    },

    setDefaultAddress: async (addressId: string): Promise<{ message: string; success: boolean }> => {
        const response = await api.patch(`/profile/addresses/${addressId}/set-default`);
        return response.data;
    },

    // Payment Method Management
    getPaymentMethods: async (): Promise<PaymentMethod[]> => {
        const response = await api.get('/profile/payment-methods');
        return response.data;
    },

    getPaymentMethod: async (paymentMethodId: string): Promise<PaymentMethod> => {
        const response = await api.get(`/profile/payment-methods/${paymentMethodId}`);
        return response.data;
    },

    createPaymentMethod: async (data: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => {
        const response = await api.post('/profile/payment-methods', data);
        return response.data;
    },

    updatePaymentMethod: async (
        paymentMethodId: string,
        data: Omit<PaymentMethod, 'id'>
    ): Promise<PaymentMethod> => {
        const response = await api.put(`/profile/payment-methods/${paymentMethodId}`, data);
        return response.data;
    },

    deletePaymentMethod: async (paymentMethodId: string): Promise<{ message: string; success: boolean }> => {
        const response = await api.delete(`/profile/payment-methods/${paymentMethodId}`);
        return response.data;
    },

    setDefaultPaymentMethod: async (paymentMethodId: string): Promise<{ message: string; success: boolean }> => {
        const response = await api.patch(`/profile/payment-methods/${paymentMethodId}/set-default`);
        return response.data;
    },
};

export default api;


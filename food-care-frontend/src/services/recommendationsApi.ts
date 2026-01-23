import axios from 'axios';
import type { Product } from '../types';

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

export interface SubscriptionRecommendation {
    product: Product;
    purchaseCount: number;
    potentialYearlySavings: number;
    recommendedFrequency: string;
    subscriptionDiscount: number;
}

export interface LowStockNotification {
    product: Product;
    lastPurchaseDate: string;
    estimatedDaysLeft: number;
    averageUsageDays: number;
    purchaseCount: number;
}

export interface PersonalizedRecommendations {
    forYou: Product[];
    highRated: Product[];
    trending: Product[];
    repurchase: Product[];
    subscriptionWorthy: SubscriptionRecommendation[];
    tierExclusive: Product[];
    userTierName: string;
}

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

function transformProduct(product: any): Product {
    const images = parseImageUrl(product.imageUrl);
    return {
        ...product,
        images,
        imageUrl: images[0] ?? undefined,
    };
}

export const recommendationsApi = {
    /**
     * Get all personalized recommendations (authenticated users only)
     */
    getPersonalized: async (): Promise<PersonalizedRecommendations> => {
        const response = await api.get<PersonalizedRecommendations>('/recommendations/for-you');

        // Transform all product arrays
        return {
            ...response.data,
            forYou: response.data.forYou.map(transformProduct),
            highRated: response.data.highRated.map(transformProduct),
            trending: response.data.trending.map(transformProduct),
            repurchase: response.data.repurchase.map(transformProduct),
            tierExclusive: response.data.tierExclusive.map(transformProduct),
            subscriptionWorthy: response.data.subscriptionWorthy.map(rec => ({
                ...rec,
                product: transformProduct(rec.product)
            }))
        };
    },

    /**
     * Get high-rated products (public)
     */
    getHighRated: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/high-rated', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    /**
     * Get trending products (public)
     */
    getTrending: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/trending', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    /**
     * Get repurchase recommendations (authenticated users only)
     */
    getRepurchase: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/repurchase', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    /**
     * Get subscription-worthy products (authenticated users only)
     */
    getSubscriptionWorthy: async (limit: number = 8): Promise<SubscriptionRecommendation[]> => {
        const response = await api.get<SubscriptionRecommendation[]>('/recommendations/subscription-worthy', {
            params: { limit }
        });
        return response.data.map(rec => ({
            ...rec,
            product: transformProduct(rec.product)
        }));
    },

    /**
     * Get tier-exclusive deals (authenticated users only)
     */
    getTierExclusive: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/tier-exclusive', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    // ============ Phase 2.1 Methods ============

    /**
     * Get collaborative filtering recommendations (authenticated users only)
     */
    getYouMayLike: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/you-may-like', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    /**
     * Get new arrivals (public)
     */
    getNewArrivals: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/new-arrivals', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    /**
     * Get low stock urgent products (public)
     */
    getLowStockUrgent: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/low-stock-urgent', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    /**
     * Get biggest discounts (public)
     */
    getBiggestDiscounts: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/biggest-discounts', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    /**
     * Get healthy products (public)
     */
    getHealthy: async (limit: number = 8): Promise<Product[]> => {
        const response = await api.get<Product[]>('/recommendations/healthy', {
            params: { limit }
        });
        return response.data.map(transformProduct);
    },

    /**
     * Get low stock notifications based on user's purchase history (authenticated users only)
     */
    getLowStockNotifications: async (limit: number = 3): Promise<LowStockNotification[]> => {
        const response = await api.get<LowStockNotification[]>('/recommendations/low-stock-notifications', {
            params: { limit }
        });
        return response.data.map(item => ({
            ...item,
            product: transformProduct(item.product)
        }));
    },
};

export default recommendationsApi;

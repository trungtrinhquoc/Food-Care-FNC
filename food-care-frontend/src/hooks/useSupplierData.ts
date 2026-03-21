// React Query hooks for Supplier Product and Review Management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierApi } from '../services/suppliersApi';
import type { SupplierProduct } from '../types/supplier';
import api from '../services/api';

// ===== PRODUCT HOOKS =====

export const useProducts = () => {
  return useQuery({
    queryKey: ['supplier', 'products'],
    queryFn: async (): Promise<SupplierProduct[]> => {
      try {
        const products = await supplierApi.getProducts();
        // Map to include compatibility fields
        return products.map(p => ({
          ...p,
          price: p.basePrice,
          stock: p.stockQuantity,
          soldCount: p.orderCount,
          status: !p.isActive ? 'inactive' : p.stockQuantity === 0 ? 'out_of_stock' : 'active'
        }));
      } catch (error) {
        console.warn('Failed to fetch products from API:', error);
        return [];
      }
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SupplierProduct>) => {
      const response = await api.post('/supplier/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierProduct> }) => {
      const response = await api.put(`/supplier/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/supplier/products/${productId}`);
      return productId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const response = await api.patch(`/supplier/products/${productId}/stock`, { quantity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
    },
  });
};

// ===== REVIEW HOOKS =====

interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  images: string[];
  response: string | null;
  respondedAt?: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  pendingResponseCount: number;
}

export const useReviews = () => {
  return useQuery({
    queryKey: ['supplier', 'reviews'],
    queryFn: async (): Promise<Review[]> => {
      try {
        const response = await api.get('/supplier/reviews');
        return response.data;
      } catch (error) {
        console.warn('Failed to fetch reviews from API:', error);
        return [];
      }
    },
  });
};

export const useRespondToReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      const apiResponse = await api.post(`/supplier/reviews/${reviewId}/respond`, { response });
      return apiResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'reviews'] });
    },
  });
};

export const useReviewStats = () => {
  return useQuery({
    queryKey: ['supplier', 'review-stats'],
    queryFn: async (): Promise<ReviewStats> => {
      try {
        const response = await api.get('/supplier/reviews/stats');
        return response.data;
      } catch (error) {
        console.warn('Failed to fetch review stats from API:', error);
        return {
          totalReviews: 0,
          averageRating: 0,
          fiveStarCount: 0,
          fourStarCount: 0,
          threeStarCount: 0,
          twoStarCount: 0,
          oneStarCount: 0,
          pendingResponseCount: 0
        };
      }
    },
  });
};

// ===== REVENUE HOOKS =====

interface RevenueSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  monthChange: number;
  weekChange: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

interface RevenueDataDetailed {
  daily: DailyRevenue[];
  monthly: MonthlyRevenue[];
  byCategory: CategoryRevenue[];
}

export const useRevenueSummary = () => {
  return useQuery({
    queryKey: ['supplier', 'revenue-summary'],
    queryFn: async (): Promise<RevenueSummary> => {
      try {
        const response = await api.get('/supplier/revenue/summary');
        return response.data;
      } catch (error) {
        console.warn('Failed to fetch revenue summary from API:', error);
        return {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          lastMonth: 0,
          monthChange: 0,
          weekChange: 0
        };
      }
    },
  });
};

export const useRevenueDetailed = () => {
  return useQuery({
    queryKey: ['supplier', 'revenue-detailed'],
    queryFn: async (): Promise<RevenueDataDetailed> => {
      try {
        const response = await api.get('/supplier/revenue/detailed');
        return response.data;
      } catch (error) {
        console.warn('Failed to fetch detailed revenue from API:', error);
        return {
          daily: [],
          monthly: [],
          byCategory: []
        };
      }
    },
  });
};

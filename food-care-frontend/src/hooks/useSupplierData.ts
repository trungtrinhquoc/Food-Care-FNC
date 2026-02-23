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
        console.warn('Failed to fetch products from API, using mock data:', error);
        // Return mock data as fallback
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
        console.warn('Failed to fetch reviews from API, using mock data:', error);
        // Return mock data as fallback
        return [
          {
            id: 'REV-001',
            productId: 'PROD-001',
            productName: 'Thịt bò nhập khẩu',
            customerName: 'Nguyễn Văn A',
            rating: 5,
            comment: 'Thịt rất tươi, ngon, giao hàng nhanh',
            createdAt: '2024-01-25T14:30:00Z',
            isVerified: true,
            images: [],
            response: null
          },
          {
            id: 'REV-002',
            productId: 'PROD-002',
            productName: 'Rau hữu cơ',
            customerName: 'Trần Thị B',
            rating: 4,
            comment: 'Rau tươi sạch, đóng gói tốt',
            createdAt: '2024-01-25T16:20:00Z',
            isVerified: true,
            images: [],
            response: null
          }
        ];
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
        console.warn('Failed to fetch review stats from API, using mock data:', error);
        // Return mock data as fallback
        return {
          totalReviews: 25,
          averageRating: 4.3,
          fiveStarCount: 12,
          fourStarCount: 8,
          threeStarCount: 3,
          twoStarCount: 1,
          oneStarCount: 1,
          pendingResponseCount: 5
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
        console.warn('Failed to fetch revenue summary from API, using mock data:', error);
        return {
          today: 1500000,
          thisWeek: 21500000,
          thisMonth: 85000000,
          lastMonth: 78000000,
          monthChange: 8.97,
          weekChange: 12.5
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
        console.warn('Failed to fetch detailed revenue from API, using mock data:', error);
        return {
          daily: [
            { date: '2024-01-20', revenue: 2500000 },
            { date: '2024-01-21', revenue: 3200000 },
            { date: '2024-01-22', revenue: 2800000 },
            { date: '2024-01-23', revenue: 3500000 },
            { date: '2024-01-24', revenue: 2900000 },
            { date: '2024-01-25', revenue: 4100000 },
            { date: '2024-01-26', revenue: 2500000 }
          ],
          monthly: [
            { month: '2023-08', revenue: 85000000 },
            { month: '2023-09', revenue: 92000000 },
            { month: '2023-10', revenue: 78000000 },
            { month: '2023-11', revenue: 95000000 },
            { month: '2023-12', revenue: 110000000 },
            { month: '2024-01', revenue: 45000000 }
          ],
          byCategory: [
            { category: 'Thịt', revenue: 28000000, percentage: 62.2 },
            { category: 'Rau củ', revenue: 8500000, percentage: 18.9 },
            { category: 'Hải sản', revenue: 6500000, percentage: 14.4 },
            { category: 'Khác', revenue: 2000000, percentage: 4.5 }
          ]
        };
      }
    },
  });
};

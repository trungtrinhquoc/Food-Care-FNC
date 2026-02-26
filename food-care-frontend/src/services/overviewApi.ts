import api from './api';

// Types for Overview Tab
export interface OrderChartData {

  period: string;
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  total: number;
}

export interface CategoryRevenue {
  categoryName: string;
  revenue: number;
  orderCount: number;
  color: string;
}

export interface UserTrafficData {
  date: string;
  activeUsers: number;
  newUsers: number;
  totalLogins: number;
}

export interface LatestOrderResponse {
  orderId: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface TopProductResponse {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  imageUrl?: string;
}

// API Functions
export const overviewApi = {
  // Get orders chart data (by week or date range)
  getOrdersChartData: async (days: number = 7): Promise<OrderChartData[]> => {
    try {
      const response = await api.get<OrderChartData[]>('/admin/stats/orders-chart', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders chart data:', error);
      return [];
    }
  },

  // Get revenue by category
  getCategoryRevenue: async (): Promise<CategoryRevenue[]> => {
    try {
      const response = await api.get<CategoryRevenue[]>('/admin/stats/category-revenue');
      return response.data;
    } catch (error) {
      console.error('Error fetching category revenue:', error);
      // Return empty array as fallback - will be populated from real data
      return [];
    }
  },

  // Get latest orders
  getLatestOrders: async (limit: number = 5): Promise<LatestOrderResponse[]> => {
    try {
      const response = await api.get<LatestOrderResponse[]>('/admin/orders/latest', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching latest orders:', error);
      return [];
    }
  },

  // Get top selling products
  getTopProducts: async (limit: number = 5): Promise<TopProductResponse[]> => {
    try {
      const response = await api.get<TopProductResponse[]>('/admin/stats/top-products', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  },

  // Get user traffic data (active users, logins by day)
  getUserTraffic: async (days: number = 7): Promise<UserTrafficData[]> => {
    try {
      const response = await api.get<UserTrafficData[]>('/admin/stats/user-traffic', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user traffic:', error);
      return [];
    }
  },

  // Get all overview data in one call
  getAllOverviewData: async (): Promise<{
    ordersChart: OrderChartData[];
    categoryRevenue: CategoryRevenue[];
    latestOrders: LatestOrderResponse[];
    topProducts: TopProductResponse[];
    userTraffic: UserTrafficData[];
  }> => {
    const [ordersChart, categoryRevenue, latestOrders, topProducts, userTraffic] = await Promise.all([
      overviewApi.getOrdersChartData(7),
      overviewApi.getCategoryRevenue(),
      overviewApi.getLatestOrders(5),
      overviewApi.getTopProducts(5),
      overviewApi.getUserTraffic(7),
    ]);
    return { ordersChart, categoryRevenue, latestOrders, topProducts, userTraffic };
  }
};

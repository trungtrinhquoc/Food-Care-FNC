import axios from 'axios';

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
      // Return mock data as fallback with proper date logic
      const today = new Date();
      const mockData: OrderChartData[] = [];

      if (days === 7) {
        // Weekly data - show last 7 days
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayName = dayNames[date.getDay()];

          const pending = Math.floor(Math.random() * 15) + 5;
          const confirmed = Math.floor(Math.random() * 12) + 3;
          const delivered = Math.floor(Math.random() * 40) + 30;
          const cancelled = Math.floor(Math.random() * 3) + 1;

          mockData.push({
            period: dayName,
            pending,
            confirmed,
            delivered,
            cancelled,
            total: pending + confirmed + delivered + cancelled,
          });
        }
      } else if (days === 30) {
        // Monthly data - show by week (4 weeks)
        for (let week = 3; week >= 0; week--) {
          const pending = Math.floor(Math.random() * 50) + 20;
          const confirmed = Math.floor(Math.random() * 40) + 15;
          const delivered = Math.floor(Math.random() * 150) + 100;
          const cancelled = Math.floor(Math.random() * 10) + 2;

          mockData.push({
            period: `Tuần ${4 - week}`,
            pending,
            confirmed,
            delivered,
            cancelled,
            total: pending + confirmed + delivered + cancelled,
          });
        }
      } else if (days >= 365) {
        // Yearly data - show by month (last 12 months)
        for (let month = 11; month >= 0; month--) {
          const date = new Date(today);
          date.setMonth(date.getMonth() - month);
          const monthName = `T${date.getMonth() + 1}`;

          const pending = Math.floor(Math.random() * 80) + 30;
          const confirmed = Math.floor(Math.random() * 100) + 50;
          const delivered = Math.floor(Math.random() * 400) + 300;
          const cancelled = Math.floor(Math.random() * 30) + 10;

          mockData.push({
            period: monthName,
            pending,
            confirmed,
            delivered,
            cancelled,
            total: pending + confirmed + delivered + cancelled,
          });
        }
      }

      return mockData;
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
      // Return mock data as fallback for demo
      const today = new Date();
      const mockData: UserTrafficData[] = [];

      // Adjust data points based on time range
      if (days === 1) {
        // For 1 day, show hourly data (24 hours)
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(today);
          hour.setHours(hour.getHours() - i);
          mockData.push({
            date: `${hour.getHours()}:00`,
            activeUsers: Math.floor(Math.random() * 30) + 40,
            newUsers: Math.floor(Math.random() * 5) + 1,
            totalLogins: Math.floor(Math.random() * 40) + 50,
          });
        }
      } else if (days > 365) {
        // For 1 year, show monthly data
        for (let i = 11; i >= 0; i--) {
          const month = new Date(today);
          month.setMonth(month.getMonth() - i);
          const monthName = `Tháng ${month.getMonth() + 1}`;
          mockData.push({
            date: monthName,
            activeUsers: Math.floor(Math.random() * 200) + 300,
            newUsers: Math.floor(Math.random() * 80) + 20,
            totalLogins: Math.floor(Math.random() * 300) + 400,
          });
        }
      } else {
        // For 7 days or 30 days, show daily data
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
          mockData.push({
            date: dateStr,
            activeUsers: Math.floor(Math.random() * 50) + 100,
            newUsers: Math.floor(Math.random() * 20) + 5,
            totalLogins: Math.floor(Math.random() * 80) + 120,
          });
        }
      }

      return mockData;
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

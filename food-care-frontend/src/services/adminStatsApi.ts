import api from './api';

// Types
export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  monthlyGrowth: number;
  pendingOrders: number;
  lowStockProducts: number;
  ordersToday: number;
  pendingComplaints: number;
  gmv: number;
  fAndCRevenue: number;
  activeMarts: number;
  activeUsersCount: number;
  activeSubscriptions: number;
  churnRate: number;
  todayRevenue: number;
  completedOrders: number;
  cancelledOrders: number;
  shippingOrders: number;
  confirmedOrders: number;
  newCustomersThisWeek: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface OrderByStatus {
  status: string;
  count: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalSold: number;
}

export interface DashboardSummary {
  ordersByStatus: OrderByStatus[];
  topProducts: TopProduct[];
}

// API Functions
export const adminStatsApi = {
  // Get dashboard stats (revenue, orders, customers, products)
  getDashboardStats: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/stats/dashboard');
    return response.data;
  },

  // Get revenue data for chart (last N months)
  getRevenueData: async (months: number = 6): Promise<RevenueData[]> => {
    const response = await api.get<RevenueData[]>('/admin/stats/revenue', {
      params: { months }
    });
    return response.data;
  },

  // Get dashboard summary (orders by status, top products)
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>('/admin/stats/summary');
    return response.data;
  },

  // Get all dashboard data in one call
  getFullDashboard: async (): Promise<{
    stats: AdminStats;
    revenueData: RevenueData[];
    summary: DashboardSummary;
  }> => {
    const [stats, revenueData, summary] = await Promise.all([
      adminStatsApi.getDashboardStats(),
      adminStatsApi.getRevenueData(6),
      adminStatsApi.getDashboardSummary(),
    ]);
    return { stats, revenueData, summary };
  }
};

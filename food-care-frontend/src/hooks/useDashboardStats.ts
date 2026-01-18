import { useState, useEffect, useCallback } from 'react';
import { adminStatsApi, type AdminStats, type RevenueData, type DashboardSummary } from '../services/adminStatsApi';

interface UseDashboardStatsReturn {
  stats: AdminStats | null;
  revenueData: RevenueData[];
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultStats: AdminStats = {
  totalRevenue: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalProducts: 0,
  monthlyGrowth: 0,
  pendingOrders: 0,
  lowStockProducts: 0,
};

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await adminStatsApi.getFullDashboard();
      
      setStats(data.stats);
      setRevenueData(data.revenueData);
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard');
      // Set default values on error
      setStats(defaultStats);
      setRevenueData([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    revenueData,
    summary,
    isLoading,
    error,
    refetch: fetchData,
  };
}

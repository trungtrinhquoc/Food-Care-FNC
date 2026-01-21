import { useQuery } from '@tanstack/react-query';
import { overviewApi } from '../services/overviewApi';

export function useOverviewData(trafficDays: number = 7, orderDays: number = 7) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['overview-data', trafficDays, orderDays],
    queryFn: async () => {
      const [ordersChart, categoryRevenue, latestOrders, topProducts] = await Promise.all([
        overviewApi.getOrdersChartData(orderDays),
        overviewApi.getCategoryRevenue(),
        overviewApi.getLatestOrders(5),
        overviewApi.getTopProducts(5),
      ]);
      const userTraffic = await overviewApi.getUserTraffic(trafficDays);
      return { ordersChart, categoryRevenue, latestOrders, topProducts, userTraffic };
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    ordersChart: data?.ordersChart || [],
    categoryRevenue: data?.categoryRevenue || [],
    latestOrders: data?.latestOrders || [],
    topProducts: data?.topProducts || [],
    userTraffic: data?.userTraffic || [],
    isLoading,
    error: error?.message,
    refetch,
  };
}

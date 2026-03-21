import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/admin/Button';
import {
  Download,
  Send,
  Bell,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  FileText,
  Settings,
} from 'lucide-react';
import { StatsCard } from '../../components/admin/StatsCard';
import { DateRangeFilter, type DateRange } from '../../components/admin/DateRangeFilter';
import { TrafficDateRangeFilter, type TrafficDateRange } from '../../components/admin/TrafficDateRangeFilter';
import { RevenueChart } from '../../components/admin/RevenueChart';
import { OrdersChart } from '../../components/admin/OrdersChart';
import { CategoryRevenueChart } from '../../components/admin/CategoryRevenueChart';
import { UserTrafficChart } from '../../components/admin/UserTrafficChart';
import { LatestOrdersTable, type LatestOrder } from '../../components/admin/LatestOrdersTable';
import { TopProductsPanel, type TopProduct } from '../../components/admin/TopProductsPanel';
import { AlertsPanel, type SystemAlert } from '../../components/admin/AlertsPanel';
import { DashboardSkeleton } from '../../components/admin/DashboardSkeleton';
import type { AdminStats, RevenueData } from '../../types/admin';
import { adminStatsApi } from '../../services/adminStatsApi';
import { useOverviewData } from '../../hooks/useOverviewData';
import { alertsService, type AdminAlert } from '../../services/admin/alertsService';

interface OverviewTabProps {
  stats: AdminStats;
  revenueData: RevenueData[];
  totalProducts: number;
  isLoading?: boolean;
}

const dateRangeToMonths: Record<string, number> = {
  '7d': 1,
  '30d': 1,
  '6m': 6,
  '1y': 12,
};

const dateRangeLabel: Record<string, string> = {
  '7d': '7 ngày gần nhất',
  '30d': '30 ngày gần nhất',
  '6m': '6 tháng gần nhất',
  '1y': '12 tháng gần nhất',
};

// Extract sparkline data from orders chart (real API data)
function getOrdersSparkline(ordersChart: { total: number }[]): number[] {
  if (!ordersChart || ordersChart.length === 0) return [];
  return ordersChart.slice(-7).map(d => d.total);
}

function getRevenueSparkline(revenueData: { revenue: number }[]): number[] {
  if (!revenueData || revenueData.length === 0) return [];
  return revenueData.slice(-7).map(d => d.revenue);
}

// Convert backend AdminAlert to frontend SystemAlert
function mapAlertToSystemAlert(alert: AdminAlert): SystemAlert {
  const typeMap: Record<string, SystemAlert['type']> = {
    sla_violation: 'sla_violation',
    quality_issue: 'quality_issue',
    rating_drop: 'rating_drop',
    return_rate: 'return_rate',
    low_stock: 'low_stock',
    pending_order: 'pending_order',
    new_review: 'new_review',
    system: 'system',
  };
  return {
    id: alert.id,
    type: typeMap[alert.type] || 'other',
    severity: alert.severity as SystemAlert['severity'],
    title: alert.title,
    message: alert.message,
    timestamp: alert.createdAt,
    isRead: alert.isRead,
    storeName: alert.storeName,
    supplierId: alert.supplierId,
  };
}

export function OverviewTab({ stats, revenueData, totalProducts, isLoading = false }: OverviewTabProps) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [trafficDateRange, setTrafficDateRange] = useState<TrafficDateRange>('7d');
  const [orderDateRange, setOrderDateRange] = useState<TrafficDateRange>('7d');
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch real alerts from API
  const loadAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true);
      const [alertData, count] = await Promise.all([
        alertsService.getAlerts({ pageSize: 10 }),
        alertsService.getUnreadCount(),
      ]);
      setAlerts(alertData.map(mapAlertToSystemAlert));
      setUnreadCount(count);
    } catch {
      // Silently fail — alerts are non-critical
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleMarkAsRead = useCallback(async (alertId: string) => {
    try {
      await alertsService.markAsRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await alertsService.markAllAsRead();
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, []);

  // Map traffic date range to days
  const trafficDaysMap: Record<TrafficDateRange, number> = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '1y': 365,
  };

  const orderDaysMap: Record<TrafficDateRange, number> = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '1y': 365,
  };

  // Fetch revenue data filtered by the selected date range
  const revenueMonths = dateRangeToMonths[dateRange] ?? 6;
  const { data: revenueChartData } = useQuery({
    queryKey: ['revenue-data', revenueMonths],
    queryFn: () => adminStatsApi.getRevenueData(revenueMonths),
    staleTime: 30_000,
    placeholderData: revenueData,
  });
  const activeRevenueData = revenueChartData ?? revenueData;

  // Fetch overview data from API
  const {
    ordersChart,
    categoryRevenue,
    latestOrders: apiLatestOrders,
    topProducts: apiTopProducts,
    userTraffic,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useOverviewData(trafficDaysMap[trafficDateRange], orderDaysMap[orderDateRange]);

  // Convert API data to component format
  const latestOrders: LatestOrder[] = apiLatestOrders.map(order => ({
    id: order.orderId,
    customerName: order.customerName,
    totalAmount: order.totalAmount,
    status: order.status as LatestOrder['status'],
    createdAt: order.createdAt,
    itemCount: order.itemCount,
  }));

  const topProducts: TopProduct[] = apiTopProducts.map(product => ({
    productId: product.productId,
    productName: product.productName,
    totalSold: product.totalSold,
    revenue: product.revenue,
    imageUrl: product.imageUrl,
  }));

  // Handle date range change
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
    refetchOverview();
  }, [refetchOverview]);

  // Handle traffic date range change
  const handleTrafficDateRangeChange = useCallback((range: TrafficDateRange) => {
    setTrafficDateRange(range);
    refetchOverview();
  }, [refetchOverview]);

  // Handle order date range change
  const handleOrderDateRangeChange = useCallback((range: TrafficDateRange) => {
    setOrderDateRange(range);
    refetchOverview();
  }, [refetchOverview]);

  // Handle KPI card clicks for drill-down
  const handleRevenueClick = () => navigate('/admin?tab=orders');
  const handleOrdersClick = () => navigate('/admin?tab=orders');
  const handleCustomersClick = () => navigate('/admin?tab=customers');
  const handleProductsClick = () => navigate('/admin?tab=products');

  // Handle alert action
  const handleAlertAction = (alert: SystemAlert) => {
    if (alert.actionUrl) {
      navigate(alert.actionUrl);
    }
  };

  // Handle quick actions
  const handleExportReport = useCallback(async () => {
    const rows: (string | number)[][] = [
      ['Chỉ số', 'Giá trị'],
      ['Tổng doanh thu (đ)', stats.totalRevenue ?? 0],
      ['Doanh thu hôm nay (đ)', stats.todayRevenue ?? 0],
      ['Tổng đơn hàng', stats.totalOrders],
      ['Đơn hôm nay', stats.ordersToday],
      ['Đơn chờ xử lý', stats.pendingOrders],
      ['Đơn đã xác nhận', stats.confirmedOrders],
      ['Đơn đang giao', stats.shippingOrders],
      ['Đơn hoàn thành', stats.completedOrders],
      ['Đơn đã hủy', stats.cancelledOrders],
      ['Tổng khách hàng', stats.totalCustomers],
      ['Khách mới tuần này', stats.newCustomersThisWeek],
      ['Tổng sản phẩm', stats.totalProducts],
      ['Sản phẩm sắp hết hàng', stats.lowStockProducts],
      ['Đăng ký đang hoạt động', stats.activeSubscriptions],
      ['Tăng trưởng tháng (%)', stats.monthlyGrowth],
    ];
    const csv = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [stats]);

  const handleSendNotification = () => {
    navigate('/admin?tab=zalo');
  };

  const handleReminderSettings = () => {
    navigate('/admin?tab=zalo');
  };

  if (isLoading || overviewLoading) {
    return <DashboardSkeleton />;
  }

  // Order status breakdown using real per-status counts from API
  const orderBreakdown = [
    { label: 'Chờ xử lý',   value: stats.pendingOrders   || 0, color: '#fbbf24' },
    { label: 'Đã xác nhận', value: stats.confirmedOrders || 0, color: '#3b82f6' },
    { label: 'Đang giao',   value: stats.shippingOrders  || 0, color: '#a855f7' },
    { label: 'Hoàn thành',  value: stats.completedOrders || 0, color: '#10b981' },
    { label: 'Đã hủy',      value: stats.cancelledOrders || 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tổng quan hệ thống</h2>
          <p className="text-sm text-gray-500 mt-0.5">Dữ liệu được cập nhật theo thời gian thực</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={handleDateRangeChange} />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Doanh thu"
          value={`${(stats.totalRevenue ?? 0).toLocaleString('vi-VN')}đ`}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
          trend={{ value: stats.monthlyGrowth, isPositive: stats.monthlyGrowth >= 0 }}
          sparklineData={getRevenueSparkline(revenueData)}
          subtitle="so với kỳ trước"
          onClick={handleRevenueClick}
        />
        <StatsCard
          title="Đơn hàng"
          value={stats.totalOrders}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{ value: stats.monthlyGrowth, isPositive: stats.monthlyGrowth >= 0 }}
          sparklineData={getOrdersSparkline(ordersChart)}
          breakdown={orderBreakdown}
          onClick={handleOrdersClick}
        />
        <StatsCard
          title="Khách hàng"
          value={stats.totalCustomers}
          icon={Users}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{ value: stats.monthlyGrowth, isPositive: stats.monthlyGrowth >= 0 }}
          sparklineData={getOrdersSparkline(ordersChart)}
          subtitle={stats.newCustomersThisWeek > 0 ? `+${stats.newCustomersThisWeek} khách mới` : 'Không có khách mới'}
          onClick={handleCustomersClick}
        />
        <StatsCard
          title="Sản phẩm"
          value={totalProducts}
          icon={Package}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          subtitle={stats.lowStockProducts ? `${stats.lowStockProducts} sắp hết hàng` : 'Đang kinh doanh'}
          onClick={handleProductsClick}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Doanh thu {dateRangeLabel[dateRange]}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={activeRevenueData} />
          </CardContent>
        </Card>

        {/* Category Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Doanh thu theo danh mục</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <CategoryRevenueChart data={categoryRevenue} />
          </CardContent>
        </Card>
      </div>

      {/* Orders Chart + Alerts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Over Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Đơn hàng theo thời gian</CardTitle>
            <TrafficDateRangeFilter value={orderDateRange} onChange={handleOrderDateRangeChange} />
          </CardHeader>
          <CardContent>
            <OrdersChart data={ordersChart} />
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Thông báo hệ thống
            </CardTitle>
            {alerts.length > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                {unreadCount > 0 ? `${unreadCount} chưa đọc` : `${alerts.length} cảnh báo`}
              </span>
            )}
          </CardHeader>
          <CardContent>
            <AlertsPanel
              alerts={alerts}
              isLoading={alertsLoading}
              onAlertAction={handleAlertAction}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              unreadCount={unreadCount}
            />
          </CardContent>
        </Card>
      </div>

      {/* User Traffic Chart - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Lưu lượng truy cập người dùng
          </CardTitle>
          <TrafficDateRangeFilter value={trafficDateRange} onChange={handleTrafficDateRangeChange} />
        </CardHeader>
        <CardContent>
          <UserTrafficChart data={userTraffic} />
        </CardContent>
      </Card>

      {/* Bottom Section: Latest Orders, Top Products, Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Latest Orders */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Đơn hàng mới nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LatestOrdersTable orders={latestOrders} />
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-green-500" />
              Sản phẩm bán chạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsPanel products={topProducts} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              Hành động nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                className="w-full justify-start bg-primary-500 hover:bg-primary-600 text-white"
                onClick={handleExportReport}
              >
                <Download className="w-4 h-4 mr-3" />
                Xuất báo cáo
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSendNotification}
              >
                <Send className="w-4 h-4 mr-3" />
                Gửi thông báo
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleReminderSettings}
              >
                <Bell className="w-4 h-4 mr-3" />
                Cài đặt nhắc nhở Zalo
              </Button>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Tóm tắt nhanh</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Doanh thu hôm nay</span>
                  <span className="font-medium text-gray-900">
                    {(stats.todayRevenue ?? 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Đơn hôm nay</span>
                  <span className="font-medium text-gray-900">
                    {stats.ordersToday}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Khách mới tuần này</span>
                  <span className="font-medium text-primary-600">
                    +{stats.newCustomersThisWeek}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

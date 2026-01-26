import { useState, useCallback } from 'react';
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
import { useOverviewData } from '../../hooks/useOverviewData';

interface OverviewTabProps {
  stats: AdminStats;
  revenueData: RevenueData[];
  totalProducts: number;
  isLoading?: boolean;
}

// Generate sparkline data (simulated - replace with API data when available)
function generateSparkline(base: number, variance: number = 0.2): number[] {
  return Array.from({ length: 7 }, () =>
    Math.floor(base * (1 + (Math.random() - 0.5) * variance))
  );
}

// Mock alerts (replace with real notification system)
const generateMockAlerts = (stats: AdminStats): SystemAlert[] => {
  const alerts: SystemAlert[] = [];

  if (stats.lowStockProducts && stats.lowStockProducts > 0) {
    alerts.push({
      id: 'alert-low-stock',
      type: 'low_stock',
      severity: 'warning',
      title: `${stats.lowStockProducts} sản phẩm sắp hết hàng`,
      message: 'Một số sản phẩm có số lượng tồn kho thấp, cần bổ sung ngay.',
      timestamp: new Date().toISOString(),
      actionUrl: '/admin?tab=products',
      actionLabel: 'Xem sản phẩm',
    });
  }

  if (stats.pendingOrders && stats.pendingOrders > 0) {
    alerts.push({
      id: 'alert-pending-orders',
      type: 'pending_order',
      severity: 'info',
      title: `${stats.pendingOrders} đơn hàng chờ xử lý`,
      message: 'Có đơn hàng mới cần được xác nhận.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      actionUrl: '/admin?tab=orders',
      actionLabel: 'Xem đơn hàng',
    });
  }

  alerts.push({
    id: 'alert-review',
    type: 'new_review',
    severity: 'info',
    title: '5 đánh giá mới',
    message: 'Khách hàng đã để lại đánh giá cho sản phẩm.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actionUrl: '/admin?tab=reviews',
    actionLabel: 'Xem đánh giá',
  });

  return alerts;
};

export function OverviewTab({ stats, revenueData, totalProducts, isLoading = false }: OverviewTabProps) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [trafficDateRange, setTrafficDateRange] = useState<TrafficDateRange>('7d');
  const [orderDateRange, setOrderDateRange] = useState<TrafficDateRange>('7d');

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
  const handleExportReport = async () => {
    console.log('Exporting report for range:', dateRange);
    alert('Xuất báo cáo thành công! (Demo)');
  };

  const handleSendNotification = () => {
    console.log('Opening notification dialog');
  };

  const handleReminderSettings = () => {
    navigate('/admin?tab=zalo');
  };

  if (isLoading || overviewLoading) {
    return <DashboardSkeleton />;
  }

  // Generate mock alerts based on stats
  const alerts = generateMockAlerts(stats);

  // Calculate order status breakdown
  const orderBreakdown = [
    { label: 'Đang chờ', value: stats.pendingOrders || 0, color: '#fbbf24' },
    { label: 'Đã xác nhận', value: Math.floor(stats.totalOrders * 0.3), color: '#3b82f6' },
    { label: 'Đã giao', value: Math.floor(stats.totalOrders * 0.6), color: '#10b981' },
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
          value={`${stats.totalRevenue.toLocaleString('vi-VN')}đ`}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
          trend={{ value: stats.monthlyGrowth, isPositive: stats.monthlyGrowth >= 0 }}
          sparklineData={generateSparkline(stats.totalRevenue / 30)}
          subtitle="so với kỳ trước"
          onClick={handleRevenueClick}
        />
        <StatsCard
          title="Đơn hàng"
          value={stats.totalOrders}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{ value: 12.5, isPositive: true }}
          sparklineData={generateSparkline(stats.totalOrders / 7)}
          breakdown={orderBreakdown}
          onClick={handleOrdersClick}
        />
        <StatsCard
          title="Khách hàng"
          value={stats.totalCustomers}
          icon={Users}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{ value: 8.2, isPositive: true }}
          sparklineData={generateSparkline(stats.totalCustomers / 30)}
          subtitle={`+${Math.floor(stats.totalCustomers * 0.05)} khách mới`}
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
            <CardTitle className="text-lg font-semibold">Doanh thu 6 tháng gần nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
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
                {alerts.length} mới
              </span>
            )}
          </CardHeader>
          <CardContent>
            <AlertsPanel alerts={alerts} onAlertAction={handleAlertAction} />
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
                    {Math.floor(stats.totalRevenue / 30).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Đơn hôm nay</span>
                  <span className="font-medium text-gray-900">
                    {Math.floor(stats.totalOrders / 30)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Khách mới tuần này</span>
                  <span className="font-medium text-primary-600">
                    +{Math.floor(stats.totalCustomers * 0.02)}
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

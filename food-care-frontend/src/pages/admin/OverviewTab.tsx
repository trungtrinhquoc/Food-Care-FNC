import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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
import { RevenueChart } from '../../components/admin/RevenueChart';
import { OrdersChart, type OrderChartData } from '../../components/admin/OrdersChart';
import { TrafficChart, type TrafficSource } from '../../components/admin/TrafficChart';
import { LatestOrdersTable, type LatestOrder } from '../../components/admin/LatestOrdersTable';
import { TopProductsPanel, type TopProduct } from '../../components/admin/TopProductsPanel';
import { AlertsPanel, type SystemAlert } from '../../components/admin/AlertsPanel';
import { DashboardSkeleton } from '../../components/admin/DashboardSkeleton';
import type { AdminStats, RevenueData } from '../../types/admin';

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

// Mock data for orders chart (replace with API)
const mockOrdersData: OrderChartData[] = [
  { period: 'T2', pending: 12, confirmed: 8, delivered: 45, cancelled: 2, total: 67 },
  { period: 'T3', pending: 15, confirmed: 10, delivered: 52, cancelled: 3, total: 80 },
  { period: 'T4', pending: 8, confirmed: 12, delivered: 48, cancelled: 1, total: 69 },
  { period: 'T5', pending: 18, confirmed: 6, delivered: 55, cancelled: 4, total: 83 },
  { period: 'T6', pending: 10, confirmed: 15, delivered: 60, cancelled: 2, total: 87 },
  { period: 'T7', pending: 22, confirmed: 8, delivered: 65, cancelled: 3, total: 98 },
  { period: 'CN', pending: 14, confirmed: 10, delivered: 58, cancelled: 1, total: 83 },
];

// Mock traffic data (replace with API)
const mockTrafficData: TrafficSource[] = [
  { source: 'Tìm kiếm', sessions: 4520, users: 3200, color: '#10b981' },
  { source: 'Trực tiếp', sessions: 2890, users: 2100, color: '#3b82f6' },
  { source: 'Mạng xã hội', sessions: 1850, users: 1400, color: '#8b5cf6' },
  { source: 'Referral', sessions: 980, users: 750, color: '#f59e0b' },
  { source: 'Email', sessions: 420, users: 320, color: '#ef4444' },
];

// Mock latest orders (replace with API)
const mockLatestOrders: LatestOrder[] = [
  { id: 'ord-001234', customerName: 'Nguyễn Văn A', totalAmount: 450000, status: 'delivered', createdAt: new Date(Date.now() - 1800000).toISOString(), itemCount: 3 },
  { id: 'ord-001235', customerName: 'Trần Thị B', totalAmount: 280000, status: 'shipping', createdAt: new Date(Date.now() - 3600000).toISOString(), itemCount: 2 },
  { id: 'ord-001236', customerName: 'Lê Văn C', totalAmount: 750000, status: 'confirmed', createdAt: new Date(Date.now() - 7200000).toISOString(), itemCount: 5 },
  { id: 'ord-001237', customerName: 'Phạm Thị D', totalAmount: 120000, status: 'pending', createdAt: new Date(Date.now() - 14400000).toISOString(), itemCount: 1 },
  { id: 'ord-001238', customerName: 'Hoàng Văn E', totalAmount: 560000, status: 'delivered', createdAt: new Date(Date.now() - 28800000).toISOString(), itemCount: 4 },
];

// Mock top products (replace with API)
const mockTopProducts: TopProduct[] = [
  { productId: '1', productName: 'Rau cải xanh hữu cơ', totalSold: 245, revenue: 12250000, imageUrl: '' },
  { productId: '2', productName: 'Thịt gà ta nguyên con', totalSold: 189, revenue: 18900000, imageUrl: '' },
  { productId: '3', productName: 'Cá hồi tươi Na Uy', totalSold: 156, revenue: 31200000, imageUrl: '' },
  { productId: '4', productName: 'Trứng gà sạch (10 quả)', totalSold: 320, revenue: 9600000, imageUrl: '' },
  { productId: '5', productName: 'Sữa tươi Vinamilk 1L', totalSold: 280, revenue: 8400000, imageUrl: '' },
];

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

  // Handle date range change
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
    // TODO: Refetch data based on range
  }, []);

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

  if (isLoading) {
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

        {/* Traffic Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Nguồn truy cập</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <TrafficChart data={mockTrafficData} />
          </CardContent>
        </Card>
      </div>

      {/* Orders Chart + Alerts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Over Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Đơn hàng theo tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart data={mockOrdersData} />
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
            <AlertsPanel alerts={alerts} onAction={handleAlertAction} />
          </CardContent>
        </Card>
      </div>

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
            <LatestOrdersTable orders={mockLatestOrders} />
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
            <TopProductsPanel products={mockTopProducts} />
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

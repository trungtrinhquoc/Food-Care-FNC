import { useState } from 'react';
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  BarChart3,
  PieChart,
  Users,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Order } from '../../types/supplier';
import { toast } from 'sonner';

interface OperationalReportsTabProps {
  orders: Order[];
}

export function OperationalReportsTab({ orders }: OperationalReportsTabProps) {
  const [dateRange, setDateRange] = useState('7days');
  const [reportType, setReportType] = useState('overview');

  // Tính toán metrics
  const calculateMetrics = () => {
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const filteredOrders = orders.filter(
      (order) => new Date(order.createdAt) >= startDate
    );

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const confirmedOrders = filteredOrders.filter((o) => o.orderStatus !== 'new' && o.orderStatus !== 'cancelled').length;
    const cancelledOrders = filteredOrders.filter((o) => o.orderStatus === 'cancelled').length;
    const deliveredOrders = filteredOrders.filter((o) => o.orderStatus === 'delivered').length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const confirmationRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    const fulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    // Tính toán thời gian xử lý trung bình
    const processingTimes = filteredOrders
      .filter((o) => o.orderStatus === 'delivered')
      .map((o) => {
        const created = new Date(o.createdAt).getTime();
        const delivered = new Date().getTime(); // Mock
        return (delivered - created) / (1000 * 60 * 60); // hours
      });
    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
        : 0;

    // Phân tích theo giờ trong ngày
    const ordersByHour = new Array(24).fill(0);
    filteredOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      ordersByHour[hour]++;
    });

    const peakHour = ordersByHour.indexOf(Math.max(...ordersByHour));

    // Top sản phẩm bán chạy
    const productSales: Record<string, { count: number; revenue: number; name: string }> = {};
    filteredOrders.forEach((order) => {
      order.products.forEach((product) => {
        if (!productSales[product.id]) {
          productSales[product.id] = { count: 0, revenue: 0, name: product.name };
        }
        productSales[product.id].count += product.quantity;
        productSales[product.id].revenue += product.price * product.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      confirmationRate,
      cancellationRate,
      fulfillmentRate,
      avgProcessingTime,
      peakHour,
      topProducts,
      deliveredOrders,
      cancelledOrders,
      ordersByHour,
    };
  };

  const metrics = calculateMetrics();

  const handleExportReport = (type: string) => {
    // Mock export functionality
    toast.success(`Đang xuất báo cáo ${type}...`);
    console.log(`Exporting ${type} report for ${dateRange}`);
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today':
        return 'Hôm nay';
      case '7days':
        return '7 ngày qua';
      case '30days':
        return '30 ngày qua';
      case 'thisMonth':
        return 'Tháng này';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Báo cáo vận hành</h2>
            <p className="text-gray-600 mt-1">
              Phân tích hiệu suất và xu hướng kinh doanh
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
                <SelectItem value="thisMonth">Tháng này</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => handleExportReport('full')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <Badge variant="outline" className="text-blue-600">
              {getDateRangeLabel()}
            </Badge>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Tổng đơn hàng</h3>
          <p className="text-3xl font-bold mb-2">{metrics.totalOrders}</p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-500">so với kỳ trước</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <Badge variant="outline" className="text-green-600">
              {getDateRangeLabel()}
            </Badge>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Doanh thu</h3>
          <p className="text-3xl font-bold mb-2">
            {new Intl.NumberFormat('vi-VN', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(metrics.totalRevenue)}đ
          </p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">+18.2%</span>
            <span className="text-gray-500">so với kỳ trước</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <Badge variant="outline" className="text-purple-600">
              Tỷ lệ
            </Badge>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Hoàn thành đơn</h3>
          <p className="text-3xl font-bold mb-2">{metrics.fulfillmentRate.toFixed(1)}%</p>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500">
              {metrics.deliveredOrders}/{metrics.totalOrders} đơn đã giao
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <Badge variant="outline" className="text-orange-600">
              Trung bình
            </Badge>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Thời gian xử lý</h3>
          <p className="text-3xl font-bold mb-2">{metrics.avgProcessingTime.toFixed(1)}h</p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">-5.3%</span>
            <span className="text-gray-500">nhanh hơn</span>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Hiệu suất xử lý đơn</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tỷ lệ xác nhận</span>
                <span className="text-sm font-bold text-green-600">
                  {metrics.confirmationRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.confirmationRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tỷ lệ hoàn thành</span>
                <span className="text-sm font-bold text-blue-600">
                  {metrics.fulfillmentRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.fulfillmentRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tỷ lệ hủy đơn</span>
                <span className="text-sm font-bold text-red-600">
                  {metrics.cancellationRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.cancellationRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Giá trị đơn trung bình</span>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(metrics.avgOrderValue)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Top sản phẩm bán chạy</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {metrics.topProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
            ) : (
              metrics.topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Đã bán: {product.count} sản phẩm
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {new Intl.NumberFormat('vi-VN', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(product.revenue)}đ
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Time Analysis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Phân tích theo thời gian</h3>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h4 className="text-sm font-medium mb-4">Đơn hàng theo giờ trong ngày</h4>
            <div className="flex items-end gap-2 h-48">
              {metrics.ordersByHour.map((count, hour) => {
                const maxCount = Math.max(...metrics.ordersByHour, 1);
                const heightPercent = (count / maxCount) * 100;
                const isPeak = hour === metrics.peakHour;

                return (
                  <div
                    key={hour}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="relative w-full">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isPeak ? 'bg-blue-600' : 'bg-gray-300 hover:bg-blue-400'
                        }`}
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        title={`${hour}h: ${count} đơn`}
                      />
                      {count > 0 && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 rotate-0">
                      {hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Giờ cao điểm</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">
                {metrics.peakHour}:00 - {metrics.peakHour + 1}:00
              </p>
              <p className="text-sm text-blue-700">
                {metrics.ordersByHour[metrics.peakHour]} đơn hàng
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900">Khuyến nghị</span>
              </div>
              <p className="text-sm text-purple-700">
                Tăng cường nhân lực vào khung giờ {metrics.peakHour - 1}h - {metrics.peakHour + 2}h để xử lý đơn hàng hiệu quả hơn.
              </p>
            </div>

            <Button
              onClick={() => handleExportReport('time-analysis')}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất phân tích giờ
            </Button>
          </div>
        </div>
      </Card>

      {/* Issue Analysis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Phân tích vấn đề</h3>
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đơn hủy</p>
                <p className="text-2xl font-bold">{metrics.cancelledOrders}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Tỷ lệ: <span className="font-semibold">{metrics.cancellationRate.toFixed(1)}%</span>
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đơn trễ hạn</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o) => {
                    const hoursSince = (new Date().getTime() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60);
                    return o.orderStatus === 'new' && hoursSince > 2;
                  }).length}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Cần xử lý ngay
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Giao thành công</p>
                <p className="text-2xl font-bold">{metrics.deliveredOrders}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Tỷ lệ: <span className="font-semibold">{metrics.fulfillmentRate.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Xuất báo cáo chi tiết</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            onClick={() => handleExportReport('performance')}
            variant="outline"
            className="justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Hiệu suất
          </Button>
          <Button
            onClick={() => handleExportReport('products')}
            variant="outline"
            className="justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Sản phẩm
          </Button>
          <Button
            onClick={() => handleExportReport('revenue')}
            variant="outline"
            className="justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Doanh thu
          </Button>
          <Button
            onClick={() => handleExportReport('issues')}
            variant="outline"
            className="justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Vấn đề
          </Button>
        </div>
      </Card>
    </div>
  );
}

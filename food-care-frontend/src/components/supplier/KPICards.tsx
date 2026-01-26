import { TrendingUp, TrendingDown, Package, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import { KPIMetrics } from '../../types/supplier';

interface KPICardsProps {
  metrics: KPIMetrics;
}

export function KPICards({ metrics }: KPICardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <span
            className={`text-sm font-medium flex items-center gap-1 ${
              metrics.revenue.change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {metrics.revenue.change >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {formatPercent(metrics.revenue.change)}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">Doanh thu</p>
          <p className="text-2xl font-semibold">{formatCurrency(metrics.revenue.today)}</p>
          <p className="text-xs text-gray-500">Hôm nay</p>
          <p className="text-sm text-gray-700 mt-2">
            Tháng này: <span className="font-medium">{formatCurrency(metrics.revenue.month)}</span>
          </p>
        </div>
      </div>

      {/* Orders Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            {metrics.orders.new > 0 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                {metrics.orders.new} mới
              </span>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">Đơn hàng</p>
          <p className="text-2xl font-semibold">{metrics.orders.new + metrics.orders.processing + metrics.orders.shipping}</p>
          <p className="text-xs text-gray-500">Đang xử lý</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div>
              <span className="text-orange-600 font-medium">{metrics.orders.new}</span>
              <span className="text-gray-600 ml-1">Mới</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{metrics.orders.processing}</span>
              <span className="text-gray-600 ml-1">Đang chuẩn bị</span>
            </div>
            <div>
              <span className="text-purple-600 font-medium">{metrics.orders.shipping}</span>
              <span className="text-gray-600 ml-1">Đang giao</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          {metrics.products.outOfStock > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {metrics.products.outOfStock} hết hàng
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">Sản phẩm</p>
          <p className="text-2xl font-semibold">{metrics.products.active}</p>
          <p className="text-xs text-gray-500">Đang bán</p>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Còn hàng</span>
              <span className="font-medium text-emerald-600">{metrics.products.active}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Hết hàng</span>
              <span className="font-medium text-red-600">{metrics.products.outOfStock}</span>
            </div>
          </div>
        </div>
      </div>

      {/* On-time Rate Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <span
            className={`text-sm font-medium ${
              metrics.onTimeRate >= 95 ? 'text-green-600' : metrics.onTimeRate >= 90 ? 'text-yellow-600' : 'text-red-600'
            }`}
          >
            {metrics.onTimeRate >= 95 ? 'Xuất sắc' : metrics.onTimeRate >= 90 ? 'Tốt' : 'Cần cải thiện'}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">Tỷ lệ giao đúng hạn</p>
          <p className="text-2xl font-semibold">{metrics.onTimeRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">30 ngày qua</p>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  metrics.onTimeRate >= 95 ? 'bg-green-500' : metrics.onTimeRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.onTimeRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Mục tiêu: ≥ 95%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

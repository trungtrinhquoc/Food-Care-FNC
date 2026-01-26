import { useState } from 'react';
import { CheckCircle, Package, Clock, MapPin, Phone, Search, Filter } from 'lucide-react';
import { Order, OrderStatus } from '../../types/supplier';

interface DeliveryConfirmationTabProps {
  orders: Order[];
  onConfirmDelivery: (orderId: string, status: OrderStatus) => void;
}

export function DeliveryConfirmationTab({ orders, onConfirmDelivery }: DeliveryConfirmationTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'shipped' | 'delivered'>('shipped');

  // Filter orders that are shipped or delivered
  const deliveryOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.phone.includes(searchTerm);
    
    if (filterStatus === 'all') {
      return (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') && matchesSearch;
    }
    return order.orderStatus === filterStatus && matchesSearch;
  });

  const shippedCount = orders.filter(o => o.orderStatus === 'shipped').length;
  const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getTimeDifference = (date: string) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} ngày trước`;
    } else if (diffHours > 0) {
      return `${diffHours} giờ trước`;
    } else {
      return 'Mới đây';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-indigo-600">{shippedCount}</span>
          </div>
          <p className="text-sm text-indigo-700 font-medium">Đang giao hàng</p>
          <p className="text-xs text-indigo-600 mt-1">Chờ xác nhận giao thành công</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{deliveredCount}</span>
          </div>
          <p className="text-sm text-green-700 font-medium">Đã giao thành công</p>
          <p className="text-xs text-green-600 mt-1">Hôm nay</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">
              {deliveredCount > 0 ? '95%' : '0%'}
            </span>
          </div>
          <p className="text-sm text-blue-700 font-medium">Tỷ lệ giao đúng hạn</p>
          <p className="text-xs text-blue-600 mt-1">30 ngày qua</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đơn, tên hoặc SĐT khách hàng..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="shipped">Đang giao</option>
              <option value="delivered">Đã giao</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {deliveryOrders.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có đơn hàng</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào đang giao'}
            </p>
          </div>
        ) : (
          deliveryOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
                order.orderStatus === 'delivered' ? 'bg-green-50 border-green-200' : ''
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      order.orderStatus === 'shipped' 
                        ? 'bg-indigo-100' 
                        : 'bg-green-100'
                    }`}>
                      {order.orderStatus === 'shipped' ? (
                        <Package className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">#{order.id}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.orderStatus === 'shipped'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {order.orderStatus === 'shipped' ? 'Đang giao' : 'Đã giao'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {getTimeDifference(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{order.customer?.name}</p>
                        <p className="text-gray-600">
                          {order.shippingAddress?.street && order.shippingAddress?.ward
                            ? `${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}`
                            : 'Không có địa chỉ'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-gray-600">{order.customer?.phone}</p>
                    </div>
                  </div>

                  {order.shipping?.expectedDelivery && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-600">Dự kiến giao: {new Date(order.shipping.expectedDelivery).toLocaleString('vi-VN')}</p>
                    </div>
                  )}

                  {order.shipping?.trackingNumber && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm">
                      <span className="text-gray-600">Mã vận đơn:</span>
                      <span className="font-mono font-medium">{order.shipping.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {/* Order Summary & Actions */}
                <div className="flex flex-col items-end gap-3 min-w-[200px]">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Tổng tiền</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.products?.length || 0} sản phẩm
                    </p>
                  </div>

                  {order.orderStatus === 'shipped' && (
                    <button
                      onClick={() => onConfirmDelivery(order.id, 'delivered')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Xác nhận đã giao
                    </button>
                  )}

                  {order.orderStatus === 'delivered' && (
                    <div className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Đã hoàn thành
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {deliveryOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              Hiển thị {deliveryOrders.length} đơn hàng
            </span>
            <span className="text-blue-600 font-medium">
              Tổng giá trị: {formatCurrency(deliveryOrders.reduce((sum, o) => sum + o.totalAmount, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
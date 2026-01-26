import { X, Package, MapPin, Phone, Mail, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '../../types/supplier';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export function OrderDetailsModal({ order, isOpen, onClose, onUpdateStatus }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      new: 'bg-orange-100 text-orange-700',
      confirmed: 'bg-blue-100 text-blue-700',
      packed: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: OrderStatus) => {
    const texts = {
      new: 'Đơn mới',
      confirmed: 'Đã xác nhận',
      packed: 'Đã đóng gói',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const nextStatusOptions = {
    new: ['confirmed', 'cancelled'],
    confirmed: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  const canUpdateStatus = nextStatusOptions[order.orderStatus].length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Chi tiết đơn hàng #{order.id}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Trạng thái hiện tại</p>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                {getStatusText(order.orderStatus)}
              </span>
            </div>
            
            {canUpdateStatus && onUpdateStatus && (
              <div className="flex gap-2">
                {nextStatusOptions[order.orderStatus].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onUpdateStatus(order.id, status as OrderStatus);
                      onClose();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      status === 'cancelled'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {status === 'confirmed' && 'Xác nhận đơn'}
                    {status === 'packed' && 'Đã đóng gói'}
                    {status === 'shipped' && 'Giao hàng'}
                    {status === 'delivered' && 'Xác nhận giao thành công'}
                    {status === 'cancelled' && 'Hủy đơn'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tên khách hàng</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Số điện thoại
                </p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Địa chỉ giao hàng</p>
                <p className="font-medium">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Sản phẩm ({order.items.length} mặt hàng)
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Sản phẩm</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">Số lượng</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Đơn giá</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.variant && (
                            <p className="text-sm text-gray-600">{item.variant}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Tổng kết thanh toán</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          {order.deliveryTime && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Thời gian giao hàng
              </h3>
              <p className="text-sm">{order.deliveryTime}</p>
            </div>
          )}

          {/* Shipping Info */}
          {order.shippingInfo && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Thông tin vận chuyển
              </h3>
              <div className="space-y-1 text-sm">
                {order.shippingInfo.carrier && (
                  <p><span className="text-gray-600">Đơn vị:</span> {order.shippingInfo.carrier}</p>
                )}
                {order.shippingInfo.trackingNumber && (
                  <p><span className="text-gray-600">Mã vận đơn:</span> {order.shippingInfo.trackingNumber}</p>
                )}
                {order.shippingInfo.estimatedDelivery && (
                  <p><span className="text-gray-600">Dự kiến giao:</span> {order.shippingInfo.estimatedDelivery}</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Ghi chú</h3>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

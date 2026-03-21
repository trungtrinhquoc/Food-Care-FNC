import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Package, MapPin, Phone, Calendar, User, Truck, Clock } from 'lucide-react';
import type { OrderStatus } from '../../types/supplier';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
  order: {
    id?: string;
    orderId?: string;
    orderNumber?: string;
    createdAt: string;
    status?: OrderStatus;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    deliveryAddress?: string;
    items?: Array<{
      productName: string;
      quantity: number;
      price: number;
      variant?: string;
    }>;
    totalAmount?: number;
    subtotal?: number;
    shippingFee?: number;
    discount?: number;
    deliveryTime?: string;
    shippingInfo?: {
      carrier?: string;
      trackingNumber?: string;
      expectedDelivery?: string;
    };
    notes?: string;
    statusHistory?: Array<{
      status: string;
      changedAt: string;
      changedBy?: string;
      note?: string;
    }>;
  } | null;
}

export function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!order) return null;

  const items = order.items || [];
  const address = order.deliveryAddress || order.customerAddress || '';
  const subtotal = order.subtotal || order.totalAmount || 0;
  const shippingFee = order.shippingFee || 0;
  const discount = order.discount || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Chi tiết đơn hàng #{order.orderNumber || 'N/A'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Ngày đặt:</span>
              <span className="font-medium">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Trạng thái:</span>
              <Badge>{order.status || 'N/A'}</Badge>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Họ tên:</span>
                <span className="font-medium">{order.customerName || 'N/A'}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{order.customerPhone}</span>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>{address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          {order.shippingInfo && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Thông tin vận chuyển
              </h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {order.shippingInfo.carrier && (
                  <div>
                    <span className="text-gray-600">Đơn vị vận chuyển:</span>{' '}
                    <span className="font-medium">{order.shippingInfo.carrier}</span>
                  </div>
                )}
                {order.shippingInfo.trackingNumber && (
                  <div>
                    <span className="text-gray-600">Mã vận đơn:</span>{' '}
                    <span className="font-medium">{order.shippingInfo.trackingNumber}</span>
                  </div>
                )}
                {order.shippingInfo.expectedDelivery && (
                  <div>
                    <span className="text-gray-600">Dự kiến giao:</span>{' '}
                    <span className="font-medium">{formatDate(order.shippingInfo.expectedDelivery)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          {items.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Sản phẩm ({items.length})</h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {shippingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span>{formatCurrency(shippingFee)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-lg font-semibold">Tổng cộng</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(subtotal + shippingFee - discount)}
              </span>
            </div>
          </div>

          {/* Delivery Time */}
          {order.deliveryTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Thời gian giao hàng:</strong> {formatDate(order.deliveryTime)}
              </p>
            </div>
          )}

          {/* Status History Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4" />
                Lịch sử trạng thái
              </h3>
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {order.statusHistory.map((entry, idx) => (
                    <div key={idx} className="flex gap-3 relative">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 z-10 ${
                        idx === 0 ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{entry.status}</span>
                          <span className="text-xs text-gray-400">{formatDate(entry.changedAt)}</span>
                        </div>
                        {entry.changedBy && (
                          <p className="text-xs text-gray-500 mt-0.5">Bởi: {entry.changedBy}</p>
                        )}
                        {entry.note && (
                          <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Ghi chú:</strong> {order.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

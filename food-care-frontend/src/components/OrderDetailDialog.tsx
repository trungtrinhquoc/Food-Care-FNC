import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  Package,
  MapPin,
  Phone,
  CreditCard,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { ProviderOrder } from '../types';

interface OrderDetailDialogProps {
  order: ProviderOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onStatusChange,
}: OrderDetailDialogProps) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      accepted: 'bg-blue-100 text-blue-800 border-blue-300',
      preparing: 'bg-purple-100 text-purple-800 border-purple-300',
      ready_to_ship: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      shipping: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      accepted: 'Đã nhận',
      preparing: 'Đang chuẩn bị',
      ready_to_ship: 'Sẵn sàng giao',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const renderActionButtons = () => {
    if (!onStatusChange) return null;

    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => onStatusChange(order.id, 'accepted')}
              className="flex-1"
            >
              <CheckCircle className="size-4 mr-2" />
              Nhận đơn hàng
            </Button>
            <Button
              onClick={() => onStatusChange(order.id, 'cancelled')}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="size-4 mr-2" />
              Từ chối
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <Button
            onClick={() => onStatusChange(order.id, 'preparing')}
            className="w-full"
          >
            <Package className="size-4 mr-2" />
            Bắt đầu chuẩn bị
          </Button>
        );
      case 'preparing':
        return (
          <Button
            onClick={() => onStatusChange(order.id, 'ready_to_ship')}
            className="w-full"
          >
            <CheckCircle className="size-4 mr-2" />
            Đã chuẩn bị xong
          </Button>
        );
      case 'ready_to_ship':
        return (
          <Button
            onClick={() => onStatusChange(order.id, 'shipping')}
            className="w-full"
          >
            <Truck className="size-4 mr-2" />
            Bàn giao shipper
          </Button>
        );
      case 'shipping':
        return (
          <Button
            onClick={() => onStatusChange(order.id, 'delivered')}
            className="w-full"
            variant="default"
          >
            <CheckCircle className="size-4 mr-2" />
            Xác nhận đã giao
          </Button>
        );
      default:
        return null;
    }
  };

  const timeRemaining = new Date(order.slaDeadline).getTime() - new Date().getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Chi tiết đơn hàng #{order.orderNumber}</span>
            <Badge className={`${getStatusColor(order.status)} border`}>
              {getStatusLabel(order.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Đặt lúc: {new Date(order.date).toLocaleString('vi-VN')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* SLA Warning */}
          {!['delivered', 'cancelled'].includes(order.status) && (
            <div
              className={`p-4 rounded-lg border ${
                order.isOverdue
                  ? 'bg-red-50 border-red-200'
                  : timeRemaining < 2 * 60 * 60 * 1000
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock
                  className={`size-5 ${
                    order.isOverdue
                      ? 'text-red-600'
                      : timeRemaining < 2 * 60 * 60 * 1000
                      ? 'text-orange-600'
                      : 'text-blue-600'
                  }`}
                />
                <div>
                  <div className="font-medium">
                    {order.isOverdue ? '⚠️ Đã quá hạn xử lý!' : 'Thời gian còn lại'}
                  </div>
                  <div className="text-sm">
                    Deadline: {new Date(order.slaDeadline).toLocaleTimeString('vi-VN')} (
                    {order.isOverdue
                      ? 'Quá hạn'
                      : `Còn ${hoursRemaining}h ${minutesRemaining}m`}
                    )
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="size-4" />
              Thông tin khách hàng
            </h3>
            <div className="grid gap-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Tên khách hàng:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số điện thoại:</span>
                <span className="font-medium">{order.customerPhone}</span>
              </div>
              {order.customerNote && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start gap-2">
                    <FileText className="size-4 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-yellow-800">Ghi chú:</div>
                      <div className="text-sm text-yellow-700">{order.customerNote}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="size-4" />
              Địa chỉ giao hàng
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
              <p className="text-sm mt-2">
                {order.shippingAddress.address}, {order.shippingAddress.district},{' '}
                {order.shippingAddress.city}
              </p>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="size-4" />
              Sản phẩm ({order.items.length})
            </h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 border rounded-lg">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="size-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-sm text-gray-600">{item.product.unit}</div>
                    <div className="text-sm mt-1">
                      Số lượng: <span className="font-medium">x{item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.price.toLocaleString('vi-VN')}đ</div>
                    <div className="text-sm text-gray-600">
                      Tổng: {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="size-4" />
              Thanh toán
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="text-green-600">-{order.discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span>{order.shipping.toLocaleString('vi-VN')}đ</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Tổng cộng:</span>
                <span className="text-teal-600">{order.total.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="text-sm text-gray-600">
                Phương thức: {order.paymentMethod.name}
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold">Trạng thái đơn hàng</h3>
            <div className="relative pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              {[
                { status: 'pending', label: 'Chờ xác nhận', time: order.date },
                {
                  status: 'accepted',
                  label: 'Đã nhận đơn',
                  time: order.status !== 'pending' ? order.date : null,
                },
                {
                  status: 'preparing',
                  label: 'Đang chuẩn bị',
                  time: order.preparedAt || null,
                },
                {
                  status: 'ready_to_ship',
                  label: 'Sẵn sàng giao',
                  time: null,
                },
                {
                  status: 'shipping',
                  label: 'Đang giao hàng',
                  time: order.shippedAt || null,
                },
                {
                  status: 'delivered',
                  label: 'Đã giao hàng',
                  time: null,
                },
              ].map((step, index) => {
                const statuses = [
                  'pending',
                  'accepted',
                  'preparing',
                  'ready_to_ship',
                  'shipping',
                  'delivered',
                ];
                const currentIndex = statuses.indexOf(order.status);
                const stepIndex = statuses.indexOf(step.status);
                const isActive = stepIndex === currentIndex;
                const isCompleted = stepIndex < currentIndex;
                const isCancelled = order.status === 'cancelled' && step.status === 'pending';

                return (
                  <div key={index} className="relative pb-4">
                    <div
                      className={`absolute left-[-1.625rem] size-5 rounded-full border-2 ${
                        isActive
                          ? 'bg-teal-500 border-teal-500'
                          : isCompleted || isCancelled
                          ? 'bg-green-500 border-green-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {(isCompleted || isCancelled) && (
                        <CheckCircle className="size-4 text-white" />
                      )}
                    </div>
                    <div className={isActive ? 'font-medium' : 'text-gray-600'}>
                      {step.label}
                      {step.time && (
                        <span className="text-xs ml-2 text-gray-500">
                          {new Date(step.time).toLocaleTimeString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {order.status === 'cancelled' && (
                <div className="relative pb-4">
                  <div className="absolute left-[-1.625rem] size-5 rounded-full bg-red-500 border-2 border-red-500">
                    <XCircle className="size-4 text-white" />
                  </div>
                  <div className="font-medium text-red-600">Đơn hàng đã bị hủy</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {renderActionButtons()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

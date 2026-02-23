import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from './Button';
import { Label } from '../ui/label';
import { Truck } from 'lucide-react';
import { OrderStatusBadge } from '../ui/status-badge';
import type { AdminOrder } from '../../types/admin';

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: AdminOrder | null;
}

export function OrderDetailDialog({ open, onOpenChange, order }: OrderDetailDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn hàng</DialogTitle>
          <DialogDescription>Thông tin chi tiết về đơn hàng {order.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Mã đơn hàng</Label>
              <p className="font-mono">{order.id}</p>
            </div>
            <div>
              <Label className="text-gray-500">Ngày đặt</Label>
              <p>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
          <div>
            <Label className="text-gray-500">Khách hàng</Label>
            <p>{order.customerName}</p>
            <p className="text-sm text-gray-500">{order.customerEmail}</p>
          </div>
          <div>
            <Label className="text-gray-500">Địa chỉ giao hàng</Label>
            <p>{order.shippingAddressSnapshot || 'Chưa có địa chỉ'}</p>
          </div>
          <div>
            <Label className="text-gray-500">Sản phẩm</Label>
            <div className="mt-2 space-y-2">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{item.productName} x{item.quantity}</span>
                  <span className="text-gray-600">{item.totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Trạng thái</Label>
              <div className="mt-1">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Tổng tiền</Label>
              <p className="text-xl font-bold text-emerald-600">
                {order.totalAmount.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>
          {order.note && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                📝 Ghi chú: {order.note}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Truck className="w-4 h-4 mr-2" />
            Xử lý giao hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

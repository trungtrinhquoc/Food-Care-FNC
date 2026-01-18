import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { AdminOrder, OrderStatus } from '../types/admin';

export function useOrders(initialOrders: AdminOrder[]) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const viewOrderDetail = useCallback((order: AdminOrder) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  }, []);

  const closeOrderDialog = useCallback(() => {
    setIsOrderDialogOpen(false);
    setSelectedOrder(null);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    toast.success('Đã cập nhật trạng thái đơn hàng');
  }, [orders]);

  return {
    orders,
    isOrderDialogOpen,
    selectedOrder,
    viewOrderDetail,
    closeOrderDialog,
    updateOrderStatus,
  };
}

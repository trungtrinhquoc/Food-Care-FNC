import { useState } from 'react';
import {
  CheckCircle,
  Package,
  Truck,
  XCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Clock,
  Eye,
  Printer,
  MoreHorizontal,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/supplier';
import { ShippingTrackingDialog } from './ShippingTrackingDialog';
import { OrderDetailsModal } from './OrderDetailsModal';

interface OrderManagementPanelProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onAddShipping: (orderId: string, shippingInfo: any) => void;
}

export function OrderManagementPanel({
  orders,
  onUpdateStatus,
  onCancelOrder,
  onAddShipping,
}: OrderManagementPanelProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [shippingDialogOrder, setShippingDialogOrder] = useState<Order | null>(null);
  const [detailsModalOrder, setDetailsModalOrder] = useState<Order | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    const configs = {
      new: {
        label: 'Mới',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        dotColor: 'bg-orange-500',
      },
      confirmed: {
        label: 'Đã xác nhận',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
      },
      packed: {
        label: 'Đã đóng gói',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500',
      },
      shipped: {
        label: 'Đang giao',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-500',
      },
      delivered: {
        label: 'Đã giao',
        color: 'bg-green-100 text-green-700 border-green-200',
        dotColor: 'bg-green-500',
      },
      cancelled: {
        label: 'Đã hủy',
        color: 'bg-red-100 text-red-700 border-red-200',
        dotColor: 'bg-red-500',
      },
    };
    return configs[status];
  };

  const getPaymentStatusConfig = (status: string) => {
    const configs = {
      paid: { label: 'Đã thanh toán', color: 'text-green-600' },
      pending: { label: 'Chờ thanh toán', color: 'text-yellow-600' },
      refunded: { label: 'Đã hoàn tiền', color: 'text-gray-600' },
    };
    return configs[status as keyof typeof configs];
  };

  const getNextAction = (status: OrderStatus) => {
    const actions = {
      new: { label: 'Xác nhận đơn', action: 'confirmed', icon: CheckCircle, color: 'bg-blue-600 hover:bg-blue-700' },
      confirmed: { label: 'Đánh dấu đã đóng gói', action: 'packed', icon: Package, color: 'bg-purple-600 hover:bg-purple-700' },
      packed: { label: 'Thêm thông tin vận chuyển', action: 'shipped', icon: Truck, color: 'bg-indigo-600 hover:bg-indigo-700' },
      shipped: { label: 'Xem tracking', action: 'view', icon: Eye, color: 'bg-gray-600 hover:bg-gray-700' },
      delivered: { label: 'Hoàn tất', action: 'none', icon: CheckCircle, color: 'bg-green-600' },
      cancelled: { label: 'Đã hủy', action: 'none', icon: XCircle, color: 'bg-red-600' },
    };
    return actions[status];
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleBulkConfirm = () => {
    selectedOrders.forEach((orderId) => {
      const order = orders.find((o) => o.id === orderId);
      if (order && order.orderStatus === 'new') {
        onUpdateStatus(orderId, 'confirmed');
      }
    });
    setSelectedOrders(new Set());
  };

  const handleActionClick = (order: Order) => {
    const nextAction = getNextAction(order.orderStatus);
    if (nextAction.action === 'view') {
      setShippingDialogOrder(order);
    } else if (nextAction.action === 'shipped') {
      setShippingDialogOrder(order);
    } else if (nextAction.action !== 'none') {
      onUpdateStatus(order.id, nextAction.action as OrderStatus);
    }
  };

  const filteredOrders = orders
    .filter((order) => filterStatus === 'all' || order.orderStatus === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return b.totalAmount - a.totalAmount;
      }
    });

  const getUrgencyLevel = (order: Order) => {
    const hoursSinceCreated = (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    
    if (order.orderStatus === 'new' && hoursSinceCreated > 4) {
      return 'critical';
    } else if (order.orderStatus === 'new' && hoursSinceCreated > 2) {
      return 'high';
    } else if (order.orderStatus === 'packed' && hoursSinceCreated > 6) {
      return 'high';
    }
    return 'normal';
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* Header with filters and bulk actions */}
      <div className="p-4 border-b">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Quản lý đơn hàng</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredOrders.length} đơn hàng
              {selectedOrders.size > 0 && ` • ${selectedOrders.size} đã chọn`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="new">Mới</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="packed">Đã đóng gói</option>
              <option value="shipped">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'amount')}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="amount">Giá trị cao</option>
            </select>

            {/* Bulk actions */}
            {selectedOrders.size > 0 && (
              <button
                onClick={handleBulkConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Xác nhận {selectedOrders.size} đơn
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="divide-y">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Không có đơn hàng nào</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const statusConfig = getStatusConfig(order.orderStatus);
            const paymentConfig = getPaymentStatusConfig(order.paymentStatus);
            const nextAction = getNextAction(order.orderStatus);
            const urgency = getUrgencyLevel(order);

            return (
              <div
                key={order.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  urgency === 'critical' ? 'bg-red-50 border-l-4 border-l-red-500' : urgency === 'high' ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Order content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      {/* Left side - Order info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            className="font-semibold text-blue-600 hover:text-blue-700 text-left"
                          >
                            {order.orderNumber}
                          </button>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${statusConfig.dotColor}`} />
                            {statusConfig.label}
                          </span>
                          <span className={`text-xs font-medium ${paymentConfig.color}`}>
                            {paymentConfig.label}
                          </span>
                          {urgency !== 'normal' && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${urgency === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {urgency === 'critical' ? 'Khẩn cấp!' : 'Cần xử lý'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{order.customer.name}</span>
                            <span>•</span>
                            <span>{order.customer.phone}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">
                              {order.shippingAddress.street}, {order.shippingAddress.ward}, {order.shippingAddress.district}
                            </span>
                          </div>
                        </div>

                        {/* Products preview */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {order.products.slice(0, 3).map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-xs"
                            >
                              {product.image && (
                                <img src={product.image} alt="" className="w-6 h-6 rounded object-cover" />
                              )}
                              <span className="font-medium">{product.name}</span>
                              <span className="text-gray-600">x{product.quantity}</span>
                            </div>
                          ))}
                          {order.products.length > 3 && (
                            <span className="text-xs text-gray-600">+{order.products.length - 3} sản phẩm</span>
                          )}
                        </div>
                      </div>

                      {/* Right side - Amount and actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-xs text-gray-600">{order.products.length} sản phẩm</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {nextAction.action !== 'none' && (
                            <button
                              onClick={() => handleActionClick(order)}
                              className={`px-4 py-2 ${nextAction.color} text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2`}
                            >
                              <nextAction.icon className="w-4 h-4" />
                              {nextAction.label}
                            </button>
                          )}

                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            )}
                          </button>

                          <button
                            onClick={() => setDetailsModalOrder(order)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <MoreHorizontal className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {/* Full product list */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Chi tiết sản phẩm</h4>
                          <div className="space-y-2">
                            {order.products.map((product) => (
                              <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                  {product.image && (
                                    <img src={product.image} alt="" className="w-12 h-12 rounded object-cover" />
                                  )}
                                  <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-gray-600">Số lượng: {product.quantity}</p>
                                  </div>
                                </div>
                                <p className="font-medium">{formatCurrency(product.price * product.quantity)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Full shipping address */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Địa chỉ giao hàng</h4>
                          <div className="p-3 bg-gray-50 rounded text-sm">
                            <p className="font-medium">{order.customer.name}</p>
                            <p className="text-gray-700">{order.customer.phone}</p>
                            <p className="text-gray-700 mt-1">
                              {order.shippingAddress.street}, {order.shippingAddress.ward},<br />
                              {order.shippingAddress.district}, {order.shippingAddress.city}
                            </p>
                          </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Ghi chú</h4>
                            <p className="text-sm text-gray-700 p-3 bg-yellow-50 rounded border border-yellow-200">
                              {order.notes}
                            </p>
                          </div>
                        )}

                        {/* Shipping info */}
                        {order.shipping && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Thông tin vận chuyển</h4>
                            <div className="p-3 bg-blue-50 rounded text-sm space-y-1">
                              <p><span className="font-medium">Đơn vị vận chuyển:</span> {order.shipping.carrier}</p>
                              <p><span className="font-medium">Mã vận đơn:</span> {order.shipping.trackingNumber}</p>
                              {order.shipping.expectedDelivery && (
                                <p><span className="font-medium">Dự kiến giao:</span> {new Date(order.shipping.expectedDelivery).toLocaleString('vi-VN')}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <Printer className="w-4 h-4" />
                            In phiếu giao
                          </button>
                          {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                            <button
                              onClick={() => {
                                const reason = prompt('Lý do hủy đơn:');
                                if (reason) {
                                  onCancelOrder(order.id, reason);
                                }
                              }}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Hủy đơn hàng
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Shipping tracking dialog */}
      {shippingDialogOrder && (
        <ShippingTrackingDialog
          order={shippingDialogOrder}
          onClose={() => setShippingDialogOrder(null)}
          onSave={(shippingInfo) => {
            onAddShipping(shippingDialogOrder.id, shippingInfo);
            setShippingDialogOrder(null);
          }}
        />
      )}

      {/* Order details modal */}
      {detailsModalOrder && (
        <OrderDetailsModal
          order={{
            ...detailsModalOrder,
            customerName: detailsModalOrder.customer.name,
            customerPhone: detailsModalOrder.customer.phone,
            deliveryAddress: `${detailsModalOrder.shippingAddress.street}, ${detailsModalOrder.shippingAddress.ward}, ${detailsModalOrder.shippingAddress.district}, ${detailsModalOrder.shippingAddress.city}`,
            items: detailsModalOrder.products.map(p => ({
              productName: p.name,
              quantity: p.quantity,
              price: p.price,
              variant: undefined
            })),
            subtotal: detailsModalOrder.totalAmount,
            shippingFee: 0,
            discount: 0,
            deliveryTime: detailsModalOrder.shipping?.expectedDelivery,
            shippingInfo: detailsModalOrder.shipping,
            notes: detailsModalOrder.notes,
          } as any}
          isOpen={true}
          onClose={() => setDetailsModalOrder(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
}
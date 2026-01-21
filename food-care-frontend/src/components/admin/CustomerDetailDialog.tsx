import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from './Button';
import { TierBadge } from '../ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  CreditCard,
  Star,
  RefreshCw,
  Clock,
  Package,
  User,
  Edit,
  Loader2,
  LogIn,
  MessageSquare,
  Coins,
  Receipt,
} from 'lucide-react';

// Types
import type {
  MemberTier,
  AdminUser,
  RecentOrder,
  OrderLog,
  LoginLog,
  PaymentLog,
  ReviewLog,
  PointLog,
} from '../../types/admin';

// Services
import { customersService, customerLogsService } from '../../services/admin';

// Constants
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  getOrderStatusColor,
  getOrderStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../../constants/admin';

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  onEdit?: () => void;
}

export function CustomerDetailDialog({
  open,
  onOpenChange,
  customerId,
  onEdit,
}: CustomerDetailDialogProps) {
  const [customer, setCustomer] = useState<AdminUser | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Log states
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchCustomerDetail = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    try {
      const customerData = await customersService.getCustomerById(customerId);
      setCustomer(customerData);

      // Fetch recent orders
      const orders = await customersService.getCustomerRecentOrders(customerId, 5);
      setRecentOrders(orders);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Fetch logs based on active tab
  const fetchLogs = useCallback(async (tab: string) => {
    if (!customerId) return;
    
    setLogsLoading(true);
    try {
      switch (tab) {
        case 'orders':
          setOrderLogs(await customerLogsService.getCustomerOrders(customerId));
          break;
        case 'logins':
          setLoginLogs(await customerLogsService.getCustomerLoginLogs(customerId));
          break;
        case 'payments':
          setPaymentLogs(await customerLogsService.getCustomerPaymentLogs(customerId));
          break;
        case 'reviews':
          setReviewLogs(await customerLogsService.getCustomerReviewLogs(customerId));
          break;
        case 'points':
          setPointLogs(await customerLogsService.getCustomerPointsLogs(customerId));
          break;
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (open && customerId && activeTab !== 'overview') {
      fetchLogs(activeTab);
    }
  }, [open, customerId, activeTab, fetchLogs]);

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetail();
      setActiveTab('overview');
    }
  }, [open, customerId, fetchCustomerDetail]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (!customerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Chi tiết khách hàng
          </DialogTitle>
          <DialogDescription>
            Xem thông tin chi tiết và lịch sử hoạt động của khách hàng
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : customer ? (
          <div className="space-y-4">
            {/* Header: Avatar + Basic Info */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
              <div className="relative">
                {customer.avatarUrl ? (
                  <img
                    src={customer.avatarUrl}
                    alt={customer.fullName || 'Avatar'}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg">
                    {customer.fullName?.charAt(0)?.toUpperCase() ||
                      customer.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                    customer.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {customer.fullName || 'Chưa cập nhật tên'}
                  </h3>
                  <TierBadge tier={(customer.tierName || 'Bronze') as MemberTier} />
                </div>
                <div className="mt-1 space-y-0.5 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{customer.email}</span>
                  </div>
                  {customer.phoneNumber && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{customer.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
              )}
            </div>

            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-xl font-bold text-blue-700">{customer.totalOrders}</div>
                <div className="text-xs text-blue-600">Đơn hàng</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <div className="text-sm font-bold text-emerald-700">{formatCurrency(customer.totalSpent)}</div>
                <div className="text-xs text-emerald-600">Chi tiêu</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <div className="text-xl font-bold text-amber-700">{customer.loyaltyPoints}</div>
                <div className="text-xs text-amber-600">Điểm</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-700">{customer.totalReviews}</div>
                <div className="text-xs text-purple-600">Đánh giá</div>
              </div>
            </div>

            {/* Tabs for Logs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="text-xs">
                  <User className="h-3.5 w-3.5 mr-1" />
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger value="orders" className="text-xs">
                  <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                  Mua hàng
                </TabsTrigger>
                <TabsTrigger value="logins" className="text-xs">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Đăng nhập
                </TabsTrigger>
                <TabsTrigger value="payments" className="text-xs">
                  <Receipt className="h-3.5 w-3.5 mr-1" />
                  Thanh toán
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  Đánh giá
                </TabsTrigger>
                <TabsTrigger value="points" className="text-xs">
                  <Coins className="h-3.5 w-3.5 mr-1" />
                  Tích điểm
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Subscription Info */}
                {customer.activeSubscriptions > 0 && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-700 text-sm">
                      <RefreshCw className="h-4 w-4" />
                      <span className="font-medium">
                        {customer.activeSubscriptions} gói đăng ký đang hoạt động
                      </span>
                    </div>
                  </div>
                )}

                {/* Account Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Ngày tham gia
                    </div>
                    <div className="font-medium text-sm">{formatDate(customer.createdAt)}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      Đăng nhập gần nhất
                    </div>
                    <div className="font-medium text-sm">{formatDate(customer.lastLoginAt)}</div>
                  </div>
                </div>

                {/* Recent Orders */}
                {recentOrders.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      Đơn hàng gần đây
                    </h4>
                    <div className="space-y-2">
                      {recentOrders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{String(order.id).slice(0, 8)}</span>
                            <span className="text-gray-500">{formatShortDate(order.orderDate)}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </div>
                          <span className="font-medium text-emerald-600">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm">Trạng thái tài khoản</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {customer.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                  </span>
                </div>
              </TabsContent>

              {/* Orders Log Tab */}
              <TabsContent value="orders" className="mt-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    </div>
                  ) : orderLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      Chưa có đơn hàng nào
                    </div>
                  ) : (
                    orderLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-sm">Đơn #{String(log.id).slice(0, 8)}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOrderStatusColor(log.status)}`}>
                              {getOrderStatusLabel(log.status)}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentStatusColor(log.paymentStatus)}`}>
                              {getPaymentStatusLabel(log.paymentStatus)}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600">{formatCurrency(log.totalAmount)}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                          <span>{formatDate(log.orderDate)}</span>
                          <span>{log.itemCount} sản phẩm</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Login Log Tab */}
              <TabsContent value="logins" className="mt-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    </div>
                  ) : loginLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <LogIn className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>Chưa có dữ liệu log đăng nhập</p>
                    </div>
                  ) : (
                    loginLogs.map((log) => (
                      <div key={log.id} className={`p-3 rounded-lg ${log.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <LogIn className={`h-4 w-4 ${log.success ? 'text-green-500' : 'text-red-500'}`} />
                            <span className="font-medium text-sm">{log.device}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {log.success ? 'Thành công' : 'Thất bại'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{log.ipAddress}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                          <span>{formatDate(log.loginAt)}</span>
                          <span>{log.location}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Payment Log Tab */}
              <TabsContent value="payments" className="mt-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    </div>
                  ) : paymentLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <Receipt className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      Chưa có thanh toán nào
                    </div>
                  ) : (
                    paymentLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium text-sm">{log.transactionId}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentStatusColor(log.status)}`}>
                              {getPaymentStatusLabel(log.status)}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600">{formatCurrency(log.amount)}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                          <span>{formatDate(log.paidAt)}</span>
                          <span>Đơn #{String(log.orderId).slice(0, 8)}</span>
                          <span>{log.paymentMethod}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Review Log Tab */}
              <TabsContent value="reviews" className="mt-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    </div>
                  ) : reviewLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      Chưa có đánh giá nào
                    </div>
                  ) : (
                    reviewLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.productName}</span>
                            {log.isVerified && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Đã mua
                              </span>
                            )}
                          </div>
                          <div className="flex">{renderStars(log.rating)}</div>
                        </div>
                        {log.comment && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{log.comment}</p>
                        )}
                        <div className="mt-1 text-xs text-gray-500">{formatDate(log.createdAt)}</div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Points Log Tab */}
              <TabsContent value="points" className="mt-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    </div>
                  ) : pointLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <Coins className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>Chưa có dữ liệu lịch sử tích điểm</p>
                    </div>
                  ) : (
                    pointLogs.map((log) => (
                      <div key={log.id} className={`p-3 rounded-lg ${log.type === 'earn' ? 'bg-green-50' : 'bg-orange-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className={`h-4 w-4 ${log.type === 'earn' ? 'text-green-500' : 'text-orange-500'}`} />
                            <span className="font-medium text-sm">{log.description}</span>
                          </div>
                          <span className={`font-bold ${log.type === 'earn' ? 'text-green-600' : 'text-orange-600'}`}>
                            {log.type === 'earn' ? '+' : ''}{log.points} điểm
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                          <span>{formatDate(log.createdAt)}</span>
                          {log.orderId && <span>Đơn #{String(log.orderId).slice(0, 8)}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy thông tin khách hàng
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

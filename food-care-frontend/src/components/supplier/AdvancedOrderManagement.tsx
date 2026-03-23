import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Package,
  Truck,
  AlertTriangle,
  Clock,
  Eye,
  Printer,
  Download,
  RefreshCw,
  Filter,
  Search,
  MoreVertical,
  ChevronDown,
  CheckSquare,
  Square,
  MapPin,
  Phone,
  Calendar,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Archive,
  RotateCcw,
  Send,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types/supplier';
import { OrderDetailsModal } from './OrderDetailsModal';
import { ShippingTrackingDialog } from './ShippingTrackingDialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Card } from '../ui/card';
import { toast } from 'sonner';

interface AdvancedOrderManagementProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onAddShipping: (orderId: string, trackingNumber: string, carrier: string) => void;
}

interface IssueReport {
  id: string;
  orderId: string;
  type: 'damaged' | 'missing' | 'wrong_address' | 'customer_unavailable' | 'other';
  description: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export function AdvancedOrderManagement({
  orders,
  onUpdateStatus,
  onCancelOrder,
  onAddShipping,
}: AdvancedOrderManagementProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'critical' | 'high' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'sla' | 'amount'>('newest');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<Order | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState<string | null>(null);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [showIssueDialog, setShowIssueDialog] = useState<string | null>(null);

  // Tính toán SLA deadline (Service Level Agreement)
  const calculateSLA = (order: Order) => {
    const createdTime = new Date(order.createdAt).getTime();
    const now = new Date().getTime();
    const hoursPassed = (now - createdTime) / (1000 * 60 * 60);
    
    // SLA rules:
    // - Xác nhận đơn hàng: 2 giờ
    // - Đóng gói: 4 giờ từ khi xác nhận
    // - Bàn giao vận chuyển: 6 giờ từ khi đóng gói
    
    let slaHours = 0;
    if (order.status === 'new') slaHours = 2;
    else if (order.status === 'confirmed') slaHours = 4;
    else if (order.status === 'packed') slaHours = 6;
    
    const remainingHours = slaHours - hoursPassed;
    const isOverdue = remainingHours < 0;
    const isUrgent = remainingHours < 0.5 && remainingHours > 0;
    
    return {
      remainingHours,
      isOverdue,
      isUrgent,
      urgencyLevel: isOverdue ? 'critical' : isUrgent ? 'high' : 'normal',
    };
  };

  // Lọc và sắp xếp đơn hàng
  const filteredOrders = orders
    .filter((order) => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;
      if (filterUrgency !== 'all') {
        const sla = calculateSLA(order);
        if (sla.urgencyLevel !== filterUrgency) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (order.orderNumber?.toLowerCase().includes(query) || false) ||
          (order.customer?.name?.toLowerCase().includes(query) || false) ||
          (order.customer?.phone?.includes(query) || false) ||
          (order.customerName?.toLowerCase().includes(query) || false) ||
          (order.customerPhone?.includes(query) || false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'sla') {
        const slaA = calculateSLA(a);
        const slaB = calculateSLA(b);
        return slaA.remainingHours - slaB.remainingHours;
      } else {
        return b.totalAmount - a.totalAmount;
      }
    });

  // Chức năng 1: Xác nhận/Từ chối đơn hàng với SLA warning
  const handleAcceptOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    const sla = order ? calculateSLA(order) : null;
    
    if (sla?.isOverdue) {
      const confirmMessage = `Đơn hàng này đã quá hạn SLA ${Math.abs(sla.remainingHours).toFixed(1)} giờ. Bạn có chắc muốn xác nhận?`;
      if (!confirm(confirmMessage)) return;
    }
    
    onUpdateStatus(orderId, 'confirmed');
    toast.success('Đã xác nhận đơn hàng');
  };

  const handleRejectOrder = (orderId: string) => {
    setShowCancelDialog(orderId);
  };

  const confirmReject = (orderId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    onCancelOrder(orderId, reason);
    setShowCancelDialog(null);
    toast.success('Đã từ chối đơn hàng');
  };

  // Chức năng 2: Quy trình đóng gói
  const handleStartPacking = (orderId: string) => {
    onUpdateStatus(orderId, 'packed');
    toast.success('Đã chuyển sang trạng thái đóng gói');
  };

  const handlePrintPackingSlip = (order: Order) => {
    console.log('Printing packing slip for:', order.orderNumber);
    toast.success(`Đang in phiếu đóng gói cho đơn ${order.orderNumber}`);
  };

  // Chức năng 3: Quản lý vận chuyển với tracking
  const handleAddShippingInfo = (order: Order) => {
    setSelectedOrderForShipping(order);
  };

  // Chức năng 4: Xử lý sự cố giao hàng
  const handleReportIssue = (orderId: string) => {
    setShowIssueDialog(orderId);
  };

  const submitIssueReport = (orderId: string, type: string, description: string) => {
    const newIssue: IssueReport = {
      id: Date.now().toString(),
      orderId,
      type: type as any,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setIssues([...issues, newIssue]);
    setShowIssueDialog(null);
    toast.warning('Đã ghi nhận sự cố, đang xử lý...');
  };

  // Chức năng 5: Hành động hàng loạt
  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleBulkAction = (action: 'confirm' | 'pack' | 'print' | 'export') => {
    if (selectedOrders.size === 0) {
      toast.error('Chưa chọn đơn hàng nào');
      return;
    }

    switch (action) {
      case 'confirm':
        selectedOrders.forEach(orderId => {
          const order = orders.find(o => o.id === orderId);
          if (order?.status === 'new') {
            onUpdateStatus(orderId, 'confirmed');
          }
        });
        toast.success(`Đã xác nhận ${selectedOrders.size} đơn hàng`);
        setSelectedOrders(new Set());
        break;
      case 'pack':
        selectedOrders.forEach(orderId => {
          const order = orders.find(o => o.id === orderId);
          if (order?.status === 'confirmed') {
            onUpdateStatus(orderId, 'packed');
          }
        });
        toast.success(`Đã đóng gói ${selectedOrders.size} đơn hàng`);
        setSelectedOrders(new Set());
        break;
      case 'print':
        toast.success(`Đang in phiếu giao cho ${selectedOrders.size} đơn hàng`);
        break;
      case 'export':
        toast.success(`Đang xuất danh sách ${selectedOrders.size} đơn hàng`);
        break;
    }
  };

  // Chức năng 6: Quản lý hoàn/hủy
  const handleInitiateReturn = (orderId: string) => {
    setShowReturnDialog(orderId);
  };

  const confirmReturn = (orderId: string, reason: string) => {
    // In real app, would create return request
    toast.success('Đã tạo yêu cầu hoàn hàng');
    setShowReturnDialog(null);
  };

  // Format time
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Get status badge
  const getStatusBadge = (status: OrderStatus) => {
    const configs: Record<OrderStatus, { label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline' }> = {
      pending: { label: 'Chờ xử lý', variant: 'secondary' },
      new: { label: 'Mới', variant: 'destructive' },
      confirmed: { label: 'Đã xác nhận', variant: 'default' },
      processing: { label: 'Đang xử lý', variant: 'secondary' },
      packed: { label: 'Đã đóng gói', variant: 'secondary' },
      shipping: { label: 'Đang giao', variant: 'default' },
      shipped: { label: 'Đang giao', variant: 'default' },
      delivered: { label: 'Đã giao', variant: 'default' },
      cancelled: { label: 'Đã hủy', variant: 'outline' },
      returned: { label: 'Đã hoàn trả', variant: 'outline' },
      refunded: { label: 'Hoàn tiền', variant: 'outline' },
    };
    const config = configs[status] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Chức năng 7: Cảnh báo/Nhắc việc */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-900">
                {orders.filter(o => calculateSLA(o).isOverdue).length}
              </p>
              <p className="text-sm text-red-700">Quá hạn SLA</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-900">
                {orders.filter(o => calculateSLA(o).isUrgent).length}
              </p>
              <p className="text-sm text-orange-700">Sắp quá hạn</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">
                {orders.filter(o => o.orderStatus === 'new').length}
              </p>
              <p className="text-sm text-blue-700">Chờ xác nhận</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-purple-200 bg-purple-50">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {orders.filter(o => o.orderStatus === 'shipped').length}
              </p>
              <p className="text-sm text-purple-700">Đang giao hàng</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo mã đơn, tên KH, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="new">Mới</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="packed">Đã đóng gói</SelectItem>
                <SelectItem value="shipped">Đang giao</SelectItem>
                <SelectItem value="delivered">Đã giao</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterUrgency} onValueChange={(value) => setFilterUrgency(value as any)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="critical">Quá hạn</SelectItem>
                <SelectItem value="high">Sắp quá hạn</SelectItem>
                <SelectItem value="normal">Bình thường</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="sla">SLA gần hết</SelectItem>
                <SelectItem value="amount">Giá trị cao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {selectedOrders.size === filteredOrders.length ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Chọn tất cả
              </button>
              {selectedOrders.size > 0 && (
                <span className="text-sm text-gray-600">
                  Đã chọn {selectedOrders.size} đơn
                </span>
              )}
            </div>

            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('confirm')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Xác nhận tất cả
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('pack')}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Đóng gói
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('print')}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  In phiếu
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('export')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Xuất Excel
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Orders list */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Không tìm thấy đơn hàng nào</p>
            <p className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const sla = calculateSLA(order);
            const isExpanded = expandedOrder === order.id;
            const isSelected = selectedOrders.has(order.id);

            return (
              <Card
                key={order.id}
                className={`p-4 transition-all ${
                  sla.isOverdue
                    ? 'border-l-4 border-l-red-500 bg-red-50/50'
                    : sla.isUrgent
                    ? 'border-l-4 border-l-orange-500 bg-orange-50/50'
                    : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="space-y-4">
                  {/* Header row */}
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const newSet = new Set(selectedOrders);
                        if (newSet.has(order.id)) {
                          newSet.delete(order.id);
                        } else {
                          newSet.add(order.id);
                        }
                        setSelectedOrders(newSet);
                      }}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className="font-bold text-lg text-blue-600 hover:text-blue-700"
                            >
                              {order.orderNumber}
                            </button>
                            {getStatusBadge(order.status)}
                            {sla.isOverdue && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Quá hạn {Math.abs(sla.remainingHours).toFixed(1)}h
                              </Badge>
                            )}
                            {sla.isUrgent && (
                              <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700">
                                <Clock className="w-3 h-3" />
                                Còn {sla.remainingHours.toFixed(1)}h
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{order.customer?.name || order.customerName || 'N/A'}</span>
                              <span>•</span>
                              <span>{order.customer?.phone || order.customerPhone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{formatTimeAgo(order.createdAt)}</span>
                            </div>
                            <div className="flex items-start gap-2 text-gray-700">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">
                                {order.shippingAddress.district}, {order.shippingAddress.city}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-gray-400" />
                              <span className="font-bold text-lg">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {order.status === 'new' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptOrder(order.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Xác nhận
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectOrder(order.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Từ chối
                              </Button>
                            </>
                          )}

                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartPacking(order.id)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Package className="w-4 h-4 mr-1" />
                              Bắt đầu đóng gói
                            </Button>
                          )}

                          {order.status === 'packed' && (
                            <Button
                              size="sm"
                              onClick={() => handleAddShippingInfo(order)}
                              className="bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              Thêm vận chuyển
                            </Button>
                          )}

                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOrderForShipping(order)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Xem tracking
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedOrderForDetails(order)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintPackingSlip(order)}>
                                <Printer className="w-4 h-4 mr-2" />
                                In phiếu giao
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleReportIssue(order.id)}>
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Báo cáo sự cố
                              </DropdownMenuItem>
                              {order.status === 'delivered' && (
                                <DropdownMenuItem onClick={() => handleInitiateReturn(order.id)}>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Tạo yêu cầu hoàn hàng
                                </DropdownMenuItem>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <DropdownMenuItem
                                  onClick={() => handleRejectOrder(order.id)}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Hủy đơn hàng
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          >
                            <ChevronDown
                              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2">Sản phẩm ({(order.products || order.items || []).length})</h4>
                            <div className="space-y-2">
                              {(order.products || order.items || []).map((product, idx) => {
                                const p = product as any;
                                const imgSrc = p.image || p.imageUrl;
                                const productName = p.name || p.productName;
                                return (
                                  <div key={p.id || idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                    {imgSrc && (
                                      <img src={imgSrc} alt="" className="w-12 h-12 rounded object-cover" />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium">{productName}</p>
                                      <p className="text-sm text-gray-600">Số lượng: {p.quantity}</p>
                                    </div>
                                    <p className="font-semibold">
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price * p.quantity)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {order.notes && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-yellow-700 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-yellow-900 text-sm">Ghi chú khách hàng</p>
                                  <p className="text-sm text-yellow-800 mt-1">{order.notes}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {order.shipping && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                              <h4 className="font-semibold text-blue-900 mb-2">Thông tin vận chuyển</h4>
                              <div className="space-y-1 text-sm text-blue-800">
                                <p><strong>Đơn vị:</strong> {order.shipping.carrier}</p>
                                <p><strong>Mã vận đơn:</strong> {order.shipping.trackingNumber}</p>
                                {order.shipping.expectedDelivery && (
                                  <p><strong>Dự kiến giao:</strong> {new Date(order.shipping.expectedDelivery).toLocaleString('vi-VN')}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialogs */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Từ chối đơn hàng</h3>
            <p className="text-sm text-gray-600 mb-4">
              Vui lòng nhập lý do từ chối để khách hàng hiểu rõ
            </p>
            <textarea
              id="cancel-reason"
              className="w-full border rounded-lg p-3 text-sm min-h-24"
              placeholder="VD: Sản phẩm tạm hết hàng, giao hàng không khả dụng tại khu vực này..."
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  const reason = (document.getElementById('cancel-reason') as HTMLTextAreaElement).value;
                  confirmReject(showCancelDialog, reason);
                }}
                variant="destructive"
                className="flex-1"
              >
                Xác nhận từ chối
              </Button>
              <Button
                onClick={() => setShowCancelDialog(null)}
                variant="outline"
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showReturnDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Tạo yêu cầu hoàn hàng</h3>
            <p className="text-sm text-gray-600 mb-4">
              Nhập lý do hoàn hàng
            </p>
            <textarea
              id="return-reason"
              className="w-full border rounded-lg p-3 text-sm min-h-24"
              placeholder="VD: Sản phẩm bị hỏng, không đúng mô tả..."
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  const reason = (document.getElementById('return-reason') as HTMLTextAreaElement).value;
                  confirmReturn(showReturnDialog, reason);
                }}
                className="flex-1"
              >
                Tạo yêu cầu
              </Button>
              <Button
                onClick={() => setShowReturnDialog(null)}
                variant="outline"
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showIssueDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Báo cáo sự cố giao hàng</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Loại sự cố</label>
                <select
                  id="issue-type"
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  <option value="damaged">Hàng bị hư hỏng</option>
                  <option value="missing">Thiếu hàng</option>
                  <option value="wrong_address">Sai địa chỉ</option>
                  <option value="customer_unavailable">Khách không có mặt</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mô tả chi tiết</label>
                <textarea
                  id="issue-description"
                  className="w-full border rounded-lg p-3 text-sm min-h-24"
                  placeholder="Mô tả chi tiết sự cố..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  const type = (document.getElementById('issue-type') as HTMLSelectElement).value;
                  const desc = (document.getElementById('issue-description') as HTMLTextAreaElement).value;
                  submitIssueReport(showIssueDialog, type, desc);
                }}
                variant="destructive"
                className="flex-1"
              >
                Gửi báo cáo
              </Button>
              <Button
                onClick={() => setShowIssueDialog(null)}
                variant="outline"
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </Card>
        </div>
      )}

      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={{
            ...selectedOrderForDetails,
            customerName: selectedOrderForDetails.customer?.name || selectedOrderForDetails.customerName,
            customerPhone: selectedOrderForDetails.customer?.phone || selectedOrderForDetails.customerPhone,
            deliveryAddress: selectedOrderForDetails.shippingAddress 
              ? `${selectedOrderForDetails.shippingAddress.street || ''}, ${selectedOrderForDetails.shippingAddress.ward || ''}, ${selectedOrderForDetails.shippingAddress.district || ''}, ${selectedOrderForDetails.shippingAddress.city || ''}`
              : '',
            items: (selectedOrderForDetails.products || selectedOrderForDetails.items || []).map((p: any) => ({
              productName: p.name || p.productName,
              quantity: p.quantity,
              price: p.price,
              variant: undefined
            })),
            subtotal: selectedOrderForDetails.totalAmount,
            shippingFee: 0,
            discount: 0,
            deliveryTime: selectedOrderForDetails.shipping?.expectedDelivery,
            shippingInfo: selectedOrderForDetails.shipping,
            notes: selectedOrderForDetails.notes,
          }}
          isOpen={true}
          onClose={() => setSelectedOrderForDetails(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}

      {selectedOrderForShipping && (
        <ShippingTrackingDialog
          order={selectedOrderForShipping}
          onClose={() => setSelectedOrderForShipping(null)}
          onSave={(shippingInfo) => {
            onAddShipping(selectedOrderForShipping.id, shippingInfo.trackingNumber, shippingInfo.carrier);
            setSelectedOrderForShipping(null);
          }}
        />
      )}
    </div>
  );
}


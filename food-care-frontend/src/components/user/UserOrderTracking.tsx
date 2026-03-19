import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import {
    Truck,
    Package,
    CheckCircle,
    Clock,
    MapPin,
    Eye,
    Search,
    Calendar,
    Box,
    AlertCircle,
    Loader2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Star,
    Timer,
    ClipboardList,
    MessageSquareWarning,
} from 'lucide-react';
import { ComplaintDialog } from './ComplaintDialog';
import type {
    UserOrderTracking,
    ShippingTimelineItem,
    UserConfirmDeliveryRequest,
    UserRequestReturnRequest,
} from '@/types/shipping';
import { ORDER_SHIPPING_STATUS_CONFIG } from '@/types/shipping';
import api from '@/services/api';

// Inline shipping API functions (previously in services/shipping/shippingApi)
const getUserOrders = async (params?: { pageSize?: number; status?: string }): Promise<UserOrderTracking[]> => {
    const response = await api.get('/shipping/user/orders', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.items ?? []);
};

const getUserOrderTracking = async (orderId: string): Promise<UserOrderTracking> => {
    const response = await api.get(`/shipping/user/orders/${orderId}/tracking`);
    return response.data;
};

const confirmDelivery = async (data: UserConfirmDeliveryRequest): Promise<void> => {
    await api.post(`/shipping/user/orders/${data.orderId}/confirm-delivery`, data);
};

const requestReturn = async (data: UserRequestReturnRequest): Promise<void> => {
    await api.post(`/shipping/user/orders/${data.orderId}/return`, data);
};

const cancelUserOrder = async (orderId: string, reason: string): Promise<void> => {
    await api.post(`/shipping/user/orders/${orderId}/cancel`, { reason });
};

// Status progress mapping
const STATUS_PROGRESS: Record<string, number> = {
    pending: 10,
    confirmed: 20,
    OrderReceived: 30,
    StaffPreparing: 45,
    StaffPacked: 60,
    shipping: 70,
    OutForDelivery: 80,
    InTransitToUser: 85,
    delivered: 100,
    Delivered: 100,
    cancelled: 0,
    returned: 0,
};

// Timeline step icons
const TIMELINE_ICONS: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    confirmed: <CheckCircle className="h-4 w-4" />,
    OrderReceived: <Package className="h-4 w-4" />,
    StaffPreparing: <Box className="h-4 w-4" />,
    StaffPacked: <ClipboardList className="h-4 w-4" />,
    shipping: <Truck className="h-4 w-4" />,
    OutForDelivery: <Truck className="h-4 w-4" />,
    delivered: <CheckCircle2 className="h-4 w-4" />,
    Delivered: <CheckCircle2 className="h-4 w-4" />,
};

// Shipping Timeline Component
function ShippingTimeline({ timeline }: { timeline: ShippingTimelineItem[] }) {
    return (
        <div className="space-y-4">
            {timeline.map((item, index) => (
                <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                            {TIMELINE_ICONS[item.status] || <Clock className="h-4 w-4" />}
                        </div>
                        {index < timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                    </div>
                    <div className="pb-6 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900">{item.statusLabel}</p>
                            <span className="text-sm text-gray-500">
                                {new Date(item.timestamp).toLocaleString('vi-VN')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        {item.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" /> {item.location}
                            </p>
                        )}
                        {item.handler && (
                            <p className="text-xs text-gray-400 mt-1">
                                Xử lý bởi: {item.handler}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Order Card Component
interface OrderCardProps {
    order: UserOrderTracking;
    onViewDetails: () => void;
    onConfirmDelivery: () => void;
    onRequestReturn: () => void;
    onCancel: () => void;
    onComplain: () => void;
}

function OrderCard({ order, onViewDetails, onConfirmDelivery, onRequestReturn, onCancel, onComplain }: OrderCardProps) {
    const statusConfig = ORDER_SHIPPING_STATUS_CONFIG[order.shippingStatus || order.status];
    const progress = order.statusProgress || STATUS_PROGRESS[order.shippingStatus || order.status] || 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="font-semibold text-lg">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                            {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                    <Badge className={`${statusConfig?.bgColor || 'bg-gray-100'} ${statusConfig?.color || 'text-gray-600'} border-0`}>
                        {statusConfig?.label || order.status}
                    </Badge>
                </div>

                {/* Progress Bar */}
                {!['cancelled', 'returned'].includes(order.status) && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">Tiến trình giao hàng</span>
                            <span className="font-medium text-blue-600">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {/* Items Preview */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, index) => (
                            <div
                                key={item.productId}
                                className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden"
                                style={{ zIndex: 3 - index }}
                            >
                                {item.productImage ? (
                                    <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                        ))}
                        {order.items.length > 3 && (
                            <div className="w-10 h-10 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium">
                                +{order.items.length - 3}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">
                            {order.items.length} sản phẩm
                        </p>
                        <p className="font-semibold text-blue-600">
                            {formatCurrency(order.totalAmount)}
                        </p>
                    </div>
                </div>

                {/* Shipping Info */}
                {order.trackingNumber && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Truck className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-600">Mã vận đơn:</span>
                            <span className="font-medium text-blue-600">{order.trackingNumber}</span>
                        </div>
                        {order.shippingProvider && (
                            <p className="text-xs text-gray-500 mt-1 ml-6">
                                {order.shippingProvider}
                            </p>
                        )}
                    </div>
                )}

                {/* Estimated Delivery */}
                {order.estimatedDeliveryDate && !order.actualDeliveryDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Timer className="h-4 w-4 text-orange-500" />
                        <span>Dự kiến giao:</span>
                        <span className="font-medium">
                            {new Date(order.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Chi tiết
                    </Button>
                    {order.canConfirmReceived && (
                        <Button size="sm" onClick={onConfirmDelivery} className="flex-1 bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Đã nhận hàng
                        </Button>
                    )}
                    {order.canRequestReturn && (
                        <Button variant="outline" size="sm" onClick={onRequestReturn} className="text-orange-600 border-orange-300 hover:bg-orange-50">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Trả hàng
                        </Button>
                    )}
                    {order.canCancel && (
                        <Button variant="outline" size="sm" onClick={onCancel} className="text-red-600 border-red-300 hover:bg-red-50">
                            <XCircle className="h-4 w-4 mr-1" />
                            Hủy đơn
                        </Button>
                    )}
                    {/* Complaint button for delivered orders */}
                    {['delivered', 'Delivered'].includes(order.status) && (
                        <Button variant="outline" size="sm" onClick={onComplain} className="text-amber-600 border-amber-300 hover:bg-amber-50">
                            <MessageSquareWarning className="h-4 w-4 mr-1" />
                            Khiếu nại
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Main Component
interface UserOrderTrackingProps {
    className?: string;
}

export function UserOrderTrackingSection({ className }: UserOrderTrackingProps) {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<UserOrderTracking[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<UserOrderTracking | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [confirmForm, setConfirmForm] = useState({
        rating: 5,
        feedback: '',
    });
    const [returnForm, setReturnForm] = useState({
        reason: '',
        description: '',
    });
    const [cancelReason, setCancelReason] = useState('');

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await getUserOrders({ pageSize: 50 });
            setOrders(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const handleViewDetails = async (order: UserOrderTracking) => {
        try {
            const detail = await getUserOrderTracking(order.orderId);
            setSelectedOrder(detail);
            setDetailDialogOpen(true);
        } catch {
            setSelectedOrder(order);
            setDetailDialogOpen(true);
        }
    };

    const openConfirmDialog = (order: UserOrderTracking) => {
        setSelectedOrder(order);
        setConfirmForm({ rating: 5, feedback: '' });
        setConfirmDialogOpen(true);
    };

    const openReturnDialog = (order: UserOrderTracking) => {
        setSelectedOrder(order);
        setReturnForm({ reason: '', description: '' });
        setReturnDialogOpen(true);
    };

    const openCancelDialog = (order: UserOrderTracking) => {
        setSelectedOrder(order);
        setCancelReason('');
        setCancelDialogOpen(true);
    };

    const openComplaintDialog = (order: UserOrderTracking) => {
        setSelectedOrder(order);
        setComplaintDialogOpen(true);
    };

    const handleConfirmDelivery = async () => {
        if (!selectedOrder) return;

        try {
            setActionLoading(true);
            await confirmDelivery({
                orderId: selectedOrder.orderId,
                isReceived: true,
                rating: confirmForm.rating,
                feedback: confirmForm.feedback,
            });
            toast.success('Xác nhận nhận hàng thành công!');
            setConfirmDialogOpen(false);
            loadOrders();
        } catch {
            toast.error('Không thể xác nhận');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestReturn = async () => {
        if (!selectedOrder || !returnForm.reason) return;

        try {
            setActionLoading(true);
            await requestReturn({
                orderId: selectedOrder.orderId,
                reason: returnForm.reason,
                description: returnForm.description,
            });
            toast.success('Đã gửi yêu cầu trả hàng');
            setReturnDialogOpen(false);
            loadOrders();
        } catch {
            toast.error('Không thể gửi yêu cầu');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || !cancelReason) return;

        try {
            setActionLoading(true);
            await cancelUserOrder(selectedOrder.orderId, cancelReason);
            toast.success('Đã hủy đơn hàng');
            setCancelDialogOpen(false);
            loadOrders();
        } catch {
            toast.error('Không thể hủy đơn hàng');
        } finally {
            setActionLoading(false);
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || order.status === statusFilter || order.shippingStatus === statusFilter;
        return matchSearch && matchStatus;
    });

    // Group orders
    const activeOrders = filteredOrders.filter(o => !['delivered', 'Delivered', 'cancelled', 'returned'].includes(o.status));
    const completedOrders = filteredOrders.filter(o => ['delivered', 'Delivered', 'cancelled', 'returned'].includes(o.status));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className || ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Theo dõi đơn hàng</h2>
                    <p className="text-gray-600">Xem trạng thái và lịch sử đơn hàng của bạn</p>
                </div>
                <Button variant="outline" onClick={loadOrders} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm theo mã đơn hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Lọc trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Chờ xác nhận</SelectItem>
                        <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                        <SelectItem value="shipping">Đang giao</SelectItem>
                        <SelectItem value="delivered">Đã giao</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Active Orders */}
            {activeOrders.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        Đơn hàng đang xử lý ({activeOrders.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeOrders.map((order) => (
                            <OrderCard
                                key={order.orderId}
                                order={order}
                                onViewDetails={() => handleViewDetails(order)}
                                onConfirmDelivery={() => openConfirmDialog(order)}
                                onRequestReturn={() => openReturnDialog(order)}
                                onCancel={() => openCancelDialog(order)}
                                onComplain={() => openComplaintDialog(order)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Đơn hàng hoàn thành ({completedOrders.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedOrders.map((order) => (
                            <OrderCard
                                key={order.orderId}
                                order={order}
                                onViewDetails={() => handleViewDetails(order)}
                                onConfirmDelivery={() => {}}
                                onRequestReturn={() => openReturnDialog(order)}
                                onCancel={() => {}}
                                onComplain={() => openComplaintDialog(order)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredOrders.length === 0 && (
                <div className="text-center py-16">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900">Chưa có đơn hàng</h3>
                    <p className="text-gray-500 mt-1">
                        Các đơn hàng của bạn sẽ hiển thị ở đây
                    </p>
                </div>
            )}

            {/* Order Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Chi tiết đơn hàng
                        </DialogTitle>
                        <DialogDescription>
                            {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Status & Progress */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Trạng thái hiện tại</p>
                                        <Badge className={`${ORDER_SHIPPING_STATUS_CONFIG[selectedOrder.shippingStatus || selectedOrder.status]?.bgColor || 'bg-gray-100'} ${ORDER_SHIPPING_STATUS_CONFIG[selectedOrder.shippingStatus || selectedOrder.status]?.color || 'text-gray-600'} border-0 mt-1`}>
                                            {ORDER_SHIPPING_STATUS_CONFIG[selectedOrder.shippingStatus || selectedOrder.status]?.label || selectedOrder.status}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Tổng thanh toán</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(selectedOrder.totalAmount)}
                                        </p>
                                    </div>
                                </div>
                                {!['cancelled', 'returned'].includes(selectedOrder.status) && (
                                    <div>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-gray-600">Tiến trình giao hàng</span>
                                            <span className="font-medium">{selectedOrder.statusProgress || 0}%</span>
                                        </div>
                                        <Progress value={selectedOrder.statusProgress || 0} className="h-3" />
                                    </div>
                                )}
                            </div>

                            {/* Shipping Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Địa chỉ giao hàng</p>
                                    <p className="font-medium flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                                        {selectedOrder.shippingAddress}
                                    </p>
                                </div>
                                {selectedOrder.trackingNumber && (
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Mã vận đơn</p>
                                        <p className="font-medium text-blue-600 flex items-center gap-2">
                                            <Truck className="h-4 w-4" />
                                            {selectedOrder.trackingNumber}
                                        </p>
                                        {selectedOrder.shippingProvider && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {selectedOrder.shippingProvider}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {selectedOrder.estimatedDeliveryDate && (
                                    <div className="p-4 bg-orange-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Dự kiến giao</p>
                                        <p className="font-medium text-orange-600 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                )}
                                {selectedOrder.actualDeliveryDate && (
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Đã giao ngày</p>
                                        <p className="font-medium text-green-600 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {new Date(selectedOrder.actualDeliveryDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Products */}
                            <div>
                                <h4 className="font-semibold mb-3">Sản phẩm ({selectedOrder.items.length})</h4>
                                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                                    {selectedOrder.items.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                                        >
                                            {item.productImage ? (
                                                <img
                                                    src={item.productImage}
                                                    alt={item.productName}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-sm text-gray-500">x{item.quantity}</p>
                                            </div>
                                            <p className="font-semibold text-blue-600">
                                                {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Timeline */}
                            {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-4">Lịch sử đơn hàng</h4>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <ShippingTimeline timeline={selectedOrder.timeline} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {selectedOrder?.canConfirmReceived && (
                            <Button
                                onClick={() => {
                                    setDetailDialogOpen(false);
                                    openConfirmDialog(selectedOrder);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Xác nhận đã nhận hàng
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delivery Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Xác nhận đã nhận hàng
                        </DialogTitle>
                        <DialogDescription>
                            Đơn hàng: {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Rating */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Đánh giá dịch vụ giao hàng</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setConfirmForm(prev => ({ ...prev, rating: star }))}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            className={`h-8 w-8 ${star <= confirmForm.rating
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Phản hồi (tùy chọn)</label>
                            <Textarea
                                placeholder="Chia sẻ trải nghiệm mua sắm của bạn..."
                                value={confirmForm.feedback}
                                onChange={(e) => setConfirmForm(prev => ({ ...prev, feedback: e.target.value }))}
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirmDelivery}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Xác nhận đã nhận
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Return Request Dialog */}
            <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-orange-600" />
                            Yêu cầu trả hàng
                        </DialogTitle>
                        <DialogDescription>
                            Đơn hàng: {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Lý do trả hàng *</label>
                            <Select
                                value={returnForm.reason}
                                onValueChange={(v) => setReturnForm(prev => ({ ...prev, reason: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lý do" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="damaged">Sản phẩm bị hư hỏng</SelectItem>
                                    <SelectItem value="wrong_item">Giao sai sản phẩm</SelectItem>
                                    <SelectItem value="not_as_described">Không đúng mô tả</SelectItem>
                                    <SelectItem value="quality_issue">Chất lượng không đạt</SelectItem>
                                    <SelectItem value="changed_mind">Đổi ý không mua</SelectItem>
                                    <SelectItem value="other">Lý do khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Mô tả chi tiết</label>
                            <Textarea
                                placeholder="Mô tả chi tiết vấn đề..."
                                value={returnForm.description}
                                onChange={(e) => setReturnForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleRequestReturn}
                            disabled={actionLoading || !returnForm.reason}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Gửi yêu cầu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Hủy đơn hàng
                        </DialogTitle>
                        <DialogDescription>
                            Đơn hàng: {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-sm text-red-800">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Lý do hủy *</label>
                            <Textarea
                                placeholder="Nhập lý do hủy đơn hàng..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Quay lại
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelOrder}
                            disabled={actionLoading || !cancelReason}
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Xác nhận hủy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complaint Dialog */}
            <ComplaintDialog
                open={complaintDialogOpen}
                onClose={() => setComplaintDialogOpen(false)}
                orderId={selectedOrder?.orderId}
                orderNumber={selectedOrder?.orderNumber}
                onSuccess={loadOrders}
            />
        </div>
    );
}

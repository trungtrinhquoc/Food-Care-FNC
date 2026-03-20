import { useState, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { SectionHeader, SectionSkeleton, EmptyState } from './SupplierLayout';
import {
    ShoppingCart,
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    Package,
    RefreshCw,
    Users,
    Camera,
    Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ordersApi, type SupplierOrder } from '../../services/supplier/supplierApi';

interface OrdersSectionProps {
    orders: SupplierOrder[];
    loading?: boolean;
    onUpdateStatus: (orderId: string, status: string) => Promise<void>;
    onRefresh: () => void;
}

// =====================================================
// Delivery Confirmation Dialog
// =====================================================
interface DeliveryConfirmDialogProps {
    open: boolean;
    order: SupplierOrder | null;
    onClose: () => void;
    onConfirmed: () => void;
}

function DeliveryConfirmDialog({ open, order, onClose, onConfirmed }: DeliveryConfirmDialogProps) {
    const [photoUrl, setPhotoUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        // Use the object URL as the photo URL (for dev/testing; in prod you'd upload to Cloudinary first)
        setPhotoUrl(objectUrl);
    };

    const handleConfirm = async () => {
        if (!order) return;
        const finalUrl = photoUrl.trim();
        if (!finalUrl) {
            toast.error('Vui lòng cung cấp ảnh giao hàng trước khi xác nhận.');
            return;
        }
        setSubmitting(true);
        try {
            await ordersApi.patchOrderStatus(order.id, { status: 'delivered', deliveryPhotoUrl: finalUrl });
            toast.success('Đã xác nhận giao hàng thành công!');
            onConfirmed();
            handleClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setPhotoUrl('');
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const canConfirm = photoUrl.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-emerald-600" />
                        Xác nhận đã giao hàng
                    </DialogTitle>
                    <DialogDescription>
                        Đơn hàng <strong>{order?.orderNumber}</strong> — Vui lòng cung cấp ảnh bằng chứng giao hàng.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* URL input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Link2 className="h-4 w-4" />
                            Nhập URL ảnh giao hàng
                        </label>
                        <Input
                            placeholder="https://... (Cloudinary, Imgur, v.v.)"
                            value={photoUrl}
                            onChange={(e) => {
                                setPhotoUrl(e.target.value);
                                setPreviewUrl(e.target.value.trim() || null);
                            }}
                        />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex-1 h-px bg-gray-200" />
                        hoặc
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* File upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Camera className="h-4 w-4" />
                            Tải ảnh từ thiết bị
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                        <p className="text-xs text-gray-400">Ảnh được dùng làm bằng chứng (JPG, PNG). Khi dùng file, URL sẽ là URL tạm thời.</p>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full max-h-48 object-cover"
                                onError={() => setPreviewUrl(null)}
                            />
                        </div>
                    )}

                    {!canConfirm && (
                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                            Bắt buộc phải có ảnh giao hàng trước khi xác nhận.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleConfirm}
                        disabled={!canConfirm || submitting}
                    >
                        {submitting ? 'Đang xác nhận...' : 'Xác nhận đã giao'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Chờ xác nhận', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    confirmed: { label: 'Đã xác nhận', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    processing: { label: 'Đang xử lý', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    shipped: { label: 'Đang giao', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    delivered: { label: 'Đã giao', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
    cancelled: { label: 'Đã hủy', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export function OrdersSection({
    orders = [],
    loading = false,
    onUpdateStatus,
    onRefresh,
}: OrdersSectionProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [deliveryDialogOrder, setDeliveryDialogOrder] = useState<SupplierOrder | null>(null);

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

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
        return <Badge className={`${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>;
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            await onUpdateStatus(orderId, newStatus);
        } finally {
            setUpdating(null);
        }
    };

    const handleViewDetails = (order: SupplierOrder) => {
        setSelectedOrder(order);
        setDetailDialogOpen(true);
    };

    if (loading) {
        return <SectionSkeleton />;
    }

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.orderNumber?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
            (order.customerName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'delivered').length,
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Quản lý đơn hàng"
                description={`Tổng cộng ${orders.length} đơn hàng`}
                actions={
                    <Button variant="outline" onClick={onRefresh} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </Button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="h-8 w-8 opacity-80" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-blue-100">Tổng đơn hàng</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="h-8 w-8 text-amber-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-sm text-gray-500">Chờ xác nhận</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.processing}</p>
                                <p className="text-sm text-gray-500">Đang xử lý</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.completed}</p>
                                <p className="text-sm text-gray-500">Hoàn thành</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm theo mã đơn hoặc tên khách..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Chờ xác nhận</SelectItem>
                        <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                        <SelectItem value="processing">Đang xử lý</SelectItem>
                        <SelectItem value="shipped">Đang giao</SelectItem>
                        <SelectItem value="delivered">Đã giao</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Orders Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredOrders.length === 0 ? (
                        <EmptyState
                            icon={ShoppingCart}
                            title="Không có đơn hàng"
                            description="Không tìm thấy đơn hàng phù hợp với bộ lọc"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã đơn</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Số SP</TableHead>
                                    <TableHead>Tổng tiền</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {order.customerName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{order.customerName}</p>
                                                    {order.customerPhone && (
                                                        <p className="text-xs text-gray-500">{order.customerPhone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{order.items?.length || 0} SP</TableCell>
                                        <TableCell className="font-semibold text-emerald-600">
                                            {formatCurrency(order.totalAmount)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-gray-500">{formatDate(order.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(order)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {order.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700"
                                                            disabled={updating === order.id}
                                                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={updating === order.id}
                                                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        disabled={updating === order.id}
                                                        onClick={() => handleUpdateStatus(order.id, 'processing')}
                                                    >
                                                        Xử lý
                                                    </Button>
                                                )}
                                                {order.status === 'processing' && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        disabled={updating === order.id}
                                                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                                    >
                                                        <Truck className="h-4 w-4 mr-1" />
                                                        Giao
                                                    </Button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                        disabled={updating === order.id}
                                                        onClick={() => setDeliveryDialogOrder(order)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Đã giao
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Delivery Confirmation Dialog */}
            <DeliveryConfirmDialog
                open={deliveryDialogOrder !== null}
                order={deliveryDialogOrder}
                onClose={() => setDeliveryDialogOrder(null)}
                onConfirmed={() => { onRefresh(); }}
            />

            {/* Order Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Chi tiết đơn hàng</DialogTitle>
                        <DialogDescription>
                            {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4">
                            {/* Customer Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {selectedOrder.customerName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{selectedOrder.customerName}</p>
                                    {selectedOrder.customerPhone && (
                                        <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                                    )}
                                    {selectedOrder.customerEmail && (
                                        <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                                    )}
                                </div>
                                {getStatusBadge(selectedOrder.status)}
                            </div>

                            {/* Order Items */}
                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm đặt mua</p>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {selectedOrder.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatCurrency(item.price)} x {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                                <p className="font-semibold text-emerald-800">Tổng cộng</p>
                                <p className="text-xl font-bold text-emerald-600">
                                    {formatCurrency(selectedOrder.totalAmount)}
                                </p>
                            </div>

                            {/* Notes */}
                            {selectedOrder.notes && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Ghi chú</p>
                                    <p className="text-gray-600">{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                            Đóng
                        </Button>
                        {selectedOrder?.status === 'pending' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        handleUpdateStatus(selectedOrder.id, 'cancelled');
                                        setDetailDialogOpen(false);
                                    }}
                                >
                                    Từ chối
                                </Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => {
                                        handleUpdateStatus(selectedOrder.id, 'confirmed');
                                        setDetailDialogOpen(false);
                                    }}
                                >
                                    Xác nhận
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

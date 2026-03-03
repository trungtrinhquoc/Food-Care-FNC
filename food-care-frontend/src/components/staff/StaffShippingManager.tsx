import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
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
    Calendar,
    Box,
    Loader2,
    RefreshCw,
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardCheck,
    Store,
    User,
    Phone,
    CheckCircle2,
    Send,
} from 'lucide-react';
import { InboundSessionManager } from './InboundSessionManager';
import { InboundHistoryManager } from './InboundHistoryManager';
import type {
    SupplierShipmentResponse,
    StaffInboundSummary,
    StaffOutboundSummary,
    StaffOutboundOrder,
    ReceivedItemRequest,
} from '@/types/shipping';
import {
    SHIPMENT_STATUS_CONFIG,
    ORDER_SHIPPING_STATUS_CONFIG,
} from '@/types/shipping';
import {
    getStaffInboundSummary,
    markShipmentArrived,
    receiveShipment,
    storeItemsToInventory,
    getStaffOutboundSummary,
    getStaffOutboundOrders,
    getStaffOutboundOrderById,
    updateOrderShippingStatus,
} from '@/services/shipping/shippingApi';

// ===== INBOUND SECTION =====

interface InboundSectionProps {
    onRefresh?: () => void;
}

function InboundSection({ onRefresh }: InboundSectionProps) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<StaffInboundSummary | null>(null);
    const [selectedShipment, setSelectedShipment] = useState<SupplierShipmentResponse | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [receiveItems, setReceiveItems] = useState<ReceivedItemRequest[]>([]);
    const [receiveNotes, setReceiveNotes] = useState('');

    const loadSummary = async () => {
        try {
            setLoading(true);
            const data = await getStaffInboundSummary();
            setSummary(data);
        } catch {
            toast.error('Không thể tải dữ liệu nhập kho');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status: string) => {
        const config = SHIPMENT_STATUS_CONFIG[status] || SHIPMENT_STATUS_CONFIG.Draft;
        return (
            <Badge className={`${config.bgColor} ${config.color} border-0`}>
                {config.label}
            </Badge>
        );
    };

    const handleMarkArrived = async (shipmentId: string) => {
        try {
            setActionLoading(true);
            await markShipmentArrived(shipmentId, 'Hàng đã đến kho');
            toast.success('Đã đánh dấu lô hàng đến kho');
            loadSummary();
            onRefresh?.();
        } catch {
            toast.error('Không thể cập nhật trạng thái');
        } finally {
            setActionLoading(false);
        }
    };

    const openReceiveDialog = (shipment: SupplierShipmentResponse) => {
        setSelectedShipment(shipment);
        setReceiveItems(
            (shipment.items || []).map(item => ({
                itemId: item.id,
                acceptedQuantity: item.quantity,
                damagedQuantity: 0,
                missingQuantity: 0,
                notes: '',
            }))
        );
        setReceiveNotes('');
        setReceiveDialogOpen(true);
    };

    const handleReceiveShipment = async () => {
        if (!selectedShipment) return;

        try {
            setActionLoading(true);
            await receiveShipment({
                shipmentId: selectedShipment.id,
                notes: receiveNotes,
                items: receiveItems,
            });
            toast.success('Đã kiểm tra và nhận lô hàng');
            setReceiveDialogOpen(false);
            loadSummary();
            onRefresh?.();
        } catch {
            toast.error('Không thể nhận lô hàng');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStoreToInventory = async (shipmentId: string) => {
        try {
            setActionLoading(true);
            await storeItemsToInventory(shipmentId);
            toast.success('Đã lưu hàng vào kho');
            loadSummary();
            onRefresh?.();
        } catch {
            toast.error('Không thể lưu kho');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalPendingShipments || 0}</p>
                                <p className="text-sm text-gray-500">Chờ tiếp nhận</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Truck className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalArrivedToday || 0}</p>
                                <p className="text-sm text-gray-500">Đến hôm nay</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <ClipboardCheck className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalInspecting || 0}</p>
                                <p className="text-sm text-gray-500">Đang kiểm tra</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Store className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalStoredToday || 0}</p>
                                <p className="text-sm text-gray-500">Đã lưu kho hôm nay</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Shipments List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowDownToLine className="h-5 w-5 text-blue-600" />
                                Lô hàng chờ xử lý
                            </CardTitle>
                            <CardDescription>
                                Các lô hàng từ nhà cung cấp cần tiếp nhận
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadSummary} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {(!summary?.pendingShipments || summary.pendingShipments.length === 0) ? (
                        <div className="text-center py-12 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Không có lô hàng chờ xử lý</p>
                            <p className="text-sm">Các lô hàng mới sẽ hiển thị ở đây</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã lô hàng</TableHead>
                                    <TableHead>Nhà cung cấp</TableHead>
                                    <TableHead>Số sản phẩm</TableHead>
                                    <TableHead>Ngày giao dự kiến</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.pendingShipments.map((shipment) => (
                                    <TableRow key={shipment.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {shipment.externalReference}
                                        </TableCell>
                                        <TableCell>{shipment.supplierName}</TableCell>
                                        <TableCell>{shipment.totalItems} SP</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {formatDate(shipment.expectedDeliveryDate)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {shipment.status === 'InTransit' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleMarkArrived(shipment.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Đã đến
                                                    </Button>
                                                )}
                                                {shipment.status === 'Arrived' && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => openReceiveDialog(shipment)}
                                                        disabled={actionLoading}
                                                    >
                                                        <ClipboardCheck className="h-4 w-4 mr-1" />
                                                        Kiểm tra
                                                    </Button>
                                                )}
                                                {shipment.status === 'Inspected' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={() => handleStoreToInventory(shipment.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Store className="h-4 w-4 mr-1" />
                                                        Lưu kho
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedShipment(shipment);
                                                        setDetailDialogOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Chi tiết lô hàng</DialogTitle>
                        <DialogDescription>
                            {selectedShipment?.externalReference}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedShipment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Nhà cung cấp</p>
                                    <p className="font-medium">{selectedShipment.supplierName}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Trạng thái</p>
                                    {getStatusBadge(selectedShipment.status)}
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Số sản phẩm</p>
                                    <p className="font-medium">{selectedShipment.totalItems}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Ngày giao dự kiến</p>
                                    <p className="font-medium">{formatDate(selectedShipment.expectedDeliveryDate)}</p>
                                </div>
                            </div>

                            {selectedShipment.items && selectedShipment.items.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Danh sách sản phẩm</h4>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {selectedShipment.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">{item.productName}</p>
                                                    {item.batchNumber && (
                                                        <p className="text-sm text-gray-500">Lô: {item.batchNumber}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Receive Dialog */}
            <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Kiểm tra & nhận lô hàng</DialogTitle>
                        <DialogDescription>
                            {selectedShipment?.externalReference} - {selectedShipment?.supplierName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Items Checklist */}
                        <div>
                            <h4 className="font-medium mb-3">Kiểm tra sản phẩm</h4>
                            <div className="space-y-3">
                                {selectedShipment?.items?.map((item, index) => (
                                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-sm text-gray-500">
                                                    Số lượng gửi: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs text-gray-500">Đạt yêu cầu</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={item.quantity}
                                                    value={receiveItems[index]?.acceptedQuantity || 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setReceiveItems(prev => prev.map((r, i) =>
                                                            i === index ? { ...r, acceptedQuantity: val } : r
                                                        ));
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Hư hỏng</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={receiveItems[index]?.damagedQuantity || 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setReceiveItems(prev => prev.map((r, i) =>
                                                            i === index ? { ...r, damagedQuantity: val } : r
                                                        ));
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Thiếu</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={receiveItems[index]?.missingQuantity || 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setReceiveItems(prev => prev.map((r, i) =>
                                                            i === index ? { ...r, missingQuantity: val } : r
                                                        ));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Ghi chú kiểm tra</label>
                            <Textarea
                                placeholder="Ghi chú về tình trạng lô hàng..."
                                value={receiveNotes}
                                onChange={(e) => setReceiveNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleReceiveShipment} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Xác nhận nhận hàng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ===== OUTBOUND SECTION =====

interface OutboundSectionProps {
    onRefresh?: () => void;
}

function OutboundSection({ onRefresh }: OutboundSectionProps) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<StaffOutboundSummary | null>(null);
    const [orders, setOrders] = useState<StaffOutboundOrder[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<StaffOutboundOrder | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [updateForm, setUpdateForm] = useState({
        status: '',
        trackingNumber: '',
        shippingProvider: '',
        notes: '',
        currentLocation: '',
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [summaryData, ordersData] = await Promise.all([
                getStaffOutboundSummary(),
                getStaffOutboundOrders({ pageSize: 50 }),
            ]);
            setSummary(summaryData);
            setOrders(ordersData.items || []);
        } catch {
            toast.error('Không thể tải dữ liệu xuất kho');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getOrderStatusBadge = (status: string) => {
        const config = ORDER_SHIPPING_STATUS_CONFIG[status] || ORDER_SHIPPING_STATUS_CONFIG.pending;
        return (
            <Badge className={`${config.bgColor} ${config.color} border-0`}>
                {config.label}
            </Badge>
        );
    };

    const handleViewOrder = async (order: StaffOutboundOrder) => {
        try {
            const detail = await getStaffOutboundOrderById(order.orderId);
            setSelectedOrder(detail);
            setDetailDialogOpen(true);
        } catch {
            setSelectedOrder(order);
            setDetailDialogOpen(true);
        }
    };

    const openUpdateStatusDialog = (order: StaffOutboundOrder) => {
        setSelectedOrder(order);
        setUpdateForm({
            status: '',
            trackingNumber: order.trackingNumber || '',
            shippingProvider: order.shippingProvider || '',
            notes: '',
            currentLocation: '',
        });
        setUpdateStatusDialogOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder || !updateForm.status) return;

        try {
            setActionLoading(true);
            await updateOrderShippingStatus({
                orderId: selectedOrder.orderId,
                ...updateForm,
            });
            toast.success('Đã cập nhật trạng thái đơn hàng');
            setUpdateStatusDialogOpen(false);
            setDetailDialogOpen(false);
            loadData();
            onRefresh?.();
        } catch {
            toast.error('Không thể cập nhật trạng thái');
        } finally {
            setActionLoading(false);
        }
    };

    // Filter orders
    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter || o.shippingStatus === statusFilter);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalPendingOrders || 0}</p>
                                <p className="text-sm text-gray-500">Chờ xử lý</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Package className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalPreparingOrders || 0}</p>
                                <p className="text-sm text-gray-500">Đang chuẩn bị</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                                <Box className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalPackedOrders || 0}</p>
                                <p className="text-sm text-gray-500">Đã đóng gói</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Truck className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalOutForDelivery || 0}</p>
                                <p className="text-sm text-gray-500">Đang giao</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.totalDeliveredToday || 0}</p>
                                <p className="text-sm text-gray-500">Đã giao hôm nay</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Lọc trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                        <SelectItem value="StaffPreparing">Đang chuẩn bị</SelectItem>
                        <SelectItem value="StaffPacked">Đã đóng gói</SelectItem>
                        <SelectItem value="shipping">Đang giao</SelectItem>
                        <SelectItem value="delivered">Đã giao</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Orders List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowUpFromLine className="h-5 w-5 text-blue-600" />
                        Đơn hàng cần xuất kho
                    </CardTitle>
                    <CardDescription>
                        Xử lý và gửi hàng đến khách hàng
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Không có đơn hàng</p>
                            <p className="text-sm">Các đơn hàng mới sẽ hiển thị ở đây</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã đơn</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Địa chỉ</TableHead>
                                    <TableHead>Tổng tiền</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.orderId} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {order.orderNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{order.customerName}</p>
                                                <p className="text-sm text-gray-500">{order.customerPhone}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate" title={order.shippingAddress}>
                                                <MapPin className="h-3 w-3 inline mr-1 text-gray-400" />
                                                {order.shippingAddress}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-blue-600">
                                            {formatCurrency(order.totalAmount)}
                                        </TableCell>
                                        <TableCell>
                                            {getOrderStatusBadge(order.shippingStatus || order.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openUpdateStatusDialog(order)}
                                                >
                                                    <Send className="h-4 w-4 mr-1" />
                                                    Cập nhật
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewOrder(order)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Order Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chi tiết đơn hàng</DialogTitle>
                        <DialogDescription>
                            {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Status & Amount */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                                    {getOrderStatusBadge(selectedOrder.shippingStatus || selectedOrder.status)}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Tổng tiền</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {formatCurrency(selectedOrder.totalAmount)}
                                    </p>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Thông tin khách hàng
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Tên khách hàng</p>
                                        <p className="font-medium">{selectedOrder.customerName}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Số điện thoại</p>
                                        <p className="font-medium flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {selectedOrder.customerPhone}
                                        </p>
                                    </div>
                                    <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Địa chỉ giao hàng</p>
                                        <p className="font-medium flex items-start gap-1">
                                            <MapPin className="h-3 w-3 mt-1" /> {selectedOrder.shippingAddress}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Info */}
                            {(selectedOrder.trackingNumber || selectedOrder.shippingProvider) && (
                                <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Truck className="h-4 w-4" /> Thông tin vận chuyển
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedOrder.trackingNumber && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Mã tracking</p>
                                                <p className="font-medium text-blue-600">{selectedOrder.trackingNumber}</p>
                                            </div>
                                        )}
                                        {selectedOrder.shippingProvider && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Đơn vị vận chuyển</p>
                                                <p className="font-medium">{selectedOrder.shippingProvider}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4" /> Sản phẩm ({selectedOrder.items.length})
                                    </h4>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {selectedOrder.items.map((item) => (
                                            <div
                                                key={item.orderItemId}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {item.productImage ? (
                                                        <img
                                                            src={item.productImage}
                                                            alt={item.productName}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                            <Package className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{item.productName}</p>
                                                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{formatCurrency(item.price)}</p>
                                                    {item.isPicked ? (
                                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                                            <CheckCircle className="h-3 w-3 mr-1" /> Đã lấy
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">Chưa lấy</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Lịch sử
                                    </h4>
                                    <div className="space-y-3 max-h-[150px] overflow-y-auto">
                                        {selectedOrder.timeline.map((item) => (
                                            <div key={item.id} className="flex items-start gap-3 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                                                <div>
                                                    <p className="font-medium">{item.statusLabel}</p>
                                                    <p className="text-gray-500 text-xs">
                                                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="default"
                            onClick={() => {
                                setDetailDialogOpen(false);
                                if (selectedOrder) openUpdateStatusDialog(selectedOrder);
                            }}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Cập nhật trạng thái
                        </Button>
                        <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={updateStatusDialogOpen} onOpenChange={setUpdateStatusDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
                        <DialogDescription>
                            {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Trạng thái mới *</label>
                            <Select
                                value={updateForm.status}
                                onValueChange={(v) => setUpdateForm(prev => ({ ...prev, status: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="confirmed">Xác nhận đơn</SelectItem>
                                    <SelectItem value="StaffPreparing">Đang chuẩn bị</SelectItem>
                                    <SelectItem value="StaffPacked">Đã đóng gói</SelectItem>
                                    <SelectItem value="shipping">Giao cho vận chuyển</SelectItem>
                                    <SelectItem value="OutForDelivery">Đang giao hàng</SelectItem>
                                    <SelectItem value="delivered">Đã giao hàng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {['shipping', 'OutForDelivery'].includes(updateForm.status) && (
                            <>
                                <div>
                                    <label className="text-sm font-medium">Mã tracking</label>
                                    <Input
                                        placeholder="Mã theo dõi vận đơn"
                                        value={updateForm.trackingNumber}
                                        onChange={(e) => setUpdateForm(prev => ({
                                            ...prev,
                                            trackingNumber: e.target.value
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Đơn vị vận chuyển</label>
                                    <Select
                                        value={updateForm.shippingProvider}
                                        onValueChange={(v) => setUpdateForm(prev => ({ ...prev, shippingProvider: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn đơn vị" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GHN">Giao Hàng Nhanh</SelectItem>
                                            <SelectItem value="GHTK">Giao Hàng Tiết Kiệm</SelectItem>
                                            <SelectItem value="VNPost">VNPost</SelectItem>
                                            <SelectItem value="JT">J&T Express</SelectItem>
                                            <SelectItem value="Other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-sm font-medium">Ghi chú</label>
                            <Textarea
                                placeholder="Ghi chú thêm..."
                                value={updateForm.notes}
                                onChange={(e) => setUpdateForm(prev => ({
                                    ...prev,
                                    notes: e.target.value
                                }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUpdateStatusDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={actionLoading || !updateForm.status}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ===== MAIN COMPONENT =====

interface StaffShippingManagerProps {
    onRefreshStats?: () => void;
    activeView?: string;
}

export function StaffShippingManager({ onRefreshStats, activeView = 'inbound' }: StaffShippingManagerProps) {

    const renderActiveView = () => {
        switch (activeView) {
            case 'inbound':
                return <InboundSection onRefresh={onRefreshStats} />;
            case 'outbound':
                return <OutboundSection onRefresh={onRefreshStats} />;
            case 'inbound-sessions':
                return <InboundSessionManager onRefreshStats={onRefreshStats} />;
            case 'inbound-history':
                return <InboundHistoryManager />;
            default:
                return <InboundSection onRefresh={onRefreshStats} />;
        }
    };

    return (
        <div className="space-y-6">
            {renderActiveView()}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
import { SectionHeader, SectionSkeleton, EmptyState } from './SupplierLayout';
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
    Plus,
    Send,
    Loader2,
    RefreshCw,
    XCircle,
    ArrowRight,
} from 'lucide-react';
import type {
    SupplierShipmentResponse,
    ShippingTimelineItem,
    CreateSupplierShipmentRequest,
    SupplierShipmentItemRequest,
} from '@/types/shipping';
import { SHIPMENT_STATUS_CONFIG } from '@/types/shipping';
import {
    getSupplierShipments,
    getSupplierShipmentById,
    createSupplierShipment,
    updateSupplierShipmentStatus,
    cancelSupplierShipment,
} from '@/services/shipping/shippingApi';
import { productsApi } from '@/services/supplier/supplierApi';
import type { SupplierProduct } from '@/services/supplier/supplierApi';

interface SupplierShipmentManagerProps {
    onRefreshStats?: () => void;
}

// Timeline component
function ShipmentTimeline({ timeline }: { timeline: ShippingTimelineItem[] }) {
    return (
        <div className="space-y-4">
            {timeline.map((item, index) => (
                <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${
                            index === 0 ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        {index < timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        )}
                    </div>
                    <div className="pb-4 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{item.statusLabel}</p>
                            <span className="text-xs text-gray-500">
                                {new Date(item.timestamp).toLocaleString('vi-VN')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        {item.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" /> {item.location}
                            </p>
                        )}
                        {item.notes && (
                            <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SupplierShipmentManager({ onRefreshStats }: SupplierShipmentManagerProps) {
    const [shipments, setShipments] = useState<SupplierShipmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedShipment, setSelectedShipment] = useState<SupplierShipmentResponse | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Form states
    const [newShipment, setNewShipment] = useState<CreateSupplierShipmentRequest>({
        warehouseId: 'WH-001',
        expectedDeliveryDate: '',
        carrier: '',
        trackingNumber: '',
        notes: '',
        items: [],
    });

    const [updateStatusForm, setUpdateStatusForm] = useState({
        status: '',
        trackingNumber: '',
        carrier: '',
        notes: '',
        currentLocation: '',
    });

    // Load shipments
    const loadShipments = async () => {
        try {
            setLoading(true);
            const data = await getSupplierShipments({ pageSize: 50 });
            setShipments(data.items || []);
        } catch (error) {
            console.error('Failed to load shipments:', error);
            toast.error('Không thể tải danh sách lô hàng');
        } finally {
            setLoading(false);
        }
    };

    // Load products for creating shipment
    const loadProducts = async () => {
        try {
            setLoadingProducts(true);
            const data = await productsApi.getProducts();
            setProducts(data || []);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        loadShipments();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const config = SHIPMENT_STATUS_CONFIG[status] || SHIPMENT_STATUS_CONFIG.Draft;
        return (
            <Badge className={`${config.bgColor} ${config.color} border-0`}>
                {config.label}
            </Badge>
        );
    };

    const handleViewDetails = async (shipment: SupplierShipmentResponse) => {
        try {
            const detail = await getSupplierShipmentById(shipment.id);
            setSelectedShipment(detail);
            setDetailDialogOpen(true);
        } catch {
            setSelectedShipment(shipment);
            setDetailDialogOpen(true);
        }
    };

    const openCreateDialog = () => {
        loadProducts();
        setNewShipment({
            warehouseId: 'WH-001',
            expectedDeliveryDate: '',
            carrier: '',
            trackingNumber: '',
            notes: '',
            items: [],
        });
        setCreateDialogOpen(true);
    };

    const handleAddItem = () => {
        setNewShipment(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    productId: '',
                    quantity: 1,
                    batchNumber: '',
                    expiryDate: '',
                    unitCost: 0,
                },
            ],
        }));
    };

    const handleUpdateItem = (index: number, field: keyof SupplierShipmentItemRequest, value: unknown) => {
        setNewShipment(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const handleRemoveItem = (index: number) => {
        setNewShipment(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const handleCreateShipment = async () => {
        if (!newShipment.expectedDeliveryDate || newShipment.items.length === 0) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newShipment.items.some(item => !item.productId || item.quantity <= 0)) {
            toast.error('Vui lòng chọn sản phẩm và số lượng hợp lệ');
            return;
        }

        try {
            setActionLoading(true);
            await createSupplierShipment(newShipment);
            toast.success('Đã tạo lô hàng mới');
            setCreateDialogOpen(false);
            loadShipments();
            onRefreshStats?.();
        } catch (error) {
            console.error('Failed to create shipment:', error);
            toast.error('Không thể tạo lô hàng');
        } finally {
            setActionLoading(false);
        }
    };

    const openUpdateStatusDialog = (shipment: SupplierShipmentResponse) => {
        setSelectedShipment(shipment);
        setUpdateStatusForm({
            status: shipment.status,
            trackingNumber: shipment.trackingNumber || '',
            carrier: shipment.carrier || '',
            notes: '',
            currentLocation: '',
        });
        setUpdateStatusDialogOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedShipment) return;

        try {
            setActionLoading(true);
            await updateSupplierShipmentStatus(selectedShipment.id, updateStatusForm);
            toast.success('Đã cập nhật trạng thái');
            setUpdateStatusDialogOpen(false);
            setDetailDialogOpen(false);
            loadShipments();
            onRefreshStats?.();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Không thể cập nhật trạng thái');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelShipment = async (shipmentId: string) => {
        const reason = prompt('Vui lòng nhập lý do hủy:');
        if (!reason) return;

        try {
            setActionLoading(true);
            await cancelSupplierShipment(shipmentId, reason);
            toast.success('Đã hủy lô hàng');
            loadShipments();
            onRefreshStats?.();
        } catch (error) {
            console.error('Failed to cancel shipment:', error);
            toast.error('Không thể hủy lô hàng');
        } finally {
            setActionLoading(false);
        }
    };

    // Filter shipments
    const filteredShipments = shipments.filter(s => {
        const matchSearch = s.externalReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Group shipments
    const activeShipments = filteredShipments.filter(s =>
        ['Draft', 'Dispatched', 'InTransit', 'Arrived', 'Inspected'].includes(s.status)
    );
    const completedShipments = filteredShipments.filter(s =>
        ['Stored', 'Closed', 'Cancelled'].includes(s.status)
    );

    // Calculate stats
    const stats = {
        total: shipments.length,
        active: shipments.filter(s => !['Stored', 'Closed', 'Cancelled'].includes(s.status)).length,
        inTransit: shipments.filter(s => s.status === 'InTransit').length,
        delivered: shipments.filter(s => ['Stored', 'Closed'].includes(s.status)).length,
        totalValue: shipments.reduce((sum, s) => sum + (s.totalValue || 0), 0),
    };

    if (loading) {
        return <SectionSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionHeader
                    title="Quản lý lô hàng gửi kho"
                    description="Tạo và theo dõi các lô hàng gửi đến warehouse"
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadShipments}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo lô hàng mới
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-gray-500">Tổng lô hàng</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-sm text-gray-500">Đang xử lý</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Truck className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.inTransit}</p>
                                <p className="text-sm text-gray-500">Đang vận chuyển</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.delivered}</p>
                                <p className="text-sm text-gray-500">Đã lưu kho</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 font-bold text-sm">₫</span>
                            </div>
                            <div>
                                <p className="text-lg font-bold">{formatCurrency(stats.totalValue)}</p>
                                <p className="text-sm text-gray-500">Tổng giá trị</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm theo mã lô hàng hoặc kho..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Lọc trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="Draft">Nháp</SelectItem>
                        <SelectItem value="Dispatched">Đã gửi</SelectItem>
                        <SelectItem value="InTransit">Đang vận chuyển</SelectItem>
                        <SelectItem value="Arrived">Đã đến kho</SelectItem>
                        <SelectItem value="Inspected">Đã kiểm tra</SelectItem>
                        <SelectItem value="Stored">Đã lưu kho</SelectItem>
                        <SelectItem value="Cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Shipments Lists */}
            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">
                        Đang xử lý ({activeShipments.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Hoàn thành ({completedShipments.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    <Card>
                        <CardContent className="pt-6">
                            {activeShipments.length === 0 ? (
                                <EmptyState
                                    icon={Package}
                                    title="Không có lô hàng đang xử lý"
                                    description="Tạo lô hàng mới để bắt đầu gửi hàng đến kho"
                                />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã lô hàng</TableHead>
                                            <TableHead>Kho đích</TableHead>
                                            <TableHead>Số sản phẩm</TableHead>
                                            <TableHead>Giá trị</TableHead>
                                            <TableHead>Ngày gửi dự kiến</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeShipments.map((shipment) => (
                                            <TableRow key={shipment.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    {shipment.externalReference}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                        {shipment.warehouseName || 'Kho chính'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{shipment.totalItems} SP</TableCell>
                                                <TableCell>
                                                    {formatCurrency(shipment.totalValue || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {formatDate(shipment.expectedDeliveryDate)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(shipment)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {shipment.status === 'Draft' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-blue-600"
                                                                onClick={() => openUpdateStatusDialog(shipment)}
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {shipment.status !== 'Cancelled' && shipment.status !== 'Stored' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600"
                                                                onClick={() => handleCancelShipment(shipment.id)}
                                                            >
                                                                <XCircle className="h-4 w-4" />
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
                </TabsContent>

                <TabsContent value="completed">
                    <Card>
                        <CardContent className="pt-6">
                            {completedShipments.length === 0 ? (
                                <EmptyState
                                    icon={CheckCircle}
                                    title="Chưa có lô hàng hoàn thành"
                                    description="Các lô hàng đã giao sẽ hiển thị ở đây"
                                />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã lô hàng</TableHead>
                                            <TableHead>Kho đích</TableHead>
                                            <TableHead>Số sản phẩm</TableHead>
                                            <TableHead>Giá trị</TableHead>
                                            <TableHead>Ngày hoàn thành</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {completedShipments.map((shipment) => (
                                            <TableRow key={shipment.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    {shipment.externalReference}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                        {shipment.warehouseName || 'Kho chính'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{shipment.totalItems} SP</TableCell>
                                                <TableCell>
                                                    {formatCurrency(shipment.totalValue || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    {shipment.actualDeliveryDate
                                                        ? formatDate(shipment.actualDeliveryDate)
                                                        : formatDate(shipment.updatedAt || shipment.createdAt)
                                                    }
                                                </TableCell>
                                                <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(shipment)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Shipment Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tạo lô hàng mới</DialogTitle>
                        <DialogDescription>
                            Tạo lô hàng để gửi đến warehouse
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Kho đích *</label>
                                <Select
                                    value={newShipment.warehouseId}
                                    onValueChange={(v) => setNewShipment(prev => ({ ...prev, warehouseId: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WH-001">Kho chính - HCM</SelectItem>
                                        <SelectItem value="WH-002">Kho phụ - HN</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Ngày giao dự kiến *</label>
                                <Input
                                    type="date"
                                    value={newShipment.expectedDeliveryDate}
                                    onChange={(e) => setNewShipment(prev => ({
                                        ...prev,
                                        expectedDeliveryDate: e.target.value
                                    }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Đơn vị vận chuyển</label>
                                <Input
                                    placeholder="VD: Giao Hàng Nhanh"
                                    value={newShipment.carrier || ''}
                                    onChange={(e) => setNewShipment(prev => ({
                                        ...prev,
                                        carrier: e.target.value
                                    }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Mã tracking</label>
                                <Input
                                    placeholder="Mã theo dõi vận đơn"
                                    value={newShipment.trackingNumber || ''}
                                    onChange={(e) => setNewShipment(prev => ({
                                        ...prev,
                                        trackingNumber: e.target.value
                                    }))}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-sm font-medium">Ghi chú</label>
                            <Textarea
                                placeholder="Ghi chú cho lô hàng..."
                                value={newShipment.notes || ''}
                                onChange={(e) => setNewShipment(prev => ({
                                    ...prev,
                                    notes: e.target.value
                                }))}
                            />
                        </div>

                        {/* Items */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium">Sản phẩm *</label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                                    <Plus className="h-4 w-4 mr-1" /> Thêm sản phẩm
                                </Button>
                            </div>

                            {loadingProducts ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : newShipment.items.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p>Chưa có sản phẩm nào</p>
                                    <p className="text-sm">Nhấn "Thêm sản phẩm" để bắt đầu</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {newShipment.items.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1 grid grid-cols-4 gap-2">
                                                <Select
                                                    value={item.productId}
                                                    onValueChange={(v) => handleUpdateItem(index, 'productId', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn sản phẩm" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((p) => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Số lượng"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                />
                                                <Input
                                                    placeholder="Số lô"
                                                    value={item.batchNumber || ''}
                                                    onChange={(e) => handleUpdateItem(index, 'batchNumber', e.target.value)}
                                                />
                                                <Input
                                                    type="date"
                                                    placeholder="Hạn sử dụng"
                                                    value={item.expiryDate || ''}
                                                    onChange={(e) => handleUpdateItem(index, 'expiryDate', e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleCreateShipment} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Tạo lô hàng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Shipment Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chi tiết lô hàng</DialogTitle>
                        <DialogDescription>
                            {selectedShipment?.externalReference}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedShipment && (
                        <div className="space-y-6">
                            {/* Status Overview */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Trạng thái hiện tại</p>
                                    {getStatusBadge(selectedShipment.status)}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Tổng giá trị</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {formatCurrency(selectedShipment.totalValue || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Kho đích</p>
                                    <p className="font-medium">{selectedShipment.warehouseName || 'Kho chính'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Số sản phẩm</p>
                                    <p className="font-medium">{selectedShipment.totalItems} sản phẩm</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Ngày giao dự kiến</p>
                                    <p className="font-medium">{formatDate(selectedShipment.expectedDeliveryDate)}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Ngày tạo</p>
                                    <p className="font-medium">{formatDate(selectedShipment.createdAt)}</p>
                                </div>
                                {selectedShipment.trackingNumber && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Mã tracking</p>
                                        <p className="font-medium text-blue-600">{selectedShipment.trackingNumber}</p>
                                    </div>
                                )}
                                {selectedShipment.carrier && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Đơn vị vận chuyển</p>
                                        <p className="font-medium">{selectedShipment.carrier}</p>
                                    </div>
                                )}
                            </div>

                            {/* Timeline */}
                            {selectedShipment.timeline && selectedShipment.timeline.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Lịch sử trạng thái
                                    </h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <ShipmentTimeline timeline={selectedShipment.timeline} />
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            {selectedShipment.items && selectedShipment.items.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4" /> Danh sách sản phẩm
                                    </h4>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {selectedShipment.items.map((item) => (
                                            <div
                                                key={item.id}
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
                                                        <p className="font-medium">{item.productName || item.productId}</p>
                                                        {item.productSku && (
                                                            <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                                                        )}
                                                        {item.batchNumber && (
                                                            <p className="text-xs text-gray-400">Lô: {item.batchNumber}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{item.quantity}</p>
                                                    {item.receivedQuantity !== undefined && (
                                                        <p className="text-sm text-gray-500">
                                                            Đã nhận: {item.receivedQuantity}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {selectedShipment && !['Stored', 'Closed', 'Cancelled'].includes(selectedShipment.status) && (
                            <Button
                                variant="default"
                                onClick={() => {
                                    setDetailDialogOpen(false);
                                    openUpdateStatusDialog(selectedShipment);
                                }}
                            >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Cập nhật trạng thái
                            </Button>
                        )}
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
                        <DialogTitle>Cập nhật trạng thái lô hàng</DialogTitle>
                        <DialogDescription>
                            {selectedShipment?.externalReference}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Trạng thái mới *</label>
                            <Select
                                value={updateStatusForm.status}
                                onValueChange={(v) => setUpdateStatusForm(prev => ({ ...prev, status: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedShipment?.status === 'Draft' && (
                                        <SelectItem value="Dispatched">Đã gửi hàng</SelectItem>
                                    )}
                                    {selectedShipment?.status === 'Dispatched' && (
                                        <SelectItem value="InTransit">Đang vận chuyển</SelectItem>
                                    )}
                                    {['Dispatched', 'InTransit'].includes(selectedShipment?.status || '') && (
                                        <SelectItem value="Arrived">Đã đến kho</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {(updateStatusForm.status === 'Dispatched' || updateStatusForm.status === 'InTransit') && (
                            <>
                                <div>
                                    <label className="text-sm font-medium">Mã tracking</label>
                                    <Input
                                        placeholder="Nhập mã theo dõi vận đơn"
                                        value={updateStatusForm.trackingNumber}
                                        onChange={(e) => setUpdateStatusForm(prev => ({
                                            ...prev,
                                            trackingNumber: e.target.value
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Đơn vị vận chuyển</label>
                                    <Input
                                        placeholder="VD: Giao Hàng Nhanh"
                                        value={updateStatusForm.carrier}
                                        onChange={(e) => setUpdateStatusForm(prev => ({
                                            ...prev,
                                            carrier: e.target.value
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Vị trí hiện tại</label>
                                    <Input
                                        placeholder="VD: Kho trung chuyển HCM"
                                        value={updateStatusForm.currentLocation}
                                        onChange={(e) => setUpdateStatusForm(prev => ({
                                            ...prev,
                                            currentLocation: e.target.value
                                        }))}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-sm font-medium">Ghi chú</label>
                            <Textarea
                                placeholder="Ghi chú thêm..."
                                value={updateStatusForm.notes}
                                onChange={(e) => setUpdateStatusForm(prev => ({
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
                        <Button onClick={handleUpdateStatus} disabled={actionLoading || !updateStatusForm.status}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

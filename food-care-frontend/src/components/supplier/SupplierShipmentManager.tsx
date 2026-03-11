import { useState, useEffect, useCallback } from 'react';
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
    Eye,
    Search,
    Calendar,
    Plus,
    Send,
    Loader2,
    RefreshCw,
    XCircle,
    ArrowRight,
    Warehouse,
    MapPin,
    Pencil,
    Trash2,
    Save,
} from 'lucide-react';
import {
    shipmentsApi,
    productsApi,
    inboundSessionsApi,
} from '@/services/supplier/supplierApi';
import type {
    SupplierShipment,
    SupplierProduct,
    SupplierInboundSession,
    CreateShipmentItemRequest,
} from '@/services/supplier/supplierApi';
import { SHIPMENT_STATUS_CONFIG } from '@/types/shipping';

const localNow = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

interface SupplierShipmentManagerProps {
    onRefreshStats?: () => void;
}

export function SupplierShipmentManager({ onRefreshStats }: SupplierShipmentManagerProps) {
    const [shipments, setShipments] = useState<SupplierShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedShipment, setSelectedShipment] = useState<SupplierShipment | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Inbound sessions
    const [sessions, setSessions] = useState<SupplierInboundSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('none');

    // Dispatch dialog
    const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
    const [dispatchForm, setDispatchForm] = useState({ trackingNumber: '', carrier: '' });

    // Edit dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingShipment, setEditingShipment] = useState<SupplierShipment | null>(null);
    const [editItemSaving, setEditItemSaving] = useState<string | null>(null);
    const [editInfoSaving, setEditInfoSaving] = useState(false);
    const [editShipmentInfo, setEditShipmentInfo] = useState({
        expectedDeliveryDate: '', carrier: '', trackingNumber: '', notes: '',
    });
    const [editAddForm, setEditAddForm] = useState({
        productId: '', quantity: 1, batchNumber: '',
        expiryDate: localNow(),
        unitCost: 0,
    });

    // Create shipment form
    const [newShipmentForm, setNewShipmentForm] = useState({
        externalReference: '',
        expectedDeliveryDate: '',
        carrier: '',
        trackingNumber: '',
        notes: '',
        items: [] as { productId: string; quantity: number; batchNumber: string; expiryDate: string; unitCost: number }[],
    });

    // Load shipments
    const loadShipments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await shipmentsApi.getShipments(1, 100);
            setShipments(data.items || []);
        } catch (error) {
            console.error('Failed to load shipments:', error);
            toast.error('Không thể tải danh sách lô hàng');
        } finally {
            setLoading(false);
        }
    }, []);

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

    const loadSessions = async () => {
        try {
            const data = await inboundSessionsApi.getSessions();
            setSessions(data.filter(s => s.registrationStatus === 'Registered' && s.sessionStatus !== 'Cancelled'));
        } catch {
            // Sessions loading is not critical
        }
    };

    useEffect(() => {
        loadShipments();
    }, [loadShipments]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency', currency: 'VND',
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const config = SHIPMENT_STATUS_CONFIG[status] || SHIPMENT_STATUS_CONFIG.Preparing;
        return (
            <Badge className={`${config.bgColor} ${config.color} border-0`}>
                {config.label}
            </Badge>
        );
    };

    const handleViewDetails = async (shipment: SupplierShipment) => {
        try {
            const detail = await shipmentsApi.getShipment(shipment.id);
            setSelectedShipment(detail);
        } catch {
            setSelectedShipment(shipment);
        }
        setDetailDialogOpen(true);
    };

    const openCreateDialog = () => {
        loadProducts();
        loadSessions();
        setSelectedSessionId('none');
        setNewShipmentForm({
            externalReference: `SHP-${Date.now().toString(36).toUpperCase()}`,
            expectedDeliveryDate: '',
            carrier: '',
            trackingNumber: '',
            notes: '',
            items: [],
        });
        setCreateDialogOpen(true);
    };

    const handleSessionChange = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        if (sessionId !== 'none') {
            const session = sessions.find(s => s.sessionId === sessionId);
            if (session) {
                setNewShipmentForm(prev => ({
                    ...prev,
                    externalReference: `SHP-${session.sessionCode}-${Date.now().toString(36).toUpperCase()}`,
                    expectedDeliveryDate: session.estimatedDeliveryDate || prev.expectedDeliveryDate,
                    notes: prev.notes || `Lô hàng cho phiên ${session.sessionCode}`,
                }));
            }
        }
    };

    const handleAddItem = () => {
        setNewShipmentForm(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', quantity: 1, batchNumber: '', expiryDate: '', unitCost: 0 }],
        }));
    };

    const handleUpdateItem = (index: number, field: string, value: unknown) => {
        setNewShipmentForm(prev => ({
            ...prev,
            items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
        }));
    };

    const handleRemoveItem = (index: number) => {
        setNewShipmentForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const handleCreateShipment = async () => {
        if (!newShipmentForm.expectedDeliveryDate || newShipmentForm.items.length === 0) {
            toast.error('Vui lòng điền ngày giao dự kiến và thêm ít nhất 1 sản phẩm');
            return;
        }
        if (newShipmentForm.items.some(item => !item.productId || item.quantity <= 0)) {
            toast.error('Vui lòng chọn sản phẩm và số lượng hợp lệ');
            return;
        }

        try {
            setActionLoading(true);
            const items: CreateShipmentItemRequest[] = newShipmentForm.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                batchNumber: item.batchNumber || undefined,
                expiryDate: item.expiryDate || undefined,
                unitCost: item.unitCost || undefined,
            }));

            const request = {
                externalReference: newShipmentForm.externalReference,
                expectedDeliveryDate: newShipmentForm.expectedDeliveryDate,
                carrier: newShipmentForm.carrier || undefined,
                trackingNumber: newShipmentForm.trackingNumber || undefined,
                notes: newShipmentForm.notes || undefined,
                items,
            };

            if (selectedSessionId !== 'none') {
                await inboundSessionsApi.createShipmentFromSession(selectedSessionId, request);
            } else {
                await shipmentsApi.createShipment(request);
            }

            toast.success('Đã tạo lô hàng mới');
            setCreateDialogOpen(false);
            loadShipments();
            onRefreshStats?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể tạo lô hàng');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitForApproval = async (shipment: SupplierShipment) => {
        try {
            setActionLoading(true);
            await shipmentsApi.startDelivering(shipment.id);
            toast.success('Đã bắt đầu giao hàng');
            setDetailDialogOpen(false);
            loadShipments();
            onRefreshStats?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể cập nhật');
        } finally {
            setActionLoading(false);
        }
    };

    const openDispatchDialog = (shipment: SupplierShipment) => {
        setSelectedShipment(shipment);
        setDispatchForm({
            trackingNumber: shipment.trackingNumber || '',
            carrier: shipment.carrier || '',
        });
        setDispatchDialogOpen(true);
    };

    const handleDispatch = async () => {
        if (!selectedShipment) return;
        try {
            setActionLoading(true);
            await shipmentsApi.startDelivering(
                selectedShipment.id,
                dispatchForm.trackingNumber || undefined,
                dispatchForm.carrier || undefined,
            );
            toast.success('Đã bắt đầu giao hàng');
            setDispatchDialogOpen(false);
            setDetailDialogOpen(false);
            loadShipments();
            onRefreshStats?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể cập nhật');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkInTransit = async (shipment: SupplierShipment) => {
        try {
            setActionLoading(true);
            await shipmentsApi.startDelivering(shipment.id);
            toast.success('Đã bắt đầu giao hàng');
            setDetailDialogOpen(false);
            loadShipments();
            onRefreshStats?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể cập nhật');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelShipment = async (shipmentId: string) => {
        const reason = prompt('Vui lòng nhập lý do hủy:');
        if (!reason) return;

        try {
            setActionLoading(true);
            await shipmentsApi.cancelShipment(shipmentId, reason);
            toast.success('Đã hủy lô hàng');
            setDetailDialogOpen(false);
            loadShipments();
            onRefreshStats?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể hủy lô hàng');
        } finally {
            setActionLoading(false);
        }
    };

    // Edit dialog handlers
    const openEditDialog = async (shipment: SupplierShipment) => {
        setEditingShipment(shipment);
        setEditShipmentInfo({
            expectedDeliveryDate: shipment.expectedDeliveryDate
                ? shipment.expectedDeliveryDate.slice(0, 16)
                : localNow(),
            carrier: shipment.carrier || '',
            trackingNumber: shipment.trackingNumber || '',
            notes: shipment.notes || '',
        });
        setEditAddForm({
            productId: '', quantity: 1, batchNumber: '',
            expiryDate: localNow(),
            unitCost: 0,
        });
        setEditDialogOpen(true);
        if (products.length === 0) await loadProducts();
    };

    const refreshEditingShipment = async () => {
        if (!editingShipment) return;
        const fresh = await shipmentsApi.getShipment(editingShipment.id);
        setEditingShipment(fresh);
    };

    const handleEditSaveInfo = async () => {
        if (!editingShipment) return;
        try {
            setEditInfoSaving(true);
            await shipmentsApi.updateShipment(editingShipment.id, {
                expectedDeliveryDate: editShipmentInfo.expectedDeliveryDate || undefined,
                carrier: editShipmentInfo.carrier || undefined,
                trackingNumber: editShipmentInfo.trackingNumber || undefined,
                notes: editShipmentInfo.notes || undefined,
            });
            toast.success('Đã lưu thông tin lô hàng');
            await refreshEditingShipment();
            loadShipments();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể lưu thông tin');
        } finally {
            setEditInfoSaving(false);
        }
    };

    const handleEditAddItem = async () => {
        if (!editingShipment || !editAddForm.productId || editAddForm.quantity < 1) {
            toast.error('Vui lòng chọn sản phẩm và số lượng hợp lệ');
            return;
        }
        const itemKey = `add-new`;
        try {
            setEditItemSaving(itemKey);
            await shipmentsApi.addItem(editingShipment.id, {
                productId: editAddForm.productId,
                quantity: editAddForm.quantity,
                batchNumber: editAddForm.batchNumber || undefined,
                expiryDate: editAddForm.expiryDate || undefined,
                unitCost: editAddForm.unitCost || undefined,
            });
            toast.success('Đã thêm sản phẩm');
            setEditAddForm({ productId: '', quantity: 1, batchNumber: '', expiryDate: localNow(), unitCost: 0 });
            await refreshEditingShipment();
            loadShipments();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể thêm sản phẩm');
        } finally {
            setEditItemSaving(null);
        }
    };

    const handleEditRemoveItem = async (itemId: string) => {
        if (!editingShipment) return;
        try {
            setEditItemSaving(itemId);
            await shipmentsApi.removeItem(editingShipment.id, itemId);
            toast.success('Đã xóa sản phẩm');
            await refreshEditingShipment();
            loadShipments();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể xóa sản phẩm');
        } finally {
            setEditItemSaving(null);
        }
    };

    const handleEditUpdateItemQty = async (itemId: string, quantity: number) => {
        if (!editingShipment || quantity < 1) return;
        try {
            setEditItemSaving(itemId);
            await shipmentsApi.updateItem(editingShipment.id, itemId, { quantity });
            await refreshEditingShipment();
            loadShipments();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Không thể cập nhật');
        } finally {
            setEditItemSaving(null);
        }
    };

    // Filter shipments
    const filteredShipments = shipments.filter(s => {
        const matchSearch = s.externalReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.inboundSessionCode?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Group shipments
    const activeShipments = filteredShipments.filter(s =>
        ['Preparing', 'Delivering', 'Received'].includes(s.status)
    );
    const completedShipments = filteredShipments.filter(s =>
        ['Success', 'Cancelled'].includes(s.status)
    );

    // Calculate stats
    const stats = {
        total: shipments.length,
        active: shipments.filter(s => !['Success', 'Cancelled'].includes(s.status)).length,
        inTransit: shipments.filter(s => s.status === 'Delivering').length,
        delivered: shipments.filter(s => s.status === 'Success').length,
        fromSession: shipments.filter(s => s.inboundSessionId).length,
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
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Warehouse className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.fromSession}</p>
                                <p className="text-sm text-gray-500">Từ phiên nhập</p>
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
                        placeholder="Tìm theo mã lô hàng, kho, hoặc phiên nhập..."
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
                        <SelectItem value="Preparing">Đang chuẩn bị</SelectItem>
                        <SelectItem value="Delivering">Đang giao hàng</SelectItem>
                        <SelectItem value="Received">Đã nhận hàng</SelectItem>
                        <SelectItem value="Success">Hoàn tất</SelectItem>
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
                                    description="Tạo lô hàng mới hoặc tạo từ phiên nhập kho tại tab Nhập kho"
                                />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã lô hàng</TableHead>
                                            <TableHead>Kho đích</TableHead>
                                            <TableHead>Sản phẩm</TableHead>
                                            <TableHead>Giá trị</TableHead>
                                            <TableHead>Ngày giao dự kiến</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeShipments.map((shipment) => (
                                            <TableRow key={shipment.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <div>
                                                        <span className="font-medium">{shipment.externalReference}</span>
                                                        {shipment.inboundSessionCode && (
                                                            <div className="mt-1">
                                                                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                                                                    <Warehouse className="w-3 h-3 mr-1" />
                                                                    {shipment.inboundSessionCode}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                        {shipment.warehouseName || 'Kho chính'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{shipment.totalItems} SP</TableCell>
                                                <TableCell>{formatCurrency(shipment.totalValue || 0)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {formatDate(shipment.expectedDeliveryDate)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(shipment)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {shipment.status === 'Preparing' && (
                                                            <Button variant="ghost" size="sm" className="text-amber-600"
                                                                onClick={() => openEditDialog(shipment)} title="Chỉnh sửa sản phẩm">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {shipment.status === 'Preparing' && (
                                                            <Button variant="ghost" size="sm" className="text-emerald-600"
                                                                onClick={() => openDispatchDialog(shipment)} disabled={actionLoading}
                                                                title="Bắt đầu giao hàng">
                                                                <Truck className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {!['Success', 'Cancelled'].includes(shipment.status) && (
                                                            <Button variant="ghost" size="sm" className="text-red-600"
                                                                onClick={() => handleCancelShipment(shipment.id)} disabled={actionLoading}>
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
                                            <TableHead>Sản phẩm</TableHead>
                                            <TableHead>Giá trị</TableHead>
                                            <TableHead>Ngày hoàn thành</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {completedShipments.map((shipment) => (
                                            <TableRow key={shipment.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <div>
                                                        <span className="font-medium">{shipment.externalReference}</span>
                                                        {shipment.inboundSessionCode && (
                                                            <div className="mt-1">
                                                                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                                                                    <Warehouse className="w-3 h-3 mr-1" />
                                                                    {shipment.inboundSessionCode}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                        {shipment.warehouseName || 'Kho chính'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{shipment.totalItems} SP</TableCell>
                                                <TableCell>{formatCurrency(shipment.totalValue || 0)}</TableCell>
                                                <TableCell>
                                                    {formatDate(shipment.actualArrivalDate || shipment.createdAt)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(shipment)}>
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
                            Tạo lô hàng để gửi đến kho. Có thể liên kết với phiên nhập kho.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Session Link */}
                        {sessions.length > 0 && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                <label className="text-sm font-medium text-indigo-800 block mb-2">
                                    <Warehouse className="w-4 h-4 inline mr-1" />
                                    Liên kết phiên nhập kho (tùy chọn)
                                </label>
                                <Select value={selectedSessionId} onValueChange={handleSessionChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn phiên nhập kho..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không liên kết phiên</SelectItem>
                                        {sessions.map(s => (
                                            <SelectItem key={s.sessionId} value={s.sessionId}>
                                                {s.sessionCode} — {s.warehouseName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedSessionId !== 'none' && (
                                    <p className="text-xs text-indigo-600 mt-2">
                                        Kho sẽ được tự động gán từ phiên nhập kho
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Mã lô hàng</label>
                                <Input
                                    value={newShipmentForm.externalReference}
                                    onChange={(e) => setNewShipmentForm(prev => ({
                                        ...prev, externalReference: e.target.value,
                                    }))}
                                    placeholder="Tự động tạo"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Ngày giao dự kiến *</label>
                                <Input
                                    type="datetime-local"
                                    value={newShipmentForm.expectedDeliveryDate}
                                    onChange={(e) => setNewShipmentForm(prev => ({
                                        ...prev, expectedDeliveryDate: e.target.value,
                                    }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Đơn vị vận chuyển</label>
                                <Input
                                    placeholder="VD: GHTK, GHN..."
                                    value={newShipmentForm.carrier}
                                    onChange={(e) => setNewShipmentForm(prev => ({
                                        ...prev, carrier: e.target.value,
                                    }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Mã vận đơn</label>
                                <Input
                                    placeholder="Nếu có"
                                    value={newShipmentForm.trackingNumber}
                                    onChange={(e) => setNewShipmentForm(prev => ({
                                        ...prev, trackingNumber: e.target.value,
                                    }))}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-sm font-medium">Ghi chú</label>
                            <Textarea
                                placeholder="Mô tả lô hàng..."
                                value={newShipmentForm.notes}
                                onChange={(e) => setNewShipmentForm(prev => ({
                                    ...prev, notes: e.target.value,
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
                            ) : newShipmentForm.items.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p>Chưa có sản phẩm nào</p>
                                    <p className="text-sm">Nhấn "Thêm sản phẩm" để bắt đầu</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {newShipmentForm.items.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1 grid grid-cols-4 gap-2">
                                                <Select
                                                    value={item.productId}
                                                    onValueChange={(v) => handleUpdateItem(index, 'productId', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn SP" />
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
                                                    type="number" min="1" placeholder="SL"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                />
                                                <Input
                                                    placeholder="Số lô"
                                                    value={item.batchNumber}
                                                    onChange={(e) => handleUpdateItem(index, 'batchNumber', e.target.value)}
                                                />
                                                <Input
                                                    type="date" placeholder="HSD"
                                                    value={item.expiryDate}
                                                    onChange={(e) => handleUpdateItem(index, 'expiryDate', e.target.value)}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" className="text-red-600"
                                                onClick={() => handleRemoveItem(index)}>
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
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
                        <DialogDescription>{selectedShipment?.externalReference}</DialogDescription>
                    </DialogHeader>

                    {selectedShipment && (
                        <div className="space-y-6">
                            {/* Status + Session Overview */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                                    {getStatusBadge(selectedShipment.status)}
                                    {selectedShipment.inboundSessionCode && (
                                        <div className="mt-2">
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                                <Warehouse className="w-3 h-3 mr-1" />
                                                Phiên: {selectedShipment.inboundSessionCode}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Tổng giá trị</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {formatCurrency(selectedShipment.totalValue || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Rejection reason */}
                            {selectedShipment.rejectionReason && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-medium text-red-800">Lý do từ chối:</p>
                                    <p className="text-sm text-red-700">{selectedShipment.rejectionReason}</p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Kho đích</p>
                                    <p className="font-medium">{selectedShipment.warehouseName || 'Kho chính'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Số sản phẩm</p>
                                    <p className="font-medium">{selectedShipment.totalItems} sản phẩm ({selectedShipment.totalQuantity} đơn vị)</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Ngày giao dự kiến</p>
                                    <p className="font-medium">{formatDateTime(selectedShipment.expectedDeliveryDate)}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Ngày tạo</p>
                                    <p className="font-medium">{formatDateTime(selectedShipment.createdAt)}</p>
                                </div>
                                {selectedShipment.trackingNumber && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Mã vận đơn</p>
                                        <p className="font-medium text-blue-600">{selectedShipment.trackingNumber}</p>
                                    </div>
                                )}
                                {selectedShipment.carrier && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Đơn vị vận chuyển</p>
                                        <p className="font-medium">{selectedShipment.carrier}</p>
                                    </div>
                                )}
                                {selectedShipment.actualDispatchDate && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Ngày gửi thực tế</p>
                                        <p className="font-medium">{formatDateTime(selectedShipment.actualDispatchDate)}</p>
                                    </div>
                                )}
                                {selectedShipment.actualArrivalDate && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Ngày đến kho</p>
                                        <p className="font-medium">{formatDateTime(selectedShipment.actualArrivalDate)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedShipment.notes && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Ghi chú</p>
                                    <p className="text-sm">{selectedShipment.notes}</p>
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
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{item.productName || item.productId}</p>
                                                    {item.productSku && <p className="text-sm text-gray-500">SKU: {item.productSku}</p>}
                                                    {item.batchNumber && <p className="text-xs text-gray-400">Lô: {item.batchNumber}</p>}
                                                    {item.expiryDate && <p className="text-xs text-gray-400">HSD: {formatDate(item.expiryDate)}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{item.expectedQuantity} {item.uom}</p>
                                                    {item.lineTotal != null && (
                                                        <p className="text-sm text-gray-500">{formatCurrency(item.lineTotal)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-wrap gap-2">
                        {selectedShipment?.status === 'Preparing' && (
                            <Button onClick={() => openDispatchDialog(selectedShipment)} disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700">
                                <Truck className="h-4 w-4 mr-2" /> Bắt đầu giao hàng
                            </Button>
                        )}
                        {selectedShipment && !['Success', 'Cancelled'].includes(selectedShipment.status) && (
                            <Button variant="outline" className="text-red-600" disabled={actionLoading}
                                onClick={() => handleCancelShipment(selectedShipment.id)}>
                                <XCircle className="h-4 w-4 mr-2" /> Hủy
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dispatch Dialog */}
            <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Gửi hàng</DialogTitle>
                        <DialogDescription>
                            Xác nhận gửi lô hàng {selectedShipment?.externalReference}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Mã vận đơn</label>
                            <Input
                                placeholder="Nhập mã theo dõi"
                                value={dispatchForm.trackingNumber}
                                onChange={(e) => setDispatchForm(prev => ({
                                    ...prev, trackingNumber: e.target.value,
                                }))}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Đơn vị vận chuyển</label>
                            <Input
                                placeholder="VD: GHTK, GHN..."
                                value={dispatchForm.carrier}
                                onChange={(e) => setDispatchForm(prev => ({
                                    ...prev, carrier: e.target.value,
                                }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDispatchDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleDispatch} disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700">
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Truck className="h-4 w-4 mr-2" /> Xác nhận gửi hàng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Shipment Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) loadShipments(); }}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-amber-600" />
                            Chỉnh sửa lô hàng
                        </DialogTitle>
                        <DialogDescription>
                            {editingShipment?.externalReference} — Chỉ chỉnh sửa được khi ở trạng thái Nháp
                        </DialogDescription>
                    </DialogHeader>

                    {editingShipment && (
                        <div className="space-y-6">
                            {/* Basic Info (editable) */}
                            <div className="border rounded-lg p-4 space-y-4">
                                <h4 className="font-medium text-sm text-gray-700">Thông tin lô hàng</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Ngày giao dự kiến</label>
                                        <Input
                                            type="datetime-local"
                                            value={editShipmentInfo.expectedDeliveryDate}
                                            onChange={(e) => setEditShipmentInfo(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Đơn vị vận chuyển</label>
                                        <Input
                                            placeholder="VD: GHTK, GHN..."
                                            value={editShipmentInfo.carrier}
                                            onChange={(e) => setEditShipmentInfo(prev => ({ ...prev, carrier: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Mã vận đơn</label>
                                        <Input
                                            placeholder="Nếu có"
                                            value={editShipmentInfo.trackingNumber}
                                            onChange={(e) => setEditShipmentInfo(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Kho đích</label>
                                        <Input value={editingShipment.warehouseName || 'Kho chính'} disabled className="bg-gray-50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600">Ghi chú</label>
                                    <Textarea
                                        placeholder="Mô tả lô hàng..."
                                        value={editShipmentInfo.notes}
                                        onChange={(e) => setEditShipmentInfo(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={2}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button size="sm" variant="outline" onClick={handleEditSaveInfo} disabled={editInfoSaving}>
                                        {editInfoSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Lưu thông tin
                                    </Button>
                                </div>
                            </div>

                            {/* Items section */}
                            <div className="border rounded-lg p-4 space-y-4">
                                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Sản phẩm trong lô ({editingShipment.items?.length ?? 0})
                                </h4>

                                {/* Existing items */}
                                {editingShipment.items && editingShipment.items.length > 0 ? (
                                    <div className="space-y-2">
                                        {editingShipment.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{item.productName || item.productId}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                        {item.productSku && <span>SKU: {item.productSku}</span>}
                                                        {item.batchNumber && <span>Lô: {item.batchNumber}</span>}
                                                        {item.expiryDate && <span>HSD: {item.expiryDate.slice(0, 10)}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        className="w-20 h-8 text-sm"
                                                        defaultValue={item.expectedQuantity}
                                                        onBlur={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (val !== item.expectedQuantity && val >= 1) {
                                                                handleEditUpdateItemQty(item.id, val);
                                                            }
                                                        }}
                                                        disabled={editItemSaving === item.id}
                                                    />
                                                    <span className="text-xs text-gray-500 w-8">{item.uom}</span>
                                                    {editItemSaving === item.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleEditRemoveItem(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-400 border border-dashed rounded-lg">
                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Chưa có sản phẩm nào trong lô hàng</p>
                                    </div>
                                )}

                                {/* Add new item row */}
                                <div className="border-t pt-4">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Thêm sản phẩm mới</p>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <Select
                                                value={editAddForm.productId}
                                                onValueChange={(v) => setEditAddForm(prev => ({ ...prev, productId: v }))}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Chọn sản phẩm..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {loadingProducts ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        </div>
                                                    ) : products.map((p) => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="SL"
                                                className="h-9"
                                                value={editAddForm.quantity}
                                                onChange={(e) => setEditAddForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <Input
                                                placeholder="Số lô"
                                                className="h-9"
                                                value={editAddForm.batchNumber}
                                                onChange={(e) => setEditAddForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                                            />
                                        </div>
                                        <div className="w-44">
                                            <Input
                                                type="datetime-local"
                                                className="h-9"
                                                title="Hạn sử dụng"
                                                value={editAddForm.expiryDate}
                                                onChange={(e) => setEditAddForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            className="h-9"
                                            onClick={handleEditAddItem}
                                            disabled={editItemSaving === 'add-new' || !editAddForm.productId}
                                        >
                                            {editItemSaving === 'add-new' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <><Plus className="h-4 w-4 mr-1" /> Thêm</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Đóng</Button>
                        {editingShipment?.status === 'Preparing' && (
                            <Button
                                onClick={() => { handleSubmitForApproval(editingShipment!); setEditDialogOpen(false); }}
                                disabled={actionLoading || (editingShipment?.items?.length ?? 0) === 0}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Send className="h-4 w-4 mr-2" /> Gửi duyệt
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

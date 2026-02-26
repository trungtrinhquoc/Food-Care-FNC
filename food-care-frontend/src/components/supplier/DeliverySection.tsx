import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
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
} from 'lucide-react';
import type { SupplierShipment } from '../../services/supplier/supplierApi';

interface DeliverySectionProps {
    shipments: SupplierShipment[];
    loading?: boolean;
    onViewShipment?: (shipment: SupplierShipment) => void;
    onConfirmDelivery?: (shipmentId: string) => void;
}

// Status configuration
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    draft: { label: 'Nháp', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Box },
    pending: { label: 'Chờ xử lý', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
    dispatched: { label: 'Đã gửi', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Truck },
    in_transit: { label: 'Đang vận chuyển', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Truck },
    delivered: { label: 'Đã giao', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: CheckCircle },
    cancelled: { label: 'Đã hủy', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
};

export function DeliverySection({
    shipments = [],
    loading = false,
    onViewShipment,
    onConfirmDelivery,
}: DeliverySectionProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShipment, setSelectedShipment] = useState<SupplierShipment | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <Badge className={`${config.bgColor} ${config.color} border-0 gap-1`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const handleViewDetails = (shipment: SupplierShipment) => {
        setSelectedShipment(shipment);
        setDetailDialogOpen(true);
        onViewShipment?.(shipment);
    };

    if (loading) {
        return <SectionSkeleton />;
    }

    // Filter shipments
    const filteredShipments = shipments.filter(s =>
        s.externalReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by status
    const pendingShipments = filteredShipments.filter(s =>
        ['draft', 'pending', 'dispatched', 'in_transit'].includes(s.status)
    );
    const completedShipments = filteredShipments.filter(s =>
        ['delivered', 'cancelled'].includes(s.status)
    );

    // Calculate stats
    const stats = {
        total: shipments.length,
        inTransit: shipments.filter(s => s.status === 'in_transit').length,
        pending: shipments.filter(s => s.status === 'pending' || s.status === 'dispatched').length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Quản lý vận chuyển"
                description="Theo dõi và xác nhận các lô hàng gửi đến kho"
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-sm text-gray-500">Chờ xử lý</p>
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
                                <p className="text-sm text-gray-500">Đã hoàn thành</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm theo mã lô hàng hoặc kho..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Pending Shipments */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        Lô hàng đang xử lý
                    </CardTitle>
                    <CardDescription>
                        {pendingShipments.length} lô hàng đang trong quá trình vận chuyển
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingShipments.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="Không có lô hàng"
                            description="Hiện không có lô hàng nào đang được xử lý"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã lô hàng</TableHead>
                                    <TableHead>Kho đích</TableHead>
                                    <TableHead>Số sản phẩm</TableHead>
                                    <TableHead>Ngày gửi dự kiến</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingShipments.map((shipment) => (
                                    <TableRow key={shipment.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {shipment.externalReference}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                {shipment.warehouseName || shipment.warehouseId}
                                            </div>
                                        </TableCell>
                                        <TableCell>{shipment.totalItems} SP</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {formatDate(shipment.expectedDeliveryDate)}
                                            </div>
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

            {/* Completed Shipments */}
            {completedShipments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            Lô hàng đã hoàn thành
                        </CardTitle>
                        <CardDescription>
                            {completedShipments.length} lô hàng đã được giao
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã lô hàng</TableHead>
                                    <TableHead>Kho đích</TableHead>
                                    <TableHead>Số sản phẩm</TableHead>
                                    <TableHead>Ngày giao</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {completedShipments.slice(0, 5).map((shipment) => (
                                    <TableRow key={shipment.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {shipment.externalReference}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                {shipment.warehouseName || shipment.warehouseId}
                                            </div>
                                        </TableCell>
                                        <TableCell>{shipment.totalItems} SP</TableCell>
                                        <TableCell>
                                            {shipment.actualArrivalDate
                                                ? formatDate(shipment.actualArrivalDate)
                                                : '-'
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
                    </CardContent>
                </Card>
            )}

            {/* Shipment Detail Dialog */}
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
                            {/* Status */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    {getStatusBadge(selectedShipment.status)}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                                    <p className="font-semibold">{selectedShipment.totalItems} SP</p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Kho đích</p>
                                    <p className="font-medium">{selectedShipment.warehouseName || selectedShipment.warehouseId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Ngày giao dự kiến</p>
                                    <p className="font-medium">{formatDate(selectedShipment.expectedDeliveryDate)}</p>
                                </div>
                                {selectedShipment.trackingNumber && (
                                    <div>
                                        <p className="text-sm text-gray-500">Mã tracking</p>
                                        <p className="font-medium">{selectedShipment.trackingNumber}</p>
                                    </div>
                                )}
                                {selectedShipment.carrier && (
                                    <div>
                                        <p className="text-sm text-gray-500">Đơn vị vận chuyển</p>
                                        <p className="font-medium">{selectedShipment.carrier}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            {selectedShipment.items && selectedShipment.items.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Danh sách sản phẩm</p>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {selectedShipment.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">{item.productName || item.productId}</p>
                                                    {item.productSku && (
                                                        <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{item.expectedQuantity} {item.uom}</p>
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
        </div>
    );
}

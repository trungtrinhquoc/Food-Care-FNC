import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { SectionHeader, SectionSkeleton, EmptyState } from './SupplierLayout';
import {
    Gift,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    Package,
    AlertTriangle,
    ShoppingCart,
} from 'lucide-react';
import {
    blindBoxApi,
    type SupplierBlindBox,
} from '../../services/supplier/supplierApi';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
    pending: { label: 'Chờ duyệt', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
    approved: { label: 'Đã duyệt', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle2 },
    active: { label: 'Đang bán', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: ShoppingCart },
    sold_out: { label: 'Hết hàng', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Package },
    archived: { label: 'Lưu trữ', color: 'text-gray-500', bgColor: 'bg-gray-50', icon: Package },
    rejected: { label: 'Bị từ chối', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

export function BlindBoxSection() {
    const [blindBoxes, setBlindBoxes] = useState<SupplierBlindBox[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBox, setSelectedBox] = useState<SupplierBlindBox | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const loadBlindBoxes = async () => {
        try {
            setLoading(true);
            const data = await blindBoxApi.getMyBlindBoxes();
            setBlindBoxes(data);
        } catch {
            setBlindBoxes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBlindBoxes();
    }, []);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
        return <Badge className={`${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>;
    };

    if (loading) return <SectionSkeleton />;

    // Stats
    const stats = {
        total: blindBoxes.length,
        pending: blindBoxes.filter(b => b.status === 'pending').length,
        active: blindBoxes.filter(b => ['approved', 'active'].includes(b.status)).length,
        sold: blindBoxes.reduce((sum, b) => sum + b.quantitySold, 0),
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Quản lý Blind Box"
                description={`Tổng cộng ${blindBoxes.length} Blind Box`}
                actions={
                    <Button variant="outline" onClick={loadBlindBoxes} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Gift className="h-8 w-8 opacity-80" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-orange-100">Tổng Blind Box</p>
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
                                <p className="text-sm text-gray-500">Chờ duyệt</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-sm text-gray-500">Đang hoạt động</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.sold}</p>
                                <p className="text-sm text-gray-500">Đã bán</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Blind Box Table */}
            <Card>
                <CardContent className="p-0">
                    {blindBoxes.length === 0 ? (
                        <EmptyState
                            icon={Gift}
                            title="Chưa có Blind Box"
                            description="Tạo Blind Box từ sản phẩm sắp hết hạn ở tab Sản phẩm"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tiêu đề</TableHead>
                                    <TableHead>Giá gốc</TableHead>
                                    <TableHead>Giá bán</TableHead>
                                    <TableHead>Số lượng</TableHead>
                                    <TableHead>Đã bán</TableHead>
                                    <TableHead>HSD</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Chi tiết</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blindBoxes.map((box) => {
                                    const discount = box.originalValue > 0
                                        ? Math.round((1 - box.blindBoxPrice / box.originalValue) * 100)
                                        : 0;
                                    return (
                                        <TableRow key={box.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {box.imageUrl ? (
                                                        <img src={box.imageUrl} alt={box.title} className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                            <Gift className="h-5 w-5 text-orange-500" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate max-w-[200px]">{box.title}</p>
                                                        {discount > 0 && (
                                                            <span className="text-xs text-emerald-600 font-medium">-{discount}%</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500 line-through text-sm">{formatCurrency(box.originalValue)}</TableCell>
                                            <TableCell className="font-semibold text-orange-600">{formatCurrency(box.blindBoxPrice)}</TableCell>
                                            <TableCell>{box.quantity}</TableCell>
                                            <TableCell>{box.quantitySold}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {box.daysUntilExpiry <= 3 && (
                                                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                                    )}
                                                    <span className={box.daysUntilExpiry <= 3 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                                        {box.daysUntilExpiry > 0 ? `${box.daysUntilExpiry} ngày` : 'Hết hạn'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(box.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedBox(box); setDetailOpen(true); }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-orange-600" />
                            Chi tiết Blind Box
                        </DialogTitle>
                        <DialogDescription>{selectedBox?.title}</DialogDescription>
                    </DialogHeader>

                    {selectedBox && (
                        <div className="space-y-4">
                            {/* Image */}
                            {selectedBox.imageUrl && (
                                <img
                                    src={selectedBox.imageUrl}
                                    alt={selectedBox.title}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            )}

                            {/* Status + Rejection reason */}
                            <div className="flex items-center gap-2">
                                {getStatusBadge(selectedBox.status)}
                                {selectedBox.status === 'rejected' && selectedBox.rejectionReason && (
                                    <span className="text-sm text-red-600">— {selectedBox.rejectionReason}</span>
                                )}
                            </div>

                            {/* Description */}
                            {selectedBox.description && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Mô tả</p>
                                    <p className="text-gray-600 text-sm">{selectedBox.description}</p>
                                </div>
                            )}

                            {/* Pricing */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Giá gốc</p>
                                    <p className="font-semibold line-through text-gray-500">{formatCurrency(selectedBox.originalValue)}</p>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <p className="text-xs text-orange-600">Giá Blind Box</p>
                                    <p className="font-bold text-orange-600">{formatCurrency(selectedBox.blindBoxPrice)}</p>
                                </div>
                            </div>

                            {/* Quantity Info */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">Tổng SL</p>
                                    <p className="text-lg font-bold">{selectedBox.quantity}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg text-center">
                                    <p className="text-xs text-blue-600">Đã bán</p>
                                    <p className="text-lg font-bold text-blue-600">{selectedBox.quantitySold}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                                    <p className="text-xs text-emerald-600">Còn lại</p>
                                    <p className="text-lg font-bold text-emerald-600">{selectedBox.quantityAvailable}</p>
                                </div>
                            </div>

                            {/* Contents */}
                            {selectedBox.contents && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Nội dung</p>
                                    <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3">{selectedBox.contents}</p>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Ngày tạo: {formatDate(selectedBox.createdAt)}</span>
                                <span className={selectedBox.daysUntilExpiry <= 3 ? 'text-red-600 font-medium' : ''}>
                                    HSD: {formatDate(selectedBox.expiryDate)} ({selectedBox.daysUntilExpiry} ngày)
                                </span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

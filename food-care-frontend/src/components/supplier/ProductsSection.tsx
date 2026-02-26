import { useState } from 'react';
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
import { SectionHeader, SectionSkeleton, EmptyState } from './SupplierLayout';
import {
    Package,
    Search,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Grid3X3,
    List,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    productsApi,
    type SupplierProduct,
    type CreateProductRequest,
    type UpdateProductRequest,
} from '../../services/supplier/supplierApi';

interface ProductsSectionProps {
    products: SupplierProduct[];
    loading?: boolean;
    lowStockCount?: number;
    onRefresh: () => void;
}

type ModalMode = 'create' | 'edit' | null;

export function ProductsSection({
    products = [],
    loading = false,
    lowStockCount = 0,
    onRefresh,
}: ProductsSectionProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const [form, setForm] = useState<CreateProductRequest>({
        name: '',
        description: '',
        basePrice: 0,
        cost: 0,
        stockQuantity: 0,
        minStock: 10,
        sku: '',
        images: [],
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getApprovalBadge = (status?: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Đã duyệt
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                        <XCircle className="h-3 w-3" /> Bị từ chối
                    </Badge>
                );
            case 'pending':
            default:
                return (
                    <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
                        <Clock className="h-3 w-3" /> Chờ duyệt
                    </Badge>
                );
        }
    };

    const openCreateModal = () => {
        setForm({ name: '', description: '', basePrice: 0, cost: 0, stockQuantity: 0, minStock: 10, sku: '', images: [] });
        setEditingProduct(null);
        setModalMode('create');
    };

    const openEditModal = (product: SupplierProduct) => {
        setForm({
            name: product.name,
            description: product.description || '',
            basePrice: product.basePrice,
            cost: product.cost || 0,
            stockQuantity: product.stockQuantity,
            minStock: product.minStock || 10,
            sku: product.sku || '',
            images: product.images || [],
        });
        setEditingProduct(product);
        setModalMode('edit');
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Vui lòng nhập tên sản phẩm'); return; }
        if (form.basePrice <= 0) { toast.error('Giá bán phải lớn hơn 0'); return; }
        try {
            setSaving(true);
            if (modalMode === 'create') {
                await productsApi.createProduct(form);
                toast.success('Đã thêm sản phẩm mới! Đang chờ admin duyệt.');
            } else if (modalMode === 'edit' && editingProduct) {
                const updateData: UpdateProductRequest = {
                    name: form.name, description: form.description, basePrice: form.basePrice,
                    cost: form.cost, stockQuantity: form.stockQuantity, minStock: form.minStock,
                    sku: form.sku, images: form.images,
                };
                await productsApi.updateProduct(editingProduct.id, updateData);
                toast.success('Đã cập nhật sản phẩm!');
            }
            setModalMode(null);
            onRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể lưu sản phẩm');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;
        try {
            setDeleting(productId);
            await productsApi.deleteProduct(productId);
            toast.success('Đã xóa sản phẩm');
            onRefresh();
        } catch {
            toast.error('Không thể xóa sản phẩm');
        } finally {
            setDeleting(null);
        }
    };

    const handleResubmit = async (productId: string) => {
        try {
            await productsApi.submitForApproval(productId);
            toast.success('Đã gửi lại yêu cầu duyệt');
            onRefresh();
        } catch {
            toast.error('Không thể gửi yêu cầu duyệt');
        }
    };

    if (loading) return <SectionSkeleton />;

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && product.isActive) ||
            (statusFilter === 'inactive' && !product.isActive) ||
            (statusFilter === 'lowstock' && product.stockQuantity < 10) ||
            (statusFilter === 'pending' && product.status === 'pending') ||
            (statusFilter === 'approved' && product.status === 'approved') ||
            (statusFilter === 'rejected' && product.status === 'rejected');
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: products.length,
        active: products.filter((p) => p.isActive).length,
        pending: products.filter((p) => p.status === 'pending').length,
        rejected: products.filter((p) => p.status === 'rejected').length,
        lowStock: products.filter((p) => p.stockQuantity < 10).length,
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Quản lý sản phẩm"
                description={`${products.length} sản phẩm • ${stats.pending} chờ duyệt • ${lowStockCount} sắp hết hàng`}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={onRefresh} className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Làm mới
                        </Button>
                        <Button className="gap-2 bg-blue-500 hover:bg-blue-600" onClick={openCreateModal}>
                            <Plus className="h-4 w-4" /> Thêm sản phẩm
                        </Button>
                    </div>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-gray-500">Tổng SP</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-sm text-gray-500">Đang bán</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={stats.pending > 0 ? 'border-amber-200 bg-amber-50' : ''}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-sm text-gray-500">Chờ duyệt</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={stats.rejected > 0 ? 'border-red-200 bg-red-50' : ''}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.rejected}</p>
                                <p className="text-sm text-gray-500">Bị từ chối</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={stats.lowStock > 0 ? 'border-orange-200 bg-orange-50' : ''}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.lowStock}</p>
                                <p className="text-sm text-gray-500">Sắp hết</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm theo tên hoặc SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="approved">Đã duyệt</SelectItem>
                            <SelectItem value="pending">Chờ duyệt</SelectItem>
                            <SelectItem value="rejected">Bị từ chối</SelectItem>
                            <SelectItem value="active">Đang bán</SelectItem>
                            <SelectItem value="lowstock">Sắp hết hàng</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                        <List className="h-4 w-4" />
                    </Button>
                    <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Products */}
            {filteredProducts.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <EmptyState
                            icon={Package}
                            title="Không có sản phẩm"
                            description="Không tìm thấy sản phẩm phù hợp với bộ lọc"
                            action={
                                <Button className="gap-2" onClick={openCreateModal}>
                                    <Plus className="h-4 w-4" /> Thêm sản phẩm mới
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                        <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                            <CardContent className="p-0">
                                <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-lg">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Package className="h-12 w-12 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">{getApprovalBadge(product.status)}</div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-emerald-600">{formatCurrency(product.basePrice)}</p>
                                        <p className={`text-sm font-medium ${product.stockQuantity < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                                            Kho: {product.stockQuantity}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                                        <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        {product.status === 'rejected' && (
                                            <Button variant="ghost" size="sm" onClick={() => handleResubmit(product.id)} title="Gửi lại duyệt">
                                                <Send className="h-4 w-4 text-blue-600" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} disabled={deleting === product.id}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Giá bán</TableHead>
                                    <TableHead>Tồn kho</TableHead>
                                    <TableHead>Trạng thái duyệt</TableHead>
                                    <TableHead>Đã bán</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-gray-50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <Package className="h-6 w-6 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{product.name}</p>
                                                    {product.category && <p className="text-sm text-gray-500">{product.category}</p>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-500">{product.sku || '-'}</TableCell>
                                        <TableCell className="font-semibold text-emerald-600">{formatCurrency(product.basePrice)}</TableCell>
                                        <TableCell>
                                            <span className={`font-medium ${product.stockQuantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {product.stockQuantity}
                                            </span>
                                            {product.stockQuantity < 10 && <AlertTriangle className="h-4 w-4 text-orange-500 inline ml-1" />}
                                        </TableCell>
                                        <TableCell>{getApprovalBadge(product.status)}</TableCell>
                                        <TableCell>{product.soldCount || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEditModal(product)} title="Chỉnh sửa">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {product.status === 'rejected' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleResubmit(product.id)} title="Gửi lại duyệt">
                                                        <Send className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} disabled={deleting === product.id} title="Xóa">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Create/Edit Modal */}
            {modalMode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {modalMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
                            </h2>
                            <button onClick={() => setModalMode(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
                        </div>
                        <div className="p-6 space-y-6">
                            {modalMode === 'create' && (
                                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                                    <p className="font-medium">Sản phẩm mới sẽ ở trạng thái "Chờ duyệt"</p>
                                    <p className="mt-1">Admin sẽ xem xét và phê duyệt trước khi hiển thị trên trang chủ.</p>
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                                    <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nhập tên sản phẩm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Mô tả chi tiết sản phẩm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                                        <Input type="number" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))} min="0" step="1000" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Giá vốn (VNĐ)</label>
                                        <Input type="number" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} min="0" step="1000" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Số lượng tồn kho</label>
                                        <Input type="number" value={form.stockQuantity} onChange={(e) => setForm((p) => ({ ...p, stockQuantity: parseInt(e.target.value) || 0 }))} min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Tồn kho tối thiểu</label>
                                        <Input type="number" value={form.minStock} onChange={(e) => setForm((p) => ({ ...p, minStock: parseInt(e.target.value) || 0 }))} min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">SKU</label>
                                        <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder="Mã SKU" />
                                    </div>
                                </div>
                            </div>
                            <div className="border-t pt-4 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setModalMode(null)}>Hủy</Button>
                                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                    {saving ? 'Đang lưu...' : modalMode === 'create' ? 'Thêm sản phẩm' : 'Cập nhật'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

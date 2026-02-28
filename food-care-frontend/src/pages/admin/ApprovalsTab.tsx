import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Users,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  FileText,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  adminApprovalApi,
  type PendingProduct,
  type PendingSupplier,
  type ApprovalStats,
} from '../../services/supplier/supplierApi';

export function ApprovalsTab() {
  const [activeTab, setActiveTab] = useState('products');
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [suppliers, setSuppliers] = useState<PendingSupplier[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [processing, setProcessing] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Modal state for rejection reason
  const [rejectModal, setRejectModal] = useState<{ type: 'product' | 'supplier'; id: string | number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await adminApprovalApi.getStats();
      setStats(data);
    } catch {
      console.error('Failed to load approval stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const data = await adminApprovalApi.getPendingProducts(statusFilter);
      setProducts(data.items || []);
    } catch {
      console.error('Failed to load pending products');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [statusFilter]);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);
      const data = await adminApprovalApi.getPendingSuppliers(statusFilter);
      setSuppliers(data.items || []);
    } catch {
      console.error('Failed to load pending suppliers');
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadStats();
    loadProducts();
    loadSuppliers();
  }, [loadStats, loadProducts, loadSuppliers]);

  const handleApproveProduct = async (productId: string) => {
    try {
      setProcessing(productId);
      await adminApprovalApi.approveProduct(productId, 'Sản phẩm đã được phê duyệt');
      toast.success('Đã phê duyệt sản phẩm');
      loadProducts();
      loadStats();
    } catch {
      toast.error('Không thể phê duyệt sản phẩm');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectProduct = async () => {
    if (!rejectModal || rejectModal.type !== 'product') return;
    try {
      setProcessing(rejectModal.id);
      await adminApprovalApi.rejectProduct(rejectModal.id as string, rejectReason || 'Không đạt yêu cầu');
      toast.success('Đã từ chối sản phẩm');
      setRejectModal(null);
      setRejectReason('');
      loadProducts();
      loadStats();
    } catch {
      toast.error('Không thể từ chối sản phẩm');
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveSupplier = async (supplierId: number) => {
    try {
      setProcessing(supplierId);
      await adminApprovalApi.approveSupplier(supplierId, 'Đăng ký kinh doanh đã được phê duyệt');
      toast.success('Đã phê duyệt nhà cung cấp');
      loadSuppliers();
      loadStats();
    } catch {
      toast.error('Không thể phê duyệt nhà cung cấp');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectSupplier = async () => {
    if (!rejectModal || rejectModal.type !== 'supplier') return;
    try {
      setProcessing(rejectModal.id);
      await adminApprovalApi.rejectSupplier(rejectModal.id as number, rejectReason || 'Hồ sơ không hợp lệ');
      toast.success('Đã từ chối nhà cung cấp');
      setRejectModal(null);
      setRejectReason('');
      loadSuppliers();
      loadStats();
    } catch {
      toast.error('Không thể từ chối nhà cung cấp');
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApproveLegacy = async () => {
    if (!window.confirm('Approve tất cả sản phẩm chưa có trạng thái phê duyệt (legacy)? Thao tác này không thể hoàn tác.')) return;
    try {
      setProcessing('bulk');
      const res = await fetch('http://localhost:5022/api/admin/approvals/products/bulk-approve-legacy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      toast.success(data.message || 'Đã approve tất cả sản phẩm legacy');
      loadProducts();
      loadStats();
    } catch {
      toast.error('Lỗi khi bulk approve');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  };

  const getRegionLabel = (region?: string) => {
    switch (region) {
      case 'North': return 'Miền Bắc';
      case 'Central': return 'Miền Trung';
      case 'South': return 'Miền Nam';
      default: return region || '-';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1"><CheckCircle2 className="h-3 w-3" /> Đã duyệt</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-0 gap-1"><XCircle className="h-3 w-3" /> Từ chối</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-0 gap-1"><Clock className="h-3 w-3" /> Chờ duyệt</Badge>;
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter((s) =>
    s.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phê duyệt</h1>
          <p className="text-gray-500 mt-1">Quản lý đăng ký nhà cung cấp và phê duyệt sản phẩm</p>
        </div>
        <Button variant="outline" onClick={() => { loadStats(); loadProducts(); loadSuppliers(); }} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={stats?.products?.pending ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loadingStats ? '...' : stats?.products?.pending || 0}</p>
                <p className="text-sm text-gray-500">SP chờ duyệt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats?.suppliers?.pending ? 'border-blue-200 bg-blue-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loadingStats ? '...' : stats?.suppliers?.pending || 0}</p>
                <p className="text-sm text-gray-500">NCC chờ duyệt</p>
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
                <p className="text-2xl font-bold">{loadingStats ? '...' : stats?.products?.approved || 0}</p>
                <p className="text-sm text-gray-500">SP đã duyệt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loadingStats ? '...' : stats?.products?.rejected || 0}</p>
                <p className="text-sm text-gray-500">SP bị từ chối</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" /> Sản phẩm
              {stats?.products?.pending ? (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">{stats.products.pending}</span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Nhà cung cấp
              {stats?.suppliers?.pending ? (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">{stats.suppliers.pending}</span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="flex gap-1">
              {['pending', 'approved', 'rejected'].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          {loadingProducts ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Không có sản phẩm</h3>
                <p className="text-gray-500 mt-1">Không tìm thấy sản phẩm nào với bộ lọc hiện tại</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Package className="h-5 w-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{product.supplierName || '-'}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">{formatCurrency(product.basePrice || 0)}</TableCell>
                        <TableCell>{getStatusBadge(product.approvalStatus)}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{formatDate(product.submittedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {(product.approvalStatus === 'pending' || product.approvalStatus === null || product.approvalStatus === undefined) && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                                  onClick={() => handleApproveProduct(product.id)}
                                  disabled={processing === product.id}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50 gap-1"
                                  onClick={() => { setRejectModal({ type: 'product', id: product.id }); setRejectReason(''); }}
                                  disabled={processing === product.id}
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Từ chối
                                </Button>
                              </>
                            )}
                            {product.approvalStatus === 'approved' && (
                              <span className="text-sm text-emerald-500 font-medium">✅ Đã duyệt</span>
                            )}
                            {product.approvalStatus === 'rejected' && (
                              <span className="text-sm text-red-500">❌ Đã từ chối</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="mt-6">
          {loadingSuppliers ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Không có nhà cung cấp</h3>
                <p className="text-gray-500 mt-1">Không có đăng ký nào cần xử lý</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{supplier.businessName || supplier.storeName}</h3>
                            <p className="text-sm text-gray-500">{supplier.contactEmail}</p>
                          </div>
                          <div className="ml-auto lg:ml-4">{getStatusBadge(supplier.registrationStatus)}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">MST:</span>
                            <span className="font-medium">{supplier.taxCode || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Khu vực:</span>
                            <span className="font-medium">{getRegionLabel(supplier.operatingRegion)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Ngày gửi:</span>
                            <span className="font-medium">{formatDate(supplier.submittedAt)}</span>
                          </div>
                        </div>

                        {supplier.businessLicenseUrl && (
                          <div className="pt-2">
                            <a
                              href={supplier.businessLicenseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Xem giấy phép kinh doanh
                            </a>
                          </div>
                        )}

                        {supplier.registrationNotes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">Ghi chú:</span> {supplier.registrationNotes}
                          </p>
                        )}

                        {supplier.rejectionReason && (
                          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span><span className="font-medium">Lý do từ chối:</span> {supplier.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      {supplier.registrationStatus === 'pending' && (
                        <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1 flex-1"
                            onClick={() => handleApproveSupplier(supplier.id)}
                            disabled={processing === supplier.id}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Phê duyệt
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 gap-1 flex-1"
                            onClick={() => { setRejectModal({ type: 'supplier', id: supplier.id }); setRejectReason(''); }}
                            disabled={processing === supplier.id}
                          >
                            <XCircle className="h-4 w-4" /> Từ chối
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Từ chối {rejectModal.type === 'product' ? 'sản phẩm' : 'nhà cung cấp'}</h3>
                  <p className="text-sm text-gray-500">Nhập lý do từ chối</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder={rejectModal.type === 'product' ? 'Lý do từ chối sản phẩm...' : 'Lý do từ chối đăng ký...'}
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setRejectModal(null)}>Hủy</Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={rejectModal.type === 'product' ? handleRejectProduct : handleRejectSupplier}
                  disabled={processing !== null}
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { SimplePagination } from "../../components/ui/pagination";
import { Search, Box, FolderOpen, Loader2, RefreshCw, ArrowLeft, Store, Package, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { toast } from "sonner";
import { StockBadge } from "../../components/ui/status-badge";
import type { Product } from "../../types";
import type { Supplier } from "../../types/admin";
import { CategoriesSection } from "../../components/admin/CategoriesSection";
import { adminProductsService, suppliersService } from "../../services/admin";
import { adminApprovalApi } from "../../services/supplier/supplierApi";
import { useDebounce } from "../../hooks/useDebounce";

type ExtendedProduct = Product & {
  supplierId?: number | null;
  supplierName?: string | null;
  approvalStatus?: string | null;
  submittedAt?: string | null;
};

export function ProductsTab() {
  // Supplier list state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState(true);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Product list state
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState("products");
  const [processing, setProcessing] = useState<string | null>(null);
  const pageSize = 10;

  // Product detail modal
  const [viewingProduct, setViewingProduct] = useState<ExtendedProduct | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ productId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedSupplierSearch = useDebounce(supplierSearchTerm, 300);

  // Fetch suppliers list
  const fetchSuppliers = useCallback(async () => {
    try {
      setIsSuppliersLoading(true);
      const res = await suppliersService.getSuppliers({
        page: 1,
        pageSize: 200,
        searchTerm: debouncedSupplierSearch || undefined,
      });
      setSuppliers(res.items);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Không thể tải danh sách nhà cung cấp");
    } finally {
      setIsSuppliersLoading(false);
    }
  }, [debouncedSupplierSearch]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Filtered suppliers for search
  const filteredSuppliers = useMemo(() => {
    if (!debouncedSupplierSearch) return suppliers;
    const term = debouncedSupplierSearch.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
    );
  }, [suppliers, debouncedSupplierSearch]);

  // Fetch products with server-side pagination (filtered by selected supplier)
  const fetchProducts = useCallback(async () => {
    if (!selectedSupplier) return;
    try {
      setIsLoading(true);
      const response = await adminProductsService.getAdminProducts({
        page: currentPage,
        pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        supplierId: Number(selectedSupplier.id),
      });
      setProducts(response.items);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, selectedSupplier]);

  useEffect(() => {
    if (selectedSupplier) {
      fetchProducts();
    }
  }, [fetchProducts, selectedSupplier]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleSelectSupplier = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSearchTerm("");
    setCurrentPage(1);
    setProducts([]);
  }, []);

  const handleBackToSuppliers = useCallback(() => {
    setSelectedSupplier(null);
    setProducts([]);
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // Approval actions
  const handleApproveProduct = useCallback(async (productId: string) => {
    try {
      setProcessing(productId);
      await adminApprovalApi.approveProduct(productId, "Sản phẩm đã được phê duyệt");
      toast.success("Đã phê duyệt sản phẩm");
      await fetchProducts();
    } catch {
      toast.error("Không thể phê duyệt sản phẩm");
    } finally {
      setProcessing(null);
    }
  }, [fetchProducts]);

  const handleRejectProduct = useCallback(async () => {
    if (!rejectModal) return;
    try {
      setProcessing(rejectModal.productId);
      await adminApprovalApi.rejectProduct(rejectModal.productId, rejectReason || "Không đạt yêu cầu");
      toast.success("Đã từ chối sản phẩm");
      setRejectModal(null);
      setRejectReason("");
      await fetchProducts();
    } catch {
      toast.error("Không thể từ chối sản phẩm");
    } finally {
      setProcessing(null);
    }
  }, [rejectModal, rejectReason, fetchProducts]);

  const getApprovalBadge = (status?: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Đã duyệt
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-0 gap-1">
            <XCircle className="h-3 w-3" /> Từ chối
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
            <Clock className="h-3 w-3" /> Chờ duyệt
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 border-0 gap-1">
            <Clock className="h-3 w-3" /> Chưa gửi
          </Badge>
        );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Product stats for selected supplier
  const productStats = useMemo(() => {
    return {
      total: products.length,
      pending: products.filter((p) => p.approvalStatus === "pending" || !p.approvalStatus).length,
      approved: products.filter((p) => p.approvalStatus === "approved").length,
      rejected: products.filter((p) => p.approvalStatus === "rejected").length,
    };
  }, [products]);

  // Supplier list view
  const renderSupplierList = () => {
    if (isSuppliersLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Đang tải nhà cung cấp...</span>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Chọn nhà cung cấp
              </CardTitle>
              <CardDescription>
                Chọn nhà cung cấp để xem và xét duyệt sản phẩm. Tổng {suppliers.length} nhà cung cấp.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSuppliers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search suppliers */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm nhà cung cấp..."
                value={supplierSearchTerm}
                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Supplier cards grid */}
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {supplierSearchTerm ? "Không tìm thấy nhà cung cấp nào" : "Chưa có nhà cung cấp nào"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <Card
                  key={supplier.id}
                  className="cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all duration-200 group"
                  onClick={() => handleSelectSupplier(supplier)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                          {supplier.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">
                          {supplier.email || "Chưa có email"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          📱 {supplier.phone || "Chưa có SĐT"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {supplier.totalProducts} sản phẩm
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={supplier.status === "active" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-gray-300 text-gray-500"}
                      >
                        {supplier.status === "active" ? "Hoạt động" : "Ngừng"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Products table for selected supplier
  const renderProductsTable = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Đang tải sản phẩm...</span>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBackToSuppliers}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  {selectedSupplier?.name}
                </CardTitle>
                <CardDescription>
                  Tổng {totalItems} sản phẩm — Sản phẩm do nhà cung cấp đăng ký, admin chỉ xét duyệt
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProducts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>

          {/* Stats badges */}
          {products.length > 0 && (
            <div className="flex gap-3 mt-3">
              <Badge variant="outline" className="gap-1">
                <Package className="w-3 h-3" /> Tổng: {productStats.total}
              </Badge>
              {productStats.pending > 0 && (
                <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
                  <Clock className="w-3 h-3" /> Chờ duyệt: {productStats.pending}
                </Badge>
              )}
              <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã duyệt: {productStats.approved}
              </Badge>
              {productStats.rejected > 0 && (
                <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                  <XCircle className="w-3 h-3" /> Từ chối: {productStats.rejected}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Trạng thái duyệt</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm ? "Không tìm thấy sản phẩm nào" : "Nhà cung cấp này chưa đăng ký sản phẩm nào"}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl || product.images?.[0] || "/placeholder.png"}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.sku || "-"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.categoryName ? (
                        <Badge variant="outline">{product.categoryName}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {product.basePrice.toLocaleString("vi-VN")}đ
                        </div>
                        {product.originalPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            {product.originalPrice.toLocaleString("vi-VN")}đ
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StockBadge stock={product.stockQuantity} />
                    </TableCell>
                    <TableCell>{getApprovalBadge(product.approvalStatus)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(product.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingProduct(product)}
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(product.approvalStatus === "pending" || !product.approvalStatus) && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 gap-1 h-8 text-xs"
                              onClick={() => handleApproveProduct(product.id)}
                              disabled={processing === product.id}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 gap-1 h-8 text-xs"
                              onClick={() => {
                                setRejectModal({ productId: product.id });
                                setRejectReason("");
                              }}
                              disabled={processing === product.id}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Từ chối
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="sản phẩm"
            className="pt-4 border-t"
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs for Products and Categories */}
      <Tabs
        value={activeSubTab}
        onValueChange={(val) => {
          setActiveSubTab(val);
          if (val === "products") {
            setSelectedSupplier(null);
            setProducts([]);
            setSearchTerm("");
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Box className="w-4 h-4" />
            Danh sách sản phẩm
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Quản lý danh mục
          </TabsTrigger>
        </TabsList>

        {/* Products - Supplier selection then product list */}
        <TabsContent value="products">
          {selectedSupplier ? renderProductsTable() : renderSupplierList()}
        </TabsContent>

        {/* Categories Management */}
        <TabsContent value="categories">
          <CategoriesSection />
        </TabsContent>
      </Tabs>

      {/* Product Detail Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chi tiết sản phẩm</h2>
              <button onClick={() => setViewingProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <img
                  src={viewingProduct.imageUrl || viewingProduct.images?.[0] || "/placeholder.png"}
                  alt={viewingProduct.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{viewingProduct.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">SKU: {viewingProduct.sku || "-"}</p>
                  <div className="mt-2">{getApprovalBadge(viewingProduct.approvalStatus)}</div>
                </div>
              </div>

              {viewingProduct.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Mô tả</label>
                  <p className="text-gray-700 mt-1">{viewingProduct.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Giá bán</label>
                  <p className="font-semibold text-emerald-600">{viewingProduct.basePrice.toLocaleString("vi-VN")}đ</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tồn kho</label>
                  <p className="font-semibold">{viewingProduct.stockQuantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Danh mục</label>
                  <p>{viewingProduct.categoryName || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày gửi duyệt</label>
                  <p>{formatDate(viewingProduct.submittedAt)}</p>
                </div>
              </div>

              {(viewingProduct.approvalStatus === "pending" || !viewingProduct.approvalStatus) && (
                <div className="border-t pt-4 flex justify-end gap-3">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                    onClick={async () => {
                      await handleApproveProduct(viewingProduct.id);
                      setViewingProduct(null);
                    }}
                    disabled={processing === viewingProduct.id}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Phê duyệt
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 gap-1"
                    onClick={() => {
                      setRejectModal({ productId: viewingProduct.id });
                      setRejectReason("");
                      setViewingProduct(null);
                    }}
                  >
                    <XCircle className="h-4 w-4" /> Từ chối
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                  <h3 className="text-lg font-bold">Từ chối sản phẩm</h3>
                  <p className="text-sm text-gray-500">Nhập lý do từ chối để nhà cung cấp biết</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Lý do từ chối sản phẩm..."
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setRejectModal(null)}>
                  Hủy
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleRejectProduct}
                  disabled={processing !== null}
                >
                  {processing ? "Đang xử lý..." : "Xác nhận từ chối"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Pagination } from "../../components/ui/pagination";
import { Plus, Search, Edit, Trash2, Box, FolderOpen, Loader2 } from "lucide-react";
import { StockBadge } from "../../components/ui/status-badge";
import type { Product } from "../../types";
import { CategoriesSection } from "../../components/admin/CategoriesSection";
import { ProductDialog } from "../../components/admin/ProductDialog";
import { productsApi } from "../../services/productsApi";

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState("products");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const pageSize = 5;

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await productsApi.getProducts();
      setProducts(response.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (productId: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await productsApi.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    await fetchProducts();
  }, [fetchProducts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs for Products and Categories */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
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

        {/* Products List */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quản lý sản phẩm</CardTitle>
                  <CardDescription>Tổng {filteredProducts.length} sản phẩm</CardDescription>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              </div>
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
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl || product.images?.[0] || '/placeholder.png'}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.sku}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.categoryName ? (
                            <Badge variant="outline">{product.categoryName}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {product.basePrice.toLocaleString('vi-VN')}đ
                            </div>
                            {product.originalPrice && (
                              <div className="text-xs text-gray-500 line-through">
                                {product.originalPrice.toLocaleString('vi-VN')}đ
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.unit || '-'}</TableCell>
                        <TableCell>
                          <StockBadge stock={product.stockQuantity} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>⭐ {product.ratingAverage.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({product.ratingCount})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemLabel="sản phẩm"
                className="pt-4 border-t"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Management */}
        <TabsContent value="categories">
          <CategoriesSection />
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingProduct={editingProduct}
        onSave={handleSave}
      />
    </div>
  );
}

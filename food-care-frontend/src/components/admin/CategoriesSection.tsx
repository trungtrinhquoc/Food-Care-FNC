import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "./Button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { SimplePagination } from "../ui/pagination";
import { Plus, Search, Edit, Trash2, FolderOpen, ArrowLeft, Package } from "lucide-react";
import {
  getCategories,
  deleteCategory,
  type AdminCategory,
  type PagedResult,
} from "../../services/categoriesApi";
import { productsApi } from "../../services/productsApi";
import { CategoryDialog } from "./CategoryDialog";
import type { Product } from "../../types";

export function CategoriesSection() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

  // View products by category
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result: PagedResult<AdminCategory> = await getCategories(currentPage, pageSize, searchTerm || undefined);
      setCategories(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Load products when a category is selected
  const loadCategoryProducts = useCallback(async (category: AdminCategory) => {
    setLoadingProducts(true);
    try {
      const response = await productsApi.getProducts({
        categoryId: category.id,
        pageSize: 100,
      });
      setCategoryProducts(response.products);
    } catch (error) {
      console.error('Failed to load products:', error);
      setCategoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleViewProducts = (category: AdminCategory) => {
    setSelectedCategory(category);
    loadCategoryProducts(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryProducts([]);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Không thể xóa danh mục. Vui lòng thử lại.');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSaveSuccess = () => {
    handleDialogClose();
    loadCategories();
  };

  return (
    <>
      {/* View Products by Category */}
      {selectedCategory ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleBackToCategories}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Sản phẩm trong "{selectedCategory.name}"
                  </CardTitle>
                  <CardDescription>{categoryProducts.length} sản phẩm</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : categoryProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có sản phẩm nào trong danh mục này
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Giá bán</TableHead>
                    <TableHead>Tồn kho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.sku}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.basePrice.toLocaleString()}đ</TableCell>
                      <TableCell>
                        <Badge variant={product.stockQuantity > 10 ? "secondary" : "destructive"}>
                          {product.stockQuantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Categories List */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Quản lý danh mục
                </CardTitle>
                <CardDescription>Tổng {totalItems} danh mục</CardDescription>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm danh mục
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm danh mục..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tên danh mục</TableHead>
                    <TableHead>Số sản phẩm</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-mono text-sm">{category.id}</TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -m-2"
                          onClick={() => handleViewProducts(category)}
                        >
                          {category.imageUrl && (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-emerald-600 hover:underline">{category.name}</div>
                            {category.description && (
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-emerald-100"
                          onClick={() => handleViewProducts(category)}
                        >
                          {category.productCount} sản phẩm
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSuccess={handleSaveSuccess}
      />
    </>
  );
}

import { useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, TrendingUp, BarChart3, Archive } from 'lucide-react';
import { useProducts, useUpdateProduct, useDeleteProduct, useUpdateStock, useCreateProduct } from '../../hooks/useSupplierData';
import type { SupplierProduct } from '../../types/supplier';
import { ProductEditDialog } from './ProductEditDialog';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';
import { AddProductModal } from './AddProductModal';

export function ProductManagement() {
  const { data: products, isLoading } = useProducts();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateStockMutation = useUpdateStock();
  const createProductMutation = useCreateProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<SupplierProduct | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const categories = ['all', ...Array.from(new Set(products?.map((p: SupplierProduct) => p.category) || []))];

  const filteredProducts = products?.filter((product: SupplierProduct) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const lowStockProducts = filteredProducts.filter((p: SupplierProduct) => p.stock <= (p.minStock || 10));
  const outOfStockProducts = filteredProducts.filter((p: SupplierProduct) => p.stock === 0);

  const getStockStatus = (product: SupplierProduct) => {
    if (product.stock === 0) return { label: 'Hết hàng', color: 'bg-red-100 text-red-700 border-red-200' };
    if (product.stock <= (product.minStock || 10)) return { label: 'Sắp hết', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { label: 'Còn hàng', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-semibold mt-1">{filteredProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sắp hết hàng</p>
              <p className="text-2xl font-semibold mt-1 text-yellow-600">{lowStockProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hết hàng</p>
              <p className="text-2xl font-semibold mt-1 text-red-600">{outOfStockProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Archive className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Giá trị kho</p>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(filteredProducts.reduce((sum: number, p: SupplierProduct) => sum + (p.price * p.stock), 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên hoặc SKU..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Tất cả danh mục' : cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngưng bán</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>

          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Danh mục</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Giá bán</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Giá vốn</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tồn kho</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Đã bán</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product: SupplierProduct) => {
                const stockStatus = getStockStatus(product);
                const profitMargin = ((product.price - product.cost) / product.price * 100).toFixed(1);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">Lợi nhuận: {profitMargin}%</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{product.sku}</code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{product.category}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(product.cost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.stock}</span>
                        <button
                          onClick={() => setStockAdjustProduct(product)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Điều chỉnh kho"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            product.stock === 0 ? 'bg-red-500' :
                            product.stock <= (product.minStock || 10) ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min((product.stock / (product.maxStock || 100)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{product.soldCount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {editingProduct && (
        <ProductEditDialog
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(data) => {
            updateProductMutation.mutate({ id: editingProduct.id, data });
            setEditingProduct(null);
          }}
        />
      )}

      {stockAdjustProduct && (
        <StockAdjustmentDialog
          product={stockAdjustProduct}
          onClose={() => setStockAdjustProduct(null)}
          onSave={(quantity) => {
            updateStockMutation.mutate({ productId: stockAdjustProduct.id, quantity });
            setStockAdjustProduct(null);
          }}
        />
      )}

      {isAddModalOpen && (
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={(data) => {
            createProductMutation.mutate(data);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
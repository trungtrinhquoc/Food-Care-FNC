import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Product } from '../types';
import type { ProductFormData } from '../types/admin';

export function useProducts(initialProducts: Product[]) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    categoryName: '',
    basePrice: '',
    originalPrice: '',
    imageUrl: '',
    description: '',
    unit: '',
    stockQuantity: '',
  });

  const resetForm = useCallback(() => {
    setProductForm({
      name: '',
      categoryName: '',
      basePrice: '',
      originalPrice: '',
      imageUrl: '',
      description: '',
      unit: '',
      stockQuantity: '',
    });
  }, []);

  const openProductDialog = useCallback((product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        categoryName: product.categoryName || '',
        basePrice: product.basePrice.toString(),
        originalPrice: product.originalPrice?.toString() || '',
        imageUrl: product.imageUrl || '',
        description: product.description || '',
        unit: product.unit || '',
        stockQuantity: product.stockQuantity.toString(),
      });
    } else {
      setEditingProduct(null);
      resetForm();
    }
    setIsProductDialogOpen(true);
  }, [resetForm]);

  const closeProductDialog = useCallback(() => {
    setIsProductDialogOpen(false);
    setEditingProduct(null);
    resetForm();
  }, [resetForm]);

  const saveProduct = useCallback(() => {
    if (!productForm.name || !productForm.categoryName || !productForm.basePrice || !productForm.unit || !productForm.stockQuantity) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : crypto.randomUUID(),
      sku: editingProduct?.sku || `SKU-${Date.now()}`,
      slug: editingProduct?.slug || productForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: productForm.name,
      categoryName: productForm.categoryName,
      basePrice: parseFloat(productForm.basePrice),
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
      imageUrl: productForm.imageUrl || 'https://images.unsplash.com/photo-1686820740687-426a7b9b2043?w=400',
      description: productForm.description,
      unit: productForm.unit,
      stockQuantity: parseInt(productForm.stockQuantity),
      ratingAverage: editingProduct?.ratingAverage || 4.5,
      ratingCount: editingProduct?.ratingCount || 0,
      isSubscriptionAvailable: editingProduct?.isSubscriptionAvailable || false,
      isActive: editingProduct?.isActive ?? true,
    };

    if (editingProduct) {
      setProducts(products.map((p) => (p.id === editingProduct.id ? newProduct : p)));
      toast.success('Cập nhật sản phẩm thành công!');
    } else {
      setProducts([...products, newProduct]);
      toast.success('Thêm sản phẩm mới thành công!');
    }

    closeProductDialog();
  }, [productForm, editingProduct, products, closeProductDialog]);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
    toast.success('Đã xóa sản phẩm');
  }, [products]);

  const updateProductForm = useCallback((field: keyof ProductFormData, value: string) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    products,
    isProductDialogOpen,
    editingProduct,
    productForm,
    openProductDialog,
    closeProductDialog,
    saveProduct,
    deleteProduct,
    updateProductForm,
  };
}

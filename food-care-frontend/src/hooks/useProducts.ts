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
    category: '',
    price: '',
    originalPrice: '',
    image: '',
    description: '',
    unit: '',
    stock: '',
  });

  const resetForm = useCallback(() => {
    setProductForm({
      name: '',
      category: '',
      price: '',
      originalPrice: '',
      image: '',
      description: '',
      unit: '',
      stock: '',
    });
  }, []);

  const openProductDialog = useCallback((product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || '',
        image: product.image,
        description: product.description,
        unit: product.unit,
        stock: product.stock.toString(),
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
    if (!productForm.name || !productForm.category || !productForm.price || !productForm.unit || !productForm.stock) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `${products.length + 1}`,
      name: productForm.name,
      category: productForm.category,
      price: parseFloat(productForm.price),
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
      image: productForm.image || 'https://images.unsplash.com/photo-1686820740687-426a7b9b2043?w=400',
      description: productForm.description,
      unit: productForm.unit,
      stock: parseInt(productForm.stock),
      rating: editingProduct?.rating || 4.5,
      reviews: editingProduct?.reviews || 0,
      reviewList: editingProduct?.reviewList || [],
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

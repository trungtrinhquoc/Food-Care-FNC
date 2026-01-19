/**
 * Admin Product Dialog - Re-exports từ shared ProductDialog
 * Sử dụng chung component để tránh duplicate code
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProductDialog as SharedProductDialog } from '../ProductDialog';
import type { Product, Category, CreateProductRequest } from '../../types';
import { categoriesApi } from '../../services/api';
import { productsApi } from '../../services/productsApi';

// Legacy types for backwards compatibility
export interface ProductFormData {
  name: string;
  categoryName: string;
  basePrice: string;
  originalPrice: string;
  unit: string;
  stockQuantity: string;
  imageUrl: string;
  description: string;
}

interface AdminProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  onSave: () => void;
  // Optional props for external form control (backwards compatibility)
  productForm?: ProductFormData;
  onUpdateForm?: (field: keyof ProductFormData, value: string) => void;
}

// Convert ProductFormData to CreateProductRequest
function formDataToRequest(formData: ProductFormData, categories: Category[]): CreateProductRequest {
  const category = categories.find(c => c.name === formData.categoryName);
  return {
    name: formData.name,
    description: formData.description,
    basePrice: parseFloat(formData.basePrice) || 0,
    originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
    sku: '',
    stockQuantity: parseInt(formData.stockQuantity) || 0,
    categoryId: category?.id,
    supplierId: undefined,
    isSubscriptionAvailable: false,
    images: formData.imageUrl ? [formData.imageUrl] : [],
  };
}

// Convert CreateProductRequest to ProductFormData
function requestToFormData(request: CreateProductRequest, categories: Category[]): ProductFormData {
  const category = categories.find(c => c.id === request.categoryId);
  return {
    name: request.name,
    categoryName: category?.name || '',
    basePrice: request.basePrice.toString(),
    originalPrice: request.originalPrice?.toString() || '',
    unit: '',
    stockQuantity: request.stockQuantity.toString(),
    imageUrl: request.images?.[0] || '',
    description: request.description || '',
  };
}

export function ProductDialog({
  open,
  onOpenChange,
  editingProduct,
  onSave,
  productForm: externalForm,
  onUpdateForm: externalUpdateForm,
}: AdminProductDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Use a simple state that gets reset based on dialog state
  const getDefaultRequest = useCallback((): CreateProductRequest => ({
    name: '',
    description: '',
    basePrice: 0,
    originalPrice: undefined,
    sku: '',
    stockQuantity: 0,
    categoryId: undefined,
    supplierId: undefined,
    isSubscriptionAvailable: false,
    images: [],
  }), []);

  const [internalRequest, setInternalRequest] = useState<CreateProductRequest>(getDefaultRequest);

  // Load categories
  useEffect(() => {
    if (open) {
      categoriesApi.getCategories().then(setCategories);
    }
  }, [open]);

  // Compute current request - reset when dialog opens for new product
  const currentRequest = useMemo(() => {
    if (externalForm) {
      return formDataToRequest(externalForm, categories);
    }
    return internalRequest;
  }, [externalForm, categories, internalRequest]);

  const handleFormChange = useCallback((newRequest: CreateProductRequest) => {
    if (externalUpdateForm) {
      // Convert back to ProductFormData for external control
      const newFormData = requestToFormData(newRequest, categories);
      Object.keys(newFormData).forEach(key => {
        const k = key as keyof ProductFormData;
        externalUpdateForm(k, newFormData[k]);
      });
    } else {
      setInternalRequest(newRequest);
    }
  }, [externalUpdateForm, categories]);

  // Handle save with API call
  const handleSave = useCallback(async () => {
    try {
      if (editingProduct) {
        // Update existing product
        await productsApi.updateProduct(editingProduct.id, {
          ...currentRequest,
        });
      } else {
        // Create new product
        await productsApi.createProduct(currentRequest);
      }
      onSave(); // Callback to refresh list
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Lỗi khi lưu sản phẩm. Vui lòng thử lại.');
    }
  }, [editingProduct, currentRequest, onSave]);

  return (
    <SharedProductDialog
      open={open}
      onOpenChange={onOpenChange}
      product={editingProduct || undefined}
      categories={categories}
      externalForm={currentRequest}
      onFormChange={handleFormChange}
      onSave={handleSave}
    />
  );
}

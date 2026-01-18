import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { Product } from '../../types';
import type { ProductFormData } from '../../types/admin';
import { getCategoriesDropdown, type CategoryDropdown } from '../../services/categoriesApi';

const defaultFormData: ProductFormData = {
  name: '',
  categoryName: '',
  basePrice: '',
  originalPrice: '',
  unit: '',
  stockQuantity: '',
  imageUrl: '',
  description: '',
};

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  onSave: () => void;
  // Optional props for external form control (backwards compatibility)
  productForm?: ProductFormData;
  onUpdateForm?: (field: keyof ProductFormData, value: string) => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  editingProduct,
  onSave,
  productForm: externalForm,
  onUpdateForm: externalUpdateForm,
}: ProductDialogProps) {
  const [internalForm, setInternalForm] = useState<ProductFormData>(defaultFormData);
  const [categories, setCategories] = useState<CategoryDropdown[]>([]);
  const [loading, setLoading] = useState(false);

  // Use external or internal form
  const productForm = externalForm || internalForm;
  const updateForm = useCallback((field: keyof ProductFormData, value: string) => {
    if (externalUpdateForm) {
      externalUpdateForm(field, value);
    } else {
      setInternalForm(prev => ({ ...prev, [field]: value }));
    }
  }, [externalUpdateForm]);

  // Initialize form when editing
  useEffect(() => {
    if (open && editingProduct && !externalForm) {
      setInternalForm({
        name: editingProduct.name,
        categoryName: editingProduct.categoryName || '',
        basePrice: editingProduct.basePrice.toString(),
        originalPrice: editingProduct.originalPrice?.toString() || '',
        unit: editingProduct.unit || '',
        stockQuantity: editingProduct.stockQuantity?.toString() || '',
        imageUrl: editingProduct.imageUrl || '',
        description: editingProduct.description || '',
      });
    } else if (open && !editingProduct && !externalForm) {
      setInternalForm(defaultFormData);
    }
  }, [open, editingProduct, externalForm]);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategoriesDropdown();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    const selectedCategory = categories.find(c => c.id.toString() === value);
    if (selectedCategory) {
      updateForm('categoryName', selectedCategory.name);
    }
  };

  const getCurrentCategoryId = () => {
    const category = categories.find(c => c.name === productForm.categoryName);
    return category?.id.toString() || '';
  };

  const handleSave = () => {
    onSave();
    if (!externalForm) {
      setInternalForm(defaultFormData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </DialogTitle>
          <DialogDescription>Điền đầy đủ thông tin sản phẩm bên dưới</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tên sản phẩm *</Label>
            <Input
              value={productForm.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="VD: Gạo ST25 Cao Cấp"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Danh mục *</Label>
              {categories.length > 0 ? (
                <Select
                  value={getCurrentCategoryId()}
                  onValueChange={handleCategoryChange}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Đang tải..." : "Chọn danh mục"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.parentName ? `${category.parentName} > ` : ''}{category.name}
                        {category.productCount !== undefined && category.productCount > 0 && (
                          <span className="text-gray-400 ml-2">({category.productCount})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={productForm.categoryName}
                  onChange={(e) => updateForm('categoryName', e.target.value)}
                  placeholder="VD: Thực phẩm khô"
                />
              )}
            </div>
            <div>
              <Label>Đơn vị *</Label>
              <Input
                value={productForm.unit}
                onChange={(e) => updateForm('unit', e.target.value)}
                placeholder="VD: 5kg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Giá bán *</Label>
              <Input
                type="number"
                value={productForm.basePrice}
                onChange={(e) => updateForm('basePrice', e.target.value)}
                placeholder="185000"
              />
            </div>
            <div>
              <Label>Giá gốc</Label>
              <Input
                type="number"
                value={productForm.originalPrice}
                onChange={(e) => updateForm('originalPrice', e.target.value)}
                placeholder="200000"
              />
            </div>
            <div>
              <Label>Tồn kho *</Label>
              <Input
                type="number"
                value={productForm.stockQuantity}
                onChange={(e) => updateForm('stockQuantity', e.target.value)}
                placeholder="150"
              />
            </div>
          </div>
          <div>
            <Label>URL hình ảnh</Label>
            <Input
              value={productForm.imageUrl}
              onChange={(e) => updateForm('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              value={productForm.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="Mô tả chi tiết về sản phẩm..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
            {editingProduct ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

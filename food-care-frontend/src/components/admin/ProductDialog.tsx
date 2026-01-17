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
import type { Product } from '../../types';
import type { ProductFormData } from '../../types/admin';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  productForm: ProductFormData;
  onUpdateForm: (field: keyof ProductFormData, value: string) => void;
  onSave: () => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  editingProduct,
  productForm,
  onUpdateForm,
  onSave,
}: ProductDialogProps) {
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
              onChange={(e) => onUpdateForm('name', e.target.value)}
              placeholder="VD: Gạo ST25 Cao Cấp"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Danh mục *</Label>
              <Input
                value={productForm.category}
                onChange={(e) => onUpdateForm('category', e.target.value)}
                placeholder="VD: Thực phẩm khô"
              />
            </div>
            <div>
              <Label>Đơn vị *</Label>
              <Input
                value={productForm.unit}
                onChange={(e) => onUpdateForm('unit', e.target.value)}
                placeholder="VD: 5kg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Giá bán *</Label>
              <Input
                type="number"
                value={productForm.price}
                onChange={(e) => onUpdateForm('price', e.target.value)}
                placeholder="185000"
              />
            </div>
            <div>
              <Label>Giá gốc</Label>
              <Input
                type="number"
                value={productForm.originalPrice}
                onChange={(e) => onUpdateForm('originalPrice', e.target.value)}
                placeholder="200000"
              />
            </div>
            <div>
              <Label>Tồn kho *</Label>
              <Input
                type="number"
                value={productForm.stock}
                onChange={(e) => onUpdateForm('stock', e.target.value)}
                placeholder="150"
              />
            </div>
          </div>
          <div>
            <Label>URL hình ảnh</Label>
            <Input
              value={productForm.image}
              onChange={(e) => onUpdateForm('image', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              value={productForm.description}
              onChange={(e) => onUpdateForm('description', e.target.value)}
              placeholder="Mô tả chi tiết về sản phẩm..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSave}>
            {editingProduct ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

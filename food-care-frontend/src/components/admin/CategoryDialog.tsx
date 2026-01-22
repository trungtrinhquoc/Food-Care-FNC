import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from './Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  createCategory,
  updateCategory,
  type AdminCategory,
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from '../../services/categoriesApi';
import { uploadMultipleToCloudinary } from '../../utils/cloudinary';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminCategory | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  imageUrl: '',
  description: '',
  isActive: true,
};

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      if (category) {
        setFormData({
          name: category.name,
          imageUrl: category.imageUrl || '',
          description: category.description || '',
          isActive: category.isActive,
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, category]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    setSaving(true);
    try {
      if (category) {
        // Update
        const updateData: UpdateCategoryDto = {
          name: formData.name,
          imageUrl: formData.imageUrl || undefined,
          description: formData.description || undefined,
          isActive: formData.isActive,
        };
        await updateCategory(category.id, updateData);
      } else {
        // Create
        const createData: CreateCategoryDto = {
          name: formData.name,
          imageUrl: formData.imageUrl || undefined,
          description: formData.description || undefined,
        };
        await createCategory(createData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Không thể lưu danh mục. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </DialogTitle>
          <DialogDescription>
            Điền đầy đủ thông tin danh mục bên dưới
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tên danh mục *</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="VD: Thực phẩm khô"
            />
          </div>

          <div className="space-y-2">
            <Label>Hình ảnh danh mục</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={async (e) => {
                if (!e.target.files || e.target.files.length === 0) return;

                try {
                  setUploading(true);
                  const results = await uploadMultipleToCloudinary(
                    Array.from(e.target.files)
                  );
                  if (results.length > 0) {
                    updateForm('imageUrl', results[0].url);
                  }
                } catch (err) {
                  alert((err as Error).message);
                } finally {
                  setUploading(false);
                }
              }}
            />
            {formData.imageUrl && (
              <div className="relative inline-block">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="h-24 w-24 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => updateForm('imageUrl', '')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="Mô tả về danh mục..."
              rows={3}
            />
          </div>

          {category && (
            <div className="flex items-center justify-between">
              <Label>Trạng thái hoạt động</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => updateForm('isActive', checked)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || uploading}>
            Hủy
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={saving || uploading}
          >
            {saving ? 'Đang lưu...' : (category ? 'Cập nhật' : 'Thêm mới')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

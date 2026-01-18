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
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  getCategoriesDropdown,
  createCategory,
  updateCategory,
  type AdminCategory,
  type CategoryDropdown,
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from '../../services/categoriesApi';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminCategory | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  parentId: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  parentId: '',
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
  const [categories, setCategories] = useState<CategoryDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategoriesDropdown();
      // Filter out current category if editing (prevent self-reference)
      const filtered = category 
        ? data.filter(c => c.id !== category.id)
        : data;
      setCategories(filtered);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (open) {
      loadCategories();
      if (category) {
        setFormData({
          name: category.name,
          parentId: category.parentId?.toString() || '',
          imageUrl: category.imageUrl || '',
          description: category.description || '',
          isActive: category.isActive,
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, category, loadCategories]);

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
          parentId: formData.parentId ? parseInt(formData.parentId) : null,
          imageUrl: formData.imageUrl || undefined,
          description: formData.description || undefined,
          isActive: formData.isActive,
        };
        await updateCategory(category.id, updateData);
      } else {
        // Create
        const createData: CreateCategoryDto = {
          name: formData.name,
          parentId: formData.parentId ? parseInt(formData.parentId) : null,
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

          <div>
            <Label>Danh mục</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) => updateForm('parentId', value === 'none' ? '' : value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Đang tải..." : "Chọn danh mục"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Trống</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.parentName ? `${cat.parentName} > ` : ''}{cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>URL hình ảnh</Label>
            <Input
              value={formData.imageUrl}
              onChange={(e) => updateForm('imageUrl', e.target.value)}
              placeholder="https://..."
            />
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : (category ? 'Cập nhật' : 'Thêm mới')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useCallback } from 'react';
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
import type { Supplier, SupplierFormData } from '../../types/admin';

const defaultFormData: SupplierFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  contact: '',
  products: '',
};

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSupplier: Supplier | null;
  onSave: () => void;
  // Optional props for external form control (backwards compatibility)
  supplierForm?: SupplierFormData;
  onUpdateForm?: (field: keyof SupplierFormData, value: string) => void;
}

export function SupplierDialog({
  open,
  onOpenChange,
  editingSupplier,
  onSave,
  supplierForm: externalForm,
  onUpdateForm: externalUpdateForm,
}: SupplierDialogProps) {
  const [internalForm, setInternalForm] = useState<SupplierFormData>(defaultFormData);

  // Use external or internal form
  const supplierForm = externalForm || internalForm;
  const updateForm = useCallback((field: keyof SupplierFormData, value: string) => {
    if (externalUpdateForm) {
      externalUpdateForm(field, value);
    } else {
      setInternalForm(prev => ({ ...prev, [field]: value }));
    }
  }, [externalUpdateForm]);

  // Initialize form when editing
  useEffect(() => {
    if (open && editingSupplier && !externalForm) {
      setInternalForm({
        name: editingSupplier.name,
        email: editingSupplier.email,
        phone: editingSupplier.phone,
        address: editingSupplier.address || '',
        contact: editingSupplier.contact || '',
        products: editingSupplier.products?.join(', ') || '',
      });
    } else if (open && !editingSupplier && !externalForm) {
      setInternalForm(defaultFormData);
    }
  }, [open, editingSupplier, externalForm]);

  const handleSave = () => {
    onSave();
    if (!externalForm) {
      setInternalForm(defaultFormData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
          </DialogTitle>
          <DialogDescription>Điền đầy đủ thông tin nhà cung cấp bên dưới</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tên nhà cung cấp *</Label>
            <Input
              value={supplierForm.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="VD: Công ty Lương Thực Miền Nam"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) => updateForm('email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <Label>Số điện thoại *</Label>
              <Input
                value={supplierForm.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder="0281234567"
              />
            </div>
          </div>
          <div>
            <Label>Địa chỉ</Label>
            <Input
              value={supplierForm.address}
              onChange={(e) => updateForm('address', e.target.value)}
              placeholder="KCN Tân Bình, TP.HCM"
            />
          </div>
          <div>
            <Label>Người liên hệ</Label>
            <Input
              value={supplierForm.contact}
              onChange={(e) => updateForm('contact', e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <Label>Sản phẩm cung cấp (phân cách bằng dấu phẩy)</Label>
            <Textarea
              value={supplierForm.products}
              onChange={(e) => updateForm('products', e.target.value)}
              placeholder="Gạo ST25, Gạo Jasmine, Ngũ cốc"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
            {editingSupplier ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

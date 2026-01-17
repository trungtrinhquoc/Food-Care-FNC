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
import type { Supplier, SupplierFormData } from '../../types/admin';

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSupplier: Supplier | null;
  supplierForm: SupplierFormData;
  onUpdateForm: (field: keyof SupplierFormData, value: string) => void;
  onSave: () => void;
}

export function SupplierDialog({
  open,
  onOpenChange,
  editingSupplier,
  supplierForm,
  onUpdateForm,
  onSave,
}: SupplierDialogProps) {
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
              onChange={(e) => onUpdateForm('name', e.target.value)}
              placeholder="VD: Công ty Lương Thực Miền Nam"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) => onUpdateForm('email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <Label>Số điện thoại *</Label>
              <Input
                value={supplierForm.phone}
                onChange={(e) => onUpdateForm('phone', e.target.value)}
                placeholder="0281234567"
              />
            </div>
          </div>
          <div>
            <Label>Địa chỉ</Label>
            <Input
              value={supplierForm.address}
              onChange={(e) => onUpdateForm('address', e.target.value)}
              placeholder="KCN Tân Bình, TP.HCM"
            />
          </div>
          <div>
            <Label>Người liên hệ</Label>
            <Input
              value={supplierForm.contact}
              onChange={(e) => onUpdateForm('contact', e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <Label>Sản phẩm cung cấp (phân cách bằng dấu phẩy)</Label>
            <Textarea
              value={supplierForm.products}
              onChange={(e) => onUpdateForm('products', e.target.value)}
              placeholder="Gạo ST25, Gạo Jasmine, Ngũ cốc"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSave}>
            {editingSupplier ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

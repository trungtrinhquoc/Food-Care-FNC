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
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  createUser,
  updateUser,
  getMemberTiers,
  type AdminUser,
  type CreateUserDto,
  type UpdateUserDto,
  type MemberTier,
} from '../../services/usersApi';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
  fullName: string;
  role: string;
  phoneNumber: string;
  avatarUrl: string;
  tierId: string;
  loyaltyPoints: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  fullName: '',
  role: 'customer',
  phoneNumber: '',
  avatarUrl: '',
  tierId: '',
  loyaltyPoints: '0',
  isActive: true,
};

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [tiers, setTiers] = useState<MemberTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTiers = useCallback(async () => {
    setTiersLoading(true);
    try {
      const data = await getMemberTiers();
      setTiers(data);
    } catch (error) {
      console.error('Failed to load tiers:', error);
    } finally {
      setTiersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadTiers();
      if (user) {
        setFormData({
          email: user.email,
          password: '',
          fullName: user.fullName || '',
          role: user.role,
          phoneNumber: user.phoneNumber || '',
          avatarUrl: user.avatarUrl || '',
          tierId: user.tierId?.toString() || '',
          loyaltyPoints: user.loyaltyPoints?.toString() || '0',
          isActive: user.isActive,
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, user, loadTiers]);

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      alert('Vui lòng nhập email');
      return;
    }

    if (!user && !formData.password.trim()) {
      alert('Vui lòng nhập mật khẩu');
      return;
    }

    setSaving(true);
    try {
      if (user) {
        // Update
        const updateData: UpdateUserDto = {
          fullName: formData.fullName || undefined,
          role: formData.role,
          phoneNumber: formData.phoneNumber || undefined,
          avatarUrl: formData.avatarUrl || undefined,
          tierId: formData.tierId ? parseInt(formData.tierId) : null,
          loyaltyPoints: parseInt(formData.loyaltyPoints) || 0,
          isActive: formData.isActive,
        };
        await updateUser(user.id, updateData);
      } else {
        // Create
        const createData: CreateUserDto = {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName || undefined,
          role: formData.role,
          phoneNumber: formData.phoneNumber || undefined,
          avatarUrl: formData.avatarUrl || undefined,
        };
        await createUser(createData);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      alert(error.response?.data?.message || 'Không thể lưu người dùng. Vui lòng thử lại.');
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
            {user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </DialogTitle>
          <DialogDescription>
            {user ? 'Cập nhật thông tin người dùng' : 'Tạo tài khoản mới cho người dùng'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder="email@example.com"
              disabled={!!user}
            />
          </div>

          {!user && (
            <div>
              <Label>Mật khẩu *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => updateForm('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}

          <div>
            <Label>Họ và tên</Label>
            <Input
              value={formData.fullName}
              onChange={(e) => updateForm('fullName', e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vai trò</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => updateForm('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Khách hàng</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Số điện thoại</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => updateForm('phoneNumber', e.target.value)}
                placeholder="0901234567"
              />
            </div>
          </div>

          <div>
            <Label>URL Avatar</Label>
            <Input
              value={formData.avatarUrl}
              onChange={(e) => updateForm('avatarUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Hạng thành viên - hiển thị cho cả tạo mới và chỉnh sửa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hạng thành viên</Label>
              <Select
                value={formData.tierId}
                onValueChange={(value) => updateForm('tierId', value === 'none' ? '' : value)}
                disabled={tiersLoading || formData.role === 'staff' || formData.role === 'admin'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id.toString()}>
                      {tier.name} ({tier.minPoint}+ điểm)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(formData.role === 'staff' || formData.role === 'admin') && (
                <p className="text-xs text-gray-500 mt-1">
                  Hạng thành viên chỉ áp dụng cho khách hàng
                </p>
              )}
            </div>

            {user && (
              <div>
                <Label>Điểm tích lũy</Label>
                <Input
                  type="number"
                  value={formData.loyaltyPoints}
                  onChange={(e) => updateForm('loyaltyPoints', e.target.value)}
                  placeholder="0"
                  disabled={formData.role === 'staff' || formData.role === 'admin'}
                />
              </div>
            )}
          </div>

          {user && (
            <>
              <div className="flex items-center justify-between">
                <Label>Trạng thái hoạt động</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateForm('isActive', checked)}
                />
              </div>
            </>
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
            {saving ? 'Đang lưu...' : (user ? 'Cập nhật' : 'Tạo mới')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

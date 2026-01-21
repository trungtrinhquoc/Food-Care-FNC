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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { customersService } from '../../services/admin';
import type { AdminUser, UpdateUserDto, MemberTierInfo } from '../../types/admin';
import { uploadMultipleToCloudinary } from '../../utils/cloudinary';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: AdminUser | null;
  onSuccess: () => void;
}

interface FormData {
  fullName: string;
  phoneNumber: string;
  avatarUrl: string;
  tierId: string;
  loyaltyPoints: string;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phoneNumber: '',
    avatarUrl: '',
    tierId: '',
    loyaltyPoints: '0',
  });
  const [tiers, setTiers] = useState<MemberTierInfo[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadTiers = useCallback(async () => {
    setTiersLoading(true);
    try {
      const data = await customersService.getMemberTiers();
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
      if (customer) {
        setFormData({
          fullName: customer.fullName || '',
          phoneNumber: customer.phoneNumber || '',
          avatarUrl: customer.avatarUrl || '',
          tierId: customer.tierId?.toString() || '',
          loyaltyPoints: customer.loyaltyPoints?.toString() || '0',
        });
      } else {
        setFormData({
          fullName: '',
          phoneNumber: '',
          avatarUrl: '',
          tierId: '',
          loyaltyPoints: '0',
        });
      }
    }
  }, [open, customer, loadTiers]);

  const handleSubmit = async () => {
    if (!customer) {
      alert('Không tìm thấy thông tin khách hàng');
      return;
    }

    setSaving(true);
    try {
      const updateData: UpdateUserDto = {
        fullName: formData.fullName || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        tierId: formData.tierId ? parseInt(formData.tierId) : null,
        loyaltyPoints: parseInt(formData.loyaltyPoints) || 0,
        isActive: customer.isActive, // Keep current status
      };
      await customersService.updateCustomer(customer.id, updateData);
      onSuccess();
    } catch (error: unknown) {
      console.error('Failed to save customer:', error);
      const errMsg = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      alert(errMsg || 'Không thể lưu thông tin khách hàng. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      setUploading(true);
      const results = await uploadMultipleToCloudinary(Array.from(e.target.files));
      if (results.length > 0) {
        updateForm('avatarUrl', results[0].url);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho khách hàng: {customer.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email - readonly */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={customer.email}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label>Họ và tên</Label>
            <Input
              value={formData.fullName}
              onChange={(e) => updateForm('fullName', e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <Label>Số điện thoại</Label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) => updateForm('phoneNumber', e.target.value)}
              placeholder="0901234567"
            />
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Ảnh đại diện</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleImageUpload}
            />
            {formData.avatarUrl && (
              <div className="relative inline-block">
                <img
                  src={formData.avatarUrl}
                  alt="Avatar preview"
                  className="h-20 w-20 object-cover rounded-full border"
                />
                <button
                  type="button"
                  onClick={() => updateForm('avatarUrl', '')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Hạng thành viên */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hạng thành viên</Label>
              <Select
                value={formData.tierId}
                onValueChange={(value) => updateForm('tierId', value === 'none' ? '' : value)}
                disabled={tiersLoading}
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
            </div>

            <div>
              <Label>Điểm tích lũy</Label>
              <Input
                type="number"
                value={formData.loyaltyPoints}
                onChange={(e) => updateForm('loyaltyPoints', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Statistics - readonly */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Thống kê</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tổng đơn hàng:</span>
                <span className="ml-2 font-medium">{customer.totalOrders}</span>
              </div>
              <div>
                <span className="text-gray-500">Tổng chi tiêu:</span>
                <span className="ml-2 font-medium text-emerald-600">
                  {customer.totalSpent?.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div>
                <span className="text-gray-500">Đánh giá:</span>
                <span className="ml-2 font-medium">{customer.totalReviews}</span>
              </div>
              <div>
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`ml-2 font-medium ${customer.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {customer.isActive ? 'Hoạt động' : 'Ngừng HĐ'}
                </span>
              </div>
            </div>
          </div>
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
            {saving ? 'Đang lưu...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

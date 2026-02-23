import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { SectionHeader, SectionSkeleton } from './SupplierLayout';
import {
    Settings,
    User,
    Building,
    Phone,
    Mail,
    MapPin,
    FileText,
    Shield,
    Bell,
    Save,
    Loader2,
} from 'lucide-react';
import type { SupplierProfile, UpdateProfileRequest } from '../../services/supplier/supplierApi';

interface SettingsSectionProps {
    profile: SupplierProfile | null;
    profileForm: UpdateProfileRequest;
    loading?: boolean;
    onUpdateForm: (form: UpdateProfileRequest) => void;
    onSave: () => Promise<void>;
}

export function SettingsSection({
    profile,
    profileForm,
    loading = false,
    onUpdateForm,
    onSave,
}: SettingsSectionProps) {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave();
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof UpdateProfileRequest, value: string) => {
        onUpdateForm({ ...profileForm, [field]: value });
    };

    if (loading) {
        return <SectionSkeleton />;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <SectionHeader
                title="Cài đặt tài khoản"
                description="Quản lý thông tin và cài đặt nhà cung cấp"
            />

            {/* Profile Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Thông tin doanh nghiệp</CardTitle>
                            <CardDescription>Thông tin cơ bản về nhà cung cấp</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                Tên nhà cung cấp
                            </Label>
                            <Input
                                id="name"
                                placeholder="Nhập tên doanh nghiệp"
                                value={profileForm.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPerson" className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                Người liên hệ
                            </Label>
                            <Input
                                id="contactPerson"
                                placeholder="Họ và tên người liên hệ"
                                value={profileForm.contactPerson || ''}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail" className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                Email liên hệ
                            </Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                placeholder="email@example.com"
                                value={profileForm.contactEmail || ''}
                                onChange={(e) => handleChange('contactEmail', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                Số điện thoại
                            </Label>
                            <Input
                                id="phone"
                                placeholder="0123 456 789"
                                value={profileForm.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            Địa chỉ
                        </Label>
                        <Textarea
                            id="address"
                            placeholder="Nhập địa chỉ đầy đủ"
                            value={profileForm.address || ''}
                            onChange={(e) => handleChange('address', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="taxCode" className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            Mã số thuế
                        </Label>
                        <Input
                            id="taxCode"
                            placeholder="Nhập mã số thuế"
                            value={profileForm.taxCode || ''}
                            onChange={(e) => handleChange('taxCode', e.target.value)}
                        />
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Lưu thay đổi
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Account Stats */}
            {profile && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Shield className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
                                <CardDescription>Trạng thái và thống kê tài khoản</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-500">Mã nhà cung cấp</p>
                                <p className="font-semibold">SUP-{String(profile.id).padStart(4, '0')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ngày tham gia</p>
                                <p className="font-semibold">
                                    {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                                <p className="font-semibold text-blue-600">{profile.productCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                                <p className="font-semibold text-emerald-600">{profile.totalOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Bell className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Cài đặt thông báo</CardTitle>
                            <CardDescription>Quản lý các thông báo nhận được</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">Đơn hàng mới</p>
                                <p className="text-sm text-gray-500">Nhận thông báo khi có đơn hàng mới</p>
                            </div>
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-5 h-5 accent-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">Sản phẩm sắp hết hàng</p>
                                <p className="text-sm text-gray-500">Cảnh báo khi tồn kho dưới ngưỡng</p>
                            </div>
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-5 h-5 accent-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">Đánh giá mới</p>
                                <p className="text-sm text-gray-500">Thông báo khi có đánh giá sản phẩm mới</p>
                            </div>
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-5 h-5 accent-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">Báo cáo hàng tuần</p>
                                <p className="text-sm text-gray-500">Nhận email tổng kết hàng tuần</p>
                            </div>
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-blue-600"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Ticket, Copy, Check, Percent, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface CouponRaw {
    id: number;
    code: string;
    discountType?: string;
    discountValue: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    startDate?: string;
    endDate?: string;
    usageLimit?: number;
    usageCount?: number;
    isActive?: boolean;
    createdAt?: string;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<CouponRaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponRaw | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'fixed',
        discountValue: '',
        minOrderValue: '',
        maxDiscountAmount: '',
        startDate: '',
        endDate: '',
        usageLimit: '',
        isActive: true
    });

    const fetchCoupons = async () => {
        try {
            const { data } = await api.get('/admin/coupons');
            setCoupons(data);
        } catch {
            toast.error('Lỗi tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const resetForm = () => setFormData({
        code: `KM${Math.floor(Math.random() * 90000 + 10000)}`,
        discountType: 'fixed',
        discountValue: '',
        minOrderValue: '',
        maxDiscountAmount: '',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        usageLimit: '100',
        isActive: true
    });

    const openCreateModal = () => {
        setEditingCoupon(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (coupon: CouponRaw) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discountType: coupon.discountType || 'fixed',
            discountValue: coupon.discountValue?.toString() || '',
            minOrderValue: coupon.minOrderValue?.toString() || '',
            maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
            startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
            endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : '',
            usageLimit: coupon.usageLimit?.toString() || '',
            isActive: coupon.isActive ?? true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
                maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
            };
            if (editingCoupon) {
                await api.put(`/admin/coupons/${editingCoupon.id}`, payload);
                toast.success('Cập nhật mã giảm giá thành công!');
            } else {
                await api.post('/admin/coupons', payload);
                toast.success('Tạo mã giảm giá thành công!');
            }
            setIsModalOpen(false);
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
        try {
            await api.delete(`/admin/coupons/${id}`);
            toast.success('Đã xóa mã giảm giá');
            fetchCoupons();
        } catch {
            toast.error('Lỗi khi xóa mã giảm giá');
        }
    };

    const handleCopy = (code: string, id: number) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast.success(`Đã copy mã "${code}"`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
    const isExpired = (c: CouponRaw) => c.endDate ? new Date(c.endDate) < new Date() : false;

    const filtered = coupons.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    const totalActive = coupons.filter(c => c.isActive && !isExpired(c)).length;
    const totalUsed = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);
    const totalExpired = coupons.filter(c => isExpired(c)).length;

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Quản lý Mã Giảm Giá</h1>
                        <p className="text-sm text-gray-500">Tạo và quản lý các voucher khuyến mãi</p>
                    </div>
                </div>
                <Button onClick={openCreateModal} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo mã mới
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Đang hoạt động</p>
                        <p className="text-2xl font-bold text-green-600">{totalActive}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Tổng lượt dùng</p>
                        <p className="text-2xl font-bold text-blue-600">{totalUsed}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Đã hết hạn</p>
                        <p className="text-2xl font-bold text-red-500">{totalExpired}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <Input
                    placeholder="Tìm kiếm mã giảm giá..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                />
            </div>

            {/* Coupon Cards Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                    <p className="text-gray-400 text-lg">Chưa có mã giảm giá nào</p>
                    <Button onClick={openCreateModal} variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-2" /> Tạo ngay
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(coupon => {
                        const expired = isExpired(coupon);
                        const usagePct = coupon.usageLimit ? Math.min(100, ((coupon.usageCount || 0) / coupon.usageLimit) * 100) : 0;
                        return (
                            <div
                                key={coupon.id}
                                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${!coupon.isActive || expired ? 'opacity-60 border-gray-200' : 'border-orange-100'}`}
                            >
                                {/* Top stripe */}
                                <div className={`h-1.5 w-full ${coupon.discountType === 'percentage' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-orange-400 to-amber-500'}`} />

                                <div className="p-5">
                                    {/* Code + Status */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${coupon.discountType === 'percentage' ? 'bg-purple-100' : 'bg-orange-100'}`}>
                                                {coupon.discountType === 'percentage'
                                                    ? <Percent className="w-5 h-5 text-purple-600" />
                                                    : <DollarSign className="w-5 h-5 text-orange-600" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 font-mono text-base">{coupon.code}</p>
                                                <p className="text-xs text-gray-500">
                                                    {coupon.discountType === 'percentage'
                                                        ? `Giảm ${coupon.discountValue}%${coupon.maxDiscountAmount ? ` (tối đa ${coupon.maxDiscountAmount.toLocaleString()}đ)` : ''}`
                                                        : `Giảm ${coupon.discountValue.toLocaleString()}đ`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {expired
                                                ? <Badge variant="destructive" className="text-xs">Hết hạn</Badge>
                                                : coupon.isActive
                                                    ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Hoạt động</Badge>
                                                    : <Badge variant="secondary" className="text-xs">Tạm dừng</Badge>}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="space-y-1 text-xs text-gray-500 mb-4">
                                        <div className="flex justify-between">
                                            <span>Đơn tối thiểu</span>
                                            <span className="font-medium text-gray-700">{coupon.minOrderValue ? `${coupon.minOrderValue.toLocaleString()}đ` : 'Không giới hạn'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Hiệu lực</span>
                                            <span className="font-medium text-gray-700">{formatDate(coupon.startDate)} → {formatDate(coupon.endDate)}</span>
                                        </div>
                                    </div>

                                    {/* Usage bar */}
                                    {coupon.usageLimit && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Đã dùng</span>
                                                <span>{coupon.usageCount || 0}/{coupon.usageLimit}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 60 ? 'bg-amber-400' : 'bg-green-400'}`}
                                                    style={{ width: `${usagePct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs"
                                            onClick={() => handleCopy(coupon.code, coupon.id)}
                                        >
                                            {copiedId === coupon.id
                                                ? <><Check className="w-3 h-3 mr-1 text-green-500" /> Đã copy</>
                                                : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs"
                                            onClick={() => openEditModal(coupon)}
                                        >
                                            <Edit className="w-3 h-3 mr-1" /> Sửa
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="text-xs px-3"
                                            onClick={() => handleDelete(coupon.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-orange-500" />
                            {editingCoupon ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Mã (Code)</Label>
                            <Input
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="font-mono font-semibold uppercase tracking-widest"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Loại giảm giá</Label>
                                <Select value={formData.discountType} onValueChange={v => setFormData({ ...formData, discountType: v, maxDiscountAmount: v === 'fixed' ? '' : formData.maxDiscountAmount })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">💰 Số tiền cố định</SelectItem>
                                        <SelectItem value="percentage">% Phần trăm</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Giá trị {formData.discountType === 'percentage' ? '(%)' : '(VNĐ)'}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={formData.discountType === 'percentage' ? 100 : undefined}
                                    value={formData.discountValue}
                                    onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Đơn tối thiểu (VNĐ)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="0 = không giới hạn"
                                    value={formData.minOrderValue}
                                    onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Giảm tối đa (VNĐ)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="Chỉ áp dụng với %"
                                    value={formData.maxDiscountAmount}
                                    onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                                    disabled={formData.discountType === 'fixed'}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Ngày bắt đầu</Label>
                                <Input type="datetime-local" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Ngày kết thúc</Label>
                                <Input type="datetime-local" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Giới hạn tổng lượt dùng</Label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="Để trống = không giới hạn"
                                value={formData.usageLimit}
                                onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <Label>Trạng thái hoạt động</Label>
                            <Switch checked={formData.isActive} onCheckedChange={c => setFormData({ ...formData, isActive: c })} />
                        </div>

                        <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                            {editingCoupon ? 'Lưu thay đổi' : 'Tạo mã giảm giá'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

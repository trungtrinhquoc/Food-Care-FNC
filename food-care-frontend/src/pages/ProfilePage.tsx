import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileApi } from '../services/api';
import { toast } from 'sonner';
import type { Order, Address, PaymentMethod, OrderStatus } from '../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { StatusBadge } from '../components/ui/status-badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
    User, Package, Clock, MapPin, CreditCard, Settings,
    Crown, TrendingUp, Star, Phone, Mail, Edit,
    Truck, CheckCircle, XCircle, AlertCircle, Plus, Loader2
} from 'lucide-react';

type MemberTierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

interface TierData {
    color: string;
    icon: string;
    minSpend: number;
    benefits: string[];
}

const memberTiers: Record<MemberTierName, TierData> = {
    Bronze: {
        color: 'bg-amber-700',
        icon: '🥉',
        minSpend: 0,
        benefits: ['Miễn phí vận chuyển đơn >200k', 'Điểm thưởng x1'],
    },
    Silver: {
        color: 'bg-gray-400',
        icon: '🥈',
        minSpend: 2000000,
        benefits: ['Miễn phí vận chuyển đơn >150k', 'Điểm thưởng x1.5', 'Ưu tiên hỗ trợ'],
    },
    Gold: {
        color: 'bg-yellow-500',
        icon: '🥇',
        minSpend: 5000000,
        benefits: ['Miễn phí vận chuyển tất cả đơn', 'Điểm thưởng x2', 'Ưu tiên hỗ trợ', 'Quà tặng sinh nhật'],
    },
    Platinum: {
        color: 'bg-purple-600',
        icon: '💎',
        minSpend: 10000000,
        benefits: ['Miễn phí vận chuyển + Giao hàng nhanh', 'Điểm thưởng x3', 'Hỗ trợ VIP 24/7', 'Quà tặng đặc biệt', 'Ưu đãi độc quyền'],
    },
};

export default function ProfilePage() {
    const { user, logout, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // State for data
    const [orders] = useState<Order[]>([]); // TODO: Implement orders API
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

    // Form states
    const [profileForm, setProfileForm] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        avatarUrl: user?.avatarUrl || '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Address form state
    const [addressForm, setAddressForm] = useState<Partial<Address>>({
        recipientName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        ward: '',
        isDefault: false,
    });
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [showAddressForm, setShowAddressForm] = useState(false);

    // Payment method form state
    const [paymentForm, setPaymentForm] = useState({
        provider: 'momo',
        last4Digits: '',
        isDefault: false,
    });
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    // Load addresses on mount
    useEffect(() => {
        loadAddresses();
    }, []);

    // Load payment methods on mount
    useEffect(() => {
        loadPaymentMethods();
    }, []);

    // Update profile form when user changes
    useEffect(() => {
        if (user) {
            setProfileForm({
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                avatarUrl: user.avatarUrl || '',
            });
        }
    }, [user]);

    const loadAddresses = async () => {
        try {
            setLoadingAddresses(true);
            const data = await profileApi.getAddresses();
            setAddresses(data);
        } catch (error: any) {
            console.error('Error loading addresses:', error);
            toast.error('Không thể tải danh sách địa chỉ');
        } finally {
            setLoadingAddresses(false);
        }
    };

    const loadPaymentMethods = async () => {
        try {
            setLoadingPaymentMethods(true);
            const data = await profileApi.getPaymentMethods();
            setPaymentMethods(data);
        } catch (error: any) {
            console.error('Error loading payment methods:', error);
            toast.error('Không thể tải danh sách phương thức thanh toán');
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profileForm.fullName.trim()) {
            toast.error('Họ tên không được để trống');
            return;
        }

        setLoading(true);

        try {
            await profileApi.updateProfile(profileForm);
            toast.success('Cập nhật thông tin thành công!');
            // Reload user data
            await refreshUser();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);

        try {
            await profileApi.changePassword(passwordForm);
            toast.success('Đổi mật khẩu thành công!');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!addressForm.recipientName || !addressForm.phoneNumber || !addressForm.addressLine1 || !addressForm.city) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setLoading(true);

        try {
            if (editingAddressId) {
                // Update existing address
                await profileApi.updateAddress(editingAddressId, addressForm as Omit<Address, 'id'>);
                toast.success('Cập nhật địa chỉ thành công!');
            } else {
                // Create new address
                await profileApi.createAddress(addressForm as Omit<Address, 'id'>);
                toast.success('Thêm địa chỉ thành công!');
            }

            await loadAddresses();
            setShowAddressForm(false);
            setEditingAddressId(null);
            setAddressForm({
                recipientName: '',
                phoneNumber: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                district: '',
                ward: '',
                isDefault: false,
            });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

        setLoading(true);

        try {
            await profileApi.deleteAddress(addressId);
            toast.success('Xóa địa chỉ thành công!');
            await loadAddresses();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Không thể xóa địa chỉ';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefaultAddress = async (addressId: string) => {
        setLoading(true);

        try {
            await profileApi.setDefaultAddress(addressId);
            toast.success('Đã đặt làm địa chỉ mặc định!');
            await loadAddresses();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditAddress = (address: Address) => {
        setAddressForm(address);
        setEditingAddressId(address.id);
        setShowAddressForm(true);
    };

    const handleSavePaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!paymentForm.provider) {
            toast.error('Vui lòng chọn phương thức thanh toán');
            return;
        }

        setLoading(true);

        try {
            const data = {
                provider: paymentForm.provider,
                providerToken: 'mock_token_' + Date.now(),
                last4Digits: paymentForm.last4Digits || undefined,
                isDefault: paymentForm.isDefault,
            };

            if (editingPaymentId) {
                // Update existing payment method
                await profileApi.updatePaymentMethod(editingPaymentId, data as any);
                toast.success('Cập nhật phương thức thanh toán thành công!');
            } else {
                // Create new payment method
                await profileApi.createPaymentMethod(data as any);
                toast.success('Thêm phương thức thanh toán thành công!');
            }

            await loadPaymentMethods();
            setShowPaymentForm(false);
            setEditingPaymentId(null);
            setPaymentForm({
                provider: 'momo',
                last4Digits: '',
                isDefault: false,
            });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePaymentMethod = async (paymentMethodId: string) => {
        if (!confirm('Bạn có chắc muốn xóa phương thức thanh toán này?')) return;

        setLoading(true);

        try {
            await profileApi.deletePaymentMethod(paymentMethodId);
            toast.success('Xóa phương thức thanh toán thành công!');
            await loadPaymentMethods();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Không thể xóa phương thức thanh toán';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
        setLoading(true);

        try {
            await profileApi.setDefaultPaymentMethod(paymentMethodId);
            toast.success('Đã đặt làm phương thức mặc định!');
            await loadPaymentMethods();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditPaymentMethod = (method: PaymentMethod) => {
        setPaymentForm({
            provider: method.provider,
            last4Digits: method.last4Digits || '',
            isDefault: method.isDefault,
        });
        setEditingPaymentId(method.id);
        setShowPaymentForm(true);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-96">
                    <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center text-gray-400">
                            <User className="w-12 h-12" />
                        </div>
                        <h3 className="mb-2 font-semibold text-lg">Vui lòng đăng nhập</h3>
                        <p className="text-gray-600 mb-4">
                            Bạn cần đăng nhập để xem thông tin cá nhân
                        </p>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            Đăng nhập
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Get member tier info
    const userTierName = (user.memberTier?.nameVi || 'Bronze') as MemberTierName;
    const currentTier = memberTiers[userTierName] || memberTiers.Bronze;
    const tierKeys = Object.keys(memberTiers) as MemberTierName[];
    const currentTierIndex = tierKeys.indexOf(userTierName);
    const nextTier = currentTierIndex < tierKeys.length - 1 ? tierKeys[currentTierIndex + 1] : null;
    const nextTierData = nextTier ? memberTiers[nextTier] : null;
    const userTotalSpent = user.totalSpent || 0;
    const progressToNextTier = nextTierData
        ? Math.min((userTotalSpent / nextTierData.minSpend) * 100, 100)
        : 100;

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case 'Pending':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'Processing':
                return <AlertCircle className="w-5 h-5 text-blue-600" />;
            case 'Shipping':
                return <Truck className="w-5 h-5 text-purple-600" />;
            case 'Delivered':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'Cancelled':
                return <XCircle className="w-5 h-5 text-red-600" />;
        }
    };

    const getStatusText = (status: OrderStatus) => {
        const statusMap: Record<OrderStatus, string> = {
            Pending: 'Chờ xác nhận',
            Processing: 'Đang xử lý',
            Shipping: 'Đang giao',
            Delivered: 'Đã giao',
            Cancelled: 'Đã hủy',
        };
        return statusMap[status];
    };

    const getStatusColor = (status: OrderStatus) => {
        const colorMap: Record<OrderStatus, string> = {
            Pending: 'bg-yellow-100 text-yellow-800',
            Processing: 'bg-blue-100 text-blue-800',
            Shipping: 'bg-purple-100 text-purple-800',
            Delivered: 'bg-green-100 text-green-800',
            Cancelled: 'bg-red-100 text-red-800',
        };
        return colorMap[status];
    };

    // Mock total orders count
    const totalOrders = orders.length;
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Avatar className="w-24 h-24 border-4 border-white/30">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="bg-white text-emerald-600 text-2xl">
                                {user.fullName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <h1 className="text-white text-3xl font-bold">{user.fullName}</h1>
                                <StatusBadge className={`${currentTier.color} text-white border-0`}>
                                    {currentTier.icon} {userTierName}
                                </StatusBadge>
                            </div>
                            <p className="text-emerald-100 mb-2">Khách hàng từ {joinDate}</p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    <span>{totalOrders} đơn hàng</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>{(userTotalSpent / 1000000).toFixed(1)}M đã mua</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={logout}
                            className="bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20"
                        >
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container mx-auto px-4 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 bg-white shadow-sm">
                        <TabsTrigger value="overview">
                            <User className="w-4 h-4" /> <span className="ml-2">Tổng quan</span>
                        </TabsTrigger>
                        <TabsTrigger value="orders">
                            <Package className="w-4 h-4" /> <span className="ml-2">Đơn hàng</span>
                        </TabsTrigger>
                        <TabsTrigger value="membership">
                            <Crown className="w-4 h-4" /> <span className="ml-2">Hạng thành viên</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="w-4 h-4" /> <span className="ml-2">Cài đặt</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Đơn hàng</p>
                                            <p className="text-2xl font-bold mt-1">{totalOrders}</p>
                                        </div>
                                        <Package className="w-8 h-8 text-emerald-600" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                                            <p className="text-2xl font-bold mt-1">{(userTotalSpent / 1000000).toFixed(1)}M</p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-blue-600" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Điểm tích lũy</p>
                                            <p className="text-2xl font-bold mt-1">{user.loyaltyPoints?.toLocaleString('vi-VN') || 0}</p>
                                        </div>
                                        <Star className="w-8 h-8 text-amber-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Địa chỉ</p>
                                            <p className="text-2xl font-bold mt-1">{addresses.length}</p>
                                        </div>
                                        <MapPin className="w-8 h-8 text-purple-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Personal Info & Address */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin cá nhân</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                    {user.phoneNumber && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-600">Số điện thoại</p>
                                                <p className="font-medium">{user.phoneNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                    <Separator />
                                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('settings')}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Chỉnh sửa thông tin
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Địa chỉ giao hàng</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {loadingAddresses ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                        </div>
                                    ) : addresses.filter(a => a.isDefault).length > 0 ? (
                                        addresses.filter(a => a.isDefault).map(address => (
                                            <div key={address.id} className="flex items-start gap-3">
                                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium">{address.recipientName}</p>
                                                        <StatusBadge variant="secondary">Mặc định</StatusBadge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{address.phoneNumber}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {address.addressLine1}, {address.district}, {address.city}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">Chưa có địa chỉ nào</p>
                                    )}
                                    <Separator />
                                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('settings')}>
                                        Quản lý địa chỉ
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Orders Tab */}
                    <TabsContent value="orders" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch sử đơn hàng</CardTitle>
                                <CardDescription>
                                    {orders.length > 0 ? `Tất cả đơn hàng của bạn (${orders.length})` : 'Bạn chưa có đơn hàng nào'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500">Chưa có đơn hàng nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map(order => (
                                            <Card key={order.id} className="border-2">
                                                <CardContent className="pt-6">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className="font-bold">{order.orderNumber}</h4>
                                                                <StatusBadge className={getStatusColor(order.status)}>
                                                                    {getStatusIcon(order.status)}
                                                                    <span className="ml-1">{getStatusText(order.status)}</span>
                                                                </StatusBadge>
                                                            </div>
                                                            <p className="text-sm text-gray-600">
                                                                Đặt hàng: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-gray-600 text-sm">Tổng tiền</p>
                                                            <p className="text-emerald-600 text-xl font-bold">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                                                        </div>
                                                    </div>

                                                    <Separator className="my-4" />

                                                    <div className="space-y-3">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex gap-3">
                                                                <div className="flex-1">
                                                                    <p className="font-medium">{item.productName}</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')}đ
                                                                    </p>
                                                                    {item.isSubscription && item.subscriptionFrequency && (
                                                                        <StatusBadge variant="secondary" className="mt-1">
                                                                            📦 {item.subscriptionFrequency === 'Monthly' ? 'Hàng tháng' : item.subscriptionFrequency}
                                                                        </StatusBadge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Membership Tab */}
                    <TabsContent value="membership" className="space-y-6">
                        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className={`w-16 h-16 ${currentTier.color} rounded-full flex items-center justify-center text-3xl`}>
                                        {currentTier.icon}
                                    </div>
                                    <div>
                                        <CardTitle>Hạng {userTierName}</CardTitle>
                                        <CardDescription>
                                            Bạn đã chi tiêu {userTotalSpent.toLocaleString('vi-VN')}đ
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {nextTierData && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium">Tiến độ lên hạng {nextTier}</p>
                                            <p className="text-sm font-medium">
                                                {userTotalSpent.toLocaleString('vi-VN')}đ / {nextTierData.minSpend.toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                        <Progress value={progressToNextTier} className="h-2" />
                                        <p className="text-sm text-gray-600 mt-2">
                                            Còn {(nextTierData.minSpend - userTotalSpent).toLocaleString('vi-VN')}đ để lên hạng {nextTier}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="font-semibold">Quyền lợi của bạn:</h4>
                                    {currentTier.benefits.map((benefit, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            <p className="text-sm">{benefit}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Tất cả hạng thành viên</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {tierKeys.map(tier => {
                                        const tierData = memberTiers[tier];
                                        const isCurrentTier = tier === userTierName;
                                        return (
                                            <div
                                                key={tier}
                                                className={`p-4 border-2 rounded-lg ${isCurrentTier ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-12 h-12 ${tierData.color} rounded-full flex items-center justify-center text-2xl`}>
                                                        {tierData.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold">Hạng {tier}</h4>
                                                            {isCurrentTier && (
                                                                <StatusBadge className="bg-emerald-600 text-white">Hạng hiện tại</StatusBadge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            Từ {tierData.minSpend.toLocaleString('vi-VN')}đ
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    {tierData.benefits.map((benefit, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                            <p className="text-sm">{benefit}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        {/* Edit Profile */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin cá nhân</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="fullName">Họ và tên *</Label>
                                            <Input
                                                id="fullName"
                                                value={profileForm.fullName}
                                                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                                className="mt-1"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phoneNumber">Số điện thoại</Label>
                                            <Input
                                                id="phoneNumber"
                                                value={profileForm.phoneNumber}
                                                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="avatarUrl">Avatar URL</Label>
                                            <Input
                                                id="avatarUrl"
                                                value={profileForm.avatarUrl}
                                                onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            'Lưu thay đổi'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Addresses */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Địa chỉ giao hàng</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setAddressForm({
                                                recipientName: '',
                                                phoneNumber: '',
                                                addressLine1: '',
                                                addressLine2: '',
                                                city: '',
                                                district: '',
                                                ward: '',
                                                isDefault: false,
                                            });
                                            setEditingAddressId(null);
                                            setShowAddressForm(true);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm địa chỉ
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {showAddressForm && (
                                    <form onSubmit={handleSaveAddress} className="mb-6 p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-semibold mb-4">{editingAddressId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="addressName">Tên người nhận *</Label>
                                                <Input
                                                    id="addressName"
                                                    value={addressForm.recipientName}
                                                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="addressPhone">Số điện thoại *</Label>
                                                <Input
                                                    id="addressPhone"
                                                    value={addressForm.phoneNumber}
                                                    onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label htmlFor="addressLine">Địa chỉ *</Label>
                                                <Input
                                                    id="addressLine"
                                                    value={addressForm.addressLine1}
                                                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="addressCity">Thành phố *</Label>
                                                <Input
                                                    id="addressCity"
                                                    value={addressForm.city}
                                                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="addressDistrict">Quận/Huyện</Label>
                                                <Input
                                                    id="addressDistrict"
                                                    value={addressForm.district}
                                                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={addressForm.isDefault}
                                                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm">Đặt làm địa chỉ mặc định</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button type="submit" disabled={loading}>
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowAddressForm(false);
                                                    setEditingAddressId(null);
                                                }}
                                            >
                                                Hủy
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {loadingAddresses ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                                    </div>
                                ) : addresses.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Chưa có địa chỉ nào</p>
                                ) : (
                                    <div className="space-y-4">
                                        {addresses.map(address => (
                                            <div key={address.id} className="p-4 border rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-medium">{address.recipientName}</p>
                                                            {address.isDefault && (
                                                                <StatusBadge variant="secondary">Mặc định</StatusBadge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">{address.phoneNumber}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {address.addressLine1}, {address.district}, {address.city}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditAddress(address)}
                                                            disabled={loading}
                                                        >
                                                            Sửa
                                                        </Button>
                                                        {!address.isDefault && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleSetDefaultAddress(address.id)}
                                                                    disabled={loading}
                                                                >
                                                                    Đặt mặc định
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteAddress(address.id)}
                                                                    disabled={loading}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Phương thức thanh toán</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setPaymentForm({
                                                provider: 'momo',
                                                last4Digits: '',
                                                isDefault: false,
                                            });
                                            setEditingPaymentId(null);
                                            setShowPaymentForm(true);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm phương thức
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {showPaymentForm && (
                                    <form onSubmit={handleSavePaymentMethod} className="mb-6 p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-semibold mb-4">{editingPaymentId ? 'Sửa phương thức' : 'Thêm phương thức mới'}</h4>
                                        <div className="grid gap-4">
                                            <div>
                                                <Label htmlFor="paymentType">Loại *</Label>
                                                <select
                                                    id="paymentType"
                                                    value={paymentForm.provider}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg border"
                                                    required
                                                >
                                                    <option value="momo">MoMo</option>
                                                    <option value="zalopay">ZaloPay</option>
                                                    <option value="card">Thẻ tín dụng/ghi nợ</option>
                                                    <option value="bank">Chuyển khoản ngân hàng</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label htmlFor="paymentName">Tên hiển thị (tùy chọn)</Label>
                                                <Input
                                                    id="paymentName"
                                                    value={paymentForm.provider}
                                                    disabled
                                                    placeholder="Tự động từ loại"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="paymentLast4">4 số cuối (tùy chọn)</Label>
                                                <Input
                                                    id="paymentLast4"
                                                    value={paymentForm.last4Digits}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, last4Digits: e.target.value })}
                                                    maxLength={4}
                                                    placeholder="1234"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={paymentForm.isDefault}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, isDefault: e.target.checked })}
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm">Đặt làm phương thức mặc định</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button type="submit" disabled={loading}>
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowPaymentForm(false);
                                                    setEditingPaymentId(null);
                                                }}
                                            >
                                                Hủy
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {loadingPaymentMethods ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                                    </div>
                                ) : paymentMethods.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Chưa có phương thức thanh toán nào</p>
                                ) : (
                                    <div className="space-y-4">
                                        {paymentMethods.map(method => (
                                            <div key={method.id} className="p-4 border rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <CreditCard className="w-8 h-8 text-gray-400" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium">{method.provider}</p>
                                                                {method.isDefault && (
                                                                    <StatusBadge variant="secondary">Mặc định</StatusBadge>
                                                                )}
                                                            </div>
                                                            {method.last4Digits && (
                                                                <p className="text-sm text-gray-600">•••• {method.last4Digits}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditPaymentMethod(method)}
                                                            disabled={loading}
                                                        >
                                                            Sửa
                                                        </Button>
                                                        {!method.isDefault && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                                                    disabled={loading}
                                                                >
                                                                    Đặt mặc định
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                                                    disabled={loading}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Change Password */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Đổi mật khẩu</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <Label htmlFor="currentPassword">Mật khẩu hiện tại *</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="mt-1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="mt-1"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="mt-1"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Đang đổi...
                                            </>
                                        ) : (
                                            'Đổi mật khẩu'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
    Truck, CheckCircle, XCircle, AlertCircle, Plus, Loader2,
    Camera
} from 'lucide-react';
import { SimplePagination } from '../components/ui/pagination';
import { AddressSelector } from '../components/AddressSelector';
import { OrderDetailDialog } from '../components/OrderDetailDialog';
import { uploadToCloudinary } from '../utils/cloudinary';

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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // State for data
    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Orders pagination
    const [ordersPage, setOrdersPage] = useState(1);
    const ordersPageSize = 5;
    const ordersTotalPages = Math.ceil(orders.length / ordersPageSize);
    const paginatedOrders = useMemo(() => {
        const start = (ordersPage - 1) * ordersPageSize;
        return orders.slice(start, start + ordersPageSize);
    }, [orders, ordersPage]);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Ref for file input
    const avatarInputRef = useRef<HTMLInputElement>(null);

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

    // Load orders on mount
    useEffect(() => {
        loadOrders();
    }, []);

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

    const loadOrders = async () => {
        try {
            setLoadingOrders(true);
            const data = await profileApi.getOrders();
            setOrders(data);
        } catch (error: any) {
            console.error('Error loading orders:', error);
            // toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoadingOrders(false);
        }
    };

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

    const handleLogout = () => {
        logout();
        navigate('/');
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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        setUploadingAvatar(true);

        try {
            // Upload to Cloudinary
            const result = await uploadToCloudinary(file);

            // Update profile with new avatar URL
            await profileApi.updateProfile({
                ...profileForm,
                avatarUrl: result.url,
            });

            toast.success('Cập nhật ảnh đại diện thành công!');

            // Reload user data
            await refreshUser();
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            const message = error.message || 'Có lỗi xảy ra khi tải ảnh lên';
            toast.error(message);
        } finally {
            setUploadingAvatar(false);
            // Reset file input
            if (avatarInputRef.current) {
                avatarInputRef.current.value = '';
            }
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
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'confirmed':
            case 'processing':
                return <AlertCircle className="w-5 h-5 text-blue-600" />;
            case 'shipping':
                return <Truck className="w-5 h-5 text-purple-600" />;
            case 'delivered':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusText = (status: OrderStatus) => {
        const statusMap: Record<OrderStatus, string> = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            processing: 'Đang xử lý',
            shipping: 'Đang giao',
            delivered: 'Đã giao',
            cancelled: 'Đã hủy',
            returned: 'Đã trả hàng'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status: OrderStatus) => {
        const colorMap: Record<OrderStatus, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-blue-100 text-blue-800',
            shipping: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            returned: 'bg-gray-100 text-gray-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    // Mock total orders count
    const totalOrders = orders.length;
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <section className="relative overflow-hidden text-white py-8 md:py-12">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&h=400&fit=crop"
                        alt="Header Background"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-emerald-700/70 mix-blend-multiply"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="relative">
                            <Avatar className="w-20 h-20 md:w-28 md:h-28 border-4 border-white/20 shadow-2xl">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="bg-white text-emerald-600 text-2xl md:text-3xl font-bold">
                                    {user.fullName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2">
                                <StatusBadge className={`${currentTier.color} text-white border-2 border-white shadow-lg text-[10px] md:text-xs h-6 md:h-8`}>
                                    {currentTier.icon}
                                </StatusBadge>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                                <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">{user.fullName}</h1>
                                <StatusBadge className={`hidden md:flex ${currentTier.color} text-white border-0 px-3 py-1 shadow-sm text-xs font-bold`}>
                                    {userTierName}
                                </StatusBadge>
                            </div>
                            <p className="text-emerald-50/80 mb-4 text-sm font-medium">Khách hàng từ {joinDate}</p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md text-xs border border-white/10 font-semibold shadow-sm">
                                    <Package className="w-3.5 h-3.5 text-emerald-100" />
                                    <span>{totalOrders} đơn hàng</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md text-xs border border-white/10 font-semibold shadow-sm">
                                    <TrendingUp className="w-3.5 h-3.5 text-teal-100" />
                                    <span>{(userTotalSpent / 1000000).toFixed(1)}M đã mua</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-6 h-10 shadow-lg md:self-center text-sm rounded-xl transition-all"
                        >
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container mx-auto px-4 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-10 w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide no-scrollbar bg-gray-100/80 p-1.5 rounded-2xl border-none h-auto">
                        <TabsTrigger value="overview" className="flex items-center gap-2 px-6 py-3 data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/40 rounded-xl transition-all font-bold text-gray-600 hover:text-orange-500">
                            <User className="w-4 h-4" /> <span>Tổng quan</span>
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="flex items-center gap-2 px-6 py-3 data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/40 rounded-xl transition-all font-bold text-gray-600 hover:text-orange-500">
                            <Package className="w-4 h-4" /> <span>Đơn hàng</span>
                        </TabsTrigger>
                        <TabsTrigger value="membership" className="flex items-center gap-2 px-6 py-3 data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/40 rounded-xl transition-all font-bold text-gray-600 hover:text-orange-500">
                            <Crown className="w-4 h-4" /> <span>Hạng thành viên</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2 px-6 py-3 data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/40 rounded-xl transition-all font-bold text-gray-600 hover:text-orange-500">
                            <Settings className="w-4 h-4" /> <span>Cài đặt</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm">
                                <CardContent className="p-4 md:p-6 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-2 md:justify-between">
                                        <div className="p-2 md:p-0 bg-emerald-50 md:bg-transparent rounded-lg text-emerald-600 md:text-emerald-600">
                                            <Package className="w-6 h-6 md:hidden" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-gray-500 font-medium">Đơn hàng</p>
                                            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
                                        </div>
                                        <Package className="hidden md:block w-8 h-8 text-emerald-600 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm">
                                <CardContent className="p-4 md:p-6 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-2 md:justify-between">
                                        <div className="p-2 md:p-0 bg-blue-50 md:bg-transparent rounded-lg text-blue-600 md:text-blue-600">
                                            <TrendingUp className="w-6 h-6 md:hidden" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-gray-500 font-medium">Chi tiêu</p>
                                            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{(userTotalSpent / 1000000).toFixed(1)}M</p>
                                        </div>
                                        <TrendingUp className="hidden md:block w-8 h-8 text-blue-600 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm">
                                <CardContent className="p-4 md:p-6 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-2 md:justify-between">
                                        <div className="p-2 md:p-0 bg-amber-50 md:bg-transparent rounded-lg text-amber-600 md:text-amber-600">
                                            <Star className="w-6 h-6 md:hidden" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-gray-500 font-medium">Điểm tích lũy</p>
                                            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{user.loyaltyPoints || 0}</p>
                                        </div>
                                        <Star className="hidden md:block w-8 h-8 text-amber-500 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm">
                                <CardContent className="p-4 md:p-6 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-2 md:justify-between">
                                        <div className="p-2 md:p-0 bg-purple-50 md:bg-transparent rounded-lg text-purple-600 md:text-purple-600">
                                            <MapPin className="w-6 h-6 md:hidden" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-gray-500 font-medium">Địa chỉ</p>
                                            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{addresses.length}</p>
                                        </div>
                                        <MapPin className="hidden md:block w-8 h-8 text-purple-600 opacity-20" />
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
                                    <Button variant="outline" size="sm" className="w-full text-xs h-9 bg-gray-50/50 hover:bg-white transition-all shadow-none border-gray-200" onClick={() => setActiveTab('settings')}>
                                        <Edit className="w-3.5 h-3.5 mr-2" />
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
                                    <Button variant="outline" size="sm" className="w-full text-xs h-9 bg-gray-50/50 hover:bg-white transition-all shadow-none border-gray-200" onClick={() => setActiveTab('settings')}>
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
                                    {loadingOrders ? 'Đang tải danh sách đơn hàng...' : orders.length > 0 ? `Tất cả đơn hàng của bạn (${orders.length})` : 'Bạn chưa có đơn hàng nào'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingOrders ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
                                        <p className="text-gray-500">Đang tải đơn hàng...</p>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500">Chưa có đơn hàng nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {paginatedOrders.map(order => (
                                            <Card
                                                key={order.id}
                                                className="border-2 cursor-pointer hover:border-emerald-500 transition-all hover:shadow-md group"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setIsDetailOpen(true);
                                                }}
                                            >
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

                                        {/* Pagination */}
                                        {ordersTotalPages > 1 && (
                                            <SimplePagination
                                                currentPage={ordersPage}
                                                totalPages={ordersTotalPages}
                                                totalItems={orders.length}
                                                pageSize={ordersPageSize}
                                                onPageChange={setOrdersPage}
                                                itemLabel="đơn hàng"
                                                className="pt-4 border-t"
                                            />
                                        )}
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
                                {/* Avatar Upload Section */}
                                <div className="mb-6">
                                    <Label className="mb-3 block">Ảnh đại diện</Label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            <Avatar className="w-24 h-24 border-4 border-gray-100 shadow-lg">
                                                <AvatarImage src={user.avatarUrl} />
                                                <AvatarFallback className="bg-emerald-100 text-emerald-600 text-2xl font-bold">
                                                    {user.fullName.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Upload overlay */}
                                            <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                                            >
                                                {uploadingAvatar ? (
                                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                ) : (
                                                    <Camera className="w-8 h-8 text-white" />
                                                )}
                                            </button>
                                            {/* Hidden file input */}
                                            <input
                                                ref={avatarInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700 mb-1">
                                                Thay đổi ảnh đại diện
                                            </p>
                                            <p className="text-xs text-gray-500 mb-3">
                                                Nhấp vào ảnh để tải lên ảnh mới. Kích thước tối đa 5MB.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                                className="text-xs"
                                            >
                                                {uploadingAvatar ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                        Đang tải lên...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Camera className="w-3 h-3 mr-2" />
                                                        Chọn ảnh
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

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
                                            <div className="md:col-span-2 space-y-2">
                                                <Label>Tỉnh/Thành, Quận/Huyện, Phường/Xã *</Label>
                                                <AddressSelector
                                                    value={{
                                                        province: addressForm.city,
                                                        district: addressForm.district,
                                                        ward: addressForm.ward
                                                    }}
                                                    onChange={(val) => setAddressForm({
                                                        ...addressForm,
                                                        city: val.province,
                                                        district: val.district,
                                                        ward: val.ward
                                                    })}
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
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-2">Chưa có địa chỉ nào được lưu</p>
                                        <p className="text-xs text-gray-400">Địa chỉ sẽ được tự động lưu lại khi bạn đặt hàng lần đầu</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {addresses.map(addr => (
                                            <div key={addr.id} className={`p-4 border-2 rounded-xl transition-all relative overflow-hidden ${addr.isDefault ? 'border-orange-200 bg-orange-50/10' : 'border-gray-100 bg-white'}`}>
                                                <div className="flex items-start justify-between relative z-10">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-gray-900">{addr.recipientName}</p>
                                                            {addr.isDefault && (
                                                                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-orange-200 uppercase tracking-wider">
                                                                    Mặc định
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                                                            <span className="opacity-70 text-xs">📞</span> {addr.phoneNumber}
                                                        </p>
                                                        <p className="text-sm text-gray-500 leading-relaxed">
                                                            {addr.addressLine1}
                                                            <span className="text-gray-400 mx-1">•</span>
                                                            {addr.ward}, {addr.district}, {addr.city}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditAddress(addr)}
                                                            disabled={loading}
                                                        >
                                                            Sửa
                                                        </Button>
                                                        {!addr.isDefault && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleSetDefaultAddress(addr.id)}
                                                                    disabled={loading}
                                                                >
                                                                    Đặt mặc định
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteAddress(addr.id)}
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

            <OrderDetailDialog
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                order={selectedOrder}
            />
        </div >
    );
}

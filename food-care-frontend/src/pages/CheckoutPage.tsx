import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { AddressSelector } from '../components/AddressSelector';
import { orderApi } from '../services/orderApi';
import { paymentApi } from '../services/paymentApi';
import { profileApi } from '../services/api';
import type { Address, CreateOrderRequest } from '../types';
import { couponApi } from '../services/couponApi';
import type { CouponDto } from '../services/couponApi';
import { cloudinaryResize } from '../utils/cloudinary';

import { Calendar, CreditCard, MapPin, Package, Check, Plus, Ticket, Percent, Banknote, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

export default function CheckoutPage() {
    const [address, setAddress] = useState({
        province: '',
        district: '',
        ward: '',
    });
    const navigate = useNavigate();
    const { getSelectedItems, getSelectedTotal, clearSelectedItems } = useCart();
    const { user } = useAuth();

    const selectedItems = getSelectedItems();

    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'momo'>('cod');

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        notes: '',
    });

    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);

    // Chỉ giao hàng Đà Nẵng
    const DA_NANG_NAMES = ['Thành phố Đà Nẵng', 'Đà Nẵng', 'Da Nang', 'TP. Đà Nẵng', 'TP Đà Nẵng'];
    const isDaNangAddress = (addr: Address) =>
        DA_NANG_NAMES.some(n => addr.city?.toLowerCase().includes('đà nẵng') || addr.city?.toLowerCase().includes('da nang'));

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<CouponDto | null>(null);
    const [couponError, setCouponError] = useState('');
    const [availableCoupons, setAvailableCoupons] = useState<CouponDto[]>([]);
    const [showCouponModal, setShowCouponModal] = useState(false);

    /* =======================
       GUARD PAGE
    ======================= */
    useEffect(() => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để tiếp tục');
            navigate('/login');
            return;
        }

        if (selectedItems.length === 0) {
            navigate('/cart');
            return;
        }

        const fetchAddresses = async () => {
            try {
                const all = await profileApi.getAddresses();
                // Chỉ giữ địa chỉ Đà Nẵng
                const daNangAddrs = all.filter(a =>
                    a.city?.toLowerCase().includes('đà nẵng') ||
                    a.city?.toLowerCase().includes('da nang')
                );
                setSavedAddresses(daNangAddrs);

                // Ưu tiên default address Đà Nẵng
                const defaultAddr = daNangAddrs.find(a => a.isDefault) || daNangAddrs[0];
                if (defaultAddr) {
                    handleSelectAddress(defaultAddr);
                    setShowNewAddressForm(false);
                } else {
                    setShowNewAddressForm(true);
                    // FALLBACK: If no saved addresses, look at the last order
                    try {
                        const orders = await profileApi.getOrders();
                        if (orders && orders.length > 0) {
                            const lastOrder = orders[0];
                            if (lastOrder.shippingAddressSnapshot) {
                                try {
                                    const snapshot = JSON.parse(lastOrder.shippingAddressSnapshot);
                                    const addrStr = snapshot.address || '';

                                    // Set form data from last order
                                    setFormData(prev => ({
                                        ...prev,
                                        fullName: snapshot.recipientName || prev.fullName,
                                        phone: snapshot.phoneNumber || prev.phone,
                                        address: addrStr.split(',')[0].trim() || prev.address,
                                    }));

                                    // Note: Parsing province/district/ward from string is tricky,
                                    // but at least we fill the main fields.
                                } catch (e) {
                                    console.error('Error parsing last order address:', e);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error fetching orders for fallback:', e);
                    }
                }
            } catch (error) {
                console.error('Error fetching addresses:', error);
            }
        };

        fetchAddresses();
    }, [user, navigate]);

    /* =======================
       HANDLERS
    ======================= */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };
    const handleSelectAddress = (addr: Address) => {
        setSelectedAddressId(addr.id);
        setFormData(prev => ({
            ...prev,
            fullName: addr.recipientName,
            phone: addr.phoneNumber,
            address: addr.addressLine1,
            city: addr.city,
            district: addr.district || '',
            ward: addr.ward || '',
        }));
        setAddress({
            province: addr.city,
            district: addr.district || '',
            ward: addr.ward || '',
        });
        setShowNewAddressForm(false);
    };

    // Calculate final totals
    const subtotal = getSelectedTotal();

    useEffect(() => {
        if (user && selectedItems.length > 0) {
            const fetchCoupons = async () => {
                try {
                    const list = await couponApi.getAvailableCoupons(subtotal);
                    setAvailableCoupons(list);
                } catch (error) {
                    console.error('Lỗi tải mã giảm giá', error);
                }
            };
            fetchCoupons();
        }
    }, [user, subtotal]);

    const fullAddress = [formData.address, address.ward, address.district, address.province]
        .filter(part => part && part.trim() !== '')
        .join(', ');

    const handleApplyCoupon = async () => {
        setCouponError('');
        if (!couponCode.trim()) return;
        try {
            const result = await couponApi.validateCoupon(couponCode, getSelectedTotal());
            setAppliedCoupon(result);
            toast.success('Áp dụng mã giảm giá thành công');
        } catch (error: any) {
            setAppliedCoupon(null);
            setCouponError(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
    };

    const discountAmount = appliedCoupon?.discountType === 'percentage'
        ? subtotal * (appliedCoupon.discountValue / 100)
        : (appliedCoupon?.discountValue || 0);

    const finalDiscount = appliedCoupon?.maxDiscountAmount
        ? Math.min(discountAmount, appliedCoupon.maxDiscountAmount)
        : discountAmount;

    const finalTotal = subtotal - finalDiscount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.phone || !formData.address) {
            toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
            return;
        }

        // Kiểm tra địa chỉ phải ở Đà Nẵng
        const cityLower = (address.province || formData.city || '').toLowerCase();
        if (!cityLower.includes('đà nẵng') && !cityLower.includes('da nang')) {
            toast.error('⚠️ Hiện tại chúng tôi chỉ giao hàng trong khu vực Thành phố Đà Nẵng.');
            return;
        }

        if (!user) return;

        try {
            const payload: CreateOrderRequest = {
                userId: user.id,
                shippingAddress: fullAddress,
                recipientName: formData.fullName,
                phoneNumber: formData.phone,
                paymentMethod,
                note: formData.notes,
                couponCode: appliedCoupon?.code,
                items: selectedItems.map(item => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.subscription
                        ? item.product.basePrice * (1 - (item.subscription.discount || 0) / 100)
                        : item.product.basePrice,
                    variantSnapshot: {
                        isSubscription: !!item.subscription,
                        subscription: item.subscription ? {
                            frequency: item.subscription.frequency
                        } : undefined
                    },
                    // Subscription fields for backend
                    isSubscription: !!item.subscription,
                    subscriptionFrequency: item.subscription?.frequency,
                    subscriptionDiscount: item.subscription?.discount,
                })),
            };

            const order = await orderApi.createOrder(payload);

            // Auto-save address if it's new
            if (user && !selectedAddressId) {
                try {
                    await profileApi.createAddress({
                        recipientName: formData.fullName,
                        phoneNumber: formData.phone,
                        addressLine1: formData.address,
                        city: address.province,
                        district: address.district,
                        ward: address.ward,
                        isDefault: savedAddresses.length === 0, // Set default if first address
                    });
                } catch (saveError) {
                    console.error('Error auto-saving address:', saveError);
                }
            }

            // If online payment (bank or momo), create PayOS payment link
            if (paymentMethod === 'bank' || paymentMethod === 'momo') {
                try {
                    toast.info('Đang chuyển hướng đến cổng thanh toán...');
                    const paymentResponse = await paymentApi.createPayOsPayment({ orderId: order.id });
                    if (paymentResponse.checkoutUrl) {
                        window.location.href = paymentResponse.checkoutUrl;
                        return; // Stop here, browser will redirect
                    }
                } catch (payError: any) {
                    const serverMsg = payError?.response?.data?.message || payError?.response?.data?.detail || payError?.message || 'Unknown error';
                    console.error('Payment redirect error:', payError);
                    console.error('Server error message:', serverMsg);
                    toast.error(`❌ Lỗi tạo link thanh toán: ${serverMsg}`);
                    return;
                }
            }

            toast.success('Đặt hàng thành công 🎉');
            clearSelectedItems();
            navigate('/');
        } catch (error: any) {
            console.error(error);
            toast.error('Đặt hàng thất bại, vui lòng thử lại');
        }
    };



    /* =======================
       SUBSCRIPTION TEXT
    ======================= */
    const frequencyLabels: Record<string, string> = {
        weekly: 'Hàng tuần',
        biweekly: '2 tuần/lần',
        monthly: 'Hàng tháng',
        custom: 'Tùy chỉnh',
    };

    const getSubscriptionText = (item: any) => {
        if (!item.subscription) return '';
        if (item.subscription.frequency === 'custom') {
            const { value, unit } = item.subscription.customInterval;
            const unitText =
                unit === 'days' ? 'ngày' : unit === 'weeks' ? 'tuần' : 'tháng';
            return `Mỗi ${value} ${unitText}`;
        }
        return frequencyLabels[item.subscription.frequency];
    };

    if (!user || selectedItems.length === 0) return null;

    /* =======================
       RENDER
    ======================= */
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <h1 className="mb-4">Thanh Toán</h1>

                {/* Banner khu vực giao hàng */}
                <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 font-medium">
                    <span className="text-lg">🗺️</span>
                    <span>
                        <strong>Khu vực giao hàng:</strong> Hiện tại Food &amp; Care chỉ phục vụ giao hàng trong{' '}
                        <strong className="text-blue-900">Thành phố Đà Nẵng</strong>.
                        Chúng tôi sẽ mở rộng sang các tỉnh thành khác sớm nhất có thể.
                    </span>
                </div>

                <form onSubmit={handleSubmit}>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* ================= LEFT ================= */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* SHIPPING */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Thông Tin Giao Hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {savedAddresses.length > 0 && (
                                        <div className="space-y-3">
                                            <Label className="flex items-center gap-2">
                                                Địa chỉ đã lưu tại Đà Nẵng
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    {savedAddresses.length} địa chỉ
                                                </span>
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {savedAddresses.map(addr => (
                                                    <div
                                                        key={addr.id}
                                                        onClick={() => handleSelectAddress(addr)}
                                                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all relative overflow-hidden ${selectedAddressId === addr.id
                                                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                                                            : 'border-gray-100 hover:border-gray-300 bg-white'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start relative z-10">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-gray-900">{addr.recipientName}</p>
                                                                    {addr.isDefault && (
                                                                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-orange-200 uppercase tracking-wider">
                                                                            Mặc định
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-gray-600 text-sm flex items-center gap-1.5 font-medium">
                                                                    <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">📞</span>
                                                                    {addr.phoneNumber}
                                                                </p>
                                                                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                                                                    {addr.addressLine1}, {addr.ward}, {addr.district}, {addr.city}
                                                                </p>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedAddressId === addr.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                                                                {selectedAddressId === addr.id && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                        </div>
                                                        {selectedAddressId === addr.id && (
                                                            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-[100px] pointer-events-none" />
                                                        )}
                                                    </div>
                                                ))}
                                                <div
                                                    onClick={() => {
                                                        setSelectedAddressId('');
                                                        setShowNewAddressForm(true);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            fullName: user?.fullName || '',
                                                            phone: user?.phoneNumber || '',
                                                            address: '',
                                                            district: '',
                                                            ward: '',
                                                        }));
                                                    }}
                                                    className={`p-4 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all group ${showNewAddressForm && !selectedAddressId
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm'
                                                        : 'border-gray-200 text-gray-400 hover:border-emerald-400 hover:bg-gray-50 hover:text-emerald-500'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${showNewAddressForm && !selectedAddressId ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-200 group-hover:border-emerald-400'}`}>
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium">+ Sử dụng địa chỉ mới (Đà Nẵng)</span>
                                                </div>
                                            </div>
                                            <Separator className="my-4" />
                                        </div>
                                    )}

                                    {showNewAddressForm && (
                                        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold">Tên người nhận *</Label>
                                                    <Input
                                                        name="fullName"
                                                        placeholder="Nhập họ và tên người nhận"
                                                        value={formData.fullName}
                                                        onChange={handleChange}
                                                        className="h-11"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold">Số điện thoại *</Label>
                                                    <Input
                                                        name="phone"
                                                        placeholder="Nhập số điện thoại"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        className="h-11"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold">Email (Không bắt buộc)</Label>
                                                <Input
                                                    name="email"
                                                    placeholder="example@gmail.com"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold">Địa chỉ cụ thể *</Label>
                                                <Input
                                                    name="address"
                                                    placeholder="Số nhà, tên đường..."
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    className="h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold">Tỉnh/Thành, Quận/Huyện, Phường/Xã *</Label>
                                                <AddressSelector
                                                    value={address}
                                                    onChange={(value) =>
                                                        setAddress(prev => ({ ...prev, ...value }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Ghi chú cho đơn hàng</Label>
                                        <textarea
                                            name="notes"
                                            rows={3}
                                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-shadow"
                                            placeholder="Lời nhắn cho shipper hoặc ghi chú về món ăn..."
                                            onChange={handleChange}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* PAYMENT */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Phương Thức Thanh Toán
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(value) =>
                                            setPaymentMethod(value as 'cod' | 'bank' | 'momo')
                                        }
                                        className="space-y-3"
                                    >
                                        {/* COD */}
                                        <Label
                                            htmlFor="cod"
                                            className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod'
                                                    ? 'border-emerald-500 bg-emerald-50/60'
                                                    : 'border-gray-100 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <RadioGroupItem value="cod" id="cod" className="sr-only" />

                                            {/* COD Icon */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${paymentMethod === 'cod' ? 'bg-emerald-500' : 'bg-gray-100'
                                                }`}>
                                                <Banknote className={`w-5 h-5 ${paymentMethod === 'cod' ? 'text-white' : 'text-gray-500'}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-900">
                                                    Thanh toán khi nhận hàng
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Trả tiền mặt khi shipper giao hàng
                                                </div>
                                            </div>

                                            {paymentMethod === 'cod' && (
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </Label>

                                        {/* BANK */}
                                        <Label
                                            htmlFor="bank"
                                            className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'bank'
                                                    ? 'border-blue-500 bg-blue-50/60'
                                                    : 'border-gray-100 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <RadioGroupItem value="bank" id="bank" className="sr-only" />

                                            {/* Bank Icon */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${paymentMethod === 'bank' ? 'bg-blue-500' : 'bg-blue-50'
                                                }`}>
                                                <Landmark className={`w-5 h-5 ${paymentMethod === 'bank' ? 'text-white' : 'text-blue-500'}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-900">
                                                    Chuyển khoản ngân hàng
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Thanh toán qua PayOS · Nhanh &amp; bảo mật
                                                </div>
                                            </div>

                                            {paymentMethod === 'bank' && (
                                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </Label>

                                        {/* MOMO */}
                                        <Label
                                            htmlFor="momo"
                                            className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'momo'
                                                    ? 'border-pink-500 bg-pink-50/60'
                                                    : 'border-gray-100 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <RadioGroupItem value="momo" id="momo" className="sr-only" />

                                            {/* MoMo Icon */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${paymentMethod === 'momo' ? 'bg-[#ae2070]' : 'bg-pink-50'
                                                }`}>
                                                <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
                                                    <circle cx="20" cy="20" r="20" fill={paymentMethod === 'momo' ? 'transparent' : '#ae2070'} />
                                                    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
                                                        fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">
                                                        M
                                                    </text>
                                                </svg>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-900">
                                                    Ví điện tử MoMo
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Thanh toán nhanh qua ví MoMo
                                                </div>
                                            </div>

                                            {paymentMethod === 'momo' && (
                                                <div className="w-5 h-5 rounded-full bg-[#ae2070] flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </Label>
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ================= RIGHT ================= */}
                        <div>
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        Đơn Hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedItems.map(item => {
                                        const price = item.product.basePrice;
                                        return (
                                            <div key={item.product.id} className="mb-4 border-b pb-4 border-gray-100 last:border-0">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 rounded-xl border border-gray-100 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                                        <img
                                                            src={item.product.images?.[0] ? cloudinaryResize(item.product.images[0], 100) : item.product.imageUrl ? cloudinaryResize(item.product.imageUrl, 100) : '/placeholder.png'}
                                                            className="w-full h-full object-contain"
                                                            alt={item.product.name}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/placeholder.png';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 flex justify-between">
                                                        <div className="pr-4">
                                                            <div className="font-semibold text-gray-900 text-sm md:text-base leading-snug">{item.product.name}</div>
                                                            <div className="text-[13px] text-gray-500 mt-1 font-medium">
                                                                {item.quantity} × {price.toLocaleString('vi-VN')}đ
                                                            </div>
                                                            {item.isSubscription && (
                                                                <Badge className="mt-2 text-xs py-0.5" variant="secondary">
                                                                    <Calendar className="w-3 h-3 mr-1.5" />
                                                                    {getSubscriptionText(item)}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="font-bold text-gray-900 text-sm md:text-base whitespace-nowrap">
                                                            {(price * item.quantity).toLocaleString('vi-VN')}đ
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}


                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tạm tính</span>
                                        <span>{getSelectedTotal().toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Phí vận chuyển:</span>
                                        <span className="text-emerald-600">Miễn phí</span>
                                    </div>

                                    {/* Coupon Section */}
                                    <Separator className="my-4" />
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold flex items-center gap-2 text-emerald-800">
                                            <Ticket className="w-4 h-4" />
                                            Mã giảm giá
                                        </Label>

                                        {!appliedCoupon ? (
                                            <div className="flex flex-col gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full h-auto min-h-[3rem] py-2 md:py-0 md:h-14 rounded-full border-emerald-300 bg-white hover:bg-emerald-50 hover:border-emerald-500 transition-all flex flex-col md:flex-row items-center md:justify-between px-4 group shadow-sm text-emerald-700 font-medium whitespace-normal"
                                                    onClick={() => setShowCouponModal(true)}
                                                >
                                                    <div className="flex items-center justify-between w-full py-2 group cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <Ticket className="w-5 h-5 text-emerald-600" />
                                                            <span className="text-sm font-semibold text-gray-800">Chọn mã giảm giá</span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm font-medium text-emerald-600">
                                                                {availableCoupons.length} ưu đãi
                                                            </span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        </div>
                                                    </div>
                                                </Button>
                                                {couponError && <p className="text-sm text-red-500 font-medium px-1">{couponError}</p>}
                                            </div>
                                        ) : (
                                            <div className="p-4 border border-emerald-200 rounded-2xl bg-emerald-50 relative overflow-hidden transition-all shadow-sm">
                                                <div className="flex justify-between items-center relative z-10">
                                                    <div>
                                                        <p className="font-bold text-emerald-800 flex items-center gap-2 text-base">
                                                            <Percent className="w-4 h-4" />
                                                            {appliedCoupon.code}
                                                        </p>
                                                        <p className="text-sm text-emerald-600 mt-1 font-medium">Đã áp dụng giảm {finalDiscount.toLocaleString('vi-VN')}đ</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleRemoveCoupon}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-semibold"
                                                    >
                                                        Bỏ chọn
                                                    </Button>
                                                </div>
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-[100px] pointer-events-none" />
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Tổng cộng</span>
                                        <span className="text-emerald-600">
                                            {finalTotal.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>


                                    <Button type="submit" className="w-full mt-6">
                                        Đặt hàng
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div >

            {/* Modal Chọn Mã Giảm Giá */}
            <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-4 bg-gray-50 border-0">
                    <DialogHeader className="mb-4 text-center">
                        <DialogTitle className="text-2xl font-bold text-emerald-800">Khuyến Mãi</DialogTitle>
                    </DialogHeader>

                    <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
                        <div className="flex gap-2 relative">
                            <Input
                                placeholder="Nhập mã ưu đãi..."
                                value={couponCode}
                                className="bg-gray-50 focus-visible:ring-emerald-500 font-semibold uppercase font-mono"
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            />
                            <Button type="button" onClick={handleApplyCoupon} disabled={!couponCode.trim()} className="whitespace-nowrap px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm">
                                Áp dụng
                            </Button>
                        </div>
                        {couponError && <p className="text-sm text-red-500 mt-2 font-medium bg-red-50 p-2 rounded">{couponError}</p>}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        <h4 className="font-semibold text-gray-700 sticky top-0 bg-gray-50 pt-1 pb-2 z-20">Mã dành cho bạn</h4>
                        {availableCoupons.length === 0 ? (
                            <div className="text-center text-gray-400 py-10 bg-white rounded-xl border border-dashed border-gray-200">
                                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Tạm thời chưa có mã giảm giá nào.</p>
                            </div>
                        ) : (
                            availableCoupons.map(coupon => {
                                const isEligible = subtotal >= (coupon.minOrderValue || 0);
                                return (
                                    <div key={coupon.id} className={`p-0 border rounded-[1rem] flex transition-all relative overflow-visible ${!isEligible ? 'opacity-60 bg-gray-100 border-gray-200' : 'hover:border-emerald-300 hover:shadow-md bg-white border-emerald-100 shadow-sm'} ${appliedCoupon?.code === coupon.code ? 'ring-2 ring-emerald-500' : ''}`}>

                                        {/* Trái - Icon */}
                                        <div className={`w-[90px] flex items-center justify-center relative flex-shrink-0 border-r border-dashed border-gray-300 ${isEligible ? 'bg-gradient-to-b from-emerald-500 to-teal-600 rounded-l-[1rem]' : 'bg-gray-400 rounded-l-[1rem]'} p-3`}>
                                            <div className="flex flex-col items-center text-white">
                                                <Percent className="w-8 h-8 mb-1" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-full">VOUCHER</span>
                                            </div>
                                            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-4 bg-white/20 rounded-full blur-sm" />
                                        </div>

                                        {/* Phải - Info & Button */}
                                        <div className="flex-1 p-4 flex items-center justify-between relative bg-white rounded-r-[1rem]">
                                            <div className="pr-2">
                                                <h4 className="font-bold text-gray-900 text-base">{coupon.code}</h4>
                                                <p className="text-[13px] text-gray-700 mt-1">
                                                    Giảm <span className="text-emerald-600 font-bold">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('vi-VN')}đ`}</span>
                                                    {coupon.maxDiscountAmount && coupon.discountType === 'percentage' ? ` (Tối đa ${coupon.maxDiscountAmount.toLocaleString('vi-VN')}đ)` : ''}
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <span className="w-3 h-3 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">i</span>
                                                    {coupon.minOrderValue ? `Đơn tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ` : 'Áp dụng mọi đơn hàng'}
                                                </p>
                                            </div>
                                            <div className="flex items-center pl-2">
                                                <Button
                                                    size="sm"
                                                    variant={isEligible ? 'default' : 'secondary'}
                                                    disabled={!isEligible || appliedCoupon?.code === coupon.code}
                                                    className={`${isEligible && appliedCoupon?.code !== coupon.code ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' : ''} rounded-full px-4 font-semibold text-xs`}
                                                    onClick={() => {
                                                        setCouponCode(coupon.code);
                                                        couponApi.validateCoupon(coupon.code, subtotal)
                                                            .then(res => {
                                                                setAppliedCoupon(res);
                                                                setShowCouponModal(false);
                                                                setCouponError('');
                                                                toast.success('Áp dụng mã thành công!');
                                                            }).catch(err => {
                                                                setCouponError(err.response?.data?.message || 'Lỗi áp dụng');
                                                            });
                                                    }}
                                                >
                                                    {appliedCoupon?.code === coupon.code ? 'Đang dùng' : isEligible ? 'Dùng' : 'Chưa đủ'}
                                                </Button>
                                            </div>

                                            {/* Circle Cutouts Design */}
                                            <div className="absolute top-0 -left-2 w-4 h-4 bg-gray-50 rounded-full transform -translate-y-1/2" />
                                            <div className="absolute bottom-0 -left-2 w-4 h-4 bg-gray-50 rounded-full transform translate-y-1/2" />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

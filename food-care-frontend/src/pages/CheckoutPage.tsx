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

import { Calendar, CreditCard, MapPin, Package, Check, Plus } from 'lucide-react';
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
                const saved = await profileApi.getAddresses();
                setSavedAddresses(saved);

                // If there's a default address, select it
                const defaultAddr = saved.find(a => a.isDefault);
                if (defaultAddr) {
                    handleSelectAddress(defaultAddr);
                    setShowNewAddressForm(false);
                } else if (saved.length === 0) {
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

    const fullAddress = [formData.address, address.ward, address.district, address.province]
        .filter(part => part && part.trim() !== '')
        .join(', ');
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.phone || !formData.address) {
            toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
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
                } catch (payError) {
                    console.error('Payment redirect error:', payError);
                    toast.error('Không thể tạo liên kết thanh toán. Vui lòng thử lại hoặc chọn COD.');
                    // Don't navigate away, let user try another method
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
                <h1 className="mb-8">Thanh Toán</h1>

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
                                            <Label>Chọn địa chỉ đã lưu</Label>
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
                                                    <span className="text-sm font-medium">+ Sử dụng địa chỉ mới</span>
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
                                            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition
      ${paymentMethod === 'cod'
                                                    ? 'border-emerald-600 bg-emerald-50'
                                                    : 'hover:border-gray-400'}
    `}
                                        >
                                            <RadioGroupItem value="cod" id="cod" className="mt-1" />

                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    Thanh toán khi nhận hàng (COD)
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Thanh toán bằng tiền mặt khi nhận hàng
                                                </div>
                                            </div>
                                        </Label>

                                        {/* BANK */}
                                        <Label
                                            htmlFor="bank"
                                            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition
      ${paymentMethod === 'bank'
                                                    ? 'border-emerald-600 bg-emerald-50'
                                                    : 'hover:border-gray-400'}
    `}
                                        >
                                            <RadioGroupItem value="bank" id="bank" className="mt-1" />

                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    Chuyển khoản ngân hàng
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Chuyển khoản qua ngân hàng
                                                </div>
                                            </div>
                                        </Label>

                                        {/* MOMO */}
                                        <Label
                                            htmlFor="momo"
                                            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition
      ${paymentMethod === 'momo'
                                                    ? 'border-emerald-600 bg-emerald-50'
                                                    : 'hover:border-gray-400'}
    `}
                                        >
                                            <RadioGroupItem value="momo" id="momo" className="mt-1" />

                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    Ví điện tử MoMo
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Thanh toán qua ví MoMo
                                                </div>
                                            </div>
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
                                            <div key={item.product.id} className="mb-4 border-b pb-3">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <div>{item.product.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {item.quantity} × {price.toLocaleString('vi-VN')}đ
                                                        </div>
                                                        {item.isSubscription && (
                                                            <Badge className="mt-1">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {getSubscriptionText(item)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {(price * item.quantity).toLocaleString('vi-VN')}đ
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
                                    <Separator className="my-4" />

                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Tổng cộng</span>
                                        <span className="text-emerald-600">
                                            {getSelectedTotal().toLocaleString('vi-VN')}đ
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
        </div >
    );
}

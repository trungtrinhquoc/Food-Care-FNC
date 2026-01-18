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
import type { CreateOrderRequest } from '../types';

import { Calendar, CreditCard, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
    const [address, setAddress] = useState({
        province: '',
        district: '',
        ward: '',
    });
    const navigate = useNavigate();
    const { getSelectedItems, getSelectedTotal, clearCart, clearSelectedItems } = useCart();
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
        }
    }, [user, selectedItems.length, navigate]);

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
    const fullAddress = `${formData.address}, ${address.ward}, ${address.district}, ${address.province}`;
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
                paymentMethod,
                note: formData.notes,
                items: selectedItems.map(item => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.product.basePrice,
                    variantSnapshot: {
                        isSubscription: item.isSubscription,
                        subscription: item.isSubscription
                            ? {
                                frequency: item.subscription!.frequency,
                            }
                            : undefined,
                    },
                })),
            };

            await orderApi.createOrder(payload);

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
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Họ và tên *</Label>
                                            <Input
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <Label>Số điện thoại *</Label>
                                            <Input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <Label>Địa chỉ *</Label>
                                        <Input
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <AddressSelector
                                        value={address}
                                        onChange={(value) =>
                                            setAddress(prev => ({ ...prev, ...value }))
                                        }
                                    />

                                    <textarea
                                        name="notes"
                                        className="w-full border rounded-md px-3 py-2"
                                        placeholder="Ghi chú"
                                        onChange={handleChange}
                                    />
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
            </div>
        </div>
    );
}

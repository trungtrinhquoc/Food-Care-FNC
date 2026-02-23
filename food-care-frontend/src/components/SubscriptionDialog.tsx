import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Plus, Minus } from 'lucide-react';
import type { Product } from '../types';

interface SubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    onConfirm: (frequency: 'Weekly' | 'BiWeekly' | 'Monthly', quantity: number) => void;
    initialQuantity: number;
}

export function SubscriptionDialog({
    open,
    onOpenChange,
    product,
    onConfirm,
    initialQuantity,
}: SubscriptionDialogProps) {
    const [selectedFrequency, setSelectedFrequency] = useState<'Weekly' | 'BiWeekly' | 'Monthly'>('Monthly');
    const [quantity, setQuantity] = useState(initialQuantity);

    const discounts = {
        Weekly: 15,
        BiWeekly: 12,
        Monthly: 10,
    };

    const frequencyLabels = {
        Weekly: 'Hàng tuần',
        BiWeekly: '2 tuần/lần',
        Monthly: 'Hàng tháng',
    };

    const calculatePrice = (freq: 'Weekly' | 'BiWeekly' | 'Monthly') => {
        const discount = discounts[freq];
        return product.basePrice * (1 - discount / 100);
    };

    const handleConfirm = () => {
        onConfirm(selectedFrequency, quantity);
        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
        setQuantity(initialQuantity);
    };

    const selectedDiscount = discounts[selectedFrequency];
    const finalPrice = calculatePrice(selectedFrequency);
    const savings = product.basePrice - finalPrice;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden">
                <div className="max-h-[90vh] overflow-y-auto">
                    <div className="p-6 space-y-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-emerald-700">
                                <Calendar className="w-5 h-5" />
                                Đăng Ký Đặt Hàng Định Kỳ
                            </DialogTitle>
                            <p className="text-sm text-gray-600">
                                Thiết lập lịch giao hàng tự động và nhận ưu đãi đặc biệt
                            </p>
                        </DialogHeader>

                        {/* Product Info */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {product.images && product.images[0] && (
                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                />
                            )}
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm text-gray-900">{product.name}</h4>
                                <p className="text-xs text-gray-600">{product.unit}</p>
                                <p className="text-sm text-gray-500">
                                    {product.basePrice.toLocaleString('vi-VN')}đ
                                </p>
                            </div>
                        </div>

                        {/* Frequency Selection */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900">Chọn tần suất giao hàng</h4>

                            <div className="space-y-2">
                                {/* Weekly */}
                                <button
                                    onClick={() => setSelectedFrequency('Weekly')}
                                    className={`w-full flex items-center justify-between p-3 border-2 rounded-lg transition ${selectedFrequency === 'Weekly'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 hover:border-emerald-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedFrequency === 'Weekly' ? 'border-emerald-600' : 'border-gray-300'
                                            }`}>
                                            {selectedFrequency === 'Weekly' && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold">{frequencyLabels.Weekly}</p>
                                            <p className="text-xs text-gray-500">Giao hàng mỗi thứ 7</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="bg-red-500 text-xs mb-1">Tiết kiệm 15%</Badge>
                                        <p className="text-sm font-bold text-emerald-600">
                                            {calculatePrice('Weekly').toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>
                                </button>

                                {/* BiWeekly */}
                                <button
                                    onClick={() => setSelectedFrequency('BiWeekly')}
                                    className={`w-full flex items-center justify-between p-3 border-2 rounded-lg transition ${selectedFrequency === 'BiWeekly'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 hover:border-emerald-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedFrequency === 'BiWeekly' ? 'border-emerald-600' : 'border-gray-300'
                                            }`}>
                                            {selectedFrequency === 'BiWeekly' && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold">{frequencyLabels.BiWeekly}</p>
                                            <p className="text-xs text-gray-500">2 hàng tuần</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="bg-orange-500 text-xs mb-1">Tiết kiệm 12%</Badge>
                                        <p className="text-sm font-bold text-emerald-600">
                                            {calculatePrice('BiWeekly').toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>
                                </button>

                                {/* Monthly */}
                                <button
                                    onClick={() => setSelectedFrequency('Monthly')}
                                    className={`w-full flex items-center justify-between p-3 border-2 rounded-lg transition ${selectedFrequency === 'Monthly'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 hover:border-emerald-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedFrequency === 'Monthly' ? 'border-emerald-600' : 'border-gray-300'
                                            }`}>
                                            {selectedFrequency === 'Monthly' && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold">{frequencyLabels.Monthly}</p>
                                            <p className="text-xs text-gray-500">Giao hàng mỗi tháng</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="bg-yellow-500 text-xs mb-1">Tiết kiệm 10%</Badge>
                                        <p className="text-sm font-bold text-emerald-600">
                                            {calculatePrice('Monthly').toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">Số lượng:</span>
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-medium">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Summary */}
                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                            <h4 className="font-bold text-emerald-900 mb-3 text-center text-sm">
                                Tóm Tắt Đơn Hàng Định Kỳ
                            </h4>

                            <div className="space-y-2 bg-white rounded-lg p-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tần suất:</span>
                                    <span className="font-semibold text-emerald-700">
                                        {frequencyLabels[selectedFrequency]}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Số lượng:</span>
                                    <span className="font-semibold text-emerald-700">
                                        {quantity} × {product.unit}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Giá gốc:</span>
                                    <span className="text-gray-400 line-through">
                                        {product.basePrice.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tiết kiệm:</span>
                                    <span className="text-emerald-600 font-semibold">
                                        -{savings.toLocaleString('vi-VN')}đ ({selectedDiscount}%)
                                    </span>
                                </div>

                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Tổng mỗi kỳ:</span>
                                        <span className="text-xl font-bold text-emerald-600">
                                            {(finalPrice * quantity).toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="px-6 h-9 text-sm"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4"
                            >
                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                <span className="text-sm font-medium">Xác Nhận Đăng Ký</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

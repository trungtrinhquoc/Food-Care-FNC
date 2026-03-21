import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cartApi } from '../services/cartServerApi';
import { toast } from 'sonner';
import { ShoppingCart, Minus, Plus, Trash2, Wallet, Package, ChevronLeft, Repeat } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { ServerCartItem } from '../types/mart';

export default function ServerCartPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: cart, isLoading } = useQuery({
        queryKey: ['server-cart'],
        queryFn: cartApi.getCart,
    });

    const updateMutation = useMutation({
        mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
            cartApi.updateItem(itemId, { quantity }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['server-cart'] }),
    });

    const removeMutation = useMutation({
        mutationFn: (itemId: string) => cartApi.removeItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['server-cart'] });
            toast.success('Đã xóa sản phẩm');
        },
    });

    const clearMutation = useMutation({
        mutationFn: cartApi.clearCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['server-cart'] });
            toast.success('Đã xóa giỏ hàng');
        },
    });

    const checkoutMutation = useMutation({
        mutationFn: cartApi.checkout,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['server-cart'] });
            toast.success(`Thanh toán thành công! Số dư còn ${result.walletAfter.toLocaleString('vi-VN')}đ`);
            navigate(`/orders/${result.orderId}/tracking`);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? 'Có lỗi xảy ra khi thanh toán');
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const hasItems = (cart?.subscriptionItems?.length ?? 0) + (cart?.oneTimeItems?.length ?? 0) > 0;

    const renderCartItem = (item: ServerCartItem) => (
        <div key={item.id} className="flex items-center gap-3 p-4 bg-white rounded-lg border">
            {item.productImageUrl ? (
                <img src={item.productImageUrl} alt={item.productName} className="w-16 h-16 rounded-lg object-cover shrink-0" />
            ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-gray-300" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                    {item.isInActiveSubscription && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Trong sub
                        </span>
                    )}
                    {item.isSubscription && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                            <Repeat className="w-3 h-3" />
                            {item.subscriptionFrequency}
                        </span>
                    )}
                </div>
                <p className="text-sm text-emerald-600 font-medium mt-1">
                    {item.basePrice.toLocaleString('vi-VN')}đ
                </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-2">
                <button
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                    disabled={item.quantity <= 1 || updateMutation.isPending}
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    disabled={updateMutation.isPending}
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Line total + delete */}
            <div className="text-right shrink-0">
                <p className="font-semibold text-gray-900">{item.lineTotal.toLocaleString('vi-VN')}đ</p>
                <button
                    className="text-red-400 hover:text-red-600 mt-1"
                    onClick={() => removeMutation.mutate(item.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm">Tiếp tục mua sắm</span>
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="w-6 h-6 text-emerald-600" />
                            <h1 className="text-xl font-bold text-gray-900">Giỏ hàng</h1>
                        </div>
                        {hasItems && (
                            <button
                                className="text-sm text-red-500 hover:text-red-700"
                                onClick={() => clearMutation.mutate()}
                            >
                                Xóa tất cả
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {!hasItems ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">Giỏ hàng trống</p>
                    <Button className="mt-4" onClick={() => navigate('/products')}>
                        Mua sắm ngay
                    </Button>
                </div>
            ) : (
                <div className="container mx-auto px-4 py-6 max-w-3xl">
                    {/* Subscription items section */}
                    {cart!.subscriptionItems.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Repeat className="w-5 h-5 text-blue-600" />
                                <h2 className="font-semibold text-gray-900">Sản phẩm đăng ký ({cart!.subscriptionItems.length})</h2>
                            </div>
                            <div className="space-y-3">
                                {cart!.subscriptionItems.map(renderCartItem)}
                            </div>
                        </div>
                    )}

                    {/* One-time items section */}
                    {cart!.oneTimeItems.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-5 h-5 text-gray-600" />
                                <h2 className="font-semibold text-gray-900">Mua lẻ ({cart!.oneTimeItems.length})</h2>
                            </div>
                            <div className="space-y-3">
                                {cart!.oneTimeItems.map(renderCartItem)}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-white rounded-xl border p-5 mt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tạm tính</span>
                            <span className="font-medium">{cart!.subtotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Phí vận chuyển</span>
                            <span className={`font-medium ${cart!.shippingFee === 0 ? 'text-emerald-600' : ''}`}>
                                {cart!.shippingFee === 0 ? 'Miễn phí' : `${cart!.shippingFee.toLocaleString('vi-VN')}đ`}
                            </span>
                        </div>
                        {cart!.freeShippingNote && (
                            <p className="text-xs text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg">
                                {cart!.freeShippingNote}
                            </p>
                        )}
                        <div className="border-t pt-3 flex justify-between">
                            <span className="font-bold text-lg">Tổng cộng</span>
                            <span className="font-bold text-lg text-emerald-600">{cart!.total.toLocaleString('vi-VN')}đ</span>
                        </div>

                        {/* Wallet info */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <Wallet className="w-4 h-4 text-emerald-600" />
                                <span className="text-gray-600">Số dư FNC Pay:</span>
                                <span className="font-medium">{cart!.walletBalance.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Sau thanh toán:</span>
                                <span className={`font-medium ${cart!.walletAfterCheckout < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {cart!.walletAfterCheckout.toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-base"
                            disabled={!cart!.canCheckout || checkoutMutation.isPending}
                            onClick={() => checkoutMutation.mutate()}
                        >
                            {checkoutMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang xử lý...
                                </span>
                            ) : !cart!.canCheckout ? (
                                'Số dư không đủ'
                            ) : (
                                `Thanh toán ${cart!.total.toLocaleString('vi-VN')}đ`
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

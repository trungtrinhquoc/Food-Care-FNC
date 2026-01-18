import { useCart } from '../contexts/CartContext';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



export default function CartPage() {
    const navigate = useNavigate();
    const {
        items,
        removeFromCart,
        updateQuantity,
        getTotal,
        toggleSelectItem,
        toggleSelectAll,
        getSelectedTotal,
        getSelectedItems,
    } = useCart();
    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Giỏ hàng trống</p>
                <a href="/products" className="btn-primary">
                    Tiếp tục mua sắm
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">

                <h1 className="mb-8">Giỏ Hàng Của Bạn</h1>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Chọn tất cả */}
                        <div className="flex items-center gap-2 border-b pb-2">
                            <input
                                type="checkbox"
                                checked={items.length > 0 && items.every(item => item.selected)}
                                onChange={toggleSelectAll}
                            />
                            <span className="font-medium">
                                Chọn tất cả ({getSelectedItems().length}/{items.length} sản phẩm )
                            </span>
                        </div>

                        {items.map((item) => (

                            <div key={item.product.id} className="card flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={() => toggleSelectItem(item.product.id)}
                                />

                                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                    <img
                                        src={item.product.images[0]}
                                        alt={item.product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>                                <div className="flex-1">
                                    <h3 className="font-semibold">{item.product.name}</h3>
                                    <p className="text-sm text-gray-600">{item.product.unit || 'Cái'}</p>
                                    <p className="text-primary font-bold">
                                        {item.product.basePrice.toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                        className="px-3 py-1 border rounded"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                        className="px-3 py-1 border rounded"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.product.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="rounded-2xl border bg-white shadow-sm">
                                <div className="p-6">
                                    <h2 className="text-lg font-semibold mb-6">Tóm Tắt Đơn Hàng</h2>

                                    <div className="space-y-3 mb-6 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Sản phẩm đã chọn</span>
                                            <span>{getSelectedItems().length}/{items.length}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tạm tính</span>
                                            <span className="font-medium">
                                                {getSelectedTotal().toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phí vận chuyển</span>
                                            <span className="text-emerald-600 font-medium">Miễn phí</span>
                                        </div>

                                        <div className="border-t pt-3 flex justify-between text-base font-semibold">
                                            <span>Tổng cộng</span>
                                            <span className="text-emerald-600 text-lg">
                                                {getSelectedTotal().toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-medium mb-3 disabled:opacity-50"
                                        disabled={getSelectedItems().length === 0}
                                        onClick={() => {
                                            if (getSelectedItems().length === 0) {
                                                alert('Vui lòng chọn ít nhất một sản phẩm');
                                                return;
                                            }
                                            navigate('/checkout');
                                        }}
                                    >
                                        Thanh toán ({getSelectedItems().length})
                                    </button>

                                    <button
                                        className="w-full border rounded-xl py-3 font-medium"
                                        onClick={() => navigate('/products')}
                                    >
                                        Tiếp tục mua sắm
                                    </button>

                                    {/* Subscription notice */}
                                    {items.some(item => item.isSubscription) && (
                                        <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
                                            <h3 className="text-sm font-medium text-emerald-900 mb-1">
                                                💡 Đặt hàng định kỳ
                                            </h3>
                                            <p className="text-xs text-gray-600">
                                                Đơn hàng sẽ được giao tự động theo lịch đã chọn.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>);
}

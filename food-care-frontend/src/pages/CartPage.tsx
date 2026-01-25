import { useCart } from '../contexts/CartContext';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



export default function CartPage() {
    const navigate = useNavigate();
    const {
        items,
        removeFromCart,
        updateQuantity,
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

                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 md:mb-8">Giỏ Hàng Của Bạn</h1>
                <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Chọn tất cả */}
                        <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                                checked={items.length > 0 && items.every(item => item.selected)}
                                onChange={toggleSelectAll}
                            />
                            <span className="font-semibold text-gray-700">
                                Chọn tất cả ({getSelectedItems().length}/{items.length})
                            </span>
                        </div>

                        {items.map((item) => (
                            <div key={item.product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 relative group">
                                <div className="flex items-start gap-4 flex-1">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer mt-2"
                                        checked={item.selected}
                                        onChange={() => toggleSelectItem(item.product.id)}
                                    />

                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                                        <img
                                            src={item.product.images?.[0] || '/placeholder-product.png'}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1 line-clamp-1">{item.product.name}</h3>
                                        <p className="text-xs text-gray-500 mb-2">Đơn vị: {item.product.unit || 'Cái'}</p>

                                        {item.subscription ? (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-emerald-600 font-extrabold text-base">
                                                    {(item.product.basePrice * (1 - item.subscription.discount / 100)).toLocaleString('vi-VN')}đ
                                                </p>
                                                <p className="text-gray-400 line-through text-xs font-medium">
                                                    {item.product.basePrice.toLocaleString('vi-VN')}đ
                                                </p>
                                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                                                    -{item.subscription.discount}%
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-emerald-600 font-extrabold text-base">
                                                {item.product.basePrice.toLocaleString('vi-VN')}đ
                                            </p>
                                        )}

                                        {item.isSubscription && item.subscription && (
                                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                                                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">📦 Định kỳ {item.subscription.frequency === 'Monthly' ? 'Hàng tháng' : item.subscription.frequency}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                                    <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-white rounded-md transition-all disabled:opacity-30"
                                        >
                                            -
                                        </button>
                                        <span className="w-10 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-white rounded-md transition-all"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Xóa khỏi giỏ hàng"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="rounded-2xl bg-white shadow-xl shadow-emerald-900/5 border border-gray-100 overflow-hidden">
                                <div className="p-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-50">Tóm Tắt Đơn Hàng</h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Sản phẩm đã chọn</span>
                                            <span className="font-bold text-gray-900">{getSelectedItems().length}/{items.length}</span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Tạm tính</span>
                                            <span className="font-bold text-gray-900 text-lg">
                                                {getSelectedTotal().toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Phí vận chuyển</span>
                                            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-xs">Miễn phí</span>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-base font-extrabold text-gray-900">Tổng cộng</span>
                                            <span className="text-emerald-600 text-2xl font-black">
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

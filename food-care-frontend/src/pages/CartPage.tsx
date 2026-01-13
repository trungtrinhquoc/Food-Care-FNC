import { useCart } from '../contexts/CartContext';
import { Trash2 } from 'lucide-react';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, getTotal } = useCart();

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
        <div>
            <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.product.id} className="card flex items-center gap-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1">
                                <h3 className="font-semibold">{item.product.name}</h3>
                                <p className="text-sm text-gray-600">{item.product.unit}</p>
                                <p className="text-primary font-bold">
                                    {item.product.price.toLocaleString('vi-VN')}đ
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

                <div className="card h-fit">
                    <h2 className="text-xl font-bold mb-4">Tổng cộng</h2>
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span>Tạm tính:</span>
                            <span>{getTotal().toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Tổng:</span>
                            <span className="text-primary">{getTotal().toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>
                    <button className="w-full btn-primary">Thanh toán</button>
                </div>
            </div>
        </div>
    );
}

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/api';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function ProductsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: () => productsApi.getProducts({ page: 1, pageSize: 20 }),
    });

    const { addToCart } = useCart();

    if (isLoading) {
        return <div className="text-center py-12">Đang tải...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                Không thể tải sản phẩm. Vui lòng thử lại sau.
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Sản phẩm</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data?.products.map((product) => (
                    <div key={product.id} className="card hover:shadow-lg transition-shadow">
                        <Link to={`/products/${product.id}`}>
                            <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <ShoppingCart className="h-16 w-16 text-gray-400" />
                                )}
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{product.unit || 'Cái'}</p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold text-primary">
                                        {product.basePrice.toLocaleString('vi-VN')}đ
                                    </p>
                                    {product.originalPrice && (
                                        <p className="text-sm text-gray-400 line-through">
                                            {product.originalPrice.toLocaleString('vi-VN')}đ
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={() => addToCart(product, 1)}
                            className="w-full btn-primary mt-4"
                        >
                            Thêm vào giỏ
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}


import type { Product } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onViewDetail: (product: Product) => void;
    onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onViewDetail, onAddToCart }: ProductCardProps) {
    const hasDiscount = product.originalPrice && product.originalPrice > product.basePrice;
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice! - product.basePrice) / product.originalPrice!) * 100)
        : 0;

    return (
        <div className="card hover-lift group cursor-pointer">
            {/* Product Image */}
            <div className="relative mb-3 overflow-hidden rounded-xl" onClick={() => onViewDetail(product)}>
                <ImageWithFallback
                    src={product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'}
                    alt={product.name}
                    className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                />

                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                        -{discountPercent}%
                    </div>
                )}

                {/* Low Stock Badge */}
                {product.stockQuantity < 10 && product.stockQuantity > 0 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                        Còn {product.stockQuantity}
                    </div>
                )}

                {/* Out of Stock */}
                {product.stockQuantity === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-base">Hết hàng</span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div onClick={() => onViewDetail(product)}>
                <h3 className="font-semibold text-base mb-1.5 line-clamp-2 min-h-[2.8rem]">
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-medium text-gray-700">
                        {product.ratingAverage?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-xs text-gray-500">
                        ({product.ratingCount || 0})
                    </span>
                </div>

                {/* Price */}
                <div className="mb-3">
                    {hasDiscount ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-emerald-600">
                                {product.basePrice.toLocaleString('vi-VN')}đ
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                                {product.originalPrice?.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold text-emerald-600">
                            {product.basePrice.toLocaleString('vi-VN')}đ
                        </span>
                    )}
                    {product.unit && (
                        <span className="text-sm text-gray-500">/{product.unit}</span>
                    )}
                </div>
            </div>

            {/* Add to Cart Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                }}
                disabled={product.stockQuantity === 0}
                className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2"
            >
                <ShoppingCart className="w-3.5 h-3.5" />
                Thêm vào giỏ
            </button>

            {/* Subscription Badge */}
            {product.isSubscriptionAvailable && (
                <div className="mt-2 text-center">
                    <span className="text-xs text-emerald-600 font-medium">
                        ⚡ Có giao hàng định kỳ
                    </span>
                </div>
            )}
        </div>
    );
}

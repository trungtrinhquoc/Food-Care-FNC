import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { productsApi } from '../services/api';
import { X, AlertTriangle } from 'lucide-react';

interface LowStockNotificationProps {
    onNavigate?: (page: string, product?: Product) => void;
    onAddToCart: (product: Product) => void;
}

export function LowStockNotification({ onNavigate, onAddToCart }: LowStockNotificationProps) {
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLowStockProducts();
    }, []);

    const fetchLowStockProducts = async () => {
        try {
            const response = await productsApi.getProducts({ pageSize: 100 });
            const lowStock = response.products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10);
            setLowStockProducts(lowStock.slice(0, 3)); // Show max 3 products
        } catch (error) {
            console.error('Failed to fetch low stock products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !isVisible || lowStockProducts.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg shadow-md">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-orange-900 mb-2">
                            ⚠️ Sản phẩm sắp hết hàng!
                        </h3>
                        <div className="space-y-2">
                            {lowStockProducts.map(product => (
                                <div key={product.id} className="flex items-center justify-between bg-white/60 rounded-lg p-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                        <p className="text-xs text-orange-600">Chỉ còn {product.stockQuantity} sản phẩm</p>
                                    </div>
                                    <button
                                        onClick={() => onAddToCart(product)}
                                        className="ml-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                                    >
                                        Mua ngay
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

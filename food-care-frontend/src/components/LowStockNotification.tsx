import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, X, ShoppingCart, Calendar, ArrowRight } from 'lucide-react';
import type { Product } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { recommendationsApi } from '../services/recommendationsApi';
import type { LowStockNotification as LowStockItem } from '../services/recommendationsApi';
import { toast } from 'sonner';

interface LowStockNotificationProps {
    onNavigate?: (page: string, product?: Product) => void;
    onAddToCart?: (product: Product) => void;
}

export function LowStockNotification({ }: LowStockNotificationProps) {
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLowStockItems = async () => {
            if (!isAuthenticated) {
                setIsLoading(false);
                return;
            }

            try {
                const items = await recommendationsApi.getLowStockNotifications(3);
                setLowStockItems(items);
            } catch (error) {
                console.error('Failed to fetch low stock items:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLowStockItems();
    }, [isAuthenticated]);

    if (!isAuthenticated || !isVisible || isLoading || lowStockItems.length === 0) {
        return null;
    }

    const getUrgencyColor = (daysLeft: number) => {
        if (daysLeft <= 3) return 'border-red-500 bg-red-50';
        if (daysLeft <= 7) return 'border-orange-500 bg-orange-50';
        return 'border-yellow-500 bg-yellow-50';
    };

    const getUrgencyBadge = (daysLeft: number) => {
        if (daysLeft <= 3) return <Badge className="bg-red-500 hover:bg-red-600 whitespace-nowrap">Khẩn cấp</Badge>;
        if (daysLeft <= 7) return <Badge className="bg-orange-500 hover:bg-orange-600 whitespace-nowrap">Sắp hết</Badge>;
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 whitespace-nowrap">Nên mua</Badge>;
    };

    const handleDetailClick = (product: Product) => {
        navigate(`/products/${product.id}`);
    };

    const handleReorderClick = (product: Product) => {
        addToCart(product, 1);
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100 w-full">
            <div className="w-full px-4 md:px-8 py-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="mb-0 font-bold text-lg text-gray-900">🔔 Sản phẩm có thể sắp hết</h3>
                            <p className="text-sm text-gray-600">
                                Dựa vào lịch sử mua hàng, những sản phẩm này có thể sắp hết trong nhà bạn
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {lowStockItems.map((item) => {
                        const lastPurchaseDate = new Date(item.lastPurchaseDate);
                        const daysAgo = Math.floor((Date.now() - lastPurchaseDate.getTime()) / (24 * 60 * 60 * 1000));

                        return (
                            <Card key={item.product.id} className={`border-2 ${getUrgencyColor(item.estimatedDaysLeft)} shadow-sm`}>
                                <CardContent className="pt-3 p-3">
                                    <div className="flex gap-2 mb-2">
                                        <div className="w-14 h-14 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                            <ImageWithFallback
                                                src={item.product.imageUrl}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-0.5 font-medium text-sm text-gray-900 truncate" title={item.product.name}>
                                                {item.product.name}
                                            </div>
                                            <div className="text-xs text-gray-600">{item.product.unit || 'Đơn vị: Gói'}</div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getUrgencyBadge(item.estimatedDaysLeft)}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-2.5 mb-2.5 text-sm space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Mua lần cuối:</span>
                                            <span className="font-semibold text-gray-900">{daysAgo} ngày trước</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Ước tính còn:</span>
                                            <span className={`font-bold ${item.estimatedDaysLeft <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                                                ~{item.estimatedDaysLeft} ngày
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-1.5">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 text-sm py-2 font-medium"
                                            onClick={() => handleDetailClick(item.product)}
                                        >
                                            Xem chi tiết
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm text-sm py-2 font-bold"
                                            onClick={() => handleReorderClick(item.product)}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-1.5" />
                                            Mua lại
                                        </Button>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-full mt-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-sm py-2 font-semibold"
                                        onClick={() => navigate('/subscriptions')}
                                    >
                                        <Calendar className="w-4 h-4 mr-1.5" />
                                        Đặt định kỳ - Tiết kiệm 10%
                                        <ArrowRight className="w-4 h-4 ml-1.5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 italic">
                        💡 Mẹo: Đặt hàng định kỳ để luôn có đủ sản phẩm và tiết kiệm 10-15%
                    </p>
                </div>
            </div>
        </div>
    );
}

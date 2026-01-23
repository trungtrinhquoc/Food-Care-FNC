import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, X, ShoppingCart, Calendar, ArrowRight } from 'lucide-react';
import type { Product } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { recommendationsApi } from '../services/recommendationsApi';
import type { LowStockNotification as LowStockItem } from '../services/recommendationsApi';

interface LowStockNotificationProps {
    onNavigate: (page: string, product?: Product) => void;
    onAddToCart?: (product: Product) => void;
}

export function LowStockNotification({ onNavigate, onAddToCart }: LowStockNotificationProps) {
    const { user, isAuthenticated } = useAuth();
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

    if (!user || !isVisible || isLoading || lowStockItems.length === 0) {
        return null;
    }

    const getUrgencyColor = (daysLeft: number) => {
        if (daysLeft <= 3) return 'text-red-600 bg-red-50 border-red-200';
        if (daysLeft <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    };

    const getUrgencyBadge = (daysLeft: number) => {
        if (daysLeft <= 3) return <Badge className="bg-red-500">Khẩn cấp</Badge>;
        if (daysLeft <= 7) return <Badge className="bg-orange-500">Sắp hết</Badge>;
        return <Badge className="bg-yellow-500">Nên mua</Badge>;
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100">
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="mb-0 text-orange-900">🔔 Sản phẩm có thể sắp hết</h3>
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
                            <Card key={item.product.id} className={`border-2 transition-all hover:shadow-md ${getUrgencyColor(item.estimatedDaysLeft)}`}>
                                <CardContent className="p-4">
                                    <div className="flex gap-3 mb-3">
                                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                            <ImageWithFallback
                                                src={item.product.imageUrl}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-1 font-medium text-gray-900 truncate">{item.product.name}</div>
                                            <div className="text-sm text-gray-500">{item.product.unit || 'Đơn vị: Gói/Túi'}</div>
                                        </div>
                                        {getUrgencyBadge(item.estimatedDaysLeft)}
                                    </div>

                                    <div className="bg-white/80 rounded-lg p-3 mb-3 text-sm space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Mua lần cuối:</span>
                                            <span className="font-medium">{daysAgo} ngày trước</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Ước tính còn:</span>
                                            <span className={`font-semibold ${item.estimatedDaysLeft <= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                                                ~{item.estimatedDaysLeft} ngày
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 bg-white border-gray-200"
                                            onClick={() => onNavigate('product-detail', item.product)}
                                        >
                                            Chi tiết
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                            onClick={() => {
                                                if (onAddToCart) {
                                                    onAddToCart(item.product);
                                                }
                                            }}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-1" />
                                            Mua lại
                                        </Button>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-full mt-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => onNavigate('subscriptions')}
                                    >
                                        <Calendar className="w-4 h-4 mr-1" />
                                        Đặt định kỳ - Tiết kiệm 10%
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 italic">
                        💡 Mẹo: Đặt hàng định kỳ để luôn có đủ sản phẩm và tiết kiệm 10-15%
                    </p>
                </div>
            </div>
        </div>
    );
}

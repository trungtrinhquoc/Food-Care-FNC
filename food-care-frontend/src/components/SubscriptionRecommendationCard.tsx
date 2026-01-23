import { Package, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { SubscriptionRecommendation } from '../services/recommendationsApi';

interface SubscriptionRecommendationCardProps {
    recommendation: SubscriptionRecommendation;
    onSubscribe: (recommendation: SubscriptionRecommendation) => void;
}

export function SubscriptionRecommendationCard({
    recommendation,
    onSubscribe
}: SubscriptionRecommendationCardProps) {
    const { product, purchaseCount, potentialYearlySavings, recommendedFrequency, subscriptionDiscount } = recommendation;

    const frequencyText = {
        weekly: 'Hàng tuần',
        biweekly: '2 tuần/lần',
        monthly: 'Hàng tháng'
    }[recommendedFrequency] || recommendedFrequency;

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 hover:border-emerald-400 transition-all hover:shadow-lg">
            <div className="flex gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                    <ImageWithFallback
                        src={product.images?.[0] || product.imageUrl || ''}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {product.name}
                    </h3>

                    {/* Stats */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="w-4 h-4 text-emerald-600" />
                            <span>Bạn đã mua <strong>{purchaseCount} lần</strong></span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span>Đề xuất: <strong>{frequencyText}</strong></span>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                            <DollarSign className="w-4 h-4" />
                            <span>Tiết kiệm <strong>{potentialYearlySavings.toLocaleString('vi-VN')}đ/năm</strong></span>
                        </div>
                    </div>

                    {/* Discount Badge */}
                    <div className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                        -{subscriptionDiscount.toFixed(0)}% khi đặt định kỳ
                    </div>

                    {/* CTA Button */}
                    <Button
                        onClick={() => onSubscribe(recommendation)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="sm"
                    >
                        Đặt Định Kỳ Ngay
                    </Button>
                </div>
            </div>
        </div>
    );
}

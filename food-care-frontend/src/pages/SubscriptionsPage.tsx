import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../services/api';
import { toast } from 'sonner';
import { Package, Calendar, TrendingUp, Pause, Play, X, Loader2 } from 'lucide-react';

interface Subscription {
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    frequency: string;
    quantity: number;
    status: string;
    nextDeliveryDate: string;
    pauseUntil?: string;
    createdAt: string;
    discountPercent: number;
}

export default function SubscriptionsPage() {
    const navigate = useNavigate();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const data = await profileApi.getSubscriptions();
            setSubscriptions(data);
        } catch (error: any) {
            console.error('Error loading subscriptions:', error);
            toast.error('Không thể tải danh sách đơn định kỳ');
        } finally {
            setLoading(false);
        }
    };

    const handlePauseSubscription = async (subscriptionId: string) => {
        try {
            await profileApi.pauseSubscription(subscriptionId);
            toast.success('Đã tạm dừng đơn định kỳ');
            loadSubscriptions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tạm dừng');
        }
    };

    const handleResumeSubscription = async (subscriptionId: string) => {
        try {
            await profileApi.resumeSubscription(subscriptionId);
            toast.success('Đã kích hoạt lại đơn định kỳ');
            loadSubscriptions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể kích hoạt lại');
        }
    };

    const handleCancelSubscription = async (subscriptionId: string) => {
        if (!confirm('Bạn có chắc muốn hủy đơn định kỳ này?')) return;

        try {
            await profileApi.cancelSubscription(subscriptionId);
            toast.success('Đã hủy đơn định kỳ');
            loadSubscriptions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể hủy');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            active: { label: 'Đang hoạt động', className: 'bg-green-100 text-green-800' },
            paused: { label: 'Tạm dừng', className: 'bg-yellow-100 text-yellow-800' },
            cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
        };

        const config = statusConfig[status] || statusConfig.active;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const getFrequencyText = (frequency: string) => {
        const frequencyMap: Record<string, string> = {
            daily: 'Hàng ngày',
            weekly: 'Hàng tuần',
            biweekly: '2 tuần/lần',
            monthly: 'Hàng tháng',
        };
        return frequencyMap[frequency] || frequency;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải danh sách đơn định kỳ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Đơn Hàng Định Kỳ</h1>
                    <p className="text-gray-600">Quản lý các đơn hàng tự động giao hàng định kỳ của bạn</p>
                </div>

                {/* Subscriptions List */}
                {subscriptions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đơn định kỳ nào</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn chưa đăng ký đơn hàng định kỳ nào. Hãy khám phá các sản phẩm và đăng ký ngay!
                        </p>
                        <button
                            onClick={() => navigate('/products')}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        >
                            Khám phá sản phẩm
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {subscriptions.map((subscription) => (
                            <div
                                key={subscription.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Product Image */}
                                        {subscription.productImage && (
                                            <img
                                                src={subscription.productImage}
                                                alt={subscription.productName}
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                        )}

                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                        {subscription.productName}
                                                    </h3>
                                                    {getStatusBadge(subscription.status)}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Tần suất</p>
                                                        <p className="font-semibold">{getFrequencyText(subscription.frequency)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Package className="w-4 h-4" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Số lượng</p>
                                                        <p className="font-semibold">{subscription.quantity}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <TrendingUp className="w-4 h-4" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Giảm giá</p>
                                                        <p className="font-semibold text-emerald-600">
                                                            {subscription.discountPercent}%
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Giao tiếp theo</p>
                                                        <p className="font-semibold">
                                                            {new Date(subscription.nextDeliveryDate).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {subscription.pauseUntil && (
                                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <p className="text-sm text-yellow-800">
                                                        ⏸️ Tạm dừng đến:{' '}
                                                        {new Date(subscription.pauseUntil).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2 mt-4">
                                                {subscription.status === 'active' && (
                                                    <button
                                                        onClick={() => handlePauseSubscription(subscription.id)}
                                                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition flex items-center gap-2"
                                                    >
                                                        <Pause className="w-4 h-4" />
                                                        Tạm dừng
                                                    </button>
                                                )}

                                                {subscription.status === 'paused' && (
                                                    <button
                                                        onClick={() => handleResumeSubscription(subscription.id)}
                                                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center gap-2"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        Kích hoạt lại
                                                    </button>
                                                )}

                                                {subscription.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleCancelSubscription(subscription.id)}
                                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center gap-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Hủy đăng ký
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <svg
                            className="w-6 h-6 text-blue-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Lưu ý về đơn định kỳ:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Bạn sẽ nhận email nhắc nhở 3 ngày trước mỗi lần giao hàng</li>
                                <li>Có thể tạm dừng hoặc hủy đơn định kỳ bất kỳ lúc nào</li>
                                <li>Giá và giảm giá sẽ được áp dụng theo thời điểm đặt hàng</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

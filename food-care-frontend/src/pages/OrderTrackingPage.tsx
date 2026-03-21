import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle2, Clock, ChevronLeft, MapPin, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const API_URL = 'http://localhost:5022/api';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

interface TrackingStep {
    label: string;
    description: string;
    timestamp?: string;
    completed: boolean;
    active: boolean;
}

interface OrderTracking {
    orderId: string;
    orderNumber: string;
    status: string;
    expectedDeliveryStart?: string;
    expectedDeliveryEnd?: string;
    martName: string;
    shippingAddress: string;
    totalAmount: number;
    steps: TrackingStep[];
}

const statusStepMap: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    processing: 1,
    packed: 1,
    shipping: 2,
    shipped: 2,
    delivered: 3,
};

function buildSteps(order: { status: string; statusHistory?: Array<{ status: string; changedAt: string }> }): TrackingStep[] {
    const currentIndex = statusStepMap[order.status] ?? 0;
    const historyMap = new Map<string, string>();
    if (order.statusHistory) {
        for (const h of order.statusHistory) {
            historyMap.set(h.status, h.changedAt);
        }
    }

    const steps: TrackingStep[] = [
        {
            label: 'Đặt hàng',
            description: 'Đơn hàng đã được tạo',
            timestamp: historyMap.get('pending'),
            completed: currentIndex >= 0,
            active: currentIndex === 0,
        },
        {
            label: 'Xác nhận & Đóng gói',
            description: 'Mart đang chuẩn bị đơn hàng',
            timestamp: historyMap.get('confirmed') ?? historyMap.get('processing') ?? historyMap.get('packed'),
            completed: currentIndex >= 1,
            active: currentIndex === 1,
        },
        {
            label: 'Đang giao',
            description: 'Đơn hàng đang trên đường đến bạn',
            timestamp: historyMap.get('shipping') ?? historyMap.get('shipped'),
            completed: currentIndex >= 2,
            active: currentIndex === 2,
        },
        {
            label: 'Đã giao',
            description: 'Giao hàng thành công',
            timestamp: historyMap.get('delivered'),
            completed: currentIndex >= 3,
            active: currentIndex === 3,
        },
    ];
    return steps;
}

export default function OrderTrackingPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: order, isLoading } = useQuery({
        queryKey: ['order-tracking', id],
        queryFn: async () => {
            const res = await api.get(`/orders/${id}`);
            return res.data;
        },
        enabled: !!id,
        refetchInterval: 30000, // poll every 30s
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Không tìm thấy đơn hàng</p>
                    <Button variant="outline" className="mt-3" onClick={() => navigate(-1)}>Quay lại</Button>
                </div>
            </div>
        );
    }

    const steps = buildSteps(order);
    const isCancelled = order.status === 'cancelled' || order.status === 'returned';

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm">Quay lại</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Theo dõi đơn hàng</h1>
                    <p className="text-sm text-gray-500 mt-1">#{order.orderNumber ?? order.id?.slice(0, 8)}</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Cancelled banner */}
                {isCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="font-medium text-red-700">Đơn hàng đã bị {order.status === 'cancelled' ? 'hủy' : 'trả lại'}</p>
                    </div>
                )}

                {/* 4-step tracker */}
                {!isCancelled && (
                    <div className="bg-white rounded-xl border p-6 mb-6">
                        <h2 className="font-semibold text-gray-900 mb-6">Trạng thái đơn hàng</h2>
                        <div className="relative">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex gap-4 mb-6 last:mb-0">
                                    {/* Circle + line */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                            step.completed
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-200 text-gray-400'
                                        }`}>
                                            {step.completed ? (
                                                <CheckCircle2 className="w-5 h-5" />
                                            ) : (
                                                <span className="text-xs font-bold">{idx + 1}</span>
                                            )}
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className={`w-0.5 flex-1 min-h-[24px] ${
                                                step.completed ? 'bg-emerald-500' : 'bg-gray-200'
                                            }`} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="pb-2">
                                        <p className={`font-medium ${
                                            step.active ? 'text-emerald-700' : step.completed ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                            {step.label}
                                        </p>
                                        <p className="text-sm text-gray-500">{step.description}</p>
                                        {step.timestamp && (
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(step.timestamp)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Delivery window */}
                {order.expectedDeliveryStart && (
                    <div className="bg-white rounded-xl border p-5 mb-4 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-gray-900">Dự kiến giao hàng</p>
                            <p className="text-sm text-gray-600 mt-1">
                                {formatDate(order.expectedDeliveryStart)} — {formatDate(order.expectedDeliveryEnd)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Shipping address */}
                {order.shippingAddressSnapshot && (
                    <div className="bg-white rounded-xl border p-5 mb-4 flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-gray-900">Địa chỉ giao hàng</p>
                            <p className="text-sm text-gray-600 mt-1">{order.shippingAddressSnapshot}</p>
                        </div>
                    </div>
                )}

                {/* Order summary */}
                <div className="bg-white rounded-xl border p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Tóm tắt đơn hàng</h3>
                    {order.items?.map((item: { productId: string; productName: string; quantity: number; unitPrice: number; totalPrice: number; productImageUrl?: string }) => (
                        <div key={item.productId} className="flex items-center gap-3 py-2 border-b last:border-0">
                            {item.productImageUrl && (
                                <img src={item.productImageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                                <p className="text-xs text-gray-500">x{item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium">{item.totalPrice.toLocaleString('vi-VN')}đ</p>
                        </div>
                    ))}
                    <div className="flex justify-between mt-4 pt-3 border-t">
                        <span className="font-semibold">Tổng cộng</span>
                        <span className="font-semibold text-emerald-600">{order.totalAmount?.toLocaleString('vi-VN')}đ</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

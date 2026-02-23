import { useState, useEffect } from 'react';
import { X, Mail, Loader2, User, Package, MapPin, CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { adminSubscriptionApi, type AdminSubscriptionDetailDto } from '../../services/adminSubscriptionApi';
import { toast } from 'sonner';

interface Props {
    subscriptionId: string;
    onClose: () => void;
    onRefresh: () => void;
}

export default function SubscriptionDetailDialog({ subscriptionId, onClose, onRefresh }: Props) {
    const [detail, setDetail] = useState<AdminSubscriptionDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [sendingEmail, setSendingEmail] = useState(false);

    useEffect(() => {
        loadDetail();
    }, [subscriptionId]);

    const loadDetail = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setLoading(true);
            const response = await adminSubscriptionApi.getSubscriptionDetail(subscriptionId, token);
            if (response.success) {
                setDetail(response.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải chi tiết');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setSendingEmail(true);
            const response = await adminSubscriptionApi.sendManualReminders(
                { subscriptionIds: [subscriptionId] },
                token
            );

            if (response.success) {
                toast.success('Đã gửi email thành công');
                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể gửi email');
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            </div>
        );
    }

    if (!detail) return null;

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            active: { label: 'Hoạt động', className: 'bg-green-100 text-green-700' },
            paused: { label: 'Tạm dừng', className: 'bg-orange-100 text-orange-700' },
            cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
        };
        const config = statusMap[status.toLowerCase()] || { label: status, className: 'bg-gray-100 text-gray-700' };
        return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.className}`}>{config.label}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold">Chi Tiết Subscription</h2>
                        <p className="text-sm text-orange-100">ID: {subscriptionId.slice(0, 8)}...</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status & Actions */}
                    <div className="flex items-center justify-between">
                        {getStatusBadge(detail.status)}
                        {detail.status.toLowerCase() === 'active' && (
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition flex items-center gap-2"
                            >
                                {sendingEmail ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        Gửi Email Nhắc Nhở
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-5 h-5 text-blue-600" />
                            <h3 className="text-base font-semibold text-gray-900">Thông Tin Khách Hàng</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-600">Tên:</span>
                                <span className="ml-2 font-medium text-gray-900">{detail.customerName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Email:</span>
                                <span className="ml-2 font-medium text-gray-900">{detail.customerEmail}</span>
                            </div>
                            {detail.customerPhone && (
                                <div>
                                    <span className="text-gray-600">SĐT:</span>
                                    <span className="ml-2 font-medium text-gray-900">{detail.customerPhone}</span>
                                </div>
                            )}
                            {detail.customerTier && (
                                <div>
                                    <span className="text-gray-600">Hạng:</span>
                                    <span className="ml-2 font-medium text-gray-900">{detail.customerTier}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="w-5 h-5 text-orange-600" />
                            <h3 className="text-base font-semibold text-gray-900">Sản Phẩm</h3>
                        </div>
                        <div className="flex gap-4">
                            {detail.productImage && (
                                <img src={detail.productImage} alt={detail.productName} className="w-20 h-20 rounded-lg object-cover" />
                            )}
                            <div className="flex-1 text-sm space-y-1">
                                <div className="font-semibold text-gray-900">{detail.productName}</div>
                                {detail.productCategory && <div className="text-gray-600">Danh mục: {detail.productCategory}</div>}
                                <div className="text-gray-600">Giá: {detail.productPrice.toLocaleString('vi-VN')}₫</div>
                                <div className="text-gray-600">Số lượng: x{detail.quantity}</div>
                                {detail.discountPercent > 0 && (
                                    <div className="text-emerald-600 font-medium">Giảm giá: {detail.discountPercent}%</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {detail.shippingFullAddress && (
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-5 h-5 text-green-600" />
                                <h3 className="text-base font-semibold text-gray-900">Địa Chỉ Giao Hàng</h3>
                            </div>
                            <p className="text-sm text-gray-700">{detail.shippingFullAddress}</p>
                        </div>
                    )}

                    {/* Payment Method */}
                    {detail.paymentMethodType && (
                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-5 h-5 text-purple-600" />
                                <h3 className="text-base font-semibold text-gray-900">Phương Thức Thanh Toán</h3>
                            </div>
                            <div className="text-sm text-gray-700">
                                <div>Loại: {detail.paymentMethodType}</div>
                                {detail.paymentMethodDetails && <div>Chi tiết: {detail.paymentMethodDetails}</div>}
                            </div>
                        </div>
                    )}

                    {/* Schedule Info */}
                    <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 text-amber-600" />
                            <h3 className="text-base font-semibold text-gray-900">Lịch Giao Hàng</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-600">Tần suất:</span>
                                <span className="ml-2 font-medium text-gray-900">{detail.frequency}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Ngày bắt đầu:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {new Date(detail.startDate).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Giao tiếp theo:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {new Date(detail.nextDeliveryDate).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            {detail.pauseUntil && (
                                <div>
                                    <span className="text-gray-600">Tạm dừng đến:</span>
                                    <span className="ml-2 font-medium text-orange-600">
                                        {new Date(detail.pauseUntil).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-base font-semibold text-gray-900">Thống Kê</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-600">{detail.totalOrdersCreated}</div>
                                <div className="text-gray-600">Đơn hàng</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-600">
                                    {detail.totalRevenue.toLocaleString('vi-VN')}₫
                                </div>
                                <div className="text-gray-600">Doanh thu</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-600">{detail.remindersSent}</div>
                                <div className="text-gray-600">Email đã gửi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

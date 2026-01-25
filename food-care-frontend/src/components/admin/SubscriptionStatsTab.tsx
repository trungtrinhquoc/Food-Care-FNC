import { useState, useEffect } from 'react';
import { getSubscriptionReminderStats, type SubscriptionReminderStats } from '../../services/subscriptionReminderApi';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionStatsTab() {
    const [stats, setStats] = useState<SubscriptionReminderStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setLoading(true);
            const response = await getSubscriptionReminderStats(token);
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            toast.error('Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">Không thể tải thống kê</p>
                <button
                    onClick={loadStats}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Thống Kê Subscriptions</h2>
                    <p className="text-sm text-gray-600">Tổng quan về subscriptions và email nhắc nhở</p>
                </div>
                <button
                    onClick={loadStats}
                    className="px-4 py-2 text-sm text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Làm mới
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Active Subscriptions */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Subscriptions Hoạt Động</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalActiveSubscriptions}</p>
                        </div>
                        <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Reminders Sent Today */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-5 border border-emerald-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-emerald-600 font-medium">Email Đã Gửi Hôm Nay</p>
                            <p className="text-3xl font-bold text-emerald-900 mt-2">{stats.remindersSentToday}</p>
                        </div>
                        <div className="w-14 h-14 bg-emerald-200 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pending Confirmations */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Chờ Xác Nhận</p>
                            <p className="text-3xl font-bold text-amber-900 mt-2">{stats.pendingConfirmations}</p>
                        </div>
                        <div className="w-14 h-14 bg-amber-200 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Confirmed */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">✅ Tiếp Tục</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">{stats.confirmedCount}</p>
                        </div>
                        <div className="w-14 h-14 bg-green-200 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Paused */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-600 font-medium">⏸️ Tạm Dừng</p>
                            <p className="text-3xl font-bold text-orange-900 mt-2">{stats.pausedCount}</p>
                        </div>
                        <div className="w-14 h-14 bg-orange-200 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Cancelled */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-5 border border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">❌ Đã Hủy</p>
                            <p className="text-3xl font-bold text-red-900 mt-2">{stats.cancelledCount}</p>
                        </div>
                        <div className="w-14 h-14 bg-red-200 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Cách hoạt động:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Hệ thống tự động gửi email cho subscriptions có ngày giao trong 3 ngày tới</li>
                            <li>Khách hàng nhận email với 3 lựa chọn: Tiếp tục / Tạm dừng / Hủy</li>
                            <li>Nếu không phản hồi, đơn hàng sẽ tự động được tạo</li>
                            <li>Admin có thể gửi email thủ công từ tab Danh Sách</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

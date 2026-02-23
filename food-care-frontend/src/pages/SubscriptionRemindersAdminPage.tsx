import { useState } from 'react';
import { sendSubscriptionReminders, getSubscriptionReminderStats, type SubscriptionReminderStats } from '../services/subscriptionReminderApi';
import { toast } from 'sonner';

export default function SubscriptionRemindersAdminPage() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<SubscriptionReminderStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const handleSendReminders = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập');
            return;
        }

        try {
            setLoading(true);
            const response = await sendSubscriptionReminders(token);

            if (response.success) {
                toast.success(response.message);
                // Reload stats after sending
                loadStats();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể gửi email');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setLoadingStats(true);
            const response = await getSubscriptionReminderStats(token);

            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📧 Quản lý Email Nhắc Nhở Subscription
                    </h1>
                    <p className="text-gray-600">
                        Gửi email nhắc nhở cho khách hàng trước 3 ngày giao hàng định kỳ
                    </p>
                </div>

                {/* Action Card */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Gửi Email Nhắc Nhở
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Hệ thống sẽ tự động gửi email cho tất cả subscriptions có ngày giao trong 3 ngày tới
                            </p>
                        </div>
                        <button
                            onClick={handleSendReminders}
                            disabled={loading}
                            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Gửi Email Ngay
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Statistics Card */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Thống Kê</h2>
                        <button
                            onClick={loadStats}
                            disabled={loadingStats}
                            className="px-4 py-2 text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition"
                        >
                            {loadingStats ? 'Đang tải...' : 'Làm mới'}
                        </button>
                    </div>

                    {stats ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Total Active Subscriptions */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Subscriptions Active</p>
                                        <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalActiveSubscriptions}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Reminders Sent Today */}
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-emerald-600 font-medium">Email Đã Gửi Hôm Nay</p>
                                        <p className="text-3xl font-bold text-emerald-900 mt-1">{stats.remindersSentToday}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Confirmations */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-amber-600 font-medium">Chờ Xác Nhận</p>
                                        <p className="text-3xl font-bold text-amber-900 mt-1">{stats.pendingConfirmations}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmed */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600 font-medium">✅ Tiếp Tục</p>
                                        <p className="text-3xl font-bold text-green-900 mt-1">{stats.confirmedCount}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Paused */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-orange-600 font-medium">⏸️ Tạm Dừng</p>
                                        <p className="text-3xl font-bold text-orange-900 mt-1">{stats.pausedCount}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Cancelled */}
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-red-600 font-medium">❌ Đã Hủy</p>
                                        <p className="text-3xl font-bold text-red-900 mt-1">{stats.cancelledCount}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">Chưa có dữ liệu thống kê</p>
                            <button
                                onClick={loadStats}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                            >
                                Tải Thống Kê
                            </button>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Cách hoạt động:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Hệ thống tự động gửi email cho subscriptions có ngày giao trong 3 ngày tới</li>
                                <li>Khách hàng nhận email với 3 lựa chọn: Tiếp tục / Tạm dừng / Hủy</li>
                                <li>Nếu không phản hồi, đơn hàng sẽ tự động được tạo</li>
                                <li>Setup cron job để tự động gửi email hàng ngày lúc 9:00 AM</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

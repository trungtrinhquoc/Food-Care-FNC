import { Bell, Check, Trash2, RefreshCw, ShoppingBag, Truck, CheckCircle, XCircle, Package, Star, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../services/notificationApi';

function getNotificationIcon(type: string | null) {
    switch (type) {
        case 'order_placed':
            return { icon: ShoppingBag, bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Đặt hàng' };
        case 'order_confirmed':
            return { icon: CheckCircle, bg: 'bg-blue-100', color: 'text-blue-600', label: 'Xác nhận' };
        case 'order_processing':
            return { icon: Package, bg: 'bg-orange-100', color: 'text-orange-600', label: 'Xử lý' };
        case 'order_shipping':
            return { icon: Truck, bg: 'bg-purple-100', color: 'text-purple-600', label: 'Vận chuyển' };
        case 'order_delivered':
            return { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600', label: 'Đã giao' };
        case 'order_cancelled':
            return { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600', label: 'Đã hủy' };
        case 'order_returned':
            return { icon: Package, bg: 'bg-amber-100', color: 'text-amber-600', label: 'Hoàn trả' };
        case 'order_completed':
            return { icon: Star, bg: 'bg-yellow-100', color: 'text-yellow-600', label: 'Hoàn thành' };
        default:
            return { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600', label: 'Thông báo' };
    }
}

function formatTime(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function NotificationCard({ notification, onRead, onDelete }: {
    notification: AppNotification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const navigate = useNavigate();
    const { icon: Icon, bg, color } = getNotificationIcon(notification.type);
    const isUnread = !notification.isRead;

    const handleClick = () => {
        if (isUnread) onRead(notification.id);
        if (notification.linkUrl) navigate(notification.linkUrl);
    };

    return (
        <div
            className={`relative group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer
        ${isUnread
                    ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70 shadow-sm'
                    : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                }`}
            onClick={handleClick}
        >
            {/* Unread indicator bar */}
            {isUnread && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-emerald-500" />
            )}

            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                    </p>
                    <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                        {formatTime(notification.createdAt)}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {notification.message}
                </p>
                {isUnread && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-full">
                        Chưa đọc
                    </span>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUnread && (
                    <button
                        title="Đánh dấu đã đọc"
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    title="Xóa"
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export default function NotificationsPage() {
    const {
        notifications,
        unreadCount,
        loading,
        hasMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loadMore,
        refresh,
    } = useNotifications();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to="/"
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="w-6 h-6 text-emerald-600" />
                            Thông báo
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-bold rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Cập nhật về đơn hàng và hoạt động tài khoản của bạn</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={refresh}
                            disabled={loading}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 disabled:opacity-50"
                            title="Làm mới"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full transition-colors"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Đọc tất cả
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                {notifications.length > 0 && (
                    <div className="flex gap-3 mb-4">
                        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Tổng thông báo</p>
                        </div>
                        <div className="flex-1 bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                            <p className="text-2xl font-bold text-emerald-700">{unreadCount}</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Chưa đọc</p>
                        </div>
                        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-gray-500">{notifications.length - unreadCount}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Đã đọc</p>
                        </div>
                    </div>
                )}

                {/* Notification list */}
                {loading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3" />
                        <p className="text-sm">Đang tải thông báo...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-gray-600 font-semibold text-lg">Chưa có thông báo nào</h3>
                        <p className="text-gray-400 text-sm mt-2 max-w-xs">
                            Khi bạn đặt hàng hoặc có cập nhật về đơn hàng, thông báo sẽ xuất hiện ở đây.
                        </p>
                        <Link
                            to="/products"
                            className="mt-6 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
                        >
                            Mua sắm ngay
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(notif => (
                            <NotificationCard
                                key={notif.id}
                                notification={notif}
                                onRead={markAsRead}
                                onDelete={deleteNotification}
                            />
                        ))}

                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : null}
                                    Xem thêm thông báo
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

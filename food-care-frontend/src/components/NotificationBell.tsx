import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    ShoppingBag,
    Truck,
    CheckCircle,
    XCircle,
    Package,
    Star,
    ChevronDown,
    Trash2,
    Check,
    Loader2,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../services/notificationApi';

// Map type → icon + màu sắc (giống Shopee style)
function getNotificationIcon(type: string | null) {
    switch (type) {
        case 'order_placed':
            return { icon: ShoppingBag, bg: 'bg-emerald-100', color: 'text-emerald-600' };
        case 'order_confirmed':
            return { icon: CheckCircle, bg: 'bg-blue-100', color: 'text-blue-600' };
        case 'order_processing':
            return { icon: Package, bg: 'bg-orange-100', color: 'text-orange-600' };
        case 'order_shipping':
            return { icon: Truck, bg: 'bg-purple-100', color: 'text-purple-600' };
        case 'order_delivered':
            return { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' };
        case 'order_cancelled':
            return { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' };
        case 'order_completed':
            return { icon: Star, bg: 'bg-yellow-100', color: 'text-yellow-600' };
        default:
            return { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600' };
    }
}

function formatTimeAgo(dateStr: string | null): string {
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
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

interface NotificationItemProps {
    notification: AppNotification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    onNavigate: (notification: AppNotification) => void;
}

function NotificationItem({ notification, onRead, onDelete, onNavigate }: NotificationItemProps) {
    const { icon: Icon, bg, color } = getNotificationIcon(notification.type);
    const isUnread = !notification.isRead;

    return (
        <div
            className={`relative group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-gray-50 last:border-0
        ${isUnread ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'bg-white hover:bg-gray-50'}`}
            onClick={() => onNavigate(notification)}
        >
            {/* Unread dot */}
            {isUnread && (
                <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            )}

            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center mt-0.5`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug mb-0.5 ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {notification.title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {notification.message}
                </p>
                <p className={`text-[11px] mt-1 ${isUnread ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                    {formatTimeAgo(notification.createdAt)}
                </p>
            </div>

            {/* Actions (visible on hover) */}
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUnread && (
                    <button
                        title="Đánh dấu đã đọc"
                        className="p-1 rounded hover:bg-blue-100 text-blue-500 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    title="Xóa thông báo"
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();

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

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Refresh when opening
    const handleToggle = () => {
        if (!open) refresh();
        setOpen(prev => !prev);
    };

    const handleNavigate = (notification: AppNotification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        setOpen(false);
        if (notification.linkUrl) {
            navigate(notification.linkUrl);
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                ref={btnRef}
                id="notification-bell-btn"
                onClick={handleToggle}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group"
                aria-label="Thông báo"
            >
                <Bell className={`h-5 w-5 transition-colors ${open ? 'text-emerald-600' : 'text-gray-600 group-hover:text-emerald-600'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-in zoom-in-50 duration-150">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div
                    ref={panelRef}
                    id="notification-panel"
                    className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-2xl ring-1 ring-black/8 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ maxHeight: '520px', display: 'flex', flexDirection: 'column' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-bold text-gray-900 text-sm">Thông báo</h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[11px] font-semibold rounded-full">
                                    {unreadCount} mới
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                            >
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
                        {loading && notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                <p className="text-sm">Đang tải...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="w-7 h-7 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Chưa có thông báo</p>
                                <p className="text-xs text-gray-400 mt-1">Các thông báo của bạn sẽ xuất hiện ở đây</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map(notif => (
                                    <NotificationItem
                                        key={notif.id}
                                        notification={notif}
                                        onRead={markAsRead}
                                        onDelete={deleteNotification}
                                        onNavigate={handleNavigate}
                                    />
                                ))}
                                {hasMore && (
                                    <div className="flex justify-center py-3">
                                        <button
                                            onClick={loadMore}
                                            disabled={loading}
                                            className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" />
                                            )}
                                            Xem thêm
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2.5 bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] text-gray-400">Làm mới sau mỗi 30 giây</p>
                                <button
                                    onClick={() => { setOpen(false); navigate('/notifications'); }}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                                >
                                    Xem tất cả →
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

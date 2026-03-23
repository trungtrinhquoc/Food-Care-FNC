import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { notificationApi, type AppNotification, type NotificationsResponse } from '../services/notificationApi';
import { useAuth } from '../contexts/AuthContext';

const POLL_INTERVAL = 30_000; // 30 giây poll 1 lần

export function useNotifications() {
    const { isAuthenticated } = useAuth();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const data: NotificationsResponse = await notificationApi.getNotifications(pageNum, 15);
            setNotifications(prev => append ? [...prev, ...data.items] : data.items);
            setUnreadCount(data.unreadCount);
            setHasMore(pageNum < data.totalPages);
            setTotalPages(data.totalPages);
        } catch (err) {
            if (!axios.isAxiosError(err)) return;
            // Ignore expected auth/network transitions to avoid noisy console spam.
            if (err.response?.status === 401 || err.code === 'ERR_NETWORK') return;
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const data = await notificationApi.getUnreadCount();
            setUnreadCount(data.count);
        } catch {
            // Silent fail on polling
        }
    }, [isAuthenticated]);

    // Initial load
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications(1);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, fetchNotifications]);

    // Polling for unread count
    useEffect(() => {
        if (!isAuthenticated) return;
        intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAuthenticated, fetchUnreadCount]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    }, []);

    const deleteNotification = useCallback(async (id: string) => {
        const notif = notifications.find(n => n.id === id);
        try {
            await notificationApi.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notif && !notif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Failed to delete notification', err);
        }
    }, [notifications]);

    const loadMore = useCallback(() => {
        if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage, true);
        }
    }, [hasMore, loading, page, fetchNotifications]);

    const refresh = useCallback(() => {
        setPage(1);
        fetchNotifications(1, false);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        hasMore,
        totalPages,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loadMore,
        refresh,
    };
}

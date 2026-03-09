import api from './api';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: string | null;
    isRead: boolean | null;
    linkUrl: string | null;
    createdAt: string | null;
}

export interface NotificationsResponse {
    items: AppNotification[];
    total: number;
    unreadCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const notificationApi = {
    getNotifications: async (page = 1, pageSize = 20): Promise<NotificationsResponse> => {
        const response = await api.get<NotificationsResponse>('/notifications', {
            params: { page, pageSize },
        });
        return response.data;
    },

    getUnreadCount: async (): Promise<{ count: number }> => {
        const response = await api.get<{ count: number }>('/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.patch(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await api.patch('/notifications/mark-all-read');
    },

    deleteNotification: async (id: string): Promise<void> => {
        await api.delete(`/notifications/${id}`);
    },
};

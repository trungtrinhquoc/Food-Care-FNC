import api from './api';

export interface AdminSubscriptionDto {
    id: string;
    userId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    productId: string;
    productName: string;
    productImage?: string;
    productPrice: number;
    frequency: string;
    quantity: number;
    discountPercent: number;
    status: string;
    startDate: string;
    nextDeliveryDate: string;
    pauseUntil?: string;
    createdAt: string;
}

export interface AdminSubscriptionDetailDto extends AdminSubscriptionDto {
    customerTier?: string;
    shippingStreet?: string;
    shippingWard?: string;
    shippingDistrict?: string;
    shippingCity?: string;
    shippingFullAddress?: string;
    productDescription?: string;
    productCategory?: string;
    paymentMethodType?: string;
    paymentMethodDetails?: string;
    updatedAt?: string;
    totalOrdersCreated: number;
    totalRevenue: number;
    lastOrderDate?: string;
    remindersSent: number;
    lastReminderSent?: string;
}

export interface SubscriptionFilters {
    status?: string;
    frequency?: string;
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}

export interface PaginatedSubscriptionsResponse {
    subscriptions: AdminSubscriptionDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface SendReminderRequest {
    subscriptionIds: string[];
    customMessage?: string;
}

export interface SendReminderResponse {
    success: boolean;
    successCount: number;
    failedCount: number;
    errors: string[];
    message: string;
}

export const adminSubscriptionApi = {
    getAllSubscriptions: async (filters: SubscriptionFilters, token: string) => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.frequency) params.append('frequency', filters.frequency);
        if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

        const response = await api.get<{ success: boolean; data: PaginatedSubscriptionsResponse }>(
            `/admin/subscriptions?${params.toString()}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    },

    getSubscriptionDetail: async (id: string, token: string) => {
        const response = await api.get<{ success: boolean; data: AdminSubscriptionDetailDto }>(
            `/admin/subscriptions/${id}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    },

    sendManualReminders: async (request: SendReminderRequest, token: string) => {
        const response = await api.post<{ success: boolean; data: SendReminderResponse }>(
            `/admin/subscriptions/send-reminders`,
            request,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    }
};

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SubscriptionConfirmationDetails {
    subscriptionId: string;
    productName: string;
    productImage?: string;
    scheduledDeliveryDate: string;
    frequency: string;
    quantity: number;
    totalAmount: number;
    isExpired: boolean;
    isAlreadyProcessed: boolean;
}

export interface ProcessConfirmationRequest {
    token: string;
    action: 'continue' | 'pause' | 'cancel';
    pauseUntil?: string; // DateOnly format: YYYY-MM-DD
}

export interface SubscriptionReminderStats {
    totalActiveSubscriptions: number;
    remindersSentToday: number;
    pendingConfirmations: number;
    confirmedCount: number;
    pausedCount: number;
    cancelledCount: number;
}

// [PUBLIC] Get confirmation details from token
export const getSubscriptionConfirmation = async (token: string) => {
    const response = await axios.get(`${API_URL}/subscription-reminders/confirm`, {
        params: { token }
    });
    return response.data;
};

// [PUBLIC] Process customer confirmation
export const processSubscriptionConfirmation = async (data: ProcessConfirmationRequest) => {
    const response = await axios.post(`${API_URL}/subscription-reminders/confirm`, data);
    return response.data;
};

// [ADMIN] Manually trigger sending reminders
export const sendSubscriptionReminders = async (token: string) => {
    const response = await axios.post(
        `${API_URL}/subscription-reminders/send`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return response.data;
};

// [ADMIN] Get statistics
export const getSubscriptionReminderStats = async (token: string) => {
    const response = await axios.get(`${API_URL}/subscription-reminders/statistics`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

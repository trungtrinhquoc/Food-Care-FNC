import api from './api';

export interface SubscriptionOption {
    frequency: string;
    code: string;
    label: string;
    discountPercent: number;
}

export interface CreateSubscriptionRequest {
    productId: string;
    frequency: string;
    quantity: number;
    discountPercent: number;
    paymentMethodId?: string;
    shippingAddressId?: string;
    startDate?: string;
}

export const subscriptionApi = {
    getOptions: async (): Promise<SubscriptionOption[]> => {
        const response = await api.get('/subscriptions/options');
        return response.data;
    },

    createSubscription: async (data: CreateSubscriptionRequest) => {
        const response = await api.post('/subscriptions', data);
        return response.data;
    },
};

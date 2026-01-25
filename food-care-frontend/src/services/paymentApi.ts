import api from './api';
import type { CreatePaymentRequest, PayOsCreateLinkResponse } from '../types';

export const paymentApi = {
    createPayOsPayment: async (data: CreatePaymentRequest): Promise<PayOsCreateLinkResponse> => {
        const response = await api.post<PayOsCreateLinkResponse>('/payments/payos/create', data);
        return response.data;
    },
};

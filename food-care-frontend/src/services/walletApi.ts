import api from './api';

export interface WalletBalance {
    balance: number;
}

export interface WalletTransaction {
    id: string;
    amount: number;
    type: 'TopUp' | 'Payment' | 'Refund';
    status: 'Pending' | 'Completed' | 'Failed' | 'Canceled';
    referenceId?: string;
    description?: string;
    createdAt: string;
}

export const walletApi = {
    getBalance: async (): Promise<WalletBalance> => {
        const res = await api.get('/wallet/balance');
        return res.data;
    },

    getTransactions: async (page = 1, pageSize = 20): Promise<WalletTransaction[]> => {
        const res = await api.get(`/wallet/transactions?page=${page}&pageSize=${pageSize}`);
        return res.data;
    },

    topUp: async (amount: number): Promise<WalletTransaction> => {
        const res = await api.post('/wallet/topup', { amount });
        return res.data;
    },

    deductBalance: async (amount: number, referenceId?: string, description?: string): Promise<WalletTransaction> => {
        const res = await api.post('/wallet/deduct', { amount, referenceId, description });
        return res.data;
    },
};

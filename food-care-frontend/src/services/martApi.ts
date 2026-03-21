import axios from 'axios';
import type {
    NearbyMart,
    MartDetail,
    MartProduct,
    NearbyMartQuery,
    MartProductFilter,
} from '../types/mart';

const API_URL = 'http://localhost:5022/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const martApi = {
    getNearbyMarts: async (query: NearbyMartQuery): Promise<NearbyMart[]> => {
        const res = await api.get<NearbyMart[]>('/mart/nearby', { params: query });
        return res.data;
    },

    getMartDetail: async (id: number): Promise<MartDetail> => {
        const res = await api.get<MartDetail>(`/mart/${id}`);
        return res.data;
    },

    getMartProducts: async (martId: number, filter: MartProductFilter = {}): Promise<{ products: MartProduct[]; totalCount: number }> => {
        const res = await api.get(`/mart/${martId}/products`, { params: filter });
        return res.data;
    },

    selectMart: async (martId: number): Promise<void> => {
        await api.put('/mart/select', { martId });
    },

    getSelectedMart: async (): Promise<number | null> => {
        const res = await api.get<{ selectedMartId: number | null }>('/mart/selected');
        return res.data.selectedMartId;
    },
};

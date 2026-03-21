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
        try {
            const res = await api.get<NearbyMart[]>('/mart/nearby', { params: query });
            return res.data;
        } catch {
            // Backend endpoint not yet available — return mock Đà Nẵng marts as fallback
            return [
                {
                    id: 1,
                    storeName: 'Food & Care Mart – Hải Châu',
                    address: '123 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
                    distanceKm: 1.2,
                    rating: 4.8,
                    productCount: 320,
                    isPreSelected: true,
                    latitude: 16.0678,
                    longitude: 108.2208,
                },
                {
                    id: 2,
                    storeName: 'Food & Care Mart – Thanh Khê',
                    address: '45 Trần Cao Vân, Phường Xuân Hà, Quận Thanh Khê, Đà Nẵng',
                    distanceKm: 2.7,
                    rating: 4.6,
                    productCount: 280,
                    isPreSelected: false,
                    latitude: 16.0831,
                    longitude: 108.1965,
                },
            ];
        }
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

import api from './api';
import type { Complaint } from '../types/admin';

export interface PlatformFeedback {
    id: string;
    customerName?: string;
    message: string;
    rating: number;
    createdAt?: string;
    status?: string;
}

function buildDescription(payload: { description: string; rating: number }) {
    return [
        '[platform_feedback]',
        `[rating:${payload.rating}]`,
        payload.description,
    ]
        .filter(Boolean)
        .join('\n');
}

function parseFeedback(item: Complaint): PlatformFeedback {
    const lines = (item.description || '').split('\n');
    const ratingLine = lines.find((l) => l.startsWith('[rating:'));

    const rating = ratingLine ? Number(ratingLine.replace('[rating:', '').replace(']', '')) : 0;

    const message = lines
        .filter((l) => !l.startsWith('[platform_feedback]') && !l.startsWith('[rating:'))
        .join('\n')
        .trim();

    return {
        id: item.id,
        customerName: item.customerName,
        message,
        rating: Number.isFinite(rating) && rating > 0 ? rating : 0,
        createdAt: item.createdAt,
        status: item.status,
    };
}

export const feedbackApi = {
    submitFeedback: async (payload: {
        description: string;
        rating: number;
        imageUrls?: string[];
    }): Promise<Complaint> => {
        const response = await api.post('/complaints', {
            orderNumber: 'PLATFORM-FEEDBACK',
            type: 'Góp ý nền tảng',
            description: buildDescription({
                description: payload.description,
                rating: payload.rating,
            }),
            imageUrls: payload.imageUrls ?? [],
        });

        return response.data;
    },

    getMyFeedbacks: async (): Promise<PlatformFeedback[]> => {
        const response = await api.get<Complaint[]>('/complaints/my');
        return (response.data ?? [])
            .filter((x) => x.type === 'Góp ý nền tảng')
            .map(parseFeedback);
    },

    getAdminFeedbacks: async (page = 1, pageSize = 20): Promise<{ items: PlatformFeedback[]; totalItems: number }> => {
        const response = await api.get('/admin/complaints', {
            params: {
                type: 'Góp ý nền tảng',
                page,
                pageSize,
            },
        });
        const raw = response.data;
        const rawItems: Complaint[] = raw?.items ?? [];
        return {
            items: rawItems.map(parseFeedback),
            totalItems: raw?.totalItems ?? rawItems.length,
        };
    },
};

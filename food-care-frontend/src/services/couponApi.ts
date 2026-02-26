import api from './api';

export interface CouponDto {
    id: number;
    code: string;
    discountType?: string;
    discountValue: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    startDate?: string;
    endDate?: string;
}

export const couponApi = {
    getAvailableCoupons: async (orderValue: number = 0): Promise<CouponDto[]> => {
        const response = await api.get('/coupons/available', { params: { orderValue } });
        return response.data;
    },
    validateCoupon: async (code: string, orderValue: number): Promise<CouponDto> => {
        const response = await api.post('/coupons/validate', { code, orderValue });
        return response.data;
    }
};

import api from '../api';

export interface AdminCoupon {
  id: number;
  code: string;
  discountType: string | null;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CouponCreateDto {
  code: string;
  discountType?: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
}

export interface CouponUpdateDto extends CouponCreateDto {
  isActive: boolean;
}

export const adminCouponsService = {
  getList: async (): Promise<AdminCoupon[]> => {
    const { data } = await api.get('/admin/coupons');
    return data;
  },

  getById: async (id: number): Promise<AdminCoupon> => {
    const { data } = await api.get(`/admin/coupons/${id}`);
    return data;
  },

  create: async (dto: CouponCreateDto): Promise<AdminCoupon> => {
    const { data } = await api.post('/admin/coupons', dto);
    return data;
  },

  update: async (id: number, dto: CouponUpdateDto): Promise<AdminCoupon> => {
    const { data } = await api.put(`/admin/coupons/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/coupons/${id}`);
  },
};

// =============================================
// CUSTOMER LOGS SERVICE - Clean Architecture
// =============================================

import api from '../api';
import type {
  OrderLog,
  LoginLog,
  PaymentLog,
  PointLog,
  ReviewLog,
  AdjustPointsRequest,
} from '../../types/admin';

// ==================== API RESPONSE MAPPERS ====================
const mapOrderLog = (o: Record<string, unknown>): OrderLog => ({
  id: o.id as string,
  orderDate: o.createdAt as string,
  status: o.status as string,
  totalAmount: o.totalAmount as number,
  itemCount: (o.orderItems as unknown[])?.length || 0,
  paymentStatus: o.paymentStatus as string,
});

const mapLoginLog = (l: Record<string, unknown>): LoginLog => ({
  id: l.id as string,
  loginAt: l.loginAt as string,
  ipAddress: (l.ipAddress as string) || 'N/A',
  device: (l.deviceName as string) || (l.deviceType as string) || 'Unknown',
  location: (l.location as string) || 'Unknown',
  success: l.success as boolean,
});

const mapPaymentLog = (p: Record<string, unknown>): PaymentLog => ({
  id: p.id as string,
  orderId: p.orderId as string,
  amount: p.amount as number,
  paymentMethod: (p.paymentMethodName as string) || (p.paymentMethod as string) || 'N/A',
  status: p.status as string,
  paidAt: (p.paidAt as string) || (p.createdAt as string),
  transactionId: (p.transactionId as string) || `TXN-${(p.id as string).slice(0, 8).toUpperCase()}`,
});

const mapReviewLog = (r: Record<string, unknown>): ReviewLog => ({
  id: r.id as string,
  productName: (r.productName as string) || 'Sản phẩm',
  rating: r.rating as number,
  comment: r.comment as string,
  createdAt: r.createdAt as string,
  isVerified: r.isVerifiedPurchase as boolean,
});

const mapPointLog = (p: Record<string, unknown>): PointLog => ({
  id: p.id as string,
  points: p.points as number,
  type: (p.points as number) >= 0 ? 'earn' : 'redeem',
  description: (p.description as string) || ((p.points as number) >= 0 ? 'Tích điểm' : 'Đổi điểm'),
  createdAt: p.createdAt as string,
  orderId: p.orderId as string | undefined,
  balanceBefore: p.balanceBefore as number | undefined,
  balanceAfter: p.balanceAfter as number | undefined,
});

// ==================== API FUNCTIONS ====================

/**
 * Get customer order logs
 */
export const getCustomerOrders = async (
  customerId: string,
  pageSize: number = 50
): Promise<OrderLog[]> => {
  try {
    const response = await api.get('/admin/orders', {
      params: { userId: customerId, pageSize },
    });
    return response.data.items?.map(mapOrderLog) || [];
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
};

/**
 * Get customer login logs
 */
export const getCustomerLoginLogs = async (
  customerId: string,
  pageSize: number = 50
): Promise<LoginLog[]> => {
  try {
    const response = await api.get(`/admin/customers/${customerId}/logs/logins`, {
      params: { pageSize },
    });
    return response.data.items?.map(mapLoginLog) || [];
  } catch (error) {
    console.error('Error fetching login logs:', error);
    return [];
  }
};

/**
 * Get customer payment logs
 */
export const getCustomerPaymentLogs = async (
  customerId: string,
  pageSize: number = 50
): Promise<PaymentLog[]> => {
  try {
    const response = await api.get(`/admin/customers/${customerId}/logs/payments`, {
      params: { pageSize },
    });
    return response.data.items?.map(mapPaymentLog) || [];
  } catch (error) {
    console.error('Error fetching payment logs:', error);
    return [];
  }
};

/**
 * Get customer review logs
 */
export const getCustomerReviewLogs = async (
  customerId: string,
  pageSize: number = 50
): Promise<ReviewLog[]> => {
  try {
    const response = await api.get('/admin/reviews', {
      params: { userId: customerId, pageSize },
    });
    return response.data.items?.map(mapReviewLog) || [];
  } catch (error) {
    console.error('Error fetching review logs:', error);
    return [];
  }
};

/**
 * Get customer points history
 */
export const getCustomerPointsLogs = async (
  customerId: string,
  pageSize: number = 50
): Promise<PointLog[]> => {
  try {
    const response = await api.get(`/admin/customers/${customerId}/logs/points`, {
      params: { pageSize },
    });
    return response.data.items?.map(mapPointLog) || [];
  } catch (error) {
    console.error('Error fetching points logs:', error);
    return [];
  }
};

/**
 * Adjust customer points (admin only)
 */
export const adjustCustomerPoints = async (
  customerId: string,
  data: AdjustPointsRequest
): Promise<PointLog> => {
  const response = await api.post(`/admin/customers/${customerId}/logs/points/adjust`, data);
  return mapPointLog(response.data);
};

// ==================== SERVICE OBJECT ====================
export const customerLogsService = {
  getCustomerOrders,
  getCustomerLoginLogs,
  getCustomerPaymentLogs,
  getCustomerReviewLogs,
  getCustomerPointsLogs,
  adjustCustomerPoints,
};

export default customerLogsService;

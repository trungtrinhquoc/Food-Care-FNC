// =============================================
// ORDERS SERVICE - Clean Architecture
// =============================================

import api from '../api';
import type {
  PagedResult,
  AdminOrder,
  AdminOrderFilter,
  UpdateOrderStatusDto,
} from '../../types/admin';

// ==================== API FUNCTIONS ====================

/**
 * Get orders with filtering and pagination
 */
export const getOrders = async (
  filter: AdminOrderFilter = {}
): Promise<PagedResult<AdminOrder>> => {
  const params = new URLSearchParams();
  
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
  if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
  if (filter.userId) params.append('userId', filter.userId);
  if (filter.status) params.append('status', filter.status);
  if (filter.startDate) params.append('startDate', filter.startDate);
  if (filter.endDate) params.append('endDate', filter.endDate);
  if (filter.sortBy) params.append('sortBy', filter.sortBy);
  if (filter.sortDescending !== undefined) params.append('sortDescending', filter.sortDescending.toString());
  
  const response = await api.get<PagedResult<AdminOrder>>(`/admin/orders?${params}`);
  return response.data;
};

/**
 * Get order by id
 */
export const getOrderById = async (id: string): Promise<AdminOrder> => {
  const response = await api.get<AdminOrder>(`/admin/orders/${id}`);
  return response.data;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  id: string,
  data: UpdateOrderStatusDto
): Promise<void> => {
  await api.patch(`/admin/orders/${id}/status`, data);
};

/**
 * Get order statistics
 */
export const getOrderStats = async (): Promise<{
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  totalRevenue: number;
}> => {
  const response = await api.get('/admin/orders/stats');
  return response.data;
};

// Export all functions as an object for convenience
export const ordersService = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
};

// =============================================
// CUSTOMERS SERVICE - Clean Architecture
// =============================================

import api from '../api';
import type {
  PagedResult,
  AdminUser,
  AdminUserFilter,
  UpdateCustomerDto,
  MemberTierInfo,
  UserStats,
  RecentOrder,
} from '../../types/admin';

// ==================== API FUNCTIONS ====================

/**
 * Get customers (users with role = customer)
 */
export const getCustomers = async (
  filter: AdminUserFilter = {}
): Promise<PagedResult<AdminUser>> => {
  const params = new URLSearchParams();
  
  // Force customer role
  params.append('role', 'customer');
  
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
  if (filter.search) params.append('search', filter.search);
  if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
  if (filter.tierId) params.append('tierId', filter.tierId.toString());
  if (filter.sortBy) params.append('sortBy', filter.sortBy);
  if (filter.sortDesc !== undefined) params.append('sortDesc', filter.sortDesc.toString());
  
  const response = await api.get<PagedResult<AdminUser>>(`/admin/users?${params}`);
  return response.data;
};

/**
 * Get customer by id
 */
export const getCustomerById = async (id: string): Promise<AdminUser> => {
  const response = await api.get<AdminUser>(`/admin/users/${id}`);
  return response.data;
};

/**
 * Update customer
 */
export const updateCustomer = async (
  id: string,
  data: UpdateCustomerDto
): Promise<AdminUser> => {
  const response = await api.put<AdminUser>(`/admin/users/${id}`, {
    ...data,
    isActive: true, // Keep customer active
  });
  return response.data;
};

/**
 * Get member tiers
 */
export const getMemberTiers = async (): Promise<MemberTierInfo[]> => {
  const response = await api.get<MemberTierInfo[]>('/admin/users/tiers');
  return response.data;
};

/**
 * Get customer stats
 */
export const getCustomerStats = async (): Promise<UserStats> => {
  const response = await api.get<UserStats>('/admin/users/stats');
  return response.data;
};

/**
 * Get recent orders for a customer
 */
export const getCustomerRecentOrders = async (
  customerId: string,
  pageSize: number = 5
): Promise<RecentOrder[]> => {
  try {
    const response = await api.get('/admin/orders', {
      params: {
        userId: customerId,
        pageSize,
        page: 1,
      },
    });
    return response.data.items || [];
  } catch {
    return [];
  }
};

// ==================== SERVICE OBJECT ====================
export const customersService = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  getMemberTiers,
  getCustomerStats,
  getCustomerRecentOrders,
};

export default customersService;

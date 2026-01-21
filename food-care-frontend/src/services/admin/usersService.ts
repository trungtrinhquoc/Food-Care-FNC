// =============================================
// USERS SERVICE - Clean Architecture
// =============================================

import api from '../api';
import type {
  PagedResult,
  AdminUser,
  AdminUserFilter,
  CreateUserDto,
  UpdateUserDto,
  UserStats,
} from '../../types/admin';

// ==================== API FUNCTIONS ====================

/**
 * Get users with filtering and pagination
 */
export const getUsers = async (
  filter: AdminUserFilter = {}
): Promise<PagedResult<AdminUser>> => {
  const params = new URLSearchParams();
  
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
  if (filter.search) params.append('search', filter.search);
  if (filter.role) params.append('role', filter.role);
  if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
  if (filter.tierId) params.append('tierId', filter.tierId.toString());
  if (filter.sortBy) params.append('sortBy', filter.sortBy);
  if (filter.sortDesc !== undefined) params.append('sortDesc', filter.sortDesc.toString());
  
  const response = await api.get<PagedResult<AdminUser>>(`/admin/users?${params}`);
  return response.data;
};

/**
 * Get user by id
 */
export const getUserById = async (id: string): Promise<AdminUser> => {
  const response = await api.get<AdminUser>(`/admin/users/${id}`);
  return response.data;
};

/**
 * Get user statistics
 */
export const getUserStats = async (): Promise<UserStats> => {
  const response = await api.get<UserStats>('/admin/users/stats');
  return response.data;
};

/**
 * Create new user
 */
export const createUser = async (data: CreateUserDto): Promise<AdminUser> => {
  const response = await api.post<AdminUser>('/admin/users', data);
  return response.data;
};

/**
 * Update user
 */
export const updateUser = async (
  id: string,
  data: UpdateUserDto
): Promise<AdminUser> => {
  const response = await api.put<AdminUser>(`/admin/users/${id}`, data);
  return response.data;
};

/**
 * Toggle user active status
 */
export const toggleUserActive = async (id: string): Promise<void> => {
  await api.patch(`/admin/users/${id}/toggle-active`);
};

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

/**
 * Change user password (admin)
 */
export const changeUserPassword = async (
  userId: string,
  newPassword: string
): Promise<void> => {
  await api.post(`/admin/users/${userId}/change-password`, { newPassword });
};

// Export all functions as an object for convenience
export const usersService = {
  getUsers,
  getUserById,
  getUserStats,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
  changeUserPassword,
};

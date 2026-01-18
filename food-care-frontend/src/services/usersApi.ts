import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  tierId: number | null;
  tierName: string | null;
  loyaltyPoints: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  totalOrders: number;
  totalSpent: number;
  totalSubscriptions: number;
  totalReviews: number;
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName?: string;
  role?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  role?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  tierId?: number | null;
  loyaltyPoints?: number;
  isActive: boolean;
}

export interface AdminUserFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  tierId?: number;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<string, number>;
  usersByTier: Record<string, number>;
  newUsersThisMonth: number;
}

export interface MemberTier {
  id: number;
  name: string;
  minPoint: number;
  discountPercent: number | null;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Get users with filters and pagination - calls Backend API
export const getUsers = async (filter: AdminUserFilter = {}): Promise<PagedResult<AdminUser>> => {
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

// Get user by id - calls Backend API
export const getUserById = async (id: string): Promise<AdminUser> => {
  const response = await api.get<AdminUser>(`/admin/users/${id}`);
  return response.data;
};

// Get user stats - calls Backend API
export const getUserStats = async (): Promise<UserStats> => {
  const response = await api.get<UserStats>('/admin/users/stats');
  return response.data;
};

// Get member tiers - calls Backend API
export const getMemberTiers = async (): Promise<MemberTier[]> => {
  const response = await api.get<MemberTier[]>('/admin/users/tiers');
  return response.data;
};

// Create user - calls Backend API
export const createUser = async (data: CreateUserDto): Promise<AdminUser> => {
  const response = await api.post<AdminUser>('/admin/users', data);
  return response.data;
};

// Update user - calls Backend API
export const updateUser = async (id: string, data: UpdateUserDto): Promise<AdminUser> => {
  const response = await api.put<AdminUser>(`/admin/users/${id}`, data);
  return response.data;
};

// Change password - calls Backend API
export const changeUserPassword = async (id: string, newPassword: string): Promise<void> => {
  await api.post(`/admin/users/${id}/change-password`, { newPassword });
};

// Toggle active status - calls Backend API
export const toggleUserActive = async (id: string): Promise<AdminUser> => {
  const response = await api.patch<AdminUser>(`/admin/users/${id}/toggle-active`);
  return response.data;
};

// Delete user - calls Backend API
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

export const usersApi = {
  getUsers,
  getUserById,
  getUserStats,
  getMemberTiers,
  createUser,
  updateUser,
  changeUserPassword,
  toggleUserActive,
  deleteUser,
};

export default usersApi;

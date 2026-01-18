import api from './api';

export interface CategoryDropdown {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;
  productCount: number;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  parentName: string | null;
  imageUrl: string | null;
  description: string | null;
  productCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCategoryDto {
  name: string;
  parentId?: number | null;
  imageUrl?: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name: string;
  parentId?: number | null;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: number;
}

// Get categories for dropdown - calls Backend API
export const getCategoriesDropdown = async (): Promise<CategoryDropdown[]> => {
  const response = await api.get<CategoryDropdown[]>('/admin/categories/dropdown');
  return response.data;
};

// Get all categories with pagination - calls Backend API
export const getCategories = async (
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<PagedResult<AdminCategory>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (search) params.append('search', search);
  
  const response = await api.get<PagedResult<AdminCategory>>(`/admin/categories?${params}`);
  return response.data;
};

// Get single category - calls Backend API
export const getCategoryById = async (id: number): Promise<AdminCategory> => {
  const response = await api.get<AdminCategory>(`/admin/categories/${id}`);
  return response.data;
};

// Create category - calls Backend API
export const createCategory = async (data: CreateCategoryDto): Promise<AdminCategory> => {
  const response = await api.post<AdminCategory>('/admin/categories', data);
  return response.data;
};

// Update category - calls Backend API
export const updateCategory = async (id: number, data: UpdateCategoryDto): Promise<AdminCategory> => {
  const response = await api.put<AdminCategory>(`/admin/categories/${id}`, data);
  return response.data;
};

// Delete category - calls Backend API
export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/admin/categories/${id}`);
};

// For backward compatibility with api.ts
export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },
  getCategory: getCategoryById,
};

export default categoriesApi;

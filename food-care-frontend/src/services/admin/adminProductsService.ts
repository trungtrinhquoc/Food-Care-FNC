// =============================================
// ADMIN PRODUCTS SERVICE - Clean Architecture
// =============================================

import api from '../api';
import type { Product } from '../../types';
import type { PagedResult } from '../../types/admin';
import type { CreateProductRequest, UpdateProductRequest } from '../../types';

export interface AdminProductDto {
  id: string;
  sku: string | null;
  name: string;
  slug: string | null;
  categoryId: number | null;
  categoryName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  description: string | null;
  basePrice: number;
  originalPrice: number | null;
  unit: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  images: string | null;
  ratingAverage?: number;
  ratingCount?: number;
  isSubscriptionAvailable: boolean;
  isActive: boolean;
  approvalStatus: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  categoryId?: number;
  supplierId?: number;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
}

function parseImages(images?: string | null): string[] {
  if (!images) return [];
  if (Array.isArray(images as unknown)) return images as unknown as string[];
  if (typeof images === 'string' && !images.startsWith('[')) {
    return images.split(',').map(s => s.trim()).filter(Boolean);
  }
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const mapAdminProductToUi = (p: AdminProductDto): Product => {
  const images = parseImages(p.images);

  return {
    id: p.id,
    sku: p.sku ?? '',
    name: p.name,
    slug: p.slug ?? '',
    categoryId: p.categoryId != null ? String(p.categoryId) : undefined,
    categoryName: p.categoryName ?? undefined,
    description: p.description ?? undefined,
    basePrice: p.basePrice,
    originalPrice: p.originalPrice ?? undefined,
    unit: p.unit ?? undefined,
    stockQuantity: p.stockQuantity,
    imageUrl: images[0] ?? undefined,
    images,
    ratingAverage: p.ratingAverage ?? 0,
    ratingCount: p.ratingCount ?? 0,
    isSubscriptionAvailable: p.isSubscriptionAvailable,
    isActive: p.isActive,
    // NOTE: supplier fields are not part of Product type; we attach them at runtime when needed.
  };
};

export const getAdminProducts = async (
  filter: AdminProductFilter = {}
): Promise<{ items: (Product & { supplierId?: number | null; supplierName?: string | null; approvalStatus?: string | null; submittedAt?: string | null })[]; totalItems: number; page: number; pageSize: number; totalPages: number; }> => {
  const response = await api.get<PagedResult<AdminProductDto>>('/admin/products', {
    params: filter,
  });

  const items = response.data.items.map((p) => {
    const mapped = mapAdminProductToUi(p);
    return Object.assign(mapped, {
      supplierId: p.supplierId,
      supplierName: p.supplierName,
      approvalStatus: p.approvalStatus,
      submittedAt: p.submittedAt,
    });
  });

  return {
    items,
    totalItems: response.data.totalItems,
    page: response.data.page,
    pageSize: response.data.pageSize,
    totalPages: response.data.totalPages,
  };
};

export const adminProductsService = {
  getAdminProducts,
  createProduct: async (data: CreateProductRequest): Promise<AdminProductDto> => {
    const payload = {
      ...data,
      images: data.images && data.images.length > 0 ? JSON.stringify(data.images) : null,
    };
    const response = await api.post<AdminProductDto>('/admin/products', payload);
    return response.data;
  },
  updateProduct: async (productId: string, data: UpdateProductRequest): Promise<AdminProductDto> => {
    const payload = {
      ...data,
      images: data.images && data.images.length > 0 ? JSON.stringify(data.images) : null,
    };
    const response = await api.put<AdminProductDto>(`/admin/products/${productId}`, payload);
    return response.data;
  },
  deleteProduct: async (productId: string): Promise<void> => {
    await api.delete(`/admin/products/${productId}`);
  },
};

export default adminProductsService;

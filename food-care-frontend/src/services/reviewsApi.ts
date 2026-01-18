import api from './api';

export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string | null;
  rating: number;
  comment: string | null;
  images: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  replyComment: string | null;
  replyAt: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminReviewFilter {
  page?: number;
  pageSize?: number;
  productId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  isHidden?: boolean;
  hasReply?: boolean;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  hiddenCount: number;
  repliedCount: number;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Get reviews with filters and pagination
export const getReviews = async (filter: AdminReviewFilter = {}): Promise<PagedResult<AdminReview>> => {
  const params = new URLSearchParams();
  
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
  if (filter.productId) params.append('productId', filter.productId);
  if (filter.userId) params.append('userId', filter.userId);
  if (filter.minRating) params.append('minRating', filter.minRating.toString());
  if (filter.maxRating) params.append('maxRating', filter.maxRating.toString());
  if (filter.isHidden !== undefined) params.append('isHidden', filter.isHidden.toString());
  if (filter.hasReply !== undefined) params.append('hasReply', filter.hasReply.toString());
  if (filter.sortBy) params.append('sortBy', filter.sortBy);
  if (filter.sortDesc !== undefined) params.append('sortDesc', filter.sortDesc.toString());
  
  const response = await api.get<PagedResult<AdminReview>>(`/admin/reviews?${params}`);
  return response.data;
};

// Get review by id
export const getReviewById = async (id: string): Promise<AdminReview> => {
  const response = await api.get<AdminReview>(`/admin/reviews/${id}`);
  return response.data;
};

// Get review stats
export const getReviewStats = async (): Promise<ReviewStats> => {
  const response = await api.get<ReviewStats>('/admin/reviews/stats');
  return response.data;
};

// Reply to review
export const replyToReview = async (id: string, replyComment: string): Promise<AdminReview> => {
  const response = await api.post<AdminReview>(`/admin/reviews/${id}/reply`, { replyComment });
  return response.data;
};

// Toggle hide review
export const toggleHideReview = async (id: string): Promise<AdminReview> => {
  const response = await api.patch<AdminReview>(`/admin/reviews/${id}/toggle-hide`);
  return response.data;
};

// Delete review
export const deleteReview = async (id: string): Promise<void> => {
  await api.delete(`/admin/reviews/${id}`);
};

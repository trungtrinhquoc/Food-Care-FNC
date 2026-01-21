// =============================================
// REVIEWS SERVICE - Clean Architecture
// =============================================

import api from '../api';
import type {
  PagedResult,
  AdminReview,
  AdminReviewFilter,
  ReviewStats,
} from '../../types/admin';

// ==================== API FUNCTIONS ====================

/**
 * Get reviews with filtering and pagination
 */
export const getReviews = async (
  filter: AdminReviewFilter = {}
): Promise<PagedResult<AdminReview>> => {
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

/**
 * Get review statistics
 */
export const getReviewStats = async (): Promise<ReviewStats> => {
  const response = await api.get<ReviewStats>('/admin/reviews/stats');
  return response.data;
};

/**
 * Toggle review visibility (hide/show)
 */
export const toggleHideReview = async (id: string): Promise<void> => {
  await api.patch(`/admin/reviews/${id}/toggle-hide`);
};

/**
 * Delete review
 */
export const deleteReview = async (id: string): Promise<void> => {
  await api.delete(`/admin/reviews/${id}`);
};

/**
 * Reply to a review
 */
export const replyToReview = async (
  id: string,
  replyContent: string
): Promise<void> => {
  await api.post(`/admin/reviews/${id}/reply`, { content: replyContent });
};

/**
 * Delete reply from a review
 */
export const deleteReviewReply = async (id: string): Promise<void> => {
  await api.delete(`/admin/reviews/${id}/reply`);
};

// Export all functions as an object for convenience
export const reviewsService = {
  getReviews,
  getReviewStats,
  toggleHideReview,
  deleteReview,
  replyToReview,
  deleteReviewReply,
};

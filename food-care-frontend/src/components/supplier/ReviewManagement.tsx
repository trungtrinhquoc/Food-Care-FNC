import { useState } from 'react';
import { Star, MessageSquare, Send, Check, X, Filter, Search } from 'lucide-react';
import { useReviews, useRespondToReview, useReviewStats } from '../../hooks/useSupplierData';
import { Review } from '../../data/supplierExtendedMockData';

export function ReviewManagement() {
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const { data: reviews, isLoading } = useReviews({ rating: ratingFilter === 'all' ? undefined : ratingFilter });
  const { data: stats } = useReviewStats();
  const respondMutation = useRespondToReview();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredReviews = reviews?.filter((review: Review) => {
    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchesSearch = review.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRating && matchesStatus && matchesSearch;
  }) || [];

  const handleRespond = (reviewId: string) => {
    if (!responseText.trim()) return;
    respondMutation.mutate({ reviewId, response: responseText });
    setRespondingTo(null);
    setResponseText('');
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Đánh giá TB</span>
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats?.averageRating.toFixed(1)}</p>
          <p className="text-xs text-gray-600 mt-1">Trên {stats?.totalReviews} đánh giá</p>
        </div>

        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats?.ratingDistribution.find((r: any) => r.rating === rating)?.count || 0;
          const percentage = stats ? (count / stats.totalReviews) * 100 : 0;
          return (
            <div key={rating} className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{rating} sao</span>
              </div>
              <p className="text-2xl font-bold mb-1">{count}</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-yellow-400 h-1.5 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm đánh giá..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả đánh giá</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chưa phản hồi</option>
            <option value="responded">Đã phản hồi</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review: Review) => (
          <div key={review.id} className="bg-white rounded-lg border p-6">
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {review.customerName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{review.customerName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      review.status === 'responded' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {review.status === 'responded' ? 'Đã phản hồi' : 'Chưa phản hồi'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{review.productName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(review.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              {renderStars(review.rating, 'md')}
            </div>

            {/* Review Content */}
            <div className="mb-4">
              <p className="text-gray-700">{review.comment}</p>
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Review"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Supplier Response */}
            {review.response ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Phản hồi của bạn</p>
                  <span className="text-xs text-blue-600">
                    {new Date(review.response.respondedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-blue-900">{review.response.text}</p>
              </div>
            ) : (
              <div>
                {respondingTo === review.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Nhập phản hồi của bạn..."
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(review.id)}
                        disabled={!responseText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        Gửi phản hồi
                      </button>
                      <button
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText('');
                        }}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRespondingTo(review.id)}
                    className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Phản hồi đánh giá
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Không có đánh giá nào</p>
          </div>
        )}
      </div>
    </div>
  );
}

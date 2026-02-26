import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { SectionHeader, SectionSkeleton, EmptyState } from './SupplierLayout';
import {
    Star,
    MessageSquare,
    ThumbsUp,
    Clock,
    Send,
} from 'lucide-react';
import { reviewsApi } from '@/services/supplier/supplierApi';
import type { SupplierReview, ReviewStats } from '@/services/supplier/supplierApi';

interface ReviewsSectionProps {
    loading?: boolean;
}

export function ReviewsSection({ loading = false }: ReviewsSectionProps) {
    const [filter, setFilter] = useState<'all' | 'unreplied'>('all');
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<SupplierReview | null>(null);
    const [replyText, setReplyText] = useState('');
    const [reviews, setReviews] = useState<SupplierReview[]>([]);
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [reviewsData, statsData] = await Promise.all([
                    reviewsApi.getReviews(),
                    reviewsApi.getStats()
                ]);
                setReviews(reviewsData);
                setReviewStats(statsData);
            } catch (err) {
                console.error('Failed to fetch reviews:', err);
                setError('Không thể tải dữ liệu đánh giá');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const handleOpenReply = (review: SupplierReview) => {
        setSelectedReview(review);
        setReplyText('');
        setReplyDialogOpen(true);
    };

    const handleSendReply = async () => {
        if (!selectedReview || !replyText.trim()) return;
        
        setIsSubmitting(true);
        try {
            await reviewsApi.respondToReview(selectedReview.id, replyText.trim());
            
            // Update local state
            setReviews(prev => prev.map(r => 
                r.id === selectedReview.id 
                    ? { ...r, replyComment: replyText.trim(), replyAt: new Date().toISOString() }
                    : r
            ));
            
            // Update stats
            if (reviewStats) {
                setReviewStats({
                    ...reviewStats,
                    pendingReplies: reviewStats.pendingReplies - 1,
                    responseRate: ((reviewStats.totalReviews - reviewStats.pendingReplies + 1) / reviewStats.totalReviews) * 100
                });
            }
            
            setReplyDialogOpen(false);
            setSelectedReview(null);
            setReplyText('');
        } catch (err) {
            console.error('Failed to send reply:', err);
            alert('Không thể gửi phản hồi. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || isLoading) {
        return <SectionSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                    Thử lại
                </Button>
            </div>
        );
    }

    const filteredReviews = filter === 'unreplied'
        ? reviews.filter(r => !r.replyComment)
        : reviews;

    const unrepliedCount = reviews.filter(r => !r.replyComment).length;

    // Convert rating distribution to array format for display
    const ratingDistribution = reviewStats ? [5, 4, 3, 2, 1].map(stars => ({
        stars,
        count: reviewStats.ratingDistribution[stars] || 0,
        percentage: reviewStats.totalReviews > 0 
            ? Math.round((reviewStats.ratingDistribution[stars] || 0) / reviewStats.totalReviews * 100)
            : 0
    })) : [];

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Đánh giá từ khách hàng"
                description="Quản lý và phản hồi đánh giá sản phẩm"
            />

            {/* Rating Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Rating */}
                <Card className="lg:col-span-1">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-gray-900 mb-2">
                                {reviewStats?.averageRating.toFixed(1) || '0.0'}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-2">
                                {renderStars(Math.round(reviewStats?.averageRating || 0))}
                            </div>
                            <p className="text-gray-500">{reviewStats?.totalReviews || 0} đánh giá</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Tỉ lệ phản hồi: {reviewStats?.responseRate.toFixed(0) || 0}%
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Rating Distribution */}
                <Card className="lg:col-span-2">
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {ratingDistribution.map((item) => (
                                <div key={item.stars} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-20">
                                        <span className="text-sm font-medium">{item.stars}</span>
                                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-500 w-16 text-right">
                                        {item.count} ({item.percentage}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    Tất cả ({reviews.length})
                </Button>
                <Button
                    variant={filter === 'unreplied' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unreplied')}
                    className={filter !== 'unreplied' && unrepliedCount > 0
                        ? 'border-amber-300 text-amber-700'
                        : ''
                    }
                >
                    Chưa phản hồi ({unrepliedCount})
                </Button>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                    <EmptyState
                        icon={Star}
                        title="Không có đánh giá"
                        description={filter === 'unreplied' 
                            ? "Bạn đã phản hồi tất cả đánh giá" 
                            : "Chưa có đánh giá nào từ khách hàng"
                        }
                    />
                ) : (
                    filteredReviews.map((review) => (
                        <Card key={review.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {review.customerName.charAt(0)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                                                <p className="text-sm text-gray-500">{review.productName}</p>
                                            </div>
                                            <div className="text-right">
                                                {renderStars(review.rating)}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    <Clock className="h-3 w-3 inline mr-1" />
                                                    {formatDate(review.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-3 text-gray-700">{review.comment}</p>

                                        {review.isVerifiedPurchase && (
                                            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                                                Đã mua hàng
                                            </Badge>
                                        )}

                                        <div className="flex items-center gap-4 mt-3">
                                            {review.replyComment ? (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                                    Đã phản hồi
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                                    Chờ phản hồi
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Reply Section */}
                                        {review.replyComment ? (
                                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-900">Phản hồi của bạn</span>
                                                    {review.replyAt && (
                                                        <span className="text-xs text-blue-600">
                                                            {formatDate(review.replyAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-blue-800">{review.replyComment}</p>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4 gap-2"
                                                onClick={() => handleOpenReply(review)}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                Phản hồi
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Reply Dialog */}
            <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Phản hồi đánh giá</DialogTitle>
                        <DialogDescription>
                            Phản hồi cho đánh giá của {selectedReview?.customerName}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReview && (
                        <div className="space-y-4">
                            {/* Original Review */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    {renderStars(selectedReview.rating)}
                                    <span className="text-sm text-gray-500">
                                        {selectedReview.productName}
                                    </span>
                                </div>
                                <p className="text-gray-700">{selectedReview.comment}</p>
                            </div>

                            {/* Reply Input */}
                            <div>
                                <Textarea
                                    placeholder="Nhập phản hồi của bạn..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSendReply}
                            disabled={!replyText.trim() || isSubmitting}
                            className="gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { SimplePagination } from "../../components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Eye, EyeOff, MessageSquare, Trash2, Star, BarChart3 } from "lucide-react";
import { reviewsService } from "../../services/admin";
import type { AdminReview, ReviewStats, PagedResult } from "../../types/admin";
import { ReviewReplyDialog } from "../../components/admin/ReviewReplyDialog";

export function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [hiddenFilter, setHiddenFilter] = useState<string>("");
  const [replyFilter, setReplyFilter] = useState<string>("");

  // Reply dialog
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const result: PagedResult<AdminReview> = await reviewsService.getReviews({
        page: currentPage,
        pageSize,
        minRating: ratingFilter ? parseInt(ratingFilter) : undefined,
        maxRating: ratingFilter ? parseInt(ratingFilter) : undefined,
        isHidden: hiddenFilter === 'true' ? true : hiddenFilter === 'false' ? false : undefined,
        hasReply: replyFilter === 'true' ? true : replyFilter === 'false' ? false : undefined,
        sortBy: 'createdAt',
        sortDesc: true,
      });
      setReviews(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, ratingFilter, hiddenFilter, replyFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await reviewsService.getReviewStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [loadReviews, loadStats]);

  const handleToggleHide = async (review: AdminReview) => {
    try {
      await reviewsService.toggleHideReview(review.id);
      loadReviews();
    } catch (error) {
      console.error('Failed to toggle hide:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    
    try {
      await reviewsService.deleteReview(id);
      loadReviews();
      loadStats();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleReply = (review: AdminReview) => {
    setSelectedReview(review);
    setReplyDialogOpen(true);
  };

  const handleReplySuccess = () => {
    setReplyDialogOpen(false);
    setSelectedReview(null);
    loadReviews();
    loadStats();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalReviews}</div>
                    <div className="text-sm text-gray-500">Tổng đánh giá</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Điểm trung bình</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.repliedCount}</div>
                    <div className="text-sm text-gray-500">Đã trả lời</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <EyeOff className="w-8 h-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.hiddenCount}</div>
                    <div className="text-sm text-gray-500">Đang ẩn</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rating Distribution */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phân bố đánh giá</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution?.[rating.toString()] || 0;
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span>{rating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm text-gray-500">
                        {count} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách đánh giá</CardTitle>
                <CardDescription>Tổng {totalItems} đánh giá</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lọc theo sao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả sao</SelectItem>
                  <SelectItem value="5">5 sao</SelectItem>
                  <SelectItem value="4">4 sao</SelectItem>
                  <SelectItem value="3">3 sao</SelectItem>
                  <SelectItem value="2">2 sao</SelectItem>
                  <SelectItem value="1">1 sao</SelectItem>
                </SelectContent>
              </Select>

              <Select value={hiddenFilter} onValueChange={(v) => { setHiddenFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="false">Đang hiển thị</SelectItem>
                  <SelectItem value="true">Đang ẩn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={replyFilter} onValueChange={(v) => { setReplyFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Phản hồi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="true">Đã trả lời</SelectItem>
                  <SelectItem value="false">Chưa trả lời</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có đánh giá nào</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id} className={review.isHidden ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {review.productImageUrl && (
                            <img
                              src={review.productImageUrl}
                              alt={review.productName}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div className="max-w-[150px]">
                            <div className="font-medium truncate">{review.productName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{review.userName}</div>
                          <div className="text-xs text-gray-500">{review.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {renderStars(review.rating)}
                          {review.isVerifiedPurchase && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Đã mua
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="text-sm truncate">{review.comment || '(Không có nội dung)'}</p>
                          {review.replyComment && (
                            <div className="mt-1 p-2 bg-blue-50 rounded text-xs">
                              <span className="font-medium text-blue-600">Phản hồi: </span>
                              <span className="truncate">{review.replyComment}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={review.isHidden ? "destructive" : "default"}>
                            {review.isHidden ? 'Đang ẩn' : 'Hiển thị'}
                          </Badge>
                          {review.helpfulCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              👍 {review.helpfulCount}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReply(review)}
                            title={review.replyComment ? "Sửa phản hồi" : "Trả lời"}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleHide(review)}
                            title={review.isHidden ? "Hiển thị" : "Ẩn"}
                          >
                            {review.isHidden ? (
                              <Eye className="w-4 h-4 text-green-500" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-yellow-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="đánh giá"
            />
          </CardContent>
        </Card>
      </div>

      <ReviewReplyDialog
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        review={selectedReview}
        onSuccess={handleReplySuccess}
      />
    </>
  );
}

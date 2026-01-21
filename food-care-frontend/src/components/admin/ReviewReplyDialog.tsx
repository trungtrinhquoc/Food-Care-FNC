import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from './Button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Star } from 'lucide-react';
import { reviewsService } from '../../services/admin';
import type { AdminReview } from '../../types/admin';

interface ReviewReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReview | null;
  onSuccess: () => void;
}

export function ReviewReplyDialog({
  open,
  onOpenChange,
  review,
  onSuccess,
}: ReviewReplyDialogProps) {
  const [replyComment, setReplyComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && review) {
      setReplyComment(review.replyComment || '');
    }
  }, [open, review]);

  const handleSubmit = async () => {
    if (!review || !replyComment.trim()) {
      alert('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setSaving(true);
    try {
      await reviewsService.replyToReview(review.id, replyComment);
      onSuccess();
    } catch (error) {
      console.error('Failed to reply:', error);
      alert('Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
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

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {review.replyComment ? 'Sửa phản hồi đánh giá' : 'Trả lời đánh giá'}
          </DialogTitle>
          <DialogDescription>
            Phản hồi sẽ được hiển thị dưới đánh giá của khách hàng
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Review Info */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              {review.productImageUrl && (
                <img
                  src={review.productImageUrl}
                  alt={review.productName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <div className="font-medium">{review.productName}</div>
                <div className="text-sm text-gray-500">
                  Bởi {review.userName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              {review.isVerifiedPurchase && (
                <Badge variant="outline" className="text-xs">
                  Đã mua hàng
                </Badge>
              )}
            </div>

            {review.comment && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                "{review.comment}"
              </p>
            )}

            <div className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Reply Form */}
          <div>
            <Label>Nội dung phản hồi *</Label>
            <Textarea
              value={replyComment}
              onChange={(e) => setReplyComment(e.target.value)}
              placeholder="Cảm ơn bạn đã đánh giá sản phẩm..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={saving || !replyComment.trim()}
          >
            {saving ? 'Đang gửi...' : (review.replyComment ? 'Cập nhật' : 'Gửi phản hồi')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

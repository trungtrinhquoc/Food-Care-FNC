import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { CreateReviewForm } from './CreateReviewForm';
import { reviewApi } from '../services/reviewApi';
import { toast } from 'sonner';

interface ProductReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productName: string;
    productId: string;
    orderId: string; // Optional: backend might verify purchased
    onSuccess?: () => void;
}

export function ProductReviewDialog({
    open,
    onOpenChange,
    productName,
    productId,
    // orderId, // Keep for future if needed
    orderId,
    onSuccess
}: ProductReviewDialogProps) {

    const handleSubmit = async (payload: {
        productId: string;
        rating: number;
        comment: string;
        images: string[];
    }) => {
        try {
            await reviewApi.createReview({ ...payload, orderId });
            toast.success('Gửi đánh giá thành công!');
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            console.error('Failed to submit review:', error);
            // Check if error is "already reviewed"
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already reviewed')) {
                toast.error('Bạn đã đánh giá sản phẩm này rồi.');
            } else {
                toast.error('Lỗi khi gửi đánh giá. Vui lòng thử lại.');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Đánh giá sản phẩm</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Bạn đang viết đánh giá cho: <span className="font-semibold text-gray-900">{productName}</span>
                    </p>
                </DialogHeader>

                <div className="py-2">
                    <CreateReviewForm
                        productId={productId}
                        onSubmit={handleSubmit}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

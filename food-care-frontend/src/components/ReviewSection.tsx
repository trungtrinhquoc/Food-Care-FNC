// src/components/ReviewSection.tsx
import { Star } from "lucide-react";
import { Progress } from "./ui/progress";
import { CreateReviewForm } from "./CreateReviewForm";
import { useReviews } from "../hooks/useReviews";
import { ReviewItem } from "./ReviewItem";

interface ReviewSectionProps {
    productId: string;
    isLoggedIn: boolean;
}

export function ReviewSection({ productId, isLoggedIn }: ReviewSectionProps) {
    const {
        reviews,
        averageRating,
        totalReviews,
        ratingDistribution,
        eligibility,
        loading,
        createReview,
        markHelpful,
        loadMore,
        hasMore,
    } = useReviews(productId, isLoggedIn);

    if (loading) {
        return <div className="p-8 text-gray-400">Đang tải đánh giá...</div>;
    }

    return (
        <div className="bg-white rounded-lg p-8 mt-8">
            <h2 className="mb-6 text-xl font-semibold">Đánh Giá Sản Phẩm</h2>

            {/* OVERALL */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                    <div className="text-5xl font-bold mb-2">
                        {averageRating.toFixed(1)}
                    </div>

                    <div className="flex justify-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-5 h-5 ${i < Math.round(averageRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                            />
                        ))}
                    </div>

                    <p className="text-gray-500">{totalReviews} đánh giá</p>
                </div>

                {/* DISTRIBUTION */}
                <div className="md:col-span-2 space-y-2">
                    {ratingDistribution.map(d => (
                        <div
                            key={d.stars}
                            className="flex items-center gap-3"
                        >
                            <div className="w-16 flex items-center gap-1">
                                <span>{d.stars}</span>
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            </div>

                            <Progress value={d.percentage} className="flex-1" />

                            <span className="w-10 text-right text-sm text-gray-500">
                                {d.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CREATE REVIEW */}
            {!isLoggedIn && (
                <p className="text-sm text-gray-400 mb-4">
                    Vui lòng đăng nhập để viết đánh giá
                </p>
            )}

            {isLoggedIn && eligibility?.canReview && (
                <CreateReviewForm
                    productId={productId}
                    onSubmit={createReview}
                />
            )}

            {isLoggedIn &&
                eligibility &&
                !eligibility.canReview &&
                eligibility.reason && (
                    <p className="text-sm text-gray-400 mb-4">
                        {eligibility.reason}
                    </p>
                )}

            {/* REVIEW LIST */}
            <div className="space-y-6">
                {reviews.map(review => (
                    <ReviewItem
                        key={review.id} // ✅ key đúng
                        review={review}
                        onHelpful={markHelpful}
                    />

                ))}
            </div>

            {hasMore && (
                <div className="mt-8 text-center">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {loading ? "Đang tải..." : "Xem thêm đánh giá"}
                    </button>
                </div>
            )}
        </div>
    );
}

// src/hooks/useReviews.ts
import { useEffect, useState, useCallback } from "react";
import { reviewApi } from "../services/reviewApi";
import type { Review, ReviewEligibility, RatingDistributionItem } from "../types";

export function useReviews(productId: string, isLoggedIn: boolean) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [ratingDistribution, setRatingDistribution] =
        useState<RatingDistributionItem[]>([]);
    const [eligibility, setEligibility] =
        useState<ReviewEligibility | null>(null);

    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const PAGE_SIZE = 5;

    // ===== LOAD REVIEWS =====
    const loadReviews = useCallback(async (isLoadMore = false) => {
        if (!productId) return;

        setLoading(true);
        try {
            // Nếu load more thì dùng page hiện tại (đã được tăng trước đó hoặc truyền vào)
            // Tuy nhiên, logic chuẩn là: state page là page ĐANG hiển thị hoặc SẮP hiển thị.
            // Ở đây ta dùng page state.
            // Nếu không phải loadMore (tức là refresh hoặc init), reset page về 1.
            const currentPage = isLoadMore ? page : 1;

            const res = await reviewApi.getReviews(productId, currentPage, PAGE_SIZE);

            if (isLoadMore) {
                setReviews(prev => [...prev, ...(res.reviews ?? [])]);
            } else {
                setReviews(res.reviews ?? []);
                setPage(1); // Reset page to 1 if reloading
            }

            setAverageRating(res.averageRating ?? 0);
            setTotalReviews(res.totalReviews ?? 0);
            setRatingDistribution(res.ratingDistribution ?? []);

            // Check if we have more
            // Logic: Nếu số lượng review hiện tại + số mới lấy < total -> còn next
            // Hoặc đơn giản: (currentPage * PAGE_SIZE) < totalReviews
            const currentCount = isLoadMore ? reviews.length + res.reviews.length : res.reviews.length;
            setHasMore(currentCount < res.totalReviews);

            if (isLoggedIn && !isLoadMore) {
                try {
                    const eli = await reviewApi.getEligibility(productId);
                    setEligibility(eli);
                } catch {
                    setEligibility(null);
                }
            } else if (!isLoggedIn) {
                setEligibility(null);
            }
        } finally {
            setLoading(false);
        }
    }, [productId, isLoggedIn, page, reviews.length]);

    useEffect(() => {
        // Initial load only
        loadReviews(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, isLoggedIn]); // Bỏ loadReviews ra khỏi deps để tránh loop, hoặc xử lý kỹ hơn

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            setPage(p => p + 1);
        }
    }, [loading, hasMore]);

    // Khi page thay đổi và > 1, trigger loadReviews(true)
    useEffect(() => {
        if (page > 1) {
            loadReviews(true);
        }
    }, [page]);

    // ===== CREATE REVIEW (SAFE, KHÔNG DÙNG res.data) =====
    const createReview = async (payload: {
        productId: string;
        rating: number;
        comment: string;
        images?: string[];
    }) => {
        await reviewApi.createReview(payload);
        loadReviews(false); // Reload from scratch
    };

    // ===== LIKE REVIEW (OPTIMISTIC) =====
    const markHelpful = async (reviewId: string) => {
        setReviews(prev =>
            prev.map(r =>
                r.id === reviewId
                    ? {
                        ...r,
                        helpfulCount: r.helpfulCount + 1,
                        isHelpfulByCurrentUser: true,
                    }
                    : r
            )
        );

        try {
            await reviewApi.markHelpful(reviewId);
        } catch {
            // rollback nếu cần
            loadReviews();
        }
    };

    return {
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
    };
}

import { memo } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils"; // Giả sử bạn có utility này, nếu không có thể dùng template string thường
import type { Review } from "../types";

interface Props {
    review: Review;
    onHelpful: (id: string) => void;
}

export const ReviewItem = memo(({ review, onHelpful }: Props) => {
    // Helper function để render stars
    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i < rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-100 text-gray-200"
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <Card className="group border-none shadow-sm bg-white hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex gap-4 items-start">
                    {/* AVATAR SECTION */}
                    <Avatar className="h-12 w-12 shrink-0 border-2 border-white shadow-sm">
                        <AvatarImage src={review.userAvatar ?? undefined} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-semibold">
                            {(review.userName?.[0] ?? "?").toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {/* CONTENT SECTION */}
                    <div className="flex-1 min-w-0">
                        {/* HEADER: Name & Date */}
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h4 className="font-semibold text-gray-900 text-base leading-tight">
                                    {review.userName || "Người dùng ẩn danh"}
                                </h4>
                                {/* Rating moved here for better context */}
                                <div className="mt-1.5 flex items-center gap-2">
                                    {renderStars(review.rating)}
                                </div>
                            </div>

                            <time className="text-xs font-medium text-gray-400 whitespace-nowrap pt-1">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </time>
                        </div>

                        {/* COMMENT BODY */}
                        <div className="mt-3 mb-4">
                            <p className="text-gray-600 text-[15px] leading-7 tracking-wide">
                                {review.comment}
                            </p>
                        </div>

                        {/* REVIEW IMAGES */}
                        {review.images && review.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {review.images.map((img, idx) => (
                                    <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                                        <img
                                            src={img}
                                            alt={`Valid review image ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onClick={() => window.open(img, '_blank')}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* FOOTER ACTION */}
                        <div className="flex items-center pt-2 border-t border-gray-50">
                            <button
                                disabled={review.isHelpfulByCurrentUser}
                                onClick={() => onHelpful(review.id)}
                                className={`
                                    group/btn flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                                    ${review.isHelpfulByCurrentUser
                                        ? "bg-emerald-50 text-emerald-600 cursor-default"
                                        : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    }
                                `}
                            >
                                <ThumbsUp
                                    className={`w-4 h-4 transition-transform ${!review.isHelpfulByCurrentUser && "group-hover/btn:-rotate-12"
                                        } ${review.isHelpfulByCurrentUser ? "fill-current" : ""}`}
                                />
                                <span>
                                    {review.isHelpfulByCurrentUser ? "Đã thấy hữu ích" : "Hữu ích"}
                                    {review.helpfulCount > 0 && (
                                        <span className="ml-1 opacity-80">({review.helpfulCount})</span>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Reviews;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Exceptions;
using System.Text.Json;

namespace FoodCare.API.Services.Implementations
{
    public class ReviewService : IReviewService
    {

        private readonly FoodCareDbContext _db;

        public ReviewService(FoodCareDbContext db)
        {
            _db = db;
        }

        // ================= GET REVIEWS =================
        public async Task<ReviewSummaryDto> GetReviewsAsync(Guid productId, int pageIndex = 1, int pageSize = 10)
        {
            var query = _db.Reviews
                .Include(r => r.User)
                .Where(r =>
                    r.ProductId == productId &&
                    (r.IsHidden == false || r.IsHidden == null)
                );

            var total = await query.CountAsync();
            var avg = total == 0 ? 0 : Math.Round(await query.AverageAsync(r => r.Rating ?? 0), 1);

            var reviews = await query
                .Include(r => r.ReviewHelpfuls)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var distribution = Enumerable.Range(1, 5)
                .Select(star =>
                {
                    var count = reviews.Count(r => r.Rating == star);
                    return new RatingDistributionDto
                    {
                        Stars = star,
                        Count = count,
                        Percentage = total == 0 ? 0 : Math.Round((double)count / total * 100, 1)
                    };
                })
                .OrderByDescending(x => x.Stars)
                .ToList();

            return new ReviewSummaryDto
            {
                AverageRating = avg,
                TotalReviews = total,
                RatingDistribution = distribution,
                Reviews = reviews.Select(r => new ReviewItemDto
                {
                    Id = r.Id,
                    UserName = r.User?.FullName ?? "Ẩn danh",
                    UserAvatar = r.User?.AvatarUrl,
                    Rating = r.Rating ?? 0,
                    Comment = r.Comment ?? "",
                    Images = string.IsNullOrEmpty(r.Images)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(r.Images, (JsonSerializerOptions?)null) ?? new List<string>(),
                    CreatedAt = r.CreatedAt ?? DateTime.UtcNow,
                    HelpfulCount = r.ReviewHelpfuls.Count,
                    IsVerifiedPurchase = r.IsVerifiedPurchase ?? false
                }).ToList()
            };
        }

        public async Task<ReviewEligibilityDto> CheckEligibilityAsync(Guid productId, Guid userId)
        {
            var reviewed = await _db.Reviews
                .AnyAsync(r => r.ProductId == productId && r.UserId == userId);

            if (reviewed)
                return new(false, "Bạn đã đánh giá sản phẩm này rồi");

            var purchased = await _db.OrderItems
                .Include(oi => oi.Order)
                .AnyAsync(oi =>
                    oi.ProductId == productId &&
                    oi.Order!.UserId == userId &&
                    oi.Order.Status == OrderStatus.delivered
                );

            if (!purchased)
                return new(false, "Bạn cần mua và nhận hàng trước khi đánh giá");

            return new(true, null);
        }
        public async Task CreateReviewAsync(CreateReviewDto dto, Guid userId)
        {
            if (dto.Rating < 1 || dto.Rating > 5)
                throw new AppException("Rating phải từ 1 đến 5");

            var orderItem = await _db.OrderItems
                .Include(oi => oi.Order)
                .FirstOrDefaultAsync(oi =>
                    oi.ProductId == dto.ProductId &&
                    oi.Order!.UserId == userId &&
                    oi.Order.Status == OrderStatus.delivered
                );

            if (orderItem == null)
                throw new AppException("Bạn chỉ có thể đánh giá sản phẩm đã mua");

            var review = new Review
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ProductId = dto.ProductId,
                OrderId = orderItem.OrderId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                Images = dto.Images != null ? JsonSerializer.Serialize(dto.Images, (JsonSerializerOptions?)null) : null,
                IsVerifiedPurchase = true,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.Reviews.Add(review);
            await _db.SaveChangesAsync();
        }
        public async Task MarkHelpfulAsync(Guid reviewId, Guid userId)
        {
            var exists = await _db.ReviewHelpfuls
                .AnyAsync(x => x.ReviewId == reviewId && x.UserId == userId);

            if (exists)
                throw new AppException("Bạn đã đánh dấu hữu ích rồi");

            _db.ReviewHelpfuls.Add(new ReviewHelpful
            {
                ReviewId = reviewId,
                UserId = userId
            });

            await _db.SaveChangesAsync();
        }
    }
}

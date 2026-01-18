using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Reviews;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminReviewService : IAdminReviewService
{
    private readonly FoodCareDbContext _context;

    public AdminReviewService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminReviewDto>> GetReviewsAsync(AdminReviewFilterDto filter)
    {
        var query = _context.Reviews
            .Include(r => r.Product)
            .Include(r => r.User)
            .Include(r => r.ReviewHelpfuls)
            .AsQueryable();

        // Apply filters
        if (filter.ProductId.HasValue)
        {
            query = query.Where(r => r.ProductId == filter.ProductId.Value);
        }

        if (filter.UserId.HasValue)
        {
            query = query.Where(r => r.UserId == filter.UserId.Value);
        }

        if (filter.MinRating.HasValue)
        {
            query = query.Where(r => r.Rating >= filter.MinRating.Value);
        }

        if (filter.MaxRating.HasValue)
        {
            query = query.Where(r => r.Rating <= filter.MaxRating.Value);
        }

        if (filter.IsVerifiedPurchase.HasValue)
        {
            query = query.Where(r => r.IsVerifiedPurchase == filter.IsVerifiedPurchase.Value);
        }

        if (filter.IsHidden.HasValue)
        {
            query = query.Where(r => r.IsHidden == filter.IsHidden.Value);
        }

        if (filter.HasReply.HasValue)
        {
            if (filter.HasReply.Value)
            {
                query = query.Where(r => r.ReplyComment != null);
            }
            else
            {
                query = query.Where(r => r.ReplyComment == null);
            }
        }

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "rating" => filter.SortDescending ? query.OrderByDescending(r => r.Rating) : query.OrderBy(r => r.Rating),
            "helpful" => filter.SortDescending ? query.OrderByDescending(r => r.ReviewHelpfuls.Count) : query.OrderBy(r => r.ReviewHelpfuls.Count),
            _ => filter.SortDescending ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt)
        };

        var totalItems = await query.CountAsync();

        var reviews = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(r => new AdminReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductName = r.Product != null ? r.Product.Name : null,
                ProductImage = r.Product != null ? r.Product.Images : null,
                UserId = r.UserId,
                UserName = r.User != null ? r.User.FullName : null,
                UserEmail = r.User != null ? r.User.Email : null,
                OrderId = r.OrderId,
                Rating = r.Rating ?? 0,
                Comment = r.Comment,
                Images = r.Images,
                IsVerifiedPurchase = r.IsVerifiedPurchase ?? false,
                ReplyComment = r.ReplyComment,
                ReplyAt = r.ReplyAt,
                IsHidden = r.IsHidden ?? false,
                HelpfulCount = r.ReviewHelpfuls.Count,
                CreatedAt = r.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new PagedResult<AdminReviewDto>
        {
            Items = reviews,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)filter.PageSize)
        };
    }

    public async Task<AdminReviewDto?> GetReviewByIdAsync(Guid id)
    {
        var review = await _context.Reviews
            .Include(r => r.Product)
            .Include(r => r.User)
            .Include(r => r.ReviewHelpfuls)
            .Where(r => r.Id == id)
            .Select(r => new AdminReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductName = r.Product != null ? r.Product.Name : null,
                ProductImage = r.Product != null ? r.Product.Images : null,
                UserId = r.UserId,
                UserName = r.User != null ? r.User.FullName : null,
                UserEmail = r.User != null ? r.User.Email : null,
                OrderId = r.OrderId,
                Rating = r.Rating ?? 0,
                Comment = r.Comment,
                Images = r.Images,
                IsVerifiedPurchase = r.IsVerifiedPurchase ?? false,
                ReplyComment = r.ReplyComment,
                ReplyAt = r.ReplyAt,
                IsHidden = r.IsHidden ?? false,
                HelpfulCount = r.ReviewHelpfuls.Count,
                CreatedAt = r.CreatedAt ?? DateTime.UtcNow
            })
            .FirstOrDefaultAsync();

        return review;
    }

    public async Task<ReviewStatsDto> GetReviewStatsAsync(Guid? productId = null)
    {
        var query = _context.Reviews.AsQueryable();

        if (productId.HasValue)
        {
            query = query.Where(r => r.ProductId == productId.Value);
        }

        var reviews = await query
            .Where(r => r.IsHidden != true)
            .ToListAsync();

        return new ReviewStatsDto
        {
            TotalReviews = reviews.Count,
            AverageRating = reviews.Any() ? reviews.Average(r => r.Rating ?? 0) : 0,
            FiveStarCount = reviews.Count(r => r.Rating == 5),
            FourStarCount = reviews.Count(r => r.Rating == 4),
            ThreeStarCount = reviews.Count(r => r.Rating == 3),
            TwoStarCount = reviews.Count(r => r.Rating == 2),
            OneStarCount = reviews.Count(r => r.Rating == 1),
            PendingReplyCount = reviews.Count(r => r.ReplyComment == null)
        };
    }

    public async Task<AdminReviewDto?> ReplyToReviewAsync(Guid id, ReplyReviewDto dto)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
        {
            return null;
        }

        review.ReplyComment = dto.ReplyComment;
        review.ReplyAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetReviewByIdAsync(id);
    }

    public async Task<bool> ToggleHideReviewAsync(Guid id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
        {
            return false;
        }

        review.IsHidden = !(review.IsHidden ?? false);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteReviewAsync(Guid id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
        {
            return false;
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return true;
    }
}

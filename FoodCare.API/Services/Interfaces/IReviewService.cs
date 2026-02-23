using FoodCare.API.Models.DTOs.Reviews;

namespace FoodCare.API.Services.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewSummaryDto> GetReviewsAsync(Guid productId, int pageIndex = 1, int pageSize = 10);
        Task<ReviewEligibilityDto> CheckEligibilityAsync(Guid productId, Guid userId);
        Task CreateReviewAsync(CreateReviewDto dto, Guid userId);
        Task MarkHelpfulAsync(Guid reviewId, Guid userId);
    }
}

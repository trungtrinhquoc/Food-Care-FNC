using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Reviews;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminReviewService
{
    Task<PagedResult<AdminReviewDto>> GetReviewsAsync(AdminReviewFilterDto filter);
    Task<AdminReviewDto?> GetReviewByIdAsync(Guid id);
    Task<ReviewStatsDto> GetReviewStatsAsync(Guid? productId = null);
    Task<AdminReviewDto?> ReplyToReviewAsync(Guid id, ReplyReviewDto dto);
    Task<bool> ToggleHideReviewAsync(Guid id);
    Task<bool> DeleteReviewAsync(Guid id);
}

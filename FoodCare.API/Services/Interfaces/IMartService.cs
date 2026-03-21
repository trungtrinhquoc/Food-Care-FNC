using FoodCare.API.Models.DTOs.Mart;

namespace FoodCare.API.Services.Interfaces;

public interface IMartService
{
    Task<List<NearbyMartDto>> GetNearbyMartsAsync(NearbyMartQueryDto query);
    Task<MartDetailDto?> GetMartDetailAsync(int martId);
    Task<(List<MartProductDto> Products, int TotalCount)> GetMartProductsAsync(int martId, MartProductFilterDto filter);
    Task<bool> SetSelectedMartAsync(Guid userId, int martId);
    Task<int?> GetSelectedMartIdAsync(Guid userId);
}

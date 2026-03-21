using FoodCare.API.Models.DTOs.Products;

namespace FoodCare.API.Services.Interfaces;

public interface ICrossMartSearchService
{
    Task<(List<CrossMartProductResultDto> Products, int TotalCount)> SearchAcrossMartsAsync(CrossMartSearchDto query, Guid? userId);
    Task<List<ProductVariantDto>> GetProductVariantsAsync(Guid productId, int martId);
    Task<List<AlternativeMartDto>> GetAlternativeMartsAsync(Guid productId, decimal latitude, decimal longitude, double radiusKm = 3.0);
    Task<bool> SubscribeToAvailabilityAsync(Guid userId, Guid productId, int martId);
}

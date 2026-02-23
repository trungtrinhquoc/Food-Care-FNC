using FoodCare.API.Models.DTOs.Suppliers;

namespace FoodCare.API.Services.Interfaces.SupplierModule;

public interface ISupplierAuthService
{
    Task<SupplierProfileDto?> GetSupplierProfileAsync(string userId);
    Task<SupplierProfileDto?> UpdateSupplierProfileAsync(string userId, UpdateSupplierDto updateDto);
    Task<IEnumerable<SupplierProductDto>> GetSupplierProductsAsync(string userId);
    Task<IEnumerable<SupplierOrderDto>> GetSupplierOrdersAsync(string userId);
    Task<SupplierStatsDto> GetSupplierStatsAsync(string userId);
    
    // Revenue APIs
    Task<RevenueDataDto> GetRevenueDataAsync(string userId, int? months = 6);
    
    // Reviews APIs
    Task<IEnumerable<SupplierReviewDto>> GetSupplierReviewsAsync(string userId);
    Task<ReviewStatsDto> GetReviewStatsAsync(string userId);
    Task<bool> RespondToReviewAsync(string userId, Guid reviewId, RespondToReviewDto dto);
    
    // Supplier Product CRUD
    Task<SupplierProductDto?> CreateProductAsync(string userId, CreateSupplierProductDto dto);
    Task<SupplierProductDto?> UpdateProductAsync(string userId, Guid productId, UpdateSupplierProductDto dto);
    Task<bool> DeleteProductAsync(string userId, Guid productId);
    Task<bool> SubmitProductForApprovalAsync(string userId, Guid productId);
    
    // Business Registration
    Task<SupplierRegistrationDto?> GetRegistrationStatusAsync(string userId);
    Task<SupplierRegistrationDto?> SubmitRegistrationAsync(string userId, SubmitRegistrationDto dto);
    Task<IEnumerable<object>> GetAvailableWarehousesAsync(string userId);
}

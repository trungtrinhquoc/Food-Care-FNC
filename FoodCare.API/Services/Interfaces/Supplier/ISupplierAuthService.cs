using FoodCare.API.Models.DTOs.Suppliers;

namespace FoodCare.API.Services.Interfaces.Supplier;

public interface ISupplierAuthService
{
    Task<SupplierProfileDto?> GetSupplierProfileAsync(string userId);
    Task<SupplierProfileDto?> UpdateSupplierProfileAsync(string userId, UpdateSupplierDto updateDto);
    Task<IEnumerable<SupplierProductDto>> GetSupplierProductsAsync(string userId);
    Task<IEnumerable<SupplierOrderDto>> GetSupplierOrdersAsync(string userId);
    Task<SupplierStatsDto> GetSupplierStatsAsync(string userId);
}

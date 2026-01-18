using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Products;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminProductService
{
    Task<PagedResult<AdminProductDto>> GetProductsAsync(AdminProductFilterDto filter);
    Task<AdminProductDto?> GetProductByIdAsync(Guid id);
    Task<AdminProductDto> CreateProductAsync(CreateProductDto dto);
    Task<AdminProductDto?> UpdateProductAsync(Guid id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(Guid id);
    Task<List<AdminProductDto>> GetLowStockProductsAsync(int threshold = 10);
    Task<bool> UpdateStockAsync(Guid id, int quantity);
}

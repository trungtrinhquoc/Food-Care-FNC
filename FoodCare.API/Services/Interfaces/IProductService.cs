using FoodCare.API.Models.DTOs.Products;

namespace FoodCare.API.Services.Interfaces;

public interface IProductService
{
    Task<(List<ProductDto> Products, int TotalCount)> GetProductsAsync(ProductFilterDto filter);
    Task<ProductDto?> GetProductByIdAsync(Guid id);
    Task<ProductDto> CreateProductAsync(CreateProductDto dto);
    Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(Guid id);
}

using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Categories;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminCategoryService
{
    Task<PagedResult<AdminCategoryDto>> GetCategoriesAsync(int page = 1, int pageSize = 20, string? search = null);
    Task<List<CategoryDropdownDto>> GetCategoriesDropdownAsync();
    Task<AdminCategoryDto?> GetCategoryByIdAsync(int id);
    Task<AdminCategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
    Task<AdminCategoryDto?> UpdateCategoryAsync(int id, UpdateCategoryDto dto);
    Task<bool> DeleteCategoryAsync(int id);
}

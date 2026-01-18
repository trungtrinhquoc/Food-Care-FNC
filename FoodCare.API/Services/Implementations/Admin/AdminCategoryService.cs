using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Categories;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminCategoryService : IAdminCategoryService
{
    private readonly FoodCareDbContext _context;

    public AdminCategoryService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminCategoryDto>> GetCategoriesAsync(int page = 1, int pageSize = 20, string? search = null)
    {
        var query = _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Products)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(search) || 
                                     (c.Description != null && c.Description.ToLower().Contains(search)));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var categories = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl,
                Description = c.Description,
                ParentId = c.ParentId,
                ParentName = c.Parent != null ? c.Parent.Name : null,
                IsActive = c.IsActive ?? true,
                ProductCount = c.Products.Count(p => p.IsDeleted != true),
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<AdminCategoryDto>
        {
            Items = categories,
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }

    public async Task<List<CategoryDropdownDto>> GetCategoriesDropdownAsync()
    {
        var categories = await _context.Categories
            .Where(c => c.IsActive == true)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDropdownDto
            {
                Id = c.Id,
                Name = c.Name,
                ParentId = c.ParentId
            })
            .ToListAsync();

        return categories;
    }

    public async Task<AdminCategoryDto?> GetCategoryByIdAsync(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Products)
            .Where(c => c.Id == id)
            .Select(c => new AdminCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl,
                Description = c.Description,
                ParentId = c.ParentId,
                ParentName = c.Parent != null ? c.Parent.Name : null,
                IsActive = c.IsActive ?? true,
                ProductCount = c.Products.Count(p => p.IsDeleted != true),
                CreatedAt = c.CreatedAt
            })
            .FirstOrDefaultAsync();

        return category;
    }

    public async Task<AdminCategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            Slug = dto.Slug ?? GenerateSlug(dto.Name),
            ImageUrl = dto.ImageUrl,
            Description = dto.Description,
            ParentId = dto.ParentId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return (await GetCategoryByIdAsync(category.Id))!;
    }

    public async Task<AdminCategoryDto?> UpdateCategoryAsync(int id, UpdateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return null;
        }

        category.Name = dto.Name;
        category.Slug = dto.Slug ?? category.Slug;
        category.ImageUrl = dto.ImageUrl;
        category.Description = dto.Description;
        category.ParentId = dto.ParentId;
        category.IsActive = dto.IsActive ?? category.IsActive;

        await _context.SaveChangesAsync();

        return await GetCategoryByIdAsync(id);
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return false;
        }

        // Soft delete - just set inactive
        category.IsActive = false;
        await _context.SaveChangesAsync();

        return true;
    }

    private string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("á", "a").Replace("à", "a").Replace("ả", "a").Replace("ã", "a").Replace("ạ", "a")
            .Replace("ă", "a").Replace("ắ", "a").Replace("ằ", "a").Replace("ẳ", "a").Replace("ẵ", "a").Replace("ặ", "a")
            .Replace("â", "a").Replace("ấ", "a").Replace("ầ", "a").Replace("ẩ", "a").Replace("ẫ", "a").Replace("ậ", "a")
            .Replace("é", "e").Replace("è", "e").Replace("ẻ", "e").Replace("ẽ", "e").Replace("ẹ", "e")
            .Replace("ê", "e").Replace("ế", "e").Replace("ề", "e").Replace("ể", "e").Replace("ễ", "e").Replace("ệ", "e")
            .Replace("í", "i").Replace("ì", "i").Replace("ỉ", "i").Replace("ĩ", "i").Replace("ị", "i")
            .Replace("ó", "o").Replace("ò", "o").Replace("ỏ", "o").Replace("õ", "o").Replace("ọ", "o")
            .Replace("ô", "o").Replace("ố", "o").Replace("ồ", "o").Replace("ổ", "o").Replace("ỗ", "o").Replace("ộ", "o")
            .Replace("ơ", "o").Replace("ớ", "o").Replace("ờ", "o").Replace("ở", "o").Replace("ỡ", "o").Replace("ợ", "o")
            .Replace("ú", "u").Replace("ù", "u").Replace("ủ", "u").Replace("ũ", "u").Replace("ụ", "u")
            .Replace("ư", "u").Replace("ứ", "u").Replace("ừ", "u").Replace("ử", "u").Replace("ữ", "u").Replace("ự", "u")
            .Replace("ý", "y").Replace("ỳ", "y").Replace("ỷ", "y").Replace("ỹ", "y").Replace("ỵ", "y")
            .Replace("đ", "d");
    }
}

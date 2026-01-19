using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Products;
using FoodCare.API.Models.DTOs.Products; // Import shared Create/Update DTOs
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminProductService : IAdminProductService
{
    private readonly FoodCareDbContext _context;

    public AdminProductService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminProductDto>> GetProductsAsync(AdminProductFilterDto filter)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Where(p => p.IsDeleted != true)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var searchLower = filter.SearchTerm.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchLower) || 
                                   (p.Sku != null && p.Sku.ToLower().Contains(searchLower)));
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
        }

        if (filter.SupplierId.HasValue)
        {
            query = query.Where(p => p.SupplierId == filter.SupplierId.Value);
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(p => p.IsActive == filter.IsActive.Value);
        }

        if (filter.MinPrice.HasValue)
        {
            query = query.Where(p => p.BasePrice >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(p => p.BasePrice <= filter.MaxPrice.Value);
        }

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.SortDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "price" => filter.SortDescending ? query.OrderByDescending(p => p.BasePrice) : query.OrderBy(p => p.BasePrice),
            "stock" => filter.SortDescending ? query.OrderByDescending(p => p.StockQuantity) : query.OrderBy(p => p.StockQuantity),
            "created" => filter.SortDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var totalItems = await query.CountAsync();

        var products = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => new AdminProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                BasePrice = p.BasePrice,
                OriginalPrice = p.OriginalPrice,
                StockQuantity = p.StockQuantity ?? 0,
                LowStockThreshold = p.LowStockThreshold ?? 0,
                Images = p.Images,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : null,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier != null ? p.Supplier.Name : null,
                IsSubscriptionAvailable = p.IsSubscriptionAvailable ?? false,
                IsActive = p.IsActive ?? false,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = p.UpdatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new PagedResult<AdminProductDto>
        {
            Items = products,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)filter.PageSize)
        };
    }

    public async Task<AdminProductDto?> GetProductByIdAsync(Guid id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Where(p => p.Id == id && p.IsDeleted != true)
            .Select(p => new AdminProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                BasePrice = p.BasePrice,
                OriginalPrice = p.OriginalPrice,
                CostPrice = p.CostPrice,
                StockQuantity = p.StockQuantity ?? 0,
                LowStockThreshold = p.LowStockThreshold ?? 0,
                Sku = p.Sku,
                Images = p.Images,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : null,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier != null ? p.Supplier.Name : null,
                IsSubscriptionAvailable = p.IsSubscriptionAvailable ?? false,
                IsActive = p.IsActive ?? false,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = p.UpdatedAt ?? DateTime.UtcNow
            })
            .FirstOrDefaultAsync();

        return product;
    }

    public async Task<AdminProductDto> CreateProductAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Slug = dto.Slug ?? GenerateSlug(dto.Name),
            Description = dto.Description,
            BasePrice = dto.BasePrice,
            OriginalPrice = dto.OriginalPrice,
            CostPrice = dto.CostPrice,
            CategoryId = dto.CategoryId,
            SupplierId = dto.SupplierId,
            Sku = dto.Sku,
            StockQuantity = dto.StockQuantity,
            LowStockThreshold = dto.LowStockThreshold ?? 10,
            Images = dto.Images,
            IsSubscriptionAvailable = dto.IsSubscriptionAvailable,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return (await GetProductByIdAsync(product.Id))!;
    }

    public async Task<AdminProductDto?> UpdateProductAsync(Guid id, UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null || product.IsDeleted == true)
        {
            return null;
        }

        product.Name = dto.Name;
        product.Slug = dto.Slug ?? product.Slug;
        product.Description = dto.Description;
        product.BasePrice = dto.BasePrice;
        product.OriginalPrice = dto.OriginalPrice;
        product.CostPrice = dto.CostPrice;
        product.CategoryId = dto.CategoryId;
        product.SupplierId = dto.SupplierId;
        product.Sku = dto.Sku;
        product.Images = dto.Images;
        product.IsSubscriptionAvailable = dto.IsSubscriptionAvailable;
        product.IsActive = dto.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetProductByIdAsync(id);
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return false;
        }

        product.IsDeleted = true;
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<AdminProductDto>> GetLowStockProductsAsync(int threshold = 10)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Where(p => p.IsActive == true && 
                   p.IsDeleted != true &&
                   p.StockQuantity.HasValue && 
                   p.StockQuantity <= threshold)
            .Select(p => new AdminProductDto
            {
                Id = p.Id,
                Name = p.Name,
                BasePrice = p.BasePrice,
                StockQuantity = p.StockQuantity ?? 0,
                LowStockThreshold = p.LowStockThreshold ?? 0,
                CategoryName = p.Category != null ? p.Category.Name : null,
                SupplierName = p.Supplier != null ? p.Supplier.Name : null
            })
            .ToListAsync();

        return products;
    }

    public async Task<bool> UpdateStockAsync(Guid id, int quantity)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return false;
        }

        product.StockQuantity = quantity;
        product.UpdatedAt = DateTime.UtcNow;
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

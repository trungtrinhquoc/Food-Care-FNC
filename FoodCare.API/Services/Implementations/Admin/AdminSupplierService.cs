using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Suppliers;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminSupplierService : IAdminSupplierService
{
    private readonly FoodCareDbContext _context;

    public AdminSupplierService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminSupplierDto>> GetSuppliersAsync(AdminSupplierFilterDto filter)
    {
        var query = _context.Suppliers.AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var searchLower = filter.SearchTerm.ToLower();
            query = query.Where(s => 
                s.Name.ToLower().Contains(searchLower) ||
                (s.ContactEmail != null && s.ContactEmail.ToLower().Contains(searchLower)) ||
                (s.Phone != null && s.Phone.Contains(searchLower)));
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(s => s.IsActive == filter.IsActive.Value);
        }

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.SortDescending ? query.OrderByDescending(s => s.Name) : query.OrderBy(s => s.Name),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };

        var totalItems = await query.CountAsync();

        var suppliers = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => new AdminSupplierDto
            {
                Id = s.Id,
                Name = s.Name,
                ContactEmail = s.ContactEmail,
                Phone = s.Phone,
                Address = s.Address,
                TotalProducts = s.Products.Count,
                IsActive = s.IsActive ?? false,
                CreatedAt = s.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new PagedResult<AdminSupplierDto>
        {
            Items = suppliers,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)filter.PageSize)
        };
    }

    public async Task<AdminSupplierDetailDto?> GetSupplierDetailAsync(int id)
    {
        var supplier = await _context.Suppliers
            .Include(s => s.Products.Where(p => p.IsDeleted != true))
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier == null)
        {
            return null;
        }

        var products = supplier.Products.Select(p => new SupplierProductDto
        {
            Id = p.Id,
            Name = p.Name,
            BasePrice = p.BasePrice,
            StockQuantity = p.StockQuantity ?? 0,
            IsActive = p.IsActive ?? false
        }).ToList();

        return new AdminSupplierDetailDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            ContactEmail = supplier.ContactEmail,
            Phone = supplier.Phone,
            Address = supplier.Address,
            TotalProducts = supplier.Products.Count,
            IsActive = supplier.IsActive ?? false,
            CreatedAt = supplier.CreatedAt ?? DateTime.UtcNow,
            Products = products
        };
    }
}

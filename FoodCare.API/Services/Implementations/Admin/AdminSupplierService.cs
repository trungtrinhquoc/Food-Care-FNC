using FoodCare.API.Models;
using FoodCare.API.Models.Suppliers;
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
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt 
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
            .FirstOrDefaultAsync(s => s.Id.Equals(id));

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
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt,
            Products = products
        };
    }

    public async Task<AdminSupplierDetailDto> CreateSupplierAsync(AdminUpsertSupplierDto dto)
    {
        var supplier = new Models.Suppliers.Supplier {
            Name = dto.Name,
            ContactEmail = dto.ContactEmail,
            Phone = dto.Phone,
            Address = dto.Address,
            IsActive = dto.IsActive ?? true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync();

        return (await GetSupplierDetailAsync(supplier.Id))!;
    }

    public async Task<AdminSupplierDetailDto?> UpdateSupplierAsync(int id, AdminUpsertSupplierDto dto)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id.Equals(id));
        if (supplier == null)
        {
            return null;
        }

        supplier.Name = dto.Name;
        supplier.ContactEmail = dto.ContactEmail;
        supplier.Phone = dto.Phone;
        supplier.Address = dto.Address;
        supplier.IsActive = dto.IsActive ?? supplier.IsActive;

        await _context.SaveChangesAsync();

        return await GetSupplierDetailAsync(id);
    }

    public async Task<bool> DeleteSupplierAsync(int id)
    {
        var supplier = await _context.Suppliers
            .Include(s => s.Products)
            .FirstOrDefaultAsync(s => s.Id.Equals(id));

        if (supplier == null)
        {
            return false;
        }

        // Detach supplier from products to avoid FK constraint issues
        foreach (var product in supplier.Products)
        {
            product.SupplierId = null;
        }

        _context.Suppliers.Remove(supplier);
        await _context.SaveChangesAsync();
        return true;
    }
}

using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Suppliers;
using FoodCare.API.Models.Suppliers;
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
                s.ContactName.ToLower().Contains(searchLower) ||
                (s.ContactEmail != null && s.ContactEmail.ToLower().Contains(searchLower)) ||
                (s.ContactPhone != null && s.ContactPhone.Contains(searchLower)));
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(s => s.IsActive == filter.IsActive.Value);
        }

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.SortDescending ? query.OrderByDescending(s => s.ContactName) : query.OrderBy(s => s.ContactName),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };

        var totalItems = await query.CountAsync();

        var suppliers = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => new AdminSupplierDto
            {
                Id = s.Id,
                Name = s.StoreName,
                ContactEmail = s.ContactEmail,
                Phone = s.ContactPhone,
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
            Name = supplier.StoreName,
            ContactEmail = supplier.ContactEmail,
            Phone = supplier.ContactPhone,
            Address = supplier.Address,
            TotalProducts = supplier.Products.Count,
            IsActive = supplier.IsActive ?? false,
            CreatedAt = supplier.CreatedAt ?? DateTime.UtcNow,
            Products = products
        };
    }

    public async Task<AdminSupplierDetailDto> CreateSupplierAsync(AdminUpsertSupplierDto dto)
    {
        var supplier = new Supplier {
            StoreName = dto.Name,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.Phone,
            Address = dto.Address,
            IsActive = dto.IsActive,
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

        supplier.StoreName = dto.Name;
        supplier.ContactEmail = dto.ContactEmail;
        supplier.ContactPhone = dto.Phone;
        supplier.Address = dto.Address;
        supplier.IsActive = dto.IsActive;

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

    public async Task<List<MartSummaryDto>> GetMartListAsync()
    {
        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1);
        var nextMonthStart = thisMonthStart.AddMonths(1);

        var suppliers = await _context.Suppliers
            .Where(s => s.IsActive == true && s.IsDeleted != true)
            .OrderByDescending(s => s.Rating)
            .ToListAsync();

        var result = new List<MartSummaryDto>();

        foreach (var s in suppliers)
        {
            // Count monthly orders for this supplier via SupplierOrders
            var monthlyOrders = await _context.SupplierOrders
                .CountAsync(o => o.SupplierId == s.Id &&
                                 o.CreatedAt.HasValue &&
                                 o.CreatedAt.Value >= thisMonthStart &&
                                 o.CreatedAt.Value < nextMonthStart);

            var slaRate = s.SlaComplianceRate ?? 100m;
            var rating = s.Rating ?? 0m;

            result.Add(new MartSummaryDto
            {
                Id = s.Id,
                StoreName = s.StoreName,
                LogoUrl = s.StoreLogoUrl,
                Rating = rating,
                SlaComplianceRate = slaRate,
                MonthlyOrders = monthlyOrders,
                IsTop = rating >= 4.7m && slaRate >= 97m,
                HasSlaWarning = slaRate < 95m,
                IsActive = s.IsActive ?? false
            });
        }

        return result;
    }
}

using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminAlertService : IAdminAlertService
{
    private readonly FoodCareDbContext _context;

    public AdminAlertService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminAlertDto>> GetAlertsAsync(AdminAlertFilterDto filter)
    {
        var query = _context.SupplierAlerts
            .Include(a => a.Supplier)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Type))
            query = query.Where(a => a.Type == filter.Type);

        if (!string.IsNullOrEmpty(filter.Severity))
            query = query.Where(a => a.Severity == filter.Severity);

        if (filter.IsRead.HasValue)
            query = query.Where(a => a.IsRead == filter.IsRead.Value);

        if (filter.SupplierId.HasValue)
            query = query.Where(a => a.SupplierId == filter.SupplierId.Value);

        query = query.OrderByDescending(a => a.CreatedAt);

        var totalItems = await query.CountAsync();

        var alerts = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new AdminAlertDto
            {
                Id = a.Id,
                SupplierId = a.SupplierId,
                StoreName = a.Supplier.StoreName,
                Type = a.Type,
                Title = a.Title,
                Message = a.Message,
                Severity = a.Severity,
                IsRead = a.IsRead ?? false,
                CreatedAt = a.CreatedAt ?? DateTime.UtcNow,
                ReadAt = a.ReadAt,
                Data = a.Data
            })
            .ToListAsync();

        return new PagedResult<AdminAlertDto>
        {
            Items = alerts,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)filter.PageSize)
        };
    }

    public async Task<int> GetUnreadCountAsync()
    {
        return await _context.SupplierAlerts.CountAsync(a => a.IsRead == false);
    }

    public async Task<bool> MarkAsReadAsync(Guid alertId)
    {
        var alert = await _context.SupplierAlerts.FindAsync(alertId);
        if (alert == null) return false;

        alert.IsRead = true;
        alert.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> MarkAllAsReadAsync()
    {
        var unread = await _context.SupplierAlerts
            .Where(a => a.IsRead == false)
            .ToListAsync();

        foreach (var alert in unread)
        {
            alert.IsRead = true;
            alert.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return unread.Count;
    }
}

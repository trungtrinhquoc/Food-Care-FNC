using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Customers;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminCustomerService : IAdminCustomerService
{
    private readonly FoodCareDbContext _context;

    public AdminCustomerService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminCustomerDto>> GetCustomersAsync(AdminCustomerFilterDto filter)
    {
        var query = _context.Users
            .Where(u => u.Role == UserRole.customer)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var searchLower = filter.SearchTerm.ToLower();
            query = query.Where(u => 
                u.Email.ToLower().Contains(searchLower) ||
                (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(searchLower)));
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == filter.IsActive.Value);
        }

        if (filter.TierId.HasValue)
        {
            query = query.Where(u => u.TierId == filter.TierId.Value);
        }

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.SortDescending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
            "email" => filter.SortDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "created" => filter.SortDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            _ => query.OrderByDescending(u => u.CreatedAt)
        };

        var totalItems = await query.CountAsync();

        // Get customers with their order statistics
        var customers = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(u => new
            {
                User = u,
                TotalOrders = u.Orders.Count,
                TotalSpent = u.Orders
                    .Where(o => o.Status == OrderStatus.delivered)
                    .Sum(o => (decimal?)o.TotalAmount) ?? 0
            })
            .ToListAsync();

        var customerDtos = customers.Select(c => new AdminCustomerDto
        {
            Id = c.User.Id,
            Email = c.User.Email,
            FullName = c.User.FullName,
            PhoneNumber = c.User.PhoneNumber,
            AvatarUrl = c.User.AvatarUrl,
            TierId = c.User.TierId,
            LoyaltyPoints = c.User.LoyaltyPoints ?? 0,
            TotalOrders = c.TotalOrders,
            TotalSpent = c.TotalSpent,
            IsActive = c.User.IsActive ?? false,
            CreatedAt = c.User.CreatedAt ?? DateTime.UtcNow
        }).ToList();

        return new PagedResult<AdminCustomerDto>
        {
            Items = customerDtos,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)filter.PageSize)
        };
    }

    public async Task<AdminCustomerDetailDto?> GetCustomerDetailAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Orders)
                .ThenInclude(o => o.OrderItems)
            .Include(u => u.Addresses)
            .Include(u => u.Tier)
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.customer);

        if (user == null)
        {
            return null;
        }

        var totalSpent = user.Orders
            .Where(o => o.Status == OrderStatus.delivered)
            .Sum(o => o.TotalAmount);

        var recentOrders = user.Orders
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new CustomerOrderSummaryDto
            {
                OrderId = o.Id,
                TotalAmount = o.TotalAmount,
                Status = o.Status.ToString(),
                CreatedAt = o.CreatedAt ?? DateTime.UtcNow
            })
            .ToList();

        var addresses = user.Addresses.Select(a => new CustomerAddressDto
        {
            Id = a.Id,
            AddressLine = a.AddressLine1 + (string.IsNullOrEmpty(a.AddressLine2) ? "" : ", " + a.AddressLine2),
            City = a.City,
            District = a.District,
            Ward = a.Ward,
            IsDefault = a.IsDefault ?? false
        }).ToList();

        return new AdminCustomerDetailDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            TierId = user.TierId,
            TierName = user.Tier?.Name,
            LoyaltyPoints = user.LoyaltyPoints ?? 0,
            TotalOrders = user.Orders.Count,
            TotalSpent = totalSpent,
            IsActive = user.IsActive ?? false,
            CreatedAt = user.CreatedAt ?? DateTime.UtcNow,
            RecentOrders = recentOrders,
            Addresses = addresses
        };
    }
}

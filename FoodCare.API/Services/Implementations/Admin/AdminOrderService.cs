using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Orders;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminOrderService : IAdminOrderService
{
    private readonly FoodCareDbContext _context;

    public AdminOrderService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminOrderDto>> GetOrdersAsync(AdminOrderFilterDto filter)
    {
        var query = _context.Orders
            .Include(o => o.User)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var searchLower = filter.SearchTerm.ToLower();
            query = query.Where(o => 
                (o.User != null && o.User.Email.ToLower().Contains(searchLower)) ||
                (o.TrackingNumber != null && o.TrackingNumber.ToLower().Contains(searchLower)));
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(o => o.Status == filter.Status.Value);
        }

        if (filter.StartDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt >= filter.StartDate.Value);
        }

        if (filter.EndDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt <= filter.EndDate.Value);
        }

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "total" => filter.SortDescending ? query.OrderByDescending(o => o.TotalAmount) : query.OrderBy(o => o.TotalAmount),
            "status" => filter.SortDescending ? query.OrderByDescending(o => o.Status) : query.OrderBy(o => o.Status),
            _ => filter.SortDescending ? query.OrderBy(o => o.CreatedAt) : query.OrderByDescending(o => o.CreatedAt)
        };

        var totalItems = await query.CountAsync();

        var orders = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(o => new AdminOrderDto
            {
                Id = o.Id,
                CustomerName = o.User != null ? o.User.FullName : null,
                CustomerEmail = o.User != null ? o.User.Email : null,
                TotalAmount = o.TotalAmount,
                Status = o.Status.ToString(),
                PaymentStatus = o.PaymentStatus.ToString(),
                CreatedAt = o.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new PagedResult<AdminOrderDto>
        {
            Items = orders,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)filter.PageSize)
        };
    }

    public async Task<AdminOrderDetailDto?> GetOrderDetailAsync(Guid id)
    {
        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderStatusHistories)
                .ThenInclude(h => h.CreatedByNavigation)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return null;
        }

        return new AdminOrderDetailDto
        {
            Id = order.Id,
            CustomerName = order.User?.FullName,
            CustomerEmail = order.User?.Email,
            TotalAmount = order.TotalAmount,
            Subtotal = order.Subtotal,
            ShippingFee = order.ShippingFee ?? 0,
            DiscountAmount = order.DiscountAmount ?? 0,
            Status = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            ShippingAddress = order.ShippingAddressSnapshot,
            TrackingNumber = order.TrackingNumber,
            ShippingProvider = order.ShippingProvider,
            Note = order.Note,
            CreatedAt = order.CreatedAt ?? DateTime.UtcNow,
            OrderItems = order.OrderItems.Select(oi => new OrderItemDto
            {
                ProductId = oi.ProductId ?? Guid.Empty,
                ProductName = oi.Product?.Name ?? string.Empty,
                Quantity = oi.Quantity,
                UnitPrice = oi.Price,
                Subtotal = oi.TotalPrice ?? 0
            }).ToList(),
            StatusHistory = order.OrderStatusHistories
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new StatusHistoryDto
                {
                    Status = h.NewStatus.ToString(),
                    Note = h.Note,
                    ChangedAt = h.CreatedAt ?? DateTime.UtcNow,
                    ChangedBy = h.CreatedByNavigation?.FullName
                }).ToList()
        };
    }

    public async Task<List<AdminOrderDto>> GetRecentOrdersAsync(int count = 10)
    {
        var orders = await _context.Orders
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Take(count)
            .Select(o => new AdminOrderDto
            {
                Id = o.Id,
                CustomerName = o.User != null ? o.User.FullName : null,
                CustomerEmail = o.User != null ? o.User.Email : null,
                TotalAmount = o.TotalAmount,
                Status = o.Status.ToString(),
                PaymentStatus = o.PaymentStatus.ToString(),
                CreatedAt = o.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return orders;
    }

    public async Task<bool> UpdateOrderStatusAsync(Guid id, UpdateOrderStatusDto dto)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            return false;
        }

        var previousStatus = order.Status;
        
        // Parse the status string to enum
        if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
        {
            return false;
        }

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        // Create status history
        var history = new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = id,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Note = dto.Note,
            CreatedBy = dto.ChangedBy,
            CreatedAt = DateTime.UtcNow
        };

        _context.OrderStatusHistories.Add(history);
        await _context.SaveChangesAsync();

        return true;
    }
}

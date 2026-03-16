using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Shipper;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using System.Text.Json;

namespace FoodCare.API.Services.Implementations;

public class ShipperService : IShipperService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<ShipperService> _logger;

    public ShipperService(FoodCareDbContext context, ILogger<ShipperService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ShipperInfoDto?> GetShipperInfoAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || user.Role != UserRole.staff) return null;

        var staffMember = await _context.StaffMembers
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive);

        if (staffMember == null || staffMember.StaffPositionEnum != StaffPosition.Shipper) return null;

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        // Đơn hàng trong kho của shipper
        var warehouseOrders = await _context.Orders
            .Where(o => o.WarehouseId == staffMember.WarehouseId)
            .ToListAsync();

        // Đơn mà shipper này đang giao / đã giao hôm nay
        var todayDelivered = warehouseOrders.Count(o =>
            o.ShipperId == userId &&
            o.Status == OrderStatus.delivered &&
            o.UpdatedAt >= today && o.UpdatedAt < tomorrow);

        var todayPending = warehouseOrders.Count(o =>
            o.Status == OrderStatus.confirmed);

        var totalDelivered = warehouseOrders.Count(o =>
            o.ShipperId == userId &&
            o.Status == OrderStatus.delivered);

        var warehouseAddress = string.Join(", ", new[]
        {
            staffMember.Warehouse?.AddressStreet,
            staffMember.Warehouse?.AddressWard,
            staffMember.Warehouse?.AddressDistrict,
            staffMember.Warehouse?.AddressCity
        }.Where(x => !string.IsNullOrEmpty(x)));

        return new ShipperInfoDto
        {
            UserId = userId,
            FullName = user.FullName ?? user.Email,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            EmployeeCode = staffMember.EmployeeCode,
            WarehouseId = staffMember.WarehouseId,
            WarehouseName = staffMember.Warehouse?.Name,
            WarehouseAddress = warehouseAddress,
            TodayDelivered = todayDelivered,
            TodayPending = todayPending,
            TotalDelivered = totalDelivered
        };
    }

    public async Task<List<ShipperOrderDto>> GetOrdersForShipperAsync(Guid userId, string? statusFilter = null)
    {
        var staffMember = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive && s.StaffPositionEnum == StaffPosition.Shipper);

        if (staffMember == null) return new List<ShipperOrderDto>();

        var query = _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .Include(o => o.User)
            .Where(o => o.WarehouseId == staffMember.WarehouseId);

        // Filter theo status
        if (!string.IsNullOrEmpty(statusFilter))
        {
            if (Enum.TryParse<OrderStatus>(statusFilter, true, out var parsedStatus))
                query = query.Where(o => o.Status == parsedStatus);
        }
        else
        {
            // Mặc định: chỉ show confirmed (chưa có shipper) và shipping (shipper này đang giao)
            query = query.Where(o =>
                o.Status == OrderStatus.confirmed ||
                (o.Status == OrderStatus.shipping && o.ShipperId == userId));
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(o => MapToShipperOrderDto(o)).ToList();
    }

    public async Task<bool> AcceptOrderAsync(Guid userId, Guid orderId)
    {
        var staffMember = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive && s.StaffPositionEnum == StaffPosition.Shipper);

        if (staffMember == null) return false;

        var order = await _context.Orders
            .FirstOrDefaultAsync(o =>
                o.Id == orderId &&
                o.WarehouseId == staffMember.WarehouseId &&
                o.Status == OrderStatus.confirmed &&
                o.ShipperId == null); // Chưa có shipper nhận

        if (order == null) return false;

        order.Status = OrderStatus.shipping;
        order.ShipperId = userId;
        order.UpdatedAt = DateTime.UtcNow;

        // Ghi lịch sử
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = orderId,
            Status = OrderStatus.shipping,
            CreatedBy = userId,
            Note = $"Shipper {staffMember.EmployeeCode} đã nhận đơn hàng",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        _logger.LogInformation("Shipper {UserId} accepted order {OrderId}", userId, orderId);
        return true;
    }

    public async Task<bool> UpdateOrderStatusAsync(Guid userId, Guid orderId, ShipperUpdateOrderStatusDto dto)
    {
        var staffMember = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive && s.StaffPositionEnum == StaffPosition.Shipper);

        if (staffMember == null) return false;

        if (!Enum.TryParse<OrderStatus>(dto.NewStatus, true, out var newStatus))
            return false;

        // Chỉ cho phép shipper update đơn hàng của chính shipper đó đang giao
        var order = await _context.Orders
            .FirstOrDefaultAsync(o =>
                o.Id == orderId &&
                o.WarehouseId == staffMember.WarehouseId &&
                o.ShipperId == userId &&
                o.Status == OrderStatus.shipping);

        if (order == null) return false;

        // Chỉ cho phép chuyển sang delivered hoặc cancelled (thất bại giao)
        if (newStatus != OrderStatus.delivered && newStatus != OrderStatus.cancelled)
            return false;

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = orderId,
            Status = newStatus,
            CreatedBy = userId,
            Note = dto.Note ?? (newStatus == OrderStatus.delivered ? "Giao hàng thành công" : "Giao hàng thất bại"),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        _logger.LogInformation("Shipper {UserId} updated order {OrderId} to {Status}", userId, orderId, newStatus);
        return true;
    }

    public async Task<ShipperStatsDto> GetShipperStatsAsync(Guid userId)
    {
        var staffMember = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive && s.StaffPositionEnum == StaffPosition.Shipper);

        if (staffMember == null) return new ShipperStatsDto();

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var weekStart = today.AddDays(-(int)today.DayOfWeek);

        var warehouseOrders = await _context.Orders
            .Where(o => o.WarehouseId == staffMember.WarehouseId)
            .ToListAsync();

        var myOrders = warehouseOrders.Where(o => o.ShipperId == userId).ToList();

        return new ShipperStatsDto
        {
            TodayTotal = warehouseOrders.Count(o =>
                (o.Status == OrderStatus.confirmed || o.Status == OrderStatus.shipping || o.Status == OrderStatus.delivered) &&
                (o.UpdatedAt >= today || o.CreatedAt >= today)),
            TodayDelivered = myOrders.Count(o =>
                o.Status == OrderStatus.delivered &&
                o.UpdatedAt >= today && o.UpdatedAt < tomorrow),
            TodayShipping = myOrders.Count(o =>
                o.Status == OrderStatus.shipping &&
                o.UpdatedAt >= today),
            TodayPending = warehouseOrders.Count(o =>
                o.Status == OrderStatus.confirmed && o.ShipperId == null),
            WeekTotal = myOrders.Count(o =>
                (o.Status == OrderStatus.delivered || o.Status == OrderStatus.shipping) &&
                o.UpdatedAt >= weekStart),
            WeekDelivered = myOrders.Count(o =>
                o.Status == OrderStatus.delivered && o.UpdatedAt >= weekStart),
            TodayTotalAmount = myOrders
                .Where(o => o.Status == OrderStatus.delivered && o.UpdatedAt >= today && o.UpdatedAt < tomorrow)
                .Sum(o => o.TotalAmount)
        };
    }

    private static ShipperOrderDto MapToShipperOrderDto(Order o)
    {
        string? customerName = null;
        string? customerPhone = null;

        // Parse ShippingAddressSnapshot để lấy tên và số điện thoại khách hàng
        try
        {
            if (!string.IsNullOrEmpty(o.ShippingAddressSnapshot))
            {
                var addr = JsonSerializer.Deserialize<JsonElement>(o.ShippingAddressSnapshot);
                customerName = addr.TryGetProperty("recipientName", out var n) ? n.GetString() :
                               addr.TryGetProperty("fullName", out var fn) ? fn.GetString() : o.User?.FullName;
                customerPhone = addr.TryGetProperty("phoneNumber", out var p) ? p.GetString() :
                                addr.TryGetProperty("phone", out var ph) ? ph.GetString() : o.User?.PhoneNumber;
            }
        }
        catch { /* ignore parse errors */ }

        customerName ??= o.User?.FullName;
        customerPhone ??= o.User?.PhoneNumber;

        var statusLabel = o.Status switch
        {
            OrderStatus.pending => "Chờ xác nhận",
            OrderStatus.confirmed => "Chờ lấy hàng",
            OrderStatus.shipping => "Đang giao",
            OrderStatus.delivered => "Đã giao",
            OrderStatus.cancelled => "Đã hủy",
            OrderStatus.returned => "Hoàn hàng",
            _ => o.Status.ToString()
        };

        return new ShipperOrderDto
        {
            Id = o.Id,
            Status = o.Status.ToString(),
            StatusLabel = statusLabel,
            TotalAmount = o.TotalAmount,
            ShippingAddressSnapshot = o.ShippingAddressSnapshot,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            CustomerEmail = o.User?.Email,
            Note = o.Note,
            TrackingNumber = o.TrackingNumber,
            PaymentStatus = o.PaymentStatus.ToString(),
            PaymentMethodSnapshot = o.PaymentMethodSnapshot ?? "",
            CreatedAt = o.CreatedAt,
            UpdatedAt = o.UpdatedAt,
            AcceptedByShipperId = o.ShipperId,
            Items = o.OrderItems.Select(i => new ShipperOrderItemDto
            {
                ProductName = i.ProductName ?? "Sản phẩm",
                ProductImageUrl = i.Product?.ImageUrl,
                Quantity = i.Quantity,
                UnitPrice = i.Price,
                TotalPrice = i.TotalPrice ?? (i.Price * i.Quantity)
            }).ToList()
        };
    }
}

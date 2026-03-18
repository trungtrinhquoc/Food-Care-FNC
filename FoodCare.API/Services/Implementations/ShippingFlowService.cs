using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Shipping;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations;

public class ShippingFlowService : IShippingFlowService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<ShippingFlowService> _logger;

    public ShippingFlowService(FoodCareDbContext context, ILogger<ShippingFlowService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Helper Methods

    private static string GetStatusLabel(string status)
    {
        return status switch
        {
            "pending" => "Chờ xử lý",
            "confirmed" => "Đã xác nhận",
            "shipping" => "Đang giao hàng",
            "delivered" => "Đã giao hàng",
            "cancelled" => "Đã hủy",
            "returned" => "Đã trả hàng",
            _ => status
        };
    }

    private static int CalculateProgress(string status)
    {
        return status switch
        {
            "pending" => 10,
            "confirmed" => 25,
            "shipping" => 70,
            "delivered" => 100,
            "cancelled" => 0,
            "returned" => 0,
            _ => 0
        };
    }

    private static string GetTimelineDescription(string status)
    {
        return status switch
        {
            "pending" => "Đơn hàng đã được tạo",
            "confirmed" => "Đơn hàng đã được xác nhận",
            "shipping" => "Đơn hàng đang được giao",
            "delivered" => "Đã giao hàng thành công",
            "cancelled" => "Đơn hàng đã bị hủy",
            "returned" => "Đơn hàng đã được trả lại",
            _ => status
        };
    }

    #endregion

    #region User Operations

    public async Task<UserOrderTrackingDto?> GetUserOrderTrackingAsync(Guid userId, Guid orderId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        return order == null ? null : MapToUserOrderTracking(order);
    }

    public async Task<List<UserOrderTrackingDto>> GetUserOrdersTrackingAsync(Guid userId, string? status = null, int page = 1, int pageSize = 20)
    {
        var query = _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderStatusHistories)
            .Where(o => o.UserId == userId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, out var statusEnum))
        {
            query = query.Where(o => o.Status == statusEnum);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return orders.Select(MapToUserOrderTracking).ToList();
    }

    public async Task<UserOrderTrackingDto> UserConfirmDeliveryAsync(UserConfirmDeliveryDto dto, Guid userId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.UserId == userId);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        if (dto.IsReceived)
        {
            order.Status = OrderStatus.delivered;
            order.UpdatedAt = DateTime.UtcNow;

            order.OrderStatusHistories.Add(new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                Status = OrderStatus.delivered,
                Note = "Khách hàng xác nhận đã nhận hàng" + (dto.Feedback != null ? $": {dto.Feedback}" : ""),
                ChangedAt = DateTime.UtcNow,
                ChangedBy = userId.ToString()
            });

            await _context.SaveChangesAsync();
        }

        return await GetUserOrderTrackingAsync(userId, dto.OrderId)
            ?? throw new InvalidOperationException("Failed to retrieve order");
    }

    public async Task<UserOrderTrackingDto> UserRequestReturnAsync(UserRequestReturnDto dto, Guid userId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.UserId == userId);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        if (order.Status != OrderStatus.delivered)
            throw new InvalidOperationException("Chỉ có thể yêu cầu trả hàng khi đơn hàng đã được giao");

        order.Status = OrderStatus.returned;
        order.UpdatedAt = DateTime.UtcNow;

        order.OrderStatusHistories.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = OrderStatus.returned,
            Note = $"Yêu cầu trả hàng: {dto.Reason}" + (dto.Description != null ? $" - {dto.Description}" : ""),
            ChangedAt = DateTime.UtcNow,
            ChangedBy = userId.ToString()
        });

        await _context.SaveChangesAsync();

        return await GetUserOrderTrackingAsync(userId, dto.OrderId)
            ?? throw new InvalidOperationException("Failed to retrieve order");
    }

    public async Task<UserOrderTrackingDto> UserCancelOrderAsync(Guid orderId, Guid userId, string reason)
    {
        var order = await _context.Orders
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        if (order.Status != OrderStatus.pending)
            throw new InvalidOperationException("Chỉ có thể hủy đơn hàng khi đang ở trạng thái chờ xử lý");

        order.Status = OrderStatus.cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        order.OrderStatusHistories.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = OrderStatus.cancelled,
            Note = $"Khách hàng hủy đơn: {reason}",
            ChangedAt = DateTime.UtcNow,
            ChangedBy = userId.ToString()
        });

        await _context.SaveChangesAsync();

        return await GetUserOrderTrackingAsync(userId, orderId)
            ?? throw new InvalidOperationException("Failed to retrieve order");
    }

    private UserOrderTrackingDto MapToUserOrderTracking(Order order)
    {
        var canCancel = order.Status == OrderStatus.pending;
        var canRequestReturn = order.Status == OrderStatus.delivered;
        var canConfirm = order.Status == OrderStatus.shipping;

        return new UserOrderTrackingDto
        {
            OrderId = order.Id,
            OrderNumber = order.Id.ToString()[..8].ToUpper(),
            Status = order.Status.ToString(),
            StatusLabel = GetStatusLabel(order.Status.ToString()),
            ShippingStatus = order.Status.ToString(),
            ShippingStatusLabel = GetStatusLabel(order.Status.ToString()),
            StatusProgress = CalculateProgress(order.Status.ToString()),
            TotalAmount = order.TotalAmount,
            OrderDate = order.CreatedAt ?? DateTime.UtcNow,
            TrackingNumber = order.TrackingNumber,
            ShippingProvider = order.ShippingProvider,
            ShippingAddress = order.ShippingAddressSnapshot ?? "",
            CanCancel = canCancel,
            CanRequestReturn = canRequestReturn,
            CanConfirmReceived = canConfirm,
            Items = order.OrderItems.Select(oi => new UserOrderItemDto
            {
                ProductId = oi.ProductId ?? Guid.Empty,
                ProductName = oi.Product?.Name ?? "",
                ProductImage = oi.Product?.ImageUrl,
                Quantity = oi.Quantity,
                Price = oi.Price
            }).ToList(),
            Timeline = order.OrderStatusHistories
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new ShippingTimelineDto
                {
                    Id = h.Id,
                    Timestamp = h.ChangedAt ?? DateTime.UtcNow,
                    Status = h.Status.ToString(),
                    StatusLabel = GetStatusLabel(h.Status.ToString()),
                    Description = h.Note ?? GetTimelineDescription(h.Status.ToString())
                })
                .ToList()
        };
    }

    #endregion
}

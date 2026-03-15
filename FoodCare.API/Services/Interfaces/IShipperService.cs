using FoodCare.API.Models.DTOs.Shipper;

namespace FoodCare.API.Services.Interfaces;

public interface IShipperService
{
    /// <summary>Lấy thông tin shipper hiện tại + thống kê hôm nay</summary>
    Task<ShipperInfoDto?> GetShipperInfoAsync(Guid userId);

    /// <summary>Lấy đơn hàng thuộc kho của shipper, có thể filter theo status</summary>
    Task<List<ShipperOrderDto>> GetOrdersForShipperAsync(Guid userId, string? statusFilter = null);

    /// <summary>Shipper nhận đơn hàng (confirmed → shipping, gán shipper)</summary>
    Task<bool> AcceptOrderAsync(Guid userId, Guid orderId);

    /// <summary>Shipper cập nhật trạng thái đơn hàng (shipping → delivered / cancelled)</summary>
    Task<bool> UpdateOrderStatusAsync(Guid userId, Guid orderId, ShipperUpdateOrderStatusDto dto);

    /// <summary>Lấy thống kê của shipper</summary>
    Task<ShipperStatsDto> GetShipperStatsAsync(Guid userId);
}

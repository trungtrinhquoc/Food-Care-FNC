namespace FoodCare.API.Models.DTOs.Shipper;

/// <summary>Thông tin shipper đang đăng nhập</summary>
public class ShipperInfoDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string EmployeeCode { get; set; } = null!;
    public Guid? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public string? WarehouseAddress { get; set; }
    public int TodayDelivered { get; set; }
    public int TodayPending { get; set; }
    public int TotalDelivered { get; set; }
}

/// <summary>Đơn hàng dành cho shipper xem</summary>
public class ShipperOrderDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = null!;
    public string StatusLabel { get; set; } = null!;
    public decimal TotalAmount { get; set; }
    public string ShippingAddressSnapshot { get; set; } = null!;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string? Note { get; set; }
    public string? TrackingNumber { get; set; }
    public string PaymentStatus { get; set; } = null!;
    public string PaymentMethodSnapshot { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ShipperOrderItemDto> Items { get; set; } = new();
    public Guid? AcceptedByShipperId { get; set; }  // Shipper đã nhận đơn này
}

public class ShipperOrderItemDto
{
    public string ProductName { get; set; } = null!;
    public string? ProductImageUrl { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}

/// <summary>Cập nhật trạng thái đơn hàng bởi shipper</summary>
public class ShipperUpdateOrderStatusDto
{
    /// <summary>Trạng thái mới: "shipping" hoặc "delivered" hoặc "cancelled"</summary>
    public string NewStatus { get; set; } = null!;
    public string? Note { get; set; }
}

/// <summary>Thống kê shipper</summary>
public class ShipperStatsDto
{
    public int TodayTotal { get; set; }
    public int TodayDelivered { get; set; }
    public int TodayPending { get; set; }
    public int TodayShipping { get; set; }
    public int WeekTotal { get; set; }
    public int WeekDelivered { get; set; }
    public decimal TodayTotalAmount { get; set; }
}

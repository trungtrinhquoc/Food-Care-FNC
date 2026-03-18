namespace FoodCare.API.Models.DTOs.Shipping;

#region Shipping Timeline DTOs

/// <summary>
/// Timeline event for tracking shipment history
/// </summary>
public class ShippingTimelineDto
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StatusLabel { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Notes { get; set; }
}

#endregion

#region User Order Tracking DTOs

/// <summary>
/// User-friendly order tracking DTO
/// </summary>
public class UserOrderTrackingDto
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusLabel { get; set; } = string.Empty;
    public string ShippingStatus { get; set; } = string.Empty;
    public string ShippingStatusLabel { get; set; } = string.Empty;
    public int StatusProgress { get; set; }  // 0-100 progress bar
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? TrackingNumber { get; set; }
    public string? ShippingProvider { get; set; }
    public string? CurrentLocation { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public List<UserOrderItemDto> Items { get; set; } = new();
    public List<ShippingTimelineDto> Timeline { get; set; } = new();
    public bool CanCancel { get; set; }
    public bool CanRequestReturn { get; set; }
    public bool CanConfirmReceived { get; set; }
}

public class UserOrderItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

/// <summary>
/// User confirm delivery DTO
/// </summary>
public class UserConfirmDeliveryDto
{
    public Guid OrderId { get; set; }
    public bool IsReceived { get; set; }
    public int? Rating { get; set; }  // 1-5
    public string? Feedback { get; set; }
}

/// <summary>
/// User request return DTO
/// </summary>
public class UserRequestReturnDto
{
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<Guid>? ItemsToReturn { get; set; }  // Specific items, null = all
}

#endregion

using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs.Shipping;

#region Enums for Shipping Flow

/// <summary>
/// Extended shipping status for detailed tracking
/// </summary>
public enum DetailedShippingStatus
{
    // Supplier → Warehouse flow
    SupplierPreparing,      // Supplier đang chuẩn bị hàng
    SupplierDispatched,     // Supplier đã gửi hàng
    InTransitToWarehouse,   // Đang vận chuyển đến kho
    ArrivedAtWarehouse,     // Đã đến kho
    WarehouseInspecting,    // Staff đang kiểm tra
    WarehouseStored,        // Đã lưu kho
    
    // Warehouse → User flow
    OrderReceived,          // Đơn hàng đã nhận từ User
    StaffPreparing,         // Staff đang chuẩn bị đơn hàng
    StaffPacked,            // Staff đã đóng gói
    OutForDelivery,         // Đang giao hàng
    InTransitToUser,        // Đang vận chuyển đến User
    Delivered,              // Đã giao hàng
    DeliveryFailed,         // Giao hàng thất bại
    
    // Return flow
    ReturnRequested,        // User yêu cầu trả hàng
    ReturnApproved,         // Staff duyệt trả hàng
    ReturnInTransit,        // Hàng đang trả về kho
    ReturnReceived,         // Kho đã nhận hàng trả
    ReturnCompleted,        // Hoàn tất trả hàng
    
    Cancelled               // Đã hủy
}

#endregion

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
    public string? Handler { get; set; }  // Staff/Shipper name
    public string? Notes { get; set; }
}

#endregion

#region Supplier Shipment DTOs (Supplier → Warehouse)

/// <summary>
/// DTO for supplier to create a shipment to warehouse
/// </summary>
public class CreateSupplierShipmentDto
{
    public Guid WarehouseId { get; set; }
    public DateTime ExpectedDeliveryDate { get; set; }
    public string? Carrier { get; set; }
    public string? TrackingNumber { get; set; }
    public string? Notes { get; set; }
    public List<SupplierShipmentItemDto> Items { get; set; } = new();
}

public class SupplierShipmentItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal? UnitCost { get; set; }
}

/// <summary>
/// DTO for updating shipment status by supplier
/// </summary>
public class UpdateSupplierShipmentStatusDto
{
    public string Status { get; set; } = string.Empty;  // Draft, Dispatched, InTransit
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public string? Notes { get; set; }
    public string? CurrentLocation { get; set; }
}

/// <summary>
/// Response DTO for supplier shipment
/// </summary>
public class SupplierShipmentResponseDto
{
    public Guid Id { get; set; }
    public string ExternalReference { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusLabel { get; set; } = string.Empty;
    public DateTime ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ShippingTimelineDto> Timeline { get; set; } = new();
    public List<SupplierShipmentItemResponseDto> Items { get; set; } = new();
}

public class SupplierShipmentItemResponseDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductSku { get; set; }
    public string? ProductImage { get; set; }
    public int Quantity { get; set; }
    public int? ReceivedQuantity { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal UnitCost { get; set; }
}

#endregion

#region Staff Inbound DTOs (Receive from Supplier)

/// <summary>
/// DTO for staff to confirm receipt from supplier
/// </summary>
public class StaffReceiveShipmentDto
{
    public Guid ShipmentId { get; set; }
    public string? Notes { get; set; }
    public List<ReceivedItemDto> Items { get; set; } = new();
}

public class ReceivedItemDto
{
    public Guid ItemId { get; set; }  // ShipmentItem ID
    public int AcceptedQuantity { get; set; }
    public int DamagedQuantity { get; set; }
    public int MissingQuantity { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Staff inbound summary
/// </summary>
public class StaffInboundSummaryDto
{
    public int TotalPendingShipments { get; set; }
    public int TotalArrivedToday { get; set; }
    public int TotalInspecting { get; set; }
    public int TotalStoredToday { get; set; }
    public List<SupplierShipmentResponseDto> PendingShipments { get; set; } = new();
}

#endregion

#region Staff Outbound DTOs (Send to User)

/// <summary>
/// DTO for staff to view orders waiting for fulfillment
/// </summary>
public class StaffOutboundOrderDto
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusLabel { get; set; } = string.Empty;
    public string ShippingStatus { get; set; } = string.Empty;
    public string ShippingStatusLabel { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? RequiredDeliveryDate { get; set; }
    public string? TrackingNumber { get; set; }
    public string? ShippingProvider { get; set; }
    public string? AssignedStaffName { get; set; }
    public Guid? AssignedWarehouseId { get; set; }
    public string? AssignedWarehouseName { get; set; }
    public List<StaffOutboundItemDto> Items { get; set; } = new();
    public List<ShippingTimelineDto> Timeline { get; set; } = new();
}

public class StaffOutboundItemDto
{
    public Guid OrderItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductSku { get; set; }
    public string? ProductImage { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public bool IsPicked { get; set; }  // Đã lấy hàng từ kho chưa
    public string? PickedFromBatch { get; set; }  // Lô hàng nào
}

/// <summary>
/// DTO for staff to update order shipping status
/// </summary>
public class StaffUpdateOrderShippingDto
{
    public Guid OrderId { get; set; }
    public string Status { get; set; } = string.Empty;  // StaffPreparing, StaffPacked, OutForDelivery, Delivered
    public string? TrackingNumber { get; set; }
    public string? ShippingProvider { get; set; }
    public string? Notes { get; set; }
    public string? CurrentLocation { get; set; }
}

/// <summary>
/// DTO for staff to pick items from inventory
/// </summary>
public class StaffPickItemsDto
{
    public Guid OrderId { get; set; }
    public List<PickedItemDto> Items { get; set; } = new();
}

public class PickedItemDto
{
    public Guid OrderItemId { get; set; }
    public Guid InventoryItemId { get; set; }  // From which inventory batch
    public int Quantity { get; set; }
}

/// <summary>
/// Staff outbound summary
/// </summary>
public class StaffOutboundSummaryDto
{
    public int TotalPendingOrders { get; set; }
    public int TotalPreparingOrders { get; set; }
    public int TotalPackedOrders { get; set; }
    public int TotalOutForDelivery { get; set; }
    public int TotalDeliveredToday { get; set; }
    public List<StaffOutboundOrderDto> PendingOrders { get; set; } = new();
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

#region Dashboard Summary DTOs

/// <summary>
/// Combined shipping dashboard for staff
/// </summary>
public class StaffShippingDashboardDto
{
    public StaffInboundSummaryDto Inbound { get; set; } = new();
    public StaffOutboundSummaryDto Outbound { get; set; } = new();
    public int TotalActiveShipments { get; set; }
    public int AlertsCount { get; set; }
    public List<ShippingAlertDto> Alerts { get; set; } = new();
}

public class ShippingAlertDto
{
    public string Type { get; set; } = string.Empty;  // late_delivery, low_stock, damage_report
    public string Severity { get; set; } = string.Empty;  // low, medium, high, critical
    public string Message { get; set; } = string.Empty;
    public Guid? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }  // Order, Shipment, Product
    public DateTime CreatedAt { get; set; }
}

#endregion

using FoodCare.API.Models.DTOs.Shipping;

namespace FoodCare.API.Services.Interfaces;

public interface IShippingFlowService
{
    #region Supplier Operations
    
    /// <summary>
    /// Supplier creates a new shipment to warehouse
    /// </summary>
    Task<SupplierShipmentResponseDto> CreateSupplierShipmentAsync(int supplierId, CreateSupplierShipmentDto dto);
    
    /// <summary>
    /// Supplier updates shipment status (Dispatch, update tracking)
    /// </summary>
    Task<SupplierShipmentResponseDto> UpdateSupplierShipmentStatusAsync(int supplierId, Guid shipmentId, UpdateSupplierShipmentStatusDto dto);
    
    /// <summary>
    /// Get shipments for supplier
    /// </summary>
    Task<List<SupplierShipmentResponseDto>> GetSupplierShipmentsAsync(int supplierId, string? status = null, int page = 1, int pageSize = 20);
    
    /// <summary>
    /// Get single shipment detail for supplier
    /// </summary>
    Task<SupplierShipmentResponseDto?> GetSupplierShipmentDetailAsync(int supplierId, Guid shipmentId);
    
    #endregion
    
    #region Staff Inbound Operations (Receive from Supplier)
    
    /// <summary>
    /// Get inbound dashboard for staff
    /// </summary>
    Task<StaffInboundSummaryDto> GetStaffInboundSummaryAsync(Guid? warehouseId = null);
    
    /// <summary>
    /// Staff marks shipment as arrived at warehouse
    /// </summary>
    Task<SupplierShipmentResponseDto> MarkShipmentArrivedAsync(Guid shipmentId, string staffId);
    
    /// <summary>
    /// Staff inspects and receives items from shipment
    /// </summary>
    Task<SupplierShipmentResponseDto> ReceiveShipmentAsync(StaffReceiveShipmentDto dto, string staffId);
    
    /// <summary>
    /// Staff stores received items to inventory
    /// </summary>
    Task<bool> StoreItemsToInventoryAsync(Guid shipmentId, string staffId);
    
    #endregion
    
    #region Staff Outbound Operations (Send to User)
    
    /// <summary>
    /// Get outbound dashboard for staff
    /// </summary>
    Task<StaffOutboundSummaryDto> GetStaffOutboundSummaryAsync(Guid? warehouseId = null);
    
    /// <summary>
    /// Get orders pending fulfillment
    /// </summary>
    Task<List<StaffOutboundOrderDto>> GetPendingOrdersAsync(Guid? warehouseId = null, int page = 1, int pageSize = 20);
    
    /// <summary>
    /// Staff picks items from inventory for order
    /// </summary>
    Task<StaffOutboundOrderDto> PickOrderItemsAsync(StaffPickItemsDto dto, string staffId);
    
    /// <summary>
    /// Staff updates order shipping status
    /// </summary>
    Task<StaffOutboundOrderDto> UpdateOrderShippingStatusAsync(StaffUpdateOrderShippingDto dto, string staffId);
    
    /// <summary>
    /// Get single order detail for staff
    /// </summary>
    Task<StaffOutboundOrderDto?> GetOutboundOrderDetailAsync(Guid orderId);
    
    #endregion
    
    #region User Operations
    
    /// <summary>
    /// User gets tracking info for their order
    /// </summary>
    Task<UserOrderTrackingDto?> GetUserOrderTrackingAsync(Guid userId, Guid orderId);
    
    /// <summary>
    /// User gets all their orders with tracking
    /// </summary>
    Task<List<UserOrderTrackingDto>> GetUserOrdersTrackingAsync(Guid userId, string? status = null, int page = 1, int pageSize = 20);
    
    /// <summary>
    /// User confirms delivery received
    /// </summary>
    Task<UserOrderTrackingDto> UserConfirmDeliveryAsync(UserConfirmDeliveryDto dto, Guid userId);
    
    /// <summary>
    /// User requests return
    /// </summary>
    Task<UserOrderTrackingDto> UserRequestReturnAsync(UserRequestReturnDto dto, Guid userId);
    
    /// <summary>
    /// User cancels order (if allowed)
    /// </summary>
    Task<UserOrderTrackingDto> UserCancelOrderAsync(Guid orderId, Guid userId, string reason);
    
    #endregion
    
    #region Combined Dashboard
    
    /// <summary>
    /// Get combined shipping dashboard for staff
    /// </summary>
    Task<StaffShippingDashboardDto> GetStaffShippingDashboardAsync(Guid? warehouseId = null);
    
    #endregion
}

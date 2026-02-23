using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Shipping;
using FoodCare.API.Services.Interfaces;
using FoodCare.API.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/shipping")]
public class ShippingController : ControllerBase
{
    private readonly IShippingFlowService _shippingService;
    private readonly ILogger<ShippingController> _logger;
    private readonly FoodCareDbContext _context;

    public ShippingController(IShippingFlowService shippingService, ILogger<ShippingController> logger, FoodCareDbContext context)
    {
        _shippingService = shippingService;
        _logger = logger;
        _context = context;
    }

    #region Supplier Endpoints

    /// <summary>
    /// Supplier creates a new shipment to warehouse
    /// </summary>
    [HttpPost("supplier/shipments")]
    [Authorize(Roles = "supplier")]
    public async Task<ActionResult<SupplierShipmentResponseDto>> CreateShipment([FromBody] CreateSupplierShipmentDto dto)
    {
        try
        {
            var supplierId = await GetSupplierIdFromTokenAsync();
            if (supplierId == 0)
                return Unauthorized("Invalid supplier");

            var result = await _shippingService.CreateSupplierShipmentAsync(supplierId, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shipment");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Supplier updates shipment status
    /// </summary>
    [HttpPut("supplier/shipments/{shipmentId}/status")]
    [Authorize(Roles = "supplier")]
    public async Task<ActionResult<SupplierShipmentResponseDto>> UpdateShipmentStatus(
        Guid shipmentId, 
        [FromBody] UpdateSupplierShipmentStatusDto dto)
    {
        try
        {
            var supplierId = await GetSupplierIdFromTokenAsync();
            if (supplierId == 0)
                return Unauthorized("Invalid supplier");

            var result = await _shippingService.UpdateSupplierShipmentStatusAsync(supplierId, shipmentId, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating shipment status");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Supplier gets their shipments
    /// </summary>
    [HttpGet("supplier/shipments")]
    [Authorize(Roles = "supplier")]
    public async Task<ActionResult<List<SupplierShipmentResponseDto>>> GetSupplierShipments(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var supplierId = await GetSupplierIdFromTokenAsync();
            if (supplierId == 0)
                return Unauthorized("Invalid supplier");

            var result = await _shippingService.GetSupplierShipmentsAsync(supplierId, status, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shipments");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Supplier gets single shipment detail
    /// </summary>
    [HttpGet("supplier/shipments/{shipmentId}")]
    [Authorize(Roles = "supplier")]
    public async Task<ActionResult<SupplierShipmentResponseDto>> GetSupplierShipmentDetail(Guid shipmentId)
    {
        try
        {
            var supplierId = await GetSupplierIdFromTokenAsync();
            if (supplierId == 0)
                return Unauthorized("Invalid supplier");

            var result = await _shippingService.GetSupplierShipmentDetailAsync(supplierId, shipmentId);
            if (result == null)
                return NotFound();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shipment detail");
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    #region Staff Inbound Endpoints

    /// <summary>
    /// Staff gets inbound summary (shipments from suppliers)
    /// </summary>
    [HttpGet("staff/inbound/summary")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<StaffInboundSummaryDto>> GetStaffInboundSummary([FromQuery] Guid? warehouseId = null)
    {
        try
        {
            var result = await _shippingService.GetStaffInboundSummaryAsync(warehouseId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting inbound summary");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Staff marks shipment as arrived at warehouse
    /// </summary>
    [HttpPost("staff/inbound/{shipmentId}/arrived")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<SupplierShipmentResponseDto>> MarkShipmentArrived(Guid shipmentId)
    {
        try
        {
            var staffId = GetUserIdFromToken();
            var result = await _shippingService.MarkShipmentArrivedAsync(shipmentId, staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking shipment arrived");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Staff receives and inspects shipment
    /// </summary>
    [HttpPost("staff/inbound/receive")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<SupplierShipmentResponseDto>> ReceiveShipment([FromBody] StaffReceiveShipmentDto dto)
    {
        try
        {
            var staffId = GetUserIdFromToken();
            var result = await _shippingService.ReceiveShipmentAsync(dto, staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error receiving shipment");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Staff stores items to inventory
    /// </summary>
    [HttpPost("staff/inbound/{shipmentId}/store")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult> StoreToInventory(Guid shipmentId)
    {
        try
        {
            var staffId = GetUserIdFromToken();
            var result = await _shippingService.StoreItemsToInventoryAsync(shipmentId, staffId);
            return Ok(new { success = result, message = "Đã lưu hàng vào kho" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing items to inventory");
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    #region Staff Outbound Endpoints

    /// <summary>
    /// Staff gets outbound summary (orders to users)
    /// </summary>
    [HttpGet("staff/outbound/summary")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<StaffOutboundSummaryDto>> GetStaffOutboundSummary([FromQuery] Guid? warehouseId = null)
    {
        try
        {
            var result = await _shippingService.GetStaffOutboundSummaryAsync(warehouseId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting outbound summary");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Staff gets pending orders for fulfillment
    /// </summary>
    [HttpGet("staff/outbound/orders")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<List<StaffOutboundOrderDto>>> GetPendingOrders(
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _shippingService.GetPendingOrdersAsync(warehouseId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending orders");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Staff gets single order detail
    /// </summary>
    [HttpGet("staff/outbound/orders/{orderId}")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<StaffOutboundOrderDto>> GetOrderDetail(Guid orderId)
    {
        try
        {
            var result = await _shippingService.GetOutboundOrderDetailAsync(orderId);
            if (result == null)
                return NotFound();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order detail");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Staff picks items from inventory for order
    /// </summary>
    [HttpPost("staff/outbound/pick")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<StaffOutboundOrderDto>> PickOrderItems([FromBody] StaffPickItemsDto dto)
    {
        try
        {
            var staffId = GetUserIdFromToken();
            var result = await _shippingService.PickOrderItemsAsync(dto, staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error picking order items");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Staff updates order shipping status
    /// </summary>
    [HttpPut("staff/outbound/orders/{orderId}/status")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<StaffOutboundOrderDto>> UpdateOrderShippingStatus(
        Guid orderId, 
        [FromBody] StaffUpdateOrderShippingDto dto)
    {
        try
        {
            dto.OrderId = orderId;
            var staffId = GetUserIdFromToken();
            var result = await _shippingService.UpdateOrderShippingStatusAsync(dto, staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order shipping status");
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    #region Staff Dashboard

    /// <summary>
    /// Staff gets combined shipping dashboard
    /// </summary>
    [HttpGet("staff/dashboard")]
    [Authorize(Roles = "staff,admin")]
    public async Task<ActionResult<StaffShippingDashboardDto>> GetStaffDashboard([FromQuery] Guid? warehouseId = null)
    {
        try
        {
            var result = await _shippingService.GetStaffShippingDashboardAsync(warehouseId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staff dashboard");
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    #region User Endpoints

    /// <summary>
    /// User gets tracking info for their order
    /// </summary>
    [HttpGet("user/orders/{orderId}/tracking")]
    [Authorize]
    public async Task<ActionResult<UserOrderTrackingDto>> GetOrderTracking(Guid orderId)
    {
        try
        {
            var userId = GetUserGuidFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            var result = await _shippingService.GetUserOrderTrackingAsync(userId, orderId);
            if (result == null)
                return NotFound();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order tracking");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// User gets all their orders with tracking info
    /// </summary>
    [HttpGet("user/orders")]
    [Authorize]
    public async Task<ActionResult<List<UserOrderTrackingDto>>> GetUserOrders(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetUserGuidFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            var result = await _shippingService.GetUserOrdersTrackingAsync(userId, status, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user orders");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// User confirms delivery received
    /// </summary>
    [HttpPost("user/orders/{orderId}/confirm-delivery")]
    [Authorize]
    public async Task<ActionResult<UserOrderTrackingDto>> ConfirmDelivery(
        Guid orderId, 
        [FromBody] UserConfirmDeliveryDto dto)
    {
        try
        {
            var userId = GetUserGuidFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            dto.OrderId = orderId;
            var result = await _shippingService.UserConfirmDeliveryAsync(dto, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming delivery");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// User requests return
    /// </summary>
    [HttpPost("user/orders/{orderId}/request-return")]
    [Authorize]
    public async Task<ActionResult<UserOrderTrackingDto>> RequestReturn(
        Guid orderId, 
        [FromBody] UserRequestReturnDto dto)
    {
        try
        {
            var userId = GetUserGuidFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            dto.OrderId = orderId;
            var result = await _shippingService.UserRequestReturnAsync(dto, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting return");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// User cancels order
    /// </summary>
    [HttpPost("user/orders/{orderId}/cancel")]
    [Authorize]
    public async Task<ActionResult<UserOrderTrackingDto>> CancelOrder(
        Guid orderId, 
        [FromBody] CancelOrderRequest request)
    {
        try
        {
            var userId = GetUserGuidFromToken();
            if (userId == Guid.Empty)
                return Unauthorized();

            var result = await _shippingService.UserCancelOrderAsync(orderId, userId, request.Reason);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling order");
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    #region Helper Methods

    private async Task<int> GetSupplierIdFromTokenAsync()
    {
        var userGuid = GetUserGuidFromToken();
        if (userGuid == Guid.Empty) return 0;

        var supplierId = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.UserId == userGuid)
            .Select(s => s.Id)
            .FirstOrDefaultAsync();

        return supplierId;
    }

    private string GetUserIdFromToken()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
    }

    private Guid GetUserGuidFromToken()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdStr, out var guid) ? guid : Guid.Empty;
    }

    #endregion
}

public class CancelOrderRequest
{
    public string Reason { get; set; } = string.Empty;
}

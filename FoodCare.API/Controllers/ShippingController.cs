using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Shipping;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/shipping")]
public class ShippingController : ControllerBase
{
    private readonly IShippingFlowService _shippingService;
    private readonly ILogger<ShippingController> _logger;

    public ShippingController(IShippingFlowService shippingService, ILogger<ShippingController> logger)
    {
        _shippingService = shippingService;
        _logger = logger;
    }

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

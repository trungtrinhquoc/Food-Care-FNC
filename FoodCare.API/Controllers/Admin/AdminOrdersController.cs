using FoodCare.API.Models.DTOs.Admin.Orders;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IAdminOrderService _orderService;
    private readonly ILogger<AdminOrdersController> _logger;

    public AdminOrdersController(
        IAdminOrderService orderService,
        ILogger<AdminOrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetOrders([FromQuery] AdminOrderFilterDto filter)
    {
        try
        {
            var result = await _orderService.GetOrdersAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders");
            return StatusCode(500, new { message = "An error occurred while retrieving orders" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminOrderDetailDto>> GetOrderDetail(Guid id)
    {
        try
        {
            var order = await _orderService.GetOrderDetailAsync(id);
            if (order == null)
            {
                return NotFound(new { message = $"Order with ID {id} not found" });
            }

            return Ok(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order {OrderId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the order" });
        }
    }

    [HttpGet("recent")]
    public async Task<ActionResult<List<AdminOrderDto>>> GetRecentOrders([FromQuery] int count = 10)
    {
        try
        {
            var orders = await _orderService.GetRecentOrdersAsync(count);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent orders");
            return StatusCode(500, new { message = "An error occurred while retrieving recent orders" });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusDto dto)
    {
        try
        {
            var result = await _orderService.UpdateOrderStatusAsync(id, dto);
            if (!result)
            {
                return NotFound(new { message = $"Order with ID {id} not found" });
            }

            return Ok(new { message = "Order status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order status for {OrderId}", id);
            return StatusCode(500, new { message = "An error occurred while updating order status" });
        }
    }
}

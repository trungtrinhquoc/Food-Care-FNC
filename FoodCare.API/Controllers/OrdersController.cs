using System.Security.Claims;
using FoodCare.API.Models.DTOs.Orders;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(
            IOrderService orderService,
            ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid token");
            }
            return userId;
        }

        [HttpPost]
        public async Task<ActionResult<OrdersDto>> CreateOrder(CreateOrderDto dto)
        {
            try
            {
                var order = await _orderService.CreateOrderAsync(dto);
                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, new { message = "An error occurred while creating order" });
            }
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<ActionResult<OrdersDto>> GetOrder(Guid id)
        {
            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null)
                return NotFound();

            return Ok(order);
        }

        [Authorize]
        [HttpGet("my-orders")]
        public async Task<ActionResult<List<OrdersDto>>> GetMyOrders()
        {
            try
            {
                var userId = GetUserId();
                var orders = await _orderService.GetOrdersByUserIdAsync(userId);
                return Ok(orders);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user orders");
                return StatusCode(500, new { message = "An error occurred while getting orders" });
            }
        }
    }
}

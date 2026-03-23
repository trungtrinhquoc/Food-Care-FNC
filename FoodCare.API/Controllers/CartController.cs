using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Cart;
using FoodCare.API.Services.Interfaces;
using System.Security.Claims;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly ILogger<CartController> _logger;

    public CartController(ICartService cartService, ILogger<CartController> logger)
    {
        _cartService = cartService;
        _logger = logger;
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        try
        {
            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized(new { message = "Không xác thực được người dùng" });

            var cart = await _cartService.GetCartAsync(userId.Value);
            return Ok(cart);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy giỏ hàng" });
        }
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartItemDto>> AddToCart([FromBody] AddToCartDto dto)
    {
        try
        {
            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized(new { message = "Không xác thực được người dùng" });

            var item = await _cartService.AddToCartAsync(userId.Value, dto);
            return Ok(item);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.StartsWith("MART_CONFLICT::"))
            {
                var parts = ex.Message.Split("::");
                var currentMartId = parts.Length > 1 && int.TryParse(parts[1], out var parsedCurrent) ? parsedCurrent : (int?)null;
                var incomingMartId = parts.Length > 2 && int.TryParse(parts[2], out var parsedIncoming) ? parsedIncoming : (int?)null;

                return Conflict(new
                {
                    code = "MART_CONFLICT",
                    message = "Giỏ hàng hiện tại đang thuộc mart khác.",
                    currentMartId,
                    incomingMartId,
                    options = new[] { "keep_existing", "switch_to_new_mart", "allow_multi_mart" }
                });
            }

            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi thêm vào giỏ hàng" });
        }
    }

    [HttpPut("items/{id}")]
    public async Task<ActionResult<CartItemDto>> UpdateCartItem(Guid id, [FromBody] UpdateCartItemDto dto)
    {
        try
        {
            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized(new { message = "Không xác thực được người dùng" });

            var item = await _cartService.UpdateCartItemAsync(userId.Value, id, dto);
            if (item == null) return NotFound(new { message = "Không tìm thấy sản phẩm trong giỏ hàng" });

            return Ok(item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart item");
            return StatusCode(500, new { message = "Có lỗi xảy ra" });
        }
    }

    [HttpDelete("items/{id}")]
    public async Task<IActionResult> RemoveCartItem(Guid id)
    {
        try
        {
            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized(new { message = "Không xác thực được người dùng" });

            var success = await _cartService.RemoveCartItemAsync(userId.Value, id);
            if (!success) return NotFound(new { message = "Không tìm thấy sản phẩm trong giỏ hàng" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cart item");
            return StatusCode(500, new { message = "Có lỗi xảy ra" });
        }
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        try
        {
            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized(new { message = "Không xác thực được người dùng" });

            await _cartService.ClearCartAsync(userId.Value);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            return StatusCode(500, new { message = "Có lỗi xảy ra" });
        }
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<CartCheckoutResultDto>> Checkout()
    {
        try
        {
            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized(new { message = "Không xác thực được người dùng" });

            var result = await _cartService.CheckoutFromCartAsync(userId.Value);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during checkout");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi thanh toán" });
        }
    }
}

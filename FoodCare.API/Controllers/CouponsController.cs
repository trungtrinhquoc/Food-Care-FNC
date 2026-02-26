using FoodCare.API.Exceptions;
using FoodCare.API.Models.DTOs.Coupons;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodCare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponsController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        [Authorize]
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable([FromQuery] decimal orderValue = 0)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdStr, out var userId))
                    return Unauthorized();

                var coupons = await _couponService.GetAvailableCouponsAsync(orderValue, userId);
                return Ok(coupons);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("validate")]
        public async Task<IActionResult> Validate([FromBody] ValidateCouponRequest req)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdStr, out var userId))
                    return Unauthorized();

                var result = await _couponService.ValidateCouponAsync(req.Code, req.OrderValue, userId);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi xác thực mã giảm giá", inner = ex.Message });
            }
        }
    }

    public class ValidateCouponRequest
    {
        public string Code { get; set; } = null!;
        public decimal OrderValue { get; set; }
    }
}

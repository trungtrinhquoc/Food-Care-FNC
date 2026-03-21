using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Products;
using FoodCare.API.Services.Interfaces;
using System.Security.Claims;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CrossMartSearchController : ControllerBase
{
    private readonly ICrossMartSearchService _searchService;
    private readonly ILogger<CrossMartSearchController> _logger;

    public CrossMartSearchController(ICrossMartSearchService searchService, ILogger<CrossMartSearchController> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<CrossMartProductResultDto>>> SearchAcrossMarts([FromQuery] CrossMartSearchDto dto)
    {
        try
        {
            var userId = GetUserId();
            var results = await _searchService.SearchAcrossMartsAsync(dto, userId);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching across marts");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi tìm kiếm" });
        }
    }

    [HttpGet("products/{productId}/variants")]
    public async Task<ActionResult<List<ProductVariantDto>>> GetProductVariants(Guid productId, [FromQuery] int martId)
    {
        try
        {
            var variants = await _searchService.GetProductVariantsAsync(productId, martId);
            return Ok(variants);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product variants");
            return StatusCode(500, new { message = "Có lỗi xảy ra" });
        }
    }

    [HttpGet("products/{productId}/alternatives")]
    public async Task<ActionResult<List<AlternativeMartDto>>> GetAlternativeMarts(
        Guid productId,
        [FromQuery] decimal latitude,
        [FromQuery] decimal longitude)
    {
        try
        {
            var alternatives = await _searchService.GetAlternativeMartsAsync(productId, latitude, longitude);
            return Ok(alternatives);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting alternative marts");
            return StatusCode(500, new { message = "Có lỗi xảy ra" });
        }
    }

    [HttpPost("products/{productId}/notify")]
    [Authorize]
    public async Task<IActionResult> SubscribeToAvailability(Guid productId, [FromQuery] int martId)
    {
        try
        {
            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized(new { message = "Không xác thực được người dùng" });

            await _searchService.SubscribeToAvailabilityAsync(userId.Value, productId, martId);
            return Ok(new { message = "Đã đăng ký nhận thông báo khi có hàng" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error subscribing to availability");
            return StatusCode(500, new { message = "Có lỗi xảy ra" });
        }
    }
}

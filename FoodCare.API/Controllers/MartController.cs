using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Mart;
using FoodCare.API.Services.Interfaces;
using System.Security.Claims;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MartController : ControllerBase
{
    private readonly IMartService _martService;
    private readonly ILogger<MartController> _logger;

    public MartController(IMartService martService, ILogger<MartController> logger)
    {
        _martService = martService;
        _logger = logger;
    }

    /// <summary>
    /// Get nearby marts within specified radius of user's location.
    /// </summary>
    [HttpGet("nearby")]
    public async Task<ActionResult<List<NearbyMartDto>>> GetNearbyMarts([FromQuery] NearbyMartQueryDto query)
    {
        try
        {
            if (query.RadiusKm <= 0 || query.RadiusKm > 50)
                return BadRequest(new { message = "Bán kính tìm kiếm phải từ 0 đến 50 km" });

            var marts = await _martService.GetNearbyMartsAsync(query);
            return Ok(new { marts, count = marts.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby marts");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi tìm kiếm mart" });
        }
    }

    /// <summary>
    /// Get detailed information about a specific mart.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<MartDetailDto>> GetMartDetail(int id)
    {
        try
        {
            var mart = await _martService.GetMartDetailAsync(id);
            if (mart == null)
                return NotFound(new { message = "Không tìm thấy mart" });

            return Ok(mart);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting mart detail {MartId}", id);
            return StatusCode(500, new { message = "Có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Get products available at a specific mart.
    /// </summary>
    [HttpGet("{id}/products")]
    public async Task<ActionResult<object>> GetMartProducts(int id, [FromQuery] MartProductFilterDto filter)
    {
        try
        {
            var (products, totalCount) = await _martService.GetMartProductsAsync(id, filter);
            return Ok(new
            {
                products,
                totalCount,
                page = filter.Page,
                pageSize = filter.PageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products for mart {MartId}", id);
            return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy sản phẩm" });
        }
    }

    /// <summary>
    /// Set the user's selected mart.
    /// </summary>
    [HttpPut("select")]
    [Authorize]
    public async Task<IActionResult> SelectMart([FromBody] SelectMartDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Không xác thực được người dùng" });

            var success = await _martService.SetSelectedMartAsync(userId, dto.MartId);
            if (!success)
                return BadRequest(new { message = "Mart không tồn tại hoặc đã ngưng hoạt động" });

            return Ok(new { message = "Đã chọn mart thành công", martId = dto.MartId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error selecting mart");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi chọn mart" });
        }
    }

    /// <summary>
    /// Get the user's currently selected mart.
    /// </summary>
    [HttpGet("selected")]
    [Authorize]
    public async Task<IActionResult> GetSelectedMart()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Không xác thực được người dùng" });

            var martId = await _martService.GetSelectedMartIdAsync(userId);
            if (!martId.HasValue)
                return Ok(new { martId = (int?)null, mart = (MartDetailDto?)null });

            var mart = await _martService.GetMartDetailAsync(martId.Value);
            return Ok(new { martId, mart });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting selected mart");
            return StatusCode(500, new { message = "Có lỗi xảy ra" });
        }
    }
}

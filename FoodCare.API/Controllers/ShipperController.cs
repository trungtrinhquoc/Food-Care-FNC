using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FoodCare.API.Models.DTOs.Shipper;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/shipper")]
[Authorize]
public class ShipperController : ControllerBase
{
    private readonly IShipperService _shipperService;
    private readonly FoodCareDbContext _context;

    public ShipperController(IShipperService shipperService, FoodCareDbContext context)
    {
        _shipperService = shipperService;
        _context = context;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst("userId");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    private async Task<bool> IsShipperAsync(Guid userId)
    {
        var staff = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive && s.StaffPositionEnum == StaffPosition.Shipper);
        var user = await _context.Users.FindAsync(userId);
        return staff != null && user?.Role == UserRole.staff;
    }

    /// <summary>Lấy thông tin và thống kê hôm nay của shipper</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyInfo()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var info = await _shipperService.GetShipperInfoAsync(userId.Value);
        if (info == null) return Forbid();

        return Ok(info);
    }

    /// <summary>Lấy thống kê shipper</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (!await IsShipperAsync(userId.Value)) return Forbid();

        var stats = await _shipperService.GetShipperStatsAsync(userId.Value);
        return Ok(stats);
    }

    /// <summary>Lấy danh sách đơn hàng (có thể filter theo status: confirmed, shipping, delivered)</summary>
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (!await IsShipperAsync(userId.Value)) return Forbid();

        var orders = await _shipperService.GetOrdersForShipperAsync(userId.Value, status);
        return Ok(orders);
    }

    /// <summary>Shipper nhận đơn hàng (confirmed → shipping)</summary>
    [HttpPost("orders/{orderId}/accept")]
    public async Task<IActionResult> AcceptOrder(Guid orderId)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (!await IsShipperAsync(userId.Value)) return Forbid();

        var success = await _shipperService.AcceptOrderAsync(userId.Value, orderId);
        if (!success)
            return BadRequest(new { message = "Không thể nhận đơn hàng. Đơn hàng có thể đã được nhận hoặc không thuộc kho của bạn." });

        return Ok(new { message = "Đã nhận đơn hàng thành công! Chúc bạn giao hàng thuận lợi." });
    }

    /// <summary>Shipper cập nhật trạng thái đơn (shipping → delivered/cancelled)</summary>
    [HttpPatch("orders/{orderId}/status")]
    public async Task<IActionResult> UpdateOrderStatus(Guid orderId, [FromBody] ShipperUpdateOrderStatusDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (!await IsShipperAsync(userId.Value)) return Forbid();

        var success = await _shipperService.UpdateOrderStatusAsync(userId.Value, orderId, dto);
        if (!success)
            return BadRequest(new { message = "Không thể cập nhật trạng thái. Đơn hàng không hợp lệ hoặc không phải của bạn." });

        var message = dto.NewStatus.ToLower() == "delivered"
            ? "🎉 Đã xác nhận giao hàng thành công!"
            : "Đã cập nhật trạng thái đơn hàng.";

        return Ok(new { message });
    }
}

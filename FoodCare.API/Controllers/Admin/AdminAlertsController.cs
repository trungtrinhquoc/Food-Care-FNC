using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/alerts")]
[Authorize(Roles = "admin")]
public class AdminAlertsController : ControllerBase
{
    private readonly IAdminAlertService _alertService;
    private readonly ILogger<AdminAlertsController> _logger;

    public AdminAlertsController(
        IAdminAlertService alertService,
        ILogger<AdminAlertsController> logger)
    {
        _alertService = alertService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetAlerts([FromQuery] AdminAlertFilterDto filter)
    {
        try
        {
            var result = await _alertService.GetAlertsAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alerts");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách cảnh báo" });
        }
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult> GetUnreadCount()
    {
        try
        {
            var count = await _alertService.GetUnreadCountAsync();
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving unread alert count");
            return StatusCode(500, new { message = "Lỗi khi lấy số cảnh báo chưa đọc" });
        }
    }

    [HttpPatch("{id}/read")]
    public async Task<ActionResult> MarkAsRead(Guid id)
    {
        try
        {
            var success = await _alertService.MarkAsReadAsync(id);
            if (!success)
                return NotFound(new { message = "Không tìm thấy cảnh báo" });
            return Ok(new { message = "Đã đánh dấu đã đọc" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking alert {AlertId} as read", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật trạng thái cảnh báo" });
        }
    }

    [HttpPost("mark-all-read")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        try
        {
            var count = await _alertService.MarkAllAsReadAsync();
            return Ok(new { message = $"Đã đánh dấu {count} cảnh báo đã đọc", count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all alerts as read");
            return StatusCode(500, new { message = "Lỗi khi cập nhật trạng thái cảnh báo" });
        }
    }
}

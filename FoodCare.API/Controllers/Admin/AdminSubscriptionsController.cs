using FoodCare.API.Models.DTOs.Admin.Subscriptions;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/subscriptions")]
[Authorize(Roles = "admin")]
public class AdminSubscriptionsController : ControllerBase
{
    private readonly IAdminSubscriptionService _adminSubscriptionService;
    private readonly ILogger<AdminSubscriptionsController> _logger;

    public AdminSubscriptionsController(
        IAdminSubscriptionService adminSubscriptionService,
        ILogger<AdminSubscriptionsController> logger)
    {
        _adminSubscriptionService = adminSubscriptionService;
        _logger = logger;
    }

    /// <summary>
    /// Get all subscriptions with customer details, supports filtering and pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllSubscriptions([FromQuery] SubscriptionFilters filters)
    {
        try
        {
            var result = await _adminSubscriptionService.GetAllSubscriptionsAsync(filters);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all subscriptions");
            return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách subscriptions" });
        }
    }

    /// <summary>
    /// Get detailed information for a single subscription
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetSubscriptionDetail(Guid id)
    {
        try
        {
            var result = await _adminSubscriptionService.GetSubscriptionDetailAsync(id);
            
            if (result == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy subscription" });
            }

            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subscription detail for {SubscriptionId}", id);
            return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin subscription" });
        }
    }

    /// <summary>
    /// Manually send reminder emails to specified subscriptions
    /// </summary>
    [HttpPost("send-reminders")]
    public async Task<IActionResult> SendManualReminders([FromBody] SendReminderRequest request)
    {
        if (request.SubscriptionIds == null || !request.SubscriptionIds.Any())
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn ít nhất một subscription" });
        }

        try
        {
            var result = await _adminSubscriptionService.SendManualRemindersAsync(request);
            return Ok(new { success = result.Success, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending manual reminders");
            return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi gửi email" });
        }
    }
}

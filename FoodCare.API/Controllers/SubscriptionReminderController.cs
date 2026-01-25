using FoodCare.API.Models.DTOs.Subscriptions;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/subscription-reminders")]
public class SubscriptionReminderController : ControllerBase
{
    private readonly ISubscriptionReminderService _reminderService;
    private readonly ILogger<SubscriptionReminderController> _logger;

    public SubscriptionReminderController(
        ISubscriptionReminderService reminderService,
        ILogger<SubscriptionReminderController> logger)
    {
        _reminderService = reminderService;
        _logger = logger;
    }

    /// <summary>
    /// [ADMIN ONLY] Manually trigger sending reminders for pending subscriptions
    /// </summary>
    [HttpPost("send")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> SendReminders()
    {
        try
        {
            var sentCount = await _reminderService.SendPendingRemindersAsync();
            return Ok(new
            {
                success = true,
                message = $"Đã gửi {sentCount} email nhắc nhở thành công",
                sentCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending subscription reminders");
            return StatusCode(500, new
            {
                success = false,
                message = "Có lỗi xảy ra khi gửi email nhắc nhở"
            });
        }
    }

    /// <summary>
    /// [PUBLIC] Get confirmation details from token (called when user clicks email link)
    /// </summary>
    [HttpGet("confirm")]
    [AllowAnonymous]
    public async Task<IActionResult> GetConfirmationDetails([FromQuery] string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest(new { success = false, message = "Token không hợp lệ" });
        }

        try
        {
            var details = await _reminderService.GetConfirmationDetailsAsync(token);

            if (details == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy thông tin xác nhận" });
            }

            return Ok(new { success = true, data = details });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting confirmation details for token {Token}", token);
            return StatusCode(500, new
            {
                success = false,
                message = "Có lỗi xảy ra khi lấy thông tin"
            });
        }
    }

    /// <summary>
    /// [PUBLIC] Process customer confirmation (continue/pause/cancel)
    /// </summary>
    [HttpPost("confirm")]
    [AllowAnonymous]
    public async Task<IActionResult> ProcessConfirmation([FromBody] ProcessConfirmationRequest request)
    {
        if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.Action))
        {
            return BadRequest(new { success = false, message = "Thông tin không hợp lệ" });
        }

        // Validate action
        var validActions = new[] { "continue", "pause", "cancel" };
        if (!validActions.Contains(request.Action.ToLower()))
        {
            return BadRequest(new { success = false, message = "Hành động không hợp lệ" });
        }

        // Validate PauseUntil for pause action
        if (request.Action.ToLower() == "pause" && !request.PauseUntil.HasValue)
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn ngày tạm dừng" });
        }

        try
        {
            var success = await _reminderService.ProcessConfirmationAsync(request);

            if (!success)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Không thể xử lý yêu cầu. Token có thể đã hết hạn hoặc đã được sử dụng."
                });
            }

            var actionMessage = request.Action.ToLower() switch
            {
                "continue" => "Đơn hàng định kỳ sẽ tiếp tục như bình thường",
                "pause" => $"Đơn hàng đã được tạm dừng đến {request.PauseUntil:dd/MM/yyyy}",
                "cancel" => "Đơn hàng định kỳ đã được hủy",
                _ => "Đã xử lý yêu cầu thành công"
            };

            return Ok(new
            {
                success = true,
                message = actionMessage,
                action = request.Action.ToLower()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing confirmation for token {Token}", request.Token);
            return StatusCode(500, new
            {
                success = false,
                message = "Có lỗi xảy ra khi xử lý yêu cầu"
            });
        }
    }

    /// <summary>
    /// [ADMIN ONLY] Get statistics for admin dashboard
    /// </summary>
    [HttpGet("statistics")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            var stats = await _reminderService.GetStatisticsAsync();
            return Ok(new { success = true, data = stats });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subscription reminder statistics");
            return StatusCode(500, new
            {
                success = false,
                message = "Có lỗi xảy ra khi lấy thống kê"
            });
        }
    }
}

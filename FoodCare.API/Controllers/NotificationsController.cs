using FoodCare.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly FoodCareDbContext _db;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(FoodCareDbContext db, ILogger<NotificationsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var userId))
            throw new UnauthorizedAccessException("Invalid token");
        return userId;
    }

    /// <summary>
    /// Lấy danh sách thông báo của user (phân trang)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetUserId();

            var query = _db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt);

            var total = await query.CountAsync();
            var unreadCount = await _db.Notifications
                .Where(n => n.UserId == userId && n.IsRead == false)
                .CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Message,
                    n.Type,
                    n.IsRead,
                    n.LinkUrl,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                total,
                unreadCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Lấy số thông báo chưa đọc
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult> GetUnreadCount()
    {
        try
        {
            var userId = GetUserId();
            var count = await _db.Notifications
                .Where(n => n.UserId == userId && n.IsRead == false)
                .CountAsync();
            return Ok(new { count });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Đánh dấu một thông báo là đã đọc
    /// </summary>
    [HttpPatch("{id}/read")]
    public async Task<ActionResult> MarkAsRead(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var notification = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFound(new { message = "Notification not found" });

            notification.IsRead = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Marked as read" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Đánh dấu tất cả thông báo là đã đọc
    /// </summary>
    [HttpPatch("mark-all-read")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        try
        {
            var userId = GetUserId();
            var unread = await _db.Notifications
                .Where(n => n.UserId == userId && n.IsRead == false)
                .ToListAsync();

            foreach (var n in unread)
                n.IsRead = true;

            await _db.SaveChangesAsync();

            return Ok(new { message = $"Marked {unread.Count} notifications as read" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Xóa một thông báo
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteNotification(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var notification = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFound(new { message = "Notification not found" });

            _db.Notifications.Remove(notification);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Deleted" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
